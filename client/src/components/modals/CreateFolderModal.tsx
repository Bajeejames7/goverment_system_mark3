import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFolderFormSchema } from "@shared/schema";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CreateFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type CreateFolderFormData = z.infer<typeof createFolderFormSchema>;

export default function CreateFolderModal({ open, onOpenChange }: CreateFolderModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<CreateFolderFormData>({
    resolver: zodResolver(createFolderFormSchema),
    defaultValues: {
      name: "",
      description: "",
      department: "",
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (data: CreateFolderFormData) => {
      const response = await apiRequest("POST", "/api/folders", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Folder created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateFolderFormData) => {
    createFolderMutation.mutate(data);
  };

  const departments = [
    "Industry Department",
    "Policy & Regulations",
    "Budget & Finance",
    "Administration",
    "Legal Affairs",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Folder Name</Label>
            <Input
              id="name"
              {...form.register("name")}
              className="mt-1"
              placeholder="Enter folder name"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="department">Department</Label>
            <Select 
              value={form.watch("department")} 
              onValueChange={(value) => form.setValue("department", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.department && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.department.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              className="mt-1"
              placeholder="Describe the purpose of this folder"
              rows={3}
            />
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
              disabled={createFolderMutation.isPending}
            >
              {createFolderMutation.isPending ? "Creating..." : "Create Folder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
