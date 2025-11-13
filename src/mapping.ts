import { BigInt, Address, log } from "@graphprotocol/graph-ts";
import {
  TokenCreated,
} from "../generated/CarbonCoinLauncher/CarbonCoinLauncher";
import {
  Transfer,
  Graduated,
  CarbonCoin,
  TokensPurchased,
  TokensSold,
  Approval,
  WhaleIntentRegistered,
  WhaleIntentCancelled,
  WhaleTradeExecuted,
  CircuitBreakerTriggered,
  CircuitBreakerReset,
  AddressBlacklisted,
  BotDetected,
} from "../generated/templates/CarbonCoin/CarbonCoin";
import { Token, Creator, Transaction, User, Holder, WhaleIntent, Bot, Approval as ApprovalEntity } from "../generated/schema";
import { CarbonCoin as CarbonCoinTemplate } from "../generated/templates";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function getOrCreateUser(address: string): User {
  let user = User.load(address);
  if (user == null) {
    user = new User(address);
    user.blacklisted = false;
    user.save();
  }
  return user;
}

export function handleTokenCreated(event: TokenCreated): void {
  let creator = getOrCreateUser(event.params.creator.toHexString());

  let token = new Token(event.params.tokenAddress.toHexString());
  token.creator = creator.id;
  token.name = event.params.name;
  token.symbol = event.params.symbol;
  token.createdAt = event.block.timestamp;
  token.creationFee = event.params.creationFee;
  token.graduated = false;
  token.totalHolders = BigInt.fromI32(0);
  token.isCircuitBreakerActive = false;

  let contract = CarbonCoin.bind(event.params.tokenAddress);
  let reserves = contract.getReserves();
  token.virtualEth = reserves.value2;
  token.virtualTokens = reserves.value3;
  token.realEthReserves = reserves.value0;
  token.realTokenSupply = reserves.value1;
  
  let config = contract.getTradeLimits();
  token.maxSupply = BigInt.fromI32(0); // This needs to be fetched from the BondingCurveConfig
  token.graduationThreshold = config.value2;

  token.price = contract.getCurrentPrice();

  // This is not available in the TokenCreated event
  // creator.totalFeesCollected = creator.totalFeesCollected.plus(
  //   event.params.creationFee
  // );

  creator.save();
  token.save();

  // Start indexing the new token
  CarbonCoinTemplate.create(event.params.tokenAddress);
}

export function handleTransfer(event: Transfer): void {
  let token = Token.load(event.address.toHexString());
  if (token == null) {
    log.warning("Token not found: {}", [event.address.toHexString()]);
    return;
  }
  let contract = CarbonCoin.bind(event.address);

  let fromAddress = event.params.from.toHexString();
  let toAddress = event.params.to.toHexString();

  // 1. Handle "from" address
  if (fromAddress != ZERO_ADDRESS) {
    let fromUser = getOrCreateUser(fromAddress);
    let fromHolder = Holder.load(fromAddress + "-" + token.id);
    if (fromHolder != null) {
      let oldBalance = fromHolder.balance;
      fromHolder.balance = contract.balanceOf(Address.fromString(fromAddress));
      fromHolder.save();

      if (oldBalance > BigInt.fromI32(0) && fromHolder.balance == BigInt.fromI32(0)) {
        token.totalHolders = token.totalHolders.minus(BigInt.fromI32(1));
      }
    }
  }

  // 2. Handle "to" address
  if (toAddress != ZERO_ADDRESS) {
    let toUser = getOrCreateUser(toAddress);
    let toHolder = Holder.load(toAddress + "-" + token.id);
    if (toHolder == null) {
      toHolder = new Holder(toAddress + "-" + token.id);
      toHolder.user = toUser.id;
      toHolder.token = token.id;
      toHolder.balance = BigInt.fromI32(0); // Initialize with 0
    }
    
    let oldBalance = toHolder.balance;
    toHolder.balance = contract.balanceOf(Address.fromString(toAddress));
    toHolder.save();

    if (oldBalance == BigInt.fromI32(0) && toHolder.balance > BigInt.fromI32(0)) {
      token.totalHolders = token.totalHolders.plus(BigInt.fromI32(1));
    }
  }
  
  token.save();
}

export function handleTokensPurchased(event: TokensPurchased): void {
  let token = Token.load(event.address.toHexString());
  if (token == null) {
    return;
  }

  let transaction = new Transaction(event.transaction.hash.toHexString());
  transaction.token = token.id;
  transaction.type = "buy";
  transaction.from = event.address; // Contract is the seller
  transaction.to = event.params.buyer;
  transaction.ethAmount = event.params.ethIn;
  transaction.tokenAmount = event.params.tokensOut;
  transaction.price = event.params.newPrice;
  transaction.timestamp = event.block.timestamp;
  transaction.save();

  token.realEthReserves = event.params.realEthReserves;
  token.realTokenSupply = event.params.realTokenSupply;
  token.price = event.params.newPrice;
  token.save();
}

