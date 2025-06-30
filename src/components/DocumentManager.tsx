
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Database, BarChart3, RefreshCw, AlertCircle } from 'lucide-react';
import MITCUploader from './MITCUploader';
import { vectorSearch } from '@/utils/vectorSearch';
import { ProcessedMITCDocument } from '@/utils/pdfProcessor';
import { useToast } from '@/hooks/use-toast';

const DocumentManager = () => {
  const [indexStats, setIndexStats] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const refreshStats = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const stats = vectorSearch.getIndexStats();
      setIndexStats(stats);
      console.log('📊 Document Manager - Stats refreshed:', stats);
    } catch (error) {
      console.error('❌ Failed to refresh stats:', error);
      setError('Failed to refresh statistics');
      toast({
        title: "Error",
        description: "Failed to refresh document statistics",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDocumentProcessed = (document: ProcessedMITCDocument) => {
    console.log('📄 Document processed successfully:', document.fileName);
    refreshStats(); // Refresh stats when new document is added
    toast({
      title: "Document Added",
      description: `${document.fileName} has been processed and added to the search index`,
    });
  };

  const loadSampleDocuments = async () => {
    try {
      await vectorSearch.loadMITCDocuments();
      refreshStats();
      toast({
        title: "Sample Documents Loaded",
        description: "Sample MITC documents have been loaded successfully",
      });
    } catch (error) {
      console.error('❌ Failed to load sample documents:', error);
      toast({
        title: "Error",
        description: "Failed to load sample documents",
        variant: "destructive",
      });
    }
  };

  const clearAllDocuments = () => {
    try {
      vectorSearch.clearDocuments();
      refreshStats();
      toast({
        title: "Documents Cleared",
        description: "All documents have been removed from the search index",
      });
    } catch (error) {
      console.error('❌ Failed to clear documents:', error);
      toast({
        title: "Error",
        description: "Failed to clear documents",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    refreshStats();
  }, []);

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gray-900/40 border-gray-700/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Document Management
          </h2>
          <Button
            onClick={refreshStats}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="border-gray-600"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-center">
            <AlertCircle className="w-4 h-4 text-red-400 mr-2" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        <Tabs defaultValue="upload" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="upload" className="data-[state=active]:bg-blue-600">
              <FileText className="w-4 h-4 mr-2" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="stats" className="data-[state=active]:bg-blue-600">
              <BarChart3 className="w-4 h-4 mr-2" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="manage" className="data-[state=active]:bg-blue-600">
              <Database className="w-4 h-4 mr-2" />
              Manage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="mt-6">
            <MITCUploader onDocumentProcessed={handleDocumentProcessed} />
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4 bg-gray-800/50 border-gray-700/30">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {indexStats?.totalDocuments || 0}
                  </div>
                  <div className="text-sm text-gray-400">Total Documents</div>
                </div>
              </Card>

              <Card className="p-4 bg-gray-800/50 border-gray-700/30">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {Object.keys(indexStats?.banks || {}).length}
                  </div>
                  <div className="text-sm text-gray-400">Banks Covered</div>
                </div>
              </Card>

              <Card className="p-4 bg-gray-800/50 border-gray-700/30">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {Object.keys(indexStats?.cards || {}).length}
                  </div>
                  <div className="text-sm text-gray-400">Card Types</div>
                </div>
              </Card>

              <Card className="p-4 bg-gray-800/50 border-gray-700/30">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {indexStats?.sources?.MITC || 0}
                  </div>
                  <div className="text-sm text-gray-400">MITC Documents</div>
                </div>
              </Card>
            </div>

            {indexStats && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.keys(indexStats.banks).length > 0 && (
                  <Card className="p-4 bg-gray-800/50 border-gray-700/30">
                    <h4 className="font-semibold text-white mb-3">Banks in Index</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(indexStats.banks).map(([bank, count]) => (
                        <Badge key={bank} variant="outline" className="text-blue-400">
                          {bank} ({Number(count)})
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}

                {Object.keys(indexStats.cards).length > 0 && (
                  <Card className="p-4 bg-gray-800/50 border-gray-700/30">
                    <h4 className="font-semibold text-white mb-3">Card Types in Index</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(indexStats.cards).map(([card, count]) => (
                        <Badge key={card} variant="outline" className="text-green-400">
                          {card} ({Number(count)})
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="manage" className="mt-6">
            <div className="space-y-4">
              <Card className="p-4 bg-gray-800/50 border-gray-700/30">
                <h4 className="font-semibold text-white mb-2">Sample Documents</h4>
                <p className="text-gray-400 text-sm mb-4">
                  Load comprehensive sample MITC documents to test the system functionality with realistic data.
                </p>
                <Button onClick={loadSampleDocuments} variant="outline">
                  Load Sample Documents
                </Button>
              </Card>

              <Card className="p-4 bg-gray-800/50 border-gray-700/30 border-red-500/20">
                <h4 className="font-semibold text-red-400 mb-2">Danger Zone</h4>
                <p className="text-gray-400 text-sm mb-4">
                  Clear all documents from the search index. This action cannot be undone and will remove all uploaded and sample documents.
                </p>
                <Button onClick={clearAllDocuments} variant="destructive">
                  Clear All Documents
                </Button>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default DocumentManager;
