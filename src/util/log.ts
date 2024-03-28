import { NS } from "@ns";
import { pad } from "/util/pad";

export function log(ns: NS, message: string): void {
  const date = new Date();
  const timestamp = `${date.getFullYear()}-${pad(date.getMonth() + 1, 2)}-${pad(
    date.getDate(),
    2
  )} ${pad(date.getHours(), 2)}:${pad(date.getMinutes(), 2)}:${pad(
    date.getSeconds(),
    2
  )}`;

  ns.write("gamer.log.txt", `[${timestamp}] ${message}\n`);
  ns.tprintf(`[${timestamp}] ${message}`);
}
