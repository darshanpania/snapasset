import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Login from './components/auth/Login'
import Signup from './components/auth/Signup'
import ForgotPassword from './components/auth/ForgotPassword'
import AuthCallback from './components/auth/AuthCallback'
import UserProfile from './components/auth/UserProfile'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Home from './pages/Home'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Protected Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          
          {/* 404 Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App