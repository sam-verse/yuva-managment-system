import heroImage from "@/assets/hero-dashboard.jpg";
import { Button } from "@/components/ui/button";
import { Shield, ArrowRight } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <div className="max-w-6xl mx-auto text-center space-y-8 animate-fade-in">
        <div className="space-y-6">
          <div className="flex items-center justify-center space-x-3 mb-8">
            <div className="p-3 bg-gradient-to-br from-primary to-primary-hover rounded-xl text-primary-foreground shadow-floating">
              <Shield className="h-8 w-8" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gradient-primary">
              Guild Hub Control
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
            Professional club management system with role-based access control, 
            task management, and comprehensive reporting.
          </p>
          
          <div className="relative max-w-4xl mx-auto">
            <img 
              src={heroImage} 
              alt="Guild Hub Control Dashboard" 
              className="rounded-xl shadow-floating border border-border/50 w-full"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="professional" size="xl" className="text-lg">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="xl" className="text-lg">
              Learn More
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16">
          <div className="p-6 card-elegant text-center hover-lift">
            <h3 className="text-lg font-semibold mb-2">Role-Based Access</h3>
            <p className="text-sm text-muted-foreground">Secure permissions for Admin, Senior Council, Junior Council, and Board Members.</p>
          </div>
          <div className="p-6 card-elegant text-center hover-lift">
            <h3 className="text-lg font-semibold mb-2">Task Management</h3>
            <p className="text-sm text-muted-foreground">Create, assign, and track tasks across all organizational levels.</p>
          </div>
          <div className="p-6 card-elegant text-center hover-lift">
            <h3 className="text-lg font-semibold mb-2">Comprehensive Reports</h3>
            <p className="text-sm text-muted-foreground">Detailed analytics and performance tracking for informed decision-making.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
