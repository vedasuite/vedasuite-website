const { execSync } = require("child_process");

const port = process.argv[2];

if (!port) {
  process.exit(0);
}

function getListeningPids(targetPort) {
  try {
    const output = execSync(`netstat -ano | findstr :${targetPort}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    return output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((line) => line.includes("LISTENING"))
      .map((line) => line.split(/\s+/).pop())
      .filter((pid) => pid && pid !== process.pid.toString());
  } catch {
    return [];
  }
}

const uniquePids = [...new Set(getListeningPids(port))];

for (const pid of uniquePids) {
  try {
    execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
  } catch {
    // If Windows already released the process or we don't own it, continue.
  }
}
