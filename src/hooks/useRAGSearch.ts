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
    const enhancedSearchTerms = queryMapper.generateSearchTerms(query, queryMapping);
    
    console.log('🧠 Query Analysis:', {
      category: queryMapping.category,
      confidence: queryMapping.confidence,
      enhancedTerms: enhancedSearchTerms
    });

    try {
      // STEP 1: Try BankKaro API first (PRIMARY SOURCE)
      console.log('🔹 STEP 1: Searching BankKaro API with enhanced terms...');
      
      // Use enhanced search terms for API
      const primaryQuery = enhancedSearchTerms.slice(0, 3).join(' ') || query;
      const apiResults = await searchCards(primaryQuery);
      
      if (apiResults && apiResults.length > 0) {
        console.log('✅ API SUCCESS - Found relevant cards, formatting response...');
        
        // Filter API results based on query mapping
        const filteredResults = filterApiResults(apiResults, queryMapping);
        
        if (filteredResults.length > 0) {
          const formattedResponse = await formatApiResponseWithAI(filteredResults, query, queryMapping);
          
          const response = {
            text: formattedResponse,
            source: 'API' as const,
            confidence: Math.min(95, Math.round(queryMapping.confidence * 100) + 10),
            data: filteredResults,
            mappingInfo: {
              category: queryMapping.category,
              matchedKeywords: queryMapping.matchedKeywords,
              confidence: queryMapping.confidence
            }
          };
          
          console.log('🎯 RAG Search - Returning enhanced API response');
          return response;
        }
      }
      
      console.log('⚠️ API EMPTY - No relevant cards found, proceeding to MITC...');

      // STEP 2: Search MITC documents (SECONDARY SOURCE)
      console.log('🔹 STEP 2: Searching MITC documents with enhanced mapping...');
      const mitcResults = await vectorSearch.searchWithMapping(query, queryMapping, 3);
      
      if (mitcResults.length > 0 && mitcResults[0].similarity > 0.3) {
        console.log(`✅ MITC SUCCESS - Found ${mitcResults.length} relevant documents`);
        
        const relevantContent = mitcResults
          .slice(0, 2)
          .map(result => result.chunk.content)
          .join('\n\n');

        const response = {
          text: formatMITCResponse(relevantContent, query, queryMapping),
          source: 'MITC' as const,
          confidence: Math.round(mitcResults[0].similarity * 100),
          sourceDocuments: mitcResults,
          mappingInfo: {
            category: queryMapping.category,
            matchedKeywords: queryMapping.matchedKeywords,
            confidence: queryMapping.confidence
          }
        };
        
        console.log('🎯 RAG Search - Returning MITC response');
        return response;
      } else {
        console.log('⚠️ MITC EMPTY - No relevant documents found, proceeding to OpenAI...');
      }

      // STEP 3: Fallback to OpenAI (TERTIARY SOURCE)
      console.log('🔹 STEP 3: Falling back to OpenAI with context...');
      
      const contextPrompt = `Query category: ${queryMapping.category}. Matched keywords: ${queryMapping.matchedKeywords.join(', ')}. User asked: "${query}"`;
      const openAIResponse = await queryOpenAI(query, contextPrompt);
      
      const response = {
        text: `🤖 **Powered by OpenAI** - API/MITC data unavailable for this query.\n\n${openAIResponse.text}`,
        source: 'OpenAI' as const,
        confidence: openAIResponse.confidence,
        mappingInfo: {
          category: queryMapping.category,
          matchedKeywords: queryMapping.matchedKeywords,
          confidence: queryMapping.confidence
        }
      };
      
      console.log('🎯 RAG Search - Returning OpenAI fallback response');
      return response;

    } catch (error) {
      console.error('❌ RAG search error:', error);
      return {
        text: "I'm experiencing some technical difficulties. Please try rephrasing your question or contact support.",
        source: 'OpenAI' as const,
        confidence: 20
      };
    }
  };

  const filterApiResults = (cards: any[], mapping: any) => {
    if (mapping.confidence < 0.3) return cards; // Low confidence, return all
    
    return cards.filter(card => {
      const cardText = [
        card.card_name,
        card.bank_name,
        card.key_features,
        card.benefits,
        card.reward_rate,
        card.eligibility
      ].join(' ').toLowerCase();
      
      // Check for category-specific filtering
      if (mapping.suggestedFilters.banks) {
        const bankMatch = mapping.suggestedFilters.banks.some(bank => 
          cardText.includes(bank.toLowerCase())
        );
        if (!bankMatch) return false;
      }
      
      if (mapping.suggestedFilters.features) {
        const featureMatch = mapping.suggestedFilters.features.some(feature => 
          cardText.includes(feature.toLowerCase())
        );
        if (!featureMatch) return false;
      }
      
      return true;
    });
  };

  const formatApiResponseWithAI = async (cards: any[], query: string, mapping: any): Promise<string> => {
    try {
      console.log('🎨 Formatting API response with AI enhancement...');
      
      const cardsSummary = cards.map(card => ({
        name: card.card_name || 'Unknown Card',
        bank: card.bank_name || 'Unknown Bank',
        annualFee: card.annual_fee || 'Not specified',
        features: card.key_features || 'Not specified',
        rewards: card.reward_rate || 'Not specified',
        eligibility: card.eligibility || 'Not specified'
      }));

      const context = `Query category: ${mapping.category}. Cards found: ${JSON.stringify(cardsSummary, null, 2)}`;
      
      const aiResponse = await queryOpenAI(
        `User asked about "${query}" (category: ${mapping.category}). Format this credit card data into a helpful, conversational response focusing on their specific question. Start with "🔹 **Source: BankKaro API**" followed by the formatted response.`, 
        context
      );

      return aiResponse.text;
    } catch (error) {
      console.error('❌ Error formatting API response with AI:', error);
      return formatApiResponseBasic(cards);
    }
  };

  const formatApiResponseBasic = (cards: any[]): string => {
    const header = '🔹 **Source: BankKaro API**\n\n';
    
    if (cards.length === 1) {
      const card = cards[0];
      return `${header}I found information about the **${card.card_name || 'credit card'}** from ${card.bank_name || 'the bank'}.\n\n🏦 **Bank**: ${card.bank_name || 'Not specified'}\n💳 **Annual Fee**: ${card.annual_fee || 'Not specified'}\n✨ **Key Features**: ${card.key_features || 'Not specified'}\n🎁 **Rewards**: ${card.reward_rate || 'Not specified'}\n✅ **Eligibility**: ${card.eligibility || 'Not specified'}`;
    } else {
      return `${header}I found ${cards.length} credit cards that match your query:\n\n${cards.slice(0, 3).map((card, index) => `**${index + 1}. ${card.card_name || 'Credit Card'}**\n   🏦 Bank: ${card.bank_name || 'N/A'}\n   💳 Annual Fee: ${card.annual_fee || 'N/A'}\n   ✨ ${card.key_features ? card.key_features.substring(0, 80) + '...' : 'Features not specified'}`).join('\n\n')}`;
    }
  };

  const formatMITCResponse = (content: string, query: string, mapping: any): string => {
    return `📄 **Source: MITC Document** (Category: ${mapping.category})\n\nBased on our comprehensive MITC documentation:\n\n${content}\n\n*This information is sourced from official credit card terms and conditions.*`;
  };

  return {
    searchWithRAG,
    isInitialized
  };
};
