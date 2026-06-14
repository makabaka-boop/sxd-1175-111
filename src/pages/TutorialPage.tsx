import { ArrowLeft, Hand, Trash2, ArrowLeftRight, AlertTriangle, Lock, Zap, Users, Crown, Target, Clock, Flame, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const steps = [
  {
    icon: Hand,
    title: '基础归位：拖拽卡片',
    color: 'from-sky-500 to-indigo-500',
    iconColor: 'text-sky-300',
    desc: '按住左侧卡池中的任意卡片，拖动到右侧相同颜色和类型的卡槽上，松开即完成放置。',
    tip: '正确放置会获得基础分 + 速度加成，连续正确可触发高额连击加成！',
  },
  {
    icon: Trash2,
    title: '撤卡操作：点击快速按钮',
    color: 'from-rose-500 to-orange-500',
    iconColor: 'text-rose-300',
    desc: '卡片悬停时右上角会出现红色叉号，点击即可撤卡。也可以使用底部的「快速撤卡」栏一键移除最旧的卡。',
    tip: '干扰卡（带★标记）撤卡不扣分，其他卡片撤卡按错放处理。',
  },
  {
    icon: ArrowLeftRight,
    title: '位置替换：交换卡槽内容',
    color: 'from-violet-500 to-fuchsia-500',
    iconColor: 'text-violet-300',
    desc: '点击「位置替换」按钮进入替换模式，依次点击两个卡槽即可交换它们当前的卡片内容。',
    tip: '通道临时关闭时不可参与交换，合理利用替换可以快速调整错位情况。',
  },
  {
    icon: AlertTriangle,
    title: '同名干扰卡事件',
    color: 'from-amber-500 to-yellow-500',
    iconColor: 'text-amber-300',
    desc: '卡池中会出现带 ★ 标记的同名干扰卡。它们的类型与真卡不同，归位会判定为错放。',
    tip: '注意核对卡片的颜色和左上角的字母标记，不要被名称迷惑！',
  },
  {
    icon: Lock,
    title: '临时关闭 & 优先级变更',
    color: 'from-rose-500 to-red-500',
    iconColor: 'text-rose-300',
    desc: '【通道关闭】：卡槽被锁定，无法接受卡片。【优先级变更】：某位置被升级为加急/VIP，对应卡片得分倍率提升。',
    tip: '顶部事件条会提前预告关键事件，做好准备！',
  },
  {
    icon: Users,
    title: '高峰客流叠加',
    color: 'from-orange-500 to-red-500',
    iconColor: 'text-orange-300',
    desc: '高峰期间，卡片生成速度成倍提高（1.5x~2x），且可能与其他事件叠加出现。',
    tip: '保持冷静，优先处理VIP/加急卡（Crown/Zap标记），得分效率更高。',
  },
  {
    icon: Target,
    title: '评分规则',
    color: 'from-emerald-500 to-teal-500',
    iconColor: 'text-emerald-300',
    desc: '最终得分 = 正确归位分 × 优先级倍率 + 速度加成 + 连击加成 - 错放扣分 - 空槽扣分 - 事件扣分',
    tip: '星级评定：达到目标分=1星，达到二星线=2星，达到三星线=3星。',
  },
  {
    icon: Clock,
    title: '暂停与结算',
    color: 'from-indigo-500 to-purple-500',
    iconColor: 'text-indigo-300',
    desc: '点击右上角暂停按钮或按空格键，倒计时与所有事件都会完全停止。结算页会展示每个位置的正确率、扣分来源，以及一条专属复盘建议。',
    tip: '暂停时可以整理思路，想好接下来的处理顺序。',
  },
];

export function TutorialPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen py-8 px-4 relative overflow-hidden">
      <div className="absolute -top-40 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: '#6366f1' }} />
      <div className="absolute -bottom-40 right-1/4 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ background: '#10b981' }} />

      <div className="max-w-4xl mx-auto relative">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 text-slate-200 transition-all"
          >
            <ArrowLeft size={16} />
            <span className="text-sm">返回</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
              新手指南
            </h1>
            <p className="text-xs text-slate-400">共 {steps.length} 步，建议按顺序阅读</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {steps.map((s, i) => (
            <div
              key={i}
              className="relative rounded-2xl p-5 bg-slate-900/70 border border-slate-700/60 overflow-hidden group hover:border-indigo-500/40 transition-colors"
            >
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 blur-2xl bg-gradient-to-br ${s.color}`} />

              <div className="relative space-y-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg`}>
                    <s.icon size={22} className="text-white" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-500 tracking-widest">
                      STEP {String(i + 1).padStart(2, '0')}
                    </div>
                    <div className="text-base font-bold text-white">{s.title}</div>
                  </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">{s.desc}</p>

                <div className="flex items-start gap-1.5 bg-slate-950/50 rounded-lg px-3 py-2.5 border border-slate-800/60">
                  <Flame size={14} className="text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-200/90 leading-relaxed">{s.tip}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl p-6 bg-gradient-to-br from-indigo-500/10 via-slate-900/60 to-sky-500/10 border border-indigo-500/30">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-400" />
            快速上手 Checklist
          </h3>
          <div className="grid md:grid-cols-2 gap-2 text-sm">
            {[
              '拖拽卡片到同色同类型的卡槽',
              '优先处理带 Crown/VIP、Zap/加急 标记的卡片',
              '检查卡片是否带 ★ 同名干扰标记',
              '关注顶部事件条的关闭/高峰预告',
              '利用暂停键（空格）在混乱时刻整理思路',
              '使用位置替换应对错误放置',
              '正确归位时维持连击以获得高额加成',
              '三星通关即解锁下一关内容',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-slate-300">
                <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl p-4 bg-slate-900/70 border border-slate-700/60">
            <Crown size={20} className="text-rose-400 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-200">VIP 卡</div>
            <div className="text-[10px] text-slate-500 mt-0.5">得分 x1.5</div>
          </div>
          <div className="rounded-xl p-4 bg-slate-900/70 border border-slate-700/60">
            <Zap size={20} className="text-amber-400 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-200">加急卡</div>
            <div className="text-[10px] text-slate-500 mt-0.5">得分 x1.2</div>
          </div>
          <div className="rounded-xl p-4 bg-slate-900/70 border border-slate-700/60">
            <Users size={20} className="text-orange-400 mx-auto mb-2" />
            <div className="text-xs font-bold text-slate-200">高峰期</div>
            <div className="text-[10px] text-slate-500 mt-0.5">卡片加速 x1.5~2</div>
          </div>
        </div>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/game/1')}
            className="px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-500 via-violet-500 to-sky-500 hover:from-indigo-400 hover:via-violet-400 hover:to-sky-400 shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5"
          >
            现在开始第 1 关 →
          </button>
        </div>
      </div>
    </div>
  );
}
