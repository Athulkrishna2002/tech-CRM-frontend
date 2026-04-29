import React, { useState } from 'react'
import './App.css'
import UsersPage from './UsersPage'

type Page = 'login' | 'users'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [page, setPage] = useState<Page>(() => (localStorage.getItem('accessToken') ? 'users' : 'login'))

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    setAccessToken(null)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        if (res.status === 401) {
          setError('Invalid email or password.')
          return
        }
        setError(`Login failed (HTTP ${res.status}).`)
        return
      }

      const data: {
        tokenType: string
        accessToken: string
        accessTokenExpiresInSeconds: number
        refreshToken: string
        refreshTokenExpiresInSeconds: number
      } = await res.json()

      localStorage.setItem('tokenType', data.tokenType)
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      localStorage.setItem(
        'accessTokenExpiresInSeconds',
        String(data.accessTokenExpiresInSeconds),
      )
      localStorage.setItem(
        'refreshTokenExpiresInSeconds',
        String(data.refreshTokenExpiresInSeconds),
      )

      setAccessToken(data.accessToken)
      setPage('users')
    } catch {
      setError('Network error. Is the backend running on http://localhost:9090 ?')
    } finally {
      setIsLoading(false)
    }
  }

  function logout() {
    localStorage.removeItem('tokenType')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('accessTokenExpiresInSeconds')
    localStorage.removeItem('refreshTokenExpiresInSeconds')
    setAccessToken(null)
    setPage('login')
  }

  if (page === 'users') {
    return <UsersPage onLogout={logout} />
  }

  return (
    <main className="page">
      <div className="card">
        <div className="brand">
          <div className="logo" aria-hidden="true">
            T
          </div>
          <div>
            <h1>Login</h1>
            <p className="muted">Use your email and password to continue.</p>
          </div>
        </div>

        <form className="form" onSubmit={onSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              name="email"
              autoComplete="email"
              placeholder="achu@example.com"
              required
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="••••••••"
              required
            />
          </label>

          {error ? <div className="alert error">{error}</div> : null}

          {accessToken ? (
            <div className="alert success">
              Logged in. Redirecting to users…
            </div>
          ) : null}

          <button className="btn" type="submit" disabled={isLoading}>
            {isLoading ? 'Signing in…' : 'login'}
          </button>
        </form>

        <div className="footer">
        </div>
      </div>
    </main>
  )
}

export default App
