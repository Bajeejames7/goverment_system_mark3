import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Overview() {
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  const { data: recentLetters } = useQuery({
    queryKey: ["/api/letters/recent"],
  });

  const { data: activityLogs } = useQuery({
    queryKey: ["/api/audit-logs/recent"],
  });

  const statsData = stats || {
    totalFolders: 0,
    activeLetters: 0,
    pendingVerification: 0,
    activeUsers: 0,
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      verified: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  const getActivityIcon = (action: string) => {
    const icons = {
      verify: "fas fa-check text-green-600",
      upload: "fas fa-upload text-blue-600",
      create: "fas fa-user-plus text-purple-600",
      update: "fas fa-edit text-orange-600",
    };
    return icons[action as keyof typeof icons] || "fas fa-info-circle text-gray-600";
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <i className="fas fa-folder text-blue-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Folders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{statsData.totalFolders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <i className="fas fa-envelope text-green-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Letters</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{statsData.activeLetters}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <i className="fas fa-clock text-yellow-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Verification</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{statsData.pendingVerification}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <i className="fas fa-users text-purple-600 text-xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{statsData.activeUsers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Letters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLetters?.length > 0 ? (
                recentLetters.map((letter: any) => (
                  <div key={letter.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <i className="fas fa-file-alt text-white"></i>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{letter.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(letter.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(letter.status)}`}>
                      {letter.status}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-inbox text-gray-400 text-3xl mb-2"></i>
                  <p className="text-gray-500 dark:text-gray-400">No recent letters</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityLogs?.length > 0 ? (
                activityLogs.map((log: any) => (
                  <div key={log.id} className="flex items-start">
                    <div className="h-8 w-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <i className={`${getActivityIcon(log.action)} text-sm`}></i>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-gray-900 dark:text-white">{log.details?.description || log.action}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <i className="fas fa-clock text-gray-400 text-3xl mb-2"></i>
                  <p className="text-gray-500 dark:text-gray-400">No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
