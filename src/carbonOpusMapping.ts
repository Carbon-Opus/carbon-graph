import { BigInt, Address, Bytes } from "@graphprotocol/graph-ts";
import {
  SongCreated,
  SongPurchased,
  SongPriceUpdated,
  SongPriceScaled,
  SongReferralPctUpdated,
  RewardsClaimed,
  RewardsDistributed,
  OwnershipTransferred,
  ProtocolFeeUpdated,
  ControllerUpdated,
  MemberAddressUpdated,
} from "../generated/CarbonOpus/CarbonOpus";
import { Song, Artist, Buyer, Referrer, SongPurchase, Reward, Protocol } from "../generated/schema";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function getOrCreateArtist(memberId: Bytes): Artist {
  let artist = Artist.load(memberId);
  if (artist == null) {
    artist = new Artist(memberId);
    artist.rewards = BigInt.fromI32(0);
    artist.address = Address.fromString(ZERO_ADDRESS);
    artist.save();
  }
  return artist;
}

function getOrCreateBuyer(memberId: Bytes): Buyer {
  let buyer = Buyer.load(memberId);
  if (buyer == null) {
    buyer = new Buyer(memberId);
    buyer.address = Address.fromString(ZERO_ADDRESS);
    buyer.save();
  }
  return buyer;
}

function getOrCreateReferrer(memberId: Bytes): Referrer {
  let referrer = Referrer.load(memberId);
  if (referrer == null) {
    referrer = new Referrer(memberId);
    referrer.rewards = BigInt.fromI32(0);
    referrer.address = Address.fromString(ZERO_ADDRESS);
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
    protocol.owner = Address.fromString(ZERO_ADDRESS);
    protocol.controller = Address.fromString(ZERO_ADDRESS);
    protocol.save();
  }
  return protocol;
}

export function handleSongCreated(event: SongCreated): void {
  let artist = getOrCreateArtist(event.params.artist);
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

  let buyer = getOrCreateBuyer(event.params.buyer);
  let referrer = getOrCreateReferrer(event.params.referrer);

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

  let memberId = event.params.memberId;
  let artist = Artist.load(memberId);
  if (artist != null) {
    artist.rewards = artist.rewards.minus(event.params.amount);
    artist.save();
    reward.artist = artist.id;
  }

  let referrer = Referrer.load(memberId);
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
  let artist = getOrCreateArtist(event.params.artist);
  let referrer = getOrCreateReferrer(event.params.referrer);

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

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  let protocol = getOrCreateProtocol();
  protocol.owner = event.params.newOwner;
  protocol.save();
}

export function handleProtocolFeeUpdated(event: ProtocolFeeUpdated): void {
  let protocol = getOrCreateProtocol();
  protocol.protocolFee = event.params.newFee;
  protocol.save();
}

export function handleControllerUpdated(event: ControllerUpdated): void {
  let protocol = getOrCreateProtocol();
  protocol.controller = event.params.newController;
  protocol.save();
}

export function handleMemberAddressUpdated(event: MemberAddressUpdated): void {
  let memberId = event.params.memberId;
  let artist = Artist.load(memberId);
  if (artist != null) {
    artist.address = event.params.newAddress;
    artist.save();
  }

  let buyer = Buyer.load(memberId);
  if (buyer != null) {
    buyer.address = event.params.newAddress;
    buyer.save();
  }

  let referrer = Referrer.load(memberId);
  if (referrer != null) {
    referrer.address = event.params.newAddress;
    referrer.save();
  }
}
