# ⚡ WattTogether: Trust-Minimized Web 2.5 Governance for Renewable Energy

<div align="center">

**Transparent community funding with on-chain escrow and milestone governance**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-Solidity-FFF100?style=for-the-badge&logo=ethereum&logoColor=black)](https://hardhat.org/)

</div>

---

## 🚀 Overview

**WattTogether** is a full-stack crowdfunding dApp where campaigns are funded transparently and funds are managed through milestone-based governance.

The project is aligned with **UN Sustainable Development Goal 7 (SDG 7): Affordable and Clean Energy**.

### 💡 The Problem We Solve

Traditional crowdfunding platforms often struggle with:
- Low transparency after funds are raised
- Limited donor control over milestone execution
- Difficult trust-building between creators and supporters

### ✨ Our Approach

WattTogether combines a web app, backend automation, and smart contracts to:
- Route campaign funds through escrow-backed on-chain flows
- Add milestone submission, governance actions, and refund handling
- Give both creators and supporters a more accountable funding process

## Repository Structure

```text
WattTogether/
|- backend/      # API server, blockchain integration, contracts, scripts
|- frontend/     # React application (Vite)
```

## Tech Stack

- Frontend: React, Vite, Redux Toolkit, Tailwind CSS, Privy, Wagmi, Ethers
- Backend: Node.js, Express, MongoDB (Mongoose), Socket.IO, Ethers, Hardhat
- Blockchain: Solidity contracts deployed to Polygon Amoy (testnet)
- Storage/Services: Pinata (IPFS), SMTP (email), Coinbase integrations

## Quick Start (Local Development)

### 1. Prerequisites

- Node.js 18+ (Node 20 recommended)
- npm
- MongoDB connection string
- Polygon Amoy RPC URL

### 2. Backend Setup

```bash
cd backend
npm install
# macOS/Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Update `backend/.env` with your real values (at minimum):
- `MONGO_URI`
- `PORT` (default `5000`)
- `FRONTEND_URL` (default `http://localhost:5173`)
- `PRIVY_APP_ID` and `PRIVY_APP_SECRET`
- `POLYGON_AMOY_RPC_URL` (and/or `POLYGON_AMOY_RPC`)
- `DEPLOYER_PRIVATE_KEY`
- `USDC_TOKEN_ADDRESS` (or `USDC_TOKEN_ADDRESS_AMOY`)

Start backend:

```bash
node index.js
```

Backend base URL (default): `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
# macOS/Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Update `frontend/.env`:
- `VITE_API_GATEWAY_URL` (usually `http://localhost:5000/api`)
- `VITE_PRIVY_APP_ID`
- `VITE_COINBASE_APP_ID`
- `VITE_GUARDIAN_ADDRESS`

Start frontend:

```bash
npm run dev
```

Frontend URL (default): `http://localhost:5173`

### 4. Verify the App

- Open `http://localhost:5173`
- Verify backend health at `http://localhost:5000/` (returns API running message)

## Key Backend Route Groups

All mounted under `/api`:
- `/api/members`
- `/api/campaigns`
- `/api/donations`
- `/api/kyc`
- `/api/faucet`
- `/api/network`
- `/api/milestones`
- `/api/governance`
- `/api/milestone-comments`

Admin helper endpoint:
- `POST /api/admin/trigger-milestone-execution`

## Smart Contracts (Hardhat)

Contracts are in `backend/contracts`.

Common commands:

```bash
cd backend
npx hardhat compile
npx hardhat test
```

Network config is in `backend/hardhat.config.js`.

## Notes

- Frontend expects API routes to include `/api` in `VITE_API_GATEWAY_URL`.
- Milestone governance and execution rely on correct blockchain and relayer environment configuration.
