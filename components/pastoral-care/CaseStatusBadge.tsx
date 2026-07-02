import { Badge } from '@/components/ui/badge'

interface CaseStatusBadgeProps {
  status: 'open' | 'resolved'
  escalated: boolean
}

export function CaseStatusBadge({ status, escalated }: CaseStatusBadgeProps) {
  if (status === 'resolved') {
    return <Badge variant="success">Resolvido</Badge>
  }
  if (escalated) {
    return <Badge variant="danger">Escalado à coordenação</Badge>
  }
  return <Badge variant="warning">Aberto</Badge>
}
