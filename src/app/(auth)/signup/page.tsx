import type { Metadata } from 'next';
import { SignUpForm } from '@/components/auth';

export const metadata: Metadata = {
  title: '간편 회원가입 | CommerceHub',
  description: '신규 가입 즉시 3,000원 적립금과 무료배송 혜택을 드립니다.',
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const resolvedParams = await searchParams;
  const redirectTo = resolvedParams.redirect || '/';

  return (
    <div className="flex-1 min-h-[calc(100vh-14rem)] flex items-center justify-center py-12 px-4">
      <SignUpForm redirectTo={redirectTo} />
    </div>
  );
}

