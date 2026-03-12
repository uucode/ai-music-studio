'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

type MusicStyle = 'R&B' | '流行' | '抒情' | '电子' | '民谣' | '国风' | '爵士' | '说唱' | '摇滚' | '治愈';
type Mood = '开心' | '难过' | '暧昧' | '失落' | '平静' | '浪漫' | '孤独' | '治愈' | '放松' | '怀旧' | '自由' | '想念';
type MBTI = 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP' | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP' | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ' | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';
type Constellation = '白羊座' | '金牛座' | '双子座' | '巨蟹座' | '狮子座' | '处女座' | '天秤座' | '天蝎座' | '射手座' | '摩羯座' | '水瓶座' | '双鱼座';

const MUSIC_STYLES: { name: MusicStyle; desc: string; icon: string }[] = [
  { name: 'R&B', desc: '节奏蓝调', icon: '🎤' },
  { name: '流行', desc: '流行歌曲', icon: '🎶' },
  { name: '抒情', desc: '慢歌情歌', icon: '🎹' },
  { name: '电子', desc: '电子合成', icon: '🎛️' },
  { name: '民谣', desc: '木吉他', icon: '🪕' },
  { name: '国风', desc: '中国风', icon: '🏮' },
  { name: '爵士', desc: '爵士乐', icon: '🎷' },
  { name: '说唱', desc: 'Rap说唱', icon: '🧢' },
  { name: '摇滚', desc: '摇滚乐', icon: '🎸' },
  { name: '治愈', desc: '温暖疗愈', icon: '✨' },
];

const MOODS: { name: Mood; desc: string; icon: string }[] = [
  { name: '开心', desc: '快乐', icon: '😊' },
  { name: '难过', desc: '悲伤', icon: '😢' },
  { name: '暧昧', desc: '心动', icon: '🥰' },
  { name: '失落', desc: '低谷', icon: '😔' },
  { name: '平静', desc: '安宁', icon: '😌' },
  { name: '浪漫', desc: '约会', icon: '💕' },
  { name: '孤独', desc: '一个人', icon: '🌙' },
  { name: '治愈', desc: '温暖', icon: '✨' },
  { name: '放松', desc: '舒缓', icon: '🌿' },
  { name: '怀旧', desc: '回忆', icon: '📷' },
  { name: '自由', desc: '无拘', icon: '🕊️' },
  { name: '想念', desc: '思念', icon: '💭' },
];

const MBTI_LIST: MBTI[] = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'];
const CONSTELLATIONS: Constellation[] = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];

