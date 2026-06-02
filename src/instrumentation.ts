/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts (both dev and production).
 * Uses node-cron to automatically trigger traffic generation every minute.
 */
export async function register() {
  // Only run in Node.js runtime (not in edge/browser contexts)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { default: cron } = await import('node-cron');
      const { TrafficEngine } = await import('@/lib/traffic-engine');

      console.log('[Cron] 🚀 Initializing Open Tráfego background engine...');

      // Schedule: every minute
      cron.schedule('* * * * *', async () => {
        try {
          await TrafficEngine.processActiveProjects();
        } catch (cronErr) {
          console.error('[Cron] Error executing TrafficEngine cycle:', cronErr);
        }
      }, {
        timezone: 'America/Sao_Paulo',
      });

      console.log('[Cron] ✓ Traffic scheduler registered to run every minute.');

      // Run once 5 seconds after startup to verify it's working
      setTimeout(async () => {
        console.log('[Cron] Running startup test cycle...');
        try {
          await TrafficEngine.processActiveProjects();
        } catch (testErr) {
          console.error('[Cron] Startup test cycle failed:', testErr);
        }
      }, 5000);

    } catch (e) {
      console.error('[Cron] Failed to register background traffic scheduler:', e);
    }
  }
}


