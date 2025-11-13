# 清空所有用户数据指南

## ⚠️ 警告

这个操作会**永久删除**所有用户和测试数据，无法恢复！

## 📋 清空步骤

### 方法 1：使用 SQL 脚本（推荐）

#### 步骤 1：删除相关数据

在 Supabase SQL Editor 中运行 `database/clear_all_users.sql`：

```sql
-- 删除订单数据
DELETE FROM public.order_items;
DELETE FROM public.orders;

-- 删除咨询和评估数据
DELETE FROM public.consultations;
DELETE FROM public.symptom_assessments;

-- 删除用户 profiles
DELETE FROM public.user_profiles;
```

#### 步骤 2：删除认证用户

**在 Supabase Dashboard 中**：

1. 进入 **Authentication** → **Users**
2. 选择所有用户（或特定用户）
3. 点击 **"Delete"** 按钮
4. 确认删除

**或者使用 SQL**（如果允许）：

```sql
-- 查看所有用户
SELECT id, email, created_at FROM auth.users;

-- 删除所有用户（⚠️ 谨慎使用）
DELETE FROM auth.users;
```

### 方法 2：使用 Supabase Dashboard（更安全）

1. **删除订单数据**：
   - 进入 **Table Editor** → `order_items`
   - 选择所有行，删除
   - 进入 `orders` 表，删除所有行

2. **删除咨询数据**：
   - 进入 `consultations` 表，删除所有行
   - 进入 `symptom_assessments` 表，删除所有行

3. **删除用户 profiles**：
   - 进入 `user_profiles` 表，删除所有行

4. **删除认证用户**：
   - 进入 **Authentication** → **Users**
   - 选择所有用户，删除

---

## ✅ 验证清空结果

运行以下查询确认数据已清空：

```sql
-- 检查用户数量
SELECT COUNT(*) as user_count FROM auth.users;

-- 检查 profile 数量
SELECT COUNT(*) as profile_count FROM public.user_profiles;

-- 检查订单数量
SELECT COUNT(*) as order_count FROM public.orders;

-- 检查咨询数量
SELECT COUNT(*) as consultation_count FROM public.consultations;
```

所有计数应该返回 **0**。

---

## 🔄 重新测试

清空数据后：

1. **重新注册新用户**
2. **检查 profile 是否自动创建**：
   ```sql
   SELECT * FROM public.user_profiles;
   ```
3. **完成一次订单流程**
4. **检查数据是否正确保存**

---

## 💡 提示

- **保留药物数据**：清空脚本不会删除 `medications` 和 `symptom_medication_mapping` 表的数据
- **快速清空**：如果只是测试，可以只删除特定用户而不是所有用户
- **备份**：如果需要保留某些数据，可以先导出再删除

---

## 🎯 快速清空命令（一键执行）

如果你想一次性清空所有数据，运行：

```sql
-- 清空所有用户相关数据
TRUNCATE TABLE public.order_items CASCADE;
TRUNCATE TABLE public.orders CASCADE;
TRUNCATE TABLE public.consultations CASCADE;
TRUNCATE TABLE public.symptom_assessments CASCADE;
TRUNCATE TABLE public.user_profiles CASCADE;

-- 然后通过 Dashboard 删除 auth.users 中的用户
```

**注意**：`TRUNCATE` 比 `DELETE` 更快，但会重置自增 ID。

