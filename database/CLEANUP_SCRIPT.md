# 清理 SQL 文件脚本

## 🗑️ 可以安全删除的文件

以下文件是测试/诊断用的，可以删除：

1. `diagnose_registration.sql` - 诊断脚本
2. `check_trigger.sql` - 检查触发器
3. `check_users.sql` - 检查用户
4. `fix_missing_profiles.sql` - 临时修复（已包含在 fix_registration_issues.sql）
5. `clear_all_users.sql` - 详细清空脚本（quick_clear.sql 更简洁）

## ✅ 必须保留的文件

1. `schema.sql` - **数据库架构（必需）**
2. `migrate_medications.sql` - **药物数据（必需）**
3. `create_profile_trigger.sql` - **用户触发器（必需）**
4. `fix_registration_issues.sql` - 维护脚本（建议保留）
5. `quick_clear.sql` - 快速清空（测试用，建议保留）

## 📋 清理步骤

### 方法 1：手动删除

在文件管理器中删除以下文件：
- `database/diagnose_registration.sql`
- `database/check_trigger.sql`
- `database/check_users.sql`
- `database/fix_missing_profiles.sql`
- `database/clear_all_users.sql`

### 方法 2：使用命令行（Windows PowerShell）

```powershell
cd C:\Users\lingy\FarmasiKu\database

# 删除测试/诊断文件
Remove-Item diagnose_registration.sql
Remove-Item check_trigger.sql
Remove-Item check_users.sql
Remove-Item fix_missing_profiles.sql
Remove-Item clear_all_users.sql
```

## ✨ 清理后的文件结构

清理后，`database/` 文件夹应该包含：

```
database/
├── schema.sql                    ✅ 核心
├── migrate_medications.sql       ✅ 核心
├── create_profile_trigger.sql    ✅ 核心
├── fix_registration_issues.sql   ✅ 维护
├── quick_clear.sql              ✅ 测试
└── [各种 .md 文档文件]
```

## ⚠️ 重要提醒

- 这些 SQL 文件只是**本地副本**
- 删除它们**不会影响** Supabase 数据库
- 数据库的实际结构和数据在 Supabase 云端
- 如果以后需要这些脚本，可以从 Git 历史中恢复

