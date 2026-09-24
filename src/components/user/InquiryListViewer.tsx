'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  PlusCircle,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  Loader2,
  CornerDownRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import type { InquiryDTO } from '@/core/application/cs/use-cases/CreateInquiryUseCase';
import type { InquiryCategory } from '@/core/domain/cs/entities/Inquiry';
import { createInquiryAction } from '@/app/actions/inquiry.actions';

interface InquiryListViewerProps {
  initialInquiries: InquiryDTO[];
}

const CATEGORIES: { id: InquiryCategory; label: string }[] = [
  { id: 'ORDER', label: '주문/결제' },
  { id: 'PRODUCT', label: '상품 문의' },
  { id: 'RETURN_REFUND', label: '취소/반품/환불' },
  { id: 'SHIPPING', label: '배송 문의' },
  { id: 'OTHER', label: '기타 문의' },
];

export function InquiryListViewer({ initialInquiries }: InquiryListViewerProps) {
  const router = useRouter();
  const [inquiries, setInquiries] = useState<InquiryDTO[]>(initialInquiries);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 모달 상태
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [category, setCategory] = useState<InquiryCategory>('ORDER');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [orderId, setOrderId] = useState('');

  // 비동기 처리
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleCreateInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) {
      setErrorMessage('문의 제목은 2자 이상 입력해 주세요.');
      return;
    }
    if (content.trim().length < 5) {
      setErrorMessage('문의 내용은 5자 이상 상세히 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await createInquiryAction({
        category,
        title: title.trim(),
        content: content.trim(),
        orderId: orderId.trim() || null,
      });

      if (!result.success || !result.data) {
        setErrorMessage(result.error || '문의 등록에 실패했습니다.');
        return;
      }

      setInquiries((prev) => [result.data!, ...prev]);
      setSuccessBanner('1:1 문의가 성공적으로 등록되었습니다. 고객센터에서 신속히 답변해 드리겠습니다.');
      setIsCreateModalOpen(false);
      setTitle('');
      setContent('');
      setOrderId('');
      router.refresh();
    } catch {
      setErrorMessage('문의 등록 중 통신 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. 상단 타이틀 & 문의 작성 버튼 */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                1:1 고객 문의 내역
              </h1>
              <p className="text-xs text-slate-400">
                주문, 결제, 취소/반품 등 궁금한 점을 질문하시면 전문 상담원이 답변해 드립니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setErrorMessage(null);
              setIsCreateModalOpen(true);
            }}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>1:1 문의 작성하기</span>
          </button>
        </div>

        {/* 성공 배너 */}
        {successBanner && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{successBanner}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessBanner(null)}
              className="p-1 text-emerald-600 hover:text-emerald-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* 2. 문의 내역 아코디언 목록 */}
      {inquiries.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <MessageSquare className="w-8 h-8 opacity-70" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              등록된 1:1 문의 내역이 없습니다.
            </h2>
            <p className="text-xs text-slate-500">
              주문, 배송, 상품 등 도움이 필요하신 점이 있다면 언제든 문의를 남겨주세요.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
          >
            문의 작성하기
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {inquiries.map((item) => {
            const isExpanded = expandedId === item.id;
            const isAnswered = item.status === 'ANSWERED';
            const createdDate = new Date(item.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });

            return (
              <div
                key={item.id}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden transition-all"
              >
                {/* 헤더 바 */}
                <button
                  type="button"
                  onClick={() => toggleExpand(item.id)}
                  className="w-full p-5 flex items-center justify-between gap-4 text-left hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {item.categoryLabel}
                      </span>
                      <span className="text-slate-400 font-mono">{createdDate}</span>
                      {isAnswered ? (
                        <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>답변 완료</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>답변 대기</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </h3>
                  </div>
                  <div className="text-slate-400 shrink-0">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </button>

                {/* 상세 본문 & 답변 아코디언 */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4 text-xs">
                    {/* 고객 질문 내용 */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </div>

                    {/* 답변 본문 */}
                    {isAnswered && item.answer ? (
                      <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-300">
                          <CornerDownRight className="w-4 h-4" />
                          <span>고객센터 답변</span>
                          {item.answeredAt && (
                            <span className="text-[11px] text-indigo-400 font-normal ml-auto">
                              {new Date(item.answeredAt).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap pl-5">
                          {item.answer}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span>상담원이 문의 내용을 확인하고 있습니다. 빠른 시일 내에 답변해 드리겠습니다.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. 1:1 문의 작성 폼 모달 */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  1:1 문의 작성
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInquiry} className="space-y-4 text-xs">
              {/* 문의 유형 선택 */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  문의 유형
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all border ${
                        category === cat.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 문의 제목 */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  문의 제목 (필수)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="문의 제목을 입력해 주세요"
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  required
                />
              </div>

              {/* 관련 주문번호 (선택) */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  관련 주문번호 (선택)
                </label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  placeholder="예: ORD-20260925-XXXX (주문 관련 문의 시 입력)"
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white font-mono"
                />
              </div>

              {/* 문의 내용 */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  문의 내용 (필수, 5자 이상)
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="궁금하신 내용을 구체적으로 적어주시면 더욱 정확한 답변이 가능합니다."
                  rows={4}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white"
                  required
                />
              </div>

              {/* 오류 메시지 */}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/80 font-bold text-rose-700 dark:text-rose-300">
                  {errorMessage}
                </div>
              )}

              {/* 버튼 액션 */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>문의 등록하기</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

