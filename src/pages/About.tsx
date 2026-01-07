import { PublicLayout } from '@/components/layout/PublicLayout';
import { Separator } from '@/components/ui/separator';
import { Brain, Shield, Heart, Scale, AlertTriangle } from 'lucide-react';

const principles = [
  {
    icon: Brain,
    title: 'Science before speculation',
    description: 'Every recommendation is grounded in validated exercise science and peer-reviewed research.',
  },
  {
    icon: Shield,
    title: 'AI as decision support',
    description: 'Technology augments human judgment—it never replaces the athlete or coach.',
  },
  {
    icon: Heart,
    title: 'Long-term development',
    description: 'We prioritize sustainable progress and athlete health over short-term performance gains.',
  },
  {
    icon: Scale,
    title: 'Transparency & safety',
    description: 'All insights are explainable, and athlete wellbeing is always the priority.',
  },
];

export default function About() {
  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Header */}
        <header className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-4">
            About AthleteSpace
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Helping endurance athletes train smarter, recover better, and make decisions grounded in science rather than hype.
          </p>
        </header>

        <Separator className="mb-12" />

        {/* Mission Section */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-foreground mb-4">Our Mission</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              Endurance training is complex. Athletes must balance fitness, fatigue, recovery, and long-term health—often with incomplete or noisy data.
            </p>
            <p>
              AthleteSpace was created to bring clarity to that process by combining validated exercise science with modern AI, delivering training intelligence that is explainable, personalized, and responsible.
            </p>
          </div>
        </section>

        <Separator className="mb-12" />

        {/* Who Builds Section */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-foreground mb-4">Who Builds AthleteSpace</h2>
          <div className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              AthleteSpace is built and led by an applied AI researcher with a Ph.D. in Artificial Intelligence and Machine Learning and multiple years of experience building production AI systems at several leading technology companies.
            </p>
            <p>
              The platform is informed not only by academic research, but also by extensive firsthand experience as an endurance athlete—including multiple Ironman finishes, an Ironman championship, a sub-9-hour Ironman performance, and a sub-2:30 marathon.
            </p>
            <p className="text-foreground font-medium">
              This dual background ensures AthleteSpace is grounded in both scientific rigor and the practical realities of high-level endurance training.
            </p>
          </div>
        </section>

        <Separator className="mb-12" />

        {/* Principles Section */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-foreground mb-6">Our Principles</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {principles.map((principle) => (
              <div
                key={principle.title}
                className="p-5 rounded-lg border border-border bg-card"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 p-2 rounded-md bg-muted">
                    <principle.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground mb-1">
                      {principle.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {principle.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <Separator className="mb-12" />

        {/* Important Notice */}
        <section className="mb-8">
          <div className="p-5 rounded-lg border border-border bg-muted/30">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-2 rounded-md bg-background border border-border">
                <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-foreground mb-2">Important Notice</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  AthleteSpace does not provide medical diagnosis or treatment and does not replace professional coaching or healthcare advice. All insights are intended for training and performance purposes only.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
