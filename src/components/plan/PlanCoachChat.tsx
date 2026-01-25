import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sendCoachChat, type PlanItem } from '@/lib/api';
import { CoachProgressPanel } from '@/components/coach/CoachProgressPanel';
import { PlanList } from '@/components/coach/PlanList';

interface Message {
  role: 'coach' | 'athlete';
  content: string;
  show_plan?: boolean;
  plan_items?: PlanItem[];
  response_type?: 'plan' | 'weekly_plan' | 'season_plan' | 'session_plan' | 'recommendation' | 'summary' | 'greeting' | 'question' | 'explanation' | 'smalltalk';
}

export function PlanCoachChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'coach',
      content: "Questions about this week's plan? I'm here to explain any workout or adjustment.",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const isSendingRef = useRef<boolean>(false);

  // Handle open/close animations
  const handleOpen = () => {
    setIsOpen(true);
    // Small delay to trigger entrance animation after mount
    requestAnimationFrame(() => setIsVisible(true));
  };

  const handleClose = () => {
    setIsClosing(true);
    setIsVisible(false);
  };

  // Remove from DOM after exit animation completes
  useEffect(() => {
    if (isClosing) {
      const timer = setTimeout(() => {
        setIsOpen(false);
        setIsClosing(false);
      }, 200); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [isClosing]);

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

    const userMessage = { role: 'athlete' as const, content: messageText };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await sendCoachChat(messageText, { message_id: messageId });
      
      // F05: Only process successful responses (200 OK)
      // No retry/resend logic should trigger on success
      
      // Track conversation ID from response if provided
      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }
      
      setMessages(prev => [...prev, {
        role: 'coach' as const,
        content: response.reply || 'I understand. Let me think about that.',
        show_plan: response.show_plan === true,
        // FE-1: plan_items will be populated from planned_weeks mapping in sendCoachChat
        plan_items: response.plan_items,
        response_type: response.response_type,
      }]);
    } catch (error) {
      const apiError = error as { message?: string; status?: number };
      const errorContent = apiError.message || 'Sorry, I encountered an error. Please try again.';
      
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        role: 'coach' as const,
        content: errorContent,
      }]);
    } finally {
      setIsTyping(false);
      // F02: Release send lock
      isSendingRef.current = false;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // F03: Prevent double submit - only handle Enter key
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
    <>
      {/* Floating button */}
      {!isOpen && (
        <Button
          onClick={handleOpen}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg transition-transform duration-200 hover:scale-110"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div 
          className={cn(
            "fixed bottom-6 right-6 w-80 bg-muted/40 backdrop-blur-sm border border-border/50 rounded-lg shadow-xl overflow-hidden transition-all duration-200 ease-out",
            isVisible && !isClosing 
              ? "opacity-100 translate-y-0 scale-100" 
              : "opacity-0 translate-y-4 scale-95"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-coach" />
              <span className="font-medium text-sm">Ask about this week</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="h-64 overflow-y-auto p-3 space-y-3">
            {/* Coach Progress Panel - shown above messages when conversation is active */}
            {conversationId && <CoachProgressPanel conversationId={conversationId} mode="executing" />}
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className="space-y-2 animate-fade-in"
                style={{ animationDelay: `${idx * 50}ms`, animationFillMode: 'backwards' }}
              >
                <div
                  className={cn(
                    'flex transition-all duration-300',
                    msg.role === 'athlete' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-lg px-3 py-2 text-sm transform transition-all duration-200',
                      msg.role === 'coach'
                        ? 'bg-coach/10 text-foreground'
                        : 'bg-accent text-accent-foreground'
                    )}
                  >
                    {msg.content}
                  </div>
                </div>
                {/* Plan List - rendered inline with coach message that produced it */}
                {/* FE-2: Use show_plan flag; Fix 4: never render plan for question (clarify) */}
                {msg.role === 'coach' &&
                  msg.show_plan === true &&
                  msg.plan_items &&
                  msg.response_type !== 'question' &&
                  (!msg.response_type ||
                    ['plan', 'weekly_plan', 'season_plan', 'session_plan', 'recommendation', 'summary'].includes(msg.response_type)) && (
                    <div className="flex animate-fade-in" style={{ animationDelay: '100ms' }}>
                      <div className="max-w-[85%]">
                        <PlanList planItems={msg.plan_items} />
                      </div>
                    </div>
                  )}
              </div>
            ))}
            {isTyping && (
              <div className="flex">
                <div className="bg-[#2F4F4F]/10 rounded-lg px-3 py-2">
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
          <div className="p-3 border-t border-border">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your plan..."
                className="text-sm h-9"
              />
              <Button
                type="submit"
                disabled={!input.trim() || isTyping || isSendingRef.current}
                size="icon"
                className="h-9 w-9 shrink-0 bg-coach hover:bg-coach/90 text-coach-foreground"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
