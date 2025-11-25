# Gemini Code Assistant Project Context

This document provides context for the Gemini Code Assistant to understand the structure and conventions of the CarbonOpus dApp codebase.

## Project Overview

### The Problem We're Solving
Right now, the music industry is broken for independent artists:
Spotify pays artists $0.003 per stream (you need 300,000+ streams just to make minimum wage)
Artists keep only 15-30% of their streaming revenue while middlemen take the rest
12 million independent artists worldwide are struggling to monetize their passion
Fans have no way to financially benefit from discovering and sharing great music early
We're changing that.

### What We're Building
An all-in-one social music platform that empowers independent artists to take control of their careers and rewards fans for being part of the journey.

### For Artists:
Upload music and set your own prices - no middlemen, no gatekeepers
Keep 84-99% of all sales (we only take 1%)
Launch your own creator token - let fans invest in your future success
AI-powered content creation - auto-generate posts, captions, and social content
Cross-platform posting - automatically share to Instagram, Twitter, TikTok, etc.
Own your audience - direct relationship with your fans

### For Fans:
Buy music and truly own it - not rent it like on streaming platforms
Earn money by sharing - when you share a song and someone buys it, you get paid (artist sets the %)
Invest in artists you believe in - buy creator tokens and profit as artists grow
Support artists directly - your money goes straight to the creator
Discover new music in a vibrant social feed

### How the Magic Happens:
Artist uploads a track and sets the price (say, $1)
Fan buys the track for $1 and gets full ownership
Fan shares with friends who also love it
Friends buy the track and the original fan earns 15% of each sale
Artist gets 84%, fan gets 15%, we get 1%
Everyone wins - and music spreads virally because fans are incentivized to share
This creates a viral growth loop where the better the music, the more people share it, the more everyone earns.

### Current Status
We've been heads-down building for months and we're almost there:
MVP is 95% complete - launching publicly in 60 days
Core features working: Upload, purchase, social feed, fan resale rewards
Payment processing integrated - ready for real transactions
AI content tools live - helping artists create and schedule posts
Smart contracts developed - for creator tokens (awaiting audit)
20+ beta testers giving us amazing feedback and validation
The reception from independent artists has been incredible. They're hungry for an alternative to exploitative streaming platforms.

### What Makes Us Different
There are other music platforms out there, but none combine: ✅ Direct artist sales (84-99% revenue share)
 ✅ Fan financial rewards for sharing (viral growth mechanic)
 ✅ Creator tokenization (fans invest in artist success)
 ✅ AI-powered tools (content creation & automation)
 ✅ Social-first experience (discovery + community)
 ✅ Cross-platform integration (post everywhere from one place)
We're not just building another streaming service. We're building the platform where independent artists launch their careers, build real fan communities, and actually make money from their art.

### Our Vision
We believe every independent artist should be able to make a living doing what they love.
We believe fans should profit from discovering great artists early.
We believe music should bring people together, not just extract value from them.
Right now, the music industry makes billions while artists struggle. We're flipping that model on its head.

## Core Technologies

