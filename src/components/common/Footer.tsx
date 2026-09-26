import Link from 'next/link';

export function Footer() {
  return (
    <footer className="w-full bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-auto">
      {/* 1. 상단 약관 및 링크 바 */}
      <div className="border-b border-slate-800/80 py-4">
        <div className="container-custom flex flex-wrap items-center justify-between gap-4 font-medium">
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/about" className="hover:text-white transition-colors">
              회사소개
            </Link>
            <Link href="/terms" className="hover:text-white transition-colors">
              이용약관
            </Link>
            <Link href="/privacy" className="text-white font-bold hover:underline transition-colors">
              개인정보처리방침
            </Link>
            <Link href="/support" className="hover:text-white transition-colors">
              고객센터
            </Link>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <span>KG이니시스 에스크로 구매안전 서비스 적용</span>
          </div>
        </div>
      </div>

      {/* 2. 메인 푸터 정보 */}
      <div className="container-custom py-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* 기업 및 사업자 정보 */}
        <div className="md:col-span-3 space-y-2 leading-relaxed">
          <div className="text-slate-200 font-bold text-sm mb-3">aramdream store</div>
          <p>
            대표자: 김은영 | 사업자등록번호: 214-88-91204 | 통신판매업신고: 2024-서울강남-03891호
          </p>
          <p>
            주소: 서울특별시 강남구 테헤란로 427, 위워크타워 14층 1402호 (우편번호 06164)
          </p>
          <p>
            호스팅제공자: aramdream store Cloud | 개인정보보호책임자: 김은영 (privacy@commercehub.co.kr)
          </p>
          <p className="text-slate-500 pt-3">
            © {new Date().getFullYear()} aramdream store Inc. All rights reserved. 본 사이트의 모든 콘텐츠는 저작권법의 보호를 받습니다.
          </p>
        </div>

        {/* 고객센터 안내 */}
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="text-slate-200 font-bold text-sm mb-1">고객행복센터</div>
            <div className="text-2xl font-black text-blue-400 my-1">1588-4920</div>
            <p className="text-[11px] text-slate-400">
              평일 09:30 ~ 18:00 (점심시간 12:30 ~ 13:30)<br />
              주말 및 공휴일 휴무
            </p>
          </div>
          <div className="pt-3 border-t border-slate-700/60 mt-3 flex items-center justify-between text-[11px]">
            <span>이메일 문의</span>
            <a href="mailto:support@commercehub.co.kr" className="text-blue-400 hover:underline">
              support@commercehub.co.kr
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

