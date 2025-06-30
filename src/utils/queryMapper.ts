
import Fuse from 'fuse.js';

export interface QueryMapping {
  keywords: string[];
  category: string;
  priority: number;
  bankNames?: string[];
  cardTypes?: string[];
  features?: string[];
}

export interface MappingResult {
  category: string;
  confidence: number;
  matchedKeywords: string[];
  suggestedFilters: {
    banks?: string[];
    cardTypes?: string[];
    features?: string[];
  };
}

export class QueryMapper {
  private mappings: QueryMapping[] = [
    {
      keywords: ['annual fee', 'yearly fee', 'fee structure', 'charges'],
      category: 'fees',
      priority: 10,
      features: ['annual_fee', 'joining_fee']
    },
    {
      keywords: ['joining fee', 'one time fee', 'activation fee'],
      category: 'joining_fees',
      priority: 10,
      features: ['joining_fee']
    },
    {
      keywords: ['reward', 'points', 'cashback', 'cash back'],
      category: 'rewards',
      priority: 9,
      features: ['reward_rate', 'cashback']
    },
    {
      keywords: ['eligibility', 'qualification', 'criteria', 'requirement'],
      category: 'eligibility',
      priority: 8,
      features: ['eligibility']
    },
    {
      keywords: ['lounge', 'airport lounge', 'priority pass'],
      category: 'lounge_access',
      priority: 7,
      features: ['lounge', 'airport']
    },
    {
      keywords: ['travel', 'miles', 'air miles', 'flight'],
      category: 'travel_benefits',
      priority: 7,
      cardTypes: ['travel']
    },
    {
      keywords: ['premium', 'luxury', 'elite', 'platinum'],
      category: 'premium_cards',
      priority: 6,
      cardTypes: ['premium', 'platinum']
    },
    {
      keywords: ['hdfc', 'hdfc bank'],
      category: 'bank_specific',
      priority: 9,
      bankNames: ['hdfc', 'hdfc bank']
    },
    {
      keywords: ['sbi', 'state bank'],
      category: 'bank_specific',
      priority: 9,
      bankNames: ['sbi', 'state bank of india']
    },
    {
      keywords: ['icici', 'icici bank'],
      category: 'bank_specific',
      priority: 9,
      bankNames: ['icici', 'icici bank']
    },
    {
      keywords: ['axis', 'axis bank'],
      category: 'bank_specific',
      priority: 9,
      bankNames: ['axis', 'axis bank']
    },
    {
      keywords: ['regalia', 'diners', 'millennia'],
      category: 'card_specific',
      priority: 10
    }
  ];

  private fuse: Fuse<QueryMapping>;

  constructor() {
    this.fuse = new Fuse(this.mappings, {
      keys: ['keywords'],
      threshold: 0.4,
      includeScore: true,
      includeMatches: true
    });
  }

  public mapQuery(query: string): MappingResult {
    console.log('🔍 Query Mapper - Analyzing query:', query);
    
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(' ').filter(word => word.length > 2);
    
    // Direct keyword matching
    const directMatches = this.mappings.filter(mapping => 
      mapping.keywords.some(keyword => queryLower.includes(keyword.toLowerCase()))
    );
    
    // Fuzzy search for additional matches
    const fuzzyResults = this.fuse.search(queryWords.join(' '));
    
    // Combine and score results
    const allMatches = new Map<string, {
      mapping: QueryMapping;
      confidence: number;
      matchedKeywords: string[];
    }>();
    
    // Process direct matches (higher confidence)
    directMatches.forEach(mapping => {
      const matchedKeywords = mapping.keywords.filter(keyword => 
        queryLower.includes(keyword.toLowerCase())
      );
      const confidence = Math.min(0.9, (matchedKeywords.length / mapping.keywords.length) * 0.8 + 0.1);
      
      allMatches.set(mapping.category, {
        mapping,
        confidence,
        matchedKeywords
      });
    });
    
    // Process fuzzy matches (lower confidence)
    fuzzyResults.forEach(result => {
      if (result.score && result.score < 0.6) { // Lower score = better match in Fuse.js
        const mapping = result.item;
        const confidence = 1 - result.score;
        const matchedKeywords = result.matches?.map(match => match.value || '') || [];
        
        if (!allMatches.has(mapping.category) || allMatches.get(mapping.category)!.confidence < confidence) {
          allMatches.set(mapping.category, {
            mapping,
            confidence,
            matchedKeywords
          });
        }
      }
    });
    
    // Find best match
    let bestMatch = Array.from(allMatches.values())
      .sort((a, b) => {
        // Sort by priority first, then confidence
        const priorityDiff = b.mapping.priority - a.mapping.priority;
        return priorityDiff !== 0 ? priorityDiff : b.confidence - a.confidence;
      })[0];
    
    if (!bestMatch) {
      // Fallback mapping
      bestMatch = {
        mapping: {
          keywords: [],
          category: 'general',
          priority: 1
        },
        confidence: 0.1,
        matchedKeywords: []
      };
    }
    
    const result: MappingResult = {
      category: bestMatch.mapping.category,
      confidence: bestMatch.confidence,
      matchedKeywords: bestMatch.matchedKeywords,
      suggestedFilters: {
        banks: bestMatch.mapping.bankNames,
        cardTypes: bestMatch.mapping.cardTypes,
        features: bestMatch.mapping.features
      }
    };
    
    console.log('📊 Query Mapper - Result:', result);
    return result;
  }
  
  public generateSearchTerms(query: string, mapping: MappingResult): string[] {
    const baseTerms = query.toLowerCase().split(' ').filter(word => word.length > 2);
    const enhancedTerms = [...baseTerms];
    
    // Add category-specific terms
    if (mapping.suggestedFilters.features) {
      enhancedTerms.push(...mapping.suggestedFilters.features);
    }
    
    // Add bank-specific terms
    if (mapping.suggestedFilters.banks) {
      enhancedTerms.push(...mapping.suggestedFilters.banks);
    }
    
    // Add card type terms
    if (mapping.suggestedFilters.cardTypes) {
      enhancedTerms.push(...mapping.suggestedFilters.cardTypes);
    }
    
    return [...new Set(enhancedTerms)]; // Remove duplicates
  }
}

export const queryMapper = new QueryMapper();
