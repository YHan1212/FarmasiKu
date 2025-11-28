# Vercel 构建命令问题说明

## 🔍 问题分析

构建日志显示：
```
> farmasiku@1.0.0 build
> vite build
```

这说明 Vercel **直接执行了 `vite build`**，而不是执行 `package.json` 中的完整构建脚本：
```json
"build": "node scripts/generate-version.js && vite build"
```

## 🎯 可能的原因

1. **Vercel 自动检测 Vite 项目**
   - 当 `vercel.json` 中设置了 `"framework": "vite"` 时
   - Vercel 可能会直接运行 `vite build`，忽略 `package.json` 中的 `build` 脚本

2. **Vercel 项目设置覆盖**
   - 在 Vercel Dashboard 的项目设置中，可能手动设置了构建命令
   - 这会覆盖 `vercel.json` 和 `package.json` 中的配置

## ✅ 解决方案

### 方案 1: 在 Vercel Dashboard 中手动设置构建命令（推荐）

1. 进入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 点击 **Settings** → **General**
4. 找到 **Build & Development Settings**
5. 在 **Build Command** 中输入：
   ```
   node scripts/generate-version.js && npm run build
   ```
6. 点击 **Save**
7. 重新部署项目

### 方案 2: 移除 vercel.json 中的 framework 设置

如果 Vercel 自动检测导致问题，可以尝试移除 `vercel.json` 中的 `"framework": "vite"`，让 Vercel 使用 `package.json` 中的构建脚本。

### 方案 3: 使用 Vercel 的 installCommand

在 `vercel.json` 中添加 `installCommand`，在安装依赖后生成版本信息：

```json
{
  "installCommand": "npm install && node scripts/generate-version.js",
  "buildCommand": "npm run build",
  ...
}
```

## 📝 验证步骤

设置完成后，重新部署，在构建日志中应该看到：

```
Running "build" command: `node scripts/generate-version.js && npm run build`...

============================================================
✅ VERSION INFO GENERATED SUCCESSFULLY
============================================================
...
```

## 🐛 如果仍然不工作

如果以上方法都不行，可能需要：
1. 检查 Vercel 项目设置中是否有其他配置覆盖了构建命令
2. 联系 Vercel 支持
3. 或者接受版本信息在本地显示，但在 Vercel 部署中不显示（如果这不是关键功能）

