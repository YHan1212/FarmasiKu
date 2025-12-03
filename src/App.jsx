import React, { useState, useEffect, useCallback } from 'react'
import AgeInput from './components/AgeInput'
import BodyPartSelection from './components/BodyPartSelection'
import SymptomSelection from './components/SymptomSelection'
import SymptomConfirmation from './components/SymptomConfirmation'
import SymptomAssessment from './components/SymptomAssessment'
import MedicationRecommendation from './components/MedicationRecommendation'
import Payment from './components/Payment'
import DeliveryInfo from './components/DeliveryInfo'
import OrderTracking from './components/OrderTracking'
import OrderSuccess from './components/OrderSuccess'
import ProgressIndicator from './components/ProgressIndicator'
import BackButton from './components/BackButton'
import DangerWarning from './components/DangerWarning'
import Login from './components/Login'
import Register from './components/Register'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'
import Welcome from './components/Welcome'
import Profile from './components/Profile'
import MyOrders from './components/MyOrders'
import FarmasiAdmin from './components/FarmasiAdmin'
import SimpleChat from './components/SimpleChat'
import ConsultationQueue from './components/ConsultationQueue'
import ConsultationMedicationReview from './components/ConsultationMedicationReview'
import { supabase } from './lib/supabase'
import { bodyParts, symptomsByBodyPart, medicationsBySymptoms, hasDangerousSymptoms, dangerousSymptoms, getStepInfo, getAgeCategory, getAgeRestrictions, medicationUsage } from './data/appData'
import { databaseService } from './services/databaseService'
import { consultationService } from './services/consultationService'
import './styles/App.css'

