# 快速修复：Admin 看不到 Waiting Queues

## 问题
Admin 用户在 Pharmacist Dashboard 中看不到 waiting queues，即使 SQL Editor 显示有 waiting 队列。

## 解决方案

### 方法 1: 运行快速修复脚本（推荐）

在 **Supabase SQL Editor** 中运行：

```sql
-- 运行 database/quick_fix_admin_see_queues.sql
```

这个脚本会：
1. ✅ 确保当前用户是 Admin
2. ✅ 删除所有旧的 RLS 策略
3. ✅ 创建新的 RLS 策略（允许 Admin 查看所有 waiting 队列）
4. ✅ 验证修复是否成功

### 方法 2: 诊断问题

如果想先诊断问题，运行：

```sql
-- 运行 database/diagnose_and_fix_queue_issue.sql
```

这个脚本会显示：
- 当前用户角色
- 队列状态统计
- RLS 策略列表
- 诊断结果

## 步骤

### 1. 打开 Supabase SQL Editor
- 登录 Supabase Dashboard
- 进入你的项目
- 点击左侧菜单的 "SQL Editor"

### 2. 运行修复脚本
- 点击 "New query"
- 复制 `database/quick_fix_admin_see_queues.sql` 的内容
- 粘贴到 SQL Editor
- 点击 "Run" 或按 `Ctrl+Enter`

### 3. 查看结果
脚本最后会显示验证结果：
- ✅ `SUCCESS! Admin can see all waiting queues` - 修复成功
- ⚠️ `No waiting queues exist` - 需要先创建一个 waiting 队列
- ❌ `Still has issues` - 需要进一步检查

### 4. 刷新应用
- 刷新浏览器页面（硬刷新：`Ctrl+Shift+R` 或 `Cmd+Shift+R`）
- 重新进入 Admin Dashboard → Pharmacist Dashboard
- 查看控制台日志

## 验证

修复后，在浏览器控制台应该看到：

```
[PharmacistDashboard] Waiting queues result: { 
  queues: [...], 
  count: 1,  // 应该 > 0
  queueError: null 
}
```

## 如果还是不行

1. **检查用户角色**：
   ```sql
   SELECT id, role FROM public.user_profiles WHERE id = auth.uid();
   ```
   应该显示 `role = 'admin'`

2. **检查队列是否存在**：
   ```sql
   SELECT COUNT(*) FROM public.consultation_queue WHERE status = 'waiting';
   ```
   应该 > 0

3. **检查 RLS 策略**：
   ```sql
   SELECT policyname, cmd FROM pg_policies WHERE tablename = 'consultation_queue';
   ```
   应该看到 "Admins can view all waiting queues" 策略

4. **清除浏览器缓存**：
   - 硬刷新：`Ctrl+Shift+R` (Windows) 或 `Cmd+Shift+R` (Mac)
   - 或清除缓存后重新登录

