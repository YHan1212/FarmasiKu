# 咨询功能技术方案

## 📋 方案概览

### 方案 1: 文字聊天咨询（最简单，推荐起步）
**技术栈**: Supabase Realtime + React
**成本**: 低（Supabase 免费额度）
**开发时间**: 1-2 天
**复杂度**: ⭐⭐

**功能**:
- ✅ 实时文字聊天
- ✅ 发送图片/文件
- ✅ 聊天历史记录
- ✅ 在线状态显示
- ✅ 消息已读/未读

**优点**:
- 实现简单快速
- 成本低
- 不需要额外服务
- 移动端友好

**缺点**:
- 没有视频/语音
- 沟通效率较低

---

### 方案 2: 视频通话咨询（完整方案）
**技术栈**: 
- **选项 A**: Agora.io / Twilio Video
- **选项 B**: Daily.co
- **选项 C**: WebRTC (自建，复杂)

**成本**: 
- Agora: 免费 10,000 分钟/月
- Twilio: $0.004/分钟
- Daily.co: 免费 2,000 分钟/月

**开发时间**: 3-5 天
**复杂度**: ⭐⭐⭐⭐

**功能**:
- ✅ 视频通话
- ✅ 音频通话
- ✅ 屏幕共享
- ✅ 文字聊天
- ✅ 录制功能（可选）

**优点**:
- 用户体验好
- 专业度高
- 支持多种功能

**缺点**:
- 需要第三方服务
- 成本较高
- 实现复杂

---

### 方案 3: 混合方案（推荐）
**技术栈**: 
- 文字聊天: Supabase Realtime
- 视频通话: Daily.co (免费额度)
- 预约系统: Supabase Database

**成本**: 低（免费额度内）
**开发时间**: 4-6 天
**复杂度**: ⭐⭐⭐

**功能**:
- ✅ 预约咨询时间
- ✅ 文字聊天（默认）
- ✅ 视频通话（可选升级）
- ✅ 咨询记录
- ✅ 医生排班管理

**优点**:
- 灵活性强
- 成本可控
- 功能完整

**缺点**:
- 需要集成多个服务

---

## 🎯 推荐方案：方案 1（文字聊天）+ 预约系统

### 为什么推荐？
1. **快速上线**: 1-2 天即可完成
2. **成本低**: 使用 Supabase 免费额度
3. **用户体验**: 文字聊天足够满足基本咨询需求
4. **可扩展**: 后续可以添加视频功能

---

## 📐 技术架构设计

### 数据库设计

```sql
-- 咨询会话表
CREATE TABLE consultation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES auth.users(id),
  doctor_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending', -- pending, active, completed, cancelled
  scheduled_at TIMESTAMP,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 消息表
CREATE TABLE consultation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES consultation_sessions(id),
  sender_id UUID REFERENCES auth.users(id),
  message_type TEXT DEFAULT 'text', -- text, image, file
  content TEXT,
  file_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 医生表
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  name TEXT NOT NULL,
  specialization TEXT,
  bio TEXT,
  available_hours JSONB, -- { "monday": ["09:00-17:00"], ... }
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🛠️ 实现步骤

### 阶段 1: 基础功能（1-2 天）
1. ✅ 创建数据库表
2. ✅ 医生管理页面
3. ✅ 预约咨询功能
4. ✅ 文字聊天界面
5. ✅ 实时消息推送（Supabase Realtime）

### 阶段 2: 增强功能（1-2 天）
1. ✅ 文件/图片上传
2. ✅ 消息已读状态
3. ✅ 在线状态显示
4. ✅ 聊天历史记录
5. ✅ 通知系统

### 阶段 3: 高级功能（可选，2-3 天）
1. ✅ 视频通话集成
2. ✅ 屏幕共享
3. ✅ 咨询记录导出
4. ✅ 评价系统

---

## 💻 代码结构

```
src/
├── components/
│   ├── Consultation/
│   │   ├── ConsultationBooking.jsx      # 预约咨询
│   │   ├── ConsultationChat.jsx         # 聊天界面
│   │   ├── ConsultationList.jsx         # 咨询列表
│   │   ├── DoctorSelector.jsx           # 选择医生
│   │   └── MessageBubble.jsx            # 消息气泡
│   └── Admin/
│       └── DoctorManagement.jsx         # 医生管理
├── services/
│   ├── consultationService.js           # 咨询服务
│   └── realtimeService.js               # 实时通信
└── lib/
    └── supabase.js                       # Supabase 配置
```

---

## 🔧 技术细节

### Supabase Realtime 设置

```javascript
// 监听新消息
const channel = supabase
  .channel(`consultation:${sessionId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'consultation_messages',
    filter: `session_id=eq.${sessionId}`
  }, (payload) => {
    // 收到新消息
    handleNewMessage(payload.new)
  })
  .subscribe()
```

### 消息发送

```javascript
// 发送消息
const sendMessage = async (sessionId, content) => {
  const { data, error } = await supabase
    .from('consultation_messages')
    .insert({
      session_id: sessionId,
      sender_id: user.id,
      content: content,
      message_type: 'text'
    })
}
```

---

## 📱 用户流程

### 患者端
1. 选择症状 → 系统建议咨询
2. 选择医生和预约时间
3. 等待医生接受
4. 开始文字聊天
5. 咨询结束，评价医生

### 医生端
1. 查看待处理的咨询请求
2. 接受/拒绝咨询
3. 开始聊天
4. 发送建议和处方
5. 结束咨询

---

## 🎨 UI/UX 设计建议

### 聊天界面
- 类似 WhatsApp/iMessage 的设计
- 患者消息在右侧（蓝色）
- 医生消息在左侧（灰色）
- 显示时间戳
- 已读/未读状态

### 预约界面
- 日历选择日期
- 时间段选择
- 医生头像和信息
- 咨询原因输入

---

## 💰 成本估算

### 方案 1（文字聊天）
- Supabase: 免费（10,000 实时连接/月）
- 存储: 免费（500MB）
- **总计: $0/月**

### 方案 2（视频通话）
- Supabase: 免费
- Daily.co: 免费（2,000 分钟/月）
- 超出: $0.002/分钟
- **总计: $0-50/月**（取决于使用量）

---

## 🚀 快速开始建议

1. **先实现文字聊天**（方案 1）
   - 快速验证需求
   - 低成本测试
   - 收集用户反馈

2. **根据反馈决定是否添加视频**
   - 如果文字聊天足够，就不需要视频
   - 如果需要，再集成 Daily.co

3. **逐步完善功能**
   - 先做核心功能
   - 再添加增强功能

---

## ❓ 需要决定的问题

1. **是否需要视频通话？**
   - 是 → 方案 2 或 3
   - 否 → 方案 1

2. **预算限制？**
   - 无限制 → 方案 2
   - 有限制 → 方案 1 或 3

3. **上线时间？**
   - 紧急 → 方案 1
   - 不紧急 → 方案 2 或 3

4. **医生来源？**
   - 自有医生 → 需要医生管理
   - 第三方 → 需要 API 集成

---

## 📝 下一步

告诉我你的选择，我会：
1. 创建数据库 schema
2. 实现聊天界面
3. 集成实时通信
4. 添加预约功能

你更倾向于哪个方案？

