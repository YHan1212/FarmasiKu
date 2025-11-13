# 修复登录问题："Invalid email or password"

## 🔍 问题诊断

如果注册后无法登录，通常是以下原因之一：

### 1. 邮箱未确认（最常见）

Supabase 默认要求用户确认邮箱后才能登录。

**检查方法**：
在 Supabase SQL Editor 中运行 `database/check_user_status.sql`，查看 `email_confirmed_at` 是否为 `NULL`。

---

## ✅ 解决方案

### 方法 1: 关闭邮箱确认（推荐用于开发/测试）

**步骤**：
1. 进入 Supabase Dashboard
2. 点击 **Authentication** → **Settings**
3. 找到 **"Enable email confirmations"** 选项
4. **关闭** 这个选项（切换为 OFF）
5. 点击 **Save**

**效果**：
- 新用户注册后可以立即登录
- 无需确认邮箱

---

### 方法 2: 手动验证用户邮箱

**步骤**：
1. 进入 Supabase Dashboard
2. 点击 **Authentication** → **Users**
3. 找到你的用户
4. 点击用户行进入详情
5. 找到 **"Email Confirmed"** 字段
6. 手动设置为 **Confirmed**（或点击验证按钮）

**或者使用 SQL**：
在 Supabase SQL Editor 中运行：

```sql
-- 手动验证特定用户的邮箱
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'your-email@example.com';  -- 替换为你的邮箱
```

---

### 方法 3: 检查邮箱并点击确认链接

**步骤**：
1. 检查注册时使用的邮箱（包括垃圾邮件文件夹）
2. 查找来自 Supabase 的确认邮件
3. 点击邮件中的确认链接
4. 然后尝试登录

---

### 方法 4: 使用忘记密码功能

如果邮箱确认有问题，可以重置密码：

1. 在登录页面点击 **"Forgot password?"**
2. 输入你的邮箱
3. 检查邮箱并重置密码
4. 使用新密码登录

---

## 🧪 测试步骤

### 1. 检查用户状态

运行 `database/check_user_status.sql`，查看：
- `email_confirmed_at` 是否为 `NULL`
- 用户是否存在

### 2. 关闭邮箱确认（推荐）

在 Supabase Dashboard 中关闭邮箱确认功能。

### 3. 重新测试

1. 清空所有用户（运行 `database/quick_clear.sql`）
2. 注册新用户
3. 立即尝试登录
4. 应该可以成功登录

---

## 📋 快速修复清单

- [ ] 运行 `database/check_user_status.sql` 检查用户状态
- [ ] 在 Supabase Dashboard 中关闭邮箱确认
- [ ] 或者手动验证用户邮箱
- [ ] 重新测试注册和登录

---

## ⚠️ 注意事项

- **开发环境**：建议关闭邮箱确认，方便测试
- **生产环境**：建议开启邮箱确认，提高安全性
- 关闭邮箱确认后，新注册的用户可以立即登录
- 已注册但未确认的用户，需要手动验证或重新注册

---

## 🔧 如果还是不行

1. **检查密码**：
   - 确认密码正确（注意大小写）
   - 确认没有多余空格

2. **检查邮箱**：
   - 确认邮箱地址拼写正确
   - 确认使用的是注册时的邮箱

3. **重新注册**：
   - 使用不同的邮箱重新注册
   - 或者删除旧用户后重新注册

4. **查看错误日志**：
   - 打开浏览器控制台（F12）
   - 查看 Console 中的详细错误信息
   - 在 Supabase Dashboard 中查看 **Logs** → **Auth Logs**

