import { Zap } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-bg">
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-accent/15 border border-accent/25 flex items-center justify-center glow-blue">
          <Zap size={24} className="text-accent animate-pulse-soft" />
        </div>
        <div className="absolute inset-0 rounded-2xl border border-accent/20 animate-ping opacity-30" />
      </div>
      <p className="mt-6 text-text-muted text-sm font-display">TopicPick</p>
      <p className="mt-1 text-text-dim text-xs">読み込み中...</p>
    </div>
  )
}
