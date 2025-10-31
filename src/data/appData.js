// Body parts data
export const bodyParts = [
  'Skin',
  'Feet',
  'Head',
  'Chest',
  'Abdomen',
  'Other'
]

// Symptoms by body part
export const symptomsByBodyPart = {
  'Skin': ['Itching', 'Rash', 'Dryness', 'Redness', 'Pain'],
  'Feet': ['Pain', 'Swelling', 'Itching', 'Numbness', 'Blisters'],
  'Head': ['Dizziness', 'Fever', 'Cough', 'Headache', 'Nasal Congestion', 'Runny Nose'],
  'Chest': ['Cough', 'Chest Tightness', 'Difficulty Breathing', 'Chest Pain'],
  'Abdomen': ['Abdominal Pain', 'Stomach Pain', 'Nausea', 'Diarrhea', 'Constipation'],
  'Other': ['Fatigue', 'Muscle Ache', 'Joint Pain', 'Insomnia']
}

// Dangerous symptoms that require immediate medical attention
export const dangerousSymptoms = [
  'Difficulty Breathing',
  'Chest Pain',
  'Severe Abdominal Pain',
  'High Fever',
  'Loss of Consciousness',
  'Severe Bleeding'
]

// Check if symptoms contain dangerous ones
export const hasDangerousSymptoms = (symptoms) => {
  return symptoms.some(symptom => dangerousSymptoms.includes(symptom))
}

// Get step information for progress indicator
export const getStepInfo = (step) => {
  const steps = {
    'age': { number: 1, name: 'Enter Age', total: 8 },
    'bodyPart': { number: 2, name: 'Select Body Part', total: 8 },
    'symptom': { number: 3, name: 'Select Symptoms', total: 8 },
    'assessment': { number: 3, name: 'Assess Symptoms', total: 8 },
    'confirmation': { number: 4, name: 'Confirm Symptoms', total: 8 },
    'medication': { number: 5, name: 'Medications', total: 8 },
    'payment': { number: 6, name: 'Payment', total: 8 },
    'consultation': { number: 7, name: 'Consultation', total: 8 },
    'success': { number: 8, name: 'Success', total: 8 }
  }
  return steps[step] || steps['age']
}

// Get age category
export const getAgeCategory = (age) => {
  if (age < 13) return 'child'
  if (age < 65) return 'adult'
  return 'elderly'
}

// Age-specific medication restrictions
export const getAgeRestrictions = (age) => {
  const category = getAgeCategory(age)
  const restrictions = {
    child: {
      restricted: ['Ibuprofen Tablets', 'Sleep Aid', 'Laxative Pills'],
      warning: 'Some medications may not be suitable for children. Please consult a doctor.',
      alternatives: {
        'Ibuprofen Tablets': 'Paracetamol Tablets',
        'Sleep Aid': 'Natural Sleep Remedies',
        'Laxative Pills': 'Child-friendly Laxative'
      }
    },
    elderly: {
      restricted: [],
      warning: 'For elderly patients, lower dosages may be recommended. Please consult a doctor for proper dosage.',
      alternatives: {}
    },
    adult: {
      restricted: [],
      warning: null,
      alternatives: {}
    }
  }
  return restrictions[category]
}

