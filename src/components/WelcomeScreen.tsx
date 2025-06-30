
import { Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onSuggestionClick: (suggestion: string) => void;
}

const WelcomeScreen = ({ onSuggestionClick }: WelcomeScreenProps) => {
  const suggestions = [
    "What are the best cashback credit cards?",
    "Compare HDFC and SBI credit cards",
    "Credit cards with no annual fee",
    "Travel reward credit cards with lounge access"
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 px-4 py-8">
      <div className="p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full animate-float">
        <Sparkles className="w-16 h-16 text-blue-400" />
      </div>
      
      <div className="space-y-4 max-w-2xl">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">Welcome to Chatur</h2>
        <p className="text-gray-400 text-base md:text-lg leading-relaxed">
          I'm your AI assistant specializing in BankKaro credit cards. 
          I use advanced RAG technology to search through API data, MITC documents, and provide accurate answers!
        </p>
        
        {/* API Status Indicator */}
        <div className="flex items-center justify-center space-x-2 text-sm">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-green-400">API Connected & Ready</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSuggestionClick(suggestion)}
            className="p-4 text-left bg-gray-800/50 hover:bg-gray-700/50 rounded-lg border border-gray-700/30 transition-all duration-300 hover:scale-105 hover:border-blue-500/30 text-sm md:text-base"
          >
            <p className="text-gray-300">{suggestion}</p>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WelcomeScreen;
