# 测试 Waiting Queues 显示

## ✅ SQL 修复成功
- `role: admin` ✅
- `wait: 1` ✅
- `can see: 1` ✅

## 现在测试前端

### 步骤 1: 刷新应用
1. **硬刷新浏览器**：
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
   
   或者：
   - 清除浏览器缓存
   - 重新登录

### 步骤 2: 进入 Pharmacist Dashboard
1. 以 Admin 用户登录
2. 进入 **Admin Dashboard**
3. 点击 **"💬 Pharmacist Dashboard"** 标签（不是 "👨‍⚕️ Pharmacists"）

### 步骤 3: 查看结果
应该看到：
- **"⏳ Waiting Consultations (1)"** 标题
- 一个等待队列卡片，显示：
  - Patient 信息
  - Symptoms
  - Age（如果有）
  - "Accept & Start Chat" 按钮（如果 link 了 pharmacist account）

### 步骤 4: 查看控制台
打开浏览器控制台（F12），应该看到：

```
[FarmasiAdmin] Component rendered, activeTab: pharmacist
[PharmacistDashboard] Component rendered
[PharmacistDashboard] Loading waiting queues...
[PharmacistDashboard] Waiting queues result: { 
  queues: [...], 
  count: 1,  // ✅ 应该是 1
  queueError: null 
}
[PharmacistDashboard] Setting state: { queuesCount: 1 }
[PharmacistDashboard] Final state set: { waitingQueuesCount: 1 }
```

### 步骤 5: 测试 Accept 功能
如果 link 了 pharmacist account：
1. 点击 **"Accept & Start Chat"** 按钮
2. 应该进入聊天界面
3. 用户端应该从 waiting 状态进入聊天

## 如果前端还是看不到

### 检查 1: 控制台日志
查看是否有：
- `count: 0` - 说明查询返回空数组（可能是 RLS 问题）
- `queueError: {...}` - 说明查询有错误

### 检查 2: 网络请求
1. 打开浏览器 **Network** 标签
2. 刷新页面
3. 查找对 `consultation_queue` 的请求
4. 查看响应数据

### 检查 3: 重新运行 RLS 策略
如果前端还是看不到，可能需要重新运行 RLS 策略：

```sql
-- 运行 database/rebuild_consultation_queue_rls.sql
```

## 成功标志
✅ 前端显示 "⏳ Waiting Consultations (1)"  
✅ 能看到队列卡片  
✅ 控制台显示 `count: 1`  
✅ 可以点击 "Accept & Start Chat"

