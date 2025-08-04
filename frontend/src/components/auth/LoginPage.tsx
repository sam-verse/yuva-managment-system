import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Shield, Users, ArrowRight, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = await login(email, password);
    if (!success) {
      toast({
        title: "Login Failed",
        description: "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    }
  };

  const demoCredentials = [
    { role: 'Admin', email: 'admin@guild.com', color: 'text-primary' },
    { role: 'Senior Council', email: 'senior@guild.com', color: 'text-accent-orange' },
    { role: 'Junior Council', email: 'junior@guild.com', color: 'text-accent-green' },
    { role: 'Board Member', email: 'board@guild.com', color: 'text-muted-foreground' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left Side - Branding */}
        <div className="hidden lg:block space-y-8 animate-fade-in">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-primary to-primary-hover rounded-xl text-primary-foreground shadow-floating">
                <Shield className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gradient-primary">Guild Hub Control</h1>
                <p className="text-muted-foreground">Professional Club Management</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4 p-4 rounded-xl card-elegant hover-lift">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Role-Based Access</h3>
                <p className="text-sm text-muted-foreground">Secure authentication with granular permissions for Admin, Councils, and Board Members.</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 rounded-xl card-elegant hover-lift">
              <div className="p-2 bg-accent-orange/10 rounded-lg">
                <ArrowRight className="h-5 w-5 text-accent-orange" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Streamlined Workflow</h3>
                <p className="text-sm text-muted-foreground">Manage tasks, users, reports and notes with an intuitive interface designed for productivity.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto animate-scale-in">
          <Card className="card-floating">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to your Guild Hub Control account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="transition-smooth focus:shadow-elegant"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10 transition-smooth focus:shadow-elegant"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  variant="professional"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>

              {/* Demo Credentials */}
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground mb-3 text-center">Demo Credentials (Password: password)</p>
                <div className="grid grid-cols-2 gap-2">
                  {demoCredentials.map((cred) => (
                    <Button
                      key={cred.email}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-2 px-3"
                      onClick={() => {
                        setEmail(cred.email);
                        setPassword('password');
                      }}
                    >
                      <div className="text-center">
                        <div className={`font-semibold ${cred.color}`}>{cred.role}</div>
                        <div className="text-xs text-muted-foreground">{cred.email}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}