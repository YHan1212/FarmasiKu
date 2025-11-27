import React, { useState } from 'react'
import './MedicationRecommendationCard.css'

function MedicationRecommendationCard({ medication, onAccept, onReject, isDoctor = false }) {
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectNotes, setRejectNotes] = useState('')

  const handleAccept = () => {
    if (onAccept) {
      onAccept(medication)
    }
  }

  const handleReject = () => {
    if (showRejectForm) {
      // 提交拒绝
      if (onReject) {
        onReject(medication.id, rejectNotes)
      }
      setShowRejectForm(false)
      setRejectNotes('')
    } else {
      // 显示拒绝表单
      setShowRejectForm(true)
    }
  }

  const handleCancelReject = () => {
    setShowRejectForm(false)
    setRejectNotes('')
  }

  if (isDoctor) {
    // 药剂师视角：显示推荐状态
    return (
      <div className="medication-card doctor-view">
        <div className="medication-header">
          <h4>Recommended Medication</h4>
          <span className={`status-badge status-${medication.status}`}>
            {medication.status}
          </span>
        </div>
        <div className="medication-details">
          <div className="medication-name">{medication.medication_name}</div>
          {medication.dosage && (
            <div className="medication-info">
              <strong>Dosage:</strong> {medication.dosage}
            </div>
          )}
          {medication.frequency && (
            <div className="medication-info">
              <strong>Frequency:</strong> {medication.frequency}
            </div>
          )}
          {medication.duration && (
            <div className="medication-info">
              <strong>Duration:</strong> {medication.duration}
            </div>
          )}
          {medication.instructions && (
            <div className="medication-info">
              <strong>Instructions:</strong> {medication.instructions}
            </div>
          )}
        </div>
        {medication.status === 'accepted' && (
          <div className="medication-status-message accepted">
            ✅ Patient has accepted this medication
          </div>
        )}
        {medication.status === 'rejected' && (
          <div className="medication-status-message rejected">
            ❌ Patient has rejected this medication
            {medication.patient_notes && (
              <div className="reject-notes">Notes: {medication.patient_notes}</div>
            )}
          </div>
        )}
      </div>
    )
  }

  // 患者视角：可以接受或拒绝
  if (medication.status !== 'pending') {
    // 已处理，只显示状态
    return (
      <div className="medication-card patient-view">
        <div className="medication-header">
          <h4>Medication Recommendation</h4>
          <span className={`status-badge status-${medication.status}`}>
            {medication.status === 'accepted' ? 'Accepted' : 'Rejected'}
          </span>
        </div>
        <div className="medication-details">
          <div className="medication-name">{medication.medication_name}</div>
          {medication.dosage && (
            <div className="medication-info">
              <strong>Dosage:</strong> {medication.dosage}
            </div>
          )}
          {medication.frequency && (
            <div className="medication-info">
              <strong>Frequency:</strong> {medication.frequency}
            </div>
          )}
          {medication.duration && (
            <div className="medication-info">
              <strong>Duration:</strong> {medication.duration}
            </div>
          )}
          {medication.instructions && (
            <div className="medication-info">
              <strong>Instructions:</strong> {medication.instructions}
            </div>
          )}
        </div>
        {medication.status === 'accepted' && (
          <div className="medication-status-message accepted">
            ✅ You have accepted this medication
          </div>
        )}
      </div>
    )
  }

  // 待处理状态：显示操作按钮
  return (
    <div className="medication-card patient-view pending">
      <div className="medication-header">
        <h4>💊 Medication Recommendation</h4>
        <span className="status-badge status-pending">Pending</span>
      </div>
      
      <div className="medication-details">
        <div className="medication-name">{medication.medication_name}</div>
        {medication.dosage && (
          <div className="medication-info">
            <strong>Dosage:</strong> {medication.dosage}
          </div>
        )}
        {medication.frequency && (
          <div className="medication-info">
            <strong>Frequency:</strong> {medication.frequency}
          </div>
        )}
        {medication.duration && (
          <div className="medication-info">
            <strong>Duration:</strong> {medication.duration}
          </div>
        )}
        {medication.instructions && (
          <div className="medication-info">
            <strong>Instructions:</strong> {medication.instructions}
          </div>
        )}
      </div>

      {!showRejectForm ? (
        <div className="medication-actions">
          <button className="accept-btn" onClick={handleAccept}>
            ✅ Accept & Add to Cart
          </button>
          <button className="reject-btn" onClick={handleReject}>
            ❌ Reject
          </button>
        </div>
      ) : (
        <div className="reject-form">
          <label>Reason for rejection (optional):</label>
          <textarea
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder="Enter reason for rejecting this medication..."
            rows={3}
          />
          <div className="reject-form-actions">
            <button className="submit-reject-btn" onClick={handleReject}>
              Submit Rejection
            </button>
            <button className="cancel-reject-btn" onClick={handleCancelReject}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MedicationRecommendationCard

