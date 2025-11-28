# 修复 Vercel 版本信息显示

## 🎯 问题

- ✅ 本地 localhost：版本信息正常显示在右下角
- ❌ Vercel 部署：版本信息不显示

## 🔍 原因

Vercel 检测到 Vite 项目后，直接运行 `vite build`，跳过了 `package.json` 中的 `build` 脚本。

## ✅ 解决方案：在 Vercel Dashboard 中手动设置构建命令

### 步骤 1: 进入 Vercel Dashboard

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 登录你的账号
3. 选择你的项目（FarmasiKu）

### 步骤 2: 修改构建命令

1. 点击项目名称进入项目页面
2. 点击顶部菜单的 **Settings**
3. 在左侧菜单选择 **General**
4. 向下滚动找到 **Build & Development Settings**
5. 找到 **Build Command** 字段
6. **删除**现有的内容（如果有）
7. **输入**以下命令：
   ```
   node scripts/generate-version.js && npm run build
   ```
8. 点击 **Save** 保存

### 步骤 3: 重新部署

1. 回到项目主页
2. 点击 **Deployments** 标签
3. 找到最新的部署
4. 点击 **"..."**（三个点）→ **Redeploy**
5. **取消勾选** "Use existing Build Cache"（清除缓存）
6. 点击 **Redeploy**

### 步骤 4: 验证

等待部署完成后：

1. **查看构建日志**：
   - 应该能看到版本信息生成的输出：
   ```
   ============================================================
   ✅ VERSION INFO GENERATED SUCCESSFULLY
   ============================================================
   ```

2. **检查应用**：
   - 清除浏览器缓存（Ctrl + Shift + Delete）
   - 硬刷新页面（Ctrl + Shift + R）
   - 查看登录页面右下角是否显示版本信息

## 📝 如果仍然不显示

### 检查 1: 构建日志

确认构建日志中是否有版本信息生成的输出。如果没有，说明脚本仍未执行。

### 检查 2: 浏览器控制台

1. 打开开发者工具（F12）
2. 查看 Console 标签
3. 查找是否有 `version.json` 相关的错误
4. 查看 Network 标签，搜索 `version.json`，确认文件是否加载

### 检查 3: 直接访问 version.json

在浏览器地址栏输入：
```
https://你的vercel域名/src/version.json
```

如果能看到 JSON 内容，说明文件存在，可能是前端显示问题。

## 🎯 预期结果

修复后，Vercel 部署的应用应该和 localhost 一样，在登录页面右下角显示版本信息。

