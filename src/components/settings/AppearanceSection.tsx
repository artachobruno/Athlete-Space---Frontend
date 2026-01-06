import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';

export function AppearanceSection() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) {
      setTheme(stored);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('system');
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }

    localStorage.setItem('theme', theme);
  }, [theme]);

  const themes = [
    {
      value: 'light' as const,
      label: 'Light',
      description: 'Clean, bright interface',
      icon: Sun,
    },
    {
      value: 'dark' as const,
      label: 'Dark',
      description: 'Easy on the eyes',
      icon: Moon,
    },
    {
      value: 'system' as const,
      label: 'System',
      description: 'Match device settings',
      icon: Monitor,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Sun className="h-5 w-5 text-accent" />
          </div>
          <div>
            <CardTitle className="text-lg">Appearance</CardTitle>
            <CardDescription>Customize how the app looks</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Label>Theme</Label>
          <RadioGroup
            value={theme}
            onValueChange={(value) => setTheme(value as Theme)}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          >
            {themes.map((t) => {
              const Icon = t.icon;
              return (
                <label
                  key={t.value}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all',
                    theme === t.value
                      ? 'border-accent bg-accent/5 ring-1 ring-accent'
                      : 'border-border hover:border-accent/50'
                  )}
                >
                  <RadioGroupItem value={t.value} className="sr-only" />
                  <div className={cn(
                    'p-2 rounded-lg',
                    theme === t.value ? 'bg-accent/10' : 'bg-muted'
                  )}>
                    <Icon className={cn(
                      'h-5 w-5',
                      theme === t.value ? 'text-accent' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">{t.label}</div>
                    <p className="text-xs text-muted-foreground">{t.description}</p>
                  </div>
                </label>
              );
            })}
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}
