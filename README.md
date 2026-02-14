# CarbonOpus Subgraph

This subgraph indexes the CarbonOpus protocol on the Somnia chain, providing a rich and queryable API for all on-chain activities related to the `CarbonCoinLauncher`, `CarbonCoin`, and `CarbonOpus` smart contracts. It is designed to power the CarbonOpus frontend and provide valuable data for developers, traders, and users.

## Overview

The CarbonOpus system allows creators to launch their own `CarbonCoin` tokens, which can then be traded on a bonding curve until they graduate to a DEX. It also features a music NFT marketplace where artists can sell their work and earn royalties.

The subgraph indexes the following key information:
- **Tokens**: Lifecycle of `CarbonCoin` tokens from creation to graduation.
- **Marketplace**: Music NFT mints, sales, and royalty distributions.
- **Transactions**: detailed logs of all buys, sells, and transfers.
- **Holders**: Real-time token balances.
- **Trading Mechanics**: Whale protection intents and circuit breaker status.
- **Security**: Bot detection and blacklist status.
- **Rewards**: Accumulated and claimed rewards for artists and referrers.

## Contracts & Events

This subgraph captures events from the following three core contracts:

### 1. CarbonCoinLauncher (Factory)
The entry point for creating new tokens.
- `TokenCreated`: Emitted when a new `CarbonCoin` is deployed. Contains the token address, creator, name, and symbol.
- `TokenGraduated`: Emitted when a token hits the bonding curve threshold and graduates to a DEX.
- `FeesWithdrawn`: Admin event when collected fees are withdrawn.
- `LauncherPaused` / `LauncherUnpaused`: Admin events when new token creation is halted or resumed.
- `MaxTokensPerCreatorUpdated`: Admin event changing the limit of tokens a single user can create.
- `OwnershipTransferred`: Admin event when the factory ownership changes.

### 2. CarbonCoin (The Token)
The individual token contract using a bonding curve.
- **Trading**:
    - `TokensPurchased`: User bought tokens from the curve.
    - `TokensSold`: User sold tokens back to the curve.
    - `PriceUpdate`: Emitted when the internal price updates.
- **Lifecycle**:
    - `Graduated`: The token has left the bonding curve and liquidity has been moved to a DEX.
- **Whale Protection**:
    - `WhaleIntentRegistered`: A large trade has been queued.
    - `WhaleIntentCancelled`: A queued trade was cancelled.
    - `WhaleTradeExecuted`: A queued large trade was successfully finalized.
- **Safety & Security**:
    - `CircuitBreakerTriggered`: Trading paused due to high volatility.
    - `CircuitBreakerReset`: Trading resumed after volatility cooldown.
    - `BotDetected`: A user was flagged as a bot.
    - `AddressBlacklisted` / `AddressWhitelisted`: Admin security actions.
    - `TradingPaused` / `TradingUnpaused`: Manual pause of trading.
    - `Paused` / `Unpaused`: Contract-wide pause.
- **Standard ERC20**:
    - `Transfer`: Token movement between accounts.
    - `Approval`: Spender approval.

### 3. CarbonOpus (Music Marketplace)
The ERC-1155 marketplace for music NFTs.
- **Music Management**:
    - `SongCreated`: A new song NFT was minted.
    - `SongPriceUpdated`: Artist changed the price of a song.
    - `SongPriceScaled`: Controller scaled the price of a song.
    - `SongReferralPctUpdated`: Artist updated the referral commission percentage.
- **Sales & Rewards**:
    - `SongPurchased`: A user bought a song.
    - `RewardsDistributed`: Split of the sale price to artist and referrer.
    - `RewardsClaimed`: User withdrew their accumulated USDC rewards.
- **Administration**:
    - `MemberAddressUpdated`: Platform mapped a Member ID to a new wallet address.
    - `ProtocolFeeUpdated`: Change in platform fee.
    - `ControllerUpdated`: Change in the platform controller address.
    - `OwnershipTransferred`: Contract ownership change.

## Schema Entities

The GraphQL schema defines the following main entities:

- `Token`: A `CarbonCoin` token.
- `Song`: A music NFT.
- `Artist` / `Creator`: The creator of a token or song.
- `User`: Any participant in the system.
- `Holder`: Tracks a user's balance of a specific token.
- `Transaction` / `SongPurchase`: Detailed records of financial interactions.
- `WhaleIntent`: Pending large trades.
- `Reward`: Log of claimed rewards.
- `Protocol`: System-wide statistics.

## Integration Guide

You can query this subgraph using any GraphQL client (Apollo, URQL, etc.) or a simple HTTP fetch.

### Endpoint
*Replace with your actual subgraph URL*
`https://api.thegraph.com/subgraphs/name/<GITHUB_USER>/<SUBGRAPH_NAME>`

### Example Queries

#### 1. Get Recently Created Tokens
```graphql
query {
  tokens(first: 5, orderBy: createdAt, orderDirection: desc) {
    id
    name
    symbol
    price
    creator {
      id
    }
  }
}
```

#### 2. Get User's Token Balances
```graphql
query GetBalances($user: ID!) {
  user(id: $user) {
    tokens {
      token {
        symbol
      }
      balance
    }
  }
}
```

#### 3. Get Recent Song Sales
```graphql
query {
  songPurchases(first: 5, orderBy: timestamp, orderDirection: desc) {
    song {
      id
      price
    }
    buyer {
      address
    }
    price
    timestamp
  }
}
```

#### 4. Check for Pending Whale Trades
```graphql
query {
  whaleIntents(where: { executed: false, cancelled: false }) {
    token {
      symbol
    }
    trader {
      id
    }
    amount
    isBuy
    executeAfter
  }
}
```

## Installation & Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Yarn](https://yarnpkg.com/)
- [Graph CLI](https://thegraph.com/docs/en/developing/graph-cli/): `npm install -g @graphprotocol/graph-cli`

### Setup

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-repo/carbon-graph.git
    cd carbon-graph
    ```
2.  Install dependencies:
    ```bash
    yarn install
    ```

### Configuration
Edit `subgraph.yaml` to update contract addresses or network settings.

### Build & Deploy
1.  **Generate Types**:
    ```bash
    npx graph codegen
    ```
2.  **Build**:
    ```bash
    npx graph build
    ```
3.  **Deploy**:
    ```bash
    graph deploy --product hosted-service <YOUR_GITHUB_USER>/<SUBGRAPH_NAME>
    ```
