import { useState, useEffect } from 'react'
import { supabase } from './services/supabase'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="app">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1>📸 SnapAsset</h1>
        <p>Multi-Platform Image Generator</p>
      </header>
      
      <main className="main">
        <div className="container">
          <div className="hero">
            <h2>Welcome to SnapAsset!</h2>
            <p>
              Generate perfectly-sized image assets for various platforms
              including social media, app stores, and web applications.
            </p>
            {user ? (
              <div className="user-info">
                <p>✅ Logged in as: {user.email}</p>
                <button onClick={() => supabase.auth.signOut()}>
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="auth-section">
                <p>🔒 Please sign in to start creating assets</p>
                <button onClick={() => console.log('Auth implementation pending')}>
                  Sign In
                </button>
              </div>
            )}
          </div>

          <div className="features">
            <div className="feature-card">
              <h3>🎨 Multi-Platform</h3>
              <p>Support for Instagram, Twitter, Facebook, iOS, Android, and more</p>
            </div>
            <div className="feature-card">
              <h3>⚡ Fast Processing</h3>
              <p>Lightning-fast image generation and optimization</p>
            </div>
            <div className="feature-card">
              <h3>☁️ Cloud Storage</h3>
              <p>Secure storage powered by Supabase</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>Built with React + Vite | Powered by Supabase</p>
        <p>© 2026 SnapAsset by Darshan Pania</p>
      </footer>
    </div>
  )
}

export default App