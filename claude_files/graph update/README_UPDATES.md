# GraphQL Schema and Mapping Updates

## Overview
This update brings the GraphQL schema, subgraph template, and mappings in sync with the current smart contract implementations for CarbonCoin ecosystem.

## Major Changes

### 1. New Data Sources
- **CarbonCoinProtection**: Now indexed as a separate data source (previously events were from CarbonCoin)
- **CarbonCoinConfig**: New data source for configuration updates

### 2. Schema Updates

#### Token Entity
**New Fields:**
- `liquidityTokens`: BigInt - Tokens deposited to DEX on graduation
- `liquidityUsdc`: BigInt - USDC deposited to DEX on graduation
- `virtualUsdc`: BigInt - Virtual USDC reserve for bonding curve
- `virtualTokens`: BigInt - Virtual token reserve for bonding curve
- `protectionEvents`: [ProtectionEvent!]! - All protection-related events
- `bots`: [BotDetection!]! - Bot detection events
- `emergencyWithdrawals`: [EmergencyWithdrawal!]! - Emergency withdrawal events

**Renamed Fields:**
- `virtualEth` → `virtualUsdc`
- `realEthReserves` → `realUsdcReserves`

**Removed Fields:**
- `dexPair` (now we track liquidityTokens/liquidityUsdc instead)

#### Transaction Entity
**Changed:**
- `type`: Now only "buy" or "sell" (removed "transfer")
- `from` → `trader`: Address of buyer/seller
- `to` → removed
- `ethAmount` → `usdcAmount`
- Added `realUsdcReserves` and `realTokenSupply` snapshots

#### User Entity
**Changed:**
- `blacklisted`: Boolean → [BlacklistEvent!]! (now tracks history)
- `whitelisted`: Boolean → [WhitelistEvent!]! (now tracks history)

#### Launcher Entity
**New Fields:**
- `controller`: Address of the controller
- `feeReceipts`: [FeeReceipt!]! - Fee payment events
- `feeWithdrawals`: [FeeWithdrawal!]! - Fee withdrawal events

#### New Entities
- `BlacklistEvent`: Historical blacklist status changes
- `WhitelistEvent`: Historical whitelist status changes
- `ProtectionEvent`: Circuit breaker, volatility warnings, price impact events
- `EmergencyWithdrawal`: Emergency USDC withdrawals
- `FeeReceipt`: Fee payments to launcher
- `FeeWithdrawal`: Fee withdrawals from launcher
- `ConfigUpdate`: Configuration change events

**Removed Entities:**
- `Bot` → `BotDetection` (renamed for clarity)

### 3. Event Updates

#### CarbonCoinLauncher
**New Events:**
- `ControllerUpdated(indexed address)`
- `FeeReceived(indexed address,uint256,uint256)`

**Changed Events:**
- `TokenGraduated`: Now only has `(indexed address,uint256)` - emitted by launcher with timestamp only

#### CarbonCoin (Template)
**New Events:**
- `TokenDeployed(indexed address,indexed address,string,string,uint256,uint256,uint256)`
- `EmergencyWithdraw(indexed address,uint256,uint256)`
- `LiquiditySnapshot(uint256,uint256,uint256,uint256)`
- `CreatorReserveMinted(indexed address,uint256,uint256)`

**Changed Events:**
- `TokensPurchased`: Now includes `timestamp` parameter
- `TokensSold`: Now includes `timestamp` parameter
- `Graduated`: Changed signature to `(indexed address,uint256,uint256,uint256,uint256)` - includes liquidityTokens, liquidityUsdc, finalPrice, timestamp
- `PriceUpdate`: Now `(uint256,uint256,uint256,uint256)` - price, usdcReserves, tokenSupply, timestamp

**Removed Events:**
- `Paused(address)` and `Unpaused(address)` - ERC20 pause events removed

#### CarbonCoinProtection (New Data Source)
All protection events now emitted by Protection contract with `indexed address token` as first parameter:
- `BotDetected(indexed address,indexed address,string,uint256)`
- `AddressBlacklisted(indexed address,indexed address,bool,uint256)`
- `AddressWhitelisted(indexed address,indexed address,bool,uint256)`
- `CircuitBreakerTriggered(indexed address,string,uint256,uint256)`
- `CircuitBreakerReset(indexed address,uint256)`
- `VolatilityWarning(indexed address,uint256,uint256)` - NEW
- `HighPriceImpact(indexed address,indexed address,uint256,uint256)` - NEW
- `WhaleIntentRegistered(indexed address,indexed address,uint256,bool,uint256,uint256)`
- `WhaleTradeExecuted(indexed address,indexed address,uint256,bool,uint256)`
- `WhaleIntentCancelled(indexed address,indexed address,uint256)`

