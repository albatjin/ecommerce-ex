'use client';

import { useState, useMemo } from 'react';
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  Search,
  CornerDownRight,
  Send,
  Loader2,
  X,
  AlertCircle,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import type { InquiryDTO } from '@/core/application/cs/use-cases/CreateInquiryUseCase';
import type { InquiryCategory, InquiryStatus } from '@/core/domain/cs/entities/Inquiry';
import { answerInquiryAction } from '@/app/actions/inquiry.actions';

interface AdminInquiriesViewerProps {
  initialInquiries: InquiryDTO[];
}

type StatusFilterTab = 'ALL' | 'PENDING' | 'ANSWERED';

const STATUS_TABS: { id: StatusFilterTab; label: string }[] = [
  { id: 'ALL', label: '전체 문의' },
  { id: 'PENDING', label: '답변 대기' },
  { id: 'ANSWERED', label: '답변 완료' },
];

export function AdminInquiriesViewer({ initialInquiries }: AdminInquiriesViewerProps) {
  const [inquiries, setInquiries] = useState<InquiryDTO[]>(initialInquiries);
  const [statusTab, setStatusTab] = useState<StatusFilterTab>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 답변 작성 모달
  const [selectedInquiry, setSelectedInquiry] = useState<InquiryDTO | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // 필터링
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((item) => {
      if (statusTab !== 'ALL' && item.status !== statusTab) {
        return false;
      }
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchContent = item.content.toLowerCase().includes(q);
        const matchOrder = item.orderId ? item.orderId.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchContent && !matchOrder) {
          return false;
        }
      }
      return true;
    });
  }, [inquiries, statusTab, categoryFilter, searchQuery]);

  const pendingCount = useMemo(() => {
    return inquiries.filter((i) => i.status === 'PENDING').length;
  }, [inquiries]);

  const handleOpenAnswerModal = (inquiry: InquiryDTO) => {
    setSelectedInquiry(inquiry);
    setAnswerText(inquiry.answer || '');
    setErrorMessage(null);
  };

  const handleCloseModal = () => {
    if (isSubmitting) return;
    setSelectedInquiry(null);
    setAnswerText('');
    setErrorMessage(null);
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInquiry) return;
    if (answerText.trim().length < 5) {
      setErrorMessage('답변 내용은 최소 5자 이상 정성껏 입력해 주세요.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await answerInquiryAction({
        inquiryId: selectedInquiry.id,
        answerText: answerText.trim(),
      });

      if (!result.success || !result.data) {
        setErrorMessage(result.error || '답변 등록에 실패했습니다.');
        return;
      }

      // 목록 상태 업데이트
      setInquiries((prev) =>
        prev.map((item) => (item.id === result.data!.id ? result.data! : item))
      );

      setSuccessBanner(`[${selectedInquiry.title}] 문의에 대한 공식 답변이 등록되었습니다.`);
      handleCloseModal();
    } catch {
      setErrorMessage('답변 처리 중 네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. 상단 관리 콘솔 헤더 카드 */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">1:1 고객 문의 관리 콘솔</h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                관리자 전용
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              고객 질문에 답변하고 신속한 CS 지원을 제공합니다.
            </p>
          </div>
        </div>

        {/* 대기 현황 배지 */}
        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10">
          <div>
            <div className="text-xs text-slate-400 mb-0.5">답변 대기</div>
            <div className="text-2xl font-black text-amber-400">{pendingCount}건</div>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div>
            <div className="text-xs text-slate-400 mb-0.5">전체 접수</div>
            <div className="text-2xl font-black text-indigo-300">{inquiries.length}건</div>
          </div>
        </div>
      </div>

      {/* 2. 성공 피드백 알림 배너 */}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
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

      {/* 3. 필터 및 검색 컨트롤 */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* 상태 탭 */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusTab === tab.id
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tab.label}
              {tab.id === 'PENDING' && pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-black">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 카테고리 필터 & 검색 */}
        <div className="flex items-center gap-2 flex-1 sm:flex-initial">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden"
          >
            <option value="ALL">모든 유형</option>
            <option value="ORDER">주문/결제</option>
            <option value="PRODUCT">상품 문의</option>
            <option value="RETURN_REFUND">취소/반품/환불</option>
            <option value="SHIPPING">배송 문의</option>
            <option value="OTHER">기타 문의</option>
          </select>

          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="제목, 내용, 주문번호 검색"
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* 4. 문의 목록 */}
      {filteredInquiries.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
          <HelpCircle className="w-12 h-12 text-slate-400 mx-auto opacity-60" />
          <h2 className="text-base font-bold text-slate-700 dark:text-slate-300">
            조건에 부합하는 1:1 문의가 없습니다.
          </h2>
          <p className="text-xs text-slate-400">필터나 검색어를 변경해 보세요.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInquiries.map((item) => {
            const isAnswered = item.status === 'ANSWERED';
            const createdDate = new Date(item.createdAt).toLocaleString('ko-KR');

            return (
              <div
                key={item.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-all"
              >
                {/* 상단 메타 바 */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="px-2.5 py-0.5 rounded-full font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {item.categoryLabel}
                    </span>
                    {isAnswered ? (
                      <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>답변 완료</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>답변 대기중</span>
                      </span>
                    )}
                    <span className="text-slate-400">접수: {createdDate}</span>
                  </div>

                  {item.orderId && (
                    <div className="flex items-center gap-1 text-xs text-slate-500 font-mono bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span>주문번호:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">{item.orderId}</span>
                    </div>
                  )}
                </div>

                {/* 질문 제목 & 내용 */}
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {item.content}
                  </div>
                </div>

                {/* 등록된 답변 또는 답변 작성 액션 */}
                {isAnswered && item.answer ? (
                  <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-300">
                        <CornerDownRight className="w-4 h-4" />
                        <span>등록된 관리자 공식 답변</span>
                        {item.answeredAt && (
                          <span className="text-[11px] text-indigo-400 font-normal">
                            ({new Date(item.answeredAt).toLocaleString('ko-KR')})
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenAnswerModal(item)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-semibold underline cursor-pointer"
                      >
                        답변 수정하기
                      </button>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap pl-5">
                      {item.answer}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-semibold">
                      <AlertCircle className="w-4 h-4" />
                      <span>고객이 답변을 기다리고 있습니다.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleOpenAnswerModal(item)}
                      className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>답변 작성하기</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. 관리자 답변 등록 모달 */}
      {selectedInquiry && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  1:1 문의 답변 등록
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 원본 문의 요약 */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px]">
                  {selectedInquiry.categoryLabel}
                </span>
                <span>{selectedInquiry.title}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                {selectedInquiry.content}
              </p>
            </div>

            {/* 답변 작성 폼 */}
            <form onSubmit={handleSubmitAnswer} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  공식 답변 내용 (최소 5자 이상)
                </label>
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="고객님께 전달될 정중하고 명확한 답변을 작성해 주세요."
                  rows={6}
                  className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-white text-xs leading-relaxed"
                  required
                />
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/80 font-bold text-rose-700 dark:text-rose-300">
                  {errorMessage}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
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
                  <span>답변 등록 완료</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
