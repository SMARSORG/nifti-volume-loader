# @yourorg/nifti-volume-loader

独立的 NIfTI 体积数据加载器，基于 Cornerstone3D 框架。

## 安装

```bash
npm install @yourorg/nifti-volume-loader
```

## 使用方法

### 基本使用

```js
import { 
  cornerstoneNiftiImageLoader, 
  createNiftiImageIdsAndCacheMetadata,
  init 
} from '@yourorg/nifti-volume-loader';

// 初始化加载器
init();

// 创建图像 ID 并缓存元数据
const imageIds = await createNiftiImageIdsAndCacheMetadata({
  url: 'path/to/your/nifti/file.nii.gz'
});
```

### 自定义请求头

您可以为加载器发出的请求注入自定义头部，这对于身份验证很有用：

```js
import { init } from '@yourorg/nifti-volume-loader';

init({
  beforeSend: (xhr, headers, url) => {
    headers['Authorization'] = 'Bearer your-token';
    headers['Custom-Header'] = 'Custom-Value';
    return headers;
  },
});
```

### API 参考

#### `cornerstoneNiftiImageLoader`
主要的图像加载器函数。

#### `createNiftiImageIdsAndCacheMetadata(options)`
创建 NIfTI 图像 ID 并缓存元数据。

**参数：**
- `options.url` - NIfTI 文件的 URL

#### `init(config)`
初始化加载器配置。

**参数：**
- `config.beforeSend` - 请求前的回调函数

## 依赖要求

此包需要 `@cornerstonejs/core` 作为 peer dependency。

```bash
npm install @cornerstonejs/core
```

## 许可证

MIT
