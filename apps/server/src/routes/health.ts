import { Hono } from 'hono';
import { getEnv } from '@deputy/config';
import { verifyDatabaseReadiness } from '@deputy/database';
import { AppServices } from '../services/index.js';

export function createHealthRoutes(services: AppServices): Hono {
  const router = new Hono();
  const env = getEnv();

  /**
   * GET /api/health
   * Simple process liveness probe.
   */
  router.get('/health', c => {
    return c.json({
      status: 'healthy',
      service: 'deputy-server',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      webmcp: services.webmcpAdapter.getCapabilities(),
    });
  });

  /**
   * GET /api/readiness
   * Comprehensive readiness probe. Verifies database connectivity,
   * repository mode, WebAuthn configuration, and system resources.
   */
  router.get('/readiness', async c => {
    const memoryUsage = process.memoryUsage();
    const memory = {
      heapUsedMb: Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100,
      heapTotalMb: Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100,
      rssMb: Math.round((memoryUsage.rss / 1024 / 1024) * 100) / 100,
    };

    const readiness: Record<string, unknown> = {
      ready: true,
      repositoryMode: services.repositoryMode,
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
      memory,
      webauthn: {
        rpId: env.RP_ID,
        origin: env.WEBAUTHN_ORIGIN,
      },
      audit: {
        tamperEvident: true,
        hashChaining: true,
      },
    };

    // If using PostgreSQL, verify live database connection & tables
    if (services.repositoryMode === 'POSTGRES' && services.db) {
      const dbCheck = await verifyDatabaseReadiness(services.db);
      readiness['database'] = {
        connected: dbCheck.connected,
        tablesCount: dbCheck.tablesFound.length,
        missingTables: dbCheck.missingTables,
      };

      if (!dbCheck.ready) {
        readiness['ready'] = false;
        readiness['error'] = dbCheck.error;
        return c.json(readiness, 503);
      }
    } else {
      readiness['database'] = {
        connected: true,
        mode: 'IN_MEMORY',
      };

      // Failsafe: reject MEMORY mode in production unless explicit dev flag is set
      if (env.NODE_ENV === 'production' && !env.ALLOW_IN_MEMORY_DEV) {
        readiness['ready'] = false;
        readiness['error'] = 'Production server cannot operate in MEMORY repository mode.';
        return c.json(readiness, 503);
      }
    }

    return c.json(readiness, 200);
  });

  return router;
}
