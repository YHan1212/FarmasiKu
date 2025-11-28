# 部署检查清单

## 🔍 检查是否使用了新组件

### 方法 1: 检查浏览器控制台

1. 打开浏览器开发者工具（F12）
2. 进入 Console 标签
3. 刷新页面（硬刷新：`Ctrl+Shift+R` 或 `Cmd+Shift+R`）
4. 查看是否有以下日志：
   - ✅ `[ConsultationQueue] Component mounted` - 说明使用了新组件
   - ❌ `[ConsultationWaiting] Component mounted` - 说明还在使用旧组件

### 方法 2: 检查网络请求

1. 打开浏览器开发者工具（F12）
2. 进入 Network 标签
3. 刷新页面
4. 查找 `ConsultationQueue.js` 或 `ConsultationQueue.css` 文件
   - ✅ 如果看到这些文件，说明使用了新组件
   - ❌ 如果只看到 `ConsultationWaiting.js`，说明还在使用旧组件

### 方法 3: 检查页面元素

1. 进入排队页面
2. 右键点击页面 → "检查元素"
3. 查看 HTML 结构：
   - ✅ 如果看到 `class="consultation-queue"`，说明使用了新组件
   - ❌ 如果看到 `class="consultation-waiting"`，说明还在使用旧组件

---

## 🚀 确保部署成功

### 步骤 1: 检查 Vercel 部署状态

1. 登录 Vercel Dashboard
2. 查看最新部署是否成功
3. 检查部署时间是否是最新的

### 步骤 2: 清除浏览器缓存

**Chrome/Edge**:
1. 按 `Ctrl+Shift+Delete`（Windows）或 `Cmd+Shift+Delete`（Mac）
2. 选择 "缓存的图片和文件"
3. 时间范围选择 "全部时间"
4. 点击 "清除数据"

**或者硬刷新**:
- Windows: `Ctrl+Shift+R` 或 `Ctrl+F5`
- Mac: `Cmd+Shift+R`

### 步骤 3: 检查代码版本

在浏览器控制台运行：
```javascript
// 检查组件名称
console.log('Check if new component is loaded')
```

或者查看 Network 标签中的文件时间戳。

---

## 🐛 如果还是看到旧页面

### 问题 1: Vercel 没有自动部署

**解决**：
1. 前往 Vercel Dashboard
2. 手动触发重新部署（Redeploy）

### 问题 2: 浏览器缓存

**解决**：
1. 使用无痕模式（Incognito）测试
2. 或清除浏览器缓存后重新加载

### 问题 3: 代码没有正确推送

**检查**：
```bash
git log --oneline -5
```

应该看到最新的 commit：
```
fe4990e Implement new consultation queue system (customer service style)
```

---

## ✅ 验证新组件已部署

### 检查点：

1. **页面样式**：
   - ✅ 渐变蓝色背景
   - ✅ 三个信息卡片（Position, Estimated Wait, Online Pharmacists）
   - ✅ 三个脉冲圆圈动画
   - ✅ "Cancel" 按钮在底部

2. **控制台日志**：
   - ✅ `[ConsultationQueue] Component mounted`
   - ✅ `[ConsultationQueue] Queue created`
   - ✅ `[ConsultationQueue] Setting up subscriptions`

3. **功能**：
   - ✅ 显示队列位置
   - ✅ 显示预计等待时间
   - ✅ 显示在线药剂师数量
   - ✅ 实时监听状态变化

---

## 📝 如果问题仍然存在

请提供：
1. 浏览器控制台的完整日志
2. Network 标签中加载的文件列表
3. 页面截图
4. Vercel 部署状态截图

