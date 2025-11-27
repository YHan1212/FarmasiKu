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
    // 格式：01开头，后面8或9位数字
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

    // 验证必填字段
    if (!formData.label || !formData.address_line1 || !formData.phone_number) {
      alert('请填写所有必填字段')
      return
    }

    // 检查地址数量（最多4个）
    if (!editingAddress && addresses.length >= 4) {
      alert('最多只能保存4个地址')
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
        // 更新地址
        const { error } = await supabase
          .from('user_addresses')
          .update(addressData)
          .eq('id', editingAddress.id)

        if (error) throw error
      } else {
        // 添加新地址
        const { error } = await supabase
          .from('user_addresses')
          .insert([addressData])

        if (error) throw error
      }

      // 重置表单
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
      await loadAddresses()
    } catch (error) {
      console.error('Error saving address:', error)
      if (error.message.includes('Maximum 4 addresses')) {
        alert('最多只能保存4个地址')
      } else {
        alert('保存地址失败：' + error.message)
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
    if (!confirm('确定要删除这个地址吗？')) return

    if (!supabase) return

    try {
      const { error } = await supabase
        .from('user_addresses')
        .delete()
        .eq('id', addressId)

      if (error) throw error
      await loadAddresses()
    } catch (error) {
      console.error('Error deleting address:', error)
      alert('删除地址失败：' + error.message)
    }
  }

  const handleSetDefault = async (addressId) => {
    if (!supabase) return

    try {
      // 先取消所有默认地址
      await supabase
        .from('user_addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)

      // 设置新的默认地址
      const { error } = await supabase
        .from('user_addresses')
        .update({ is_default: true })
        .eq('id', addressId)

      if (error) throw error
      await loadAddresses()
    } catch (error) {
      console.error('Error setting default address:', error)
      alert('设置默认地址失败：' + error.message)
    }
  }

  const handleSelectAddress = (address) => {
    if (onSelect) {
      onSelect(address)
    }
  }

  if (loading) {
    return <div className="loading">加载地址中...</div>
  }

  // Check if this is in management mode (no onSelect callback)
  const isManagementMode = !onSelect

  return (
    <div className="address-management">
      <h2>{isManagementMode ? 'Manage Addresses' : 'Select Delivery Address'}</h2>

      {/* 地址列表 */}
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
                {address.is_default && <span className="default-badge">默认</span>}
              </div>
              <div className="address-actions">
                <button
                  className="edit-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEdit(address)
                  }}
                >
                  编辑
                </button>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(address.id)
                  }}
                >
                  删除
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
                设为默认
              </button>
            )}
          </div>
        ))}

        {/* 添加新地址按钮 */}
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
            <p>添加新地址</p>
            <p className="address-count">({addresses.length}/4)</p>
          </div>
        )}
      </div>

      {/* 添加/编辑地址表单 */}
      {showAddForm && (
        <div className="address-form-overlay">
          <div className="address-form-container">
            <h3>{editingAddress ? '编辑地址' : '添加新地址'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>地址标签 *</label>
                <input
                  type="text"
                  name="label"
                  value={formData.label}
                  onChange={handleInputChange}
                  placeholder="例如：家、公司"
                  required
                />
              </div>

              <div className="form-group">
                <label>详细地址 *</label>
                <input
                  type="text"
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleInputChange}
                  placeholder="街道地址"
                  required
                />
              </div>

              <div className="form-group">
                <label>地址第二行</label>
                <input
                  type="text"
                  name="address_line2"
                  value={formData.address_line2}
                  onChange={handleInputChange}
                  placeholder="公寓、楼层等（可选）"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>邮政编码</label>
                  <input
                    type="text"
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleInputChange}
                    placeholder="邮政编码"
                  />
                </div>

                <div className="form-group">
                  <label>城市</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="城市"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>州/省</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="州/省"
                />
              </div>

              <div className="form-group">
                <label>电话号码 *</label>
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
                  取消
                </button>
                <button type="submit" className="save-btn">
                  {editingAddress ? '更新' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 继续按钮 */}
      {onContinue && selectedAddressId && (
        <div className="continue-section">
          <button className="continue-btn" onClick={onContinue}>
            继续
          </button>
        </div>
      )}
    </div>
  )
}

export default AddressManagement

