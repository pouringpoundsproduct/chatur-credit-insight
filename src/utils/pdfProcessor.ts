
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

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
      
      return {
        text: fullText.trim(),
        pages: totalPages,
        metadata: {
          title: metadata.info?.Title,
          author: metadata.info?.Author,
          subject: metadata.info?.Subject,
          creator: metadata.info?.Creator,
          producer: metadata.info?.Producer,
          creationDate: metadata.info?.CreationDate,
          modificationDate: metadata.info?.ModDate,
        }
      };
    } catch (error) {
      console.error('❌ PDF Processor - Extraction failed:', error);
      throw new Error(`Failed to extract text from PDF: ${error.message}`);
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
    
    // Split text into meaningful sections
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
    
    // Common bank patterns
    const bankPatterns = {
      hdfc: ['hdfc', 'housing development finance'],
      sbi: ['sbi', 'state bank of india'],
      icici: ['icici'],
      axis: ['axis'],
      kotak: ['kotak'],
      indusind: ['indusind'],
      citibank: ['citi', 'citibank'],
      americanexpress: ['amex', 'american express'],
      standardchartered: ['standard chartered', 'sc bank'],
    };
    
    // Common card patterns
    const cardPatterns = {
      regalia: ['regalia'],
      millennia: ['millennia'],
      diners: ['diners'],
      magnus: ['magnus'],
      amazon: ['amazon'],
      flipkart: ['flipkart'],
      simplyclicK: ['simplyclick', 'simply click'],
      cashback: ['cashback', 'cash back'],
      rewards: ['rewards', 'reward'],
      premium: ['premium'],
      platinum: ['platinum'],
      gold: ['gold'],
    };
    
    let bankName: string | undefined;
    let cardName: string | undefined;
    
    // Find bank
    for (const [bank, patterns] of Object.entries(bankPatterns)) {
      if (patterns.some(pattern => fileNameLower.includes(pattern))) {
        bankName = bank.toUpperCase();
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
        
        // Look for common MITC sections
        const sectionPatterns = [
          { pattern: /(fees?|charges?|annual fee|joining fee)/i, type: 'Fees & Charges' },
          { pattern: /(reward|points?|cashback|benefits?)/i, type: 'Rewards & Benefits' },
          { pattern: /(eligibility|criteria|income|age)/i, type: 'Eligibility' },
          { pattern: /(interest|apr|finance charge)/i, type: 'Interest & Finance' },
          { pattern: /(terms|conditions|agreement)/i, type: 'Terms & Conditions' },
          { pattern: /(lounge|travel|insurance)/i, type: 'Travel Benefits' },
        ];
        
        let sectionType = 'General';
        for (const { pattern, type } of sectionPatterns) {
          if (pattern.test(pageContent)) {
            sectionType = type;
            break;
          }
        }
        
        // Split page into paragraphs
        const paragraphs = pageContent.split('\n').filter(p => p.trim().length > 30);
        
        paragraphs.forEach(paragraph => {
          sections.push({
            content: paragraph.trim(),
            pageNumber,
            type: sectionType
          });
        });
      }
    });
    
    return sections;
  }
}

export const pdfProcessor = new PDFProcessor();
