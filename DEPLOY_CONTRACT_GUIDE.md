# Deploy ProjectEscrowV3 Contract Guide

## Step 1: Prepare for Deployment

### What is `_targetAmount`?
The target amount is the **funding goal in Wei** (not INR).

**Conversion Formula:**
```
_targetAmount (Wei) = (INR_Goal / 100000) * 1000000000000000000
```

**Quick Reference:**
| INR Goal | ETH Equivalent | _targetAmount (Wei) |
|----------|----------------|---------------------|
| ₹100,000 | 1 ETH | 1000000000000000000 |
| ₹500,000 | 5 ETH | 5000000000000000000 |
| ₹1,000,000 | 10 ETH | 10000000000000000000 |

## Step 2: Deploy Using Remix

1. **Go to Remix**: https://remix.ethereum.org/

2. **Create New File**: `ProjectEscrow.sol`

3. **Copy Contract Code**: From `backend/contracts/ProjectEscrowV3.sol`

4. **Compile**:
   - Click "Solidity Compiler" tab
   - Select compiler version: `0.8.20`
   - Click "Compile ProjectEscrow.sol"

5. **Deploy**:
   - Click "Deploy & Run Transactions" tab
   - Environment: "Injected Provider - MetaMask"
   - Network: Polygon Amoy (Chain ID: 80002)
   - Contract: Select "ProjectEscrow"
   - Constructor parameters:
     * `_projectCreator`: `0x436C51E12434aa3F763af267C37911Ae101fb25B` (your deployer/relayer address)
     * `_targetAmount`: `1000000000000000000` (for 1 ETH = ₹100,000 goal)
   - Click "Deploy"
   - Confirm transaction in MetaMask

6. **Verify Deployment**:
   - Copy the deployed contract address
   - Check on PolygonScan Amoy: https://amoy.polygonscan.com/

## Step 3: Get ABI and Bytecode

After successful compilation in Remix:

1. Click on "Solidity Compiler" tab
2. Scroll down to "Compilation Details"
3. Click "ABI" button - copy the JSON
4. Click "Bytecode" button - copy the hex string

## Step 4: Update Backend Files

### A. Update `ProjectEscrowV2.json`

Replace the file content with:

```json
{
  "abi": [PASTE_ABI_HERE],
  "bytecode": "PASTE_BYTECODE_HERE"
}
```

### B. No other changes needed

The campaign controller is already configured to use ProjectEscrowV2.json

## Step 5: Test

1. Restart backend: `Ctrl+C` then `node index.js`
2. Create a new campaign via frontend
3. The backend will deploy a new instance of your contract for that campaign
4. Try donating - it should work!

## Common Issues

### Issue: "Bytecode not found"
**Solution**: Make sure you paste the complete bytecode from Remix (starts with `0x`)

### Issue: "Contract deployment failed"
**Solution**: Ensure your deployer wallet has enough MATIC for gas fees

### Issue: "Transaction reverted"
**Solution**: 
- Check _targetAmount is in Wei
- Ensure relayer address is correct
- Verify you're on Polygon Amoy testnet

## Contract Functions

### For Donations:
- `receive()` - Accepts plain ETH transfers
- `depositForDonor(address _donor)` - Relayer deposits for specific donor

### For Milestones:
- `addMilestone(uint256 amount, string description)` - Add milestone
- `releaseMilestoneFunds(uint256 milestoneId, uint256 amount)` - Release funds

### View Functions:
- `getBalance()` - Check contract balance
- `totalDeposited` - Total funds received
- `campaignActive` - Is campaign still active

## Next Steps

After deployment and ABI update:
1. ✅ Create new campaigns - each gets its own escrow instance
2. ✅ Donations work with native ETH
3. ✅ Milestones can be added and funded
4. ✅ No gas fees for users (relayer pays)

---

**Need Help?**
- Contract Source: `backend/contracts/ProjectEscrowV3.sol`
- Relayer Address: Check `.env` file for `RELAYER_ADDRESS`
- Network: Polygon Amoy (80002)
