import { BigInt, Address, log } from "@graphprotocol/graph-ts";
import {
  SongMinted,
  SongPurchased,
  SongPriceUpdated,
  SongPriceScaled,
  SongReferralPctUpdated,
  RewardsClaimed,
  RewardsDistributed,
} from "../generated/CarbonOpus/CarbonOpus";
import { Song, Artist, Buyer, Referrer, SongPurchase, Reward, Protocol } from "../generated/schema";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

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
