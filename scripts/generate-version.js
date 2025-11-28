const { execSync } = require('child_process')
const { writeFileSync } = require('fs')
const { resolve } = require('path')

try {
  // 优先使用 Vercel 环境变量（如果可用）
  let gitCommitHash = process.env.VERCEL_GIT_COMMIT_SHA || null
  let gitCommitDate = null
  let gitCommitMessage = process.env.VERCEL_GIT_COMMIT_MESSAGE || null
  let gitBranch = process.env.VERCEL_GIT_COMMIT_REF || process.env.VERCEL_GIT_COMMIT_BRANCH || null

  // 如果 Vercel 环境变量不可用，尝试从 Git 获取
  if (!gitCommitHash) {
    try {
      gitCommitHash = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim()
      gitCommitDate = execSync('git log -1 --format=%ci', { encoding: 'utf-8' }).trim()
      gitCommitMessage = gitCommitMessage || execSync('git log -1 --format=%s', { encoding: 'utf-8' }).trim()
      gitBranch = gitBranch || execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim()
    } catch (gitError) {
      console.warn('⚠️ Git commands failed, using fallback:', gitError.message)
      // 如果 Git 命令也失败，使用默认值
      gitCommitHash = 'unknown'
      gitCommitDate = new Date().toISOString()
      gitCommitMessage = gitCommitMessage || 'Unknown'
      gitBranch = gitBranch || 'unknown'
    }
  } else {
    // 如果使用 Vercel 环境变量，设置提交日期为当前时间
    gitCommitDate = new Date().toISOString()
  }
  
  // 获取当前时间（构建时间）
  const buildTime = new Date().toISOString()
  const buildDate = new Date().toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  
  // 格式化提交日期
  const commitDate = new Date(gitCommitDate).toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  
  const versionInfo = {
    commitHash: gitCommitHash.substring(0, 7), // 短哈希
    commitHashFull: gitCommitHash,
    commitDate: commitDate,
    commitDateISO: gitCommitDate,
    commitMessage: gitCommitMessage,
    branch: gitBranch,
    buildTime: buildDate,
    buildTimeISO: buildTime
  }
  
  // 写入文件
  const outputPath = resolve(process.cwd(), 'src/version.json')
  writeFileSync(outputPath, JSON.stringify(versionInfo, null, 2), 'utf-8')
  
  console.log('✅ Version info generated:', versionInfo)
} catch (error) {
  console.error('❌ Error generating version info:', error.message)
  // 如果 Git 命令失败，创建默认版本信息
  const defaultVersion = {
    commitHash: 'unknown',
    commitHashFull: 'unknown',
    commitDate: new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    commitDateISO: new Date().toISOString(),
    commitMessage: 'Unknown',
    branch: 'unknown',
    buildTime: new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }),
    buildTimeISO: new Date().toISOString()
  }
  
  const outputPath = resolve(process.cwd(), 'src/version.json')
  writeFileSync(outputPath, JSON.stringify(defaultVersion, null, 2), 'utf-8')
  console.log('⚠️ Using default version info')
}

