import React from 'react';
import {
  ChartBarIcon,
  DocumentMagnifyingGlassIcon,
  BanknotesIcon,
  ReceiptPercentIcon,
  DocumentArrowDownIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline';

const PLANNED_FEATURES = [
  {
    icon: ChartBarIcon,
    iconBg: '#dbeafe',
    iconColor: '#2563eb',
    title: 'Revenue by Test Type',
    desc: 'Break down earnings per test category, doctor, or time period.',
  },
  {
    icon: BanknotesIcon,
    iconBg: '#d1fae5',
    iconColor: '#059669',
    title: 'Expense Tracking',
    desc: 'Track expenses and automatically calculate profit margins.',
  },
  {
    icon: ReceiptPercentIcon,
    iconBg: '#fef3c7',
    iconColor: '#d97706',
    title: 'Payment Collection',
    desc: 'Analyze collection efficiency and outstanding dues at a glance.',
  },
  {
    icon: DocumentMagnifyingGlassIcon,
    iconBg: '#f3e8ff',
    iconColor: '#9333ea',
    title: 'Insurance Claims',
    desc: 'Monitor insurance claim status and approval timelines.',
  },
  {
    icon: DocumentArrowDownIcon,
    iconBg: '#fee2e2',
    iconColor: '#dc2626',
    title: 'Export to Accounting',
    desc: 'Export financial data in formats compatible with Tally and Excel.',
  },
  {
    icon: ChartPieIcon,
    iconBg: '#f0fdfa',
    iconColor: '#0d9488',
    title: 'Custom Dashboards',
    desc: 'Create personalized financial dashboards for your lab.',
  },
];

const FinancialReports = () => {
  return (
    <div className="page-enter max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Hero Card */}
      <div className="card p-8 text-center">
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--success-bg)' }}
        >
          <ChartBarIcon className="h-8 w-8" style={{ color: 'var(--success)' }} />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'var(--text)' }}>
          Financial Reports
        </h1>
        <p className="text-base mb-4" style={{ color: 'var(--text-2)' }}>
          Comprehensive financial reporting is on its way.
        </p>

        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
          style={{ background: 'var(--warning)', color: '#fff' }}
        >
          <span className="h-2 w-2 rounded-full bg-white animate-pulse inline-block" />
          In Development
        </div>
      </div>

      {/* Planned Features Grid */}
      <div>
        <h2 className="section-title mb-4">What&apos;s Coming</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PLANNED_FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.title} className="card p-5 flex items-start gap-4">
                <div
                  className="flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{ background: feat.iconBg }}
                >
                  <Icon className="h-5 w-5" style={{ color: feat.iconColor }} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
                    {feat.title}
                  </h3>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer note */}
      <p className="text-center text-sm pb-4" style={{ color: 'var(--text-faint)' }}>
        Thank you for your patience while we build this feature.
      </p>
    </div>
  );
};

export default FinancialReports;
