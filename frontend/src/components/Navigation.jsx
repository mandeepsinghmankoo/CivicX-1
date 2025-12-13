import React from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import authService from '../appwrite/auth'
import { useDispatch } from 'react-redux'
import { logout } from '../store/authSlice'
import { useNavigate } from 'react-router-dom'

function Navigation() {
  const userData = useSelector(state => state.auth.userData)
  const isAuthenticated = useSelector(state => state.auth.status)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  
  const handleLogout = async () => {
    try {
      await authService.logout()
      dispatch(logout())
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }
  
  return (
    <nav className="bg-[#121212] text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-green-400">CivicX</Link>
        
        <div className="flex space-x-4">
          {/* Common navigation links */}
          <Link to="/" className="hover:text-green-400 transition-colors">Home</Link>
          <Link to="/liveissues" className="hover:text-green-400 transition-colors">Live Issues</Link>
          
          {/* Role-specific navigation links */}
          {isAuthenticated && userData?.role === 'citizen' && (
            <Link to="/repoissue" className="hover:text-green-400 transition-colors">Report Issue</Link>
          )}
          
          {isAuthenticated && userData?.role === 'official' && (
            <Link to="/manage-issues" className="hover:text-green-400 transition-colors">Manage Issues</Link>
          )}
          
          {/* Authentication links */}
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="hover:text-green-400 transition-colors">Login</Link>
              <Link to="/signup" className="hover:text-green-400 transition-colors">Sign Up</Link>
            </>
          ) : (
            <button 
              onClick={handleLogout}
              className="hover:text-green-400 transition-colors"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navigation