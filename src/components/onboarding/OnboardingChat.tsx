import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, User, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OnboardingOptionChips } from './OnboardingOptionChips';
import { StravaConnectCard } from './StravaConnectCard';
import { CoachSummaryCard } from './CoachSummaryCard';
import { saveProfile } from '@/lib/storage';
import type { AthleteProfile, Sport } from '@/types';

interface OnboardingChatProps {
  onComplete: () => void;
  isComplete: boolean;
}

type Step = 'welcome' | 'sports' | 'consistency' | 'goals' | 'race-details' | 'availability' | 'hours' | 'injuries' | 'injury-details' | 'strava' | 'analyzing' | 'summary' | 'complete';

interface Message {
  id: string;
  role: 'coach' | 'athlete';
  content: string;
  component?: 'sports' | 'consistency' | 'goals' | 'availability' | 'hours' | 'injuries' | 'strava' | 'summary' | 'text-input';
}

const stepOrder: Step[] = ['welcome', 'sports', 'consistency', 'goals', 'availability', 'injuries', 'strava', 'summary', 'complete'];

export function OnboardingChat({ onComplete, isComplete }: OnboardingChatProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Collected data
  const [data, setData] = useState({
    sports: [] as Sport[],
    consistency: '',
    goal: '',
    raceDetails: '',
    availableDays: 0,
    hoursPerWeek: 0,
    hasInjury: false,
    injuryDetails: '',
    stravaConnected: false,
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Start with welcome
  useEffect(() => {
    if (messages.length === 0) {
      setTimeout(() => {
        addCoachMessage(
          "Welcome. I'm your AI training coach. Before we begin, I want to understand you — your background, your goals, and how you train. This helps me coach you properly, not just generate workouts.",
          undefined,
          () => {
            setTimeout(() => {
              addCoachMessage(
                "Let's start with the basics. Which sport or sports are you training for right now?",
                'sports'
              );
              setStep('sports');
            }, 800);
          }
        );
      }, 500);
    }
  }, []);

  const addCoachMessage = (content: string, component?: Message['component'], onComplete?: () => void) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'coach',
        content,
        component,
      }]);
      setIsTyping(false);
      onComplete?.();
    }, 600 + Math.random() * 400);
  };

  const addAthleteMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'athlete',
      content,
    }]);
  };

  const handleSportsSelect = (sports: Sport[]) => {
    setData(prev => ({ ...prev, sports }));
    const sportNames = sports.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' and ');
    addAthleteMessage(sportNames);
    
    setTimeout(() => {
      addCoachMessage(
        `${sportNames} — good. Understanding where you've been helps me plan where you're going.`,
        undefined,
        () => {
          setTimeout(() => {
            addCoachMessage(
              "How would you describe your recent training consistency?",
              'consistency'
            );
            setStep('consistency');
          }, 600);
        }
      );
    }, 300);
  };

  const handleConsistencySelect = (value: string) => {
    setData(prev => ({ ...prev, consistency: value }));
    addAthleteMessage(value);

    setTimeout(() => {
      const response = value.includes('Just getting') 
        ? "Starting fresh gives us a clean slate to build on."
        : value.includes('occasionally')
        ? "Occasional training means we'll focus on building consistency first."
        : value.includes('consistently')
        ? "Consistent training is a great foundation. We can build intensity gradually."
        : "Structured training means you're ready for focused, progressive work.";

      addCoachMessage(response, undefined, () => {
        setTimeout(() => {
          addCoachMessage(
            "Goals shape everything — the structure, the intensity, the timeline. What are you primarily training for right now?",
            'goals'
          );
          setStep('goals');
        }, 600);
      });
    }, 300);
  };

  const handleGoalSelect = (value: string) => {
    setData(prev => ({ ...prev, goal: value }));
    addAthleteMessage(value);

    setTimeout(() => {
      if (value.includes('race') || value.includes('event')) {
        addCoachMessage(
          "Do you have a target event or date in mind? If so, tell me about it.",
          'text-input'
        );
        setStep('race-details');
        setShowTextInput(true);
      } else {
        proceedToAvailability(value);
      }
    }, 300);
  };

  const proceedToAvailability = (goalContext?: string) => {
    const response = goalContext?.includes('Returning')
      ? "Coming back takes patience. We'll build carefully."
      : goalContext?.includes('Maintaining')
      ? "Maintenance is underrated. We'll keep you sharp without overreaching."
      : "Performance gains come from consistency and smart load management.";

    addCoachMessage(response, undefined, () => {
      setTimeout(() => {
        addCoachMessage(
          "Let's talk about time. On a typical week, how many days can you realistically train?",
          'availability'
        );
        setStep('availability');
      }, 600);
    });
  };

  const handleRaceDetails = () => {
    if (!textInput.trim()) return;
    setData(prev => ({ ...prev, raceDetails: textInput }));
    addAthleteMessage(textInput);
    setTextInput('');
    setShowTextInput(false);

    setTimeout(() => {
      addCoachMessage(
        "Noted. I'll structure your training to peak at the right time.",
        undefined,
        () => {
          setTimeout(() => {
            addCoachMessage(
              "On a typical week, how many days can you realistically train?",
              'availability'
            );
            setStep('availability');
          }, 600);
        }
      );
    }, 300);
  };

  const handleAvailabilitySelect = (days: number) => {
    setData(prev => ({ ...prev, availableDays: days }));
    addAthleteMessage(`${days} days per week`);

    setTimeout(() => {
      addCoachMessage(
        `${days} days gives us good structure to work with. Roughly how many hours per week feels realistic?`,
        'hours'
      );
      setStep('hours');
    }, 300);
  };

  const handleHoursSelect = (hours: number) => {
    setData(prev => ({ ...prev, hoursPerWeek: hours }));
    addAthleteMessage(`About ${hours} hours`);

    setTimeout(() => {
      addCoachMessage(
        "Last question before we connect your data. Any injuries or physical limitations I should know about?",
        'injuries'
      );
      setStep('injuries');
    }, 300);
  };

  const handleInjurySelect = (hasInjury: boolean) => {
    setData(prev => ({ ...prev, hasInjury }));
    addAthleteMessage(hasInjury ? 'Yes' : 'No');

    if (hasInjury) {
      setTimeout(() => {
        addCoachMessage(
          "Tell me what I should account for — even if it feels minor.",
          'text-input'
        );
        setStep('injury-details');
        setShowTextInput(true);
      }, 300);
    } else {
      proceedToStrava();
    }
  };

  const handleInjuryDetails = () => {
    if (!textInput.trim()) return;
    setData(prev => ({ ...prev, injuryDetails: textInput }));
    addAthleteMessage(textInput);
    setTextInput('');
    setShowTextInput(false);
    
    setTimeout(() => {
      addCoachMessage(
        "I'll factor that into your training. We'll work around it intelligently.",
        undefined,
        () => proceedToStrava()
      );
    }, 300);
  };

  const proceedToStrava = () => {
    setTimeout(() => {
      addCoachMessage(
        "If you connect Strava, I can review your recent training history and coach you much more accurately. This is optional, but strongly recommended.",
        'strava'
      );
      setStep('strava');
    }, 600);
  };

  const handleStravaConnect = () => {
    setData(prev => ({ ...prev, stravaConnected: true }));
    addAthleteMessage('Connected Strava');

    setTimeout(() => {
      addCoachMessage("Analyzing your training history...");
      setStep('analyzing');

      setTimeout(() => {
        addCoachMessage(
          "I'm seeing consistent aerobic work over the past 6 weeks with limited high-intensity sessions. Your volume has been steady. I'll build around that foundation.",
          'summary'
        );
        setStep('summary');
      }, 2000);
    }, 300);
  };

  const handleStravaSkip = () => {
    addAthleteMessage('Skip for now');

    setTimeout(() => {
      addCoachMessage(
        "No problem. I'll work with what you've told me and take a conservative approach until I learn more from your training.",
        'summary'
      );
      setStep('summary');
    }, 300);
  };

  const handleComplete = () => {
    // Save profile
    const profile: AthleteProfile = {
      id: '1',
      name: '',
      sports: data.sports,
      trainingAge: 1,
      weeklyAvailability: {
        days: data.availableDays,
        hoursPerWeek: data.hoursPerWeek,
      },
      goals: [data.goal],
      stravaConnected: data.stravaConnected,
      onboardingComplete: true,
    };
    saveProfile(profile);

    addAthleteMessage('Ready to start');

    setTimeout(() => {
      addCoachMessage(
        "That's everything I need. I'll put together your first week now. Let's get to work."
      );
      setStep('complete');
      setTimeout(onComplete, 1000);
    }, 300);
  };

  const getCurrentStepNumber = () => {
    const coreSteps = ['sports', 'consistency', 'goals', 'availability', 'injuries', 'strava'];
    const currentIndex = coreSteps.indexOf(step);
    if (currentIndex === -1) return null;
    return { current: currentIndex + 1, total: 6 };
  };

  const stepInfo = getCurrentStepNumber();

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6">
      {/* Progress indicator */}
      {stepInfo && !isComplete && (
        <div className="text-center mb-6">
          <span className="text-xs text-muted-foreground">
            Step {stepInfo.current} of {stepInfo.total}
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.map((message) => (
          <div key={message.id} className="animate-fade-up">
            <MessageBubble message={message} />
            
            {/* Render interactive components */}
            {message.component === 'sports' && step === 'sports' && (
              <OnboardingOptionChips
                options={[
                  { id: 'running', label: 'Running' },
                  { id: 'cycling', label: 'Cycling' },
                  { id: 'swimming', label: 'Swimming' },
                  { id: 'triathlon', label: 'Triathlon' },
                ]}
                multiSelect
                onSelect={(selected) => handleSportsSelect(selected as Sport[])}
              />
            )}

            {message.component === 'consistency' && step === 'consistency' && (
              <OnboardingOptionChips
                options={[
                  { id: 'starting', label: 'Just getting started' },
                  { id: 'occasional', label: 'Training occasionally' },
                  { id: 'consistent', label: 'Training consistently' },
                  { id: 'structured', label: 'Structured / competitive' },
                ]}
                onSelect={(selected) => handleConsistencySelect(selected[0])}
              />
            )}

            {message.component === 'goals' && step === 'goals' && (
              <OnboardingOptionChips
                options={[
                  { id: 'race', label: 'A specific race or event' },
                  { id: 'performance', label: 'Improving performance' },
                  { id: 'returning', label: 'Returning after a break' },
                  { id: 'maintaining', label: 'Maintaining fitness' },
                ]}
                onSelect={(selected) => handleGoalSelect(selected[0])}
              />
            )}

            {message.component === 'availability' && step === 'availability' && (
              <OnboardingOptionChips
                options={[3, 4, 5, 6, 7].map(n => ({ id: String(n), label: `${n} days` }))}
                onSelect={(selected) => handleAvailabilitySelect(Number(selected[0]))}
              />
            )}

            {message.component === 'hours' && step === 'hours' && (
              <OnboardingOptionChips
                options={[5, 8, 10, 12, 15, 20].map(n => ({ id: String(n), label: `${n} hours` }))}
                onSelect={(selected) => handleHoursSelect(Number(selected[0]))}
              />
            )}

            {message.component === 'injuries' && step === 'injuries' && (
              <OnboardingOptionChips
                options={[
                  { id: 'yes', label: 'Yes' },
                  { id: 'no', label: 'No' },
                ]}
                onSelect={(selected) => handleInjurySelect(selected[0] === 'yes')}
              />
            )}

            {message.component === 'strava' && step === 'strava' && (
              <StravaConnectCard
                onConnect={handleStravaConnect}
                onSkip={handleStravaSkip}
              />
            )}

            {message.component === 'summary' && step === 'summary' && (
              <CoachSummaryCard
                data={data}
                onContinue={handleComplete}
              />
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3 animate-fade-up">
            <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-accent" />
            </div>
            <div className="bg-muted/50 rounded-2xl rounded-tl-sm px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {isComplete && (
          <div className="flex flex-col items-center justify-center py-8 animate-fade-up">
            <CheckCircle2 className="h-12 w-12 text-load-fresh mb-3" />
            <p className="text-foreground font-medium">Setting up your training...</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Text input for free-form responses */}
      {showTextInput && !isComplete && (
        <div className="flex gap-2 pt-2 border-t border-border">
          <Input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (step === 'race-details') handleRaceDetails();
                if (step === 'injury-details') handleInjuryDetails();
              }
            }}
            placeholder="Type your response..."
            className="flex-1"
          />
          <Button
            onClick={() => {
              if (step === 'race-details') handleRaceDetails();
              if (step === 'injury-details') handleInjuryDetails();
            }}
            disabled={!textInput.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isCoach = message.role === 'coach';

  return (
    <div className={cn('flex gap-3', !isCoach && 'flex-row-reverse')}>
      <div className={cn(
        'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
        isCoach ? 'bg-accent/10' : 'bg-muted'
      )}>
        {isCoach ? (
          <Bot className="h-4 w-4 text-accent" />
        ) : (
          <User className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-3',
        isCoach 
          ? 'bg-muted/50 rounded-tl-sm text-foreground' 
          : 'bg-accent text-accent-foreground rounded-tr-sm'
      )}>
        <p className="text-sm leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}
