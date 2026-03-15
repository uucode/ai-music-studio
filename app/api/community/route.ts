import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, getSupabaseAdmin } from '../../lib/supabase';
import { checkRateLimit } from '../../lib/rate-limit';

export const dynamic = 'force-dynamic';

const AUDIO_BUCKET = 'audio';

async function persistAudio(audioUrl: string): Promise<string> {
  const admin = getSupabaseAdmin();

  const res = await fetch(audioUrl);
  if (!res.ok) throw new Error('音频下载失败');

  const contentType = res.headers.get('content-type') || 'audio/mpeg';
  const buffer = await res.arrayBuffer();

  const ext = contentType.includes('wav') ? 'wav' : 'mp3';
  const filename = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error } = await admin.storage
    .from(AUDIO_BUCKET)
    .upload(filename, buffer, { contentType, upsert: false });

  if (error) throw new Error(`音频上传失败: ${error.message}`);

  const { data: urlData } = admin.storage
    .from(AUDIO_BUCKET)
    .getPublicUrl(filename);

  return urlData.publicUrl;
}

export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('community_songs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json({ error: '加载社区歌曲失败' }, { status: 500 });
    }

    return NextResponse.json({ songs: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '服务器错误' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = getSupabase();

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { ok } = checkRateLimit(ip, 5, 60_000);
    if (!ok) {
      return NextResponse.json({ error: '分享过于频繁，请稍后再试' }, { status: 429 });
    }

    const { title, lyrics, audioUrl, style, nickname } = await req.json();

    if (!title || !lyrics || !audioUrl || !style) {
      return NextResponse.json({ error: '缺少必要信息' }, { status: 400 });
    }

    if (title.length > 100 || lyrics.length > 10000 || nickname?.length > 50) {
      return NextResponse.json({ error: '内容过长' }, { status: 400 });
    }

    let permanentUrl = audioUrl;
    let audioError: string | null = null;
    try {
      permanentUrl = await persistAudio(audioUrl);
    } catch (e: any) {
      audioError = e.message || '未知音频持久化错误';
      console.error('[community] persistAudio failed:', audioError);
    }

    const { data, error } = await supabase
      .from('community_songs')
      .insert({
        title,
        lyrics,
        audio_url: permanentUrl,
        style,
        nickname: nickname || '匿名用户',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: '分享失败，请重试' }, { status: 500 });
    }

    return NextResponse.json({
      song: data,
      ...(audioError ? { audioWarning: audioError } : {}),
      audioPersisted: !audioError,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '服务器错误' }, { status: 500 });
  }
}
