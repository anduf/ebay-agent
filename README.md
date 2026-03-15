# eBay MacBook Sales Agent

Agente automatizado que responde compradores no eBay usando Claude (Anthropic).

## Como funciona

1. Comprador manda mensagem no eBay
2. eBay notifica seu servidor via webhook
3. Servidor busca o histórico da conversa via eBay API
4. Claude processa e gera a resposta ideal
5. Resposta é enviada automaticamente de volta ao comprador

---

## Setup completo

### 1. Pré-requisitos
- Conta de vendedor no eBay
- Conta em developer.ebay.com
- Conta na Anthropic (anthropic.com) para API key
- Conta no Railway (railway.app)
- Git instalado

---

### 2. Credenciais eBay

1. Acesse **developer.ebay.com**
2. Faça login com sua conta eBay de vendedor
3. Vá em **My Account → Application Keys**
4. Clique em **Create an App Key** → escolha **Production**
5. Anote: `App ID`, `Cert ID`, `Dev ID`

**Gerar User Token (obrigatório):**
1. No painel do developer, clique em **User Tokens**
2. Selecione seu app Production
3. Clique em **Get a Token from eBay via Your Application**
4. Faça login com sua conta de vendedor
5. Copie o token gerado — esse é o `EBAY_USER_TOKEN`

---

### 3. Deploy no Railway

```bash
# Clone ou crie o repositório
git init
git add .
git commit -m "initial"

# Crie um repo no GitHub e suba
git remote add origin https://github.com/SEU_USER/ebay-agent.git
git push -u origin main
```

1. Acesse **railway.app** e faça login
2. Clique em **New Project → Deploy from GitHub repo**
3. Selecione o repositório
4. Vá em **Variables** e adicione todas as variáveis do `.env.example`
5. Railway vai fazer o deploy automaticamente
6. Copie a URL gerada (ex: `https://ebay-agent-production.up.railway.app`)

---

### 4. Configurar Webhook no eBay

1. No developer.ebay.com, vá em **Alerts & Notifications**
2. Clique em **Subscribe to Notifications**
3. Endpoint URL: `https://sua-url.railway.app/webhook/ebay`
4. Selecione o tópico: **BUYER_MESSAGING_BUYER_MESSAGE_CREATED**
5. Coloque o mesmo `EBAY_VERIFICATION_TOKEN` que você definiu no Railway
6. Clique em **Save** — eBay vai fazer uma requisição GET para verificar o endpoint

Se o endpoint responder corretamente, aparece "Verified" no painel.

---

### 5. Testar

Mande uma mensagem para o seu anúncio de outro conta eBay e veja o agente responder automaticamente.

Logs em tempo real no Railway → clique no deploy → **View Logs**.

---

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `ANTHROPIC_API_KEY` | Chave da API Anthropic |
| `EBAY_APP_ID` | App ID do seu app eBay (Production) |
| `EBAY_CERT_ID` | Cert ID do seu app eBay (Production) |
| `EBAY_DEV_ID` | Dev ID do seu app eBay |
| `EBAY_USER_TOKEN` | OAuth token da sua conta de vendedor |
| `WEBHOOK_ENDPOINT` | URL completa do webhook (ex: https://xxx.railway.app/webhook/ebay) |
| `EBAY_VERIFICATION_TOKEN` | String aleatória para verificação do webhook |

---

## Estrutura do projeto

```
ebay-agent/
├── src/
│   ├── server.js   # Express server + webhook handler
│   ├── agent.js    # Lógica do Claude (system prompt + chamada API)
│   └── ebay.js     # Integração com eBay API
├── package.json
├── railway.toml
├── .env.example
└── .gitignore
```
