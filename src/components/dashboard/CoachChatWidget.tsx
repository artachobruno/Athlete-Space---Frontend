import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Brain, User, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { sendCoachChat } from '@/lib/api';
import { generateCoachGreeting } from '@/lib/coachGreeting';

interface Message {
  id: string;
  role: 'coach' | 'athlete';
  content: string;
}

export function CoachChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'athlete',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageText = input.trim();
    setInput('');
    setIsTyping(true);

    try {
      const response = await sendCoachChat(messageText);
      const coachMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        content: response.reply || 'I understand.',
      };
      setMessages(prev => [...prev, coachMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'coach',
        content: 'Sorry, please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
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
          {messages.slice(-4).map((message) => (
            <div
              key={message.id}
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
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your coach..."
            className="text-sm h-9"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            size="icon"
            className="h-9 w-9 shrink-0 bg-coach hover:bg-coach/90 text-coach-foreground"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
