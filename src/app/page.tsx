import Link from 'next/link';
import { ArrowRight, Sparkles, Truck, ShieldCheck, Clock, CreditCard } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12 pb-16">
      {/* 1. 히어로 프로모션 배너 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white py-16 sm:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-20" />
        <div className="container-custom relative z-10 flex flex-col items-center text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs sm:text-sm font-medium mb-6 border border-blue-500/30">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>2026 S/S 프리미엄 셀렉션 오픈</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-6">
            품격 있는 라이프스타일,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300">
              CommerceHub
            </span>에서 만나보세요
          </h1>
          <p className="text-slate-300 text-base sm:text-lg mb-8 leading-relaxed">
            엄선된 프리미엄 패션과 럭셔리 라이프스타일 아이템.<br className="hidden sm:inline" />
            신규 가입 즉시 사용 가능한 3,000원 적립금과 무료배송 혜택을 누려보세요.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/products"
              className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm sm:text-base flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-105"
            >
              인기 상품 둘러보기
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/signup"
              className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm sm:text-base border border-white/20 transition-all"
            >
              회원가입 혜택 받기
            </Link>
          </div>
        </div>
      </section>

      {/* 2. 쇼핑몰 4대 안심 서비스 보증 바 */}
      <section className="container-custom">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">무료배송 혜택</div>
              <div className="text-[11px] text-slate-500">5만원 이상 주문 시 무료</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">100% 정품 보장</div>
              <div className="text-[11px] text-slate-500">철저한 검수 및 정품 인증</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">당일 빠른 발송</div>
              <div className="text-[11px] text-slate-500">오후 2시 이전 결제 완료 건</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">에스크로 안전결제</div>
              <div className="text-[11px] text-slate-500">구매 안전 안심 보증</div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 인기 카테고리 퀵 링크 */}
      <section className="container-custom">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            인기 카테고리
          </h2>
          <Link href="/categories" className="text-sm font-semibold text-blue-600 hover:underline">
            전체보기 →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { name: '의류 & 패션', desc: '코트, 니트, 팬츠', href: '/products?category=fashion' },
            { name: '가방 & 잡화', desc: '가죽 백, 지갑, 머플러', href: '/products?category=bags' },
            { name: '신발 & 슈즈', desc: '스니커즈, 로퍼, 부츠', href: '/products?category=shoes' },
            { name: '액세서리 & 주얼리', desc: '시계, 주얼리, 아이웨어', href: '/products?category=acc' },
          ].map((cat) => (
            <Link
              key={cat.name}
              href={cat.href}
              className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 transition-all shadow-sm hover:shadow"
            >
              <div className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                {cat.name}
              </div>
              <div className="text-xs text-slate-500 mt-1">{cat.desc}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
