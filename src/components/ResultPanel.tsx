import { Star, Trophy, Target, Clock, Flame, XCircle, AlertCircle, Lightbulb, RotateCcw, Home, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { GameResult, SlotStat } from '@/types/game';
import { LEVELS } from '@/data/levels';
import { formatDuration } from '@/utils/score';

interface ResultPanelProps {
  result: GameResult;
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex items-center justify-center gap-1">
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          size={36}
          className={`transition-all ${i <= count ? 'text-amber-400 fill-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-pop' : 'text-slate-600'}`}
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  );
}

function StatBar({
  label,
  icon: Icon,
  value,
  suffix,
  percent,
  color,
}: {
  label: string;
  icon: typeof Trophy;
  value: number | string;
  suffix?: string;
  percent: number;
  color: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-300">
          <Icon size={13} className={color} />
          <span>{label}</span>
        </div>
        <span className={`font-bold tabular-nums ${color}`}>
          {value}
          {suffix && <span className="ml-0.5 text-slate-500 text-[10px]">{suffix}</span>}
        </span>
      </div>
      <div className="h-2 bg-slate-800/70 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${Math.min(100, Math.max(2, percent * 100))}%`,
            background: `linear-gradient(90deg, ${color}, ${color}aa)`,
          }}
        />
      </div>
    </div>
  );
}

function SlotRow({ stat, index }: { stat: SlotStat; index: number }) {
  const total = stat.correct + stat.wrong;
  const acc = total > 0 ? stat.correct / total : 0;
  const emptySec = Math.round(stat.emptyTime / 1000);

  return (
    <tr className={`border-b border-slate-800/60 ${index % 2 ? 'bg-slate-900/30' : ''}`}>
      <td className="px-3 py-2 text-sm font-medium text-slate-200">{stat.slotLabel}</td>
      <td className="px-3 py-2 text-sm text-emerald-400 tabular-nums">{stat.correct}</td>
      <td className="px-3 py-2 text-sm text-rose-400 tabular-nums">{stat.wrong}</td>
      <td className="px-3 py-2 text-sm tabular-nums">
        <span className={acc >= 0.8 ? 'text-emerald-400' : acc >= 0.5 ? 'text-amber-400' : 'text-rose-400'}>
          {(acc * 100).toFixed(0)}%
        </span>
      </td>
      <td className="px-3 py-2 text-sm text-slate-400 tabular-nums">{emptySec}s</td>
      <td className="px-3 py-2 text-sm font-bold tabular-nums">
        <span className={stat.score >= 300 ? 'text-amber-400' : 'text-slate-300'}>
          {stat.score}
        </span>
      </td>
    </tr>
  );
}

