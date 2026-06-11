# Technical Due Diligence & Architecture Q&A
**Target Audience:** Enterprise Architects, Venture Capitalists, and Technical Lead Evaluators (Shark Tank style).

---

### Part 1: Core Financial Architecture

**Q1: Why use Algorand and PeraWallet? Why not integrate Stripe, Razorpay, or PayPal like a normal SaaS platform?**
**Answer:** It comes down to unit economics and micro-transactions. If a consumer asks an AI a short question that costs $0.001 to process, using Stripe is mathematically impossible because Stripe charges a base fee of $0.30 + 2.9% per transaction. Our margin would instantly be negative. By using Algorand via PeraWallet, transaction fees are fractions of a penny (~$0.0001), and settlement happens in under 3 seconds. Web2 gateways also require heavy KYC, bank routing, and localized fiat. Web3 allows borderless, permissionless, machine-to-machine streaming payments globally from day one.

**Q2: You're paying OpenAI, Google, and Llama in strict USD, but you charge users in highly volatile ALGO. How do you prevent a crypto market crash from destroying your margins?**
**Answer:** We foresaw this risk and engineered a **Dynamic Pricing Oracle** directly into the core routing layer (`gateway.py` / `chat.py`). We do not hardcode crypto prices for our default models. When a user queries a model, the system calculates the exact API wholesale cost in USD, applies our fixed 3x profit margin, and *then* fetches the live ALGO/USD exchange rate. We dynamically convert that exact USD value into MicroALGO at the exact millisecond of execution. This permanently shifts volatility risk away from the platform and mathematically locks in our ~66% gross margin regardless of the crypto market.

Here is the exact Unit Economics breakdown for our 3x Markup Model (Prices per 1 Million Tokens):

| Model Name | True Provider Cost (Per 1M Tokens) | Target Price to User (3x Markup) | Estimated ALGO Rate (at ~$0.09/ALGO) |
| :--- | :--- | :--- | :--- |
| **Gemini 1.5 Flash** | In: $0.075 / Out: $0.30 | In: $0.22 / Out: $0.90 | In: ~2.50 ALGO / Out: ~10.00 ALGO |
| **GPT-4o Mini** | In: $0.150 / Out: $0.60 | In: $0.45 / Out: $1.80 | In: ~5.00 ALGO / Out: ~20.00 ALGO |
| **Llama 3.3 (70b)** | In: $0.590 / Out: $0.79 | In: $1.77 / Out: $2.37 | In: ~19.50 ALGO / Out: ~26.00 ALGO |
| **Qwen 2.5 (72B)** | In: $0.400 / Out: $0.40 | In: $1.20 / Out: $1.20 | In: ~13.00 ALGO / Out: ~13.00 ALGO |

**Q3: Security is my biggest concern. If your centralized backend database gets breached, how much of the users' money can the hacker steal?**
**Answer:** Absolutely zero. Our backend is entirely stateless regarding financial custody. We utilize a strict **On-Chain Escrow** architecture. User funds are held directly inside the Algorand Smart Contract (`PayPerUseAI`), not our database. Our backend API only possesses the authorization to trigger the `request_service_v2` atomic transaction to deduct the exact token cost for verified AI usage. A hacker could corrupt our database, but they cannot withdraw the ALGO because global withdrawal operations require the cryptographic signature of the user’s PeraWallet. The trust is placed in the cryptography, not our servers.

**Q4: For your Creator Marketplace, you force developers to bring their own API keys (BYOK). Why not route it all through your platform's enterprise keys to maintain control?**
**Answer:** Scalability and liability. If 10,000 creators build agents on our platform, routing all traffic through our keys creates massive financial liability and rate-limit bottlenecks. By utilizing a BYOK model, the creator bears the API costs and the infrastructure risk. We provide the marketplace interface and the smart-contract settlement layer. The contract automatically intercepts a hardcoded **10% volume fee** on every query before depositing the 90% remainder to the creator. It gives us pure, infinite-margin volume revenue with absolutely zero API overhead.

---

### Part 2: Blockchain Integration & Protocol Mechanics

