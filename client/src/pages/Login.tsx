import React, { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Brain, Upload, FileJson } from 'lucide-react';
import { importData } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function Login() {
  const [username, setUsername] = useState('');
  const { login } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    
    login(username.trim());
    setLocation('/app/dashboard');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const { added, merged } = importData(content);
        toast.success(`Import successful: Added ${added} users, Merged ${merged} users.`);
      } catch (error) {
        toast.error('Failed to import data. Invalid JSON file.');
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl shadow-xl border border-border p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <Brain className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t.app.title}</h1>
          <p className="text-muted-foreground mt-2 text-center">
            {t.app.subtitle}
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-foreground mb-1">
              {t.app.usernameLabel}
            </label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t.app.usernamePlaceholder}
              className="w-full"
              autoFocus
            />
          </div>
          
          <Button type="submit" className="w-full h-11">
            {t.app.startSession}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground text-center uppercase tracking-wider font-medium">{t.app.dataMgmt}</p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <Button 
              variant="outline" 
              onClick={handleImportClick}
              className="w-full flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {t.app.importData}
            </Button>
          </div>
        </div>

        <div className="mt-8 text-center flex flex-col items-center gap-4">
          <LanguageSwitcher />
          <p className="text-xs text-muted-foreground">
            {t.app.footer}
          </p>
        </div>
      </div>
    </div>
  );
}
