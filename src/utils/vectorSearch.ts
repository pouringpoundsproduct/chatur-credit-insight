// Vector search utilities for RAG implementation
// This will handle document embeddings and similarity search

export interface DocumentChunk {
  id: string;
  content: string;
  source: 'MITC' | 'API';
  metadata: {
    cardName?: string;
    bankName?: string;
    section?: string;
  };
  embedding?: number[];
}

export interface SearchResult {
  chunk: DocumentChunk;
  similarity: number;
}

export class VectorSearchEngine {
  private documents: DocumentChunk[] = [];
  private embeddings: Map<string, number[]> = new Map();

  // Add documents to the search index
  async addDocuments(documents: DocumentChunk[]) {
    this.documents = [...this.documents, ...documents];
    console.log(`📚 Vector Search - Added ${documents.length} documents to search index`);
    console.log(`📊 Vector Search - Total documents in index: ${this.documents.length}`);
  }

  // Clear all documents from the index
  clearDocuments() {
    this.documents = [];
    this.embeddings.clear();
    console.log('🗑️ Vector Search - Cleared all documents from index');
  }

  // Get statistics about the current index
  getIndexStats() {
    const stats = {
      totalDocuments: this.documents.length,
      sources: {} as Record<string, number>,
      banks: {} as Record<string, number>,
      cards: {} as Record<string, number>
    };

    this.documents.forEach(doc => {
      // Count by source
      stats.sources[doc.source] = (stats.sources[doc.source] || 0) + 1;
      
      // Count by bank
      if (doc.metadata.bankName) {
        stats.banks[doc.metadata.bankName] = (stats.banks[doc.metadata.bankName] || 0) + 1;
      }
      
      // Count by card
      if (doc.metadata.cardName) {
        stats.cards[doc.metadata.cardName] = (stats.cards[doc.metadata.cardName] || 0) + 1;
      }
    });

    return stats;
  }

