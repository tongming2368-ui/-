# 📷 一体两面·摄影工具站

> 极简线条 × 毛玻璃质感 · 工具与社区的双生世界

## 项目简介

一个双模式摄影网站：
- **A面 - 工具站**：实用工具 + 社区互动 + 资源分享
- **B面 - 摄影之家**：摄影知识库 + 器材库 + 大师作品

## 技术栈

- **前端**：Vue 3 + Vite + Tailwind CSS + Pinia + Vue Router
- **后端**：WordPress REST API + MySQL
- **UI风格**：Glassmorphism (毛玻璃拟态) + 极简线条

## 本地开发

```bash
cd /home/mztm/phototool
npm run dev
```

访问 `http://localhost:3000`

## 构建

```bash
npm run build
```

构建产物在 `dist/` 目录，部署到 WordPress 主题目录。

## 项目结构

```
src/
├── components/
│   ├── layout/         # 布局组件
│   │   ├── AppSidebar.vue
│   │   └── TopBar.vue
│   ├── common/         # 通用组件
│   │   ├── Modal.vue
│   │   ├── GlassCard.vue
│   │   └── GlassButton.vue
│   ├── post/           # 帖子相关组件
│   └── chat/           # 聊天室组件
├── views/              # 页面视图
│   ├── Home.vue        # 首页
│   ├── Posts.vue       # 帖子区
│   ├── Tools.vue       # 工具区
│   ├── Camera.vue      # 相机库
│   ├── Lens.vue        # 镜头库
│   ├── Compare.vue     # 参数对比
│   ├── Gallery.vue     # 美图展示
│   ├── UserCenter.vue  # 用户中心
│   └── ...
├── stores/             # Pinia 状态管理
│   ├── mode.js         # 双模式切换
│   ├── user.js         # 用户状态
│   └── posts.js        # 帖子状态
├── config/             # 配置文件
│   ├── menu.js         # 菜单配置
│   └── level.js        # 等级配置
├── router/             # 路由配置
└── App.vue             # 根组件
```

## 开发进度

- [x] 项目初始化 + Vue 3 + Vite
- [x] 双模式切换 (工具站/摄影之家)
- [x] 毛玻璃 UI 组件库
- [x] 侧边栏导航
- [x] 首页布局
- [x] 帖子系统（列表、详情、发帖、评论）
- [x] 聊天室悬浮窗
- [ ] 器材库（相机/镜头）
- [ ] 参数对比
- [ ] 美图展示（瀑布流）
- [ ] 用户中心完善
- [ ] 工具箱（EXIF/压缩/景深）
- [ ] 后台管理
- [ ] WordPress API 对接

## 部署到 XAMPP

1. 启动 XAMPP Apache + MySQL
2. 访问 `http://localhost` 安装 WordPress
3. 将构建产物复制到 `wp-content/themes/phototool/`
4. 执行 `setup-database.sql` 创建扩展表
5. 在 WordPress 后台启用主题
