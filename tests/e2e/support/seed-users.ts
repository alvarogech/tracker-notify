// Credenciais fictícias já documentadas em supabase/seed.sql — NUNCA dados reais.
// Senha padrão de todos os usuários semeados: Huios@2026
export const SEED_PASSWORD = 'Huios@2026'

export const SEED_USERS = {
  admin: {
    email: 'admin@huios.dev',
    password: SEED_PASSWORD,
    fullName: 'Admin HUIOS',
  },
  coordinator: {
    email: 'coord@huios.dev',
    password: SEED_PASSWORD,
    fullName: 'Coord. HUIOS',
  },
  leaderNorte: {
    email: 'lider.norte@huios.dev',
    password: SEED_PASSWORD,
    fullName: 'Lucas Ferreira',
    groupName: 'GR Norte',
  },
  leaderSul: {
    email: 'lider.sul@huios.dev',
    password: SEED_PASSWORD,
    fullName: 'Camila Souza',
    groupName: 'GR Sul',
  },
} as const
