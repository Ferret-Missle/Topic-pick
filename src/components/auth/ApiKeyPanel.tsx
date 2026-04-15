import { useState } from 'react'
import { Key, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'
import { saveApiKey, getSavedApiKey } from '../../services/aiService'
import toast from 'react-hot-toast'

export default function ApiKeyPanel() {
  const [key, setKey] = useState(getSavedApiKey())
  const [show, setShow] = useState(false)

  function handleSave() {
    if (!key.startsWith('sk-ant-')) {
      toast.error('有効なAnthropicのAPIキーを入力してください')
      return
    }
    saveApiKey(key)
    toast.success('APIキーを保存しました')
  }

  const saved = getSavedApiKey()
  const isValid = saved.startsWith('sk-ant-')

  return (
    <div className="p-4 bg-bg-surface2 border border-border rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <Key size={14} className="text-accent" />
        <span className="text-sm font-semibold text-text font-display">Anthropic APIキー</span>
        {isValid && <Check size={12} className="text-daily ml-auto" />}
        {!isValid && <AlertCircle size={12} className="text-danger ml-auto" />}
      </div>

      <p className="text-xs text-text-muted mb-3 leading-relaxed">
        AIによる情報取得に使用します。<br />
        <a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
          Anthropic Console
        </a> から取得できます。
      </p>

      <div className="relative mb-2">
        <input
          type={show ? 'text' : 'password'}
          placeholder="sk-ant-..."
          value={key}
          onChange={e => setKey(e.target.value)}
          className="w-full pr-10 pl-3 py-2.5 bg-bg-surface3 border border-border rounded-lg text-xs text-text font-mono placeholder:text-text-dim focus:outline-none focus:border-accent/50 transition-colors"
        />
        <button
          onClick={() => setShow(s => !s)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
        >
          {show ? <EyeOff size={13} /> : <Eye size={13} />}
        </button>
      </div>

      <button
        onClick={handleSave}
        className="w-full py-2 bg-accent/10 hover:bg-accent/20 border border-accent/30 hover:border-accent/50 text-accent text-xs font-semibold rounded-lg transition-all"
      >
        保存する
      </button>
    </div>
  )
}
