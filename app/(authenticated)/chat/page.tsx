'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Paperclip, 
  Copy, 
  ThumbsUp, 
  ThumbsDown,
  Loader2,
  Plus,
  FileText,
  Scale,
  BookOpen,
  MessageSquare
} from 'lucide-react';
import { AppLayout } from '@/components/layouts/app-layout';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: string[];
}

const PROMPT_SUGGESTIONS = [
  {
    icon: Scale,
    text: "Qual o prazo para contestação?",
    category: "Prazos"
  },
  {
    icon: FileText,
    text: "Como elaborar uma petição inicial?",
    category: "Petições"
  },
  {
    icon: BookOpen,
    text: "Jurisprudência sobre danos morais",
    category: "Pesquisa"
  },
  {
    icon: MessageSquare,
    text: "Diferença entre prescrição e decadência",
    category: "Conceitos"
  }
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<{id: string, title: string, date: string}[]>([
    { id: '1', title: 'Prazo para contestação', date: 'Há 2 horas' },
    { id: '2', title: 'Modelo de petição inicial', date: 'Ontem' },
    { id: '3', title: 'Jurisprudência STF', date: '2 dias atrás' }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Call real AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `Você é um assistente jurídico especializado em direito brasileiro.
              Seja claro, objetivo e sempre cite legislação quando relevante.
              Responda em português brasileiro.`
            },
            ...newMessages.map(msg => ({
              role: msg.role,
              content: msg.content
            }))
          ],
          model: 'gpt-4o-mini' // Using GPT-4 mini as default
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      
      // Create a single assistant message with fixed ID
      const assistantMessageId = `assistant-${Date.now()}`;
      
      // Add initial empty assistant message
      const initialAssistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, initialAssistantMessage]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          assistantContent += chunk;
          
          // Update the same assistant message with accumulated content
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: assistantContent }
                : msg
            )
          );
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Create assistant message ID for error case too
      const errorMessageId = `assistant-error-${Date.now()}`;
      
      // Fallback message on error
      const errorMessage: Message = {
        id: errorMessageId,
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <AppLayout>
      <div className="flex h-screen">
        {/* Chat Sidebar */}
        <aside className="w-80 bg-white border-r border-freelaw-purple/10 flex flex-col">
          <div className="p-4 border-b border-freelaw-purple/10">
            <button className="w-full px-4 py-3 bg-gradient-purple text-white rounded-xl font-semibold hover:shadow-purple transition-all duration-200 flex items-center justify-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Nova Conversa</span>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-xs font-bold text-tech-blue-light uppercase tracking-wider mb-3">Conversas Recentes</h3>
            <div className="space-y-1">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-freelaw-purple/10 text-sm text-tech-blue transition-colors"
                >
                  <div className="font-medium truncate">{conv.title}</div>
                  <div className="text-xs text-tech-blue-light">{conv.date}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-freelaw-purple/10">
            <div className="p-3 bg-freelaw-purple/10 rounded-xl">
              <h4 className="font-semibold text-tech-blue text-sm mb-1">Dica do Dia</h4>
              <p className="text-xs text-tech-blue-light">
                Você pode anexar documentos para análise!
              </p>
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col bg-white">
          {/* Header */}
          <header className="bg-white border-b border-freelaw-purple/10 px-6 py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-purple rounded-xl">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-tech-blue">Assistente Jurídico IA</h1>
                <p className="text-sm text-tech-blue-light">Especializado em Direito Brasileiro</p>
              </div>
            </div>
          </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          {messages.length === 0 ? (
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex p-4 bg-gradient-purple rounded-2xl shadow-lg mb-4">
                  <Bot className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-tech-blue mb-2">
                  Como posso ajudar você hoje?
                </h2>
                <p className="text-tech-blue-light">
                  Sou especializado em direito brasileiro e posso ajudar com dúvidas jurídicas, 
                  elaboração de peças e pesquisa de jurisprudência.
                </p>
              </div>

              {/* Suggestion Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PROMPT_SUGGESTIONS.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion.text)}
                    className="group bg-white border-2 border-freelaw-purple/10 rounded-xl p-4 hover:border-freelaw-purple/30 hover:shadow-lg transition-all duration-200 text-left"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-freelaw-purple/10 rounded-lg group-hover:bg-freelaw-purple group-hover:text-white transition-colors">
                        <suggestion.icon className="w-5 h-5 text-freelaw-purple group-hover:text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-freelaw-purple mb-1">
                          {suggestion.category}
                        </div>
                        <div className="text-sm font-medium text-tech-blue">
                          {suggestion.text}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    <div className={`p-2 rounded-xl ${message.role === 'user' ? 'bg-freelaw-purple' : 'bg-tech-blue'}`}>
                      {message.role === 'user' ? (
                        <User className="w-5 h-5 text-white" />
                      ) : (
                        <Bot className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className={`px-4 py-3 rounded-2xl ${
                      message.role === 'user' 
                        ? 'bg-gradient-purple text-white' 
                        : 'bg-white border border-freelaw-purple/10'
                    }`}>
                      <p className={`text-sm whitespace-pre-wrap ${message.role === 'user' ? 'text-white' : 'text-tech-blue'}`}>
                        {message.content}
                      </p>
                      {message.role === 'assistant' && (
                        <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-freelaw-purple/10">
                          <button className="p-1.5 hover:bg-freelaw-purple/10 rounded-lg transition-colors">
                            <Copy className="w-4 h-4 text-tech-blue-light" />
                          </button>
                          <button className="p-1.5 hover:bg-freelaw-purple/10 rounded-lg transition-colors">
                            <ThumbsUp className="w-4 h-4 text-tech-blue-light" />
                          </button>
                          <button className="p-1.5 hover:bg-freelaw-purple/10 rounded-lg transition-colors">
                            <ThumbsDown className="w-4 h-4 text-tech-blue-light" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-tech-blue rounded-xl">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="px-4 py-3 bg-white border border-freelaw-purple/10 rounded-2xl">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin text-freelaw-purple" />
                        <span className="text-sm text-tech-blue-light">Pensando...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-freelaw-purple/10 bg-white px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-3">
              <button className="p-3 hover:bg-freelaw-purple/10 rounded-xl transition-colors">
                <Paperclip className="w-5 h-5 text-tech-blue" />
              </button>
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Digite sua pergunta jurídica..."
                  className="w-full px-4 py-3 bg-freelaw-purple/5 border-2 border-freelaw-purple/20 rounded-xl focus:outline-none focus:border-freelaw-purple resize-none text-tech-blue placeholder-tech-blue-light/50"
                  rows={1}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-3 bg-gradient-purple text-white rounded-xl hover:shadow-purple disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-tech-blue-light mt-2 text-center">
              A IA pode cometer erros. Sempre verifique informações importantes com fontes oficiais.
            </p>
          </div>
        </div>
      </main>
    </div>
  </AppLayout>
  );
}