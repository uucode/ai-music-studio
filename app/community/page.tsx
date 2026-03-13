'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '../components/Toast';
import { DonateModal } from '../components/DonateModal';
import { LyricsRenderer } from '../components/LyricsRenderer';
import type { MusicShare } from '../lib/types';

export default function Community() {
  const { toast } = useToast();
  const [shares, setShares] = useState<MusicShare[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showDonate, setShowDonate] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('share');
    if (shareData) {
      try {
        const song = JSON.parse(decodeURIComponent(shareData));
        const currentShares: MusicShare[] = JSON.parse(localStorage.getItem('musicShares') || '[]');
        const exists = currentShares.some(s => s.title === song.title && s.lyrics === song.lyrics);
        if (!exists) {
          currentShares.unshift(song);
          localStorage.setItem('musicShares', JSON.stringify(currentShares));
          setShares(currentShares);
          toast('收到一首分享的歌曲！', 'info');
        }
        window.history.replaceState({}, '', window.location.pathname);
      } catch {
        // invalid share link
      }
    }
  }, [toast]);

  useEffect(() => {
    const loaded: MusicShare[] = JSON.parse(localStorage.getItem('musicShares') || '[]');
    setShares(loaded);
  }, []);

  const getKey = (share: MusicShare) => `${share.createdAt}-${share.title}`;

  const copyShareLink = async (share: MusicShare) => {
    const shareLink = `${window.location.origin}/?share=${encodeURIComponent(JSON.stringify(share))}`;
    try {
      await navigator.clipboard.writeText(shareLink);
      toast('分享链接已复制！');
    } catch {
      toast('复制失败，请手动复制', 'error');
    }
  };

  return (
    <main style={{ minHeight: '100vh' }} className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">🎶 音乐社区</h1>
          <p className="text-purple-200">AI 创作歌曲精选</p>
          <div className="flex justify-center gap-4 mt-4">
            <Link href="/" className="text-sm text-pink-300 hover:text-pink-200 underline">
              ← 返回创作
            </Link>
          </div>
        </div>

        {shares.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎵</div>
            <p className="text-purple-200 mb-4">还没有人分享歌曲</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-pink-500 hover:bg-pink-600 rounded-xl transition"
            >
              🎵 去创作第一首
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {shares.map(share => {
              const key = getKey(share);
              const isExpanded = expandedId === key;
              return (
                <div key={key}>
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : key)}
                    className={`bg-white/10 backdrop-blur-lg rounded-2xl p-4 cursor-pointer transition ${
                      isExpanded ? 'ring-2 ring-pink-400' : 'hover:bg-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">{isExpanded ? '📕' : '📗'}</div>
                        <div>
                          <h3 className="font-bold text-lg">《{share.title}》</h3>
                          <div className="flex items-center gap-2 text-sm text-purple-200">
                            <span className="px-2 py-0.5 bg-pink-500/30 rounded">{share.style}</span>
                            <span>•</span>
                            <span>{share.nickname || '匿名用户'}</span>
                            <span>•</span>
                            <span>{new Date(share.createdAt).toLocaleDateString('zh-CN')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {share.audioUrl && (
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <audio controls className="w-full" onClick={e => e.stopPropagation()}>
                          <source src={share.audioUrl} type="audio/mpeg" />
                        </audio>
                      </div>
                    )}

                    <div className="mt-2 ml-4 flex items-center justify-between">
                      <span className="text-white/30 text-xs">
                        {isExpanded ? '▲ 点击收起' : '▼ 点击查看歌词'}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); copyShareLink(share); }}
                        className="text-white/30 text-xs hover:text-pink-300"
                      >
                        📤 分享
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-2 bg-black/20 rounded-2xl p-4">
                      <LyricsRenderer lyrics={share.lyrics} compact />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {shares.length > 0 && (
          <div className="text-center mt-6 text-purple-200 text-sm">
            共 {shares.length} 首歌曲
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
