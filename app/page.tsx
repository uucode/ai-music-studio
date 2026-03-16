'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from './components/Toast';
import { DonateModal } from './components/DonateModal';
import { LyricsRenderer } from './components/LyricsRenderer';
import { isVideoSupported, generateLyricsVideo } from './lib/video-generator';
import { getCreditsInfo, useOneCredit, addCredits, getDeviceId } from './lib/credits';
import type { MusicStyle, Mood, MBTI, Constellation } from './lib/types';

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
  { name: '蓝调', desc: 'Blues', icon: '🥃' },
  { name: '乡村', desc: 'Country', icon: '🏡' },
  { name: '灵魂', desc: 'Soul', icon: '🔥' },
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
  { name: '自由', desc: '无拘', icon: '🌊' },
  { name: '想念', desc: '思念', icon: '💭' },
];

const MBTI_LIST: MBTI[] = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'];
const CONSTELLATIONS: Constellation[] = ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'];


function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default function Home() {
  const { toast } = useToast();
  const [step, setStep] = useState<'input' | 'result'>('input');
  const generatingRef = useRef(false);

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
  const [showRecharge, setShowRecharge] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [payState, setPayState] = useState<{
    loading: boolean;
    orderId?: string;
    qrUrl?: string;
    payUrl?: string;
    polling?: boolean;
  }>({ loading: false });

  const [lyrics, setLyrics] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatingStage, setGeneratingStage] = useState<'lyrics' | 'music' | 'done' | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [error, setError] = useState('');
  const [videoProgress, setVideoProgress] = useState<number | null>(null);

  useEffect(() => {
    setCreditsRemaining(getCreditsInfo().remaining);
  }, []);

  const refreshCredits = () => setCreditsRemaining(getCreditsInfo().remaining);

  const pollingRef = useRef(false);

  const pollOrderStatus = async (orderId: string) => {
    if (pollingRef.current) return;
    pollingRef.current = true;
    setPayState(s => ({ ...s, polling: true }));

    let attempts = 0;
    while (attempts < 120) {
      await new Promise(r => setTimeout(r, 3000));
      try {
        const res = await fetch(`/api/pay/status?orderId=${orderId}`);
        const data = await res.json();
        if (data.status === 'paid') {
          addCredits(data.credits);
          refreshCredits();
          toast(`充值成功！获得 ${data.credits} 次创作机会 🎉`);
          setPayState({ loading: false });
          setShowRecharge(false);
          pollingRef.current = false;
          return;
        }
      } catch { /* retry */ }
      attempts++;
    }

    toast('支付超时，如已付款请联系客服', 'error');
    setPayState({ loading: false });
    pollingRef.current = false;
  };

  const handleBuyPackage = async (packageIndex: number) => {
    setPayState({ loading: true });
    try {
      const res = await fetch('/api/pay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageIndex, deviceId: getDeviceId() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || '创建订单失败', 'error');
        setPayState({ loading: false });
        return;
      }
      setPayState({
        loading: false,
        orderId: data.orderId,
        qrUrl: data.qrUrl,
        payUrl: data.payUrl,
      });
      pollOrderStatus(data.orderId);
    } catch {
      toast('网络错误', 'error');
      setPayState({ loading: false });
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paidOrder = params.get('paid');
    if (paidOrder) {
      window.history.replaceState({}, '', '/');
      pollOrderStatus(paidOrder);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const generate = async () => {
    // TODO: 虎皮椒配好后恢复积分检查
    // if (!useOneCredit()) { setShowRecharge(true); return; }
    // refreshCredits();
    setGenerating(true);
    generatingRef.current = true;
    setGeneratingStage('lyrics');
    setError('');

    const abortController = new AbortController();
    const timeoutId = setTimeout(() => {
      abortController.abort();
    }, 300_000);

    try {
      setGeneratingStage('lyrics');
      const res = await fetch('/api/lyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: [keyword, customText].filter(Boolean).join('，'),
          style: selectedStyle,
          mood,
          constellation,
          mbti,
        }),
        signal: abortController.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || '歌词生成失败，请重试');
      }

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.lyrics) {
        const titleMatch = data.lyrics.match(/^[^\n]*《([^》]+)》[^\n]*/);
        let generatedTitle = '';
        let generatedLyrics = data.lyrics;
        if (titleMatch) {
          generatedTitle = titleMatch[1];
          generatedLyrics = data.lyrics.replace(titleMatch[0], '').replace(/^\s*\n/, '');
        } else {
          generatedTitle = `随心${selectedStyle}`;
        }
        setLyrics(generatedLyrics);
        setSongTitle(generatedTitle);

        setGeneratingStage('music');
        const musicRes = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lyrics: data.lyrics,
            style: selectedStyle,
            title: mbti || mood || keyword || '随心之作',
          }),
          signal: abortController.signal,
        });

        if (!musicRes.ok) {
          const errData = await musicRes.json().catch(() => ({}));
          throw new Error(errData.error || '歌曲生成失败，请重试');
        }

        const musicData = await musicRes.json();
        if (musicData.error) throw new Error(musicData.error);

        if (musicData.audioUrl) {
          setAudioUrl(musicData.audioUrl);
          setGeneratingStage('done');
          setStep('result');

          const finalTitle = generatedTitle || `${selectedStyle}之歌`;
          const mySongs = JSON.parse(localStorage.getItem('mySongs') || '[]');
          mySongs.unshift({
            title: finalTitle,
            lyrics: generatedLyrics,
            audioUrl: musicData.audioUrl,
            style: selectedStyle,
            createdAt: new Date().toISOString(),
          });
          localStorage.setItem('mySongs', JSON.stringify(mySongs));
        } else {
          throw new Error('获取音频失败');
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('⏱️ 生成时间过长（超过5分钟），请重试或简化输入');
      } else {
        setError(err.message || '生成失败，请检查网络后重试');
      }
      setStep('input');
    } finally {
      clearTimeout(timeoutId);
      setGenerating(false);
      generatingRef.current = false;
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

  const downloadLyricsVideo = async () => {
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || !isVideoSupported()) {
      toast('歌词视频功能请在电脑端 Chrome 浏览器中使用', 'info');
      return;
    }
    try {
      setVideoProgress(0);
      const blob = await generateLyricsVideo({
        lyrics,
        audioUrl,
        title: songTitle || '未命名',
        style: selectedStyle,
        onProgress: (p) => setVideoProgress(p),
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = songTitle ? `《${songTitle}》歌词视频.mp4` : '歌词视频.mp4';
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast('歌词视频已生成！');
    } catch (e: any) {
      toast(e.message || '视频生成失败', 'error');
    } finally {
      setVideoProgress(null);
    }
  };

  const downloadSong = async () => {
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
    } catch {
      window.open(audioUrl, '_blank');
    }
  };

  const saveLyricsImage = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default;

      const container = document.createElement('div');
      container.style.cssText = `
        background: linear-gradient(135deg, #1e1b4b, #4c1d95, #be185d);
        padding: 40px;
        width: 600px;
        font-family: system-ui, -apple-system, sans-serif;
        color: white;
      `;

      const title = document.createElement('h2');
      title.style.cssText = 'text-align:center;margin-bottom:20px;font-size:28px;';
      title.textContent = `《${songTitle || '随心音乐'}》`;
      container.appendChild(title);

      const body = document.createElement('div');
      body.style.cssText = 'white-space:pre-wrap;line-height:2;font-size:16px;color:#e9d5ff;';
      lyrics.split('\n').forEach(line => {
        const tagMatch = line.match(/【.*?】/);
        if (tagMatch) {
          const br = document.createElement('br');
          body.appendChild(br);
          const strong = document.createElement('strong');
          strong.style.color = '#f9a8d4';
          strong.textContent = tagMatch[0];
          body.appendChild(strong);
          const rest = line.replace(tagMatch[0], '');
          if (rest) body.appendChild(document.createTextNode(rest));
          body.appendChild(document.createElement('br'));
        } else {
          body.appendChild(document.createTextNode(line + '\n'));
        }
      });
      container.appendChild(body);

      const footer = document.createElement('div');
      footer.style.cssText = 'text-align:center;margin-top:30px;font-size:12px;color:rgba(255,255,255,0.3);';
      footer.textContent = 'Powered by Katherine AI-Music-Studio ✨';
      container.appendChild(footer);

      document.body.appendChild(container);
      const canvas = await html2canvas(container);
      document.body.removeChild(container);

      const link = document.createElement('a');
      link.download = songTitle ? `《${songTitle}》歌词.png` : '歌词.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch {
      toast('保存失败，请重试', 'error');
    }
  };

  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: songTitle,
          lyrics,
          audioUrl,
          style: selectedStyle,
          nickname: nickname || '匿名用户',
        }),
      });

      if (res.ok) {
        toast('已分享到社区！🎉');
        setShowShare(false);
        setNickname('');
        setHasShared(true);
        return;
      }

      if (res.status === 409) {
        toast('这首歌已经在社区里了 🎵');
        setShowShare(false);
        setHasShared(true);
        return;
      }

      const data = await res.json().catch(() => ({}));
      toast(data.error || '分享失败，请重试', 'error');
    } catch (err: any) {
      toast(err.message || '分享失败，请重试', 'error');
    } finally {
      setSharing(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh' }} className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-2">🎵 随心音乐</h1>
          <p className="text-purple-200 text-lg">输入任意关键词，让 AI 为你创作一首歌</p>
          <div className="flex justify-center gap-4 mt-3">
            <a href="/community" className="text-sm text-pink-300 hover:text-pink-200 underline">
              🎶 查看音乐社区
            </a>
            <a href="/my-songs" className="text-sm text-pink-300 hover:text-pink-200 underline">
              🎤 我的创作
            </a>
          </div>
        </div>

        {step === 'input' ? (
          <div className="space-y-8">
            {/* Quick Tags */}
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>✨</span> 快速选择
              </h3>

              <div className="mb-4">
                <p className="text-sm text-purple-200 mb-2">你的 MBTI</p>
                <div className="flex flex-wrap gap-2">
                  {MBTI_LIST.map(m => (
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

              <div className="mb-4">
                <p className="text-sm text-purple-200 mb-2">你的星座</p>
                <div className="flex flex-wrap gap-2">
                  {CONSTELLATIONS.map(c => (
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

              <div>
                <p className="text-sm text-purple-200 mb-2">今天的心情</p>
                <div className="flex flex-wrap gap-2">
                  {MOODS.map(m => (
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
                onChange={e => setKeyword(e.target.value)}
                placeholder="或者输入任意关键词..."
                className="w-full px-4 py-3 bg-white/10 rounded-xl placeholder-white/50 outline-none focus:ring-2 focus:ring-pink-400 mb-4"
              />
              <textarea
                value={customText}
                onChange={e => setCustomText(e.target.value)}
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
                {MUSIC_STYLES.map(s => (
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
                      width: generatingStage === 'lyrics' ? '30%' : generatingStage === 'music' ? '70%' : '100%',
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
            {/* TODO: 虎皮椒配好后恢复充值入口
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-sm text-white/50">
                剩余创作次数：<span className={`font-bold ${creditsRemaining > 0 ? 'text-green-400' : 'text-red-400'}`}>{creditsRemaining}</span>
              </span>
              <button
                onClick={() => setShowRecharge(true)}
                className="text-sm text-pink-300 hover:text-pink-200 underline"
              >
                充值
              </button>
            </div>
            */}
            <button
              onClick={generate}
              disabled={generating}
              className="w-full py-5 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 rounded-2xl text-xl font-bold disabled:opacity-50 transition transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-purple-500/30"
            >
              {generating ? (
                <span className="flex flex-col items-center justify-center gap-1">
                  {generatingStage === 'lyrics' && '✍️ AI 写词中...'}
                  {generatingStage === 'music' && '🎵 AI 作曲中...'}
                  {generatingStage === 'done' && '🎉 完成！'}
                  {generatingStage !== 'done' && (
                    <span className="text-xs font-normal opacity-70">请保持页面开启，创作完成后自动保存</span>
                  )}
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
              <LyricsRenderer lyrics={lyrics} />
            </div>

            {audioUrl && (
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 text-center">
                <h3 className="text-lg font-semibold mb-4">
                  {songTitle ? `🎉 《${songTitle}》` : '🎉 歌曲生成完成！'}
                </h3>
                <audio controls className="w-full mb-4">
                  <source src={audioUrl} type="audio/mpeg" />
                </audio>

                {!showShare ? (
                  <>
                    <div className="flex flex-wrap justify-center gap-3">
                      <button
                        onClick={() => setShowShare(true)}
                        className="px-6 py-2 bg-purple-500 hover:bg-purple-600 rounded-xl transition"
                      >
                        📤 分享到社区
                      </button>
                      <button
                        onClick={downloadSong}
                        className="px-6 py-2 bg-pink-500 hover:bg-pink-600 rounded-xl transition"
                      >
                        ⬇️ 下载歌曲
                      </button>
                      <button
                        onClick={saveLyricsImage}
                        className="px-6 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-xl transition"
                      >
                        🖼️ 保存歌词
                      </button>
                      <button
                        onClick={downloadLyricsVideo}
                        disabled={videoProgress !== null}
                        className="px-6 py-2 bg-teal-500 hover:bg-teal-600 rounded-xl transition disabled:opacity-50"
                      >
                        🎬 歌词视频
                      </button>
                    </div>
                    {videoProgress !== null && (
                      <div className="mt-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-400 rounded-full transition-all duration-300"
                              style={{ width: `${Math.round(videoProgress * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-white/60 w-12 text-right">
                            {Math.round(videoProgress * 100)}%
                          </span>
                        </div>
                        <p className="text-xs text-white/40 mt-1 text-center">
                          正在生成歌词视频，请保持页面开启...
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="输入你的昵称（分享时显示）"
                      value={nickname}
                      onChange={e => setNickname(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 rounded-xl placeholder-white/50 outline-none focus:ring-2 focus:ring-pink-400 text-center"
                    />
                    <div className="flex flex-col sm:flex-row justify-center gap-3">
                      <button
                        onClick={() => { setShowShare(false); setNickname(''); }}
                        className="inline-block px-6 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleShare}
                        disabled={sharing}
                        className="inline-block px-6 py-2 bg-purple-500 hover:bg-purple-600 rounded-xl transition disabled:opacity-50"
                      >
                        {sharing ? '分享中...' : '✓ 确认分享'}
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

      {/* Footer */}
      <div className="text-center mt-8 text-white/20 text-xs">
        Powered by Katherine AI-Music-Studio ✨
      </div>
      <div className="text-center mt-4 pb-6">
        <button
          onClick={() => setShowDonate(true)}
          className="text-white/30 text-xs hover:text-pink-300 underline"
        >
          ☕ 请喝咖啡
        </button>
      </div>

      {showDonate && <DonateModal onClose={() => setShowDonate(false)} />}

      {showRecharge && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { if (!payState.qrUrl) setShowRecharge(false); }}>
          <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold text-center mb-4">🎵 充值创作次数</h3>

            <div className="bg-white/10 rounded-2xl p-4 mb-4 text-center">
              <p className="text-sm text-white/60 mb-1">当前剩余</p>
              <p className="text-3xl font-bold text-pink-400">{creditsRemaining} <span className="text-base font-normal text-white/50">次</span></p>
            </div>

            {!payState.qrUrl ? (
              <div className="space-y-2 mb-4">
                <p className="text-sm text-white/70 text-center mb-3">选择套餐，微信扫码即时到账</p>
                {[
                  { credits: 10, price: '19.9', label: '入门' },
                  { credits: 20, price: '36.9', label: '超值' },
                ].map((pkg, idx) => (
                  <button
                    key={pkg.credits}
                    onClick={() => handleBuyPackage(idx)}
                    disabled={payState.loading}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition disabled:opacity-50"
                  >
                    <div className="text-left">
                      <span className="font-bold">{pkg.credits} 次创作</span>
                      <span className="text-xs text-white/40 ml-2">{pkg.label}</span>
                    </div>
                    <span className="text-pink-400 font-bold">¥{pkg.price}</span>
                  </button>
                ))}
                {payState.loading && (
                  <p className="text-center text-sm text-white/50 animate-pulse mt-2">正在创建订单...</p>
                )}
              </div>
            ) : (
              <div className="text-center mb-4">
                <p className="text-sm text-white/70 mb-3">微信扫码支付</p>
                <div className="flex justify-center mb-3">
                  <img src={payState.qrUrl} alt="支付二维码" className="w-52 h-52 rounded-xl bg-white p-1" />
                </div>
                {payState.polling && (
                  <p className="text-sm text-pink-300 animate-pulse">等待支付确认中...</p>
                )}
                <p className="text-xs text-white/40 mt-2">支付完成后自动到账，无需其他操作</p>
              </div>
            )}

            <button
              onClick={() => {
                pollingRef.current = false;
                setPayState({ loading: false });
                setShowRecharge(false);
              }}
              className="w-full mt-2 py-2 text-sm text-white/40 hover:text-white/60"
            >
              {payState.qrUrl ? '取消支付' : '关闭'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
