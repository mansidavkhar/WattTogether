# New ProjectEscrow Contract Integration Guide

## Contract Details

**Address:** `0x87Fe4369549A5397e2f29ac7e60cA5C9ca2CA519`  
**Network:** Polygon Amoy (Testnet)  
**Status:** Verified ✅

## Key Architecture Changes

### Old Model vs New Model

**Old Contract (Token-based):**
- User approves USDC token
- User calls `donate(amount)` directly on contract
- User pays gas fees

**New Contract (Relayer Model):**
- Backend acts as relayer (liquidity provider)
- User pays in Fiat (INR) to backend
- Backend converts and deposits ETH on behalf of user
- User pays no gas fees

### Donation Flow

```
User (Frontend)
    ↓
Submits INR donation amount
    ↓
Backend receives donation
    ↓
Converts INR to ETH equivalent
    ↓
Backend calls depositForDonor(userAddress) with ETH
    ↓
Funds locked in Escrow
    ↓
User sees confirmation + tx hash
```

### Milestone Voting Flow

```
Creator (Active Project)
    ↓
Submits spending request (milestone)
    ↓
Backend adds to escrow contract
    ↓
Donors vote (upvote/downvote)
    ↓
If >50% approval: status = approved
    ↓
Creator releases funds from escrow
    ↓
Funds transferred to creator wallet
```

## Required Environment Variables

### Backend (.env)

```env
# Existing
PRIVY_APP_ID=cmj0608mm00ibkz0di118aun2
PRIVY_SECRET_KEY=your_privy_secret
MONGO_URI=your_mongo_uri
PORT=5000

# New - Polygon Amoy RPC
POLYGON_AMOY_RPC=https://polygon-amoy.g.alchemy.com/v2/your_api_key

# New - Relayer Account (Backend wallet that deposits on behalf of users)
RELAYER_PRIVATE_KEY=your_private_key_hex
RELAYER_ADDRESS=0x_your_address

# Exchange Rate
INR_TO_WEI_RATE=85  # 1 INR = 1/85 of native token (for testnet)
```

### Frontend (.env)

```env
VITE_API_GATEWAY_URL=http://localhost:5000/api
VITE_PRIVY_APP_ID=cmj0608mm00ibkz0di118aun2
```

## New Files Created

### Backend

1. **controllers/donationControllerV2.js**
   - `submitDonation()` - Process fiat donations
   - `getDonationHistory()` - User's donation history
   - `getCampaignDonations()` - Creator's donation analytics
   - `getEscrowStatus()` - Get contract state

2. **controllers/milestoneController.js**
   - `submitMilestone()` - Creator submits spending request
   - `getCampaignMilestones()` - View all milestones
   - `voteOnMilestone()` - Donor votes (up/down)
   - `releaseMilestoneFunds()` - Creator releases approved funds

3. **models/milestoneModel.js**
   - Milestone schema with voting, status, onChainId tracking

4. **routes/donationRoutesV2.js**
   - POST `/api/donations/submit` - Submit donation
   - GET `/api/donations/history` - Get user's donations
   - GET `/api/donations/campaign/:id` - Get campaign donations
   - GET `/api/donations/escrow/:id` - Get escrow status

5. **routes/milestoneRoutes.js**
   - POST `/api/milestones/submit` - Submit milestone
   - GET `/api/milestones/campaign/:id` - Get milestones
   - POST `/api/milestones/:id/vote` - Vote on milestone
   - POST `/api/milestones/:id/release` - Release funds

6. **contracts/artifacts/ProjectEscrowV2.json**
   - New contract ABI with relayer model

### Frontend

1. **components/DonationModalV2.jsx**
   - New donation flow
   - Calls backend API (no direct contract interaction)
   - Shows tx hash and confirmation
   - Privy authenticated

2. **components/MilestonesPanel.jsx**
   - Display campaign milestones
   - Vote on pending milestones
   - Release funds (creator only)
   - Shows voting progress

## API Endpoints

### Donations

```javascript
// Submit a donation (authenticated)
POST /api/donations/submit
{
  campaignId: "campaign_id",
  inrAmount: 5000
}

Response: {
  success: true,
  data: {
    donation: { id, inrAmount, ethAmount, txHash },
    campaign: { id, amountRaised, fundingGoal, percentComplete }
  }
}
```

```javascript
// Get user's donation history
GET /api/donations/history
Authorization: Privy token

Response: [
  { 
    campaignId, 
    donorEmail, 
    inrAmount, 
    ethAmount, 
    timestamp, 
    txHash, 
    status 
  }
]
```

```javascript
// Get escrow contract status
GET /api/donations/escrow/:campaignId
Response: {
  escrowAddress,
  totalDeposited,
  totalReleased,
  remainingBalance,
  campaignActive,
  status
}
```

### Milestones

