import { Muxer, ArrayBufferTarget } from 'mp4-muxer';

const WIDTH = 1080;
const HEIGHT = 1920;
const FPS = 30;

interface VideoOptions {
  lyrics: string;
  audioUrl: string;
  title: string;
  style: string;
  onProgress?: (progress: number) => void;
}

export function isVideoSupported(): boolean {
  return (
    typeof VideoEncoder !== 'undefined' &&
    typeof AudioEncoder !== 'undefined'
  );
}

export async function generateLyricsVideo(opts: VideoOptions): Promise<Blob> {
  const { lyrics, audioUrl, title, style, onProgress } = opts;

  if (!isVideoSupported()) {
    throw new Error('浏览器不支持视频编码，请使用最新版 Chrome');
  }

  onProgress?.(0);

  const audioRes = await fetch(audioUrl);
  if (!audioRes.ok) throw new Error('音频加载失败');
  const audioArrayBuffer = await audioRes.arrayBuffer();

  const offlineCtx = new OfflineAudioContext(2, 1, 48000);
  const decoded = await offlineCtx.decodeAudioData(audioArrayBuffer);
  const duration = decoded.duration;
  const sampleRate = decoded.sampleRate;
  const numberOfChannels = decoded.numberOfChannels;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;
  const lines = lyrics.split('\n');

  const audioCodec = await pickAudioCodec(numberOfChannels, sampleRate);
  const muxerAudioCodec = audioCodec.startsWith('mp4a') ? 'aac' as const : 'opus' as const;

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width: WIDTH, height: HEIGHT },
    audio: { codec: muxerAudioCodec, numberOfChannels, sampleRate },
    fastStart: 'in-memory',
  });

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => { throw e; },
  });

  videoEncoder.configure({
    codec: 'avc1.640028',
    width: WIDTH,
    height: HEIGHT,
    bitrate: 4_000_000,
    framerate: FPS,
  });

  const audioEncoder = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error: (e) => { throw e; },
  });

  audioEncoder.configure({
    codec: audioCodec,
    numberOfChannels,
    sampleRate,
    bitrate: 128_000,
  });

  const totalFrames = Math.ceil(duration * FPS);

  for (let i = 0; i < totalFrames; i++) {
    const progress = i / totalFrames;
    drawFrame(ctx, lines, progress, title, style);

    const frame = new VideoFrame(canvas, {
      timestamp: Math.round((i / FPS) * 1_000_000),
    });

    videoEncoder.encode(frame, { keyFrame: i % (FPS * 2) === 0 });
    frame.close();

    if (i % 15 === 0) {
      onProgress?.(progress * 0.8);
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  onProgress?.(0.8);

  const chunkSamples = sampleRate;
  for (let offset = 0; offset < decoded.length; offset += chunkSamples) {
    const length = Math.min(chunkSamples, decoded.length - offset);
    const planar = new Float32Array(length * numberOfChannels);

    for (let ch = 0; ch < numberOfChannels; ch++) {
      const chData = decoded.getChannelData(ch);
      planar.set(chData.subarray(offset, offset + length), ch * length);
    }

    const ad = new AudioData({
      format: 'f32-planar',
      sampleRate,
      numberOfFrames: length,
      numberOfChannels,
      timestamp: Math.round((offset / sampleRate) * 1_000_000),
      data: planar,
    });

    audioEncoder.encode(ad);
    ad.close();
  }

  onProgress?.(0.9);

  await videoEncoder.flush();
  await audioEncoder.flush();
  videoEncoder.close();
  audioEncoder.close();

  muxer.finalize();
  onProgress?.(1);

  return new Blob([target.buffer], { type: 'video/mp4' });
}

async function pickAudioCodec(
  numberOfChannels: number,
  sampleRate: number,
): Promise<string> {
  for (const codec of ['mp4a.40.2', 'opus']) {
    try {
      const { supported } = await AudioEncoder.isConfigSupported({
        codec,
        numberOfChannels,
        sampleRate,
        bitrate: 128_000,
      });
      if (supported) return codec;
    } catch { /* try next */ }
  }
  throw new Error('浏览器不支持音频编码');
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  progress: number,
  title: string,
  style: string,
) {
  const { width: W, height: H } = ctx.canvas;

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#1e1b4b');
  grad.addColorStop(0.5, '#581c87');
  grad.addColorStop(1, '#831843');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  drawStars(ctx, W, H, progress);

  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(236,72,153,0.6)';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 56px sans-serif';
  ctx.fillText(`《${title}》`, W / 2, 160, W - 80);
  ctx.shadowBlur = 0;

  ctx.font = '32px sans-serif';
  ctx.fillStyle = 'rgba(236,72,153,0.8)';
  ctx.fillText(style, W / 2, 220);

  const lineH = 72;
  const fontSize = 42;
  const totalH = lines.length * lineH;
  const scrollRange = totalH + H * 0.3;
  const scrollOffset = progress * scrollRange;
  const centerY = H * 0.5;

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 280, W, H - 380);
  ctx.clip();

  lines.forEach((line, i) => {
    const y = H * 0.75 + i * lineH - scrollOffset;
    if (y < 200 || y > H - 80) return;

    const dist = Math.abs(y - centerY);
    const maxDist = H * 0.35;
    const alpha = Math.max(0, 1 - dist / maxDist);

    const isHeader = /^[【\[]/.test(line);
    if (isHeader) {
      ctx.fillStyle = `rgba(236,72,153,${alpha * 0.9})`;
      ctx.font = 'bold 36px sans-serif';
    } else {
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.font = `${fontSize}px sans-serif`;
    }

    ctx.textAlign = 'center';
    ctx.fillText(line, W / 2, y, W - 100);
  });

  ctx.restore();

  const barY = H - 90;
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(W * 0.1, barY, W * 0.8, 4);
  ctx.fillStyle = 'rgba(236,72,153,0.8)';
  ctx.fillRect(W * 0.1, barY, W * 0.8 * progress, 4);

  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.font = '24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('随心音乐 AI-Music-Studio ✨', W / 2, H - 50);
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  progress: number,
) {
  const seed = 42;
  for (let i = 0; i < 60; i++) {
    const pseudoRand = (n: number) => {
      const x = Math.sin(seed + n * 127.1) * 43758.5453;
      return x - Math.floor(x);
    };
    const x = pseudoRand(i) * W;
    const y = pseudoRand(i + 100) * H;
    const r = pseudoRand(i + 200) * 2 + 0.5;
    const twinkle = Math.sin(progress * Math.PI * 4 + i) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255,255,255,${0.3 * twinkle})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}
