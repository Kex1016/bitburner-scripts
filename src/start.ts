import { NS } from '@ns'
import { Netwatch } from '/framework/Netwatch';
import { log } from '/util/log';

export async function main(ns : NS) : Promise<void> {
    const netwatch = new Netwatch(ns);
    let self = netwatch.getStats();

    log(ns, "Stopping existing scripts...");
    ns.scriptKill("gamer.js", self.hostname);
    log(ns, "Starting scripts...");
    
    while (self.usedRam < self.maxRam) {
        ns.run('gamer.js');
        log(ns, `Running gamer.js on ${self.hostname} with ${self.usedRam}/${self.maxRam} RAM used.`);
        self = netwatch.getStats();
        await ns.sleep(200);
    }
}