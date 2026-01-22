import { GlassCard } from '@/components/ui/GlassCard';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

interface FAQItem {
  question: string;
  answer: string | React.ReactNode;
}

const faqItems: FAQItem[] = [
  {
    question: 'Where can I learn more about the science and AI behind Athlete Space?',
    answer: (
      <>
        Learn more about our scientific foundations and AI methodology on our{' '}
        <Link to="/science" className="text-accent underline hover:text-accent/80">
          Science & AI page
        </Link>.
      </>
    ),
  },
  {
    question: 'What is Athlete Space?',
    answer:
      'Athlete Space is an AI-powered performance intelligence platform for endurance athletes. We combine proven exercise science with modern AI to help you understand your training load, recovery, and readiness, and to support better day-to-day training decisions.',
  },
  {
    question: 'Is Athlete Space really AI-driven, or just a calculator?',
    answer:
      'Athlete Space uses validated sports science models as its foundation, and applies AI on top of them. The science defines how training stress and adaptation work, while AI personalizes those models to you, selects the best signals based on available data, and adapts as your fitness changes.',
  },
  {
    question: 'What science is Athlete Space based on?',
    answer:
      'Athlete Space is built on widely accepted endurance training models used by elite coaches and Olympic programs, including Training Stress Score (TSS), the Performance Manager model (CTL, ATL, Form), Banister TRIMP (heart-rate impulse), and session-based perceived exertion models. These approaches are supported by decades of peer-reviewed research.',
  },
  {
    question: 'Who builds and validates Athlete Space?',
    answer:
      'Athlete Space is designed and continuously reviewed by Ph.D.-level researchers in physiology, AI, and applied data science. Our goal is not to invent new physiology, but to correctly apply and personalize the best existing science using modern machine learning.',
  },
  {
    question: 'How does Athlete Space measure training stress?',
    answer:
      'We calculate training stress using the best available data for each session. When power or pace data is available, we use intensity relative to your personal threshold. When it is not, we fall back to heart-rate physiology models or perceived effort. AI ensures everything is converted into a single, consistent training load scale.',
  },
  {
    question: 'What are TSS, CTL, ATL, and Form?',
    answer:
      'TSS (Training Stress Score) measures how demanding a single workout was. CTL (Chronic Training Load) represents long-term fitness built over weeks. ATL (Acute Training Load) reflects short-term fatigue from recent days. Form (also called Training Stress Balance) is the difference between fitness and fatigue and helps indicate readiness to perform.',
  },
  {
    question: 'Why not just track heart rate, pace, or mileage?',
    answer:
      'Single metrics are often misleading. Physiological stress is not linear, and the same pace or heart rate can represent very different strain depending on fatigue, heat, terrain, and fitness. Athlete Space uses non-linear, science-backed models that better reflect how the body actually responds to training.',
  },
  {
    question: 'Does Athlete Space work if my data is incomplete?',
    answer:
      'Yes. Athlete Space is designed for real-world training. If some sensors are missing or unreliable, AI automatically selects appropriate fallback models and maintains continuity in your fitness and fatigue tracking.',
  },
  {
    question: 'How does the AI coach work?',
    answer:
      'The AI coach analyzes your training load, recovery trends, and recent patterns to provide context-aware recommendations. It helps answer questions like when to push, when to back off, and when recovery matters more than intensity, using both data and established training principles.',
  },
  {
    question: 'Does Athlete Space replace a human coach?',
    answer:
      'No. Athlete Space is a decision-support tool. It helps athletes and coaches make better-informed choices, improves consistency, and highlights risk or opportunity, but it does not replace human judgment or coaching relationships.',
  },
  {
    question: 'What data does Athlete Space collect?',
    answer:
      'With your explicit consent, Athlete Space collects training and wellness data from connected platforms such as activity details, heart rate, recovery indicators, and training load metrics. We only collect data you authorize and only for performance and training insight purposes.',
  },
  {
    question: 'How is my data used?',
    answer:
      'Your data is used solely to generate personalized training insights, fitness and fatigue trends, and AI-driven recommendations. Athlete Space does not sell or share individual user data with advertisers or third parties.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes. We use secure communication protocols and encrypted storage to protect your data. Access is limited to systems required to provide the service you’ve authorized.',
  },
  {
    question: 'Does Athlete Space provide medical advice?',
    answer:
      'No. Athlete Space does not provide medical diagnosis or treatment. All insights are for training and performance purposes only. Always consult a qualified healthcare professional for medical concerns.',
  },
  {
    question: 'Is Athlete Space free to use?',
    answer:
      'Athlete Space is currently in pre-launch and private beta. We plan to offer a free tier and optional premium features in the future. Details will be shared as the product evolves.',
  },
];

function FAQItemComponent({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <GlassCard className="border-border">
      <CardHeader
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium text-foreground pr-8">
            {item.question}
          </CardTitle>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
          )}
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent>
          <div className="text-muted-foreground leading-relaxed">
            {typeof item.answer === 'string' ? <p>{item.answer}</p> : item.answer}
          </div>
        </CardContent>
      )}
    </GlassCard>
  );
}

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">Frequently Asked Questions</h1>
          <p className="text-muted-foreground">Find answers to common questions about Athlete Space</p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqItems.map((item, index) => (
            <FAQItemComponent
              key={index}
              item={item}
              isOpen={openItems.has(index)}
              onToggle={() => toggleItem(index)}
            />
          ))}
        </div>

        {/* Contact Section */}
        <GlassCard className="mt-8 border-accent/20 bg-accent/5">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">Still have questions?</h3>
              <p className="text-muted-foreground mb-4">
                Can't find the answer you're looking for? Please contact us through the Settings page if you're logged in, or reach out to our support team.
              </p>
            </div>
          </CardContent>
        </GlassCard>
      </div>
  );
}

