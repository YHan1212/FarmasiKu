# 重新部署 Vercel 项目步骤

## 🗑️ 步骤 1: 删除现有项目

1. 进入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 找到你的项目（FarmasiKu）
3. 点击项目进入项目页面
4. 点击 **Settings**（设置）
5. 滚动到页面底部
6. 找到 **Danger Zone**（危险区域）
7. 点击 **Delete Project**（删除项目）
8. 确认删除（输入项目名称确认）

## 🆕 步骤 2: 创建新项目

1. 在 Vercel Dashboard 首页
2. 点击 **Add New...** → **Project**
3. 选择你的 GitHub 仓库：`YHan1212/FarmasiKu`
4. 点击 **Import**

## ⚙️ 步骤 3: 配置项目

### Framework Preset
- 选择：**Vite**（或让 Vercel 自动检测）

### Root Directory
- 保持默认：`./`

### Build & Development Settings

**重要**：手动设置以下内容：

- **Build Command**：
  ```
  node scripts/generate-version.js && npm run build
  ```
  
- **Output Directory**：
  ```
  dist
  ```
  
- **Install Command**：
  ```
  npm install
  ```

### Environment Variables

添加以下环境变量：

1. **VITE_SUPABASE_URL**
   - Value: `https://jkbuoszyjleuxkkolzcy.supabase.co`
   - Environment: Production, Preview, Development（全部勾选）

2. **VITE_SUPABASE_ANON_KEY**
   - Value: 你的 Supabase Anon Key
   - Environment: Production, Preview, Development（全部勾选）

### Git Settings

- **Shallow Clone**: **取消勾选**（确保有完整的 Git 历史）

## 🚀 步骤 4: 部署

1. 点击 **Deploy**
2. 等待构建完成（通常 1-2 分钟）
3. 查看构建日志，确认：
   - 版本信息脚本是否执行
   - 是否有 `✅ VERSION INFO GENERATED SUCCESSFULLY` 输出

## ✅ 步骤 5: 验证

部署完成后：

1. 访问 Vercel 提供的 URL
2. 清除浏览器缓存（Ctrl + Shift + Delete）
3. 硬刷新页面（Ctrl + Shift + R）
4. 检查登录页面：
   - 右下角应该显示版本信息
   - 或者检查其他功能是否正常

## 📝 注意事项

- 删除项目不会影响 GitHub 仓库
- 删除后需要重新添加环境变量
- 新的部署 URL 可能会不同
- 如果使用自定义域名，需要重新配置

## 🐛 如果遇到问题

### 问题 1: 找不到项目删除选项

**解决方案**：
- 确保你是项目的所有者
- 检查是否有权限删除项目

### 问题 2: 构建失败

**检查**：
- 环境变量是否正确添加
- Build Command 是否正确
- 查看构建日志中的错误信息

### 问题 3: 版本信息仍然不显示

**检查**：
- 构建日志中是否有版本信息生成的输出
- 浏览器控制台是否有错误
- Network 标签中是否有 `version.json` 的请求

