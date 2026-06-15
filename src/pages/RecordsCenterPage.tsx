import { useState } from 'react';
import { ArrowLeft, Star, Trophy, Target, Clock, Flame, XCircle, Dumbbell, Gamepad2, Filter, ChevronRight, BarChart3, Layers, Zap, Activity, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getHistory, getTrainingHistory, getBestScore, getTrainingPlans, getActiveTrainingPlans } from '@/utils/storage';
import { LEVELS } from '@/data/levels';
import type { GameResult } from '@/types/game';
import { formatDuration } from '@/utils/score';

type FilterMode = 'all' | 'level' | 'training';

export function RecordsCenterPage() {
  const navigate = useNavigate();
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');

  const levelHistory = getHistory();
  const trainingHistory = getTrainingHistory();
  const allPlans = getTrainingPlans();
  const activePlans = getActiveTrainingPlans();

  const allRecords: GameResult[] = [
    ...levelHistory,
    ...trainingHistory,
  ].sort((a, b) => b.playedAt - a.playedAt);

  const filteredRecords = allRecords.filter(record => {
    if (filterMode === 'level' && record.isTraining) return false;
    if (filterMode === 'training' && !record.isTraining) return false;
    if (selectedLevel !== 'all') {
      const levelId = record.isTraining ? record.sourceLevelId : record.levelId;
      if (levelId !== selectedLevel) return false;
    }
    return true;
  });

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffHours / 24;

    if (diffHours < 1) return `${Math.floor(diffMs / (1000 * 60))}分钟前`;
    if (diffHours < 24) return `${Math.floor(diffHours)}小时前`;
    if (diffDays < 7) return `${Math.floor(diffDays)}天前`;
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const getLevelName = (record: GameResult) => {
    if (record.isTraining) {
      const sourceLevel = LEVELS.find(l => l.id === record.sourceLevelId);
      return sourceLevel ? `训练 · ${sourceLevel.name}` : '专项训练';
    }
    const level = LEVELS.find(l => l.id === record.levelId);
    return level ? level.name : `第${record.levelId}关`;
  };

  const getBestForLevel = (levelId: number) => {
    return getBestScore(levelId);
  };

  return (
    <div className="min-h-screen py-8 px-4 relative overflow-hidden">
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: '#6366f1' }} />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: '#0ea5e9' }} />

      <div className="max-w-4xl mx-auto relative">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 transition-all"
          >
            <ArrowLeft size={16} />
            <span className="text-sm">返回</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
              战绩中心
            </h1>
            <p className="text-xs text-slate-400">查看你的闯关记录与训练成果</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={16} className="text-amber-400" />
              <span className="text-xs text-slate-400">总闯关</span>
            </div>
            <div className="text-2xl font-black text-white tabular-nums">
              {levelHistory.length}
              <span className="text-sm font-normal text-slate-500 ml-1">次</span>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-700/50 bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell size={16} className="text-amber-400" />
              <span className="text-xs text-slate-400">总训练</span>
            </div>
            <div className="text-2xl font-black text-white tabular-nums">
              {trainingHistory.length}
              <span className="text-sm font-normal text-slate-500 ml-1">次</span>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-700/50 bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star size={16} className="text-amber-400 fill-amber-400" />
              <span className="text-xs text-slate-400">总星数</span>
            </div>
            <div className="text-2xl font-black text-amber-400 tabular-nums">
              {Object.values(LEVELS).reduce((sum, lv) => {
                const best = getBestForLevel(lv.id);
                return sum + (best?.stars || 0);
              }, 0)}
              <span className="text-sm font-normal text-slate-500 ml-1">/{LEVELS.length * 3}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-700/50 bg-slate-950/60 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target size={16} className="text-emerald-400" />
              <span className="text-xs text-slate-400">最高正确率</span>
            </div>
            <div className="text-2xl font-black text-emerald-400 tabular-nums">
              {levelHistory.length > 0
                ? (Math.max(...levelHistory.map(r => r.accuracy)) * 100).toFixed(0)
                : '0'}
              <span className="text-sm font-normal text-slate-500 ml-1">%</span>
            </div>
          </div>
        </div>

        {(activePlans.length > 0 || allPlans.length > 0) && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ClipboardList size={16} className="text-amber-400" />
                <span className="text-sm font-bold text-amber-200">训练计划</span>
              </div>
              <button
                onClick={() => navigate('/training-plans')}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                查看全部
                <ChevronRight size={14} />
              </button>
            </div>
            {activePlans.length > 0 ? (
              <div className="space-y-2">
                {activePlans.slice(0, 2).map((plan) => {
                  const completedItems = plan.items.filter((i) => i.completedRounds >= i.suggestedRounds).length;
                  const totalItems = plan.items.length;
                  const progress = totalItems > 0 ? completedItems / totalItems : 0;
                  return (
                    <button
                      key={plan.id}
                      onClick={() => navigate(`/training-plan/${plan.id}`)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all text-left"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Dumbbell size={16} className="text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-amber-200 truncate">{plan.sourceLevelName}</span>
                          <span className="text-xs text-amber-400 font-bold tabular-nums ml-2">{Math.round(progress * 100)}%</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-slate-800/70 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                              style={{ width: `${progress * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-400 flex-shrink-0">{completedItems}/{totalItems}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400">暂无进行中的训练计划</p>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-slate-700/50 bg-slate-950/60 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={16} className="text-slate-400" />
            <span className="text-sm font-bold text-slate-200">筛选记录</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-1">
              <button
                onClick={() => setFilterMode('all')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterMode === 'all'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50'
                }`}
              >
                全部
              </button>
              <button
                onClick={() => setFilterMode('level')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterMode === 'level'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Gamepad2 size={14} />
                  闯关
                </span>
              </button>
              <button
                onClick={() => setFilterMode('training')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterMode === 'training'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:bg-slate-700/50'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <Dumbbell size={14} />
                  训练
                </span>
              </button>
            </div>
            <div className="flex-1">
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
                className="w-full px-4 py-2 rounded-lg text-sm bg-slate-800/50 text-slate-200 border border-slate-700/50 focus:outline-none focus:border-indigo-500/50 transition-all"
              >
                <option value="all">全部关卡</option>
                {LEVELS.map(lv => (
                  <option key={lv.id} value={lv.id}>
                    第{lv.id}关 · {lv.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {filteredRecords.length === 0 ? (
            <div className="rounded-2xl border border-slate-700/50 bg-slate-950/60 p-12 text-center">
              <BarChart3 size={48} className="text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 mb-2">暂无记录</p>
              <p className="text-xs text-slate-500 mb-6">完成一次挑战或训练后，记录将显示在这里</p>
              <button
                onClick={() => navigate('/levels')}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-bold hover:from-indigo-400 hover:to-violet-400 transition-all"
              >
                开始挑战
              </button>
            </div>
          ) : (
            filteredRecords.map((record, index) => {
              const levelName = getLevelName(record);
              const isBest = !record.isTraining && getBestForLevel(record.levelId)?.totalScore === record.totalScore;

              return (
                <button
                  key={`${record.levelId}-${record.playedAt}-${index}`}
                  onClick={() => navigate(`/record/${record.isTraining ? 'training' : 'level'}/${record.levelId}?ts=${record.playedAt}`)}
                  className="w-full text-left rounded-2xl border border-slate-700/50 bg-slate-950/60 p-4 hover:bg-slate-900/70 hover:border-indigo-500/40 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        record.isTraining
                          ? 'bg-amber-500/20 border border-amber-500/30'
                          : 'bg-indigo-500/20 border border-indigo-500/30'
                      }`}>
                        {record.isTraining ? (
                          <Dumbbell size={20} className="text-amber-400" />
                        ) : (
                          <Gamepad2 size={20} className="text-indigo-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{levelName}</span>
                          {isBest && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                              最佳
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {formatDate(record.playedAt)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-white tabular-nums">
                        {record.totalScore.toLocaleString()}
                      </div>
                      <div className="flex items-center justify-end gap-0.5 mt-1">
                        {[1, 2, 3].map(i => (
                          <Star
                            key={i}
                            size={12}
                            className={i <= record.stars ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="bg-slate-900/40 rounded-lg px-2.5 py-2">
                      <div className="text-slate-500 text-[10px] mb-0.5">正确率</div>
                      <div className={`font-bold tabular-nums ${
                        record.accuracy >= 0.8 ? 'text-emerald-400' :
                        record.accuracy >= 0.6 ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        {(record.accuracy * 100).toFixed(0)}%
                      </div>
                    </div>
                    <div className="bg-slate-900/40 rounded-lg px-2.5 py-2">
                      <div className="text-slate-500 text-[10px] mb-0.5">平均响应</div>
                      <div className="font-bold text-sky-400 tabular-nums">
                        {formatDuration(record.avgResponseTime)}
                      </div>
                    </div>
                    <div className="bg-slate-900/40 rounded-lg px-2.5 py-2">
                      <div className="text-slate-500 text-[10px] mb-0.5">最高连击</div>
                      <div className="font-bold text-orange-400 tabular-nums">
                        {record.maxCombo}x
                      </div>
                    </div>
                    <div className="bg-slate-900/40 rounded-lg px-2.5 py-2">
                      <div className="text-slate-500 text-[10px] mb-0.5">错放</div>
                      <div className="font-bold text-rose-400 tabular-nums">
                        {record.wrongCount}次
                      </div>
                    </div>
                  </div>

                  {record.reviewAnalysis && !record.isTraining && (
                    <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                      <div className="flex gap-3 text-[11px]">
                        {record.reviewAnalysis.worstSlots.length > 0 && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Layers size={12} className="text-rose-400/70" />
                            易错槽: {record.reviewAnalysis.worstSlots[0].slotLabel}
                          </span>
                        )}
                        {record.reviewAnalysis.slowCardTypes.length > 0 && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Zap size={12} className="text-sky-400/70" />
                            慢: {record.reviewAnalysis.slowCardTypes[0].label}
                          </span>
                        )}
                        {record.reviewAnalysis.eventMisses.length > 0 && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <Activity size={12} className="text-purple-400/70" />
                            事件失误: {record.reviewAnalysis.eventMisses.reduce((s, e) => s + e.missCount, 0)}
                          </span>
                        )}
                      </div>
                      <ChevronRight size={16} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
