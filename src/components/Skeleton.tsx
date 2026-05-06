import React from 'react'

interface SkeletonProps {
  className?: string
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`skeleton ${className}`} />
)

export const CardSkeleton: React.FC = () => (
  <div className="card animate-pulse">
    <div className="skeleton h-5 w-3/4 mb-3 rounded" />
    <div className="skeleton h-4 w-full mb-2 rounded" />
    <div className="skeleton h-4 w-5/6 mb-4 rounded" />
    <div className="flex items-center gap-2 mb-4">
      <div className="skeleton h-4 w-4 rounded-full" />
      <div className="skeleton h-4 w-24 rounded" />
    </div>
    <div className="skeleton h-9 w-full rounded-lg" />
  </div>
)

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 5 }) => (
  <tr className="border-b border-gray-50">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-6 py-4">
        <div className="skeleton h-4 rounded" style={{ width: `${Math.random() * 40 + 40}%` }} />
      </td>
    ))}
  </tr>
)

export const StatSkeleton: React.FC = () => (
  <div className="card animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="skeleton h-4 w-24 rounded" />
      <div className="skeleton h-10 w-10 rounded-xl" />
    </div>
    <div className="skeleton h-8 w-16 rounded mb-1" />
    <div className="skeleton h-3 w-20 rounded" />
  </div>
)
