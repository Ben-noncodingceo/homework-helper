# AI 作业生成器 — 架构文档

> 本文档供多人协作开发使用，阅读完可以直接上手参与任意模块。

---

## 项目定位

本地运行的 **中国 K-12 AI 作业生成工具**。老师/学生选择学科、年级、知识点，AI 按难度分级生成练习题，支持在线答题、答案解析和打印。

---

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS v3 |
| 路由 | React Router v6 |
| 图表渲染 | Recharts |
| 数学公式 | KaTeX (`$...$` 内联 LaTeX) |
| 后端 | Node.js + Express + TypeScript |
| 数据库 | @libsql/client（本地 SQLite 或 Turso 云数据库） |
| AI 调用 | 原生 `fetch`，支持 Anthropic 协议和 OpenAI 兼容协议 |

---

## 目录结构

```
homework-helper/
├── api/
│   └── index.ts                  # Vercel Serverless 入口（导出 Express app）
├── vercel.json                   # Vercel 部署配置
├── .env.example                  # 环境变量示例
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express 入口，端口 3001（导出 app 供 serverless 使用）
│   │   ├── db.ts                 # LibSQL/Turso 连接、建表、CRUD helpers
│   │   ├── data/
│   │   │   └── knowledgePoints.ts  # 所有学科/年级/知识点静态数据
│   │   ├── services/
│   │   │   ├── aiClient.ts       # AI HTTP 调用（Anthropic / OpenAI 协议）
│   │   │   └── promptBuilder.ts  # 构建生成题目的 prompt
│   │   └── routes/
│   │       ├── config.ts         # GET/POST /api/config
│   │       ├── homework.ts       # POST /api/homework/generate, GET /api/homework/:id, GET /api/homework/history
│   │       └── subjects.ts       # GET /api/subjects
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── index.html
│   ├── vite.config.ts            # 代理 /api → localhost:3001，build → backend/public
│   ├── tailwind.config.js
│   └── src/
│       ├── main.tsx
│       ├── App.tsx               # BrowserRouter + Nav + Routes
│       ├── index.css             # Tailwind directives + fish-slot keyframes + print CSS
│       ├── types/
│       │   ├── index.ts          # Question, HomeworkSet, AppConfig 等核心类型
│       │   └── subjects.ts       # Subject / GradeLevel / KnowledgePoint 类型
│       ├── api/
│       │   └── client.ts         # 封装所有后端 API 调用
│       ├── components/
│       │   └── ui/
│       │       ├── FishSlot.tsx        # 滚动鱼表情动画（quiz footer）
│       │       ├── LoadingOverlay.tsx  # 全屏等待动画 + 趣味文案轮播
│       │       ├── MathText.tsx        # $...$ 内联 KaTeX 渲染
│       │       └── ChartRenderer.tsx   # Recharts 图表（bar/line/pie/table/geometry）
│       └── pages/
│           ├── HomePage.tsx      # 五步向导生成作业
│           ├── PreviewPage.tsx   # 预览（难度 tabs）+ 打印
│           ├── QuizPage.tsx      # 在线答题 + fish footer
│           ├── ConfigPage.tsx    # AI 三角色配置 + 地区设置
│           └── HistoryPage.tsx   # 分页历史列表
│
├── package.json                  # 根级 dev/build/start 脚本（用 concurrently）
└── ARCHITECTURE.md               # 本文件
```

---

## AI 三角色设计

配置页面（`/config`）区分三类 AI，各自独立配置 `provider / apiKey / model / baseUrl`：

| 角色 | 用途 | 推荐模型 |
|---|---|---|
| **主力 AI** (`primary`) | 生成大多数题目（文字型） | claude-opus-4-5 / gpt-4o |
| **备选 AI** (`fallback`) | 主力调用失败时自动切换 | 任意 OpenAI 兼容接口 |
| **多模态 AI** (`multimodal`) | 图表题数据生成 + 图表解析 | claude-opus-4-5（支持视觉的版本） |

调用逻辑在 `backend/src/services/aiClient.ts`：
- `callWithFallback(primary, fallback, messages)` — 主力失败自动降级
- `callAI(multimodal, messages)` — 专门用于图表内容

---

## 数据库 Schema

```sql
-- AI 配置和地区设置，key-value 扁平存储
CREATE TABLE config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- key 示例: ai.primary.apiKey, ai.fallback.model, province

-- 生成的作业集合
CREATE TABLE homework (
  id         TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  subject    TEXT NOT NULL,
  grade      TEXT NOT NULL,
  summary    TEXT NOT NULL,  -- 简短描述，用于历史列表
  data       TEXT NOT NULL   -- JSON，完整 HomeworkSet
);
```

---

## 题目数据结构

