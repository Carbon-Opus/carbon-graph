import { BigInt, Address, log } from "@graphprotocol/graph-ts";
import {
  TokenCreated,
  TokenGraduated,
  FeesWithdrawn,
  LauncherPaused,
  LauncherUnpaused,
  MaxTokensPerCreatorUpdated,
  OwnershipTransferred,
  ControllerUpdated,
  FeeReceived,
} from "../generated/CarbonCoinLauncher/CarbonCoinLauncher";
import { CarbonCoin } from "../generated/CarbonCoinLauncher/CarbonCoin";
import { Token, Creator, Launcher, FeeReceipt, FeeWithdrawal, User, Holder } from "../generated/schema";
import { CarbonCoin as CarbonCoinTemplate } from "../generated/templates";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function getOrCreateLauncher(): Launcher {
  let launcher = Launcher.load("1");
  if (launcher == null) {
    launcher = new Launcher("1");
    launcher.owner = Address.fromString(ZERO_ADDRESS);
    launcher.controller = Address.fromString(ZERO_ADDRESS);
    launcher.maxTokensPerCreator = BigInt.fromI32(0);
    launcher.paused = false;
    launcher.totalFeesCollected = BigInt.fromI32(0);
    launcher.totalTokensCreated = BigInt.fromI32(0);
    launcher.save();
  }
  return launcher;
}

function getOrCreateCreator(address: string): Creator {
  let creator = Creator.load(address);
  if (creator == null) {
    creator = new Creator(address);
    creator.createdAt = BigInt.fromI32(0);
    creator.totalFeesCollected = BigInt.fromI32(0);
    creator.save();
  }
  return creator;
}

function getOrCreateUser(address: string): User {
  let user = User.load(address);
  if (user == null) {
    user = new User(address);
    user.save();
  }
  return user;
}

export function handleTokenCreated(event: TokenCreated): void {
  let creator = getOrCreateCreator(event.params.creator.toHexString());
  let launcher = getOrCreateLauncher();
  
  if (creator.createdAt == BigInt.fromI32(0)) {
    creator.createdAt = event.params.timestamp;
  }
  creator.save();

  launcher.totalTokensCreated = launcher.totalTokensCreated.plus(BigInt.fromI32(1));
  launcher.save();

  let token = new Token(event.params.tokenAddress.toHexString());
  token.creator = creator.id;
  token.name = event.params.name;
  token.symbol = event.params.symbol;
  token.createdAt = event.params.timestamp;
  token.graduated = false;
  token.isCircuitBreakerActive = false;
  token.isPaused = false;
  token.isTradingPaused = false;
  token.lastPriceUpdate = BigInt.fromI32(0);
  token.volatilityMoveCount = BigInt.fromI32(0);
  token.totalHolders = BigInt.fromI32(0);

  // Bind to the CarbonCoin contract to get initial state
  let contract = CarbonCoin.bind(event.params.tokenAddress);
  
  // Get reserves
  let reserves = contract.try_getReserves();
  if (!reserves.reverted) {
    token.realUsdcReserves = reserves.value.value0;
    token.realTokenSupply = reserves.value.value1;
    token.virtualUsdc = reserves.value.value2;
    token.virtualTokens = reserves.value.value3;
  } else {
    token.realUsdcReserves = BigInt.fromI32(0);
    token.realTokenSupply = BigInt.fromI32(0);
    token.virtualUsdc = BigInt.fromI32(0);
    token.virtualTokens = BigInt.fromI32(0);
  }

  // Get immutable values
  let maxSupply = contract.try_MAX_SUPPLY();
  if (!maxSupply.reverted) {
    token.maxSupply = maxSupply.value;
  } else {
    token.maxSupply = BigInt.fromI32(0);
  }

  let graduationThreshold = contract.try_GRADUATION_THRESHOLD();
  if (!graduationThreshold.reverted) {
    token.graduationThreshold = graduationThreshold.value;
  } else {
    token.graduationThreshold = BigInt.fromI32(0);
  }

  let creatorReserve = contract.try_CREATOR_RESERVE_SUPPLY();
  if (!creatorReserve.reverted) {
    token.creatorAllocation = creatorReserve.value;
  } else {
    token.creatorAllocation = BigInt.fromI32(0);
  }

  // Get current price
  let currentPrice = contract.try_getCurrentPrice();
  if (!currentPrice.reverted) {
    token.price = currentPrice.value;
  } else {
    token.price = BigInt.fromI32(0);
  }

  token.save();

  // Create holder entry for creator if they received tokens
  if (token.creatorAllocation > BigInt.fromI32(0)) {
    let creatorUser = getOrCreateUser(creator.id);
    let creatorHolder = new Holder(creator.id + "-" + token.id);
    creatorHolder.user = creatorUser.id;
    creatorHolder.token = token.id;
    creatorHolder.balance = token.creatorAllocation;
    creatorHolder.save();
    
    token.totalHolders = BigInt.fromI32(1);
    token.save();
  }

  // Start indexing the new token
  CarbonCoinTemplate.create(event.params.tokenAddress);
}

export function handleTokenGraduatedFromLauncher(event: TokenGraduated): void {
  let token = Token.load(event.params.tokenAddress.toHexString());
  if (token != null) {
    token.graduated = true;
    token.graduatedAt = event.params.timestamp;
    token.save();
  }
}

export function handleFeesWithdrawn(event: FeesWithdrawn): void {
  let launcher = getOrCreateLauncher();
  
  let withdrawal = new FeeWithdrawal(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
  withdrawal.launcher = launcher.id;
  withdrawal.to = event.params.to;
  withdrawal.amount = event.params.amount;
  withdrawal.timestamp = event.params.timestamp;
  withdrawal.save();

  launcher.save();
}

export function handleLauncherPaused(event: LauncherPaused): void {
  let launcher = getOrCreateLauncher();
  launcher.paused = true;
  launcher.save();
}

export function handleLauncherUnpaused(event: LauncherUnpaused): void {
  let launcher = getOrCreateLauncher();
  launcher.paused = false;
  launcher.save();
}

export function handleMaxTokensPerCreatorUpdated(event: MaxTokensPerCreatorUpdated): void {
  let launcher = getOrCreateLauncher();
  launcher.maxTokensPerCreator = event.params.newMax;
  launcher.save();
}

export function handleLauncherOwnershipTransferred(event: OwnershipTransferred): void {
  let launcher = getOrCreateLauncher();
  launcher.owner = event.params.newOwner;
  launcher.save();
}

export function handleLauncherControllerUpdated(event: ControllerUpdated): void {
  let launcher = getOrCreateLauncher();
  launcher.controller = event.params.newController;
  launcher.save();
}

export function handleFeeReceived(event: FeeReceived): void {
  let launcher = getOrCreateLauncher();
  
  let receipt = new FeeReceipt(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
  receipt.launcher = launcher.id;
  receipt.from = event.params.from;
  receipt.amount = event.params.amount;
  receipt.timestamp = event.params.timestamp;
  receipt.save();

  launcher.totalFeesCollected = launcher.totalFeesCollected.plus(event.params.amount);
  launcher.save();
}