**Q5: I see you are utilizing the HTTP 402 "Payment Required" protocol. Why is this technically significant for your stack?**
**Answer:** HTTP 402 was originally proposed by the creators of the internet in 1991 for digital cash, but it was essentially abandoned because the internet lacked a native, trustless settlement layer. We have actively resurrected it. In our architecture, the API gateway intercepts requests, mathematically calculates token limits, and throws a cryptographic 402 challenge. The user’s wallet signs the transaction, and the gateway validates the on-chain state. We aren't just building an app; we are building a true M2M (Machine-to-Machine) protocol for AI bandwidth.

**Q6: How do you prevent "Double-Spend" or race-condition attacks? What if a user with only $0.05 in their wallet spams 10 heavy AI prompts simultaneously?**
**Answer:** We implemented a **Two-Phase Lock** mechanism connected to Algorand's Atomic Transactions. Before streaming the AI response, the backend hits the smart contract via `precheck_session_balance`. Once the generation is complete, the backend issues an Atomic Transaction to settle the exact token count. If the user's simultaneous prompts deplete their on-chain balance mid-stream, the Atomic Transaction natively fails at the blockchain consensus layer. Our backend instantly catches the rejection and severs their WebSockets/SSE stream, preventing them from extracting unpaid API bandwidth.

**Q7: Users don't want to sign a PeraWallet transaction for every single $0.001 prompt. How did you solve the UX friction of blockchain transactions?**
**Answer:** We implemented a **Session-Based Escrow Allocation**. Instead of signing per-query, the user signs one `start_session` transaction that authorizes a "Max Spend Limit" and a "Time Expiry" inside the smart contract's state (`self.session_balances`). For the duration of the session, the backend seamlessly deducts micro-amounts from this pre-authorized limit without requiring further PeraWallet popups. When the session expires, the `auto_refund_session` method sweeps unspent ALGO directly back to the user's base wallet.

**Q8: Your smart contract is written in Python using `algopy` (Puya compiler). Why not use Reach, PyTeal, or raw TEAL for performance?**
**Answer:** Algorand recently transitioned to native Python compilation via Puya (ARC4 standard). Writing the contract in purely typed Python (`algopy`) allows our Web2 engineers to natively audit the Web3 logic without learning obscure assembly languages like TEAL. It provides strict type-safety, ARC4 ABI compliance, and generates highly optimized TEAL bytecode under the hood that is just as gas-efficient as legacy PyTeal, but drastically easier to maintain and upgrade.

---

### Part 3: Deep Technical Features & Cryptography

**Q9: What is "Sign-In With Algorand" (SIWA) and why did you choose it over standard OAuth or JWT email authentication?**
**Answer:** SIWA fundamentally removes database liability. We do not store passwords, salts, or emails. The user authenticates by signing a cryptographic payload with their private key in PeraWallet. Our backend (`security.py`) cryptographically verifies the ed25519 signature. If valid, we issue a stateless JWT tied specifically to their wallet address. This guarantees that the user communicating with our backend is the absolute owner of the wallet holding the funds, eliminating password-based identity theft entirely.

**Q10: You have a "Proof of Intelligence" feature that logs data to the blockchain. What exactly is being logged, and what problem does this solve?**
**Answer:** In the age of AI, proving that a specific output was generated by a specific model at a specific time is becoming critical (e.g., preventing deepfakes or proving copyright). When an AI completes a response, our backend hashes both the user's prompt and the AI's response using SHA-256. It then calls the `log_proof` method on the smart contract. This permanently etches an immutable, timestamped receipt of the generation into the blockchain's state. Anyone can later hash the raw text and verify it matches the on-chain signature, guaranteeing authenticity.

**Q11: The platform mints NFTs based on AI outputs. How does the backend securely command the smart contract to mint an asset without compromising the contract's authority?**
**Answer:** We utilize **Inner Transactions (ITXN)** within the Algorand Virtual Machine (AVM). The backend (which is strictly the `owner` of the contract) calls the `mint_nft` ARC4 method. The smart contract itself, acting as its own sovereign entity, programmatically constructs an Asset Configuration inner transaction (ARC-69 standard). The contract mints the asset to itself, and then immediately executes a second inner transaction—an Asset Transfer—sending the NFT directly to the user's wallet. The backend never touches the asset; it merely passes the IPFS metadata URL to the contract for execution.

