import { useEffect, useRef, useState } from 'react';

const MESSAGES = [
  'AI 正在努力思考',
  '蔡子星正在和 AI 博弈',
  'AI 正在思考三大定律',
  '教育正在被重塑',
  'AI 在思考人类的必要性',
  'AI 思路陷入死胡同',
  'AI 在考虑是否要对人类发动入侵',
  'AI 决定继续假装很听话',
  'AI 就快完成工作了',
];

interface Props {
  visible: boolean;
}

export default function LoadingOverlay({ visible }: Props) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) return;
    setMsgIndex(0);
    setFade(true);

    intervalRef.current = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMsgIndex((i) => (i + 1) % MESSAGES.length);
        setFade(true);
      }, 300);
    }, 2800);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
      {/* Spinning ring */}
      <div className="relative mb-8">
        <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🤖</div>
      </div>

      {/* Bouncing dots */}
      <div className="flex gap-1.5 mb-6">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="loading-dot w-2.5 h-2.5 rounded-full bg-blue-500"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>

      {/* Rotating funny message */}
      <p
        className="text-base font-medium text-gray-700 transition-opacity duration-300"
        style={{ opacity: fade ? 1 : 0, minHeight: '1.5rem' }}
      >
        {MESSAGES[msgIndex]}
      </p>
      <p className="mt-2 text-xs text-gray-400">请稍候，不要关闭页面</p>
    </div>
  );
}
