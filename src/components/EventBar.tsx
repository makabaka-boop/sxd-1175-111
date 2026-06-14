import { AlertTriangle, Lock, Zap, Users, Info } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';

const eventStyle: Record<string, { icon: typeof Info; color: string; bg: string }> = {
  slot_close: { icon: Lock, color: 'text-rose-300', bg: 'bg-rose-950/80 border-rose-700/60' },
  fake_card: { icon: AlertTriangle, color: 'text-amber-300', bg: 'bg-amber-950/70 border-amber-700/60' },
  priority_change: { icon: Zap, color: 'text-sky-300', bg: 'bg-sky-950/70 border-sky-700/60' },
  rush_hour: { icon: Users, color: 'text-orange-300', bg: 'bg-orange-950/80 border-orange-700/60' },
  info: { icon: Info, color: 'text-slate-300', bg: 'bg-slate-900/80 border-slate-700/60' },
};

export function EventBar() {
  const messages = useGameStore((s) => s.eventMessages);
  const activeEvents = useGameStore((s) => s.activeEvents);
  const level = useGameStore((s) => s.level);
  const elapsedMs = useGameStore((s) => s.elapsedMs);

  if (!level) return null;

  const upcoming = level.events
    .filter((e) => e.triggerAt > elapsedMs)
    .sort((a, b) => a.triggerAt - b.triggerAt)
    .slice(0, 2);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-3 space-y-2">
      <div className="flex items-center gap-2 flex-wrap min-h-[2.5rem]">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          动态
        </span>
        {messages.length === 0 && (
          <span className="text-xs text-slate-600">暂无事件...</span>
        )}
        {messages.map((m) => {
          const cfg = eventStyle[m.type] ?? eventStyle.info;
          const Icon = cfg.icon;
          return (
            <div
              key={m.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs animate-slide-in ${cfg.bg}`}
            >
              <Icon size={12} className={cfg.color} />
              <span className={`${cfg.color} font-medium`}>{m.text}</span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          进行中
        </span>
        {activeEvents.length === 0 && (
          <span className="text-xs text-slate-600">—</span>
        )}
        {activeEvents.map((ev) => {
          const cfg = eventStyle[ev.type] ?? eventStyle.info;
          const Icon = cfg.icon;
          const remain = Math.max(0, ev.triggerAt + ev.duration - elapsedMs);
          return (
            <div
              key={ev.id}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] ${cfg.bg}`}
            >
              <Icon size={11} className={cfg.color} />
              <span className={cfg.color}>{ev.message.split('】')[1] ?? ev.message}</span>
              <span className={`font-mono ${cfg.color} opacity-80`}>
                {Math.ceil(remain / 1000)}s
              </span>
            </div>
          );
        })}
      </div>

      {upcoming.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap opacity-60">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            预告
          </span>
          {upcoming.map((ev) => {
            const cfg = eventStyle[ev.type] ?? eventStyle.info;
            const Icon = cfg.icon;
            const at = Math.ceil((ev.triggerAt - elapsedMs) / 1000);
            return (
              <div
                key={ev.id}
                className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] border border-dashed border-slate-700/50"
              >
                <Icon size={10} className="text-slate-500" />
                <span className="text-slate-400">{ev.message.split('】')[1] ?? ev.message}</span>
                <span className="text-slate-500 font-mono">@ {at}s</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
