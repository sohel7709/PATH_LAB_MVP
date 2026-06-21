import React from 'react';

// Default centered spinner
const LoadingSpinner = ({ size = 'md', color = 'blue', fullScreen = false, text = 'Loading...' }) => {
  const sizeClasses = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12', xl: 'h-16 w-16' };
  const colorClasses = {
    blue: 'border-blue-600', green: 'border-green-600', red: 'border-red-600',
    yellow: 'border-yellow-600', purple: 'border-purple-600', gray: 'border-slate-400',
  };
  const spinnerSize = sizeClasses[size] || sizeClasses.md;
  const spinnerColor = colorClasses[color] || colorClasses.blue;

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-6 flex flex-col items-center gap-3 min-w-[160px]">
          <div className={`animate-spin rounded-full ${spinnerSize} border-2 border-slate-200 ${spinnerColor} border-t-transparent`} />
          {text && <p className="text-sm font-medium text-slate-600 text-center">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className={`animate-spin rounded-full ${spinnerSize} border-2 border-slate-200 ${spinnerColor} border-t-transparent`} />
      {text && <p className="text-sm text-slate-500">{text}</p>}
    </div>
  );
};

// Skeleton loader — rows of shimmer lines
export const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'table-row':
        return (
          <div className="flex gap-4 p-4">
            <div className="skeleton h-4 flex-1" />
            <div className="skeleton h-4 flex-1" />
            <div className="skeleton h-4 flex-1" />
            <div className="skeleton h-4 w-20" />
          </div>
        );
      case 'list-item':
        return (
          <div className="flex items-center gap-3 p-4 border-b border-slate-100">
            <div className="skeleton h-9 w-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          </div>
        );
      case 'form':
        return (
          <div className="p-4 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-10 w-full" />
              </div>
            ))}
          </div>
        );
      case 'card':
      default:
        return (
          <div className="p-5 space-y-3">
            <div className="skeleton h-5 w-2/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-4 w-3/4" />
          </div>
        );
    }
  };

  return (
    <div className="w-full space-y-2">
      {[...Array(count)].map((_, i) => <div key={i}>{renderSkeleton()}</div>)}
    </div>
  );
};

// Full-page loader
export const PageLoader = ({ text = 'Loading...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-3">
      <div className="animate-spin rounded-full h-12 w-12 border-2 border-slate-200 border-blue-600 border-t-transparent" />
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  </div>
);

// Button loader (inline)
export const ButtonLoader = ({ text = 'Loading...' }) => (
  <div className="inline-flex items-center gap-2">
    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
    {text}
  </div>
);

// Shimmer effect
export const ShimmerEffect = ({ width = 'w-full', height = 'h-20' }) => (
  <div className={`skeleton ${width} ${height}`} />
);

export { LoadingSpinner as default };
