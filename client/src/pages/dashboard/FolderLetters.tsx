import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FileText, Download, Eye, Upload } from "lucide-react";
import DocumentPreview from "@/components/DocumentPreview";
import UploadLetterModal from "@/components/modals/UploadLetterModal";

export default function FolderLetters({ folderId, onUpload }: { folderId: string, onUpload?: () => void }) {
  const [searchDate, setSearchDate] = useState<string>("");
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Fetch letters from API with filters
  const { data: letters, isLoading, refetch } = useQuery({
    queryKey: ["/api/letters", folderId, searchDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (folderId) params.append("folderId", folderId);
      if (searchDate) params.append("date", searchDate);
      const url = `/api/letters?${params.toString()}`;
      const token = localStorage.getItem('auth_token');
      const res = await fetch(url, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch letters");
      return res.json();
    },
  });

  // Utility function to determine file type
  function getFileTypeIcon(fileName?: string) {
    // Always show a document icon for all files
    return <span className="text-white text-lg" title="File">📄</span>;
  };

  const handleUploadSuccess = () => {
    setUploadModalOpen(false);
    refetch(); // Refresh the letters list
    if (onUpload) onUpload();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Upload Button and Filter */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Button 
          onClick={() => setUploadModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow w-full sm:w-auto"
        >
          <Upload className="mr-2 h-4 w-4" />
          Upload Letter
        </Button>
        
        <div className="flex gap-2">
          <Input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="w-full sm:w-auto"
            placeholder="Filter by date"
          />
          {searchDate && (
            <Button 
              variant="outline" 
              onClick={() => setSearchDate("")}
              className="h-10 px-3"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Letters Table */}
      {letters?.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Letter</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {letters.map((letter: any) => (
                <tr key={letter.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="flex items-center text-lg">
                        {getFileTypeIcon(letter.fileName) ||
                          getFileTypeIcon(letter.originalFileName) ||
                          getFileTypeIcon(letter.filename) ||
                          getFileTypeIcon(letter.original_name) ||
                          <FileText className="h-4 w-4 text-blue-600" />}
                      </span>
                      <div className="ml-2">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{letter.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{letter.reference}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                      {letter.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">
                    {new Date(letter.uploadedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-1">
                      {letter.fileName && letter.fileUrl ? (
                        <DocumentPreview
                          fileName={letter.fileName}
                          fileUrl={letter.fileUrl}
                          uploadedAt={new Date(letter.uploadedAt)}
                        >
                          <Button variant="outline" size="sm" className="h-8 px-2 gap-1">
                            <Eye className="h-3 w-3" />
                            <span className="sr-only">Preview</span>
                          </Button>
                        </DocumentPreview>
                      ) : (
                        <Button variant="outline" size="sm" disabled className="h-8 px-2 gap-1">
                          <FileText className="h-3 w-3" />
                        </Button>
                      )}
                      {letter.fileName && letter.fileUrl && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            // Simple approach - create link and click
                            const link = document.createElement('a');
                            link.href = letter.fileUrl;
                            link.download = letter.fileName || 'download';
                            link.click();
                          }}
                          className="h-8 px-2 gap-1"
                        >
                          <Download className="h-3 w-3" />
                          <span className="sr-only">Download</span>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 border rounded-lg">
          <i className="fas fa-envelope-open text-gray-400 text-4xl mb-2"></i>
          <h3 className="text-md font-medium text-gray-900 dark:text-white mb-1">No letters yet</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">This folder is empty</p>
        </div>
      )}

      {/* Upload Letter Modal */}
      <UploadLetterModal 
        open={uploadModalOpen} 
        onOpenChange={setUploadModalOpen} 
        folderId={folderId}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}