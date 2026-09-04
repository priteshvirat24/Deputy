import { serve } from '@hono/node-server';
import { getEnv } from '@deputy/config';
import { createApp, seedSampleData } from './app.js';
import { applyPlatformDefaults } from './platform.js';

async function main() {
  // Fill WebAuthn/origin config from the hosting platform (e.g. Render) before
  // the env contract is validated.
  applyPlatformDefaults();
  const env = getEnv();
  const { app, services } = createApp();

  // Seed sample initial state for immediate local testing & development
  await seedSampleData(services);

  console.info(`🛡️  DEPUTY Backend Foundation Server starting on http://${env.HOST}:${env.PORT}`);
  console.info(`🔒 Security Policy Engine: Active (Fail-closed default)`);
  console.info(
    `🌐 WebMCP Capabilities: ${JSON.stringify(services.webmcpAdapter.getCapabilities())}`,
  );

  serve({
    fetch: app.fetch,
    port: env.PORT,
    hostname: env.HOST,
  });
}

main().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
