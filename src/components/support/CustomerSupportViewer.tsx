'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Headphones,
  Search,
  MessageSquare,
  PackageSearch,
  RotateCcw,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Phone,
  Mail,
  Clock,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface FAQItem {
  id: string;
  category: 'ALL' | 'ORDER' | 'SHIPPING' | 'CLAIM' | 'MEMBER';
  question: string;
  answer: string;
}

const FAQ_LIST: FAQItem[] = [
  {
    id: 'faq-1',
    category: 'SHIPPING',
    question: '배송은 보통 얼마나 걸리나요?',
    answer:
      '평일 오후 2시 이전 결제 완료 건은 당일 출고되며, 출고 후 평균 1~3 영업일 이내에 수령하실 수 있습니다. 제주 및 도서산간 지역의 경우 1~2일 추가 소요될 수 있습니다.',
  },
  {
    id: 'faq-2',
    category: 'SHIPPING',
    question: '배송비 정책과 무료 배송 기준이 궁금합니다.',
    answer:
      '기본 배송비는 3,000원이며, 50,000원 이상 구매 시 전 상품 무료 배송 혜택이 적용됩니다. (도서산간 지역의 경우 추가 배송비가 발생할 수 있습니다.)',
  },
  {
    id: 'faq-3',
    category: 'ORDER',
    question: '주문 후 결제 수단이나 배송지를 변경할 수 있나요?',
    answer:
      "'결제완료' 단계에서는 [마이페이지 > 주문내역]에서 배송지 변경이 가능합니다. 이미 상품 준비 중이거나 배송 중인 경우에는 변경이 불가하므로 1:1 문의를 남겨주세요.",
  },
  {
    id: 'faq-4',
    category: 'ORDER',
    question: '영수증 및 세금계산서 발행은 어떻게 하나요?',
    answer:
      '신용카드 결제 건은 [마이페이지 > 주문내역 상세]에서 매출전표를 즉시 출력하실 수 있습니다. 무통장입금/가상계좌 건은 주문 시 현금영수증 발행을 신청하실 수 있습니다.',
  },
  {
    id: 'faq-5',
    category: 'CLAIM',
    question: '반품/교환 신청은 어떻게 하나요?',
    answer:
      '상품 수령 후 7일 이내에 [마이페이지 > 취소/반품/교환] 메뉴에서 직접 신청하실 수 있습니다. 단순 변심인 경우 반품 배송비(왕복 6,000원)가 차감되며, 상품 불량/오배송의 경우 전액 무료로 처리됩니다.',
  },
  {
    id: 'faq-6',
    category: 'CLAIM',
    question: '주문 취소 시 환불은 언제 입금되나요?',
    answer:
      '카드 결제는 취소 승인 후 카드사 정책에 따라 영업일 기준 3~5일 후 승인 취소 또는 한도 복구됩니다. 가상계좌/무통장 환불은 익일 지정 계좌로 환불 입금 처리됩니다.',
  },
  {
    id: 'faq-7',
    category: 'MEMBER',
    question: '회원 등급 혜택 및 승급 기준은 어떻게 되나요?',
    answer:
      '최근 6개월 누적 구매 금액에 따라 BRONZE, SILVER, GOLD, VIP, VVIP 5개 등급으로 매월 1일 자동 산정됩니다. 등급에 따라 최대 5% 구매 적립 및 매월 등급별 할인 쿠폰팩이 지급됩니다.',
  },
  {
    id: 'faq-8',
    category: 'MEMBER',
    question: '적립금과 쿠폰은 동시에 사용할 수 있나요?',
    answer:
      '네, 결제 시 보유하신 할인 쿠폰을 먼저 적용한 후, 잔여 결제 금액에 대해 보유 적립금을 1,000원 단위로 중복 적용하여 알뜰하게 쇼핑하실 수 있습니다.',
  },
];

const CATEGORIES = [
  { id: 'ALL', label: '전체' },
  { id: 'ORDER', label: '주문/결제' },
  { id: 'SHIPPING', label: '배송안내' },
  { id: 'CLAIM', label: '취소/반품/교환' },
  { id: 'MEMBER', label: '회원/적립금/쿠폰' },
] as const;

