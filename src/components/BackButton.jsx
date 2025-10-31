import React from 'react'
import './BackButton.css'

function BackButton({ onClick, label = 'Back' }) {
  return (
    <button className="back-button" onClick={onClick}>
      <span className="back-icon">←</span>
      <span className="back-text">{label}</span>
    </button>
  )
}

export default BackButton

