import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '../../lib/rate-limit';

const API_KEY = process.env.MINIMAX_API_KEY || '';

const MOOD_TONE: Record<string, string> = {
  '开心': '明亮、欢快、甜蜜',
  '难过': '低沉、细腻、疗伤',
  '暧昧': '心动、微醺、悸动',
  '失落': '孤独、反思、释然',
  '平静': '安宁、舒适、放松',
  '浪漫': '温柔、甜蜜、美好',
  '孤独': '寂寞、深夜、自我对话',
  '治愈': '温暖、安慰、希望',
  '放松': '舒缓、自在、慵懒',
  '怀旧': '回忆、时光、感慨',
  '自由': '奔放、开阔、无拘无束',
  '想念': '思念、等待、牵挂',
};

const CONSTELLATION_VIBE: Record<string, string> = {
  '白羊座': '火焰、冲动、热情、直来直去',
  '金牛座': '踏实、温柔、慢节奏、享受',
  '双子座': '变化、好奇、双面、灵巧',
  '巨蟹座': '温暖、安全感、回忆、母性',
  '狮子座': '王者、骄傲、光芒、自信',
  '处女座': '细腻、完美、细节、追求',
  '天秤座': '优雅、平衡、和谐、美感',
  '天蝎座': '神秘、深沉、执着、占有',
  '射手座': '自由、远方、冒险、坦率',
  '摩羯座': '坚韧、责任、理性、稳重',
  '水瓶座': '独特、创新、抽离、叛逆',
  '双鱼座': '梦幻、浪漫、敏感、海洋',
};

const MBTI_STYLE: Record<string, string> = {
  'INTJ': '理性、深沉、内敛、战略',
  'INTP': '逻辑、抽离、思考、独特',
  'ENTJ': '果断、领导、气场、强大',
  'ENTP': '机智、辩论、创意、幽默',
  'INFJ': '理想、洞察、诗意、孤独',
  'INFP': '浪漫、敏感、梦想、纯真',
  'ENFJ': '温暖、照顾、激励、领袖',
  'ENFP': '热情、创意、灵感、表达',
  'ISTJ': '可靠、实际、传统、稳定',
  'ISFJ': '温柔、体贴、照顾、沉默',
  'ESTJ': '务实、组织、执行、效率',
  'ESFJ': '关怀、融入、和谐、活跃',
  'ISTP': '冷静、行动、技艺、寡言',
  'ISFP': '美感、细腻、感知、柔软',
  'ESTP': '冒险、刺激、即兴、魄力',
  'ESFP': '活力、热情、表现、即兴',
};

const STYLE_PROMPTS: Record<string, string> = {
  'R&B': 'R&B，节奏蓝调，律动感，groove',
  '流行': '流行歌曲，旋律朗朗上口',
  '抒情': '抒情慢歌，钢琴和弦乐',
  '电子': '电子合成，Synthwave，未来感',
  '民谣': '木吉他，清新简单，民谣',
  '国风': '中国风，古筝琵琶，意境深远',
  '爵士': '爵士乐，蓝调，萨克斯',
  '说唱': 'Hip-hop，说唱，节奏感，rap',
  '摇滚': '摇滚乐，电吉他，失真，激烈',
  '治愈': '治愈系，温暖，疗愈',
};

const MAX_PROMPT_LENGTH = 2000;

