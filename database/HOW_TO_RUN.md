# 如何在 Supabase 中运行 SQL 脚本

## 🚀 快速步骤

### 第一步：打开 Supabase Dashboard

1. 访问 [https://app.supabase.com](https://app.supabase.com)
2. 登录你的账户
3. 选择你的项目（farmasiKu）

---

### 第二步：运行 schema.sql（创建表结构）

1. **打开 SQL Editor**
   - 在左侧菜单栏，点击 **"SQL Editor"**（SQL 编辑器）
   - 或者直接访问：`https://app.supabase.com/project/YOUR_PROJECT_ID/sql`

2. **创建新查询**
   - 点击右上角的 **"New query"** 按钮
   - 或者点击 **"+"** 图标

3. **复制 SQL 代码**
   - 在你的项目中，打开 `database/schema.sql` 文件
   - 按 `Ctrl+A`（Windows）或 `Cmd+A`（Mac）全选
   - 按 `Ctrl+C`（Windows）或 `Cmd+C`（Mac）复制

4. **粘贴并运行**
   - 在 SQL Editor 中，按 `Ctrl+V`（Windows）或 `Cmd+V`（Mac）粘贴
   - 点击右上角的 **"Run"** 按钮（或按 `Ctrl+Enter` / `Cmd+Enter`）

5. **检查结果**
   - ✅ 如果成功：会显示 "Success. No rows returned" 或类似消息
   - ❌ 如果有错误：会显示红色错误信息（通常可以忽略 "already exists" 错误）

---

### 第三步：运行 migrate_medications.sql（导入药物数据）

1. **创建新查询**
   - 在 SQL Editor 中，点击 **"New query"** 创建新的查询标签页

2. **复制 SQL 代码**
   - 打开 `database/migrate_medications.sql` 文件
   - 全选并复制所有内容

3. **粘贴并运行**
   - 粘贴到新的查询标签页
   - 点击 **"Run"** 按钮

4. **检查结果**
   - ✅ 如果成功：会显示 "Success. X rows inserted"（X 应该是约 27）
   - ❌ 如果有 "duplicate key" 错误：说明数据已存在，可以忽略

---

## ✅ 验证数据

运行以下查询验证数据是否正确导入：

### 检查药物数量
```sql
SELECT COUNT(*) as total_medications FROM medications;
```
**预期结果**：应该返回约 27

### 检查映射数量
```sql
SELECT COUNT(*) as total_mappings FROM symptom_medication_mapping;
```
**预期结果**：应该返回约 32

### 查看示例药物
```sql
SELECT name, price, is_active 
FROM medications 
ORDER BY name 
LIMIT 5;
```

### 查看示例映射
```sql
SELECT 
  sm.symptom,
  m.name as medication_name,
  m.price
FROM symptom_medication_mapping sm
JOIN medications m ON sm.medication_id = m.id
ORDER BY sm.symptom
LIMIT 10;
```

---

## 📸 详细步骤（带截图说明位置）

### 步骤 1：登录 Supabase

1. 打开浏览器，访问 [https://app.supabase.com](https://app.supabase.com)
2. 输入你的邮箱和密码登录
3. 在项目列表中选择你的 farmasiKu 项目

### 步骤 2：找到 SQL Editor

在左侧菜单栏中，你会看到：
```
🏠 Home
📊 Table Editor
🔍 SQL Editor  ← 点击这里
🔐 Authentication
⚙️ Settings
...
```

点击 **"SQL Editor"**

### 步骤 3：创建新查询

在 SQL Editor 页面：
- 右上角有一个 **"New query"** 按钮
- 或者点击 **"+"** 图标
- 这会创建一个新的查询标签页

### 步骤 4：粘贴 SQL 代码

1. 在你的代码编辑器中打开 `database/schema.sql`
2. 全选所有内容（`Ctrl+A` 或 `Cmd+A`）
3. 复制（`Ctrl+C` 或 `Cmd+C`）
4. 在 Supabase SQL Editor 中粘贴（`Ctrl+V` 或 `Cmd+V`）

### 步骤 5：运行 SQL

- 点击右上角的 **"Run"** 按钮
- 或者按快捷键：
  - Windows: `Ctrl + Enter`
  - Mac: `Cmd + Enter`

### 步骤 6：查看结果

- ✅ **成功**：会显示绿色提示 "Success"
- ❌ **错误**：会显示红色错误信息

**常见情况**：
- "relation already exists" - 表已存在，可以忽略
- "policy already exists" - 策略已存在，可以忽略
- 这些是正常的，因为脚本使用了 `IF NOT EXISTS`

---

## 🔄 重复运行 migrate_medications.sql

如果需要重新导入数据：

```sql
-- 先清空数据（⚠️ 注意：这会删除所有现有数据）
TRUNCATE TABLE symptom_medication_mapping CASCADE;
TRUNCATE TABLE medications CASCADE;

-- 然后重新运行 migrate_medications.sql
```

或者直接运行 `migrate_medications.sql`，它会使用 `ON CONFLICT DO NOTHING`，不会重复插入。

---

## 🛠️ 在 Table Editor 中查看数据

1. 在左侧菜单，点击 **"Table Editor"**
2. 你应该能看到所有表：
   - `medications` - 药物数据
   - `symptom_medication_mapping` - 症状-药物映射
   - `user_profiles` - 用户资料
   - `orders` - 订单
   - 等等...

3. 点击 `medications` 表，查看所有药物数据

---

## ❓ 常见问题

### Q: 找不到 SQL Editor？
A: 确保你已经登录并选择了正确的项目。SQL Editor 在左侧菜单栏中。

### Q: 运行后显示错误？
A: 
- 如果是 "already exists" 错误：可以忽略，说明表/策略已存在
- 如果是其他错误：检查 SQL 代码是否完整复制

### Q: 如何知道是否成功？
A: 
- 运行验证查询（见上面的"验证数据"部分）
- 在 Table Editor 中查看表是否有数据

### Q: 可以多次运行吗？
A: 
- `schema.sql`：可以，使用了 `IF NOT EXISTS` 和 `DROP POLICY IF EXISTS`
- `migrate_medications.sql`：可以，使用了 `ON CONFLICT DO NOTHING`

### Q: 数据没有导入？
A: 
1. 检查是否先运行了 `schema.sql`（必须先创建表）
2. 检查是否有错误信息
3. 运行验证查询检查数据

---

## 📋 完整操作清单

- [ ] 登录 Supabase Dashboard
- [ ] 打开 SQL Editor
- [ ] 运行 `schema.sql`（创建表结构）
- [ ] 运行 `migrate_medications.sql`（导入药物数据）
- [ ] 运行验证查询检查数据
- [ ] 在 Table Editor 中查看数据
- [ ] 测试应用功能

---

## 🎯 完成后的下一步

1. **测试应用**：
   - 刷新你的应用
   - 选择症状，查看是否能正常获取药物推荐
   - 完成一次订单流程

2. **检查控制台**：
   - 打开浏览器开发者工具（F12）
   - 查看 Console 标签，确认没有数据库错误

3. **验证功能**：
   - 应用应该自动从数据库读取药物数据
   - 如果数据库失败，会自动使用静态数据作为后备

---

## 💡 提示

- **快捷键**：使用 `Ctrl+Enter`（Windows）或 `Cmd+Enter`（Mac）快速运行查询
- **多标签页**：可以同时打开多个查询标签页
- **保存查询**：可以点击查询名称保存常用查询
- **历史记录**：SQL Editor 会保存你的查询历史