export default function Home() {
  const [step, setStep] = useState<'input' | 'result'>('input');
  
  // Input states
  const [mbti, setMbti] = useState<MBTI | ''>('');
  const [constellation, setConstellation] = useState<Constellation | ''>('');
  const [mood, setMood] = useState<Mood | ''>('');
  const [keyword, setKeyword] = useState('');
  const [customText, setCustomText] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<MusicStyle>('R&B');
  const [nickname, setNickname] = useState('');
  const [showShare, setShowShare] = useState(false);
  const [hasShared, setHasShared] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  
  // Handle share link from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const shareData = params.get('share');
      if (shareData) {
        try {
          const song = JSON.parse(decodeURIComponent(shareData));
          const shares = JSON.parse(localStorage.getItem('musicShares') || '[]');
          const exists = shares.some((s: any) => s.title === song.title && s.lyrics === song.lyrics);
          if (!exists) {
            shares.unshift(song);
            localStorage.setItem('musicShares', JSON.stringify(shares));
            alert('收到一首分享的歌曲！');
          }
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);
        } catch (e) {
          console.error('Invalid share link', e);
        }
      }
    }
  }, []);
  
  // Output
  const [lyrics, setLyrics] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatingStage, setGeneratingStage] = useState<'lyrics' | 'music' | 'done' | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState('');

  const generate = async () => {
    setGenerating(true);
    setGeneratingStage('lyrics');
    setError('');
    
    // Set timeout - 3 minutes max
    let timeout: NodeJS.Timeout;
    
    const runWithTimeout = () => {
      timeout = setTimeout(() => {
        if (generating) {
          setError('生成时间较长，请检查网络后重试');
          setGenerating(false);
        }
      }, 180000);
    };
    
    runWithTimeout();
    
    try {
      // Stage 1: Generate lyrics
      setGeneratingStage('lyrics');
      const res = await fetch('/api/lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: keyword || customText,
          style: selectedStyle,
          mood,
          constellation,
          mbti
        })
      });
      
      if (!res.ok) {
        throw new Error('歌词生成失败，请重试');
      }
      
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.lyrics) {
        setLyrics(data.lyrics);
        
        // Generate a title based on mood/style
        const titles = {
          'R&B': ['夜的风', 'Groove', '暧昧', '心跳', '微醺', '频率'],
          '流行': ['时光', '记忆', '遇见', '守护', '彩虹', '经过'],
          '抒情': ['如果有如果', '后来', '平凡的歌', '秋意'],
          '电子': ['未来', '霓虹', '梦境', '脉冲'],
          '民谣': ['远方', '故乡', '路上的歌', '木吉他'],
          '国风': ['烟雨', '长安', '古道', '春悸'],
          '爵士': ['午夜', '蓝调', '时光流转', '萨克斯'],
          '说唱': ['节奏', '街头', '态度', 'Flow'],
          '摇滚': ['呐喊', '光', '不妥协', '风暴'],
          '治愈': ['温暖', ' Sunshine', '拥抱', '光']
        };
        const options = titles[selectedStyle as keyof typeof titles] || titles['流行'];
        setSongTitle(options[Math.floor(Math.random() * options.length)]);
        
        // Stage 2: Generate music
        setGeneratingStage('music');
        const musicRes = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lyrics: data.lyrics,
            style: selectedStyle,
            title: mbti || mood || keyword || '随心之作'
          })
        });
        
        if (!musicRes.ok) {
          throw new Error('歌曲生成失败，请重试');
        }
        
        const musicData = await musicRes.json();
        
        if (musicData.error) {
          throw new Error(musicData.error);
        }
        
        if (musicData.audioUrl) {
          setAudioUrl(musicData.audioUrl);
          setGeneratingStage('done');
          setStep('result');
        } else {
          throw new Error('获取音频失败');
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || '生成失败，请检查网络后重试');
      setStep('input');
    } finally {
      clearTimeout(timeout);
      setGenerating(false);
    }
  };

  const reset = () => {
    setStep('input');
    setMbti('');
    setConstellation('');
    setMood('');
    setKeyword('');
    setCustomText('');
    setNickname('');
    setShowShare(false);
    setHasShared(false);
    setLyrics('');
    setSongTitle('');
    setAudioUrl('');
  };

  return (
    <main style={{ minHeight: '100vh' }} className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-2">🎵 随心音乐</h1>
          <p className="text-purple-200 text-lg">输入任意关键词，让 AI 为你创作一首歌</p>
          <a href="/community" className="inline-block mt-3 text-sm text-pink-300 hover:text-pink-200 underline">
            🎶 查看音乐社区
          </a>
        </div>

        {step === 'input' ? (
          <div className="space-y-8">
            {/* Quick Tags */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>✨</span> 快速选择
              </h3>
              
              {/* MBTI */}
              <div className="mb-4">
                <p className="text-sm text-purple-200 mb-2">你的 MBTI</p>
                <div className="flex flex-wrap gap-2">
                  {MBTI_LIST.map((m) => (
                    <button
                      key={m}
                      onClick={() => setMbti(mbti === m ? '' : m)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition ${
                        mbti === m ? 'bg-pink-500' : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 星座 */}
              <div className="mb-4">
                <p className="text-sm text-purple-200 mb-2">你的星座</p>
                <div className="flex flex-wrap gap-2">
                  {CONSTELLATIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setConstellation(constellation === c ? '' : c)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition ${
                        constellation === c ? 'bg-pink-500' : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* 心情 */}
              <div>
                <p className="text-sm text-purple-200 mb-2">今天的心情</p>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map((m) => (
                    <button
                      key={m.name}
                      onClick={() => setMood(mood === m.name ? '' : m.name)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition flex items-center gap-1 ${
                        mood === m.name ? 'bg-pink-500' : 'bg-white/10 hover:bg-white/20'
                      }`}
                    >
                      <span>{m.icon}</span> {m.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Custom Input */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>💭</span> 自定义创作
              </h3>
              
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="或者输入任意关键词..."
                className="w-full px-4 py-3 bg-white/10 rounded-xl placeholder-white/50 outline-none focus:ring-2 focus:ring-pink-400 mb-4"
              />
              
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="或者随便写点什么..."
                rows={3}
                className="w-full px-4 py-3 bg-white/10 rounded-xl placeholder-white/50 outline-none focus:ring-2 focus:ring-pink-400 resize-none"
              />
            </div>

            {/* Style Selection */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>🎼</span> 选择曲风
              </h3>
              <div className="grid grid-cols-4 gap-3">
                {MUSIC_STYLES.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => setSelectedStyle(s.name)}
                    className={`p-3 rounded-xl text-center transition ${
                      selectedStyle === s.name 
                        ? 'bg-pink-500' 
                        : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <div className="text-sm">{s.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Progress Bar */}
            {generating && (
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6">
                <div className="flex justify-between text-sm text-purple-200 mb-2">
                  <span>✍️ AI 写词</span>
                  <span>🎵 AI 作曲</span>
                </div>
                <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-500"
                    style={{ 
                      width: generatingStage === 'lyrics' ? '30%' : generatingStage === 'music' ? '70%' : '100%' 
                    }}
                  />
                </div>
                <p className="text-center text-sm text-purple-200 mt-3">
                  {generatingStage === 'lyrics' && 'AI 正在为你创作歌词...'}
                  {generatingStage === 'music' && 'AI 正在为你谱曲...'}
                </p>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={generate}
              disabled={generating}
              className="w-full py-5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 rounded-2xl text-xl font-bold disabled:opacity-50 transition transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/30"
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  {generatingStage === 'lyrics' && '✍️ AI 写词中... (约60秒)'}
                  {generatingStage === 'music' && '🎵 AI 作曲中... (约180秒)'}
                  {generatingStage === 'done' && '🎉 完成！'}
                </span>
              ) : (
                '🎵 开始创作'
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-2xl p-4 text-center">
                <p className="text-red-200 mb-3">{error}</p>
                <button
                  onClick={reset}
                  className="px-6 py-2 bg-red-500 hover:bg-red-600 rounded-xl transition"
                >
                  🔄 重新创作
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Result */
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6">
              <h3 className="text-lg font-semibold mb-4">
                {songTitle ? `🎤 《${songTitle}》` : '🎤 你的歌词'}
              </h3>
              <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                <ReactMarkdown
                  components={{
                    p: ({node, ...props}) => <p className="text-purple-100 leading-relaxed mb-2" {...props} />,
                    h1: ({node, ...props}) => <h1 className="text-xl font-bold text-pink-300 mt-6 mb-3" {...props} />,
                    h2: ({node, ...props}) => <h2 className="text-lg font-bold text-pink-300 mt-5 mb-2" {...props} />,
                    h3: ({node, ...props}) => <h3 className="text-md font-bold text-pink-200 mt-4 mb-2" {...props} />,
                    br: ({node, ...props}) => <br {...props} />,
                  }}
                >
                  {lyrics}
                </ReactMarkdown>
              </div>
            </div>

            {audioUrl && (
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 text-center">
                <h3 className="text-lg font-semibold mb-4">
                  {songTitle ? `🎉 《${songTitle}》` : '🎉 歌曲生成完成！'}
                </h3>
                <audio controls className="w-full mb-4">
                  <source src={audioUrl} type="audio/mpeg" />
                </audio>
                
                {/* Initial buttons */}
                {!showShare ? (
                  <div className="flex flex-col sm:flex-row justify-center gap-3">
                    <button
                      onClick={() => setShowShare(true)}
                      className="inline-block px-6 py-2 bg-purple-500 hover:bg-purple-600 rounded-xl transition"
                    >
                      📤 分享到社区
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const response = await fetch(audioUrl);
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = songTitle ? `《${songTitle}》.mp3` : 'AI歌曲.mp3';
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                        } catch (e) {
                          console.error('下载失败', e);
                          window.open(audioUrl, '_blank');
                        }
                      }}
                      className="inline-block px-6 py-2 bg-pink-500 hover:bg-pink-600 rounded-xl transition"
                    >
                      ⬇️ 下载歌曲
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const html2canvas = (await import('html2canvas')).default;
                          
                          // Create a container for lyrics
                          const container = document.createElement('div');
                          container.style.cssText = `
                            background: linear-gradient(135deg, #1e1b4b, #4c1d95, #be185d);
                            padding: 40px;
                            width: 600px;
                            font-family: system-ui, -apple-system, sans-serif;
                            color: white;
                          `;
                          
                          container.innerHTML = `
                            <h2 style="text-align: center; margin-bottom: 20px; font-size: 28px;">《${songTitle || '随心音乐'}》</h2>
                            <div style="white-space: pre-wrap; line-height: 2; font-size: 16px; color: #e9d5ff;">${lyrics.replace(/【.*?】/g, '<br><br><strong style="color: #f9a8d4;">$&</strong><br>')}</div>
                            <div style="text-align: center; margin-top: 30px; font-size: 12px; color: rgba(255,255,255,0.3);">Powered by Katherine AI-Music-Studio ✨</div>
                          `;
                          
                          document.body.appendChild(container);
                          const canvas = await html2canvas(container);
                          document.body.removeChild(container);
                          
                          const link = document.createElement('a');
                          link.download = songTitle ? `《${songTitle}》歌词.png` : '歌词.png';
                          link.href = canvas.toDataURL('image/png');
                          link.click();
                        } catch (e) {
                          console.error('保存歌词图片失败', e);
                          alert('保存失败，请重试');
                        }
                      }}
                      className="inline-block px-6 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl transition"
                    >
                      🖼️ 保存歌词
                    </button>
                  </div>
                ) : (
                  /* Share input mode */
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="输入你的昵称（分享时显示）"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 rounded-xl placeholder-white/50 outline-none focus:ring-2 focus:ring-pink-400 text-center"
                    />
                    <div className="flex flex-col sm:flex-row justify-center gap-3">
                      <button
                        onClick={() => {
                          setShowShare(false);
                          setNickname('');
                        }}
                        className="inline-block px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition"
                      >
                        取消
                      </button>
                      <button
                        onClick={async () => {
                          const shareData = {
                            title: songTitle,
                            lyrics: lyrics,
                            audioUrl: audioUrl,
                            style: selectedStyle,
                            nickname: nickname || '匿名用户',
                            createdAt: new Date().toISOString()
                          };
                          const shares = JSON.parse(localStorage.getItem('musicShares') || '[]');
                          shares.unshift(shareData);
                          localStorage.setItem('musicShares', JSON.stringify(shares));
                          
                          // Generate share link
                          const shareLink = `${window.location.origin}/?share=${encodeURIComponent(JSON.stringify(shareData))}`;
                          await navigator.clipboard.writeText(shareLink);
                          
                          setShowShare(false);
                          setNickname('');
                          setHasShared(true);
                          alert('已分享到社区！链接已复制到剪贴板，快分享给朋友吧！');
                        }}
                        className="inline-block px-6 py-2 bg-purple-500 hover:bg-purple-600 rounded-xl transition"
                      >
                        ✓ 确认分享
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={reset}
              className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl transition"
            >
              🔄 再创作一首
            </button>
          </div>
        )}
      </div>

      {/* Powered by */}
      <div className="text-center mt-8 text-white/20 text-xs">
        Powered by Katherine AI-Music-Studio ✨
      </div>
      
      {/* Donation link */}
      <div className="text-center mt-4">
        <button 
          onClick={() => setShowDonate(true)}
          className="text-white/30 text-xs hover:text-pink-300 underline"
        >
          ☕ 请喝咖啡
        </button>
      </div>
      
      {/* Donation Modal */}
      {showDonate && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setShowDonate(false)}
        >
          <div 
            className="bg-white rounded-2xl p-4 max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center text-gray-700 font-bold mb-3">
              选择支付方式
            </p>
            <div className="flex gap-2">
                <img 
                  src="/wechat-pay.jpg" 
                  alt="微信收款码" 
                  className="w-1/2 rounded-lg"
                />
                <img 
                  src="/alipay.jpg" 
                  alt="支付宝收款码" 
                  className="w-1/2 rounded-lg"
                />
              </div>
            <p className="text-center text-gray-600 text-sm mt-3">
              感谢支持！☕
            </p>
            <button
              onClick={() => setShowDonate(false)}
              className="w-full mt-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl text-gray-700"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
