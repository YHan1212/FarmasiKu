# Supabase 认证设置指南

## 🔧 解决注册和登录问题

### 问题 1: user_profiles 表为空

**原因**：触发器可能没有正确创建或执行。

**解决方案**：

1. **运行修复脚本**：
   - 在 Supabase SQL Editor 中运行 `database/fix_registration_issues.sql`
   - 这会重新创建触发器和 RLS 策略

2. **验证触发器**：
   - 运行 `database/diagnose_registration.sql` 检查触发器是否存在

3. **手动创建 profile**（临时方案）：
   - 运行 `database/fix_missing_profiles.sql` 为现有用户创建 profile

---

### 问题 2: 注册后登录显示"密码错误"

**原因**：Supabase 默认要求邮箱确认才能登录。

**解决方案**（选择其一）：

#### 方法 1: 禁用邮箱确认（推荐用于开发/测试）

1. 进入 Supabase Dashboard
2. 点击 **Authentication** → **Settings**
3. 找到 **"Enable email confirmations"** 选项
4. **关闭** 这个选项
5. 保存设置

这样用户注册后可以立即登录，无需确认邮箱。

#### 方法 2: 使用测试邮箱（用于开发）

1. 在 Supabase Dashboard 中
2. 进入 **Authentication** → **Settings**
3. 找到 **"Redirect URLs"**
4. 添加你的开发 URL（如 `http://localhost:3000`）
5. 在注册时使用真实的邮箱地址
6. 检查邮箱（包括垃圾邮件文件夹）获取确认链接

#### 方法 3: 在代码中处理（已实现）

代码已经处理了未确认邮箱的情况：
- 注册后会显示提示信息
- 但用户仍然可以继续使用应用
- 登录时会显示更友好的错误信息

---

## 📋 完整设置步骤

### 步骤 1: 运行修复脚本

在 Supabase SQL Editor 中运行：

```sql
-- 运行 database/fix_registration_issues.sql
```

这会：
- ✅ 重新创建触发器
- ✅ 修复 RLS 策略
- ✅ 为现有用户创建缺失的 profiles

### 步骤 2: 配置邮箱确认（可选）

**开发环境**：
- 关闭邮箱确认（方法 1）

**生产环境**：
- 保持邮箱确认开启
- 配置邮件服务（SMTP）

### 步骤 3: 测试注册流程

1. 清空所有用户数据（运行 `database/quick_clear.sql`）
2. 注册新用户
3. 检查 `user_profiles` 表是否有新记录
4. 尝试登录

---

## 🔍 诊断工具

### 检查触发器

```sql
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';
```

应该返回一行，显示触发器存在。

### 检查用户和 Profiles

```sql
SELECT 
  u.id,
  u.email,
  u.email_confirmed_at,
  p.id as profile_id
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
```

所有用户都应该有对应的 profile。

### 检查 RLS 策略

```sql
SELECT * FROM pg_policies 
WHERE tablename = 'user_profiles';
```

应该看到 3 个策略：SELECT、UPDATE、INSERT。

---

## ⚠️ 常见错误

### 错误 1: "Invalid login credentials"

**原因**：
- 邮箱未确认（如果启用了邮箱确认）
- 密码错误
- 用户不存在

**解决**：
- 检查 Supabase 的邮箱确认设置
- 确认密码正确
- 使用"忘记密码"功能重置

### 错误 2: "Profile creation failed"

**原因**：
- RLS 策略阻止插入
- 触发器没有执行
- 权限问题

**解决**：
- 运行 `database/fix_registration_issues.sql`
- 检查 RLS 策略是否正确
- 检查触发器是否存在

---

## 🎯 快速修复清单

- [ ] 运行 `database/fix_registration_issues.sql`
- [ ] 检查触发器是否存在（运行诊断脚本）
- [ ] 配置邮箱确认设置（开发环境建议关闭）
- [ ] 测试注册新用户
- [ ] 验证 profile 是否自动创建
- [ ] 测试登录功能

---

## 📞 需要帮助？

如果问题仍然存在：

1. 运行 `database/diagnose_registration.sql` 获取诊断信息
2. 检查 Supabase Dashboard 的日志（Logs → Postgres Logs）
3. 检查浏览器控制台的错误信息
4. 确认 `.env` 文件中的 Supabase 配置正确