```typescript
interface Question {
  id: string;
  type: 'multiple_choice' | 'fill_blank' | 'true_false' | 'solve' | 'word_problem' | 'chart';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;        // 支持 $LaTeX$ 内联
  chart?: ChartData | null; // 图表题填充，其他为 null
  options?: string[];      // 选择题 A/B/C/D
  answer: string;
  explanation: string;
  knowledgePoint: string;
}

interface ChartData {
  type: 'bar' | 'pie' | 'line' | 'table' | 'geometry';
  title: string;
  labels?: string[];
  datasets?: { label: string; data: number[] }[];
  tableHeaders?: string[];
  tableRows?: string[][];
  description?: string;   // geometry 类型的文字描述
}
```

---

## 主要 API

| Method | Path | 说明 |
|---|---|---|
| GET | `/api/config` | 读取全量配置 |
| POST | `/api/config` | 批量更新配置 |
| GET | `/api/subjects` | 获取所有学科/年级/知识点 |
| POST | `/api/homework/generate` | 生成作业（调用 AI） |
| GET | `/api/homework/:id` | 读取一份作业 |
| GET | `/api/homework/history` | 分页历史（`?page=1`） |

---

## 关键组件说明

### `LoadingOverlay`
全屏遮罩，AI 调用期间显示。以 2.8 秒间隔轮播以下幽默文案：
- AI 正在努力思考 / 蔡子星正在和 AI 博弈 / AI 正在思考三大定律
- 教育正在被重塑 / AI 在思考人类的必要性 / AI 思路陷入死胡同
- AI 在考虑是否要对人类发动入侵 / AI 决定继续假装很听话 / AI 就快完成工作了

### `FishSlot`
quiz 页底部的鱼表情老虎机动画，CSS `steps(6, end)` 逐帧滚动，大小 = 1em（与汉字同高）。
配合 footer 文案：`教学就是授人以鱼，考之以鲞鲔鲭鲮鲴鲹鲷鲽鲼鲀鲙鲠鲵鲋鲰鲥鲿鲺鯼鰴`

### `MathText`
按 `$...$` 分割字符串，数学片段用 `katex.renderToString()` 渲染，普通文本直接输出，安全无副作用。

### `ChartRenderer`
接收 `ChartData` 对象，按 `type` 分发到对应 Recharts 组件（BarChart / LineChart / PieChart / table / geometry 文字描述）。

---

## 本地运行

```bash
# 安装依赖
npm run install:all

# 开发（前后端并行）
npm run dev

# 生产构建 + 启动
npm run build
npm start
```

访问 http://localhost:5173（dev）或 http://localhost:3001（prod）

---

## 部署到 Vercel

### 前置准备

1. **创建 Turso 数据库**（免费）：
   ```bash
   # 安装 Turso CLI
   curl -sSfL https://get.tur.so/install.sh | bash

   # 注册 & 登录
   turso auth signup   # 或 turso auth login

   # 创建数据库
   turso db create homework-helper

   # 获取连接信息
   turso db show homework-helper --url        # → libsql://xxx.turso.io
   turso db tokens create homework-helper      # → eyJhbGci...
   ```

2. **部署到 Vercel**：
   ```bash
   # 安装 Vercel CLI
   npm i -g vercel

   # 在项目根目录
   vercel
   ```

3. **配置环境变量**（Vercel Dashboard → Settings → Environment Variables）：
   | 变量 | 值 |
   |---|---|
   | `DATABASE_URL` | `libsql://your-db.turso.io` |
   | `DATABASE_AUTH_TOKEN` | Turso 生成的 token |

4. **重新部署**：
   ```bash
   vercel --prod
   ```

### 部署到 Cloudflare Pages（替代方案）

如需部署到 Cloudflare，需要额外改造：
- 将 Express 替换为 Hono（Cloudflare Workers 兼容）
- 使用 Cloudflare D1 替代 Turso（或 Turso 也可与 Workers 配合）
- 配置 `wrangler.toml`

当前代码已兼容 Vercel，Cloudflare 方案需要更多改动。

---

## 新增知识点

编辑 `backend/src/data/knowledgePoints.ts`，在对应 subject 的 grades 数组里追加即可，字段：

```typescript
{ id: 'unique_id', name: '知识点名称', hasChart?: true }
```

`hasChart: true` 表示该知识点常见图表题，UI 会显示 📊 标识。

---

## 待开发 / 已知 TODO

- [ ] 流式输出（SSE）避免前端长时间无响应
- [ ] 图片上传：让多模态 AI 分析用户上传的题目图片
- [ ] 错题本：记录答错的题，生成专项练习
- [ ] 导出 PDF（浏览器打印已支持，可进一步接入 puppeteer）
- [ ] 多用户支持（目前单用户本地工具）
- [ ] 知识点难度自适应（根据答题历史调整出题权重）
