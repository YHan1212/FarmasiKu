import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import SimpleChat from './SimpleChat'
import './PharmacistDashboard.css'

function PharmacistDashboard({ user, onBack }) {
  const [activeSessions, setActiveSessions] = useState([])
  const [waitingQueues, setWaitingQueues] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pharmacistId, setPharmacistId] = useState(null)
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    if (!user) return
    loadPharmacistInfo()
  }, [user])

  useEffect(() => {
    if (pharmacistId) {
      loadData()
      // Set up realtime subscriptions
      const queueChannel = supabase
        .channel('pharmacist_queue')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'consultation_queue'
          },
          () => {
            loadData()
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'consultation_sessions'
          },
          () => {
            loadData()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(queueChannel)
      }
    }
  }, [pharmacistId])

  const loadPharmacistInfo = async () => {
    try {
      // 查找当前用户关联的药剂师账号
      const { data: doctorData, error } = await supabase
        .from('doctors')
        .select('id, user_id')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading pharmacist info:', error)
        return
      }

      if (doctorData) {
        setPharmacistId(doctorData.id)
        
        // 检查并设置在线状态
        const { data: availability } = await supabase
          .from('pharmacist_availability')
          .select('is_online')
          .eq('pharmacist_id', doctorData.id)
          .single()

        if (availability) {
          setIsOnline(availability.is_online)
        } else {
          // 如果不存在，创建并设置为在线
          await setOnlineStatus(doctorData.id, true)
        }
      } else {
        alert('您还没有关联药剂师账号。请在 Admin 面板中创建并关联药剂师账号。')
        if (onBack) onBack()
      }
    } catch (error) {
      console.error('Error loading pharmacist info:', error)
    }
  }

  const setOnlineStatus = async (pharmacistId, online) => {
    try {
      const { error } = await supabase
        .from('pharmacist_availability')
        .upsert({
          pharmacist_id: pharmacistId,
          is_online: online,
          is_busy: false,
          current_sessions_count: 0,
          last_active_at: new Date().toISOString()
        }, {
          onConflict: 'pharmacist_id'
        })

      if (error) throw error
      setIsOnline(online)
    } catch (error) {
      console.error('Error setting online status:', error)
      alert(`Failed to set online status: ${error.message}`)
    }
  }

  const loadData = async () => {
    if (!pharmacistId) return

    try {
      setLoading(true)

      // 加载等待中的队列（已匹配但未开始的）
      const { data: queues, error: queueError } = await supabase
        .from('consultation_queue')
        .select('*')
        .eq('matched_pharmacist_id', pharmacistId)
        .eq('status', 'matched')
        .order('matched_at', { ascending: true })

      // 加载患者信息
      if (queues && queues.length > 0) {
        const patientIds = queues.map(q => q.patient_id).filter(Boolean)
        if (patientIds.length > 0) {
          const { data: patients } = await supabase
            .from('user_profiles')
            .select('id, name, email')
            .in('id', patientIds)

          // 将患者信息合并到队列中
          const patientsMap = {}
          if (patients) {
            patients.forEach(p => {
              patientsMap[p.id] = p
            })
          }

          queues.forEach(queue => {
            queue.patient = patientsMap[queue.patient_id] || null
          })
        }
      }

      if (queueError) throw queueError

      // 加载活跃的会话
      const { data: sessions, error: sessionError } = await supabase
        .from('consultation_sessions')
        .select('*')
        .eq('doctor_id', pharmacistId)
        .in('status', ['active', 'in_progress'])
        .order('created_at', { ascending: false })

      // 加载患者和医生信息
      if (sessions && sessions.length > 0) {
        const patientIds = sessions.map(s => s.patient_id).filter(Boolean)
        const doctorIds = sessions.map(s => s.doctor_id).filter(Boolean)

        // 加载患者信息
        if (patientIds.length > 0) {
          const { data: patients } = await supabase
            .from('user_profiles')
            .select('id, name, email')
            .in('id', patientIds)

          const patientsMap = {}
          if (patients) {
            patients.forEach(p => {
              patientsMap[p.id] = p
            })
          }

          sessions.forEach(session => {
            session.patient = patientsMap[session.patient_id] || null
          })
        }

        // 加载医生信息
        if (doctorIds.length > 0) {
          const { data: doctors } = await supabase
            .from('doctors')
            .select('*')
            .in('id', doctorIds)

          const doctorsMap = {}
          if (doctors) {
            doctors.forEach(d => {
              doctorsMap[d.id] = d
            })
          }

          sessions.forEach(session => {
            session.doctor = doctorsMap[session.doctor_id] || null
          })
        }
      }

      if (sessionError) throw sessionError

      setWaitingQueues(queues || [])
      setActiveSessions(sessions || [])
    } catch (error) {
      console.error('Error loading data:', error)
      alert(`Failed to load data: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptQueue = async (queue) => {
    try {
      // 更新队列状态为 'matched'，并设置匹配的药剂师
      const { error: updateQueueError } = await supabase
        .from('consultation_queue')
        .update({
          status: 'matched',
          matched_pharmacist_id: pharmacistId,
          matched_at: new Date().toISOString()
        })
        .eq('id', queue.id)

      if (updateQueueError) throw updateQueueError

      // 创建咨询会话
      const { data: session, error: createError } = await supabase
        .from('consultation_sessions')
        .insert({
          patient_id: queue.patient_id,
          doctor_id: pharmacistId,
          queue_id: queue.id,
          consultation_type: 'realtime',
          status: 'active',
          started_at: new Date().toISOString()
        })
        .select(`
          *,
          doctor:doctors(*)
        `)
        .single()

      if (createError) throw createError

      // 更新队列状态为 'in_consultation'
      await supabase
        .from('consultation_queue')
        .update({ status: 'in_consultation' })
        .eq('id', queue.id)

      // 更新药剂师状态为忙碌
      const { data: currentAvailability } = await supabase
        .from('pharmacist_availability')
        .select('current_sessions_count')
        .eq('pharmacist_id', pharmacistId)
        .single()

      await supabase
        .from('pharmacist_availability')
        .update({
          is_busy: true,
          current_session_id: session.id,
          current_sessions_count: (currentAvailability?.current_sessions_count || 0) + 1
        })
        .eq('pharmacist_id', pharmacistId)

      // 加载患者信息
      const { data: patientInfo } = await supabase
        .from('user_profiles')
        .select('id, name, email')
        .eq('id', queue.patient_id)
        .single()

      setSelectedSession({
        ...session,
        patient: patientInfo || { id: queue.patient_id }
      })
    } catch (error) {
      console.error('Error accepting queue:', error)
      alert(`Failed to accept consultation: ${error.message}`)
    }
  }

  const handleSelectSession = async (session) => {
    // 加载患者信息
    const { data: patientInfo } = await supabase
      .from('user_profiles')
      .select('id, name, email')
      .eq('id', session.patient_id)
      .single()

    setSelectedSession({
      ...session,
      patient: patientInfo || { id: session.patient_id }
    })
  }

  const handleBackFromChat = () => {
    setSelectedSession(null)
    loadData()
  }

  if (selectedSession) {
    return (
      <SimpleChat
        user={user}
        onBack={handleBackFromChat}
        sessionId={selectedSession.id}
        isDoctor={true}
        otherUserInfo={selectedSession.patient || { name: 'Patient' }}
        session={selectedSession}
      />
    )
  }

  return (
    <div className="pharmacist-dashboard">
      <div className="pharmacist-header">
        <h2>👨‍⚕️ Pharmacist Dashboard</h2>
        <div className="online-status">
          <label>
            <input
              type="checkbox"
              checked={isOnline}
              onChange={(e) => {
                if (pharmacistId) {
                  setOnlineStatus(pharmacistId, e.target.checked)
                }
              }}
            />
            <span className={isOnline ? 'online' : 'offline'}>
              {isOnline ? '🟢 Online' : '🔴 Offline'}
            </span>
          </label>
        </div>
        <button className="back-btn" onClick={onBack}>
          ← Back
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="pharmacist-content">
          {/* 等待中的咨询 */}
          <div className="section">
            <h3>⏳ Waiting Consultations ({waitingQueues.length})</h3>
            {waitingQueues.length === 0 ? (
              <div className="empty-state">No waiting consultations</div>
            ) : (
              <div className="queue-list">
                {waitingQueues.map((queue) => {
                  // 解析症状信息
                  const symptoms = queue.symptoms || []
                  const notes = queue.notes ? (typeof queue.notes === 'string' ? JSON.parse(queue.notes) : queue.notes) : {}
                  const symptomInfo = notes.symptomAssessments || {}
                  
                  return (
                    <div key={queue.id} className="queue-card">
                      <div className="queue-info">
                        <div className="queue-patient">
                          <strong>Patient:</strong> {queue.patient?.name || queue.patient?.email || 'Unknown'}
                        </div>
                        {symptoms.length > 0 && (
                          <div className="queue-symptoms">
                            <strong>Symptoms:</strong> {symptoms.join(', ')}
                          </div>
                        )}
                        {notes.userAge && (
                          <div className="queue-age">
                            <strong>Age:</strong> {notes.userAge}
                          </div>
                        )}
                        <div className="queue-time">
                          Joined: {new Date(queue.created_at).toLocaleString()}
                        </div>
                      </div>
                      <button
                        className="accept-btn"
                        onClick={() => handleAcceptQueue(queue)}
                      >
                        Accept & Start Chat
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 活跃的会话 */}
          <div className="section">
            <h3>💬 Active Sessions ({activeSessions.length})</h3>
            {activeSessions.length === 0 ? (
              <div className="empty-state">No active sessions</div>
            ) : (
              <div className="sessions-list">
                {activeSessions.map((session) => (
                  <div key={session.id} className="session-card">
                    <div className="session-info">
                      <div className="session-patient">
                        <strong>Patient:</strong> {session.patient?.name || session.patient?.email || 'Unknown'}
                      </div>
                      <div className="session-time">
                        Started: {new Date(session.created_at).toLocaleString()}
                      </div>
                    </div>
                    <button
                      className="open-chat-btn"
                      onClick={() => handleSelectSession(session)}
                    >
                      Open Chat
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default PharmacistDashboard

