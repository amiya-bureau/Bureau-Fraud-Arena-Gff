import app from "./app";
import { logger } from "./lib/logger";
import { startUploadPurge } from "./lib/uploads";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  // Spoof uploads carry a printed 24-hour deletion promise, so the purge runs
  // on a timer rather than only when someone happens to hit the endpoint.
  startUploadPurge();
});
