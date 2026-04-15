import { useState } from 'react'
import { X, Mail, Lock, Eye, EyeOff, Zap, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'

interface Props {
  onClose: () => void
}

type Mode = 'login' | 'register'

export default function AuthModal({ onClose }: Props) {
  const { login, register, signInAnon } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!email || !password) { toast.error('メールアドレスとパスワードを入力してください'); return }
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
        toast.success('ログインしました')
      } else {
        await register(email, password)
        toast.success('アカウントを作成しました')
      }
      onClose()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'エラーが発生しました'
      toast.error(msg.includes('email-already') ? 'このメールアドレスは既に使用されています' :
        msg.includes('wrong-password') || msg.includes('invalid-credential') ? 'メールアドレスまたはパスワードが間違っています' :
        msg.includes('weak-password') ? 'パスワードは6文字以上にしてください' : msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleAnon() {
    setLoading(true)
    try {
      await signInAnon()
      toast.success('匿名モードで開始します')
      onClose()
    } catch {
      toast.error('エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="glass-card rounded-2xl w-full max-w-md p-8 relative shadow-2xl">
        {/* Close */}
        <button onClick={onClose} className="absolute top-5 right-5 text-text-muted hover:text-text transition-colors">
          <X size={18} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-accent/20 border border-accent/30 flex items-center justify-center">
            <Zap size={16} className="text-accent" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight text-text">TopicPick</span>
        </div>

        <h2 className="font-display font-bold text-2xl text-text mb-1">
          {mode === 'login' ? 'おかえりなさい' : 'アカウント作成'}
        </h2>
        <p className="text-text-muted text-sm mb-7">
          {mode === 'login' ? 'トピックをもう一度確認しましょう' : '無料で始められます。登録は30秒。'}
        </p>

        {/* Inputs */}
        <div className="space-y-3 mb-6">
          <div className="relative">
            <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full pl-10 pr-4 py-3 bg-bg-surface3 border border-border rounded-xl text-text text-sm placeholder:text-text-dim focus:outline-none focus:border-accent/50 transition-colors"
            />
          </div>
          <div className="relative">
            <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="パスワード"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full pl-10 pr-10 py-3 bg-bg-surface3 border border-border rounded-xl text-text text-sm placeholder:text-text-dim focus:outline-none focus:border-accent/50 transition-colors"
            />
            <button onClick={() => setShowPw(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors">
              {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </div>

        {/* Primary CTA */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all duration-150 active:scale-[0.98] mb-3"
        >
          {loading ? '処理中...' : mode === 'login' ? 'ログイン' : 'アカウント作成'}
        </button>

        {/* Toggle mode */}
        <button
          onClick={() => setMode(m => m === 'login' ? 'register' : 'login')}
          className="w-full py-2 text-text-muted hover:text-text text-sm transition-colors mb-4"
        >
          {mode === 'login' ? 'アカウントをお持ちでない方はこちら' : '既にアカウントをお持ちの方はこちら'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-text-dim text-xs">または</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Anonymous */}
        <button
          onClick={handleAnon}
          disabled={loading}
          className="w-full py-3 bg-bg-surface3 hover:bg-bg-surface3/80 border border-border hover:border-border-hover text-text-muted hover:text-text text-sm rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <User size={14} />
          匿名モードで始める（最大{3}トピック）
        </button>
      </div>
    </div>
  )
}
