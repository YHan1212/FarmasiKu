# Git 找回历史记录指南

## 📋 常用命令

### 1. 查看提交历史

```bash
# 查看简洁的提交历史（最近 20 条）
git log --oneline -20

# 查看详细的提交历史（带作者和时间）
git log --graph --pretty=format:"%h - %an, %ar : %s" -10

# 查看某个文件的修改历史
git log --oneline -- src/components/ConsultationQueue.jsx

# 查看某个提交的详细内容
git show <commit-hash>
```

### 2. 查看某个提交的文件变化

```bash
# 查看某个提交修改了哪些文件
git show --stat <commit-hash>

# 查看某个提交的具体代码变化
git show <commit-hash>

# 查看某个文件在某个提交时的内容
git show <commit-hash>:<文件路径>
```

### 3. 恢复文件到之前的版本

#### 方法 1: 恢复单个文件到某个提交的版本（不改变当前提交）

```bash
# 恢复文件到某个提交的版本（会保留在工作区，需要手动提交）
git checkout <commit-hash> -- <文件路径>

# 例如：恢复 ConsultationQueue.jsx 到提交 fe4990e
git checkout fe4990e -- src/components/ConsultationQueue.jsx
```

#### 方法 2: 查看某个文件的历史版本内容

```bash
# 查看文件在某个提交时的内容（只查看，不恢复）
git show <commit-hash>:<文件路径> > <新文件名>

# 例如：查看旧版本的 ConsultationQueue.jsx
git show fe4990e:src/components/ConsultationQueue.jsx > ConsultationQueue_old.jsx
```

#### 方法 3: 完全回退到某个提交（危险！会丢失之后的提交）

```bash
# ⚠️ 警告：这会删除之后的所有提交！
# 软回退（保留文件修改，可以重新提交）
git reset --soft <commit-hash>

# 硬回退（完全删除之后的修改，无法恢复！）
git reset --hard <commit-hash>
```

### 4. 创建新分支来保存当前工作

```bash
# 在恢复之前，先创建一个分支保存当前状态
git branch backup-before-recovery

# 然后可以安全地尝试恢复
git checkout <commit-hash> -- <文件路径>
```

### 5. 比较不同版本的文件

```bash
# 比较当前版本和某个提交的差异
git diff <commit-hash> -- <文件路径>

# 比较两个提交之间的差异
git diff <commit-hash-1> <commit-hash-2> -- <文件路径>
```

## 🎯 实际例子

### 例子 1: 查看 ConsultationQueue.jsx 的历史版本

```bash
# 1. 查看这个文件的所有提交历史
git log --oneline -- src/components/ConsultationQueue.jsx

# 2. 查看某个提交时的文件内容（例如 fe4990e）
git show fe4990e:src/components/ConsultationQueue.jsx

# 3. 恢复文件到某个版本（例如 fe4990e）
git checkout fe4990e -- src/components/ConsultationQueue.jsx

# 4. 查看恢复后的差异
git diff HEAD -- src/components/ConsultationQueue.jsx

# 5. 如果满意，提交更改
git add src/components/ConsultationQueue.jsx
git commit -m "恢复 ConsultationQueue.jsx 到旧版本"
```

### 例子 2: 查看整个项目的某个提交状态

```bash
# 1. 查看提交列表
git log --oneline -10

# 2. 查看某个提交的详细信息
git show 3ba3ec8

# 3. 临时切换到某个提交查看（不会修改当前分支）
git checkout 3ba3ec8

# 4. 查看完毕后，回到最新版本
git checkout main
```

### 例子 3: 恢复多个文件到某个提交

```bash
# 恢复多个文件到提交 fe4990e
git checkout fe4990e -- src/components/ConsultationQueue.jsx src/services/consultationService.js

# 查看恢复后的状态
git status

# 提交恢复的文件
git add src/components/ConsultationQueue.jsx src/services/consultationService.js
git commit -m "恢复多个文件到旧版本"
```

## 🔍 根据提交信息查找

### 查找包含特定关键词的提交

```bash
# 查找包含 "waiting" 的提交
git log --grep="waiting" --oneline

# 查找包含 "queue" 的提交
git log --grep="queue" --oneline

# 查找修改了某个文件的提交
git log --all --full-history -- src/components/ConsultationQueue.jsx
```

## 📝 重要提示

1. **在恢复之前先备份**：
   ```bash
   git branch backup-$(date +%Y%m%d-%H%M%S)
   ```

2. **查看差异再决定**：
   ```bash
   git diff <commit-hash> -- <文件路径>
   ```

3. **使用 `git show` 先查看内容**，确认是正确的版本再恢复

4. **避免使用 `git reset --hard`**，除非你确定要删除之后的提交

5. **如果已经 push 到远程，恢复后需要 force push**（谨慎使用）：
   ```bash
   git push --force
   ```

## 🆘 如果误操作了怎么办？

```bash
# 查看所有操作历史（包括被删除的提交）
git reflog

# 恢复到 reflog 中显示的某个状态
git reset --hard <reflog-hash>
```

## 📚 更多资源

- `git log --help` - 查看 log 命令的详细帮助
- `git show --help` - 查看 show 命令的详细帮助
- `git checkout --help` - 查看 checkout 命令的详细帮助

