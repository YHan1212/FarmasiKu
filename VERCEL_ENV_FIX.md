# 🔧 修复 "Database not configured" 错误

## 快速修复步骤

### 1. 进入 Vercel Dashboard
- 打开：https://vercel.com/dashboard
- 选择项目：**FarmasiKu**

### 2. 检查环境变量
- 点击 **Settings** → **Environment Variables**
- 确认以下两个变量存在：
  - ✅ `VITE_SUPABASE_URL`
  - ✅ `VITE_SUPABASE_ANON_KEY`

### 3. 如果变量不存在，添加它们：

**变量 1:**
- **Key**: `VITE_SUPABASE_URL`
- **Value**: `https://jkbuoszyjleuxkkolzcy.supabase.co`
- **Environment**: ✅ Production ✅ Preview ✅ Development

**变量 2:**
- **Key**: `VITE_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprYnVvc3p5amxldXhra29semN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NTY1NDYsImV4cCI6MjA3ODMzMjU0Nn0.CLtF66dhfDmJQFP2nqS-gFpyQMC_vA0HCuwmxSZ5DXA`
- **Environment**: ✅ Production ✅ Preview ✅ Development

### 4. 重新部署（必须！）
1. 点击 **Deployments**
2. 找到最新部署
3. 点击右侧 **"..."** → **Redeploy**
4. ⚠️ **取消勾选 "Use existing Build Cache"**（清除缓存）
5. 点击 **Redeploy**
6. 等待 1-2 分钟

### 5. 验证修复
部署完成后，访问应用，应该不再显示 "Database not configured" 错误。

---

## ⚠️ 重要提示

1. **不要加引号**：直接粘贴值，不要加引号
2. **不要有空格**：确保值前后没有空格
3. **必须重新部署**：添加环境变量后必须重新部署才能生效

