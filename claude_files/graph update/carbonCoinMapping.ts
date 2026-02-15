import { BigInt, Address, log } from "@graphprotocol/graph-ts";
import {
  Transfer,
  TokenDeployed,
  TokensPurchased,
  TokensSold,
  Graduated,
  PriceUpdate,
  TradingPaused,
  TradingUnpaused,
  EmergencyWithdraw,
  LiquiditySnapshot,
  CreatorReserveMinted,
  Approval,
} from "../generated/templates/CarbonCoin/CarbonCoin";
import { CarbonCoin } from "../generated/templates/CarbonCoin/CarbonCoin";
import { Token, Transaction, User, Holder, EmergencyWithdrawal, Approval as ApprovalEntity } from "../generated/schema";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function getOrCreateUser(address: string): User {
  let user = User.load(address);
  if (user == null) {
    user = new User(address);
    user.save();
  }
  return user;
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

  // Handle "from" address (sender)
  if (fromAddress != ZERO_ADDRESS) {
    let fromUser = getOrCreateUser(fromAddress);
    let fromHolder = Holder.load(fromAddress + "-" + token.id);
    if (fromHolder != null) {
      let oldBalance = fromHolder.balance;
      let balanceResult = contract.try_balanceOf(Address.fromString(fromAddress));
      if (!balanceResult.reverted) {
        fromHolder.balance = balanceResult.value;
        fromHolder.save();

        if (oldBalance > BigInt.fromI32(0) && fromHolder.balance == BigInt.fromI32(0)) {
          token.totalHolders = token.totalHolders.minus(BigInt.fromI32(1));
        }
      }
    }
  }

  // Handle "to" address (receiver)
  if (toAddress != ZERO_ADDRESS) {
    let toUser = getOrCreateUser(toAddress);
    let toHolder = Holder.load(toAddress + "-" + token.id);
    if (toHolder == null) {
      toHolder = new Holder(toAddress + "-" + token.id);
      toHolder.user = toUser.id;
      toHolder.token = token.id;
      toHolder.balance = BigInt.fromI32(0);
    }

    let oldBalance = toHolder.balance;
    let balanceResult = contract.try_balanceOf(Address.fromString(toAddress));
    if (!balanceResult.reverted) {
      toHolder.balance = balanceResult.value;
      toHolder.save();

      if (oldBalance == BigInt.fromI32(0) && toHolder.balance > BigInt.fromI32(0)) {
        token.totalHolders = token.totalHolders.plus(BigInt.fromI32(1));
      }
    }
  }

  token.save();
}

export function handleTokenDeployed(event: TokenDeployed): void {
  // This event is emitted by CarbonCoin constructor
  // The token entity should already exist from handleTokenCreated
  let token = Token.load(event.params.token.toHexString());
  if (token != null) {
    // Update any fields that might not have been set
    token.maxSupply = event.params.maxSupply;
    token.graduationThreshold = event.params.graduationThreshold;
    token.save();
  }
}

export function handleTokensPurchased(event: TokensPurchased): void {
  let token = Token.load(event.address.toHexString());
  if (token == null) {
    log.warning("Token not found for purchase: {}", [event.address.toHexString()]);
    return;
  }

  let transaction = new Transaction(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
  transaction.token = token.id;
  transaction.tokenId = token.id;
  transaction.type = "buy";
  transaction.trader = event.params.buyer;
  transaction.usdcAmount = event.params.usdcAmount;
  transaction.tokenAmount = event.params.tokensOut;
  transaction.price = event.params.newPrice;
  transaction.realUsdcReserves = event.params.realUsdcReserves;
  transaction.realTokenSupply = event.params.realTokenSupply;
  transaction.timestamp = event.params.timestamp;
  transaction.save();

  token.realUsdcReserves = event.params.realUsdcReserves;
  token.realTokenSupply = event.params.realTokenSupply;
  token.price = event.params.newPrice;
  token.save();
}

export function handleTokensSold(event: TokensSold): void {
  let token = Token.load(event.address.toHexString());
  if (token == null) {
    log.warning("Token not found for sale: {}", [event.address.toHexString()]);
    return;
  }

  let transaction = new Transaction(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
  transaction.token = token.id;
  transaction.tokenId = token.id;
  transaction.type = "sell";
  transaction.trader = event.params.seller;
  transaction.tokenAmount = event.params.tokensIn;
  transaction.usdcAmount = event.params.usdcOut;
  transaction.price = event.params.newPrice;
  transaction.realUsdcReserves = event.params.realUsdcReserves;
  transaction.realTokenSupply = event.params.realTokenSupply;
  transaction.timestamp = event.params.timestamp;
  transaction.save();

  token.realUsdcReserves = event.params.realUsdcReserves;
  token.realTokenSupply = event.params.realTokenSupply;
  token.price = event.params.newPrice;
  token.save();
}

export function handleGraduated(event: Graduated): void {
  let token = Token.load(event.params.token.toHexString());
  if (token == null) {
    log.warning("Token not found for graduation: {}", [event.params.token.toHexString()]);
    return;
  }

  token.graduated = true;
  token.graduatedAt = event.params.timestamp;
  token.liquidityTokens = event.params.liquidityTokens;
  token.liquidityUsdc = event.params.liquidityUsdc;
  token.price = event.params.finalPrice;
  token.save();
}

export function handlePriceUpdate(event: PriceUpdate): void {
  let token = Token.load(event.address.toHexString());
  if (token != null) {
    token.price = event.params.price;
    token.realUsdcReserves = event.params.usdcReserves;
    token.realTokenSupply = event.params.tokenSupply;
    token.lastPriceUpdate = event.params.timestamp;
    token.save();
  }
}

export function handleTradingPaused(event: TradingPaused): void {
  let token = Token.load(event.address.toHexString());
  if (token != null) {
    token.isTradingPaused = true;
    token.save();
  }
}

export function handleTradingUnpaused(event: TradingUnpaused): void {
  let token = Token.load(event.address.toHexString());
  if (token != null) {
    token.isTradingPaused = false;
    token.save();
  }
}

export function handleEmergencyWithdraw(event: EmergencyWithdraw): void {
  let token = Token.load(event.address.toHexString());
  if (token == null) {
    log.warning("Token not found for emergency withdraw: {}", [event.address.toHexString()]);
    return;
  }

  let withdrawal = new EmergencyWithdrawal(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
  withdrawal.token = token.id;
  withdrawal.to = event.params.to;
  withdrawal.amount = event.params.amount;
  withdrawal.timestamp = event.params.timestamp;
  withdrawal.save();
}

export function handleLiquiditySnapshot(event: LiquiditySnapshot): void {
  // This event is for tracking/logging purposes
  // We can store the snapshot data if needed
  let token = Token.load(event.address.toHexString());
  if (token != null) {
    // Update liquidity values if this is a graduation snapshot
    if (event.params.liquidity > BigInt.fromI32(0)) {
      token.liquidityUsdc = event.params.usdcSupply;
      token.liquidityTokens = event.params.tokenSupply;
      token.save();
    }
  }
}

export function handleCreatorReserveMinted(event: CreatorReserveMinted): void {
  // This event confirms the creator reserve was minted
  // The holder entry should already exist from handleTokenCreated
  let token = Token.load(event.address.toHexString());
  if (token != null) {
    token.creatorAllocation = event.params.amount;
    token.save();
  }
}

export function handleApproval(event: Approval): void {
  let token = Token.load(event.address.toHexString());
  if (token == null) {
    log.warning("Token not found for approval: {}", [event.address.toHexString()]);
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
