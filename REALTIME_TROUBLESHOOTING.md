# 实时功能故障排除指南

## 🔍 问题：需要刷新才能看到对方的消息

### 已实施的解决方案

1. **轮询机制（后备方案）**
   - 每 2 秒自动检查新消息
   - 即使 Realtime 订阅失败，也能正常工作
   - 自动检测并添加新消息

2. **改进的 Realtime 订阅**
   - 添加了详细的订阅状态监控
   - 改进了错误处理
   - 优化了频道名称（避免冲突）

3. **Supabase 客户端配置**
   - 显式启用 Realtime 功能
   - 配置了 Realtime 参数

## 🧪 诊断步骤

### 步骤 1: 检查浏览器控制台

打开浏览器开发者工具（F12），查看 Console 标签页，应该看到：

```
[SimpleChat-Patient] Messages subscription status: SUBSCRIBED
[SimpleChat-Patient] ✅ Successfully subscribed to messages for session xxx
```

**如果看到错误**：
- `CHANNEL_ERROR`: Realtime 订阅失败，但轮询会继续工作
- `TIMED_OUT`: 订阅超时，轮询会继续工作
- `CLOSED`: 订阅已关闭，轮询会继续工作

### 步骤 2: 验证数据库 Realtime 设置

在 Supabase SQL Editor 中运行：

```sql
-- 检查表是否已添加到 Realtime 发布
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND schemaname = 'public'
AND tablename IN (
  'consultation_messages',
  'consultation_medications'
);
```

**应该看到**：
- `consultation_messages`
- `consultation_medications`

**如果没有看到**，运行：
```sql
-- 运行 database/enable_realtime_for_consultation.sql
```

### 步骤 3: 检查 Supabase Dashboard

1. 登录 Supabase Dashboard
2. 进入你的项目
3. 点击左侧菜单 **"Database"**
4. 点击 **"Replication"** 标签
5. 确认以下表已启用 Realtime：
   - ✅ `consultation_messages`
   - ✅ `consultation_medications`

**如果没有启用**：
- 点击每个表旁边的开关，启用 Realtime

### 步骤 4: 测试轮询功能

即使 Realtime 不工作，轮询机制应该每 2 秒检查一次新消息。

**验证方法**：
1. 在一个窗口发送消息
2. 在另一个窗口等待 2-3 秒
3. 消息应该自动出现（无需刷新）

**如果轮询也不工作**：
- 检查浏览器控制台是否有错误
- 检查网络连接
- 检查 Supabase 项目是否正常运行

## 🔧 常见问题

### Q1: 控制台显示 "SUBSCRIBED" 但消息仍不实时

**可能原因**：
- RLS 策略阻止了实时更新
- 网络问题导致 WebSocket 连接不稳定

**解决方法**：
- 轮询机制会自动处理这种情况
- 检查 RLS 策略是否正确配置

### Q2: 轮询工作但 Realtime 不工作

**可能原因**：
- Supabase Realtime 服务暂时不可用
- WebSocket 连接被防火墙阻止

**解决方法**：
- 轮询机制会继续工作，功能不受影响
- 检查网络设置和防火墙规则

### Q3: 两个窗口都看不到对方的消息

**可能原因**：
- 两个窗口使用了不同的 sessionId
- RLS 策略阻止了消息读取

**解决方法**：
1. 检查两个窗口的 sessionId 是否相同（查看控制台日志）
2. 运行 `database/fix_consultation_rls_for_testing.sql` 确保 RLS 策略正确

## 📊 性能说明

### 轮询频率
- **当前设置**：每 2 秒轮询一次
- **优点**：确保消息及时同步
- **缺点**：增加服务器负载（但影响很小）

### 优化建议
如果 Realtime 正常工作，轮询会继续运行但不会产生额外负载（因为只查询新消息）。

## 🚀 下一步

如果问题仍然存在：

1. **检查控制台日志**：查看是否有错误信息
2. **运行诊断脚本**：`database/verify_realtime_setup.sql`
3. **检查网络**：确保 WebSocket 连接正常
4. **联系支持**：提供控制台日志和错误信息

## ✅ 验证清单

- [ ] 浏览器控制台显示 "✅ Successfully subscribed"
- [ ] 数据库表已添加到 Realtime 发布
- [ ] Supabase Dashboard 中 Realtime 已启用
- [ ] 轮询机制正常工作（每 2 秒检查一次）
- [ ] 消息能在 2-3 秒内自动出现（无需刷新）

如果所有项目都已完成，实时功能应该正常工作！

