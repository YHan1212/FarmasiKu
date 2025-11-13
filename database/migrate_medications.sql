-- Migration script to populate medications and symptom-medication mappings
-- Run this after running schema.sql

-- Insert medications with usage instructions
INSERT INTO public.medications (name, price, usage_instructions, age_restrictions) VALUES
('Dimenhydrinate Tablets', 15.90, '{"method": "oral", "methodLabel": "Oral (Take by mouth)", "dosage": "1 tablet", "frequency": "Every 4-6 hours as needed", "maxDosage": "3 tablets per day", "instructions": "Take with or without food. If drowsiness occurs, avoid driving.", "duration": "Until symptoms improve", "icon": "💊"}', '{"restricted_for": [], "alternatives": {}}'),
('Ibuprofen Tablets', 12.50, '{"method": "oral", "methodLabel": "Oral (Take by mouth)", "dosage": "200-400mg (1-2 tablets)", "frequency": "Every 4-6 hours", "maxDosage": "1200mg (6 tablets) per day", "instructions": "Take with food or milk to avoid stomach upset. Do not exceed recommended dose.", "duration": "3-5 days or as directed", "icon": "💊"}', '{"restricted_for": ["child"], "alternatives": {"Ibuprofen Tablets": "Paracetamol Tablets"}}'),
('Paracetamol Tablets', 8.90, '{"method": "oral", "methodLabel": "Oral (Take by mouth)", "dosage": "500-1000mg (1-2 tablets)", "frequency": "Every 4-6 hours", "maxDosage": "4000mg (8 tablets) per day", "instructions": "Take with water. Safe for most people, including children (with proper dosage).", "duration": "3-5 days or as needed", "icon": "💊"}', '{"restricted_for": [], "alternatives": {}}'),
('Cough Syrup', 18.50, '{"method": "oral", "methodLabel": "Oral (Take by mouth)", "dosage": "10-15ml (2-3 teaspoons)", "frequency": "Every 4-6 hours", "maxDosage": "4 times per day", "instructions": "Measure using provided spoon. Do not exceed recommended dosage.", "duration": "5-7 days or until cough subsides", "icon": "🥤"}', '{"restricted_for": [], "alternatives": {}}'),
('Loquat Syrup', 22.00, '{"method": "oral", "methodLabel": "Oral (Take by mouth)", "dosage": "15-20ml (3-4 teaspoons)", "frequency": "3 times daily", "maxDosage": "3 times per day", "instructions": "Take after meals for best results. Natural herbal remedy.", "duration": "5-7 days", "icon": "🥤"}', '{"restricted_for": [], "alternatives": {}}'),
('Headache Relief', 10.00, '{"method": "oral", "methodLabel": "Oral (Take by mouth)", "dosage": "1-2 tablets", "frequency": "Every 4-6 hours as needed", "maxDosage": "4 tablets per day", "instructions": "Take with water. Best taken at first sign of headache.", "duration": "Until pain relieves", "icon": "💊"}', '{"restricted_for": [], "alternatives": {}}'),
('Nasal Decongestant', 9.90, '{"method": "spray", "methodLabel": "Nasal Spray", "dosage": "1-2 sprays per nostril", "frequency": "Every 4-6 hours", "maxDosage": "4 times per day", "instructions": "Tilt head back, insert nozzle, spray and breathe in gently. Do not use for more than 3 days.", "duration": "2-3 days maximum", "icon": "👃"}', '{"restricted_for": [], "alternatives": {}}'),
('Antihistamine', 14.50, '{"method": "oral", "methodLabel": "Oral (Take by mouth)", "dosage": "1 tablet", "frequency": "Once daily", "maxDosage": "1 tablet per day", "instructions": "May cause drowsiness. Take in the evening if needed.", "duration": "As long as symptoms persist", "icon": "💊"}', '{"restricted_for": [], "alternatives": {}}'),
('Antihistamine Cream', 16.80, '{"method": "topical", "methodLabel": "Topical (Apply to skin)", "dosage": "Thin layer", "frequency": "2-3 times daily", "maxDosage": "3 times per day", "instructions": "Wash and dry affected area. Apply thin layer and gently rub in. Wash hands after use.", "duration": "Until itching/rash clears", "icon": "🧴"}', '{"restricted_for": [], "alternatives": {}}'),
('Antifungal Cream', 13.50, '{"method": "topical", "methodLabel": "Topical (Apply to skin)", "dosage": "Thin layer covering affected area", "frequency": "2 times daily (morning and evening)", "maxDosage": "2 times per day", "instructions": "Clean and dry affected area first. Apply and rub gently. Continue for 1 week after symptoms clear.", "duration": "2-4 weeks", "icon": "🧴"}', '{"restricted_for": [], "alternatives": {}}'),
('Pain Relief Patch', 11.00, '{"method": "patch", "methodLabel": "Topical Patch", "dosage": "1 patch", "frequency": "Apply once, replace every 8-12 hours", "maxDosage": "3 patches per day", "instructions": "Clean and dry skin. Apply to painful area. Remove after 8-12 hours. Do not reuse.", "duration": "As needed for pain relief", "icon": "🩹"}', '{"restricted_for": [], "alternatives": {}}'),
('Anti-inflammatory Gel', 14.90, '{"method": "topical", "methodLabel": "Topical (Apply to skin)", "dosage": "Thin layer (pea-sized amount)", "frequency": "3-4 times daily", "maxDosage": "4 times per day", "instructions": "Massage gently into affected area. Wash hands after application. Avoid contact with eyes.", "duration": "Until swelling reduces", "icon": "🧴"}', '{"restricted_for": [], "alternatives": {}}'),
('Liniment Oil', 18.00, '{"method": "topical", "methodLabel": "Topical (Apply to skin)", "dosage": "Few drops", "frequency": "2-3 times daily", "maxDosage": "3 times per day", "instructions": "Apply to affected area and massage gently. Avoid broken skin. Wash hands after use.", "duration": "Until symptoms improve", "icon": "🫗"}', '{"restricted_for": [], "alternatives": {}}'),
('Antiseptic Ointment', 15.50, '{"method": "topical", "methodLabel": "Topical (Apply to skin)", "dosage": "Thin layer covering wound", "frequency": "2-3 times daily", "maxDosage": "3 times per day", "instructions": "Clean wound first. Apply thin layer and cover with bandage if needed. Keep area clean and dry.", "duration": "Until wound heals", "icon": "🧴"}', '{"restricted_for": [], "alternatives": {}}'),
('Chest Relief Tablets', 19.90, '{"method": "oral", "methodLabel": "Oral (Take by mouth)", "dosage": "1-2 tablets", "frequency": "Every 6-8 hours", "maxDosage": "3 times per day", "instructions": "Take with warm water for best effect. May help with chest congestion.", "duration": "5-7 days or as directed", "icon": "💊"}', '{"restricted_for": [], "alternatives": {}}'),
('Stomach Relief', 13.80, '{"method": "oral", "methodLabel": "Oral (Take by mouth)", "dosage": "1-2 tablets", "frequency": "Every 4-6 hours", "maxDosage": "4 times per day", "instructions": "Take with water, preferably after meals. Chew or swallow whole.", "duration": "Until symptoms improve", "icon": "💊"}', '{"restricted_for": [], "alternatives": {}}'),
('Anti-nausea Tablets', 10.50, '{"method": "oral", "methodLabel": "Oral (Take by mouth)", "dosage": "1 tablet", "frequency": "Every 4-6 hours as needed", "maxDosage": "4 tablets per day", "instructions": "Take 30 minutes before meals or as soon as nausea starts. Let dissolve in mouth.", "duration": "As needed", "icon": "💊"}', '{"restricted_for": [], "alternatives": {}}'),
('Anti-diarrheal', 12.00, '{"method": "oral", "methodLabel": "Oral (Take by mouth)", "dosage": "1-2 tablets or capsules", "frequency": "After each loose bowel movement", "maxDosage": "8 tablets per day", "instructions": "Take with water. Drink plenty of fluids to prevent dehydration.", "duration": "Until diarrhea stops (max 2 days)", "icon": "💊"}', '{"restricted_for": [], "alternatives": {}}'),
('Laxative Pills', 15.00, '{"method": "oral", "methodLabel": "Oral (Take by mouth)", "dosage": "1-2 tablets", "frequency": "Once daily, preferably at bedtime", "maxDosage": "2 tablets per day", "instructions": "Take with plenty of water. Expect results in 6-12 hours. Do not use for more than 1 week.", "duration": "Until constipation resolves (max 1 week)", "icon": "💊"}', '{"restricted_for": ["child"], "alternatives": {"Laxative Pills": "Child-friendly Laxative"}}'),
('Vitamin B Complex', 25.00, '{"method": "oral", "methodLabel": "Oral (Take by mouth)", "dosage": "1 tablet", "frequency": "Once daily", "maxDosage": "1 tablet per day", "instructions": "Take with food. Best taken in the morning with breakfast.", "duration": "As dietary supplement", "icon": "💊"}', '{"restricted_for": [], "alternatives": {}}'),
('Joint Pain Patch', 16.50, '{"method": "patch", "methodLabel": "Topical Patch", "dosage": "1 patch", "frequency": "Apply once, replace every 12 hours", "maxDosage": "2 patches per day", "instructions": "Apply to clean, dry skin over painful joint. Remove after 12 hours. Can be used for chronic pain.", "duration": "As needed for pain management", "icon": "🩹"}', '{"restricted_for": [], "alternatives": {}}'),
('Sleep Aid', 20.00, '{"method": "oral", "methodLabel": "Oral (Take by mouth)", "dosage": "1 tablet", "frequency": "Once before bedtime", "maxDosage": "1 tablet per day", "instructions": "Take 30 minutes before sleep. Do not drive or operate machinery. Not for long-term use.", "duration": "Short-term use only (max 2 weeks)", "icon": "💊"}', '{"restricted_for": ["child"], "alternatives": {"Sleep Aid": "Natural Sleep Remedies"}}'),
('Moisturizing Cream', 12.90, '{"method": "topical", "methodLabel": "Topical (Apply to skin)", "dosage": "Generous amount", "frequency": "2-3 times daily or as needed", "maxDosage": "As needed", "instructions": "Apply to clean, dry skin. Massage gently until absorbed. Best applied after bathing.", "duration": "As needed for dry skin", "icon": "🧴"}', '{"restricted_for": [], "alternatives": {}}'),
('Anti-inflammatory Cream', 14.80, '{"method": "topical", "methodLabel": "Topical (Apply to skin)", "dosage": "Thin layer", "frequency": "3-4 times daily", "maxDosage": "4 times per day", "instructions": "Apply to reddened/inflamed area. Gently massage in. Avoid contact with eyes.", "duration": "Until redness reduces", "icon": "🧴"}', '{"restricted_for": [], "alternatives": {}}'),
('General Relief Medicine', 15.00, '{"method": "oral", "methodLabel": "Oral (Take by mouth)", "dosage": "As directed", "frequency": "As directed", "maxDosage": "As directed", "instructions": "Follow package instructions or consult healthcare provider.", "duration": "As directed", "icon": "💊"}', '{"restricted_for": [], "alternatives": {}}'),
('Natural Sleep Remedies', 20.00, '{"method": "oral", "methodLabel": "Oral (Take by mouth)", "dosage": "As directed on package", "frequency": "Once before bedtime", "maxDosage": "As directed", "instructions": "Natural herbal remedy. Take 30 minutes before sleep. Safe for children.", "duration": "As needed", "icon": "🌿"}', '{"restricted_for": [], "alternatives": {}}'),
('Child-friendly Laxative', 15.00, '{"method": "oral", "methodLabel": "Oral (Take by mouth)", "dosage": "As per age/weight (consult package)", "frequency": "Once daily", "maxDosage": "As directed", "instructions": "Child-safe formulation. Consult package for age-appropriate dosage. Ensure adequate fluid intake.", "duration": "Until constipation resolves", "icon": "💊"}', '{"restricted_for": [], "alternatives": {}}')
ON CONFLICT (name) DO NOTHING;

