
import { useState, useEffect } from 'react';
import { vectorSearch, SearchResult } from '@/utils/vectorSearch';
import { useCreditCardApi } from './useCreditCardApi';
import { queryOpenAI } from '@/utils/openai';

export interface RAGResponse {
  text: string;
  source: 'API' | 'MITC' | 'OpenAI';
  confidence: number;
  sourceDocuments?: SearchResult[];
  data?: any[];
}

export const useRAGSearch = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const { searchCards } = useCreditCardApi();

  useEffect(() => {
    initializeRAG();
  }, []);

  const initializeRAG = async () => {
    try {
      // Load MITC documents
      await vectorSearch.loadMITCDocuments();
      setIsInitialized(true);
      console.log('RAG system initialized');
    } catch (error) {
      console.error('Failed to initialize RAG system:', error);
      setIsInitialized(true); // Continue even if MITC fails to load
    }
  };

  const searchWithRAG = async (query: string): Promise<RAGResponse> => {
    try {
      // Step 1: Try BankKaro API first
      console.log('Step 1: Searching BankKaro API...');
      const apiResults = await searchCards(query);
      
      if (apiResults && apiResults.length > 0) {
        const formattedResponse = await formatApiResponseWithAI(apiResults, query);
        return {
          text: formattedResponse,
          source: 'API',
          confidence: 90,
          data: apiResults
        };
      }

      // Step 2: Search MITC documents
      console.log('Step 2: Searching MITC documents...');
      const mitcResults = await vectorSearch.search(query, 3);
      
      if (mitcResults.length > 0 && mitcResults[0].similarity > 0.3) {
        const relevantContent = mitcResults
          .slice(0, 2)
          .map(result => result.chunk.content)
          .join('\n\n');

        return {
          text: formatMITCResponse(relevantContent, query),
          source: 'MITC',
          confidence: Math.round(mitcResults[0].similarity * 100),
          sourceDocuments: mitcResults
        };
      }

      // Step 3: Fallback to OpenAI
      console.log('Step 3: Falling back to OpenAI...');
      const openAIResponse = await queryOpenAI(query);
      
      return {
        text: openAIResponse.text,
        source: 'OpenAI',
        confidence: openAIResponse.confidence
      };

    } catch (error) {
      console.error('RAG search error:', error);
      return {
        text: "I'm experiencing some technical difficulties. Please try rephrasing your question or contact support.",
        source: 'OpenAI',
        confidence: 20
      };
    }
  };

  const formatApiResponseWithAI = async (cards: any[], query: string): Promise<string> => {
    try {
      // Create a structured summary of the API data
      const cardsSummary = cards.map(card => ({
        name: card.card_name || 'Unknown Card',
        bank: card.bank_name || 'Unknown Bank',
        annualFee: card.annual_fee || 'Not specified',
        features: card.key_features || 'Not specified',
        rewards: card.reward_rate || 'Not specified',
        eligibility: card.eligibility || 'Not specified'
      }));

      // Use OpenAI to format the response naturally
      const context = `Based on BankKaro's credit card database, here are the relevant cards found: ${JSON.stringify(cardsSummary, null, 2)}`;
      
      const aiResponse = await queryOpenAI(
        `User asked: "${query}". Format this credit card data into a helpful, conversational response. Be specific about fees, features, and benefits. Make it engaging and informative.`, 
        context
      );

      return aiResponse.text;
    } catch (error) {
      console.error('Error formatting API response:', error);
      // Fallback to basic formatting
      return formatApiResponseBasic(cards);
    }
  };

  const formatApiResponseBasic = (cards: any[]): string => {
    if (cards.length === 1) {
      const card = cards[0];
      return `I found information about the **${card.card_name || 'credit card'}** from ${card.bank_name || 'the bank'}.\n\n🏦 **Bank**: ${card.bank_name || 'Not specified'}\n💳 **Annual Fee**: ${card.annual_fee || 'Not specified'}\n✨ **Key Features**: ${card.key_features || 'Not specified'}\n🎁 **Rewards**: ${card.reward_rate || 'Not specified'}\n✅ **Eligibility**: ${card.eligibility || 'Not specified'}`;
    } else {
      return `I found ${cards.length} credit cards that match your query:\n\n${cards.slice(0, 3).map((card, index) => `**${index + 1}. ${card.card_name || 'Credit Card'}**\n   🏦 Bank: ${card.bank_name || 'N/A'}\n   💳 Annual Fee: ${card.annual_fee || 'N/A'}\n   ✨ ${card.key_features ? card.key_features.substring(0, 80) + '...' : 'Features not specified'}`).join('\n\n')}`;
    }
  };

  const formatMITCResponse = (content: string, query: string): string => {
    return `Based on our comprehensive MITC (Most Important Terms and Conditions) documentation:\n\n${content}\n\n*This information is sourced from official credit card terms and conditions.*`;
  };

  return {
    searchWithRAG,
    isInitialized
  };
};
