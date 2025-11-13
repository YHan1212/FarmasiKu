# 如何创建用户 Profile 自动触发器

## 📋 方法一：创建数据库触发器（详细步骤）

### 步骤 1：打开 Supabase SQL Editor

1. 访问 [https://app.supabase.com](https://app.supabase.com)
2. 登录并选择你的项目
3. 在左侧菜单，点击 **"SQL Editor"**

### 步骤 2：创建新查询

1. 在 SQL Editor 页面，点击右上角的 **"New query"** 按钮
2. 或者点击 **"+"** 图标创建新标签页

### 步骤 3：复制 SQL 代码

复制以下**全部代码**：

```sql
-- Database Trigger to Automatically Create User Profile
-- This trigger automatically creates a user_profile when a new user signs up

-- Function to create user profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, age)
  VALUES (NEW.id, NULL)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger that fires when a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 步骤 4：粘贴并运行

1. 在 SQL Editor 中，按 `Ctrl+V`（Windows）或 `Cmd+V`（Mac）粘贴代码
2. 点击右上角的 **"Run"** 按钮
3. 或者按 `Ctrl+Enter`（Windows）或 `Cmd+Enter`（Mac）

### 步骤 5：检查结果

- ✅ **成功**：会显示 "Success. No rows returned"
- ❌ **错误**：会显示红色错误信息（告诉我具体错误）

---

## 🔧 方法二：为现有用户创建 Profile（更简单）

如果你已经有注册的用户但没有 profile，运行这个：

### 步骤：

1. 在 Supabase SQL Editor 中创建新查询
2. 复制以下代码：

```sql
-- 为所有现有用户创建 profile（如果还没有）
INSERT INTO public.user_profiles (id, age)
SELECT id, NULL
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.user_profiles)
ON CONFLICT (id) DO NOTHING;
```

3. 粘贴并运行
4. 检查结果：应该显示 "Success. X rows inserted"（X 是创建的数量）

---

## ✅ 验证是否成功

运行以下查询检查：

```sql
-- 查看所有用户和他们的 profile
SELECT 
  u.id,
  u.email,
  u.created_at as user_created,
  p.id as profile_id,
  p.age,
  p.created_at as profile_created
FROM auth.users u
LEFT JOIN public.user_profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
```

**预期结果**：
- 每个用户都应该有一个对应的 profile
- `profile_id` 不应该为 NULL

---

## 🎯 推荐操作顺序

1. **先运行方法二**（为现有用户创建 profile）
2. **再运行方法一**（为未来新用户自动创建）

这样：
- ✅ 现有用户立即有 profile
- ✅ 未来新注册用户自动创建 profile

---

## ❓ 如果遇到错误

### 错误："permission denied"
- **原因**：可能需要管理员权限
- **解决**：确保你以项目所有者身份登录

### 错误："function already exists"
- **原因**：函数已存在
- **解决**：可以忽略，或者先删除再创建

### 错误："trigger already exists"
- **原因**：触发器已存在
- **解决**：可以忽略，脚本已经使用了 `DROP TRIGGER IF EXISTS`

---

## 📸 截图说明位置

1. **SQL Editor 位置**：左侧菜单栏，图标是 🔍
2. **New query 按钮**：右上角，蓝色按钮
3. **Run 按钮**：右上角，绿色按钮，或使用快捷键

---

## 💡 提示

- 触发器创建后，**所有新注册的用户都会自动创建 profile**
- 不需要修改代码，完全由数据库自动处理
- 如果触发器创建失败，应用代码仍会尝试创建 profile（双重保障）

