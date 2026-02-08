import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Shield, Users, TrendingUp, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 mb-2">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-1">Internal ERP System</h1>
          <p className="text-sm text-muted-foreground">
            Comprehensive business management platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="w-4 h-4 text-primary" />
                Optional Authentication
              </CardTitle>
              <CardDescription className="text-xs">
                Login with Internet Identity for personalized access and data persistence
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={login}
                disabled={isLoggingIn}
                className="w-full h-9 text-sm"
              >
                {isLoggingIn ? (
                  <>
                    <div className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                    Logging in...
                  </>
                ) : (
                  <>
                    Login with Internet Identity
                    <ArrowRight className="ml-2 w-3.5 h-3.5" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-4 h-4 text-primary" />
                Role-Based Features
              </CardTitle>
              <CardDescription className="text-xs">
                Admin and Manager roles unlock additional capabilities
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <Card>
            <CardHeader className="pb-3">
              <TrendingUp className="w-5 h-5 text-primary mb-1" />
              <CardTitle className="text-sm">Dashboard & KPIs</CardTitle>
              <CardDescription className="text-xs">
                Real-time insights into sales, inventory, and financial metrics
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Building2 className="w-5 h-5 text-primary mb-1" />
              <CardTitle className="text-sm">Inventory Management</CardTitle>
              <CardDescription className="text-xs">
                Track stock levels, categories, and product availability
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <Users className="w-5 h-5 text-primary mb-1" />
              <CardTitle className="text-sm">Customer & Supplier</CardTitle>
              <CardDescription className="text-xs">
                Manage contacts and maintain business relationships
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>

      <div className="mt-8 text-xs text-muted-foreground font-mono font-semibold">
        Version 36
      </div>
    </div>
  );
}
