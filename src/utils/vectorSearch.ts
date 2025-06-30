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
  }

  // Enhanced search with query mapping
  async searchWithMapping(query: string, mapping: any, topK: number = 5): Promise<SearchResult[]> {
    console.log(`🔍 Vector Search - Enhanced search for: "${query}"`);
    console.log(`🧠 Category: ${mapping.category}, Confidence: ${mapping.confidence}`);
    
    const results: SearchResult[] = this.documents
      .map(doc => ({
        chunk: doc,
        similarity: this.computeEnhancedSimilarityWithMapping(query, doc.content, doc.metadata, mapping)
      }))
      .filter(result => result.similarity > 0.1)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    console.log(`📊 Vector Search - Found ${results.length} relevant documents with mapping`);
    results.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.chunk.metadata.cardName || 'Document'} (${Math.round(result.similarity * 100)}% match)`);
    });

    return results;
  }

  // Search for similar documents
  async search(query: string, topK: number = 5): Promise<SearchResult[]> {
    console.log(`🔍 Vector Search - Searching for: "${query}"`);
    
    // Enhanced keyword matching with better similarity scoring
    const results: SearchResult[] = this.documents
      .map(doc => ({
        chunk: doc,
        similarity: this.computeEnhancedSimilarity(query, doc.content, doc.metadata)
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

  // Enhanced similarity computation with metadata consideration
  private computeEnhancedSimilarityWithMapping(query: string, content: string, metadata: any, mapping: any): number {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    const queryWords = queryLower.split(' ').filter(word => word.length > 2);
    
    let similarity = 0;
    
    // Basic keyword matching (40% weight)
    const contentWords = contentLower.split(' ');
    const intersection = queryWords.filter(word => contentWords.includes(word));
    const basicScore = intersection.length / queryWords.length;
    similarity += basicScore * 0.4;
    
    // Category-specific boosting (30% weight)
    if (mapping.suggestedFilters) {
      let categoryBoost = 0;
      
      // Bank matching
      if (mapping.suggestedFilters.banks) {
        const bankMatch = mapping.suggestedFilters.banks.some(bank => 
          contentLower.includes(bank.toLowerCase()) || 
          (metadata.bankName && metadata.bankName.toLowerCase().includes(bank.toLowerCase()))
        );
        if (bankMatch) categoryBoost += 0.4;
      }
      
      // Feature matching
      if (mapping.suggestedFilters.features) {
        const featureMatches = mapping.suggestedFilters.features.filter(feature =>
          contentLower.includes(feature.toLowerCase())
        );
        categoryBoost += (featureMatches.length / mapping.suggestedFilters.features.length) * 0.3;
      }
      
      // Card type matching
      if (mapping.suggestedFilters.cardTypes) {
        const typeMatch = mapping.suggestedFilters.cardTypes.some(type =>
          contentLower.includes(type.toLowerCase())
        );
        if (typeMatch) categoryBoost += 0.2;
      }
      
      similarity += categoryBoost * 0.3;
    }
    
    // Metadata boosting (20% weight)
    if (metadata.cardName && queryLower.includes(metadata.cardName.toLowerCase())) {
      similarity += 0.15;
    }
    if (metadata.bankName && queryLower.includes(metadata.bankName.toLowerCase())) {
      similarity += 0.1;
    }
    
    // Query mapping confidence boost (10% weight)
    similarity += mapping.confidence * 0.1;
    
    // Specific feature matching with higher precision
    const preciseMatches = [
      queryLower.includes('annual fee') && contentLower.includes('annual fee'),
      queryLower.includes('joining fee') && contentLower.includes('joining fee'),
      queryLower.includes('reward') && (contentLower.includes('reward') || contentLower.includes('point')),
      queryLower.includes('cashback') && contentLower.includes('cashback'),
      queryLower.includes('lounge') && contentLower.includes('lounge'),
      queryLower.includes('travel') && contentLower.includes('travel'),
      queryLower.includes('interest') && contentLower.includes('interest'),
      queryLower.includes('eligibility') && contentLower.includes('eligibility')
    ];
    
    const preciseBoost = preciseMatches.filter(Boolean).length * 0.05;
    similarity += preciseBoost;
    
    return Math.min(similarity, 1.0); // Cap at 1.0
  }

  // Enhanced similarity computation with metadata consideration
  private computeEnhancedSimilarity(query: string, content: string, metadata: any): number {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    const queryWords = queryLower.split(' ').filter(word => word.length > 2);
    
    let similarity = 0;
    
    // Basic keyword matching
    const contentWords = contentLower.split(' ');
    const intersection = queryWords.filter(word => contentWords.includes(word));
    const basicScore = intersection.length / queryWords.length;
    similarity += basicScore * 0.6;
    
    // Metadata boosting
    if (metadata.cardName && queryLower.includes(metadata.cardName.toLowerCase())) {
      similarity += 0.3;
    }
    if (metadata.bankName && queryLower.includes(metadata.bankName.toLowerCase())) {
      similarity += 0.2;
    }
    
    // Specific feature matching
    const featureMatches = [
      queryLower.includes('annual fee') && contentLower.includes('annual fee'),
      queryLower.includes('reward') && (contentLower.includes('reward') || contentLower.includes('point')),
      queryLower.includes('cashback') && contentLower.includes('cashback'),
      queryLower.includes('lounge') && contentLower.includes('lounge'),
      queryLower.includes('travel') && contentLower.includes('travel'),
      queryLower.includes('interest') && contentLower.includes('interest'),
      queryLower.includes('eligibility') && contentLower.includes('eligibility')
    ];
    
    const featureBoost = featureMatches.filter(Boolean).length * 0.1;
    similarity += featureBoost;
    
    return Math.min(similarity, 1.0); // Cap at 1.0
  }

  // Load MITC documents (enhanced with more sample documents)
  async loadMITCDocuments() {
    console.log('📥 Vector Search - Loading MITC documents...');
    
    const sampleDocuments: DocumentChunk[] = [
      {
        id: 'mitc-hdfc-regalia-1',
        content: 'HDFC Bank Regalia Credit Card offers 4 reward points per Rs. 150 spent on online shopping, dining, and fuel. Annual fee is Rs. 2,500 plus applicable taxes. The card provides complimentary airport lounge access up to 12 times per year.',
        source: 'MITC',
        metadata: {
          cardName: 'HDFC Regalia',
          bankName: 'HDFC Bank',
          section: 'Rewards & Benefits'
        }
      },
      {
        id: 'mitc-hdfc-regalia-2',
        content: 'HDFC Regalia Credit Card eligibility requires minimum monthly income of Rs. 40,000 for salaried individuals and Rs. 6 lakh annual income for self-employed. Age should be between 21-60 years.',
        source: 'MITC',
        metadata: {
          cardName: 'HDFC Regalia',
          bankName: 'HDFC Bank',
          section: 'Eligibility'
        }
      },
      {
        id: 'mitc-sbi-simplyclick-1',
        content: 'SBI SimplyCLICK Credit Card provides 10X reward points on online shopping with participating merchants. No annual fee for first year, Rs. 499 from second year onwards if annual spends are less than Rs. 1 lakh.',
        source: 'MITC',
        metadata: {
          cardName: 'SBI SimplyCLICK',
          bankName: 'SBI',
          section: 'Features'
        }
      },
      {
        id: 'mitc-axis-magnus-1',
        content: 'Axis Bank Magnus Credit Card offers premium benefits including unlimited airport lounge access, golf privileges, and accelerated reward points on travel and dining. Annual fee is Rs. 12,500 plus taxes.',
        source: 'MITC',
        metadata: {
          cardName: 'Axis Magnus',
          bankName: 'Axis Bank',
          section: 'Premium Benefits'
        }
      },
      {
        id: 'mitc-icici-amazon-1',
        content: 'ICICI Amazon Pay Credit Card provides 5% cashback on Amazon purchases for Prime members, 3% for non-Prime members. 2% cashback on other online purchases and 1% on offline purchases. No annual fee.',
        source: 'MITC',
        metadata: {
          cardName: 'ICICI Amazon Pay',
          bankName: 'ICICI Bank',
          section: 'Cashback'
        }
      },
      {
        id: 'mitc-hdfc-swiggy-1',
        content: 'HDFC Swiggy Credit Card joining fee is Rs. 500 plus applicable taxes. The card offers 10% cashback on Swiggy orders and 5% cashback on other online food delivery platforms. Annual fee is waived on spending Rs. 2 lakh in a year.',
        source: 'MITC',
        metadata: {
          cardName: 'HDFC Swiggy',
          bankName: 'HDFC Bank',
          section: 'Fees & Cashback'
        }
      }
    ];

    await this.addDocuments(sampleDocuments);
    console.log('✅ Vector Search - MITC documents loaded successfully');
  }
}

export const vectorSearch = new VectorSearchEngine();
