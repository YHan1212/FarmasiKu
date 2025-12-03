import React from 'react'
import './LoadingOverlay.css'

function LoadingOverlay({ message = 'Loading...', show = false }) {
  if (!show) return null

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        {message && <p className="loading-message">{message}</p>}
      </div>
    </div>
  )
}

export default LoadingOverlay

