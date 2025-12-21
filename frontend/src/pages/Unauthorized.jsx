import React from 'react'
import { Link } from 'react-router-dom'

function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tl from-[#0b2a2d] to-[#020d0e]">
      <div className="max-w-md w-full p-6 bg-gray-800 rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold text-[#067a85] mb-4">Access Denied</h1>
        <p className="text-gray-300 mb-6">
          You don't have permission to access this page. This area is restricted to users with specific roles.
        </p>
        <Link 
          to="/" 
          className="inline-block px-6 py-2 text-sm font-medium text-white bg-[#045c65] rounded hover:bg-[#067a85] transition-colors duration-300"
        >
          Return to Home
        </Link>
      </div>
    </div>
  )
}

export default Unauthorized