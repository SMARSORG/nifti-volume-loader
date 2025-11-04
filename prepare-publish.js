#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('准备发布 nifti-volume-loader 包...');

// 生成版本文件
const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const versionContent = `export const version = '${packageJson.version}';
export default version;
`;

// 确保 src 目录存在
if (!fs.existsSync('./src')) {
  fs.mkdirSync('./src');
}

fs.writeFileSync('./src/version.ts', versionContent);
console.log('✅ 版本文件已生成');

// 检查必要的依赖
const requiredDeps = ['typescript'];
const packageJsonContent = fs.readFileSync('./package.json', 'utf8');

requiredDeps.forEach(dep => {
  if (!packageJsonContent.includes(dep)) {
    console.warn(`⚠️  建议添加 ${dep} 作为 devDependency`);
  }
});

console.log('✅ 发布准备完成！');
console.log('\n下一步：');
console.log('1. npm install');
console.log('2. npm run build');
console.log('3. npm publish');
