import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CreateFolderModal from "@/components/modals/CreateFolderModal";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Letters from "./Letters";
import { FaFolder } from "react-icons/fa";

export default function Folders() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);

  const { data: folders, isLoading } = useQuery({
    queryKey: ["/api/folders"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/folders", {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch folders");
      return res.json();
    },
  });

  const getFolderIcon = (department: string) => {
    const icons: Record<string, string> = {
      "Industry Department": "text-blue-600",
      "Policy & Regulations": "text-green-600",
      "Budget & Finance": "text-yellow-600",
      "Administration": "text-purple-600",
      "Legal Affairs": "text-red-600",
    };
    return icons[department] || "text-gray-600";
  };

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
          Document Folders
        </h2>
        <Button onClick={() => setCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow">
          <i className="fas fa-plus mr-2"></i>Create Folder
        </Button>
      </div>

      {Array.isArray(folders) && folders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {folders.map((folder: any) => (
            <Card
              key={folder.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`h-12 w-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center`}>
                    <FaFolder className="text-yellow-700 text-2xl" style={{ color: '#b8860b' }} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={async () => {
                        if (
                          confirm(
                            `Are you sure you want to delete folder '${folder.name}'?`
                          )
                        ) {
                          await fetch(`/api/folders/${folder.id}`, {
                            method: "DELETE",
                          });
                          window.location.reload();
                        }
                      }}
                    >
                      Delete
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => setOpenFolderId(folder.id)}
                    >
                      Open
                    </Button>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {folder.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {folder.description || "No description provided"}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>{folder.letterCount || 0} letters</span>
                  <span>
                    Updated{" "}
                    {new Date(folder.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <i className="fas fa-folder-open text-gray-400 text-6xl mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No folders yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Create your first folder to organize documents
          </p>
          <Button onClick={() => setCreateModalOpen(true)}>
            <i className="fas fa-plus mr-2"></i>Create Folder
          </Button>
        </div>
      )}

      <CreateFolderModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      {/* Letters Management Modal */}
      <Dialog open={!!openFolderId} onOpenChange={() => setOpenFolderId(null)}>
        <DialogContent className="max-w-4xl w-full mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Letters in Folder</h2>
          </div>
          {openFolderId && <Letters folderId={openFolderId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
