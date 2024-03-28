import { NS } from "@ns";
import { pad } from "/util/pad";

export type Node = {
  id: string;
  isRoot: boolean;
  usedRam: number;
  maxRam: number;
  money: number;
  maxMoney: number;
  security: number;
  requiredHacking: number;
  requiredPorts: number;
  lastGrow: number;
  lastWeaken: number;
  lastHack: number;
  lastScan: number;
};

export type Self = {
  id: string;
  hacking: number;
  maxRam: number;
  usedRam: number;
  money: number;
  nodes: Node[];
};

export type SelfStats = {
  hacking: number;
  maxRam: number;
  usedRam: number;
  money: number;
};

const defaultSelf = {
  id: "",
  hacking: 0,
  maxRam: 0,
  usedRam: 0,
  money: 0,
  nodes: [],
};

export enum LogType {
  HACK = "HACK",
  GROW = "GROW",
  WEAKEN = "WEAKEN",
  SCAN = "SCAN",
  ERROR = "ERROR",
  WARNING = "WARNING",
}

export class Netwatch {
  private ns: NS;
  private self: Self = defaultSelf;

  constructor(ns: NS) {
    this.ns = ns;

    this.self.id = ns.getHostname();
    this.self.hacking = ns.getHackingLevel();
    this.self.maxRam = ns.getServerMaxRam(this.self.id);
    this.self.usedRam = ns.getServerUsedRam(this.self.id);
    this.self.money = ns.getServerMoneyAvailable(this.self.id);
  }

  private log = (message: string, type?: LogType): void => {
    const date = new Date();
    const timestamp = `${date.getFullYear()}-${pad(
      date.getMonth() + 1,
      2
    )}-${pad(date.getDate(), 2)} ${pad(date.getHours(), 2)}:${pad(
      date.getMinutes(),
      2
    )}:${pad(date.getSeconds(), 2)}`;
    const typeStr = type || "INFO";

    this.ns.write(
      "netwatch.log.txt",
      `[${typeStr}] [${timestamp}] ${message}\n`,
      "a"
    );
    this.ns.tprintf(`${typeStr}: [${timestamp}] ${message}`);
  };

  /**
   * This method returns the nodes that the script has scanned
   *
   * @remarks RAM Cost: 0 GB
   *
   * @returns {Node[]} The nodes that the script has scanned
   */
  public getNodes(): Node[] {
    return this.self.nodes;
  }

  /**
   * This method returns the stats of the script's own server
   *
   * @remarks RAM Cost: 0 GB
   *
   * @returns {SelfStats} The stats of the script's own server
   */
  public getStats(): SelfStats {
    return {
      hacking: this.self.hacking,
      maxRam: this.self.maxRam,
      usedRam: this.self.usedRam,
      money: this.self.money,
    };
  }

  /**
   * This method scans the network for servers
   *
   * @remarks RAM Cost: 0.2 GB - 0.65 GB
   */
  public async scan(): Promise<void> {
    this.self.nodes = [];

    const servers = this.ns.scan(this.self.id);

    // Only add nodes that we haven't seen before, or update existing nodes
    // Update interval is 1 minute
    const currentTime = new Date().getTime();

    for (const server of servers) {
      const node = this.self.nodes.find((n) => n.id === server);

      if (node) {
        if (currentTime - node.lastScan >= 60000) {
          node.isRoot = await this.ns.hasRootAccess(server);
          node.usedRam = await this.ns.getServerUsedRam(server);
          node.maxRam = await this.ns.getServerMaxRam(server);
          node.money = await this.ns.getServerMoneyAvailable(server);
          node.maxMoney = await this.ns.getServerMaxMoney(server);
          node.security = await this.ns.getServerSecurityLevel(server);
          node.requiredHacking = await this.ns.getServerRequiredHackingLevel(
            server
          );
          node.requiredPorts = await this.ns.getServerNumPortsRequired(server);
          node.lastScan = currentTime;
        }
      } else {
        const newNode: Node = {
          id: server,
          isRoot: await this.ns.hasRootAccess(server),
          usedRam: await this.ns.getServerUsedRam(server),
          maxRam: await this.ns.getServerMaxRam(server),
          money: await this.ns.getServerMoneyAvailable(server),
          maxMoney: await this.ns.getServerMaxMoney(server),
          security: await this.ns.getServerSecurityLevel(server),
          requiredHacking: await this.ns.getServerRequiredHackingLevel(server),
          requiredPorts: await this.ns.getServerNumPortsRequired(server),
          lastGrow: 0,
          lastWeaken: 0,
          lastHack: 0,
          lastScan: currentTime,
        };

        this.self.nodes.push(newNode);
      }
    }
  }

