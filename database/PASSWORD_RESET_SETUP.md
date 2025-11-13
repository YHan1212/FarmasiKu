# 密码重置功能设置指南

## ✅ 已完成的功能

1. **忘记密码页面** (`ForgotPassword.jsx`)
   - 用户输入邮箱
   - 发送密码重置邮件

2. **重置密码页面** (`ResetPassword.jsx`)
   - 用户从邮件链接进入
   - 设置新密码

3. **登录页面集成**
   - 添加了 "Forgot password?" 链接

## 🔧 Supabase 配置

### 步骤 1：配置重定向 URL

1. 登录 Supabase Dashboard
2. 进入你的项目
3. 点击左侧菜单 **"Authentication"** → **"URL Configuration"**
4. 在 **"Redirect URLs"** 中添加：
   ```
   http://localhost:3000
   http://localhost:3000?type=recovery
   ```
   如果是生产环境，也要添加：
   ```
   https://yourdomain.com
   https://yourdomain.com?type=recovery
   ```

### 步骤 2：配置邮件模板（可选）

1. 在 Supabase Dashboard 中
2. 点击 **"Authentication"** → **"Email Templates"**
3. 选择 **"Reset Password"** 模板
4. 可以自定义邮件内容（可选）

## 📧 邮件配置

Supabase 默认使用自己的邮件服务，但你可以：

1. **使用自定义 SMTP**（推荐用于生产环境）：
   - 在 **"Authentication"** → **"SMTP Settings"** 中配置
   - 使用你自己的邮件服务（如 SendGrid, AWS SES 等）

2. **使用默认邮件服务**：
   - Supabase 免费账户提供有限的邮件发送
   - 适合开发和测试

## 🧪 测试步骤

1. **测试忘记密码**：
   - 在登录页面点击 "Forgot password?"
   - 输入已注册的邮箱
   - 检查邮箱是否收到重置链接

2. **测试重置密码**：
   - 点击邮件中的重置链接
   - 应该自动跳转到重置密码页面
   - 输入新密码并确认
   - 成功后自动跳转到登录页面

## ⚠️ 注意事项

1. **重定向 URL 必须匹配**：
   - Supabase 会验证重定向 URL
   - 确保添加的 URL 与你的应用地址完全一致

2. **开发环境**：
   - 使用 `http://localhost:3000`
   - 确保端口号正确

3. **生产环境**：
   - 使用你的实际域名
   - 确保使用 HTTPS

4. **邮件可能进入垃圾箱**：
   - 检查垃圾邮件文件夹
   - 如果使用自定义 SMTP，配置 SPF/DKIM 记录

## 🔍 故障排查

### 问题：没有收到邮件
- 检查 Supabase Dashboard 中的邮件日志
- 确认邮箱地址正确
- 检查垃圾邮件文件夹
- 确认 Supabase 邮件服务正常

### 问题：重置链接无效
- 检查重定向 URL 是否在 Supabase 中配置
- 确认链接没有过期（通常 1 小时有效）
- 检查 URL 参数是否正确

### 问题：重置后无法登录
- 确认新密码符合要求（至少 6 个字符）
- 确认两次输入的密码一致
- 检查浏览器控制台是否有错误

## 📝 使用流程

1. 用户在登录页面点击 "Forgot password?"
2. 输入注册邮箱
3. 收到密码重置邮件
4. 点击邮件中的链接
5. 自动跳转到重置密码页面
6. 输入新密码并确认
7. 密码重置成功，自动跳转到登录页面
8. 使用新密码登录

