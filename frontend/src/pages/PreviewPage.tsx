import { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';
import { HomeworkSet, Question, Difficulty, GenerateRequest } from '../types';
import MathText from '../components/ui/MathText';
import ChartRenderer from '../components/ui/ChartRenderer';

const DIFF_TABS: { key: Difficulty; label: string }[] = [
  { key: 'easy', label: '🟢 简单' },
  { key: 'medium', label: '🟡 中等' },
  { key: 'hard', label: '🔴 困难' },
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
  multiple_choice: '选择题', fill_blank: '填空题', true_false: '判断题',
  solve: '解答题', word_problem: '应用题', chart: '图表题',
};

function QuestionCard({ q, index, showAnswer, examLabel }: { q: Question; index: number; showAnswer: boolean; examLabel: string }) {
  return (
    <div className="question-card bg-white rounded-xl border border-gray-200 p-5 space-y-3">
      <div className="flex items-start gap-3">
        <span className="shrink-0 w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-sm font-bold flex items-center justify-center">
          {index + 1}
        </span>
        <div className="flex-1">
          <span className="text-xs font-medium text-gray-400 uppercase mr-2">{TYPE_LABELS[q.type] ?? q.type}</span>
          <p className="text-[11px] text-gray-400 italic mb-1">{examLabel}</p>
          <MathText text={q.question} className="text-gray-900" />
        </div>
      </div>
      {q.chart && <ChartRenderer data={q.chart} />}
      {q.options && (
        <div className="ml-10 space-y-1">
          {q.options.map((opt, i) => (
            <div key={i} className="text-sm text-gray-800"><MathText text={opt} /></div>
          ))}
        </div>
      )}
      {showAnswer && (
        <div className="ml-10 pt-3 border-t border-dashed border-gray-200 space-y-2">
          <p className="text-sm font-semibold text-green-700">答案：<MathText text={q.answer} /></p>
          <p className="text-sm text-gray-600 leading-relaxed">
            <span className="font-medium text-gray-700">解析：</span><MathText text={q.explanation} />
          </p>
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-7 h-7 rounded-full bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-3 bg-gray-200 rounded w-20" />
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
      <div className="ml-10 space-y-2">
        <div className="h-3 bg-gray-200 rounded w-5/6" />
        <div className="h-3 bg-gray-200 rounded w-4/6" />
        <div className="h-3 bg-gray-200 rounded w-3/6" />
        <div className="h-3 bg-gray-200 rounded w-2/6" />
      </div>
    </div>
  );
}

/* ── State for generating mode ─────────────────────────── */

interface GeneratingState {
  params: GenerateRequest;
  subject: string;
  subjectId: string;
  grade: string;
  province: string;
  knowledgePoints: string[];
  firstDifficulty: Difficulty;
  firstQuestions: Question[];
}

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const nav = useNavigate();
  const isGenerating = id === 'new';
  const genState = location.state as GeneratingState | undefined;

  const [hw, setHw] = useState<HomeworkSet | null>(null);
  const [activeTab, setActiveTab] = useState<Difficulty>('easy');
  const [showAnswers, setShowAnswers] = useState(false);
  const [loading, setLoading] = useState(!isGenerating);
  const [error, setError] = useState('');

  // Batch loading state
  const [batchLoading, setBatchLoading] = useState<Record<Difficulty, boolean>>({ easy: false, medium: false, hard: false });
  const [batchError, setBatchError] = useState<Record<Difficulty, string>>({ easy: '', medium: '', hard: '' });
  const batchStarted = useRef(false);

  // Mode 1: Load existing homework from DB
  useEffect(() => {
    if (isGenerating || !id) return;
    api.getHomework(id)
      .then(setHw)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id, isGenerating]);

  // Mode 2: Generating mode — build homework from batches
  useEffect(() => {
    if (!isGenerating || !genState || batchStarted.current) return;
    batchStarted.current = true;

    const { params, subject, subjectId, grade, province, knowledgePoints, firstDifficulty, firstQuestions } = genState;

    // Initialize homework with first batch
    const initial: HomeworkSet = {
      id: '', createdAt: '', subject, subjectId, grade, province, knowledgePoints,
      questions: [...firstQuestions],
      easy: firstDifficulty === 'easy' ? firstQuestions : [],
      medium: firstDifficulty === 'medium' ? firstQuestions : [],
      hard: firstDifficulty === 'hard' ? firstQuestions : [],
    };
    setHw(initial);
    setActiveTab(firstDifficulty);

    // Determine remaining batches
    const allDiffs: Difficulty[] = ['easy', 'medium', 'hard'];
    const remaining = allDiffs.filter((d) => d !== firstDifficulty && params.counts[d] > 0);

    // Mark remaining as loading
    const loadingState: Record<Difficulty, boolean> = { easy: false, medium: false, hard: false };
    remaining.forEach((d) => { loadingState[d] = true; });
    setBatchLoading(loadingState);

    // Generate remaining batches in parallel
    remaining.forEach(async (diff) => {
      try {
        const result = await api.generateBatch({ ...params, difficulty: diff });
        setHw((prev) => {
          if (!prev) return prev;
          const newQuestions = [...prev.questions, ...result.questions];
          return {
            ...prev,
            questions: newQuestions,
            [diff]: result.questions,
            // Recompute other diffs to keep them stable
            easy: diff === 'easy' ? result.questions : prev.easy,
            medium: diff === 'medium' ? result.questions : prev.medium,
            hard: diff === 'hard' ? result.questions : prev.hard,
          };
        });
      } catch (e) {
        setBatchError((prev) => ({ ...prev, [diff]: (e as Error).message }));
      } finally {
        setBatchLoading((prev) => ({ ...prev, [diff]: false }));
      }
    });
  }, [isGenerating, genState]);

  // Save to backend when all batches are done
  const allDone = isGenerating && hw && !batchLoading.easy && !batchLoading.medium && !batchLoading.hard;
  const savedRef = useRef(false);

  useEffect(() => {
    if (!allDone || !hw || savedRef.current) return;
    if (hw.questions.length === 0) return;
    savedRef.current = true;

    api.saveHomework({
      subject: hw.subject, subjectId: hw.subjectId, grade: hw.grade,
      province: hw.province || '', knowledgePoints: hw.knowledgePoints,
      questions: hw.questions as unknown as Record<string, unknown>[],
    }).then(({ id: newId }) => {
      // Replace URL without re-render
      nav(`/preview/${newId}`, { replace: true });
    }).catch(() => {
      // Save failed silently — homework still visible
    });
  }, [allDone, hw, nav]);

  if (loading) return <div className="text-center py-20 text-gray-400">加载中…</div>;
  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;
  if (!hw) return null;

  const questions = hw[activeTab] ?? [];
  const examLabel = getExamLabel(hw.grade, hw.province);
  const tabIsLoading = batchLoading[activeTab];
  const tabError = batchError[activeTab];
  const expectedCount = genState?.params.counts[activeTab] ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 no-print">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{hw.subject} · {hw.grade}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{hw.knowledgePoints.join('、')}</p>
        </div>
        <div className="flex gap-2">
          {!isGenerating && (
            <Link to={`/quiz/${id}`}
              className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors">
              开始答题
            </Link>
          )}
          <button onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors">
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
          const isTabLoading = batchLoading[tab.key];
          return (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label} {isTabLoading
                ? <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin ml-1 align-middle" />
                : `(${count})`}
            </button>
          );
        })}
      </div>

      {/* Show/hide answers */}
      <div className="flex justify-end mb-4 no-print">
        <button onClick={() => setShowAnswers((v) => !v)} className="text-sm text-blue-600 hover:underline">
          {showAnswers ? '隐藏答案与解析' : '显示答案与解析'}
        </button>
      </div>

      {/* Questions or skeleton */}
      {tabIsLoading ? (
        <div className="space-y-4">
          <div className="text-center text-sm text-gray-500 mb-2">
            AI 正在生成{activeTab === 'easy' ? '简单' : activeTab === 'medium' ? '中等' : '困难'}题目…
          </div>
          {Array.from({ length: expectedCount || 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : tabError ? (
        <div className="text-center py-12">
          <p className="text-red-500 mb-3">{tabError}</p>
          <button onClick={() => {
            if (!genState) return;
            setBatchError((p) => ({ ...p, [activeTab]: '' }));
            setBatchLoading((p) => ({ ...p, [activeTab]: true }));
            api.generateBatch({ ...genState.params, difficulty: activeTab })
              .then((result) => {
                setHw((prev) => {
                  if (!prev) return prev;
                  return { ...prev, questions: [...prev.questions, ...result.questions], [activeTab]: result.questions };
                });
              })
              .catch((e) => setBatchError((p) => ({ ...p, [activeTab]: (e as Error).message })))
              .finally(() => setBatchLoading((p) => ({ ...p, [activeTab]: false })));
          }} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
            重试
          </button>
        </div>
      ) : questions.length === 0 ? (
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
