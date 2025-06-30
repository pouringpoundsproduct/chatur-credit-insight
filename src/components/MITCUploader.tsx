
import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { pdfProcessor, ProcessedMITCDocument } from '@/utils/pdfProcessor';
import { vectorSearch } from '@/utils/vectorSearch';
import { useToast } from '@/hooks/use-toast';

interface MITCUploaderProps {
  onDocumentProcessed?: (document: ProcessedMITCDocument) => void;
}

const MITCUploader = ({ onDocumentProcessed }: MITCUploaderProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedDocs, setProcessedDocs] = useState<ProcessedMITCDocument[]>([]);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length > 0) {
      processFiles(pdfFiles);
    } else {
      toast({
        title: "Invalid files",
        description: "Please upload PDF files only.",
        variant: "destructive",
      });
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    
    if (pdfFiles.length > 0) {
      processFiles(pdfFiles);
    }
  };

  const processFiles = async (files: File[]) => {
    setProcessing(true);
    setProgress(0);
    
    const totalFiles = files.length;
    const newProcessedDocs: ProcessedMITCDocument[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        console.log(`📄 Processing file ${i + 1}/${totalFiles}: ${file.name}`);
        
        // Process the PDF
        const processedDoc = await pdfProcessor.processMITCDocument(file);
        newProcessedDocs.push(processedDoc);
        
        // Add to vector search index
        const documentChunks = processedDoc.chunks.map(chunk => ({
          id: `${processedDoc.id}-${chunk.id}`,
          content: chunk.content,
          source: 'MITC' as const,
          metadata: chunk.metadata,
        }));
        
        await vectorSearch.addDocuments(documentChunks);
        
        // Update progress
        setProgress(((i + 1) / totalFiles) * 100);
        
        toast({
          title: "Document processed",
          description: `${file.name} has been successfully processed and indexed.`,
        });
        
        if (onDocumentProcessed) {
          onDocumentProcessed(processedDoc);
        }
        
      } catch (error) {
        console.error(`❌ Failed to process ${file.name}:`, error);
        toast({
          title: "Processing failed",
          description: `Failed to process ${file.name}: ${error.message}`,
          variant: "destructive",
        });
      }
    }
    
    setProcessedDocs(prev => [...prev, ...newProcessedDocs]);
    setProcessing(false);
    setProgress(0);
  };

  const removeDocument = (docId: string) => {
    setProcessedDocs(prev => prev.filter(doc => doc.id !== docId));
    toast({
      title: "Document removed",
      description: "Document has been removed from the index.",
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-gray-900/40 border-gray-700/50">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2">Upload MITC Documents</h3>
          <p className="text-gray-400 text-sm">
            Upload PDF files containing credit card terms and conditions (MITC) to enhance the AI's knowledge base.
          </p>
        </div>
        
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
            dragActive
              ? 'border-blue-400 bg-blue-500/10'
              : 'border-gray-600 hover:border-gray-500 bg-gray-800/30'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-white mb-2">
            Drag and drop PDF files here, or click to select files
          </p>
          <p className="text-gray-400 text-sm mb-4">
            Supports PDF files up to 10MB each
          </p>
          
          <input
            type="file"
            multiple
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
            disabled={processing}
          />
          
          <Button
            asChild
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
            disabled={processing}
          >
            <label htmlFor="file-input" className="cursor-pointer">
              Select PDF Files
            </label>
          </Button>
        </div>
        
        {processing && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-300">Processing documents...</span>
              <span className="text-sm text-gray-400">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </Card>
      
      {processedDocs.length > 0 && (
        <Card className="p-6 bg-gray-900/40 border-gray-700/50">
          <h4 className="text-md font-semibold text-white mb-4 flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Processed Documents ({processedDocs.length})
          </h4>
          
          <div className="space-y-3">
            {processedDocs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-white font-medium">{doc.fileName}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {doc.chunks.length} chunks
                      </Badge>
                      {doc.chunks[0]?.metadata.bankName && (
                        <Badge variant="outline" className="text-xs text-blue-400">
                          {doc.chunks[0].metadata.bankName}
                        </Badge>
                      )}
                      {doc.chunks[0]?.metadata.cardName && (
                        <Badge variant="outline" className="text-xs text-green-400">
                          {doc.chunks[0].metadata.cardName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeDocument(doc.id)}
                  className="text-gray-400 hover:text-red-400"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default MITCUploader;
