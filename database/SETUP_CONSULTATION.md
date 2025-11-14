# 咨询功能数据库设置指南

## 📋 需要运行的脚本（按顺序）

### 第一步：创建咨询相关表

在 Supabase SQL Editor 中运行：
```sql
-- 运行 database/consultation_schema.sql
```

这会创建：
- ✅ `doctors` 表
- ✅ `consultation_sessions` 表
- ✅ `consultation_messages` 表
- ✅ 所有 RLS 策略
- ✅ 索引和实时订阅

---

### 第二步：添加医生管理权限

在 Supabase SQL Editor 中运行：
```sql
-- 运行 database/add_doctors_delete_policy.sql
```

这会添加：
- ✅ UPDATE 策略（允许更新所有医生）
- ✅ DELETE 策略（允许删除医生）
- ✅ SELECT 策略（允许查看所有医生）

---

### 第三步：添加库存字段（如果还没运行）

在 Supabase SQL Editor 中运行：
```sql
-- 运行 database/add_stock_column.sql
```

这会添加：
- ✅ `stock` 字段到 `medications` 表

---

### 第四步：添加药物更新权限（如果还没运行）

在 Supabase SQL Editor 中运行：
```sql
-- 运行 database/add_medications_update_policy.sql
```

这会添加：
- ✅ UPDATE 策略（允许更新药物价格和库存）

---

## 🚀 快速设置（一键运行所有）

如果你想一次性运行所有必需的脚本，可以按顺序运行：

1. `database/consultation_schema.sql`
2. `database/add_doctors_delete_policy.sql`
3. `database/add_stock_column.sql`（如果还没运行）
4. `database/add_medications_update_policy.sql`（如果还没运行）

---

## ✅ 验证设置

运行以下查询验证表是否创建成功：

```sql
-- 检查表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('doctors', 'consultation_sessions', 'consultation_messages');

-- 应该返回 3 行
```

---

## 🧪 测试

设置完成后：

1. **刷新网页**
2. **登录应用**
3. **完成症状选择流程**
4. **选择 "More severe"**
5. **点击 "Start Consultation"**
6. **应该能成功创建咨询会话**

---

## ⚠️ 常见错误

### 错误 1: "relation does not exist"
**原因**：表还没有创建
**解决**：运行 `database/consultation_schema.sql`

### 错误 2: "permission denied"
**原因**：RLS 策略没有设置
**解决**：运行 `database/add_doctors_delete_policy.sql`

### 错误 3: "Please login to start a consultation"
**原因**：用户没有登录
**解决**：先登录再创建咨询

---

## 📝 检查清单

- [ ] 运行 `consultation_schema.sql`
- [ ] 运行 `add_doctors_delete_policy.sql`
- [ ] 运行 `add_stock_column.sql`（如果还没运行）
- [ ] 运行 `add_medications_update_policy.sql`（如果还没运行）
- [ ] 验证表是否存在
- [ ] 测试创建咨询

