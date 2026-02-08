import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert } from 'lucide-react';

interface AccessDeniedScreenProps {
  message?: string;
  onBack?: () => void;
}

export default function AccessDeniedScreen({ 
  message = 'You do not have permission to access this section. Admin privileges are required.',
  onBack
}: AccessDeniedScreenProps) {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-3">
          <div className="mx-auto w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center mb-3">
            <ShieldAlert className="w-5 h-5 text-destructive" />
          </div>
          <CardTitle className="text-lg">Access Denied</CardTitle>
          <CardDescription className="text-sm">{message}</CardDescription>
        </CardHeader>
        <CardContent className="text-center pt-0">
          {onBack && (
            <Button onClick={onBack} variant="outline" size="sm">
              Go Back
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
