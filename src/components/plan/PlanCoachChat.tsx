import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sendCoachChat } from '@/lib/api';
import { CoachProgressPanel } from '@/components/coach/CoachProgressPanel';

export function PlanCoachChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'coach' | 'athlete'; content: string }>>([
    {
      role: 'coach',
      content: "Questions about this week's plan? I'm here to explain any workout or adjustment.",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'athlete' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    const messageText = input.trim();
    setInput('');
    setIsTyping(true);

    try {
      const response = await sendCoachChat(messageText);
      
      // Track conversation ID from response if provided
      if (response.conversation_id) {
        setConversationId(response.conversation_id);
      }
      
      setMessages(prev => [...prev, {
        role: 'coach' as const,
        content: response.reply || 'I understand. Let me think about that.',
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
    }
  };

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 bg-card border border-border rounded-lg shadow-xl overflow-hidden animate-fade-up">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-coach" />
              <span className="font-medium text-sm">Ask about this week</span>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="h-64 overflow-y-auto p-3 space-y-3">
            {/* Coach Progress Panel - shown above messages when conversation is active */}
            {conversationId && <CoachProgressPanel conversationId={conversationId} />}
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex',
                  msg.role === 'athlete' && 'justify-end'
                )}
              >
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                    msg.role === 'coach'
                      ? 'bg-[#2F4F4F]/10 text-foreground'
                      : 'bg-accent text-accent-foreground'
                  )}
                >
                  {msg.content}
                </div>
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
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask about your plan..."
                className="text-sm h-9"
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                size="icon"
                className="h-9 w-9 shrink-0 bg-coach hover:bg-coach/90 text-coach-foreground"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
