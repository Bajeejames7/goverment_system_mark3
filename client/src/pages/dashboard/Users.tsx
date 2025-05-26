import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import CreateUserModal from "@/components/modals/CreateUserModal";

export default function Users() {
  const { isAdmin } = useAuth();
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ["/api/users"],
    enabled: isAdmin,
  });

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: "text-purple-600",
      registry: "text-blue-600",
      officer: "text-green-600",
    };
    return colors[role as keyof typeof colors] || "text-gray-600";
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-lock text-gray-400 text-6xl mb-4"></i>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Access Denied</h3>
        <p className="text-gray-500 dark:text-gray-400">Only administrators can access user management</p>
      </div>
    );
  }

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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
        <Button onClick={() => setCreateModalOpen(true)}>
          <i className="fas fa-user-plus mr-2"></i>Create User
        </Button>
      </div>

      {/* Users Table */}
      {users?.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((user: any) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">{getInitials(user.name)}</span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium capitalize ${getRoleColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {user.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(user.isActive)}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-700 mr-3">Edit</button>
                        <button className={`${user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}>
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
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
          <i className="fas fa-users text-gray-400 text-6xl mb-4"></i>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No users yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Create your first user account</p>
          <Button onClick={() => setCreateModalOpen(true)}>
            <i className="fas fa-user-plus mr-2"></i>Create User
          </Button>
        </div>
      )}

      <CreateUserModal 
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />
    </div>
  );
}
