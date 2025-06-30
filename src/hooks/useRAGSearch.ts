
import { useState, useEffect } from 'react';
import { vectorSearch, SearchResult } from '@/utils/vectorSearch';
import { useCreditCardApi } from './useCreditCardApi';
import { queryOpenAI } from '@/utils/openai';
import { queryMapper } from '@/utils/queryMapper';

export interface RAGResponse {
  text: string;
  source: 'API' | 'MITC' | 'OpenAI';
  confidence: number;
  sourceDocuments?: SearchResult[];
  data?: any[];
  mappingInfo?: {
    category: string;
    matchedKeywords: string[];
    confidence: number;
  };
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
      console.log('✅ RAG system initialized');
    } catch (error) {
      console.error('❌ Failed to initialize RAG system:', error);
      setIsInitialized(true); // Continue even if MITC fails to load
    }
  };

  const searchWithRAG = async (query: string): Promise<RAGResponse> => {
    console.log('🚀 RAG Search - Starting with query:', query);
    
    // STEP 0: Map and analyze query
    const queryMapping = queryMapper.mapQuery(query);
    
    console.log('🧠 Query Analysis:', {
      category: queryMapping.category,
      confidence: queryMapping.confidence,
      matchedKeywords: queryMapping.matchedKeywords
    });

    try {
      // STEP 1: Try BankKaro API first (PRIMARY SOURCE)
      console.log('🔹 STEP 1: Searching BankKaro API...');
      
      const apiResults = await searchCards(query);
      
      console.log(`📊 API Results: Found ${apiResults?.length || 0} cards`);
      
      if (apiResults && apiResults.length > 0) {
        console.log('✅ API SUCCESS - Found cards, creating response...');
        
        const apiResponse = formatApiResponse(apiResults, query);
        
        const response: RAGResponse = {
          text: apiResponse,
          source: 'API',
          confidence: 85, // High confidence for API results
          data: apiResults.slice(0, 5), // Limit displayed cards
          mappingInfo: {
            category: queryMapping.category,
            matchedKeywords: queryMapping.matchedKeywords,
            confidence: queryMapping.confidence
          }
        };
        
        console.log('🎯 RAG Search - Returning API response with source: API');
        return response;
      }
      
      console.log('⚠️ API EMPTY - No cards found, proceeding to MITC...');

      // STEP 2: Search MITC documents (SECONDARY SOURCE)
      console.log('🔹 STEP 2: Searching MITC documents...');
      const mitcResults = await vectorSearch.search(query, 3);
      
      if (mitcResults.length > 0 && mitcResults[0].similarity > 0.2) {
        console.log(`✅ MITC SUCCESS - Found ${mitcResults.length} relevant documents`);
        
        const relevantContent = mitcResults
          .slice(0, 2)
          .map(result => result.chunk.content)
          .join('\n\n');

        const response: RAGResponse = {
          text: formatMITCResponse(relevantContent, query),
          source: 'MITC',
          confidence: Math.round(mitcResults[0].similarity * 100),
          sourceDocuments: mitcResults,
          mappingInfo: {
            category: queryMapping.category,
            matchedKeywords: queryMapping.matchedKeywords,
            confidence: queryMapping.confidence
          }
        };
        
        console.log('🎯 RAG Search - Returning MITC response with source: MITC');
        return response;
      } else {
        console.log('⚠️ MITC EMPTY - No relevant documents found, proceeding to OpenAI...');
      }

      // STEP 3: Fallback to OpenAI (TERTIARY SOURCE)
      console.log('🔹 STEP 3: Falling back to OpenAI...');
      
      const openAIResponse = await queryOpenAI(query);
      
      const response: RAGResponse = {
        text: `🤖 **Source: OpenAI** - API/MITC data unavailable for this query.\n\n${openAIResponse.text}`,
        source: 'OpenAI',
        confidence: openAIResponse.confidence,
        mappingInfo: {
          category: queryMapping.category,
          matchedKeywords: queryMapping.matchedKeywords,
          confidence: queryMapping.confidence
        }
      };
      
      console.log('🎯 RAG Search - Returning OpenAI response with source: OpenAI');
      return response;

    } catch (error) {
      console.error('❌ RAG search error:', error);
      return {
        text: "I'm experiencing some technical difficulties. Please try rephrasing your question or contact support.",
        source: 'OpenAI',
        confidence: 20
      };
    }
  };

  const formatApiResponse = (cards: any[], query: string): string => {
    const header = '🔹 **Source: BankKaro API**\n\n';
    
    if (cards.length === 1) {
      const card = cards[0];
      return `${header}I found information about the **${card.card_name || 'credit card'}** from ${card.bank_name || 'the bank'}.\n\n🏦 **Bank**: ${card.bank_name || 'Not specified'}\n💳 **Annual Fee**: ${card.annual_fee || 'Not specified'}\n✨ **Key Features**: ${card.key_features || 'Not specified'}\n🎁 **Rewards**: ${card.reward_rate || 'Not specified'}\n✅ **Eligibility**: ${card.eligibility || 'Not specified'}`;
    } else {
      return `${header}I found ${cards.length} credit cards that match your query:\n\n${cards.slice(0, 3).map((card, index) => `**${index + 1}. ${card.card_name || 'Credit Card'}**\n   🏦 Bank: ${card.bank_name || 'N/A'}\n   💳 Annual Fee: ${card.annual_fee || 'N/A'}\n   ✨ ${card.key_features ? card.key_features.substring(0, 100) + '...' : 'Features not specified'}`).join('\n\n')}`;
    }
  };

  const formatMITCResponse = (content: string, query: string): string => {
    return `📄 **Source: MITC Document**\n\nBased on our comprehensive MITC documentation:\n\n${content}\n\n*This information is sourced from official credit card terms and conditions.*`;
  };

  return {
    searchWithRAG,
    isInitialized
  };
};
