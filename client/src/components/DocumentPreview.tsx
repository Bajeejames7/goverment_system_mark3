import { useState, useMemo, useCallback } from "react";
import { FileText, Download, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface DocumentPreviewProps {
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  uploadedAt?: Date;
  children?: React.ReactNode;
}

export default function DocumentPreview({ 
  fileName, 
  fileUrl, 
  fileSize, 
  uploadedAt,
  children 
}: DocumentPreviewProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Memoize file extension calculation
  const fileExtension = useMemo(() => {
    return fileName.split('.').pop()?.toLowerCase();
  }, [fileName]);

  // Memoize file icon
  const fileIcon = useMemo(() => {
    switch (fileExtension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      default:
        return '📎';
    }
  }, [fileExtension]);

  // Memoize file type
  const fileType = useMemo(() => {
    switch (fileExtension) {
      case 'pdf':
        return 'PDF Document';
      case 'doc':
        return 'Word Document (Legacy)';
      case 'docx':
        return 'Word Document';
      default:
        return 'Document';
    }
  }, [fileExtension]);

  // Memoize file size formatting
  const formattedFileSize = useMemo(() => {
    if (!fileSize) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(fileSize) / Math.log(1024));
    return Math.round(fileSize / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }, [fileSize]);

  const isPDF = fileExtension === 'pdf';

  const handleDownload = useCallback(() => {
    const token = localStorage.getItem('auth_token');
    
    // Use our dedicated download endpoint with token in header
    if (fileUrl.startsWith('/api/files/') && fileUrl.endsWith('/download') && token) {
      // Create a temporary link that opens in a new window
      const downloadUrl = `${window.location.origin}${fileUrl}`;
      
      // Create a hidden iframe to trigger the download with authentication
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      // Create a form in the iframe to submit with the token
      const form = iframe.contentDocument.createElement('form');
      form.method = 'GET';
      form.action = downloadUrl;
      
      // Add token as a header via a meta tag approach won't work,
      // so we'll open in a new window with proper authentication
      document.body.removeChild(iframe);
      
      // Use fetch API to download with authentication
      fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      })
      .catch(error => {
        console.error('Download failed:', error);
        // Fallback to opening in new window
        const newWindow = window.open(downloadUrl, '_blank');
        if (!newWindow) {
          // If popup blocked, show error
          alert('Please allow popups to download the file');
        }
      });
      return;
    }
    
    // Fallback for other URLs
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [fileUrl, fileName]);

  // Load preview content when dialog opens
  const loadPreview = useCallback(async () => {
    if (!isPDF || !fileUrl) return;
    
    setIsLoadingPreview(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Use our dedicated preview endpoint
      let previewUrl = fileUrl;
      if (fileUrl.endsWith('/download')) {
        // Replace /download with /preview
        previewUrl = fileUrl.replace(/\/download$/, '/preview');
      }
      
      // Fetch the PDF with authentication
      const response = await fetch(previewUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to load preview: ${response.status} ${response.statusText}`);
      }
      
      // Convert to blob URL for iframe
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setPreviewContent(blobUrl);
    } catch (error) {
      console.error('Error loading preview:', error);
      setPreviewContent(null);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [fileUrl, isPDF]);

  // Clean up blob URL when dialog closes
  const handleDialogChange = useCallback((open: boolean) => {
    setIsPreviewOpen(open);
    if (!open && previewContent) {
      URL.revokeObjectURL(previewContent);
      setPreviewContent(null);
    }
    if (open && isPDF) {
      loadPreview();
    }
  }, [isPDF, loadPreview, previewContent]);

  // Memoize preview content to prevent unnecessary re-renders
  const PreviewContent = useMemo(() => {
    if (isPDF) {
      if (isLoadingPreview) {
        return (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        );
      }
      
      if (previewContent) {
        return (
          <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
            <iframe
              src={previewContent}
              className="w-full h-full border-0"
              title={`Preview of ${fileName}`}
              loading="lazy"
            />
          </div>
        );
      }
      
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Preview Unavailable
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
            Unable to load preview. Please try downloading the file instead.
          </p>
          <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Download File
          </Button>
        </div>
      );
    } else {
      // For Word documents, show a preview placeholder since direct preview isn't supported
      return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Word Document Preview
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
            Word documents cannot be previewed directly in the browser. Click the download button to open the document.
          </p>
          <Button onClick={handleDownload} className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Download to View
          </Button>
        </div>
      );
    }
  }, [isPDF, isLoadingPreview, previewContent, fileName, handleDownload]);

  return (
    <>
      {children ? (
        <Dialog open={isPreviewOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            {children}
          </DialogTrigger>
          <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-3">
                <span className="text-2xl">{fileIcon}</span>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-semibold">{fileName}</div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <Badge variant="outline">{fileType}</Badge>
                    {fileSize && <span>{formattedFileSize}</span>}
                    {uploadedAt && (
                      <span>Uploaded {uploadedAt.toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="flex-shrink-0"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              {PreviewContent}
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="text-2xl flex-shrink-0">{fileIcon}</div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {fileName}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <Badge variant="outline" className="text-xs">
                    {fileType}
                  </Badge>
                  {fileSize && <span>{formattedFileSize}</span>}
                  {uploadedAt && (
                    <span>Uploaded {uploadedAt.toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDialogChange(true)}
                className="gap-2"
              >
                <Eye className="w-4 h-4" />
                Preview
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}