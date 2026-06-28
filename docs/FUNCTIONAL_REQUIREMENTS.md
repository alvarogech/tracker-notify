# Requisitos Funcionais — Pastoreio HUIOS

## RF01 — Autenticação

- RF01.1 Login com e-mail e senha
- RF01.2 Recuperação de senha
- RF01.3 Mensagem de acesso desativado para usuários inativos
- RF01.4 Redirecionamento após login baseado no papel do usuário
- RF01.5 Sessão expirada redireciona para login

## RF02 — Perfis e Papéis

- RF02.1 Três papéis: líder, coordenação, administrador
- RF02.2 Papel único por usuário (podendo coexistir coordenação + admin na mesma pessoa, mas papéis separados tecnicamente)
- RF02.3 Usuário pode estar associado a uma pessoa no cadastro
- RF02.4 Administrador ativa e desativa acessos

## RF03 — Rede e GRs

- RF03.1 Cadastro de rede (seed: HUIOS / Igreja Emaús)
- RF03.2 GR associado a uma rede
- RF03.3 GR possui: nome, líder, dia da semana, horário, local, status (ativo/inativo)
- RF03.4 Coordenação gerencia GRs
- RF03.5 Sistema gera reuniões futuras automaticamente pela agenda do GR

## RF04 — Pessoas

- RF04.1 Cadastro com: nome completo, nome preferido (opcional), telefone (opcional), data de nascimento (opcional)
- RF04.2 Busca por nome, telefone ou situação
- RF04.3 Desativação (soft delete) em vez de exclusão
- RF04.4 Perfil organizado em seções: resumo, frequência, discipulado, formação, serviço, pastoreio, histórico
- RF04.5 Status do ciclo de vida: visitante, ativo, atenção, afastado temporariamente, inativo

## RF05 — Vínculos com GR

- RF05.1 Pessoa pode ter relação de visitante ou participante com um GR
- RF05.2 Uma relação ativa por pessoa dentro da rede por vez
- RF05.3 Encerramento de relação preserva histórico

## RF06 — Visitantes

- RF06.1 Cadastro rápido: nome + telefone opcional
- RF06.2 Antes de salvar: verificar telefone duplicado, alertar nome semelhante
- RF06.3 Visitante não aparece na chamada obrigatória
- RF06.4 Visitante não entra no denominador de frequência
- RF06.5 Visitante não gera ausência
- RF06.6 Presenças de visitantes são registradas separadamente
- RF06.7 Após 3 visitas: sugestão de vinculação (nunca automática)
- RF06.8 Líder pode: confirmar, adiar ou encerrar a relação
- RF06.9 Conversão preserva histórico de visitas e cria vínculo regular atomicamente

## RF07 — Reuniões

- RF07.1 Status da reunião: agendada, realizada, cancelada
- RF07.2 Status do relatório: pendente, enviado no prazo, enviado com atraso, reaberto
- RF07.3 Prazo de 48h calculado no fuso America/Sao_Paulo
- RF07.4 Reunião cancelada não gera ausências nem exige chamada
- RF07.5 Chamada inclui apenas participantes elegíveis na data
- RF07.6 Relatório bloqueado após envio; reabertura exclusiva da coordenação com registro de auditoria

## RF08 — Chamada

- RF08.1 Marcar: presente, ausente, ausência justificada
- RF08.2 Relatório não pode ser enviado com participantes obrigatórios sem marcação
- RF08.3 Resumo antes do envio: participantes presentes, ausentes, justificados, visitantes
- RF08.4 Alertas de envio: pessoas atingindo 2 ou 4 ausências, casos a serem criados, visitantes com 3 visitas

## RF09 — Afastamento Temporário

- RF09.1 Registrar: data início, previsão de retorno, motivo categórico (opcional)
- RF09.2 Durante afastamento: não aparece como presença esperada, não acumula ausências
- RF09.3 Após data prevista: sistema solicita revisão do status

## RF10 — Casos de Pastoreio

- RF10.1 Criação automática após 2 ausências consecutivas
- RF10.2 Criação manual pelo líder ou coordenação
- RF10.3 Status: pendente, em andamento, resolvido, encaminhado à coordenação
- RF10.4 Escalonamento automático após 4 ausências consecutivas (mesmo caso)
- RF10.5 Resolução exige ao menos 1 ação registrada + resultado + confirmação
- RF10.6 Sistema não resolve caso automaticamente por presença

## RF11 — Ações de Pastoreio

