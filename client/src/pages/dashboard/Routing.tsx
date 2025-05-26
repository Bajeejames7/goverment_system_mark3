import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Settings, ArrowRight, Eye, Edit, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CreateRoutingRuleModal } from "@/components/modals/CreateRoutingRuleModal";

interface RoutingRule {
  id: number;
  name: string;
  department: string;
  targetDepartment: string;
  priority: number;
  isActive: boolean;
  description?: string;
  conditions: {
    title?: string;
    reference?: string;
    keywords?: string[];
    status?: string;
  };
  createdAt: Date;
  createdBy: string;
}

interface DocumentRouting {
  id: number;
  letterId: number;
  fromDepartment: string;
  toDepartment: string;
  status: string;
  routedAt: Date;
  deliveredAt?: Date;
  notes?: string;
  routingRuleId?: number;
}

export default function Routing() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'rules' | 'activity'>('rules');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch routing rules
  const { data: routingRules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['/api/routing-rules'],
    queryFn: () => fetch('/api/routing-rules').then(res => res.json()),
  });

  // Fetch routing activity
  const { data: routingActivity = [], isLoading: activityLoading } = useQuery({
    queryKey: ['/api/document-routing'],
    queryFn: () => fetch('/api/document-routing').then(res => res.json()),
  });

  // Delete routing rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: async (ruleId: number) => {
      return apiRequest("DELETE", `/api/routing-rules/${ruleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routing-rules'] });
      toast({
        title: "Rule Deleted",
        description: "Routing rule has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle rule status
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ ruleId, isActive }: { ruleId: number; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/routing-rules/${ruleId}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/routing-rules'] });
      toast({
        title: "Rule Updated",
        description: "Routing rule status has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'in_transit': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    if (priority >= 5) return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    if (priority >= 3) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Document Routing
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage automated document routing rules and monitor activity
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{routingRules.filter((rule: RoutingRule) => rule.isActive).length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents Routed Today</CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {routingActivity.filter((activity: DocumentRouting) => 
                new Date(activity.routedAt).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Deliveries</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {routingActivity.filter((activity: DocumentRouting) => activity.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {routingActivity.filter((activity: DocumentRouting) => activity.status === 'delivered').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setSelectedTab('rules')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'rules'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Routing Rules
          </button>
          <button
            onClick={() => setSelectedTab('activity')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'activity'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            Routing Activity
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {selectedTab === 'rules' && (
        <Card>
          <CardHeader>
            <CardTitle>Routing Rules</CardTitle>
            <CardDescription>
              Configure automatic document routing based on department rules
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rulesLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Loading routing rules...</p>
              </div>
            ) : routingRules.length === 0 ? (
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No routing rules</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Create your first routing rule to automate document distribution
                </p>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Rule
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {routingRules.map((rule: RoutingRule) => (
                  <div key={rule.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium text-gray-900 dark:text-white">{rule.name}</h3>
                        <Badge className={getPriorityColor(rule.priority)}>
                          Priority {rule.priority}
                        </Badge>
                        <Badge variant={rule.isActive ? "default" : "secondary"}>
                          {rule.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleRuleMutation.mutate({ ruleId: rule.id, isActive: !rule.isActive })}
                        >
                          {rule.isActive ? "Disable" : "Enable"}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deleteRuleMutation.mutate(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span className="font-medium">Route from:</span> {rule.department} 
                      <ArrowRight className="h-4 w-4 mx-2 inline" />
                      <span className="font-medium">To:</span> {rule.targetDepartment}
                    </div>
                    
                    {rule.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{rule.description}</p>
                    )}
                    
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      <span className="font-medium">Conditions:</span> 
                      {rule.conditions.title && ` Title contains "${rule.conditions.title}"`}
                      {rule.conditions.keywords && ` Keywords: ${rule.conditions.keywords.join(', ')}`}
                      {rule.conditions.status && ` Status: ${rule.conditions.status}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedTab === 'activity' && (
        <Card>
          <CardHeader>
            <CardTitle>Routing Activity</CardTitle>
            <CardDescription>
              Track document routing and delivery status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Loading routing activity...</p>
              </div>
            ) : routingActivity.length === 0 ? (
              <div className="text-center py-8">
                <ArrowRight className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No routing activity</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Document routing activity will appear here once rules are triggered
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {routingActivity.map((activity: DocumentRouting) => (
                  <div key={activity.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-900 dark:text-white">
                          Document #{activity.letterId}
                        </span>
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(activity.routedAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <span className="font-medium">From:</span> {activity.fromDepartment} 
                      <ArrowRight className="h-4 w-4 mx-2 inline" />
                      <span className="font-medium">To:</span> {activity.toDepartment}
                    </div>
                    
                    {activity.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{activity.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Routing Rule Modal */}
      <CreateRoutingRuleModal 
        open={isCreateModalOpen} 
        onOpenChange={setIsCreateModalOpen} 
      />
    </div>
  );
}