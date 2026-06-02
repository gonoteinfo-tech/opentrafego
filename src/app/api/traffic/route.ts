import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { TrafficEngine } from '@/lib/traffic-engine';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Debug-API] Running database query check...');
    const { data: projects, error } = await supabase
      .from('mt_projects')
      .select(`
        *,
        profile:mt_profiles!mt_projects_user_id_fkey(credits, role)
      `)
      .eq('status', 'active');

    console.log('[Debug-API] Error:', error);
    console.log('[Debug-API] Projects raw output:', JSON.stringify(projects, null, 2));

    if (projects && projects.length > 0) {
      for (const project of projects) {
        const profile: any = Array.isArray(project.profile) ? project.profile[0] : project.profile;
        console.log('[Debug-API] Project name:', project.name);
        console.log('[Debug-API] Resolved profile:', JSON.stringify(profile));
        console.log('[Debug-API] Credits:', profile?.credits);
        console.log('[Debug-API] Daily visits:', project.daily_visits);
      }
    }

    // Run the actual engine cycle
    await TrafficEngine.processActiveProjects();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Traffic generation cycle executed.',
      debug_info: {
        error,
        projects
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}


