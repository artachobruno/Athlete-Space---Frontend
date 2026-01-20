import { F1Card, F1CardHeader, F1CardTitle, F1CardLabel } from '@/components/ui/f1-card';
import { fetchOverview } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';
import { useEffect, useState } from 'react';

interface LoadStatusCardProps {
  overview60d?: {
    today: { ctl: number; atl: number; tsb: number };
    metrics: {
      ctl?: [string, number][];
      atl?: [string, number][];
      tsb?: [string, number][];
    };
  } | null;
  isLoading?: boolean;
  error?: unknown;
}

type LoadStatus = 'fresh' | 'optimal' | 'overreaching' | 'overtraining';
type F1Status = 'safe' | 'caution' | 'danger' | 'active';

const statusToF1: Record<LoadStatus, F1Status> = {
  fresh: 'safe',
  optimal: 'active',
  overreaching: 'caution',
  overtraining: 'danger',
};

const statusColors: Record<LoadStatus, string> = {
  fresh: 'hsl(145 60% 45%)',
  optimal: 'hsl(175 60% 45%)',
  overreaching: 'hsl(40 80% 50%)',
  overtraining: 'hsl(0 65% 50%)',
};

const getLoadStatus = (tsb: number): { status: LoadStatus; description: string; code: string } => {
  if (tsb > 5) return { status: 'fresh', description: 'READY FOR HIGH LOAD', code: 'FRESH' };
  if (tsb > 0) return { status: 'optimal', description: 'BALANCED · NOMINAL', code: 'OPTIMAL' };
  if (tsb > -5) return { status: 'overreaching', description: 'REDUCE INTENSITY', code: 'STRAIN' };
  return { status: 'overtraining', description: 'RECOVERY REQUIRED', code: 'CRITICAL' };
};

// SVG Load Band - horizontal bar showing CTL/ATL relationship
function LoadBandSvg({ ctl, atl, maxValue }: { ctl: number; atl: number; maxValue: number }) {
  const [animationProgress, setAnimationProgress] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimationProgress(1), 50);
    return () => clearTimeout(timer);
  }, []);

  const width = 200;
  const height = 20;
  const padding = 2;
  const barHeight = 6;
  const effectiveMax = Math.max(maxValue, ctl, atl, 1);
  
  const ctlWidth = (ctl / effectiveMax) * (width - padding * 2);
  const atlWidth = (atl / effectiveMax) * (width - padding * 2);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-5">
      <defs>
        <linearGradient id="ctlGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(175 60% 45%)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(175 60% 45%)" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id="atlGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(35 80% 55%)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="hsl(35 80% 55%)" stopOpacity="0.8" />
        </linearGradient>
      </defs>
      
      {/* Background track */}
      <rect x={padding} y={4} width={width - padding * 2} height={barHeight} fill="hsl(215 15% 16%)" rx="1" />
      <rect x={padding} y={10} width={width - padding * 2} height={barHeight} fill="hsl(215 15% 16%)" rx="1" />
      
      {/* CTL bar (fitness) */}
      <rect 
        x={padding} 
        y={4} 
        width={ctlWidth * animationProgress} 
        height={barHeight} 
        fill="url(#ctlGradient)" 
        rx="1"
        style={{ transition: 'width 0.5s ease-out' }}
      />
      
      {/* ATL bar (fatigue) */}
      <rect 
        x={padding} 
        y={10} 
        width={atlWidth * animationProgress} 
        height={barHeight} 
        fill="url(#atlGradient)" 
        rx="1"
        style={{ transition: 'width 0.5s ease-out' }}
      />
      
      {/* CTL marker */}
      <line 
        x1={padding + ctlWidth * animationProgress} 
        y1={3} 
        x2={padding + ctlWidth * animationProgress} 
        y2={10} 
        stroke="hsl(175 60% 55%)" 
        strokeWidth="1.5"
        opacity={animationProgress}
        style={{ transition: 'opacity 0.3s ease-out 0.3s' }}
      />
      
      {/* ATL marker */}
      <line 
        x1={padding + atlWidth * animationProgress} 
        y1={10} 
        x2={padding + atlWidth * animationProgress} 
        y2={17} 
        stroke="hsl(35 80% 60%)" 
        strokeWidth="1.5"
        opacity={animationProgress}
        style={{ transition: 'opacity 0.3s ease-out 0.3s' }}
      />
    </svg>
  );
}

