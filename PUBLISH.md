# 发布指南

## 发布到 npm 的步骤

### 1. 准备工作

确保您已经：
- 注册了 npm 账户
- 在本地登录了 npm (`npm login`)
- 有权限发布到您的组织（如果使用 scoped package）

### 2. 修改配置

在发布前，请修改以下配置：

#### package.json
```json
{
  "name": "@yourorg/nifti-volume-loader",  // 改为您的组织名
  "repository": "https://github.com/yourusername/nifti-volume-loader",  // 改为您的仓库
}
```

#### 贡献者信息
```json
{
  "contributors": [
    {
      "name": "Your Name",           // 改为您的姓名
      "email": "your.email@example.com"  // 改为您的邮箱
    }
  ]
}
```

### 3. 构建和发布

```bash
# 1. 安装依赖
npm install

# 2. 运行准备脚本
node prepare-publish.js

# 3. 构建包
npm run build

# 4. 检查构建结果
ls -la dist/esm/

# 5. 发布到 npm
npm publish
```

### 4. 验证发布

发布成功后，您可以：

```bash
# 在新项目中测试安装
npm install @yourorg/nifti-volume-loader

# 检查包信息
npm info @yourorg/nifti-volume-loader
```

### 5. 使用示例

```javascript
import { 
  cornerstoneNiftiImageLoader, 
  createNiftiImageIdsAndCacheMetadata,
  init 
} from '@yourorg/nifti-volume-loader';

// 初始化
init();

// 使用
const imageIds = await createNiftiImageIdsAndCacheMetadata({
  url: 'path/to/nifti/file.nii.gz'
});
```

## 注意事项

1. **版本管理**: 每次发布前记得更新版本号
2. **依赖管理**: 确保 peer dependencies 正确配置
3. **文档更新**: 保持 README 和 API 文档的更新
4. **测试**: 发布前在真实项目中测试包的功能

## 常见问题

### Q: 发布失败，提示权限错误
A: 确保您已登录 npm 并有权限发布到指定的 scope

### Q: 包名冲突
A: 使用 scoped package 名称，如 `@yourorg/package-name`

### Q: 构建失败
A: 检查 TypeScript 配置和依赖是否正确安装
