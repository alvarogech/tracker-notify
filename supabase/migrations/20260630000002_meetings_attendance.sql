-- Fase 3: reuniões e frequência

-- ============================================================
-- meetings
-- ============================================================
CREATE TABLE meetings (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id             uuid        NOT NULL REFERENCES groups(id),
  scheduled_at         timestamptz NOT NULL,
  status               text        NOT NULL DEFAULT 'scheduled'
                                   CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  notes                text,
  report_submitted_at  timestamptz,
  report_reopened_at   timestamptz,
  report_reopened_by   uuid        REFERENCES profiles(id),
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- attendance_records
-- ============================================================
CREATE TABLE attendance_records (
  id          uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id  uuid  NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  person_id   uuid  NOT NULL REFERENCES people(id),
  status      text  NOT NULL CHECK (status IN ('present', 'absent', 'excused', 'on_leave')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (meeting_id, person_id)
);

CREATE TRIGGER attendance_records_updated_at
  BEFORE UPDATE ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE meetings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Policies: meetings
-- ============================================================

CREATE POLICY "meetings_leader_read"
  ON meetings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = meetings.group_id
        AND groups.leader_id = auth.uid()
    )
  );

CREATE POLICY "meetings_leader_insert"
  ON meetings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = meetings.group_id
        AND groups.leader_id = auth.uid()
    )
  );

CREATE POLICY "meetings_leader_update"
  ON meetings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = meetings.group_id
        AND groups.leader_id = auth.uid()
    )
  );

CREATE POLICY "meetings_coordinator_read"
  ON meetings FOR SELECT
  USING (public.current_user_role() IN ('coordinator', 'admin'));

CREATE POLICY "meetings_coordinator_write"
  ON meetings FOR ALL
  USING (public.current_user_role() IN ('coordinator', 'admin'));

-- ============================================================
-- Policies: attendance_records
-- ============================================================

CREATE POLICY "attendance_leader_read"
  ON attendance_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      JOIN groups g ON g.id = m.group_id
      WHERE m.id = attendance_records.meeting_id
        AND g.leader_id = auth.uid()
    )
  );

-- Only allowed when report not yet submitted
CREATE POLICY "attendance_leader_insert"
  ON attendance_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meetings m
      JOIN groups g ON g.id = m.group_id
      WHERE m.id = attendance_records.meeting_id
        AND g.leader_id = auth.uid()
        AND m.report_submitted_at IS NULL
    )
  );

CREATE POLICY "attendance_leader_update"
  ON attendance_records FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM meetings m
      JOIN groups g ON g.id = m.group_id
      WHERE m.id = attendance_records.meeting_id
        AND g.leader_id = auth.uid()
        AND m.report_submitted_at IS NULL
    )
  );

CREATE POLICY "attendance_coordinator_read"
  ON attendance_records FOR SELECT
  USING (public.current_user_role() IN ('coordinator', 'admin'));

CREATE POLICY "attendance_coordinator_write"
  ON attendance_records FOR ALL
  USING (public.current_user_role() IN ('coordinator', 'admin'));
