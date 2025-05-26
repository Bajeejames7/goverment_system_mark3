import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/SimpleAuthContext";

export default function SimpleLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [, setLocation] = useLocation();

  const { login } = useAuth();
  
  const handleLogin = () => {
    // Simple direct login for ICT Admin
    if (email === "jamesbajee3579@gmail.com" && password === "J@m3$b@j33") {
      // Store user data
      const userData = {
        id: 1,
        email: "jamesbajee3579@gmail.com",
        name: "James Bajee",
        role: "admin",
        department: "ICT",
        position: "department_head",
        canAddUsers: true
      };
      
      login(userData);
      
      toast({
        title: "Welcome back!",
        description: "ICT Administrator access granted",
      });
      
      setLocation("/dashboard");
    } else {
      toast({
        title: "Login Failed",
        description: "Invalid credentials",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>ICT Administrator Login</CardTitle>
          <CardDescription>Access the RMU System</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button onClick={handleLogin} className="w-full">
            Sign In
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}