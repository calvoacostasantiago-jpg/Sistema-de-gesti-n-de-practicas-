interface PaginationProps {
  page: number
  totalPages: number
  totalElements?: number
  onPageChange: (page: number) => void
  disabled?: boolean
}

export function Pagination({
  page,
  totalPages,
  totalElements,
  onPageChange,
  disabled = false,
}: PaginationProps) {
  const canBack = page > 0
  const canNext = totalPages > 0 && page < totalPages - 1

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-slate-500">
        Página <span className="font-medium text-slate-700">{page + 1}</span> de{' '}
        <span className="font-medium text-slate-700">{totalPages || 1}</span>
        {totalElements !== undefined && (
          <> · <span className="font-medium text-slate-700">{totalElements}</span> registros</>
        )}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={!canBack || disabled}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
        >
          ← Anterior
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!canNext || disabled}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
        >
          Siguiente →
        </button>
      </div>
    </div>
  )
}
