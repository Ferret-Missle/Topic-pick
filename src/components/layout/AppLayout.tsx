import { useState } from 'react'
import { Menu, X, Zap } from 'lucide-react'
import Sidebar from './Sidebar'
import TopicDetailPane from '../topics/TopicDetailPane'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-bg">
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 z-50 animate-slide-in">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-bg-surface flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-bg-surface3 text-text-muted hover:text-text transition-colors"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center">
              <Zap size={12} className="text-accent" />
            </div>
            <span className="font-display font-bold text-sm text-text">TopicPick</span>
          </div>
          {sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto p-1.5 rounded-lg hover:bg-bg-surface3 text-text-muted transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <TopicDetailPane />
      </div>
    </div>
  )
}
