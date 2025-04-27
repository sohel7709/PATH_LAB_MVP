import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'blue', fullScreen = false, text = 'Loading...' }) => {
  // Size classes
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24'
  };

  // Color classes
  const colorClasses = {
    blue: 'border-blue-600',
    green: 'border-green-600',
    red: 'border-red-600',
    yellow: 'border-yellow-600',
    purple: 'border-purple-600',
    gray: 'border-gray-600'
  };

  // Get the appropriate classes based on props
  const spinnerSize = sizeClasses[size] || sizeClasses.md;
  const spinnerColor = colorClasses[color] || colorClasses.blue;

  // Full screen spinner with overlay
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center space-y-4 max-w-sm mx-auto transform transition-all duration-300 scale-100">
          <div className={`animate-spin rounded-full ${spinnerSize} border-t-2 ${spinnerColor}`}></div>
          {text && <p className="text-gray-700 font-medium text-center">{text}</p>}
        </div>
      </div>
    );
  }

  // Regular spinner
  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className={`animate-spin rounded-full ${spinnerSize} border-t-2 ${spinnerColor}`}></div>
      {text && <p className="text-gray-700 font-medium text-sm">{text}</p>}
    </div>
  );
};

// Skeleton loading component for content
export const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  // Different skeleton types
  const renderSkeleton = () => {
    switch (type) {
      case 'table-row':
        return (
          <div className="animate-pulse flex space-x-4 p-4">
            <div className="h-4 bg-blue-200 rounded w-1/4"></div>
            <div className="h-4 bg-blue-200 rounded w-1/4"></div>
            <div className="h-4 bg-blue-200 rounded w-1/4"></div>
            <div className="h-4 bg-blue-200 rounded w-1/4"></div>
          </div>
        );
      
      case 'card':
        return (
          <div className="animate-pulse bg-white rounded-lg shadow-md p-4 w-full">
            <div className="h-6 bg-blue-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-blue-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-blue-200 rounded w-5/6 mb-2"></div>
            <div className="h-4 bg-blue-200 rounded w-4/6 mb-4"></div>
            <div className="flex justify-end">
              <div className="h-8 bg-blue-200 rounded w-1/4"></div>
            </div>
          </div>
        );
      
      case 'list-item':
        return (
          <div className="animate-pulse flex items-center space-x-4 p-4 border-b border-blue-100">
            <div className="rounded-full bg-blue-200 h-10 w-10"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-blue-200 rounded w-3/4"></div>
              <div className="h-4 bg-blue-200 rounded w-1/2"></div>
            </div>
          </div>
        );
        
      case 'form':
        return (
          <div className="animate-pulse space-y-4 p-4">
            <div className="h-6 bg-blue-200 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-blue-200 rounded w-full mb-4"></div>
            <div className="h-6 bg-blue-200 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-blue-200 rounded w-full mb-4"></div>
            <div className="h-6 bg-blue-200 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-blue-200 rounded w-full mb-4"></div>
            <div className="flex justify-end">
              <div className="h-10 bg-blue-200 rounded w-1/4"></div>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="animate-pulse bg-white rounded-lg p-4">
            <div className="h-4 bg-blue-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-blue-200 rounded w-full mb-2"></div>
          </div>
        );
    }
  };

  // Render multiple skeletons based on count
  return (
    <div className="w-full space-y-4">
      {[...Array(count)].map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </div>
  );
};

// Loading overlay for buttons
export const ButtonLoader = ({ text = 'Loading...' }) => {
  return (
    <div className="inline-flex items-center">
      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {text}
    </div>
  );
};

// Shimmer effect for more advanced loading states
export const ShimmerEffect = ({ width = 'w-full', height = 'h-20' }) => {
  return (
    <div className={`animate-pulse rounded-lg ${width} ${height} bg-gradient-to-r from-blue-100 via-blue-200 to-blue-100 background-animate`}></div>
  );
};

// Export all components
export { LoadingSpinner as default };
