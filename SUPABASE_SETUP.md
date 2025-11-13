# Supabase 数据库设置指南

## 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 注册/登录账户（免费账户即可）
3. 点击 "New Project" 创建新项目
4. 填写项目信息：
   - **Project Name**: `farmasiku` (或任何你喜欢的名称)
   - **Database Password**: 设置一个强密码（请保存好，以后需要用到）
   - **Region**: 选择离你最近的区域（如 `Southeast Asia (Singapore)`）

## 2. 获取 API 密钥

1. 在 Supabase 项目仪表板中，点击左侧菜单的 **Settings** (齿轮图标)
2. 选择 **API** 选项
3. 复制以下信息：
   - **Project URL** (例如: `https://abcdefghijklmnop.supabase.co`)
   - **anon public key** (anon key，以 `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` 开头)

## 3. 配置环境变量

1. 在项目根目录创建 `.env` 文件（如果还没有）
2. 添加以下内容：

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**示例：**
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzIwMCwiZXhwIjoxOTU0NTQzMjAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **重要**: `.env` 文件已添加到 `.gitignore`，不会被提交到 Git

## 4. 创建数据库表

1. 在 Supabase 项目仪表板中，点击左侧菜单的 **SQL Editor**
2. 点击 "New Query" 按钮
3. 打开项目中的 `database/schema.sql` 文件
4. 复制文件中的所有 SQL 代码
5. 粘贴到 Supabase SQL Editor 中
6. 点击 "Run" 按钮执行 SQL

这将创建以下表：
- `user_profiles` - 用户资料
- `symptom_assessments` - 症状评估记录
- `consultations` - 咨询记录
- `orders` - 订单
- `order_items` - 订单项目

## 5. 验证表创建

1. 在 Supabase 仪表板中，点击左侧菜单的 **Table Editor**
2. 你应该能看到所有创建的表
3. 检查每个表的结构是否正确

## 6. 配置 Row Level Security (RLS)

SQL 脚本已经包含了 RLS 策略，确保：
- 用户只能访问自己的数据
- 匿名用户可以通过 `session_id` 访问自己的数据
- 数据安全受到保护

## 7. 测试连接

1. 重启开发服务器（如果正在运行）：
   ```bash
   npm run dev
   ```

2. 在浏览器中打开应用
3. 完成一次完整的流程（选择症状、订购药物）
4. 在 Supabase 仪表板的 **Table Editor** 中查看数据是否已保存

## 8. 查看数据

### 查看订单：
1. 在 Supabase 仪表板中，点击 **Table Editor**
2. 选择 `orders` 表
3. 查看所有订单记录

### 查看订单项目：
1. 选择 `order_items` 表
2. 查看每个订单包含的药物

### 查看症状评估：
1. 选择 `symptom_assessments` 表
2. 查看所有症状评估记录

## 故障排除

### 问题：无法连接到 Supabase
- 检查 `.env` 文件中的 URL 和 Key 是否正确
- 确保没有多余的空格或引号
- 重启开发服务器

### 问题：RLS 策略阻止插入数据
- 检查 SQL 脚本是否完全执行
- 在 Supabase 仪表板的 **Authentication** → **Policies** 中查看策略
- 确保策略允许通过 `session_id` 插入数据

### 问题：数据没有保存
- 打开浏览器控制台（F12）查看错误信息
- 检查 Supabase 项目是否处于活动状态
- 确认 API 密钥有正确的权限

## 8. 控制数据库日志（可选）

如果你想关闭数据库错误日志，可以在 `.env` 文件中添加：

```env
VITE_ENABLE_DB_LOGGING=false
```

这样数据库错误就不会在浏览器控制台显示。

**注意**：
- 如果数据库未配置或未运行 SQL schema，应用仍可正常运行
- 数据库错误不会中断用户流程
- 数据保存失败时应用会静默继续

## 注意事项

- **免费账户限制**: Supabase 免费账户有使用限制，但对于开发和小型应用足够使用
- **数据安全**: RLS 策略确保用户只能访问自己的数据
- **匿名用户**: 应用使用 `session_id` 来跟踪匿名用户的数据
- **生产环境**: 部署到生产环境时，确保设置正确的环境变量
- **静默模式**: 如果数据库未配置，应用会自动跳过数据库操作，不会显示错误

## 下一步

- 可以添加用户认证功能（使用 Supabase Auth）
- 可以创建订单历史页面
- 可以添加数据分析功能
