'use client';

import { useState, useTransition, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  Coins,
  Ticket,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Crown,
  ChevronRight,
} from 'lucide-react';
import type { AdminUserSummaryDTO } from '@/core/application/user/dto/admin-user.dto';
import type {
  MembershipGrade,
  UserStatus,
  UserRole,
} from '@/shared/types/database.types';
import {
  updateUserStatusAndGradeAction,
  grantUserPointsAction,
  issueUserCouponAction,
} from '@/app/actions/user-admin.actions';
import { UserStatusGradeModal } from './UserStatusGradeModal';
import { GrantPointsModal } from './GrantPointsModal';
import { IssueCouponModal } from './IssueCouponModal';

interface AdminUserListViewerProps {
  initialUsers: AdminUserSummaryDTO[];
  totalCount: number;
}

const GRADE_BADGE_STYLE: Record<MembershipGrade, string> = {
  BRONZE: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200',
  SILVER: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300',
  GOLD: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 border-yellow-300',
  VIP: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 font-black',
  VVIP: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 font-black ring-1 ring-rose-400',
};

const STATUS_BADGE_STYLE: Record<UserStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200',
  DORMANT_WARNING: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 font-bold',
  DORMANT: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200',
  WITHDRAWN: 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-300 line-through',
};

export function AdminUserListViewer({
  initialUsers,
  totalCount,
}: AdminUserListViewerProps) {
  const [users, setUsers] = useState<AdminUserSummaryDTO[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // 모달 제어 상태
  const [targetUser, setTargetUser] = useState<AdminUserSummaryDTO | null>(null);
  const [modalType, setModalType] = useState<
    'STATUS_GRADE' | 'POINTS' | 'COUPON' | null
  >(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 피드백 알림 배너
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  // 통계 계산
  const activeCount = users.filter((u) => u.status === 'ACTIVE').length;
  const dormantCount = users.filter(
    (u) => u.status === 'DORMANT' || u.status === 'DORMANT_WARNING'
  ).length;
  const vipCount = users.filter(
    (u) => u.membershipGrade === 'VIP' || u.membershipGrade === 'VVIP'
  ).length;

  // 필터링 적용 목록
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 1. 상태 필터
      if (selectedStatus !== 'ALL' && u.status !== selectedStatus) {
        return false;
      }
      // 2. 등급 필터
      if (selectedGrade !== 'ALL' && u.membershipGrade !== selectedGrade) {
        return false;
      }
      // 3. 검색어 필터
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = u.name.toLowerCase().includes(q);
        const matchEmail = u.email.toLowerCase().includes(q);
        const matchCode = u.customerNumber.toLowerCase().includes(q);
        const matchPhone = u.phone ? u.phone.includes(q) : false;
        if (!matchName && !matchEmail && !matchCode && !matchPhone) {
          return false;
        }
      }
      return true;
    });
  }, [users, selectedStatus, selectedGrade, searchQuery]);

  // 상태/등급 변경 핸들러
  const handleUpdateStatusAndGrade = async (data: {
    status: UserStatus;
    membershipGrade: MembershipGrade;
    role: UserRole;
  }) => {
    if (!targetUser) return;
    setIsProcessing(true);

    try {
      const result = await updateUserStatusAndGradeAction({
        userId: targetUser.id,
        status: data.status,
        membershipGrade: data.membershipGrade,
        role: data.role,
      });

      if (result.success && result.data) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === targetUser.id
              ? {
                  ...u,
                  status: data.status,
                  membershipGrade: data.membershipGrade,
                  role: data.role,
                }
              : u
          )
        );
        setFeedback({
          type: 'success',
          text: `회원 [${targetUser.name}]의 상태(${data.status}), 등급(${data.membershipGrade}), 권한(${data.role})이 수정되었습니다.`,
        });
      } else {
        throw new Error(result.error || '회원 정보 수정 실패');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 적립금 지급 핸들러
  const handleGrantPoints = async (amount: number, description: string) => {
    if (!targetUser) return;
    setIsProcessing(true);

    try {
      const result = await grantUserPointsAction({
        userId: targetUser.id,
        amount,
        description,
      });

      if (result.success && result.data) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === targetUser.id
              ? { ...u, rewardPoints: result.data!.newBalance }
              : u
          )
        );
        setFeedback({
          type: 'success',
          text: `회원 [${targetUser.name}]에게 적립금 ${amount.toLocaleString()}P가 지급되었습니다. (잔액: ${result.data.newBalance.toLocaleString()}P)`,
        });
      } else {
        throw new Error(result.error || '적립금 지급 실패');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 쿠폰 발급 핸들러
  const handleIssueCoupon = async (data: {
    name: string;
    discountAmount?: number | null;
    discountRate?: number | null;
    minOrderAmount: number;
    validDays: number;
  }) => {
    if (!targetUser) return;
    setIsProcessing(true);

    try {
      const result = await issueUserCouponAction({
        userId: targetUser.id,
        ...data,
      });

      if (result.success && result.data) {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === targetUser.id
              ? { ...u, couponsCount: u.couponsCount + 1 }
              : u
          )
        );
        setFeedback({
          type: 'success',
          text: `회원 [${targetUser.name}]에게 쿠폰 [${data.name}]이(가) 발급되었습니다.`,
        });
      } else {
        throw new Error(result.error || '쿠폰 발급 실패');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. 상단 타이틀 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            회원 통합 관리 (CMS)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            등록된 고객 계정을 조회하고, 회원 상태/등급 변경 및 적립금/쿠폰을 수동 지급합니다.
          </p>
        </div>
      </div>

      {/* 2. 상태별 카운트 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">전체 가입 회원</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">
            {users.length}
            <span className="text-xs font-normal text-slate-400 ml-1">명</span>
          </span>
        </div>

        <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-xs">
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 block">
            정상 활성 회원
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {activeCount}
            <span className="text-xs font-normal text-emerald-500/70 ml-1">명</span>
          </span>
        </div>

        <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 shadow-xs">
          <span className="text-xs font-semibold text-purple-800 dark:text-purple-300 block flex items-center gap-1">
            <Crown className="w-3.5 h-3.5" /> VIP / VVIP
          </span>
          <span className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1 block">
            {vipCount}
            <span className="text-xs font-normal text-purple-500/70 ml-1">명</span>
          </span>
        </div>

        <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 shadow-xs">
          <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 block flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> 휴면 회원
          </span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {dormantCount}
            <span className="text-xs font-normal text-amber-500/70 ml-1">명</span>
          </span>
        </div>
      </div>

      {/* 3. 피드백 알림 배너 */}
      {feedback && (
        <div
          role="status"
          className={`p-3.5 rounded-xl text-sm flex items-center justify-between transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* 4. 검색 & 필터 바 */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* 검색창 */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="이름, 이메일, 회원코드 검색..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-500 focus:outline-none transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* 등급 셀렉트 필터 */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              aria-label="회원 등급 필터"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full sm:w-40 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none"
            >
              <option value="ALL">모든 등급</option>
              <option value="BRONZE">BRONZE (일반)</option>
              <option value="SILVER">SILVER (우수)</option>
              <option value="GOLD">GOLD (골드)</option>
              <option value="VIP">VIP (최우수)</option>
              <option value="VVIP">VVIP (프리미엄)</option>
            </select>
          </div>
        </div>

        {/* 상태 탭 필터 */}
        <div className="flex gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'ALL', label: `전체 (${users.length})` },
            { id: 'ACTIVE', label: `정상 (${activeCount})` },
            { id: 'DORMANT_WARNING', label: `휴면예고 (${users.filter((u) => u.status === 'DORMANT_WARNING').length})` },
            { id: 'DORMANT', label: `휴면 (${users.filter((u) => u.status === 'DORMANT').length})` },
            { id: 'WITHDRAWN', label: `탈퇴 (${users.filter((u) => u.status === 'WITHDRAWN').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                selectedStatus === tab.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 5. 회원 목록 테이블 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 w-36">회원번호 / 가입일</th>
                <th className="py-3 px-4">회원 정보</th>
                <th className="py-3 px-4 text-center">등급 / 역할</th>
                <th className="py-3 px-4 text-right">누적 실적</th>
                <th className="py-3 px-4 text-right">보유 혜택</th>
                <th className="py-3 px-4 text-center">계정 상태</th>
                <th className="py-3 px-4 text-right">관리 액션</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                    해당 조건의 회원이 없습니다.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* 회원번호 / 가입일 */}
                    <td className="py-3 px-4 align-top">
                      <span className="font-mono font-bold text-slate-900 dark:text-white block">
                        {u.customerNumber}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {new Date(u.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </td>

                    {/* 회원 정보 */}
                    <td className="py-3 px-4 align-top">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 dark:text-white text-sm block">
                          {u.name}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                          {u.email}
                        </span>
                        {u.phone && (
                          <span className="text-[10px] text-slate-400 font-mono block">
                            {u.phone}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 등급 / 역할 */}
                    <td className="py-3 px-4 align-top text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] border ${
                            GRADE_BADGE_STYLE[u.membershipGrade]
                          }`}
                        >
                          {u.membershipGrade}
                        </span>
                        {u.role !== 'customer' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            {u.role.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 누적 실적 */}
                    <td className="py-3 px-4 align-top text-right">
                      <span className="font-extrabold text-slate-900 dark:text-white text-xs block">
                        {u.totalSpent.toLocaleString()}원
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        총 {u.totalOrders}회 주문
                      </span>
                    </td>

                    {/* 보유 혜택 */}
                    <td className="py-3 px-4 align-top text-right">
                      <div className="space-y-0.5">
                        <span className="font-extrabold text-amber-600 dark:text-amber-400 text-xs block">
                          {u.rewardPoints.toLocaleString()}P
                        </span>
                        <span className="text-[11px] text-rose-500 dark:text-rose-400 font-bold block">
                          쿠폰 {u.couponsCount}장
                        </span>
                      </div>
                    </td>

                    {/* 계정 상태 */}
                    <td className="py-3 px-4 align-top text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                          STATUS_BADGE_STYLE[u.status]
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>

                    {/* 관리 액션 버튼들 */}
                    <td className="py-3 px-4 align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1. 상태/등급 변경 버튼 */}
                        <button
                          type="button"
                          aria-label={`회원 ${u.name} 상태 및 등급 변경`}
                          onClick={() => {
                            setTargetUser(u);
                            setModalType('STATUS_GRADE');
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="상태/등급 변경"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>

                        {/* 2. 적립금 지급 버튼 */}
                        <button
                          type="button"
                          aria-label={`회원 ${u.name} 적립금 지급`}
                          onClick={() => {
                            setTargetUser(u);
                            setModalType('POINTS');
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="적립금 지급"
                        >
                          <Coins className="w-4 h-4" />
                        </button>

                        {/* 3. 쿠폰 발급 버튼 */}
                        <button
                          type="button"
                          aria-label={`회원 ${u.name} 쿠폰 발급`}
                          onClick={() => {
                            setTargetUser(u);
                            setModalType('COUPON');
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="쿠폰 발급"
                        >
                          <Ticket className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. 모달 팝업들 */}
      {targetUser && modalType === 'STATUS_GRADE' && (
        <UserStatusGradeModal
          isOpen={true}
          onClose={() => {
            setModalType(null);
            setTargetUser(null);
          }}
          onConfirm={handleUpdateStatusAndGrade}
          user={targetUser}
          isProcessing={isProcessing}
        />
      )}

      {targetUser && modalType === 'POINTS' && (
        <GrantPointsModal
          isOpen={true}
          onClose={() => {
            setModalType(null);
            setTargetUser(null);
          }}
          onConfirm={handleGrantPoints}
          user={targetUser}
          isProcessing={isProcessing}
        />
      )}

      {targetUser && modalType === 'COUPON' && (
        <IssueCouponModal
          isOpen={true}
          onClose={() => {
            setModalType(null);
            setTargetUser(null);
          }}
          onConfirm={handleIssueCoupon}
          user={targetUser}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}
