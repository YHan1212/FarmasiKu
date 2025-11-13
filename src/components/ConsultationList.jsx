import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import ConsultationChat from './ConsultationChat'
import './ConsultationList.css'

function ConsultationList({ user, onBack }) {
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, active, completed

  useEffect(() => {
    loadSessions()
  }, [user, filter])

  const loadSessions = async () => {
    try {
      setLoading(true)
      
      // Check if user is a doctor
      const { data: doctorData } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', user.id)
        .single()

      let query = supabase
        .from('consultation_sessions')
        .select(`
          *,
          doctor:doctors(*)
        `)
        .order('created_at', { ascending: false })

      if (doctorData) {
        // User is a doctor - show sessions where they are the doctor
        query = query.eq('doctor_id', doctorData.id)
      } else {
        // User is a patient - show their sessions
        query = query.eq('patient_id', user.id)
      }

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error

      // Get patient emails for doctor view (if admin API available)
      const sessionsWithEmails = await Promise.all(
        (data || []).map(async (session) => {
          if (doctorData && session.patient_id) {
            try {
              // Try to get patient email (may not work without admin privileges)
              const { data: patientData } = await supabase.auth.admin.getUserById(session.patient_id)
              return {
                ...session,
                patient_email: patientData?.user?.email || 'Patient'
              }
            } catch (error) {
              // Admin API not available, just use placeholder
              return {
                ...session,
                patient_email: 'Patient'
              }
            }
          }
          return session
        })
      )

      setSessions(sessionsWithEmails)
    } catch (error) {
      console.error('Error loading sessions:', error)
      setSessions([])
    } finally {
      setLoading(false)
    }
  }

  const handleSessionClick = (session) => {
    setSelectedSession(session)
  }

  const handleCloseChat = () => {
    setSelectedSession(null)
    loadSessions() // Refresh list
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Not scheduled'
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (selectedSession) {
    return (
      <ConsultationChat
        session={selectedSession}
        user={user}
        onClose={handleCloseChat}
      />
    )
  }

  return (
    <div className="consultation-list-container">
      <div className="consultation-header">
        <h2>💬 My Consultations</h2>
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
      </div>

      <div className="consultation-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending
        </button>
        <button
          className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading consultations...</div>
      ) : (
        <div className="sessions-list">
          {sessions.length === 0 ? (
            <div className="empty-state">
              <p>No consultations found</p>
              <p className="empty-subtitle">Your consultation history will appear here</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="session-card"
                onClick={() => handleSessionClick(session)}
              >
                <div className="session-header">
                  <h3>
                    {session.doctor
                      ? `Dr. ${session.doctor.name}`
                      : session.patient_email || 'Patient'
                    }
                  </h3>
                  <span className={`status-badge status-${session.status}`}>
                    {session.status}
                  </span>
                </div>
                {session.symptoms && session.symptoms.length > 0 && (
                  <p className="session-symptoms">
                    Symptoms: {session.symptoms.join(', ')}
                  </p>
                )}
                <div className="session-footer">
                  <span className="session-date">
                    {formatDate(session.scheduled_at || session.created_at)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default ConsultationList

