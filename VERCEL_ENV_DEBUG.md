# Vercel 环境变量调试指南

## 🔍 问题：显示 "Database not configured"

这个错误表示应用无法读取到 Supabase 环境变量。

---

## ✅ 解决步骤

### 步骤 1: 确认环境变量已添加

1. 打开 Vercel Dashboard: https://vercel.com/dashboard
2. 选择项目：**FarmasiKu**
3. 点击 **Settings** → **Environment Variables**
4. 确认以下两个变量存在：
   - ✅ `VITE_SUPABASE_URL`
   - ✅ `VITE_SUPABASE_ANON_KEY`

### 步骤 2: 检查环境变量值

**重要检查点：**

1. **没有引号**
   - ❌ 错误：`"https://jkbuoszyjleuxkkolzcy.supabase.co"`
   - ✅ 正确：`https://jkbuoszyjleuxkkolzcy.supabase.co`

2. **没有前后空格**
   - ❌ 错误：` https://jkbuoszyjleuxkkolzcy.supabase.co `（有空格）
   - ✅ 正确：`https://jkbuoszyjleuxkkolzcy.supabase.co`

3. **完整值**
   - 确保 API key 是完整的，没有截断

### 步骤 3: 确认所有环境都设置了

在 Vercel 环境变量设置中，确保两个变量都选择了：
- ✅ Production
- ✅ Preview
- ✅ Development

### 步骤 4: 重新部署（必须！）

**重要：添加或修改环境变量后，必须重新部署！**

1. 进入 **Deployments** 页面
2. 找到最新的部署
3. 点击右侧 **"..."** → **Redeploy**
4. 等待部署完成

### 步骤 5: 检查构建日志

1. 在 **Deployments** 页面，点击最新的部署
2. 查看 **Build Logs**
3. 检查是否有环境变量相关的错误

---

## 🧪 验证环境变量是否生效

### 方法 1: 检查浏览器控制台

部署后，访问应用并打开浏览器控制台（F12），运行：

```javascript
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
console.log('Key length:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length);
```

**如果看到：**
- `URL: undefined` → 环境变量未设置
- `Key exists: false` → 环境变量未设置
- `Key length: undefined` → 环境变量未设置

**如果看到：**
- `URL: https://jkbuoszyjleuxkkolzcy.supabase.co` → ✅ 正确
- `Key exists: true` → ✅ 正确
- `Key length: 200+` → ✅ 正确（API key 通常很长）

### 方法 2: 检查应用行为

- ❌ 如果看到 "Database not configured" → 环境变量未生效
- ✅ 如果能看到登录页面且可以注册/登录 → 环境变量已生效

---

## 🔧 常见问题和解决方案

### 问题 1: 环境变量已添加但应用仍显示错误

**原因**：没有重新部署

**解决**：
1. 进入 Deployments 页面
2. 点击最新部署的 **"..."** → **Redeploy**
3. 等待部署完成

### 问题 2: 构建日志显示环境变量错误

**原因**：环境变量格式错误

**解决**：
1. 删除旧的环境变量
2. 重新添加，确保：
   - 没有引号
   - 没有前后空格
   - 值完整

### 问题 3: 本地正常，Vercel 失败

**原因**：环境变量只在本地 `.env` 文件中，未在 Vercel 设置

**解决**：
1. 在 Vercel Dashboard 中添加环境变量
2. 重新部署

### 问题 4: 只有 Production 环境失败

**原因**：环境变量只设置了 Preview 或 Development

**解决**：
1. 编辑环境变量
2. 确保选择了 **Production** 环境

---

## 📋 快速检查清单

- [ ] 在 Vercel Dashboard 中确认两个环境变量都已添加
- [ ] 确认环境变量值**没有引号**
- [ ] 确认环境变量值**没有前后空格**
- [ ] 确认为所有环境（Production, Preview, Development）设置了变量
- [ ] **已重新部署**应用
- [ ] 重新部署后测试了应用功能
- [ ] 检查了构建日志，没有错误

---

## 🆘 仍然无法解决？

### 方法 1: 使用 Vercel CLI 设置

```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 设置环境变量
vercel env add VITE_SUPABASE_URL production
# 输入: https://jkbuoszyjleuxkkolzcy.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# 粘贴你的 API key

# 重新部署
vercel --prod
```

### 方法 2: 检查 Supabase 项目状态

1. 访问 Supabase Dashboard
2. 确认项目没有被暂停
3. 确认 API 访问没有被限制

### 方法 3: 联系支持

- Vercel 支持: https://vercel.com/support
- 查看 Vercel 文档: https://vercel.com/docs/environment-variables

---

**完成以上步骤后，应用应该可以正常工作了！** ✅

