'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '../components/Toast';
import { DonateModal } from '../components/DonateModal';
import { LyricsRenderer } from '../components/LyricsRenderer';
import type { MusicSong } from '../lib/types';

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, maxWidth: number, lineHeight: number, startY: number): number {
  let y = startY;
  const chars = Array.from(text);
  let line = '';

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const test = line + ch;
    if (ctx.measureText(test).width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, y);
      line = ch;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) {
    ctx.fillText(line, x, y);
    y += lineHeight;
  }
  return y;
}

export default function MySongs() {
  const { toast } = useToast();
  const [songs, setSongs] = useState<MusicSong[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showDonate, setShowDonate] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [sharingIndex, setSharingIndex] = useState<number | null>(null);
  const [sharingBusy, setSharingBusy] = useState(false);

  useEffect(() => {
    const loaded: MusicSong[] = JSON.parse(localStorage.getItem('mySongs') || '[]');
    setSongs(loaded);
  }, []);

  const getKey = (song: MusicSong) => `${song.createdAt}-${song.title}`;

  const deleteSong = (index: number) => {
    if (confirm('确定删除这首歌曲吗？')) {
      const newSongs = [...songs];
      newSongs.splice(index, 1);
      localStorage.setItem('mySongs', JSON.stringify(newSongs));
      setSongs(newSongs);
      toast('已删除', 'info');
    }
  };

  const shareToCommunity = async (song: MusicSong, nickname: string) => {
    if (sharingBusy) return;
    setSharingBusy(true);
    try {
      const res = await fetch('/api/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: song.title,
          lyrics: song.lyrics,
          audioUrl: song.audioUrl,
          style: song.style,
          nickname: nickname || '匿名用户',
        }),
      });

      if (res.ok) {
        toast('已分享到社区！🎉');
      } else if (res.status === 409) {
        toast('这首歌已经在社区里了 🎵');
      } else {
        const data = await res.json().catch(() => ({}));
        toast(data.error || '分享失败，请重试', 'error');
      }
    } catch (err: any) {
      toast(err.message || '分享失败，请重试', 'error');
    }
    setSharingIndex(null);
    setNicknameInput('');
    setSharingBusy(false);
  };

  const copyLyrics = async (lyrics: string) => {
    try {
      await navigator.clipboard.writeText(lyrics);
      toast('歌词已复制到剪贴板！');
    } catch {
      toast('复制失败', 'error');
    }
  };

  const saveLyricsAsImage = (song: MusicSong) => {
    const cleanLyrics = song.lyrics
      .replace(/【.*?】/g, '\n$&')
      .replace(/\[.*?\]/g, '')
      .replace(/Verse|Repeat|Chorus|Bridge|Pre-Chorus|Outro/g, '');

    const width = 800;
    const lineHeight = 36;
    const padding = 60;
    const maxTextWidth = width - padding * 2;
    const titleHeight = 80;
    const lines = cleanLyrics.split('\n');

    const measureCanvas = document.createElement('canvas');
    const measureCtx = measureCanvas.getContext('2d')!;
    measureCtx.font = '24px "Hiragino Sans GB", "Microsoft YaHei", sans-serif';

    let totalLines = 0;
    for (const line of lines) {
      if (!line.trim()) { totalLines++; continue; }
      const textWidth = measureCtx.measureText(line).width;
      totalLines += Math.max(1, Math.ceil(textWidth / maxTextWidth));
    }

    const estimatedHeight = totalLines * lineHeight + titleHeight + padding * 2 + 100;
    const height = Math.max(600, estimatedHeight);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1e1b4b');
    gradient.addColorStop(0.5, '#4c1d95');
    gradient.addColorStop(1, '#be185d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`《${song.title}》`, width / 2, 80);

    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#fbcfe8';
    ctx.fillText(song.style, width / 2, 115);

    ctx.textAlign = 'left';
    let y = 170;

    for (const line of lines) {
      if (!line.trim()) { y += lineHeight * 0.5; continue; }

      if (line.includes('【') || line.includes('】')) {
        ctx.fillStyle = '#f9a8d4';
        ctx.font = 'bold 26px "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
      } else {
        ctx.fillStyle = '#e9d5ff';
        ctx.font = '24px "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
      }
      y = wrapText(ctx, line, padding, maxTextWidth, lineHeight, y);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎵 AI Music Studio', width / 2, height - 30);

    const link = document.createElement('a');
    link.download = `${song.title}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <main style={{ minHeight: '100vh' }} className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🎤 我的创作</h1>
          <p className="text-purple-200">你创作的所有歌曲</p>
          <div className="flex justify-center gap-4 mt-4">
            <Link href="/" className="text-sm text-pink-300 hover:text-pink-200 underline">
              ← 返回创作
            </Link>
            <Link href="/community" className="text-sm text-pink-300 hover:text-pink-200 underline">
              音乐社区 →
            </Link>
          </div>
        </div>

        {songs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎵</div>
            <p className="text-purple-200 mb-4">你还没有创作过歌曲</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-pink-500 hover:bg-pink-600 rounded-xl transition"
            >
              🎵 去创作第一首
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {songs.map((song, index) => {
              const key = getKey(song);
              const isExpanded = expandedId === key;
              const isSharing = sharingIndex === index;
              return (
                <div key={key} className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden">
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : key)}
                    className="p-4 cursor-pointer hover:bg-white/5 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl">{isExpanded ? '📕' : '📗'}</div>
                        <div>
                          <h3 className="font-bold text-lg">《{song.title || '未命名'}》</h3>
                          <div className="flex items-center gap-2 text-sm text-purple-200">
                            <span className="px-2 py-0.5 bg-pink-500/30 rounded">{song.style || '未知'}</span>
                            <span>•</span>
                            <span>{song.createdAt ? new Date(song.createdAt).toLocaleDateString('zh-CN') : '未知'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={e => { e.stopPropagation(); setSharingIndex(isSharing ? null : index); }}
                          className="p-2 hover:bg-white/10 rounded-lg transition text-white/50 hover:text-pink-400"
                          title="分享到社区"
                        >
                          📤
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); deleteSong(index); }}
                          className="p-2 hover:bg-white/10 rounded-lg transition text-white/50 hover:text-red-400"
                          title="删除"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    <div className="mt-2 ml-4">
                      <span className="text-white/30 text-xs">
                        {isExpanded ? '▲ 点击收起' : '▼ 点击查看歌词'}
                      </span>
                    </div>
                  </div>

                  {song.audioUrl && (
                    <div className="px-4 pb-3">
                      <audio controls className="w-full h-10">
                        <source src={song.audioUrl} type="audio/mpeg" />
                      </audio>
                    </div>
                  )}

                  {/* Share nickname input */}
                  {isSharing && (
                    <div className="px-4 pb-3 flex gap-2 items-center" onClick={e => e.stopPropagation()}>
                      <input
                        type="text"
                        value={nicknameInput}
                        onChange={e => setNicknameInput(e.target.value)}
                        placeholder="输入昵称..."
                        className="flex-1 px-3 py-1.5 bg-white/10 rounded-lg text-sm placeholder-white/50 outline-none focus:ring-2 focus:ring-pink-400"
                      />
                      <button
                        onClick={() => shareToCommunity(song, nicknameInput)}
                        disabled={sharingBusy}
                        className="px-3 py-1.5 bg-purple-500 hover:bg-purple-600 rounded-lg text-sm transition disabled:opacity-50"
                      >
                        {sharingBusy ? '分享中...' : '确认分享'}
                      </button>
                      <button
                        onClick={() => { setSharingIndex(null); setNicknameInput(''); }}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition"
                      >
                        取消
                      </button>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="mt-2 bg-black/20 rounded-2xl p-4">
                      {song.lyrics && song.lyrics.length > 0 ? (
                        <>
                          <div className="flex justify-end gap-2 mb-3">
                            <button
                              onClick={() => saveLyricsAsImage(song)}
                              className="text-xs px-3 py-1.5 bg-purple-500/40 hover:bg-purple-500/60 rounded-lg transition"
                            >
                              🖼️ 保存图片
                            </button>
                            <button
                              onClick={() => copyLyrics(song.lyrics)}
                              className="text-xs px-3 py-1.5 bg-pink-500/40 hover:bg-pink-500/60 rounded-lg transition"
                            >
                              📋 复制歌词
                            </button>
                          </div>
                          <LyricsRenderer lyrics={song.lyrics} compact />
                        </>
                      ) : (
                        <div className="text-center py-6 text-white/40">
                          <p>暂无歌词</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {songs.length > 0 && (
          <div className="text-center mt-6 text-purple-200 text-sm">
            共 {songs.length} 首歌曲
          </div>
        )}

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
      </div>
    </main>
  );
}
