# Vercel 环境变量设置指南

## 🔧 在 Vercel Dashboard 中设置环境变量

### 步骤 1: 进入项目设置
1. 登录 Vercel Dashboard: https://vercel.com/dashboard
2. 选择你的项目：`FarmasiKu`
3. 点击 **Settings**（设置）

### 步骤 2: 添加环境变量
1. 在左侧菜单点击 **Environment Variables**（环境变量）
2. 点击 **Add** 按钮

### 步骤 3: 添加第一个变量
- **Key**: `VITE_SUPABASE_URL`
- **Value**: `https://jkbuoszyjleuxkkolzcy.supabase.co`
- **Environment**: 选择所有三个选项：
  - ✅ Production
  - ✅ Preview  
  - ✅ Development
- 点击 **Save**

### 步骤 4: 添加第二个变量
- **Key**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprYnVvc3p5amxldXhra29semN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NTY1NDYsImV4cCI6MjA3ODMzMjU0Nn0.CLtF66dhfDmJQFP2nqS-gFpyQMC_vA0HCuwmzSZ5DXA`
- **Environment**: 选择所有三个选项：
  - ✅ Production
  - ✅ Preview
  - ✅ Development
- 点击 **Save**

### 步骤 5: 重新部署
添加环境变量后，必须重新部署才能生效：
1. 点击 **Deployments**（部署）
2. 找到最新的部署
3. 点击右侧的 **"..."** 菜单
4. 选择 **Redeploy**
5. 确认重新部署

---

## ⚠️ 重要提示

1. **环境变量必须添加**：没有这些变量，应用无法连接 Supabase 数据库
2. **必须重新部署**：添加环境变量后，必须重新部署才能生效
3. **检查部署日志**：如果部署失败，查看部署日志中的错误信息

---

## 🔍 验证环境变量

部署后，可以通过以下方式验证：

1. **检查应用功能**：
   - 尝试登录/注册
   - 如果出现 "Supabase is not configured" 错误，说明环境变量未正确设置

2. **检查构建日志**：
   - 在 Vercel Dashboard → Deployments → 点击部署
   - 查看 Build Logs
   - 确认没有环境变量相关的错误

---

## 📝 如果看不到配置选项

如果 Vercel 自动检测了配置（Vite），你可能需要：

1. **手动配置**：
   - 在导入项目时，点击 "Override" 或 "Configure"
   - 手动设置：
     - Framework: Vite
     - Build Command: `npm run build`
     - Output Directory: `dist`

2. **或者部署后修改**：
   - 进入项目 Settings → General
   - 找到 "Build & Development Settings"
   - 点击 "Override" 进行修改

---

## 🆘 常见问题

### Q: 部署后应用显示空白页面
**A**: 检查环境变量是否正确添加，并确保已重新部署

### Q: 无法登录/注册
**A**: 检查 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 是否正确

### Q: 构建失败
**A**: 查看构建日志，通常是依赖问题或环境变量问题

---

**完成环境变量设置后，应用应该可以正常工作了！** ✅

