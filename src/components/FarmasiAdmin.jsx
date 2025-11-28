import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { databaseService } from '../services/databaseService'
import AcceptOrderDialog from './AcceptOrderDialog'
import PharmacistDashboard from './PharmacistDashboard'
import './FarmasiAdmin.css'

function FarmasiAdmin({ user, onBack, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard') // 'dashboard', 'orders', 'users', 'consultations', 'medications', 'doctors', 'pharmacist'
  
  console.log('[FarmasiAdmin] Component rendered, activeTab:', activeTab, 'user:', user?.id)
  
  const [loading, setLoading] = useState(true)
  
  // Dashboard stats
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalUsers: 0,
    totalConsultations: 0,
    totalRevenue: 0,
    todayOrders: 0,
    todayRevenue: 0
  })
  
  // Data
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [consultations, setConsultations] = useState([])
  const [medications, setMedications] = useState([])
  const [doctors, setDoctors] = useState([])
  
  // Filters
  const [orderFilter, setOrderFilter] = useState('all') // 'all', 'today', 'week', 'month'
  const [searchQuery, setSearchQuery] = useState('')
  
  // Medication editing
  const [editingMed, setEditingMed] = useState(null)
  const [editPrice, setEditPrice] = useState('')
  const [editStock, setEditStock] = useState('')
  const [addStockInputs, setAddStockInputs] = useState({}) // { medId: amount }
  
  // Doctor management
  const [editingDoctor, setEditingDoctor] = useState(null)
  const [showAddDoctor, setShowAddDoctor] = useState(false)
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    specialization: '',
    bio: '',
    is_available: true
  })

  // Order management
  const [acceptingOrder, setAcceptingOrder] = useState(null) // Order being accepted

  useEffect(() => {
    loadDashboardData()
  }, [])

  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders()
    } else if (activeTab === 'users') {
      loadUsers()
    } else if (activeTab === 'consultations') {
      loadConsultations()
    } else if (activeTab === 'medications') {
      loadMedications()
    } else if (activeTab === 'doctors') {
      loadDoctors()
    }
  }, [activeTab, orderFilter])

  // Set up realtime subscription for orders
  useEffect(() => {
    if (!supabase) return

    // Subscribe to orders table changes
    const ordersChannel = supabase
      .channel('orders_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order change detected:', payload)
          // Reload orders if we're on the orders tab
          if (activeTab === 'orders') {
            loadOrders()
          }
          // Also reload dashboard data to update stats
          if (activeTab === 'dashboard') {
            loadDashboardData()
          }
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(ordersChannel)
    }
  }, [activeTab, supabase])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // Load stats
      const [ordersData, usersData, consultationsData] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('user_profiles').select('*'),
        supabase.from('consultations').select('*')
      ])

      const allOrders = ordersData.data || []
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const todayOrders = allOrders.filter(order => {
        const orderDate = new Date(order.created_at)
        return orderDate >= today
      })

      const totalRevenue = allOrders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0)
      const todayRevenue = todayOrders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0)

      setStats({
        totalOrders: allOrders.length,
        totalUsers: (usersData.data || []).length,
        totalConsultations: (consultationsData.data || []).length,
        totalRevenue,
        todayOrders: todayOrders.length,
        todayRevenue
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOrders = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false })
      
      console.log('Loading orders for admin...')

      // Apply date filter
      if (orderFilter === 'today') {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        query = query.gte('created_at', today.toISOString())
      } else if (orderFilter === 'week') {
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        query = query.gte('created_at', weekAgo.toISOString())
      } else if (orderFilter === 'month') {
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        query = query.gte('created_at', monthAgo.toISOString())
      }

      const { data, error } = await query
      if (error) {
        console.error('Error loading orders:', error)
        throw error
      }
      
      // Parse delivery_address if it's a string
      const parsedOrders = (data || []).map(order => ({
        ...order,
        delivery_address: typeof order.delivery_address === 'string' 
          ? (order.delivery_address ? JSON.parse(order.delivery_address) : null)
          : order.delivery_address
      }))
      
      console.log('Orders loaded:', parsedOrders.length, 'orders')
      setOrders(parsedOrders)
    } catch (error) {
      console.error('Error loading orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      setLoading(true)
      // Get user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      // Try to get user emails from auth.users (requires admin access)
      // If not available, we'll just show profiles without emails
      try {
        // This might not work without admin privileges, so we catch the error
        const { data: authUsers } = await supabase.auth.admin.listUsers()
        
        const usersWithEmail = (profiles || []).map(profile => {
          const authUser = authUsers?.users?.find(u => u.id === profile.id)
          return {
            ...profile,
            email: authUser?.email || 'N/A',
            created_at: authUser?.created_at || profile.created_at
          }
        })

        setUsers(usersWithEmail)
      } catch (adminError) {
        // Admin API not available, just use profiles
        console.log('Admin API not available, using profiles only')
        setUsers((profiles || []).map(p => ({ 
          ...p, 
          email: 'N/A (Admin access required)',
          created_at: p.created_at 
        })))
      }
    } catch (error) {
      console.error('Error loading users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const loadConsultations = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setConsultations(data || [])
    } catch (error) {
      console.error('Error loading consultations:', error)
      setConsultations([])
    } finally {
      setLoading(false)
    }
  }

  const loadMedications = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setMedications(data || [])
    } catch (error) {
      console.error('Error loading medications:', error)
      setMedications([])
    } finally {
      setLoading(false)
    }
  }

  const handleEditMedication = (med) => {
    setEditingMed(med.id)
    setEditPrice(med.price.toString())
    setEditStock(med.stock?.toString() || '0')
  }

  const handleSaveEdit = async (medId) => {
    try {
      // Validate inputs
      if (!editPrice || editPrice.trim() === '') {
        alert('Please enter a valid price')
        return
      }

      const priceValue = parseFloat(editPrice)
      if (isNaN(priceValue) || priceValue < 0) {
        alert('Please enter a valid positive price')
        return
      }

      if (editStock === '' || editStock === null || editStock === undefined) {
        alert('Please enter a valid stock quantity')
        return
      }

      const stockValue = parseInt(editStock)
      if (isNaN(stockValue) || stockValue < 0) {
        alert('Please enter a valid non-negative stock quantity')
        return
      }

      const updates = {
        price: priceValue,
        stock: stockValue,
        updated_at: new Date().toISOString()
      }

      console.log('Updating medication:', medId, updates)

      const { data, error } = await supabase
        .from('medications')
        .update(updates)
        .eq('id', medId)
        .select()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Update successful:', data)

      setEditingMed(null)
      setEditPrice('')
      setEditStock('')
      await loadMedications()
      
      alert('Medication updated successfully!')
    } catch (error) {
      console.error('Error updating medication:', error)
      alert(`Failed to update medication: ${error.message || 'Unknown error'}. Please check the console for details.`)
    }
  }

  const handleAddStock = async (medId, currentStock) => {
    try {
      const addAmount = parseInt(addStockInputs[medId] || '0')
      if (isNaN(addAmount) || addAmount <= 0) {
        alert('Please enter a valid positive number')
        return
      }

      const newStock = (currentStock || 0) + addAmount

      const { error } = await supabase
        .from('medications')
        .update({ 
          stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', medId)

      if (error) throw error

      // Clear the input for this medication
      setAddStockInputs(prev => {
        const newInputs = { ...prev }
        delete newInputs[medId]
        return newInputs
      })
      await loadMedications()
    } catch (error) {
      console.error('Error adding stock:', error)
      alert('Failed to add stock. Please try again.')
    }
  }

  const handleAddStockInputChange = (medId, value) => {
    setAddStockInputs(prev => ({
      ...prev,
      [medId]: value
    }))
  }

  const handleCancelEdit = () => {
    setEditingMed(null)
    setEditPrice('')
    setEditStock('')
  }

  const loadDoctors = async () => {
    try {
      setLoading(true)
      // Load all doctors (including unavailable ones) for admin
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        // If error due to RLS, try loading available ones only
        if (error.code === 'PGRST116' || error.message.includes('policy')) {
          const { data: availableData } = await supabase
            .from('doctors')
            .select('*')
            .eq('is_available', true)
            .order('created_at', { ascending: false })
          setDoctors(availableData || [])
          return
        }
        throw error
      }
      setDoctors(data || [])
    } catch (error) {
      console.error('Error loading doctors:', error)
      setDoctors([])
    } finally {
      setLoading(false)
    }
  }

  const handleAddDoctor = async () => {
    try {
      if (!doctorForm.name.trim()) {
        alert('Please enter pharmacist name')
        return
      }

      const { error } = await supabase
        .from('doctors')
        .insert([{
          name: doctorForm.name,
          specialization: doctorForm.specialization || null,
          bio: doctorForm.bio || null,
          is_available: doctorForm.is_available
        }])

      if (error) throw error

      setShowAddDoctor(false)
      setDoctorForm({ name: '', specialization: '', bio: '', is_available: true })
      await loadDoctors()
      alert('Pharmacist added successfully!')
    } catch (error) {
      console.error('Error adding doctor:', error)
      alert(`Failed to add pharmacist: ${error.message || 'Unknown error'}`)
    }
  }

  const handleEditDoctor = (doctor) => {
    setEditingDoctor(doctor.id)
    setDoctorForm({
      name: doctor.name,
      specialization: doctor.specialization || '',
      bio: doctor.bio || '',
      is_available: doctor.is_available
    })
  }

  const handleSaveDoctor = async (doctorId) => {
    try {
      if (!doctorForm.name.trim()) {
        alert('Please enter pharmacist name')
        return
      }

      const { error } = await supabase
        .from('doctors')
        .update({
          name: doctorForm.name,
          specialization: doctorForm.specialization || null,
          bio: doctorForm.bio || null,
          is_available: doctorForm.is_available,
          updated_at: new Date().toISOString()
        })
        .eq('id', doctorId)

      if (error) throw error

      setEditingDoctor(null)
      setDoctorForm({ name: '', specialization: '', bio: '', is_available: true })
      await loadDoctors()
      alert('Pharmacist updated successfully!')
    } catch (error) {
      console.error('Error updating doctor:', error)
      alert(`Failed to update pharmacist: ${error.message || 'Unknown error'}`)
    }
  }

  const handleDeleteDoctor = async (doctorId) => {
    if (!confirm('Are you sure you want to delete this pharmacist? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('doctors')
        .delete()
        .eq('id', doctorId)

      if (error) throw error

      await loadDoctors()
      alert('Pharmacist deleted successfully!')
    } catch (error) {
      console.error('Error deleting doctor:', error)
      alert(`Failed to delete pharmacist: ${error.message || 'Unknown error'}`)
    }
  }

  const handleToggleDoctorAvailability = async (doctorId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('doctors')
        .update({
          is_available: !currentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', doctorId)

      if (error) throw error

      await loadDoctors()
    } catch (error) {
      console.error('Error toggling doctor availability:', error)
      alert('Failed to update pharmacist availability')
    }
  }

  const handleLinkDoctorToUser = async (doctorId) => {
    if (!user?.id) {
      alert('Please login first to link a doctor account.')
      return
    }

    if (!confirm('Link this pharmacist account to your current user account? You will be able to reply to consultations as this pharmacist.')) {
      return
    }

    try {
      // Check if another doctor is already linked to this user
      const { data: existingDoctor } = await supabase
        .from('doctors')
        .select('id, name')
        .eq('user_id', user.id)
        .single()

      if (existingDoctor && existingDoctor.id !== doctorId) {
        if (!confirm(`Another pharmacist (${existingDoctor.name}) is already linked to your account. Replace it with this pharmacist?`)) {
          return
        }
      }

      const { error } = await supabase
        .from('doctors')
        .update({
          user_id: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', doctorId)

      if (error) throw error

      await loadDoctors()
      alert('Pharmacist account linked successfully! You can now reply to consultations as this pharmacist.')
    } catch (error) {
      console.error('Error linking doctor to user:', error)
      alert(`Failed to link pharmacist: ${error.message || 'Unknown error'}`)
    }
  }

  const handleUnlinkDoctorFromUser = async (doctorId) => {
    if (!confirm('Are you sure you want to unlink this pharmacist account from your user account? You will no longer be able to reply to consultations as this pharmacist.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('doctors')
        .update({
          user_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', doctorId)

      if (error) throw error

      await loadDoctors()
      alert('Pharmacist account unlinked successfully!')
    } catch (error) {
      console.error('Error unlinking doctor from user:', error)
      alert(`Failed to unlink pharmacist: ${error.message || 'Unknown error'}`)
    }
  }

  const handleToggleUserRole = async (userId, currentRole) => {
    if (!confirm(`Are you sure you want to ${currentRole === 'admin' ? 'remove admin privileges from' : 'make'} this user?`)) {
      return
    }

    try {
      const newRole = currentRole === 'admin' ? 'user' : 'admin'
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      // Reload users to reflect the change
      await loadUsers()
      alert(`User role updated to ${newRole} successfully!`)
    } catch (error) {
      console.error('Error updating user role:', error)
      alert(`Failed to update user role: ${error.message || 'Unknown error'}`)
    }
  }

  const handleAcceptOrder = async (orderId, data) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({
          delivery_status: 'accepted',
          estimated_delivery_time: data.estimatedDeliveryTime,
          accepted_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      // Close dialog
      setAcceptingOrder(null)
      
      // Reload orders
      await loadOrders()
      
      alert('Order accepted successfully!')
    } catch (error) {
      console.error('Error accepting order:', error)
      alert(`Failed to accept order: ${error.message || 'Unknown error'}`)
    }
  }

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      const updateData = {
        delivery_status: status,
        updated_at: new Date().toISOString()
      }

      // Add timestamp based on status
      if (status === 'preparing') {
        updateData.preparing_at = new Date().toISOString()
      } else if (status === 'out_for_delivery') {
        updateData.out_for_delivery_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

      if (error) throw error

      // Reload orders
      await loadOrders()
      
      alert(`Order status updated to ${status} successfully!`)
    } catch (error) {
      console.error('Error updating order status:', error)
      alert(`Failed to update order status: ${error.message || 'Unknown error'}`)
    }
  }

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      order.id.toLowerCase().includes(query) ||
      order.payment_method?.toLowerCase().includes(query) ||
      order.order_items?.some(item => 
        item.medication_name?.toLowerCase().includes(query)
      )
    )
  })

  const formatCurrency = (amount) => {
    return `RM ${parseFloat(amount || 0).toFixed(2)}`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && activeTab === 'dashboard') {
    return (
      <div className="admin-container">
        <div className="loading">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <div className="admin-title-section">
          <div className="admin-title">
            <h1>🏥 farmasiKu Admin</h1>
            <p>Management Dashboard</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {onBack && (
              <button className="back-button" onClick={onBack}>
                ← Back to App
              </button>
            )}
            {onLogout && (
              <button 
                className="logout-button-header" 
                onClick={onLogout}
                style={{
                  background: '#EF4444',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.3s'
                }}
              >
                🚪 Logout
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button
          className={`tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📦 Orders ({stats.totalOrders})
        </button>
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users ({stats.totalUsers})
        </button>
        <button
          className={`tab ${activeTab === 'consultations' ? 'active' : ''}`}
          onClick={() => setActiveTab('consultations')}
        >
          💬 Consultations ({stats.totalConsultations})
        </button>
        <button
          className={`tab ${activeTab === 'medications' ? 'active' : ''}`}
          onClick={() => setActiveTab('medications')}
        >
          💊 Medications
        </button>
        <button
          className={`tab ${activeTab === 'doctors' ? 'active' : ''}`}
          onClick={() => setActiveTab('doctors')}
        >
          👨‍⚕️ Pharmacists ({doctors.length})
        </button>
        <button
          className={`tab ${activeTab === 'pharmacist' ? 'active' : ''}`}
          onClick={() => {
            console.log('[FarmasiAdmin] Clicking Pharmacist Dashboard tab')
            setActiveTab('pharmacist')
          }}
        >
          💬 Pharmacist Dashboard
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'dashboard' && (
          <div className="dashboard">
            <div className="stats-grid">
              <div className="stat-card revenue">
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <h3>Total Revenue</h3>
                  <p className="stat-value">{formatCurrency(stats.totalRevenue)}</p>
                  <p className="stat-subtitle">Today: {formatCurrency(stats.todayRevenue)}</p>
                </div>
              </div>

              <div className="stat-card orders">
                <div className="stat-icon">📦</div>
                <div className="stat-info">
                  <h3>Total Orders</h3>
                  <p className="stat-value">{stats.totalOrders}</p>
                  <p className="stat-subtitle">Today: {stats.todayOrders}</p>
                </div>
              </div>

              <div className="stat-card users">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>Total Users</h3>
                  <p className="stat-value">{stats.totalUsers}</p>
                  <p className="stat-subtitle">Registered users</p>
                </div>
              </div>

              <div className="stat-card consultations">
                <div className="stat-icon">💬</div>
                <div className="stat-info">
                  <h3>Consultations</h3>
                  <p className="stat-value">{stats.totalConsultations}</p>
                  <p className="stat-subtitle">Total sessions</p>
                </div>
              </div>
            </div>

            <div className="recent-activity">
              <h2>Recent Orders</h2>
              <div className="activity-list">
                {loading ? (
                  <div className="loading">Loading...</div>
                ) : (
                  <>
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="activity-item">
                        <div className="activity-info">
                          <strong>Order #{order.id.substring(0, 8)}</strong>
                          <span>{formatDate(order.created_at)}</span>
                        </div>
                        <div className="activity-amount">
                          {formatCurrency(order.total_amount)}
                        </div>
                      </div>
                    ))}
                    {orders.length === 0 && (
                      <div className="empty-state">No recent orders</div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="orders-section">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div className="filters">
                <select 
                  value={orderFilter} 
                  onChange={(e) => setOrderFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Orders</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              <button
                onClick={loadOrders}
                style={{
                  background: '#3B82F6',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.3s'
                }}
                onMouseOver={(e) => e.target.style.background = '#2563EB'}
                onMouseOut={(e) => e.target.style.background = '#3B82F6'}
              >
                🔄 Refresh
              </button>
            </div>

            {loading ? (
              <div className="loading">Loading orders...</div>
            ) : (
              <div className="orders-list">
                {filteredOrders.length === 0 ? (
                  <div className="empty-state">No orders found</div>
                ) : (
                  filteredOrders.map((order) => (
                    <div key={order.id} className="order-card-admin">
                      <div className="order-header-admin">
                        <div>
                          <h3>Order #{order.id.substring(0, 8)}</h3>
                          <p className="order-date">{formatDate(order.created_at)}</p>
                        </div>
                        <div className="order-meta">
                          <span className={`status-badge status-${order.delivery_status || order.status || 'pending'}`}>
                            {order.delivery_status || order.status || 'pending'}
                          </span>
                          <span className="order-total">{formatCurrency(order.total_amount)}</span>
                        </div>
                      </div>

                      {/* Delivery Information */}
                      {(order.delivery_address || order.phone_number) && (
                        <div className="delivery-info-section">
                          {order.delivery_address && (
                            <div className="delivery-address-info">
                              <strong>📍 Delivery Address:</strong>
                              <p>{order.delivery_address.address_line1}</p>
                              {order.delivery_address.address_line2 && <p>{order.delivery_address.address_line2}</p>}
                              {order.delivery_address.postal_code && <p>{order.delivery_address.postal_code}</p>}
                              {order.delivery_address.city && order.delivery_address.state && (
                                <p>{order.delivery_address.city}, {order.delivery_address.state}</p>
                              )}
                            </div>
                          )}
                          {order.phone_number && (
                            <div className="delivery-phone-info">
                              <strong>📞 Phone:</strong> {order.phone_number}
                            </div>
                          )}
                          {order.estimated_delivery_time && (
                            <div className="estimated-delivery-info">
                              <strong>⏰ Estimated Delivery:</strong> {formatDate(order.estimated_delivery_time)}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="order-items-admin">
                        {order.order_items?.map((item, index) => (
                          <div key={index} className="order-item-admin">
                            <span className="item-name">{item.medication_name}</span>
                            <span className="item-price">{formatCurrency(item.medication_price)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="order-footer-admin">
                        <span>Payment: {order.payment_method || 'N/A'}</span>
                        {order.user_id && (
                          <span>User ID: {order.user_id.substring(0, 8)}...</span>
                        )}
                      </div>

                      {/* 订单操作按钮 */}
                      <div className="order-actions">
                        {(!order.delivery_status || order.delivery_status === 'pending') && (
                          <button
                            className="accept-order-btn"
                            onClick={() => setAcceptingOrder(order)}
                          >
                            ✅ Accept Order
                          </button>
                        )}
                        {order.delivery_status === 'accepted' && (
                          <button
                            className="prepare-order-btn"
                            onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}
                          >
                            📦 Mark Preparing
                          </button>
                        )}
                        {order.delivery_status === 'preparing' && (
                          <button
                            className="deliver-order-btn"
                            onClick={() => handleUpdateOrderStatus(order.id, 'out_for_delivery')}
                          >
                            🚚 Out for Delivery
                          </button>
                        )}
                        {order.delivery_status === 'out_for_delivery' && (
                          <div className="delivery-status-info">
                            <span className="delivery-status-text">🚚 Out for Delivery</span>
                            {order.estimated_delivery_time && (
                              <span className="delivery-time-text">
                                Estimated: {formatDate(order.estimated_delivery_time)}
                              </span>
                            )}
                          </div>
                        )}
                        {order.delivery_status === 'delivered' && (
                          <div className="delivered-status">
                            ✅ 已送达
                            {order.actual_delivery_time && (
                              <span className="delivered-time">
                                {formatDate(order.actual_delivery_time)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-section">
            {loading ? (
              <div className="loading">Loading users...</div>
            ) : (
              <div className="users-list">
                {users.length === 0 ? (
                  <div className="empty-state">No users found</div>
                ) : (
                  users.map((user) => (
                    <div key={user.id} className="user-card">
                      <div className="user-info">
                        <h3>{user.email || 'N/A'}</h3>
                        <p>Age: {user.age || 'Not set'}</p>
                        <p>
                          <strong>Role:</strong>{' '}
                          <span className={`role-badge role-${user.role || 'user'}`}>
                            {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                          </span>
                        </p>
                        <p className="user-date">
                          Joined: {formatDate(user.created_at)}
                        </p>
                      </div>
                      <div className="user-actions">
                        <button
                          className={`role-toggle-btn ${user.role === 'admin' ? 'admin-active' : ''}`}
                          onClick={() => handleToggleUserRole(user.id, user.role)}
                          disabled={loading}
                        >
                          {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                        </button>
                        <div className="user-id">
                          ID: {user.id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'consultations' && (
          <div className="consultations-section">
            {loading ? (
              <div className="loading">Loading consultations...</div>
            ) : (
              <div className="consultations-list">
                {consultations.length === 0 ? (
                  <div className="empty-state">No consultations found</div>
                ) : (
                  consultations.map((consultation) => (
                    <div key={consultation.id} className="consultation-card">
                      <div className="consultation-header">
                        <h3>Consultation #{consultation.id.substring(0, 8)}</h3>
                        <span className="consultation-date">{formatDate(consultation.created_at)}</span>
                      </div>
                      <div className="consultation-body">
                        <p><strong>Body Part:</strong> {consultation.body_part || 'N/A'}</p>
                        <p><strong>Symptoms:</strong> {consultation.symptoms?.join(', ') || 'N/A'}</p>
                        {consultation.user_id && (
                          <p><strong>User ID:</strong> {consultation.user_id.substring(0, 8)}...</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pharmacist' && (
          <>
            {console.log('[FarmasiAdmin] Rendering PharmacistDashboard, user:', user?.id)}
            <PharmacistDashboard
              user={user}
              onBack={() => setActiveTab('dashboard')}
            />
          </>
        )}

        {activeTab === 'medications' && (
          <div className="medications-section">
            <div className="section-header">
              <h2>Medication Inventory Management</h2>
              <input
                type="text"
                placeholder="Search medications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
            {loading ? (
              <div className="loading">Loading medications...</div>
            ) : (
              <div className="medications-list">
                {medications.filter(med => 
                  !searchQuery || med.name.toLowerCase().includes(searchQuery.toLowerCase())
                ).length === 0 ? (
                  <div className="empty-state">No medications found</div>
                ) : (
                  medications
                    .filter(med => 
                      !searchQuery || med.name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map((med) => (
                    <div key={med.id} className={`medication-card ${med.stock === 0 ? 'out-of-stock' : ''}`}>
                      {editingMed === med.id ? (
                        <div className="medication-edit-form">
                          <div className="edit-row">
                            <label>Price (RM):</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editPrice}
                              onChange={(e) => setEditPrice(e.target.value)}
                              className="edit-input"
                            />
                          </div>
                          <div className="edit-row">
                            <label>Stock:</label>
                            <input
                              type="number"
                              min="0"
                              value={editStock}
                              onChange={(e) => setEditStock(e.target.value)}
                              className="edit-input"
                              placeholder="Enter stock quantity"
                            />
                          </div>
                          <div className="edit-actions">
                            <button 
                              className="save-btn"
                              onClick={() => handleSaveEdit(med.id)}
                            >
                              Save
                            </button>
                            <button 
                              className="cancel-btn"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="medication-header">
                            <div>
                              <h3>{med.name}</h3>
                              <p className="medication-id">ID: {med.id.substring(0, 8)}...</p>
                            </div>
                            <div className="medication-meta">
                              <span className="medication-price">{formatCurrency(med.price)}</span>
                              <span className={`stock-badge ${med.stock === 0 ? 'out-of-stock' : med.stock < 10 ? 'low-stock' : 'in-stock'}`}>
                                Stock: {med.stock || 0}
                              </span>
                            </div>
                          </div>
                          {med.age_restrictions && (
                            <p className="medication-restrictions">
                              Age Restrictions: {JSON.stringify(med.age_restrictions)}
                            </p>
                          )}
                          <div className="medication-footer">
                            <p className="medication-status">
                              Status: <span className={med.is_active ? 'active' : 'inactive'}>
                                {med.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </p>
                            <div className="medication-actions">
                              <div className="add-stock-group">
                                <input
                                  type="number"
                                  placeholder="Add stock"
                                  value={addStockInputs[med.id] || ''}
                                  onChange={(e) => handleAddStockInputChange(med.id, e.target.value)}
                                  className="add-stock-input"
                                  min="1"
                                />
                                <button
                                  className="add-stock-btn"
                                  onClick={() => handleAddStock(med.id, med.stock)}
                                >
                                  + Add
                                </button>
                              </div>
                              <button
                                className="edit-btn"
                                onClick={() => handleEditMedication(med)}
                              >
                                ✏️ Edit
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'doctors' && (
          <div className="doctors-section">
            <div className="section-header">
              <h2>Doctor Management</h2>
              <button
                className="add-doctor-btn"
                onClick={() => {
                  setShowAddDoctor(true)
                  setEditingDoctor(null)
                  setDoctorForm({ name: '', specialization: '', bio: '', is_available: true })
                }}
              >
                + Add Pharmacist
              </button>
            </div>

            {showAddDoctor && (
              <div className="doctor-form-card">
                <h3>Add New Pharmacist</h3>
                <div className="form-group">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={doctorForm.name}
                    onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                    placeholder="Dr. John Doe"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Specialization</label>
                  <input
                    type="text"
                    value={doctorForm.specialization}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                    placeholder="General Practice, Cardiology, etc."
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    value={doctorForm.bio}
                    onChange={(e) => setDoctorForm({ ...doctorForm, bio: e.target.value })}
                    placeholder="Pharmacist's bio and qualifications..."
                    className="form-textarea"
                    rows="3"
                  />
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={doctorForm.is_available}
                      onChange={(e) => setDoctorForm({ ...doctorForm, is_available: e.target.checked })}
                    />
                    Available for consultations
                  </label>
                </div>
                <div className="form-actions">
                  <button className="save-btn" onClick={handleAddDoctor}>
                    Add Pharmacist
                  </button>
                  <button className="cancel-btn" onClick={() => setShowAddDoctor(false)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="loading">Loading doctors...</div>
            ) : (
              <div className="doctors-list">
                {doctors.length === 0 ? (
                  <div className="empty-state">No pharmacists found. Add your first pharmacist!</div>
                ) : (
                  doctors.map((doctor) => (
                    <div key={doctor.id} className={`doctor-card ${!doctor.is_available ? 'unavailable' : ''}`}>
                      {editingDoctor === doctor.id ? (
                        <div className="doctor-edit-form">
                          <div className="form-group">
                            <label>Name *</label>
                            <input
                              type="text"
                              value={doctorForm.name}
                              onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                              className="form-input"
                            />
                          </div>
                          <div className="form-group">
                            <label>Specialization</label>
                            <input
                              type="text"
                              value={doctorForm.specialization}
                              onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                              className="form-input"
                            />
                          </div>
                          <div className="form-group">
                            <label>Bio</label>
                            <textarea
                              value={doctorForm.bio}
                              onChange={(e) => setDoctorForm({ ...doctorForm, bio: e.target.value })}
                              className="form-textarea"
                              rows="3"
                            />
                          </div>
                          <div className="form-group">
                            <label>
                              <input
                                type="checkbox"
                                checked={doctorForm.is_available}
                                onChange={(e) => setDoctorForm({ ...doctorForm, is_available: e.target.checked })}
                              />
                              Available for consultations
                            </label>
                          </div>
                          <div className="form-actions">
                            <button className="save-btn" onClick={() => handleSaveDoctor(doctor.id)}>
                              Save
                            </button>
                            <button className="cancel-btn" onClick={() => {
                              setEditingDoctor(null)
                              setDoctorForm({ name: '', specialization: '', bio: '', is_available: true })
                            }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="doctor-header">
                            <div>
                              <h3>{doctor.name}</h3>
                              {doctor.specialization && (
                                <p className="doctor-specialization">{doctor.specialization}</p>
                              )}
                            </div>
                            <div className="doctor-status">
                              <span className={`availability-badge ${doctor.is_available ? 'available' : 'unavailable'}`}>
                                {doctor.is_available ? '✓ Available' : '✗ Unavailable'}
                              </span>
                            </div>
                          </div>
                          {doctor.bio && (
                            <p className="doctor-bio">{doctor.bio}</p>
                          )}
                          <div className="doctor-footer">
                            <div className="doctor-info">
                              <span className="doctor-id">ID: {doctor.id.substring(0, 8)}...</span>
                              {doctor.user_id ? (
                                <span className="doctor-linked">
                                  {doctor.user_id === user?.id ? '✓ Linked to your account' : '✓ Linked to another user'}
                                </span>
                              ) : (
                                <span className="doctor-unlinked">⚠ Not linked to any user</span>
                              )}
                            </div>
                            <div className="doctor-actions">
                              {doctor.user_id === user?.id ? (
                                <button
                                  className="unlink-user-btn"
                                  onClick={() => handleUnlinkDoctorFromUser(doctor.id)}
                                  title="Unlink this pharmacist from your account"
                                >
                                  🔓 Unlink from My Account
                                </button>
                              ) : !doctor.user_id && user?.id ? (
                                <button
                                  className="link-user-btn"
                                  onClick={() => handleLinkDoctorToUser(doctor.id)}
                                  title="Link this pharmacist to your current account so you can reply to consultations"
                                >
                                  🔗 Link to My Account
                                </button>
                              ) : null}
                              <button
                                className="toggle-availability-btn"
                                onClick={() => handleToggleDoctorAvailability(doctor.id, doctor.is_available)}
                              >
                                {doctor.is_available ? 'Set Unavailable' : 'Set Available'}
                              </button>
                              <button
                                className="edit-btn"
                                onClick={() => handleEditDoctor(doctor)}
                              >
                                ✏️ Edit
                              </button>
                              <button
                                className="delete-btn"
                                onClick={() => handleDeleteDoctor(doctor.id)}
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Accept Order Dialog */}
      {acceptingOrder && (
        <AcceptOrderDialog
          order={acceptingOrder}
          onAccept={(data) => handleAcceptOrder(acceptingOrder.id, data)}
          onCancel={() => setAcceptingOrder(null)}
        />
      )}
    </div>
  )
}

export default FarmasiAdmin

