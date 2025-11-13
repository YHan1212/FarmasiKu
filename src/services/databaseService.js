import { db } from '../lib/supabase'

// Database service for FarmasiKu
export const databaseService = {
  // Save a complete consultation session
  async saveConsultationSession(sessionData) {
    try {
      const { userAge, selectedSymptoms, symptomAssessments, severity, userId } = sessionData
      
      // Save symptom assessment
      const assessmentData = {
        body_part: sessionData.selectedBodyPart || null,
        symptoms: selectedSymptoms,
        symptom_details: symptomAssessments,
        age: userAge,
        user_id: userId || null
      }
      
      const assessment = await db.saveSymptomAssessment(assessmentData)
      
      // If severity is marked, save consultation record
      if (severity === 'severe') {
        const consultation = await db.saveConsultation({
          symptoms: selectedSymptoms,
          severity: 'severe',
          age: userAge,
          user_id: userId || null
        })
        return { assessment, consultation }
      }
      
      return { assessment }
    } catch (error) {
      console.error('Error saving consultation session:', error)
      // Return null instead of throwing to allow app to continue
      return null
    }
  },

  // Save order with medications
  async saveOrder(orderData) {
    try {
      const { medications, paymentMethod, transactionId, userAge, userId } = orderData
      
      const totalAmount = medications.reduce((sum, med) => sum + med.price, 0)
      
      // Save order
      const order = await db.saveOrder({
        total_amount: totalAmount,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        status: 'paid',
        age: userAge,
        user_id: userId || null
      })
      
      // Only save order items and reduce stock if order was successfully created
      if (order && order.id) {
        const orderItems = await db.saveOrderItems(order.id, medications)
        
        // Reduce stock for each medication purchased
        await db.reduceMedicationStock(medications)
        
        return { order, orderItems }
      }
      
      return { order: null, orderItems: [] }
    } catch (error) {
      console.error('Error saving order:', error)
      // Return null instead of throwing to allow app to continue
      return { order: null, orderItems: [] }
    }
  },

  // Get user's order history
  async getOrderHistory(userId = null) {
    try {
      return await db.getUserOrders(userId)
    } catch (error) {
      console.error('Error fetching order history:', error)
      return []
    }
  },

  // Get medications by symptoms (from database)
  async getMedicationsBySymptoms(symptoms) {
    try {
      return await db.getMedicationsBySymptoms(symptoms)
    } catch (error) {
      console.error('Error fetching medications:', error)
      return null // Return null to use fallback
    }
  }
}

export default databaseService


