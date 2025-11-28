# 完整数据库设置指南

本指南提供 FarmasiKu 应用的完整数据库设置步骤，按正确顺序执行所有必要的 SQL 脚本。

---

## 📋 目录

1. [基础设置](#基础设置)
2. [用户角色系统](#用户角色系统)
3. [咨询系统](#咨询系统)
4. [实时咨询系统](#实时咨询系统)
5. [配送系统](#配送系统)
6. [RLS 策略修复](#rls-策略修复)
7. [Realtime 启用](#realtime-启用)
8. [验证和测试](#验证和测试)

---

## 🚀 基础设置

### 步骤 1: 创建基础表结构

**文件**: `schema.sql`

在 Supabase SQL Editor 中运行此脚本，创建所有基础表：
- `user_profiles` - 用户资料
- `medications` - 药物信息
- `orders` - 订单
- `order_items` - 订单项
- 所有相关的 RLS 策略和索引

```sql
-- 运行 database/schema.sql
```

---

### 步骤 2: 迁移药物数据

**文件**: `migrate_medications.sql`

导入初始药物数据到 `medications` 表。

```sql
-- 运行 database/migrate_medications.sql
```

---

### 步骤 3: 创建用户 Profile 触发器

**文件**: `create_profile_trigger.sql`

设置自动为新注册用户创建 profile 的触发器。

```sql
-- 运行 database/create_profile_trigger.sql
```

---

## 👥 用户角色系统

### 步骤 4: 添加用户角色功能

**文件**: `add_user_role.sql` 或 `fix_rls_recursion.sql`

添加 `role` 列到 `user_profiles` 表，并设置 RLS 策略。

**注意**: 如果遇到 "infinite recursion" 错误，运行 `fix_rls_recursion.sql` 而不是 `add_user_role.sql`。

```sql
-- 运行 database/fix_rls_recursion.sql
-- 或 database/add_user_role.sql（如果 fix_rls_recursion.sql 已运行）
```

**功能**:
- ✅ 添加 `role` 列（'user' 或 'admin'）
- ✅ 创建 `is_current_user_admin()` 函数
- ✅ 设置 RLS 策略允许管理员查看所有用户

**设置管理员**:
```sql
UPDATE public.user_profiles
SET role = 'admin'
WHERE id = 'YOUR_USER_ID';
```

---

## 💬 咨询系统

### 步骤 5: 创建咨询相关表

**文件**: `consultation_schema.sql`

创建基础咨询系统的表：
- `doctors` - 医生/药剂师信息
- `consultation_sessions` - 咨询会话
- `consultation_messages` - 咨询消息

```sql
-- 运行 database/consultation_schema.sql
```

---

### 步骤 6: 添加医生管理权限

**文件**: `add_doctors_delete_policy.sql`

允许管理员管理医生/药剂师信息。

```sql
-- 运行 database/add_doctors_delete_policy.sql
```

---

### 步骤 7: 添加药物库存字段

**文件**: `add_stock_column.sql`

添加 `stock` 列到 `medications` 表。

```sql
-- 运行 database/add_stock_column.sql
```

---

### 步骤 8: 添加药物更新权限

**文件**: `add_medications_update_policy.sql`

允许管理员更新药物价格和库存。

```sql
-- 运行 database/add_medications_update_policy.sql
```

---

### 步骤 9: 修复外键约束

**文件**: `fix_foreign_key_constraint.sql`

修复 `consultation_sessions.doctor_id` 的外键约束，允许删除医生时自动设置为 NULL。

```sql
-- 运行 database/fix_foreign_key_constraint.sql
```

---

## ⚡ 实时咨询系统

### 步骤 10: 创建实时咨询表

**文件**: `realtime_consultation_schema.sql`

创建实时咨询系统所需的表：
- `consultation_queue` - 咨询队列
- `pharmacist_availability` - 药剂师在线状态
- `consultation_medications` - 药物推荐
- 扩展 `consultation_sessions` 表

```sql
-- 运行 database/realtime_consultation_schema.sql
```

---

### 步骤 11: 修复药剂师可用性 RLS

**文件**: `fix_pharmacist_availability_rls_policies.sql`

设置 RLS 策略，允许：
- 药剂师查看和更新自己的在线状态
- 所有用户查看在线且不忙碌的药剂师
- 管理员查看所有药剂师状态

```sql
-- 运行 database/fix_pharmacist_availability_rls_policies.sql
```

---

### 步骤 12: 修复药剂师查看队列权限

**文件**: `fix_pharmacist_view_all_waiting_queues.sql`

允许药剂师查看所有等待中的队列并接受咨询。

```sql
-- 运行 database/fix_pharmacist_view_all_waiting_queues.sql
```

---

### 步骤 13: 允许管理员查看所有队列

**文件**: `allow_admin_view_all_queues.sql`

允许管理员查看所有等待中的咨询队列（即使没有链接药剂师账号）。

```sql
-- 运行 database/allow_admin_view_all_queues.sql
```

---

### 步骤 14: 修复药剂师查看会话权限

**文件**: `fix_pharmacist_view_all_sessions.sql`

允许任何链接的药剂师查看和访问所有会话。

```sql
-- 运行 database/fix_pharmacist_view_all_sessions.sql
```

---

### 步骤 15: 修复药物推荐查看权限

**文件**: `fix_consultation_medications_view_policy.sql`

允许患者和药剂师查看会话中的药物推荐。

```sql
-- 运行 database/fix_consultation_medications_view_policy.sql
```

---

### 步骤 16: 修复咨询消息和药物 RLS

**文件**: `fix_consultation_rls_for_testing.sql`

修复 `consultation_messages` 和 `consultation_medications` 的 INSERT RLS 策略。

```sql
-- 运行 database/fix_consultation_rls_for_testing.sql
```

---

## 🚚 配送系统

### 步骤 17: 创建配送相关表

**文件**: `delivery_schema.sql`

创建配送系统所需的表：
- `user_addresses` - 用户地址
- 扩展 `orders` 表（添加配送字段）

```sql
-- 运行 database/delivery_schema.sql
```

---

### 步骤 18: 添加用户确认配送权限

**文件**: `add_user_confirm_delivery_policy.sql`

允许用户确认自己的订单已送达。

```sql
-- 运行 database/add_user_confirm_delivery_policy.sql
```

---

### 步骤 19: 添加管理员查看订单权限

**文件**: `add_admin_orders_policy.sql`

允许管理员查看所有订单和订单项。

```sql
-- 运行 database/add_admin_orders_policy.sql
```

---

## 🔄 Realtime 启用

### 步骤 20: 启用 Realtime

**文件**: `enable_realtime_for_consultation.sql`

将咨询相关表添加到 Supabase Realtime 发布中。

```sql
-- 运行 database/enable_realtime_for_consultation.sql
```

**注意**: 此脚本是幂等的，可以安全地多次运行。

---

## ✅ 验证和测试

### 验证表是否存在

```sql
-- 检查所有表是否已创建
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_profiles',
  'medications',
  'orders',
  'order_items',
  'doctors',
  'consultation_sessions',
  'consultation_messages',
  'consultation_queue',
  'pharmacist_availability',
  'consultation_medications',
  'user_addresses'
)
ORDER BY table_name;

-- 应该返回 11 行
```

---

### 验证 RLS 策略

```sql
-- 检查 RLS 是否已启用
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'user_profiles',
  'medications',
  'orders',
  'doctors',
  'consultation_sessions',
  'consultation_queue',
  'pharmacist_availability'
);

-- 所有表的 rowsecurity 应该为 true
```

---

### 验证 Realtime 设置

**文件**: `verify_realtime_setup.sql`

```sql
-- 运行 database/verify_realtime_setup.sql
```

---

## 📝 快速设置清单

按顺序运行以下脚本：

- [ ] `schema.sql`
- [ ] `migrate_medications.sql`
- [ ] `create_profile_trigger.sql`
- [ ] `fix_rls_recursion.sql`
- [ ] `consultation_schema.sql`
- [ ] `add_doctors_delete_policy.sql`
- [ ] `add_stock_column.sql`
- [ ] `add_medications_update_policy.sql`
- [ ] `fix_foreign_key_constraint.sql`
- [ ] `realtime_consultation_schema.sql`
- [ ] `fix_pharmacist_availability_rls_policies.sql`
- [ ] `fix_pharmacist_view_all_waiting_queues.sql`
- [ ] `allow_admin_view_all_queues.sql`
- [ ] `fix_pharmacist_view_all_sessions.sql`
- [ ] `fix_consultation_medications_view_policy.sql`
- [ ] `fix_consultation_rls_for_testing.sql`
- [ ] `delivery_schema.sql`
- [ ] `add_user_confirm_delivery_policy.sql`
- [ ] `add_admin_orders_policy.sql`
- [ ] `enable_realtime_for_consultation.sql`

---

## ⚠️ 常见问题

### 错误: "relation does not exist"
**原因**: 表还没有创建  
**解决**: 运行对应的 `schema.sql` 脚本

### 错误: "permission denied" 或 "new row violates row-level security policy"
**原因**: RLS 策略没有设置或设置不正确  
**解决**: 运行对应的 RLS 修复脚本

### 错误: "infinite recursion detected in policy"
**原因**: RLS 策略存在递归问题  
**解决**: 运行 `fix_rls_recursion.sql`

### 错误: "column does not exist"
**原因**: 表结构没有更新  
**解决**: 运行对应的 ALTER TABLE 脚本

### 错误: "already member of publication"
**原因**: 表已经添加到 Realtime 发布中  
**解决**: 这是正常的，可以忽略（`enable_realtime_for_consultation.sql` 是幂等的）

---

## 🔧 维护脚本

### 清理测试数据

**文件**: `cleanup_test_sessions.sql` 或 `cleanup_old_queues.sql`

```sql
-- 查看和清理测试会话/队列
-- 运行 database/cleanup_test_sessions.sql
-- 或 database/cleanup_old_queues.sql
```

---

### 检查自动匹配触发器

**文件**: `check_auto_matching_triggers.sql`

```sql
-- 检查是否有自动匹配的触发器
-- 运行 database/check_auto_matching_triggers.sql
```

---

## 📚 相关文档

- `SETUP_CONSULTATION.md` - 咨询功能设置指南
- `REALTIME_CONSULTATION_SYSTEM.md` - 实时咨询系统文档
- `CONSULTATION_FLOW.md` - 咨询流程文档
- `SQL_FILES_GUIDE.md` - SQL 文件分类指南

---

## 🎯 完成！

设置完成后，你应该能够：

- ✅ 用户注册和登录
- ✅ 管理员管理药物和订单
- ✅ 用户创建咨询请求
- ✅ 药剂师接受咨询并聊天
- ✅ 药剂师推荐药物
- ✅ 用户确认药物并下单
- ✅ 订单配送跟踪

如有问题，请参考相应的错误修复脚本或联系技术支持。

