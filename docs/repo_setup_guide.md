# <div align="center">🛠️ Pay-Per-Use-AI: Local Repository Setup Guide</div>

<div align="center">

![Algorand](https://img.shields.io/badge/Algorand-Smart%20Contracts-black?style=for-the-badge&logo=algorand&logoColor=white)
![React](https://img.shields.io/badge/React.js-Frontend-blue?style=for-the-badge&logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Database-emerald?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-Deployment-black?style=for-the-badge&logo=vercel&logoColor=white)

</div>

---

## 🏗️ 1. Prerequisites

Before setting up locally, ensure you have installed the following system components:

* **Node.js** (v18.x or later) & **npm**
* **Python** (v3.10 or later) & **pip**
* **PostgreSQL** (or access to a **Supabase** cloud database instance)
* **Pera Wallet** installed on your mobile device (configured to **Testnet** with a funded account)

> [!TIP]
> **Need Testnet Algos?**
> You can claim free Testnet Algos instantly from the [Algorand Testnet Faucet](https://bank.testnet.algodev.network/) to fund your user wallet!

---

## 📂 2. Repository Structure

Here is an architectural map of how the different project layers are distributed:

```text
Pay-Per-Use-Ai/
├── backend/            # FastAPI Backend & Orchestration Service
├── contract/           # Algorand Smart Contract & Deployment Python files
├── docs/               # Architecture and Setup Guides
├── frontend/           # Vite + React (Neo-Brutalist Marketplace)
└── vercel.json         # Root routing rewrite config for Vercel
```

---

## ⚡ 3. Backend Setup

### Step 1: Initialize Virtual Environment
Navigate to the `backend` directory and build a Python virtual environment:
```bash
cd backend
python -m venv venv
```

Activate the environment:
> [!NOTE]
> Select the activation command corresponding to your operating system:
> * **Windows (PowerShell):** `.\venv\Scripts\Activate.ps1`
> * **Windows (CMD):** `.\venv\Scripts\activate.bat`
> * **macOS/Linux:** `source venv/bin/activate`

### Step 2: Install Python Dependencies
Install all required platform libraries:
```bash
pip install -r requirements.txt
```

### Step 3: Configure Environment Variables (`backend/.env`)
Create a `.env` file inside the `backend/` directory by copying `.env.example`:
```bash
cp .env.example .env
```

Open `.env` and fill in the values:

> [!WARNING]
> Keep your private mnemonics and encryption keys completely safe and never push them to public version control systems.

```env
# ── AI API Credentials ──
OPENAI_API_KEY=your_openai_key
GROQ_API_KEY=your_groq_key
HF_API_KEY=your_huggingface_key
GEMINI_API_KEY=your_gemini_key

# ── Algorand Network Configuration ──
ALGORAND_NETWORK=testnet
ALGOD_URL=https://testnet-api.algonode.cloud
ALGOD_TOKEN=
INDEXER_URL=https://testnet-idx.algonode.cloud

# ── Deployed Contracts ──
ALGORAND_APP_ID=762562501
ALGORAND_APP_ID_V3=762551954

# ── Platform Wallet (receives payments) ──
PLATFORM_WALLET_ADDRESS=B5BMUKJFHX6TKTSCIBVFOHJ76J4VG4PJ6C4YXSOPBTWVOVD22O3DDVYUNY
PLATFORM_WALLET_MNEMONIC=your_twenty_four_word_platform_mnemonic

# ── PostgreSQL Database ──
DATABASE_URL="postgresql://<username>:<password>@<host>:<port>/<dbname>"

# ── Security & CORS ──
APP_SECRET_KEY=generate_a_random_32_character_security_secret
SESSION_EXPIRY_SECONDS=600
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,https://pay-per-use-ai.vercel.app

# ── AES-256 Key Encryption Secret ──
API_KEY_ENCRYPTION_SECRET=generate_a_hex_key_64_characters
```

### Step 4: Run Database Migrations
Initialize the DB schemas (Tables for users, creators, sessions, agents, and history logs):
```bash
# Executed automatically on server startup, or run manually:
python -c "from app.database import init_db; init_db()"
```

### Step 5: Launch Backend Server
Start the Uvicorn development server:
```bash
uvicorn app.main:app --reload --port 8000
```
Verify the API is running by visiting: `http://localhost:8000/docs`.

---

## 💻 4. Frontend Setup

### Step 1: Install Node Modules
Navigate to the `frontend` folder and install dependencies:
```bash
cd ../frontend
npm install
```

### Step 2: Configure Environment (`frontend/.env`)
Copy the `.env.example` file:
```bash
cp .env.example .env
```
Open `.env` and configure your local backend API link:
```env
VITE_API_URL=http://localhost:8000
```

### Step 3: Run Development Server
```bash
npm run dev
```
Open the given local link (usually `http://localhost:5173`) in your browser.

### Step 4: Build for Production
Confirm compiling finishes flawlessly:
```bash
npm run build
```

---

## 🌐 5. Deployed Live Deployments (Vercel)

### Deep Linking 404 Resolution

> [!IMPORTANT]
> For Vite SPAs featuring `react-router-dom`, direct page reloading on Vercel causes `404` errors. We have configured the project with a root [vercel.json](file:///c:/Users/Prasad/Desktop/Pay-Per-Use-Ai/Pay-Per-Use-Ai/vercel.json) to rewrite all server requests back to `/index.html`:

```json
{
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This guarantees seamless browser refreshes, back/forward button navigations, and direct loads across all deep routes.
