import { BigInt, log } from "@graphprotocol/graph-ts";
import {
  BotDetected,
  AddressBlacklisted,
  AddressWhitelisted,
  CircuitBreakerTriggered,
  CircuitBreakerReset,
  VolatilityWarning,
  HighPriceImpact,
  WhaleIntentRegistered,
  WhaleTradeExecuted,
  WhaleIntentCancelled,
} from "../generated/CarbonCoinProtection/CarbonCoinProtection";
import { Token, User, BotDetection, BlacklistEvent, WhitelistEvent, ProtectionEvent, WhaleIntent } from "../generated/schema";

function getOrCreateUser(address: string): User {
  let user = User.load(address);
  if (user == null) {
    user = new User(address);
    user.save();
  }
  return user;
}

export function handleBotDetected(event: BotDetected): void {
  let token = Token.load(event.params.token.toHexString());
  if (token == null) {
    log.warning("Token not found for BotDetected: {}", [event.params.token.toHexString()]);
    return;
  }

  let user = getOrCreateUser(event.params.user.toHexString());
  
  let bot = new BotDetection(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
  bot.token = token.id;
  bot.user = user.id;
  bot.reason = event.params.reason;
  bot.timestamp = event.params.timestamp;
  bot.save();
}

export function handleAddressBlacklisted(event: AddressBlacklisted): void {
  let token = Token.load(event.params.token.toHexString());
  if (token == null) {
    log.warning("Token not found for AddressBlacklisted: {}", [event.params.token.toHexString()]);
    return;
  }

  let user = getOrCreateUser(event.params.user.toHexString());
  
  let blacklistEvent = new BlacklistEvent(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
  blacklistEvent.token = token.id;
  blacklistEvent.user = user.id;
  blacklistEvent.blacklisted = event.params.blacklisted;
  blacklistEvent.timestamp = event.params.timestamp;
  blacklistEvent.save();
}

export function handleAddressWhitelisted(event: AddressWhitelisted): void {
  let token = Token.load(event.params.token.toHexString());
  if (token == null) {
    log.warning("Token not found for AddressWhitelisted: {}", [event.params.token.toHexString()]);
    return;
  }

  let user = getOrCreateUser(event.params.user.toHexString());
  
  let whitelistEvent = new WhitelistEvent(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
  whitelistEvent.token = token.id;
  whitelistEvent.user = user.id;
  whitelistEvent.whitelisted = event.params.whitelisted;
  whitelistEvent.timestamp = event.params.timestamp;
  whitelistEvent.save();
}

export function handleCircuitBreakerTriggered(event: CircuitBreakerTriggered): void {
  let token = Token.load(event.params.token.toHexString());
  if (token == null) {
    log.warning("Token not found for CircuitBreakerTriggered: {}", [event.params.token.toHexString()]);
    return;
  }

  token.isCircuitBreakerActive = true;
  token.circuitBreakerTriggeredAt = event.params.timestamp;
  token.circuitBreakerDuration = event.params.duration;
  token.save();

  let protectionEvent = new ProtectionEvent(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
  protectionEvent.token = token.id;
  protectionEvent.eventType = "CircuitBreakerTriggered";
  protectionEvent.reason = event.params.reason;
  protectionEvent.duration = event.params.duration;
  protectionEvent.timestamp = event.params.timestamp;
  protectionEvent.save();
}

export function handleCircuitBreakerReset(event: CircuitBreakerReset): void {
  let token = Token.load(event.params.token.toHexString());
  if (token == null) {
    log.warning("Token not found for CircuitBreakerReset: {}", [event.params.token.toHexString()]);
    return;
  }

  token.isCircuitBreakerActive = false;
  token.save();

  let protectionEvent = new ProtectionEvent(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
  protectionEvent.token = token.id;
  protectionEvent.eventType = "CircuitBreakerReset";
  protectionEvent.timestamp = event.params.timestamp;
  protectionEvent.save();
}

export function handleVolatilityWarning(event: VolatilityWarning): void {
  let token = Token.load(event.params.token.toHexString());
  if (token == null) {
    log.warning("Token not found for VolatilityWarning: {}", [event.params.token.toHexString()]);
    return;
  }

  token.volatilityMoveCount = event.params.moveCount;
  token.save();

  let protectionEvent = new ProtectionEvent(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
  protectionEvent.token = token.id;
  protectionEvent.eventType = "VolatilityWarning";
  protectionEvent.moveCount = event.params.moveCount;
  protectionEvent.timestamp = event.params.timestamp;
  protectionEvent.save();
}

export function handleHighPriceImpact(event: HighPriceImpact): void {
  let token = Token.load(event.params.token.toHexString());
  if (token == null) {
    log.warning("Token not found for HighPriceImpact: {}", [event.params.token.toHexString()]);
    return;
  }

  let protectionEvent = new ProtectionEvent(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
  protectionEvent.token = token.id;
  protectionEvent.eventType = "HighPriceImpact";
  protectionEvent.trader = event.params.trader;
  protectionEvent.impact = event.params.impact;
  protectionEvent.timestamp = event.params.timestamp;
  protectionEvent.save();
}

export function handleWhaleIntentRegistered(event: WhaleIntentRegistered): void {
  let token = Token.load(event.params.token.toHexString());
  if (token == null) {
    log.warning("Token not found for WhaleIntentRegistered: {}", [event.params.token.toHexString()]);
    return;
  }

  let trader = getOrCreateUser(event.params.trader.toHexString());

  let intentId = event.params.token.toHexString() + "-" + event.params.trader.toHexString();
  let whaleIntent = new WhaleIntent(intentId);
  whaleIntent.token = token.id;
  whaleIntent.trader = trader.id;
  whaleIntent.amount = event.params.amount;
  whaleIntent.isBuy = event.params.isBuy;
  whaleIntent.executeAfter = event.params.executeAfter;
  whaleIntent.timestamp = event.params.timestamp;
  whaleIntent.cancelled = false;
  whaleIntent.executed = false;
  whaleIntent.save();
}

export function handleWhaleTradeExecuted(event: WhaleTradeExecuted): void {
  let token = Token.load(event.params.token.toHexString());
  if (token == null) {
    log.warning("Token not found for WhaleTradeExecuted: {}", [event.params.token.toHexString()]);
    return;
  }

  let trader = getOrCreateUser(event.params.trader.toHexString());
  let intentId = event.params.token.toHexString() + "-" + event.params.trader.toHexString();
  let whaleIntent = WhaleIntent.load(intentId);

  if (whaleIntent != null) {
    whaleIntent.executed = true;
    whaleIntent.save();
  }
}

export function handleWhaleIntentCancelled(event: WhaleIntentCancelled): void {
  let token = Token.load(event.params.token.toHexString());
  if (token == null) {
    log.warning("Token not found for WhaleIntentCancelled: {}", [event.params.token.toHexString()]);
    return;
  }

  let trader = getOrCreateUser(event.params.trader.toHexString());
  let intentId = event.params.token.toHexString() + "-" + event.params.trader.toHexString();
  let whaleIntent = WhaleIntent.load(intentId);

  if (whaleIntent != null) {
    whaleIntent.cancelled = true;
    whaleIntent.save();
  }
}
