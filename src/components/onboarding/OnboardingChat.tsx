import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Brain, User, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OnboardingOptionChips } from './OnboardingOptionChips';
import { StravaConnectCard } from './StravaConnectCard';
import { CoachSummaryCard } from './CoachSummaryCard';
import { completeOnboarding } from '@/lib/api';
import { auth } from '@/lib/auth';
import { saveProfile, saveOnboardingAdditionalData, saveOnboardingPlans, saveSeasonPlan } from '@/lib/storage';
import { toast } from '@/hooks/use-toast';
import type { AthleteProfile, Sport } from '@/types';

export interface AthleteOnboardingProfile {
  sports: Sport[];
  consistency: string;
  goal: string;
  raceDetails: string;
  raceGoalTime: string;
  availableDays: number;
  hoursPerWeek: number;
  hasInjury: boolean;
  injuryDetails: string;
  stravaConnected: boolean;
  targetEvent?: {
    name?: string;
    date?: string;
  };
}

interface OnboardingChatProps {
  onComplete: (profile: AthleteOnboardingProfile) => Promise<void>;
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
    raceGoalTime: '',
    availableDays: 0,
    hoursPerWeek: 0,
    hasInjury: false,
    injuryDetails: '',
    stravaConnected: auth.isLoggedIn(), // Check if token exists (from OAuth callback)
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Check if user authenticated (token from OAuth callback)
  useEffect(() => {
    if (auth.isLoggedIn() && !data.stravaConnected && step === 'strava') {
      // User came back from OAuth with a token
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
    }
  }, [auth.isLoggedIn(), step, data.stravaConnected]);

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

