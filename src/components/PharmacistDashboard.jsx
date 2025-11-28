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

  console.log('🟢 [PharmacistDashboard] ========== COMPONENT RENDERED ==========')
  console.log('🟢 [PharmacistDashboard] Component rendered', {
    userId: user?.id,
    hasUser: !!user,
    loading: loading,
    timestamp: new Date().toISOString()
  })
  console.log('🟢 [PharmacistDashboard] ==========================================')

  useEffect(() => {
    console.log('[PharmacistDashboard] useEffect [user] triggered', {
      hasUser: !!user,
      userId: user?.id
    })
    if (!user) {
      console.warn('[PharmacistDashboard] ⚠️ No user provided, skipping loadPharmacistInfo')
      return
    }
    console.log('[PharmacistDashboard] Calling loadPharmacistInfo...')
    loadPharmacistInfo()
  }, [user])

  useEffect(() => {
    console.log('[PharmacistDashboard] ========== useEffect [pharmacistId, user] TRIGGERED ==========')
    console.log('[PharmacistDashboard] useEffect triggered', {
      user: user?.id,
      pharmacistId: pharmacistId
    })
    
    if (!user) {
      console.warn('[PharmacistDashboard] ⚠️ No user, skipping loadData')
      return
    }
    
    // 即使没有 pharmacistId，也加载数据（Admin 可以查看所有队列）
    console.log('[PharmacistDashboard] Calling loadData()...')
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
          console.log('[PharmacistDashboard] Realtime: consultation_queue changed, reloading...')
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
          console.log('[PharmacistDashboard] Realtime: consultation_sessions changed, reloading...')
          loadData()
        }
      )
      .subscribe((status) => {
        console.log('[PharmacistDashboard] Realtime subscription status:', status)
      })

    return () => {
      supabase.removeChannel(queueChannel)
    }
  }, [pharmacistId, user])

  const loadPharmacistInfo = async () => {
    try {
      // 查找当前用户关联的药剂师账号（可能有多个）
      const { data: doctorDataList, error } = await supabase
        .from('doctors')
        .select('id, name, user_id')
        .eq('user_id', user.id)

      if (error) {
        console.error('Error loading pharmacist info:', error)
        // 即使没有 link pharmacist account，也允许查看队列（Admin 功能）
        return
      }

      if (doctorDataList && doctorDataList.length > 0) {
        // 使用第一个链接的药剂师 ID（如果有多个，可以后续扩展为选择）
        const firstDoctor = doctorDataList[0]
        setPharmacistId(firstDoctor.id)
        
        // 检查并设置在线状态
        const { data: availability } = await supabase
          .from('pharmacist_availability')
          .select('is_online')
          .eq('pharmacist_id', firstDoctor.id)
          .single()

        if (availability) {
          setIsOnline(availability.is_online)
        } else {
          // 如果不存在，创建并设置为在线
          await setOnlineStatus(firstDoctor.id, true)
        }
      }
      // 如果没有 link pharmacist account，不显示错误，但 pharmacistId 会是 null
      // 这样 Admin 仍然可以看到等待队列，但无法接受（因为没有 pharmacistId）
    } catch (error) {
      console.error('Error loading pharmacist info:', error)
      // 即使出错，也允许查看队列
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
    // 即使没有 pharmacistId，也加载数据（Admin 可以查看所有队列）
    console.log('[PharmacistDashboard] ========== loadData() CALLED ==========')
    console.log('[PharmacistDashboard] Starting loadData...', {
      userId: user?.id,
      pharmacistId: pharmacistId,
      timestamp: new Date().toISOString()
    })
    
    try {
      setLoading(true)
      console.log('[PharmacistDashboard] Loading state set to true')

      // 检查用户角色（用于调试）
      let userRole = null
      if (user?.id) {
        console.log('[PharmacistDashboard] Fetching user role...')
        const { data: userProfile, error: roleError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (roleError) {
          console.error('[PharmacistDashboard] Error fetching user role:', roleError)
        } else {
          userRole = userProfile?.role
          console.log('[PharmacistDashboard] User info:', { 
            userId: user.id, 
            role: userRole,
            pharmacistId: pharmacistId
          })
        }
      } else {
        console.warn('[PharmacistDashboard] ⚠️ No user.id available')
      }

      // 加载等待中的队列
      // 注意：RLS 策略会自动处理权限
      // - Admin 用户可以看到所有 waiting 队列
      // - 普通用户只能看到自己的队列
      // - 链接了 pharmacist account 的用户也可以看到 waiting 队列
      // 更新时间：2025-11-28 - 修复 Admin 查看 waiting 队列
      console.log('[PharmacistDashboard] Loading waiting queues...')
      const { data: queues, error: queueError } = await supabase
        .from('consultation_queue')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: true })

      console.log('[PharmacistDashboard] ========== QUEUE QUERY RESULT ==========')
      console.log('[PharmacistDashboard] Waiting queues result:', { 
        queues: queues || [],
        queueError: queueError,
        count: queues?.length || 0,
        userRole: userRole,
        hasError: !!queueError,
        userId: user?.id
      })
      
      // 详细错误信息
      if (queueError) {
        console.error('[PharmacistDashboard] ❌ QUERY ERROR:', {
          message: queueError.message,
          code: queueError.code,
          details: queueError.details,
          hint: queueError.hint
        })
      }
      
      // 如果查询成功但没有数据，检查是否是 RLS 问题
      if (!queueError && (!queues || queues.length === 0) && userRole === 'admin') {
        console.warn('[PharmacistDashboard] ⚠️⚠️⚠️ ADMIN USER BUT NO QUEUES RETURNED ⚠️⚠️⚠️')
        console.warn('[PharmacistDashboard] This indicates a possible RLS policy issue.')
        console.warn('[PharmacistDashboard] ACTION REQUIRED:')
        console.warn('[PharmacistDashboard] 1. Go to Supabase SQL Editor')
        console.warn('[PharmacistDashboard] 2. Run: database/rebuild_consultation_queue_rls.sql')
        console.warn('[PharmacistDashboard] 3. Verify your role is "admin" in user_profiles table')
        console.warn('[PharmacistDashboard] 4. Check if there are any waiting queues in the database')
      } else if (!queueError && queues && queues.length > 0) {
        console.log('[PharmacistDashboard] ✅ SUCCESS: Found', queues.length, 'waiting queue(s)')
        queues.forEach((q, idx) => {
          console.log(`[PharmacistDashboard] Queue ${idx + 1}:`, {
            id: q.id,
            patient_id: q.patient_id,
            status: q.status,
            created_at: q.created_at
          })
        })
      } else if (!queueError && (!queues || queues.length === 0)) {
        console.log('[PharmacistDashboard] ℹ️ No waiting queues found (this is normal if no users are waiting)')
      }
      console.log('[PharmacistDashboard] ==========================================')

      // 加载患者信息
      if (queues && queues.length > 0) {
        const patientIds = queues.map(q => q.patient_id).filter(Boolean)
        if (patientIds.length > 0) {
          const { data: patients } = await supabase
            .from('user_profiles')
            .select('id')
            .in('id', patientIds)

          // 将患者信息合并到队列中（user_profiles 没有 name 列）
          const patientsMap = {}
          if (patients) {
            patients.forEach(p => {
              patientsMap[p.id] = { id: p.id }
            })
          }

          queues.forEach(queue => {
            queue.patient = patientsMap[queue.patient_id] || { id: queue.patient_id }
          })
        }
      }

      if (queueError) {
        console.error('[PharmacistDashboard] Error loading queues:', queueError)
        console.error('[PharmacistDashboard] Error details:', {
          message: queueError.message,
          code: queueError.code,
          details: queueError.details,
          hint: queueError.hint
        })
        alert(`Failed to load waiting queues: ${queueError.message}\n\nError Code: ${queueError.code}\n\nPlease check:\n1. Are you logged in as admin?\n2. Is your role set to 'admin' in user_profiles?\n3. Run the SQL script: rebuild_consultation_queue_rls.sql`)
        throw queueError
      }

      // 如果没有错误但也没有数据，可能是 RLS 策略阻止了
      if (!queueError && (!queues || queues.length === 0)) {
        console.warn('[PharmacistDashboard] No queues returned, but no error.', {
          userRole: userRole,
          userId: user?.id,
          pharmacistId: pharmacistId,
          note: 'This might be normal if you are not admin and have no own queues, or if there are no waiting queues.'
        })
      }

      // 加载活跃的会话（in_chat 状态的队列对应的会话）
      let sessions = []
      if (pharmacistId) {
        // 先查找当前药剂师的 in_chat 队列
        const { data: activeQueues } = await supabase
          .from('consultation_queue')
          .select('id')
          .eq('status', 'in_chat')
          .eq('pharmacist_id', pharmacistId)
        
        if (activeQueues && activeQueues.length > 0) {
          const queueIds = activeQueues.map(q => q.id)
          const { data: sessionsData, error: sessionError } = await supabase
            .from('consultation_sessions')
            .select(`
              *,
              doctor:doctors(*)
            `)
            .in('queue_id', queueIds)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
          
          if (sessionError) throw sessionError
          sessions = sessionsData || []
        }
      }

      // 加载患者和医生信息
      if (sessions && sessions.length > 0) {
        const patientIds = sessions.map(s => s.patient_id).filter(Boolean)
        const doctorIds = sessions.map(s => s.doctor_id).filter(Boolean)

        // 加载患者信息（user_profiles 没有 name 列）
        if (patientIds.length > 0) {
          const { data: patients } = await supabase
            .from('user_profiles')
            .select('id')
            .in('id', patientIds)

          const patientsMap = {}
          if (patients) {
            patients.forEach(p => {
              patientsMap[p.id] = { id: p.id }
            })
          }

          sessions.forEach(session => {
            session.patient = patientsMap[session.patient_id] || { id: session.patient_id }
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

      // 设置等待队列
      console.log('[PharmacistDashboard] Setting state:', {
        queuesCount: queues?.length || 0,
        queues: queues,
        sessionsCount: sessions?.length || 0
      })
      setWaitingQueues(queues || [])
      setActiveSessions(sessions || [])
      
      // 调试信息
      console.log('[PharmacistDashboard] Final state set:', {
        waitingQueuesCount: queues?.length || 0,
        activeSessionsCount: sessions?.length || 0,
        userRole: userRole,
        queuesArray: queues
      })
      
      console.log('[PharmacistDashboard] Data loaded successfully:', {
        waitingQueuesCount: queues?.length || 0,
        activeSessionsCount: sessions?.length || 0
      })
    } catch (error) {
      console.error('[PharmacistDashboard] Error loading data:', error)
      console.error('[PharmacistDashboard] Full error:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      alert(`Failed to load data: ${error.message}\n\nCheck browser console for details.`)
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptQueue = async (queue) => {
    try {
      if (!pharmacistId) {
        alert('Please link a pharmacist account in the Admin panel first to accept consultations.')
        return
      }

      // 步骤 1: 更新队列状态为 'accepted'，并设置匹配的药剂师
      const { error: updateQueueError } = await supabase
        .from('consultation_queue')
        .update({
          status: 'accepted',
          pharmacist_id: pharmacistId,
          matched_pharmacist_id: pharmacistId, // 保持向后兼容
          accepted_at: new Date().toISOString(),
          matched_at: new Date().toISOString()
        })
        .eq('id', queue.id)

      if (updateQueueError) throw updateQueueError

      // 检查是否已存在会话（可能被其他药剂师创建）
      let session = null
      const { data: existingSession } = await supabase
        .from('consultation_sessions')
        .select(`
          *,
          doctor:doctors(*)
        `)
        .eq('queue_id', queue.id)
        .eq('status', 'active')
        .maybeSingle()

      if (existingSession) {
        // 如果已存在会话，更新 doctor_id 为当前药剂师（允许切换药剂师）
        const { data: updatedSession, error: updateError } = await supabase
          .from('consultation_sessions')
          .update({
            doctor_id: pharmacistId
          })
          .eq('id', existingSession.id)
          .select(`
            *,
            doctor:doctors(*)
          `)
          .single()

        if (updateError) throw updateError
        session = updatedSession
      } else {
        // 创建新的咨询会话
        const { data: newSession, error: createError } = await supabase
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
        session = newSession
      }

      // 步骤 2: 更新队列状态为 'in_chat'
      await supabase
        .from('consultation_queue')
        .update({ 
          status: 'in_chat',
          started_at: new Date().toISOString()
        })
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

      // 加载患者信息（user_profiles 没有 name 列）
      const { data: patientInfo } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', queue.patient_id)
        .single()

      setSelectedSession({
        ...session,
        patient: { id: queue.patient_id }
      })
    } catch (error) {
      console.error('Error accepting queue:', error)
      alert(`Failed to accept consultation: ${error.message}`)
    }
  }

  const handleSelectSession = async (session) => {
    // 加载患者信息（user_profiles 没有 name 列）
    const { data: patientInfo } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', session.patient_id)
      .single()

    setSelectedSession({
      ...session,
      patient: { id: session.patient_id }
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
        otherUserInfo={selectedSession.patient || { id: selectedSession.patient_id }}
        session={selectedSession}
      />
    )
  }

  console.log('[PharmacistDashboard] Rendering component', {
    loading: loading,
    waitingQueuesCount: waitingQueues.length,
    activeSessionsCount: activeSessions.length,
    pharmacistId: pharmacistId
  })

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
            {console.log('[PharmacistDashboard] Rendering waiting queues section', {
              waitingQueuesLength: waitingQueues.length,
              waitingQueues: waitingQueues
            })}
            {waitingQueues.length === 0 ? (
              <div className="empty-state">
                No waiting consultations
                <br />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  (Check browser console for debug info)
                </small>
              </div>
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
                          <strong>Patient:</strong> {queue.patient?.email || queue.patient_id || 'Unknown'}
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
                      {pharmacistId ? (
                        <button
                          className="accept-btn"
                          onClick={() => handleAcceptQueue(queue)}
                        >
                          Accept & Start Chat
                        </button>
                      ) : (
                        <div className="link-required-message">
                          <p>⚠️ Please link a pharmacist account in Admin panel to accept consultations</p>
                        </div>
                      )}
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
                        <strong>Patient:</strong> {session.patient?.email || session.patient_id || 'Unknown'}
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

