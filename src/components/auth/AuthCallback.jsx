import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../services/supabase'

const AuthCallback = () => {
  const navigate = useNavigate()
  const [error, setError] = useState(null)

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if there's a session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        
        if (session) {
          // Successfully authenticated
          navigate('/', { replace: true })
        } else {
          // No session found
          setError('Authentication failed. Please try again.')
          setTimeout(() => navigate('/auth/login'), 3000)
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        setError(error.message)
        setTimeout(() => navigate('/auth/login'), 3000)
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🔐 Completing Sign In</h1>
          <p>Please wait while we complete your authentication...</p>
        </div>

        {error ? (
          <div className="alert alert-error">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="spinner-large" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: '#666' }}>Redirecting you to the app...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuthCallback