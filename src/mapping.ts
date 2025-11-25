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
import {
  SongMinted,
  SongPurchased,
  SongPriceUpdated,
  SongPriceScaled,
  SongReferralPctUpdated,
  RewardsClaimed,
  RewardsDistributed,
} from "../generated/CarbonOpus/CarbonOpus";
import { Token, Transaction, User, Holder, WhaleIntent, Bot, Approval as ApprovalEntity, Song, Artist, Buyer, Referrer, SongPurchase, Reward, Protocol } from "../generated/schema";
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

const CREATOR_ALLOCATION_PERCENTAGE = BigInt.fromI32(10);

export function handleTokenCreated(event: TokenCreated): void {
  let creator = getOrCreateUser(event.params.creator.toHexString());

  let token = new Token(event.params.tokenAddress.toHexString());
  token.creator = creator.id;
  token.name = event.params.name;
  token.symbol = event.params.symbol;
  token.createdAt = event.block.timestamp;
  token.creationFee = event.params.creationFee;
  token.graduated = false;
  token.isCircuitBreakerActive = false;

  let contract = CarbonCoin.bind(event.params.tokenAddress);
  let reserves = contract.getReserves();
  token.virtualEth = reserves.value2;
  token.virtualTokens = reserves.value3;
  token.realEthReserves = reserves.value0;

  let config = contract.getTradeLimits();
  let maxSupply = contract.MAX_SUPPLY();
  token.maxSupply = maxSupply;
  token.graduationThreshold = config.value2;

  let creatorAllocation = maxSupply.times(CREATOR_ALLOCATION_PERCENTAGE).div(BigInt.fromI32(100));
  token.creatorAllocation = creatorAllocation;
  token.realTokenSupply = reserves.value1.plus(creatorAllocation);
  token.totalHolders = BigInt.fromI32(1);

  token.price = contract.getCurrentPrice();

  let creatorHolder = new Holder(creator.id + "-" + token.id);
  creatorHolder.user = creator.id;
  creatorHolder.token = token.id;
  creatorHolder.balance = creatorAllocation;
  creatorHolder.save();

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

function getOrCreateArtist(address: string): Artist {
  let artist = Artist.load(address);
  if (artist == null) {
    artist = new Artist(address);
    artist.rewards = BigInt.fromI32(0);
    artist.save();
  }
  return artist;
}

function getOrCreateBuyer(address: string): Buyer {
  let buyer = Buyer.load(address);
  if (buyer == null) {
    buyer = new Buyer(address);
    buyer.save();
  }
  return buyer;
}

function getOrCreateReferrer(address: string): Referrer {
  let referrer = Referrer.load(address);
  if (referrer == null) {
    referrer = new Referrer(address);
    referrer.rewards = BigInt.fromI32(0);
    referrer.save();
  }
  return referrer;
}

function getOrCreateProtocol(): Protocol {
  let protocol = Protocol.load("1");
  if (protocol == null) {
    protocol = new Protocol("1");
    protocol.totalRewardsClaimed = BigInt.fromI32(0);
    protocol.totalRewardsDistributed = BigInt.fromI32(0);
    protocol.protocolFee = BigInt.fromI32(0);
    protocol.treasury = Address.fromString(ZERO_ADDRESS);
    protocol.save();
  }
  return protocol;
}

export function handleSongMinted(event: SongMinted): void {
  let artist = getOrCreateArtist(event.params.artist.toHexString());
  let song = new Song(event.params.tokenId.toString());
  song.artist = artist.id;
  song.price = event.params.price;
  song.referralPct = event.params.referralPct;
  song.createdAt = event.block.timestamp;
  song.save();
}

export function handleSongPurchased(event: SongPurchased): void {
  let song = Song.load(event.params.tokenId.toString());
  if (song == null) {
    return;
  }

  let buyer = getOrCreateBuyer(event.params.buyer.toHexString());
  let referrer = getOrCreateReferrer(event.params.referrer.toHexString());

  let purchase = new SongPurchase(event.transaction.hash.toHexString());
  purchase.song = song.id;
  purchase.buyer = buyer.id;
  if (event.params.referrer.toHexString() != ZERO_ADDRESS) {
    purchase.referrer = referrer.id;
  }
  purchase.price = event.params.price;
  purchase.timestamp = event.block.timestamp;
  purchase.save();
}

export function handleSongPriceUpdated(event: SongPriceUpdated): void {
  let song = Song.load(event.params.tokenId.toString());
  if (song == null) {
    return;
  }
  song.price = event.params.newPrice;
  song.save();
}

export function handleSongPriceScaled(event: SongPriceScaled): void {
  let song = Song.load(event.params.tokenId.toString());
  if (song == null) {
    return;
  }
  song.price = event.params.newPrice;
  song.save();
}

export function handleSongReferralPctUpdated(event: SongReferralPctUpdated): void {
  let song = Song.load(event.params.tokenId.toString());
  if (song == null) {
    return;
  }
  song.referralPct = event.params.newPct;
  song.save();
}

export function handleRewardsClaimed(event: RewardsClaimed): void {
  let protocol = getOrCreateProtocol();
  let rewardId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
  let reward = new Reward(rewardId);
  reward.amount = event.params.amount;
  reward.timestamp = event.block.timestamp;

  let artist = Artist.load(event.params.account.toHexString());
  if (artist != null) {
    artist.rewards = artist.rewards.minus(event.params.amount);
    artist.save();
    reward.artist = artist.id;
  }

  let referrer = Referrer.load(event.params.account.toHexString());
  if (referrer != null) {
    referrer.rewards = referrer.rewards.minus(event.params.amount);
    referrer.save();
    reward.referrer = referrer.id;
  }

  protocol.totalRewardsClaimed = protocol.totalRewardsClaimed.plus(event.params.amount);
  protocol.save();
  reward.save();
}

export function handleRewardsDistributed(event: RewardsDistributed): void {
  let protocol = getOrCreateProtocol();
  let artist = getOrCreateArtist(event.params.artist.toHexString());
  let referrer = getOrCreateReferrer(event.params.referrer.toHexString());

  artist.rewards = artist.rewards.plus(event.params.artistAmount);
  artist.save();

  if (event.params.referrer.toHexString() != ZERO_ADDRESS) {
    referrer.rewards = referrer.rewards.plus(event.params.referrerAmount);
    referrer.save();
  }

  protocol.totalRewardsDistributed = protocol.totalRewardsDistributed.plus(event.params.artistAmount).plus(event.params.referrerAmount);
  protocol.protocolFee = protocol.protocolFee.plus(event.params.protocolFee);
  protocol.save();
}
