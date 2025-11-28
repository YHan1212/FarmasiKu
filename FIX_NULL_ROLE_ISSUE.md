# 修复 user_role 为 null 的问题

## 问题
运行 SQL 脚本后显示：
- `user_role: null`
- `total_waiting: 1`
- `admin_can_see: 0`

这说明当前用户的 `role` 是 `null`，所以 RLS 策略无法匹配。

## 原因
1. `user_profiles` 表中没有该用户的记录
2. 或者记录存在但 `role` 字段是 `null`
3. 或者 `auth.uid()` 在 SQL Editor 中返回 `null`（用户没有登录）

## 解决方案

### 方法 1: 使用修复脚本（推荐）

在 **Supabase SQL Editor** 中运行：

```sql
-- 运行 database/fix_user_role_null.sql
```

这个脚本会：
1. 检查当前用户和 profile
2. 如果 profile 不存在，创建它
3. 确保 role 是 'admin'
4. 验证修复

### 方法 2: 直接修复特定用户（如果方法 1 不工作）

如果 `auth.uid()` 返回 `null`，直接使用你的 Admin 用户 ID：

```sql
-- 运行 database/fix_specific_user_role.sql
-- 或直接运行下面的 SQL：

-- 确保 profile 存在并设置 role 为 admin
INSERT INTO public.user_profiles (id, role, created_at, updated_at)
VALUES (
  '56e324aa-e1dd-40a8-9e96-2473cfcba661'::uuid,  -- 你的 Admin 用户 ID
  'admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) 
DO UPDATE SET 
  role = 'admin',
  updated_at = NOW();

-- 验证
SELECT id, role FROM public.user_profiles 
WHERE id = '56e324aa-e1dd-40a8-9e96-2473cfcba661'::uuid;
```

### 方法 3: 检查并修复所有用户

如果想检查所有用户的 role：

```sql
-- 查看所有用户的 role
SELECT 
  id,
  (SELECT email FROM auth.users WHERE id = user_profiles.id) AS email,
  role,
  CASE 
    WHEN role IS NULL THEN '❌ NULL'
    WHEN role = 'admin' THEN '✅ Admin'
    ELSE '⚠️ ' || role
  END AS status
FROM public.user_profiles
ORDER BY created_at DESC;

-- 修复所有 role 为 null 的用户（设置为 'user'）
UPDATE public.user_profiles
SET role = 'user'
WHERE role IS NULL;

-- 然后单独设置 Admin 用户
UPDATE public.user_profiles
SET role = 'admin'
WHERE id = '56e324aa-e1dd-40a8-9e96-2473cfcba661'::uuid;
```

## 步骤

### 1. 运行修复脚本

在 Supabase SQL Editor 中：

1. 点击 "New query"
2. 复制 `database/fix_specific_user_role.sql` 的内容
3. 粘贴并运行

### 2. 验证结果

脚本会显示：
- ✅ `Role is admin` - 修复成功
- ❌ `Role is still NULL` - 需要检查 profile 是否存在

### 3. 重新测试 Admin 查询

运行验证查询：

```sql
SELECT 
  (SELECT role FROM public.user_profiles WHERE id = '56e324aa-e1dd-40a8-9e96-2473cfcba661'::uuid) AS user_role,
  (SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting') AS total_waiting,
  (SELECT COUNT(*) FROM public.consultation_queue 
   WHERE status = 'waiting' 
   AND EXISTS (
     SELECT 1 FROM public.user_profiles
     WHERE user_profiles.id = '56e324aa-e1dd-40a8-9e96-2473cfcba661'::uuid
     AND user_profiles.role = 'admin'
   )) AS admin_can_see;
```

应该显示：
- `user_role: admin`
- `total_waiting: 1`
- `admin_can_see: 1` ✅

### 4. 刷新应用

- 硬刷新浏览器：`Ctrl+Shift+R`
- 重新登录（如果需要）
- 进入 Admin Dashboard → Pharmacist Dashboard
- 应该能看到 waiting queues 了

## 如果还是不行

检查：
1. **用户 ID 是否正确**：
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'your-admin-email@example.com';
   ```

2. **Profile 是否存在**：
   ```sql
   SELECT * FROM public.user_profiles WHERE id = '56e324aa-e1dd-40a8-9e96-2473cfcba661'::uuid;
   ```

3. **RLS 策略是否正确**：
   ```sql
   SELECT policyname, cmd, qual 
   FROM pg_policies 
   WHERE tablename = 'consultation_queue' 
   AND policyname LIKE '%Admin%';
   ```

