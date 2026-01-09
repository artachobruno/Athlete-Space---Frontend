import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Brain, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sendCoachChat, type PlanItem } from '@/lib/api';
import { generateCoachGreeting } from '@/lib/coachGreeting';
import { CoachProgressPanel } from './CoachProgressPanel';
import { PlanList } from './PlanList';

type CoachMode = 'idle' | 'awaiting_intent' | 'planning' | 'executing' | 'done';

interface Message {
  id: string;
  role: 'coach' | 'athlete';
  content: string;
  timestamp: Date;
  show_plan?: boolean;
  plan_items?: PlanItem[];
  response_type?: 'plan' | 'weekly_plan' | 'season_plan' | 'session_plan' | 'recommendation' | 'summary' | 'greeting' | 'question' | 'explanation' | 'smalltalk';
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

export function CoachChat() {
  const [mode, setMode] = useState<CoachMode>('idle');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set initial greeting on mount - only once when idle and no messages
  useEffect(() => {
    if (messages.length === 0) {
      const greeting = generateCoachGreeting(null);
      setMessages([
        {
          id: '1',
          role: 'coach',
          content: greeting,
          timestamp: new Date(),
        },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'athlete',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = input.trim();
    
    // Detect plan intent from last user message
    // Only allow transitions: idle -> planning, or done -> idle (new conversation)
    if (hasPlanIntent(messageText)) {
      if (mode === 'idle' || mode === 'done') {
        // Transition to planning mode - do NOT generate plan yet
        setMode('planning');
      }
      // If already in planning/executing, stay in current state
    } else {
      // Non-plan message - reset to idle only if we're not actively executing
      if (mode !== 'executing') {
        setMode('idle');
      }
    }
    
    setInput('');
    setIsTyping(true);

    try {
      const response = await sendCoachChat(messageText);
      
      // Track conversation ID from response if provided
      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }
      
      const coachMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        content: response.reply || 'I understand. Let me think about that.',
        timestamp: new Date(),
        show_plan: response.show_plan === true,
        plan_items: response.show_plan === true && response.plan_items && response.plan_items.length > 0 ? response.plan_items : undefined,
        response_type: response.response_type,
      };
      setMessages(prev => [...prev, coachMessage]);
      
      // Only transition to done if we're already executing and plan is shown
      // Never auto-transition from planning to executing - user must confirm
      if (mode === 'executing' && response.show_plan && response.plan_items && response.plan_items.length > 0) {
        setMode('done');
      }
    } catch (error) {
      const apiError = error as { message?: string; status?: number };
      const errorContent = apiError.message || 'Sorry, I encountered an error. Please try again.';
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      // Reset to idle on error
      setMode('idle');
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirmPlan = async () => {
    // Only allow transition from planning to executing
    if (mode !== 'planning') {
      return;
    }

    // Add confirm message first
    const confirmMessage: Message = {
      id: Date.now().toString(),
      role: 'athlete',
      content: 'Yes, generate the weekly plan',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, confirmMessage]);

    // Send confirmation message to backend to trigger plan generation
    setMode('executing');
    setIsTyping(true);

    try {
      // Send a message that explicitly requests plan generation
      const response = await sendCoachChat('Yes, generate the weekly plan');
      
      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }
      
      const coachResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        content: response.reply || 'Generating your plan...',
        timestamp: new Date(),
        show_plan: response.show_plan === true,
        plan_items: response.show_plan === true && response.plan_items && response.plan_items.length > 0 ? response.plan_items : undefined,
        response_type: response.response_type,
      };
      
      setMessages(prev => [...prev, coachResponse]);
      
      // If plan is shown, transition to done
      if (response.show_plan && response.plan_items && response.plan_items.length > 0) {
        setMode('done');
      }
    } catch (error) {
      const apiError = error as { message?: string; status?: number };
      const errorContent = apiError.message || 'Sorry, I encountered an error generating the plan. Please try again.';
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        content: errorContent,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      // Reset to planning on error so user can try again
      setMode('planning');
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-card rounded-lg border border-border overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Coach Progress Panel - shown when conversation is active (executing) OR when in planning mode (preview) */}
        {(conversationId && mode === 'executing') || mode === 'planning' ? (
          <CoachProgressPanel 
            conversationId={conversationId || null} 
            mode={mode}
            onConfirm={mode === 'planning' ? handleConfirmPlan : undefined}
          />
        ) : null}
        {messages.map((message) => (
          <div key={message.id} className="space-y-2">
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
            {message.role === 'coach' &&
              message.show_plan &&
              message.plan_items &&
              message.plan_items.length > 0 &&
              (!message.response_type ||
                ['plan', 'weekly_plan', 'season_plan', 'session_plan', 'recommendation', 'summary'].includes(message.response_type)) && (
                <div className={cn('flex gap-3', message.role === 'athlete' && 'flex-row-reverse')}>
                  <div className="w-8 shrink-0" />
                  <div className="max-w-[75%]">
                    <PlanList planItems={message.plan_items} />
                  </div>
                </div>
              )}
          </div>
        ))}

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
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your coach anything..."
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            size="icon"
            className="shrink-0 bg-coach hover:bg-coach/90 text-coach-foreground"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
