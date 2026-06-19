export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const { default: cron } = await import('node-cron');
      const { TrafficEngine } = await import('./lib/engine/traffic-engine');

      console.log('[Cron] 🚀 Initializing Open Tráfego background engine...');

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
