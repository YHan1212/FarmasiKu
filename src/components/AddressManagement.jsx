import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import './AddressManagement.css'

function AddressManagement({ user, onSelect, onContinue, selectedAddressId }) {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState(null)
  const [formData, setFormData] = useState({
    label: '',
    address_line1: '',
    address_line2: '',
    postal_code: '',
    city: '',
    state: '',
    phone_number: ''
  })

  useEffect(() => {
    if (user) {
      loadAddresses()
    }
  }, [user])

  const loadAddresses = async () => {
    if (!user || !supabase) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setAddresses(data || [])
    } catch (error) {
      console.error('Error loading addresses:', error)
      setAddresses([])
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validatePhoneNumber = (phone) => {
    // Format: starts with 01, followed by 8 or 9 digits
    const phoneRegex = /^01\d{8,9}$/
    return phoneRegex.test(phone)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // 验证电话号码
    if (!validatePhoneNumber(formData.phone_number)) {
      alert('Phone number format is incorrect. Format: 01XXXXXXXX (8 or 9 digits after 01)')
      return
    }

    // Validate required fields
    if (!formData.label || !formData.address_line1 || !formData.phone_number) {
      alert('Please fill in all required fields')
      return
    }

    // Check address count (max 4)
    if (!editingAddress && addresses.length >= 4) {
      alert('You can only save up to 4 addresses')
      return
    }

    if (!user || !supabase) return

    try {
      const addressData = {
        user_id: user.id,
        label: formData.label,
        address_line1: formData.address_line1,
        address_line2: formData.address_line2 || null,
        postal_code: formData.postal_code || null,
        city: formData.city || null,
        state: formData.state || null,
        phone_number: formData.phone_number,
        is_default: editingAddress ? editingAddress.is_default : (addresses.length === 0)
      }

      if (editingAddress) {
        // Update address
        const { error } = await supabase
          .from('user_addresses')
          .update(addressData)
          .eq('id', editingAddress.id)

        if (error) throw error
      } else {
        // Add new address
        const { error } = await supabase
          .from('user_addresses')
          .insert([addressData])

        if (error) throw error
      }

      // Reset form
      setFormData({
        label: '',
        address_line1: '',
        address_line2: '',
        postal_code: '',
        city: '',
        state: '',
        phone_number: ''
      })
      setShowAddForm(false)
      setEditingAddress(null)
      // Show loading for at least 1.5 seconds
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1500))
      await loadAddresses()
    } catch (error) {
      console.error('Error saving address:', error)
      setLoading(false)
      if (error.message.includes('Maximum 4 addresses')) {
        alert('You can only save up to 4 addresses')
      } else {
        alert('Failed to save address: ' + error.message)
      }
    }
  }

  const handleEdit = (address) => {
    setEditingAddress(address)
    setFormData({
      label: address.label,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      postal_code: address.postal_code || '',
      city: address.city || '',
      state: address.state || '',
      phone_number: address.phone_number
    })
    setShowAddForm(true)
  }

  const handleDelete = async (addressId) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    if (!supabase) return

    try {
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', addressId)

      if (error) throw error
      // Show loading for at least 1.5 seconds
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1500))
      await loadAddresses()
    } catch (error) {
      console.error('Error deleting address:', error)
      setLoading(false)
      alert('Failed to delete address: ' + error.message)
    }
  }

  const handleSetDefault = async (addressId) => {
    if (!supabase) return

    try {
      // Clear all default addresses first
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)

      // Set new default address
      const { error } = await supabase
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', addressId)

      if (error) throw error
      // Show loading for at least 1.5 seconds
      setLoading(true)
      await new Promise(resolve => setTimeout(resolve, 1500))
      await loadAddresses()
    } catch (error) {
      console.error('Error setting default address:', error)
      setLoading(false)
      alert('Failed to set default address: ' + error.message)
    }
  }

  const handleSelectAddress = (address) => {
    if (onSelect) {
      onSelect(address)
    }
  }

  if (loading) {
    return <div className="loading">Loading addresses...</div>
  }

  // Check if this is in management mode (no onSelect callback)
  const isManagementMode = !onSelect

  return (
    <div className="address-management">
      <h2>{isManagementMode ? 'Manage Addresses' : 'Select Delivery Address'}</h2>

      {/* Address list */}
      <div className="addresses-list">
        {addresses.map((address) => (
          <div
            key={address.id}
            className={`address-card ${selectedAddressId === address.id ? 'selected' : ''} ${address.is_default ? 'default' : ''} ${isManagementMode ? 'management-mode' : ''}`}
            onClick={isManagementMode ? undefined : () => handleSelectAddress(address)}
          >
            <div className="address-header">
              <div className="address-label-row">
                <span className="address-label">{address.label}</span>
                {address.is_default && <span className="default-badge">Default</span>}
              </div>
              <div className="address-actions">
                <button
                  className="edit-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEdit(address)
                  }}
                >
                  Edit
                </button>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(address.id)
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
            <div className="address-details">
              <p className="address-text">
                {address.address_line1}
                {address.address_line2 && `, ${address.address_line2}`}
                {address.postal_code && `, ${address.postal_code}`}
                {address.city && `, ${address.city}`}
                {address.state && `, ${address.state}`}
              </p>
              <p className="phone-number">📞 {address.phone_number}</p>
            </div>
            {!address.is_default && (
              <button
                className="set-default-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  handleSetDefault(address.id)
                }}
              >
                Set as Default
              </button>
            )}
          </div>
        ))}

        {/* Add new address button */}
        {addresses.length < 4 && (
          <div
            className="add-address-card"
            onClick={() => {
              setShowAddForm(true)
              setEditingAddress(null)
              setFormData({
                label: '',
                address_line1: '',
                address_line2: '',
                postal_code: '',
                city: '',
                state: '',
                phone_number: ''
              })
            }}
          >
            <div className="add-address-icon">+</div>
            <p>Add New Address</p>
            <p className="address-count">({addresses.length}/4)</p>
          </div>
        )}
      </div>

      {/* Add/Edit address form */}
      {showAddForm && (
        <div className="address-form-overlay">
          <div className="address-form-container">
            <h3>{editingAddress ? 'Edit Address' : 'Add New Address'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Address Name *</label>
                <input
                  type="text"
                  name="label"
                  value={formData.label}
                  onChange={handleInputChange}
                  placeholder="e.g., Home, Office"
                  required
                />
              </div>

              <div className="form-group">
                <label>Street Address *</label>
                <input
                  type="text"
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleInputChange}
                  placeholder="Street address"
                  required
                />
              </div>

              <div className="form-group">
                <label>Address Line 2</label>
                <input
                  type="text"
                  name="address_line2"
                  value={formData.address_line2}
                  onChange={handleInputChange}
                  placeholder="Apartment, floor, etc. (optional)"
                />
              </div>

              <div className="form-row">
              <div className="form-group">
                <label>Postcode</label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleInputChange}
                  placeholder="Postcode"
                />
              </div>

                <div className="form-group">
                  <label>City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="City"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="State"
                />
              </div>

              <div className="form-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  placeholder="01XXXXXXXX (8 or 9 digits)"
                  pattern="01\d{8,9}"
                  required
                />
                <small>Format: 01 followed by 8 or 9 digits (e.g., 0123456789 or 01234567890)</small>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => {
                  setShowAddForm(false)
                  setEditingAddress(null)
                }}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {editingAddress ? 'Save Changes' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Continue button */}
      {onContinue && selectedAddressId && (
        <div className="continue-section">
          <button className="continue-btn" onClick={onContinue}>
            Continue
          </button>
        </div>
      )}
    </div>
  )
}

export default AddressManagement

