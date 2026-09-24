import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CommerceHub | 프리미엄 이커머스 플랫폼',
  description: 'Next.js 16 + React 19 + Supabase SSR 기반의 엔터프라이즈급 이커머스 플랫폼',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased flex flex-col min-h-screen">
        {children}
      </body>
    </html>
  );
}

