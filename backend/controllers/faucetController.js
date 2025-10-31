const ethers = require('ethers');
require('dotenv').config();

// Ethers setup to connect to the Polygon Amoy testnet
const provider = new ethers.JsonRpcProvider(process.env.POLYGON_AMOY_RPC_URL);
const deployerWallet = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

// Minimal ERC20 ABI
const erc20Abi = [
  'function decimals() view returns (uint8)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 value) returns (bool)',
  'function mint(address to, uint256 amount) public',
];

exports.fundUserWithTestUSDC = async (req, res) => {
  try {
    const { toAddress, amount } = req.body;

    if (!toAddress || !ethers.isAddress(toAddress)) {
      return res.status(400).json({ success: false, message: 'Invalid toAddress' });
    }
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const tokenAddress = process.env.USDC_AMOY_ADDRESS || process.env.USDC_TOKEN_ADDRESS_AMOY;
    if (!tokenAddress) {
      return res.status(500).json({ success: false, message: 'USDC token address not configured. Set USDC_AMOY_ADDRESS or USDC_TOKEN_ADDRESS_AMOY in .env' });
    }

    // Ensure address is a contract
    const code = await provider.getCode(tokenAddress);
    if (code === '0x') {
      return res.status(400).json({ success: false, message: `Token address ${tokenAddress} has no code on-chain.` });
    }

    const token = new ethers.Contract(tokenAddress, erc20Abi, deployerWallet);

    // Determine decimals
    let decimals = 6;
    try {
      decimals = Number(await token.decimals());
      if (!Number.isFinite(decimals)) decimals = Number(process.env.TOKEN_DECIMALS) || 6;
    } catch {
      decimals = Number(process.env.TOKEN_DECIMALS) || 6;
    }

    const amountUnits = ethers.parseUnits(numericAmount.toString(), decimals);

    // Attempt mint if allowed and configured
    const autoMint = String(process.env.DEV_FAUCET_AUTO_MINT).toLowerCase() === 'true';
    let tx;
    if (autoMint) {
      try {
        tx = await token.mint(toAddress, amountUnits);
        const receipt = await tx.wait();
        return res.json({ success: true, method: 'mint', txHash: receipt.hash });
      } catch (mintErr) {
        // fallback to transfer
        console.warn('mint failed, falling back to transfer:', mintErr?.message || mintErr);
      }
    }

    // Fallback: transfer from deployer to user
    const balance = await token.balanceOf(deployerWallet.address);
    if (balance < amountUnits) {
      return res.status(400).json({ success: false, message: `Deployer balance ${balance} < requested ${amountUnits}. Fund the deployer or enable DEV_FAUCET_AUTO_MINT=true with a mintable token.` });
    }
    tx = await token.transfer(toAddress, amountUnits);
    const receipt = await tx.wait();
    return res.json({ success: true, method: 'transfer', txHash: receipt.hash });
  } catch (err) {
    const reason = err?.reason || err?.shortMessage || err?.message || String(err);
    console.error('Faucet error:', reason);
    res.status(500).json({ success: false, message: 'Faucet failed', error: reason });
  }
};
