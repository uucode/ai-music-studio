import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '../../lib/rate-limit';

const API_KEY = process.env.MINIMAX_API_KEY || 'sk-api-IV3qZ_MOiLHrws81u9j4vRMBFDADS2fHu4NhVcuLC8vPBUCCqrYs8o6_BnI3bvgj4650HmDKgTKmqR0EEitwDZxF8VK9GgqXajAHBKtylYDaVRzF1Jb13hc';

const STYLE_PROMPTS: Record<string, string> = {
  'R&B': 'R&B节奏，蓝调元素，律动感，女声，groove，性感慵懒',
  '流行': '流行歌曲，旋律朗朗上口，编曲丰富',
  '抒情': '抒情慢歌，钢琴和弦乐，温柔女声',
  '电子': '电子合成，Synthwave，未来感',
  '民谣': '木吉他，清新简单，民谣风格',
  '国风': '中国风，古筝，琵琶，意境深远，含蓄优雅',
  '爵士': '爵士乐，蓝调，萨克斯，优雅',
  '说唱': '说唱，节奏感，rap，嘻哈',
  '摇滚': '摇滚乐，吉他，失真，激烈',
  '治愈': '治愈系，温暖，疗愈，温柔',
};

const MAX_LYRICS_LENGTH = 5000;
const MAX_TITLE_LENGTH = 100;

export async function POST(req: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json({ error: '服务配置错误，请联系管理员' }, { status: 500 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { ok } = checkRateLimit(ip, 5, 60_000);
    if (!ok) {
      return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
    }

    const { lyrics, style, title } = await req.json();

    if (!lyrics || typeof lyrics !== 'string' || lyrics.trim().length < 5) {
      return NextResponse.json({ error: '歌词太短，至少需要5个字符' }, { status: 400 });
    }

    if (lyrics.length > MAX_LYRICS_LENGTH) {
      return NextResponse.json({ error: `歌词过长，最多${MAX_LYRICS_LENGTH}字` }, { status: 400 });
    }

    const safeTitle = typeof title === 'string' ? title.slice(0, MAX_TITLE_LENGTH) : 'AI生成歌曲';
    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS['流行'];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 240_000);

    const response = await fetch('https://api.minimax.chat/v1/music_generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'music-2.5+',
        title: safeTitle,
        prompt: stylePrompt,
        lyrics,
        output_format: 'url',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      return NextResponse.json(
        { error: `⚠️ AI 作曲服务异常 (HTTP ${response.status})${errBody ? '：' + errBody.slice(0, 200) : '，请稍后重试'}` },
        { status: 502 },
      );
    }

    const data = await response.json();

    if (data.base_resp?.status_code !== 0) {
      const msg = data.base_resp?.status_msg || '';

      if (msg.includes('quota') || msg.includes('余额') || msg.includes('insufficient') || msg.includes('配额'))
        return NextResponse.json({ error: '⚠️ API配额不足，请稍后再试或联系管理员' }, { status: 500 });
      if (msg.includes('timeout') || msg.includes('超时'))
        return NextResponse.json({ error: '⏱️ 生成超时，请重试' }, { status: 500 });
      if (msg.includes('lyrics') || msg.includes('歌词'))
        return NextResponse.json({ error: '📝 歌词不符合要求，请重试' }, { status: 500 });
      if (msg.includes('length') || msg.includes('too long'))
        return NextResponse.json({ error: '📏 歌词太长了，请简化后重试' }, { status: 500 });

      return NextResponse.json({ error: `❌ 生成失败: ${msg || '请重试'}` }, { status: 500 });
    }

    const audioUrl = data.data?.audio;
    if (!audioUrl) {
      return NextResponse.json({ error: '🎵 未能获取音频文件，请重试' }, { status: 500 });
    }

    return NextResponse.json({ audioUrl });
  } catch (error: any) {
    let errorMessage = '⚠️ 服务器错误，请重试';
    if (error.name === 'AbortError') {
      errorMessage = '⏱️ 作曲时间过长（超过4分钟），请稍后再试或尝试简化歌词';
    } else if (error.message?.includes('fetch failed')) {
      errorMessage = '🌐 网络连接失败，请检查网络';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
