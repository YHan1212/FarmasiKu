# Vercel 部署指南

## 🚀 快速部署步骤

### 方法 1: 通过 Vercel 网站（推荐）

1. **访问 Vercel**
   - 打开 https://vercel.com
   - 使用 GitHub 账号登录

2. **导入项目**
   - 点击 "Add New..." → "Project"
   - 选择你的 GitHub 仓库：`YHan1212/FarmasiKu`
   - 点击 "Import"

3. **配置项目**
   - **Framework Preset**: Vite（会自动检测）
   - **Root Directory**: `./`（默认）
   - **Build Command**: `npm run build`（默认）
   - **Output Directory**: `dist`（默认）
   - **Install Command**: `npm install`（默认）

4. **环境变量**
   在 "Environment Variables" 部分添加：
   ```
   VITE_SUPABASE_URL=你的_Supabase_URL
   VITE_SUPABASE_ANON_KEY=你的_Supabase_Anon_Key
   ```
   
   ⚠️ **重要**：确保添加了这两个环境变量，否则应用无法连接数据库。

5. **部署**
   - 点击 "Deploy"
   - 等待构建完成（通常 1-2 分钟）

6. **访问应用**
   - 部署完成后，Vercel 会提供一个 URL（例如：`https://farmasiku.vercel.app`）
   - 点击 URL 即可访问你的应用

---

### 方法 2: 通过 Vercel CLI

1. **安装 Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **登录 Vercel**
   ```bash
   vercel login
   ```

3. **部署**
   ```bash
   vercel
   ```
   
   首次部署会询问一些问题：
   - Set up and deploy? **Yes**
   - Which scope? 选择你的账号
   - Link to existing project? **No**（首次部署）
   - Project name? **farmasiku**（或你喜欢的名字）
   - Directory? **./**（默认）
   - Override settings? **No**（默认）

4. **添加环境变量**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

5. **生产环境部署**
   ```bash
   vercel --prod
   ```

---

## 📋 部署前检查清单

- [x] ✅ 代码已推送到 GitHub
- [ ] ⚠️ 确保 `.env` 文件中的 Supabase 配置正确
- [ ] ⚠️ 在 Vercel 中添加环境变量
- [ ] ⚠️ 确保数据库脚本已在 Supabase 中运行
- [ ] ⚠️ 检查 `package.json` 中的构建脚本

---

## 🔧 环境变量配置

在 Vercel Dashboard 中，进入项目设置 → Environment Variables，添加：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `VITE_SUPABASE_URL` | `https://jkbuoszyjleuxkkolzcy.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `你的_anon_key` | Production, Preview, Development |

⚠️ **注意**：Vercel 会自动为所有环境（Production、Preview、Development）使用这些变量。

---

## 🐛 常见问题

### 1. 构建失败
- 检查 `package.json` 中的依赖是否完整
- 确保 Node.js 版本兼容（Vercel 默认使用 Node.js 18+）

### 2. 应用无法连接数据库
- 检查环境变量是否正确添加
- 确保 Supabase URL 和 Key 正确
- 检查 Supabase 项目的 RLS 策略

### 3. 路由问题（404）
- `vercel.json` 已配置 SPA 路由重写
- 如果仍有问题，检查 Vercel 项目设置中的 "Framework Preset"

### 4. 环境变量未生效
- 添加环境变量后需要重新部署
- 在 Vercel Dashboard 中点击 "Redeploy"

---

## 📝 部署后步骤

1. **测试应用**
   - 访问 Vercel 提供的 URL
   - 测试登录、注册功能
   - 测试主要功能流程

2. **自定义域名**（可选）
   - 在 Vercel Dashboard → Settings → Domains
   - 添加你的自定义域名
   - 按照提示配置 DNS

3. **监控和日志**
   - 在 Vercel Dashboard 中查看部署日志
   - 监控应用性能和使用情况

---

## 🔄 更新部署

每次推送到 GitHub 的 `main` 分支，Vercel 会自动：
1. 检测到新的提交
2. 自动构建新版本
3. 部署到生产环境

你也可以手动触发部署：
- 在 Vercel Dashboard → Deployments → "Redeploy"

---

## 📚 参考资源

- Vercel 文档：https://vercel.com/docs
- Vite 部署指南：https://vitejs.dev/guide/static-deploy.html
- Supabase 部署指南：https://supabase.com/docs/guides/hosting

---

**部署完成后，你的应用将在全球 CDN 上运行，享受快速访问速度！** 🎉

