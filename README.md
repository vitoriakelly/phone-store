# 📱 Phone Store

Sistema web para gerenciamento de estoque e vendas de dispositivos móveis.

A aplicação permite cadastrar aparelhos, controlar o status dos dispositivos, registrar vendas, acompanhar faturamento, calcular lucro e consultar as movimentações da loja por meio de um dashboard.

## 🚀 Funcionalidades

### Dispositivos

- Cadastro de dispositivos
- Listagem de aparelhos
- Pesquisa por marca, modelo, IMEI, cor ou armazenamento
- Filtro por status
- Visualização dos detalhes
- Edição das informações
- Alteração de status
- Exclusão de dispositivos
- Controle de IMEI duplicado

### Vendas

- Registro de vendas
- Associação da venda ao dispositivo
- Atualização automática do dispositivo para `VENDIDO`
- Histórico de vendas
- Pesquisa e filtros
- Visualização dos detalhes da venda
- Impressão de comprovante
- Cálculo de faturamento e lucro

### Dashboard

- Quantidade total de aparelhos
- Aparelhos disponíveis
- Aparelhos reservados
- Aparelhos vendidos
- Valor potencial do estoque
- Faturamento total
- Lucro total
- Ticket médio
- Dispositivos recentes
- Vendas recentes

## 🛠️ Tecnologias

- React
- TypeScript
- Vite
- React Router
- React Hook Form
- Zod
- Sass
- Lucide React
- Fetch API
- Vite PWA

## 🧱 Arquitetura

```text
React
  ↓
Services
  ↓
API REST
  ↓
Prisma
  ↓
PostgreSQL
```

O frontend não utiliza `localStorage`. Todos os dados são persistidos por meio da API.

## 📁 Estrutura principal

```text
src/
├── components/
├── layouts/
├── pages/
│   ├── Dashboard/
│   ├── Devices/
│   ├── CreateDevice/
│   ├── EditDevice/
│   ├── DeviceDetails/
│   ├── RegisterSale/
│   ├── Sales/
│   └── SaleDetails/
├── schemas/
├── services/
│   ├── api.ts
│   ├── deviceApi.ts
│   └── saleApi.ts
├── types/
├── utils/
├── App.tsx
└── main.tsx
```

## ⚙️ Pré-requisitos

Antes de iniciar, tenha instalado:

- Node.js
- npm
- API Phone Store em execução
- PostgreSQL configurado no backend

## 🔧 Configuração

Clone o projeto:

```bash
git clone https://github.com/vitoriakelly/phone-store.git
cd phone-store
```

Instale as dependências:

```bash
npm install
```

Crie o arquivo `.env` na raiz:

```env
VITE_API_URL=http://localhost:3333
```

## ▶️ Executando o projeto

Inicie o frontend:

```bash
npm run dev
```

A aplicação ficará disponível em:

```text
http://localhost:5173
```

A API deve estar executando em:

```text
http://localhost:3333
```

## 📜 Scripts

```bash
npm run dev
```

Inicia o servidor de desenvolvimento.

```bash
npm run build
```

Gera o build de produção.

```bash
npm run preview
```

Executa localmente o build de produção.

```bash
npm run lint
```

Executa a análise do código.

## 🔗 Principais rotas

| Rota | Descrição |
|---|---|
| `/` | Dashboard |
| `/dispositivos` | Listagem de dispositivos |
| `/dispositivos/cadastrar` | Cadastro de dispositivo |
| `/dispositivos/:id` | Detalhes do dispositivo |
| `/dispositivos/:id/editar` | Edição do dispositivo |
| `/dispositivos/:id/vender` | Registro de venda |
| `/vendas` | Histórico de vendas |
| `/vendas/:id` | Detalhes da venda |

## 🔌 Integração com a API

O frontend consome os seguintes endpoints:

### Dispositivos

```text
POST   /devices
GET    /devices
GET    /devices/:id
PATCH  /devices/:id
DELETE /devices/:id
```

### Vendas

```text
POST /sales
GET  /sales
GET  /sales/:id
```

## ✅ Validação do projeto

Execute:

```bash
npm run build
```

O build deve ser concluído sem erros.

## 👩‍💻 Autora

Desenvolvido por **Vitória Kelly**.

GitHub: `https://github.com/vitoriakelly`

LinkedIn: `https://linkedin.com/in/vitoria-leopoldo`