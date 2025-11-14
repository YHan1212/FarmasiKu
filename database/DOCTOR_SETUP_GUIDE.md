# 医生账户设置指南

## 📋 如何让医生能够回复咨询消息

### 方法 1：通过管理页面关联（推荐）

1. **登录管理员账户**
   - 使用管理员账户登录应用

2. **进入管理页面**
   - 点击 "Admin" 按钮进入管理面板
   - 切换到 "👨‍⚕️ Doctors" 标签

3. **创建或选择医生**
   - 如果还没有医生，点击 "+ Add Doctor" 创建
   - 填写医生信息（姓名、专业、简介等）

4. **关联医生到你的账户**
   - 在医生卡片上，找到 "🔗 Link to My Account" 按钮
   - 点击按钮，确认关联
   - 现在你可以作为这个医生回复咨询了

5. **查看咨询并回复**
   - 点击 "Consultations" 按钮
   - 选择要回复的咨询会话
   - 在聊天界面输入消息并发送

---

### 方法 2：通过 SQL 直接关联

如果你知道医生的 ID 和用户的 ID，可以直接在 Supabase SQL Editor 中运行：

```sql
-- 将医生关联到用户
UPDATE public.doctors
SET user_id = 'USER_ID_HERE'  -- 替换为实际的用户 ID
WHERE id = 'DOCTOR_ID_HERE';  -- 替换为实际的医生 ID
```

**如何获取用户 ID：**
- 在 Supabase Dashboard → Authentication → Users 中查看
- 或者在应用的 Profile 页面查看（如果显示）

**如何获取医生 ID：**
- 在管理页面的医生卡片上查看（显示为 "ID: xxxxxxxx..."）
- 或者在 Supabase Dashboard → Table Editor → doctors 中查看

---

### 方法 3：检查关联状态

运行以下 SQL 查询检查哪些医生已关联：

```sql
SELECT 
  d.id,
  d.name,
  d.user_id,
  u.email as user_email
FROM public.doctors d
LEFT JOIN auth.users u ON d.user_id = u.id
ORDER BY d.created_at DESC;
```

---

## ✅ 验证设置

关联完成后：

1. **刷新网页**
2. **进入 "Consultations" 页面**
3. **选择分配给该医生的咨询会话**
4. **应该能看到输入框并可以发送消息**

如果输入框被禁用或显示警告，说明：
- 医生账户未关联到当前用户
- 或者当前用户不是该咨询的医生

---

## 🔧 常见问题

### Q: 为什么我看不到 "Link to My Account" 按钮？
**A:** 可能的原因：
- 医生已经关联到其他用户
- 你还没有登录
- 医生卡片正在编辑模式

### Q: 关联后还是不能回复？
**A:** 检查：
1. 刷新页面
2. 确认你选择的咨询会话的 `doctor_id` 匹配你关联的医生 ID
3. 检查浏览器控制台是否有错误

### Q: 可以一个用户关联多个医生吗？
**A:** 目前系统允许，但建议一个用户只关联一个医生账户，避免混淆。

---

## 📝 注意事项

- 医生账户必须关联到用户账户才能回复消息
- 关联后，该用户登录时就能看到分配给该医生的所有咨询
- 如果医生账户没有关联用户，该医生无法回复任何咨询

