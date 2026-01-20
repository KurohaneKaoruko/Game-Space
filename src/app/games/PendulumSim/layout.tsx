import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '混沌摆模拟',
  description: '基于物理引擎的双摆/三摆模拟小游戏',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}

