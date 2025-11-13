import React, { useState, useEffect } from 'react'
import AgeInput from './components/AgeInput'
import BodyPartSelection from './components/BodyPartSelection'
import SymptomSelection from './components/SymptomSelection'
import SymptomConfirmation from './components/SymptomConfirmation'
import SymptomAssessment from './components/SymptomAssessment'
import MedicationRecommendation from './components/MedicationRecommendation'
import Payment from './components/Payment'
import ConsultationRedirect from './components/ConsultationRedirect'
import OrderSuccess from './components/OrderSuccess'
import ProgressIndicator from './components/ProgressIndicator'
import BackButton from './components/BackButton'
import DangerWarning from './components/DangerWarning'
import Login from './components/Login'
import Register from './components/Register'
import ForgotPassword from './components/ForgotPassword'
import ResetPassword from './components/ResetPassword'
import Profile from './components/Profile'
import FarmasiAdmin from './components/FarmasiAdmin'
import ConsultationList from './components/ConsultationList'
import { supabase } from './lib/supabase'
import { bodyParts, symptomsByBodyPart, medicationsBySymptoms, hasDangerousSymptoms, dangerousSymptoms, getStepInfo, getAgeCategory, getAgeRestrictions, medicationUsage } from './data/appData'
import { databaseService } from './services/databaseService'
import './styles/App.css'

function App() {
  const [user, setUser] = useState(null)
  const [authStep, setAuthStep] = useState('login') // 'login', 'register', 'forgot-password', 'reset-password', 'authenticated'
  const [step, setStep] = useState('age') // age, bodyPart, symptom, assessment, confirmation, medication, payment, consultation, consultation-list, success, profile, admin
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

  // Check authentication status on mount
  useEffect(() => {
    if (!supabase) {
      // If Supabase not configured, allow guest access
      setAuthStep('authenticated')
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
        // No session, show login but allow guest access
        setAuthStep('login')
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        setAuthStep('authenticated')
      } else {
        setUser(null)
        // Don't force login, allow guest access
        // setAuthStep('login')
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // Handle authentication
  const handleLogin = (userData) => {
    if (userData) {
      setUser(userData)
      setAuthStep('authenticated')
    } else {
      // Continue as guest
      setAuthStep('authenticated')
    }
  }

  const handleRegister = (userData) => {
    setUser(userData)
    setAuthStep('authenticated')
  }

  const handleLogout = () => {
    setUser(null)
    setAuthStep('login')
    handleReset()
  }

  const handleShowProfile = () => {
    setStep('profile')
  }

  const handleShowAdmin = () => {
    setStep('admin')
  }

  const handleBackFromAdmin = () => {
    setStep('age')
    handleReset()
  }

  const handleShowConsultations = () => {
    setStep('consultation-list')
  }

  const handleStartConsultation = (session) => {
    setStep('consultation-list')
    // The ConsultationList will handle showing the chat
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
      setStep('consultation')
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

  // Handle danger warning actions
  const handleDangerWarningConsultation = () => {
    setShowDangerWarning(false)
    setStep('consultation')
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
    if (step === 'profile') {
      setStep('age')
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
    } else if (step === 'payment') {
      setStep('medication')
    }
  }

  // Handle order - go to payment page
  const handleOrder = (medications) => {
    setSelectedMedications(medications)
    setStep('payment')
  }

  // Handle payment
  const handlePayment = async (paymentInfo) => {
    // Save order to database (silently fails if DB not configured)
    try {
      await databaseService.saveOrder({
        medications: selectedMedications,
        paymentMethod: paymentInfo.paymentMethod,
        transactionId: paymentInfo.transactionId,
        userAge,
        userId: user?.id || null
      })
    } catch (error) {
      // Silently continue - database errors won't interrupt user flow
    }

    setStep('success')
  }

  // Reset application
  const handleReset = () => {
    setStep('age')
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
      {step !== 'admin' && (
        <header className="app-header">
          <h1>farmasiKu</h1>
          {user && (
            <div className="user-menu">
            <button 
              className="consultation-button-header"
              onClick={handleShowConsultations}
              title="My Consultations"
            >
              💬 Consultations
            </button>
            <button 
              className="admin-button"
              onClick={handleShowAdmin}
              title="Admin Dashboard"
            >
              🏥 Admin
            </button>
            <button 
              className="profile-button"
              onClick={handleShowProfile}
              title={user.email}
            >
              {user.user_metadata?.name || user.email?.split('@')[0] || 'User'}
            </button>
            </div>
          )}
        </header>
      )}

      <main className="app-main">
        {step !== 'admin' && step !== 'profile' && step !== 'consultation-list' && (
          <>
            <ProgressIndicator 
              currentStep={stepInfo.number} 
              totalSteps={stepInfo.total}
              stepName={stepInfo.name}
            />
            
            {step !== 'age' && step !== 'success' && (
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

        {step === 'payment' && selectedMedications.length > 0 && (
          <Payment
            medications={selectedMedications}
            totalPrice={selectedMedications.reduce((sum, m) => sum + m.price, 0)}
            onPay={handlePayment}
            onBack={handleBack}
          />
        )}

        {step === 'consultation' && (
          <ConsultationRedirect
            onBack={() => setStep('confirmation')}
            symptoms={selectedSymptoms}
            onStartConsultation={handleStartConsultation}
          />
        )}

        {step === 'consultation-list' && user && (
          <ConsultationList
            user={user}
            onBack={() => setStep('age')}
          />
        )}

        {step === 'success' && selectedMedications.length > 0 && (
          <OrderSuccess
            medications={selectedMedications}
            onReset={handleReset}
          />
        )}

        {step === 'profile' && user && (
          <Profile
            user={user}
            onLogout={handleLogout}
          />
        )}

        {step === 'admin' && user && (
          <FarmasiAdmin
            user={user}
            onBack={handleBackFromAdmin}
          />
        )}
      </main>
    </div>
  )
}

export default App