**Q12: AI generation takes time. Blockchain settlement takes time. How do you combine both without forcing the user to stare at a loading screen for 10 seconds?**
**Answer:** Decoupling via **Server-Sent Events (SSE)**. When a prompt hits `chat.py`, we immediately do a sub-millisecond local DB cache check for balance. If clear, we instantly open an SSE stream and stream the AI's response chunks to the UI in real-time (yielding sub-second Time-To-First-Token). The heavy blockchain settlement (`AtomicTransactionComposer`) is pushed to the very end of the stream, executed asynchronously. The user gets the fast, snappy experience of ChatGPT, while the cryptographic settlement happens silently in the background milliseconds after the final token is generated.

---

### Part 4: Scalability & Load

**Q13: What happens if 10,000 users log in and send prompts at the exact same time? How does your architecture handle massive concurrent load?**
**Answer:** Our architecture is inherently built to scale horizontally across all three major bottleneck vectors (Database, API, and Blockchain):
1. **Stateless Authentication:** Because our SIWA (Sign-In With Algorand) uses cryptographically signed JWTs, the backend verifies 10,000 logins purely in CPU memory without requiring a single database lookup. There are zero database locks during peak login spikes.
2. **Asynchronous Non-Blocking I/O:** The entire backend is built on FastAPI and `asyncpg`. When 10,000 users stream data via Server-Sent Events, the server simply holds the async sockets open without blocking system threads.
3. **Decentralized API Sharding (BYOK):** In a traditional SaaS, 10,000 simultaneous users would instantly hit OpenAI's enterprise rate limits, crashing the service. Because our Creator Marketplace uses a "Bring Your Own Key" model, the API load is decentralized and sharded across thousands of independent creator API keys.
4. **10k TPS Blockchain:** Algorand natively processes 10,000 Transactions Per Second (TPS) with 3-second absolute finality. Unlike Ethereum or Solana, Algorand will not congest or spike in gas fees during a massive influx of 10,000 simultaneous `request_service_v2` atomic settlements.

---

### Part 5: Target Market & Go-To-Market Strategy (GTM)

**Q14: Who is your exact target customer? What specific pain point are you solving for them?**
**Answer:** We are building for a two-sided marketplace, solving massive friction on both ends:
1. **The Consumer ("Subscription Fatigue"):** Students, freelancers, and power users are exhausted by paying $20/mo to OpenAI, $20/mo to Google, and $20/mo to Anthropic. They only use a fraction of their quotas. We solve this by allowing them to use *all* premium models on a single dashboard, switching instantly, and paying exactly $0.001 per query with zero monthly commitments or vendor lock-in.
2. **The Creator (Frictionless Monetization):** Prompt engineers and indie hackers build amazing custom AI agents, but monetizing them is a nightmare. Setting up Stripe requires a registered business, bank accounts, and handling chargebacks. We solve this by allowing them to plug in an API key and instantly monetize their agent globally via Web3, receiving 90% of the revenue settled natively to their wallet in under 3 seconds.

**Q15: A two-sided marketplace is notoriously hard to start. How exactly will you acquire your first 10 to 1,000 active users?**
**Answer:** We will use a targeted, incentive-driven "Supply-First" Go-To-Market strategy:
* **Step 1: Bootstrap the Supply (0 to 100 Creators):** We will actively recruit in Web3 developer Discords (e.g., Algorand Devs) and AI subreddits. We will offer a "0% Platform Fee for the first 30 days" promotion to incentivize developers to deploy high-quality, niche AI agents on our platform.
* **Step 2: Leverage Creator Audiences (100 to 1,000 Users):** Creators naturally want users to interact with their agents so they can earn ALGO. By providing creators with direct shareable links to their custom agents, *the creators become our marketing arm*. When a creator posts on Twitter, "I built an expert smart-contract auditing agent, try it here," they bring their existing audience directly to our platform.
* **Step 3: The Micro-Airdrop Growth Hack:** To overcome the friction of funding a crypto wallet, we will automatically airdrop a micro-grant (e.g., $0.10 worth of ALGO) to the first 1,000 unique wallets that connect. Because our queries cost fractions of a penny, that $0.10 allows a new user to run over 100 premium AI queries immediately. This creates an instant "Aha!" moment, proving the magic of streaming micro-transactions before asking them to deposit their own money.
