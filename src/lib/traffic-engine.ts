import { supabase, Project } from './supabase';
import { getRandomUserAgent, getGeotargetedIP, generateReferrer, extractAnalyticsId } from './utils';

export class TrafficEngine {
  private static isRunning = false;

  /**
   * Main function called by the scheduler to process active projects
   */
  public static async processActiveProjects() {
    if (this.isRunning) {
      console.log('[TrafficEngine] Already running. Skipping this cycle.');
      return;
    }

    this.isRunning = true;
    console.log(`[TrafficEngine] Starting traffic generation cycle at ${new Date().toISOString()}`);

    try {
      // Get current date and time in America/Sao_Paulo timezone
      const options = {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour12: false
      } as const;
      const formatter = new Intl.DateTimeFormat('pt-BR', options);
      const parts = formatter.formatToParts(new Date());
      const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));

      const year = partMap.year;
      const month = partMap.month;
      const day = partMap.day;
      const hour = parseInt(partMap.hour, 10);
      const minute = parseInt(partMap.minute, 10);

      const currentDateStr = `${year}-${month}-${day}`;

      // 1. Fetch active projects with owner credits
      // We perform a query and join mt_profiles using Supabase syntax
      const { data: projects, error } = await supabase
        .from('mt_projects')
        .select(`
          *,
          profile:mt_profiles!mt_projects_user_id_fkey(credits, role)
        `)
        .eq('status', 'active');

      if (error) {
        console.error('[TrafficEngine] Error fetching active projects:', error);
        this.isRunning = false;
        return;
      }

      if (!projects || projects.length === 0) {
        console.log('[TrafficEngine] No active projects found.');
        this.isRunning = false;
        return;
      }

      console.log(`[TrafficEngine] Processing ${projects.length} active project(s) for date ${currentDateStr} (Brazil time: ${hour}:${minute}).`);

