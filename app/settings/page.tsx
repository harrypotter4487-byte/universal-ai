'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { Settings, Save, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [preferredModel, setPreferredModel] = useState('openai/gpt-4');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const models = [
    { value: 'openai/gpt-4', label: 'GPT-4' },
    { value: 'openai/gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'anthropic/claude-3.5-sonnet', label: 'Claude 3.5 Sonnet' },
    { value: 'google/gemini-pro', label: 'Gemini Pro' },
  ];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .maybeSingle();

    if (data) {
      setApiKey(data.api_key || '');
      setPreferredModel(data.preferred_model || 'openai/gpt-4');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const { data: existing } = await supabase
        .from('user_settings')
        .select('id')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('user_settings')
          .update({
            api_key: apiKey,
            preferred_model: preferredModel,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase.from('user_settings').insert([
          {
            api_key: apiKey,
            preferred_model: preferredModel,
          },
        ]);
      }

      toast({
        title: 'Settings saved',
        description: 'Your settings have been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Settings className="h-8 w-8" />
            <h1 className="text-4xl font-bold">Settings</h1>
          </div>
          <p className="text-muted-foreground">
            Configure your AI assistant preferences
          </p>
        </div>

        <div className="bg-card rounded-lg border p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">OpenRouter API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Get your API key from{' '}
                <a
                  href="https://openrouter.ai/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  OpenRouter
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">Default AI Model</Label>
              <Select value={preferredModel} onValueChange={setPreferredModel}>
                <SelectTrigger id="model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose your preferred AI model for conversations
              </p>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full gap-2"
          >
            {isSaving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>

        <div className="bg-muted/50 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-semibold">About OpenRouter</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            OpenRouter provides unified access to multiple AI models including GPT-4,
            Claude, and Gemini. Your API key is stored locally in your browser and
            used to authenticate requests to the OpenRouter API.
          </p>
          <div className="flex gap-4">
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://openrouter.ai/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                Documentation
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://openrouter.ai/models"
                target="_blank"
                rel="noopener noreferrer"
                className="gap-2"
              >
                Available Models
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
