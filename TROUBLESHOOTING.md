# 故障排除指南

## 当前问题
生产环境代码仍未更新，网络请求仍在使用旧查询：
```
matched_pharmacist_id=eq...&status=eq.matched
```

## 可能原因

### 1. Vercel 部署延迟
- Vercel 可能需要 5-15 分钟完成部署
- 空提交可能不会触发自动部署（如果 Vercel 配置为只部署有代码变更的提交）

### 2. 需要手动触发部署
如果自动部署没有触发，需要：
1. 登录 Vercel Dashboard
2. 进入项目页面
3. 手动点击 "Redeploy"

### 3. 代码可能在其他地方
检查是否有其他文件或组件在使用旧查询逻辑

## 解决方案

### 方案 1: 创建一个真实的代码变更来触发部署
```bash
# 在 PharmacistDashboard.jsx 中添加一个注释
# 这样可以确保 Vercel 检测到变更
```

### 方案 2: 检查 Vercel 项目设置
1. 确认项目已连接到正确的 GitHub 仓库
2. 确认自动部署已启用
3. 检查构建日志是否有错误

### 方案 3: 直接修改代码并提交
如果空提交没有触发部署，可以做一个小的代码修改（比如添加注释）来触发部署

## 验证步骤

1. **检查 JavaScript 文件 hash**
   - 旧：`index-CkdNPL3A.js`
   - 新：应该是一个不同的 hash

2. **检查网络请求**
   - 应该看到：`status=eq.waiting`
   - 不应该看到：`matched_pharmacist_id=eq...&status=eq.matched`

3. **检查控制台日志**
   - 应该看到：`[PharmacistDashboard] Loading waiting queues...`

## 下一步

建议创建一个小的代码变更来确保 Vercel 检测到更新。

