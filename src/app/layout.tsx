import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'node modular synthesizer',
  description: 'A modular synthesizer web app built with Tone.js.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