export function handleTokensSold(event: TokensSold): void {
  let token = Token.load(event.address.toHexString());
  if (token == null) {
    return;
  }

  let transaction = new Transaction(event.transaction.hash.toHexString());
  transaction.token = token.id;
  transaction.type = "sell";
  transaction.from = event.params.seller;
  transaction.to = event.address; // Contract is the buyer
  transaction.ethAmount = event.params.ethOut;
  transaction.tokenAmount = event.params.tokensIn;
  transaction.price = event.params.newPrice;
  transaction.timestamp = event.block.timestamp;
  transaction.save();

  token.realEthReserves = event.params.realEthReserves;
  token.realTokenSupply = event.params.realTokenSupply;
  token.price = event.params.newPrice;
  token.save();
}

export function handleGraduated(event: Graduated): void {
  let token = Token.load(event.params.token.toHexString());
  if (token == null) {
    return;
  }

  token.graduated = true;
  token.graduatedAt = event.block.timestamp;
  token.dexPair = event.params.pair;
  token.price = event.params.finalPrice;
  token.save();
}

export function handleApproval(event: Approval): void {
  let token = Token.load(event.address.toHexString());
  if (token == null) {
    return;
  }
  
  let owner = getOrCreateUser(event.params.owner.toHexString());

  let approval = new ApprovalEntity(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
  approval.token = token.id;
  approval.owner = owner.id;
  approval.spender = event.params.spender;
  approval.value = event.params.value;
  approval.timestamp = event.block.timestamp;
  approval.save();
}

export function handleWhaleIntentRegistered(event: WhaleIntentRegistered): void {
  let token = Token.load(event.address.toHexString());
  if (token == null) {
    return;
  }

  let trader = getOrCreateUser(event.params.trader.toHexString());

  let intentId = token.id + "-" + trader.id;
  let whaleIntent = new WhaleIntent(intentId);
  whaleIntent.token = token.id;
  whaleIntent.trader = trader.id;
  whaleIntent.amount = event.params.amount;
  whaleIntent.isBuy = event.params.isBuy;
  whaleIntent.executeAfter = event.params.executeAfter;
  whaleIntent.timestamp = event.block.timestamp;
  whaleIntent.cancelled = false;
  whaleIntent.executed = false;
  whaleIntent.save();
}

export function handleWhaleIntentCancelled(event: WhaleIntentCancelled): void {
  let token = Token.load(event.address.toHexString());
  if (token == null) {
    return;
  }

  let trader = getOrCreateUser(event.params.trader.toHexString());
  let intentId = token.id + "-" + trader.id;
  let whaleIntent = WhaleIntent.load(intentId);

  if (whaleIntent != null) {
    whaleIntent.cancelled = true;
    whaleIntent.save();
  }
}

export function handleWhaleTradeExecuted(event: WhaleTradeExecuted): void {
  let token = Token.load(event.address.toHexString());
  if (token == null) {
    return;
  }

  let trader = getOrCreateUser(event.params.trader.toHexString());
  let intentId = token.id + "-" + trader.id;
  let whaleIntent = WhaleIntent.load(intentId);

  if (whaleIntent != null) {
    whaleIntent.executed = true;
    whaleIntent.save();
  }
}

export function handleCircuitBreakerTriggered(event: CircuitBreakerTriggered): void {
  let token = Token.load(event.address.toHexString());
  if (token == null) {
    return;
  }

  token.isCircuitBreakerActive = true;
  token.circuitBreakerTriggeredAt = event.params.timestamp;
  token.circuitBreakerDuration = event.params.duration;
  token.save();
}

export function handleCircuitBreakerReset(event: CircuitBreakerReset): void {
  let token = Token.load(event.address.toHexString());
  if (token == null) {
    return;
  }

  token.isCircuitBreakerActive = false;
  token.save();
}

export function handleAddressBlacklisted(event: AddressBlacklisted): void {
  let user = getOrCreateUser(event.params.account.toHexString());
  user.blacklisted = event.params.blacklisted;
  user.save();
}

export function handleBotDetected(event: BotDetected): void {
  let user = getOrCreateUser(event.params.suspect.toHexString());
  let bot = new Bot(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
  bot.user = user.id;
  bot.reason = event.params.reason;
  bot.timestamp = event.block.timestamp;
  bot.save();
}
