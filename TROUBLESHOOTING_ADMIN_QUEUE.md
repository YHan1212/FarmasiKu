# Admin 无法查看 Waiting 队列 - 排查指南

## 🔍 问题描述

用户进入 waiting 状态后，Admin 在 Pharmacist Dashboard 中看不到等待的队列。

## 📌 重要说明

- **只有 Admin 账号可以 link pharmacist account**
- **Admin 账号（无论是否 link pharmacist）都应该能看到所有 waiting 队列**
- **只有 link 了 pharmacist account 的 Admin 才能接受队列**

---

## 📋 排查步骤（按顺序执行）

### 步骤 1: 运行诊断脚本

在 Supabase SQL Editor 中运行：

```sql
-- 运行 database/diagnose_admin_queue_issue_v2.sql
-- （更新版，适用于只有 Admin 可以 link pharmacist 的情况）
```

这个脚本会检查：
- ✅ 当前用户是否为 Admin
- ✅ 是否有 waiting 状态的队列
- ✅ `is_current_user_admin()` 函数是否正常工作
- ✅ RLS 策略是否正确设置
- ✅ 策略条件是否满足

**查看结果**：
- 如果 `Step 1` 显示 `❌ User is NOT Admin`，需要设置用户为 admin
- 如果 `Step 2` 显示 `total_waiting_queues = 0`，说明没有 waiting 队列
- 如果 `Step 6` 返回空，说明 RLS 策略有问题

---

### 步骤 2: 检查用户角色

在 Supabase SQL Editor 中运行：

```sql
-- 检查当前用户的角色
SELECT 
  id,
  role,
  public.is_current_user_admin() AS is_admin
FROM public.user_profiles
WHERE id = auth.uid();
```

**如果 `role` 不是 `'admin'`**：

```sql
-- 设置为 admin（替换 YOUR_USER_ID 为实际用户 ID）
UPDATE public.user_profiles
SET role = 'admin'
WHERE id = 'YOUR_USER_ID';

-- 或者使用当前用户
UPDATE public.user_profiles
SET role = 'admin'
WHERE id = auth.uid();
```

---

### 步骤 3: 检查是否有 Waiting 队列

```sql
-- 查看所有 waiting 队列
SELECT 
  id,
  patient_id,
  status,
  created_at
FROM public.consultation_queue
WHERE status = 'waiting'
ORDER BY created_at DESC;
```

**如果没有 waiting 队列**：
- 用普通用户账号创建一个新的咨询请求
- 确保队列状态是 `'waiting'`，不是 `'matched'` 或 `'in_consultation'`

---

### 步骤 4: 测试 RLS 策略

```sql
-- 测试 Admin 是否能查询到 waiting 队列
SELECT 
  id,
  patient_id,
  status,
  created_at,
  public.is_current_user_admin() AS is_admin
FROM public.consultation_queue
WHERE status = 'waiting';
```

**如果返回空**：
- 说明 RLS 策略有问题
- 继续执行步骤 5

**如果返回数据**：
- 说明数据库层面没问题
- 问题可能在代码逻辑，继续执行步骤 6

---

### 步骤 5: 修复 RLS 策略

在 Supabase SQL Editor 中运行：

```sql
-- 运行 database/fix_admin_view_queues_final.sql
-- （最终版，确保 Admin 无论是否 link pharmacist 都能看到 waiting 队列）
```

这个脚本会：
- ✅ 重新创建 `is_current_user_admin()` 函数
- ✅ 删除所有旧的 RLS 策略
- ✅ 按正确顺序重新创建所有策略
- ✅ 验证设置

**运行后**：
- 再次运行步骤 4 的测试查询
- 应该能看到 waiting 队列了

---

### 步骤 6: 检查代码逻辑

如果数据库层面没问题，检查前端代码：

1. **打开浏览器控制台**（F12）
2. **刷新 Admin 页面**
3. **查看控制台日志**：

应该看到：
```
[PharmacistDashboard] Loading waiting queues...
[PharmacistDashboard] Waiting queues result: { queues: [...], queueError: null, count: X }
```

**如果看到错误**：
- `queueError` 不为 `null`：说明 RLS 策略或查询有问题
- `queues` 为空数组：说明 RLS 策略阻止了查询

**如果没有日志**：
- 检查 `PharmacistDashboard.jsx` 是否正确加载
- 检查 `loadData` 函数是否被调用

---

### 步骤 7: 检查网络请求

在浏览器控制台的 **Network** 标签中：

