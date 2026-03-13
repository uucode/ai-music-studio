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

    // Validate input - be more lenient
    if (!lyrics || lyrics.trim().length < 5) {
      return NextResponse.json({ error: '歌词太短' }, { status: 400 });
    }

    const stylePrompt = stylePrompts[style] || stylePrompts['流行'];

    // Add timeout controller - 4 minutes (Vercel limit is 5 min)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 240000); // 4 min timeout

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
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const data = await response.json();
    
    console.log('MiniMax API response:', JSON.stringify(data));

    if (data.base_resp?.status_code !== 0) {
      const errorMsg = data.base_resp?.status_msg || '';
      
      // More specific error messages
      if (errorMsg.includes('quota') || errorMsg.includes('余额') || errorMsg.includes('insufficient') || errorMsg.includes('配额')) {
        return NextResponse.json({ error: '⚠️ API配额不足，请稍后再试或联系管理员' }, { status: 500 });
      }
      if (errorMsg.includes('timeout') || errorMsg.includes('超时')) {
        return NextResponse.json({ error: '⏱️ 生成超时，请重试' }, { status: 500 });
      }
      if (errorMsg.includes('lyrics') || errorMsg.includes('歌词')) {
        return NextResponse.json({ error: '📝 歌词不符合要求，请重试' }, { status: 500 });
      }
      if (errorMsg.includes('model') || errorMsg.includes('模型')) {
        return NextResponse.json({ error: '🤖 模型错误，请重试' }, { status: 500 });
      }
      if (errorMsg.includes('length') || errorMsg.includes('too long')) {
        return NextResponse.json({ error: '📏 歌词太长了，请简化后重试' }, { status: 500 });
      }
      
      return NextResponse.json({ error: `❌ 生成失败: ${errorMsg || '请重试'}` }, { status: 500 });
    }

    const audioUrl = data.data?.audio;

    if (!audioUrl) {
      console.error('No audio URL in response:', data);
      return NextResponse.json({ error: '🎵 未能获取音频文件，请重试' }, { status: 500 });
    }

    return NextResponse.json({ audioUrl });
  } catch (error: any) {
    console.error('Music generation error:', error);
    
    let errorMessage = '⚠️ 服务器错误，请重试';
    if (error.name === 'AbortError') {
      errorMessage = '⏱️ 作曲时间过长（超过4分钟），请稍后再试或尝试简化歌词';
    } else if (error.message?.includes('fetch failed')) {
      errorMessage = '🌐 网络连接失败，请检查网络';
    } else if (error.message) {
      errorMessage = `⚠️ 错误: ${error.message}`;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
