import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침 | CommerceHub',
  description: 'CommerceHub 고객 개인정보 보호 및 처리 방침 안내',
};

export default function PrivacyPage() {
  return (
    <div className="container-custom py-12 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">CommerceHub 개인정보처리방침</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          시행일자: 2026년 1월 1일 | 개인정보 보호법 준수
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">1. 수집하는 개인정보의 항목 및 수집방법</h2>
          <p>
            회사는 회원가입, 원활한 고객상담, 각종 서비스의 제공을 위해 최초 회원가입 당시 아래와 같은 최소한의 개인정보를 필수항목으로 수집하고 있습니다.<br />
            - 필수항목: 이름, 이메일 주소, 비밀번호, 휴대전화번호, 배송지 주소<br />
            - 결제 시: 신용카드 정보, 계좌번호 등 결제 수단 정보 (PG사 암호화 전달)
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">2. 개인정보의 수집 및 이용목적</h2>
          <p>
            - 서비스 제공에 관한 계약 이행 및 서비스 제공에 따른 요금정산, 콘텐츠 제공, 물품배송 또는 청구서 등 발송, 금융거래 본인 인증 및 금융서비스<br />
            - 회원 관리: 회원제 서비스 이용에 따른 본인확인, 개인식별, 불량회원의 부정 이용 방지와 비인가 사용 방지, 가입 의사 확인, 불만처리 등 민원처리
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">3. 개인정보보호 책임자</h2>
          <p>
            - 책임자: 김은영 (개인정보보호 책임자)<br />
            - 소속: CommerceHub 고객정보보안팀<br />
            - 이메일: privacy@commercehub.co.kr | 고객센터: 1588-4920
          </p>
        </section>
      </div>
    </div>
  );
}

