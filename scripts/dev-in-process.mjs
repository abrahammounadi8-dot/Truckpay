import path from "node:path";
import { fileURLToPath } from "node:url";

// Local fallback for environments that cannot create child-process IPC channels.
process.env.NODE_ENV = "development";
process.env.MTP_DEV_IN_PROCESS = "1";
process.env.TURBOPACK = "1";
process.env.__NEXT_DEV_SERVER = "1";
process.env.NEXT_PRIVATE_WORKER = "1";
process.env.NEXT_TELEMETRY_DISABLED = "1";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(dir);
const { startServer } = await import("next/dist/server/lib/start-server.js");
startServer({ dir, port: 43217, hostname: "127.0.0.1", isDev: true, allowRetry: false })
  .catch((error) => { console.error(error); process.exitCode = 1; });
