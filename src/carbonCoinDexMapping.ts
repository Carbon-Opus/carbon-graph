import { BigInt, Address, log } from "@graphprotocol/graph-ts";
import {
  LiquidityDeployed,
  DexPaused,
  DexUnpaused,
  ConfigUpdated,
} from "../generated/CarbonCoinDex/CarbonCoinDex";
import { DexPair, Dex, Token, DexPauseEvent, DexConfigUpdate } from "../generated/schema";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function getOrCreateDex(): Dex {
  let dex = Dex.load("1");
  if (dex == null) {
    dex = new Dex("1");
    dex.totalPairs = BigInt.fromI32(0);
    dex.totalUsdcLocked = BigInt.fromI32(0);
    dex.totalTokensLocked = BigInt.fromI32(0);
    dex.paused = false;
    dex.config = Address.fromString(ZERO_ADDRESS);
    dex.save();
  }
  return dex;
}

export function handleLiquidityDeployed(event: LiquidityDeployed): void {
  let dex = getOrCreateDex();

  // Create DexPair entity
  let pair = new DexPair(event.params.pair.toHexString());
  pair.token = event.params.token.toHexString();
  pair.creator = event.params.creator;
  pair.pairAddress = event.params.pair;
  pair.tokenAmount = event.params.tokenAmount;
  pair.usdcAmount = event.params.usdcAmount;
  pair.liquidityTokens = event.params.liquidity;
  pair.deployedAt = event.params.timestamp;
  pair.deploymentTx = event.transaction.hash;
  pair.save();

  // Update Token entity
  let token = Token.load(event.params.token.toHexString());
  if (token != null) {
    token.dexPair = pair.id;
    token.dexPairAddress = event.params.pair;
    token.liquidityDeployed = true;
    token.liquidityDeploymentTx = event.transaction.hash;
    token.save();
  } else {
    log.warning("Token not found for liquidity deployment: {}", [
      event.params.token.toHexString()
    ]);
  }

  // Update Dex statistics
  dex.totalPairs = dex.totalPairs.plus(BigInt.fromI32(1));
  dex.totalUsdcLocked = dex.totalUsdcLocked.plus(event.params.usdcAmount);
  dex.totalTokensLocked = dex.totalTokensLocked.plus(event.params.tokenAmount);
  dex.save();
}

export function handleDexPaused(event: DexPaused): void {
  let dex = getOrCreateDex();
  dex.paused = true;
  dex.save();

  let pauseEvent = new DexPauseEvent(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  pauseEvent.dex = dex.id;
  pauseEvent.paused = true;
  pauseEvent.timestamp = event.params.timestamp;
  pauseEvent.save();
}

export function handleDexUnpaused(event: DexUnpaused): void {
  let dex = getOrCreateDex();
  dex.paused = false;
  dex.save();

  let pauseEvent = new DexPauseEvent(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  pauseEvent.dex = dex.id;
  pauseEvent.paused = false;
  pauseEvent.timestamp = event.params.timestamp;
  pauseEvent.save();
}

export function handleConfigUpdated(event: ConfigUpdated): void {
  let dex = getOrCreateDex();
  dex.config = event.params.newConfig;
  dex.save();

  let configUpdate = new DexConfigUpdate(
    event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  );
  configUpdate.dex = dex.id;
  configUpdate.newConfig = event.params.newConfig;
  configUpdate.timestamp = event.params.timestamp;
  configUpdate.save();
}
