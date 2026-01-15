import { PublicLayout } from '@/components/layout/PublicLayout';
import { GlassCard } from '@/components/ui/GlassCard';
import { Brain, Activity, LineChart, ShieldCheck } from 'lucide-react';

export default function ScienceAndAI() {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Brain className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-3">
            Science & AI Methodology
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Athlete Space combines proven endurance science with modern AI to
            deliver personalized, responsible, and explainable training
            intelligence.
          </p>
        </div>

        <div className="space-y-6">
          {/* Section 1 */}
          <GlassCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Activity className="h-5 w-5" />
                Science First, Always
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground leading-relaxed">
              <p>
                Athlete Space does not invent new physiology. We implement
                well-established, peer-reviewed endurance training models that
                have been used for decades by Olympic programs, professional
                teams, and elite coaches.
              </p>
              <p className="mt-3">
                Our core framework is built on Training Stress Score (TSS),
                Chronic and Acute Training Load (CTL & ATL), and Training Stress
                Balance (Form), alongside validated heart-rate and perceived
                exertion models.
              </p>
            </CardContent>
          </GlassCard>

          {/* Section 2 */}
          <GlassCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <LineChart className="h-5 w-5" />
                What the AI Actually Does
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground leading-relaxed">
              <p>
                AI in Athlete Space is used to apply science correctly and
                consistently, not to replace it.
              </p>
              <ul className="list-disc list-inside mt-3 space-y-2">
                <li>Select the most appropriate stress model based on available data</li>
                <li>Personalize training load calculations to each athlete</li>
                <li>Adapt thresholds as fitness changes</li>
                <li>Detect mismatches between external load and physiological strain</li>
                <li>Translate complex metrics into clear, actionable guidance</li>
              </ul>
            </CardContent>
          </GlassCard>

          {/* Section 3 */}
          <GlassCard>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <ShieldCheck className="h-5 w-5" />
                Research-Led and Responsible
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground leading-relaxed">
              <p>
                Athlete Space is designed and continuously reviewed by Ph.D.-level
                researchers in physiology, artificial intelligence, and applied
                data science.
              </p>
              <p className="mt-3">
                We prioritize explainability, athlete safety, and scientific
                validity. Athlete Space does not provide medical diagnosis or
                treatment and does not replace professional coaching or medical
                advice.
              </p>
            </CardContent>
          </GlassCard>

          {/* Section 4 */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6 text-center">
              <p className="font-medium text-primary">
                Bottom line
              </p>
              <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">
                Athlete Space is not AI guessing. It is AI applying validated
                endurance science—personalized to you, continuously, and
                responsibly.
              </p>
            </CardContent>
          </GlassCard>
        </div>
      </div>
    </PublicLayout>
  );
}

