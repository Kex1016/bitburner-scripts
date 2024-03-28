import { NS } from "@ns";
import { log } from "/util/log";

export async function main(ns: NS): Promise<void> {
  log(ns, "Commencing gaming...");

  while (true) {
    const servers = ns.scan("home");
    const myStats = {
      hacking: ns.getHackingLevel(),
      maxRam: ns.getServerMaxRam("home"),
      usedRam: ns.getServerUsedRam("home"),
      money: ns.getServerMoneyAvailable("home"),
    };

    log(ns, `Found ${servers.length} servers on the network`);

    for (const server of servers) {
      log(ns, `Checking server ${server}`);

      const isRoot = await ns.hasRootAccess(server);
      const usedRam = await ns.getServerUsedRam(server);
      const maxRam = await ns.getServerMaxRam(server);
      const money = await ns.getServerMoneyAvailable(server);
      const security = await ns.getServerSecurityLevel(server);
      const requiredHacking = await ns.getServerRequiredHackingLevel(server);
      const requiredPorts = await ns.getServerNumPortsRequired(server);
      const maxMoney = await ns.getServerMaxMoney(server);

      // Test if we can hack the server
      if (myStats.hacking >= requiredHacking) {
        if (!isRoot) {
          log(ns, `Getting root on ${server}...`);
          await ns.hack(server);
        } else {
          log(ns, `Already rooted on ${server}`);
        }
      } else {
        log(
          ns,
          `Cannot hack ${server}, required hacking level is ${requiredHacking}`
        );
      }

      // If the server is rooted, test if we can grow it
      if (isRoot) {
        if (usedRam < maxRam) {
          log(ns, `Growing ${server}...`);
          await ns.grow(server);
        } else {
          log(ns, `${server} is already maxed out`);
        }
      }

      // If the server is rooted, test if we can weaken it
      if (isRoot) {
        if (security > 1) {
          log(ns, `Weakening ${server}...`);
          await ns.weaken(server);
        } else {
          log(ns, `${server} is already weakened`);
        }
      }

      // If the server is rooted, test if we can hack it
      if (isRoot) {
        if (usedRam < maxRam) {
          log(ns, `Hacking ${server}...`);
          await ns.hack(server);
        } else {
          log(ns, `${server} is already maxed out`);
        }
      }
    }
  }
}
