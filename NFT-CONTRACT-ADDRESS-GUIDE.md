#  NFT Contract Address Setup Guide

**Last Updated:** November 27, 2025  
**Purpose:** Guide to deploying an NFT contract and obtaining the contract address

---

##  Overview

**Important:** `NFT_CONTRACT_ADDRESS` is **NOT an API key** - it's the address of a deployed smart contract on a blockchain (Ethereum, Polygon, etc.). You get this address **after deploying** an NFT contract.

---

##  What is an NFT Contract Address?

An NFT Contract Address is:
- The unique identifier of your deployed NFT smart contract on a blockchain
- Format: `0x` followed by 40 hexadecimal characters (e.g., `0x1234567890abcdef1234567890abcdef12345678`)
- Used to interact with your NFT contract (mint, transfer, query NFTs)
- Public information (anyone can view it on blockchain explorers)

---

##  Step-by-Step: Deploy an NFT Contract

### **Option 1: Use OpenZeppelin Contracts (Recommended for Beginners)**

#### **Step 1: Choose a Blockchain Network**

**Popular Options:**
- **Polygon (Matic)** - Low gas fees, recommended for beginners
- **Ethereum Mainnet** - High gas fees, most established
- **Ethereum Sepolia (Testnet)** - Free for testing
- **Polygon Mumbai (Testnet)** - Free for testing

**Recommendation:** Start with **Polygon Mumbai Testnet** for testing, then deploy to **Polygon Mainnet** for production.

---

#### **Step 2: Set Up a Wallet**

1. **Install MetaMask:**
   - Go to https://metamask.io/
   - Install browser extension
   - Create a new wallet
   - **Save your seed phrase securely!**

2. **Add Network:**
   - For Polygon Mumbai (Testnet):
     - Network Name: `Polygon Mumbai`
     - RPC URL: `https://rpc-mumbai.maticvigil.com`
     - Chain ID: `80001`
     - Currency Symbol: `MATIC`
     - Block Explorer: `https://mumbai.polygonscan.com`

3. **Get Test Tokens:**
   - For Mumbai Testnet: https://faucet.polygon.technology/
   - For Sepolia Testnet: https://sepoliafaucet.com/

---

#### **Step 3: Use Remix IDE (Easiest Method)**

1. **Go to Remix IDE:**
   - Visit: https://remix.ethereum.org/

2. **Create New File:**
   - Click "File Explorer" in left sidebar
   - Click "New File"
   - Name it: `MyNFT.sol`

3. **Write NFT Contract:**
   ```solidity
   // SPDX-License-Identifier: MIT
   pragma solidity ^0.8.20;

   import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
   import "@openzeppelin/contracts/access/Ownable.sol";
   import "@openzeppelin/contracts/utils/Counters.sol";

   contract MyNFT is ERC721, Ownable {
       using Counters for Counters.Counter;
       Counters.Counter private _tokenIds;

       constructor() ERC721("MyNFT", "MNFT") Ownable(msg.sender) {}

       function mintNFT(address to, string memory tokenURI) public onlyOwner returns (uint256) {
           _tokenIds.increment();
           uint256 newTokenId = _tokenIds.current();
           _safeMint(to, newTokenId);
           return newTokenId;
       }
   }
   ```

4. **Compile Contract:**
   - Click "Solidity Compiler" in left sidebar
   - Select compiler version: `0.8.20` or higher
   - Click "Compile MyNFT.sol"

5. **Deploy Contract:**
   - Click "Deploy & Run Transactions" in left sidebar
   - Environment: Select "Injected Provider - MetaMask"
   - Connect your MetaMask wallet
   - Select network: Polygon Mumbai (or your chosen network)
   - Click "Deploy"
   - Confirm transaction in MetaMask

6. **Get Contract Address:**
   - After deployment, the contract address appears in Remix
   - Copy the address (starts with `0x...`)
   - **This is your `NFT_CONTRACT_ADDRESS`!**

---

### **Option 2: Use Thirdweb (No-Code Solution)**

1. **Go to Thirdweb:**
   - Visit: https://thirdweb.com/
   - Sign up for free account

2. **Create NFT Collection:**
   - Click "Deploy"
   - Select "NFT Collection"
   - Choose network (Polygon recommended)
   - Fill in collection details:
     - Name: Your collection name
     - Symbol: Collection symbol
     - Description: Collection description
   - Click "Deploy Now"
   - Connect MetaMask wallet
   - Confirm transaction

3. **Get Contract Address:**
   - After deployment, Thirdweb shows your contract address
   - Copy the address
   - **This is your `NFT_CONTRACT_ADDRESS`!**

---

### **Option 3: Use Hardhat (Advanced)**

1. **Install Hardhat:**
   ```bash
   npm install --save-dev hardhat
   npx hardhat init
   ```

