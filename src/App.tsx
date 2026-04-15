import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { TopicsProvider } from './contexts/TopicsContext'
import { ThemeProvider } from './contexts/ThemeContext'
import AppLayout from './components/layout/AppLayout'
import LoadingScreen from './components/common/LoadingScreen'

function AppContent() {
  const { loading } = useAuth()
  if (loading) return <LoadingScreen />
  return (
    <TopicsProvider>
      <AppLayout />
    </TopicsProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: 'rgb(var(--color-bg-surface))',
              border: '1px solid rgb(var(--color-border))',
              color: 'rgb(var(--color-text))',
              fontSize: '13px',
              fontFamily: 'Figtree, sans-serif',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-card)',
            },
            success: {
              iconTheme: { primary: 'rgb(var(--color-daily))', secondary: 'rgb(var(--color-bg-surface))' },
            },
            error: {
              iconTheme: { primary: 'rgb(var(--color-danger))', secondary: 'rgb(var(--color-bg-surface))' },
            },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  )
}
