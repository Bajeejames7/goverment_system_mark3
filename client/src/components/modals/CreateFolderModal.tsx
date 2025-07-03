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
import React, { useState } from "react";

interface CreateFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type CreateFolderFormData = z.infer<typeof createFolderFormSchema>;

export default function CreateFolderModal({ open, onOpenChange }: CreateFolderModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [submitDebug, setSubmitDebug] = useState<string>("");

  const form = useForm<CreateFolderFormData>({
    resolver: zodResolver(createFolderFormSchema),
    defaultValues: {
      name: "",
      description: "",
      department: "Industry Department", // always default
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: async (data: CreateFolderFormData) => {
      setSubmitDebug("Submitting: " + JSON.stringify(data));
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
      setSubmitDebug("Success: Folder created");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Folder creation unsuccessful.",
        variant: "destructive",
      });
      setSubmitDebug("Error: " + error.message);
    },
  });

  const onSubmit = (data: CreateFolderFormData) => {
    setSubmitDebug("onSubmit called: " + JSON.stringify(data));
    createFolderMutation.mutate({ ...data, department: "Industry Department" }); // always submit as Industry Department
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
        </DialogHeader>
        {/* Debug info */}
        <div className="mb-2 p-2 bg-yellow-100 text-yellow-800 rounded text-xs">
          <div>Form State: {JSON.stringify(form.getValues())}</div>
          <div>Errors: {JSON.stringify(form.formState.errors)}</div>
          <div>{submitDebug}</div>
        </div>
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
          <div style={{ display: 'none' }}>
            {/* Hide department field, but keep it in the form for backend compatibility */}
            <Input id="department" value="Industry Department" readOnly {...form.register("department")}/>
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
            {form.formState.errors.description && (
              <p className="text-sm text-red-600 mt-1">{form.formState.errors.description.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={createFolderMutation.isPending}>
            {createFolderMutation.isPending ? "Creating..." : "Create Folder"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
