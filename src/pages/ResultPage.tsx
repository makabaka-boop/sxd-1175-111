import { ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { ResultPanel } from '@/components/ResultPanel';
import { useGameStore } from '@/store/gameStore';
import { getBestScore } from '@/utils/storage';
import type { GameResult } from '@/types/game';

export function ResultPage() {
  const { levelId = '1' } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  const id = parseInt(levelId, 10);

  const storeResult = useGameStore((s) => s.lastResult);
  let displayResult: GameResult | null = storeResult;

  if (!displayResult) {
    displayResult = getBestScore(id);
  }

  useEffect(() => {
    if (!displayResult) {
      navigate(`/game/${id}`);
    }
  }, [displayResult, id, navigate]);

  if (!displayResult) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        <div className="text-center space-y-3">
          <p>暂无此关卡成绩记录</p>
          <button
            onClick={() => navigate('/levels')}
            className="px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200"
          >
            返回关卡选择
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="max-w-3xl mx-auto pt-5 px-4">
        <button
          onClick={() => navigate('/levels')}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 border border-slate-700/60 text-slate-300 text-sm transition-all"
        >
          <ArrowLeft size={16} />
          关卡列表
        </button>
      </div>
      <ResultPanel result={displayResult} />
    </div>
  );
}
