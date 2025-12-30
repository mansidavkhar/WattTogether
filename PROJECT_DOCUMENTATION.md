# WattTogether - Complete Project Documentation

**Version:** 2.0  
**Last Updated:** December 25, 2025  
**Network:** Polygon Amoy Testnet (Chain ID: 80002)  
**Status:** Production Ready

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Core Features](#core-features)
5. [Smart Contracts](#smart-contracts)
6. [Backend Services](#backend-services)
7. [Frontend Application](#frontend-application)
8. [Authentication & Security](#authentication--security)
9. [Database Schema](#database-schema)
10. [API Endpoints](#api-endpoints)
11. [Deployment & Infrastructure](#deployment--infrastructure)
12. [User Flows](#user-flows)
13. [Development Setup](#development-setup)

---

## 🎯 Project Overview

**WattTogether** is a decentralized crowdfunding platform (dApp) built on the Polygon blockchain that enables transparent, milestone-based fundraising for renewable energy and social impact projects. The platform combines traditional fiat payment experiences with blockchain technology to create a user-friendly, gasless donation system with built-in governance.

### Key Differentiators

- **Zero Gas Fees for Users**: Backend relayer handles all blockchain transactions
- **Fiat-First UX**: Users donate in INR (Indian Rupees), backend converts to crypto
- **Passwordless Authentication**: Privy-powered email-based login with embedded wallets
- **Donor Governance**: Milestone voting system gives donors control over fund release
- **KYC Integration**: Built-in verification for campaign creators
- **Real-time Updates**: Socket.io for live campaign progress and notifications

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                        │
│  - Privy Auth (Email-based, Embedded Wallets)                  │
│  - Vite Build System                                            │
│  - TailwindCSS Styling                                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ REST API + Socket.io
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      BACKEND (Node.js/Express)                  │
│  - Privy Server Auth                                            │
│  - Ethers.js (Blockchain Interface)                             │
│  - MongoDB (Data Storage)                                       │
│  - Relayer Wallet (Gas Sponsor)                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ JSON-RPC
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                  POLYGON AMOY TESTNET                           │
│  - ProjectEscrow Smart Contracts (Per Campaign)                 │
│  - ERC20 Tokens (USDC for testing)                              │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow: Donation Processing

```
User (Frontend)
     │
     │ 1. Submit ₹5000 INR donation
     │
     ▼
Backend API
     │
     ├─ 2. Verify Privy auth token
     ├─ 3. Validate campaign & amount
     ├─ 4. Convert INR to ETH (₹5000 / 85 = ~58.8 MATIC equivalent)
     │
     ▼
Relayer Wallet
     │
     │ 5. Sign & send transaction
     │    escrow.depositForDonor(donorAddress, { value: amount })
     │
     ▼
Smart Contract (ProjectEscrow)
     │
     ├─ 6. Record contribution
     ├─ 7. Lock funds in escrow
     ├─ 8. Emit DonationReceived event
     │
     ▼
Backend (Transaction Complete)
     │
     ├─ 9. Save donation to MongoDB
     ├─ 10. Update campaign.amountRaised
     ├─ 11. Check if goal reached
     ├─ 12. Emit Socket.io event
     │
     ▼
Frontend (UI Update)
     │
     └─ 13. Display success, show tx hash, update progress
```

---

## 🛠️ Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.1.0 | UI Framework |
| Vite | Latest | Build Tool & Dev Server |
| TailwindCSS | 4.0.6 | Styling Framework |
| React Router | 7.7.1 | Client-side Routing |
| Privy React Auth | 3.9.1 | Authentication & Wallet Management |
| Ethers.js | 6.15.0 | Blockchain Interaction |
| Wagmi | 2.19.5 | React Hooks for Ethereum |
| Axios | 1.12.2 | HTTP Client |
| Redux Toolkit | 2.9.0 | State Management |
| React Markdown | 10.1.0 | Markdown Rendering |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | Latest | Runtime Environment |
| Express | 5.1.0 | Web Framework |
| MongoDB | 8.18.1 (Mongoose) | Database |
| Ethers.js | 6.15.0 | Smart Contract Interaction |
| Privy Server Auth | 1.32.5 | Auth Token Verification |
| Socket.io | 4.8.1 | Real-time Communication |
| JWT | 9.0.2 | Token-based Auth (Legacy) |
| Multer | 2.0.2 | File Upload Handling |
| Bcrypt.js | 3.0.2 | Password Hashing |
| Coinbase CDP SDK | 1.38.4 | Crypto Services (Optional) |

### Blockchain

- **Network**: Polygon Amoy Testnet
- **Smart Contract Language**: Solidity ^0.8.20
- **Contract Architecture**: ProjectEscrow (deployed per campaign)
- **Gas Sponsor**: Backend relayer wallet

### Infrastructure

- **Containerization**: Docker + Docker Compose
- **Version Control**: Git
- **Environment Management**: dotenv

---

## ✨ Core Features

### 1. Campaign Management

#### For Campaign Creators:
- **Create Campaigns**: Deploy new fundraising campaigns with custom goals
- **Escrow Deployment**: Automatic smart contract deployment per campaign
- **Milestone Management**: Submit spending requests with descriptions
- **Fund Release**: Release approved milestone funds to beneficiary wallet
- **Campaign Analytics**: Track donations, backers, and progress
- **Campaign Closure**: Close campaigns when complete or failed

#### For Donors/Investors:
- **Browse Campaigns**: Filter by status, category, funding progress
- **View Details**: Campaign description, entrepreneur bio, milestones
- **Track Investments**: Dashboard showing all donations and statuses
- **Donation History**: Complete transaction history with blockchain proof

### 2. Donation System (V2)

#### Gasless Donations:
- Users donate in fiat (INR)
- Backend converts to crypto automatically
- No wallet connection required from user
- No gas fees paid by users
- Transaction hash provided for verification

#### Features:
- INR to crypto conversion (configurable rate)
- Relayer-based transaction submission
- MongoDB donation records
- Real-time campaign progress updates
- Automatic goal completion detection

### 3. Milestone Governance System

#### Milestone Submission:
- Creators submit spending requests
- Include amount and description
- Stored both on-chain and off-chain

#### Voting Mechanism:
- Only donors can vote
- Voting weight: 1 vote per donor (regardless of donation amount)
- Vote options: Upvote (approve) or Downvote (reject)
- Approval threshold: >50% upvotes

#### Fund Release:
- Only approved milestones can release funds
- Creator initiates release transaction
- Funds transfer directly to beneficiary wallet
- Transaction recorded on-chain with txHash

### 4. KYC Verification

#### Submission Process:
- Members upload identity documents
- Multiple file upload support
- Files stored in `uploads/kyc/` directory
- Status automatically set to "pending"

#### Admin Review:
- Dedicated admin panel (`/member/admin-kyc`)
- View all pending KYC submissions
- Approve or reject with reasons
- Document preview functionality

#### KYC States:
- **none**: No submission yet
- **pending**: Awaiting admin review
- **verified**: Approved by admin
- **rejected**: Rejected with reason

### 5. Professional Networking

#### Profile Features:
- Bio and location
- Profile picture upload
- Profile setup completion tracking

#### Connection System:
- Search members by name/email
- Send connection requests
- View all connections
- Real-time messaging (Socket.io)

#### Messaging:
- Direct messages between connections
- Message history storage
- Real-time delivery
- Typing indicators

### 6. Authentication & Wallet Management

#### Privy Integration:
- Email-based passwordless login
- Magic link authentication
- Automatic embedded wallet creation
- No seed phrase management for users
- Support for Polygon Amoy chain

#### Wallet Features:
- View wallet address
- Check balances (MATIC, tokens)
- Transaction history
- Wallet provider for dApp interactions

### 7. Development Tools

#### Test Faucet:
- Fund user wallets with test USDC
- Configurable token amounts
- Auto-mint or transfer mode
- Support for any ERC20 token

---

## 📜 Smart Contracts

### ProjectEscrow V3

**Purpose**: Escrow contract for individual campaigns with milestone-based fund release

**Location**: `backend/contracts/ProjectEscrowV3.sol`  
**Compiler**: Solidity ^0.8.20  
**Deployment**: One contract instance per campaign

#### Key State Variables

```solidity
address public relayer;              // Backend wallet
address public projectCreator;       // Beneficiary wallet
uint256 public targetAmount;         // Fundraising goal (in wei)
uint256 public totalDeposited;       // Total raised so far
uint256 public totalReleased;        // Total released to creator
bool public campaignActive;          // Accepting donations?
```

#### Core Functions

##### `depositForDonor(address _donor) payable`
- **Caller**: Relayer only
- **Purpose**: Deposit funds on behalf of a donor
- **Parameters**: Donor's wallet address
- **Events**: `DonationReceived(donor, amount, timestamp)`

##### `addMilestone(uint256 amount, string memory description)`
- **Caller**: Relayer only
- **Purpose**: Add spending request to contract
- **Parameters**: Amount in wei, description text
- **Storage**: Appends to `milestones[]` array

##### `releaseMilestoneFunds(uint256 milestoneId, uint256 amount)`
- **Caller**: Relayer only
- **Purpose**: Release approved milestone funds
- **Validations**: 
  - Milestone exists
  - Not already released
  - Sufficient balance
- **Events**: `MilestoneReleased(milestoneId, amount, recipient)`

##### `closeCampaign()`
- **Caller**: Relayer only
- **Purpose**: Stop accepting new donations
- **Effect**: Sets `campaignActive = false`
- **Events**: `CampaignClosed(totalRaised, timestamp)`

##### `emergencyWithdraw()`
- **Caller**: Relayer only
- **Purpose**: Recover funds if campaign closed
- **Requires**: Campaign must be inactive

#### Additional Features

- **receive() function**: Accept direct ETH transfers
- **fallback() function**: Handle unexpected calls
- **View functions**: 
  - `getContributorCount()`
  - `getMilestoneCount()`
  - `getMilestone(id)`
  - `getBalance()`

#### Events

```solidity
event DonationReceived(address indexed contributor, uint256 amount, uint256 timestamp);
event MilestoneReleased(uint256 indexed milestoneId, uint256 amount, address indexed recipient);
event CampaignClosed(uint256 totalRaised, uint256 timestamp);
event DirectEthReceived(address indexed sender, uint256 amount, uint256 timestamp);
```

---

## 🔧 Backend Services

### Server Configuration

**Framework**: Express 5.1.0  
**Port**: 5000 (exposed as 5001 in Docker)  
**Entry Point**: `backend/index.js`

### Controllers

#### 1. Campaign Controller (`campaignController.js`)

**Endpoints**: `/api/campaigns/*`

**Key Functions**:

- `createCampaign()`: 
  - Validates campaign data
  - Loads ProjectEscrowV2 contract artifacts
  - Deploys new escrow contract instance
  - Saves campaign to MongoDB with contract address
  - Returns campaign + contract details

- `getAllCampaigns()`: List all campaigns with filters
- `getCampaignById()`: Get single campaign details
- `getMyCampaigns()`: Get campaigns created by current user
- `updateCampaign()`: Update campaign details
- `deleteCampaign()`: Soft delete campaign

**Contract Deployment Flow**:
```javascript
1. Load contract ABI + bytecode from artifacts
2. Connect to Polygon Amoy RPC
3. Create ContractFactory with deployer wallet
4. Convert INR goal to Wei
5. Deploy contract with (creatorAddress, targetAmount)
6. Wait for deployment transaction
7. Save contract address to campaign document
```

#### 2. Donation Controller V2 (`donationControllerV2.js`)

**Endpoints**: `/api/donations/*`

**Key Functions**:

- `submitDonation()`:
  ```javascript
  1. Verify Privy auth token
  2. Get donor wallet address
  3. Find campaign + verify status
  4. Convert INR to ETH
  5. Load escrow contract
  6. Sign tx with relayer wallet
  7. Call escrow.depositForDonor(donor, {value: amount})
  8. Wait for transaction receipt
  9. Save donation to DB
  10. Update campaign.amountRaised
  11. Check if goal reached → change status
  12. Return donation + txHash
  ```

- `getDonationHistory()`: User's all donations
- `getCampaignDonations()`: All donations for a campaign (creator only)
- `getEscrowStatus()`: Query contract state (totalDeposited, balance, etc.)

#### 3. Milestone Controller (`milestoneController.js`)

**Endpoints**: `/api/milestones/*`

**Key Functions**:

- `submitMilestone()`:
  - Validates creator owns campaign
  - Calls `escrow.addMilestone()`
  - Saves milestone to MongoDB
  - Returns milestone with txHash

- `getCampaignMilestones()`: List all milestones for campaign
- `voteOnMilestone()`:
  - Verifies voter is a donor
  - Records vote (up/down)
  - Calculates approval percentage
  - Updates status if >50% approved

- `releaseMilestoneFunds()`:
  - Verifies milestone approved
  - Calls `escrow.releaseMilestoneFunds()`
  - Transfers funds to creator wallet
  - Updates status to "released"

#### 4. Member Controller (`memberController.js`)

**Endpoints**: `/api/members/*`

**Key Functions**:

- `registerMember()`: Create new member account
- `loginMember()`: Authenticate and return JWT
- `getMemberProfile()`: Get current user profile
- `updateMemberProfile()`: Update profile details
- `getMemberByPrivyId()`: Lookup by Privy user ID

#### 5. KYC Controller (`kycController.js`)

**Endpoints**: `/api/kyc/*`

**Key Functions**:

- `submitKYC()`:
  - Accepts file uploads via Multer
  - Saves files to `uploads/kyc/`
  - Updates member document
  - Sets status to "pending"

- `getKYCStatus()`: Check current user's KYC status
- `getPendingKYC()`: Admin - list all pending submissions
- `approveKYC()`: Admin - approve submission
- `rejectKYC()`: Admin - reject with reason
- `getAllKYC()`: Admin - all submissions (any status)

#### 6. Network Controller (`networkController.js`)

**Endpoints**: `/api/network/*`

**Key Functions**:

- `updateProfile()`: Update bio, location, profile picture
- `searchMembers()`: Search by name/email
- `connectWithMember()`: Add connection
- `getConnections()`: List user's connections
- `sendMessage()`: Send direct message
- `getMessages()`: Retrieve message history

#### 7. Faucet Controller (`faucetController.js`)

**Endpoints**: `/api/faucet/*`

**Key Functions**:

- `fundUserWithTestUSDC()`:
  - Validates recipient address
  - Converts amount to token decimals
  - Attempts mint (if DEV_FAUCET_AUTO_MINT=true)
  - Falls back to transfer from deployer
  - Returns transaction hash

### Middleware

#### `authMiddleware.js`

**Purpose**: Verify Privy auth tokens and populate `req.member`

**Flow**:
```javascript
1. Extract Authorization header (Bearer token)
2. Verify token with Privy API
3. Get Privy user ID from verified claims
4. Look up member in MongoDB by privyUserId
5. Attach member to req.member
6. Continue to route handler
```

### Socket.io Integration

**File**: `socket/socketHandler.js`

**Events**:
- `connection`: Client connects
- `disconnect`: Client disconnects
- `message`: Send/receive messages
- `campaign_update`: Real-time campaign updates
- `donation_received`: Notify of new donations
- `milestone_update`: Milestone status changes

**Usage**:
```javascript
const io = getIO();
io.emit('donation_received', { campaignId, amount, donor });
```

---

## 🎨 Frontend Application

### Project Structure

```
frontend/src/
├── assets/           # Static assets, featured projects data
├── components/       # Reusable UI components
│   ├── navbar/      # Navigation components
│   ├── featured_projects/
│   ├── testimonials/
│   ├── CampaignCard.jsx
│   ├── DonationModal.jsx
│   ├── DonationModalV2.jsx
│   ├── MilestonesPanel.jsx
│   └── ...
├── context/         # React Context providers
│   └── PrivyAuthProvider.jsx
├── hooks/           # Custom React hooks
│   └── useMemberAuth.js
├── pages/           # Page components (routes)
│   ├── AdminKYCPanel.jsx
│   ├── BrowseCampaigns.jsx
│   ├── CampaignDescription.jsx
│   ├── KYCSubmission.jsx
│   ├── LoginRegister.jsx
│   ├── MainLandingPage.jsx
│   ├── MyInvestments.jsx
│   ├── Network.jsx
│   ├── StartACampaign.jsx
│   └── ...
├── store/           # Redux store (if used)
├── App.jsx          # Main app component with routing
└── main.jsx         # Entry point
```

### Key Components

#### DonationModalV2.jsx

**Purpose**: Gasless donation flow using backend relayer

**Features**:
- INR amount input
- Campaign details display
- Progress indicator (Step 1-4)
- Transaction status tracking
- Success screen with tx hash
- Error handling

**Flow**:
```jsx
Step 1: User enters INR amount
   ↓
Step 2: Confirm donation details
   ↓
Step 3: Backend processes (relayer deposits)
   ↓
Step 4: Success - show tx hash, update progress
```

**Key Code**:
```javascript
const handleDonate = async () => {
  const response = await axios.post('/api/donations/submit', {
    campaignId,
    inrAmount
  }, {
    headers: { Authorization: `Bearer ${privyToken}` }
  });
  
  setTxHash(response.data.txHash);
  setStep(4); // Success
};
```

#### MilestonesPanel.jsx

**Purpose**: Display and vote on campaign milestones

**Features**:
- Milestone list with status badges
- Vote up/down buttons (for donors)
- Approval progress bar
- Release button (for creators)
- Transaction hash links

**Milestone States**:
- **Pending**: Awaiting votes
- **Approved**: >50% upvotes, ready to release
- **Rejected**: <50% upvotes
- **Released**: Funds transferred

#### CampaignCard.jsx

**Purpose**: Campaign preview card for browse/search

**Features**:
- Cover image
- Title, description preview
- Funding progress bar
- Amount raised / goal
- Backer count
- Status badge
- "View Details" link

#### LoginRegister.jsx

**Purpose**: Authentication page using Privy

**Features**:
- Email input for magic link
- Privy authentication flow
- Automatic embedded wallet creation
- Redirect to member area on success

**Code**:
```javascript
const { login, authenticated, user, getAccessToken } = usePrivy();

const handleLogin = async () => {
  await login();
  const token = await getAccessToken();
  // Save token, redirect
};
```

### Pages

#### BrowseCampaigns.jsx
- Fetch all active campaigns
- Filter by status, category
- Search by title/description
- Display as grid of CampaignCards
- Pagination support

#### CampaignDescription.jsx
- Display full campaign details
- Show embedded wallet provider
- DonationModalV2 integration
- MilestonesPanel display
- Creator information
- Transaction history

#### MyInvestments.jsx
- User's donation history
- Filter by campaign
- Show amounts, dates, tx hashes
- Link to campaign pages
- Total invested summary

#### StartACampaign.jsx
- Multi-step form
- Campaign details input
- Cover image upload
- Beneficiary wallet address
- Funding goal (INR)
- Deadline selection
- Submit → deploys contract

#### ViewMyCampaigns.jsx
- List campaigns created by user
- Status indicators
- Edit/delete options
- View donations
- Manage milestones

#### KYCSubmission.jsx
- File upload form
- Document preview
- Submission status
- Rejection reason display

#### AdminKYCPanel.jsx
- List all pending KYC
- Document viewer
- Approve/reject buttons
- Bulk actions
- Status filtering

#### Network.jsx
- Search members
- Send connection requests
- View connections
- Direct messaging interface
- Profile management

---

## 🔐 Authentication & Security

### Privy Authentication

**Provider**: Privy ([@privy-io/react-auth](https://www.privy.io/))

**Configuration** (`PrivyAuthProvider.jsx`):
```javascript
<PrivyProvider
  appId={VITE_PRIVY_APP_ID}
  config={{
    loginMethods: ['email'],
    appearance: { theme: 'dark', accentColor: '#508C9B' },
    embeddedWallets: {
      createOnLogin: 'users-without-wallets',
      requireUserPasswordOnCreate: false
    },
    defaultChain: polygonAmoy,
    supportedChains: [polygonAmoy]
  }}
>
```

**Features**:
- Email-based magic link login
- No password required
- Automatic embedded wallet creation
- Wallet managed by Privy (no seed phrases)
- Support for Polygon Amoy testnet

### Backend Authentication

**Method**: Privy Server Auth

**Flow**:
```javascript
// authMiddleware.js
const { PrivyClient } = require('@privy-io/server-auth');
const privyClient = new PrivyClient(PRIVY_APP_ID, PRIVY_APP_SECRET);

async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  const verifiedClaims = await privyClient.verifyAuthToken(token);
  const member = await Member.findOne({ privyUserId: verifiedClaims.userId });
  req.member = member;
  next();
}
```

### Security Measures

1. **Token Verification**: All API requests verify Privy JWT
2. **Role-Based Access**: 
   - Only creators can manage their campaigns
   - Only donors can vote on milestones
   - Only admins can approve KYC
3. **Transaction Signing**: Only relayer wallet can submit transactions
4. **Input Validation**: Express-validator on all inputs
5. **File Upload Security**: Multer with file type/size restrictions
6. **CORS Configuration**: Restrict origins in production
7. **Environment Variables**: Sensitive keys in .env (not committed)

### Wallet Security

**Relayer Wallet**:
- Private key stored in `.env` (RELAYER_PRIVATE_KEY)
- Only backend has access
- Used to sponsor gas for all users
- Should be funded with MATIC for gas

**User Wallets**:
- Managed by Privy (embedded wallets)
- Keys stored encrypted by Privy
- Users can export wallet if desired
- No seed phrase required for basic usage

---

## 🗄️ Database Schema

### MongoDB Collections

#### Member Collection

```javascript
{
  _id: ObjectId,
  name: String,                    // Optional initially
  email: String (unique),          // Required
  privyUserId: String (unique),    // From Privy
  walletAddress: String (unique),  // Embedded wallet address
  password: String,                // Legacy (optional)
  
  // Networking
  bio: String,
  location: String,
  profilePicture: String,          // URL
  connections: [ObjectId],         // Refs to other Members
  profileSetupComplete: Boolean,
  
  // KYC
  kycStatus: String,               // 'none', 'pending', 'verified', 'rejected'
  kycDocuments: [String],          // File URLs
  kycSubmittedAt: Date,
  kycVerifiedAt: Date,
  kycRejectionReason: String,
  
  createdAt: Date,
  updatedAt: Date
}
```

#### Campaign Collection

```javascript
{
  _id: ObjectId,
  owner: ObjectId (ref: Member),
  
  // Basic Info
  title: String,
  fundingType: String,             // 'reward', 'donation', 'equity', 'debt'
  fundingGoalINR: Number,
  description: String,
  aboutEntrepreneur: String,
  coverImageUrl: String,
  
  // Dates
  fundingDeadline: Date,
  projectDeadline: Date,
  
  // Progress
  amountRaisedINR: Number,
  backersCount: Number,
  
  // Blockchain
  escrowContractAddress: String (required),
  beneficiaryAddress: String (required),
  
  // State
  status: String,                  // 'draft', 'active', 'funded', 'failed', 'cancelled'
  tags: [String],
  
  createdAt: Date,
  updatedAt: Date
}
```

#### Donation Collection

```javascript
{
  _id: ObjectId,
  member: ObjectId (ref: Member),
  campaign: ObjectId (ref: Campaign),
  
  amount: Number,                  // In INR
  currency: String,                // 'INR', 'MATIC', etc.
  txHash: String (unique),         // Blockchain tx hash
  
  date: Date
}
```

#### Milestone Collection

```javascript
{
  _id: ObjectId,
  campaignId: ObjectId (ref: Campaign),
  creatorId: ObjectId (ref: Member),
  
  amount: Number,                  // In INR
  description: String,
  
  // Governance
  status: String,                  // 'pending', 'approved', 'rejected', 'released'
  votes: [{
    voterId: ObjectId (ref: Member),
    vote: String,                  // 'up' or 'down'
    timestamp: Date
  }],
  upvotes: Number,
  downvotes: Number,
  
  // Blockchain
  onChainId: String,               // Index in contract's milestones array
  txHash: String,                  // Submission tx hash
  releaseTxHash: String,           // Release tx hash (if released)
  
  votingEndDate: Date,
  releasedAt: Date,
  createdAt: Date
}
```

#### Message Collection

```javascript
{
  _id: ObjectId,
  sender: ObjectId (ref: Member),
  recipient: ObjectId (ref: Member),
  content: String,
  read: Boolean,
  timestamp: Date
}
```

#### Connection Collection

```javascript
{
  _id: ObjectId,
  requester: ObjectId (ref: Member),
  recipient: ObjectId (ref: Member),
  status: String,                  // 'pending', 'accepted', 'rejected'
  createdAt: Date
}
```

---

## 🌐 API Endpoints

### Base URL
- Development: `http://localhost:5000/api`
- Docker: `http://localhost:5001/api`

### Authentication
All protected routes require:
```
Authorization: Bearer <PRIVY_JWT_TOKEN>
```

---

### Campaign Routes (`/api/campaigns`)

#### `POST /api/campaigns/create`
**Auth**: Required  
**Purpose**: Create new campaign and deploy escrow contract

**Request Body**:
```json
{
  "project_name": "Solar Farm Initiative",
  "amount": 500000,
  "description": "Installing solar panels...",
  "about_entrepreneur": "I'm an engineer...",
  "funding_deadline": "2026-12-31",
  "project_deadline": "2027-06-30",
  "beneficiary_address": "0x123...",
  "tags": ["solar", "renewable"]
}
```

**Response**:
```json
{
  "success": true,
  "campaign": { ... },
  "contractAddress": "0x87Fe...",
  "deploymentTxHash": "0xabc..."
}
```

#### `GET /api/campaigns`
**Auth**: Optional  
**Purpose**: List all campaigns

**Query Params**: `status`, `limit`, `page`

#### `GET /api/campaigns/:id`
**Auth**: Optional  
**Purpose**: Get single campaign

#### `GET /api/campaigns/my-campaigns`
**Auth**: Required  
**Purpose**: Get campaigns created by current user

#### `PUT /api/campaigns/:id`
**Auth**: Required (owner only)  
**Purpose**: Update campaign details

#### `DELETE /api/campaigns/:id`
**Auth**: Required (owner only)  
**Purpose**: Delete campaign

---

### Donation Routes (`/api/donations`)

#### `POST /api/donations/submit`
**Auth**: Required  
**Purpose**: Submit donation (backend relayer processes)

**Request Body**:
```json
{
  "campaignId": "676e666b2185ea7812e197e33",
  "inrAmount": 5000
}
```

**Response**:
```json
{
  "success": true,
  "donation": {
    "_id": "...",
    "amount": 5000,
    "currency": "INR",
    "txHash": "0xdef...",
    "date": "2025-12-25T10:30:00Z"
  },
  "campaign": {
    "amountRaisedINR": 105000,
    "backersCount": 21,
    "status": "active"
  },
  "txHash": "0xdef..."
}
```

#### `GET /api/donations/history`
**Auth**: Required  
**Purpose**: Get current user's donation history

#### `GET /api/donations/campaign/:id`
**Auth**: Required (creator only)  
**Purpose**: Get all donations for a campaign

#### `GET /api/donations/escrow/:id`
**Auth**: Optional  
**Purpose**: Get escrow contract state

**Response**:
```json
{
  "success": true,
  "totalDeposited": "58800000000000000000",
  "totalReleased": "20000000000000000000",
  "balance": "38800000000000000000",
  "campaignActive": true,
  "contributorCount": 21
}
```

---

### Milestone Routes (`/api/milestones`)

#### `POST /api/milestones/submit`
**Auth**: Required (creator only)  
**Purpose**: Submit new milestone for voting

**Request Body**:
```json
{
  "campaignId": "676e666b2185ea7812e197e33",
  "amount": 100000,
  "description": "Purchase solar panels and installation equipment"
}
```

**Response**:
```json
{
  "success": true,
  "milestone": { ... },
  "txHash": "0xghi..."
}
```

#### `GET /api/milestones/campaign/:id`
**Auth**: Optional  
**Purpose**: Get all milestones for a campaign

#### `POST /api/milestones/:id/vote`
**Auth**: Required (donors only)  
**Purpose**: Vote on milestone

**Request Body**:
```json
{
  "vote": "up"  // or "down"
}
```

#### `POST /api/milestones/:id/release`
**Auth**: Required (creator only)  
**Purpose**: Release approved milestone funds

**Response**:
```json
{
  "success": true,
  "milestone": { ... },
  "releaseTxHash": "0xjkl..."
}
```

---

### Member Routes (`/api/members`)

#### `POST /api/members/register`
**Auth**: None  
**Purpose**: Create new member account

#### `POST /api/members/login`
**Auth**: None  
**Purpose**: Login and get JWT token

#### `GET /api/members/profile`
**Auth**: Required  
**Purpose**: Get current member profile

#### `PUT /api/members/profile`
**Auth**: Required  
**Purpose**: Update profile

---

### KYC Routes (`/api/kyc`)

#### `POST /api/kyc/submit`
**Auth**: Required  
**Content-Type**: multipart/form-data  
**Purpose**: Submit KYC documents

**Form Data**:
- `documents`: File[] (images/PDFs)

#### `GET /api/kyc/status`
**Auth**: Required  
**Purpose**: Get current user's KYC status

#### `GET /api/kyc/pending` (Admin)
**Auth**: Required  
**Purpose**: Get all pending KYC submissions

#### `POST /api/kyc/approve/:memberId` (Admin)
**Auth**: Required  
**Purpose**: Approve KYC submission

#### `POST /api/kyc/reject/:memberId` (Admin)
**Auth**: Required  
**Purpose**: Reject KYC submission

**Request Body**:
```json
{
  "reason": "Documents are unclear"
}
```

---

### Network Routes (`/api/network`)

#### `PUT /api/network/profile`
**Auth**: Required  
**Purpose**: Update network profile (bio, location)

#### `GET /api/network/search?q=john`
**Auth**: Required  
**Purpose**: Search members

#### `POST /api/network/connect/:id`
**Auth**: Required  
**Purpose**: Connect with member

#### `GET /api/network/connections`
**Auth**: Required  
**Purpose**: Get user's connections

#### `POST /api/network/message`
**Auth**: Required  
**Purpose**: Send message

**Request Body**:
```json
{
  "recipientId": "...",
  "content": "Hello!"
}
```

#### `GET /api/network/messages/:otherId`
**Auth**: Required  
**Purpose**: Get message history with another user

---

### Faucet Routes (`/api/faucet`)

#### `POST /api/faucet/fund`
**Auth**: Required (development only)  
**Purpose**: Fund user wallet with test USDC

**Request Body**:
```json
{
  "toAddress": "0x123...",
  "amount": 100
}
```

---

## 🚀 Deployment & Infrastructure

### Docker Configuration

#### docker-compose.yml

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "5001:5000"
    env_file:
      - .env
    volumes:
      - ./backend:/app
      
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
    env_file:
      - .env
    volumes:
      - ./frontend:/app
```

#### Backend Dockerfile

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["node", "index.js"]
```

#### Frontend Dockerfile

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
```

### Environment Variables

#### Backend (.env)

```bash
# MongoDB
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/watttogether

# Blockchain
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
RELAYER_PRIVATE_KEY=0x...
DEPLOYER_PRIVATE_KEY=0x...

# Privy
PRIVY_APP_ID=cmj0608mm00ibkz0di118aun2
PRIVY_APP_SECRET=...

# JWT (Legacy)
JWT_SECRET=your_secret_key_here

# Faucet
USDC_AMOY_ADDRESS=0x...
DEV_FAUCET_AUTO_MINT=true
TOKEN_DECIMALS=6

# Server
PORT=5000
```

#### Frontend (.env)

```bash
# Privy
VITE_PRIVY_APP_ID=cmj0608mm00ibkz0di118aun2

# API
VITE_API_BASE_URL=http://localhost:5001/api

# Blockchain
VITE_POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
```

### Deployment Steps

#### 1. Local Development

```bash
# Backend
cd backend
npm install
node index.js

# Frontend
cd frontend
npm install
npm run dev
```

#### 2. Docker Deployment

```bash
# Build and run all services
docker-compose up --build

# Access:
# - Frontend: http://localhost:5173
# - Backend: http://localhost:5001
```

#### 3. Production Deployment

**Backend**:
- Deploy to AWS EC2, Heroku, or Railway
- Use PM2 for process management
- Set up MongoDB Atlas for database
- Configure environment variables
- Enable HTTPS with SSL certificate

**Frontend**:
- Build: `npm run build`
- Deploy to Vercel, Netlify, or AWS S3 + CloudFront
- Set environment variables in hosting platform
- Configure custom domain

**Smart Contracts**:
- Already deployed per campaign
- No separate deployment needed
- Ensure relayer wallet is funded

---

## 👥 User Flows

### Flow 1: Create Campaign

```
1. User logs in via Privy (email magic link)
   └─ Privy creates embedded wallet automatically

2. User navigates to "Start a Campaign"
   └─ /member/startacampaign

3. User fills form:
   ├─ Project name
   ├─ Funding goal (INR)
   ├─ Description
   ├─ About entrepreneur
   ├─ Funding deadline
   ├─ Beneficiary wallet address
   └─ Cover image upload

4. User submits form
   └─ POST /api/campaigns/create

5. Backend:
   ├─ Validates data
   ├─ Loads ProjectEscrow contract artifacts
   ├─ Deploys new contract instance
   ├─ Waits for deployment tx
   ├─ Saves campaign to MongoDB
   └─ Returns campaign + contract address

6. User redirected to campaign page
   └─ Campaign is now "active" and accepting donations
```

### Flow 2: Make Donation

```
1. User browses campaigns
   └─ /member/browsecampaigns

2. User clicks on campaign card
   └─ /member/campaign/:id

3. User clicks "Donate" button
   └─ DonationModalV2 opens

4. User enters INR amount (e.g., ₹5000)
   └─ Step 1: Amount input

5. User confirms donation
   └─ Step 2: Confirmation

6. Frontend calls API:
   └─ POST /api/donations/submit
      { campaignId, inrAmount: 5000 }

7. Backend:
   ├─ Verifies Privy auth token
   ├─ Gets donor wallet address
   ├─ Validates campaign exists & active
   ├─ Converts INR to ETH (₹5000 / 85 = 58.8 MATIC)
   ├─ Loads escrow contract
   ├─ Signs tx with relayer wallet
   ├─ Calls escrow.depositForDonor(donor, {value: amount})
   ├─ Waits for tx receipt
   ├─ Saves donation to MongoDB
   ├─ Updates campaign.amountRaised
   └─ Checks if goal reached

8. Frontend displays:
   ├─ Step 3: Processing
   ├─ Step 4: Success
   ├─ Transaction hash
   ├─ Updated campaign progress
   └─ Auto-closes modal

9. User can view in "My Investments"
   └─ /member/myinvestments
```

### Flow 3: Milestone Governance

```
1. Creator submits milestone:
   ├─ Navigate to campaign page
   ├─ Click "Submit Milestone"
   ├─ Enter amount and description
   └─ POST /api/milestones/submit

2. Backend:
   ├─ Calls escrow.addMilestone(amount, description)
   ├─ Waits for tx
   ├─ Saves milestone to MongoDB
   └─ Sets status to "pending"

3. Donors vote on milestone:
   ├─ View milestone in MilestonesPanel
   ├─ Click "Upvote" or "Downvote"
   └─ POST /api/milestones/:id/vote { vote: "up" }

4. Backend:
   ├─ Verifies voter is a donor
   ├─ Records vote in milestone.votes[]
   ├─ Increments upvotes/downvotes count
   ├─ Calculates approval %
   └─ If >50%: status = "approved"

5. Creator releases funds (if approved):
   ├─ Click "Release Funds" button
   └─ POST /api/milestones/:id/release

6. Backend:
   ├─ Verifies milestone is approved
   ├─ Calls escrow.releaseMilestoneFunds(id, amount)
   ├─ Waits for tx (funds sent to beneficiary)
   ├─ Updates milestone.status = "released"
   └─ Saves releaseTxHash

7. Funds arrive in creator's wallet
   └─ Creator can use for project expenses
```

### Flow 4: KYC Verification

```
1. User navigates to KYC submission
   └─ /member/kyc-submission

2. User uploads documents:
   ├─ ID proof (Aadhaar, Passport, etc.)
   ├─ Address proof
   └─ Submit

3. Frontend sends:
   └─ POST /api/kyc/submit
      FormData with files

4. Backend:
   ├─ Multer saves files to uploads/kyc/
   ├─ Updates member.kycDocuments
   ├─ Sets member.kycStatus = "pending"
   └─ Saves kycSubmittedAt timestamp

5. Admin reviews submission:
   ├─ Navigate to /member/admin-kyc
   ├─ View pending KYC requests
   ├─ Preview documents
   └─ Approve or Reject

6. If approved:
   └─ POST /api/kyc/approve/:memberId
      ├─ Sets member.kycStatus = "verified"
      └─ Sets kycVerifiedAt timestamp

7. If rejected:
   └─ POST /api/kyc/reject/:memberId
      ├─ Sets member.kycStatus = "rejected"
      └─ Saves kycRejectionReason

8. User can check status:
   └─ GET /api/kyc/status
```

---

## 🔧 Development Setup

### Prerequisites

- Node.js 18+ and npm
- MongoDB (local or Atlas)
- Docker & Docker Compose (optional)
- Git

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd WattTogether
```

### Step 2: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### Step 3: Configure Environment Variables

Create `.env` in project root:

```bash
# Copy from example
cp .env.example .env

# Edit with your values
# - MongoDB connection string
# - Privy credentials
# - Polygon RPC URL
# - Wallet private keys
```

### Step 4: Generate Relayer Wallet (if needed)

```bash
cd backend
node generateKeys.js
# Saves wallet to keys.json
# Fund this wallet with MATIC for gas
```

### Step 5: Compile Smart Contracts (if modified)

```bash
cd backend/contracts
# Use Remix, Hardhat, or Foundry to compile
# Save artifacts to backend/contracts/artifacts/
```

### Step 6: Start Services

#### Option A: Without Docker

```bash
# Terminal 1: Backend
cd backend
npm start

# Terminal 2: Frontend
cd frontend
npm run dev
```

#### Option B: With Docker

```bash
# From project root
docker-compose up --build
```

### Step 7: Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000 (or 5001 with Docker)
- **MongoDB**: mongodb://localhost:27017 (if local)

### Step 8: Test Features

1. **Register**: Create account via email magic link
2. **Create Campaign**: Deploy escrow contract
3. **Donate**: Submit INR donation
4. **View Escrow**: Check contract state via API
5. **Submit Milestone**: Create spending request
6. **Vote**: Approve/reject milestone
7. **Release Funds**: Transfer to beneficiary

---

## 📊 Key Metrics & Analytics

### Campaign Metrics

- Total campaigns created
- Active vs completed campaigns
- Total funds raised (INR & MATIC)
- Average funding goal
- Average campaign duration
- Success rate (funded / total)

### Donation Metrics

- Total donations count
- Total donation amount
- Average donation size
- Unique donors count
- Repeat donor rate
- Donations per campaign

### Milestone Metrics

- Total milestones submitted
- Approval rate
- Average voting participation
- Total funds released
- Average release amount

### User Metrics

- Total registered members
- KYC verification rate
- Active campaign creators
- Active donors
- Network connections count
- Message volume

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Contract Deployment Fails

**Symptom**: "Insufficient funds" error  
**Solution**: Fund deployer wallet with MATIC

```bash
# Check balance
cast balance $DEPLOYER_ADDRESS --rpc-url $POLYGON_AMOY_RPC_URL

# Get testnet MATIC from faucet
# https://faucet.polygon.technology/
```

#### 2. Donation Transaction Reverts

**Symptom**: "Campaign not active" or "Invalid donor"  
**Solution**: 
- Verify campaign status is "active"
- Check escrow contract address is correct
- Ensure relayer wallet is funded

#### 3. Privy Authentication Fails

**Symptom**: "Invalid app ID" or "Token verification failed"  
**Solution**:
- Check VITE_PRIVY_APP_ID matches backend
- Verify PRIVY_APP_SECRET is correct
- Ensure Privy dashboard has correct domain

#### 4. MongoDB Connection Error

**Symptom**: "MongoNetworkError"  
**Solution**:
- Check MONGO_URI is correct
- Verify network access in MongoDB Atlas
- Ensure IP whitelist includes your address

#### 5. File Upload Fails

**Symptom**: "No such file or directory"  
**Solution**:
- Ensure `uploads/kyc/` directory exists
- Check Multer configuration
- Verify file permissions

---

## 📚 Additional Resources

### Documentation Files

- [COMPLETE_INTEGRATION_REPORT.md](COMPLETE_INTEGRATION_REPORT.md) - V2 migration details
- [V2_INTEGRATION_SUMMARY.md](V2_INTEGRATION_SUMMARY.md) - V2 features summary
- [PRIVY_MIGRATION_COMPLETE.md](PRIVY_MIGRATION_COMPLETE.md) - Web3Auth to Privy migration
- [KYC_IMPLEMENTATION_GUIDE.md](KYC_IMPLEMENTATION_GUIDE.md) - KYC system guide
- [DEPLOY_CONTRACT_GUIDE.md](DEPLOY_CONTRACT_GUIDE.md) - Contract deployment guide
- [NEW_CONTRACT_INTEGRATION_GUIDE.md](NEW_CONTRACT_INTEGRATION_GUIDE.md) - Integration guide
- [QUICK_SETUP.md](QUICK_SETUP.md) - Quick start guide

### External Links

- **Privy Documentation**: https://docs.privy.io/
- **Polygon Amoy Faucet**: https://faucet.polygon.technology/
- **Polygon Amoy Explorer**: https://amoy.polygonscan.com/
- **Ethers.js Docs**: https://docs.ethers.org/v6/
- **MongoDB Docs**: https://docs.mongodb.com/

---

## 🎉 Conclusion

WattTogether is a production-ready decentralized crowdfunding platform that successfully bridges Web2 UX with Web3 transparency. The platform's key innovations—gasless donations, milestone governance, and Privy authentication—make blockchain technology accessible to non-technical users while maintaining the security and transparency benefits of decentralization.

**Current Status**: ✅ Production Ready  
**Deployment**: Polygon Amoy Testnet  
**Next Steps**: Mainnet deployment, additional features (refunds, campaign categories, analytics dashboard)

---

**For questions or support, contact the development team.**

**Project Version**: 2.0  
**Documentation Version**: 1.0  
**Last Updated**: December 25, 2025
