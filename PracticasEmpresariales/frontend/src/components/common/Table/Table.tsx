import { ReactNode } from 'react'

interface TableProps {
  headers: (string | ReactNode)[]
  loading?: boolean
  empty?: boolean
  emptyMessage?: string
  emptyIcon?: string
  children: ReactNode
}

export function Table({
  headers,
  loading = false,
  empty = false,
  emptyMessage = 'No hay datos para mostrar.',
  emptyIcon = '📋',
  children,
}: TableProps) {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {loading ? (
            <tr>
              <td colSpan={headers.length} className="py-12">
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-slate-200 border-t-cue-accent" />
                </div>
              </td>
            </tr>
          ) : empty ? (
            <tr>
              <td colSpan={headers.length} className="py-16 text-center">
                <div className="text-slate-300 text-4xl mb-3">{emptyIcon}</div>
                <p className="text-slate-400 text-sm">{emptyMessage}</p>
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  )
}
