# 智测云 - AI 智能测评与学情分析系统

<p align="center">
  <img src="https://img.shields.io/badge/React-18-blue?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square&logo=typescript" />
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat-square&logo=tailwind-css" />
  <img src="https://img.shields.io/badge/Express-4.21-black?style=flat-square&logo=express" />
  <img src="https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite" />
  <img src="https://img.shields.io/badge/Chart.js-4.5-FF6384?style=flat-square&logo=chart.js" />
</p>

<p align="center">
  <b>AI 驱动的 K-9 素质教育测评平台</b>
</p>

<p align="center">
  覆盖 AIGC / Scratch / Python / C++ / 数理逻辑 五大测评方向，
  智能出题、六维度分析报告、个性化课程推荐，让每个孩子都被看见。
</p>

---

## 功能特性

### 核心功能

- **AI 智能出题** - 根据知识点自动生成高质量测评题目，覆盖五大方向
- **六维度学情分析** - 知识掌握度、逻辑思维、学习潜力、薄弱环节、优势领域、发展建议
- **防作弊监控** - 页面切换检测、答题时间追踪、异常行为标记
- **智能组卷** - 根据知识点分布和难度梯度生成个性化试卷
- **课程推荐** - 基于测评结果智能推荐学习路径和班级
- **数据可视化** - 雷达图、柱状图、环形图多维展示学情数据

### AI 智能体管理

系统内置五大 AI 智能体，每个智能体可独立配置：

- 测评报告 AI 分析
- AI 智能出题
- AI 题目审核
- 智能组卷
- 智能课程推荐

### 多角色权限

- **学生端** - 在线测评、查看报告、接收通知
- **教师端** - 班级管理、学生录入、报表查看、通知下发
- **管理端** - 用户管理、题库管理、AI 配置、学情大盘

---

## 技术栈

### 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3 | UI 框架 |
| TypeScript | 5.8 | 类型安全 |
| Vite | 6.4 | 构建工具 |
| Tailwind CSS | 3.4 | 样式框架 |
| Chart.js | 4.5 | 数据可视化 |
| Lucide React | 0.511 | 图标库 |
| Zustand | 5.0 | 状态管理 |

### 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Express | 4.21 | Web 框架 |
| SQLite3 | 6.0 | 数据库 |
| bcryptjs | 3.0 | 密码加密 |
| jsonwebtoken | 9.0 | JWT 认证 |
| html2canvas | 1.4 | 海报生成 |
| jsPDF | 4.2 | PDF 导出 |

---

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
# 克隆项目
git clone https://github.com/polikm/smart-assessment-system.git
cd smart-assessment-system

# 安装依赖
npm install
```

### 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，配置你的 AI API Key
```

### 启动开发服务器

```bash
# 方式一：同时启动前后端
npm run dev

# 方式二：分别启动
npm run client:dev   # 前端 http://localhost:5173
npm run server:dev   # 后端 http://localhost:3001
```

### 构建生产版本

```bash
npm run build
```

---

## 部署指南

### Vercel 部署（推荐）

本项目已配置 Vercel 部署，支持 Serverless 部署。

1. 在 [Vercel](https://vercel.com) 导入 GitHub 仓库
2. 配置环境变量（在 Vercel Dashboard 的 Settings > Environment Variables 中添加）
3. 部署完成后即可访问

### 手动部署

```bash
# 构建前端
npm run build

# 启动后端服务（生产环境）
cd api
npx tsx server.ts
```

---

## 环境变量说明

| 变量名 | 必填 | 说明 |
|--------|------|------|
| `DATABASE_URL` | 是 | SQLite 数据库文件路径 |
| `JWT_SECRET` | 是 | JWT 签名密钥（生产环境务必修改） |
| `AI_API_KEY` | 是 | AI API Key（支持 OpenAI 兼容格式） |
| `PORT` | 否 | 后端服务端口，默认 3001 |

详见 [.env.example](.env.example)

---

## 项目结构

```
smart-assessment-system/
├── api/                    # 后端代码
│   ├── routes/            # API 路由
│   ├── utils/             # 工具函数
│   ├── db.ts              # 数据库配置
│   ├── app.ts             # Express 应用
│   ├── server.ts          # 服务入口
│   └── .env.example       # 环境变量模板
├── src/                    # 前端代码
│   ├── components/        # 组件
│   │   └── landing/       # 首页组件
│   ├── pages/             # 页面
│   │   ├── student/       # 学生端
│   │   ├── teacher/       # 教师端
│   │   └── admin/         # 管理端
│   ├── hooks/             # 自定义 Hooks
│   ├── stores/            # 状态管理
│   ├── api/               # API 客户端
│   ├── types/             # 类型定义
│   ├── App.tsx            # 路由配置
│   └── main.tsx           # 应用入口
├── public/                 # 静态资源
├── dist/                   # 构建输出
├── vercel.json            # Vercel 配置
├── package.json           # 项目配置
├── tailwind.config.js     # Tailwind 配置
├── tsconfig.json          # TypeScript 配置
└── README.md              # 项目文档
```

---

## 系统截图

> 此处放置系统截图

### 首页

![首页截图](screenshots/home.png)

### 学生测评

![测评截图](screenshots/exam.png)

### AI 分析报告

![报告截图](screenshots/report.png)

### 管理后台

![后台截图](screenshots/admin.png)

---

## 开源协议

[MIT](LICENSE)

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/polikm">polikm</a>
</p>
