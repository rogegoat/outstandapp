# OUTSTAND — Guia do Projeto

## Visão Geral
OUTSTAND é um app web pessoal de alta performance visual para acompanhar evolução de vida em cinco frentes: financeiro, saúde, ideias, to-do e projeto de hábitos.

A proposta visual segue um estilo premium escuro, minimalista e profissional, com microinterações suaves e botões com efeito de brilho no hover.

## Stack e Arquitetura
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Lucide React (ícones)
- Persistência local com `localStorage` por usuário + sincronização remota via Youbase (`app_states`)
- Autenticação com Youbase (`@edgespark/client`, login por e-mail e senha)

## Padrão Visual
- Blocos expansíveis/contraíveis (CollapsibleCard) fechados por padrão
- Formulários de criação ocultos por padrão — aparecem ao clicar em "Novo...", "Adicionar..." etc.
- Visualização de dados é sempre a ação principal; criar é ação consciente

## Funcionalidades Implementadas

### 1) Aba Financeiro
- Cadastro de gastos com:
  - descrição
  - valor
  - data
  - categoria
  - forma de pagamento
  - responsável pelo gasto
- Controle de entradas de dinheiro com:
  - valor recebido
  - data
  - origem da renda
- Fontes de renda editáveis e reutilizáveis
- Resumo financeiro com entradas, gastos e saldo líquido
- Listagem de últimos gastos e últimas entradas
- Cadastro de cônjuge/dependentes
- Filtro de resumo por pessoa
- Resumo total com agrupamento por categoria e forma de pagamento
- Bloco "Fixos mensais" para cadastrar gastos fixos recorrentes (nome, valor, categoria, forma de pagamento), listados e considerados no controle mensal
- Bloco "Contas a pagar" para registrar contas pontuais (nome, valor, data de vencimento), com marcação de pago e histórico
- Bloco "Gráficos de resumo" com barras por categoria, barras por forma de pagamento e gráfico de evolução mensal (últimos 6 meses)

### 2) Aba Saúde
- Registro diário de peso com evolução visual em linha conectando todos os pontos salvos
- Registro de carga de exercícios (força) com reps, grupo muscular e nível de esforço
- Remoção de exercício de força (menu de três pontos no desktop e gesto de arrastar no mobile)
- Filtro por grupo muscular na área de força
- Evolução automática de exercícios com mesmo nome (novo lançamento vira histórico do mesmo exercício)
- Gráfico de evolução de carga por exercício selecionado
- Diário de treino com emoji no título e avaliação de 1 a 5:
  - 1 preguiçoso
  - 2 leve
  - 3 moderado
  - 4 bom
  - 5 forte
- Gerador de plano personalizado (treino + dieta) com base em:
  - peso
  - altura
  - idade
  - objetivo
- Estimador nutricional de refeição por texto (calorias/macros) com variação por tipo e quantidade dos alimentos
- Indicador circular de consumo diário (kcal consumidas vs meta)
- Remoção de refeição salva com atualização imediata do total diário e do círculo de progresso

### 3) Aba Ideias
- Aba inicia vazia (sem editor fixo aberto)
- Ações diretas para criar pasta e criar nova nota
- Notas em blocos editáveis com:
  - emoji no título
  - título
  - capa (imagem no topo via URL)
  - conteúdo livre
- Agrupamento de notas por pasta
- Remoção de notas

### 4) Aba To-Do
- Cadastro de compromissos com:
  - título
  - data
  - horário
  - urgência 0 a 3
  - repetição (diária/semanal/mensal)
- Visualização de calendário em modos:
  - diário
  - semanal
  - mensal
- Lista diária de compromissos
- Toggle de conclusão
- Notificações do navegador para compromissos agendados (quando permitido)

### 5) Aba Projeto
- Quadro semanal de hábitos com checklist por dia
- Hábitos iniciais para projeto de 28 dias (dieta, treino, oração, sono)
- Adição de novos hábitos personalizados
- Percentual de conclusão semanal

## Decisões de Produto
- Interface textual em português (pt-BR)
- Foco em usabilidade direta, sem excesso visual
- Salvar dados por usuário (local + sincronização remota) para manter o mesmo perfil em múltiplos dispositivos
- Navegação por abas no mobile em barra inferior com ícones (desktop mantém navegação superior)
- Caixas principais com comportamento expansível/contrátil para reduzir rolagem no celular
- IA inicial simulada por heurísticas locais para resposta instantânea

## Build e Qualidade
- Build de produção validado com sucesso via `npm run build`

## Próximos Passos Recomendados
- Conectar IA real no backend (Youbase + provider de LLM)
- Evoluir sincronização remota para resolução de conflitos offline/online
- Adicionar exportação/importação de dados
- Adicionar gráficos avançados por período
