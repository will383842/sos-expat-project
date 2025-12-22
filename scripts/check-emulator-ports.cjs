// scripts/check-emulator-ports.cjs
const { execSync } = require("child_process");
const fs = require("fs");

// Ports used by Firebase emulators (from firebase.json)
const EMULATOR_PORTS = {
  ui: 4002,
  hub: 4402,
  functions: 5001,
  firestore: 8080,
  auth: 9099,
  storage: 9199,
  logging: 4502,
};

function checkPort(port) {
  try {
    // Try to check if port is in use (works on Linux/Mac)
    const result = execSync(`lsof -i :${port} 2>/dev/null || echo ""`, { encoding: "utf8" });
    return result.trim().length > 0;
  } catch (error) {
    return false;
  }
}

function findProcessOnPort(port) {
  try {
    // Only check for LISTEN processes (not client connections like Chrome)
    const result = execSync(`lsof -i :${port} 2>/dev/null | grep LISTEN | grep -v COMMAND || echo ""`, {
      encoding: "utf8",
    });
    if (result.trim()) {
      const lines = result.trim().split("\n");
      return lines.map((line) => {
        const parts = line.split(/\s+/);
        return { command: parts[0], pid: parts[1] };
      });
    }
    return [];
  } catch (error) {
    return [];
  }
}

// Check all emulator ports
const occupiedPorts = [];
for (const [name, port] of Object.entries(EMULATOR_PORTS)) {
  if (checkPort(port)) {
    const processes = findProcessOnPort(port);
    occupiedPorts.push({ name, port, processes });
  }
}

if (occupiedPorts.length > 0) {
  console.error("\n❌ Error: Firebase emulator ports are already in use:\n");
  occupiedPorts.forEach(({ name, port, processes }) => {
    console.error(`   Port ${port} (${name}):`);
    processes.forEach((proc) => {
      console.error(`     - ${proc.command} (PID: ${proc.pid})`);
    });
  });

  // Find unique Firebase processes
  const firebasePids = new Set();
  occupiedPorts.forEach(({ processes }) => {
    processes.forEach((proc) => {
      if (proc.command === "firebase" && proc.pid) {
        firebasePids.add(proc.pid);
      }
    });
  });

  if (firebasePids.size > 0) {
    const pidList = Array.from(firebasePids).join(" ");
    console.error("\n💡 To fix this, stop the existing Firebase emulator process:");
    console.error(`     npm run kill-emulators`);
    console.error(`     # or manually: kill ${pidList}`);
    console.error("\n   Or run: pkill -f 'firebase.*emulators'");
    console.error("\n   To auto-kill and continue, set: AUTO_KILL_EMULATORS=true");
    
    // Check if user wants auto-kill
    if (process.env.AUTO_KILL_EMULATORS === "true") {
      console.log("\n🔧 Auto-killing Firebase emulator processes...");
      try {
        firebasePids.forEach((pid) => {
          execSync(`kill -9 ${pid} 2>/dev/null`, { encoding: "utf8" });
        });
        // Also try pkill as backup
        execSync(`pkill -9 -f 'firebase.*emulators' 2>/dev/null`, { encoding: "utf8" });
        console.log("✅ Killed existing Firebase emulator processes");
        // Wait a moment for ports to be released
        const { setTimeout } = require("timers/promises");
        require("util").promisify(setTimeout)(1000);
        // Re-check ports
        const stillOccupied = [];
        for (const [name, port] of Object.entries(EMULATOR_PORTS)) {
          if (checkPort(port)) {
            const processes = findProcessOnPort(port);
            // Filter out non-firebase processes (like chrome connections)
            const firebaseProcs = processes.filter((p) => p.command === "firebase");
            if (firebaseProcs.length > 0) {
              stillOccupied.push({ name, port, processes: firebaseProcs });
            }
          }
        }
        if (stillOccupied.length === 0) {
          console.log("✅ All Firebase emulator ports are now available\n");
          process.exit(0);
        } else {
          console.error("⚠️  Some ports are still in use, please kill manually");
          process.exit(1);
        }
      } catch (error) {
        console.error("❌ Failed to auto-kill processes:", error.message);
        process.exit(1);
      }
    }
  }
  process.exit(1);
}

console.log("✅ All emulator ports are available");
process.exit(0);