  /**
   * This method nukes a server (gets root access)
   *
   * @remarks RAM Cost: 0 GB - 0.1 GB
   *
   * @param server The server to nuke
   * @returns {Promise<void>}
   */
  public async nuke(server: string): Promise<void> {
    const node = this.self.nodes.find((n) => n.id === server);

    if (!node) {
      this.log(`Cannot hack ${server}, node not found`, LogType.ERROR);
      return;
    }

    if (this.self.hacking < node.requiredHacking) {
      this.log(
        `Cannot hack ${server}, required hacking level is ${node.requiredHacking}`,
        LogType.ERROR
      );
      return;
    }

    if (node.isRoot) {
      this.log(`Already rooted on ${server}`, LogType.WARNING);
      return;
    }

    this.log(`Getting root on ${server}...`);
    await this.ns.nuke(server);
    node.isRoot = await this.ns.hasRootAccess(server);
    this.log(`Rooted on ${server}`);
  }

  /**
   * This method grows a server (increases money available)
   *
   * @remarks RAM Cost: 0 GB - 0.25 GB
   *
   * @param server The server to grow
   * @returns {Promise<void>}
   */
  public async grow(server: string): Promise<void> {
    const node = this.self.nodes.find((n) => n.id === server);

    if (!node) {
      this.log(`Cannot grow ${server}, node not found`, LogType.ERROR);
      return;
    }

    if (!node.isRoot) {
      this.log(`Cannot grow ${server}, not rooted`, LogType.ERROR);
      return;
    }

    if (node.money >= node.maxMoney) {
      this.log(`${server} is already maxed out`, LogType.WARNING);
      return;
    }

    this.log(`Growing ${server}...`, LogType.GROW);
    await this.ns.grow(server);
    node.money = await this.ns.getServerMoneyAvailable(server);
  }

  /**
   * This method weakens a server (decreases security level)
   *
   * @remarks RAM Cost: 0 GB - 0.25 GB
   *
   * @param server The server to weaken
   * @returns {Promise<void>}
   */
  public async weaken(server: string): Promise<void> {
    const node = this.self.nodes.find((n) => n.id === server);

    if (!node) {
      this.log(`Cannot weaken ${server}, node not found`, LogType.ERROR);
      return;
    }

    if (!node.isRoot) {
      this.log(`Cannot weaken ${server}, not rooted`, LogType.ERROR);
      return;
    }

    if (node.security <= 1) {
      this.log(`${server} is already weakened`, LogType.WARNING);
      return;
    }

    this.log(`Weakening ${server}...`, LogType.WEAKEN);
    await this.ns.weaken(server);
    node.security = await this.ns.getServerSecurityLevel(server);
    this.log(`Security level on ${server} is now ${node.security}`);
  }

  /**
   * This method hacks a server (steals money)
   *
   * @remarks RAM Cost: 0 GB - 0.15 GB
   *
   * @param server The server to hack
   * @returns {Promise<void>}
   */
  public async hack(server: string): Promise<void> {
    const node = this.self.nodes.find((n) => n.id === server);

    if (!node) {
      this.log(`Cannot hack ${server}, node not found`, LogType.ERROR);
      return;
    }

    if (!node.isRoot) {
      this.log(`Cannot hack ${server}, not rooted`, LogType.ERROR);
      return;
    }

    if (node.usedRam >= node.maxRam) {
      this.log(`${server} is already maxed out`, LogType.WARNING);
      return;
    }

    this.log(`Hacking ${server}...`, LogType.HACK);
    await this.ns.hack(server);
    node.usedRam = await this.ns.getServerUsedRam(server);
  }

  /**
   * This method runs the script once
   *
   * @returns {Promise<void>}
   */
  public async run(): Promise<void> {
    await this.scan();

    for (const node of this.self.nodes) {
      if (this.self.hacking >= node.requiredHacking) {
        await this.nuke(node.id);
      }

      if (node.isRoot) {
        await this.grow(node.id);

        while (node.security > 1) {
          await this.weaken(node.id);
        }

        await this.hack(node.id);
      }
    }
  }

  /**
   * This method runs the script forever
   *
   * @returns {Promise<void>}
   */
  public async runForever(): Promise<void> {
    while (true) {
      await this.run();
      await this.ns.sleep(1000);
    }
  }

  /**
   * This method runs the script forever
   * The difference is that this method uses forEach instead of a for loop
   *
   * @remarks This method is for testing purposes.
   *
   * @returns {void}
   */
  public runForeverExperimental(): void {
    await this.scan();

    this.self.nodes.forEach(async (node) => {
      if (this.self.hacking >= node.requiredHacking) {
        await this.nuke(node.id);
      }

      if (node.isRoot) {
        await this.grow(node.id);

        while (node.security > 1) {
          await this.weaken(node.id);
        }

        await this.hack(node.id);
      }
    });
  }
}
