import { NS } from "@ns";
import { Netwatch } from "./framework/Netwatch";
import { log } from "./util/log";

export async function main(ns: NS): Promise<void> {
  log(ns, "Starting Netwatch...");

  const netwatch = new Netwatch(ns);
  await netwatch.runForever();
}
