import { createClient } from '@supabase/supabase-js'

// Supabase configuration
// Get these values from your Supabase project settings
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Check if Supabase is configured
export const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && 
  supabaseUrl !== '' && 
  supabaseAnonKey !== '' &&
  !supabaseUrl.includes('your_') &&
  !supabaseAnonKey.includes('your_')

// Enable/disable database logging (set to false to silence errors)
const ENABLE_DB_LOGGING = import.meta.env.VITE_ENABLE_DB_LOGGING !== 'false'

// Create Supabase client (only if configured)
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

// Get or create session ID for anonymous users
const getSessionId = () => {
  let sessionId = localStorage.getItem('farmasiku_session_id')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('farmasiku_session_id', sessionId)
  }
  return sessionId
}

// Database helper functions
export const db = {
  // Save consultation record
  async saveConsultation(data) {
    if (!isSupabaseConfigured || !supabase) {
      return null // Silently skip if not configured
    }

    // Use session ID if no user_id
    const consultationData = {
      ...data,
      session_id: getSessionId(),
      user_id: data.user_id || null
    }
    
    const { data: result, error } = await supabase
      .from('consultations')
      .insert([consultationData])
      .select()
    
    if (error) {
      if (ENABLE_DB_LOGGING) {
        console.error('Error saving consultation:', error)
      }
      // Don't throw, just log - allow app to continue
      return null
    }
    
    return result?.[0]
  },

  // Save order
  async saveOrder(orderData) {
    if (!isSupabaseConfigured || !supabase) {
      return null // Silently skip if not configured
    }

    // Use session ID if no user_id
    const order = {
      ...orderData,
      session_id: getSessionId(),
      user_id: orderData.user_id || null
    }
    
    const { data: result, error } = await supabase
      .from('orders')
      .insert([order])
      .select()
    
    if (error) {
      if (ENABLE_DB_LOGGING) {
        console.error('Error saving order:', error)
      }
      // Don't throw, just log - allow app to continue
      return null
    }
    
    return result?.[0]
  },

  // Save order items
  async saveOrderItems(orderId, medications) {
    if (!orderId || !isSupabaseConfigured || !supabase) return []
    
    const orderItems = medications.map(med => ({
      order_id: orderId,
      medication_name: med.name,
      medication_price: med.price,
      medication_usage: med.usage || null
    }))

    const { data: result, error } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select()
    
    if (error) {
      if (ENABLE_DB_LOGGING) {
        console.error('Error saving order items:', error)
      }
      // Don't throw, just log - allow app to continue
      return []
    }
    return result || []
  },

  // Get user orders (by session ID for anonymous users)
  async getUserOrders(userId = null) {
    if (!isSupabaseConfigured || !supabase) {
      return [] // Silently return empty if not configured
    }

    const sessionId = getSessionId()
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .order('created_at', { ascending: false })
    
    if (userId) {
      query = query.eq('user_id', userId)
    } else {
      query = query.eq('session_id', sessionId)
    }
    
    const { data, error } = await query
    
    if (error) {
      if (ENABLE_DB_LOGGING) {
        console.error('Error fetching orders:', error)
      }
      return []
    }
    return data || []
  },

      // Save symptom assessment
      async saveSymptomAssessment(assessmentData) {
        if (!isSupabaseConfigured || !supabase) {
          return null // Silently skip if not configured
        }

        // Use session ID if no user_id
        const assessment = {
          ...assessmentData,
          session_id: getSessionId(),
          user_id: assessmentData.user_id || null
        }
        
        const { data: result, error } = await supabase
          .from('symptom_assessments')
          .insert([assessment])
          .select()
        
        if (error) {
          if (ENABLE_DB_LOGGING) {
            console.error('Error saving symptom assessment:', error)
          }
          // Don't throw, just log - allow app to continue
          return null
        }
        
        return result?.[0]
      },

      // Reduce medication stock after purchase
      async reduceMedicationStock(medications) {
        if (!isSupabaseConfigured || !supabase) {
          return // Silently skip if not configured
        }

        try {
          // Group medications by ID to handle quantity
          const medicationCounts = {}
          medications.forEach(med => {
            const medId = med.id
            if (medId) {
              medicationCounts[medId] = (medicationCounts[medId] || 0) + 1
            }
          })

          // Update stock for each medication
          const updatePromises = Object.entries(medicationCounts).map(async ([medId, quantity]) => {
            // Get current stock
            const { data: currentMed, error: fetchError } = await supabase
              .from('medications')
              .select('stock')
              .eq('id', medId)
              .single()

            if (fetchError || !currentMed) {
              console.error(`Error fetching medication ${medId}:`, fetchError)
              return
            }

            const newStock = Math.max(0, (currentMed.stock || 0) - quantity)

            // Update stock
            const { error: updateError } = await supabase
              .from('medications')
              .update({ stock: newStock, updated_at: new Date().toISOString() })
              .eq('id', medId)

            if (updateError) {
              if (ENABLE_DB_LOGGING) {
                console.error(`Error updating stock for medication ${medId}:`, updateError)
              }
            }
          })

          await Promise.all(updatePromises)
        } catch (error) {
          if (ENABLE_DB_LOGGING) {
            console.error('Error reducing medication stock:', error)
          }
        }
      },

      // Get medications by symptoms
      async getMedicationsBySymptoms(symptoms) {
        if (!isSupabaseConfigured || !supabase) {
          return null // Return null to use fallback
        }

        try {
          // Get medication IDs for the symptoms
          const { data: mappings, error: mappingError } = await supabase
            .from('symptom_medication_mapping')
            .select('medication_id, symptom, priority')
            .in('symptom', symptoms)
            .order('priority', { ascending: true })

          if (mappingError) {
            if (ENABLE_DB_LOGGING) {
              console.error('Error fetching medication mappings:', mappingError)
            }
            return null
          }

          if (!mappings || mappings.length === 0) {
            return null
          }

          // Get unique medication IDs
          const medicationIds = [...new Set(mappings.map(m => m.medication_id))]

          // Get medication details (only active medications with stock > 0)
          const { data: medications, error: medError } = await supabase
            .from('medications')
            .select('*')
            .in('id', medicationIds)
            .eq('is_active', true)
            .gt('stock', 0) // Only show medications with stock > 0

          if (medError) {
            if (ENABLE_DB_LOGGING) {
              console.error('Error fetching medications:', medError)
            }
            return null
          }

          // Map medications with usage instructions
          return medications?.map(med => ({
            id: med.id,
            name: med.name,
            price: parseFloat(med.price),
            stock: med.stock || 0,
            usage: med.usage_instructions || null,
            ageRestrictions: med.age_restrictions || null
          })) || null
        } catch (error) {
          if (ENABLE_DB_LOGGING) {
            console.error('Error in getMedicationsBySymptoms:', error)
          }
          return null
        }
      }
    }

export default supabase

