# Vercel 版本信息修复步骤

## 🎯 快速修复（按顺序执行）

### 步骤 1: 检查 Vercel 构建日志 ⭐ 最重要

1. 进入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 点击 **Deployments** 标签
4. 点击**最新的部署**
5. 查看 **Build Logs**（构建日志）
6. **查找以下关键词**：
   - `✅ Version info generated` - 如果看到，说明脚本执行成功
   - `❌ Error generating version info` - 如果看到，说明脚本失败
   - `⚠️ Using default version info` - 如果看到，说明 Git 命令失败
   - `⚠️ Git commands failed` - 如果看到，说明 Git 不可用

**请告诉我你在构建日志中看到了什么！**

### 步骤 2: 检查 Vercel 项目设置

1. 在 Vercel Dashboard → 项目设置
2. 点击 **Settings** → **General**
3. 检查以下设置：

   **Build & Development Settings**:
   - ✅ **Framework Preset**: 应该是 `Vite`
   - ✅ **Build Command**: 应该是 `npm run build`
   - ✅ **Output Directory**: 应该是 `dist`
   - ✅ **Install Command**: 应该是 `npm install`

   **Git**:
   - ⚠️ **Shallow Clone**: **取消勾选**（确保有完整的 Git 历史）

### 步骤 3: 清除缓存并重新部署

1. 在 Vercel Dashboard → **Deployments**
2. 找到最新部署
3. 点击 **"..."**（三个点）→ **Redeploy**
4. **重要**：**取消勾选** "Use existing Build Cache"（清除缓存）
5. 点击 **Redeploy**
6. 等待构建完成
7. **再次查看构建日志**，确认版本信息是否生成

### 步骤 4: 检查浏览器

部署完成后：

1. **清除浏览器缓存**：
   - `Ctrl + Shift + Delete`
   - 选择"缓存的图片和文件"
   - 清除

2. **硬刷新页面**：
   - `Ctrl + Shift + R` 或 `Ctrl + F5`

3. **检查登录页面右下角**：
   - 应该能看到版本信息框

4. **检查浏览器控制台**（F12）：
   - 查看 Console 标签
   - 查找是否有 `version.json` 相关的错误
   - 查看 Network 标签，搜索 `version.json`

## 🔍 诊断信息收集

请提供以下信息，帮助我定位问题：

### 1. Vercel 构建日志
- [ ] 是否有 `✅ Version info generated`
- [ ] 是否有 `❌ Error generating version info`
- [ ] 是否有 `⚠️ Git commands failed`
- [ ] 是否有其他错误信息

### 2. Vercel 项目设置
- [ ] Framework Preset 是什么？
- [ ] Build Command 是什么？
- [ ] Shallow Clone 是否已取消勾选？

### 3. 浏览器检查
- [ ] 登录页面右下角是否有任何内容？
- [ ] 浏览器控制台是否有错误？
- [ ] Network 标签中是否有 `version.json` 的请求？

## 🐛 常见问题及解决方案

### 问题 1: 构建日志显示 Git 命令失败

**错误信息**：`fatal: not a git repository` 或 `fatal: ambiguous argument 'HEAD'`

**原因**：Vercel 使用浅克隆，可能没有完整的 Git 历史

**解决方案**：
1. 在 Vercel 项目设置中，**取消勾选** "Shallow Clone"
2. 重新部署
3. 或者脚本已经更新，会使用 Vercel 环境变量（`VERCEL_GIT_COMMIT_SHA`）

### 问题 2: 构建成功但版本信息不显示

**可能原因**：
- `version.json` 生成在错误的位置
- 文件未被 Vite 正确打包
- 浏览器缓存

**解决方案**：
1. 检查构建日志，确认 `version.json` 是否生成
2. 清除浏览器缓存并硬刷新
3. 检查浏览器控制台是否有错误

### 问题 3: 版本信息显示 "unknown"

**原因**：Git 命令失败，使用了默认值

**解决方案**：
1. 检查 Vercel 环境变量是否可用
2. 在 Vercel 项目设置中取消勾选 "Shallow Clone"
3. 重新部署

## 📝 下一步

根据你提供的诊断信息，我会：
1. 分析问题原因
2. 提供针对性的解决方案
3. 如果需要，更新代码或配置

**请先执行步骤 1，查看 Vercel 构建日志，然后告诉我你看到了什么！**

