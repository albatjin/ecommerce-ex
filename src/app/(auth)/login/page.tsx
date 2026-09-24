import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth';

export const metadata: Metadata = {
  title: '로그인 | CommerceHub',
  description: 'CommerceHub 계정으로 로그인하고 프리미엄 쇼핑을 시작하세요.',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const resolvedParams = await searchParams;
  const redirectTo = resolvedParams.redirect || '/';

  return (
    <div className="flex-1 min-h-[calc(100vh-14rem)] flex items-center justify-center py-12 px-4">
      <LoginForm redirectTo={redirectTo} />
    </div>
  );
}

