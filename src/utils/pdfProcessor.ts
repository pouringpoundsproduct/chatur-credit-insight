
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

export interface ExtractedPDFContent {
  text: string;
  pages: number;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
}

export interface ProcessedMITCDocument {
  id: string;
  fileName: string;
  content: string;
  chunks: Array<{
    id: string;
    content: string;
    pageNumber: number;
    metadata: {
      cardName?: string;
      bankName?: string;
      section?: string;
    };
  }>;
  extractedAt: Date;
}

export class PDFProcessor {
  async extractTextFromPDF(file: File): Promise<ExtractedPDFContent> {
    console.log('📄 PDF Processor - Starting extraction for:', file.name);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
      const metadata = await pdf.getMetadata();
      
      let fullText = '';
      const totalPages = pdf.numPages;
      
      console.log(`📄 PDF Processor - Processing ${totalPages} pages...`);
      
      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += `\n\n--- Page ${pageNum} ---\n${pageText}`;
      }
      
      console.log('✅ PDF Processor - Text extraction completed');
      
      // Safely access metadata properties
      const info = metadata.info as any;
      
      return {
        text: fullText.trim(),
        pages: totalPages,
        metadata: {
          title: info?.Title || undefined,
          author: info?.Author || undefined,
          subject: info?.Subject || undefined,
          creator: info?.Creator || undefined,
          producer: info?.Producer || undefined,
          creationDate: info?.CreationDate || undefined,
          modificationDate: info?.ModDate || undefined,
        }
      };
    } catch (error) {
      console.error('❌ PDF Processor - Extraction failed:', error);
      throw new Error(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processMITCDocument(file: File): Promise<ProcessedMITCDocument> {
    console.log('🔄 PDF Processor - Processing MITC document:', file.name);
    
    const extractedContent = await this.extractTextFromPDF(file);
    const chunks = this.chunkDocument(extractedContent.text, file.name);
    
    const processedDoc: ProcessedMITCDocument = {
      id: `mitc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fileName: file.name,
      content: extractedContent.text,
      chunks,
      extractedAt: new Date()
    };
    
    console.log(`✅ PDF Processor - Created ${chunks.length} chunks from ${file.name}`);
    return processedDoc;
  }

  private chunkDocument(text: string, fileName: string): ProcessedMITCDocument['chunks'] {
    const chunks: ProcessedMITCDocument['chunks'] = [];
    
    // Extract card name and bank from filename
    const cardInfo = this.extractCardInfo(fileName);
    
    // Split text into meaningful sections with improved algorithm
    const sections = this.splitIntoSections(text);
    
    sections.forEach((section, index) => {
      if (section.content.trim().length > 50) { // Only keep substantial chunks
        chunks.push({
          id: `chunk-${index}`,
          content: section.content.trim(),
          pageNumber: section.pageNumber,
          metadata: {
            cardName: cardInfo.cardName,
            bankName: cardInfo.bankName,
            section: section.type
          }
        });
      }
    });
    
    return chunks;
  }

  private extractCardInfo(fileName: string): { cardName?: string; bankName?: string } {
    const fileNameLower = fileName.toLowerCase();
    
    // Enhanced bank patterns
    const bankPatterns = {
      'HDFC Bank': ['hdfc', 'housing development finance'],
      'State Bank of India': ['sbi', 'state bank of india'],
      'ICICI Bank': ['icici'],
      'Axis Bank': ['axis'],
      'Kotak Mahindra Bank': ['kotak'],
      'IndusInd Bank': ['indusind'],
      'Citibank': ['citi', 'citibank'],
      'American Express': ['amex', 'american express'],
      'Standard Chartered': ['standard chartered', 'sc bank'],
    };
    
    // Enhanced card patterns
    const cardPatterns = {
      'Regalia': ['regalia'],
      'Millennia': ['millennia'],
      'Diners Club': ['diners'],
      'Magnus': ['magnus'],
      'Amazon Pay': ['amazon'],
      'Flipkart': ['flipkart'],
      'SimplyCLICK': ['simplyclick', 'simply click'],
      'Cashback': ['cashback', 'cash back'],
      'Rewards': ['rewards', 'reward'],
      'Premium': ['premium'],
      'Platinum': ['platinum'],
      'Gold': ['gold'],
    };
    
    let bankName: string | undefined;
    let cardName: string | undefined;
    
    // Find bank
    for (const [bank, patterns] of Object.entries(bankPatterns)) {
      if (patterns.some(pattern => fileNameLower.includes(pattern))) {
        bankName = bank;
        break;
      }
    }
    
    // Find card
    for (const [card, patterns] of Object.entries(cardPatterns)) {
      if (patterns.some(pattern => fileNameLower.includes(pattern))) {
        cardName = card;
        break;
      }
    }
    
    return { cardName, bankName };
  }

  private splitIntoSections(text: string): Array<{ content: string; pageNumber: number; type: string }> {
    const sections: Array<{ content: string; pageNumber: number; type: string }> = [];
    const pages = text.split('--- Page ');
    
    pages.forEach((pageContent, pageIndex) => {
      if (pageContent.trim()) {
        const pageNumber = pageIndex;
        
        // Enhanced section patterns for better categorization
        const sectionPatterns = [
          { pattern: /(fees?|charges?|annual fee|joining fee|interest rate)/i, type: 'Fees & Charges' },
          { pattern: /(reward|points?|cashback|benefits?|earn)/i, type: 'Rewards & Benefits' },
          { pattern: /(eligibility|criteria|income|age|qualification)/i, type: 'Eligibility' },
          { pattern: /(interest|apr|finance charge|outstanding)/i, type: 'Interest & Finance' },
          { pattern: /(terms|conditions|agreement|policy)/i, type: 'Terms & Conditions' },
          { pattern: /(lounge|travel|insurance|airport)/i, type: 'Travel Benefits' },
          { pattern: /(fuel|dining|grocery|shopping|category)/i, type: 'Spending Categories' },
        ];
        
        let sectionType = 'General';
        for (const { pattern, type } of sectionPatterns) {
          if (pattern.test(pageContent)) {
            sectionType = type;
            break;
          }
        }
        
        // Improved text chunking - split by sentences and paragraphs
        const sentences = pageContent.split(/[.!?]+/).filter(s => s.trim().length > 50);
        
        if (sentences.length === 0) {
          // If no sentences found, use paragraph splitting
          const paragraphs = pageContent.split('\n').filter(p => p.trim().length > 50);
          paragraphs.forEach(paragraph => {
            sections.push({
              content: paragraph.trim(),
              pageNumber,
              type: sectionType
            });
          });
        } else {
          // Group sentences into meaningful chunks
          let currentChunk = '';
          sentences.forEach(sentence => {
            if (currentChunk.length + sentence.length < 500) {
              currentChunk += sentence.trim() + '. ';
            } else {
              if (currentChunk.trim()) {
                sections.push({
                  content: currentChunk.trim(),
                  pageNumber,
                  type: sectionType
                });
              }
              currentChunk = sentence.trim() + '. ';
            }
          });
          
          // Add remaining chunk
          if (currentChunk.trim()) {
            sections.push({
              content: currentChunk.trim(),
              pageNumber,
              type: sectionType
            });
          }
        }
      }
    });
    
    return sections;
  }
}

export const pdfProcessor = new PDFProcessor();
