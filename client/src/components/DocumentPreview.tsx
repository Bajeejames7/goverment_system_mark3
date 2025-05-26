import { useState } from "react";
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

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase();
  };

  const getFileIcon = (filename: string) => {
    const extension = getFileExtension(filename);
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      default:
        return '📎';
    }
  };

  const getFileType = (filename: string) => {
    const extension = getFileExtension(filename);
    switch (extension) {
      case 'pdf':
        return 'PDF Document';
      case 'doc':
        return 'Word Document (Legacy)';
      case 'docx':
        return 'Word Document';
      default:
        return 'Document';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const isPDF = getFileExtension(fileName) === 'pdf';

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const PreviewContent = () => {
    if (isPDF) {
      return (
        <div className="w-full h-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
          <iframe
            src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full border-0"
            title={`Preview of ${fileName}`}
          />
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
  };

  return (
    <>
      {children ? (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogTrigger asChild>
            {children}
          </DialogTrigger>
          <DialogContent className="max-w-4xl w-full h-[80vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-3">
                <span className="text-2xl">{getFileIcon(fileName)}</span>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-semibold">{fileName}</div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                    <Badge variant="outline">{getFileType(fileName)}</Badge>
                    {fileSize && <span>{formatFileSize(fileSize)}</span>}
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
              <PreviewContent />
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="text-2xl flex-shrink-0">{getFileIcon(fileName)}</div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {fileName}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                  <Badge variant="outline" className="text-xs">
                    {getFileType(fileName)}
                  </Badge>
                  {fileSize && <span>{formatFileSize(fileSize)}</span>}
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
                onClick={() => setIsPreviewOpen(true)}
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