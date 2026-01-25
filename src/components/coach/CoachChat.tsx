import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Brain, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sendCoachChat, type PlanItem } from '@/lib/api';
import { generateCoachGreeting } from '@/lib/coachGreeting';
import { CoachProgressPanel } from './CoachProgressPanel';
import { PlanList } from './PlanList';
import { CoachProgressList } from './CoachProgressList';
import { RunnerProcessingIndicator } from './RunnerProcessingIndicator';
import { usePlanningProgressStore } from '@/store/planningProgressStore';
import { PlanningProgressPanel } from '@/components/planning/PlanningProgressPanel';
import { useQueryClient } from '@tanstack/react-query';
import { fetchConversationMessages, type ConversationMessage } from '@/lib/api/coach';

type CoachMode = 'idle' | 'awaiting_intent' | 'planning' | 'executing' | 'done';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'progress' | 'final';
  role: 'coach' | 'athlete';
  content: string;
  timestamp: Date;
  progress_stage?: string;
  stage?: string; // Backend stage field (STRUCTURE, WEEKS, WEEK_DETAIL, INSTRUCTIONS, DONE)
  show_plan?: boolean;
  plan_items?: PlanItem[];
  response_type?: 'plan' | 'weekly_plan' | 'season_plan' | 'session_plan' | 'recommendation' | 'summary' | 'greeting' | 'question' | 'explanation' | 'smalltalk';
  transient?: boolean;
  message_type?: 'assistant' | 'progress' | 'final';
  metadata?: {
    week_number?: number | string;
    total_weeks?: number | string;
    [key: string]: unknown;
  };
}

/**
 * Detects if the last user message has plan intent
 */
const hasPlanIntent = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  return (
    lowerMessage.includes('plan') ||
    lowerMessage.includes('week') ||
    lowerMessage.includes('training') ||
    lowerMessage.includes('schedule') ||
    lowerMessage.includes('workout') ||
    lowerMessage.includes('generate') ||
    lowerMessage.includes('create')
  );
};

interface CoachNavigationState {
  context?: 'modify_today_session';
  session_id?: string | null;
  suggested_action?: 'generic' | 'skip' | 'reduce_volume' | 'convert_to_recovery';
  draft_message?: string;
}

