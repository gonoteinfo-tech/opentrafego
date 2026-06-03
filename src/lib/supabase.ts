import { createClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    const url = (window as any).__SUPABASE_URL__ || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const key = (window as any).__SUPABASE_ANON_KEY__ || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
    return { url, key };
  }
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  };
};

const { url, key } = getSupabaseConfig();
export const supabase = createClient(url, key);

export interface Profile {
  id: string;
  full_name: string;
  credits: number;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  url: string;
  daily_visits: number;
  visits_delivered_today: number;
  total_visits_delivered: number;
  retention_min: number;
  retention_max: number;
  referrer_type: 'direct' | 'search' | 'social' | 'custom';
  custom_referrers: string[];
  keywords: string[];
  device_desktop: number;
  device_mobile: number;
  geotarget_type: 'global' | 'country' | 'state' | 'city';
  geotarget_country?: string;
  geotarget_state?: string;
  geotarget_city?: string;
  last_reset_date?: string | null;
  status: 'active' | 'paused' | 'completed' | 'pending_credits';
  created_at: string;
}

export interface TrafficLog {
  id: string;
  project_id: string;
  referrer: string;
  user_agent: string;
  device: 'desktop' | 'mobile' | 'tablet';
  ip: string;
  ga_status: 'sent' | 'failed';
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  credits_added: number;
  status: 'pending' | 'approved' | 'failed';
  payment_method: string;
  created_at: string;
}


