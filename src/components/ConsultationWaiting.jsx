import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { consultationService } from '../services/consultationService'
import './ConsultationWaiting.css'

function ConsultationWaiting({ user, onMatched, onCancel, symptoms, symptomAssessments, selectedBodyPart, userAge }) {
  const [queue, setQueue] = useState(null)
  const [loading, setLoading] = useState(true)
  const [position, setPosition] = useState(null)
  const [estimatedWait, setEstimatedWait] = useState(null)
  const [onlinePharmacists, setOnlinePharmacists] = useState(0)

  useEffect(() => {
    if (!user) return

    // 先加载在线药剂师数量
    loadOnlinePharmacistsCount()

    // 创建队列记录
    createQueue()

    // 检查是否已有队列
    checkExistingQueue()
  }, [user])

  // 加载在线药剂师数量
  const loadOnlinePharmacistsCount = async () => {
    try {
      // 先尝试使用 count 查询
      const { count, error: countError } = await supabase
        .from('pharmacist_availability')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true)
        .eq('is_busy', false)

      if (!countError && count !== null) {
        console.log('Online pharmacists count:', count)
        setOnlinePharmacists(count)
        return
      }

      // 如果 count 查询失败，使用普通查询
      console.log('Count query failed, trying alternative query...', countError)
      const { data: pharmacists, error: altError } = await supabase
        .from('pharmacist_availability')
        .select('id')
        .eq('is_online', true)
        .eq('is_busy', false)
      
      if (!altError && pharmacists) {
        console.log('Online pharmacists (alternative):', pharmacists.length)
        setOnlinePharmacists(pharmacists.length)
      } else {
        console.error('Error loading online pharmacists:', altError)
        setOnlinePharmacists(0)
      }
    } catch (error) {
      console.error('Error loading online pharmacists count:', error)
      setOnlinePharmacists(0)
    }
  }

  useEffect(() => {
    if (!queue?.id) return

    // 订阅队列状态变化
    const channel = supabase
      .channel(`queue:${queue.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'consultation_queue',
          filter: `id=eq.${queue.id}`
        },
        (payload) => {
          const updatedQueue = payload.new
          setQueue(updatedQueue)
          
          // 当队列状态变为 'matched' 或 'in_consultation' 时，通知父组件加载会话
          if (updatedQueue.status === 'matched' || updatedQueue.status === 'in_consultation') {
            // 匹配成功，通知父组件
            if (onMatched) {
              onMatched(updatedQueue)
            }
          }
        }
      )
      .subscribe()

    // 加载队列位置和等待时间
    loadQueueInfo()

    // 定期更新队列信息
    const interval = setInterval(() => {
      loadQueueInfo()
      loadOnlinePharmacistsCount() // 同时更新在线药剂师数量
    }, 5000) // 每5秒更新一次

    return () => {
      channel.unsubscribe()
      clearInterval(interval)
    }
  }, [queue?.id])

  const createQueue = async () => {
    try {
      // 检查是否已有等待中的队列
      const { data: existingQueue } = await supabase
        .from('consultation_queue')
        .select('*')
        .eq('patient_id', user.id)
        .in('status', ['waiting', 'matched', 'in_consultation'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (existingQueue) {
        setQueue(existingQueue)
        setLoading(false)
        // 如果已经是 matched 或 in_consultation 状态，直接进入聊天
        if ((existingQueue.status === 'matched' || existingQueue.status === 'in_consultation') && onMatched) {
          onMatched(existingQueue)
        }
        return
      }

      // 创建新队列，包含症状信息
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

      setQueue(data)
      
      // 不再自动匹配，等待药剂师手动接受
      // 用户进入队列后，药剂师会在 PharmacistDashboard 中看到通知
    } catch (error) {
      console.error('Error creating queue:', error)
      alert(`Failed to join queue: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const checkExistingQueue = async () => {
    try {
      const { data, error } = await supabase
        .from('consultation_queue')
        .select('*')
        .eq('patient_id', user.id)
        .in('status', ['waiting', 'matched', 'in_consultation'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        throw error
      }

      if (data) {
        setQueue(data)
        // 只有在状态为 'matched' 或 'in_consultation' 时才自动进入聊天
        // 'waiting' 状态应该继续等待
        if ((data.status === 'matched' || data.status === 'in_consultation') && onMatched) {
          onMatched(data)
        }
      }
    } catch (error) {
      console.error('Error checking existing queue:', error)
    }
  }

  const matchPharmacist = async (queueId) => {
    try {
      // 查找在线且不忙碌的药剂师
      const { data: availablePharmacists, error } = await supabase
        .from('pharmacist_availability')
        .select(`
          *,
          pharmacist:doctors(*)
        `)
        .eq('is_online', true)
        .eq('is_busy', false)
        .order('current_sessions_count', { ascending: true })
        .limit(1)

      if (error) throw error

      if (!availablePharmacists || availablePharmacists.length === 0) {
        // 没有可用药剂师，继续等待
        return
      }

      const pharmacist = availablePharmacists[0]

      // 更新队列状态
      const { error: updateError } = await supabase
        .from('consultation_queue')
        .update({
          status: 'matched',
          matched_pharmacist_id: pharmacist.pharmacist_id,
          matched_at: new Date().toISOString()
        })
        .eq('id', queueId)

      if (updateError) throw updateError

      // 创建咨询会话
      const { data: session, error: sessionError } = await supabase
        .from('consultation_sessions')
        .insert({
          patient_id: user.id,
          doctor_id: pharmacist.pharmacist_id,
          queue_id: queueId,
          consultation_type: 'realtime',
          status: 'active',
          started_at: new Date().toISOString()
        })
        .select(`
          *,
          doctor:doctors(*)
        `)
        .single()

      if (sessionError) {
        console.error('Error creating consultation session:', sessionError)
        throw sessionError
      }

      console.log('Consultation session created successfully:', session)

      // 更新药剂师状态
      await supabase
        .from('pharmacist_availability')
        .update({
          is_busy: true,
          current_session_id: session.id,
          current_sessions_count: pharmacist.current_sessions_count + 1
        })
        .eq('id', pharmacist.id)

      // 通知匹配成功
      if (onMatched) {
        onMatched({ ...queue, matched_pharmacist_id: pharmacist.pharmacist_id })
      }
    } catch (error) {
      console.error('Error matching pharmacist:', error)
      // 匹配失败，继续等待
    }
  }

  const loadQueueInfo = async () => {
    if (!queue?.id) return

    try {
      // 计算队列位置
      const { data: waitingQueues, error } = await supabase
        .from('consultation_queue')
        .select('id, created_at')
        .eq('status', 'waiting')
        .order('created_at', { ascending: true })

      if (error) throw error

      const currentIndex = waitingQueues.findIndex(q => q.id === queue.id)
      if (currentIndex !== -1) {
        setPosition(currentIndex + 1)
      }

      // 计算预计等待时间（假设每个咨询平均5分钟）
      const estimatedMinutes = (currentIndex + 1) * 5
      setEstimatedWait(estimatedMinutes)

      // 获取在线药剂师数量
      const { count, error: countError } = await supabase
        .from('pharmacist_availability')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true)
        .eq('is_busy', false)

      if (!countError && count !== null) {
        setOnlinePharmacists(count)
      } else if (countError) {
        console.error('Error getting online pharmacists count:', countError)
        // 如果查询失败，尝试另一种方式
        const { data: pharmacists, error: altError } = await supabase
          .from('pharmacist_availability')
          .select('id')
          .eq('is_online', true)
          .eq('is_busy', false)
        
        if (!altError && pharmacists) {
          setOnlinePharmacists(pharmacists.length)
        }
      }
    } catch (error) {
      console.error('Error loading queue info:', error)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel? You will lose your position in the queue.')) {
      return
    }

    try {
      if (queue?.id) {
        await supabase
          .from('consultation_queue')
          .update({ status: 'cancelled' })
          .eq('id', queue.id)
      }

      if (onCancel) {
        onCancel()
      }
    } catch (error) {
      console.error('Error cancelling queue:', error)
      alert('Failed to cancel queue')
    }
  }

  if (loading) {
    return (
      <div className="consultation-waiting">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  return (
    <div className="consultation-waiting">
      <div className="waiting-container">
        <div className="waiting-header">
          <div className="waiting-icon">⏳</div>
          <h2>Waiting for Pharmacist</h2>
          <p className="waiting-subtitle">We're matching you with an available pharmacist</p>
        </div>

        <div className="waiting-info">
          <div className="info-card">
            <div className="info-label">Your Position</div>
            <div className="info-value">
              {position !== null ? `#${position}` : 'Calculating...'}
            </div>
          </div>

          <div className="info-card">
            <div className="info-label">Estimated Wait</div>
            <div className="info-value">
              {estimatedWait !== null ? `${estimatedWait} min` : 'Calculating...'}
            </div>
          </div>

          <div className="info-card">
            <div className="info-label">Online Pharmacists</div>
            <div className="info-value">{onlinePharmacists}</div>
          </div>
        </div>

        <div className="waiting-animation">
          <div className="pulse-circle"></div>
          <div className="pulse-circle"></div>
          <div className="pulse-circle"></div>
        </div>

        <div className="waiting-message">
          <p>Please wait while we connect you with a pharmacist...</p>
          <p className="waiting-tip">You can minimize this window. We'll notify you when a pharmacist is available.</p>
        </div>

        <button className="cancel-button" onClick={handleCancel}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export default ConsultationWaiting

