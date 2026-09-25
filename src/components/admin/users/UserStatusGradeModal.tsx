'use client';

import { useState } from 'react';
import { UserCheck, X, AlertCircle } from 'lucide-react';
import type { AdminUserSummaryDTO } from '@/core/application/user/dto/admin-user.dto';
import type {
  UserRole,
  MembershipGrade,
  UserStatus,
} from '@/shared/types/database.types';

interface UserStatusGradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    status: UserStatus;
    membershipGrade: MembershipGrade;
    role: UserRole;
  }) => Promise<void>;
  user: AdminUserSummaryDTO;
  isProcessing?: boolean;
}

export function UserStatusGradeModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  isProcessing = false,
}: UserStatusGradeModalProps) {
  const [status, setStatus] = useState<UserStatus>(user.status);
  const [membershipGrade, setMembershipGrade] = useState<MembershipGrade>(
    user.membershipGrade
  );
  const [role, setRole] = useState<UserRole>(user.role);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await onConfirm({ status, membershipGrade, role });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : '회원 정보 수정 처리 중 오류가 발생했습니다.'
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="status-grade-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="status-grade-modal-title"
                className="font-bold text-slate-900 dark:text-white text-base"
              >
                회원 상태 및 등급 변경
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {user.customerNumber} · {user.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 본문 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold text-slate-900 dark:text-white block">
              {user.name} ({user.email})
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              현재 누적 구매액: {user.totalSpent.toLocaleString()}원 · 총 주문 {user.totalOrders}회
            </span>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 font-medium"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* 회원 상태 선택 */}
          <div className="space-y-1.5">
            <label
              htmlFor="user-status-select"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              회원 상태 (Status)
            </label>
            <select
              id="user-status-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as UserStatus)}
              disabled={isProcessing}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="ACTIVE">ACTIVE (정상 이용 가능)</option>
              <option value="DORMANT_WARNING">DORMANT_WARNING (휴면 예고)</option>
              <option value="DORMANT">DORMANT (휴면 계정)</option>
              <option value="WITHDRAWN">WITHDRAWN (탈퇴 처리)</option>
            </select>
          </div>

          {/* 회원 등급 선택 */}
          <div className="space-y-1.5">
            <label
              htmlFor="user-grade-select"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              회원 등급 (Membership Grade)
            </label>
            <select
              id="user-grade-select"
              value={membershipGrade}
              onChange={(e) => setMembershipGrade(e.target.value as MembershipGrade)}
              disabled={isProcessing}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="BRONZE">BRONZE (일반)</option>
              <option value="SILVER">SILVER (우수)</option>
              <option value="GOLD">GOLD (골드)</option>
              <option value="VIP">VIP (최우수)</option>
              <option value="VVIP">VVIP (프리미엄 최상위)</option>
            </select>
          </div>

          {/* 역할 권한 선택 */}
          <div className="space-y-1.5">
            <label
              htmlFor="user-role-select"
              className="block text-xs font-bold text-slate-700 dark:text-slate-300"
            >
              역할 권한 (Role)
            </label>
            <select
              id="user-role-select"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              disabled={isProcessing}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm font-semibold focus:outline-none focus:border-indigo-500"
            >
              <option value="customer">customer (일반 고객)</option>
              <option value="staff">staff (운영 스태프)</option>
              <option value="manager">manager (운영 매니저)</option>
              <option value="admin">admin (시스템 관리자)</option>
              <option value="super_admin">super_admin (최고 관리자)</option>
            </select>
          </div>

          {/* 버튼 영역 */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              {isProcessing ? '저장 중...' : '변경사항 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
