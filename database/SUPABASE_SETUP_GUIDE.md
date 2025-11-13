# Supabase 数据库设置指南

## 📋 步骤概览

1. 登录 Supabase Dashboard
2. 打开 SQL Editor
3. 运行数据库架构脚本（schema.sql）
4. 运行数据迁移脚本（migrate_medications.sql）
5. 验证数据

---

## 🔐 步骤 1: 登录 Supabase Dashboard

1. 访问 [https://supabase.com](https://supabase.com)
2. 登录你的账户
3. 选择你的项目（farmasiKu）

---

## 📝 步骤 2: 打开 SQL Editor

1. 在左侧菜单栏，点击 **"SQL Editor"**（SQL 编辑器）
2. 点击 **"New query"**（新建查询）按钮

---

## 🗄️ 步骤 3: 运行数据库架构脚本

### 3.1 打开 schema.sql 文件

在你的项目中，打开 `database/schema.sql` 文件，复制**全部内容**。

### 3.2 在 Supabase SQL Editor 中执行

1. 将复制的 SQL 代码粘贴到 SQL Editor 中
2. 点击右上角的 **"Run"**（运行）按钮，或按快捷键 `Ctrl+Enter`（Windows）或 `Cmd+Enter`（Mac）

### 3.3 检查结果

如果成功，你会看到：
- ✅ 绿色提示："Success. No rows returned"
- 或者显示创建的表和策略信息

如果出现错误：
- ❌ 红色错误提示
- 常见错误：
  - **"relation already exists"** - 表已存在，这是正常的，可以忽略
  - **"policy already exists"** - 策略已存在，这也是正常的

> 💡 **提示**：由于脚本使用了 `IF NOT EXISTS` 和 `DROP POLICY IF EXISTS`，可以安全地多次运行。

---

## 📦 步骤 4: 运行数据迁移脚本

### 4.1 打开 migrate_medications.sql 文件

在你的项目中，打开 `database/migrate_medications.sql` 文件，复制**全部内容**。

### 4.2 在 Supabase SQL Editor 中执行

1. 在 SQL Editor 中，点击 **"New query"** 创建新查询
2. 将复制的 SQL 代码粘贴进去
3. 点击 **"Run"** 按钮执行

### 4.3 检查结果

如果成功，你会看到：
- ✅ "Success. X rows inserted"（X 是插入的行数）

如果出现错误：
- ❌ 如果显示 "duplicate key" 错误，说明数据已经存在，这是正常的
- 脚本使用了 `ON CONFLICT DO NOTHING`，可以安全地多次运行

---

## ✅ 步骤 5: 验证数据

### 5.1 检查药物表

在 SQL Editor 中运行以下查询：

```sql
-- 查看药物总数
SELECT COUNT(*) as total_medications FROM medications;

-- 查看前 5 个药物
SELECT id, name, price, is_active 
FROM medications 
ORDER BY name 
LIMIT 5;
```

**预期结果**：
- 应该有约 27 个药物
- 每个药物都有名称、价格等信息

### 5.2 检查症状-药物映射

```sql
-- 查看映射总数
SELECT COUNT(*) as total_mappings FROM symptom_medication_mapping;

-- 查看示例映射
SELECT 
  sm.symptom,
  m.name as medication_name,
  m.price
FROM symptom_medication_mapping sm
JOIN medications m ON sm.medication_id = m.id
ORDER BY sm.symptom
LIMIT 10;
```

**预期结果**：
- 应该有约 32 个映射关系
- 每个症状对应一个或多个药物

### 5.3 测试查询功能

```sql
-- 测试根据症状获取药物（模拟应用中的查询）
SELECT 
  m.id,
  m.name,
  m.price,
  m.usage_instructions,
  m.age_restrictions
FROM medications m
INNER JOIN symptom_medication_mapping smm ON m.id = smm.medication_id
WHERE smm.symptom IN ('Fever', 'Cough')
  AND m.is_active = true
ORDER BY smm.priority;
```

**预期结果**：
- 应该返回与 "Fever" 和 "Cough" 相关的药物
- 包括 Ibuprofen Tablets, Paracetamol Tablets, Cough Syrup, Loquat Syrup 等

---

## 🔍 步骤 6: 在 Supabase Dashboard 中查看数据

### 6.1 查看表结构

1. 在左侧菜单，点击 **"Table Editor"**（表编辑器）
2. 你应该能看到以下表：
   - ✅ `medications`
   - ✅ `symptom_medication_mapping`
   - ✅ `user_profiles`
   - ✅ `symptom_assessments`
   - ✅ `consultations`
   - ✅ `orders`
   - ✅ `order_items`

### 6.2 查看药物数据

1. 点击 **"medications"** 表
2. 你应该能看到所有药物的列表
3. 可以查看每个药物的详细信息：
   - 名称
   - 价格
   - 使用说明（JSON 格式）
   - 年龄限制（JSON 格式）

### 6.3 查看映射关系

1. 点击 **"symptom_medication_mapping"** 表
2. 可以看到症状和药物的对应关系

---

## 🛠️ 常见问题排查

### 问题 1: "permission denied" 错误

**原因**：RLS（Row Level Security）策略问题

**解决**：
1. 检查 RLS 是否已启用
2. 确认策略已正确创建（运行 schema.sql 中的策略部分）

### 问题 2: "relation does not exist" 错误

**原因**：表还没有创建

**解决**：
1. 确保先运行了 `schema.sql`
2. 检查表是否在 `public` schema 中

### 问题 3: 数据没有插入

**原因**：可能数据已存在，或者有唯一约束冲突

**解决**：
1. 检查是否已有数据：`SELECT COUNT(*) FROM medications;`
2. 如果需要重新插入，可以先删除：`TRUNCATE TABLE medications CASCADE;`（⚠️ 注意：这会删除所有数据）

### 问题 4: 查询返回空结果

**原因**：可能是 RLS 策略阻止了查询

**解决**：
1. 检查 RLS 策略：`SELECT * FROM pg_policies WHERE tablename = 'medications';`
2. 确认策略允许 SELECT 操作

---

## 📊 验证清单

完成以下检查，确保一切正常：

- [ ] `medications` 表已创建
- [ ] `symptom_medication_mapping` 表已创建
- [ ] 药物数据已导入（约 27 条记录）
- [ ] 映射关系已创建（约 32 条记录）
- [ ] RLS 策略已启用
- [ ] 可以通过 SQL 查询获取药物数据
- [ ] 应用可以正常使用数据库数据

---

## 🎯 下一步

完成以上步骤后：

1. **测试应用**：刷新你的应用，选择症状，查看是否能正常获取药物推荐
2. **检查控制台**：打开浏览器开发者工具，查看是否有数据库相关错误
3. **验证功能**：完成一次完整的订单流程，确保数据正常保存

---

## 💡 提示

### 如何更新药物价格

直接在 Supabase Table Editor 中：
1. 打开 `medications` 表
2. 找到要更新的药物
3. 修改 `price` 字段
4. 保存

应用会自动使用新价格，无需重新部署！

### 如何添加新药物

1. 在 `medications` 表中添加新记录
2. 在 `symptom_medication_mapping` 表中创建映射关系

或者使用 SQL：

```sql
-- 添加新药物
INSERT INTO medications (name, price, usage_instructions, age_restrictions)
VALUES (
  'New Medication',
  25.00,
  '{"method": "oral", "dosage": "1 tablet", ...}'::jsonb,
  '{"restricted_for": []}'::jsonb
);

-- 创建映射
INSERT INTO symptom_medication_mapping (symptom, medication_id, priority)
VALUES (
  'Symptom Name',
  (SELECT id FROM medications WHERE name = 'New Medication'),
  1
);
```

---

## 📞 需要帮助？

如果遇到问题：
1. 检查 Supabase Dashboard 中的错误日志
2. 查看浏览器控制台的错误信息
3. 确认 `.env` 文件中的 Supabase 配置正确