export async function POST(req: NextRequest) {
  try {
    if (!API_KEY) {
      return NextResponse.json({ error: '服务配置错误，请联系管理员' }, { status: 500 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const { ok } = checkRateLimit(ip, 10, 60_000);
    if (!ok) {
      return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
    }

    const { prompt, style, mood, constellation, mbti } = await req.json();

    if (typeof prompt === 'string' && prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json({ error: '输入内容过长，请精简后重试' }, { status: 400 });
    }

    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS['流行'];
    const hasUserInput = prompt && typeof prompt === 'string' && prompt.trim().length > 0;
    const userText = hasUserInput ? prompt.trim() : '';

    const contextParts: string[] = [];
    if (mood && MOOD_TONE[mood]) contextParts.push(`情感基调：${MOOD_TONE[mood]}`);
    if (constellation && CONSTELLATION_VIBE[constellation]) contextParts.push(`意象氛围：${CONSTELLATION_VIBE[constellation]}`);
    if (mbti && MBTI_STYLE[mbti]) contextParts.push(`表达风格：${MBTI_STYLE[mbti]}`);

    const contextLine = contextParts.length > 0 ? contextParts.join('；') + '\n' : '';

    let lyricsPrompt: string;

    if (hasUserInput) {
      lyricsPrompt = `创作指令：${userText}

参考曲风：${stylePrompt}
${contextLine}
要求：
- 严格按照用户的创作指令来写，如果指定了歌手风格/词人风格，必须深度模仿其用词习惯、意象选择、句式结构和韵脚特点
- 语言：中文
- 第一行用《歌名》格式给歌曲起一个贴合内容的名字
- 格式：用【Verse】【Pre-Chorus】【Chorus】【Bridge】【Outro】标注段落
- 结构：2段Verse + 1段Chorus + 1段Bridge
- 注意：歌词中不要出现星座、MBTI、心情这些字眼，用意象和情感自然表达
- 直接输出歌名和歌词，不要其他解释`;
    } else {
      lyricsPrompt = `创作一首${stylePrompt}风格的歌词。

${contextLine}
要求：
- 语言：中文
- 第一行用《歌名》格式给歌曲起一个贴合内容的名字
- 格式：用【Verse】【Pre-Chorus】【Chorus】【Bridge】【Outro】标注段落
- 结构：2段Verse + 1段Chorus + 1段Bridge
- 注意：歌词中不要出现星座、MBTI、心情这些字眼，用意象和情感自然表达
- 直接输出歌名和歌词，不要其他解释`;
    }

    const systemMessage = `你是一位顶级华语词人，写词风格成熟、有辨识度。

写作原则：
- 押韵：每段内保持韵脚统一，副歌的韵脚要朗朗上口，适合反复吟唱
- 画面感：用具体的场景、动作、感官细节代替抽象的形容词，让听众"看到"歌词
- 意象新鲜：每首歌找到属于自己的核心意象，不要堆砌常见词汇（霓虹、街角、雨天不是万能开头）
- 节奏感：注意每句的字数和音节，让歌词读起来有律动，适合演唱
- 情感弧线：Verse 铺场景讲故事，Chorus 情感爆发点题，Bridge 转折或升华
- 副歌要"洗脑"：简洁有力，容易记住，适合跟唱
- 少即是多：克制用词，一首歌围绕一个核心情感，不要面面俱到

当用户指定歌手或词人风格时，深度还原其标志性的用词习惯、意象选择、句式结构和韵脚特点。`;

    const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.5',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: lyricsPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      return NextResponse.json(
        { error: `⚠️ AI 服务异常 (HTTP ${response.status})${errBody ? '：' + errBody.slice(0, 200) : '，请稍后重试'}` },
        { status: 502 },
      );
    }

    const data = await response.json();

    if (data.base_resp?.status_code !== 0) {
      const code = data.base_resp?.status_code;
      const msg = data.base_resp?.status_msg || '';

      if (msg.includes('quota') || msg.includes('余额') || msg.includes('insufficient') || msg.includes('配额'))
        return NextResponse.json({ error: '⚠️ API 配额不足，请稍后再试' }, { status: 500 });
      if (msg.includes('timeout') || msg.includes('超时'))
        return NextResponse.json({ error: '⏱️ AI 生成超时，请重试' }, { status: 500 });
      if (msg.includes('rate') || msg.includes('limit') || msg.includes('频率'))
        return NextResponse.json({ error: '⚠️ 请求太频繁，请等一会再试' }, { status: 429 });
      if (msg.includes('invalid') || msg.includes('无效') || msg.includes('token'))
        return NextResponse.json({ error: '⚠️ API 认证失败，请联系管理员' }, { status: 500 });

      return NextResponse.json({ error: `❌ 歌词生成失败 (${code}): ${msg || '未知错误，请重试'}` }, { status: 500 });
    }

    const lyrics = data.choices?.[0]?.message?.content;

    if (!lyrics || lyrics.trim().length < 10) {
      return NextResponse.json({ error: '📝 AI 返回的歌词内容过短，可能是生成异常，请重试' }, { status: 500 });
    }

    const chineseChars = (lyrics.match(/[\u4e00-\u9fa5]/g) || []).length;
    if (chineseChars < lyrics.length * 0.3) {
      return NextResponse.json({ error: '📝 AI 生成了非中文内容，请调整输入后重试' }, { status: 500 });
    }

    return NextResponse.json({ lyrics });
  } catch (error: any) {
    let errorMessage = '⚠️ 服务器错误，请重试';
    if (error.message?.includes('fetch failed')) {
      errorMessage = '🌐 网络连接失败，请检查网络后重试';
    } else if (error.message) {
      errorMessage = `⚠️ 歌词生成出错：${error.message}`;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
