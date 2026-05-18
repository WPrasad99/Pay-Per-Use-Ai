# ⛓️ Pay-Per-Use-AI: Algorand Smart Contract Specifications

This document outlines the on-chain specifications, states, parameters, and deployment of the Pay-Per-Use-AI smart contract deployed on the Algorand Testnet.

---

## 🚀 1. Deployed Contracts Details
* **Algorand Network:** Testnet
* **Algod Node Provider:** [AlgoNode Testnet](https://testnet-api.algonode.cloud)
* **Indexer Node Provider:** [AlgoNode Indexer](https://testnet-idx.algonode.cloud)
* **Platform Wallet Address:** `B5BMUKJFHX6TKTSCIBVFOHJ76J4VG4PJ6C4YXSOPBTWVOVD22O3DDVYUNY`
* **Active Smart Contract (v3):** Application ID `762551954`
  * [Pera Wallet Testnet Explorer Link](https://testnet.explorer.perawallet.app/application/762551954/)

---

## 📐 2. Contract State & Storage Rules

The contract utilizes **Global State** for platform-wide metrics and **Box Storage** (under the ARC-0060 Box Map layout) for dynamic session-level escrow allocations to optimize storage costs.

### Global State Schema
| Key Name | Type | Description |
| --- | --- | --- |
| `platform_address` | Byte Slice (Address) | Address that receives the 10% platform hosting splits |
| `platform_fee_percent` | Integer (uint64) | Platform cut of queries (configured to `10`) |
| `creator_fee_percent` | Integer (uint64) | Creator cut of queries (configured to `90`) |
| `total_agents_created` | Integer (uint64) | Global counter of AI agents published across the platform |
| `total_sessions_active` | Integer (uint64) | Counter of active on-chain user sessions |

### Box Storage Schema (Session Escrow Map)
Instead of storing user profiles inside expensive global allocations, session states are stored in Algorand **Boxes** keyed by a combination of the user's wallet address and the agent's ID:
`Box Key: [User Wallet Address (32 bytes)] + [Agent ID (8 bytes)]`

Each box contains:
* **Escrow Balance (uint64)**: Remaining MicroAlgo balance allocated for this chat session.
* **Expiration Timestamp (uint64)**: Unix timestamp after which the session expires (24-hour duration).
* **Authorized Flag (uint8)**: Set to `1` when session is initialized, enabling background settlement.

---

## 🛠️ 3. Contract Actions (ABI Methods)

The smart contract supports four key operations:

### 1. `initialize_session`
* **Type**: Application Call + Payment Transaction
* **Description**: User starts an AI agent session by signing a payment transaction that locks a **1 ALGO escrow buffer** inside the contract's secure Box state.
* **Args**:
  * `agent_id` (uint64)
  * `escrow_deposit` (Payment transaction)

### 2. `settle_tokens`
* **Type**: Application Call (Signed by Platform Backend)
* **Description**: Initiated upon query completion to settle MicroAlgo deductions based on the exact tokens consumed (input + output).
* **Flow**:
  * 90% of the token cost is sent directly to the **Creator's Wallet Address**.
  * 10% is sent to the **Platform Wallet Address**.
  * The remaining escrow balance in the Box is updated.

### 3. `end_session`
* **Type**: Application Call (Signed by User)
* **Description**: User voluntarily closes the chat session.
* **Outcome**: The remaining escrow balance inside the Box is refunded directly back to the user's wallet, and the Box storage allocation is deleted to reclaim transaction fees.

### 4. `publish_agent`
* **Type**: Application Call (Signed by Creator)
* **Description**: Creator registers their AI Agent on-chain. Writes metadata hash and secure encrypted BYOK keys directly to the blockchain ledger.

---

## 🚀 4. Deployment & Compilation Instructions

To compile the smart contract using PyTeal and deploy it to the Algorand Testnet:

### Step 1: Set Up PyTeal Environment
Navigate to the `contract` directory:
```bash
cd contract
pip install pyteal algosdk
```

### Step 2: Compile Contract Codes
Compile the approval and clear state Teal scripts:
```bash
python build_contract.py
```
This generates `approval.teal` and `clear.teal`.

### Step 3: Run Deployment Script
Deploy the contract to Algorand Testnet:
```bash
python deploy_v3.py
```
Upon successful deployment, update your backend `.env` file with the newly generated Application ID:
```env
ALGORAND_APP_ID_V3=your_new_app_id
```
