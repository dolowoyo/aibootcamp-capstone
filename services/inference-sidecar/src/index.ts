#!/usr/bin/env node
import { createServer } from "./server.js";

const PORT = Number(process.env.PORT ?? 8787);

const server = createServer();

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`inference-sidecar listening on http://localhost:${PORT}`);
});
