# 快速修复 Admin 无法查看 Waiting 队列

## 🎯 问题

Admin 账号在 Pharmacist Dashboard 中看不到 waiting 队列。

## ⚡ 快速修复（3 步）

### 步骤 1: 确认用户是 Admin

在 Supabase SQL Editor 中运行：

```sql
-- 检查当前用户角色
SELECT id, role, public.is_current_user_admin() AS is_admin
FROM public.user_profiles
WHERE id = auth.uid();

-- 如果不是 admin，设置为 admin：
UPDATE public.user_profiles
SET role = 'admin'
WHERE id = auth.uid();
```

### 步骤 2: 运行修复脚本

在 Supabase SQL Editor 中运行：

```sql
-- 运行 database/fix_admin_view_queues_final.sql
```

这个脚本会：
- ✅ 确保 `is_current_user_admin()` 函数存在
- ✅ 删除所有旧的 RLS 策略
- ✅ 重新创建策略，确保 **Admin 无论是否 link pharmacist 都能看到 waiting 队列**

### 步骤 3: 验证修复

在 Supabase SQL Editor 中运行：

```sql
-- 测试查询（应该能看到所有 waiting 队列）
SELECT 
  id,
  patient_id,
  status,
  created_at
FROM public.consultation_queue
WHERE status = 'waiting'
ORDER BY created_at DESC;
```

**如果返回数据**：✅ 修复成功！

**如果返回空**：
1. 检查是否有 waiting 队列：
   ```sql
   SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting';
   ```
2. 如果计数为 0，用普通用户创建一个新的咨询请求
3. 如果计数 > 0，运行诊断脚本：
   ```sql
   -- 运行 database/diagnose_admin_queue_issue_v2.sql
   ```

---

## 📋 完整排查流程

如果快速修复不成功，运行完整诊断：

```sql
-- 运行 database/diagnose_admin_queue_issue_v2.sql
```

查看 `Step 10: Diagnosis Summary` 的结果，根据提示操作。

---

## ✅ 验证清单

修复后，确认：

- [ ] 用户角色是 `'admin'`
- [ ] `is_current_user_admin()` 返回 `true`
- [ ] 存在 `status = 'waiting'` 的队列
- [ ] 测试查询返回数据（不是空）
- [ ] 浏览器控制台没有错误
- [ ] Admin 页面显示 "Waiting Consultations" 列表

---

## 🔍 常见问题

### Q: 我已经是 admin 了，为什么还是看不到？

A: 运行修复脚本 `fix_admin_view_queues_final.sql`，可能是 RLS 策略有问题。

### Q: 我 link 了 pharmacist account，但还是看不到？

A: Admin 账号（无论是否 link pharmacist）都应该能看到。如果看不到，运行修复脚本。

### Q: 我可以看到队列，但无法接受？

A: 只有 link 了 pharmacist account 的 Admin 才能接受队列。在 Admin 面板的 Pharmacist 标签中 link 一个 pharmacist account。

---

## 📞 仍然无法解决？

提供以下信息：

1. 诊断脚本的完整输出（`diagnose_admin_queue_issue_v2.sql`）
2. 浏览器控制台的错误信息
3. 当前用户的 ID 和角色

