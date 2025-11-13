# 药物数据迁移指南

## 迁移步骤

### 1. 运行数据库架构更新

在 Supabase SQL Editor 中运行 `database/schema.sql` 文件（如果之前已经运行过，可以只运行新增的部分）。

新增的表：
- `medications` - 存储药物信息
- `symptom_medication_mapping` - 存储症状-药物映射关系

### 2. 运行数据迁移脚本

在 Supabase SQL Editor 中运行 `database/migrate_medications.sql` 文件。

这个脚本会：
- 将所有药物数据导入 `medications` 表
- 创建症状-药物映射关系

### 3. 验证迁移

运行以下查询验证数据：

```sql
-- 检查药物数量
SELECT COUNT(*) FROM medications;

-- 检查映射数量
SELECT COUNT(*) FROM symptom_medication_mapping;

-- 查看示例数据
SELECT * FROM medications LIMIT 5;
```

## 功能说明

### 数据库优先，静态数据作为后备

应用会：
1. **首先尝试从数据库获取药物数据**
2. **如果数据库失败或未配置，自动使用静态数据（appData.js）**

这确保了：
- ✅ 即使数据库有问题，应用仍能正常工作
- ✅ 可以逐步迁移，无需一次性完成
- ✅ 支持动态管理药物（价格、库存等）

### 使用数据库的优势

- 📊 **动态管理**：可以通过 Supabase Dashboard 直接更新药物信息
- 💰 **价格更新**：无需重新部署代码即可更新价格
- 📦 **库存管理**：可以添加库存字段（未来扩展）
- 🔍 **搜索功能**：可以添加药物搜索功能（未来扩展）

## 注意事项

1. **RLS 策略**：药物表设置为公开读取，任何人都可以查看活跃的药物
2. **数据完整性**：迁移脚本使用 `ON CONFLICT DO NOTHING`，可以安全地多次运行
3. **向后兼容**：如果数据库未配置或查询失败，会自动使用静态数据

## 未来扩展

可以考虑添加：
- 药物图片
- 药物描述
- 库存管理
- 药物分类
- 用户评价
- 药物搜索功能

