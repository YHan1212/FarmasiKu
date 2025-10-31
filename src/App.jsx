import React, { useState } from 'react'
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
import { bodyParts, symptomsByBodyPart, medicationsBySymptoms, hasDangerousSymptoms, dangerousSymptoms, getStepInfo } from './data/appData'
import './styles/App.css'

function App() {
  const [step, setStep] = useState('age') // age, bodyPart, symptom, assessment, confirmation, medication, payment, consultation, success
  const [userAge, setUserAge] = useState(null)
  const [selectedBodyPart, setSelectedBodyPart] = useState(null)
  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const [symptomAssessments, setSymptomAssessments] = useState({}) // Store assessments for each symptom
  const [currentBodyPart, setCurrentBodyPart] = useState(null)
  const [isSelectingMore, setIsSelectingMore] = useState(false)
  const [currentSymptomForAssessment, setCurrentSymptomForAssessment] = useState(null)
  const [showDangerWarning, setShowDangerWarning] = useState(false)
  const [selectedMedications, setSelectedMedications] = useState([])

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

  // Start assessment for a symptom
  const handleStartAssessment = (symptom) => {
    setCurrentSymptomForAssessment(symptom)
    setStep('assessment')
  }

  // Complete assessment
  const handleAssessmentComplete = (assessment) => {
    setSymptomAssessments({
      ...symptomAssessments,
      [assessment.symptom]: assessment
    })
    setCurrentSymptomForAssessment(null)
    setStep('symptom')
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
  const handleConfirmSymptoms = (isMoreSevere) => {
    if (isMoreSevere) {
      setStep('consultation')
    } else {
      setStep('medication')
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
    if (step === 'bodyPart') {
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
  const handlePayment = (paymentInfo) => {
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>farmasiKu</h1>
      </header>

      <main className="app-main">
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
            onAssess={handleStartAssessment}
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
            medications={medicationsBySymptoms(selectedSymptoms, userAge)}
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
          />
        )}

        {step === 'success' && selectedMedications.length > 0 && (
          <OrderSuccess
            medications={selectedMedications}
            onReset={handleReset}
          />
        )}
      </main>
    </div>
  )
}

export default App


