import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './ConsultationMedicationReview.css'

function ConsultationMedicationReview({ sessionId, user, onContinue, onBack }) {
  const [acceptedMedications, setAcceptedMedications] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalPrice, setTotalPrice] = useState(0)

  useEffect(() => {
    if (sessionId && user) {
      console.log('[ConsultationMedicationReview] Component mounted/updated:', { sessionId, userId: user.id })
      loadAcceptedMedications()
    } else {
      console.warn('[ConsultationMedicationReview] Missing required props:', { sessionId, user: !!user })
    }
  }, [sessionId, user?.id])

  const loadAcceptedMedications = async () => {
    try {
      setLoading(true)
      console.log('[ConsultationMedicationReview] Loading accepted medications for session:', sessionId)
      
      // 获取所有接受的药物
      const { data: medications, error } = await supabase
        .from('consultation_medications')
        .select('*')
        .eq('session_id', sessionId)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false }) // 使用 created_at 而不是 accepted_at，因为 accepted_at 可能不存在

      console.log('[ConsultationMedicationReview] Medications query result:', { medications, error })

      if (error) {
        console.error('[ConsultationMedicationReview] Error querying medications:', error)
        throw error
      }

      if (!medications || medications.length === 0) {
        console.warn('[ConsultationMedicationReview] No accepted medications found for session:', sessionId)
        setAcceptedMedications([])
        setTotalPrice(0)
        setLoading(false)
        return
      }

      // 获取每个药物的价格
      const medicationsWithPrice = await Promise.all(
        medications.map(async (med) => {
          let price = 0
          if (med.medication_id) {
            try {
              const { data: medData, error: medError } = await supabase
                .from('medications')
                .select('price, name')
                .eq('id', med.medication_id)
                .single()
              
              if (medError) {
                console.warn('[ConsultationMedicationReview] Error fetching medication price:', medError, 'for medication_id:', med.medication_id)
              } else if (medData) {
                price = parseFloat(medData.price || 0)
              }
            } catch (err) {
              console.warn('[ConsultationMedicationReview] Exception fetching medication price:', err)
            }
          }

          return {
            ...med,
            price: price,
            displayName: med.medication_name || 'Unknown Medication'
          }
        })
      )

      setAcceptedMedications(medicationsWithPrice)
      
      // 计算总价
      const total = medicationsWithPrice.reduce((sum, med) => sum + med.price, 0)
      setTotalPrice(total)
    } catch (error) {
      console.error('[ConsultationMedicationReview] Error loading accepted medications:', error)
      console.error('[ConsultationMedicationReview] Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        sessionId
      })
      alert(`Failed to load medications: ${error.message || 'Unknown error'}. Please check the console for details.`)
      // 即使出错，也设置空数组，避免无限加载
      setAcceptedMedications([])
      setTotalPrice(0)
    } finally {
      setLoading(false)
    }
  }

  const handleContinue = () => {
    // 将接受的药物转换为购物车格式
    const cartItems = acceptedMedications.map(med => ({
      id: med.medication_id || `consultation-${med.id}`,
      name: med.displayName,
      price: med.price,
      dosage: med.dosage,
      frequency: med.frequency,
      duration: med.duration,
      instructions: med.instructions,
      fromConsultation: true
    }))

    onContinue(cartItems)
  }

  if (loading) {
    return (
      <div className="consultation-medication-review">
        <div className="loading">Loading medications...</div>
      </div>
    )
  }

  if (acceptedMedications.length === 0) {
    return (
      <div className="consultation-medication-review">
        <div className="review-header">
          <h2>Consultation Complete</h2>
          <button className="back-btn" onClick={onBack}>← Back</button>
        </div>
        <div className="no-medications">
          <p>No medications were accepted during this consultation.</p>
          <button className="continue-btn" onClick={onBack}>
            Return to Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="consultation-medication-review">
      <div className="review-header">
        <h2>💊 Review Your Medications</h2>
        <p className="subtitle">Please review the medications recommended by your pharmacist</p>
      </div>

      <div className="medications-list">
        {acceptedMedications.map((medication) => (
          <div key={medication.id} className="medication-card">
            <div className="medication-header">
              <h3>{medication.displayName}</h3>
              <span className="medication-price">RM {medication.price.toFixed(2)}</span>
            </div>
            
            <div className="medication-details">
              {medication.dosage && (
                <div className="detail-item">
                  <span className="label">Dosage:</span>
                  <span className="value">{medication.dosage}</span>
                </div>
              )}
              
              {medication.frequency && (
                <div className="detail-item">
                  <span className="label">Frequency:</span>
                  <span className="value">{medication.frequency}</span>
                </div>
              )}
              
              {medication.duration && (
                <div className="detail-item">
                  <span className="label">Duration:</span>
                  <span className="value">{medication.duration}</span>
                </div>
              )}
              
              {medication.instructions && (
                <div className="detail-item">
                  <span className="label">Instructions:</span>
                  <span className="value">{medication.instructions}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="review-summary">
        <div className="summary-row">
          <span className="summary-label">Total Items:</span>
          <span className="summary-value">{acceptedMedications.length}</span>
        </div>
        <div className="summary-row total">
          <span className="summary-label">Total Price:</span>
          <span className="summary-value">RM {totalPrice.toFixed(2)}</span>
        </div>
      </div>

      <div className="review-actions">
        <button className="back-btn" onClick={onBack}>
          ← Back to Chat
        </button>
        <button className="continue-btn" onClick={handleContinue}>
          Continue to Delivery & Payment →
        </button>
      </div>
    </div>
  )
}

export default ConsultationMedicationReview