- RF11.1 Tipos: mensagem, ligação, reunião presencial, conversa em outro contexto
- RF11.2 Nota opcional com limite de 300 caracteres
- RF11.3 Orientação de privacidade exibida próxima ao campo
- RF11.4 Histórico cronológico por caso

## RF12 — Discipulado

- RF12.1 Registrar discipulador responsável por pessoa
- RF12.2 Apenas 1 discipulador ativo por pessoa
- RF12.3 Substituição encerra o vínculo anterior
- RF12.4 Histórico de discipuladores preservado
- RF12.5 Indicador de cobertura de discipulado

## RF13 — Cultura Emaús

- RF13.1 Status declarativo: desconhecido, não realizou, cursando, concluído
- RF13.2 Data declarada de conclusão (opcional)
- RF13.3 Exibir: quem informou, quando, que o dado é declarativo
- RF13.4 Cálculo automático de aptidão para servir

## RF14 — Escola Makarios

- RF14.1 Três volumes independentes: Makarios 1, 2, 3
- RF14.2 Status por volume: desconhecido, não iniciou, cursando, aprovado e concluído
- RF14.3 Cálculo de progresso: 0/3, 1/3, 2/3, 3/3
- RF14.4 Cálculo de aptidão formativa para liderar (Cultura + 3 Makarios)

## RF15 — Áreas de Serviço

- RF15.1 Catálogo administrável de áreas
- RF15.2 Seed inicial: 8 áreas (Áreas Executivas, Mídia, Louvor, Ekballo, Sobrenatural, Velos, Éleos, Libras)
- RF15.3 Pessoa pode servir em múltiplas áreas simultaneamente
- RF15.4 Ativar vínculo exige Cultura concluído
- RF15.5 Função de liderança exige Cultura + Makarios 1/2/3 concluídos
- RF15.6 Status: ativo, pausado, encerrado

## RF16 — Transferências

- RF16.1 Exclusivo da coordenação
- RF16.2 Fluxo: selecionar pessoa → GR atual → novo GR → data efetiva → confirmar
- RF16.3 Revisão obrigatória do discipulador no fluxo
- RF16.4 Histórico integral preservado após transferência
- RF16.5 Transferência registrada em auditoria

## RF17 — Painéis e Indicadores

- RF17.1 Dashboard do líder: mobile-first, ações prioritárias, sem gráficos complexos
- RF17.2 Dashboard da coordenação: visão consolidada da rede HUIOS
- RF17.3 Indicadores calculados dinamicamente (sem redundância no banco)
- RF17.4 12 indicadores: pessoas vinculadas, visitantes, presença da reunião, média de presença, constância, pessoas em atenção, cobertura de discipulado, Cultura Emaús, Makarios, serviço, aptidão para liderança, pontualidade

## RF18 — Notificações Internas

- RF18.1 Central interna de notificações
- RF18.2 Tipos: relatório pendente, relatório atrasado, caso criado, caso escalado, visitante 3 visitas, revisão de afastamento, sem discipulador, inconsistência formação/serviço

## RF19 — Auditoria

- RF19.1 Log de auditoria para operações críticas
- RF19.2 Exibição para coordenação autorizada e admins

## RF20 — Acessibilidade e Responsividade

- RF20.1 Mobile-first, funcionamento a partir de 320px
- RF20.2 Botões com área de toque adequada
- RF20.3 Labels visíveis, contraste adequado, foco visível
- RF20.4 Navegação por teclado, ARIA quando necessário
- RF20.5 HTML semântico
- RF20.6 Formulários usam controles nativos quando possível

---

## Critérios do MVP Pronto

O MVP estará apto ao piloto quando:

1. Líder entrar pelo celular
2. Visualizar somente o próprio GR
3. Registrar uma reunião completa
4. Cadastrar visitante
5. Enviar o relatório
6. Visualizar a sugestão após a terceira visita
7. Confirmar a vinculação do visitante
8. Gerar caso após duas ausências
9. Registrar mais de uma ação no caso
10. Resolver o caso manualmente
11. Escalar o caso após quatro ausências
12. Definir discipulador
13. Atualizar Cultura
14. Atualizar os três volumes da Makarios
15. Registrar mais de uma área de serviço
16. Receber bloqueio quando o requisito formativo não for atendido
17. A coordenação transferir uma pessoa
18. O histórico permanecer intacto
19. A coordenação visualizar toda a rede
20. Um líder não conseguir acessar outro GR
21. Todos os testes críticos passarem
22. O build de produção funcionar
23. A documentação estar atualizada
24. Nenhuma informação íntima ser exigida
