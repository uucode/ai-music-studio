import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ error: '缺少订单号' }, { status: 400 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('orders')
      .select('status, credits')
      .eq('id', orderId)
      .single();

    if (!data) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 });
    }

    return NextResponse.json({ status: data.status, credits: data.credits });
  } catch {
    return NextResponse.json({ error: '查询失败' }, { status: 500 });
  }
}
