import { supabase } from '../lib/supabase'

// 实时咨询服务
export const consultationService = {
  // 创建队列
  async createQueue(patientId, symptoms = [], notes = '') {
    try {
      const { data, error } = await supabase
        .from('consultation_queue')
        .insert({
          patient_id: patientId,
          status: 'waiting',
          symptoms,
          notes
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating queue:', error)
      throw error
    }
  },

  // 匹配药剂师
  async matchPharmacist(queueId) {
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
        return null // 没有可用药剂师
      }

      const pharmacist = availablePharmacists[0]

      // 获取队列信息
      const { data: queue, error: queueError } = await supabase
        .from('consultation_queue')
        .select('*')
        .eq('id', queueId)
        .single()

      if (queueError) throw queueError

      // 更新队列状态为 'accepted'（匹配成功）
      const { error: updateError } = await supabase
        .from('consultation_queue')
        .update({
          status: 'accepted',
          pharmacist_id: pharmacist.pharmacist_id,
          accepted_at: new Date().toISOString()
        })
        .eq('id', queueId)

      if (updateError) throw updateError

      // 创建咨询会话
      const { data: session, error: sessionError } = await supabase
        .from('consultation_sessions')
        .insert({
          patient_id: queue.patient_id,
          doctor_id: pharmacist.pharmacist_id,
          queue_id: queueId,
          consultation_type: 'realtime',
          status: 'active',
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // 更新队列状态为 'in_chat'（会话已创建，正在聊天）
      await supabase
        .from('consultation_queue')
        .update({
          status: 'in_chat'
        })
        .eq('id', queueId)

      // 更新药剂师状态
      await supabase
        .from('pharmacist_availability')
        .update({
          is_busy: true,
          current_session_id: session.id,
          current_sessions_count: pharmacist.current_sessions_count + 1
        })
        .eq('id', pharmacist.id)

      return { session, pharmacist }
    } catch (error) {
      console.error('Error matching pharmacist:', error)
      throw error
    }
  },

  // 获取队列位置
  async getQueuePosition(queueId) {
    try {
      const { data: waitingQueues, error } = await supabase
        .from('consultation_queue')
        .select('id, created_at')
        .eq('status', 'waiting')
        .order('created_at', { ascending: true })

      if (error) throw error

      const currentIndex = waitingQueues.findIndex(q => q.id === queueId)
      return currentIndex !== -1 ? currentIndex + 1 : null
    } catch (error) {
      console.error('Error getting queue position:', error)
      return null
    }
  },

  // 取消队列
  async cancelQueue(queueId) {
    try {
      const { error } = await supabase
        .from('consultation_queue')
        .update({ status: 'cancelled' })
        .eq('id', queueId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error cancelling queue:', error)
      throw error
    }
  },

  // 获取在线药剂师数量
  async getOnlinePharmacistsCount() {
    try {
      const { count, error } = await supabase
        .from('pharmacist_availability')
        .select('*', { count: 'exact', head: true })
        .eq('is_online', true)
        .eq('is_busy', false)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error getting online pharmacists count:', error)
      return 0
    }
  },

  // 推荐药物
  async recommendMedication(sessionId, medicationData, pharmacistUserId) {
    try {
      // pharmacistUserId 应该是 user_id，不是 doctor_id
      // 如果传入的是 doctor_id，需要查找对应的 user_id
      let actualUserId = pharmacistUserId

      // 检查是否是 UUID 格式（假设 user_id 和 doctor_id 都是 UUID）
      // 如果 pharmacistUserId 不存在或无效，从会话中获取
      if (!actualUserId) {
        const { data: session } = await supabase
          .from('consultation_sessions')
          .select('doctor_id, doctor:doctors(user_id)')
          .eq('id', sessionId)
          .single()

        if (session?.doctor?.user_id) {
          actualUserId = session.doctor.user_id
        } else if (session?.doctor_id) {
          const { data: doctorData } = await supabase
            .from('doctors')
            .select('user_id')
            .eq('id', session.doctor_id)
            .single()

          if (doctorData?.user_id) {
            actualUserId = doctorData.user_id
          }
        }
      }

      if (!actualUserId) {
        throw new Error('Cannot determine pharmacist user ID')
      }

      const { data, error } = await supabase
        .from('consultation_medications')
        .insert({
          session_id: sessionId,
          medication_name: medicationData.name,
          medication_id: medicationData.id || null,
          dosage: medicationData.dosage,
          frequency: medicationData.frequency,
          duration: medicationData.duration,
          instructions: medicationData.instructions,
          recommended_by: actualUserId, // 使用 user_id
          status: 'pending'
        })
        .select()
        .single()

      if (error) {
        console.error('Error inserting medication:', error)
        throw error
      }

      // 发送系统消息通知用户
      const { error: messageError } = await supabase
        .from('consultation_messages')
        .insert({
          session_id: sessionId,
          sender_id: actualUserId,
          sender_type: 'doctor',
          message_type: 'medication_recommendation',
          content: JSON.stringify({
            medication_id: data.id, // consultation_medications 表的 id
            medication_name: medicationData.name,
            dosage: medicationData.dosage,
            frequency: medicationData.frequency,
            original_medication_id: medicationData.id // 原始药物表的 id
          })
        })

      if (messageError) {
        console.error('Error sending medication message:', messageError)
        // 不抛出错误，因为药物已经推荐成功
      }

      return data
    } catch (error) {
      console.error('Error recommending medication:', error)
      throw error
    }
  },

  // 接受药物推荐
  async acceptMedication(medicationId) {
    try {
      const { data, error } = await supabase
        .from('consultation_medications')
        .update({ status: 'accepted' })
        .eq('id', medicationId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error accepting medication:', error)
      throw error
    }
  },

  // 拒绝药物推荐
  async rejectMedication(medicationId, notes = '') {
    try {
      const { data, error } = await supabase
        .from('consultation_medications')
        .update({ 
          status: 'rejected',
          patient_notes: notes
        })
        .eq('id', medicationId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error rejecting medication:', error)
      throw error
    }
  },

  // 结束咨询
  async endConsultation(sessionId, queueId) {
    try {
      // 更新会话状态
      await supabase
        .from('consultation_sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      // 更新队列状态
      await supabase
        .from('consultation_queue')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', queueId)

      // 更新药剂师状态
      const { data: session } = await supabase
        .from('consultation_sessions')
        .select('doctor_id')
        .eq('id', sessionId)
        .single()

      if (session) {
        const { data: doctor } = await supabase
          .from('doctors')
          .select('id')
          .eq('id', session.doctor_id)
          .single()

        if (doctor) {
          const { data: availability } = await supabase
            .from('pharmacist_availability')
            .select('*')
            .eq('pharmacist_id', doctor.id)
            .single()

          if (availability) {
            const newCount = Math.max(0, availability.current_sessions_count - 1)
            await supabase
              .from('pharmacist_availability')
              .update({
                is_busy: newCount > 0,
                current_session_id: newCount > 0 ? availability.current_session_id : null,
                current_sessions_count: newCount
              })
              .eq('id', availability.id)
          }
        }
      }

      return true
    } catch (error) {
      console.error('Error ending consultation:', error)
      throw error
    }
  }
}

