# PayPerUseAI Project Context & Architecture

PayPerUseAI is a decentralized AI orchestration platform built on the Algorand blockchain. It enables truly granular, pay-per-token AI billing without subscriptions or middleman lock-in.

## 🏗️ System Architecture

### 1. Smart Contract Layer (`contract.py`)
The "Trust Layer" of the application. All financial decisions are enforced on-chain.
- **Escrow Balances:** Users deposit ALGO into a contract BoxMap.
- **Smart Sessions:** Users authorize a session with a `max_spend` and `expiry`. This allows the backend to deduct micro-payments without repeated wallet approvals.
- **Revenue Split:** The contract automatically splits payments between the platform owner and AI service creators.
- **ARC-69 NFTs:** Inner transactions are used to mint and transfer NFTs directly to users upon image generation.

### 2. Backend Orchestration (`backend/app/`)
The "Execution Layer" that connects users, AI providers, and the blockchain.
- **Streaming Proxy (`chat.py`):** Acts as an SSE (Server-Sent Events) proxy between the frontend and AI providers (Groq, OpenAI, Gemini, HuggingFace).
- **Settlement Logic (`algorand_service.py`):** After an AI stream completes, the backend calculates the exact token cost and calls `request_service_v2` on the smart contract to deduct the fee from the user's session.
- **AI Abstraction (`ai_service.py`):** Normalizes different provider SDKs into a single consistent streaming interface.

### 3. Frontend Experience (`frontend/src/`)
The "Interaction Layer" built for transparency and speed.
- **Neo-Brutalism Design:** A bold, high-contrast UI that emphasizes technical clarity.
- **Session Management:** Handles wallet connection (Pera Wallet), session authorization, and real-time balance tracking.
- **Context Preservation:** Multi-turn conversations are handled via PostgreSQL state and passed to AI models for continuity.

## 💰 Billing Model (Dynamic Token Pricing)
We use a per-token pricing model denominated in MicroAlgos:
- **Input Tokens:** Billed based on the context sent to the model.
- **Output Tokens:** Billed based on the AI's response length.
- **Example:** Llama 3.3 costs ~0.95 ALGO per 1 Million tokens.

## 🛠️ Key Components
- **Algorand:** Testnet environment, using Box Storage for high-density session data.
- **FastAPI:** High-performance async backend.
- **React + Tailwind:** Modern, responsive frontend.
- **PostgreSQL:** Used for analytics, conversation history, and metadata logging (non-financial).

## 🚀 Recent Accomplishments
- Fixed Gemini 1.5 Flash 404 and streaming errors.
- Transitioned from fixed pricing to **Dynamic Token-Based Billing**.
- Resolved box access issues (`box_len` assert failures) in the smart contract settlement flow.
- Added session balance verification to ensure users are prompted to recharge before they hit limits.
