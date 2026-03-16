import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '../../lib/supabase';
import { checkRateLimit } from '../../lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { ok } = checkRateLimit(ip, 10, 60_000);
    if (!ok) {
      return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
    }

    const { code, deviceId } = await req.json();

    if (!code || !deviceId) {
      return NextResponse.json({ error: '缺少必要信息' }, { status: 400 });
    }

    const trimmedCode = code.trim().toUpperCase();
    if (trimmedCode.length < 4 || trimmedCode.length > 32) {
      return NextResponse.json({ error: '兑换码格式不正确' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: codeRow, error: findErr } = await supabase
      .from('credit_codes')
      .select('*')
      .eq('code', trimmedCode)
      .maybeSingle();

    if (findErr || !codeRow) {
      return NextResponse.json({ error: '兑换码无效' }, { status: 404 });
    }

    if (codeRow.used_by) {
      return NextResponse.json({ error: '该兑换码已被使用' }, { status: 409 });
    }

    const { error: updateErr } = await supabase
      .from('credit_codes')
      .update({ used_by: deviceId, used_at: new Date().toISOString() })
      .eq('id', codeRow.id)
      .is('used_by', null);

    if (updateErr) {
      return NextResponse.json({ error: '兑换失败，请重试' }, { status: 500 });
    }

    return NextResponse.json({
      credits: codeRow.credits,
      message: `兑换成功！获得 ${codeRow.credits} 次创作机会`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || '服务器错误' }, { status: 500 });
  }
}
