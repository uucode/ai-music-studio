'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

type MusicSong = {
  title: string;
  lyrics: string;
  audioUrl: string;
  style: string;
  createdAt: string;
};

export default function MySongs() {
  const [songs, setSongs] = useState<MusicSong[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showDonate, setShowDonate] = useState(false);

  const shareToCommunity = (song: MusicSong) => {
    // Save to community shares
    const shares = JSON.parse(localStorage.getItem('musicShares') || '[]');
    const shareData = {
      title: song.title,
      lyrics: song.lyrics,
      audioUrl: song.audioUrl,
      style: song.style,
      createdAt: song.createdAt
    };
    shares.unshift(shareData);
    localStorage.setItem('musicShares', JSON.stringify(shares));
    alert('已分享到社区！');
  };

  const copyLyrics = (lyrics: string) => {
    navigator.clipboard.writeText(lyrics);
    alert('歌词已复制到剪贴板！');
  };

  useEffect(() => {
    const loaded = JSON.parse(localStorage.getItem('mySongs') || '[]');
    setSongs(loaded);
  }, []);

  const deleteSong = (index: number) => {
    if (confirm('确定删除这首歌曲吗？')) {
      const newSongs = [...songs];
      newSongs.splice(index, 1);
      localStorage.setItem('mySongs', JSON.stringify(newSongs));
      setSongs(newSongs);
    }
  };

  return (
    <main style={{ minHeight: '100vh' }} className="bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
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
          <div className="space-y-3">
            {songs.map((song, index) => (
              <div key={index}>
                {/* List Item */}
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
                        <h3 className="font-bold text-lg">《{song.title}》</h3>
                        <div className="flex items-center gap-2 text-sm text-purple-200">
                          <span className="px-2 py-0.5 bg-pink-500/30 rounded">{song.style}</span>
                          <span>•</span>
                          <span>{new Date(song.createdAt).toLocaleDateString('zh-CN')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          shareToCommunity(song);
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition text-white/40 hover:text-pink-400"
                        title="分享到社区"
                      >
                        📤
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSong(index);
                        }}
                        className="p-2 hover:bg-white/10 rounded-lg transition text-white/40 hover:text-red-400"
                        title="删除"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  {/* Audio Player */}
                  {song.audioUrl && (
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <audio controls className="w-full">
                        <source src={song.audioUrl} type="audio/mpeg" />
                      </audio>
                    </div>
                  )}

                  {/* Hint */}
                  <div className="mt-2 ml-4 flex items-center justify-between">
                    <span className="text-white/30 text-xs">
                      {expandedId === index ? '▲ 点击收起' : '▼ 点击查看歌词'}
                    </span>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedId === index && (
                  <div className="mt-2 bg-black/20 rounded-2xl p-4">
                    <div className="flex justify-end mb-2">
                      <button
                        onClick={() => copyLyrics(song.lyrics)}
                        className="text-xs px-3 py-1 bg-pink-500/30 hover:bg-pink-500/50 rounded-lg transition"
                      >
                        📋 复制歌词
                      </button>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                      <ReactMarkdown
                        components={{
                          p: ({node, ...props}) => <p className="text-purple-100 leading-relaxed mb-3" {...props} />,
                          h1: ({node, ...props}) => <h1 className="text-lg font-bold text-pink-300 mt-4 mb-2" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-md font-bold text-pink-300 mt-3 mb-2" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-sm font-bold text-pink-200 mt-3 mb-1" {...props} />,
                        }}
                      >
                        {song.lyrics}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {songs.length > 0 && (
          <div className="text-center mt-6 text-purple-200 text-sm">
            共 {songs.length} 首歌曲
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
