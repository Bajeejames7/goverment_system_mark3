import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { uploadLetterFormSchema } from "@shared/schema";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface UploadLetterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type UploadLetterFormData = z.infer<typeof uploadLetterFormSchema>;

export default function UploadLetterModal({ open, onOpenChange }: UploadLetterModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const form = useForm<UploadLetterFormData>({
    resolver: zodResolver(uploadLetterFormSchema),
    defaultValues: {
      title: "",
      reference: "",
      content: "",
      folderId: 0,
    },
  });

  const { data: folders } = useQuery({
    queryKey: ["/api/folders"],
  });

  const uploadLetterMutation = useMutation({
    mutationFn: async (data: UploadLetterFormData) => {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });
      if (selectedFile) {
        formData.append("file", selectedFile);
      }
      
      const response = await fetch("/api/letters/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Letter uploaded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/letters"] });
      onOpenChange(false);
      form.reset();
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UploadLetterFormData) => {
    uploadLetterMutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Upload Letter</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Letter Title</Label>
            <Input
              id="title"
              {...form.register("title")}
              className="mt-1"
              placeholder="Enter letter title"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.title.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="reference">Reference Number</Label>
            <Input
              id="reference"
              {...form.register("reference")}
              className="mt-1"
              placeholder="e.g., IND-2024-001"
            />
            {form.formState.errors.reference && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.reference.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="folderId">Folder</Label>
            <Select 
              value={form.watch("folderId").toString()} 
              onValueChange={(value) => form.setValue("folderId", parseInt(value))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select folder" />
              </SelectTrigger>
              <SelectContent>
                {folders?.map((folder: any) => (
                  <SelectItem key={folder.id} value={folder.id.toString()}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.folderId && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.folderId.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="content">Content/Description</Label>
            <Textarea
              id="content"
              {...form.register("content")}
              className="mt-1"
              placeholder="Brief description of the letter content"
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="file">Attach File (Optional)</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              className="mt-1"
              accept=".pdf,.doc,.docx,.txt"
            />
            {selectedFile && (
              <p className="text-sm text-gray-600 mt-1">Selected: {selectedFile.name}</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={uploadLetterMutation.isPending}
            >
              {uploadLetterMutation.isPending ? "Uploading..." : "Upload Letter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
