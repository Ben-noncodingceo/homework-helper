import { getSubject, getGradeLevel } from '../data/knowledgePoints';

export interface GenerateParams {
  subjectId: string;
  grade: string;
  knowledgePointIds: string[];
  questionTypes: string[];
  counts: { easy: number; medium: number; hard: number };
  province: string;
  city: string;
}

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: '选择题',
  fill_blank: '填空题',
  true_false: '判断题',
  solve: '解答题',
  word_problem: '应用题',
  chart: '图表题',
};

export function buildGeneratePrompt(params: GenerateParams): string {
  const subject = getSubject(params.subjectId);
  const gradeLevel = getGradeLevel(params.subjectId, params.grade);
  const subjectName = subject?.name ?? params.subjectId;
  const gradeLabel = gradeLevel?.label ?? params.grade;

  const kpNames = params.knowledgePointIds
    .map((id) => gradeLevel?.points.find((p) => p.id === id)?.name ?? id)
    .join('、');

  const typeStr = params.questionTypes.map((t) => TYPE_LABELS[t] ?? t).join('、');
  const total = params.counts.easy + params.counts.medium + params.counts.hard;

  return `你是一位专业的中国K-12教育老师，精通${subjectName}学科。
请根据以下要求生成题目，严格以JSON数组格式返回，不要有任何其他内容。

【基本信息】
- 学科：${subjectName}
- 年级：${gradeLabel}
- 知识点：${kpNames}
- 地区：${params.province} ${params.city}（请考虑该地区教材特点和考试风格）
- 题型要求：${typeStr}

【数量要求】
- 简单（easy）：${params.counts.easy}题
- 中等（medium）：${params.counts.medium}题
- 困难（hard）：${params.counts.hard}题
- 合计：${total}题

【输出格式】
返回一个JSON数组，每个元素结构如下：
{
  "id": "q1",
  "type": "multiple_choice|fill_blank|true_false|solve|word_problem|chart",
  "difficulty": "easy|medium|hard",
  "question": "题目文本，数学公式用$...$包裹，如 $x^2+1=0$",
  "chart": null 或 {
    "type": "bar|pie|line|table|geometry",
    "title": "图表标题",
    "labels": ["标签1", "标签2"],
    "datasets": [{"label": "数据系列", "data": [1, 2, 3]}],
    "tableHeaders": ["列1", "列2"],
    "tableRows": [["数据", "数据"]],
    "description": "几何图形文字描述（geometry类型时使用）"
  },
  "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"] 或 null,
  "answer": "A 或 正确 或 具体答案",
  "explanation": "详细解析，包含解题过程",
  "knowledgePoint": "对应知识点名称"
}

【注意事项】
1. 选择题必须有4个选项，填空题answer为填空内容，判断题answer为"正确"或"错误"
2. 图表题(chart)必须填充chart字段，其他题型chart为null
3. 确保题目与知识点紧密相关，难度梯度明显
4. 解析要详细、清晰，有教学价值
5. 按 easy → medium → hard 顺序排列
6. 数学公式用 $...$ 包裹（单行公式），不要用 $$...$$
7. 请参考${params.province}近年中考、高考真题的出题风格和难度水平

现在请直接输出JSON数组：`;
}

export function buildChartPrompt(params: GenerateParams, questionText: string): string {
  const subject = getSubject(params.subjectId);
  const subjectName = subject?.name ?? params.subjectId;
  return `你是一位${subjectName}老师，需要为以下题目生成图表数据。
题目：${questionText}

请返回一个JSON对象，格式如下（只返回JSON，不要其他内容）：
{
  "type": "bar|pie|line|table|geometry",
  "title": "图表标题",
  "labels": ["标签1", "标签2", ...],
  "datasets": [{"label": "系列名", "data": [数值1, 数值2, ...], "color": "#颜色"}],
  "tableHeaders": ["列名1", "列名2"],
  "tableRows": [["数据", "数据"]],
  "description": "几何图形时用文字描述"
}`;
}
