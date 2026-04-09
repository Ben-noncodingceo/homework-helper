import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { HomeworkSet, Question } from '../types';
import MathText from '../components/ui/MathText';
import ChartRenderer from '../components/ui/ChartRenderer';
import SvgDiagram from '../components/ui/SvgDiagram';
import FishSlot from '../components/ui/FishSlot';
import LoadingOverlay from '../components/ui/LoadingOverlay';

/* ── Helpers ────────────────────────────────────────────── */

function getExamLabel(grade: string, province?: string): string {
  const now = new Date();
  const year = now.getMonth() < 6 ? now.getFullYear() - 1 : now.getFullYear();
  const loc = province || '';
  if (grade.includes('初三') || grade.includes('九年级')) return `基于${year}年${loc}中考题目改编`;
  if (grade.includes('高三')) return `基于${year}年${loc}高考题目改编`;
  if (grade.includes('高')) return `基于${year}年${loc}高中学业水平考试题目改编`;
  return `基于${year}年${loc}期末考试题目改编`;
}

function isCorrectAnswer(q: Question, ans: string): boolean {
  const correct = q.answer.trim().toUpperCase();
  const given = ans.trim().toUpperCase();
  if (q.type === 'multiple_choice') return given === correct.charAt(0);
  return given === correct;
}

/* ── Celebration Overlay ────────────────────────────────── */

function Celebration({ visible }: { visible: boolean }) {
  if (!visible) return null;
  const emojis = ['🌟', '✨', '🎊', '⭐', '💫', '🎉'];
  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
      {emojis.map((e, i) => (
        <span
          key={i}
          className="confetti-particle absolute text-3xl"
          style={{ left: `${15 + i * 14}%`, animationDelay: `${i * 0.08}s` }}
        >
          {e}
        </span>
      ))}
      <div className="celebrate-pop text-center">
        <div className="text-6xl mb-2">🎉</div>
        <div className="text-xl font-bold text-green-600">太棒了！答对啦！</div>
      </div>
    </div>
  );
}

/* ── Chat Dialog ────────────────────────────────────────── */

