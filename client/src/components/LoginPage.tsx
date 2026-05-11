import { type FormEvent, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { login } from '../lib/api.ts'

type LoginPageProps = {
  onLogin: () => void
}

function LoginPage({ onLogin }: LoginPageProps) {
  const { t } = useTranslation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      await login(username.trim(), password)
      onLogin()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="login-page shell">
      <div className="login-card card">
        <p className="eyebrow">{t('admin.eyebrow')}</p>
        <h1 className="login-title">{t('login.title')}</h1>

        {error ? <p className="admin-status admin-status-error">{error}</p> : null}

        <form className="admin-form login-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>{t('login.username')}</span>
            <input
              type="text"
              value={username}
              autoComplete="username"
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span>{t('login.password')}</span>
            <input
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button className="button button-primary" type="submit" disabled={isLoading}>
            {isLoading ? t('login.signingIn') : t('login.submit')}
          </button>
        </form>

        <a className="login-back" href="/">
          {t('login.backToSite')}
        </a>
      </div>
    </main>
  )
}

export default LoginPage
