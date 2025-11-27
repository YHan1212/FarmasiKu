import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { consultationService } from '../services/consultationService'
import './MedicationRecommendationForm.css'

function MedicationRecommendationForm({ sessionId, pharmacistId, onRecommend, onCancel }) {
  const [medications, setMedications] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMedication, setSelectedMedication] = useState(null)
  const [formData, setFormData] = useState({
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMedications()
  }, [])

  const loadMedications = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('medications')
        .select('id, name, price, stock')
        .order('name', { ascending: true })

      if (error) throw error
      setMedications(data || [])
    } catch (error) {
      console.error('Error loading medications:', error)
      alert('Failed to load medications')
    } finally {
      setLoading(false)
    }
  }

  const handleMedicationSelect = (medication) => {
    setSelectedMedication(medication)
    setSearchQuery('') // 关闭选单
    setFormData({
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    })
  }

  const handleRemoveSelected = () => {
    setSelectedMedication(null)
    setSearchQuery('')
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!selectedMedication) {
      alert('Please select a medication')
      return
    }

    if (!formData.dosage || !formData.frequency) {
      alert('Please fill in dosage and frequency')
      return
    }

    try {
      const medicationData = {
        id: selectedMedication.id,
        name: selectedMedication.name,
        dosage: formData.dosage,
        frequency: formData.frequency,
        duration: formData.duration || '',
        instructions: formData.instructions || ''
      }

      console.log('[MedicationRecommendationForm] Recommending medication:', {
        sessionId,
        pharmacistId,
        medicationData
      })

      await consultationService.recommendMedication(
        sessionId,
        medicationData,
        pharmacistId
      )

      console.log('[MedicationRecommendationForm] Medication recommended successfully')

      if (onRecommend) {
        onRecommend()
      }

      // 重置表单
      setSelectedMedication(null)
      setFormData({
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      })
      setSearchQuery('')
    } catch (error) {
      console.error('[MedicationRecommendationForm] Error recommending medication:', error)
      alert(`Failed to recommend medication: ${error.message || 'Please check console for details.'}`)
    }
  }

  const filteredMedications = medications.filter(med =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="medication-recommendation-form-overlay">
      <div className="medication-recommendation-form">
        <div className="form-header">
          <h3>💊 Recommend Medication</h3>
          {onCancel && (
            <button className="close-btn" onClick={onCancel}>×</button>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {/* 药物选择 */}
          <div className="form-section">
            <label>Select Medication *</label>
            <input
              type="text"
              placeholder="Search medications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            
            {searchQuery && (
              <div className="medication-list">
                {loading ? (
                  <div className="loading">Loading medications...</div>
                ) : filteredMedications.length === 0 ? (
                  <div className="no-results">No medications found</div>
                ) : (
                  filteredMedications.slice(0, 10).map(med => (
                    <div
                      key={med.id}
                      className={`medication-option ${selectedMedication?.id === med.id ? 'selected' : ''}`}
                      onClick={() => handleMedicationSelect(med)}
                    >
                      <div className="medication-option-name">{med.name}</div>
                      <div className="medication-option-price">RM {parseFloat(med.price || 0).toFixed(2)}</div>
                      {med.stock !== null && (
                        <div className="medication-option-stock">
                          Stock: {med.stock}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {selectedMedication && (
              <div className="selected-medication-card">
                <div className="selected-medication-info">
                  <div className="selected-medication-icon">💊</div>
                  <div className="selected-medication-details">
                    <div className="selected-medication-name">{selectedMedication.name}</div>
                    <div className="selected-medication-price">RM {parseFloat(selectedMedication.price || 0).toFixed(2)}</div>
                  </div>
                </div>
                <button 
                  type="button"
                  className="remove-selected-btn"
                  onClick={handleRemoveSelected}
                  title="Remove selection"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {/* 用法用量 */}
          <div className="form-section">
            <label htmlFor="dosage">Dosage *</label>
            <input
              id="dosage"
              type="text"
              name="dosage"
              value={formData.dosage}
              onChange={handleInputChange}
              placeholder="e.g., 1 tablet, 5ml"
              required
            />
          </div>

          {/* 服用频率 */}
          <div className="form-section">
            <label htmlFor="frequency">Frequency *</label>
            <select
              id="frequency"
              name="frequency"
              value={formData.frequency}
              onChange={handleInputChange}
              required
            >
              <option value="">Select frequency</option>
              <option value="Once daily">Once daily</option>
              <option value="Twice daily">Twice daily</option>
              <option value="Three times daily">Three times daily</option>
              <option value="Four times daily">Four times daily</option>
              <option value="Every 6 hours">Every 6 hours</option>
              <option value="Every 8 hours">Every 8 hours</option>
              <option value="Every 12 hours">Every 12 hours</option>
              <option value="As needed">As needed</option>
            </select>
          </div>

          {/* 服用时长 */}
          <div className="form-section">
            <label htmlFor="duration">Duration</label>
            <input
              id="duration"
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              placeholder="e.g., 7 days, 2 weeks, until symptoms improve"
            />
          </div>

          {/* 特殊说明 */}
          <div className="form-section">
            <label htmlFor="instructions">Special Instructions</label>
            <textarea
              id="instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleInputChange}
              placeholder="e.g., Take with food, Avoid alcohol, etc."
              rows={3}
            />
          </div>

          <div className="form-actions">
            {onCancel && (
              <button type="button" className="cancel-btn" onClick={onCancel}>
                Cancel
              </button>
            )}
            <button type="submit" className="submit-btn" disabled={!selectedMedication}>
              Send Recommendation
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MedicationRecommendationForm

