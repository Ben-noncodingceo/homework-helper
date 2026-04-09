import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { HistoryItem } from '../types';

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getHistory(page)
      .then(({ items, total }) => { setItems(items); setTotal(total); })
      .finally(() => setLoading(false));
  }, [page]);

  if (loading) return <div className="text-center py-20 text-gray-400">加载中…</div>;

  if (!items.length) {
    return (
      <div className="text-center py-20 text-gray-400">
        <div className="text-5xl mb-4">📭</div>
        <p>暂无历史记录</p>
        <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">去生成作业</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">历史记录</h1>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{item.summary}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(item.created_at).toLocaleString('zh-CN')}
              </p>
            </div>
            <div className="flex gap-2 text-sm">
              <Link
                to={`/preview/${item.id}`}
                className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                预览
              </Link>
              <Link
                to={`/quiz/${item.id}`}
                className="px-3 py-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
              >
                答题
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-3 mt-6">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
          >
            上一页
          </button>
          <span className="px-4 py-2 text-gray-500 text-sm">第 {page} 页 / 共 {Math.ceil(total / 20)} 页</span>
          <button
            disabled={page >= Math.ceil(total / 20)}
            onClick={() => setPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg border border-gray-300 disabled:opacity-40 hover:bg-gray-50"
          >
            下一页
          </button>
        </div>
      )}
    </div>
  );
}
