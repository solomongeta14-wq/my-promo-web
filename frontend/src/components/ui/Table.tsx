import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface Column<T> {
  key: string
  header: string
  render?: (row: T, index: number) => ReactNode
  className?: string
  headerClassName?: string
  sortable?: boolean
}

interface TableProps<T> {
  data: T[]
  columns: Column<T>[]
  keyExtractor: (row: T) => string
  isLoading?: boolean
  emptyMessage?: string
  onRowClick?: (row: T) => void
  striped?: boolean
  hoverable?: boolean
  className?: string
}

export function Table<T>({
  data,
  columns,
  keyExtractor,
  isLoading,
  emptyMessage = 'No data available',
  onRowClick,
  striped = true,
  hoverable = true,
  className,
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} className={clsx('px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider', col.headerClassName)}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {[...Array(5)].map((_, i) => (
              <tr key={i} className={clsx(hoverable && 'hover:bg-neutral-50')}>
                {columns.map(col => (
                  <td key={col.key} className={clsx('px-4 py-3 text-neutral-400', col.className)}>
                    <div className="h-4 w-3/4 bg-neutral-200 rounded animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="mx-auto h-12 w-12 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="mt-2 text-neutral-500">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table className="w-full" role="table">
        <thead className="bg-neutral-50">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={clsx(
                  'px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider',
                  col.headerClassName
                )}
                scope="col"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200 bg-white">
          {data.map((row, rowIndex) => (
            <tr
              key={keyExtractor(row)}
              className={clsx(
                striped && rowIndex % 2 === 0 && 'bg-neutral-50/50',
                hoverable && 'hover:bg-neutral-50',
                onRowClick && 'cursor-pointer'
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map(col => (
                <td
                  key={col.key}
                  className={clsx('px-4 py-3 text-sm text-neutral-900', col.className)}
                >
                  {col.render ? col.render(row, rowIndex) : String((row as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showPageNumbers?: boolean
}

export function Pagination({ currentPage, totalPages, onPageChange, showPageNumbers = true }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = showPageNumbers
    ? Array.from({ length: totalPages }, (_, i) => i + 1)
    : []

  return (
    <nav className="flex items-center justify-between px-4 py-3 border-t border-neutral-200" aria-label="Pagination">
      <div className="text-sm text-neutral-500">
        Page {currentPage} of {totalPages}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="btn-secondary btn-sm"
          aria-label="Previous page"
        >
          Previous
        </button>
        {showPageNumbers && (
          <div className="flex items-center gap-1">
            {pages.map(page => (
              page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1) ? (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    page === currentPage
                      ? 'bg-primary-600 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  )}
                  aria-current={page === currentPage ? 'page' : undefined}
                >
                  {page}
                </button>
              ) : page === currentPage - 2 || page === currentPage + 2 ? (
                <span key={page} className="px-2 text-neutral-400">...</span>
              ) : null
            ))}
          </div>
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="btn-secondary btn-sm"
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </nav>
  )
}