      // 2. Loop through each project
      for (const project of projects) {
        const profile = Array.isArray(project.profile) ? project.profile[0] : project.profile;
        const userCredits = profile?.credits || 0;

        if (userCredits <= 0) {
          console.log(`[TrafficEngine] User for project ${project.name} has no credits. Pausing campaign.`);
          // Pause project
          await supabase
            .from('mt_projects')
            .update({ status: 'pending_credits' })
            .eq('id', project.id);
          continue;
        }

        // Check if day changed (in America/Sao_Paulo timezone)
        if (project.last_reset_date !== currentDateStr) {
          console.log(`[TrafficEngine] Resetting daily visits for project "${project.name}" (New Day: ${currentDateStr}, Prev: ${project.last_reset_date})`);
          await supabase
            .from('mt_projects')
            .update({
              visits_delivered_today: 0,
              last_reset_date: currentDateStr
            })
            .eq('id', project.id);
          
          project.visits_delivered_today = 0;
          project.last_reset_date = currentDateStr;
        }

        // Calculate hits to send in this minute dynamically to meet the target
        const remainingVisits = Math.max(0, project.daily_visits - project.visits_delivered_today);
        if (remainingVisits <= 0) {
          console.log(`[TrafficEngine] Project "${project.name}" already met its daily target of ${project.daily_visits} visits.`);
          continue;
        }

        // Calculate remaining minutes in the day
        const currentMinute = hour * 60 + minute;
        const remainingMinutes = Math.max(1, 1440 - currentMinute);

        // Target rate per minute to fulfill the goal
        const targetRate = remainingVisits / remainingMinutes;
        const decimal = targetRate % 1;
        let hitsToSend = Math.floor(targetRate) + (Math.random() < decimal ? 1 : 0);

        // If rate is very low but non-zero, ensure random activation
        if (hitsToSend === 0 && targetRate > 0) {
          hitsToSend = Math.random() < targetRate ? 1 : 0;
        }

        // Capping rules:
        // Capping to prevent excessive resource utilization on late activations or server catchups
        const maxAllowedPerMinute = Math.max(5, Math.ceil((project.daily_visits / 1440) * 3));
        if (hitsToSend > maxAllowedPerMinute) {
          console.log(`[TrafficEngine] Capping hits to send from ${hitsToSend} to ${maxAllowedPerMinute} (daily target: ${project.daily_visits}, remaining minutes: ${remainingMinutes})`);
          hitsToSend = maxAllowedPerMinute;
        }

        // Ensure we do not exceed remaining visits today
        hitsToSend = Math.min(hitsToSend, remainingVisits);

        // Cap hits based on user credits
        if (hitsToSend > userCredits) {
          hitsToSend = userCredits;
        }

        if (hitsToSend <= 0) {
          continue;
        }

        console.log(`[TrafficEngine] Sending ${hitsToSend} hit(s) for project "${project.name}" (${project.url}). Target remaining today: ${remainingVisits}`);

        // Send hits immediately and asynchronously (without setTimeout context truncation)
        for (let i = 0; i < hitsToSend; i++) {
          TrafficEngine.sendSingleHit(project, userCredits - i);
        }
      }
    } catch (err) {
      console.error('[TrafficEngine] Critical error in engine cycle:', err);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Simulates a single hit to the target site and registers in Google Analytics
   */
  private static async sendSingleHit(project: any, currentCredits: number) {
    if (currentCredits <= 0) return;

    // 1. Determine device type based on settings
    const randDevice = Math.random() * 100;
    const deviceType: 'desktop' | 'mobile' = randDevice <= project.device_desktop ? 'desktop' : 'mobile';

    // 2. Select User Agent & IP with Geotargeting
    const userAgent = getRandomUserAgent(deviceType);
    const clientIP = getGeotargetedIP(
      project.geotarget_type || 'global',
      project.geotarget_country,
      project.geotarget_state,
      project.geotarget_city
    );

    // 3. Generate Referrer
    const referrer = generateReferrer(project.referrer_type, project.custom_referrers, project.keywords);

    console.log(`[TrafficEngine] Hit detail - URL: ${project.url} | Device: ${deviceType} | Ref: ${referrer || 'Direct'}`);

    let htmlContent = '';
    let fetchedOk = false;

    // 4. Request the client's URL directly to register in their server logs
    try {
      const headers: Record<string, string> = {
        'User-Agent': userAgent,
        'X-Forwarded-For': clientIP,
        'True-Client-IP': clientIP,
        'Client-IP': clientIP
      };
      if (referrer) {
        headers['Referer'] = referrer;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const response = await fetch(project.url, {
        method: 'GET',
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      htmlContent = await response.text();
      fetchedOk = response.ok;
    } catch (e) {
      console.warn(`[TrafficEngine] Failed HTTP request to ${project.url}:`, (e as Error).message);
    }

    // 5. Inject Google Analytics 4 pageview
    let gaStatus: 'sent' | 'failed' = 'failed';
    const { ga4Id } = extractAnalyticsId(htmlContent);

    if (ga4Id) {
      try {
        // Construct standard GA4 measurement protocol URL
        // We use the public HTTP endpoint that GA uses: /g/collect
        const gaUrl = new URL('https://www.google-analytics.com/g/collect');
        gaUrl.searchParams.set('v', '2');
        gaUrl.searchParams.set('tid', ga4Id);
        
        // Random Client ID to represent a new user
        const cid = `${Math.floor(Math.random() * 1000000000)}.${Math.floor(Math.random() * 1000000000)}`;
        gaUrl.searchParams.set('cid', cid);
        
        // Page Location (dl) and Referrer (dr)
        gaUrl.searchParams.set('dl', project.url);
        if (referrer) {
          gaUrl.searchParams.set('dr', referrer);
        }
        
        // Screen resolution & system details
        gaUrl.searchParams.set('sr', deviceType === 'desktop' ? '1920x1080' : '390x844');
        gaUrl.searchParams.set('ul', 'pt-br');
        gaUrl.searchParams.set('en', 'page_view');
        
        // Session ID
        const sid = `${Math.floor(Math.random() * 1000000000)}`;
        gaUrl.searchParams.set('sid', sid);
        gaUrl.searchParams.set('sct', '1');
        gaUrl.searchParams.set('seg', '1');
        
        // Geotargeting override IP in Google Analytics (using all potential GA4 override parameters)
        gaUrl.searchParams.set('_uip', clientIP);
        gaUrl.searchParams.set('uip', clientIP);
        gaUrl.searchParams.set('_u.ip', clientIP);

        const gaResponse = await fetch(gaUrl.toString(), {
          method: 'POST',
          headers: {
            'User-Agent': userAgent,
            'X-Forwarded-For': clientIP,
            'Client-IP': clientIP
          }
        });

        if (gaResponse.ok) {
          gaStatus = 'sent';
          console.log(`[TrafficEngine] Google Analytics 4 hit injected successfully: ${ga4Id}`);
        } else {
          console.warn(`[TrafficEngine] GA4 collect request returned status ${gaResponse.status}`);
        }
      } catch (gaError) {
        console.error('[TrafficEngine] Failed to inject GA4 hit:', (gaError as Error).message);
      }
    } else {
      console.log(`[TrafficEngine] No GA4 ID detected in HTML for ${project.url}. Server hit completed only.`);
    }

    // 6. DB Updates (Decrement user credits, Increment project counts, Log hit)
    try {
      // Use RPC or individual calls
      // Decrement credits
      const { error: decErr } = await supabase.rpc('decrement_user_credits', {
        user_uuid: project.user_id,
        amount_to_sub: 1
      });

      if (decErr) {
        console.warn('[TrafficEngine] RPC decrement failed, trying fallback:', decErr.message);
        // Fallback if RPC doesn't exist
        const { data } = await supabase
          .from('mt_profiles')
          .select('credits')
          .eq('id', project.user_id)
          .single();
        if (data) {
          await supabase
            .from('mt_profiles')
            .update({ credits: Math.max(0, data.credits - 1) })
            .eq('id', project.user_id);
        }
      }

      // Increment project metrics
      const { error: incErr } = await supabase.rpc('increment_project_visits', {
        project_uuid: project.id
      });

      if (incErr) {
        console.warn('[TrafficEngine] RPC increment failed, trying fallback:', incErr.message);
        // Fallback
        const { data } = await supabase
          .from('mt_projects')
          .select('visits_delivered_today, total_visits_delivered')
          .eq('id', project.id)
          .single();
        if (data) {
          await supabase
            .from('mt_projects')
            .update({
              visits_delivered_today: data.visits_delivered_today + 1,
              total_visits_delivered: data.total_visits_delivered + 1
            })
            .eq('id', project.id);
        }
      }

      // Insert log
      await supabase
        .from('mt_traffic_logs')
        .insert({
          project_id: project.id,
          referrer: referrer || 'Direto',
          user_agent: userAgent,
          device: deviceType,
          ip: clientIP,
          ga_status: gaStatus
        });

    } catch (dbErr) {
      console.error('[TrafficEngine] Database logging error:', dbErr);
    }
  }
}


