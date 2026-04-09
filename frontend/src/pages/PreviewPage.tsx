import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { HomeworkSet, Question, Difficulty } from '../types';
import MathText from '../components/ui/MathText';
import ChartRenderer from '../components/ui/ChartRenderer';

const DIFF_TABS: { key: Difficulty; label: string; color: string }[] = [
  { key: 'easy', label: '🟢 简单', color: 'text-green-700' },
  { key: 'medium', label: '🟡 中等', color: 'text-yellow-700' },
  { key: 'hard', label: '🔴 困难', color: 'text-red-700' },
];

function getExamLabel(grade: string, province?: string): string {
  const now = new Date();
  const year = now.getMonth() < 6 ? now.getFullYear() - 1 : now.getFullYear();
  const loc = province || '';
  if (grade.includes('初三') || grade.includes('九年级')) return `基于${year}年${loc}中考题目改编`;
  if (grade.includes('高三')) return `基于${year}年${loc}高考题目改编`;
  if (grade.includes('高')) return `基于${year}年${loc}高中学业水平考试题目改编`;
  return `基于${year}年${loc}期末考试题目改编`;
}

const TYPE_LABELS: Record<string, string> = {
  multiple_choice: '选择题',
  fill_blank: '填空题',
  true_false: '判断题',
  solve: '解答题',
  word_problem: '应用题',
  chart: '图表题',
};

function QuestionCard({ q, index, showAnswer, examLabel }: { q: Question; index: number; showAnswer: boolean; examLabel: string }) {
  return (
    <div className="question-card bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center">
          {index + 1}
        </span>
        <div className="flex-1">
          <span className="text-xs font-medium text-gray-400 uppercase mr-2">
            {TYPE_LABELS[q.type] ?? q.type}
          </span>
          <p className="text-[11px] text-gray-400 italic mb-1">{examLabel}</p>
          <MathText text={q.question} className="text-gray-900" />
        </div>
      </div>

      {q.chart && <ChartRenderer data={q.chart} />}

      {q.options && (
        <div className="ml-10 space-y-1">
          {q.options.map((opt, i) => (
            <div key={i} className="text-sm text-gray-800">
              <MathText text={opt} />
            </div>
          ))}
        </div>
      )}

      {showAnswer && (
        <div className="ml-10 pt-3 border-t border-dashed border-gray-200 space-y-2">
          <p className="text-sm font-semibold text-green-700">
            答案：<MathText text={q.answer} />
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            <span className="font-medium text-gray-700">解析：</span>
            <MathText text={q.explanation} />
          </p>
        </div>
      )}
    </div>
  );
}

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const [hw, setHw] = useState<HomeworkSet | null>(null);
  const [activeTab, setActiveTab] = useState<Difficulty>('easy');
  const [showAnswers, setShowAnswers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    api.getHomework(id)
      .then(setHw)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-20 text-gray-400">加载中…</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!hw) return null;

  const questions = hw[activeTab] ?? [];
  const examLabel = getExamLabel(hw.grade, hw.province);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 no-print">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{hw.subject} · {hw.grade}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{hw.knowledgePoints.join('、')}</p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/quiz/${id}`}
            className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
          >
            开始答题
          </Link>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            打印
          </button>
        </div>
      </div>

      {/* Print header */}
      <div className="print-only mb-6 text-center">
        <h1 className="text-xl font-bold">{hw.subject} 练习题 · {hw.grade}</h1>
        <p className="text-sm text-gray-500">知识点：{hw.knowledgePoints.join('、')}</p>
      </div>

      {/* Difficulty tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 no-print">
        {DIFF_TABS.map((tab) => {
          const count = (hw[tab.key] ?? []).length;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-white shadow-sm text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Show/hide answers toggle */}
      <div className="flex justify-end mb-4 no-print">
        <button
          onClick={() => setShowAnswers((v) => !v)}
          className="text-sm text-blue-600 hover:underline"
        >
          {showAnswers ? '隐藏答案与解析' : '显示答案与解析'}
        </button>
      </div>

      {/* Questions */}
      {questions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">该难度暂无题目</div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, i) => (
            <QuestionCard key={q.id} q={q} index={i} showAnswer={showAnswers} examLabel={examLabel} />
          ))}
        </div>
      )}

      {/* Answer key for print */}
      <div className="print-only page-break mt-8">
        <h2 className="text-lg font-bold mb-4">参考答案</h2>
        {hw.questions.map((q, i) => (
          <div key={q.id} className="mb-2 text-sm">
            <span className="font-medium">{i + 1}.</span> {q.answer}
          </div>
        ))}
      </div>
    </div>
  );
}