// SVG TSB Gauge - arc showing form balance
function TsbGaugeSvg({ tsb, status }: { tsb: number; status: LoadStatus }) {
  const [animationProgress, setAnimationProgress] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimationProgress(1), 50);
    return () => clearTimeout(timer);
  }, []);

  const size = 80;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2 - 4;
  const center = size / 2;
  
  // TSB range: -20 to +20, mapped to arc
  const normalizedTsb = Math.max(-20, Math.min(20, tsb));
  const angle = ((normalizedTsb + 20) / 40) * 180 - 90; // -90 to 90 degrees
  
  // Arc path (bottom half)
  const startAngle = -180;
  const endAngle = 0;
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  
  const x1 = center + radius * Math.cos(startRad);
  const y1 = center + radius * Math.sin(startRad);
  const x2 = center + radius * Math.cos(endRad);
  const y2 = center + radius * Math.sin(endRad);
  
  // Needle position
  const needleAngle = ((angle - 90) * Math.PI) / 180;
  const needleLength = radius - 8;
  const needleX = center + needleLength * Math.cos(needleAngle) * animationProgress;
  const needleY = center + needleLength * Math.sin(needleAngle) * animationProgress;
  
  const color = statusColors[status];

  return (
    <svg viewBox={`0 0 ${size} ${size / 2 + 10}`} className="w-20 h-12">
      <defs>
        <linearGradient id="gaugeArc" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(0 65% 50%)" stopOpacity="0.4" />
          <stop offset="25%" stopColor="hsl(40 80% 50%)" stopOpacity="0.4" />
          <stop offset="50%" stopColor="hsl(175 60% 45%)" stopOpacity="0.4" />
          <stop offset="75%" stopColor="hsl(145 60% 45%)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="hsl(145 60% 45%)" stopOpacity="0.4" />
        </linearGradient>
        <filter id="gaugeGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      
      {/* Background arc */}
      <path 
        d={`M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`}
        fill="none"
        stroke="url(#gaugeArc)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      
      {/* Active arc segment */}
      <path 
        d={`M ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2}`}
        fill="none"
        stroke="hsl(215 15% 20%)"
        strokeWidth={strokeWidth - 1}
        strokeLinecap="round"
      />
      
      {/* Needle */}
      <line 
        x1={center} 
        y1={center} 
        x2={needleX} 
        y2={needleY}
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        filter="url(#gaugeGlow)"
        style={{ transition: 'all 0.6s ease-out' }}
      />
      
      {/* Center dot */}
      <circle cx={center} cy={center} r="3" fill={color} filter="url(#gaugeGlow)" />
      
      {/* Tick marks */}
      {[-20, -10, 0, 10, 20].map((tick, i) => {
        const tickAngle = (((tick + 20) / 40) * 180 - 180) * Math.PI / 180;
        const innerR = radius - 2;
        const outerR = radius + 4;
        return (
          <line
            key={i}
            x1={center + innerR * Math.cos(tickAngle)}
            y1={center + innerR * Math.sin(tickAngle)}
            x2={center + outerR * Math.cos(tickAngle)}
            y2={center + outerR * Math.sin(tickAngle)}
            stroke="hsl(215 15% 30%)"
            strokeWidth="1"
          />
        );
      })}
    </svg>
  );
}

// Trend sparkline SVG
function TrendSparklineSvg({ data, color }: { data: number[]; color: string }) {
  const [animationProgress, setAnimationProgress] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => setAnimationProgress(1), 100);
    return () => clearTimeout(timer);
  }, []);

  if (data.length < 2) return null;
  
  const width = 48;
  const height = 16;
  const padding = 1;
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = padding + (1 - (v - min) / range) * (height - padding * 2);
    return { x, y };
  });
  
  // Build smooth path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    pathD += ` Q ${cpx} ${prev.y}, ${cpx} ${(prev.y + curr.y) / 2}`;
    pathD += ` Q ${cpx} ${curr.y}, ${curr.x} ${curr.y}`;
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-12 h-4">
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={animationProgress * 0.8}
        style={{ transition: 'opacity 0.4s ease-out' }}
      />
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="2"
        fill={color}
        opacity={animationProgress}
        style={{ transition: 'opacity 0.4s ease-out 0.2s' }}
      />
    </svg>
  );
}