1. 刷新页面
2. 查找对 `consultation_queue` 的请求
3. 查看请求的：
   - **URL**: 应该包含 `status=eq.waiting`
   - **Response**: 查看返回的数据
   - **Status Code**: 应该是 200

**如果 Status Code 是 403**：
- 说明 RLS 策略阻止了访问
- 需要修复 RLS 策略（步骤 5）

**如果 Status Code 是 200 但数据为空**：
- 检查 RLS 策略的条件
- 运行诊断脚本（步骤 1）

---

## 🛠️ 常见问题和解决方案

### 问题 1: 用户不是 Admin

**症状**：
- `Step 1` 显示 `❌ User is NOT Admin`
- `is_current_user_admin()` 返回 `false`

**解决**：
```sql
UPDATE public.user_profiles
SET role = 'admin'
WHERE id = auth.uid();
```

---

### 问题 2: RLS 策略冲突

**症状**：
- 有多个策略，但都不满足条件
- `Step 4` 显示策略存在但查询返回空

**解决**：
- 运行 `database/fix_admin_view_waiting_queues_v2.sql`
- 这会删除所有旧策略并重新创建

---

### 问题 3: is_current_user_admin() 函数不存在

**症状**：
- `Step 3` 显示函数不存在
- 查询时出现 "function does not exist" 错误

**解决**：
```sql
-- 运行 database/fix_rls_recursion.sql
-- 或 database/fix_admin_view_waiting_queues_v2.sql
```

---

### 问题 4: 队列状态不是 'waiting'

**症状**：
- `Step 2` 显示 `waiting_count = 0`
- 但用户确实进入了 waiting 页面

**解决**：
```sql
-- 检查队列的实际状态
SELECT id, status, created_at
FROM public.consultation_queue
ORDER BY created_at DESC
LIMIT 5;

-- 如果状态不对，手动修改（仅用于测试）
UPDATE public.consultation_queue
SET status = 'waiting'
WHERE id = 'QUEUE_ID';
```

---

### 问题 5: 代码没有调用 loadData

**症状**：
- 控制台没有日志
- Network 标签没有请求

**解决**：
- 检查 `PharmacistDashboard.jsx` 的 `useEffect`
- 确保 `loadData()` 被调用
- 检查是否有 JavaScript 错误

---

## 📝 完整修复流程

如果以上步骤都无法解决问题，按以下顺序执行：

1. **运行诊断脚本**：
   ```sql
   -- database/diagnose_admin_queue_issue.sql
   ```

2. **检查并修复用户角色**：
   ```sql
   UPDATE public.user_profiles SET role = 'admin' WHERE id = auth.uid();
   ```

3. **完全重置 RLS 策略**：
   ```sql
   -- database/fix_admin_view_waiting_queues_v2.sql
   ```

4. **验证修复**：
   ```sql
   SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting';
   SELECT public.is_current_user_admin();
   ```

5. **测试前端**：
   - 刷新 Admin 页面
   - 查看控制台日志
   - 检查 Network 请求

---

## 🔍 调试技巧

### 在 Supabase Dashboard 中测试

1. 打开 **Table Editor** → `consultation_queue`
2. 查看是否有 `status = 'waiting'` 的行
3. 如果有，说明数据存在
4. 打开 **SQL Editor**，运行测试查询

### 在前端代码中添加更多日志

在 `PharmacistDashboard.jsx` 的 `loadData` 函数中添加：

```javascript
console.log('[PharmacistDashboard] User:', user?.id)
console.log('[PharmacistDashboard] User role:', user?.role) // 如果可用
console.log('[PharmacistDashboard] Query result:', { queues, queueError })
```

---

## ✅ 验证清单

修复后，确认以下所有项：

- [ ] 用户角色是 `'admin'`
- [ ] `is_current_user_admin()` 返回 `true`
- [ ] 存在 `status = 'waiting'` 的队列
- [ ] RLS 策略正确设置（Admin 可以查看 waiting 队列）
- [ ] 前端代码正确调用 `loadData()`
- [ ] 浏览器控制台没有错误
- [ ] Network 请求返回 200 状态码
- [ ] Admin 页面显示 "Waiting Consultations" 列表

---

## 📞 如果仍然无法解决

提供以下信息以便进一步诊断：

1. **诊断脚本的完整输出**
2. **浏览器控制台的错误信息**
3. **Network 请求的详细信息**（URL、Response、Status Code）
4. **当前用户的 ID 和角色**
5. **是否有 waiting 队列存在**

