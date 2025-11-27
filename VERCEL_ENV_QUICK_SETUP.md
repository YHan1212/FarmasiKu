# Vercel 环境变量快速设置指南

## 📋 你的配置信息

### Supabase URL
```
https://jkbuoszyjleuxkkolzcy.supabase.co
```

### Supabase Anon Key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprYnVvc3p5amxldXhra29semN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NTY1NDYsImV4cCI6MjA3ODMzMjU0Nn0.CLtF66dhfDmJQFP2nqS-gFpyQMC_vA0HCuwmxSZ5DXA
```

---

## 🚀 在 Vercel 中设置（5 分钟）

### 步骤 1: 进入环境变量设置
1. 打开 https://vercel.com/dashboard
2. 选择项目：**FarmasiKu**
3. 点击顶部菜单 **Settings**
4. 在左侧菜单点击 **Environment Variables**

### 步骤 2: 添加第一个环境变量
1. 点击 **Add** 按钮
2. 填写：
   - **Key**: `VITE_SUPABASE_URL`
   - **Value**: `https://jkbuoszyjleuxkkolzcy.supabase.co`
   - **Environment**: 勾选所有三个
     - ✅ Production
     - ✅ Preview
     - ✅ Development
3. 点击 **Save**

### 步骤 3: 添加第二个环境变量
1. 再次点击 **Add** 按钮
2. 填写：
   - **Key**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprYnVvc3p5amxldXhra29semN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NTY1NDYsImV4cCI6MjA3ODMzMjU0Nn0.CLtF66dhfDmJQFP2nqS-gFpyQMC_vA0HCuwmxSZ5DXA`
   - **Environment**: 勾选所有三个
     - ✅ Production
     - ✅ Preview
     - ✅ Development
3. 点击 **Save**

### 步骤 4: 重新部署
1. 点击顶部菜单 **Deployments**
2. 找到最新的部署记录
3. 点击右侧的 **"..."** (三个点)
4. 选择 **Redeploy**
5. 等待部署完成（通常 1-2 分钟）

---

## ✅ 验证设置

部署完成后：
1. 访问 https://farmasiku.vercel.app
2. 应该能看到登录页面（不再显示 "Invalid API key" 错误）
3. 尝试注册或登录功能

---

## ⚠️ 重要提示

1. **不要加引号**：直接粘贴值，不要加引号
2. **不要有空格**：确保值前后没有空格
3. **必须重新部署**：添加环境变量后，必须重新部署才能生效
4. **检查所有环境**：确保为 Production、Preview、Development 都设置了变量

---

## 🆘 如果还有问题

1. **检查环境变量列表**：
   - 确认两个变量都已添加
   - 确认值完全正确（没有多余空格或引号）

2. **检查部署日志**：
   - 在 Deployments 页面点击部署
   - 查看 Build Logs 是否有错误

3. **清除浏览器缓存**：
   - 按 `Ctrl + Shift + R` (Windows) 或 `Cmd + Shift + R` (Mac) 强制刷新

---

**完成以上步骤后，应用应该可以正常工作了！** ✅