#### CarbonCoinConfig (New Data Source)
- `DefaultConfigUpdated(string,uint256)`

### 4. Mapping Changes

#### carbonCoinLauncherMapping.ts
- Added handlers for `ControllerUpdated` and `FeeReceived`
- Updated `handleTokenCreated` to use `try_*` calls for safety
- Updated `handleTokenGraduated` to match new signature

#### carbonCoinMapping.ts (Template)
- New handlers: `handleTokenDeployed`, `handleEmergencyWithdraw`, `handleLiquiditySnapshot`, `handleCreatorReserveMinted`
- Updated `handleTokensPurchased` and `handleTokensSold` to use new event parameters
- Updated `handleGraduated` to use new event signature with liquidity data
- Removed `handlePaused` and `handleUnpaused`
- Added `try_*` safety checks for contract calls

#### carbonCoinProtectionMapping.ts (New File)
- Handles all protection events from the Protection contract
- Creates separate event entities for historical tracking
- Updates Token state for circuit breaker and volatility

#### carbonCoinConfigMapping.ts (New File)
- Handles configuration update events

## Migration Notes

### For Existing Subgraphs
1. **Breaking Changes**: The schema has breaking changes. You'll need to:
   - Re-deploy the subgraph
   - Re-index from the beginning
   - Update any queries that reference renamed/removed fields

2. **New ABIs Required**:
   - CarbonCoinProtection.json
   - CarbonCoinConfig.json
   - Updated CarbonCoin.json
   - Updated CarbonCoinLauncher.json

3. **Deployment Variables**:
   Add to your deployment config:
   ```yaml
   carbonCoinProtectionAddress: "0x..."
   carbonCoinProtectionStartBlock: 12345
   carbonCoinConfigAddress: "0x..."
   carbonCoinConfigStartBlock: 12345
   ```

### Query Migration Examples

**Old:**
```graphql
{
  tokens {
    realEthReserves
    virtualEth
    dexPair
  }
  users {
    blacklisted
    whitelisted
  }
}
```

**New:**
```graphql
{
  tokens {
    realUsdcReserves
    virtualUsdc
    liquidityTokens
    liquidityUsdc
  }
  users {
    blacklisted { blacklisted timestamp }
    whitelisted { whitelisted timestamp }
  }
}
```

## Files Included

1. **schema.graphql** - Updated entity definitions
2. **subgraph.template.yaml** - Updated template with all data sources and event handlers
3. **carbonCoinLauncherMapping.ts** - Updated launcher event handlers
4. **carbonCoinMapping.ts** - Updated token template handlers
5. **carbonCoinProtectionMapping.ts** - NEW: Protection event handlers
6. **carbonCoinConfigMapping.ts** - NEW: Config event handlers
7. **carbonOpusMapping.ts** - Unchanged (included for completeness)

## Deployment Checklist

- [ ] Update contract ABIs in `./ref/abis/`
- [ ] Update deployment addresses in config
- [ ] Update start blocks for all contracts
- [ ] Deploy subgraph
- [ ] Verify all entities are being indexed
- [ ] Update frontend queries to use new schema
- [ ] Test protection events are being captured
- [ ] Test config updates are being captured

## Testing Recommendations

1. Create a test token and verify:
   - Token creation event is captured
   - Creator reserve is tracked
   - Virtual reserves are correct

2. Execute trades and verify:
   - Buy/sell transactions are recorded
   - Price updates are tracked
   - USDC amounts (not ETH) are stored

3. Trigger protection features and verify:
   - Circuit breaker events are captured
   - Whale intents are tracked
   - Bot detections are logged

4. Test graduation and verify:
   - Liquidity amounts are tracked
   - Final price is recorded
   - Timestamp is correct

## Support

For questions or issues, please refer to:
- Contract interfaces: `/All_Contract_Interfaces`
- Event signatures: Check contract ABIs
- Example queries: See GraphQL playground
