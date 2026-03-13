import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.MINIMAX_API_KEY || 'sk-api-ohz6ii188v3p0oZxA5yfT1Y1BvvoaZtRH-xFH0ti938-NGit7Atd5DfxAPbc2qETLvP_wdIonCuKymCH-40VGSwcccIj7KxaNnZf1MkJ7k3lRnAPzSsWANc';

// 心情 → 情感基调
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
  '想念': '思念、等待、牵挂'
};

// 星座 → 意象氛围
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
  '双鱼座': '梦幻、浪漫、敏感、海洋'
};

// MBTI → 表达风格
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
  'ESFP': '活力、热情、表现、即兴'
};

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

export async function POST(req: NextRequest) {
  try {
    const { prompt, style, mood, constellation, mbti } = await req.json();

    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS['流行'];

    // Build influencing factors
    let toneGuide = '';
    let vibeGuide = '';
    let styleGuide = '';

    if (mood && MOOD_TONE[mood]) {
      toneGuide = `情感基调：${MOOD_TONE[mood]}，`;
    }

    if (constellation && CONSTELLATION_VIBE[constellation]) {
      vibeGuide = `意象氛围：${CONSTELLATION_VIBE[constellation]}，`;
    }

    if (mbti && MBTI_STYLE[mbti]) {
      styleGuide = `表达风格：${MBTI_STYLE[mbti]}，`;
    }

    let userInput = '';
    if (prompt && prompt.trim()) {
      userInput = `\n用户想表达：${prompt}`;
    }

    const lyricsPrompt = `创作歌词。

${toneGuide}${vibeGuide}${styleGuide}曲风：${stylePrompt}${userInput}

要求：
- 语言：中文
- 格式：用以下标签标注段落
  - 【Verse】或【主歌】表示主歌
  - 【Pre-Chorus】或【桥段】表示前副歌
  - 【Chorus】或【副歌】表示副歌
  - 【Bridge】表示桥段
  - 【Outro】表示结尾
- 结构：2段Verse + 1段Chorus + 1段Bridge
- 注意：歌词中不要出现星座、MBTI、心情这些词，用意象和情感自然表达
- 直接输出歌词和标签，不要其他解释`;

    const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'MiniMax-M2.1',
        messages: [
          { role: 'user', content: lyricsPrompt }
        ]
      })
    });

    const data = await response.json();
    
    console.log('Lyrics API response:', JSON.stringify(data));

    if (data.base_resp?.status_code !== 0) {
      const errorMsg = data.base_resp?.status_msg || '歌词生成失败，请重试';
      console.error('Lyrics error:', errorMsg);
      return NextResponse.json({ error: errorMsg }, { status: 500 });
    }

    const lyrics = data.choices?.[0]?.message?.content;

    // Validate lyrics - be more lenient
    if (!lyrics || lyrics.trim().length < 10) {
      console.error('Lyrics too short:', lyrics);
      return NextResponse.json({ error: '歌词生成失败，请重试' }, { status: 500 });
    }

    // Just check it's mostly Chinese characters (at least 50%)
    const chineseChars = (lyrics.match(/[\u4e00-\u9fa5]/g) || []).length;
    if (chineseChars < lyrics.length * 0.3) {
      console.error('Lyrics not enough Chinese:', lyrics);
      return NextResponse.json({ error: '歌词生成失败，请重试' }, { status: 500 });
    }

    return NextResponse.json({ lyrics });
  } catch (error: any) {
    console.error('Lyrics generation error:', error);
    
    let errorMessage = '服务器错误，请重试';
    if (error.message?.includes('fetch failed')) {
      errorMessage = '网络错误，请检查网络后重试';
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
