const { createCanvas } = require('canvas');
const fs = require('fs');

const canvas = createCanvas(1600, 676);
const ctx = canvas.getContext('2d');

// Gradient background
const gradient = ctx.createLinearGradient(0, 0, 1600, 676);
gradient.addColorStop(0, '#1a103c');
gradient.addColorStop(0.4, '#2d1b4e');
gradient.addColorStop(0.7, '#4c1d95');
gradient.addColorStop(1, '#be185d');
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, 1600, 676);

// Floating music notes - decorative circles
ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
for (let i = 0; i < 30; i++) {
  const x = Math.random() * 1600;
  const y = Math.random() * 676;
  const r = 20 + Math.random() * 60;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// Main title
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 100px "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
ctx.textAlign = 'center';
ctx.shadowColor = '#be185d';
ctx.shadowBlur = 40;
ctx.fillText('🎵 AI Music Studio', 800, 260);

// Subtitle
ctx.font = '48px "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
ctx.shadowBlur = 20;
ctx.fillStyle = '#fbcfe8';
ctx.fillText('随心音乐 · AI 创作你的歌', 800, 340);

// Divider line
ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(400, 390);
ctx.lineTo(1200, 390);
ctx.stroke();

// Features
ctx.font = '28px "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
ctx.fillStyle = '#e9d5ff';
ctx.shadowBlur = 10;
const features = ['🎤 AI 写词', '   🎼 AI 作曲', '   🎶 10+种曲风', '   🖼️ 歌词图片'];
for (let i = 0; i < features.length; i++) {
  ctx.fillText(features[i], 350 + i * 280, 470);
}

// URL
ctx.font = '32px Arial';
ctx.fillStyle = '#f9a8d4';
ctx.fillText('https://ai-music-studio.up.railway.app', 800, 570);

// Save
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('public/cover.png', buffer);
console.log('Cover image saved to public/cover.png');