function App() {
  const [user, setUser] = useState(null)
  const [authStep, setAuthStep] = useState('login') // 'login', 'register', 'forgot-password', 'reset-password', 'authenticated'
  const [step, setStep] = useState('welcome') // welcome, age, bodyPart, symptom, assessment, confirmation, medication, delivery, payment, consultation, consultation-list, success, profile, my-orders, admin, consultation-waiting, realtime-consultation, consultation-review
  const [userAge, setUserAge] = useState(null)
  const [selectedBodyPart, setSelectedBodyPart] = useState(null)
  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const [symptomAssessments, setSymptomAssessments] = useState({}) // Store assessments for each symptom
  const [currentBodyPart, setCurrentBodyPart] = useState(null)
  const [isSelectingMore, setIsSelectingMore] = useState(false)
  const [currentSymptomForAssessment, setCurrentSymptomForAssessment] = useState(null)
  const [showDangerWarning, setShowDangerWarning] = useState(false)
  const [selectedMedications, setSelectedMedications] = useState([])
  const [recommendedMedications, setRecommendedMedications] = useState([])
  const [isDoctor, setIsDoctor] = useState(false) // Track if current user is a doctor
  const [userRole, setUserRole] = useState(null) // Track user role: 'user' or 'admin'
  const [currentConsultationSession, setCurrentConsultationSession] = useState(null) // Current chat session
  const [deliveryInfo, setDeliveryInfo] = useState(null) // Store delivery address and phone
  const [consultationQueue, setConsultationQueue] = useState(null) // Current consultation queue
  const [trackingOrderId, setTrackingOrderId] = useState(null) // Order ID for tracking

  // Check authentication status on mount
  useEffect(() => {
    if (!supabase) {
      // If Supabase not configured, still show login page but allow guest access
      setAuthStep('login')
      return
    }

    // Check if we're on a password reset page
    // Supabase sends recovery links with hash fragments or query params
    const urlParams = new URLSearchParams(window.location.search)
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = urlParams.get('access_token') || hashParams.get('access_token')
    const type = urlParams.get('type') || hashParams.get('type')
    
    if (type === 'recovery' && accessToken) {
      // User clicked password reset link from email
      setAuthStep('reset-password')
      // Clear URL parameters after reading
      window.history.replaceState({}, document.title, window.location.pathname)
      return
    }

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user)
        setAuthStep('authenticated')
      } else {
        // No session, show login page
        setAuthStep('login')
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        setAuthStep('authenticated')
        checkDoctorStatus(session.user.id)
      } else {
        setUser(null)
        setIsDoctor(false)
        // Don't force login, allow guest access
        // setAuthStep('login')
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // Check if user is a doctor
  const checkDoctorStatus = async (userId) => {
    if (!userId || !supabase) return
    
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', userId)
        .single()
      
      if (data && !error) {
        setIsDoctor(true)
      } else {
        setIsDoctor(false)
      }
    } catch (error) {
      // If no doctor found or other error, user is not a doctor
      setIsDoctor(false)
    }
  }

  // Check user role (user or admin)
  const checkUserRole = async (userId) => {
    if (!userId || !supabase) {
      setUserRole(null)
      return
    }
    
    try {
      // First, try to get the full profile to check if role field exists
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      console.log('User role check:', { userId, data, error })
      
      if (error) {
        // If error is about column not existing, role field hasn't been added yet
        if (error.message && error.message.includes('column') && error.message.includes('role')) {
          console.log('Role column does not exist yet. Please run database script.')
          setUserRole('user') // Default to user
          return
        }
        // Other errors, default to user
        console.log('Error fetching user role, defaulting to user:', error.message)
        setUserRole('user')
        return
      }
      
      if (data) {
        // Check if role field exists in the data
        const role = data.role || 'user'
        console.log('User role:', role)
        setUserRole(role)
      } else {
        // No profile found, default to user
        console.log('No profile found, defaulting to user')
        setUserRole('user')
      }
    } catch (error) {
      // Default to 'user' on error
      console.error('Error checking user role:', error)
      setUserRole('user')
    }
  }

  // Check doctor status and user role when user changes
  useEffect(() => {
    if (user?.id) {
      checkDoctorStatus(user.id)
      checkUserRole(user.id)
    } else {
      setIsDoctor(false)
      setUserRole(null)
    }
  }, [user?.id])

  // Redirect admin users to admin panel automatically
  useEffect(() => {
    if (userRole === 'admin' && user && step !== 'admin' && step !== 'profile') {
      // 管理员登录后自动跳转到管理面板
      setStep('admin')
    }
  }, [userRole, user, step])

  // Handle authentication
  const handleLogin = (userData) => {
    if (userData) {
      setUser(userData)
      setAuthStep('authenticated')
      checkDoctorStatus(userData.id)
      checkUserRole(userData.id)
    } else {
      // Continue as guest
      setAuthStep('authenticated')
      setUserRole(null)
    }
  }

  const handleRegister = (userData) => {
    setUser(userData)
    setAuthStep('authenticated')
    checkDoctorStatus(userData.id)
    checkUserRole(userData.id)
  }

  const handleLogout = async () => {
    // Sign out from Supabase
    if (supabase) {
      await supabase.auth.signOut()
    }
    // Clear local state
    setUser(null)
    setIsDoctor(false)
    setUserRole(null)
    setAuthStep('login')
    handleReset()
  }

  const handleShowProfile = () => {
    setStep('profile')
  }

  const handleShowMyOrders = () => {
    setStep('my-orders')
  }

  const handleShowAdmin = () => {
    setStep('admin')
  }

  const handleBackFromAdmin = () => {
    setStep('welcome')
    handleReset()
  }

  const handleRestartFlow = () => {
    // Reset all flow state and go back to welcome step
    handleReset()
  }

  // Start realtime consultation
  const handleStartRealtimeConsultation = () => {
    if (!user) {
      alert('Please login first')
      return
    }
    setStep('consultation-waiting')
  }

  // Load matched session and go to chat
  const loadMatchedSession = async (queue) => {
    if (!supabase) {
      alert('Database not configured')
      return
    }

    // 验证 queue 和 queue.id 是否存在
    if (!queue || !queue.id) {
      console.error('[App] loadMatchedSession: queue or queue.id is missing', queue)
      alert('Invalid queue data. Please try again.')
      return
    }

    // 重试逻辑：会话可能还在创建中
    let retries = 5
    let session = null

    while (retries > 0 && !session) {
      try {
        // 首先尝试通过 queue_id 查找
        let { data, error } = await supabase
          .from('consultation_sessions')
          .select(`
            *,
            doctor:doctors(*)
          `)
          .eq('queue_id', queue.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = no rows returned, 这是正常的
          throw error
        }

        if (data) {
          session = data
          break
        }

        // 如果通过 queue_id 找不到，尝试通过 patient_id 和 doctor_id 查找
        // 支持新的 pharmacist_id 字段和旧的 matched_pharmacist_id 字段
        const pharmacistId = queue.pharmacist_id || queue.matched_pharmacist_id
        if (pharmacistId) {
          const { data: altData, error: altError } = await supabase
            .from('consultation_sessions')
            .select(`
              *,
              doctor:doctors(*)
            `)
            .eq('patient_id', user?.id)
            .eq('doctor_id', pharmacistId)
            .eq('status', 'active')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (altError && altError.code !== 'PGRST116') {
            throw altError
          }

          if (altData) {
            session = altData
            break
          }
        }
        
        // 不再查找任何活跃会话，必须通过 queue_id 或 matched_pharmacist_id 匹配
        // 这确保只有被药剂师明确接受的队列才能进入聊天

        // 如果还没找到，等待一下再重试
        if (retries > 1) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } catch (error) {
        console.error(`Error loading matched session (retry ${6 - retries}):`, error)
        if (retries === 1) {
          // 最后一次重试失败，显示详细错误
          console.error('Final error loading session:', error)
          alert(`Failed to load consultation session: ${error.message || 'Session not found. Please try again.'}`)
          return
        }
      }
      retries--
    }

    if (session) {
      setCurrentConsultationSession(session)
      setStep('consultation-patient')
    } else {
      alert('Consultation session not found. Please try again or contact support.')
    }
  }

  // Handle medication accepted from consultation
  // 注意：这个函数现在只添加到临时列表，不直接跳转
  // 用户需要点击"完成咨询"按钮才会进入确认页面
  const handleMedicationAccepted = async (medication) => {
    try {
      // 获取药物价格
      let price = 0
      if (medication.medication_id) {
        const { data: medData } = await supabase
          .from('medications')
          .select('price')
          .eq('id', medication.medication_id)
          .single()
        
        if (medData) {
          price = parseFloat(medData.price || 0)
        }
      }

      // 药物已通过 acceptMedication API 添加到数据库
      // 这里不需要额外操作，等待用户完成咨询后统一处理
      console.log('Medication accepted:', medication)
    } catch (error) {
      console.error('Error handling medication acceptance:', error)
      alert('Failed to add medication to cart')
    }
  }

  // Handle consultation completion - show medication review
  const handleConsultationComplete = useCallback(() => {
    console.log('[App] handleConsultationComplete called, setting step to consultation-review', {
      currentStep: step,
      hasSession: !!currentConsultationSession
    })
    // 跳转到药物确认页面
    setStep('consultation-review')
  }, [step, currentConsultationSession])

  // Handle medication review continue - proceed to delivery
  const handleMedicationReviewContinue = async (medications) => {
    // 设置选中的药物
    setSelectedMedications(medications)
    
    // 结束咨询会话
    if (currentConsultationSession) {
      try {
        // 获取队列ID（如果会话中有）
        let queueId = currentConsultationSession.queue_id
        
        // 如果没有，从数据库查询
        if (!queueId) {
          const { data: session } = await supabase
            .from('consultation_sessions')
            .select('queue_id')
            .eq('id', currentConsultationSession.id)
            .single()
          
          if (session?.queue_id) {
            queueId = session.queue_id
          }
        }
        
        if (queueId) {
          await consultationService.endConsultation(
            currentConsultationSession.id,
            queueId
          )
        } else {
          // 如果没有队列ID，只更新会话状态
          await supabase
            .from('consultation_sessions')
            .update({
              status: 'completed',
              ended_at: new Date().toISOString()
            })
            .eq('id', currentConsultationSession.id)
        }
      } catch (err) {
        console.error('Error ending consultation:', err)
        // 即使结束失败，也继续流程
      }
    }
    
    // 跳转到配送信息页面
    setStep('delivery')
  }

  // Load patient consultations
  const handleShowPatientConsultations = async () => {
    if (!user?.id) {
      alert('Please login first')
      return
    }

    try {
      // Get latest active session or create new one
      const { data: sessions } = await supabase
        .from('consultation_sessions')
        .select(`
          *,
          doctor:doctors(*)
        `)
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (sessions && sessions.length > 0) {
        setCurrentConsultationSession(sessions[0])
        setStep('consultation-patient')
      } else {
        // 使用 realtime consultation 流程
        setStep('consultation-waiting')
      }
    } catch (error) {
      console.error('Error loading consultations:', error)
      // 使用 realtime consultation 流程
      setStep('consultation-waiting')
    }
  }

  // Load doctor consultations
  const handleShowDoctorConsultations = async () => {
    if (!user?.id) {
      alert('Please login first')
      return
    }

    try {
      // Check if user is a doctor
      const { data: doctorData } = await supabase
        .from('doctors')
        .select('id, name, user_id')
        .eq('user_id', user.id)
        .single()

      if (!doctorData) {
        alert('You are not registered as a pharmacist. Please contact admin.')
        return
      }

      // Get latest session assigned to this doctor
      const { data: sessions } = await supabase
        .from('consultation_sessions')
        .select(`
          *,
          doctor:doctors(*)
        `)
        .eq('doctor_id', doctorData.id)
        .order('created_at', { ascending: false })
        .limit(1)

      if (sessions && sessions.length > 0) {
        setCurrentConsultationSession(sessions[0])
        setStep('consultation-doctor')
      } else {
        alert('No consultations assigned to you yet.')
      }
    } catch (error) {
      console.error('Error loading doctor consultations:', error)
      alert('Failed to load consultations.')
    }
  }


  // Handle age input
  const handleAgeContinue = (age) => {
    setUserAge(age)
    setStep('bodyPart')
  }

  // Handle body part selection
  const handleBodyPartSelect = (bodyPart) => {
    setSelectedBodyPart(bodyPart)
    setCurrentBodyPart(bodyPart)
    setStep('symptom')
  }

  // Handle symptom selection
  const handleSymptomToggle = (symptom) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom))
      // Remove assessment if symptom is deselected
      const newAssessments = { ...symptomAssessments }
      delete newAssessments[symptom]
      setSymptomAssessments(newAssessments)
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom])
    }
  }

  // Handle "Any other symptoms?"
  const handleMoreSymptoms = () => {
    setIsSelectingMore(true)
    setCurrentBodyPart(null) // Reset to allow re-selection of body part
    setStep('bodyPart')
  }

  // Start assessment for a symptom (legacy - now handled inline)
  const handleStartAssessment = (symptom) => {
    // This is now handled inline in SymptomSelection
    // Keep for backward compatibility but don't navigate
  }

  // Complete assessment (called from inline assessment)
  const handleAssessmentComplete = (assessment) => {
    setSymptomAssessments({
      ...symptomAssessments,
      [assessment.symptom]: assessment
    })
    setCurrentSymptomForAssessment(null)
    // Don't change step - stay on symptom selection
  }

  // Handle inline assessment (new method)
  const handleInlineAssessment = (symptom, assessment) => {
    if (assessment) {
      // Assessment object is passed directly
      handleAssessmentComplete(assessment)
    } else {
      // Legacy: just symptom name, open assessment page
      setCurrentSymptomForAssessment(symptom)
      setStep('assessment')
    }
  }

  // Complete symptom selection
  const handleSymptomComplete = () => {
    if (selectedSymptoms.length === 0) {
      alert('Please select at least one symptom')
      return
    }
    
    // Check for dangerous symptoms
    const dangerousSelected = selectedSymptoms.filter(s => 
      dangerousSymptoms.includes(s)
    )
    
    if (dangerousSelected.length > 0 && !showDangerWarning) {
      setShowDangerWarning(true)
      return
    }
    
    // Check if any symptoms need assessment
    const unassessedSymptoms = selectedSymptoms.filter(s => !symptomAssessments[s])
    if (unassessedSymptoms.length > 0) {
      // Start assessment for first unassessed symptom
      setCurrentSymptomForAssessment(unassessedSymptoms[0])
      setStep('assessment')
      return
    }
    
    setStep('confirmation')
  }

  // Handle symptom confirmation
  const handleConfirmSymptoms = async (isMoreSevere) => {
    // Save consultation session to database (silently fails if DB not configured)
    try {
      await databaseService.saveConsultationSession({
        userAge,
        selectedBodyPart,
        selectedSymptoms,
        symptomAssessments,
        severity: isMoreSevere ? 'severe' : 'current',
        userId: user?.id || null
      })
    } catch (error) {
      // Silently continue - database errors won't interrupt user flow
    }

    if (isMoreSevere) {
      // 使用 realtime consultation 流程
      if (!user) {
        alert('Please login first to start consultation')
        return
      }
      setStep('consultation-waiting')
    } else {
      // Fetch medications from database or use fallback
      await loadMedications()
      setStep('medication')
    }
  }

  // Load medications from database or use static fallback
  const loadMedications = async () => {
    try {
      // Try to get medications from database
      const dbMedications = await databaseService.getMedicationsBySymptoms(selectedSymptoms)
      
      if (dbMedications && dbMedications.length > 0) {
        // Process database medications with age restrictions
        let processedMedications = dbMedications.map(med => {
          let medication = { ...med }
          
          // Add usage instructions if available
          if (med.usage) {
            medication.usage = med.usage
          } else if (medicationUsage[med.name]) {
            medication.usage = medicationUsage[med.name]
          } else {
            medication.usage = {
              method: 'oral',
              methodLabel: 'As directed',
              dosage: 'As directed',
              frequency: 'As directed',
              maxDosage: 'As directed',
              instructions: 'Please follow package instructions or consult healthcare provider.',
              duration: 'As directed',
              icon: '💊'
            }
          }
          
          // Apply age restrictions if age is provided
          if (userAge !== null) {
            const ageCategory = getAgeCategory(userAge)
            const restrictions = getAgeRestrictions(userAge)
            const medAgeRestrictions = med.ageRestrictions || {}
            
            if (ageCategory === 'child' && medAgeRestrictions.restricted_for?.includes('child')) {
              // Check for alternatives
              if (medAgeRestrictions.alternatives && medAgeRestrictions.alternatives[med.name]) {
                const altName = medAgeRestrictions.alternatives[med.name]
                const altMed = dbMedications.find(m => m.name === altName)
                if (altMed) {
                  medication = { ...altMed, isChildAlternative: true, originalMed: med.name }
                  if (altMed.usage) {
                    medication.usage = altMed.usage
                  } else if (medicationUsage[altName]) {
                    medication.usage = medicationUsage[altName]
                  }
                } else {
                  medication.ageWarning = restrictions.warning
                  medication.restricted = true
                }
              } else {
                medication.ageWarning = restrictions.warning
                medication.restricted = true
              }
            } else if (ageCategory === 'elderly') {
              medication.ageWarning = restrictions.warning
            }
            
            medication.ageCategory = ageCategory
          }
          
          return medication
        })
        
        // Remove duplicates
        const seen = new Set()
        processedMedications = processedMedications.filter(med => {
          if (seen.has(med.name)) return false
          seen.add(med.name)
          return true
        })
        
        setRecommendedMedications(processedMedications)
      } else {
        // Use static fallback
        const staticMedications = medicationsBySymptoms(selectedSymptoms, userAge)
        setRecommendedMedications(staticMedications)
      }
    } catch (error) {
      // On error, use static fallback
      const staticMedications = medicationsBySymptoms(selectedSymptoms, userAge)
      setRecommendedMedications(staticMedications)
    }
  }

  // Handle danger warning actions - use realtime consultation
  const handleDangerWarningConsultation = () => {
    if (!user) {
      alert('Please login first')
      return
    }
    setShowDangerWarning(false)
    // 使用 realtime consultation 流程
    setStep('consultation-waiting')
  }

  const handleDangerWarningContinue = () => {
    setShowDangerWarning(false)
    // Continue with symptom selection
    const unassessedSymptoms = selectedSymptoms.filter(s => !symptomAssessments[s])
    if (unassessedSymptoms.length > 0) {
      setCurrentSymptomForAssessment(unassessedSymptoms[0])
      setStep('assessment')
    } else {
      setStep('confirmation')
    }
  }

  // Handle back navigation
  const handleBack = () => {
    if (step === 'profile' || step === 'my-orders') {
      setStep('welcome')
    } else if (step === 'age') {
      setStep('welcome')
    } else if (step === 'bodyPart') {
      setStep('age')
    } else if (step === 'symptom') {
      setStep('bodyPart')
      setCurrentBodyPart(null)
    } else if (step === 'assessment') {
      setStep('symptom')
      setCurrentSymptomForAssessment(null)
    } else if (step === 'confirmation') {
      setStep('symptom')
    } else if (step === 'medication') {
      setStep('confirmation')
    } else if (step === 'delivery') {
      setStep('medication')
    } else if (step === 'payment') {
      setStep('delivery')
    } else if (step === 'consultation-review') {
      // 返回咨询聊天页面
      if (currentConsultationSession) {
        setStep('consultation-patient')
      } else {
        setStep('welcome')
      }
    }
  }

  // Handle order - go to delivery page first
  const handleOrder = (medications) => {
    setSelectedMedications(medications)
    setStep('delivery')
  }

  // Handle delivery info - go to payment page
  const handleDeliveryContinue = (deliveryData) => {
    setDeliveryInfo(deliveryData)
    setStep('payment')
  }

  // Handle payment
  const handlePayment = async (paymentInfo) => {
    // Save order to database with delivery info
    try {
      await databaseService.saveOrder({
        medications: selectedMedications,
        paymentMethod: paymentInfo.paymentMethod,
        transactionId: paymentInfo.transactionId,
        userAge,
        userId: user?.id || null,
        deliveryAddress: deliveryInfo?.deliveryAddress || null,
        phoneNumber: deliveryInfo?.phoneNumber || null
      })
    } catch (error) {
      console.error('Error saving order:', error)
      // Silently continue - database errors won't interrupt user flow
    }

    setStep('success')
  }

  // Reset application
  const handleReset = () => {
    setStep('welcome')
    setUserAge(null)
    setSelectedBodyPart(null)
    setSelectedSymptoms([])
    setSymptomAssessments({})
    setCurrentBodyPart(null)
    setIsSelectingMore(false)
    setCurrentSymptomForAssessment(null)
    setShowDangerWarning(false)
    setSelectedMedications([])
  }

  // Get step info for progress indicator
  const stepInfo = getStepInfo(step)

  // Show authentication screens if not authenticated
  if (authStep !== 'authenticated') {
    return (
      <div className="app">
        <header className="app-header">
          <h1>farmasiKu</h1>
        </header>
        <main className="app-main">
          {authStep === 'login' && (
            <Login 
              onLogin={handleLogin}
              onSwitchToRegister={() => setAuthStep('register')}
              onSwitchToForgotPassword={() => setAuthStep('forgot-password')}
            />
          )}
          {authStep === 'register' && (
            <Register 
              onRegister={handleRegister}
              onSwitchToLogin={() => setAuthStep('login')}
            />
          )}
          {authStep === 'forgot-password' && (
            <ForgotPassword 
              onBack={() => setAuthStep('login')}
              onSwitchToLogin={() => setAuthStep('login')}
            />
          )}
          {authStep === 'reset-password' && (
            <ResetPassword 
              onBack={() => {
                setAuthStep('login')
                // Clear URL parameters
                window.history.replaceState({}, document.title, window.location.pathname)
              }}
            />
          )}
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      {/* 管理员：只在非 admin 页面显示 header（admin 页面有自己的 header） */}
      {userRole === 'admin' && user && step !== 'admin' && (
        <header className="app-header">
          <h1>farmasiKu Admin</h1>
          <div className="user-menu">
            <button 
              className="admin-button"
              onClick={handleShowAdmin}
              title="Admin Dashboard"
            >
              🏥 Admin Dashboard
            </button>
            <button 
              className="profile-button"
              onClick={handleShowProfile}
              title={`Profile: ${user.email}`}
            >
              <span className="profile-emoji">👤</span>
              <span>{user.user_metadata?.name || user.email?.split('@')[0] || 'Admin'}</span>
            </button>
            <button 
              className="logout-button-header"
              onClick={handleLogout}
              title="Logout"
            >
              🚪 Logout
            </button>
          </div>
        </header>
      )}
      
      {/* 普通用户：显示完整的 header */}
      {userRole !== 'admin' && user && step !== 'admin' && (
        <header className="app-header">
          <h1>farmasiKu</h1>
          <div className="user-menu">
            <button 
              className="my-orders-button"
              onClick={handleShowMyOrders}
              title="My Orders"
            >
              📦 My Orders
            </button>
            <button 
              className="profile-button"
              onClick={handleShowProfile}
              title={`Profile: ${user.email}`}
            >
              <span className="profile-emoji">👤</span>
              <span>{user.user_metadata?.name || user.email?.split('@')[0] || 'User'}</span>
            </button>
          </div>
        </header>
      )}

      <main className="app-main">
        {/* 管理员：只显示管理功能，隐藏普通用户功能 */}
        {userRole === 'admin' ? (
          <>
            {step === 'admin' && user && (
              <FarmasiAdmin
                user={user}
                onBack={handleBackFromAdmin}
                onLogout={handleLogout}
              />
            )}
            {step === 'profile' && user && (
              <Profile
                user={user}
                onLogout={handleLogout}
              />
            )}
          </>
        ) : (
          <>
            {/* 普通用户：显示正常流程 */}
            {step !== 'admin' && step !== 'profile' && step !== 'my-orders' && step !== 'order-tracking' && step !== 'consultation-list' && step !== 'welcome' && 
             step !== 'consultation-patient' && step !== 'consultation-doctor' && step !== 'consultation-waiting' && (
              <>
                <ProgressIndicator 
                  currentStep={stepInfo.number} 
                  totalSteps={stepInfo.total}
                  stepName={stepInfo.name}
                />
                
                {step !== 'age' && step !== 'success' && step !== 'consultation-review' && (
                  <BackButton onClick={handleBack} />
                )}

                {showDangerWarning && selectedSymptoms.length > 0 && (
                  <DangerWarning
                    symptoms={selectedSymptoms.filter(s => dangerousSymptoms.includes(s))}
                    onConsultation={handleDangerWarningConsultation}
                    onContinue={handleDangerWarningContinue}
                  />
                )}
              </>
            )}
            
            {step === 'welcome' && (
              <Welcome 
                onStart={() => setStep('age')} 
              />
            )}


            {step === 'age' && (
              <AgeInput onContinue={handleAgeContinue} />
            )}

            {step === 'bodyPart' && (
              <BodyPartSelection
                bodyParts={bodyParts}
                onSelect={handleBodyPartSelect}
              />
            )}

            {step === 'symptom' && (
              <SymptomSelection
                bodyPart={currentBodyPart || selectedBodyPart}
                symptoms={symptomsByBodyPart[currentBodyPart || selectedBodyPart] || []}
                selectedSymptoms={selectedSymptoms}
                symptomAssessments={symptomAssessments}
                onToggle={handleSymptomToggle}
                onComplete={handleSymptomComplete}
                onMoreSymptoms={handleMoreSymptoms}
                onAssess={handleInlineAssessment}
                isSelectingMore={isSelectingMore}
              />
            )}

            {step === 'assessment' && currentSymptomForAssessment && (
              <SymptomAssessment
                symptom={currentSymptomForAssessment}
                onComplete={handleAssessmentComplete}
                onBack={() => {
                  setStep('symptom')
                  setCurrentSymptomForAssessment(null)
                }}
              />
            )}

            {step === 'confirmation' && (
              <SymptomConfirmation
                symptoms={selectedSymptoms}
                symptomAssessments={symptomAssessments}
                onConfirm={handleConfirmSymptoms}
              />
            )}

            {step === 'medication' && (
              <MedicationRecommendation
                symptoms={selectedSymptoms}
                medications={recommendedMedications}
                userAge={userAge}
                onOrder={handleOrder}
              />
            )}

            {step === 'delivery' && user && selectedMedications.length > 0 && (
              <DeliveryInfo
                user={user}
                onContinue={handleDeliveryContinue}
                onBack={handleBack}
              />
            )}

            {step === 'payment' && selectedMedications.length > 0 && deliveryInfo && (
              <Payment
                medications={selectedMedications}
                totalPrice={selectedMedications.reduce((sum, m) => sum + m.price, 0)}
                onPay={handlePayment}
                onBack={handleBack}
              />
            )}
          </>
        )}

        {/* 所有用户都可以访问的功能 */}

        {step === 'consultation-patient' && user && currentConsultationSession && (
          <SimpleChat
            user={user}
            onBack={() => setStep('welcome')}
            sessionId={currentConsultationSession.id}
            isDoctor={false}
            otherUserInfo={currentConsultationSession.doctor || { name: 'Pharmacist' }}
            session={currentConsultationSession}
            onMedicationAccepted={handleMedicationAccepted}
            onConsultationComplete={() => {
              console.log('[App] onConsultationComplete callback called directly in JSX')
              handleConsultationComplete()
            }}
          />
        )}

        {step === 'consultation-doctor' && user && currentConsultationSession && (
          <SimpleChat
            user={user}
            onBack={() => setStep('welcome')}
            sessionId={currentConsultationSession.id}
            isDoctor={true}
            otherUserInfo={{ email: 'Patient' }}
            session={currentConsultationSession}
          />
        )}

        {step === 'consultation-review' && user && currentConsultationSession && (
          <ConsultationMedicationReview
            sessionId={currentConsultationSession.id}
            user={user}
            onContinue={handleMedicationReviewContinue}
            onBack={handleBack}
          />
        )}

        {step === 'success' && selectedMedications.length > 0 && (
          <OrderSuccess
            medications={selectedMedications}
            onReset={handleReset}
          />
        )}

        {step === 'profile' && user && userRole !== 'admin' && (
          <Profile
            user={user}
            onLogout={handleLogout}
            onRestartFlow={handleRestartFlow}
            onTrackOrder={(orderId) => {
              setTrackingOrderId(orderId)
              setStep('order-tracking')
            }}
          />
        )}

        {step === 'my-orders' && user && userRole !== 'admin' && (
          <MyOrders
            user={user}
            onBack={() => setStep('welcome')}
            onTrackOrder={(orderId) => {
              setTrackingOrderId(orderId)
              setStep('order-tracking')
            }}
          />
        )}

        {step === 'order-tracking' && user && trackingOrderId && (
          <OrderTracking
            orderId={trackingOrderId}
            user={user}
            onBack={() => {
              setStep('profile')
              setTrackingOrderId(null)
            }}
          />
        )}

        {step === 'consultation-waiting' && user && (
          <ConsultationQueue
            user={user}
            symptoms={selectedSymptoms}
            symptomAssessments={symptomAssessments}
            selectedBodyPart={selectedBodyPart}
            userAge={userAge}
            onEnterChat={async ({ queue, session }) => {
              // 当进入聊天时，设置会话并跳转
              if (session) {
                setCurrentConsultationSession(session)
                setStep('consultation-patient')
              } else {
                // 如果没有会话，尝试加载
                await loadMatchedSession(queue)
              }
            }}
            onCancel={() => {
              setStep('welcome')
            }}
          />
        )}
      </main>
    </div>
  )
}

export default App


