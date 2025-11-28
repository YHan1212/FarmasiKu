# 修复 Vercel 版本信息问题

## 🔍 问题分析

本地正常，但 Vercel 部署后看不到版本信息，可能的原因：

1. **Vercel 构建时 Git 命令失败**
   - Vercel 使用浅克隆，可能没有完整的 Git 历史
   - `git rev-parse HEAD` 或 `git log` 可能失败

2. **构建脚本未正确执行**
   - `npm run build` 中的 `generate-version.js` 可能失败
   - 但构建继续，没有报错

3. **version.json 未包含在构建产物中**
   - 文件可能生成在错误的位置
   - 或未被 Vite 正确打包

## ✅ 解决方案

### 步骤 1: 检查 Vercel 构建日志

1. 进入 Vercel Dashboard
2. 选择你的项目
3. 进入 **Deployments** 标签
4. 点击最新的部署
5. 查看 **Build Logs**
6. **查找以下内容**：
   - `✅ Version info generated:` - 如果看到这个，说明脚本执行成功
   - `❌ Error generating version info:` - 如果看到这个，说明脚本失败
   - `⚠️ Using default version info` - 如果看到这个，说明 Git 命令失败，使用了默认值

### 步骤 2: 检查 Vercel 项目设置

1. 进入 Vercel Dashboard → 项目设置
2. 点击 **Settings** → **General**
3. 检查以下设置：

   **Build & Development Settings**:
   - **Framework Preset**: `Vite`（应该自动检测）
   - **Build Command**: `npm run build`（应该自动设置）
   - **Output Directory**: `dist`（应该自动设置）
   - **Install Command**: `npm install`（应该自动设置）

   **Git**:
   - **Shallow Clone**: 应该**取消勾选**（确保有完整的 Git 历史）

### 步骤 3: 手动触发重新部署

1. 在 Vercel Dashboard → Deployments
2. 找到最新部署
3. 点击 **"..."** → **Redeploy**
4. **重要**：**取消勾选** "Use existing Build Cache"
5. 点击 **Redeploy**
6. 等待构建完成
7. 查看构建日志，确认版本信息是否生成

### 步骤 4: 检查构建产物

如果构建成功，检查构建产物中是否包含 `version.json`：

1. 在 Vercel Dashboard → Deployments
2. 点击最新部署
3. 查看 **Source** 或 **Artifacts**
4. 确认 `dist` 目录中是否有 `version.json` 或相关文件

## 🔧 如果仍然不工作

### 方案 A: 使用 Vercel 环境变量

Vercel 会自动提供一些 Git 相关的环境变量。我已经更新了 `generate-version.js` 来使用这些变量：

- `VERCEL_GIT_COMMIT_SHA` - 提交哈希
- `VERCEL_GIT_COMMIT_REF` - 分支名
- `VERCEL_GIT_COMMIT_MESSAGE` - 提交信息

如果这些变量可用，脚本会优先使用它们。

### 方案 B: 在构建前生成版本信息

如果 Git 命令在 Vercel 中总是失败，可以：

1. **在本地生成版本信息并提交到 Git**：
   ```bash
   npm run generate-version
   git add src/version.json
   git commit -m "更新版本信息"
   git push
   ```

2. **修改构建脚本，如果 Git 失败则使用已存在的文件**：
   - 这已经在 `generate-version.js` 中实现了（fallback 机制）

### 方案 C: 使用 GitHub Actions 生成版本信息

在 GitHub Actions 中生成版本信息，然后通过环境变量传递给 Vercel。

## 📝 诊断清单

请检查以下内容并告诉我结果：

- [ ] Vercel 构建日志中是否有 `✅ Version info generated`
- [ ] Vercel 构建日志中是否有 `❌ Error generating version info`
- [ ] Vercel 项目设置中 "Shallow Clone" 是否已取消勾选
- [ ] 是否尝试过清除缓存重新部署
- [ ] 浏览器控制台是否有 `version.json` 相关的错误
- [ ] Network 标签中是否有 `version.json` 的请求

## 🐛 常见问题

### 问题 1: 构建日志显示 Git 命令失败

**错误信息**：`fatal: not a git repository` 或类似

**解决方案**：
- 确保 Vercel 项目设置中 "Shallow Clone" 已取消勾选
- 或者使用 Vercel 环境变量（已实现）

### 问题 2: 构建成功但版本信息不显示

**可能原因**：
- `version.json` 生成在错误的位置
- 文件未被 Vite 正确打包

**解决方案**：
- 检查 `src/version.json` 是否在正确的位置
- 确认 Vite 配置是否正确

### 问题 3: 版本信息显示 "unknown"

**原因**：
- Git 命令失败，使用了默认值

**解决方案**：
- 检查 Vercel 构建日志
- 确认 Vercel 环境变量是否可用
- 或者使用方案 B（在本地生成并提交）