export function LoadStatusCard(props?: LoadStatusCardProps) {
  const propsOverview = props?.overview60d;
  const propsIsLoading = props?.isLoading;
  const propsError = props?.error;

  const { data: overview, isLoading: overviewLoading, error: overviewError } = useAuthenticatedQuery({
    queryKey: ['overview', 60],
    queryFn: () => {
      console.log('[LoadStatusCard] Fetching overview for 60 days');
      return fetchOverview(60);
    },
    retry: 1,
    enabled: propsOverview === undefined,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const finalOverview = propsOverview !== undefined ? propsOverview : overview;
  const isLoading = propsIsLoading !== undefined ? propsIsLoading : overviewLoading;
  const error = propsError !== undefined ? propsError : overviewError;

  if (isLoading) {
    return (
      <F1Card className="h-full min-h-[200px]">
        <F1CardHeader>
          <F1CardTitle>LOAD STATUS</F1CardTitle>
        </F1CardHeader>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--f1-text-tertiary))]" />
        </div>
      </F1Card>
    );
  }

  if (error || !finalOverview) {
    return (
      <F1Card className="h-full min-h-[200px]">
        <F1CardHeader>
          <F1CardTitle>LOAD STATUS</F1CardTitle>
        </F1CardHeader>
        <div className="text-center py-8">
          <p className="f1-label tracking-widest text-[hsl(var(--f1-text-muted))]">SIGNAL UNAVAILABLE</p>
        </div>
      </F1Card>
    );
  }

  const today = finalOverview?.today as { ctl?: number; atl?: number; tsb?: number } || {};
  const ctl = typeof today.ctl === 'number' ? today.ctl : 0;
  const atl = typeof today.atl === 'number' ? today.atl : 0;
  const tsb = typeof today.tsb === 'number' ? today.tsb : 0;
  
  const loadStatus = getLoadStatus(tsb);
  const f1Status = statusToF1[loadStatus.status];
  
  // Extract trend data
  const metrics = finalOverview?.metrics || {};
  const ctlData = Array.isArray(metrics.ctl) ? metrics.ctl.slice(-7).map(d => d[1]) : [];
  const atlData = Array.isArray(metrics.atl) ? metrics.atl.slice(-7).map(d => d[1]) : [];
  
  // Calculate CTL trend
  const ctlTrend = ctlData.length >= 7 ? ctl - ctlData[0] : 0;
  const maxLoadValue = Math.max(ctl, atl, 100);

  return (
    <F1Card className="h-full min-h-[200px]" status={f1Status}>
      <F1CardHeader>
        <F1CardTitle>LOAD STATUS</F1CardTitle>
      </F1CardHeader>
      
      <div className="space-y-3">
        {/* Primary: TSB Gauge + Value */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TsbGaugeSvg tsb={tsb} status={loadStatus.status} />
            <div>
              <div className="flex items-baseline gap-1.5">
                <span 
                  className="font-mono text-2xl font-semibold tracking-tight"
                  style={{ color: statusColors[loadStatus.status] }}
                >
                  {tsb > 0 ? '+' : ''}{tsb.toFixed(0)}
                </span>
                <F1CardLabel>TSB</F1CardLabel>
              </div>
              <div 
                className="font-mono text-[9px] tracking-widest mt-0.5"
                style={{ color: statusColors[loadStatus.status] }}
              >
                {loadStatus.code}
              </div>
            </div>
          </div>
          
          {/* Status description */}
          <div 
            className="text-right font-mono text-[9px] tracking-wider leading-tight max-w-[80px]"
            style={{ color: statusColors[loadStatus.status], opacity: 0.8 }}
          >
            {loadStatus.description}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-[hsl(215_15%_18%)]" />

        {/* Load Band Visualization */}
        <div className="space-y-1">
          <LoadBandSvg ctl={ctl} atl={atl} maxValue={maxLoadValue} />
          
          {/* CTL/ATL Labels */}
          <div className="flex justify-between text-[9px] font-mono">
            <div className="flex items-center gap-2">
              <span className="text-[hsl(175_60%_50%)]">CTL</span>
              <span className="text-[hsl(var(--f1-text-primary))]">{ctl.toFixed(0)}</span>
              {ctlData.length > 1 && (
                <TrendSparklineSvg data={ctlData} color="hsl(175 60% 50%)" />
              )}
              {ctlTrend !== 0 && (
                <span className={cn(
                  "tracking-tight",
                  ctlTrend > 0 ? "text-[hsl(145_60%_45%)]" : "text-[hsl(0_60%_50%)]"
                )}>
                  {ctlTrend > 0 ? '▲' : '▼'}{Math.abs(ctlTrend).toFixed(0)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[hsl(35_80%_55%)]">ATL</span>
              <span className="text-[hsl(var(--f1-text-primary))]">{atl.toFixed(0)}</span>
              {atlData.length > 1 && (
                <TrendSparklineSvg data={atlData} color="hsl(35 80% 55%)" />
              )}
            </div>
          </div>
        </div>
      </div>
    </F1Card>
  );
}
