# 实时1对1咨询系统 - 完整方案

## 📋 系统概述

实现一个完整的实时1对1咨询系统，用户排队等待药剂师，进行实时聊天，药剂师推荐药物，用户确认后下单。

---

## 🗄️ 数据库设计

### 1. 咨询队列表 (consultation_queue)
```sql
CREATE TABLE IF NOT EXISTS public.consultation_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT DEFAULT 'waiting', -- waiting, matched, in_consultation, completed, cancelled
  priority INTEGER DEFAULT 0, -- 优先级（紧急情况可提高）
  symptoms TEXT[], -- 用户症状（可选）
  notes TEXT, -- 用户备注
  matched_pharmacist_id UUID REFERENCES public.doctors(id), -- 匹配的药剂师
  matched_at TIMESTAMP WITH TIME ZONE, -- 匹配时间
  started_at TIMESTAMP WITH TIME ZONE, -- 开始咨询时间
  ended_at TIMESTAMP WITH TIME ZONE, -- 结束咨询时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### 2. 咨询会话表 (consultation_sessions) - 扩展
```sql
-- 添加新字段
ALTER TABLE public.consultation_sessions 
ADD COLUMN IF NOT EXISTS queue_id UUID REFERENCES public.consultation_queue(id),
ADD COLUMN IF NOT EXISTS consultation_type TEXT DEFAULT 'realtime', -- realtime, scheduled
ADD COLUMN IF NOT EXISTS estimated_wait_time INTEGER, -- 预计等待时间（分钟）
ADD COLUMN IF NOT EXISTS position_in_queue INTEGER; -- 队列位置
```

### 3. 药物推荐表 (consultation_medications)
```sql
CREATE TABLE IF NOT EXISTS public.consultation_medications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES public.consultation_sessions(id) ON DELETE CASCADE NOT NULL,
  medication_name TEXT NOT NULL,
  medication_id UUID REFERENCES public.medications(id), -- 关联药物表
  dosage TEXT, -- 用法用量
  frequency TEXT, -- 服用频率
  duration TEXT, -- 服用时长
  instructions TEXT, -- 特殊说明
  recommended_by UUID REFERENCES auth.users(id) NOT NULL, -- 推荐人（药剂师）
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected
  patient_notes TEXT, -- 患者备注
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

### 4. 药剂师状态表 (pharmacist_availability)
```sql
CREATE TABLE IF NOT EXISTS public.pharmacist_availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pharmacist_id UUID REFERENCES public.doctors(id) NOT NULL,
  is_online BOOLEAN DEFAULT false, -- 是否在线
  is_busy BOOLEAN DEFAULT false, -- 是否忙碌
  current_session_id UUID REFERENCES public.consultation_sessions(id), -- 当前咨询会话
  max_concurrent_sessions INTEGER DEFAULT 3, -- 最大并发咨询数
  current_sessions_count INTEGER DEFAULT 0, -- 当前咨询数
  last_active_at TIMESTAMP WITH TIME ZONE, -- 最后活跃时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
```

---

## 🔄 系统流程

### 用户端流程

#### 1. 进入咨询队列
```
用户点击 "Start Consultation" 
→ 创建 consultation_queue 记录 (status: 'waiting')
→ 显示等待页面（显示队列位置、预计等待时间）
→ 订阅队列状态变化（Supabase Realtime）
```

#### 2. 等待匹配
```
系统自动匹配可用药剂师
→ 检查 pharmacist_availability (is_online = true, is_busy = false)
→ 选择当前咨询数最少的药剂师
→ 更新 consultation_queue (status: 'matched', matched_pharmacist_id)
→ 创建 consultation_sessions 记录
→ 通知用户和药剂师
```

#### 3. 开始咨询
```
药剂师点击 "Accept" 或自动开始
→ 更新 consultation_queue (status: 'in_consultation', started_at)
→ 更新 pharmacist_availability (is_busy = true, current_session_id)
→ 打开聊天界面
→ 启用实时消息功能
```

#### 4. 药剂师推荐药物
```
药剂师在聊天中点击 "Recommend Medication"
→ 打开药物选择界面
→ 选择药物、填写用法用量
→ 保存到 consultation_medications (status: 'pending')
→ 发送系统消息通知用户
→ 在聊天界面显示推荐药物卡片
```

