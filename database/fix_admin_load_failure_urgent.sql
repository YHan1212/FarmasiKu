-- 紧急修复：Admin 无法加载 waiting 队列
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 检查当前状态
-- ============================================
SELECT 
  '=== 当前状态检查 ===' as step,
  COUNT(*) FILTER (WHERE status = 'waiting') as waiting_queues,
  COUNT(*) FILTER (WHERE status = 'accepted') as accepted_queues,
  COUNT(*) FILTER (WHERE status = 'in_chat') as in_chat_queues
FROM consultation_queue;

-- ============================================
-- 步骤 2: 删除并重新创建 Admin 查看策略
-- ============================================

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Admins can view all waiting queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Admins can view matched queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "Admin can see waiting queues" ON public.consultation_queue;
DROP POLICY IF EXISTS "admin_view_waiting_queues" ON public.consultation_queue;

-- 确保 RLS 已启用
ALTER TABLE public.consultation_queue ENABLE ROW LEVEL SECURITY;

-- 重新创建策略 1: Admin 可以查看所有 waiting 队列
CREATE POLICY "Admins can view all waiting queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    status = 'waiting' AND 
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- 重新创建策略 2: Admin 可以查看所有 accepted/in_chat 队列
CREATE POLICY "Admins can view matched queues"
  ON public.consultation_queue
  FOR SELECT
  USING (
    status IN ('accepted', 'in_chat') AND 
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- ============================================
-- 步骤 3: 验证策略已创建
-- ============================================
SELECT 
  '✅ 验证策略' as step,
  policyname,
  cmd,
  qual::text as condition
FROM pg_policies
WHERE tablename = 'consultation_queue'
  AND (policyname LIKE '%Admin%' OR policyname LIKE '%admin%')
ORDER BY policyname;

-- ============================================
-- 步骤 4: 测试查询（需要替换为实际的 admin user_id）
-- ============================================
-- 获取 admin 用户 ID
SELECT 
  '=== Admin 用户信息 ===' as step,
  id as admin_user_id,
  role,
  created_at
FROM user_profiles
WHERE role = 'admin'
LIMIT 1;

-- ============================================
-- 完成！
-- ============================================
SELECT '✅ 修复完成！请刷新 Admin Dashboard 页面' as status;

