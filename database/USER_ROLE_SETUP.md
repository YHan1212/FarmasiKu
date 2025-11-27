# 用户角色系统设置指南

## 📋 概述

系统现在支持两种用户角色：
- **普通用户 (user)**: 默认角色，可以购买药物、咨询医生等
- **管理员 (admin)**: 可以访问管理面板，管理药物、用户、订单等

---

## 🔧 设置步骤

### 步骤 1: 运行数据库脚本

在 Supabase SQL Editor 中运行以下脚本：

```sql
-- 文件位置: database/add_user_role.sql
```

这个脚本会：
- 在 `user_profiles` 表中添加 `role` 字段
- 为现有用户设置默认角色为 `user`
- 创建角色检查函数
- 更新 RLS 策略以支持管理员权限

---

## 👤 如何设置管理员

### 方法 1: 通过 Supabase SQL Editor（推荐）

1. 登录 Supabase Dashboard
2. 打开 SQL Editor
3. 运行以下 SQL（替换 `用户的 UUID` 为实际用户 ID）：

```sql
-- 将用户设置为管理员
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE id = '用户的 UUID';

-- 查看所有管理员
SELECT id, role FROM public.user_profiles WHERE role = 'admin';
```

### 方法 2: 通过 Admin 面板

1. 使用已设置为管理员的账户登录
2. 点击 "Admin" 按钮
3. 切换到 "Users" 标签
4. 找到要设置为管理员的用户
5. 点击 "Make Admin" 按钮

---

## 🔐 权限说明

### 普通用户 (user)
- ✅ 可以购买药物
- ✅ 可以咨询医生
- ✅ 可以查看自己的订单
- ✅ 可以查看自己的咨询记录
- ❌ 无法访问管理面板
- ❌ 无法管理其他用户
- ❌ 无法管理药物库存

### 管理员 (admin)
- ✅ 拥有普通用户的所有权限
- ✅ 可以访问管理面板
- ✅ 可以管理药物（添加、编辑、删除）
- ✅ 可以管理用户角色
- ✅ 可以查看所有订单
- ✅ 可以管理医生账户
- ✅ 可以查看统计数据

---

## 🎯 功能说明

### 1. 角色显示
- 普通用户：在用户列表中显示 "👤 User"
- 管理员：在用户列表中显示 "👑 Admin"

### 2. Admin 按钮
- 只有管理员才能看到和使用 "Admin" 按钮
- 普通用户登录后不会看到此按钮

### 3. 用户管理
- 管理员可以在 Admin → Users 中：
  - 查看所有用户
  - 查看用户角色
  - 切换用户角色（Make Admin / Remove Admin）

---

## 📝 注意事项

1. **默认角色**: 新注册的用户默认为 `user` 角色
2. **安全性**: 只有管理员可以修改用户角色
3. **RLS 策略**: 数据库已配置 Row Level Security，确保数据安全
4. **第一个管理员**: 需要手动在数据库中设置第一个管理员

---

## 🚀 快速开始

1. **运行数据库脚本** (`database/add_user_role.sql`)
2. **设置第一个管理员**:
   ```sql
   -- 找到你的用户 ID（在 Supabase Auth → Users 中）
   -- 然后运行：
   UPDATE public.user_profiles 
   SET role = 'admin' 
   WHERE id = '你的用户 UUID';
   ```
3. **重新登录**，你应该能看到 "Admin" 按钮
4. **测试功能**:
   - 访问 Admin 面板
   - 查看 Users 标签
   - 尝试切换其他用户的角色

---

## ❓ 常见问题

### Q: 如何查看我的用户 ID？
A: 在 Supabase Dashboard → Authentication → Users 中查看

### Q: 如何撤销管理员权限？
A: 在 Admin → Users 中，点击 "Remove Admin" 按钮

### Q: 普通用户能看到 Admin 按钮吗？
A: 不能，只有管理员才能看到和使用 Admin 按钮

### Q: 可以同时有多个管理员吗？
A: 可以，系统支持多个管理员

---

## 🔍 验证设置

运行以下 SQL 检查设置是否正确：

```sql
-- 检查 role 字段是否存在
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' AND column_name = 'role';

-- 查看所有用户及其角色
SELECT id, role, created_at 
FROM public.user_profiles 
ORDER BY created_at DESC;

-- 查看所有管理员
SELECT id, role 
FROM public.user_profiles 
WHERE role = 'admin';
```

---

完成！现在你的系统已经支持用户角色分离了！🎉

