-- Consultation System Schema
-- Run this in Supabase SQL Editor

-- Doctors table
CREATE TABLE IF NOT EXISTS public.doctors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  name TEXT NOT NULL,
  specialization TEXT,
  bio TEXT,
  available_hours JSONB DEFAULT '{}'::jsonb, -- { "monday": ["09:00-17:00"], ... }
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Consultation sessions table
CREATE TABLE IF NOT EXISTS public.consultation_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id),
  doctor_id UUID REFERENCES public.doctors(id),
  status TEXT DEFAULT 'pending', -- pending, accepted, active, completed, cancelled
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  symptoms TEXT[], -- Array of symptoms
  notes TEXT, -- Doctor's notes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Consultation messages table
CREATE TABLE IF NOT EXISTS public.consultation_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.consultation_sessions(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  sender_type TEXT NOT NULL, -- 'patient' or 'doctor'
  message_type TEXT DEFAULT 'text', -- text, image, file
  content TEXT NOT NULL,
  file_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_messages ENABLE ROW LEVEL SECURITY;

-- Doctors policies
DROP POLICY IF EXISTS "Anyone can view doctors" ON public.doctors;
CREATE POLICY "Anyone can view doctors"
  ON public.doctors
  FOR SELECT
  USING (is_available = true);

DROP POLICY IF EXISTS "Authenticated users can insert doctors" ON public.doctors;
CREATE POLICY "Authenticated users can insert doctors"
  ON public.doctors
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own doctor profile" ON public.doctors;
CREATE POLICY "Users can update own doctor profile"
  ON public.doctors
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update any doctor (for admin)
DROP POLICY IF EXISTS "Authenticated users can update doctors" ON public.doctors;
CREATE POLICY "Authenticated users can update doctors"
  ON public.doctors
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Consultation sessions policies
DROP POLICY IF EXISTS "Users can view own sessions" ON public.consultation_sessions;
CREATE POLICY "Users can view own sessions"
  ON public.consultation_sessions
  FOR SELECT
  USING (
    auth.uid() = patient_id OR 
    EXISTS (
      SELECT 1 FROM public.doctors 
      WHERE doctors.id = consultation_sessions.doctor_id 
      AND doctors.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create sessions" ON public.consultation_sessions;
CREATE POLICY "Users can create sessions"
  ON public.consultation_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

DROP POLICY IF EXISTS "Users can update own sessions" ON public.consultation_sessions;
CREATE POLICY "Users can update own sessions"
  ON public.consultation_sessions
  FOR UPDATE
  USING (
    auth.uid() = patient_id OR 
    EXISTS (
      SELECT 1 FROM public.doctors 
      WHERE doctors.id = consultation_sessions.doctor_id 
      AND doctors.user_id = auth.uid()
    )
  );

-- Consultation messages policies
DROP POLICY IF EXISTS "Users can view session messages" ON public.consultation_messages;
CREATE POLICY "Users can view session messages"
  ON public.consultation_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.consultation_sessions
      WHERE consultation_sessions.id = consultation_messages.session_id
      AND (
        consultation_sessions.patient_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.doctors 
          WHERE doctors.id = consultation_sessions.doctor_id 
          AND doctors.user_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can send messages" ON public.consultation_messages;
CREATE POLICY "Users can send messages"
  ON public.consultation_messages
  FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.consultation_sessions
      WHERE consultation_sessions.id = consultation_messages.session_id
      AND (
        consultation_sessions.patient_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.doctors 
          WHERE doctors.id = consultation_sessions.doctor_id 
          AND doctors.user_id = auth.uid()
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can update own messages" ON public.consultation_messages;
CREATE POLICY "Users can update own messages"
  ON public.consultation_messages
  FOR UPDATE
  USING (auth.uid() = sender_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_patient_id ON public.consultation_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_doctor_id ON public.consultation_sessions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultation_sessions_status ON public.consultation_sessions(status);
CREATE INDEX IF NOT EXISTS idx_consultation_messages_session_id ON public.consultation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_consultation_messages_created_at ON public.consultation_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_doctors_user_id ON public.doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_is_available ON public.doctors(is_available);

-- Enable Realtime for messages (for Supabase Realtime)
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_messages;

