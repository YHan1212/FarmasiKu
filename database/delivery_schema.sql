-- 配送系统数据库架构
-- 在 Supabase SQL Editor 中运行此脚本

-- ============================================
-- 步骤 1: 创建用户地址表
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL, -- 地址标签（家、公司、其他等）
  address_line1 TEXT NOT NULL, -- 详细地址
  address_line2 TEXT, -- 地址第二行（可选）
  postal_code TEXT, -- 邮政编码
  city TEXT, -- 城市
  state TEXT, -- 州/省
  country TEXT DEFAULT 'Malaysia', -- 国家
  phone_number TEXT NOT NULL, -- 电话号码（格式：01XXXXXXXX，8或9位数字）
  is_default BOOLEAN DEFAULT false, -- 是否默认地址
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_is_default ON public.user_addresses(is_default);

-- ============================================
-- 步骤 2: 扩展 orders 表添加配送字段
-- ============================================

-- 添加配送相关字段
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_address JSONB, -- 完整地址信息（JSON格式）
ADD COLUMN IF NOT EXISTS phone_number TEXT, -- 配送电话号码
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'accepted', 'preparing', 'out_for_delivery', 'delivered')),
ADD COLUMN IF NOT EXISTS estimated_delivery_time TIMESTAMP WITH TIME ZONE, -- 预计送达时间
ADD COLUMN IF NOT EXISTS actual_delivery_time TIMESTAMP WITH TIME ZONE, -- 实际送达时间
ADD COLUMN IF NOT EXISTS delivery_person TEXT, -- 配送员信息（可选）
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE, -- 接单时间
ADD COLUMN IF NOT EXISTS preparing_at TIMESTAMP WITH TIME ZONE, -- 出货时间
ADD COLUMN IF NOT EXISTS out_for_delivery_at TIMESTAMP WITH TIME ZONE, -- 开始配送时间
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE; -- 送达时间

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_orders_delivery_status ON public.orders(delivery_status);
CREATE INDEX IF NOT EXISTS idx_orders_estimated_delivery_time ON public.orders(estimated_delivery_time);

-- ============================================
-- 步骤 3: 启用 RLS
-- ============================================

ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 步骤 4: 创建 RLS 策略
-- ============================================

-- 用户地址策略：用户可以查看、插入、更新、删除自己的地址
DROP POLICY IF EXISTS "Users can view own addresses" ON public.user_addresses;
CREATE POLICY "Users can view own addresses"
  ON public.user_addresses
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own addresses" ON public.user_addresses;
CREATE POLICY "Users can insert own addresses"
  ON public.user_addresses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own addresses" ON public.user_addresses;
CREATE POLICY "Users can update own addresses"
  ON public.user_addresses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own addresses" ON public.user_addresses;
CREATE POLICY "Users can delete own addresses"
  ON public.user_addresses
  FOR DELETE
  USING (auth.uid() = user_id);

-- 管理员可以查看所有地址（用于订单管理）
DROP POLICY IF EXISTS "Admins can view all addresses" ON public.user_addresses;
CREATE POLICY "Admins can view all addresses"
  ON public.user_addresses
  FOR SELECT
  USING (public.is_current_user_admin());

-- 订单策略：管理员可以更新订单的配送状态
DROP POLICY IF EXISTS "Admins can update order delivery" ON public.orders;
CREATE POLICY "Admins can update order delivery"
  ON public.orders
  FOR UPDATE
  USING (public.is_current_user_admin())
  WITH CHECK (public.is_current_user_admin());

-- ============================================
-- 步骤 5: 创建触发器确保最多4个地址
-- ============================================

-- 创建函数检查地址数量
CREATE OR REPLACE FUNCTION public.check_max_addresses()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  address_count INTEGER;
BEGIN
  -- 如果是更新操作且 user_id 没有改变，不需要检查
  IF TG_OP = 'UPDATE' AND OLD.user_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- 计算当前用户的地址数量
  SELECT COUNT(*) INTO address_count
  FROM public.user_addresses
  WHERE user_id = NEW.user_id;

  -- 如果超过4个，抛出错误
  IF address_count >= 4 THEN
    RAISE EXCEPTION 'Maximum 4 addresses allowed per user';
  END IF;

  RETURN NEW;
END;
$$;

-- 创建触发器
DROP TRIGGER IF EXISTS check_max_addresses_trigger ON public.user_addresses;
CREATE TRIGGER check_max_addresses_trigger
  BEFORE INSERT ON public.user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.check_max_addresses();

-- ============================================
-- 步骤 6: 创建更新时间触发器
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$;

-- 为 user_addresses 表添加更新时间触发器
DROP TRIGGER IF EXISTS update_user_addresses_updated_at ON public.user_addresses;
CREATE TRIGGER update_user_addresses_updated_at
  BEFORE UPDATE ON public.user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 步骤 7: 启用 Realtime（如果需要）
-- ============================================

-- 注意：需要在 Supabase Dashboard → Database → Replication 中手动启用
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.user_addresses;

-- ============================================
-- 完成！
-- ============================================
-- 现在可以开始使用配送系统了