export function CoachChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<CoachMode>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [hasEditedDraft, setHasEditedDraft] = useState(false);
  const [draftContext, setDraftContext] = useState<CoachNavigationState | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isSendingRef = useRef<boolean>(false);
  const finalPlanRef = useRef<Message | null>(null);
  const resetProgress = usePlanningProgressStore((state) => state.reset);
  const queryClient = useQueryClient();
  const [progressStages, setProgressStages] = useState<Array<{
    id: string;
    label: string;
    status: 'completed' | 'in_progress' | 'pending';
  }>>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle navigation state with draft message
  useEffect(() => {
    const state = location.state as CoachNavigationState | null;
    if (state?.context === 'modify_today_session' && state.draft_message) {
      setDraftContext(state);
      setInput(state.draft_message);
      setHasEditedDraft(false);
      // Clear location state to prevent re-applying on re-renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, navigate, location.pathname]);

  // Set initial greeting on mount - only once when idle and no messages
  useEffect(() => {
    if (messages.length === 0) {
      const greeting = generateCoachGreeting(null);
      setMessages([
        {
          id: '1',
          type: 'assistant',
          role: 'coach',
          content: greeting,
          timestamp: new Date(),
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  /**
   * Converts backend ConversationMessage to frontend Message format
   */
  const convertBackendMessage = (msg: ConversationMessage): Message => {
    return {
      id: msg.id,
      type: msg.message_type === 'final' ? 'final' : msg.message_type === 'progress' ? 'progress' : 'assistant',
      role: msg.role === 'user' ? 'athlete' : 'coach',
      content: msg.content,
      timestamp: new Date(msg.created_at),
      stage: msg.stage,
      progress_stage: msg.stage, // Keep for backward compatibility
      transient: msg.transient === true,
      show_plan: msg.show_plan === true,
      plan_items: msg.plan_items,
      message_type: msg.message_type,
      metadata: msg.metadata,
    };
  };

  /**
   * Replaces transient messages by stage - same stage overwrites previous message
   */
  const replaceTransientByStage = (newMessage: Message, currentMessages: Message[]): Message[] => {
    if (!newMessage.transient || !newMessage.stage) {
      // Non-transient or no stage - just append
      return [...currentMessages, newMessage];
    }

    // Find and replace message with same stage
    const updated = [...currentMessages];
    const existingIndex = updated.findIndex(
      msg => msg.transient === true && msg.stage === newMessage.stage
    );

    if (existingIndex >= 0) {
      updated[existingIndex] = newMessage;
    } else {
      updated.push(newMessage);
    }

    return updated;
  };

  // Poll for conversation messages while in executing mode
  useEffect(() => {
    if (!conversationId) return;
    if (mode !== 'executing') return;
    
    // Check if we have a final message - stop polling
    const hasFinalMessage = messages.some(msg => msg.message_type === 'final');
    if (hasFinalMessage) return;
    
    // Poll while executing - backend may be emitting transient progress messages
    
    let pollCount = 0;
    const maxPolls = 60; // Poll for max 2 minutes (60 * 2s)
    
    // Poll every 1-2 seconds for messages
    const intervalId = setInterval(async () => {
      pollCount++;
      
      if (pollCount > maxPolls) {
        clearInterval(intervalId);
        return;
      }
      
      try {
        const backendMessages = await fetchConversationMessages(conversationId);
        
        // Convert and merge messages
        setMessages(prev => {
          // Process all backend messages
          let updated = [...prev];
          
          for (const backendMsg of backendMessages) {
            const frontendMsg = convertBackendMessage(backendMsg);
            
            // Check if we already have this exact message by ID
            const existingIndexById = updated.findIndex(m => m.id === frontendMsg.id);
            
            if (existingIndexById >= 0) {
              // Update existing message (backend may have updated it)
              updated[existingIndexById] = frontendMsg;
            } else if (frontendMsg.transient && frontendMsg.stage) {
              // Transient message with stage - replace by stage
              updated = replaceTransientByStage(frontendMsg, updated);
            } else {
              // New non-transient message - append
              updated.push(frontendMsg);
            }
          }
          
          return updated;
        });
        
        // Check if we got a final message - stop polling
        const finalMsg = backendMessages.find(msg => msg.message_type === 'final');
        if (finalMsg) {
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error('[CoachChat] Failed to poll for messages:', error);
        // Continue polling on error, but stop after max attempts
        if (pollCount >= maxPolls) {
          clearInterval(intervalId);
        }
      }
    }, 2000); // Poll every 2 seconds
    
    return () => {
      clearInterval(intervalId);
    };
  }, [conversationId, messages, mode]);

  const sendMessage = async () => {
    // F02: Prevent duplicate sends with send lock
    if (isSendingRef.current) return;
    if (!input.trim()) return;

    // TODO 6: Reset state when starting new conversation from done mode
    if (mode === 'done') {
      setConversationId(null);
      finalPlanRef.current = null;
    }

    const messageText = input.trim();
    const messageId = crypto.randomUUID();

    // F06: Clear input immediately after send starts
    setInput('');
    
    // Clear draft context when message is sent
    if (draftContext) {
      setDraftContext(null);
      setHasEditedDraft(false);
    }
    
    // F02: Set send lock immediately
    isSendingRef.current = true;
    setIsTyping(true);

    // F08: Log once per chat turn
    console.info("Sending coach message", {
      length: messageText.length,
      messageId
    });

    const userMessage: Message = {
      id: messageId,
      type: 'user',
      role: 'athlete',
      content: messageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Detect plan intent from last user message
    // Only allow transitions: idle -> planning, or done -> idle (new conversation)
    if (hasPlanIntent(messageText)) {
      if (mode === 'idle' || mode === 'done') {
        // Transition to planning mode - do NOT generate plan yet
        // Reset planning progress for new planning intent
        resetProgress();
        setProgressStages([]); // Clear progress stages for new planning session
        setMode('planning');
      }
      // If already in planning/executing, stay in current state
    } else {
      // Non-plan message - reset to idle only if we're not actively executing
      if (mode !== 'executing') {
        setMode('idle');
      }
    }

    try {
      const response = await sendCoachChat(messageText, { message_id: messageId });
      
      // F05: Only process successful responses (200 OK)
      // No retry/resend logic should trigger on success
      
      // Track conversation ID from response if provided
      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }
      
      // Navigate to WorkoutDetails if planner returned a workout_id
      if (response.workout_id) {
        navigate(`/workout/${response.workout_id}`);
        return; // Exit early to prevent further message processing
      }
      
      // Handle progress messages (transient)
      if (response.message_type === 'progress') {
        // If backend sends progress_stages array, use it
        if (response.progress_stages && response.progress_stages.length > 0) {
          setProgressStages(response.progress_stages);
        }
        
        // Handle transient progress message with stage
        if (response.progress_stage) {
          const progressMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'progress',
            role: 'coach',
            content: response.reply || response.progress_stage,
            timestamp: new Date(),
            progress_stage: response.progress_stage,
            stage: response.progress_stage, // Use stage for replace-by-stage logic
            transient: true,
            message_type: 'progress',
          };
          
          // Use replace-by-stage logic for consistency
          setMessages(prev => replaceTransientByStage(progressMessage, prev));
        }
      } else if (response.message_type === 'final') {
        // FE3: Collapse progress on final message - remove all transient progress messages
        setMessages(prev => {
          const filtered = prev.filter(msg => !(msg.type === 'progress' && msg.transient));
          const finalMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'final',
            role: 'coach',
            content: response.reply || 'Here\'s your plan',
            timestamp: new Date(),
            show_plan: response.show_plan === true,
            plan_items: response.show_plan === true && response.plan_items && response.plan_items.length > 0 ? response.plan_items : undefined,
            response_type: response.response_type,
            message_type: 'final',
          };
          // Clear progress stages when final message arrives
          setProgressStages([]);
          return [...filtered, finalMessage];
        });
      } else {
        // Regular assistant message
        const coachMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          role: 'coach',
          content: response.reply || 'I understand. Let me think about that.',
          timestamp: new Date(),
          show_plan: response.show_plan === true,
          plan_items: response.show_plan === true && response.plan_items && response.plan_items.length > 0 ? response.plan_items : undefined,
          response_type: response.response_type,
          message_type: response.message_type,
        };
        setMessages(prev => [...prev, coachMessage]);
      }
      
      // FE-2: Don't transition to done here - wait for progress completion callback
      // The progress panel will call handleProgressComplete when all steps are done
      // This ensures users see the full progress before the chat concludes
    } catch (error) {
      const apiError = error as { message?: string; status?: number };
      const errorContent = apiError.message || 'Sorry, I encountered an error. Please try again.';
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        role: 'coach',
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      // Reset to idle on error
      setMode('idle');
    } finally {
      setIsTyping(false);
      // F02: Release send lock
      isSendingRef.current = false;
    }
  };

  const handleConfirmPlan = async () => {
    // F02: Prevent duplicate sends with send lock
    if (isSendingRef.current) return;
    
    // Only allow transition from planning to executing
    if (mode !== 'planning') {
      return;
    }

    const messageText = 'Yes, generate the weekly plan';
    const messageId = crypto.randomUUID();

    // F02: Set send lock immediately
    isSendingRef.current = true;
    
    // Add confirm message first
    const confirmMessage: Message = {
      id: messageId,
      type: 'user',
      role: 'athlete',
      content: messageText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, confirmMessage]);

    // Send confirmation message to backend to trigger plan generation
    setMode('executing');
    setIsTyping(true);

    // F08: Log once per chat turn
    console.info("Sending coach message", {
      length: messageText.length,
      messageId
    });

    try {
      // F04: Send raw message only - backend extracts slots
      // F07: Include message_id for idempotency
      const response = await sendCoachChat(messageText, { message_id: messageId });
      
      // F05: Only process successful responses (200 OK)
      // No retry/resend logic should trigger on success
      
      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }
      
      // Handle progress messages (transient)
      if (response.message_type === 'progress') {
        // If backend sends progress_stages array, use it
        if (response.progress_stages && response.progress_stages.length > 0) {
          setProgressStages(response.progress_stages);
        }
        
        // Handle transient progress message with stage
        if (response.progress_stage) {
          const progressMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: 'progress',
            role: 'coach',
            content: response.reply || response.progress_stage,
            timestamp: new Date(),
            progress_stage: response.progress_stage,
            stage: response.progress_stage, // Use stage for replace-by-stage logic
            transient: true,
            message_type: 'progress',
          };
          
          // Use replace-by-stage logic for consistency
          setMessages(prev => replaceTransientByStage(progressMessage, prev));
        }
      } else if (response.message_type === 'final') {
        // TODO 2: Store final plan in ref and persist in messages WITHOUT ending execution
        const finalMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'final',
          role: 'coach',
          content: response.reply || "Here's your plan",
          timestamp: new Date(),
          show_plan: response.show_plan === true,
          plan_items: response.show_plan === true && response.plan_items && response.plan_items.length > 0 ? response.plan_items : undefined,
          response_type: response.response_type,
          message_type: 'final',
        };

        // Store in ref for later use in handleProgressComplete
        finalPlanRef.current = finalMessage;

        // FE3: Collapse progress on final message - remove all transient progress messages
        setMessages(prev => {
          const filtered = prev.filter(msg => !(msg.type === 'progress' && msg.transient));
          return [...filtered, finalMessage];
        });
        // FE-2: Don't transition to done here - wait for progress completion callback
        // The progress panel will call handleProgressComplete when all steps are done
      } else {
        // Regular assistant message
        const coachResponse: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          role: 'coach',
          content: response.reply || 'Generating your plan...',
          timestamp: new Date(),
          show_plan: response.show_plan === true,
          plan_items: response.show_plan === true && response.plan_items && response.plan_items.length > 0 ? response.plan_items : undefined,
          response_type: response.response_type,
          message_type: response.message_type,
        };
        setMessages(prev => [...prev, coachResponse]);
        
        // FE-2: Don't transition to done here - wait for progress completion callback
        // The progress panel will call handleProgressComplete when all steps are done
      }
    } catch (error) {
      const apiError = error as { message?: string; status?: number };
      const errorContent = apiError.message || 'Sorry, I encountered an error generating the plan. Please try again.';
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        role: 'coach',
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      // Reset to planning on error so user can try again
      setMode('planning');
    } finally {
      setIsTyping(false);
      // F02: Release send lock
      isSendingRef.current = false;
    }
  };

  const handleProgressComplete = () => {
    // TODO 3: Conclude ONLY in handleProgressComplete - single source of truth for completion
    if (mode !== 'executing') return;

    // Ensure final plan exists in the UI
    if (finalPlanRef.current) {
      const alreadyRendered = messages.some(
        m => m.id === finalPlanRef.current!.id
      );

      if (!alreadyRendered) {
        setMessages(prev => [...prev, finalPlanRef.current!]);
      }

      // FE-1: Store first session date for calendar navigation
      if (finalPlanRef.current.plan_items && finalPlanRef.current.plan_items.length > 0) {
        const firstSessionDate = finalPlanRef.current.plan_items
          .map(item => item.date ? new Date(item.date) : null)
          .filter((date): date is Date => date !== null)
          .sort((a, b) => a.getTime() - b.getTime())[0];

        if (firstSessionDate) {
          localStorage.setItem('calendarFocusDate', firstSessionDate.toISOString());
        }
      }
    }

    // F2: Force calendar refresh on completion
    queryClient.invalidateQueries({ queryKey: ['calendarWeek'] });
    queryClient.invalidateQueries({ queryKey: ['calendarToday'] });
    queryClient.invalidateQueries({ queryKey: ['calendarSeason'] });

    // Add explicit conclusion message
    setMessages(prev => [
      ...prev,
      {
        id: `concluded-${Date.now()}`,
        type: 'assistant',
        role: 'coach',
        content:
          '✅ Your training plan is complete and saved to your calendar. You can adjust it anytime or ask me to regenerate.',
        timestamp: new Date(),
      },
    ]);

    // 🔥 END EXECUTION
    setMode('done');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // F03: Prevent double submit - only handle Enter key, let form handle onSubmit if needed
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    // F03: Prevent default form submission and use our handler
    e.preventDefault();
    sendMessage();
  };

  return (
    <div className="flex-1 flex flex-col bg-muted/40 backdrop-blur-sm rounded-lg border border-border/50 overflow-hidden">
      {/* Draft Context Banner */}
      {draftContext?.context === 'modify_today_session' && (
        <div className="border-b border-yellow-500/30 bg-yellow-500/5 px-4 py-2">
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            Draft prepared for today's session
          </p>
        </div>
      )}
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Planning Progress Panel - shows real-time planning phase progress */}
        <PlanningProgressPanel />
        
        {/* FE2: Render progress messages as checklist */}
        {(() => {
          const progressMessages = messages.filter(msg => msg.type === 'progress');
          const hasFinalMessage = messages.some(msg => msg.type === 'final');
          
          // FE3: Hide progress when final message arrives, but still show transient messages
          if (hasFinalMessage) {
            // Filter out old progress messages, but keep transient messages that are still relevant
            return messages
              .filter(msg => {
                // Keep all non-progress messages
                if (msg.type !== 'progress') return true;
                // Keep transient messages (they're progress updates)
                if (msg.transient) return true;
                return false;
              })
              .map((message) => (
                <div key={message.id} className="space-y-2">
                  {message.transient ? (
                    // Transient message - distinct styling: spinner, muted, italic, no avatar
                    <div className="flex gap-3 animate-fade-up">
                      <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                      </div>
                      <div className="max-w-[75%] rounded-lg px-4 py-2.5 bg-muted/30 text-muted-foreground">
                        <p className="text-sm leading-relaxed italic">{message.content}</p>
                      </div>
                    </div>
                  ) : (
                    // Regular message
                    <>
                      <div
                        className={cn(
                          'flex gap-3 animate-fade-up',
                          message.role === 'athlete' && 'flex-row-reverse'
                        )}
                      >
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                            message.role === 'coach'
                              ? 'bg-coach text-coach-foreground'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {message.role === 'coach' ? (
                            <Brain className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </div>
                        <div
                          className={cn(
                            'max-w-[75%] rounded-lg px-4 py-2.5',
                            message.role === 'coach'
                              ? 'bg-[#2F4F4F]/10 text-foreground'
                              : 'bg-accent text-accent-foreground'
                          )}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                      {/* Plan List - rendered inline with coach message that produced it */}
                      {/* Fix 4: Never render plan for question (clarify); no process-step leak */}
                      {message.role === 'coach' &&
                        message.show_plan === true &&
                        message.plan_items &&
                        message.response_type !== 'question' &&
                        (!message.response_type ||
                          ['plan', 'weekly_plan', 'season_plan', 'session_plan', 'recommendation', 'summary'].includes(message.response_type)) && (
                          <div className={cn('flex gap-3')}>
                            <div className="w-8 shrink-0" />
                            <div className="max-w-[75%]">
                              <PlanList planItems={message.plan_items} />
                            </div>
                          </div>
                        )}
                    </>
                  )}
                </div>
              ));
          }
          
          // Build stages from progress_stages state (if backend sent it) or from progress messages
          let stages: Array<{ id: string; label: string; status: 'completed' | 'in_progress' | 'pending' }> = [];
          
          if (progressStages.length > 0) {
            // Use stages from backend if available
            stages = progressStages;
          } else {
            // Build stages from progress messages
            // Collect unique stages in order, mark last as in_progress, previous as completed
            const stageMap = new Map<string, { label: string; lastIndex: number }>();
            progressMessages.forEach((msg, index) => {
              const stageId = msg.progress_stage || `stage-${index}`;
              const label = msg.content || msg.progress_stage || 'Processing...';
              stageMap.set(stageId, { label, lastIndex: index });
            });
            
            const sortedStages = Array.from(stageMap.entries()).sort((a, b) => a[1].lastIndex - b[1].lastIndex);
            const lastStageIndex = progressMessages.length > 0 ? progressMessages.length - 1 : -1;
            
            sortedStages.forEach(([stageId, { label, lastIndex }]) => {
              if (lastIndex < lastStageIndex) {
                stages.push({ id: stageId, label, status: 'completed' });
              } else if (lastIndex === lastStageIndex) {
                stages.push({ id: stageId, label, status: 'in_progress' });
              } else {
                stages.push({ id: stageId, label, status: 'pending' });
              }
            });
          }
          
          // Render progress checklist and regular messages (including transient)
          // DO NOT filter out transient messages - they must be rendered
          const regularMessages = messages.filter(msg => msg.type !== 'progress' && msg.type !== 'final');
          
          return (
            <>
              {stages.length > 0 && <CoachProgressList stages={stages} />}
              {regularMessages.map((message) => (
                <div key={message.id} className="space-y-2">
                  {message.transient ? (
                    // Transient message - distinct styling: spinner, muted, italic, no avatar
                    <div className="flex gap-3 animate-fade-up">
                      <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
                      </div>
                      <div className="max-w-[75%] rounded-lg px-4 py-2.5 bg-muted/30 text-muted-foreground">
                        <p className="text-sm leading-relaxed italic">{message.content}</p>
                      </div>
                    </div>
                  ) : (
                    // Regular message
                    <>
                      <div
                        className={cn(
                          'flex gap-3 animate-fade-up',
                          message.role === 'athlete' && 'flex-row-reverse'
                        )}
                      >
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                            message.role === 'coach'
                              ? 'bg-coach text-coach-foreground'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {message.role === 'coach' ? (
                            <Brain className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </div>
                        <div
                          className={cn(
                            'max-w-[75%] rounded-lg px-4 py-2.5',
                            message.role === 'coach'
                              ? 'bg-[#2F4F4F]/10 text-foreground'
                              : 'bg-accent text-accent-foreground'
                          )}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                        </div>
                      </div>
                      {/* Plan List - rendered inline with coach message that produced it */}
                      {/* Fix 4: Never render plan for question (clarify); no process-step leak */}
                      {message.role === 'coach' &&
                        message.show_plan === true &&
                        message.plan_items &&
                        message.response_type !== 'question' &&
                        (!message.response_type ||
                          ['plan', 'weekly_plan', 'season_plan', 'session_plan', 'recommendation', 'summary'].includes(message.response_type)) && (
                          <div className={cn('flex gap-3')}>
                            <div className="w-8 shrink-0" />
                            <div className="max-w-[75%]">
                              <PlanList planItems={message.plan_items} />
                            </div>
                          </div>
                        )}
                    </>
                  )}
                </div>
              ))}
            </>
          );
        })()}

        {/* Runner Processing Indicator - shown when executing, above progress panel */}
        {/* TODO 4: Runner strictly execution-bound - no isTyping check */}
        {mode === 'executing' && (
          <RunnerProcessingIndicator 
            speedMultiplier={progressStages.length > 2 ? 1.5 : 1}
          />
        )}

        {/* Coach Progress Panel - shown below last message when conversation is active (executing) */}
        {conversationId && mode === 'executing' ? (
          <CoachProgressPanel 
            conversationId={conversationId} 
            mode={mode}
            onComplete={handleProgressComplete}
          />
        ) : null}

        {isTyping && (
          <div className="flex gap-3 animate-fade-up">
            <div className="w-8 h-8 rounded-full bg-coach text-coach-foreground flex items-center justify-center">
              <Brain className="h-4 w-4" />
            </div>
            <div className="bg-[#2F4F4F]/10 rounded-lg px-4 py-2.5">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse-subtle" />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse-subtle [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-pulse-subtle [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              // Mark as edited if user changes the draft message
              if (draftContext && !hasEditedDraft && e.target.value !== draftContext.draft_message) {
                setHasEditedDraft(true);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask your coach anything..."
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isTyping || isSendingRef.current || (draftContext && !hasEditedDraft)}
            size="icon"
            className="shrink-0 bg-coach hover:bg-coach/90 text-coach-foreground"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
        {draftContext && !hasEditedDraft && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
            Draft prepared for today's session. Please review and edit before sending.
          </p>
        )}
        {(!draftContext || hasEditedDraft) && (
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        )}
      </div>
    </div>
  );
}