*   **Framework:** [React](https://reactjs.org/)
*   **Build Tool:** [Vite](https://vitejs.dev/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) with some [Material-UI](https://mui.com/) components.
*   **Routing:** [React Router](https://reactrouter.com/)
*   **State Management:** [React Context](https://reactjs.org/docs/context.html) and [TanStack Query](https://tanstack.com/query/v4)
*   **Web3:**
    *   [Wagmi](https://wagmi.sh/)
    *   [Ethers.js](https://ethers.io/)
    *   [RainbowKit](https://www.rainbowkit.com/)
*   **Backend:** [Firebase](https://firebase.google.com/)
*   **UI Components:** A mix of custom components, [Radix UI](https://www.radix-ui.com/) primitives, and [shadcn/ui](https://ui.shadcn.com/) components.

## Project Structure

The `src` directory contains the majority of the application's source code and is organized as follows:

*   `main.jsx`: The entry point of the application.
*   `App.jsx`: The root component of the application, which sets up routing and global context providers.
*   `abis/`: Contains the ABI (Application Binary Interface) files for interacting with Ethereum smart contracts.
*   `assets/`: Static assets like images and SVGs.
*   `components/`: Reusable React components used throughout the application.
    *   `components/ui/`: Components from the shadcn/ui library.
*   `contexts/`: React Context providers for managing global state (e.g., authentication, Web3, etc.).
*   `firebase/`: Contains Firebase-related utility functions and configuration.
*   `hooks/`: Custom React hooks.
*   `layout/`: Components related to the overall page layout (e.g., headers, footers, sidebars).
*   `pages/`: Top-level page components that are mapped to routes.
*   `queries/`: Contains data-fetching logic using TanStack Query.
*   `txs/`: Contains functions for sending transactions to the blockchain.
*   `utils/`: General utility functions and helpers.

## Coding Conventions

*   **Component Naming:** Components are named using PascalCase (e.g., `MyComponent`).
*   **File Naming:** Files containing a single component are named after the component (e.g., `MyComponent.jsx`).
*   **Styling:** Use Tailwind CSS utility classes for styling whenever possible. For more complex components, create a separate CSS file and import it into the component. The color palette is defined in `tailwind.config.js`. The primary theme colors are pink and purple.
*   **State Management:** For server state (data fetched from an API or the blockchain), use TanStack Query. For global UI state, use React Context.
*   **Web3:** Use the hooks and utilities provided by `wagmi` and RainbowKit for interacting with the blockchain. Transaction-specific logic should be placed in the `txs` directory.
*   **Linting:** The project uses ESLint with a configuration that extends the `react-app` and `google` configs. Please adhere to the linting rules.
*   **Formatting:** The project uses Prettier for code formatting. Please format your code before committing.
*   **Imports:** Never import "lodash" into files as it is auto-imported via "Vite".  Ex: "import _ from 'lodash';" dont add this ever to my code!

# CarbonOpus Contracts (`CarbonCoinLauncher`, `CarbonCoin`, & `CarbonOpus`)

This document provides context for interacting with the CarbonOpus smart contracts, specifically `CarbonCoinLauncher`, `CarbonCoin`, and `CarbonOpus`. It is intended for Dapp developers and as a reference for understanding the system's mechanics.

## 1. Overview

The CarbonOpus system is a two-part ecosystem for launching and trading new tokens, often called "memecoins":

1.  **`CarbonCoinLauncher.sol`**: A factory contract that allows anyone to create their own `CarbonCoin` token for a small fee.
2.  **`CarbonCoin.sol`**: The token contract itself. Each token operates on a bonding curve for initial price discovery and trading. Once it gains enough traction (liquidity), it "graduates" by migrating its liquidity to a decentralized exchange (DEX).
3.  **`CarbonOpus.sol`**: An ERC-1155 NFT contract for minting and buying music.

---

## 2. `CarbonCoinLauncher` - The Factory

The `CarbonCoinLauncher` is the entry point for creating new tokens.

### Key Purpose

-   To allow any user to deploy a new `CarbonCoin` token with a custom name, symbol, and bonding curve configuration.
-   To act as a registry for all tokens created through it.
-   To collect a fee for each token creation.

### Dapp Integration: Creating and Discovering Tokens

#### **Creating a Token**

A user can create a new token by calling the `createToken` function:

```solidity
function createToken(
  string memory name,
  string memory symbol,
  ICarbonCoin.BondingCurveConfig memory curveConfig
) public payable returns (address);
```

-   **Parameters:**
    -   `name`: The desired name of the token (e.g., "My Awesome Coin").
    -   `symbol`: The token's symbol (e.g., "MAC").
    -   `curveConfig`: A struct defining the bonding curve's initial parameters:
        -   `virtualEth`: The virtual ETH reserve, which helps set the initial price.
        -   `virtualTokens`: The virtual token supply, also for setting the initial price.
        -   `maxSupply`: The total possible supply of the token.
        -   `graduationThreshold`: The amount of ETH reserves required in the bonding curve to trigger graduation to a DEX.
-   **Value:** The caller must send ETH equal to the `creationFee`.
-   **Returns:** The address of the newly deployed `CarbonCoin` contract.

#### **Discovering Tokens**

To display a list of tokens, a Dapp should listen for the `TokenCreated` event:

```solidity
event TokenCreated(
    address indexed tokenAddress,
    address indexed creator,
    string name,
    string symbol,
    uint256 createdAt,
    uint256 feePaid
);
```

By subscribing to this event, a Dapp can maintain an up-to-date list of all tokens launched through the platform.

#### **Other Useful Functions**

-   `getStats()`: Returns platform-wide statistics like total tokens created and fees collected.
-   `tokens(address tokenAddress)`: Returns `TokenInfo` for a specific token.

---

## 3. `CarbonCoin` - The Token

Each `CarbonCoin` contract has a two-phase lifecycle.

### Phase 1: Bonding Curve Trading (Pre-Graduation)

In this initial phase, all buying and selling occurs directly with the contract. The price is determined algorithmically by a bonding curve.

#### **Buying and Selling**

-   **To Buy:** A user calls `buy(uint256 minTokensOut)` and sends ETH. The contract calculates the number of tokens they receive based on the current price and a buy fee. `minTokensOut` is a slippage parameter.
-   **To Sell:** A user first approves the contract to spend their tokens, then calls `sell(uint256 tokensIn, uint256 minEthOut)`. The contract calculates the ETH returned based on the current price and a sell fee. `minEthOut` is a slippage parameter.

#### **Price Calculations**

Your Dapp should use these view functions to estimate trades for users:

-   `getCurrentPrice()`: Returns the current instantaneous price of 1 token in ETH.
-   `calculateTokensOut(uint256 ethIn)`: Calculates how many tokens a user will get for a given amount of ETH.
-   `calculateEthOut(uint256 tokensIn)`: Calculates how much ETH a user will get for selling a given amount of tokens.

#### **Built-in Protections (Important for Dapp UX)**

The contract has several protection mechanisms a Dapp must be aware of to provide a good user experience.

**1. Anti-Bot Measures:**
-   Users have a cooldown period between buys (`getUserCooldown`). Your UI should reflect this.
-   There are limits on buy amounts in the first few minutes after launch (`getAntiBotInfo`).

**2. Whale Protection (Intent-to-Trade):**
Large trades (both buys and sells) that exceed the `whaleThreshold` require a two-step process to prevent price manipulation.

-   **Step 1: Register Intent:**
    -   The user attempts a large trade by calling `buy` or `sell`.
    -   The transaction will **revert** with a `WhaleIntentRequired` error. This is expected.
    -   The Dapp should catch this, and immediately call the **same function again** with the **same parameters**. This second call registers the user's "intent to trade" and will also revert, but this time with a `WhaleIntentNotReady` error.
-   **Step 2: Execute Trade:**
    -   The user must now wait for a cooldown period (`whaleDelay`). The Dapp can query `getWhaleIntent(address)` to see the status and when the trade can be executed.
    -   After the delay, the user calls the **same `buy` or `sell` function a third time** with the exact same parameters. This will finally execute the trade.

Your Dapp's UI must guide the user through this "register, wait, execute" flow for large trades.

**3. Circuit Breaker:**
-   Trading can be automatically halted if the system detects extreme volatility or a high-impact trade.
-   Use `getCircuitBreakerStatus()` to check if trading is paused and for how long. Your UI should disable trading and inform the user if the circuit breaker is active.

#### **Key View Functions for a Dapp UI**

-   `getReserves()`: Get the current state of the bonding curve reserves.
-   `getTradeLimits()`: Get current trade size limits and whale thresholds.
-   `getAntiBotInfo()`: Get status of anti-bot measures.
-   `getUserCooldown(address)`: Check the remaining buy cooldown for a user.
-   `getCircuitBreakerStatus()`: Check if trading is paused.
-   `getWhaleIntent(address)`: Check a user's pending whale trade intent.

### Phase 2: Graduation & DEX Trading

When the contract's ETH balance (`realEthReserves`) reaches the `GRADUATION_THRESHOLD`, it automatically "graduates".

#### **What Happens During Graduation?**

1.  The `_graduate()` function is triggered.
2.  The `buy()` and `sell()` functions on the `CarbonCoin` contract are permanently disabled.
3.  The contract mints its remaining token supply.
4.  It takes all the ETH it holds and all the newly minted tokens and adds them as a liquidity pair on the designated DEX (e.g., Somnia Exchange).
5.  The LP (Liquidity Provider) tokens are sent to the original `creator` of the coin.

#### **Dapp Integration After Graduation**

-   **Detection:** Your Dapp must monitor the `hasGraduated` boolean variable on the `CarbonCoin` contract. Once `true`, the Dapp should change its UI. The `Graduated` event is also emitted.
-   **UI Change:** The Dapp should replace its native "buy/sell" interface with a link or widget that directs users to the token's trading page on the DEX. The address of the new DEX pair can be found in the `Graduated` event or by calling `dexPair()` on the `CarbonCoin` contract.
-   **Trading:** All future trades happen on the DEX, not the `CarbonCoin` contract.

---

## 4. `CarbonOpus` - The Music NFT Marketplace

The `CarbonOpus` contract is an ERC-1155 NFT marketplace designed for artists to sell their music.

### Key Purpose

-   To allow artists to mint their music as NFTs.
-   To enable users to purchase these music NFTs.
-   To distribute royalties from sales to artists and referrers.
-   To collect a protocol fee on each transaction.

### Dapp Integration: Minting and Purchasing Music

#### **Minting a Song (for Artists)**

An artist can mint a new song NFT by calling `mintMusic`:

```solidity
function mintMusic(address receiver, uint256 price, uint256 referralPct) external;
```

-   **Parameters:**
    -   `receiver`: The address that will own the newly minted song (usually the artist).
    -   `price`: The price in ETH for one edition of the song.
    -   `referralPct`: The percentage of the sale price (in basis points) that will be given to a referrer.
-   **Event:** The `SongMinted` event is emitted, which a Dapp can use to track new songs.

#### **Purchasing a Song**

A user can purchase a song NFT by calling `purchaseMusic`:

```solidity
function purchaseMusic(address receiver, uint256 tokenId, address referrer) external payable;
```

-   **Parameters:**
    -   `receiver`: The address that will receive the purchased NFT.
    -   `tokenId`: The ID of the song to purchase.
    -   `referrer`: An optional address of a user who referred the sale.
-   **Value:** The caller must send ETH equal to the song's `price`.
-   **Events:**
    -   `SongPurchased`: Indicates a successful purchase.
    -   `RewardsDistributed`: Details how the payment was split between the artist, referrer, and protocol.

#### **Batch Purchasing**

Users can buy multiple songs in one transaction using `purchaseBatch`:

```solidity
function purchaseBatch(address receiver, uint256[] memory tokenIds, address[] memory referrers) external payable;
```

### Managing Songs and Rewards

#### **For Artists:**

-   `updateSongPrice(uint256 tokenId, uint256 newPrice)`: Allows an artist to change the price of their song.
-   `updateSongReferralPct(uint256 tokenId, uint256 newPct)`: Allows an artist to change the referral percentage.

#### **For All Users:**

-   `claimRewards(address payable receiver)`: Allows any user (artist or referrer) to withdraw their accumulated ETH rewards.
-   `rewards(address user)`: A public mapping to check a user's claimable rewards.
-   `musicBalance(address user)`: Returns the token IDs and balances of songs owned by a user.

### Administrative Functions

These functions are restricted to the contract owner or a designated manager:

-   `updateProtocolFee(uint256 newFee)`: Change the protocol fee.
-   `updateTreasury(address newTreasury)`: Change the address where protocol fees are sent.
-   `updatePriceScaleManager(address newManager)`: Transfer the `priceScaleManager` role.
-   `scaleSongPrice(uint256 tokenId, uint256 newPrice)`: A privileged function for the `priceScaleManager` to update a song's price.
-   `setURI(string memory newUri)`: Update the base URI for the token metadata.

### Tokenomics and Fees

-   **Protocol Fee:** A percentage of every sale is sent to the treasury. The fee is set by `protocolFee` (in basis points).
-   **Referral Fee:** A percentage of the sale, set by the artist, is awarded to a referrer.
-   **Artist's Share:** The remainder of the sale price goes to the artist.

---

# Protofire Subgraph

The blockchain is an ever-growing database of transactions and Smart Contract events. Developers use subgraphs, an indexing solution provided by the Graph protocol, to retrieve and analyze this data efficiently.

A graph in this context represents the structure of blockchain data, including token transfers, contract events, and user interactions. A subgraph is a customized indexing service that listens to blockchain transactions and structures them in a way that can be easily queried using GraphQL.

{% embed url="<https://www.youtube.com/watch?v=Dbk7KHSyt_I>" %}

## Prerequisites

* This guide is not an introduction to Solidity Programming; you are expected to understand Basic Solidity Programming.
* GraphQL is installed and set up on your local machine.&#x20;

```bash
npm install -g @graphprotocol/graph-cli
```

## Deploy a Simple ERC20 Token on Somnia

We will deploy a basic ERC20 token on the Somnia network using Hardhat. Ensure you have Hardhat, OpenZeppelin, and dotenv installed:

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-ignition-ethers @openzeppelin/contracts dotenv ethers
```

## Create an ERC20 Token Contract

Create a new Solidity file: `contracts/MyToken.sol` and update it

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MyToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("MyToken", "MTK") {
        _mint(msg.sender, initialSupply * 10**decimals());
    }
function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
```

## Create a Deployment Script

Create a new file in `ignition/modules/MyTokenModule.ts`

```typescript
import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("MyTokenModule", (m) => {
    const initialSupply = m.getParameter("initialSupply", 1000000n * 10n ** 18n);

    const myToken = m.contract("MyToken", [initialSupply]);
    return { myToken };
});
```

## Deploy the Smart Contract

Open the hardhat.config.js file and update the network information by adding Somnia Network to the list of networks. Copy your Wallet Address Private Key from MetaMask, and add it to the accounts section. Ensure there are enough STT Token in the Wallet Address to pay for Gas. You can get some from the Somnia Faucet.\\

```javascript
module.exports = {
  // ...
  networks: {
    somniaTestnet: {
      url: "https://dream-rpc.somnia.network",
      accounts: ["0xPRIVATE_KEY"], // put dev menomonic or PK here,
    },
   },
  // ...
};

```

Open a new terminal and deploy the smart contract to the Somnia Network. Run the command:

```bash
npx hardhat ignition deploy ./ignition/modules/MyTokenModule.ts --network somniaTestnet

```

This will deploy the ERC20 contract to the Somnia network and return the deployed contract address.

## Simulate On-Chain Activity

Once deployed, we will create a script to generate multiple transactions on the blockchain.

Create a new file `scripts/interact.js`

<details>

<summary><code>interact.js</code></summary>

```javascript
require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  // Connect to Somnia RPC
  const provider = new ethers.JsonRpcProvider(process.env.SOMNIA_RPC_URL);

  // Load wallets from .env
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY_1, provider);
  const user1 = new ethers.Wallet(process.env.PRIVATE_KEY_2, provider);
  const user2 = new ethers.Wallet(process.env.PRIVATE_KEY_3, provider);
  const user3 = new ethers.Wallet(process.env.PRIVATE_KEY_4, provider);
  const user4 = new ethers.Wallet(process.env.PRIVATE_KEY_5, provider);

  const contractAddress = "0xBF9516ADc5263d277E2505d4e141F7159B103d33"; // Replace with your deployed contract address
  const abi = [
    "function transfer(address to, uint256 amount) external returns (bool)",
    "function mint(address to, uint256 amount) external",
    "function burn(uint256 amount) external",
  ];

  // Attach to the deployed ERC20 contract
  const token = new ethers.Contract(contractAddress, abi, provider);

  console.log("🏁 Starting Token Transactions Simulation on Somnia...");

  // Simulate Transfers
  const transfers = [
    { from: deployer, to: user1.address, amount: "1000" },
    { from: deployer, to: user2.address, amount: "1000" },
    { from: user1, to: user2.address, amount: "50" },
    { from: user2, to: user3.address, amount: "30" },
    { from: user3, to: user4.address, amount: "10" },
    { from: user4, to: deployer.address, amount: "5" },
    { from: deployer, to: user2.address, amount: "100" },
    { from: user1, to: user3.address, amount: "70" },
    { from: user2, to: user4.address, amount: "40" },
  ];

  for (const tx of transfers) {
    const { from, to, amount } = tx;
    const txResponse = await token.connect(from).transfer(to, ethers.parseUnits(amount, 18));
    await txResponse.wait();
    console.log(`✅ ${from.address} sent ${amount} MTK to ${to}`);
  }

  // Simulate Minting
  const mintAmount1 = ethers.parseUnits("500", 18);
  const mintTx1 = await token.connect(deployer).mint(user1.address, mintAmount1);
  await mintTx1.wait();
  console.log(`✅ Minted ${ethers.formatUnits(mintAmount1, 18)} MTK to User1!`);

  const mintAmount2 = ethers.parseUnits("300", 18);
  const mintTx2 = await token.connect(deployer).mint(user2.address, mintAmount2);
  await mintTx2.wait();
  console.log(`✅ Minted ${ethers.formatUnits(mintAmount2, 18)} MTK to User2!`);

  // Simulate Burning
  const burnAmount1 = ethers.parseUnits("50", 18);
  const burnTx1 = await token.connect(user1).burn(burnAmount1);
  await burnTx1.wait();
  console.log(`🔥 User1 burned ${ethers.formatUnits(burnAmount1, 18)} MTK!`);

  const burnAmount2 = ethers.parseUnits("100", 18);
  const burnTx2 = await token.connect(user2).burn(burnAmount2);
  await burnTx2.wait();
  console.log(`🔥 User2 burned ${ethers.formatUnits(burnAmount2, 18)} MTK!`);

  console.log("🏁 Simulation Complete on Somnia!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

</details>

&#x20;Create an `.env` file to hold sensitive informations such as the private keys

```properties
SOMNIA_RPC_URL=https://dream-rpc.somnia.network
PRIVATE_KEY_1=0x...
PRIVATE_KEY_2=0x...
PRIVATE_KEY_3=0x...
PRIVATE_KEY_4=0x...
PRIVATE_KEY_5=0x...
```

#### Run the Script

```bash
node scripts/interact.js
```

This will generate several on-chain transactions for our subgraph to index.

## Deploy a Subgraph on Somnia

Go to <https://somnia.chain.love/> and connect your Wallet.

<figure><img src="https://lh7-rt.googleusercontent.com/docsz/AD_4nXcOA43Zg4tecvciwgPQxb-dlcBwhPkTGY0POkIQ8JaUdKcaheg-AwetWTR1yFdYSGw_A2c_fm-xuQba6mVDitI_rD7wuazgEsjBjUjxT8-0ELLl9CW0JFlzNuPLHlZYXKy7VP16_A?key=ZDOrGANolV8eE-n5bJ-_qrWy" alt=""><figcaption></figcaption></figure>

First, you need to create a private key for deploying subgraphs. To do so, please go to [Somnia Protofire Service](https://somnia.chain.love) and create an Account.

You are now able to create subgraphs. Click the create button and enter the required details.

<figure><img src="https://lh7-rt.googleusercontent.com/docsz/AD_4nXdbWSqj7ddwv0yFj8FlHdDGGlJmeqmRakTRUNX2LUCUHlqPjcK2eSBdRwnwwZ5pq8T-3op10MJwdknOn-KfCDbsJ4nuI7Uu39obkcb8gYfVTlRhrt1s4IJ3U7VNgEnMW0mMN7hK6w?key=ZDOrGANolV8eE-n5bJ-_qrWy" alt=""><figcaption></figcaption></figure>

<figure><img src="https://lh7-rt.googleusercontent.com/docsz/AD_4nXex3AIr44-pbEiLznhnQE0xhOYHgtOmwRyu8HwXjFWsTQLM9JtyFD10YPZdDxY0qFNVC2JUqt_29q8VtSmV0emS8VVOZrF4VfYUUxmqQM3yF-_c29E9vQaRfvVoV7Guu6AkI8mgUw?key=ZDOrGANolV8eE-n5bJ-_qrWy" alt=""><figcaption></figcaption></figure>

After initialising the subgraph on <https://somnia.chain.love/> the next step is to create and deploy the subgraph via the terminal.

## Initialize the Subgraph

```bash
graph init --contract-name MyToken --from-contract 0xYourTokenAddress --network somnia-testnet mytoken
```

<figure><img src="https://lh7-rt.googleusercontent.com/docsz/AD_4nXeFtlgKbMC4sCBfwGl1xI76iHiOxsc7jKZtg9BUeMGiTsormp5HRYnreVlo4cpuZe23eESQT9pgbCdf9dQ4lKw_-fjsBwPLd-DZd-o_Gc3BA9VxjE95i05yuXDacPmNBbwsEvvvbA?key=ZDOrGANolV8eE-n5bJ-_qrWy" alt=""><figcaption></figcaption></figure>

Then, update networks.json to use Somnia’s RPC

```bash
{
  "somnia-testnet": {
    "network": "Somnia Testnet",
    "rpc": "https://dream-rpc.somnia.network",
    "startBlock": 12345678
  }
}
```

## Define the Subgraph Schema

📁 Edit schema.graphql

```bash
type Transfer @entity(immutable: true) {
  id: Bytes!
  from: Bytes!
  to: Bytes!
  value: BigInt!
  blockNumber: BigInt!
  blockTimestamp: BigInt!
  transactionHash: Bytes!
}
```

## Build the Subgraph

```bash
graph codegen
graph build
```

## Deploy the Subgraph

```bash
graph deploy --node https://proxy.somnia.chain.love/graph/somnia-testnet --version-label 0.0.1 somnia-testnet/test-mytoken
--access-token=your_token_from_somnia_chain_love
```

<figure><img src="https://lh7-rt.googleusercontent.com/docsz/AD_4nXfc-Mu-wBk_mvxbW4Rz6ODZK_RtWPtTxDjKcldwtudapplfGjxVMZTGS_xzX73VOp_XcRCiicQsA-q7yXG0x8Tz6vyCeTU1Lw08Kmi8rbZlWapYgskmfWXgHo3t2Rgypy3x3cfd0A?key=ZDOrGANolV8eE-n5bJ-_qrWy" alt=""><figcaption></figcaption></figure>

## Query the Subgraph

Once your subgraph is deployed and indexing blockchain data on Somnia, you can retrieve information using GraphQL queries. These queries allow you to efficiently access structured data such as token transfers, approvals, and contract interactions without having to scan the blockchain manually.

Developers can query indexed blockchain data in real time using the Graph Explorer or a GraphQL client. This enables DApps, analytics dashboards, and automated systems to interact more efficiently with blockchain events.

This section demonstrates how to write and execute GraphQL queries to fetch blockchain data indexed by the subgraph. Go to <https://somnia.chain.love/graph/17>&#x20;

### Fetch Latest Transfers

```json
{
  transfers(first: 10, orderBy: blockTimestamp, orderDirection: desc) {
    id
    from
    to
    value
    blockTimestamp
    transactionHash
  }
}
```

### Get Transfers by Address

```json
{
  transfers(where: { from: "0xUserWalletAddress" }) {
    id
    from
    to
    value
  }
}
```

### Get Transfers in a Time Range

```
{
  transfers(where: { blockTimestamp_gte: "1700000000", blockTimestamp_lte: "1710000000" }) {
    id
    from
    to
    value
  }
}
```

## Conclusion

This tutorial provides a complete pipeline for indexing blockchain data on Somnia using The Graph! 🔥

# CarbonOpus Subgraph

This subgraph indexes the CarbonOpus protocol on the Somnia chain, providing a rich and queryable API for all on-chain activities related to the `CarbonCoinLauncher` and `CarbonCoin` smart contracts.

## Key Features

-   **Holder Tracking**: Tracks the total number of holders for each token and the balance of each holder.
-   **Creator Allocation**: Automatically allocates 10% of the total supply to the creator at the time of deployment.
-   **Comprehensive Event Tracking**: Captures a wide range of events to provide rich data for a live trading market, including:
    -   `TokensPurchased` and `TokensSold` for detailed economic data.
    -   `Approval` for tracking intent to sell.
    -   `WhaleIntentRegistered`, `WhaleIntentCancelled`, and `WhaleTradeExecuted` for monitoring large trades.
    -   `CircuitBreakerTriggered` and `CircuitBreakerReset` for tracking trading pauses.
    -   `AddressBlacklisted` and `BotDetected` for security and user information.

## Schema

The GraphQL schema (`schema.graphql`) defines the following main entities:

-   `Token`: Represents a `CarbonCoin` token.
-   `Creator`: Represents the creator of a token.
-   `User`: Represents a user of the protocol.
-   `Holder`: Represents a user's balance of a specific token.
-   `Transaction`: Represents a buy, sell, or transfer transaction.
-   `Approval`: Represents an ERC20 approval.
-   `WhaleIntent`: Represents a pending large trade.
-   `Bot`: Represents a detected bot.

## Getting Started

The `README.md` file in the `carbon-graph` directory contains detailed instructions on how to set up, configure, build, and deploy the subgraph.

Deployed to https://proxy.somnia.chain.love/subgraphs/name/somnia-testnet/carbon-opus-staging/graphql

Subgraph endpoints:
Queries (HTTP):     https://proxy.somnia.chain.love/subgraphs/name/somnia-testnet/carbon-opus-staging
