# 实时咨询系统测试指南

## 📋 测试前准备

### 1. 运行数据库脚本
在 Supabase SQL Editor 中运行：
- `database/realtime_consultation_schema.sql`

### 2. 创建测试药剂师
在 Supabase SQL Editor 中运行：
- `database/setup_test_pharmacist.sql`

这个脚本会自动：
- 创建测试药剂师（如果不存在）
- 设置药剂师在线状态
- 验证设置是否正确

**或者手动运行**：

```sql
-- 创建测试药剂师
INSERT INTO public.doctors (name, specialization, bio, is_available)
VALUES ('Dr. Test Pharmacist', 'General Pharmacy', 'Test pharmacist for realtime consultation', true)
RETURNING id;

-- 然后使用返回的 id 设置在线状态
-- 注意：需要将下面的 'YOUR_DOCTOR_ID' 替换为上面返回的实际 UUID
INSERT INTO public.pharmacist_availability (
  pharmacist_id, 
  is_online, 
  is_busy, 
  max_concurrent_sessions
)
VALUES (
  'YOUR_DOCTOR_ID'::uuid,  -- 替换为实际的 doctor id（UUID格式）
  true,
  false,
  3
);
```

### 3. 启用 Realtime（可选，用于实时更新）
在 Supabase Dashboard → Database → Replication 中启用：
- `consultation_queue`
- `consultation_medications`
- `pharmacist_availability`

---

## 🧪 测试步骤

### 测试 1: 用户进入队列

1. **登录应用**
   - 使用普通用户账户登录

2. **进入欢迎页面**
   - 应该看到 "Get Started" 按钮
   - 应该看到 "💬 Start Realtime Consultation" 按钮（绿色）

3. **点击 "Start Realtime Consultation"**
   - 应该跳转到等待页面
   - 显示队列位置、预计等待时间、在线药剂师数量

4. **检查数据库**
   ```sql
   SELECT * FROM consultation_queue 
   WHERE patient_id = 'YOUR_USER_ID'
   ORDER BY created_at DESC;
   ```
   - 应该看到一条 `status = 'waiting'` 的记录

---

### 测试 2: 自动匹配

1. **确保有在线药剂师**
   ```sql
   SELECT * FROM pharmacist_availability 
   WHERE is_online = true AND is_busy = false;
   ```

2. **等待匹配**
   - 如果药剂师在线且不忙碌，应该自动匹配
   - 队列状态应该变为 `matched`
   - 应该创建 `consultation_sessions` 记录
   - 应该跳转到聊天界面

3. **检查数据库**
   ```sql
   -- 检查队列状态
   SELECT * FROM consultation_queue 
   WHERE id = 'YOUR_QUEUE_ID';
   
   -- 检查会话
   SELECT * FROM consultation_sessions 
   WHERE queue_id = 'YOUR_QUEUE_ID';
   
   -- 检查药剂师状态
   SELECT * FROM pharmacist_availability 
   WHERE pharmacist_id = 'YOUR_PHARMACIST_ID';
   ```

---

### 测试 3: 取消队列

1. **在等待页面点击 "Cancel"**
   - 应该返回欢迎页面
   - 队列状态应该变为 `cancelled`

2. **检查数据库**
   ```sql
   SELECT * FROM consultation_queue 
   WHERE id = 'YOUR_QUEUE_ID';
   ```
   - `status` 应该是 `cancelled`

---

## 🔧 常见问题

### 问题 1: 没有匹配到药剂师

**原因**：
- 没有在线药剂师
- 所有药剂师都忙碌

**解决**：
```sql
-- 检查药剂师状态
SELECT * FROM pharmacist_availability;

-- 设置药剂师在线（使用实际的 UUID）
UPDATE pharmacist_availability 
SET is_online = true, is_busy = false 
WHERE pharmacist_id = 'YOUR_PHARMACIST_ID'::uuid;  -- 注意：需要是有效的 UUID

-- 或者运行自动设置脚本
-- 运行 database/setup_test_pharmacist.sql
```

### 问题 2: 队列位置不更新

**原因**：
- Realtime 未启用
- 队列查询有问题

**解决**：
- 检查浏览器控制台是否有错误
- 手动刷新页面
- 检查 Supabase Realtime 是否启用

### 问题 3: 匹配后无法进入聊天

**原因**：
- 会话创建失败
- 会话查询失败

**解决**：
```sql
-- 检查会话是否存在
SELECT * FROM consultation_sessions 
WHERE queue_id = 'YOUR_QUEUE_ID';

-- 如果不存在，手动创建
INSERT INTO consultation_sessions (
  patient_id, 
  doctor_id, 
  queue_id, 
  consultation_type, 
  status
)
VALUES (
  'YOUR_PATIENT_ID',
  'YOUR_DOCTOR_ID',
  'YOUR_QUEUE_ID',
  'realtime',
  'active'
);
```

---

## 📝 测试检查清单

- [ ] 数据库脚本已运行
- [ ] 测试药剂师已创建
- [ ] 药剂师在线状态已设置
- [ ] 用户登录成功
- [ ] 可以进入等待页面
- [ ] 队列记录已创建
- [ ] 可以自动匹配药剂师
- [ ] 匹配后可以进入聊天
- [ ] 可以取消队列

---

## 🚀 下一步测试

完成基础测试后，可以继续测试：
1. 药物推荐功能
2. 用户确认流程
3. 药剂师面板
4. 结束咨询流程

