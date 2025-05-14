# Webhook App (Client + Server)
This monorepo contains:

- **Client (Streamlit):** A simple webhook client to test POST requests.
- **Server (Express):** A Node.js webhook server that logs and responds to incoming requests.

### ⏩ Quick Start - Server
```bash
cd server
npm install
npm start
```

### ⏩ Quick Start - Client
```bash
cd client
pip install -r requirements.txt
streamlit run app.py
```

### ⏩ Usage
* Start the Node.js server on port `3000`, and verify it is listening to incoming requests.
* Launch the Streamlit client and send JSON payloads to
  * http://localhost:3000/webhook-1
  * http://localhost:3000/webhook-2
* The server logs headers & body and responds with JSON confirmation.

### 🚀 Deploying to Railway

For a detailed guide to webhook servers, see [this](https://alphasec.io/getting-started-with-webhooks-part-1-webhook-servers/) post. For a guide to webhook clients, see [this](https://alphasec.io/getting-started-with-webhooks-part-2-webhook-clients/) post. 

To deploy on [Railway](https://railway.app/?referralCode=alphasec) using a one-click template, click the button below.

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template/WJuLbj?referralCode=alphasec)
