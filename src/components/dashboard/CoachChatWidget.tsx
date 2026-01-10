import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        plan_items: response.show_plan === true && response.plan_items && response.plan_items.length > 0 ? response.plan_items : undefined,
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
    <Card className="flex flex-col h-full min-h-[200px]">
      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-coach" />
          <CardTitle className="text-sm font-medium text-muted-foreground">Coach</CardTitle>
        </div>
        <Link to="/coach">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Maximize2 className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden p-3 pt-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-3">
          {/* Coach Progress Panel - shown above messages when conversation is active */}
          {conversationId && <CoachProgressPanel conversationId={conversationId} />}
          {messages.slice(-4).map((message) => (
            <div key={message.id} className="space-y-1.5">
              <div
                className={cn(
                  'flex gap-2',
                  message.role === 'athlete' && 'flex-row-reverse'
                )}
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded-full flex items-center justify-center shrink-0',
                    message.role === 'coach'
                      ? 'bg-coach text-coach-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {message.role === 'coach' ? (
                    <Brain className="h-3 w-3" />
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                </div>
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg px-3 py-1.5 text-xs',
                    message.role === 'coach'
                      ? 'bg-[#2F4F4F]/10 text-foreground'
                      : 'bg-accent text-accent-foreground'
                  )}
                >
                  {message.content}
                </div>
              </div>
              {/* Plan List - rendered inline with coach message that produced it */}
              {message.role === 'coach' &&
                message.show_plan &&
                message.plan_items &&
                message.plan_items.length > 0 &&
                (!message.response_type ||
                  ['plan', 'weekly_plan', 'season_plan', 'session_plan', 'recommendation', 'summary'].includes(message.response_type)) && (
                  <div className={cn('flex gap-2', message.role === 'athlete' && 'flex-row-reverse')}>
                    <div className="w-6 shrink-0" />
                    <div className="max-w-[80%]">
                      <PlanList planItems={message.plan_items} />
                    </div>
                  </div>
                )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-coach text-coach-foreground flex items-center justify-center">
                <Brain className="h-3 w-3" />
              </div>
            <div className="bg-coach text-coach-foreground rounded-lg px-3 py-1.5">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-pulse-subtle" />
                <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-pulse-subtle [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-pulse-subtle [animation-delay:300ms]" />
              </div>
            </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your coach..."
            className="text-sm h-9"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isTyping || isSendingRef.current}
            size="icon"
            className="h-9 w-9 shrink-0 bg-coach hover:bg-coach/90 text-coach-foreground"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
