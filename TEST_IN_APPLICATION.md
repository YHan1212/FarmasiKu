# 在应用中测试 Admin 功能

由于 Supabase SQL Editor 中的 `auth.uid()` 可能不是你期望的用户，**最佳测试方法是在应用中测试**。

## 📋 测试步骤

### 步骤 1: 以 Admin 用户登录应用

1. 打开应用
2. 使用 Admin 用户的邮箱登录（用户 ID: `56e324aa-e1dd-40a8-9e96-2473cfcba661`）
3. 确认进入 Admin Dashboard

### 步骤 2: 打开浏览器开发者工具

1. 按 `F12` 打开开发者工具
2. 切换到 **Console** 标签
3. 切换到 **Network** 标签（用于查看 API 请求）

### 步骤 3: 进入 Pharmacist Dashboard

1. 在 Admin Dashboard 中，点击 **Pharmacist** 标签
2. 观察控制台日志

### 步骤 4: 查看日志

在 Console 中，你应该看到：

```
[PharmacistDashboard] User profile: { userId: '56e324aa-e1dd-40a8-9e96-2473cfcba661', role: 'admin' }
[PharmacistDashboard] Loading waiting queues...
[PharmacistDashboard] Waiting queues result: { queues: [...], queueError: null, count: X }
```

**关键信息**：
- `userId`: 应该是 `56e324aa-e1dd-40a8-9e96-2473cfcba661`（Admin 用户）
- `role`: 应该是 `'admin'`
- `queueError`: 应该是 `null`（没有错误）
- `count`: 应该 > 0（如果有 waiting 队列）

### 步骤 5: 查看 Network 请求

在 Network 标签中：

1. 查找对 `consultation_queue` 的请求
2. 查看请求的：
   - **URL**: 应该包含 `status=eq.waiting`
   - **Response**: 查看返回的数据
   - **Status Code**: 应该是 `200`

**如果 Status Code 是 200 但 Response 是空数组 `[]`**：
- 说明 RLS 策略阻止了查询
- 运行 `database/fix_rls_complete.sql`

**如果 Status Code 是 403**：
- 说明权限被拒绝
- 检查 RLS 策略

**如果 Status Code 是 200 且 Response 有数据**：
- ✅ 说明一切正常！
- 刷新页面应该能看到队列

## 🔍 诊断信息

如果看不到队列，提供以下信息：

1. **Console 日志**：
   - `[PharmacistDashboard] User profile` 的输出
   - `[PharmacistDashboard] Waiting queues result` 的输出

2. **Network 请求**：
   - 请求 URL
   - Response 内容
   - Status Code

3. **是否有 waiting 队列**：
   - 用普通用户创建一个咨询请求
   - 确保进入 waiting 状态

## ✅ 验证清单

- [ ] 以 Admin 用户登录应用
- [ ] 打开浏览器控制台
- [ ] 进入 Pharmacist Dashboard
- [ ] 查看 Console 日志
- [ ] 查看 Network 请求
- [ ] 确认 `role: 'admin'`
- [ ] 确认 `queueError: null`
- [ ] 确认 `count > 0` 或检查 Response 数据

## 🎯 为什么在应用中测试更好？

1. **明确的用户上下文**：应用中的 `auth.uid()` 就是你登录的用户
2. **真实的 RLS 行为**：RLS 策略会按实际用户应用
3. **完整的请求流程**：可以看到完整的 API 请求和响应
4. **实际用户体验**：测试的是用户实际看到的内容

