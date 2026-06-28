# Regras de Negócio — Pastoreio HUIOS

Estas regras são imutáveis e não devem ser modificadas sem aprovação explícita do responsável pelo produto.

---

## 1. Ausências

### 1.1 Sequência de ausências

Uma sequência de ausências conta apenas:
- Reuniões **realizadas** (status: realizada)
- Relatórios **enviados**
- Pessoa **vinculada ao GR** na data da reunião
- Pessoa **elegível** para presença naquele período (não em afastamento temporário)

A sequência **ignora**:
- Reuniões canceladas
- Períodos anteriores ao vínculo
- Períodos de afastamento temporário
- Relatórios não enviados

### 1.2 Ausência justificada

- **Não conta** como presença
- **Não gera** caso de pastoreio
- **Interrompe** a sequência de ausências (não é tratada como consecutiva)
- Permanece visível no histórico

Exemplo:
- Semana 1: ausente → sequência = 1
- Semana 2: justificada → sequência reinicia = 0
- Semana 3: ausente → sequência = 1 (não 2)

### 1.3 Presença

- **Interrompe** a sequência de ausências
- **Não encerra** automaticamente um caso de pastoreio já criado
- O sistema **sugere** ao líder a resolução quando a pessoa retorna

### 1.4 Duas ausências consecutivas

Cria automaticamente um caso de pastoreio.

Condições verificadas antes de criar:
- A reunião anterior e a atual devem ser consecutivas (sem reunião realizada entre elas)
- Não deve existir caso aberto para a mesma sequência (idempotência)

### 1.5 Quatro ausências consecutivas

- Sinaliza o caso existente à coordenação
- Muda o status para `encaminhado_a_coordenacao`
- **Não cria** um segundo caso
- O líder permanece como parte do acompanhamento
- A pessoa não é removida automaticamente do GR

### 1.6 Visitante

- **Nunca** gera ausência
- **Nunca** entra no denominador de frequência
- A chamada não é obrigatória para visitantes (líder registra apenas presenças)

### 1.7 Pessoa em afastamento temporário

- **Não acumula** ausências durante o período
- **Não aciona** casos automáticos
- Permanece visível na lista de pessoas

### 1.8 Transferência e sequência

- O histórico integral é preservado após a transferência
- Para fins do gatilho automático, a nova sequência começa no novo GR após a data de transferência
- Evita sinalização por reuniões ocorridas antes da chegada ao novo GR

---

## 2. Visitantes

### 2.1 Cadastro inicial

- Nome completo ou preferido (obrigatório)
- Data da primeira visita (obrigatório — é a data da reunião)
- Telefone (não obrigatório, mas deve ser solicitado)

Antes de salvar:
- Se houver telefone: verificar cadastro existente com mesmo telefone
- Se não houver: alertar sobre nomes semelhantes (não impede cadastro)

### 2.2 Comportamento do visitante

- Não aparece na chamada obrigatória
- Não entra no denominador de frequência
- Não acumula ausências
- Presenças são registradas normalmente
- Histórico de visitas é preservado

### 2.3 Regra das três visitas

Após 3 visitas (consecutivas ou não) na relação ativa com o GR:
- O sistema **sugere** a vinculação
- A transição **nunca** é automática
- A sugestão reaparecer apenas após nova visita (não em toda tela)

**O líder pode:**
- Confirmar a vinculação → cria vínculo regular, encerra relação de visitante (histórico preservado)
- Adiar → sugestão reaparece após próxima visita
- Indicar que a pessoa não continuará → encerra relação, preserva histórico, pessoa pode retornar futuramente

---

## 3. Reuniões

### 3.1 Prazo do relatório

- 48 horas após o horário previsto da reunião
- Calculado no fuso `America/Sao_Paulo`

### 3.2 Reunião cancelada

- Não exige chamada
- Não gera ausência
- Não afeta sequências de ausência
- Não entra no cálculo de pontualidade como relatório pendente

### 3.3 Chamada obrigatória

Para cada reunião realizada, o líder deve marcar:
- Presente
- Ausente
- Ausência justificada

Para **todos** os participantes vinculados e elegíveis naquela data.

O relatório não pode ser enviado enquanto existirem participantes obrigatórios sem marcação.

### 3.4 Quem aparece na chamada

