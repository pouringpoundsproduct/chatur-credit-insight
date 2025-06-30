
import { useState, useRef, useEffect } from 'react';
import { Send, Plus, CreditCard, Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import ChatMessage from '@/components/ChatMessage';
import LoadingState from '@/components/LoadingState';
import { useChat } from '@/hooks/useChat';
import { useRAGSearch } from '@/hooks/useRAGSearch';

const Index = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages, addMessage, clearMessages } = useChat();
  const { searchWithRAG, isInitialized } = useRAGSearch();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Hide welcome screen when messages exist
    if (messages.length > 0) {
      setShowWelcome(false);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage('');
    setIsLoading(true);
    setShowWelcome(false);

    // Add user message
    addMessage({
      id: Date.now().toString(),
      text: userMessage,
      isUser: true,
      timestamp: new Date()
    });

    try {
      // Use RAG search
      const response = await searchWithRAG(userMessage);
      
      addMessage({
        id: (Date.now() + 1).toString(),
        text: response.text,
        isUser: false,
        timestamp: new Date(),
        source: response.source,
        confidence: response.confidence,
        sourceDocuments: response.sourceDocuments,
        data: response.data
      });
    } catch (error) {
      console.error('Error processing message:', error);
      addMessage({
        id: (Date.now() + 1).toString(),
        text: "I'm experiencing some technical difficulties. Please try again in a moment.",
        isUser: false,
        timestamp: new Date(),
        source: 'OpenAI',
        confidence: 30
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    clearMessages();
    setShowWelcome(true);
    setMessage('');
  };

  const handleBackToHome = () => {
    setShowWelcome(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-300"></div>
      </div>

      <div className="relative z-10 flex flex-col h-screen">
        {/* Header */}
        <header className="p-4 md:p-6 border-b border-gray-700/50 backdrop-blur-sm bg-gray-900/20">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-glow">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Chatur
                </h1>
                <p className="text-xs md:text-sm text-gray-400">Your Credit Card AI Assistant</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 md:space-x-3">
              {!isInitialized && (
                <Badge variant="outline" className="text-yellow-400 border-yellow-400 text-xs">
                  Initializing...
                </Badge>
              )}
              
              {!showWelcome && messages.length > 0 && (
                <Button
                  onClick={handleBackToHome}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-300"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  <span className="hidden sm:inline">Home</span>
                </Button>
              )}
              
              <Button
                onClick={handleNewChat}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-300 hover:scale-105"
              >
                <Plus className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">New Chat</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div className="flex-1 max-w-4xl mx-auto w-full p-4 md:p-6">
          <Card className="h-full bg-gray-900/40 border-gray-700/50 backdrop-blur-sm flex flex-col">
            <ScrollArea className="flex-1 p-4 md:p-6">
              {showWelcome ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-6 px-4">
                  <div className="p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full animate-float">
                    <Sparkles className="w-12 h-12 text-blue-400" />
                  </div>
                  
                  <div className="space-y-4">
                    <h2 className="text-xl md:text-2xl font-bold mb-2">Welcome to Chatur</h2>
                    <p className="text-gray-400 max-w-md text-sm md:text-base leading-relaxed">
                      I'm your AI assistant specializing in BankKaro credit cards. 
                      I use advanced RAG technology to search through API data, MITC documents, and provide accurate answers!
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 w-full max-w-2xl">
                    {[
                      "What are the best cashback credit cards?",
                      "Compare HDFC and SBI credit cards",
                      "Credit cards with no annual fee",
                      "Travel reward credit cards with lounge access"
                    ].map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setMessage(suggestion)}
                        className="p-3 text-left bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700/30 transition-all duration-300 hover:scale-105 hover:border-blue-500/30 text-sm"
                      >
                        <p className="text-gray-300">{suggestion}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <ChatMessage key={msg.id} message={msg} />
                  ))}
                  {isLoading && <LoadingState />}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 md:p-6 border-t border-gray-700/50">
              <div className="flex space-x-2 md:space-x-3">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me about credit cards..."
                  className="flex-1 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 transition-all duration-300 text-sm md:text-base"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 px-3 md:px-4"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
