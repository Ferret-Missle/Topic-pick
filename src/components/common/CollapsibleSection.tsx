import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface Props {
  title: string
  content: string          // raw text to count chars
  children: ReactNode
  defaultOpen?: boolean
  accent?: 'blue' | 'green' | 'amber'
  badge?: string
}

const accentClasses = {
  blue: 'text-accent border-accent/20 hover:border-accent/40',
  green: 'text-daily border-daily/20 hover:border-daily/40',
  amber: 'text-warm border-warm/20 hover:border-warm/40',
}

export default function CollapsibleSection({
  title,
  content,
  children,
  defaultOpen = true,
  accent = 'blue',
  badge,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)
  const charCount = content.length

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`
          w-full flex items-center gap-3 px-4 py-3
          bg-bg-surface2/50 hover:bg-bg-surface3/50
          border-b transition-all duration-150 text-left
          ${open ? `border-border ${accentClasses[accent].split(' ')[1]}` : 'border-transparent'}
        `}
      >
        <span className={`transition-transform duration-200 ${open ? 'rotate-0' : '-rotate-90'} ${accentClasses[accent].split(' ')[0]}`}>
          <ChevronDown size={14} />
        </span>

        <span className={`font-display font-semibold text-sm tracking-wide ${accentClasses[accent].split(' ')[0]}`}>
          {title}
        </span>

        {badge && (
          <span className="ml-1 px-1.5 py-0.5 text-[10px] font-mono bg-accent/10 text-accent rounded-full border border-accent/20">
            {badge}
          </span>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="font-mono text-[11px] text-text-dim tabular-nums">
            {charCount.toLocaleString()} 文字
          </span>
          <span className={`text-text-dim transition-transform duration-200 ${open ? '' : ''}`}>
            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
        </div>
      </button>

      {/* Content */}
      <div className={`collapsible-content ${open ? 'open' : 'closed'}`}>
        <div className="p-4 bg-bg-surface/30">
          {children}
        </div>
      </div>
    </div>
  )
}
