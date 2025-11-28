const { execSync } = require('child_process')
const { writeFileSync } = require('fs')
const { resolve } = require('path')

try {
  // 获取 Git 信息
  const gitCommitHash = execSync('git rev-parse HEAD', { encoding: 'utf-8' }).trim()
  const gitCommitDate = execSync('git log -1 --format=%ci', { encoding: 'utf-8' }).trim()
  const gitCommitMessage = execSync('git log -1 --format=%s', { encoding: 'utf-8' }).trim()
  const gitBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim()
  
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

