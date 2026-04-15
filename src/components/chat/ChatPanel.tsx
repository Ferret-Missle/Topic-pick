import { useState, useRef, useEffect } from 'react'
import { Send, X, Bot, Sparkles } from 'lucide-react'
import { chatWithAI } from '../../services/aiService'
import type { ChatMessage } from '../../types'
import { useTopics } from '../../contexts/TopicsContext'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

interface Props {
  mode: 'add' | 'change'
  onClose: () => void
  onConfirm: (topicName: string, description: string) => void
}

export default function ChatPanel({ mode, onClose, onConfirm }: Props) {
  const { topics } = useTopics()
  const { appUser } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestedTopic, setSuggestedTopic] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const currentTopicNames = topics.map(t => t.name)

  // Initial greeting
  useEffect(() => {
    const greeting: ChatMessage = {
      id: 'init',
      role: 'assistant',
      content: mode === 'add'
        ? `こんにちは！新しいトピックを追加しましょう。\n\nどんな情報を定期的にウォッチしたいですか？例えば「最新のAI技術」「日本の防衛産業」「半導体市場」など、関心のある分野を教えてください。`
        : `トピックの変更をお手伝いします。\n\n現在登録中のトピック：\n${currentTopicNames.map(n => `・${n}`).join('\n')}\n\nどのトピックを変更したいですか？または、新しく気になっている分野はありますか？`,
      timestamp: new Date(),
    }
    setMessages([greeting])
  }, [mode])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Extract topic name suggestion from AI response
  function extractSuggestion(text: string): string | null {
    const patterns = [
      /トピック名[：:]\s*(.+)/,
      /新しいトピック名[：:]\s*(.+)/,
      /「(.+?)」というトピック/,
      /【(.+?)】/,
    ]
    for (const p of patterns) {
      const m = text.match(p)
      if (m) return m[1].trim()
    }
    return null
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    if (!appUser) { toast.error('ログインが必要です'); return }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)

    try {
      const allMessages = [...messages, userMsg]
      const reply = await chatWithAI(allMessages, currentTopicNames, mode)
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
      }
      setMessages(m => [...m, assistantMsg])

      const suggestion = extractSuggestion(reply)
      if (suggestion) setSuggestedTopic(suggestion)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-bg-surface2 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-accent/15 border border-accent/25 flex items-center justify-center">
          <Bot size={14} className="text-accent" />
        </div>
        <div>
          <p className="text-sm font-display font-semibold text-text">
            {mode === 'add' ? 'トピックを追加' : 'トピックを変更'}
          </p>
          <p className="text-[11px] text-text-muted">AIアシスタントに相談</p>
        </div>
        <button onClick={onClose} className="ml-auto text-text-muted hover:text-text transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center mr-2 flex-shrink-0 mt-0.5">
                <Sparkles size={11} className="text-accent" />
              </div>
            )}
            <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-accent/15 border border-accent/25 text-text rounded-tr-sm'
                : 'bg-bg-surface3 border border-border text-text rounded-tl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start animate-fade-in">
            <div className="w-6 h-6 rounded-full bg-accent/15 border border-accent/25 flex items-center justify-center mr-2 mt-0.5">
              <Sparkles size={11} className="text-accent animate-pulse-soft" />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-bg-surface3 border border-border">
              <div className="flex gap-1.5 items-center h-4">
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggested topic confirm */}
      {suggestedTopic && (
        <div className="mx-4 mb-3 p-3 bg-daily/10 border border-daily/25 rounded-xl animate-fade-in">
          <p className="text-xs text-text-muted mb-1.5">提案されたトピック</p>
          <p className="text-sm font-semibold text-daily mb-2">「{suggestedTopic}」</p>
          <div className="flex gap-2">
            <button
              onClick={() => onConfirm(suggestedTopic, '')}
              className="flex-1 py-1.5 bg-daily/15 hover:bg-daily/25 border border-daily/30 text-daily text-xs font-semibold rounded-lg transition-all"
            >
              このトピックを追加
            </button>
            <button
              onClick={() => setSuggestedTopic(null)}
              className="px-3 py-1.5 text-text-muted hover:text-text text-xs transition-colors"
            >
              他を検討
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border bg-bg-surface flex-shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="メッセージを入力..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            disabled={loading}
            className="flex-1 px-3.5 py-2.5 bg-bg-surface3 border border-border rounded-xl text-sm text-text placeholder:text-text-dim focus:outline-none focus:border-accent/50 transition-colors disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="px-3 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl transition-all active:scale-95"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
