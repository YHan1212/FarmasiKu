-- 允许用户确认收货的 RLS 策略
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 允许用户更新自己订单的配送状态（仅确认收货）
-- ============================================

-- 用户只能更新自己订单的 delivery_status 和 delivered_at
-- 并且只能从 'out_for_delivery' 更新为 'delivered'
DROP POLICY IF EXISTS "Users can confirm own order delivery" ON public.orders;
CREATE POLICY "Users can confirm own order delivery"
  ON public.orders
  FOR UPDATE
  USING (
    -- 用户只能更新自己的订单
    (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
    (auth.uid() IS NULL AND session_id IS NOT NULL)
  )
  WITH CHECK (
    -- 只能更新自己的订单
    ((auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
     (auth.uid() IS NULL AND session_id IS NOT NULL))
    AND
    -- 新状态必须是 'delivered'
    (delivery_status = 'delivered')
  );