  // Search for similar documents with better keyword matching
  async search(query: string, topK: number = 5): Promise<SearchResult[]> {
    console.log(`🔍 Vector Search - Searching for: "${query}"`);
    
    const results: SearchResult[] = this.documents
      .map(doc => ({
        chunk: doc,
        similarity: this.computeAdvancedSimilarity(query, doc.content, doc.metadata)
      }))
      .filter(result => result.similarity > 0.1)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    console.log(`📊 Vector Search - Found ${results.length} relevant documents`);
    results.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.chunk.metadata.cardName || 'Document'} (${Math.round(result.similarity * 100)}% match)`);
    });

    return results;
  }

  // Advanced similarity computation with better PDF content handling
  private computeAdvancedSimilarity(query: string, content: string, metadata: any): number {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    const queryWords = queryLower.split(' ').filter(word => word.length > 2);
    
    let similarity = 0;
    
    // Exact phrase matching (high weight)
    if (contentLower.includes(queryLower)) {
      similarity += 0.5;
    }
    
    // Individual word matching with enhanced scoring
    const contentWords = contentLower.split(/\s+/);
    const matchingWords = queryWords.filter(word => 
      contentWords.some(contentWord => 
        contentWord.includes(word) || word.includes(contentWord)
      )
    );
    const wordMatchScore = matchingWords.length / queryWords.length;
    similarity += wordMatchScore * 0.4;
    
    // Metadata boosting (enhanced for PDF documents)
    if (metadata.cardName) {
      const cardNameLower = metadata.cardName.toLowerCase();
      if (queryLower.includes(cardNameLower) || cardNameLower.includes(queryLower)) {
        similarity += 0.3;
      }
    }
    
    if (metadata.bankName) {
      const bankNameLower = metadata.bankName.toLowerCase();
      if (queryLower.includes(bankNameLower) || bankNameLower.includes(queryLower)) {
        similarity += 0.2;
      }
    }
    
    if (metadata.section) {
      const sectionLower = metadata.section.toLowerCase();
      if (queryLower.includes(sectionLower.split(' ')[0])) {
        similarity += 0.15;
      }
    }
    
    // Enhanced feature-specific matching for PDF content
    const featureMatches = [
      // Fee-related
      (queryLower.includes('annual fee') || queryLower.includes('yearly fee')) && 
      (contentLower.includes('annual fee') || contentLower.includes('yearly fee')),
      
      (queryLower.includes('joining fee') || queryLower.includes('membership fee')) && 
      (contentLower.includes('joining fee') || contentLower.includes('membership fee')),
      
      // Reward-related
      (queryLower.includes('reward') || queryLower.includes('point')) && 
      (contentLower.includes('reward') || contentLower.includes('point') || contentLower.includes('earn')),
      
      queryLower.includes('cashback') && contentLower.includes('cashback'),
      
      // Benefits
      (queryLower.includes('lounge') || queryLower.includes('airport')) && 
      (contentLower.includes('lounge') || contentLower.includes('airport')),
      
      (queryLower.includes('travel') || queryLower.includes('insurance')) && 
      (contentLower.includes('travel') || contentLower.includes('insurance')),
      
      // Financial terms
      (queryLower.includes('interest') || queryLower.includes('apr')) && 
      (contentLower.includes('interest') || contentLower.includes('apr') || contentLower.includes('finance')),
      
      (queryLower.includes('eligibility') || queryLower.includes('criteria')) && 
      (contentLower.includes('eligibility') || contentLower.includes('criteria') || contentLower.includes('qualify')),
      
      // Card networks
      queryLower.includes('visa') && contentLower.includes('visa'),
      queryLower.includes('mastercard') && contentLower.includes('mastercard'),
      queryLower.includes('rupay') && contentLower.includes('rupay'),
      
      // Spending categories
      (queryLower.includes('dining') || queryLower.includes('restaurant')) && 
      (contentLower.includes('dining') || contentLower.includes('restaurant')),
      
      (queryLower.includes('fuel') || queryLower.includes('petrol') || queryLower.includes('gas')) && 
      (contentLower.includes('fuel') || contentLower.includes('petrol') || contentLower.includes('gas')),
      
      (queryLower.includes('grocery') || queryLower.includes('supermarket')) && 
      (contentLower.includes('grocery') || contentLower.includes('supermarket')),
    ];
    
    const featureBoost = featureMatches.filter(Boolean).length * 0.08;
    similarity += featureBoost;
    
    // Penalty for very short content (likely extraction errors)
    if (content.length < 50) {
      similarity *= 0.5;
    }
    
    // Boost for longer, more comprehensive content
    if (content.length > 200) {
      similarity *= 1.1;
    }
    
    return Math.min(similarity, 1.0);
  }

  // Load comprehensive MITC documents (simulating real PDF content)
  async loadMITCDocuments() {
    console.log('📥 Vector Search - Loading comprehensive MITC documents...');
    
    const comprehensiveDocuments: DocumentChunk[] = [
      // HDFC Bank Cards
      {
        id: 'mitc-hdfc-regalia-1',
        content: 'HDFC Bank Regalia Credit Card offers 4 reward points per Rs. 150 spent on online shopping, dining, and fuel. Annual fee is Rs. 2,500 plus applicable taxes. The card provides complimentary airport lounge access up to 12 times per year domestically and 6 times internationally.',
        source: 'MITC',
        metadata: { cardName: 'HDFC Regalia', bankName: 'HDFC Bank', section: 'Rewards & Benefits' }
      },
      {
        id: 'mitc-hdfc-regalia-2',
        content: 'HDFC Regalia Credit Card eligibility requires minimum monthly income of Rs. 40,000 for salaried individuals and Rs. 6 lakh annual income for self-employed. Age should be between 21-60 years. Credit score above 750 preferred.',
        source: 'MITC',
        metadata: { cardName: 'HDFC Regalia', bankName: 'HDFC Bank', section: 'Eligibility' }
      },
      {
        id: 'mitc-hdfc-regalia-3',
        content: 'HDFC Regalia joining fee is Rs. 2,500 plus taxes. Annual fee is Rs. 2,500 waived on annual spends of Rs. 3 lakh. Interest rate on outstanding balances is 3.4% per month (40.8% annually).',
        source: 'MITC',
        metadata: { cardName: 'HDFC Regalia', bankName: 'HDFC Bank', section: 'Fees & Charges' }
      },
      
      // SBI Cards
      {
        id: 'mitc-sbi-simplyclick-1',
        content: 'SBI SimplyCLICK Credit Card provides 10X reward points on online shopping with participating merchants like Amazon, Flipkart, BookMyShow. No annual fee for first year, Rs. 499 from second year onwards if annual spends are less than Rs. 1 lakh.',
        source: 'MITC',
        metadata: { cardName: 'SBI SimplyCLICK', bankName: 'SBI', section: 'Features' }
      },
      {
        id: 'mitc-sbi-simplyclick-2',
        content: 'SBI SimplyCLICK eligibility: Minimum age 21 years, maximum 65 years. Monthly income Rs. 20,000 for salaried, Rs. 2 lakh annual for self-employed. Good credit history required.',
        source: 'MITC',
        metadata: { cardName: 'SBI SimplyCLICK', bankName: 'SBI', section: 'Eligibility' }
      },
      
      // Axis Bank Cards
      {
        id: 'mitc-axis-magnus-1',
        content: 'Axis Bank Magnus Credit Card offers premium benefits including unlimited airport lounge access, golf privileges, and accelerated reward points on travel and dining. Annual fee is Rs. 12,500 plus taxes.',
        source: 'MITC',
        metadata: { cardName: 'Axis Magnus', bankName: 'Axis Bank', section: 'Premium Benefits' }
      },
      {
        id: 'mitc-axis-magnus-2',
        content: 'Axis Magnus joining fee Rs. 12,500 plus taxes. Annual fee waived on spends above Rs. 15 lakh. Interest rate 3.6% per month. Late payment charges Rs. 950 for balances above Rs. 5000.',
        source: 'MITC',
        metadata: { cardName: 'Axis Magnus', bankName: 'Axis Bank', section: 'Fees & Interest' }
      },
      
      // ICICI Bank Cards
      {
        id: 'mitc-icici-amazon-1',
        content: 'ICICI Amazon Pay Credit Card provides 5% cashback on Amazon purchases for Prime members, 3% for non-Prime members. 2% cashback on other online purchases and 1% on offline purchases. No annual fee lifetime.',
        source: 'MITC',
        metadata: { cardName: 'ICICI Amazon Pay', bankName: 'ICICI Bank', section: 'Cashback' }
      },
      {
        id: 'mitc-icici-amazon-2',
        content: 'ICICI Amazon Pay Card eligibility: Age 21-65 years, minimum monthly income Rs. 25,000 salaried or Rs. 3.6 lakh annual for self-employed. Amazon Prime membership enhances benefits.',
        source: 'MITC',
        metadata: { cardName: 'ICICI Amazon Pay', bankName: 'ICICI Bank', section: 'Eligibility' }
      },
      
      // More comprehensive cards
      {
        id: 'mitc-hdfc-millennia-1',
        content: 'HDFC Millennia Credit Card offers 5% cashback on online shopping, 2.5% on online bill payments. Annual fee Rs. 1,000 waived on annual spends above Rs. 1 lakh. Cashback capped at Rs. 1,000 per month.',
        source: 'MITC',
        metadata: { cardName: 'HDFC Millennia', bankName: 'HDFC Bank', section: 'Cashback Features' }
      },
      {
        id: 'mitc-sbi-octane-1',
        content: 'SBI Card OCTANE offers 10X reward points on fuel, 5X on dining and movies. Annual fee Rs. 1,499, waived on annual spends of Rs. 2 lakh. Fuel surcharge waiver up to Rs. 500 per month.',
        source: 'MITC',
        metadata: { cardName: 'SBI OCTANE', bankName: 'SBI', section: 'Fuel & Dining Benefits' }
      }
    ];

    await this.addDocuments(comprehensiveDocuments);
    console.log('✅ Vector Search - Comprehensive MITC documents loaded successfully');
  }
}

export const vectorSearch = new VectorSearchEngine();
