import { NS } from "@ns";
import { Netwatch } from "./framework/Netwatch";

export async function main(ns: NS): Promise<void> {
  const netwatch = new Netwatch(ns);

  await netwatch.runForever();
}
