import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

const PACKAGES = [
  { credits: 10, price: 19.9 },
  { credits: 20, price: 36.9 },
] as const;

function xunhuHash(params: Record<string, string>, secret: string): string {
  const str = Object.keys(params)
    .filter(k => k !== 'hash' && params[k] !== '' && params[k] != null)
    .sort()
    .map(k => `${k}=${params[k]}`)
    .join('&');
  return crypto.createHash('md5').update(str + secret).digest('hex');
}

export async function POST(req: Request) {
  try {
    const { packageIndex, deviceId } = await req.json();

    const pkg = PACKAGES[packageIndex];
    if (!pkg) {
      return NextResponse.json({ error: '无效套餐' }, { status: 400 });
    }
    if (!deviceId) {
      return NextResponse.json({ error: '设备标识缺失' }, { status: 400 });
    }

    const appid = process.env.XUNHUPAY_APPID;
    const secret = process.env.XUNHUPAY_SECRET;
    if (!appid || !secret) {
      return NextResponse.json({ error: '支付渠道未配置' }, { status: 500 });
    }

    const orderId = `MS${Date.now()}${crypto.randomBytes(4).toString('hex')}`;
    const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/[^/]*$/, '') || '';

    const supabase = getSupabaseAdmin();
    await supabase.from('orders').insert({
      id: orderId,
      device_id: deviceId,
      credits: pkg.credits,
      amount: pkg.price,
      status: 'pending',
    });

    const params: Record<string, string> = {
      version: '1.1',
      appid,
      trade_order_id: orderId,
      total_fee: pkg.price.toString(),
      title: `AI音乐工坊 ${pkg.credits}次创作`,
      time: Math.floor(Date.now() / 1000).toString(),
      notify_url: `${origin}/api/pay/notify`,
      return_url: `${origin}/?paid=${orderId}`,
      nonce_str: crypto.randomBytes(16).toString('hex'),
    };
    params.hash = xunhuHash(params, secret);

    const res = await fetch('https://api.xunhupay.com/payment/do.html', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(params),
    });

    const data = await res.json();

    if (data.errcode !== 0) {
      return NextResponse.json({ error: data.errmsg || '创建支付失败' }, { status: 502 });
    }

    return NextResponse.json({
      orderId,
      qrUrl: data.url_qrcode,
      payUrl: data.url,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '未知错误';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