-- Insert symptom-medication mappings
-- Note: This uses subqueries to get medication IDs by name
INSERT INTO public.symptom_medication_mapping (symptom, medication_id, priority) VALUES
('Dizziness', (SELECT id FROM public.medications WHERE name = 'Dimenhydrinate Tablets'), 1),
('Fever', (SELECT id FROM public.medications WHERE name = 'Ibuprofen Tablets'), 1),
('Fever', (SELECT id FROM public.medications WHERE name = 'Paracetamol Tablets'), 2),
('Cough', (SELECT id FROM public.medications WHERE name = 'Cough Syrup'), 1),
('Cough', (SELECT id FROM public.medications WHERE name = 'Loquat Syrup'), 2),
('Headache', (SELECT id FROM public.medications WHERE name = 'Headache Relief'), 1),
('Headache', (SELECT id FROM public.medications WHERE name = 'Ibuprofen Tablets'), 2),
('Nasal Congestion', (SELECT id FROM public.medications WHERE name = 'Nasal Decongestant'), 1),
('Runny Nose', (SELECT id FROM public.medications WHERE name = 'Nasal Decongestant'), 1),
('Runny Nose', (SELECT id FROM public.medications WHERE name = 'Antihistamine'), 2),
('Itching', (SELECT id FROM public.medications WHERE name = 'Antihistamine Cream'), 1),
('Rash', (SELECT id FROM public.medications WHERE name = 'Antifungal Cream'), 1),
('Pain', (SELECT id FROM public.medications WHERE name = 'Pain Relief Patch'), 1),
('Pain', (SELECT id FROM public.medications WHERE name = 'Ibuprofen Tablets'), 2),
('Swelling', (SELECT id FROM public.medications WHERE name = 'Anti-inflammatory Gel'), 1),
('Numbness', (SELECT id FROM public.medications WHERE name = 'Liniment Oil'), 1),
('Blisters', (SELECT id FROM public.medications WHERE name = 'Antiseptic Ointment'), 1),
('Chest Tightness', (SELECT id FROM public.medications WHERE name = 'Chest Relief Tablets'), 1),
('Difficulty Breathing', (SELECT id FROM public.medications WHERE name = 'Chest Relief Tablets'), 1),
('Chest Pain', (SELECT id FROM public.medications WHERE name = 'Pain Relief Patch'), 1),
('Abdominal Pain', (SELECT id FROM public.medications WHERE name = 'Stomach Relief'), 1),
('Stomach Pain', (SELECT id FROM public.medications WHERE name = 'Stomach Relief'), 1),
('Nausea', (SELECT id FROM public.medications WHERE name = 'Anti-nausea Tablets'), 1),
('Diarrhea', (SELECT id FROM public.medications WHERE name = 'Anti-diarrheal'), 1),
('Constipation', (SELECT id FROM public.medications WHERE name = 'Laxative Pills'), 1),
('Fatigue', (SELECT id FROM public.medications WHERE name = 'Vitamin B Complex'), 1),
('Muscle Ache', (SELECT id FROM public.medications WHERE name = 'Liniment Oil'), 1),
('Muscle Ache', (SELECT id FROM public.medications WHERE name = 'Pain Relief Patch'), 2),
('Joint Pain', (SELECT id FROM public.medications WHERE name = 'Joint Pain Patch'), 1),
('Insomnia', (SELECT id FROM public.medications WHERE name = 'Sleep Aid'), 1),
('Dryness', (SELECT id FROM public.medications WHERE name = 'Moisturizing Cream'), 1),
('Redness', (SELECT id FROM public.medications WHERE name = 'Anti-inflammatory Cream'), 1)
ON CONFLICT (symptom, medication_id) DO NOTHING;

