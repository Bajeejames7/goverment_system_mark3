import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CreateRoutingRuleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const createRoutingRuleFormSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  department: z.string().min(1, "Department is required"),
  targetDepartment: z.string().min(1, "Target department is required"),
  priority: z.number().min(0).max(10).default(5),
  description: z.string().optional(),
  conditions: z.object({
    title: z.string().optional(),
    reference: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    status: z.string().optional(),
  }),
});

type CreateRoutingRuleFormData = z.infer<typeof createRoutingRuleFormSchema>;

const departments = [
  "Administration",
  "Finance",
  "Human Resources",
  "Legal",
  "Operations",
  "Planning",
  "ICT",
  "Procurement",
  "Audit",
  "Registry"
];

const documentStatuses = [
  "draft",
  "pending",
  "verified",
  "active",
  "archived"
];

export default function CreateRoutingRuleModal({ open, onOpenChange }: CreateRoutingRuleModalProps) {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateRoutingRuleFormData>({
    resolver: zodResolver(createRoutingRuleFormSchema),
    defaultValues: {
      name: "",
      department: "",
      targetDepartment: "",
      priority: 5,
      description: "",
      conditions: {
        title: "",
        reference: "",
        keywords: [],
        status: "",
      },
    },
  });

  const createRuleMutation = useMutation({
    mutationFn: async (data: CreateRoutingRuleFormData) => {
      const payload = {
        ...data,
        conditions: {
          ...data.conditions,
          keywords,
        },
      };
      return apiRequest("POST", "/api/routing-rules", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routing-rules'] });
      toast({
        title: "Success",
        description: "Routing rule created successfully.",
      });
      onOpenChange(false);
      form.reset();
      setKeywords([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateRoutingRuleFormData) => {
    createRuleMutation.mutate(data);
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Routing Rule</DialogTitle>
          <DialogDescription>
            Configure automatic document routing based on conditions and department rules.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rule Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Contract Documents to Legal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetDepartment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Department</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select target department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority (0-10)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0" 
                        max="10" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe when this rule should be applied..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Routing Conditions */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Routing Conditions</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Documents will be routed when they match these conditions. Leave empty to match all documents.
              </p>

              <FormField
                control={form.control}
                name="conditions.title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title Contains</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Contract, Agreement, Invoice" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="conditions.reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference Contains</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., LEG, FIN, ADM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="conditions.status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Any Status</SelectItem>
                        {documentStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Keywords */}
              <div className="space-y-2">
                <Label>Content Keywords</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add keyword"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  />
                  <Button type="button" onClick={addKeyword} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {keywords.map((keyword, index) => (
                      <div key={index} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-sm">
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(index)}
                          className="hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createRuleMutation.isPending}>
                {createRuleMutation.isPending ? "Creating..." : "Create Rule"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}