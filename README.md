# CarbonOpus Subgraph

This subgraph indexes the CarbonOpus protocol on the Somnia chain, providing a rich and queryable API for all on-chain activities related to the `CarbonCoinLauncher` and `CarbonCoin` smart contracts. It is designed to power the CarbonOpus frontend and provide valuable data for developers, traders, and users.

## Overview

The CarbonOpus protocol allows creators to launch their own `CarbonCoin` tokens, which can then be traded on a bonding curve. This subgraph tracks the entire lifecycle of these tokens, from creation to graduation on a DEX.

The subgraph also indexes the `CarbonOpus` contract, which is the main entry point for all music-related NFTs. It is responsible for minting, buying, and selling music NFTs. It also handles the distribution of royalties to artists and referrers.

The subgraph indexes the following key information:
- **Tokens**: Details of each `CarbonCoin` created, including its name, symbol, creator, and bonding curve parameters.
- **Creators**: Information about the creators of the tokens.
- **Transactions**: All token purchases, sales, and transfers.
- **Holders**: The balance of each token holder.
- **Whale Intents**: Pending large trades.
- **Circuit Breaker Status**: Real-time status of trading pauses.
- **Security**: Blacklisted addresses and detected bots.
- **Songs**: Music NFTs minted on the `CarbonOpus` contract.
- **Artists**: Artists who have minted songs.
- **Song Purchases**: Purchases of music NFTs.
- **Rewards**: Rewards claimed by artists and referrers.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Yarn](https://yarnpkg.com/)
- [Graph CLI](https://thegraph.com/docs/en/developing/graph-cli/): `npm install -g @graphprotocol/graph-cli`

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/your-repo/carbon-graph.git
    cd carbon-graph
    ```
2.  Install the dependencies:
    ```bash
    yarn install
    ```

## Configuration

The subgraph is configured in the `subgraph.yaml` file. The main things you might want to change are:

-   **Contract Addresses**: The `source.address` for the `CarbonCoinLauncher` and `CarbonOpus` data sources should be updated to the address of the deployed contract on the desired network.
-   **Network**: The `network` field for the data sources and templates should be updated to the target network (e.g., `mainnet`, `rinkeby`, `somnia-testnet`).
-   **Start Block**: The `source.startBlock` for the data sources should be set to the block number where the contract was deployed to speed up indexing.

## Building and Deployment

1.  **Generate Types**: After making any changes to the schema (`schema.graphql`) or ABIs, you need to regenerate the AssemblyScript types:
    ```bash
    npx graph codegen
    ```
2.  **Build the Subgraph**:
    ```bash
    npx graph build
    ```
3.  **Deploy to The Graph**:
    -   Authenticate with your deploy key:
        ```bash
        graph auth --product hosted-service <YOUR_ACCESS_TOKEN>
        ```
    -   Deploy the subgraph:
        ```bash
        graph deploy --product hosted-service <YOUR_GITHUB_USER>/<SUBGRAPH_NAME>
        ```

## Schema Overview

The GraphQL schema is defined in `schema.graphql`. It includes the following main entities:

-   `Token`: Represents a `CarbonCoin` token.
-   `Creator`: Represents the creator of a token.
-   `User`: Represents a user of the protocol.
-   `Holder`: Represents a user's balance of a specific token.
-   `Transaction`: Represents a buy, sell, or transfer transaction.
-   `Approval`: Represents an ERC20 approval.
-   `WhaleIntent`: Represents a pending large trade.
-   `Bot`: Represents a detected bot.
-   `Song`: Represents a music NFT.
-   `Artist`: Represents an artist who has minted a song.
-   `Buyer`: Represents a user who has purchased a song.
-   `Referrer`: Represents a user who has referred a buyer to a song.
-   `SongPurchase`: Represents a purchase of a music NFT.
-   `Reward`: Represents a reward that has been claimed by an artist or referrer.
-   `Protocol`: Represents the protocol-wide statistics.

For more details, please refer to the `schema.graphql` file.

## Event Handlers

The subgraph handles the following events from the `CarbonCoinLauncher`, `CarbonCoin`, and `CarbonOpus` contracts:

-   `TokenCreated`: Triggered when a new `CarbonCoin` is created.
-   `Transfer`: Triggered on token transfers, used to track holder balances.
-   `TokensPurchased` / `TokensSold`: Triggered on buys and sells, used to create detailed transaction entities.
-   `Approval`: Triggered on ERC20 approvals.
-   `WhaleIntentRegistered` / `WhaleIntentCancelled` / `WhaleTradeExecuted`: Used to track the lifecycle of whale intents.
-   `CircuitBreakerTriggered` / `CircuitBreakerReset`: Used to track the status of the circuit breaker.
-   `AddressBlacklisted` / `BotDetected`: Used for security monitoring.
-   `SongMinted`: When a new song is minted.
-   `SongPurchased`: When a song is purchased.
-   `SongPriceUpdated`: When the price of a song is updated by the artist.
-   `SongPriceScaled`: When the price of a song is scaled by the price scale manager.
-   `SongReferralPctUpdated`: When the referral percentage of a song is updated by the artist.
-   `RewardsClaimed`: When an artist or referrer claims their rewards.
-   `RewardsDistributed`: When rewards are distributed to artists and referrers.

## Example Queries

Here are a few example GraphQL queries you can use to query the subgraph:

### Get the 10 most recently created tokens

```graphql
{
  tokens(first: 10, orderBy: createdAt, orderDirection: desc) {
    id
    name
    symbol
    creator {
      id
    }
    totalHolders
  }
}
```

### Get the holders of a specific token

```graphql
{
  token(id: "0x...") {
    holders(first: 100, orderBy: balance, orderDirection: desc) {
      user {
        id
      }
      balance
    }
  }
}
```

### Get the recent transactions for a token

```graphql
{
  token(id: "0x...") {
    transactions(first: 20, orderBy: timestamp, orderDirection: desc) {
      id
      type
      from
      to
      ethAmount
      tokenAmount
      price
      timestamp
    }
  }
}
```

### Get the 10 most recently minted songs

```graphql
{
  songs(first: 10, orderBy: createdAt, orderDirection: desc) {
    id
    artist {
      id
    }
    price
    referralPct
    createdAt
  }
}
```