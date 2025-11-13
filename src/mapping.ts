import { BigInt, Address } from "@graphprotocol/graph-ts";
import {
  TokenCreated,
} from "../generated/CarbonCoinLauncher/CarbonCoinLauncher";
import {
  TokensPurchased,
  TokensSold,
  Graduated,
  CarbonCoin,
} from "../generated/templates/CarbonCoin/CarbonCoin";
import { Token, Creator, Transaction } from "../generated/schema";
import { CarbonCoin as CarbonCoinTemplate } from "../generated/templates";

export function handleTokenCreated(event: TokenCreated): void {
  let creator = Creator.load(event.params.creator.toHexString());
  if (creator == null) {
    creator = new Creator(event.params.creator.toHexString());
    creator.createdAt = event.block.timestamp;
    creator.totalFeesCollected = BigInt.fromI32(0);
  }

  let token = new Token(event.params.tokenAddress.toHexString());
  token.creator = creator.id;
  token.name = event.params.name;
  token.symbol = event.params.symbol;
  token.createdAt = event.block.timestamp;
  token.creationFee = event.params.creationFee;
  token.graduated = false;

  let contract = CarbonCoin.bind(event.params.tokenAddress);
  let reserves = contract.getReserves();
  token.virtualEth = reserves.value2;
  token.virtualTokens = reserves.value3;
  token.realEthReserves = reserves.value0;
  token.realTokenSupply = reserves.value1;
  
  let config = contract.getTradeLimits(); // This is not the full config, but it's what we have from the interface
  token.maxSupply = BigInt.fromI32(0); // TODO: get this from the contract
  token.graduationThreshold = config.value2;

  token.price = contract.getCurrentPrice();


  creator.totalFeesCollected = creator.totalFeesCollected.plus(
    event.params.creationFee
  );

  creator.save();
  token.save();

  // Start indexing the new token
  CarbonCoinTemplate.create(event.params.tokenAddress);
}

export function handleTokensPurchased(event: TokensPurchased): void {
  let token = Token.load(event.address.toHexString());
  if (token == null) {
    return;
  }

  let transaction = new Transaction(event.transaction.hash.toHexString());
  transaction.token = token.id;
  transaction.type = "buy";
  transaction.buyer = event.params.buyer;
  transaction.ethAmount = event.params.ethIn;
  transaction.tokenAmount = event.params.tokensOut;
  transaction.price = event.params.newPrice;
  transaction.timestamp = event.block.timestamp;

  token.realEthReserves = event.params.realEthReserves;
  token.realTokenSupply = event.params.realTokenSupply;
  token.price = event.params.newPrice;

  token.save();
  transaction.save();
}

export function handleTokensSold(event: TokensSold): void {
  let token = Token.load(event.address.toHexString());
  if (token == null) {
    return;
  }

  let transaction = new Transaction(event.transaction.hash.toHexString());
  transaction.token = token.id;
  transaction.type = "sell";
  transaction.seller = event.params.seller;
  transaction.ethAmount = event.params.ethOut;
  transaction.tokenAmount = event.params.tokensIn;
  transaction.price = event.params.newPrice;
  transaction.timestamp = event.block.timestamp;

  token.realEthReserves = event.params.realEthReserves;
  token.realTokenSupply = event.params.realTokenSupply;
  token.price = event.params.newPrice;

  token.save();
  transaction.save();
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
