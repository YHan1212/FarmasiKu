# 新咨询系统测试指南

## 🧪 测试步骤

### 准备工作

1. **确保数据库脚本已运行**
   - ✅ 已运行 `database/new_consultation_system_schema.sql`
   - ✅ 状态迁移成功（`matched` → `accepted`, `in_consultation` → `in_chat`）

2. **准备两个账号**
   - 普通用户账号（用于测试排队）
   - Admin 账号（用于测试接受队列）

---

## 📋 测试流程

### 测试 1: 用户加入队列

**步骤**：
1. 以普通用户身份登录
2. 完成症状选择流程
3. 选择 "More severe" 或点击 "Consult Pharmacist Now"
4. 应该进入排队界面

**预期结果**：
- ✅ 显示 "⏳ 等待药剂师接听"
- ✅ 显示队列位置（如："您前面有 0 人"）
- ✅ 显示预计等待时间
- ✅ 显示在线药剂师数量
- ✅ 有 "取消排队" 按钮

**检查点**：
- 浏览器控制台应该看到：
  ```
  [ConsultationQueue] Queue created: <queue-id>
  [ConsultationQueue] Setting up subscriptions for queue: <queue-id>
  ```

---

### 测试 2: 管理员查看等待队列

**步骤**：
1. 以 Admin 身份登录
2. 进入 Admin Dashboard
3. 点击 "💬 Pharmacist Dashboard" 标签

**预期结果**：
- ✅ 看到 "⏳ Waiting Consultations (1)" 部分
- ✅ 显示等待中的队列卡片
- ✅ 显示患者信息、症状、年龄
- ✅ 有 "Accept & Start Chat" 按钮（如果 link 了 pharmacist account）

**检查点**：
- 浏览器控制台应该看到：
  ```
  [PharmacistDashboard] Waiting queues result: { queues: [...], count: 1 }
  ```

---

### 测试 3: 管理员接受队列

**步骤**：
1. 在 Pharmacist Dashboard 中
2. 点击等待队列的 "Accept & Start Chat" 按钮

**预期结果**：
- ✅ 队列状态从 `waiting` 变为 `accepted`，然后变为 `in_chat`
- ✅ 创建 `consultation_sessions` 记录
- ✅ 自动进入聊天界面

**检查点**：
- 浏览器控制台应该看到：
  ```
  [PharmacistDashboard] Accepting queue: <queue-id>
  [PharmacistDashboard] Session created: <session-id>
  ```

---

### 测试 4: 用户自动进入聊天

**步骤**：
1. 用户端应该自动从排队界面跳转到聊天界面

**预期结果**：
- ✅ 用户端自动检测到队列状态变化
- ✅ 自动进入聊天界面
- ✅ 可以看到药剂师发送的消息

**检查点**：
- 浏览器控制台应该看到：
  ```
  [ConsultationQueue] Queue updated: accepted
  [ConsultationQueue] Queue updated: in_chat
  [ConsultationQueue] Active session found, entering chat
  ```

---

### 测试 5: 聊天功能

**步骤**：
1. 管理员和用户都可以发送消息
2. 管理员可以推荐药物
3. 用户可以接受/拒绝药物

**预期结果**：
- ✅ 消息实时同步
- ✅ 药物推荐卡片显示正确
- ✅ 接受药物后可以继续到订单流程

---

## 🐛 常见问题排查

### 问题 1: 用户看不到排队界面

**检查**：
- 控制台是否有错误？
- `step` 是否正确设置为 `'consultation-waiting'`？
- `ConsultationQueue` 组件是否正确导入？

**解决**：
- 检查 `App.jsx` 中的导入和渲染逻辑

---

### 问题 2: 管理员看不到等待队列

**检查**：
- 用户是否成功创建了队列？
- 队列状态是否为 `'waiting'`？
- RLS 策略是否正确？

**解决**：
```sql
-- 检查队列是否存在
SELECT * FROM consultation_queue WHERE status = 'waiting';

-- 检查用户角色
SELECT id, role FROM user_profiles WHERE id = auth.uid();
```

---

### 问题 3: 接受队列后没有创建会话

**检查**：
- `pharmacistId` 是否正确？
- 是否有 RLS 错误？

**解决**：
- 检查浏览器控制台的错误信息
- 确保 pharmacist account 已 link

---

### 问题 4: 用户没有自动进入聊天

**检查**：
- Realtime 订阅是否正常工作？
- 会话是否成功创建？
- `onEnterChat` 回调是否正确调用？

**解决**：
- 检查浏览器控制台的 Realtime 日志
- 手动刷新页面测试

---

## ✅ 成功标志

如果所有测试都通过，你应该看到：

1. ✅ 用户成功加入队列
2. ✅ 管理员看到等待队列
3. ✅ 管理员接受队列
4. ✅ 用户自动进入聊天
5. ✅ 双方可以正常聊天
6. ✅ 药物推荐功能正常

---

## 📝 测试报告模板

```
测试日期: ___________
测试人员: ___________

测试 1: 用户加入队列
- [ ] 通过
- [ ] 失败（错误：__________）

测试 2: 管理员查看队列
- [ ] 通过
- [ ] 失败（错误：__________）

测试 3: 管理员接受队列
- [ ] 通过
- [ ] 失败（错误：__________）

测试 4: 用户自动进入聊天
- [ ] 通过
- [ ] 失败（错误：__________）

测试 5: 聊天功能
- [ ] 通过
- [ ] 失败（错误：__________）

总体评价: ___________
```