2. **Create NFT Contract:**
   - Use OpenZeppelin contracts
   - Write your NFT contract

3. **Deploy:**
   ```bash
   npx hardhat run scripts/deploy.js --network polygon
   ```

4. **Get Address:**
   - Contract address is printed after deployment

---

## 📝 Adding Contract Address to GitLab

Once you have your contract address:

1. **Go to GitLab:**
   - Navigate to: **Settings → CI/CD → Variables**

2. **Add Variable:**
   - Click **"Add variable"**
   - **Key:** `NFT_CONTRACT_ADDRESS`
   - **Value:** `0x...` (your contract address)
   - **Type:** Variable
   - **Masked:** [NO] No (addresses are public anyway)
   - **Protected:** [OK] Optional
   - **Expand variable reference:** [NO] Unchecked

3. **Click "Add variable"**

---

## 🔍 Verify Your Contract Address

### **Using Blockchain Explorer:**

**Polygon:**
- Mainnet: https://polygonscan.com/
- Testnet: https://mumbai.polygonscan.com/

**Ethereum:**
- Mainnet: https://etherscan.io/
- Sepolia: https://sepolia.etherscan.io/

**Steps:**
1. Go to the appropriate explorer
2. Paste your contract address in the search box
3. Verify it shows your NFT contract
4. Check contract details (name, symbol, etc.)

---

##  Example Contract Addresses

**Testnet Examples:**
- Polygon Mumbai: `0x1234567890abcdef1234567890abcdef12345678`
- Ethereum Sepolia: `0xabcdef1234567890abcdef1234567890abcdef12`

**Format:**
- Always starts with `0x`
- 42 characters total (0x + 40 hex characters)
- Case-insensitive (but usually lowercase)

---

## [WARNING] Important Notes

### **Security:**
- [OK] Contract addresses are **public** - anyone can view them
- [OK] It's safe to use in frontend code
- [NO] Don't confuse with private keys (never share those!)

### **Network-Specific:**
- Each network has different addresses
- Polygon address ≠ Ethereum address
- Make sure you use the correct network

### **Cost:**
- **Testnet:** Free (test tokens from faucets)
- **Mainnet:** Requires real cryptocurrency (MATIC for Polygon, ETH for Ethereum)
- Gas fees vary by network and congestion

---

##  Quick Start (Recommended Path)

1. **For Testing:**
   - Use **Thirdweb** + **Polygon Mumbai Testnet**
   - Deploy in 5 minutes, no coding required
   - Get free test tokens from faucet

2. **For Production:**
   - Use **Thirdweb** or **Remix** + **Polygon Mainnet**
   - Deploy your NFT contract
   - Copy contract address
   - Add to GitLab CI/CD variables

---

##  Useful Links

- **Remix IDE:** https://remix.ethereum.org/
- **Thirdweb:** https://thirdweb.com/
- **OpenZeppelin Contracts:** https://docs.openzeppelin.com/contracts/
- **MetaMask:** https://metamask.io/
- **Polygon Faucet:** https://faucet.polygon.technology/
- **Polygon Explorer:** https://polygonscan.com/
- **Ethereum Explorer:** https://etherscan.io/

---

##  Checklist

- [ ] Install MetaMask wallet
- [ ] Add blockchain network (Polygon Mumbai for testing)
- [ ] Get test tokens from faucet
- [ ] Deploy NFT contract (using Remix, Thirdweb, or Hardhat)
- [ ] Copy contract address
- [ ] Verify contract on blockchain explorer
- [ ] Add `NFT_CONTRACT_ADDRESS` to GitLab CI/CD variables
- [ ] Test NFT minting functionality

---

## 🆘 Troubleshooting

### **"Insufficient funds" error:**
- Make sure you have enough tokens (MATIC/ETH) for gas fees
- Get test tokens from faucet if on testnet

### **"Contract not found" on explorer:**
- Wait a few minutes for blockchain confirmation
- Check you're on the correct network
- Verify the address is correct

### **"Transaction failed":**
- Check you have enough gas
- Verify contract code compiles without errors
- Make sure network is correct

---

## [OK] Summary

**NFT_CONTRACT_ADDRESS is:**
- [OK] A blockchain contract address (not an API key)
- [OK] Obtained after deploying an NFT smart contract
- [OK] Format: `0x` + 40 hex characters
- [OK] Public information (safe to use in frontend)
- [OK] Network-specific (different for each blockchain)

**Easiest Method:**
1. Use **Thirdweb** (no coding required)
2. Deploy to **Polygon Mumbai Testnet** (free)
3. Copy the contract address
4. Add to GitLab CI/CD variables

---

**Need Help?** Check the blockchain explorer to verify your contract is deployed correctly!

