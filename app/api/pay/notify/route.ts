import crypto from 'crypto';
import { getSupabaseAdmin } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

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
    const secret = process.env.XUNHUPAY_SECRET;
    if (!secret) return new Response('fail', { status: 500 });

    const formData = await req.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const expected = xunhuHash(params, secret);
    if (expected !== params.hash) {
      return new Response('fail', { status: 403 });
    }

    if (params.status !== 'OD') {
      return new Response('success');
    }

    const supabase = getSupabaseAdmin();
    await supabase
      .from('orders')
      .update({
        status: 'paid',
        xunhupay_order_id: params.open_order_id || null,
        paid_at: new Date().toISOString(),
      })
      .eq('id', params.trade_order_id)
      .eq('status', 'pending');

    return new Response('success');
  } catch {
    return new Response('fail', { status: 500 });
  }
}