  const handleConsistencySelect = (id: string) => {
    // Map id to label for display
    const labelMap: Record<string, string> = {
      'starting': 'Just getting started',
      'occasional': 'Training occasionally',
      'consistent': 'Training consistently',
      'structured': 'Structured / competitive',
    };
    const label = labelMap[id] || id;
    setData(prev => ({ ...prev, consistency: label }));
    addAthleteMessage(label);

    setTimeout(() => {
      const response = id === 'starting'
        ? "Starting fresh gives us a clean slate to build on."
        : id === 'occasional'
        ? "Occasional training means we'll focus on building consistency first."
        : id === 'consistent'
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

  const handleGoalSelect = (id: string) => {
    // Map id to label for display
    const labelMap: Record<string, string> = {
      'race': 'A specific race or event',
      'performance': 'Improving performance',
      'returning': 'Returning after a break',
      'maintaining': 'Maintaining fitness',
    };
    const label = labelMap[id] || id;
    setData(prev => ({ ...prev, goal: label }));
    addAthleteMessage(label);

    setTimeout(() => {
      if (id === 'race') {
        addCoachMessage(
          "Do you have a target event or date in mind? If so, tell me about it, including your goals.",
          'text-input'
        );
        setStep('race-details');
        setShowTextInput(true);
      } else {
        proceedToAvailability(label);
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
    const input = textInput.trim();
    
    // Try to extract goal time from the input (look for patterns like "2:25", "sub-3:00", "3:30:00", "2:25 goal time", etc.)
    const goalTimePatterns = [
      /(\d{1,2}:\d{2}(?::\d{2})?)\s*(?:goal\s*time|target|goal)/i,
      /(?:goal\s*time|target|goal)[\s:]+(\d{1,2}:\d{2}(?::\d{2})?)/i,
      /(?:targeting|aiming for|goal of)[\s:]+(\d{1,2}:\d{2}(?::\d{2})?)/i,
      /(sub-)?(\d{1,2}:\d{2}(?::\d{2})?)/i,
    ];
    
    let goalTime = '';
    for (const pattern of goalTimePatterns) {
      const match = input.match(pattern);
      if (match) {
        goalTime = match[1] || match[2] || '';
        if (match[0].includes('sub-')) {
          goalTime = `sub-${goalTime}`;
        }
        break;
      }
    }
    
    setData(prev => ({ 
      ...prev, 
      raceDetails: input,
      raceGoalTime: goalTime 
    }));
    addAthleteMessage(input);
    setTextInput('');
    setShowTextInput(false);

    setTimeout(() => {
      const response = goalTime
        ? `Noted. I'll structure your training to peak at the right time and help you hit that ${goalTime} target.`
        : "Noted. I'll structure your training to peak at the right time.";
      
      addCoachMessage(
        response,
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
    // Save injury details even if empty (user might skip, but we still save the state)
    const details = textInput.trim();
    setData(prev => ({ ...prev, injuryDetails: details }));
    
    if (details) {
      addAthleteMessage(details);
    } else {
      // If user didn't enter details, still acknowledge and proceed
      addAthleteMessage('No specific details');
    }
    
    setTextInput('');
    setShowTextInput(false);
    
    setTimeout(() => {
      if (details) {
      addCoachMessage(
        "I'll factor that into your training. We'll work around it intelligently.",
        undefined,
        () => proceedToStrava()
      );
      } else {
        addCoachMessage(
          "Got it. I'll take a conservative approach with your training.",
          undefined,
          () => proceedToStrava()
        );
      }
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

  const handleComplete = async () => {
    addAthleteMessage('Ready to start');

    // Check if user is authenticated - backend submission requires authentication
    const isAuthenticated = auth.isLoggedIn();

    if (!isAuthenticated) {
      // User must be authenticated to complete onboarding
      addCoachMessage(
        "You need to be logged in to complete onboarding. Please log in first."
      );
      toast({
        title: 'Authentication Required',
        description: 'Please log in to complete onboarding.',
        variant: 'destructive',
      });
      return;
    }

    // Parse race details if provided
    let targetEvent: AthleteProfile['targetEvent'] | undefined;
    if (data.raceDetails) {
      // Try to extract date and event name from race details
      const dateMatch = data.raceDetails.match(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}|\d{1,2}-\d{1,2}-\d{4}/);
      const eventName = data.raceDetails.split(/[,\n]/)[0].trim();
      
      targetEvent = {
        name: eventName || 'Target Event',
        date: dateMatch ? dateMatch[0] : '',
      };
    }

    // Save all onboarding data locally (for UI purposes only)
    const profile: AthleteProfile = {
      id: 'local',
      name: '',
      sports: data.sports,
      trainingAge: 1,
      weeklyAvailability: {
        daysPerWeek: data.availableDays,
        hoursPerWeek: data.hoursPerWeek,
      },
      goals: data.goal ? [data.goal] : [],
      targetEvent,
      stravaConnected: data.stravaConnected,
      onboardingComplete: false, // CRITICAL: Don't mark as complete until backend confirms
    };
    saveProfile(profile);

    // Save additional onboarding data to local storage (not in profile schema)
    const onboardingData = {
      consistency: data.consistency,
      raceDetails: data.raceDetails,
      injuryDetails: data.injuryDetails,
      collectedAt: new Date().toISOString(),
    };
    saveOnboardingAdditionalData(onboardingData);

    try {
      // Use the onboarding endpoint to save all data and optionally generate plans
      const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      const availableDays = weekDays.slice(0, data.availableDays);
      
      // Map goal to training focus
      const trainingFocus = data.goal.toLowerCase().includes('race') ? 'race_focused' : 'general_fitness';

      // Prepare profile data for backend (map to backend format - snake_case)
      // Note: primary_sports goes in training_preferences, not profile
      const profileData: Record<string, unknown> = {};
      
      // Store goal as free text verbatim (no parsing/normalization)
      if (data.goal) {
        profileData.goals = [data.goal];
      }
      
      // Send race info as raw user input with source marker
      if (targetEvent || data.raceDetails) {
        if (targetEvent) {
          profileData.target_event = targetEvent;
        }
        
        // Send race_input with source marker for backend LLM processing
        profileData.race_input = {
          event_name: targetEvent?.name || '',
          event_date: targetEvent?.date || '',
          details: data.raceDetails || '',
          source: 'user' as const,
        };
      }
      // strava_connected is set automatically by backend based on connection status

      // Send ALL fields on save (not deltas)
      // Complete onboarding using the dedicated endpoint
      const result = await completeOnboarding({
        profile: profileData as Partial<AthleteProfile>,
        training_preferences: {
          years_of_training: 1, // Default, can be updated later
          primary_sports: data.sports,
          available_days: availableDays,
          weekly_hours: data.hoursPerWeek,
          training_focus: trainingFocus,
          injury_history: data.hasInjury,
          injury_notes: data.hasInjury && data.injuryDetails ? data.injuryDetails : null,
          consistency: data.consistency || null,
          goal: data.goal || null, // Free text, stored verbatim
        },
        generate_initial_plan: data.stravaConnected, // Only generate plan if Strava is connected
      });

      // Handle onboarding response - only proceed if backend confirms success
      if (result.status === 'ok') {
        // Store plans in local storage
        saveOnboardingPlans({
          weekly_intent: result.weekly_intent,
          season_plan: result.season_plan,
          provisional: result.provisional,
          warning: result.warning,
          savedAt: new Date().toISOString(),
        });

        // Store season plan separately for easy access
        if (result.season_plan) {
          saveSeasonPlan(result.season_plan);
        }

        // Plans were generated
        if (result.weekly_intent || result.season_plan) {
          if (result.provisional) {
            addCoachMessage(
              "That's everything I need. I've created your initial training plan. Note: This plan is provisional and will improve as I learn more from your training data."
            );
            // Show toast notification for provisional plan
            toast({
              title: 'Provisional Plan Created',
              description: 'Your plan is provisional. More training data will improve recommendations.',
              variant: 'default',
            });
          } else {
            addCoachMessage(
              "That's everything I need. I've created your initial training plan. Let's get to work!"
            );
            toast({
              title: 'Training Plan Created',
              description: 'Your personalized training plan is ready!',
            });
          }
        } else {
          // No plans generated (likely not enough data or Strava not connected)
          if (data.stravaConnected) {
            addCoachMessage(
              "That's everything I need. I'll put together your first week once I have more training data. Let's get started!"
            );
          } else {
            addCoachMessage(
              "That's everything I need. Connect Strava to get personalized training plans. For now, let's get started!"
            );
          }
        }

        // Show warning if present
        if (result.warning) {
          console.warn('Onboarding warning:', result.warning);
          toast({
            title: 'Onboarding Warning',
            description: result.warning === 'plan_generation_failed' 
              ? 'Onboarding completed, but plan generation failed. Plans will be available once you have more training data.'
              : result.warning,
            variant: 'default',
          });
        }

        // CRITICAL: Only call onComplete on successful backend confirmation
        // Build profile object to pass to parent
        const onboardingProfile: AthleteOnboardingProfile = {
          sports: data.sports,
          consistency: data.consistency,
          goal: data.goal,
          raceDetails: data.raceDetails,
          raceGoalTime: data.raceGoalTime,
          availableDays: data.availableDays,
          hoursPerWeek: data.hoursPerWeek,
          hasInjury: data.hasInjury,
          injuryDetails: data.injuryDetails,
          stravaConnected: data.stravaConnected,
          targetEvent,
        };

        setStep('complete');
        // Wait a moment for UI to update, then call onComplete with profile data
        setTimeout(async () => {
          try {
            await onComplete(onboardingProfile);
          } catch (error) {
            console.error('[OnboardingChat] Error in onComplete callback:', error);
            // If parent's onComplete fails, show error but don't revert step
            toast({
              title: 'Error',
              description: 'Failed to complete onboarding. Please try refreshing the page.',
              variant: 'destructive',
            });
          }
        }, 1000);
      } else {
        // Backend returned non-ok status
        throw new Error('Backend returned non-ok status');
      }
    } catch (error) {
      console.error('Failed to save onboarding data:', error);
      
      // Extract error message for user feedback
      let errorMessage = 'Failed to complete onboarding. Please try again.';
      if (error && typeof error === 'object') {
        const apiError = error as { message?: string; status?: number; response?: { data?: { detail?: string } } };
        if (apiError.response?.data?.detail) {
          errorMessage = apiError.response.data.detail;
        } else if (apiError.message) {
          errorMessage = apiError.message;
        } else if (apiError.status === 400) {
          errorMessage = 'Invalid onboarding data. Please check your inputs.';
        } else if (apiError.status === 401) {
          errorMessage = 'Authentication required. Please log in again.';
        } else if (apiError.status === 422) {
          errorMessage = 'Validation error. Please check your inputs.';
        } else if (apiError.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
      }

      // Show validation error to user
      addCoachMessage(
        `I encountered an error while saving your data: ${errorMessage}. Please check your inputs and try again.`
      );
      toast({
        title: 'Onboarding Error',
        description: errorMessage,
        variant: 'destructive',
      });
      
      // CRITICAL: Don't redirect on error - stay on onboarding page
      // Don't call onComplete on error - backend hasn't confirmed completion
    }
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
            <div className="w-9 h-9 rounded-full bg-coach text-coach-foreground flex items-center justify-center shrink-0">
              <Brain className="h-4 w-4" />
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
            disabled={step === 'race-details' && !textInput.trim()}
            className="bg-[#2F4F4F] hover:bg-[#2F4F4F]/90 text-white"
            // Allow proceeding with injury details even if empty (user can skip details)
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
        isCoach ? 'bg-coach text-coach-foreground' : 'bg-muted'
      )}>
        {isCoach ? (
          <Brain className="h-4 w-4" />
        ) : (
          <User className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className={cn(
        'max-w-[80%] rounded-2xl px-4 py-3',
        isCoach 
          ? 'bg-[#2F4F4F]/10 rounded-tl-sm text-foreground' 
          : 'bg-accent text-accent-foreground rounded-tr-sm'
      )}>
        <p className="text-sm leading-relaxed">{message.content}</p>
      </div>
    </div>
  );
}
