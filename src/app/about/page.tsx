import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, ShieldCheck, HeartHandshake, Sparkles, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: '회사소개 | CommerceHub',
  description: '최고의 쇼핑 경험을 제공하는 이커머스 플랫폼 CommerceHub 소개',
};

export default function AboutPage() {
  return (
    <div className="container-custom py-12 space-y-12">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <span className="px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-900">
          About CommerceHub
        </span>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          더 스마트하고 즐거운 <br />
          <span className="text-blue-600">온라인 쇼핑의 새로운 표준</span>
        </h1>
        <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
          CommerceHub는 고객 중심의 혁신과 정직한 품질을 바탕으로 트렌디한 패션, 라이프스타일, 디지털 상품을 가장 빠르고 안전하게 제공합니다.
        </p>
      </div>

      {/* Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">엄선된 큐레이션</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            전문 MD가 직접 검증한 우수한 품질의 상품만을 엄선하여 트렌드를 선도합니다.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">안심 쇼핑 & 결제</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            에스크로 구매안전 서비스와 안전한 암호화 결제로 안심하고 쇼핑하실 수 있습니다.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-white">고객 행복 케어</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            신속한 당일 출고와 친절한 고객 지원 서비스로 언제나 고객 만족을 최우선으로 합니다.
          </p>
        </div>
      </div>

      {/* Info & Call to Action */}
      <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">궁금한 점이 있으신가요?</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            고객센터에서 자주 묻는 질문을 확인하거나 1:1 맞춤 상담을 받아보세요.
          </p>
        </div>
        <Link
          href="/support"
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
        >
          고객센터 바로가기 <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
