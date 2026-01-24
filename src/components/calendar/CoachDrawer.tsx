import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Send, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CoachDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: string;
}

const contextResponses: Record<string, string[]> = {
  default: [
    "Looking at your calendar, your training distribution looks balanced.",
    "Based on your schedule, you have good recovery between hard sessions.",
    "Your weekly structure supports progressive overload while managing fatigue.",
  ],
  workout: [
    "This session targets your aerobic system. Keep the effort conversational.",
    "The intent here is quality over quantity. Execute with precision.",
    "Recovery between intervals is just as important as the work itself.",
  ],
};

export function CoachDrawer({ open, onOpenChange, context }: CoachDrawerProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'coach' | 'athlete'; content: string }>>([
    {
      role: 'coach',
      content: context
        ? `I see you're looking at your schedule. What would you like to know?`
        : "How can I help with your training calendar?",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = () => {
    if (!input.trim()) return;

    setMessages(prev => [...prev, { role: 'athlete', content: input }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const responses = context ? contextResponses.workout : contextResponses.default;
      setMessages(prev => [...prev, {
        role: 'coach',
        content: responses[Math.floor(Math.random() * responses.length)],
      }]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col bg-muted/40 backdrop-blur-sm border-border/50">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-accent" />
            Ask Coach
          </SheetTitle>
        </SheetHeader>

        {/* Context indicator */}
        {context && (
          <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-md">
            Discussing: {context}
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                'flex gap-2',
                msg.role === 'athlete' && 'flex-row-reverse'
              )}
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                  msg.role === 'coach'
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {msg.role === 'coach' ? (
                  <Bot className="h-3.5 w-3.5" />
                ) : (
                  <User className="h-3.5 w-3.5" />
                )}
              </div>
              <div
                className={cn(
                  'max-w-[80%] rounded-lg px-3 py-2 text-sm',
                  msg.role === 'coach'
                    ? 'bg-muted text-foreground'
                    : 'bg-accent text-accent-foreground'
                )}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                <Bot className="h-3.5 w-3.5" />
              </div>
              <div className="bg-muted rounded-lg px-3 py-2">
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
        <div className="border-t border-border pt-4">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about your schedule..."
              className="text-sm"
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              size="icon"
              className="shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
