import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye } from "lucide-react";
import UploadLetterModal from "@/components/modals/UploadLetterModal";
import DocumentPreview from "@/components/DocumentPreview";

export default function Letters({ folderId }: { folderId?: string }) {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>(folderId || "all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchDate, setSearchDate] = useState<string>("");

  // If folderId changes, update selectedFolder
  useEffect(() => {
    if (folderId) setSelectedFolder(folderId);
  }, [folderId]);

  // Fetch letters from API with filters
  const { data: letters, isLoading } = useQuery({
    queryKey: ["/api/letters", selectedFolder, selectedStatus, searchDate],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedFolder && selectedFolder !== "all") params.append("folderId", selectedFolder);
      if (selectedStatus && selectedStatus !== "all") params.append("status", selectedStatus);
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

  const { data: folders } = useQuery({
    queryKey: ["/api/folders"],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/folders', {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch folders");
      return res.json();
    },
  });

  useEffect(() => {
    if (folderId) setSelectedFolder(folderId);
    else {
      // On mount, check for ?folder=... in URL and set selectedFolder
      const params = new URLSearchParams(window.location.search);
      const folderIdFromUrl = params.get('folder');
      if (folderIdFromUrl) {
        setSelectedFolder(folderIdFromUrl);
      }
    }
  }, [folderId]);

  const getStatusBadge = (status: string) => {
    const badges = {
      verified: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  // Utility function to determine file type
  function getFileTypeIcon(fileName?: string) {
    // Always show a document icon for all files
    return <span className="text-white text-lg" title="File">📄</span>;
  }

  // Debug: log the letters data to verify fileName/originalFileName
  useEffect(() => {
    if (letters) {
      console.log('DEBUG: Letters data', letters);
    }
  }, [letters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {folderId ? (
            <>
              <span className="font-extrabold text-blue-700">
                {folders?.find((f: any) => f.id === parseInt(folderId))?.name || ''}
              </span>
              <span className="ml-2 font-normal text-gray-700 dark:text-gray-300">Letters Management</span>
            </>
          ) : (
            "Letters Management"
          )}
        </h2>
        <Button 
          onClick={() => setUploadModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow"
        >
          <i className="fas fa-upload mr-2"></i>Upload Letter
        </Button>
      </div>

      {/* Upload Letter Modal, pass folderId if present */}
      <UploadLetterModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} folderId={folderId} />

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            {folderId ? (
              <Input
                value={folders?.find((f: any) => f.id === parseInt(folderId))?.name || ''}
                disabled
                className="w-48"
              />
            ) : (
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Folders" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Folders</SelectItem>
                  {folders?.map((folder: any) => (
                    <SelectItem key={folder.id} value={folder.id.toString()}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={searchDate}
              onChange={(e) => setSearchDate(e.target.value)}
              className="w-48"
            />
          </div>
        </CardContent>
      </Card>

      {/* Letters Table */}
      {letters?.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Letter</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Folder</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {letters.map((letter: any) => (
                    <tr key={letter.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {/* Show file type icon and file name for debugging, no blue background */}
                          <span className="flex items-center text-2xl">
                            {getFileTypeIcon(letter.fileName) ||
                              getFileTypeIcon(letter.originalFileName) ||
                              getFileTypeIcon(letter.filename) ||
                              getFileTypeIcon(letter.original_name) ||
                              <FileText className="h-5 w-5 text-blue-600" />}
                            <span className="ml-2 text-xs text-gray-400">
                              {letter.fileName || letter.originalFileName || letter.filename || letter.original_name || 'NO FILE NAME'}
                            </span>
                          </span>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{letter.title}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{letter.reference}</div>
                            {letter.fileName && (
                              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                📎 {letter.fileName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {letter.folder?.name || "Unknown"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(letter.status)}`}>
                          {letter.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {new Date(letter.uploadedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {letter.fileName && letter.fileUrl ? (
                            <DocumentPreview
                              fileName={letter.fileName}
                              fileUrl={letter.fileUrl}
                              uploadedAt={new Date(letter.uploadedAt)}
                            >
                              <Button variant="outline" size="sm" className="gap-1">
                                <Eye className="h-3 w-3" />
                                Preview
                              </Button>
                            </DocumentPreview>
                          ) : (
                            <Button variant="outline" size="sm" disabled className="gap-1">
                              <FileText className="h-3 w-3" />
                              No File
                            </Button>
                          )}
                          {letter.fileName && letter.fileUrl && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = letter.fileUrl;
                                link.download = letter.fileName;
                                link.target = '_blank';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              }}
                              className="gap-1"
                            >
                              <Download className="h-3 w-3" />
                              Download
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12">
          <i className="fas fa-envelope-open text-gray-400 text-6xl mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No letters yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Upload your first letter to get started</p>
          <Button onClick={() => setUploadModalOpen(true)}>
            <i className="fas fa-upload mr-2"></i>Upload Letter
          </Button>
        </div>
      )}
    </div>
  );
}
