import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.MINIMAX_API_KEY || 'sk-api-ohz6ii188v3p0oZxA5yfT1Y1BvvoaZtRH-xFH0ti938-NGit7Atd5DfxAPbc2qETLvP_wdIonCuKymCH-40VGSwcccIj7KxaNnZf1MkJ7k3lRnAPzSsWANc';

export async function POST(req: NextRequest) {
  try {
    const { lyrics, style, title } = await req.json();

    if (!lyrics) {
      return NextResponse.json({ error: '请输入歌词' }, { status: 400 });
    }

    const stylePrompts: Record<string, string> = {
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

    const stylePrompt = stylePrompts[style] || stylePrompts['流行'];

    const response = await fetch('https://api.minimax.chat/v1/music_generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'music-2.5+',
        title: title || 'AI生成歌曲',
        prompt: stylePrompt,
        lyrics: lyrics,
        output_format: 'url'
      })
    });

    const data = await response.json();

    if (data.base_resp?.status_code !== 0) {
      return NextResponse.json({ 
        error: data.base_resp?.status_msg || '生成失败' 
      }, { status: 500 });
    }

    const audioUrl = data.data?.audio;

    if (!audioUrl) {
      return NextResponse.json({ error: '获取音频失败' }, { status: 500 });
    }

    return NextResponse.json({ audioUrl });
  } catch (error) {
    console.error('Music generation error:', error);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}
