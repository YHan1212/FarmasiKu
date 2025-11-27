# 🎓 用户角色系统设置教程（详细步骤）

## 📚 教程概览

本教程将教你如何：
1. 在数据库中添加角色字段
2. 找到你的用户 ID
3. 将自己设置为管理员
4. 测试功能是否正常

---

## 步骤 1: 运行数据库脚本

### 1.1 打开 Supabase Dashboard

1. 访问 [https://supabase.com](https://supabase.com)
2. 登录你的账户
3. 选择你的项目（farmasiKu）

### 1.2 打开 SQL Editor

1. 在左侧菜单中，点击 **"SQL Editor"**（SQL 编辑器）
2. 点击 **"New query"**（新建查询）按钮

### 1.3 复制并运行脚本

1. 在你的项目中，打开文件：`database/add_user_role.sql`
2. **全选**文件中的所有内容（Ctrl+A）
3. **复制**（Ctrl+C）
4. 回到 Supabase SQL Editor
5. **粘贴**到编辑器中（Ctrl+V）
6. 点击右上角的 **"Run"** 按钮（或按 `Ctrl+Enter`）

### 1.4 检查结果

如果成功，你会看到：
- ✅ 绿色提示："Success. No rows returned"
- 或者显示创建的表和策略信息

如果出现错误：
- ❌ 红色错误提示
- 常见错误：
  - **"relation already exists"** - 表已存在，可以忽略
  - **"policy already exists"** - 策略已存在，可以忽略

---

## 步骤 2: 找到你的用户 ID

### 方法 1: 通过 Supabase Dashboard（推荐）

1. 在 Supabase Dashboard 左侧菜单中，点击 **"Authentication"**
2. 点击 **"Users"** 标签
3. 找到你的用户（通过邮箱查找）
4. 点击用户行，查看详细信息
5. **复制** "User UID"（用户 UUID）

### 方法 2: 通过应用控制台

1. 打开你的应用：`http://localhost:3000`
2. 登录你的账户
3. 打开浏览器开发者工具（按 `F12`）
4. 切换到 **"Console"**（控制台）标签
5. 输入以下代码并回车：

```javascript
// 获取当前登录用户的 ID
const user = JSON.parse(localStorage.getItem('sb-' + 'jkbuoszyjleuxkkolzcy' + '-auth-token'));
console.log('User ID:', user?.user?.id);
```

6. 复制显示的 User ID

---

## 步骤 3: 将自己设置为管理员

### 3.1 打开 SQL Editor

1. 在 Supabase Dashboard 中，点击 **"SQL Editor"**
2. 点击 **"New query"** 创建新查询

### 3.2 运行设置管理员的 SQL

1. 在编辑器中输入以下 SQL（**替换 `你的用户 UUID` 为步骤 2 中复制的 UUID**）：

```sql
-- 将用户设置为管理员
UPDATE public.user_profiles 
SET role = 'admin' 
WHERE id = '你的用户 UUID';

-- 验证设置是否成功
SELECT id, role, created_at 
FROM public.user_profiles 
WHERE id = '你的用户 UUID';
```

2. 点击 **"Run"** 按钮

### 3.3 检查结果

如果成功，你会看到：
- ✅ "Success. 1 row updated"
- ✅ 查询结果中显示 `role = 'admin'`

---

## 步骤 4: 测试功能

### 4.1 重新登录应用

1. **重要**：完全退出应用（点击 Profile → Logout）
2. 或者清除浏览器缓存：
   - 按 `F12` 打开开发者工具
   - 在 Console 中输入：
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

### 4.2 登录并检查

1. 重新登录你的账户
2. 检查页面顶部：
   - ✅ 如果看到 **"🏥 Admin"** 按钮 → 成功！
   - ❌ 如果看不到 Admin 按钮 → 继续下一步

### 4.3 如果看不到 Admin 按钮

可能的原因和解决方法：

**原因 1: 角色未正确设置**
- 在 Supabase SQL Editor 中运行：
```sql
SELECT id, role FROM public.user_profiles WHERE id = '你的用户 UUID';
```
- 确认 `role` 字段显示 `admin`

**原因 2: 应用未重新加载角色**
- 完全退出并重新登录
- 或者清除浏览器缓存后重新登录

**原因 3: 数据库脚本未完全运行**
- 重新运行 `database/add_user_role.sql` 脚本

---

## 步骤 5: 测试管理功能

### 5.1 访问管理面板

1. 点击 **"🏥 Admin"** 按钮
2. 应该能看到管理面板

### 5.2 测试用户管理

1. 在管理面板中，点击 **"Users"** 标签
2. 你应该能看到：
   - 所有用户的列表
   - 每个用户的角色（👤 User 或 👑 Admin）
   - "Make Admin" 或 "Remove Admin" 按钮

### 5.3 测试角色切换

1. 找到另一个用户（或创建一个测试账户）
2. 点击该用户的 **"Make Admin"** 按钮
3. 确认提示信息
4. 检查角色是否更新为 👑 Admin
5. 再次点击 **"Remove Admin"** 按钮
6. 检查角色是否恢复为 👤 User

---

## 🎯 验证清单

完成以下检查，确保一切正常：

- [ ] 数据库脚本已成功运行
- [ ] 用户 ID 已找到
- [ ] 自己已设置为管理员
- [ ] 重新登录后能看到 Admin 按钮
- [ ] 可以访问管理面板
- [ ] 可以在 Users 标签中看到用户列表
- [ ] 可以切换其他用户的角色

---

## ❓ 常见问题

### Q1: 运行 SQL 脚本时出现 "permission denied" 错误

**解决方法**：
- 确保你使用的是项目所有者账户
- 检查 RLS 策略是否正确创建

### Q2: 找不到用户 ID

**解决方法**：
- 在 Supabase Dashboard → Authentication → Users 中查找
- 或者使用应用控制台的方法

### Q3: 设置为管理员后仍然看不到 Admin 按钮

**解决方法**：
1. 完全退出应用（Logout）
2. 清除浏览器缓存
3. 重新登录
4. 如果还是不行，检查数据库中的 role 字段是否正确

### Q4: 如何撤销管理员权限？

**解决方法**：
- 在 Admin → Users 中，点击自己的 "Remove Admin" 按钮
- 或者运行 SQL：
```sql
UPDATE public.user_profiles 
SET role = 'user' 
WHERE id = '你的用户 UUID';
```

---

## 📞 需要帮助？

如果遇到问题：
1. 检查 Supabase Dashboard 中的错误日志
2. 查看浏览器控制台的错误信息
3. 确认所有 SQL 脚本都已正确运行

---

## ✅ 完成！

完成以上步骤后，你的系统就已经支持用户角色分离了！

- **普通用户**：只能使用基本功能，看不到 Admin 按钮
- **管理员**：可以访问管理面板，管理所有功能

现在你可以：
- 创建多个管理员账户
- 管理用户权限
- 控制谁可以访问管理功能

🎉 恭喜！设置完成！

