# Vercel "Invalid API key" 错误排查指南

## 🔍 问题诊断

如果看到 "Invalid API key" 错误，可能是以下原因：

1. **环境变量未正确设置**
2. **API key 格式错误（包含多余空格或引号）**
3. **使用了错误的 key（应该用 anon key，不是 service_role key）**
4. **环境变量未重新部署**

---

## ✅ 解决步骤

### 步骤 1: 确认正确的 API Key

在 Supabase Dashboard 中：
1. 进入你的项目：https://supabase.com/dashboard/project/jkbuoszyjleuxkkolzcy
2. 点击 **Settings** (齿轮图标)
3. 点击 **API**
4. 找到 **Project API keys** 部分
5. 复制 **`anon` `public`** key（不是 `service_role` key）

**正确的 key 应该以 `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` 开头**

---

### 步骤 2: 在 Vercel 中正确设置环境变量

#### 方法 A: 通过 Vercel Dashboard

1. **进入项目设置**
   - 打开 https://vercel.com/dashboard
   - 选择你的项目 `FarmasiKu`
   - 点击 **Settings** → **Environment Variables**

2. **删除旧的环境变量**（如果存在）
   - 找到 `VITE_SUPABASE_ANON_KEY`
   - 点击右侧的 **"..."** → **Delete**
   - 确认删除

3. **添加新的环境变量**
   - 点击 **Add**
   - **Key**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: 直接粘贴 key（**不要加引号，不要有空格**）
   - **Environment**: 选择所有三个
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - 点击 **Save**

4. **同样检查 `VITE_SUPABASE_URL`**
   - **Key**: `VITE_SUPABASE_URL`
   - **Value**: `https://jkbuoszyjleuxkkolzcy.supabase.co`（**不要加引号，不要有斜杠结尾**）
   - **Environment**: 选择所有三个
   - 点击 **Save**

#### 方法 B: 通过 Vercel CLI

```bash
# 设置 Supabase URL
vercel env add VITE_SUPABASE_URL production
# 输入: https://jkbuoszyjleuxkkolzcy.supabase.co

# 设置 Supabase Anon Key
vercel env add VITE_SUPABASE_ANON_KEY production
# 粘贴你的 anon key（不要加引号）

# 同样为 preview 和 development 环境设置
vercel env add VITE_SUPABASE_URL preview
vercel env add VITE_SUPABASE_ANON_KEY preview
vercel env add VITE_SUPABASE_URL development
vercel env add VITE_SUPABASE_ANON_KEY development
```

---

### 步骤 3: 验证环境变量格式

**❌ 错误格式：**
```
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
VITE_SUPABASE_ANON_KEY= eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (末尾有空格)
```

**✅ 正确格式：**
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprYnVvc3p5amxldXhra29semN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NTY1NDYsImV4cCI6MjA3ODMzMjU0Nn0.CLtF66dhfDmJQFP2nqS-gFpyQMC_vA0HCuwmzSZ5DXA
```

**关键点：**
- ❌ 不要加引号
- ❌ 不要有前后空格
- ❌ 不要有换行
- ✅ 直接粘贴完整的 key

---

### 步骤 4: 重新部署

**重要：添加或修改环境变量后，必须重新部署！**

1. 在 Vercel Dashboard 中
2. 进入 **Deployments** 页面
3. 找到最新的部署
4. 点击右侧 **"..."** → **Redeploy**
5. 等待部署完成（通常 1-2 分钟）

---

### 步骤 5: 验证修复

部署完成后：
1. 访问 https://farmasiku.vercel.app
2. 打开浏览器开发者工具（F12）
3. 查看 **Console** 标签
4. 如果看到 "Supabase is not configured" 或 "Invalid API key"，说明环境变量仍有问题
5. 如果应用正常加载，说明问题已解决

---

## 🔍 调试技巧

### 检查环境变量是否生效

在浏览器控制台运行：
```javascript
console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Key:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 20) + '...');
```

**注意：** 出于安全考虑，不要完整打印 API key。

### 检查 Supabase 连接

在浏览器控制台运行：
```javascript
// 这应该返回 Supabase 客户端对象，而不是 null
console.log('Supabase client:', window.supabase || 'Not available');
```

---

## 📋 常见错误和解决方案

### 错误 1: "Invalid API key"
- **原因**: Key 格式错误或使用了错误的 key
- **解决**: 确认使用 `anon public` key，不是 `service_role` key

### 错误 2: "Supabase is not configured"
- **原因**: 环境变量未设置或未重新部署
- **解决**: 添加环境变量并重新部署

### 错误 3: 应用显示空白页面
- **原因**: 构建失败或环境变量问题
- **解决**: 检查 Vercel 构建日志

### 错误 4: 本地正常，Vercel 失败
- **原因**: 环境变量只在本地 `.env` 文件中，未在 Vercel 设置
- **解决**: 在 Vercel Dashboard 中添加环境变量

---

## 🎯 快速检查清单

- [ ] 在 Supabase Dashboard 中确认了正确的 `anon public` key
- [ ] 在 Vercel 中添加了 `VITE_SUPABASE_URL` 环境变量
- [ ] 在 Vercel 中添加了 `VITE_SUPABASE_ANON_KEY` 环境变量
- [ ] 环境变量值**没有引号**
- [ ] 环境变量值**没有前后空格**
- [ ] 为所有环境（Production, Preview, Development）设置了变量
- [ ] 添加环境变量后**重新部署**了应用
- [ ] 重新部署后测试了应用功能

---

## 🆘 仍然无法解决？

如果按照以上步骤仍然无法解决：

1. **检查 Supabase 项目状态**
   - 确认项目没有被暂停
   - 确认 API 访问没有被限制

2. **检查 Vercel 构建日志**
   - 在 Vercel Dashboard → Deployments → 点击部署
   - 查看 Build Logs 是否有错误

3. **验证 Supabase 配置**
   - 在 Supabase Dashboard → Settings → API
   - 确认 Project URL 和 API keys 正确

4. **联系支持**
   - Vercel 支持: https://vercel.com/support
   - Supabase 支持: https://supabase.com/support

---

**完成以上步骤后，应用应该可以正常工作了！** ✅

