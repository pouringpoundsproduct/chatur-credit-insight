
import { useState, useEffect } from 'react';
import ChatHeader from '@/components/ChatHeader';
import ChatContainer from '@/components/ChatContainer';
import ChatInput from '@/components/ChatInput';
import { useChat } from '@/hooks/useChat';
import { useRAGSearch } from '@/hooks/useRAGSearch';

const Index = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const { messages, addMessage, clearMessages } = useChat();
  const { searchWithRAG, isInitialized } = useRAGSearch();

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
      console.log('🚀 Starting RAG search for:', userMessage);
      
      // Use RAG search
      const response = await searchWithRAG(userMessage);
      
      console.log('✅ RAG search completed:', response);
      
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
      console.error('❌ Error processing message:', error);
      addMessage({
        id: (Date.now() + 1).toString(),
        text: "I'm experiencing some technical difficulties. Please try again in a moment.",
        isUser: false,
        timestamp: new Date(),
        source: 'System',
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
    console.log('🔄 Starting new chat...');
    clearMessages();
    setShowWelcome(true);
    setMessage('');
  };

  const handleBackToHome = () => {
    console.log('🏠 Going back to home...');
    clearMessages();
    setShowWelcome(true);
    setMessage('');
  };

  const startChatFromSuggestion = (suggestion: string) => {
    console.log('💡 Starting chat from suggestion:', suggestion);
    setMessage(suggestion);
    setShowWelcome(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-300"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <ChatHeader
          showWelcome={showWelcome}
          isInitialized={isInitialized}
          onNewChat={handleNewChat}
          onBackToHome={handleBackToHome}
        />

        {/* Main Content Area - Proper spacing and height */}
        <div className="flex-1 flex flex-col px-4 py-4 md:px-6 md:py-6 max-w-6xl mx-auto w-full">
          <ChatContainer
            showWelcome={showWelcome}
            messages={messages}
            isLoading={isLoading}
            onSuggestionClick={startChatFromSuggestion}
          />
          
          <ChatInput
            message={message}
            isLoading={isLoading}
            onMessageChange={setMessage}
            onSendMessage={handleSendMessage}
            onKeyPress={handleKeyPress}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
