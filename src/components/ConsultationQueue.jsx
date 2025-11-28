import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { consultationService } from '../services/consultationService'
import './ConsultationQueue.css'

function ConsultationQueue({ user, onEnterChat, onCancel, symptoms, symptomAssessments, selectedBodyPart, userAge }) {
  const [queue, setQueue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [position, setPosition] = useState(null)
  const [estimatedWait, setEstimatedWait] = useState(null)
  const [onlinePharmacists, setOnlinePharmacists] = useState(0)

  // 初始化：检查现有队列或创建新队列
  useEffect(() => {
    if (!user) return
    initializeQueue()
  }, [user])

  // 初始化队列
  const initializeQueue = async () => {
    try {
      setLoading(true)

      // 步骤 1: 检查是否有活跃的队列（in_chat 状态且有活跃会话）
      const { data: activeQueue } = await supabase
        .from('consultation_queue')
        .select('*')
        .eq('patient_id', user.id)
        .eq('status', 'in_chat')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (activeQueue) {
        // 检查是否有对应的活跃会话
        const { data: session } = await supabase
          .from('consultation_sessions')
          .select('id, status')
          .eq('queue_id', activeQueue.id)
          .eq('status', 'active')
          .maybeSingle()

        if (session) {
          // 有活跃会话，直接进入聊天
          console.log('[ConsultationQueue] Found active session, entering chat')
          if (onEnterChat) {
            onEnterChat({ queue: activeQueue, session })
          }
          return
        }
      }

      // 步骤 2: 检查是否有等待中的队列
      const { data: waitingQueue } = await supabase
        .from('consultation_queue')
        .select('*')
        .eq('patient_id', user.id)
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (waitingQueue) {
        // 使用现有等待队列
        console.log('[ConsultationQueue] Found waiting queue:', waitingQueue.id)
        setQueue(waitingQueue)
        updateQueueInfo(waitingQueue.id)
        loadOnlinePharmacistsCount()
        setLoading(false)
        return
      }

      // 步骤 3: 创建新队列
      console.log('[ConsultationQueue] Creating new queue')
      await createQueue()
    } catch (error) {
      console.error('[ConsultationQueue] Error initializing queue:', error)
      alert(`Failed to initialize queue: ${error.message}`)
      setLoading(false)
    }
  }

  // 创建新队列
  const createQueue = async () => {
    try {
      const notes = JSON.stringify({
        symptomAssessments: symptomAssessments || {},
        selectedBodyPart: selectedBodyPart || null,
        userAge: userAge || null
      })
      
      const data = await consultationService.createQueue(
        user.id,
        symptoms || [],
        notes
      )

      console.log('[ConsultationQueue] Queue created:', data.id)
      setQueue(data)
      updateQueueInfo(data.id)
      loadOnlinePharmacistsCount()
    } catch (error) {
      console.error('Error creating queue:', error)
      alert(`Failed to join queue: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // 更新队列信息（位置、等待时间）
  const updateQueueInfo = async (queueId) => {
    try {
      // 计算队列位置
      const { data: waitingQueues } = await supabase
        .from('consultation_queue')
        .select('id, created_at')
        .eq('status', 'waiting')
        .order('created_at', { ascending: true })

      if (waitingQueues) {
        const currentIndex = waitingQueues.findIndex(q => q.id === queueId)
        const queuePosition = currentIndex !== -1 ? currentIndex + 1 : null
        setPosition(queuePosition)

        // 估算等待时间：每个咨询约 5-10 分钟，根据在线药剂师数量
        const { count: onlineCount } = await supabase
          .from('pharmacist_availability')
          .select('*', { count: 'exact', head: true })
          .eq('is_online', true)
          .eq('is_busy', false)

        if (onlineCount > 0 && queuePosition) {
          // 假设每个药剂师同时处理 1-3 个咨询，每个咨询 5-10 分钟
          const avgWaitPerPerson = 5 // 分钟
          const estimatedMinutes = Math.ceil((queuePosition - 1) / onlineCount) * avgWaitPerPerson
          setEstimatedWait(estimatedMinutes)
        } else {
          setEstimatedWait(null)
        }
      }
    } catch (error) {
      console.error('Error updating queue info:', error)
    }
  }

  // 加载在线药剂师数量
  const loadOnlinePharmacistsCount = async () => {
    try {
      const { count, error } = await supabase
        .from('pharmacist_availability')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true)
        .eq('is_busy', false)

      if (error) throw error
      setOnlinePharmacists(count || 0)
    } catch (error) {
      console.error('Error loading online pharmacists:', error)
      setOnlinePharmacists(0)
    }
  }

  // 取消队列
  const handleCancel = async () => {
    if (!queue) return

    try {
      const { error } = await supabase
        .from('consultation_queue')
        .update({ status: 'cancelled' })
        .eq('id', queue.id)

      if (error) throw error

      if (onCancel) {
        onCancel()
      }
    } catch (error) {
      console.error('Error cancelling queue:', error)
      alert(`Failed to cancel queue: ${error.message}`)
    }
  }

  // 订阅队列状态变化
  useEffect(() => {
    if (!queue?.id) return

    console.log('[ConsultationQueue] Setting up subscriptions for queue:', queue.id)

    // 订阅队列状态变化
    const queueChannel = supabase
      .channel(`queue:${queue.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'consultation_queue',
          filter: `id=eq.${queue.id}`
        },
        async (payload) => {
          const updatedQueue = payload.new
          console.log('[ConsultationQueue] Queue updated:', updatedQueue.status)
          setQueue(updatedQueue)
          
          // 如果状态变为 'accepted' 或 'in_chat'，检查是否有会话
          if (updatedQueue.status === 'accepted' || updatedQueue.status === 'in_chat') {
            await checkAndEnterChat(updatedQueue)
          }
        }
      )
      .subscribe()

    // 订阅会话创建（当药剂师接受时）
    const sessionChannel = supabase
      .channel(`session:${queue.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'consultation_sessions',
          filter: `queue_id=eq.${queue.id}`
        },
        async () => {
          console.log('[ConsultationQueue] New session created, checking...')
          await checkAndEnterChat(queue)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(queueChannel)
      supabase.removeChannel(sessionChannel)
    }
  }, [queue?.id])

  // 检查并进入聊天
  const checkAndEnterChat = async (queueToCheck) => {
    try {
      // 检查是否有活跃会话
      const { data: session } = await supabase
        .from('consultation_sessions')
        .select('id, status')
        .eq('queue_id', queueToCheck.id)
        .eq('status', 'active')
        .maybeSingle()

      if (session && (queueToCheck.status === 'accepted' || queueToCheck.status === 'in_chat')) {
        console.log('[ConsultationQueue] Active session found, entering chat')
        if (onEnterChat) {
          onEnterChat({ queue: queueToCheck, session })
        }
      }
    } catch (error) {
      console.error('[ConsultationQueue] Error checking session:', error)
    }
  }

  if (loading) {
    return (
      <div className="consultation-queue">
        <div className="queue-loading">
          <div className="spinner"></div>
          <p>正在加入队列...</p>
        </div>
      </div>
    )
  }

  if (!queue) {
    return (
      <div className="consultation-queue">
        <div className="queue-error">
          <p>无法创建队列，请重试</p>
          <button onClick={initializeQueue}>重试</button>
        </div>
      </div>
    )
  }

  return (
    <div className="consultation-queue">
      <div className="queue-container">
        <div className="queue-header">
          <h2>⏳ 等待药剂师接听</h2>
          <button className="cancel-btn" onClick={handleCancel}>
            取消排队
          </button>
        </div>

        <div className="queue-info">
          {position && (
            <div className="queue-position">
              <div className="position-number">{position}</div>
              <p>您前面有 {position - 1} 人</p>
            </div>
          )}

          {estimatedWait && (
            <div className="estimated-wait">
              <p>预计等待时间：约 {estimatedWait} 分钟</p>
            </div>
          )}

          <div className="online-pharmacists">
            <p>当前在线药剂师：{onlinePharmacists} 人</p>
          </div>
        </div>

        <div className="queue-status">
          <div className="status-indicator waiting">
            <div className="pulse"></div>
            <p>等待中...</p>
          </div>
        </div>

        <div className="queue-tips">
          <p>💡 提示：请保持页面打开，药剂师接听后会自动进入聊天</p>
        </div>
      </div>
    </div>
  )
}

export default ConsultationQueue

