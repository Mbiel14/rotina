# Rotina

Aplicativo web para acompanhar saúde, treino e organização pessoal em um único lugar. A ideia do projeto é centralizar a rotina do usuário em um dashboard com controle de treinos, alimentação, metas diárias e perfil pessoal, tudo integrado com autenticação e armazenamento em Supabase.

## Visão geral

O Rotina foi pensado para ajudar pessoas a manterem disciplina com hábitos físicos e de alimentação, sem precisar alternar entre vários aplicativos. A interface permite:

- gerenciar rotinas de treino;
- organizar tarefas e exercícios por rotina;
- registrar refeições diárias com calorias e proteína;
- acompanhar progresso semanal;
- definir metas de manutenção/calorias;
- manter um perfil com dados pessoais e avatar.

## Funcionalidades

### Dashboard
- painel com abas de "Treino" e "Dieta";
- criação de rotinas personalizadas;
- listagem de rotinas em destaque;
- navegação para detalhes de cada rotina;
- visualização do perfil do usuário no topo.

### Treinos
- criação de rotinas com nome e descrição;
- adição de treinos/tarefas dentro de cada rotina;
- visualização de status dos exercícios (A fazer, Em andamento, Concluído);
- organização por rotina e acompanhamento de progresso;
- exclusão de rotinas e tarefas quando necessário.

### Dieta
- registro de refeições com data, tipo, nome, calorias e proteína;
- resumo do dia com total calórico e proteína;
- acompanhamento da meta diária de calorias;
- gráfico de progresso semanal;
- média de consumo em 7 dias;
- histórico de refeições por dia.

### Perfil
- cadastro de dados pessoais;
- cálculo de idade, IMC e manutenção estimada;
- personalização de meta calórica diária;
- upload e remoção de avatar;
- autenticação e logout do usuário.

## Stack tecnológica

- React 19
- Vite
- JavaScript
- React Router
- Tailwind CSS
- Supabase

## Estrutura do projeto

```bash
src/
├── components/         # componentes reutilizáveis e UI
│   ├── avatar.jsx
│   ├── diettab.jsx
│   ├── ui.jsx
│   └── weeklyworkoutprogress.jsx
├── lib/                # utilitários, cálculos e cliente Supabase
│   ├── health.js
│   ├── nutrition.js
│   ├── supabaseClient.js
│   └── ...
├── pages/              # páginas principais da aplicação
│   ├── home.jsx
│   ├── project.jsx
│   ├── signin.jsx
│   ├── signup.jsx
│   └── task_detail.jsx
├── user/               # hooks e telas de usuário
│   ├── profile.jsx
│   ├── useprofile.js
│   └── ...
├── main.jsx            # ponto de entrada
├── router.jsx          # configuração de rotas
├── index.css           # estilos globais
├── style.css           # estilos complementares
└── App.jsx             # estrutura base da aplicação
```

## Requisitos

Antes de iniciar o projeto, certifique-se de ter instalado:

- Node.js 18 ou superior
- npm
- uma conta no Supabase com projeto criado

## Instalação

1. Clone o repositório:

```bash
git clone https://github.com/Mbiel14/rotina.git
cd rotina
```

2. Instale as dependências:

```bash
npm install
```

3. Crie um arquivo `.env` na raiz do projeto com as variáveis do Supabase:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publicavel
```

Essas variáveis são usadas pelo arquivo `src/lib/supabaseClient.js` para conectar o frontend ao Supabase.

## Scripts disponíveis

```bash
npm run dev
```

Inicia o aplicativo em ambiente de desenvolvimento.

```bash
npm run build
```

Gera a build de produção para deploy.

```bash
npm run preview
```

Executa a build localmente para visualização.

```bash
npm run lint
```

Roda a checagem de lint do projeto.

## Como usar

1. Faça login ou crie uma conta.
2. Acesse o dashboard.
3. Crie uma rotina de treino.
4. Adicione exercícios/tarefas dentro da rotina.
5. Acesse a aba de dieta para registrar refeições.
6. Atualize o perfil com dados pessoais e meta calórica.
7. Acompanhe o progresso semanal e ajuste os hábitos conforme necessidade.

## Fluxo principal da aplicação

- autenticação do usuário via Supabase;
- criação de rotinas de treino;
- organização dos exercícios em tarefas;
- registro de alimentação e progresso diário;
- monitoramento do desempenho em relação à meta;
- manutenção de dados pessoais e avatar.

## Observações

- este projeto foi pensado para uso pessoal e acompanhamento de rotina diária;
- a arquitetura está voltada para produtividade, simplicidade e rapidez de uso;
- a aplicação depende de uma configuração correta do Supabase para funcionar plenamente.

## Possíveis evoluções

- histórico detalhado de treino por mês;
- gráficos de evolução de peso e desempenho;
- lembretes e notificações;
- integração com objetivos específicos (emagrecimento, hipertrofia, manutenção);
- modo de edição e duplicação de rotinas.

## Licença

Este projeto ainda não possui uma licença explícita definida no repositório.

## Autor

- Mbiel14

## Contribuição

Contribuições são bem-vindas. Para colaborar:

1. faça um fork do projeto;
2. crie uma branch para a sua feature;
3. faça commit das alterações;
4. abra um pull request.
