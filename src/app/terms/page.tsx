import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이용약관 | CommerceHub',
  description: 'CommerceHub 전자상거래 표준 이용약관',
};

export default function TermsPage() {
  return (
    <div className="container-custom py-12 max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">CommerceHub 전자상거래 이용약관</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          시행일자: 2026년 1월 1일 | 공정거래위원회 표준약관 준수
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 md:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 text-xs md:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">제1조 (목적)</h2>
          <p>
            이 약관은 CommerceHub Inc.(이하 &quot;회사&quot;라 함)가 운영하는 사이버 몰(이하 &quot;몰&quot;이라 함)에서 제공하는 인터넷 관련 전자상거래 서비스(이하 &quot;서비스&quot;라 함)를 이용함에 있어 사이버 몰과 이용자의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">제2조 (용어의 정의)</h2>
          <p>
            1. &quot;몰&quot;이란 회사가 재화 또는 용역을 이용자에게 제공하기 위하여 컴퓨터 등 정보통신설비를 이용하여 재화 등을 거래할 수 있도록 설정한 가상의 영업장을 말합니다.<br />
            2. &quot;이용자&quot;란 &quot;몰&quot;에 접속하여 이 약관에 따라 &quot;몰&quot;이 제공하는 서비스를 받는 회원 및 비회원을 말합니다.<br />
            3. &quot;회원&quot;이라 함은 &quot;몰&quot;에 개인정보를 제공하여 회원등록을 한 자로서, &quot;몰&quot;의 정보를 지속적으로 제공받으며 &quot;몰&quot;이 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">제3조 (청약철회 및 환불)</h2>
          <p>
            1. &quot;몰&quot;과 재화 등의 구매에 관한 계약을 체결한 이용자는 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항에 따른 계약내용에 관한 서면을 받은 날(그보다 재화 등의 공급이 늦게 이루어진 경우에는 재화 등을 공급받거나 재화 등의 공급이 시작된 날을 말합니다)부터 7일 이내에는 청약의 철회를 할 수 있습니다.<br />
            2. 재화 등의 내용이 표시·광고 내용과 다르거나 계약내용과 다르게 이행된 때에는 당해 재화 등을 공급받은 날부터 3월 이내, 그 사실을 안 날 또는 알 수 있었던 날부터 30일 이내에 청약철회 등을 할 수 있습니다.
          </p>
        </section>
      </div>
    </div>
  );
}
