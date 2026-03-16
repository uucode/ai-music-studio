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
    typeof MediaRecorder !== 'undefined' &&
    typeof HTMLCanvasElement.prototype.captureStream === 'function'
  );
}

export async function generateLyricsVideo(opts: VideoOptions): Promise<Blob> {
  const { lyrics, audioUrl, title, style, onProgress } = opts;

  const audioRes = await fetch(audioUrl);
  if (!audioRes.ok) throw new Error('音频加载失败');
  const audioArrayBuffer = await audioRes.arrayBuffer();

  const audioCtx = new AudioContext();
  const decoded = await audioCtx.decodeAudioData(audioArrayBuffer);
  const duration = decoded.duration;

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d')!;

  const audioDest = audioCtx.createMediaStreamDestination();
  const source = audioCtx.createBufferSource();
  source.buffer = decoded;
  source.connect(audioDest);

  const videoStream = canvas.captureStream(FPS);
  const combined = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...audioDest.stream.getAudioTracks(),
  ]);

  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
    ? 'video/webm;codecs=vp9,opus'
    : 'video/webm';

  const recorder = new MediaRecorder(combined, { mimeType });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const lines = lyrics.split('\n');

  return new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error('录制失败'));

    recorder.onstop = () => {
      audioCtx.close();
      resolve(new Blob(chunks, { type: 'video/webm' }));
    };

    source.start();
    recorder.start(200);
    const t0 = audioCtx.currentTime;

    const interval = setInterval(() => {
      const elapsed = audioCtx.currentTime - t0;
      const progress = Math.min(elapsed / duration, 1);
      onProgress?.(progress);
      drawFrame(ctx, lines, progress, title, style);

      if (progress >= 1) {
        clearInterval(interval);
        setTimeout(() => recorder.stop(), 300);
      }
    }, 1000 / FPS);

    source.onended = () => {
      clearInterval(interval);
      onProgress?.(1);
      drawFrame(ctx, lines, 1, title, style);
      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 500);
    };
  });
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
