import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, UserPlus, Shield, Eye, Users, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import RegisterUserModal from "@/components/modals/RegisterUserModal";
import { User } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";

// Extended user type with roles array
interface UserWithRoles extends Omit<User, 'password'> {
  roles: string[];
}

export default function UserManagement() {
  const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
  const { user, userRole } = useAuth();

  const { data: users = [], isLoading } = useQuery<UserWithRoles[]>({
    queryKey: ['/api/users'],
  });

  // Helper function to get user's primary role
  const getUserPrimaryRole = (user: UserWithRoles): string => {
    if (user.roles && user.roles.length > 0) {
      // Prioritize admin role
      if (user.roles.includes('admin')) return 'admin';
      if (user.roles.includes('registry')) return 'registry';
      if (user.roles.includes('officer')) return 'officer';
      return user.roles[0]; // Return first role if none of the above
    }
    return 'unknown';
  };

  // Use canAddUsers from auth context
  const { canAddUsers } = useAuth();

  // Check existing role constraints for single-position roles
  const getExistingRoleCounts = () => {
    const counts = {
      secretary: users.filter(u => u.position === 'Secretary').length,
      ps: users.filter(u => u.position === 'PS').length,
      industrial_secretary: users.filter(u => u.position === 'Secretary' && u.department === 'Industrialization').length,
    };
    return counts;
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'registry':
        return 'default';
      case 'officer':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="w-4 h-4" />;
      case 'registry':
        return <Eye className="w-4 h-4" />;
      case 'officer':
        return <Users className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (isActive: boolean | null) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
        Active
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
        Inactive
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Manage system users and their access levels</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const adminUsers = users.filter(user => user.roles && user.roles.includes('admin'));
  const registryUsers = users.filter(user => user.roles && user.roles.includes('registry'));
  const officerUsers = users.filter(user => user.roles && user.roles.includes('officer'));

  const roleCounts = getExistingRoleCounts();

  return (
    <div className="space-y-6">
      {/* Access Control Warning */}
      {!canAddUsers && (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>Access Restricted:</strong> Only ICT Administrators and Registry Management Head can register new users.
          </AlertDescription>
        </Alert>
      )}

      {/* Role Constraints Warning */}
      {canAddUsers && (roleCounts.secretary > 0 || roleCounts.ps > 0) && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <strong>Role Limits:</strong> 
            {roleCounts.secretary > 0 && " Secretary position filled."}
            {roleCounts.ps > 0 && " Principal Secretary position filled."}
            {" Only one person can hold these positions."}
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Manage government hierarchy and user access levels</p>
        </div>
        {canAddUsers && (
          <Button 
            onClick={() => setCreateUserModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Register New User
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
              Administrators
            </CardTitle>
            <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800 dark:text-red-200">{adminUsers.length}</div>
            <p className="text-xs text-red-600 dark:text-red-400">
              Full system access
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800 dark:text-green-200">{users.length}</div>
            <p className="text-xs text-green-600 dark:text-green-400">
              Number of users in the system
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            All System Users
          </CardTitle>
          <CardDescription>
            Complete list of registered users with their roles and access levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No users found. Create your first user to get started.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-300">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(getUserPrimaryRole(user))} className="flex items-center gap-1 w-fit">
                        {getRoleIcon(getUserPrimaryRole(user))}
                        {getUserPrimaryRole(user).charAt(0).toUpperCase() + getUserPrimaryRole(user).slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-300">{user.department}</TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-300">
                      {user.position || 'Not specified'}
                    </TableCell>
                    <TableCell>{getStatusBadge(user.isActive)}</TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-300">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Register User Modal */}
      <RegisterUserModal 
        open={createUserModalOpen} 
        onClose={() => setCreateUserModalOpen(false)} 
      />
    </div>
  );
}