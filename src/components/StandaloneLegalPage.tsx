import React from 'react';
import { Shield, ArrowLeft, Lock, FileText, CheckCircle } from 'lucide-react';

interface StandaloneLegalPageProps {
  page: 'terms' | 'privacy' | 'cookies';
  content: {
    fulfillmentTerms: string;
    privacyPolicy: string;
    cookiesPolicy: string;
  };
  theme: 'light' | 'dark';
  onBack: () => void;
}

export default function StandaloneLegalPage({ page, content, theme, onBack }: StandaloneLegalPageProps) {
  // Update browser hash on navigation clicks
  const navigateTo = (targetPage: 'terms' | 'privacy' | 'cookies') => {
    window.location.hash = `#/${targetPage}`;
  };

  const getActiveTitle = () => {
    if (page === 'terms') return 'Terms of Fulfillment & Marketplace Services';
    if (page === 'privacy') return 'Data Protection & Privacy Policy';
    return 'Cookie & Browser Session Policy';
  };

  const getActiveText = () => {
    if (page === 'terms') return content.fulfillmentTerms;
    if (page === 'privacy') return content.privacyPolicy;
    return content.cookiesPolicy;
  };

  const formatText = (text: string) => {
    if (!text) return <p className="text-sm text-neutral-400">Loading document content...</p>;
    return text.split('\n\n').map((para, i) => (
      <p key={i} className="text-sm leading-relaxed mb-4 text-neutral-600 dark:text-neutral-300 font-medium">
        {para}
      </p>
    ));
  };

  return (
    <div id="standalone-legal-root" className={`min-h-screen font-sans flex flex-col transition-colors duration-200 ${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-[#FAFAF9] text-neutral-900'}`}>
      {/* Pristine Navigation Topbar */}
      <header className={`sticky top-0 z-50 border-b backdrop-blur-md ${theme === 'dark' ? 'bg-slate-950/80 border-slate-900' : 'bg-white/80 border-neutral-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className={`cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-colors border-0 bg-transparent ${theme === 'dark' ? 'text-neutral-400 hover:text-white' : 'text-neutral-600 hover:text-neutral-900'}`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Portal</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-sans font-black tracking-tight text-md">
              90's.<span className="text-emerald-600">emitsphere</span>
            </span>
            <span className="text-[10px] uppercase font-bold bg-[#FF5E2A]/10 text-[#FF5E2A] border border-[#FF5E2A]/20 px-2 py-0.5 rounded cursor-default">
              Legal
            </span>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid md:grid-cols-4 gap-8">
          
          {/* Left Navigation Sidebar */}
          <div className="md:col-span-1 space-y-2">
            <div className="mb-4">
              <span className="text-[9px] uppercase font-black tracking-widest bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 px-3 py-1.5 rounded-full text-center block">
                Compliance Center
              </span>
            </div>
            
            <button
              onClick={() => navigateTo('terms')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-between border-0 cursor-pointer ${
                page === 'terms'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : theme === 'dark'
                  ? 'bg-slate-900/40 text-neutral-400 hover:text-white hover:bg-slate-900'
                  : 'bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 shadow-sm border border-neutral-200/40'
              }`}
            >
              <span>Fulfillment Services</span>
              <FileText className="w-4 h-4 ml-2" />
            </button>

            <button
              onClick={() => navigateTo('privacy')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-between border-0 cursor-pointer ${
                page === 'privacy'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : theme === 'dark'
                  ? 'bg-slate-900/40 text-neutral-400 hover:text-white hover:bg-slate-900'
                  : 'bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 shadow-sm border border-neutral-200/40'
              }`}
            >
              <span>Privacy Policy</span>
              <Shield className="w-4 h-4 ml-2" />
            </button>

            <button
              onClick={() => navigateTo('cookies')}
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-between border-0 cursor-pointer ${
                page === 'cookies'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : theme === 'dark'
                  ? 'bg-slate-900/40 text-neutral-400 hover:text-white hover:bg-slate-900'
                  : 'bg-white text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 shadow-sm border border-neutral-200/40'
              }`}
            >
              <span>Cookies Policy</span>
              <Shield className="w-4 h-4 ml-2" />
            </button>

            <div className={`mt-6 p-4 rounded-2xl hidden md:block text-[10px] text-neutral-400 dark:text-neutral-500 font-semibold leading-relaxed border ${theme === 'dark' ? 'border-slate-900 bg-slate-950/25' : 'border-neutral-200 bg-white'}`}>
              <p>Last Audited: <span className="font-bold text-neutral-700 dark:text-neutral-300">June 16, 2026</span></p>
              <p className="mt-1">Jurisdiction: <span className="font-bold text-neutral-700 dark:text-neutral-300">Lagos State, Nigeria</span></p>
            </div>
          </div>

          {/* Right Document Column */}
          <div className="md:col-span-3 space-y-6">
            
            {/* Payment security badge box */}
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl flex items-start gap-3.5">
              <div className="p-2 bg-emerald-600 text-white rounded-xl">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  🔒 Bank-Grade Secure Payment Enforcement
                </h4>
                <p className="text-xs font-semibold leading-relaxed text-neutral-600 dark:text-neutral-300 mt-1">
                  All marketplace finances, partner commission splits, and payouts process exclusively through <strong>Paystack's PCI-DSS compliant checkout gateway</strong>. We hold absolutely no raw card data on our local databases.
                </p>
              </div>
            </div>

            {/* Document Content Sheet */}
            <div className={`p-6 sm:p-10 rounded-3xl border shadow-xl ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-neutral-200 text-neutral-800'}`}>
              <h1 className="text-2xl sm:text-3xl font-black text-neutral-950 dark:text-white tracking-tight mb-2">
                {getActiveTitle()}
              </h1>
              <div className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest mb-6 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified Legal Document</span>
              </div>

              <div className="prose prose-neutral max-w-none text-left">
                {formatText(getActiveText())}
              </div>
            </div>

            {/* Quick Action bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-250">
              <span className="text-[11px] text-neutral-400 font-semibold">
                By browsing, you certify your agreement with our legal framework.
              </span>
              <button
                onClick={onBack}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md cursor-pointer border-0"
              >
                Return to main home
              </button>
            </div>

          </div>

        </div>
      </main>

      {/* Standalone Legal Footer */}
      <footer className={`py-6 mt-12 border-t text-center ${theme === 'dark' ? 'bg-slate-950 border-slate-900' : 'bg-white border-neutral-200'}`}>
        <p className="text-[10px] text-neutral-400 font-semibold">
          &copy; 2026 90's.emitsphere Logistics Ecosystem. All transactions secured globally by Paystack.
        </p>
      </footer>
    </div>
  );
}
