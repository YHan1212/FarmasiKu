# 登录问题排查指南

## ❌ "Invalid login credentials" 错误

### 可能的原因和解决方案

#### 1. 邮箱或密码错误
**检查**：
- 确认邮箱地址拼写正确
- 确认密码正确（注意大小写）
- 确认没有多余的空格

**解决**：
- 使用 "Forgot password?" 重置密码
- 或者重新注册一个新账户

#### 2. 用户还没有注册
**检查**：
- 确认你已经在应用中注册过账户

**解决**：
- 点击 "Sign up" 注册新账户
- 或者使用 "Continue as Guest" 以访客身份使用

#### 3. 邮箱未验证（如果启用了邮箱验证）
**检查**：
- 在 Supabase Dashboard 中检查 Authentication → Users
- 查看用户的 `email_confirmed_at` 字段

**解决**：
- 检查邮箱收件箱（包括垃圾邮件文件夹）
- 点击验证链接
- 或者在 Supabase Dashboard 中手动验证用户

#### 4. Supabase 配置问题
**检查**：
- 确认 `.env` 文件中的 Supabase URL 和 Key 正确
- 确认 Supabase 项目处于活动状态

**解决**：
- 检查 `.env` 文件
- 重启开发服务器

---

## 🔧 在 Supabase Dashboard 中检查用户

### 步骤：

1. 登录 Supabase Dashboard
2. 进入 **Authentication** → **Users**
3. 查找你的邮箱地址
4. 检查：
   - **Email Confirmed**: 是否已验证
   - **Created At**: 账户创建时间
   - **Last Sign In**: 最后登录时间

### 手动验证邮箱（如果需要）

在 Supabase Dashboard 中：
1. 找到用户
2. 点击用户行
3. 在用户详情中，可以手动验证邮箱

---

## 🧪 测试步骤

### 1. 确认账户存在
在 Supabase SQL Editor 中运行：
```sql
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
WHERE email = 'your-email@example.com';
```

### 2. 测试注册新账户
1. 注册一个新账户
2. 使用新账户登录
3. 如果新账户可以登录，说明是旧账户的问题

### 3. 重置密码
1. 点击 "Forgot password?"
2. 输入邮箱
3. 检查邮箱并重置密码
4. 使用新密码登录

---

## 💡 常见问题

### Q: 注册后无法登录？
A: 可能是邮箱验证问题。检查：
- Supabase 是否启用了邮箱验证
- 邮箱是否收到验证邮件
- 是否点击了验证链接

### Q: 密码明明是对的，但还是报错？
A: 检查：
- 是否有大小写错误
- 是否有空格
- 是否使用了正确的邮箱地址

### Q: 如何禁用邮箱验证？
A: 在 Supabase Dashboard 中：
1. 进入 **Authentication** → **Providers** → **Email**
2. 关闭 **"Confirm email"** 选项

---

## 🔍 调试技巧

### 1. 检查浏览器控制台
打开开发者工具（F12），查看 Console 标签中的错误信息

### 2. 检查网络请求
在 Network 标签中查看登录请求的响应

### 3. 检查 Supabase 日志
在 Supabase Dashboard 中查看 **Logs** → **Auth Logs**

---

## ✅ 快速解决方案

1. **使用忘记密码功能**：
   - 点击 "Forgot password?"
   - 重置密码
   - 使用新密码登录

2. **重新注册**：
   - 使用不同的邮箱注册新账户
   - 或者删除旧账户后重新注册

3. **以访客身份使用**：
   - 点击 "Continue as Guest"
   - 可以正常使用应用，只是无法保存订单历史

