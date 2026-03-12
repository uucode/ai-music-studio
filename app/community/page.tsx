'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

type MusicShare = {
  title: string;
  lyrics: string;
  audioUrl: string;
  style: string;
  nickname: string;
  createdAt: string;
};

export default function Community() {
  const [shares, setShares] = useState<MusicShare[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showDonate, setShowDonate] = useState(false);

  // Handle share link from URL
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const shareData = params.get('share');
      if (shareData) {
        try {
          const song = JSON.parse(decodeURIComponent(shareData));
          const currentShares = JSON.parse(localStorage.getItem('musicShares') || '[]');
          const exists = currentShares.some((s: any) => s.title === song.title && s.lyrics === song.lyrics);
          if (!exists) {
            currentShares.unshift(song);
            localStorage.setItem('musicShares', JSON.stringify(currentShares));
            setShares(currentShares);
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

  useEffect(() => {
    const loaded = JSON.parse(localStorage.getItem('musicShares') || '[]');
    setShares(loaded);
  }, []);

  return (
    <main style={{ minHeight: '100vh' }} className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
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
            {shares.map((share, index) => (
              <div key={index}>
                {/* List Item - Clickable */}
                <div 
                  onClick={() => setExpandedId(expandedId === index ? null : index)}
                  className={`bg-white/10 backdrop-blur-lg rounded-2xl p-4 cursor-pointer transition ${
                    expandedId === index ? 'ring-2 ring-pink-400' : 'hover:bg-white/15'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl">
                        {expandedId === index ? '📕' : '📗'}
                      </div>
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

                  {/* Audio Player - Always visible if audio exists */}
                  {share.audioUrl && (
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <audio controls className="w-full">
                        <source src={share.audioUrl} type="audio/mpeg" />
                      </audio>
                    </div>
                  )}

                  {/* Hint */}
                  <div className="mt-2 ml-4 flex items-center justify-between">
                    <span className="text-white/30 text-xs">
                      {expandedId === index ? '▲ 点击收起' : '▼ 点击查看歌词'}
                    </span>
                    <button
                      onClick={() => {
                        const shareLink = `${window.location.origin}/?share=${encodeURIComponent(JSON.stringify(share))}`;
                        navigator.clipboard.writeText(shareLink);
                        alert('分享链接已复制！');
                      }}
                      className="text-white/30 text-xs hover:text-pink-300"
                    >
                      📤 分享
                    </button>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedId === index && (
                  <div className="mt-2 bg-black/20 rounded-2xl p-4">
                    <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                      <ReactMarkdown
                        components={{
                          p: ({node, ...props}) => <p className="text-purple-100 leading-relaxed mb-3" {...props} />,
                          h1: ({node, ...props}) => <h1 className="text-lg font-bold text-pink-300 mt-4 mb-2" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-md font-bold text-pink-300 mt-3 mb-2" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-sm font-bold text-pink-200 mt-3 mb-1" {...props} />,
                        }}
                      >
                        {share.lyrics}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {shares.length > 0 && (
          <div className="text-center mt-6 text-purple-200 text-sm">
            共 {shares.length} 首歌曲
          </div>
        )}

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
              <p className="text-center text-gray-500 text-xs mt-2">
                长按二维码图片即可保存
              </p>
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
      </div>
    </main>
  );
}