#### 5. 用户确认药物
```
用户查看推荐药物
→ 点击 "Accept" 或 "Reject"
→ 更新 consultation_medications (status: 'accepted'/'rejected')
→ 如果接受，添加到购物车或直接跳转支付
→ 发送确认消息给药剂师
```

#### 6. 结束咨询
```
药剂师或用户点击 "End Consultation"
→ 更新 consultation_sessions (status: 'completed', ended_at)
→ 更新 consultation_queue (status: 'completed', ended_at)
→ 更新 pharmacist_availability (is_busy = false, current_session_id = null)
→ 显示咨询总结页面
```

### 药剂师端流程

#### 1. 上线/下线
```
药剂师登录后自动上线
→ 更新 pharmacist_availability (is_online = true)
→ 开始接收队列匹配请求
```

#### 2. 接收咨询请求
```
系统匹配后通知药剂师
→ 显示咨询请求通知
→ 显示用户信息和症状
→ 药剂师选择 "Accept" 或 "Decline"
```

#### 3. 进行咨询
```
进入聊天界面
→ 实时消息交流
→ 可以推荐药物
→ 可以查看用户历史
→ 可以结束咨询
```

#### 4. 推荐药物
```
点击 "Recommend Medication"
→ 打开药物选择界面
→ 搜索/选择药物
→ 填写用法用量
→ 发送推荐
```

---

## 🎨 UI/UX 设计

### 用户端界面

#### 1. 等待页面 (ConsultationWaiting.jsx)
```
- 显示队列位置（"You are #3 in queue"）
- 显示预计等待时间（"Estimated wait: 5-10 minutes"）
- 显示等待动画
- 显示当前在线药剂师数量
- "Cancel" 按钮
- 实时更新队列状态
```

#### 2. 聊天界面 (RealtimeConsultationChat.jsx)
```
- 标准聊天界面（左右对齐）
- 药物推荐卡片（特殊样式）
- "End Consultation" 按钮
- 药剂师信息显示
```

#### 3. 药物推荐卡片 (MedicationRecommendationCard.jsx)
```
- 药物名称
- 用法用量
- 服用频率
- 特殊说明
- "Accept" 和 "Reject" 按钮
- 接受后显示 "Add to Cart" 按钮
```

### 药剂师端界面

#### 1. 咨询面板 (PharmacistDashboard.jsx)
```
- 当前咨询列表
- 等待队列显示
- 在线状态切换
- 咨询统计
```

#### 2. 聊天界面（同用户端）
```
- 药物推荐按钮
- 推荐历史显示
- 结束咨询按钮
```

#### 3. 药物推荐界面 (MedicationRecommendationForm.jsx)
```
- 药物搜索/选择
- 用法用量输入
- 频率选择
- 时长选择
- 特殊说明输入
- "Send Recommendation" 按钮
```

---

## 🔧 技术实现

### 1. 队列匹配算法

```javascript
async function matchPharmacist(queueId) {
  // 1. 查找在线且不忙碌的药剂师
  const { data: availablePharmacists } = await supabase
    .from('pharmacist_availability')
    .select(`
      *,
      pharmacist:doctors(*)
    `)
    .eq('is_online', true)
    .eq('is_busy', false)
    .order('current_sessions_count', { ascending: true })
    .limit(1)

  if (!availablePharmacists || availablePharmacists.length === 0) {
    return null // 没有可用药剂师
  }

  const pharmacist = availablePharmacists[0]

  // 2. 更新队列状态
  await supabase
    .from('consultation_queue')
    .update({
      status: 'matched',
      matched_pharmacist_id: pharmacist.pharmacist_id,
      matched_at: new Date().toISOString()
    })
    .eq('id', queueId)

  // 3. 创建咨询会话
  const { data: session } = await supabase
    .from('consultation_sessions')
    .insert({
      patient_id: queue.patient_id,
      doctor_id: pharmacist.pharmacist_id,
      queue_id: queueId,
      status: 'active',
      started_at: new Date().toISOString()
    })
    .select()
    .single()

  // 4. 更新药剂师状态
  await supabase
    .from('pharmacist_availability')
    .update({
      is_busy: true,
      current_session_id: session.id,
      current_sessions_count: pharmacist.current_sessions_count + 1
    })
    .eq('id', pharmacist.id)

  return session
}
```

### 2. 实时队列更新

