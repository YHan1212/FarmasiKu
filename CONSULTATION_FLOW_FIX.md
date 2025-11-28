# 咨询流程修复说明

## 🔧 修复的问题

### 问题 1: 用户进入 waiting 后直接进入聊天
**原因**: `checkExistingQueue` 函数在检查已有队列时，如果状态是 'matched'，会立即调用 `onMatched` 进入聊天。

**修复**: 
- 修改了 `checkExistingQueue`，只有在状态为 'matched' 或 'in_consultation' 时才进入聊天
- 'waiting' 状态会继续等待

### 问题 2: Admin 面板看不到等待的队列
**原因**: `PharmacistDashboard` 的查询条件错误，查询的是 `status = 'matched'` 且 `matched_pharmacist_id = pharmacistId`，但新创建的队列状态是 'waiting'，没有 matched_pharmacist_id。

**修复**:
- 修改查询条件为 `status = 'waiting'`
- 现在会显示所有等待中的队列，不限制药剂师

---

## ✅ 修复后的流程

### 用户端流程：
1. 用户选择病情严重 → 进入 `consultation-waiting` 页面
2. 创建队列，状态为 `'waiting'`
3. 显示等待信息（位置、预计等待时间、在线药剂师数量）
4. **不会自动匹配**，继续等待
5. 当队列状态变为 `'matched'` 或 `'in_consultation'` 时，自动进入聊天

### 药剂师端流程：
1. 药剂师在 Admin 面板的 Pharmacist 标签中
2. 看到 "Waiting Consultations" 部分，显示所有 `status = 'waiting'` 的队列
3. 每个队列显示：
   - 患者信息（姓名/邮箱）
   - 症状列表
   - 年龄
   - 加入时间
4. 点击 "Accept & Start Chat" 按钮
5. 系统会：
   - 更新队列状态为 `'matched'`
   - 创建咨询会话
   - 更新队列状态为 `'in_consultation'`
   - 更新药剂师状态为忙碌
   - 进入聊天界面

---

## 🧪 测试步骤

### 1. 用户端测试
1. 登录用户账号
2. 完成症状选择流程
3. 选择 "More severe"
4. 应该进入等待页面，显示 "Waiting for Pharmacist"
5. **不应该**立即进入聊天

### 2. 药剂师端测试
1. 登录 Admin 账号
2. 进入 Admin 面板
3. 点击 "Pharmacist" 标签
4. 应该看到 "Waiting Consultations" 部分
5. 如果有用户等待，应该显示队列列表
6. 点击 "Accept & Start Chat"
7. 应该进入聊天界面

### 3. 完整流程测试
1. 用户进入等待队列
2. 药剂师在 Admin 面板看到队列
3. 药剂师点击接受
4. 用户端自动进入聊天界面
5. 双方可以开始聊天

---

## 📝 代码变更

### `src/components/ConsultationWaiting.jsx`
- 修改 `checkExistingQueue`: 只有在状态为 'matched' 或 'in_consultation' 时才进入聊天
- 修改 `createQueue`: 移除了自动匹配的调用

### `src/components/PharmacistDashboard.jsx`
- 修改 `loadData`: 查询条件改为 `status = 'waiting'`
- 修改队列显示：显示症状和年龄信息

---

## ⚠️ 注意事项

1. **确保药剂师在线**: 药剂师需要在 Admin 面板的 Pharmacist 标签中设置为在线状态
2. **实时更新**: 队列状态变化会通过 Supabase Realtime 实时更新
3. **队列状态**: 
   - `'waiting'`: 等待药剂师接受
   - `'matched'`: 已匹配，但会话可能还在创建中
   - `'in_consultation'`: 正在咨询中

---

**修复已完成并已推送到 GitHub！** ✅

