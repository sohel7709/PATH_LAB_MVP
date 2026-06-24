import React from 'react';
import {
  CubeIcon,
  BellAlertIcon,
  CalendarDaysIcon,
  DocumentChartBarIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';

const CAPABILITIES = [
  { icon: CubeIcon, title: 'Track supplies & reagents', desc: 'Keep real-time stock levels for every lab item.' },
  { icon: BellAlertIcon, title: 'Automatic reorder alerts', desc: 'Get notified before you run out of essentials.' },
  { icon: CalendarDaysIcon, title: 'Expiry monitoring', desc: 'Stay ahead of expiration dates and waste.' },
  { icon: DocumentChartBarIcon, title: 'Inventory reports', desc: 'Generate usage and consumption reports.' },
  { icon: WrenchScrewdriverIcon, title: 'Equipment maintenance', desc: 'Schedule and log maintenance for instruments.' },
];

const Inventory = () => {
  return (
    <div className="page-wrapper page-enter">
      <div className="card p-8 md:p-10 max-w-4xl mx-auto">
        <div className="flex flex-col items-center text-center mb-8">
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'var(--primary-bg)' }}
          >
            <CubeIcon className="h-8 w-8" style={{ color: 'var(--primary)' }} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
            Inventory Management
          </h1>
          <span className="badge badge-blue">Coming soon</span>
          <p className="mt-3 max-w-md text-sm" style={{ color: 'var(--text-muted)' }}>
            We're building comprehensive inventory management. Here's what's on the way.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {CAPABILITIES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card card-hover p-4 flex items-start gap-3">
              <div
                className="stat-icon"
                style={{ background: 'var(--surface-2)' }}
              >
                <Icon className="h-5 w-5" style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <h3 className="font-medium text-sm" style={{ color: 'var(--text)' }}>{title}</h3>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm mt-8" style={{ color: 'var(--text-faint)' }}>
          Thank you for your patience as we develop this feature.
        </p>
      </div>
    </div>
  );
};

export default Inventory;
