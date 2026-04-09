import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { HomeworkSet, Question } from '../types';
import MathText from '../components/ui/MathText';
import ChartRenderer from '../components/ui/ChartRenderer';
import FishSlot from '../components/ui/FishSlot';
import LoadingOverlay from '../components/ui/LoadingOverlay';

function OptionButton({
  label, chosen, correct, revealed, onClick,
}: { label: string; chosen: boolean; correct: boolean; revealed: boolean; onClick: () => void }) {
  let cls = 'w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ';
  if (revealed) {
    if (correct) cls += 'bg-green-50 border-green-400 text-green-800 font-semibold';
    else if (chosen) cls += 'bg-red-50 border-red-400 text-red-700';
    else cls += 'border-gray-200 text-gray-500';
  } else {
    cls += chosen
      ? 'bg-blue-50 border-blue-400 text-blue-800'
      : 'border-gray-200 text-gray-800 hover:border-blue-300 hover:bg-blue-50 cursor-pointer';
  }
  return (
    <button className={cls} onClick={onClick} disabled={revealed}>
      <MathText text={label} />
    </button>
  );
}

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const [hw, setHw] = useState<HomeworkSet | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [fillInput, setFillInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getHomework(id)
      .then((data) => {
        setHw(data);
        const all = [...(data.easy ?? []), ...(data.medium ?? []), ...(data.hard ?? [])];
        setQuestions(all);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const q = questions[current];
  const isRevealed = q ? !!revealed[q.id] : false;
  const userAnswer = q ? answers[q.id] : '';

  const reveal = (ans: string) => {
    if (!q || isRevealed) return;
    setAnswers((p) => ({ ...p, [q.id]: ans }));
    setRevealed((p) => ({ ...p, [q.id]: true }));
    setFillInput('');
  };

  const isCorrect = (ans: string) => {
    if (!q) return false;
    const correct = q.answer.trim().toUpperCase();
    const given = ans.trim().toUpperCase();
    if (q.type === 'multiple_choice') return given === correct.charAt(0);
    return given === correct;
  };

  const score = questions.filter((question) => {
    const ans = answers[question.id];
    if (!ans) return false;
    const correct = question.answer.trim().toUpperCase();
    const given = ans.trim().toUpperCase();
    if (question.type === 'multiple_choice') return given === correct.charAt(0);
    return given === correct;
  }).length;

  if (loading) return <LoadingOverlay visible />;
  if (!hw || !questions.length) return <div className="text-center py-20 text-gray-400">暂无题目</div>;

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">{pct >= 80 ? '🎉' : pct >= 60 ? '💪' : '📚'}</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">答题完成！</h2>
        <p className="text-4xl font-bold text-blue-600 my-4">{score} / {questions.length}</p>
        <p className="text-gray-500 mb-8">得分率 {pct}%</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setCurrent(0); setAnswers({}); setRevealed({}); setDone(false); }}
            className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            重新答题
          </button>
          <Link to="/" className="px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
            生成新作业
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col min-h-[calc(100vh-3rem)]">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-1.5">
          <span>{hw.subject} · {hw.grade}</span>
          <span>{current + 1} / {questions.length}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${((current + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-4">
        {/* Difficulty badge */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
            q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {q.difficulty === 'easy' ? '简单' : q.difficulty === 'medium' ? '中等' : '困难'}
          </span>
          <span className="text-xs text-gray-400">{q.knowledgePoint}</span>
        </div>

        {/* Question text */}
        <div className="text-base text-gray-900 leading-relaxed">
          <MathText text={q.question} />
        </div>

        {/* Chart */}
        {q.chart && <ChartRenderer data={q.chart} />}

        {/* Options */}
        {q.type === 'multiple_choice' && q.options && (
          <div className="space-y-2 pt-2">
            {q.options.map((opt, i) => {
              const letter = ['A', 'B', 'C', 'D'][i];
              const correct = q.answer.trim().toUpperCase().startsWith(letter);
              return (
                <OptionButton
                  key={i}
                  label={opt}
                  chosen={userAnswer === letter}
                  correct={correct}
                  revealed={isRevealed}
                  onClick={() => reveal(letter)}
                />
              );
            })}
          </div>
        )}

        {/* True/False */}
        {q.type === 'true_false' && (
          <div className="flex gap-3 pt-2">
            {['正确', '错误'].map((v) => (
              <button
                key={v}
                disabled={isRevealed}
                onClick={() => reveal(v)}
                className={`flex-1 py-3 rounded-xl border font-medium text-sm transition-colors ${
                  isRevealed
                    ? v === q.answer
                      ? 'bg-green-50 border-green-400 text-green-800'
                      : userAnswer === v
                        ? 'bg-red-50 border-red-400 text-red-700'
                        : 'border-gray-200 text-gray-400'
                    : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        )}

        {/* Fill blank / solve / word problem */}
        {(q.type === 'fill_blank' || q.type === 'solve' || q.type === 'word_problem' || q.type === 'chart') && (
          <div className="pt-2 space-y-2">
            {!isRevealed ? (
              <div className="flex gap-2">
                <input
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                  placeholder="输入你的答案…"
                  value={fillInput}
                  onChange={(e) => setFillInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fillInput && reveal(fillInput)}
                />
                <button
                  className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  disabled={!fillInput}
                  onClick={() => reveal(fillInput)}
                >
                  提交
                </button>
              </div>
            ) : (
              <div className={`px-4 py-2.5 rounded-xl text-sm border ${
                isCorrect(userAnswer ?? '')
                  ? 'bg-green-50 border-green-300 text-green-800'
                  : 'bg-red-50 border-red-300 text-red-800'
              }`}>
                你的答案：{userAnswer}
              </div>
            )}
          </div>
        )}

        {/* Explanation */}
        {isRevealed && (
          <div className="pt-3 border-t border-dashed border-gray-200 space-y-1.5 animate-fadeInUp">
            <p className="text-sm font-semibold text-green-700">
              正确答案：<MathText text={q.answer} />
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              <span className="font-medium text-gray-700">解析：</span>
              <MathText text={q.explanation} />
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-5 no-print">
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 disabled:opacity-40 hover:bg-gray-50"
        >
          上一题
        </button>
        {current < questions.length - 1 ? (
          <button
            onClick={() => setCurrent((c) => c + 1)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700"
          >
            {isRevealed ? '下一题 →' : '跳过'}
          </button>
        ) : (
          <button
            onClick={() => setDone(true)}
            className="px-5 py-2.5 rounded-xl bg-green-600 text-white font-medium hover:bg-green-700"
          >
            完成答题 🎉
          </button>
        )}
      </div>

      {/* ─── Footer ─────────────────────────────────────────────────── */}
      <footer className="mt-8 pt-4 border-t border-gray-100 text-center text-xs text-gray-400 select-none">
        <span>教学就是授人以鱼，考之以鲞鲔鲭鲮鲴鲹鲷鲽鲼鲀鲙鲠鲵鲋鲰鲥鲿鲺鯼鰴</span>
        <FishSlot />
      </footer>
    </div>
  );
}
