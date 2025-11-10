import React from 'react';

export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'text',
  width,
  height,
  animation = 'pulse',
}) => {
  const baseClasses = 'bg-earth-200';

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-wave',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1rem' : undefined),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
};

export interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({ lines = 3, className = '' }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          height="0.75rem"
          width={index === lines - 1 ? '80%' : '100%'}
        />
      ))}
    </div>
  );
};

export interface SkeletonCardProps {
  className?: string;
  hasImage?: boolean;
  hasAvatar?: boolean;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  className = '',
  hasImage = false,
  hasAvatar = false,
}) => {
  return (
    <div className={`border border-earth-200 rounded-lg p-4 space-y-4 ${className}`}>
      {hasImage && <Skeleton variant="rectangular" height="12rem" />}
      <div className="space-y-3">
        {hasAvatar && (
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" width="2.5rem" height="2.5rem" />
            <div className="flex-1 space-y-2">
              <Skeleton variant="text" height="0.875rem" width="40%" />
              <Skeleton variant="text" height="0.75rem" width="30%" />
            </div>
          </div>
        )}
        <Skeleton variant="text" height="1rem" width="60%" />
        <SkeletonText lines={2} />
      </div>
    </div>
  );
};

export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  className = '',
}) => {
  return (
    <div className={`border border-earth-200 rounded-lg overflow-hidden ${className}`}>
      {/* Table Header */}
      <div className="bg-earth-50 border-b border-earth-200 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} variant="text" height="0.875rem" width="70%" />
          ))}
        </div>
      </div>
      {/* Table Rows */}
      <div className="divide-y divide-earth-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div
              className="grid gap-4"
              style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
            >
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} variant="text" height="0.75rem" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
