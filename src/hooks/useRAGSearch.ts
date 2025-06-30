
import { useState, useEffect } from 'react';
import { vectorSearch, SearchResult, DocumentChunk } from '@/utils/vectorSearch';
import { useCreditCardApi } from './useCreditCardApi';
import { queryOpenAI } from '@/utils/openai';

export interface RAGResponse {
  text: string;
  source: 'API' | 'MITC' | 'OpenAI';
  confidence: number;
  sourceDocuments?: SearchResult[];
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
    }
  };

  const searchWithRAG = async (query: string): Promise<RAGResponse> => {
    try {
      // Step 1: Try BankKaro API first
      console.log('Step 1: Searching BankKaro API...');
      const apiResults = await searchCards(query);
      
      if (apiResults && apiResults.length > 0) {
        return {
          text: formatApiResponse(apiResults),
          source: 'API',
          confidence: 90,
          sourceDocuments: []
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
        confidence: openAIResponse.confidence,
        sourceDocuments: []
      };

    } catch (error) {
      console.error('RAG search error:', error);
      return {
        text: "I'm experiencing some technical difficulties. Please try rephrasing your question or contact support.",
        source: 'OpenAI',
        confidence: 20,
        sourceDocuments: []
      };
    }
  };

  const formatApiResponse = (cards: any[]): string => {
    if (cards.length === 1) {
      const card = cards[0];
      return `I found information about the ${card.card_name || 'credit card'}. Here are the key details:\n\n${card.key_features ? `✨ Key Features: ${card.key_features}\n` : ''}${card.annual_fee ? `💳 Annual Fee: ${card.annual_fee}\n` : ''}${card.reward_rate ? `🎁 Reward Rate: ${card.reward_rate}\n` : ''}${card.eligibility ? `✅ Eligibility: ${card.eligibility}` : ''}`;
    } else {
      return `I found ${cards.length} credit cards that match your query. Here are the top options:\n\n${cards.slice(0, 3).map((card, index) => `${index + 1}. **${card.card_name || 'Credit Card'}**\n   💳 Annual Fee: ${card.annual_fee || 'N/A'}\n   ${card.key_features ? '✨ ' + card.key_features.substring(0, 100) + '...' : ''}`).join('\n\n')}`;
    }
  };

  const formatMITCResponse = (content: string, query: string): string => {
    return `Based on our detailed documentation, here's what I found about your query:\n\n${content}\n\nThis information is sourced from our comprehensive MITC (Most Important Terms and Conditions) database.`;
  };

  return {
    searchWithRAG,
    isInitialized
  };
};
