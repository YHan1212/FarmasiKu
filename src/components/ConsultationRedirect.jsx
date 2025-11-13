import React, { useState } from 'react'
import { supabase } from '../lib/supabase'
import './ConsultationRedirect.css'

function ConsultationRedirect({ onBack, symptoms, onStartConsultation }) {
  const [loading, setLoading] = useState(false)

  const handleStartConsultation = async () => {
    if (!onStartConsultation) {
      // Fallback: just go back if handler not provided
      onBack()
      return
    }

    try {
      setLoading(true)
      
      // Get or create a default doctor
      let doctorId = null
      const { data: doctors } = await supabase
        .from('doctors')
        .select('id')
        .eq('is_available', true)
        .limit(1)

      if (doctors && doctors.length > 0) {
        doctorId = doctors[0].id
      } else {
        // Create a default doctor if none exists
        const { data: newDoctor, error: doctorError } = await supabase
          .from('doctors')
          .insert({
            name: 'Dr. Default',
            specialization: 'General Practice',
            bio: 'Available for consultations',
            is_available: true
          })
          .select()
          .single()

        if (doctorError) {
          console.error('Error creating doctor:', doctorError)
          alert('Failed to start consultation. Please try again.')
          return
        }

        doctorId = newDoctor.id
      }

      // Get current user ID
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        alert('Please login to start a consultation')
        return
      }

      // Create consultation session
      const { data: session, error: sessionError } = await supabase
        .from('consultation_sessions')
        .insert({
          patient_id: currentUser.id,
          doctor_id: doctorId,
          symptoms: symptoms || [],
          status: 'pending'
        })
        .select()
        .single()

      if (sessionError) {
        console.error('Error creating session:', sessionError)
        alert('Failed to start consultation. Please try again.')
        return
      }

      // Call the handler to navigate to consultation
      onStartConsultation(session)
    } catch (error) {
      console.error('Error starting consultation:', error)
      alert('Failed to start consultation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="consultation-redirect">
      <div className="consultation-content">
        <div className="consultation-icon">👨‍⚕️</div>
        <h2 className="consultation-title">Consultation Recommended</h2>
        <p className="consultation-message">
          Due to the severity of your symptoms, we strongly recommend an online one-on-one doctor consultation.
        </p>
        <p className="consultation-submessage">
          This ensures you receive the most appropriate treatment plan.
        </p>

        <div className="consultation-features">
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Professional one-on-one doctor consultation</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Real-time text chat with doctors</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">✓</span>
            <span>Secure online consultation platform</span>
          </div>
        </div>

        <div className="consultation-actions">
          <button 
            className="consultation-button primary" 
            onClick={handleStartConsultation}
            disabled={loading}
          >
            {loading ? 'Starting...' : 'Start Consultation'}
          </button>
          <button 
            className="consultation-button secondary" 
            onClick={onBack}
            disabled={loading}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConsultationRedirect

