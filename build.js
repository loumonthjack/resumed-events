const process = require("process");
const { spawn, ChildProcess } = require("node:child_process");
const argv = require("minimist")(process.argv.slice(2));

const pman = createProcessManager();

console.log(`[build] ${argv.type}`);

// TODO nodemon crashes and doesnt restart

switch (argv.type) {
    case "dev": {
        // pman.run("npx astro dev");
        pman.run("tsc --watch");
        pman.run("node dist/server/main.js");
    } break;
    case "dry": {
        pman.run("npx tsc --listFiles --noEmit");
    } break;
}

process.on("SIGINT", () => {
    console.log(`[debug:build] sigint`);
    pman.killAll();
});

function createProcessManager() {
    /** 
     * @type {Object.<string, {running: boolean, process: ChildProcess, cmdStr: string}>}
     */
    const processTable = {};

    /**
     * run a command.
     * careful, just splits command on spaces.
     * @example someProcessManager.run("npx tsc");
     */
    function run(cmdStr) {
        const splitCmdStr = cmdStr.split(' ');
        const cmd = splitCmdStr[0];
        if (!cmd) {
            console.error(`[build] invalid command: ${cmdStr}`);
            return;
        }
        const proc = spawn("cmd", ["/c", ...splitCmdStr], { stdio: 'inherit' });
        register(cmdStr, proc, cmdStr);
    }

    /**
     * @param name {string}
     * @param childProcess {ChildProcess}
     */
    function register(name, childProcess, cmdStr) {
        const cp = { running: false, process: childProcess, cmdStr };
        processTable[name] = cp;
        cp.process.on("spawn", () => {
            cp.running = true;
            console.log(`[debug:build] spawn process ${name}: ${cp.cmdStr}`);
        });
        cp.process.on("close", () => {
            cp.running = false;
            console.log(`[debug:build] close process ${name}: ${cp.cmdStr}`);
        });

    }

    function killAll() {
        Object
            .values(processTable)
            .forEach(cp => {
                if (cp.running) {
                    cp.process.kill();
                }
            })
    }

    return {
        run,
        register,
        killAll
    }
}