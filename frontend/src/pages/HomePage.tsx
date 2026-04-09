import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import LoadingOverlay from '../components/ui/LoadingOverlay';
import { GenerateRequest, QuestionType } from '../types';
import type { Subject, GradeLevel, KnowledgePoint } from '../types/subjects';

const QUESTION_TYPES: { id: QuestionType; label: string }[] = [
  { id: 'multiple_choice', label: '选择题' },
  { id: 'fill_blank', label: '填空题' },
  { id: 'true_false', label: '判断题' },
  { id: 'solve', label: '解答题' },
  { id: 'word_problem', label: '应用题' },
  { id: 'chart', label: '图表题 📊' },
];

export default function HomePage() {
  const nav = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState('');
  const [grade, setGrade] = useState('');
  const [selectedKPs, setSelectedKPs] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<QuestionType[]>(['multiple_choice', 'fill_blank']);
  const [counts, setCounts] = useState({ easy: 5, medium: 5, hard: 3 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getSubjects().then(setSubjects).catch(() => {});
  }, []);

  const currentSubject = subjects.find((s) => s.id === subjectId);
  const gradeLevel: GradeLevel | undefined = currentSubject?.grades.find((g) => g.grade === grade);
  const kpoints: KnowledgePoint[] = gradeLevel?.points ?? [];

  const toggleKP = (id: string) =>
    setSelectedKPs((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const toggleType = (t: QuestionType) =>
    setSelectedTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const handleGenerate = async () => {
    if (!subjectId || !grade || selectedKPs.length === 0 || selectedTypes.length === 0) {
      setError('请完整选择学科、年级、知识点和题型');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const req: GenerateRequest = {
        subjectId, grade,
        knowledgePointIds: selectedKPs,
        questionTypes: selectedTypes,
        counts,
      };

      // Pick the first non-zero difficulty to generate first
      const firstDifficulty = counts.easy > 0 ? 'easy' as const : counts.medium > 0 ? 'medium' as const : 'hard' as const;
      const firstBatch = await api.generateBatch({ ...req, difficulty: firstDifficulty });

      // Navigate immediately with first batch results
      nav('/preview/new', {
        state: {
          params: req,
          subject: currentSubject?.name ?? subjectId,
          subjectId,
          grade: gradeLevel?.label ?? grade,
          province: firstBatch.province,
          knowledgePoints: selectedKPs,
          firstDifficulty,
          firstQuestions: firstBatch.questions,
        },
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LoadingOverlay visible={loading} />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">生成作业</h1>
          <p className="text-sm text-gray-500 mt-1">选择学科、年级和知识点，AI 自动出题</p>
        </div>

        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-3">① 选择学科</h2>
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <button key={s.id} onClick={() => { setSubjectId(s.id); setGrade(''); setSelectedKPs([]); }}
                className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${subjectId === s.id ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-600'}`}>
                {s.name}
              </button>
            ))}
          </div>
        </section>

        {currentSubject && (
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-3">② 选择年级</h2>
            <div className="flex flex-wrap gap-2">
              {currentSubject.grades.map((g) => (
                <button key={g.grade} onClick={() => { setGrade(g.grade); setSelectedKPs([]); }}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${grade === g.grade ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:border-blue-400'}`}>
                  {g.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {kpoints.length > 0 && (
          <section className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-3">③ 选择知识点（可多选）</h2>
            <div className="flex flex-wrap gap-2">
              {kpoints.map((kp) => (
                <button key={kp.id} onClick={() => toggleKP(kp.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${selectedKPs.includes(kp.id) ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 text-gray-700 hover:border-green-400'}`}>
                  {kp.name}{kp.hasChart && <span className="ml-1 text-xs opacity-70">📊</span>}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-3">④ 题型（可多选）</h2>
          <div className="flex flex-wrap gap-2">
            {QUESTION_TYPES.map((t) => (
              <button key={t.id} onClick={() => toggleType(t.id)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${selectedTypes.includes(t.id) ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-300 text-gray-700 hover:border-purple-400'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-3">⑤ 题目数量</h2>
          <div className="grid grid-cols-3 gap-4">
            {(['easy', 'medium', 'hard'] as const).map((level) => {
              const labels = { easy: '🟢 简单', medium: '🟡 中等', hard: '🔴 困难' };
              return (
                <div key={level}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{labels[level]}</label>
                  <input type="number" min={0} max={20} value={counts[level]}
                    onChange={(e) => setCounts((p) => ({ ...p, [level]: Number(e.target.value) }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-center focus:ring-2 focus:ring-blue-400 focus:outline-none" />
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2">合计：{counts.easy + counts.medium + counts.hard} 题</p>
        </section>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}

        <button onClick={handleGenerate} disabled={loading}
          className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-semibold text-base hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm">
          🚀 开始生成
        </button>
      </div>
    </>
  );
}
