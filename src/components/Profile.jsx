import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { databaseService } from '../services/databaseService'
import AddressManagement from './AddressManagement'
import './Profile.css'

function Profile({ user, onLogout, onRestartFlow, onTrackOrder }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('profile') // 'profile', 'addresses'
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    name: '',
    age: ''
  })

  useEffect(() => {
    loadUserData()
  }, [user])

  const loadUserData = async () => {
    if (!user) return

    try {
      // Load profile
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)
      
      // Initialize form with current data
      setProfileForm({
        name: user.user_metadata?.name || user.email.split('@')[0],
        age: profileData?.age || ''
      })

    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut()
    }
    onLogout()
  }


  const handleEditProfile = () => {
    setEditingProfile(true)
    setProfileForm({
      name: user.user_metadata?.name || user.email.split('@')[0],
      age: profile?.age || ''
    })
  }

  const handleCancelEdit = () => {
    setEditingProfile(false)
    setProfileForm({
      name: user.user_metadata?.name || user.email.split('@')[0],
      age: profile?.age || ''
    })
  }

  const handleSaveProfile = async () => {
    if (!supabase || !user) return

    try {
      // Update user metadata (name)
      const { error: metadataError } = await supabase.auth.updateUser({
        data: {
          name: profileForm.name
        }
      })

      if (metadataError) throw metadataError

      // Update profile (age)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          age: profileForm.age ? parseInt(profileForm.age) : null
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Reload data
      setLoading(true)
      await loadUserData()
      // Show loading for at least 1.5 seconds
      await new Promise(resolve => setTimeout(resolve, 1500))
      setEditingProfile(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      setLoading(false)
      alert(`Failed to update profile: ${error.message || 'Unknown error'}`)
    }
  }

  if (loading) {
    return (
      <div className="profile-container">
        <div className="loading">Loading...</div>
      </div>
    )
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h2>My Profile</h2>
        <div className="profile-header-actions">
          {onRestartFlow && (
            <button className="restart-flow-btn" onClick={onRestartFlow}>
              🔄 Start New Consultation
            </button>
          )}
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="profile-tabs">
        <button
          className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`tab-button ${activeTab === 'addresses' ? 'active' : ''}`}
          onClick={() => setActiveTab('addresses')}
        >
          Addresses
        </button>
      </div>

      <div className="profile-content">
        {activeTab === 'profile' && (
          <div className="profile-info">
            <div className="profile-section-header">
              <h3>Personal Information</h3>
              {!editingProfile && (
                <button className="edit-profile-btn" onClick={handleEditProfile}>
                  ✏️ Edit
                </button>
              )}
            </div>

            {editingProfile ? (
              <div className="profile-edit-form">
                <div className="form-group">
                  <label>Email</label>
                  <p className="readonly-field">{user.email}</p>
                  <small className="field-note">Email cannot be changed</small>
                </div>
                <div className="form-group">
                  <label htmlFor="profile-name">Name *</label>
                  <input
                    id="profile-name"
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="profile-age">Age</label>
                  <input
                    id="profile-age"
                    type="number"
                    min="1"
                    max="120"
                    value={profileForm.age}
                    onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })}
                    placeholder="Enter your age"
                  />
                </div>
                <div className="form-actions">
                  <button className="cancel-btn" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                  <button className="save-btn" onClick={handleSaveProfile}>
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="info-item">
                  <label>Email</label>
                  <p>{user.email}</p>
                </div>
                <div className="info-item">
                  <label>Name</label>
                  <p>{user.user_metadata?.name || user.email.split('@')[0]}</p>
                </div>
                {profile && (
                  <div className="info-item">
                    <label>Age</label>
                    <p>{profile.age || 'Not set'}</p>
                  </div>
                )}
                <div className="info-item">
                  <label>Member Since</label>
                  <p>{new Date(user.created_at).toLocaleDateString()}</p>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'addresses' && (
          <div className="addresses-tab">
            <AddressManagement 
              user={user} 
              onSelect={null}
              onContinue={null}
              selectedAddressId={null}
            />
          </div>
        )}

      </div>
    </div>
  )
}

export default Profile

