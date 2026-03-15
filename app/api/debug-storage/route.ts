import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, string> = {};

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  checks['SUPABASE_URL'] = url ? `✅ ${url}` : '❌ 未设置';
  checks['SERVICE_ROLE_KEY'] = serviceKey
    ? `✅ 已设置 (${serviceKey.slice(0, 10)}...${serviceKey.slice(-5)})`
    : '❌ 未设置';

  try {
    const admin = getSupabaseAdmin();
    checks['admin_client'] = '✅ 创建成功';

    const { data: buckets, error: bucketsErr } = await admin.storage.listBuckets();
    if (bucketsErr) {
      checks['list_buckets'] = `❌ ${bucketsErr.message}`;
    } else {
      checks['list_buckets'] = `✅ ${(buckets || []).map(b => b.name).join(', ') || '(空)'}`;
    }

    const hasAudio = buckets?.some(b => b.name === 'audio');
    checks['audio_bucket'] = hasAudio ? '✅ 存在' : '❌ 不存在，请在 Supabase Dashboard 创建名为 audio 的公共 bucket';

    if (hasAudio) {
      const testData = new TextEncoder().encode('test');
      const testFile = `_test_${Date.now()}.txt`;
      const { error: uploadErr } = await admin.storage
        .from('audio')
        .upload(testFile, testData, { contentType: 'text/plain' });

      if (uploadErr) {
        checks['upload_test'] = `❌ 上传失败: ${uploadErr.message}`;
      } else {
        checks['upload_test'] = '✅ 上传成功';
        const { data: urlData } = admin.storage.from('audio').getPublicUrl(testFile);
        checks['public_url'] = `✅ ${urlData.publicUrl}`;
        await admin.storage.from('audio').remove([testFile]);
        checks['cleanup'] = '✅ 测试文件已清理';
      }
    }
  } catch (e: any) {
    checks['error'] = `❌ ${e.message}`;
  }

  return NextResponse.json(checks, {
    headers: { 'Content-Type': 'application/json' },
  });
}
