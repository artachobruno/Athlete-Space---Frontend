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
      className="w-full border-b border-slate-800/50"
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
        { label: 'PACE Δ', value: '−0.04' },
        { label: 'LOAD', value: '+6', suffix: '7d' },
        { label: 'CTL', value: '↑' },
        { label: 'ATL', value: '↓' },
        { label: 'TSB', value: '+8.2' },
      ]
    : [
        { label: 'ADAPTATION', value: '94%' },
        { label: 'RECOVERY', value: 'OPTIMAL' },
        { label: 'STRAIN', value: '12.4' },
        { label: 'HRV', value: '+3ms' },
        { label: 'SLEEP', value: '7.2h' },
      ];

  return (
    <motion.div 
      className="w-full bg-slate-900/30 border-y border-slate-800/30 py-4 overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center justify-center gap-8 md:gap-16 text-[11px] tracking-[0.12em] font-mono">
        {metrics.map((metric, i) => (
          <div key={i} className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-slate-600 uppercase">{metric.label}</span>
            <span className="text-slate-400">{metric.value}</span>
            {metric.suffix && <span className="text-slate-600">({metric.suffix})</span>}
          </div>
        ))}
      </div>
    </motion.div>
  );
};
