# Fluxos de Usuário — Pastoreio HUIOS

## Fluxo 1 — Registrar Reunião Semanal (Líder)

**Meta:** Concluir em ~2 a 3 minutos.

```
1. Líder abre o app (celular)
2. Dashboard exibe: "Reunião pendente — [dia, horário]"
3. Toca em "Registrar reunião"
4. Tela de chamada exibe lista de participantes elegíveis
5. Para cada participante: marcar presente / ausente / justificada
6. Progresso visível: "X de Y marcados"
7. Para adicionar visitante: botão "+" → formulário rápido (nome + telefone)
   → sistema verifica duplicata por telefone
   → confirmar ou selecionar pessoa existente
8. Ao completar chamada: botão "Revisar"
9. Tela de revisão exibe:
   - Resumo de presença
   - Alertas (ausências, casos, visitantes com 3 visitas)
10. Confirmar envio
11. Confirmação de sucesso
    - Ações rápidas: "Ver caso criado", "Decidir sobre visitante"
```

---

## Fluxo 2 — Conversão de Visitante (Líder)

```
1. Dashboard ou confirmação de reunião exibe: "[Nome] visitou 3 vezes. Vincular ao GR?"
2. Toca em "Ver sugestão"
3. Tela mostra: nome, data das 3 visitas, opções
4. Opções:
   a) "Confirmar vínculo" → pessoa vira participante regular
      → histórico de visitas preservado
      → vínculo de visitante encerrado
   b) "Adiar" → sugestão reaparece após próxima visita
   c) "Pessoa não continuará" → relação encerrada, histórico preservado
```

---

## Fluxo 3 — Caso de Pastoreio Criado Automaticamente (Líder)

```
1. Líder envia relatório
2. Sistema detecta: [Nome] completou 2ª ausência consecutiva
3. Caso criado automaticamente
4. Notificação interna: "Caso criado para [Nome]"
5. Líder abre o caso
6. Vê: pessoa, sequência de ausências, data de abertura
7. Registra ação: tipo (mensagem, ligação...) + data + nota breve
8. Ao registrar ação: status muda para "em andamento"
9. Quando situação resolvida:
   - Líder toca em "Resolver"
   - Seleciona resultado (e.g., "Ausência esclarecida")
   - Confirma
   - Caso marcado como resolvido
```

---

## Fluxo 4 — Escalonamento para Coordenação (Automático)

```
1. Sistema detecta: [Nome] completou 4ª ausência consecutiva
2. Caso existente é atualizado: status → "Encaminhado à coordenação"
3. Notificação para coordenador de plantão
4. Líder vê o caso com indicação "Encaminhado à coordenação"
   → Líder permanece como parte do acompanhamento
5. Coordenação visualiza casos escalados no dashboard
6. Coordenação acessa o caso, vê histórico de ações
7. Coordenação registra ação ou orienta líder
8. Quando resolvido: coordenação ou líder fecha o caso com resultado
```

---

## Fluxo 5 — Definir Discipulador (Líder)

```
1. Líder abre perfil da pessoa
2. Aba "Discipulado"
3. Campo "Discipulador responsável" — vazio ou nome atual
4. Toca em "Definir" ou "Alterar"
5. Busca pessoa por nome (dentro do contexto da rede)
6. Seleciona discipulador
7. Confirmação
8. Se havia discipulador anterior: vínculo anterior encerrado, novo criado
9. Histórico exibe ambos os registros
```

---

## Fluxo 6 — Atualizar Formação (Líder)

```
1. Líder abre perfil da pessoa
2. Aba "Formação"
3. Seção "Cultura Emaús":
   - Status atual exibido
   - Toca em "Atualizar"
   - Seleciona status (não realizou / cursando / concluído)
   - Se concluído: informa data (opcional)
   - Aviso: "Dado declarativo — informação fornecida pela própria pessoa"
4. Seção "Escola Makarios":
   - Volume 1, 2, 3 exibidos separadamente
   - Mesmo fluxo de atualização
5. Aptidão para servir e liderar atualizada automaticamente
```

---

## Fluxo 7 — Adicionar Serviço (Líder)

```
1. Líder abre perfil da pessoa
2. Aba "Serviço"
3. Toca em "Adicionar área"
4. Sistema verifica aptidão:
   - Se Cultura não concluído: exibe bloqueio + indicação do requisito
   - Se Cultura concluído: exibe lista de áreas ativas
5. Seleciona área
6. Preenche função (opcional)
7. Se "Função de liderança": sistema verifica Makarios 1/2/3
   - Se incompleto: exibe bloqueio
8. Confirma
9. Vínculo criado com status "ativo"
```

---

## Fluxo 8 — Transferência entre GRs (Coordenação)

```
1. Coordenação busca a pessoa
2. Toca em "Transferir"
3. Tela exibe: GR atual, líder atual
4. Seleciona novo GR + data efetiva
5. Seção "Discipulado":
   - Exibe discipulador atual (se houver)
   - Opções: manter, encerrar, definir novo, decidir depois
6. Resumo da transferência
7. Confirmação com aviso dos efeitos
8. Execução atômica:
   - Vínculo anterior encerrado
   - Novo vínculo criado
   - Decisão de discipulado executada
   - Registro em audit_logs + group_transfers
9. Confirmação de sucesso
```

---

## Fluxo 9 — Dashboard do Líder (Mobile)

```
Tela de Início
├── [GR: Nome do GR]
├── Reunião pendente? → botão "Registrar reunião"
│   ou Relatório no prazo / Relatório atrasado → prazo exibido
├── Casos de pastoreio pendentes: X → link para lista
├── Visitantes aguardando decisão: X → link
├── Pessoas sem discipulador: X → link
└── Avisos de formação/serviço relevantes

Navegação:
├── Início
├── Reuniões
├── Pastoreio
├── Pessoas
└── Perfil (do líder)
```

---

## Fluxo 10 — Dashboard da Coordenação

```
Painel Geral
├── Total de pessoas vinculadas na rede
├── Visitantes no período
├── Presença geral (semana)
├── Casos abertos / escalados
├── Relatórios atrasados
├── Pessoas sem discipulador
├── Conclusão do Cultura Emaús (%)
├── Progresso Makarios (distribuição)
├── Pessoas servindo / aptas para liderar

Lista de GRs
├── Por GR: líder, dia, pessoas vinculadas, presença, casos, relatório

Casos Escalados
├── Pessoa, GR, líder, nº ausências, ações feitas, tempo aberto
```

---

## Notas de UX

- Todas as telas principais devem funcionar em 320px de largura
- Confirmações destrutivas sempre exigem toque explícito
- Feedback de carregamento em todas as operações assíncronas
- Mensagens de erro próximas aos campos com problema
- Ações de lista com área de toque mínima de 44x44px
