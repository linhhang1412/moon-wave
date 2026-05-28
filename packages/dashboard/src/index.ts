import { DashboardServer, type DashboardOptions } from './DashboardServer';

export { DashboardServer };
export type { DashboardOptions, DashboardAuth } from './DashboardServer';

/**
 * Create a self-hosted dashboard for moon-wave agents.
 *
 * @example
 * ```typescript
 * import { createDashboard } from '@moon-wave/dashboard';
 *
 * const dashboard = createDashboard({
 *   agents: { support: supportAgent, coding: codingAgent },
 *   auth: { token: env.DASHBOARD_TOKEN },
 * });
 *
 * export default {
 *   async fetch(req: Request, env: Env): Promise<Response> {
 *     if (new URL(req.url).pathname.startsWith('/dashboard')) {
 *       return dashboard.handle(req, env as unknown as Record<string, unknown>);
 *     }
 *     // ... rest of your worker
 *   }
 * };
 * ```
 */
export function createDashboard(options: DashboardOptions): DashboardServer {
  return new DashboardServer(options);
}
