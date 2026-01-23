import { motion } from 'framer-motion';

interface StatusItem {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'stable';
}

const statusItems: StatusItem[] = [
  { label: 'STATUS', value: 'BUILDING', trend: 'stable' },
  { label: 'LOAD', value: 'WITHIN RANGE', trend: 'up' },
  { label: 'READINESS', value: '78%', trend: 'stable' },
  { label: 'RISK', value: 'LOW', trend: 'stable' },
];

const TrendIndicator = ({ trend }: { trend?: 'up' | 'down' | 'stable' }) => {
  if (!trend || trend === 'stable') return null;
  
  return (
    <span className="ml-1 text-[10px]">
      {trend === 'up' ? '↑' : '↓'}
    </span>
  );
};

export const TelemetryStatusBand = () => {
  return (
    <motion.div
      className="w-full border-b border-white/10"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between py-3 text-[11px] tracking-[0.15em] font-mono">
          {statusItems.map((item, index) => (
            <div key={item.label} className="flex items-center">
              {index > 0 && (
                <div className="w-px h-3 bg-slate-700/50 mr-6" />
              )}
              <div className="flex items-center gap-2">
                <span className="text-slate-500 uppercase">{item.label}</span>
                <span className="text-slate-300 uppercase flex items-center">
                  <TrendIndicator trend={item.trend} />
                  {item.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// Horizontal telemetry strip for breaking scroll
export const TelemetryStrip = ({ variant = 'default' }: { variant?: 'default' | 'alt' }) => {
  const metrics = variant === 'default' 
    ? [
        { label: 'PACE Δ', value: '−0.04', explanation: 'Normalized daily load' },
        { label: 'LOAD', value: '+6', suffix: '7d', explanation: 'Model confidence (14d)' },
        { label: 'CTL', value: '↑', explanation: 'Autonomic balance' },
        { label: 'ATL', value: '↓', explanation: 'Training response' },
        { label: 'TSB', value: '+8.2', explanation: 'vs personal baseline' },
      ]
    : [
        { label: 'ADAPTATION', value: '94%', explanation: 'Model confidence (14d)' },
        { label: 'RECOVERY', value: 'OPTIMAL', explanation: 'Autonomic balance' },
        { label: 'STRAIN', value: '12.4', explanation: 'Normalized daily load' },
        { label: 'HRV', value: '+3ms', explanation: 'vs personal baseline' },
        { label: 'SLEEP', value: '7.2h', explanation: 'Effective sleep time' },
      ];

  return (
    <motion.div
      className="w-full border-y border-white/10 py-4 overflow-hidden"
      style={{
        background: 'rgba(2, 6, 23, 0.4)',
        backdropFilter: 'blur(8px)',
      }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center justify-center gap-8 md:gap-16">
        {metrics.map((metric, i) => (
          <div key={i} className="flex flex-col items-center gap-1 whitespace-nowrap">
            <div className="flex items-center gap-2 text-[11px] tracking-[0.12em] font-mono">
              <span className="text-slate-600 uppercase">{metric.label}</span>
              <span className="text-slate-400">{metric.value}</span>
              {metric.suffix && <span className="text-slate-600">({metric.suffix})</span>}
            </div>
            {metric.explanation && (
              <span className="text-[9px] font-mono tracking-wider text-slate-600 opacity-50">
                {metric.explanation}
              </span>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
};