export function CustomerSupportViewer() {
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('faq-1');

  const filteredFaqs = useMemo(() => {
    return FAQ_LIST.filter((faq) => {
      const matchCategory =
        activeCategory === 'ALL' || faq.category === activeCategory;
      const matchSearch =
        !searchQuery ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  const toggleFaq = (id: string) => {
    setExpandedFaqId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-10 pb-16">
      {/* 1. Hero Banner Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-slate-900 text-white p-8 md:p-12 shadow-xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold mb-4 border border-white/20">
            <Headphones className="w-3.5 h-3.5" />
            고객행복센터 24/7 지원
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">
            무엇을 도와드릴까요?
          </h1>
          <p className="text-slate-200 text-sm md:text-base leading-relaxed mb-6">
            자주 묻는 질문을 검색하시거나, 1:1 맞춤 문의를 통해 신속한 도움을 받아보세요.
          </p>

          {/* Search Box */}
          <div className="relative w-full max-w-xl">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="궁금한 질문 키워드를 검색해보세요 (예: 배송, 반품, 적립금)"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-slate-900 placeholder:text-slate-400 text-sm font-medium shadow-lg focus:outline-hidden focus:ring-4 focus:ring-blue-400/40 transition"
            />
          </div>
        </div>
      </div>

      {/* 2. Quick Services 4 Cards */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          자주 찾는 빠른 서비스
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: 1:1 문의하기 */}
          <Link
            href="/my-page/inquiries"
            className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                1:1 문의 접수
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                궁금한 점이나 불편사항을 남겨주시면 담당자가 신속히 답변해 드립니다.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
              문의하러 가기 <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>

          {/* Card 2: 주문/배송 조회 */}
          <Link
            href="/my-page/orders"
            className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <PackageSearch className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                주문 / 배송 조회
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                실시간 배송 위치와 운송장 번호, 주문 처리 상태를 확인하실 수 있습니다.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
              배송 조회하기 <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>

          {/* Card 3: 취소/반품/교환 */}
          <Link
            href="/my-page/claims"
            className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                취소 / 반품 / 교환
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                주문 취소 및 수령 상품의 반품/교환 접수와 진행 상황을 확인하세요.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-amber-600 dark:text-amber-400 group-hover:translate-x-1 transition-transform">
              클레임 신청하기 <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>

          {/* Card 4: 회원 혜택 & 마이페이지 */}
          <Link
            href="/my-page"
            className="group p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-purple-500 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-1">
                회원정보 & 등급 혜택
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                보유 적립금, 할인 쿠폰 내역 및 배송지 주소록을 손쉽게 관리하세요.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">
              마이페이지 이동 <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>
        </div>
      </div>

      {/* 3. FAQ Section with Category Filter Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              자주 묻는 질문 (FAQ)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              고객님들께서 가장 많이 문의하시는 내용을 모아두었습니다.
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeCategory === cat.id
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Accordion List */}
        {filteredFaqs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500">
            <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">검색 결과와 일치하는 FAQ가 없습니다.</p>
            <p className="text-xs mt-1">다른 검색어를 입력하시거나 1:1 문의를 이용해주세요.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredFaqs.map((faq) => {
              const isExpanded = expandedFaqId === faq.id;
              return (
                <div key={faq.id} className="py-4">
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full flex items-center justify-between text-left gap-4 group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-black shrink-0">
                        Q
                      </span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {faq.question}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="mt-3 pl-9 pr-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50/70 dark:bg-slate-850/60 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 animate-in fade-in duration-200">
                      <div className="flex gap-2">
                        <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0">
                          A.
                        </span>
                        <span>{faq.answer}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Contact & Consultation Hours Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Telephone Consultation */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Phone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              고객행복센터 전화상담
            </h3>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 mb-2 tracking-tight">
              1588-4920
            </div>
            <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
              <p className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                평일 09:30 ~ 18:00 (점심시간 12:30 ~ 13:30)
              </p>
              <p className="text-[11px] text-slate-400">
                * 주말 및 법정 공휴일은 휴무입니다.
              </p>
            </div>
          </div>
        </div>

        {/* Email Consultation & 1:1 Inquiries */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              온라인 1:1 문의 / 이메일
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              24시간 언제든지 문의를 남겨주시면 영업일 기준 1일 이내에 신속하고 친절하게 답변해 드립니다.
            </p>
            <div className="mt-3 flex items-center gap-3">
              <Link
                href="/my-page/inquiries"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                1:1 문의 바로가기
              </Link>
              <a
                href="mailto:support@commercehub.co.kr"
                className="text-xs font-medium text-slate-500 hover:text-blue-600 underline"
              >
                support@commercehub.co.kr
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
