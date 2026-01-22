import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, MessageSquare, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface SupportFormState {
  status: 'idle' | 'loading' | 'success' | 'error';
  message: string;
}

export default function Support() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [formState, setFormState] = useState<SupportFormState>({ status: 'idle', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setFormState({ status: 'loading', message: '' });
    
    try {
      const response = await api.post('/support', {
        name,
        email,
        subject,
        message,
      }) as { success: boolean; message: string };
      
      if (response.success) {
        setFormState({ 
          status: 'success', 
          message: response.message || 'Your message has been sent successfully!' 
        });
        // Clear form
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('[Support] Failed to send message:', error);
      setFormState({ 
        status: 'error', 
        message: 'Failed to send your message. Please try again or email support@athletespace.ai directly.' 
      });
    }
  };

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3">Contact Support</h1>
          <p className="text-muted-foreground">
            Have a question or need help? We're here for you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <Card className="text-center">
            <CardHeader className="pb-2">
              <Mail className="h-8 w-8 mx-auto text-primary mb-2" />
              <CardTitle className="text-base">Email Us</CardTitle>
            </CardHeader>
            <CardContent>
              <a 
                href="mailto:support@athletespace.ai" 
                className="text-sm text-primary hover:underline"
              >
                support@athletespace.ai
              </a>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader className="pb-2">
              <Clock className="h-8 w-8 mx-auto text-primary mb-2" />
              <CardTitle className="text-base">Response Time</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Usually within 24 hours
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader className="pb-2">
              <MessageSquare className="h-8 w-8 mx-auto text-primary mb-2" />
              <CardTitle className="text-base">Help Center</CardTitle>
            </CardHeader>
            <CardContent>
              <Link 
                to="/faq" 
                className="text-sm text-primary hover:underline"
              >
                Browse FAQ
              </Link>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Send a Message</CardTitle>
            <CardDescription>
              Fill out the form below and we'll get back to you as soon as possible.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={formState.status === 'loading'}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={formState.status === 'loading'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="How can we help?"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                  disabled={formState.status === 'loading'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Describe your issue or question..."
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  disabled={formState.status === 'loading'}
                />
              </div>

              {/* Status messages */}
              {formState.status === 'success' && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 rounded-lg">
                  <CheckCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">{formState.message}</p>
                </div>
              )}
              
              {formState.status === 'error' && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 rounded-lg">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">{formState.message}</p>
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full sm:w-auto"
                disabled={formState.status === 'loading'}
              >
                {formState.status === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PublicLayout>
  );
}
