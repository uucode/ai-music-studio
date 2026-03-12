import './globals.css';

export const metadata = {
  title: '随心音乐',
  description: '用 AI 创造你的专属歌曲'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{metadata.title}</title>
      </head>
      <body>{children}</body>
    </html>
  );
}
