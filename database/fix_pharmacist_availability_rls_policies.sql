-- 修复 pharmacist_availability 表的 RLS 策略
-- 允许药剂师查看和更新自己的在线状态

-- 删除现有的策略（如果存在）
DROP POLICY IF EXISTS "Pharmacists can view their own availability" ON public.pharmacist_availability;
DROP POLICY IF EXISTS "Pharmacists can update their own availability" ON public.pharmacist_availability;
DROP POLICY IF EXISTS "Pharmacists can insert their own availability" ON public.pharmacist_availability;
DROP POLICY IF EXISTS "Anyone can view online pharmacists" ON public.pharmacist_availability;

-- 策略 1: 药剂师可以查看自己的可用性状态
CREATE POLICY "Pharmacists can view their own availability"
  ON public.pharmacist_availability
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.id = pharmacist_availability.pharmacist_id
      AND doctors.user_id = auth.uid()
    )
  );

-- 策略 2: 药剂师可以更新自己的可用性状态
CREATE POLICY "Pharmacists can update their own availability"
  ON public.pharmacist_availability
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.id = pharmacist_availability.pharmacist_id
      AND doctors.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.id = pharmacist_availability.pharmacist_id
      AND doctors.user_id = auth.uid()
    )
  );

-- 策略 3: 药剂师可以插入自己的可用性状态
CREATE POLICY "Pharmacists can insert their own availability"
  ON public.pharmacist_availability
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctors
      WHERE doctors.id = pharmacist_availability.pharmacist_id
      AND doctors.user_id = auth.uid()
    )
  );

-- 策略 4: 所有人可以查看在线且不忙碌的药剂师（用于用户端匹配）
CREATE POLICY "Anyone can view online pharmacists"
  ON public.pharmacist_availability
  FOR SELECT
  USING (
    is_online = true AND is_busy = false
  );

-- 策略 5: 管理员可以查看所有药剂师状态
CREATE POLICY "Admins can view all pharmacist availability"
  ON public.pharmacist_availability
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

