import { Card, CardContent } from "@/components/ui/card";

export default function Verification() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Document Verification</h2>
      
      <Card>
        <CardContent className="p-8">
          <div className="text-center">
            <i className="fas fa-shield-check text-blue-600 text-6xl mb-4"></i>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Verification System</h3>
            <p className="text-gray-600 dark:text-gray-400">Advanced document verification features coming soon</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
