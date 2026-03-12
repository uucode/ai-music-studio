# 🎵 AI Music Studio - 随心音乐

> 用 AI 创造你的专属歌曲

一个基于 MiniMax AI Music API 的在线 AI 歌曲生成工具。

![Preview](https://img.shields.io/badge/Next.js-14-black?style=flat&logo=next.js)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ 特性

- 🎤 **AI 写词** - 根据心情、星座、MBTI 自动生成歌词
- 🎵 **AI 作曲** - 支持 10+ 种曲风（R&B、流行、抒情、电子、民谣、国风、爵士、说唱、摇滚、治愈）
- 📱 **响应式设计** - 支持手机和电脑访问
- 🎶 **音乐社区** - 分享你创作的歌曲
- 🖼️ **歌词图片** - 一键保存歌词为精美图片
- ☕ **请喝咖啡** - 支持打赏

## 🚀 在线体验

**访问地址：** https://ai-music-studio.up.railway.app/

## 🛠️ 技术栈

- **前端**: Next.js 14 + React + Tailwind CSS
- **后端**: Next.js API Routes
- **AI**: MiniMax Music API
- **部署**: Railway

## 📦 本地运行

```bash
# 克隆项目
git clone https://github.com/your-username/ai-music-studio.git
cd ai-music-studio

# 安装依赖
npm install

# 运行开发服务器
npm run dev
```

访问 http://localhost:3000

## 🔧 配置

在 `app/api/lyrics/route.ts` 和 `app/api/generate/route.ts` 中配置你的 MiniMax API Key：

```typescript
const API_KEY = process.env.MINIMAX_API_KEY || 'your-api-key';
```

## 📝 功能说明

### 快速选择
- MBTI（16种）
- 星座（12个）
- 心情（12种）

### 曲风选择
- R&B、流行、抒情、电子、民谣
- 国风、爵士、说唱、摇滚、治愈

### 社区分享
- 生成歌曲后可分享到社区
- 支持昵称展示
- 在线播放和下载

## 🤝 贡献

欢迎提交 Issue 和 PR！

## 📄 License

MIT License

---

Made with ❤️ by Katherine
