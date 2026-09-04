import { existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import { serveStatic } from '@hono/node-server/serve-static';
import type { Hono } from 'hono';
import type { Env } from '@deputy/config';

/**
 * Serve the built SPA (apps/web/dist) from the API server so the client and the
 * WebAuthn RP share a single origin. This is a hard requirement for WebAuthn:
 * splitting the client onto a second host makes RP ID / origin agreement
 * fragile. Only mounted when SERVE_STATIC is true; local `pnpm dev` keeps using
 * the Vite proxy.
 *
 * The SPA fallback deliberately never swallows `/api/*` — an unknown API route
 * must return a JSON 404 from the API layer, not the HTML shell.
 */
export function mountStaticSpa(app: Hono, env: Env): void {
  const absoluteRoot = resolve(env.STATIC_DIR ?? resolve(process.cwd(), 'apps/web/dist'));
  const indexPath = resolve(absoluteRoot, 'index.html');

  if (!existsSync(indexPath)) {
    console.warn(
      `⚠️  SERVE_STATIC is on but no built client found at ${indexPath}. ` +
        `Run "pnpm --filter @deputy/web build" or set STATIC_DIR. Serving API only.`,
    );
    return;
  }

  // serveStatic's root must be relative to the process working directory.
  const root = relative(process.cwd(), absoluteRoot) || '.';
  const indexHtml = readFileSync(indexPath, 'utf8');

  // Static assets (JS/CSS/images). Requests to /api/* were already handled by
  // the API routes registered earlier, so this never intercepts them.
  app.use('/*', serveStatic({ root, index: 'index.html' }));

  // SPA fallback for client-side routes. Guard /api so an unknown API path
  // still fails closed as a JSON 404 rather than returning the HTML shell.
  app.get('*', c => {
    if (c.req.path.startsWith('/api/')) {
      return c.notFound();
    }
    return c.html(indexHtml);
  });

  console.info(`🗂️  Serving built SPA from ${absoluteRoot} at a single origin.`);
}