function ChatDialog({ question }: { question: Question }) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const { reply } = await api.chat({
        question: question.question,
        answer: question.answer,
        explanation: question.explanation,
        userMessage: text,
        history: messages,
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: '抱歉，AI 暂时无法回答，请稍后再试。' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 border border-blue-200 rounded-xl p-4 bg-blue-50/50 animate-fadeInUp">
      <h4 className="text-sm font-semibold text-blue-700 mb-3">💬 有疑问？和 AI 讨论这道题</h4>
      <div className="max-h-60 overflow-y-auto space-y-2 mb-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <span
              className={`inline-block px-3 py-2 rounded-lg text-sm max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}
            >
              <MathText text={msg.content} />
            </span>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <span className="inline-block px-3 py-2 rounded-lg text-sm bg-white border border-gray-200 text-gray-400">
              AI 思考中…
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
          placeholder="问问 AI 关于这道题的疑问…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          onClick={handleSend}
          disabled={!input.trim() || loading}
        >
          发送
        </button>
      </div>
    </div>
  );
}

/* ── Option Button ──────────────────────────────────────── */

function OptionButton({
  label, chosen, correct, graded, onClick,
}: { label: string; chosen: boolean; correct: boolean; graded: boolean; onClick: () => void }) {
  let cls = 'w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors ';
  if (graded) {
    if (correct) cls += 'bg-green-50 border-green-400 text-green-800 font-semibold';
    else if (chosen) cls += 'bg-red-50 border-red-400 text-red-700';
    else cls += 'border-gray-200 text-gray-500';
  } else {
    cls += chosen
      ? 'bg-blue-50 border-blue-400 text-blue-800 font-medium'
      : 'border-gray-200 text-gray-800 hover:border-blue-300 hover:bg-blue-50 cursor-pointer';
  }
  return (
    <button className={cls} onClick={onClick} disabled={graded}>
      <MathText text={label} />
    </button>
  );
}

/* ── Main Page ──────────────────────────────────────────── */

export default function QuizPage() {
  const { id } = useParams<{ id: string }>();
  const [hw, setHw] = useState<HomeworkSet | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [graded, setGraded] = useState<Record<string, boolean>>({});
  const [fillInput, setFillInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.getHomework(id)
      .then((data) => {
        setHw(data);
        setQuestions([...(data.easy ?? []), ...(data.medium ?? []), ...(data.hard ?? [])]);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const q = questions[current];
  const isGraded = q ? !!graded[q.id] : false;
  const userAnswer = q ? selected[q.id] : undefined;
  const isTextType = q && ['fill_blank', 'solve', 'word_problem', 'chart'].includes(q.type);
  const hasAnswer = q && (!!selected[q.id] || (isTextType && !!fillInput));

  // Sync fillInput when navigating between questions
  useEffect(() => {
    if (!q) return;
    if (isTextType && !graded[q.id]) {
      setFillInput(selected[q.id] || '');
    } else {
      setFillInput('');
    }
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectOption = (ans: string) => {
    if (!q || isGraded) return;
    setSelected((prev) => ({ ...prev, [q.id]: ans }));
  };

  const gradeAnswer = () => {
    if (!q || isGraded) return;
    let ans = selected[q.id];
    if (!ans && isTextType) {
      ans = fillInput;
      setSelected((prev) => ({ ...prev, [q.id]: fillInput }));
    }
    if (!ans) return;
    setGraded((prev) => ({ ...prev, [q.id]: true }));
    setFillInput('');
    if (isCorrectAnswer(q, ans)) {
      setCelebrating(true);
      setTimeout(() => setCelebrating(false), 1500);
    }
  };

  const score = questions.filter((question) => {
    const ans = selected[question.id];
    return ans ? isCorrectAnswer(question, ans) : false;
  }).length;

  const examLabel = hw ? getExamLabel(hw.grade, hw.province) : '';

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
            onClick={() => { setCurrent(0); setSelected({}); setGraded({}); setDone(false); }}
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
      <Celebration visible={celebrating} />

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
        {/* Difficulty badge + exam label */}
        <div className="space-y-1">
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
          <p className="text-[11px] text-gray-400 italic">{examLabel}</p>
        </div>

        {/* Question text */}
        <div className="text-base text-gray-900 leading-relaxed">
          <MathText text={q.question} />
        </div>

        {q.svg && !q.chart && <SvgDiagram svg={q.svg} />}
        {q.chart && <ChartRenderer data={q.chart} svg={q.svg} />}

        {/* Multiple Choice */}
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
                  graded={isGraded}
                  onClick={() => selectOption(letter)}
                />
              );
            })}
          </div>
        )}

        {/* True / False */}
        {q.type === 'true_false' && (
          <div className="flex gap-3 pt-2">
            {['正确', '错误'].map((v) => (
              <button
                key={v}
                disabled={isGraded}
                onClick={() => selectOption(v)}
                className={`flex-1 py-3 rounded-xl border font-medium text-sm transition-colors ${
                  isGraded
                    ? v === q.answer
                      ? 'bg-green-50 border-green-400 text-green-800'
                      : userAnswer === v
                        ? 'bg-red-50 border-red-400 text-red-700'
                        : 'border-gray-200 text-gray-400'
                    : userAnswer === v
                      ? 'bg-blue-50 border-blue-400 text-blue-800 font-medium'
                      : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        )}

        {/* Fill blank / solve / word problem / chart */}
        {isTextType && (
          <div className="pt-2">
            {!isGraded ? (
              <input
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-400 focus:outline-none"
                placeholder="输入你的答案…"
                value={fillInput}
                onChange={(e) => { setFillInput(e.target.value); setSelected((p) => ({ ...p, [q.id]: e.target.value })); }}
                onKeyDown={(e) => e.key === 'Enter' && fillInput && gradeAnswer()}
              />
            ) : (
              <div className={`px-4 py-2.5 rounded-xl text-sm border ${
                isCorrectAnswer(q, userAnswer ?? '')
                  ? 'bg-green-50 border-green-300 text-green-800'
                  : 'bg-red-50 border-red-300 text-red-800'
              }`}>
                你的答案：{userAnswer}
              </div>
            )}
          </div>
        )}

        {/* Grade button */}
        {hasAnswer && !isGraded && (
          <div className="pt-2 flex justify-center">
            <button
              onClick={gradeAnswer}
              className="px-8 py-3 rounded-xl bg-orange-500 text-white font-semibold text-base hover:bg-orange-600 transition-colors shadow-sm"
            >
              📝 批改
            </button>
          </div>
        )}

        {/* Answer & Explanation */}
        {isGraded && (
          <div className="pt-3 border-t border-dashed border-gray-200 space-y-1.5 animate-fadeInUp">
            <p className="text-sm font-semibold">
              {isCorrectAnswer(q, userAnswer ?? '')
                ? <span className="text-green-700">✅ 回答正确！</span>
                : <span className="text-red-600">❌ 回答错误</span>}
              <span className="ml-2 text-green-700">正确答案：<MathText text={q.answer} /></span>
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              <span className="font-medium text-gray-700">解析：</span>
              <MathText text={q.explanation} />
            </p>
          </div>
        )}

        {/* AI Chat Dialog */}
        {isGraded && <ChatDialog question={q} />}
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
            {isGraded ? '下一题 →' : '跳过'}
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

      <footer className="mt-8 pt-4 border-t border-gray-100 text-center text-xs text-gray-400 select-none">
        <span>教学就是授人以鱼，考之以鲞鲔鲭鲮鲴鲹鲷鲽鲼鲀鲙鲠鲵鲋鲰鲥鲿鲺鯼鰴</span>
        <FishSlot />
      </footer>
    </div>
  );
}
