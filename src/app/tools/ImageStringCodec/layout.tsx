import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '图片短字符串编码',
  description: '把图片编码成尽可能短的字符串，并支持解码与下载还原。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