- Participantes vinculados ao GR que iniciaram o vínculo **antes ou na data** da reunião
- Participantes **não** em afastamento temporário válido na data

**Não aparecem:**
- Visitantes (adicionados separadamente como presentes)
- Pessoas que iniciaram o vínculo após a data da reunião
- Pessoas em afastamento temporário durante o período

### 3.5 Reabertura

A reabertura de relatório é exclusiva da coordenação. Deve registrar:
- Quem reabriu
- Quando
- Motivo
- Todas as alterações posteriores

---

## 4. Discipulado

- Uma pessoa só pode ter **1 discipulador ativo** por vez
- O líder pode definir ou alterar o discipulador das pessoas do próprio GR
- A coordenação pode alterar qualquer vínculo dentro da HUIOS
- Substituição de discipulador encerra o vínculo anterior; histórico é preservado
- **Não registrar:** conteúdo de conversas, confissões, aconselhamento, avaliações subjetivas

---

## 5. Formação (Cultura Emaús e Escola Makarios)

### 5.1 Natureza declarativa

O dado é declarativo: o líder pergunta à pessoa e registra. Não há validação automática ou integração com outros sistemas no MVP.

### 5.2 Aptidão para servir

Condição: Cultura Emaús com status `concluído`.

O sistema calcula automaticamente:
- **Apto para servir** — Cultura concluído
- **Ainda não apto** — Cultura não concluído
- **Informação insuficiente** — status desconhecido

### 5.3 Aptidão formativa para liderar

Condição: Cultura Emaús + Makarios 1 + Makarios 2 + Makarios 3, todos concluídos.

O sistema calcula e exibe:
- Nenhum volume concluído
- Um de três
- Dois de três
- Três de três
- Apto formativamente para liderar
- Ainda não apto
- Informação insuficiente

**Nunca usar:** "líder aprovado", "pronto para liderar", "deve ser promovido".

**Usar sempre:** "Atende aos requisitos formativos cadastrados para liderança."

---

## 6. Áreas de Serviço

### 6.1 Regra para ativar vínculo de serviço

- Requer Cultura Emaús concluído
- O sistema impede a ativação quando o requisito não está atendido
- Não apaga vínculos antigos automaticamente
- Sinaliza cadastros existentes inconsistentes

### 6.2 Regra para função de liderança

- Requer Cultura Emaús + Makarios 1 + 2 + 3 concluídos
- O sistema verifica o requisito formativo, mas não nomeia líderes

### 6.3 Uma pessoa pode servir em múltiplas áreas simultaneamente

---

## 7. Transferências

- Executada apenas pela coordenação
- Deve ser atômica (tudo ou nada)
- Registrada em auditoria
- No momento da transferência, a coordenação decide sobre o discipulador:
  - Continua como responsável
  - Vínculo encerrado
  - Novo discipulador definido
  - Decisão posterior

- Transferência não altera automaticamente vínculos de serviço em áreas

---

## 8. Casos de Pastoreio

### 8.1 Criação

- **Automático:** por 2 ausências consecutivas
- **Manual:** pelo líder ou coordenação

### 8.2 Status

`pendente` → `em_andamento` → `resolvido` | `encaminhado_a_coordenacao`

### 8.3 Resolução

Um caso só pode ser resolvido quando:
1. Existe ao menos 1 ação de pastoreio registrada
2. O líder/coordenação escolhe um resultado
3. A resolução é confirmada

Presença posterior não resolve automaticamente.

### 8.4 Idempotência

A mesma sequência de ausências não pode gerar casos duplicados. Antes de criar, verificar se há caso aberto relacionado.

---

## 9. Afastamento Temporário

- Pessoa permanece vinculada ao GR
- Não aparece como presença esperada
- Não acumula ausências
- Não aciona casos automáticos
- Após a data prevista: o sistema solicita revisão do status

**Motivos permitidos (categóricos):** viagem, trabalho, estudos, mudança temporária de rotina, decisão pastoral, outro.

**Não armazenar:** detalhes médicos, familiares ou íntimos.

---

## 10. Notas de Ações de Pastoreio

- Limite de 300 caracteres
- Objetivo e breve
- Não incluir confissões, detalhes íntimos, diagnósticos, aconselhamento

Orientação exibida próxima ao campo:
> "Registre apenas uma informação breve e objetiva. Não inclua confissões, detalhes íntimos ou conteúdo de aconselhamento."
