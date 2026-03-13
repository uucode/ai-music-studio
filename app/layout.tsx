import './globals.css';
import { Providers } from './components/Providers';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '随心音乐',
  description: '用 AI 创造你的专属歌曲',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
