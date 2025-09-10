'use client';

import { ChatMessage } from './chat-message';
import { ChatInput } from './chat-input';
import { useEffect, useRef, useState } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatPanelProps {
  initialMessages?: any[];
  chatId?: string;
}

export function ChatPanel({ initialMessages = [], chatId }: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [messages, setMessages] = useState(initialMessages);
  
  const handleSubmit = async (_: any, options?: any) => {
    const content = options?.body?.content;
    if (content) {
      setIsLoading(true);
      setError(null);
      
      // Add user message to the chat
      const userMessage = {
        id: crypto.randomUUID(),
        role: 'user' as const,
        content: content
      };
      
      setMessages((messages: any) => [...messages, userMessage]);
      
      // Send to API
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, userMessage],
          }),
        });
        
        if (!response.ok) throw new Error('Failed to send message');
        
        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let assistantMessage = {
          id: crypto.randomUUID(),
          role: 'assistant' as const,
          content: ''
        };
        
        setMessages((messages: any) => [...messages, assistantMessage]);
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            assistantMessage.content += chunk;
            
            setMessages((messages: any) => {
              const updated = [...messages];
              updated[updated.length - 1] = { ...assistantMessage };
              return updated;
            });
          }
        }
      } catch (err) {
        console.error('Chat error:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  const reload = () => {
    // Reload functionality
  };
  
  const stop = () => {
    setIsLoading(false);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="popLayout">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex h-full items-center justify-center p-8"
            >
              <div className="max-w-md text-center space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Start a conversation</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Ask me anything! I'm here to help with your questions.
                  </p>
                </div>
                <div className="grid gap-2 text-left">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => handleSubmit(null, { body: { content: 'What can you help me with?' } })}
                  >
                    <span className="text-sm">What can you help me with?</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => handleSubmit(null, { body: { content: 'Tell me about your capabilities' } })}
                  >
                    <span className="text-sm">Tell me about your capabilities</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => handleSubmit(null, { body: { content: 'How do I get started?' } })}
                  >
                    <span className="text-sm">How do I get started?</span>
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            <>
              {messages.map((message, index) => (
                <ChatMessage
                  key={message.id}
                  role={message.role as 'user' | 'assistant'}
                  content={message.content}
                  timestamp={message.createdAt ? new Date(message.createdAt) : undefined}
                  isStreaming={isLoading && index === messages.length - 1}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-4 py-2"
          >
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>An error occurred. Please try again.</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => reload()}
                  className="ml-4"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground"
          >
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>AI is thinking...</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => stop()}
              className="ml-auto"
            >
              Stop
            </Button>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInput
        onSubmit={(content) => handleSubmit(null, { body: { content } })}
        isLoading={isLoading}
      />
    </div>
  );
}