```javascript
// 用户端订阅队列状态
useEffect(() => {
  if (!queueId) return

  const channel = supabase
    .channel(`queue:${queueId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'consultation_queue',
        filter: `id=eq.${queueId}`
      },
      (payload) => {
        const queue = payload.new
        if (queue.status === 'matched') {
          // 匹配成功，跳转到聊天界面
          navigateToChat(queue.matched_pharmacist_id)
        } else if (queue.status === 'waiting') {
          // 更新队列位置
          updateQueuePosition(queue.position_in_queue)
        }
      }
    )
    .subscribe()

  return () => channel.unsubscribe()
}, [queueId])
```

### 3. 药物推荐功能

```javascript
async function recommendMedication(sessionId, medicationData) {
  const { data, error } = await supabase
    .from('consultation_medications')
    .insert({
      session_id: sessionId,
      medication_name: medicationData.name,
      medication_id: medicationData.id,
      dosage: medicationData.dosage,
      frequency: medicationData.frequency,
      duration: medicationData.duration,
      instructions: medicationData.instructions,
      recommended_by: user.id,
      status: 'pending'
    })
    .select()
    .single()

  // 发送系统消息通知用户
  await supabase
    .from('consultation_messages')
    .insert({
      session_id: sessionId,
      sender_id: user.id,
      sender_type: 'doctor',
      message_type: 'medication_recommendation',
      content: JSON.stringify({ medication_id: data.id })
    })
}
```

### 4. 用户确认药物

```javascript
async function acceptMedication(medicationId) {
  // 更新药物状态
  await supabase
    .from('consultation_medications')
    .update({ status: 'accepted' })
    .eq('id', medicationId)

  // 添加到购物车或直接跳转支付
  const { data: medication } = await supabase
    .from('consultation_medications')
    .select('*')
    .eq('id', medicationId)
    .single()

  // 添加到购物车
  addToCart({
    medication_id: medication.medication_id,
    medication_name: medication.medication_name,
    dosage: medication.dosage,
    frequency: medication.frequency
  })
}
```

---

## 📊 状态管理

### 队列状态流转
```
waiting → matched → in_consultation → completed
   ↓         ↓            ↓
cancelled  cancelled   cancelled
```

### 咨询会话状态流转
```
pending → active → completed
   ↓        ↓
cancelled cancelled
```

### 药物推荐状态流转
```
pending → accepted → (添加到购物车)
   ↓
rejected
```

---

## 🔔 通知系统

### 1. 应用内通知
- 使用 Supabase Realtime 推送
- 队列状态变化通知
- 新消息通知
- 药物推荐通知

### 2. 通知类型
- `queue_matched`: 队列匹配成功
- `consultation_started`: 咨询开始
- `new_message`: 新消息
- `medication_recommended`: 药物推荐
- `medication_accepted`: 药物被接受
- `consultation_ended`: 咨询结束

---

## 🚀 实施步骤

### Phase 1: 数据库和基础架构
1. ✅ 创建数据库表
2. ✅ 设置 RLS 策略
3. ✅ 启用 Supabase Realtime

### Phase 2: 队列系统
1. 创建咨询队列组件
2. 实现队列匹配算法
3. 实现实时队列更新

### Phase 3: 聊天系统增强
1. 增强现有聊天组件
2. 添加药物推荐功能
3. 添加系统消息支持

### Phase 4: 药剂师端
1. 创建药剂师面板
2. 实现咨询接收功能
3. 实现药物推荐界面

### Phase 5: 用户确认流程
1. 创建药物推荐卡片组件
2. 实现接受/拒绝功能
3. 集成购物车/支付流程

### Phase 6: 测试和优化
1. 测试完整流程
2. 性能优化
3. UI/UX 优化

---

## 📝 注意事项

1. **并发控制**: 确保一个药剂师不会同时处理过多咨询
2. **队列公平性**: 使用 FIFO（先进先出）原则
3. **超时处理**: 如果用户等待超过一定时间，自动取消或通知
4. **药剂师离线**: 如果药剂师离线，自动重新匹配
5. **数据安全**: 确保咨询记录和药物推荐数据安全
6. **用户体验**: 提供清晰的等待状态和进度反馈

---

## 🎯 未来扩展

1. **视频/语音咨询**: 集成 WebRTC
2. **咨询历史**: 查看历史咨询记录
3. **评价系统**: 用户评价药剂师
4. **智能匹配**: 根据症状匹配专业药剂师
5. **多语言支持**: 支持多种语言咨询

