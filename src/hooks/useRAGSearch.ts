
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
      console.log('🚀 RAG System - Initializing...');
      // Load MITC documents
      await vectorSearch.loadMITCDocuments();
      setIsInitialized(true);
      console.log('✅ RAG system initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize RAG system:', error);
      setIsInitialized(true); // Continue even if MITC fails to load
    }
  };

  const searchWithRAG = async (query: string): Promise<RAGResponse> => {
    console.log('🚀 RAG Search - Enhanced search starting with query:', query);
    
    // STEP 0: Map and analyze query
    const queryMapping = queryMapper.mapQuery(query);
    
    console.log('🧠 Query Analysis:', {
      category: queryMapping.category,
      confidence: queryMapping.confidence,
      matchedKeywords: queryMapping.matchedKeywords
    });

    try {
      // STEP 1: Try BankKaro API first (PRIMARY SOURCE)
      console.log('🔹 STEP 1: Searching BankKaro API with enhanced filtering...');
      
      const apiResults = await searchCards(query);
      
      console.log(`📊 API Results: Found ${apiResults?.length || 0} cards`);
      
      if (apiResults && apiResults.length > 0) {
        console.log('✅ API SUCCESS - Found relevant cards');
        
        const apiResponse = formatApiResponse(apiResults, query);
        
        const response: RAGResponse = {
          text: apiResponse,
          source: 'API',
          confidence: 88, // High confidence for API results
          data: apiResults.slice(0, 6), // Show more cards
          mappingInfo: {
            category: queryMapping.category,
            matchedKeywords: queryMapping.matchedKeywords,
            confidence: queryMapping.confidence
          }
        };
        
        console.log('🎯 RAG Search - Returning enhanced API response');
        return response;
      }
      
      console.log('⚠️ API EMPTY - No relevant cards found, proceeding to MITC...');

      // STEP 2: Search MITC documents (SECONDARY SOURCE)
      console.log('🔹 STEP 2: Searching MITC documents with enhanced similarity...');
      const mitcResults = await vectorSearch.search(query, 4);
      
      if (mitcResults.length > 0 && mitcResults[0].similarity > 0.15) {
        console.log(`✅ MITC SUCCESS - Found ${mitcResults.length} relevant documents`);
        
        const relevantContent = mitcResults
          .slice(0, 3)
          .map(result => `**${result.chunk.metadata.cardName || 'Document'}** (${result.chunk.metadata.bankName || 'Bank'}): ${result.chunk.content}`)
          .join('\n\n');

        const response: RAGResponse = {
          text: formatMITCResponse(relevantContent, query, mitcResults),
          source: 'MITC',
          confidence: Math.round(mitcResults[0].similarity * 100),
          sourceDocuments: mitcResults,
          mappingInfo: {
            category: queryMapping.category,
            matchedKeywords: queryMapping.matchedKeywords,
            confidence: queryMapping.confidence
          }
        };
        
        console.log('🎯 RAG Search - Returning enhanced MITC response');
        return response;
      } else {
        console.log('⚠️ MITC EMPTY - No relevant documents found, proceeding to OpenAI...');
      }

      // STEP 3: Fallback to OpenAI (TERTIARY SOURCE)
      console.log('🔹 STEP 3: Falling back to OpenAI with context...');
      
      const openAIResponse = await queryOpenAI(query);
      
      const response: RAGResponse = {
        text: `🤖 **AI Assistant Response** - Based on general knowledge about credit cards:\n\n${openAIResponse.text}\n\n*Note: For the most current information, please check with the respective banks directly.*`,
        source: 'OpenAI',
        confidence: Math.max(openAIResponse.confidence, 40),
        mappingInfo: {
          category: queryMapping.category,
          matchedKeywords: queryMapping.matchedKeywords,
          confidence: queryMapping.confidence
        }
      };
      
      console.log('🎯 RAG Search - Returning enhanced OpenAI response');
      return response;

    } catch (error) {
      console.error('❌ RAG search error:', error);
      return {
        text: "I'm experiencing some technical difficulties. Please try rephrasing your question or contact support if the issue persists.",
        source: 'OpenAI',
        confidence: 20
      };
    }
  };

  const formatApiResponse = (cards: any[], query: string): string => {
    const header = '🔹 **Source: BankKaro Credit Card Database**\n\n';
    
    if (cards.length === 1) {
      const card = cards[0];
      return `${header}I found detailed information about the **${card.card_name || 'credit card'}** from ${card.bank_name || 'the bank'}.\n\n🏦 **Bank**: ${card.bank_name || 'Not specified'}\n💳 **Annual Fee**: ${card.annual_fee || 'Not specified'}\n✨ **Key Features**: ${card.key_features || 'Not specified'}\n🎁 **Rewards**: ${card.reward_rate || 'Not specified'}\n✅ **Eligibility**: ${card.eligibility || 'Not specified'}`;
    } else {
      return `${header}I found ${cards.length} credit cards that match your query:\n\n${cards.slice(0, 4).map((card, index) => `**${index + 1}. ${card.card_name || 'Credit Card'}**\n   🏦 Bank: ${card.bank_name || 'N/A'}\n   💳 Annual Fee: ${card.annual_fee || 'N/A'}\n   ✨ ${card.key_features ? card.key_features.substring(0, 120) + '...' : 'Features not specified'}`).join('\n\n')}\n\n*Showing top ${Math.min(cards.length, 4)} results. View card details below for complete information.*`;
    }
  };

  const formatMITCResponse = (content: string, query: string, results: SearchResult[]): string => {
    const confidenceScore = Math.round(results[0]?.similarity * 100) || 0;
    return `📄 **Source: MITC Documents** (${confidenceScore}% match)\n\nBased on official credit card terms and conditions:\n\n${content}\n\n*This information is sourced from official MITC documentation and may be subject to change. Please verify with the bank for current terms.*`;
  };

  return {
    searchWithRAG,
    isInitialized
  };
};
