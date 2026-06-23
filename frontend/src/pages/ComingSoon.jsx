import React from 'react';
import { Link } from 'react-router-dom';
import { RocketLaunchIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ComingSoon() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="card max-w-md w-full text-center p-10 page-enter" style={{ boxShadow: 'var(--shadow-md)' }}>
        <div
          className="inline-flex items-center justify-center h-16 w-16 rounded-2xl mb-5"
          style={{ background: 'var(--primary-bg)' }}
        >
          <RocketLaunchIcon className="h-8 w-8" style={{ color: 'var(--primary)' }} />
        </div>
        <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--text)' }}>
          Coming Soon
        </h1>
        <p className="text-base mb-8" style={{ color: 'var(--text-muted)' }}>
          This feature is under development and will be available soon.
        </p>
        <Link to="/dashboard" className="btn btn-primary">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
