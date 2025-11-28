# 新咨询系统设计 - 客服排队模式

## 🎯 设计理念

参考常见客服系统（如 LiveChat、Intercom）的排队模式：
1. **用户加入队列** → 显示排队位置
2. **管理员看到队列** → 点击接受
3. **创建会话** → 进入实时聊天
4. **推荐药物** → 用户确认
5. **完成咨询** → 进入订单流程

---

## 📊 数据库设计（简化版）

### 1. 咨询队列表 (consultation_queue)

```sql
CREATE TABLE public.consultation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'accepted', 'in_chat', 'completed', 'cancelled')),
  
  -- 用户信息
  symptoms TEXT[],
  notes JSONB, -- { symptomAssessments, selectedBodyPart, userAge }
  
  -- 匹配信息
  pharmacist_id UUID REFERENCES public.doctors(id),
  accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- 队列信息
  position INTEGER, -- 队列位置（1, 2, 3...）
  estimated_wait_minutes INTEGER, -- 预计等待时间（分钟）
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);
```

**状态流转**：
- `waiting` → 用户加入队列，等待接受
- `accepted` → 管理员接受，准备创建会话
- `in_chat` → 会话已创建，正在聊天
- `completed` → 咨询完成
- `cancelled` → 用户取消或超时

### 2. 咨询会话表 (consultation_sessions) - 简化

```sql
-- 使用现有表，确保有这些字段：
-- id, patient_id, doctor_id, queue_id, status, created_at, started_at, ended_at
```

### 3. 消息表 (consultation_messages) - 使用现有表

### 4. 药物推荐表 (consultation_medications) - 使用现有表

---

## 🔄 完整流程

### 用户端流程

```
1. 用户选择"咨询药剂师"
   ↓
2. 创建队列 (status: 'waiting')
   ↓
3. 显示等待页面
   - 队列位置："您前面有 2 人"
   - 预计等待："约 5-10 分钟"
   - 在线药剂师数量
   ↓
4. 实时监听队列状态变化
   ↓
5. 当状态变为 'accepted' 时
   ↓
6. 创建会话 (consultation_sessions)
   ↓
7. 进入聊天界面
   ↓
8. 药剂师推荐药物
   ↓
9. 用户接受/拒绝药物
   ↓
10. 完成咨询 → 进入订单流程
```

### 管理员/药剂师端流程

```
1. 管理员进入 Pharmacist Dashboard
   ↓
2. 看到 "等待中的咨询" 列表
   - 显示所有 status = 'waiting' 的队列
   - 显示：患者信息、症状、年龄、等待时间
   ↓
3. 点击 "接受咨询" 按钮
   ↓
4. 系统操作：
   - 更新队列状态：'waiting' → 'accepted'
   - 设置 pharmacist_id
   - 创建会话 (consultation_sessions)
   - 更新队列状态：'accepted' → 'in_chat'
   ↓
5. 进入聊天界面
   ↓
6. 可以推荐药物
   ↓
7. 结束咨询
```

---

## 🎨 UI 组件设计

### 1. ConsultationQueue.jsx (用户排队界面)

**功能**：
- 显示队列位置
- 显示预计等待时间
- 显示在线药剂师数量
- "取消排队" 按钮
- 实时更新（Realtime）

**状态**：
- `waiting`: 显示等待信息
- `accepted`: 显示"正在连接..."，准备进入聊天
- `in_chat`: 自动跳转到聊天界面

### 2. PharmacistQueueManager.jsx (管理员队列管理)

**功能**：
- 显示所有 `waiting` 状态的队列
- 每个队列显示：
  - 患者信息（邮箱/ID）
  - 症状列表
  - 年龄
  - 等待时间
  - "接受咨询" 按钮
- 显示当前进行中的咨询

### 3. ConsultationChat.jsx (聊天界面)

**功能**：
- 实时消息
- 药物推荐卡片
- "结束咨询" 按钮

---

## 🔐 RLS 策略设计

### consultation_queue 表

**SELECT**:
- 用户可以查看自己的队列
- 管理员可以查看所有 `waiting` 状态的队列
- 链接了 pharmacist 的用户可以查看所有 `waiting` 队列

**INSERT**:
- 用户可以创建自己的队列（`patient_id = auth.uid()`）

**UPDATE**:
- 用户可以更新自己的队列（取消）
- 链接了 pharmacist 的用户可以接受队列（`waiting` → `accepted` → `in_chat`）

---

## 📝 实现步骤

1. ✅ 设计数据库结构
2. ⏳ 创建/更新 RLS 策略
3. ⏳ 重新实现 ConsultationQueue 组件
4. ⏳ 重新实现 PharmacistQueueManager 组件
5. ⏳ 更新聊天组件
6. ⏳ 测试完整流程

