import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase 未配置');
  }

  _client = createClient(url, key);
  return _client;
}

export type CommunityRow = {
  id: string;
  title: string;
  lyrics: string;
  audio_url: string;
  style: string;
  nickname: string;
  created_at: string;
};