```javascript
// Submit a milestone (creator only)
POST /api/milestones/submit
{
  campaignId: "id",
  amount: 10000,
  description: "Buy solar panels"
}

Response: {
  success: true,
  data: { id, amount, description, status: 'pending' }
}
```

```javascript
// Get campaign milestones
GET /api/milestones/campaign/:campaignId
Response: {
  milestones: [...],
  userHasVotingPower: boolean
}
```

```javascript
// Vote on milestone
POST /api/milestones/:milestoneId/vote
{
  vote: 'up' | 'down'
}

Response: {
  success: true,
  data: { 
    status: 'approved|rejected|pending',
    upvotes, 
    downvotes, 
    approvalRate 
  }
}
```

```javascript
// Release approved milestone funds
POST /api/milestones/:milestoneId/release
Response: {
  success: true,
  data: { milestoneId, amount, txHash }
}
```

## Contract Functions Reference

### Public Functions

```solidity
// Relayer deposits on behalf of donor (payable)
function depositForDonor(address _donor) external payable onlyRelayer

// Add a milestone for voting
function addMilestone(uint256 amount, string memory description) external onlyRelayer

// Release funds after milestone is approved
function releaseMilestoneFunds(uint256 milestoneId, uint256 amount) external onlyRelayer

// Close campaign
function closeCampaign() external onlyRelayer

// Emergency withdraw (only if campaign closed)
function emergencyWithdraw() external onlyRelayer
```

### View Functions

```solidity
function getBalance() external view returns (uint256)
function getMilestoneCount() external view returns (uint256)
function getMilestone(uint256 id) external view returns (amount, released, description)
function getContributorCount() external view returns (uint256)
function campaignActive() external view returns (bool)
function totalDeposited() external view returns (uint256)
function totalReleased() external view returns (uint256)
```

## Relayer Account Setup

The relayer account is critical - it deposits funds on behalf of users.

### How to Set Up:

1. **Create/Use an EOA (Externally Owned Account)**
   ```bash
   # Using ethers.js or similar
   const wallet = ethers.Wallet.createRandom();
   console.log('Address:', wallet.address);
   console.log('Private Key:', wallet.privateKey);
   ```

2. **Fund the Relayer Account**
   - Send MATIC to the relayer address on Polygon Amoy
   - Ensure enough balance for gas + donations

3. **Set Environment Variables**
   ```env
   RELAYER_PRIVATE_KEY=0x...
   RELAYER_ADDRESS=0x...
   ```

4. **Verify in Backend Logs**
   ```
   Relayer Address: 0x...
   Relayer Balance: X MATIC
   ```

## Exchange Rate Configuration

Currently hardcoded as:
```javascript
const INR_TO_WEI_RATE = 85; // 1 INR = 1/85 of native token
```

For production, integrate with a price oracle:
```javascript
// Example: Uniswap or Chainlink
const rate = await getPriceFromOracle('INR', 'ETH');
```

## Security Considerations

1. **Relayer Key Management**
   - Use secure key vault (AWS Secrets Manager, HashiCorp Vault)
   - Rotate keys regularly
   - Never commit to git

2. **Contract Authorization**
   - Only relayer can call `depositForDonor()`
   - Only relayer can add milestones
   - Creator confirms fund releases

3. **Reentrancy Protection**
   - Contract uses checks-effects-interactions
   - Safe for milestone-based releases

4. **Fund Recovery**
   - Emergency withdraw if campaign fails
   - Only after campaign is closed

## Testing Checklist

- [ ] Relayer account funded with testnet MATIC
- [ ] Backend can call `depositForDonor()` successfully
- [ ] Frontend donation form works with Privy auth
- [ ] Donations show up in user history
- [ ] Creator can submit milestones
- [ ] Donors can vote on milestones
- [ ] Approved milestones release funds correctly
- [ ] Escrow balance updates in real-time

## Troubleshooting

### "Relayer has insufficient funds"
- Check relayer MATIC balance
- Add more funds to relayer address

### "Escrow contract error: Campaign is not active"
- Campaign status must be 'Active Project'
- Wait for funding goal to be reached

### "Only relayer can call this"
- Ensure `RELAYER_PRIVATE_KEY` is set correctly
- Check relayer address matches contract expectation

### "Only donors can vote on milestones"
- User must have made at least one donation
- Check donation history

## Next Steps

1. **Deploy relayer account** with MATIC funding
2. **Update .env** with relayer credentials
3. **Test donation flow** end-to-end
4. **Add milestone submission UI** to campaign details page
5. **Implement voting UI** in campaign view
6. **Monitor contract events** for real-time updates

## Resources

- **Contract Address:** 0x87Fe4369549A5397e2f29ac7e60cA5C9ca2CA519
- **Network:** Polygon Amoy (80002)
- **RPC:** https://polygon-amoy.g.alchemy.com/v2/demo
- **Block Explorer:** https://amoy.polygonscan.com/

---

**Status:** Ready for Integration ✅  
**Last Updated:** December 22, 2025
