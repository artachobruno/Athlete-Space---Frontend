import { useState, useEffect, useRef } from 'react';
import { F1Card, F1CardHeader, F1CardTitle, F1CardLabel } from '@/components/ui/f1-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Brain, User, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { sendCoachChat, type PlanItem } from '@/lib/api';
import { generateCoachGreeting } from '@/lib/coachGreeting';
import { CoachProgressPanel } from '@/components/coach/CoachProgressPanel';
import { PlanList } from '@/components/coach/PlanList';

interface Message {
  id: string;
  role: 'coach' | 'athlete';
  content: string;
  show_plan?: boolean;
  plan_items?: PlanItem[];
  response_type?: 'plan' | 'weekly_plan' | 'season_plan' | 'session_plan' | 'recommendation' | 'summary' | 'greeting' | 'question' | 'explanation' | 'smalltalk';
}

export function CoachChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const isSendingRef = useRef<boolean>(false);

  const sendMessage = async () => {
    // F02: Prevent duplicate sends with send lock
    if (isSendingRef.current) return;
    if (!input.trim()) return;

    const messageText = input.trim();
    const messageId = crypto.randomUUID();

    // F06: Clear input immediately after send starts
    setInput('');
    
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
      role: 'athlete',
      content: messageText,
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await sendCoachChat(messageText, { message_id: messageId });
      
      // F05: Only process successful responses (200 OK)
      // No retry/resend logic should trigger on success
      
      // Track conversation ID from response if provided
      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }
      
      const coachMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        content: response.reply || 'I understand.',
        show_plan: response.show_plan === true,
        // FE-1: plan_items will be populated from planned_weeks mapping in sendCoachChat
        plan_items: response.plan_items,
        response_type: response.response_type,
      };
      setMessages(prev => [...prev, coachMessage]);
    } catch (error) {
      const apiError = error as { message?: string; status?: number };
      const errorContent = apiError.message || 'Sorry, please try again.';
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        content: errorContent,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
      // F02: Release send lock
      isSendingRef.current = false;
    }
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

  // Set initial greeting on mount (no API call needed - endpoint is deprecated)
  useEffect(() => {
    const greeting = generateCoachGreeting(null);
    setMessages([
      {
        id: '1',
        role: 'coach',
        content: greeting,
      },
    ]);
  }, []);

  return (
    <F1Card variant="strong" className="flex flex-col h-full min-h-[200px]" padding="none">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-[hsl(var(--accent-telemetry)/0.12)] flex items-center justify-center">
            <Brain className="h-3 w-3 f1-status-active" />
          </div>
          <F1CardLabel className="text-[hsl(var(--f1-text-secondary))]">AI COACH</F1CardLabel>
        </div>
        <Link to="/coach">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 text-[hsl(var(--f1-text-muted))] hover:text-[hsl(var(--f1-text-primary))] hover:bg-[var(--border-subtle)]"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
        </Link>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 flex flex-col overflow-hidden p-2.5">
        <div className="flex-1 overflow-y-auto space-y-1.5 mb-2">
          {/* Coach Progress Panel - shown above messages when conversation is active */}
          {conversationId && <CoachProgressPanel conversationId={conversationId} mode="executing" />}
          {messages.slice(-4).map((message) => (
            <div key={message.id} className="space-y-1">
              <div
                className={cn(
                  'flex gap-1.5',
                  message.role === 'athlete' && 'flex-row-reverse'
                )}
              >
                {/* Avatar */}
                <div
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center shrink-0',
                    message.role === 'coach'
                      ? 'bg-[hsl(var(--accent-telemetry)/0.12)]'
                      : 'bg-[var(--surface-glass-subtle)]'
                  )}
                >
                  {message.role === 'coach' ? (
                    <Brain className="h-2.5 w-2.5 f1-status-active" />
                  ) : (
                    <User className="h-2.5 w-2.5 text-[hsl(var(--f1-text-muted))]" />
                  )}
                </div>
                
                {/* Message bubble */}
                <div
                  className={cn(
                    'max-w-[80%] rounded px-2.5 py-1 f1-body-sm',
                    message.role === 'coach'
                      ? 'bg-[hsl(var(--accent-telemetry)/0.06)] text-[hsl(var(--f1-text-primary))] border border-[hsl(var(--accent-telemetry)/0.12)]'
                      : 'bg-[var(--surface-glass-subtle)] text-[hsl(var(--f1-text-primary))]'
                  )}
                >
                  {message.content}
                </div>
              </div>
              
              {/* Plan List - rendered inline with coach message that produced it */}
              {message.role === 'coach' &&
                message.show_plan === true &&
                message.plan_items &&
                (!message.response_type ||
                  ['plan', 'weekly_plan', 'season_plan', 'session_plan', 'recommendation', 'summary'].includes(message.response_type)) && (
                  <div className={cn('flex gap-1.5')}>
                    <div className="w-5 shrink-0" />
                    <div className="max-w-[80%]">
                      <PlanList planItems={message.plan_items} />
                    </div>
                  </div>
                )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-1.5">
              <div className="w-5 h-5 rounded-full bg-[hsl(var(--accent-telemetry)/0.12)] flex items-center justify-center">
                <Brain className="h-2.5 w-2.5 f1-status-active" />
              </div>
              <div className="bg-[hsl(var(--accent-telemetry)/0.06)] border border-[hsl(var(--accent-telemetry)/0.12)] rounded px-2.5 py-1">
                <div className="flex gap-0.5">
                  <span className="w-1 h-1 bg-[hsl(var(--accent-telemetry))] rounded-full animate-pulse-subtle" />
                  <span className="w-1 h-1 bg-[hsl(var(--accent-telemetry))] rounded-full animate-pulse-subtle [animation-delay:150ms]" />
                  <span className="w-1 h-1 bg-[hsl(var(--accent-telemetry))] rounded-full animate-pulse-subtle [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-1.5">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Query system..."
            className="f1-body-sm h-8 bg-[var(--surface-glass-subtle)] border-[var(--border-subtle)] text-[hsl(var(--f1-text-primary))] placeholder:text-[hsl(var(--f1-text-muted))] focus:border-[hsl(var(--accent-telemetry)/0.4)] focus:ring-[hsl(var(--accent-telemetry)/0.15)]"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isTyping || isSendingRef.current}
            size="icon"
            className="h-8 w-8 shrink-0 bg-[hsl(var(--accent-telemetry))] hover:bg-[hsl(var(--accent-telemetry-dim))] text-white"
          >
            <Send className="h-3 w-3" />
          </Button>
        </form>
      </div>
    </F1Card>
  );
}
