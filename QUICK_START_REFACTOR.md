# 快速开始重构 - 3 步完成

## 🚀 执行步骤

### 步骤 1: 运行重建脚本（最重要！）

在 **Supabase SQL Editor** 中运行：

```sql
-- 复制并运行 database/rebuild_consultation_queue_rls.sql 的全部内容
```

**或者**直接打开文件 `database/rebuild_consultation_queue_rls.sql`，复制全部内容到 Supabase SQL Editor 运行。

**预期结果**：
- 应该看到 "Verification: All Policies" 显示 7 个策略
- 没有错误信息

---

### 步骤 2: 验证策略（可选但推荐）

在 **Supabase SQL Editor** 中运行：

```sql
-- 复制并运行 database/verify_new_rls.sql 的全部内容
```

**查看结果**：
- `Step 5`: 如果以 Admin 登录，应该显示 `✅ SUCCESS`
- `Step 7`: 测试 Admin 用户，应该显示 `✅ Admin user would see queues`

---

### 步骤 3: 在应用中测试

1. **以 Admin 用户登录应用**
   - 用户 ID: `56e324aa-e1dd-40a8-9e96-2473cfcba661`

2. **打开浏览器控制台**（按 F12）

3. **进入 Pharmacist Dashboard**
   - Admin Dashboard → Pharmacist 标签

4. **查看控制台**，应该看到：
   ```
   [PharmacistDashboard] User info: { userId: '56e324aa-...', role: 'admin', ... }
   [PharmacistDashboard] Loading waiting queues...
   [PharmacistDashboard] Waiting queues result: { queues: [...], queueError: null, count: X }
   ```

5. **检查结果**：
   - ✅ `role: 'admin'`
   - ✅ `queueError: null`
   - ✅ `count > 0`（如果有 waiting 队列）

---

## ✅ 完成！

如果看到队列列表，说明重构成功！

如果还有问题，查看浏览器控制台的错误信息。

