# 重构方案：重新设计 Admin 查看 Waiting 队列的逻辑

## 🎯 目标

确保 Admin 账号（无论是否 link pharmacist）都能看到所有 waiting 队列，并且逻辑清晰、易于维护。

---

## 📋 当前问题分析

1. **RLS 策略混乱**：多个修复脚本导致策略重复或冲突
2. **函数依赖问题**：`is_current_user_admin()` 在 RLS 中可能不工作
3. **逻辑复杂**：多个策略条件重叠，难以调试
4. **前端逻辑**：查询逻辑可能有问题

---

## 🔧 重构方案

### 阶段 1: 清理数据库（RLS 策略）

#### 步骤 1.1: 删除所有旧的 RLS 策略
- 删除 `consultation_queue` 表的所有现有策略
- 确保干净的开始

#### 步骤 1.2: 创建简单清晰的 RLS 策略

**SELECT 策略（查看）**：
1. **用户查看自己的队列**
   ```sql
   auth.uid() = patient_id
   ```

2. **Admin 查看所有 waiting 队列**（最重要！）
   ```sql
   status = 'waiting' AND 
   EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
   ```

3. **Admin 查看所有 matched/in_consultation 队列**
   ```sql
   status IN ('matched', 'in_consultation') AND 
   EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
   ```

4. **链接了 pharmacist account 的用户查看 waiting 队列**（可选，因为 Admin 已经覆盖）
   ```sql
   status = 'waiting' AND 
   EXISTS (SELECT 1 FROM doctors WHERE user_id = auth.uid())
   ```

**INSERT 策略（创建）**：
- 用户只能创建自己的队列

**UPDATE 策略（更新）**：
1. 用户更新自己的队列
2. 链接了 pharmacist account 的用户可以接受队列（更新状态）

---

### 阶段 2: 简化前端逻辑

#### 步骤 2.1: 简化 `PharmacistDashboard.jsx`

**当前逻辑问题**：
- 查询逻辑可能被 RLS 阻止
- 错误处理不够清晰

**新逻辑**：
1. **加载 waiting 队列**：
   ```javascript
   // 简单查询，让 RLS 策略处理权限
   const { data: queues, error } = await supabase
     .from('consultation_queue')
     .select('*')
     .eq('status', 'waiting')
     .order('created_at', { ascending: true })
   ```

2. **错误处理**：
   - 如果 `error` 存在，显示详细错误信息
   - 如果 `queues` 为空但 `error` 为 null，说明 RLS 阻止了（显示提示）

3. **调试信息**：
   - 记录用户 ID 和角色
   - 记录查询结果

---

### 阶段 3: 验证和测试

#### 步骤 3.1: 创建验证脚本
- 测试每个策略条件
- 验证 Admin 能看到队列
- 验证 User 只能看到自己的队列

#### 步骤 3.2: 在应用中测试
- 以 Admin 用户登录
- 查看浏览器控制台
- 检查 Network 请求

---

## 📝 实施步骤

### 步骤 1: 创建清理和重建脚本
- 文件：`database/rebuild_consultation_queue_rls.sql`
- 功能：删除所有旧策略，创建新策略

### 步骤 2: 更新前端代码
- 文件：`src/components/PharmacistDashboard.jsx`
- 功能：简化查询逻辑，改进错误处理

### 步骤 3: 创建验证脚本
- 文件：`database/verify_new_rls.sql`
- 功能：验证新策略是否正确工作

### 步骤 4: 测试
- 在应用中测试
- 检查浏览器控制台
- 验证功能

---

## ✅ 预期结果

1. **Admin 用户**：
   - ✅ 能看到所有 waiting 队列
   - ✅ 能看到所有 matched/in_consultation 队列
   - ✅ 如果 link 了 pharmacist account，可以接受队列

2. **普通用户**：
   - ✅ 只能看到自己的队列
   - ✅ 可以创建队列

3. **代码**：
   - ✅ 逻辑清晰
   - ✅ 易于维护
   - ✅ 易于调试

---

## 🔍 关键设计决策

1. **不使用函数**：直接使用 `EXISTS` 查询检查角色，避免函数在 RLS 中的问题
2. **策略分离**：每个策略只处理一种情况，避免重叠
3. **简单查询**：前端只做简单查询，让 RLS 处理权限
4. **详细日志**：添加足够的调试信息

---

## ⚠️ 注意事项

1. **备份数据**：重构前确保数据已备份
2. **测试环境**：先在测试环境验证
3. **逐步实施**：按步骤执行，每步验证
4. **回滚计划**：如果出现问题，可以回滚到旧策略

---

## 📚 相关文件

- `database/rebuild_consultation_queue_rls.sql` - 重建 RLS 策略
- `src/components/PharmacistDashboard.jsx` - 前端逻辑
- `database/verify_new_rls.sql` - 验证脚本

