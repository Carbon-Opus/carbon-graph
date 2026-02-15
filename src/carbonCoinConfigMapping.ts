import { DefaultConfigUpdated } from "../generated/CarbonCoinConfig/CarbonCoinConfig";
import { ConfigUpdate } from "../generated/schema";

export function handleDefaultConfigUpdated(event: DefaultConfigUpdated): void {
  let configUpdate = new ConfigUpdate(event.transaction.hash.toHexString() + "-" + event.logIndex.toString());
  configUpdate.configType = event.params.configType;
  configUpdate.timestamp = event.params.timestamp;
  configUpdate.save();
}
