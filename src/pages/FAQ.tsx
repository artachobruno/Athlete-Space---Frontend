import { PublicLayout } from '@/components/layout/PublicLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: 'What is Athlete Space?',
    answer: 'Athlete Space is a fitness and performance application designed to provide personalized training insights to endurance athletes. We help you track your activities, analyze your performance, and get AI-powered coaching recommendations.',
  },
  {
    question: 'How do I connect my Strava account?',
    answer: 'During the onboarding process, you\'ll be prompted to connect your Strava account. Simply click the "Connect Strava" button and authorize Athlete Space to access your activity data. You can also connect or disconnect Strava at any time from the Settings page.',
  },
  {
    question: 'What data does Athlete Space collect?',
    answer: 'With your explicit consent, Athlete Space collects fitness and wellness data from connected third-party services, including activity data (workouts, duration, distance), heart rate metrics, sleep and recovery data, and training load indicators. We only collect data you explicitly authorize us to access.',
  },
  {
    question: 'How is my data used?',
    answer: 'We use your data solely to provide personalized training insights, performance analysis, recovery and fatigue trends, and to improve the functionality and accuracy of the application. We do not sell, rent, or share individual user data with advertisers or third parties.',
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, we implement reasonable technical and organizational safeguards to protect your data, including encrypted storage and secure communication protocols. Your data is stored securely and only accessed for the purposes you\'ve authorized.',
  },
  {
    question: 'Can I use Athlete Space without Strava?',
    answer: 'Yes, you can use Athlete Space without connecting Strava. However, connecting Strava allows us to automatically sync your activities and provide more comprehensive training insights. You can manually log activities or connect other fitness platforms in the future.',
  },
  {
    question: 'How does the AI coach work?',
    answer: 'Our AI coach analyzes your training data, performance metrics, and goals to provide personalized recommendations. It considers factors like training load, recovery status, and upcoming events to suggest when to train hard, when to rest, and how to modify your workouts.',
  },
  {
    question: 'What training metrics does Athlete Space track?',
    answer: 'Athlete Space tracks various training metrics including CTL (Chronic Training Load), ATL (Acute Training Load), TSB (Training Stress Balance), training load, heart rate zones, pace, power, and more. These metrics help you understand your fitness, fatigue, and form.',
  },
  {
    question: 'Can I export my data?',
    answer: 'Yes, you can export your calendar data in ICS format from the Calendar page. For other data exports, please contact us through the Settings page. We\'re committed to data portability and will help you export your data upon request.',
  },
  {
    question: 'How do I delete my account?',
    answer: 'To delete your account and all associated data, please contact us through the Settings page. We will process your request in accordance with applicable data protection laws and delete your personal data within a reasonable timeframe.',
  },
  {
    question: 'Does Athlete Space provide medical advice?',
    answer: 'No, Athlete Space does not provide medical diagnosis or treatment. Our insights and recommendations are for training and performance purposes only. Always consult with a healthcare professional for medical concerns or before starting a new training program.',
  },
  {
    question: 'Is Athlete Space free to use?',
    answer: 'Athlete Space is currently in pre-launch. Please check our website or contact us for information about pricing and availability. We may offer both free and premium tiers in the future.',
  },
];

function FAQItemComponent({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <Card className="border-border">
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
          <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
        </CardContent>
      )}
    </Card>
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
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-accent/10 mb-4">
            <HelpCircle className="h-8 w-8 text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Frequently Asked Questions</h1>
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
        <Card className="mt-8 border-accent/20 bg-accent/5">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground mb-2">Still have questions?</h3>
              <p className="text-muted-foreground mb-4">
                Can't find the answer you're looking for? Please contact us through the Settings page if you're logged in, or reach out to our support team.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}