export function ResultPanel({ result }: ResultPanelProps) {
  const navigate = useNavigate();
  const level = LEVELS.find((l) => l.id === result.levelId);
  const nextLevel = LEVELS.find((l) => l.id === result.levelId + 1);

  const onReplay = () => {
    navigate(`/game/${result.levelId}`);
  };
  const onNext = () => {
    if (nextLevel) navigate(`/game/${nextLevel.id}`);
    else navigate('/levels');
  };
  const onHome = () => navigate('/levels');

  const pct = level ? result.totalScore / level.threeStarScore : 0;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <div
          className="relative rounded-3xl p-8 border border-slate-700/50 overflow-hidden"
          style={{
            background: 'radial-gradient(circle at 50% 0%, #4338cacc 0%, #1e1b4bdd 60%, #020617ee 100%)',
          }}
        >
          <div className="absolute -top-20 -right-16 w-72 h-72 rounded-full opacity-30 blur-3xl"
            style={{ background: '#f59e0b' }} />
          <div className="absolute -bottom-24 -left-20 w-72 h-72 rounded-full opacity-20 blur-3xl"
            style={{ background: '#0ea5e9' }} />

          <div className="relative text-center space-y-4">
            <div className="text-xs uppercase tracking-[0.3em] text-indigo-300/70 font-bold">
              {level?.name ?? `第${result.levelId}关`} 结算
            </div>
            <Stars count={result.stars} />
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400">最终得分</div>
              <div className="text-6xl font-black text-white tabular-nums"
                style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                {result.totalScore.toLocaleString()}
              </div>
              {level && (
                <div className="text-xs text-slate-400">
                  过关线 {level.targetScore.toLocaleString()} ·
                  三星线 {level.threeStarScore.toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatBar
            label="正确率"
            icon={Target}
            value={(result.accuracy * 100).toFixed(0)}
            suffix="%"
            percent={result.accuracy}
            color="text-emerald-400"
          />
          <StatBar
            label="平均响应"
            icon={Clock}
            value={formatDuration(result.avgResponseTime)}
            percent={Math.max(0, 1 - result.avgResponseTime / 8000)}
            color="text-sky-400"
          />
          <StatBar
            label="最高连击"
            icon={Flame}
            value={result.maxCombo}
            suffix="x"
            percent={Math.min(1, result.maxCombo / 20)}
            color="text-orange-400"
          />
          <StatBar
            label="错放次数"
            icon={XCircle}
            value={result.wrongCount}
            suffix="次"
            percent={Math.max(0, 1 - result.wrongCount / 15)}
            color="text-rose-400"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-950/60 p-5">
            <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-1.5">
              <Trophy size={14} className="text-amber-400" />
              各位置完成情况
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-800">
                    <th className="px-3 py-2 font-bold">位置</th>
                    <th className="px-3 py-2 font-bold">✓</th>
                    <th className="px-3 py-2 font-bold">✗</th>
                    <th className="px-3 py-2 font-bold">正确率</th>
                    <th className="px-3 py-2 font-bold">空槽</th>
                    <th className="px-3 py-2 font-bold">小计</th>
                  </tr>
                </thead>
                <tbody>
                  {result.slotStats.map((s, i) => (
                    <SlotRow key={s.slotId} stat={s} index={i} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-700/50 bg-slate-950/60 p-5">
              <h3 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-1.5">
                <AlertCircle size={14} className="text-rose-400" />
                扣分来源
              </h3>
              {result.penalties.length === 0 ? (
                <div className="text-sm text-emerald-400 py-2">🎉 无任何扣分，完美发挥！</div>
              ) : (
                <ul className="space-y-2">
                  {result.penalties.map((p, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between text-sm bg-slate-900/40 rounded-lg px-3 py-2"
                    >
                      <span className="text-slate-300">{p.label}</span>
                      <span className="text-rose-400 font-bold tabular-nums">
                        -{p.amount.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div
              className="rounded-2xl border p-5 overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #0ea5e922 0%, #8b5cf622 100%)',
                borderColor: 'rgba(56, 189, 248, 0.25)',
              }}
            >
              <h3 className="text-sm font-bold text-sky-200 mb-2 flex items-center gap-1.5">
                <Lightbulb size={14} />
                复盘建议
              </h3>
              <p className="text-slate-200 text-sm leading-relaxed">
                {result.suggestion}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <button
            onClick={onHome}
            className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm transition-all
              bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:-translate-y-0.5"
          >
            <Home size={16} />
            关卡列表
          </button>
          <button
            onClick={onReplay}
            className="flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm transition-all
              bg-slate-800/80 hover:bg-slate-700 border border-slate-600 text-slate-100 shadow-md hover:-translate-y-0.5"
          >
            <RotateCcw size={16} />
            重玩本关
          </button>
          <button
            onClick={onNext}
            disabled={!nextLevel}
            className={`flex items-center justify-center gap-1.5 py-3 rounded-xl font-bold text-sm transition-all
              ${nextLevel
                ? 'bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5'
                : 'bg-slate-900/50 border border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
          >
            {nextLevel ? '下一关' : '已通关'}
            {nextLevel && <ChevronRight size={16} />}
          </button>
        </div>

        <div className="text-center text-xs text-slate-600">
          通关即解锁下一关 · 成绩保存在本机 localStorage
        </div>
      </div>
    </div>
  );
}