// Medication usage instructions
export const medicationUsage = {
  'Dimenhydrinate Tablets': {
    method: 'oral', // oral, topical, patch, spray
    methodLabel: 'Oral (Take by mouth)',
    dosage: '1 tablet',
    frequency: 'Every 4-6 hours as needed',
    maxDosage: '3 tablets per day',
    instructions: 'Take with or without food. If drowsiness occurs, avoid driving.',
    duration: 'Until symptoms improve',
    icon: '💊'
  },
  'Ibuprofen Tablets': {
    method: 'oral',
    methodLabel: 'Oral (Take by mouth)',
    dosage: '200-400mg (1-2 tablets)',
    frequency: 'Every 4-6 hours',
    maxDosage: '1200mg (6 tablets) per day',
    instructions: 'Take with food or milk to avoid stomach upset. Do not exceed recommended dose.',
    duration: '3-5 days or as directed',
    icon: '💊'
  },
  'Paracetamol Tablets': {
    method: 'oral',
    methodLabel: 'Oral (Take by mouth)',
    dosage: '500-1000mg (1-2 tablets)',
    frequency: 'Every 4-6 hours',
    maxDosage: '4000mg (8 tablets) per day',
    instructions: 'Take with water. Safe for most people, including children (with proper dosage).',
    duration: '3-5 days or as needed',
    icon: '💊'
  },
  'Cough Syrup': {
    method: 'oral',
    methodLabel: 'Oral (Take by mouth)',
    dosage: '10-15ml (2-3 teaspoons)',
    frequency: 'Every 4-6 hours',
    maxDosage: '4 times per day',
    instructions: 'Measure using provided spoon. Do not exceed recommended dosage.',
    duration: '5-7 days or until cough subsides',
    icon: '🥤'
  },
  'Loquat Syrup': {
    method: 'oral',
    methodLabel: 'Oral (Take by mouth)',
    dosage: '15-20ml (3-4 teaspoons)',
    frequency: '3 times daily',
    maxDosage: '3 times per day',
    instructions: 'Take after meals for best results. Natural herbal remedy.',
    duration: '5-7 days',
    icon: '🥤'
  },
  'Headache Relief': {
    method: 'oral',
    methodLabel: 'Oral (Take by mouth)',
    dosage: '1-2 tablets',
    frequency: 'Every 4-6 hours as needed',
    maxDosage: '4 tablets per day',
    instructions: 'Take with water. Best taken at first sign of headache.',
    duration: 'Until pain relieves',
    icon: '💊'
  },
  'Nasal Decongestant': {
    method: 'spray',
    methodLabel: 'Nasal Spray',
    dosage: '1-2 sprays per nostril',
    frequency: 'Every 4-6 hours',
    maxDosage: '4 times per day',
    instructions: 'Tilt head back, insert nozzle, spray and breathe in gently. Do not use for more than 3 days.',
    duration: '2-3 days maximum',
    icon: '👃'
  },
  'Antihistamine': {
    method: 'oral',
    methodLabel: 'Oral (Take by mouth)',
    dosage: '1 tablet',
    frequency: 'Once daily',
    maxDosage: '1 tablet per day',
    instructions: 'May cause drowsiness. Take in the evening if needed.',
    duration: 'As long as symptoms persist',
    icon: '💊'
  },
  'Antihistamine Cream': {
    method: 'topical',
    methodLabel: 'Topical (Apply to skin)',
    dosage: 'Thin layer',
    frequency: '2-3 times daily',
    maxDosage: '3 times per day',
    instructions: 'Wash and dry affected area. Apply thin layer and gently rub in. Wash hands after use.',
    duration: 'Until itching/rash clears',
    icon: '🧴'
  },
  'Antifungal Cream': {
    method: 'topical',
    methodLabel: 'Topical (Apply to skin)',
    dosage: 'Thin layer covering affected area',
    frequency: '2 times daily (morning and evening)',
    maxDosage: '2 times per day',
    instructions: 'Clean and dry affected area first. Apply and rub gently. Continue for 1 week after symptoms clear.',
    duration: '2-4 weeks',
    icon: '🧴'
  },
  'Pain Relief Patch': {
    method: 'patch',
    methodLabel: 'Topical Patch',
    dosage: '1 patch',
    frequency: 'Apply once, replace every 8-12 hours',
    maxDosage: '3 patches per day',
    instructions: 'Clean and dry skin. Apply to painful area. Remove after 8-12 hours. Do not reuse.',
    duration: 'As needed for pain relief',
    icon: '🩹'
  },
  'Anti-inflammatory Gel': {
    method: 'topical',
    methodLabel: 'Topical (Apply to skin)',
    dosage: 'Thin layer (pea-sized amount)',
    frequency: '3-4 times daily',
    maxDosage: '4 times per day',
    instructions: 'Massage gently into affected area. Wash hands after application. Avoid contact with eyes.',
    duration: 'Until swelling reduces',
    icon: '🧴'
  },
  'Liniment Oil': {
    method: 'topical',
    methodLabel: 'Topical (Apply to skin)',
    dosage: 'Few drops',
    frequency: '2-3 times daily',
    maxDosage: '3 times per day',
    instructions: 'Apply to affected area and massage gently. Avoid broken skin. Wash hands after use.',
    duration: 'Until symptoms improve',
    icon: '🫗'
  },
  'Antiseptic Ointment': {
    method: 'topical',
    methodLabel: 'Topical (Apply to skin)',
    dosage: 'Thin layer covering wound',
    frequency: '2-3 times daily',
    maxDosage: '3 times per day',
    instructions: 'Clean wound first. Apply thin layer and cover with bandage if needed. Keep area clean and dry.',
    duration: 'Until wound heals',
    icon: '🧴'
  },
  'Chest Relief Tablets': {
    method: 'oral',
    methodLabel: 'Oral (Take by mouth)',
    dosage: '1-2 tablets',
    frequency: 'Every 6-8 hours',
    maxDosage: '3 times per day',
    instructions: 'Take with warm water for best effect. May help with chest congestion.',
    duration: '5-7 days or as directed',
    icon: '💊'
  },
  'Stomach Relief': {
    method: 'oral',
    methodLabel: 'Oral (Take by mouth)',
    dosage: '1-2 tablets',
    frequency: 'Every 4-6 hours',
    maxDosage: '4 times per day',
    instructions: 'Take with water, preferably after meals. Chew or swallow whole.',
    duration: 'Until symptoms improve',
    icon: '💊'
  },
  'Anti-nausea Tablets': {
    method: 'oral',
    methodLabel: 'Oral (Take by mouth)',
    dosage: '1 tablet',
    frequency: 'Every 4-6 hours as needed',
    maxDosage: '4 tablets per day',
    instructions: 'Take 30 minutes before meals or as soon as nausea starts. Let dissolve in mouth.',
    duration: 'As needed',
    icon: '💊'
  },
  'Anti-diarrheal': {
    method: 'oral',
    methodLabel: 'Oral (Take by mouth)',
    dosage: '1-2 tablets or capsules',
    frequency: 'After each loose bowel movement',
    maxDosage: '8 tablets per day',
    instructions: 'Take with water. Drink plenty of fluids to prevent dehydration.',
    duration: 'Until diarrhea stops (max 2 days)',
    icon: '💊'
  },
  'Laxative Pills': {
    method: 'oral',
    methodLabel: 'Oral (Take by mouth)',
    dosage: '1-2 tablets',
    frequency: 'Once daily, preferably at bedtime',
    maxDosage: '2 tablets per day',
    instructions: 'Take with plenty of water. Expect results in 6-12 hours. Do not use for more than 1 week.',
    duration: 'Until constipation resolves (max 1 week)',
    icon: '💊'
  },
  'Vitamin B Complex': {
    method: 'oral',
    methodLabel: 'Oral (Take by mouth)',
    dosage: '1 tablet',
    frequency: 'Once daily',
    maxDosage: '1 tablet per day',
    instructions: 'Take with food. Best taken in the morning with breakfast.',
    duration: 'As dietary supplement',
    icon: '💊'
  },
  'Joint Pain Patch': {
    method: 'patch',
    methodLabel: 'Topical Patch',
    dosage: '1 patch',
    frequency: 'Apply once, replace every 12 hours',
    maxDosage: '2 patches per day',
    instructions: 'Apply to clean, dry skin over painful joint. Remove after 12 hours. Can be used for chronic pain.',
    duration: 'As needed for pain management',
    icon: '🩹'
  },
  'Sleep Aid': {
    method: 'oral',
    methodLabel: 'Oral (Take by mouth)',
    dosage: '1 tablet',
    frequency: 'Once before bedtime',
    maxDosage: '1 tablet per day',
    instructions: 'Take 30 minutes before sleep. Do not drive or operate machinery. Not for long-term use.',
    duration: 'Short-term use only (max 2 weeks)',
    icon: '💊'
  },
  'Moisturizing Cream': {
    method: 'topical',
    methodLabel: 'Topical (Apply to skin)',
    dosage: 'Generous amount',
    frequency: '2-3 times daily or as needed',
    maxDosage: 'As needed',
    instructions: 'Apply to clean, dry skin. Massage gently until absorbed. Best applied after bathing.',
    duration: 'As needed for dry skin',
    icon: '🧴'
  },
  'Anti-inflammatory Cream': {
    method: 'topical',
    methodLabel: 'Topical (Apply to skin)',
    dosage: 'Thin layer',
    frequency: '3-4 times daily',
    maxDosage: '4 times per day',
    instructions: 'Apply to reddened/inflamed area. Gently massage in. Avoid contact with eyes.',
    duration: 'Until redness reduces',
    icon: '🧴'
  },
  'General Relief Medicine': {
    method: 'oral',
    methodLabel: 'Oral (Take by mouth)',
    dosage: 'As directed',
    frequency: 'As directed',
    maxDosage: 'As directed',
    instructions: 'Follow package instructions or consult healthcare provider.',
    duration: 'As directed',
    icon: '💊'
  },
  'Natural Sleep Remedies': {
    method: 'oral',
    methodLabel: 'Oral (Take by mouth)',
    dosage: 'As directed on package',
    frequency: 'Once before bedtime',
    maxDosage: 'As directed',
    instructions: 'Natural herbal remedy. Take 30 minutes before sleep. Safe for children.',
    duration: 'As needed',
    icon: '🌿'
  },
  'Child-friendly Laxative': {
    method: 'oral',
    methodLabel: 'Oral (Take by mouth)',
    dosage: 'As per age/weight (consult package)',
    frequency: 'Once daily',
    maxDosage: 'As directed',
    instructions: 'Child-safe formulation. Consult package for age-appropriate dosage. Ensure adequate fluid intake.',
    duration: 'Until constipation resolves',
    icon: '💊'
  }
}

