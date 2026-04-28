import React, { useEffect, useMemo, useState } from 'react'
import './App.css'

type Page = 'login' | 'users'

type User = {
  id?: number | string
  name?: string
  email?: string
  status?: number
  userGrpId?: number
}

function getAuthHeader() {
  const tokenType = localStorage.getItem('tokenType') || 'Bearer'
  const accessToken = localStorage.getItem('accessToken')
  if (!accessToken) return {}
  return { Authorization: `${tokenType} ${accessToken}` }
}

function UsersPage({ onLogout }: { onLogout: () => void }) {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<number>(1)
  const [userGrpId, setUserGrpId] = useState<number>(1)

  const authHeaders = useMemo(() => getAuthHeader(), [])

  async function loadUsers() {
    setError(null)
    setSuccess(null)
    setIsLoading(true)
    try {
      const res = await fetch('/api/users/list-all-user', {
        headers: {
          ...authHeaders,
        },
      })

      if (!res.ok) {
        if (res.status === 401) {
          setError('Unauthorized. Please login again.')
          return
        }
        setError(`Failed to load users (HTTP ${res.status}).`)
        return
      }

      const raw = await res.json()
      const list: unknown =
        Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : raw?.content

      setUsers(Array.isArray(list) ? (list as User[]) : [])
    } catch {
      setError('Network error while loading users.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsLoading(true)

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          name,
          email,
          password,
          status: Number(status),
          userGrpId: Number(userGrpId),
        }),
      })

      if (!res.ok) {
        if (res.status === 401) {
          setError('Unauthorized. Please login again.')
          return
        }
        const txt = await res.text().catch(() => '')
        setError(`Create user failed (HTTP ${res.status}). ${txt}`.trim())
        return
      }

      setSuccess('User created successfully.')
      setName('')
      setEmail('')
      setPassword('')
      setStatus(1)
      setUserGrpId(1)
      await loadUsers()
    } catch {
      setError('Network error while creating user.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="page">
      <div className="card cardWide">
        <div className="brand">
          <div className="logo" aria-hidden="true">
            T
          </div>
          <div className="brandRow">
            <div>
              <h1>Users</h1>
              <p className="muted">View all users and create a new user.</p>
            </div>
            <div className="brandActions">
              <button className="btn btnSecondary" type="button" onClick={loadUsers} disabled={isLoading}>
                Refresh
              </button>
              <button className="btn btnSecondary" type="button" onClick={onLogout}>
                Logout
              </button>
            </div>
          </div>
        </div>

        {error ? <div className="alert error">{error}</div> : null}
        {success ? <div className="alert success">{success}</div> : null}

        <section className="section">
          <h2 className="sectionTitle">Create user</h2>
          <form className="form formGrid" onSubmit={onCreateUser}>
            <label className="field">
              <span>Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Achu" required />
            </label>
            <label className="field">
              <span>Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="achu.@example.com"
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="achu123"
                required
              />
            </label>
            <label className="field">
              <span>Status</span>
              <input
                value={String(status)}
                onChange={(e) => setStatus(Number(e.target.value))}
                inputMode="numeric"
                placeholder="1"
                required
              />
            </label>
            <label className="field">
              <span>User Group Id</span>
              <input
                value={String(userGrpId)}
                onChange={(e) => setUserGrpId(Number(e.target.value))}
                inputMode="numeric"
                placeholder="1"
                required
              />
            </label>

            <button className="btn formSpan" type="submit" disabled={isLoading}>
              {isLoading ? 'Saving…' : 'Create user'}
            </button>
          </form>
        </section>

        <section className="section">
          <h2 className="sectionTitle">
            All users {isLoading ? <span className="muted">(loading…)</span> : null}
          </h2>
          <div className="tableWrap" role="region" aria-label="Users table">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Group</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((u, idx) => (
                    <tr key={String(u.id ?? idx)}>
                      <td>{u.id ?? '-'}</td>
                      <td>{u.name ?? '-'}</td>
                      <td>{u.email ?? '-'}</td>
                      <td>{u.status ?? '-'}</td>
                      <td>{u.userGrpId ?? '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  )
}

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
