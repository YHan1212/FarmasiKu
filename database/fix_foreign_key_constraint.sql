-- 修复外键约束，允许删除 doctors 时级联删除相关会话
-- 在 Supabase SQL Editor 中运行此脚本

-- 1. 删除现有的外键约束
ALTER TABLE public.consultation_sessions
DROP CONSTRAINT IF EXISTS consultation_sessions_doctor_id_fkey;

-- 2. 重新创建外键约束，使用 ON DELETE CASCADE
ALTER TABLE public.consultation_sessions
ADD CONSTRAINT consultation_sessions_doctor_id_fkey
FOREIGN KEY (doctor_id)
REFERENCES public.doctors(id)
ON DELETE CASCADE;

-- 3. 同样修复其他相关的外键约束
-- consultation_queue 的 matched_pharmacist_id
ALTER TABLE public.consultation_queue
DROP CONSTRAINT IF EXISTS consultation_queue_matched_pharmacist_id_fkey;

ALTER TABLE public.consultation_queue
ADD CONSTRAINT consultation_queue_matched_pharmacist_id_fkey
FOREIGN KEY (matched_pharmacist_id)
REFERENCES public.doctors(id)
ON DELETE SET NULL;

-- pharmacist_availability 的 pharmacist_id
ALTER TABLE public.pharmacist_availability
DROP CONSTRAINT IF EXISTS pharmacist_availability_pharmacist_id_fkey;

ALTER TABLE public.pharmacist_availability
ADD CONSTRAINT pharmacist_availability_pharmacist_id_fkey
FOREIGN KEY (pharmacist_id)
REFERENCES public.doctors(id)
ON DELETE CASCADE;
