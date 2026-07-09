// supabase/seed.sql insere auth.users com crypt(senha, gen_salt('bf')) direto via SQL.
// Isso funciona no Supabase Cloud, mas o Postgres local do `supabase start`
// (usado pelo CI, .github/workflows/tests.yml) às vezes não aceita esse hash
// na verificação do GoTrue — login retorna "E-mail ou senha incorretos"
// mesmo com a senha certa. Corrige redefinindo a senha de cada usuário
// semeado via API admin do GoTrue (que usa o hashing interno dele mesmo,
// garantido compatível), em vez de confiar no INSERT bruto em auth.users.
import { createClient } from '@supabase/supabase-js'

// `supabase status -o env >> "$GITHUB_ENV"` grava valores entre aspas
// literais (ex: API_URL="http://..."); GITHUB_ENV não remove aspas como o
// parser do dotenv faz para .env.local, então process.env preserva as aspas.
function stripQuotes(value) {
  return (value ?? '').replace(/^"(.*)"$/, '$1')
}

const url = stripQuotes(process.env.API_URL)
const serviceRoleKey = stripQuotes(process.env.SERVICE_ROLE_KEY)
const password = 'Huios@2026'

if (!url || !serviceRoleKey) {
  console.error('API_URL e SERVICE_ROLE_KEY são obrigatórios (exportados por `supabase status -o env`).')
  process.exit(1)
}

const admin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const SEED_USER_IDS = [
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000007',
]

for (const id of SEED_USER_IDS) {
  const { error } = await admin.auth.admin.updateUserById(id, { password })
  if (error) {
    console.error(`Falha ao redefinir senha de ${id}:`, error.message)
    process.exit(1)
  }
}

console.log(`Senhas redefinidas via API admin do GoTrue para ${SEED_USER_IDS.length} usuários semeados.`)