// Recommend medications based on symptoms and age
export const medicationsBySymptoms = (symptoms, age = null) => {
  const medicationMap = {
    'Dizziness': [{ name: 'Dimenhydrinate Tablets', price: 15.90 }],
    'Fever': [{ name: 'Ibuprofen Tablets', price: 12.50 }, { name: 'Paracetamol Tablets', price: 8.90 }],
    'Cough': [{ name: 'Cough Syrup', price: 18.50 }, { name: 'Loquat Syrup', price: 22.00 }],
    'Headache': [{ name: 'Headache Relief', price: 10.00 }, { name: 'Ibuprofen Tablets', price: 12.50 }],
    'Nasal Congestion': [{ name: 'Nasal Decongestant', price: 9.90 }],
    'Runny Nose': [{ name: 'Nasal Decongestant', price: 9.90 }, { name: 'Antihistamine', price: 14.50 }],
    'Itching': [{ name: 'Antihistamine Cream', price: 16.80 }],
    'Rash': [{ name: 'Antifungal Cream', price: 13.50 }],
    'Pain': [{ name: 'Pain Relief Patch', price: 11.00 }, { name: 'Ibuprofen Tablets', price: 12.50 }],
    'Swelling': [{ name: 'Anti-inflammatory Gel', price: 14.90 }],
    'Numbness': [{ name: 'Liniment Oil', price: 18.00 }],
    'Blisters': [{ name: 'Antiseptic Ointment', price: 15.50 }],
    'Chest Tightness': [{ name: 'Chest Relief Tablets', price: 19.90 }],
    'Difficulty Breathing': [{ name: 'Chest Relief Tablets', price: 19.90 }],
    'Chest Pain': [{ name: 'Pain Relief Patch', price: 11.00 }],
    'Abdominal Pain': [{ name: 'Stomach Relief', price: 13.80 }],
    'Stomach Pain': [{ name: 'Stomach Relief', price: 13.80 }],
    'Nausea': [{ name: 'Anti-nausea Tablets', price: 10.50 }],
    'Diarrhea': [{ name: 'Anti-diarrheal', price: 12.00 }],
    'Constipation': [{ name: 'Laxative Pills', price: 15.00 }],
    'Fatigue': [{ name: 'Vitamin B Complex', price: 25.00 }],
    'Muscle Ache': [{ name: 'Liniment Oil', price: 18.00 }, { name: 'Pain Relief Patch', price: 11.00 }],
    'Joint Pain': [{ name: 'Joint Pain Patch', price: 16.50 }],
    'Insomnia': [{ name: 'Sleep Aid', price: 20.00 }],
    'Dryness': [{ name: 'Moisturizing Cream', price: 12.90 }],
    'Redness': [{ name: 'Anti-inflammatory Cream', price: 14.80 }]
  }

  // Merge all matching medications, remove duplicates
  const medications = []
  const seen = new Set()

  symptoms.forEach(symptom => {
    if (medicationMap[symptom]) {
      medicationMap[symptom].forEach(med => {
        const key = med.name
        if (!seen.has(key)) {
          seen.add(key)
          
          // Add age-specific warnings and restrictions
          let medication = { ...med }
          
          if (age !== null) {
            const ageCategory = getAgeCategory(age)
            const restrictions = getAgeRestrictions(age)
            
            if (ageCategory === 'child' && restrictions.restricted.includes(med.name)) {
              // Replace with child-safe alternative if available
              if (restrictions.alternatives[med.name]) {
                const altMed = medicationMap[symptom].find(m => 
                  m.name === restrictions.alternatives[med.name]
                )
                if (altMed) {
                  medication = { ...altMed, isChildAlternative: true, originalMed: med.name }
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
          
          // Add usage instructions
          if (medicationUsage[medication.name]) {
            medication.usage = medicationUsage[medication.name]
          } else {
            // Default usage if not found
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
          
          medications.push(medication)
        }
      })
    }
  })

  // If no matching medications, return default medication
  if (medications.length === 0) {
    return [{ name: 'General Relief Medicine', price: 15.00 }]
  }

  return medications
}

