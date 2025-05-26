import { Card, CardContent } from "@/components/ui/card";

export default function Reports() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h2>
      
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <i className="fas fa-chart-bar text-blue-600 text-6xl mb-4"></i>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Analytics Dashboard</h3>
            <p className="text-gray-600 dark:text-gray-400">Comprehensive reporting features in development</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
