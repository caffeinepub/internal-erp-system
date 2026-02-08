import { useState } from 'react';
import { useBackupExport, useBackupImport, useGetCallerUserRole } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Database, Download, Upload, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import ModulePageHeader from './ModulePageHeader';
import type { BackupData } from '../backend';

export default function AdminBackupModule() {
  const { data: userRole } = useGetCallerUserRole();
  const exportBackup = useBackupExport();
  const importBackup = useBackupImport();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [parsedBackup, setParsedBackup] = useState<BackupData | null>(null);

  const isAdmin = userRole === 'admin';

  const handleExport = async () => {
    try {
      const data = await exportBackup.mutateAsync();
      
      // Convert BigInt to string for JSON serialization
      const jsonData = JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      );
      
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `erp-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Backup exported successfully');
    } catch (error: any) {
      toast.error(`Export failed: ${error.message}`);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Parse and validate the file
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content, (key, value) => {
            // Convert string back to BigInt for specific fields
            if (key === 'id' || key === 'productId' || key === 'quantity' || key === 'stockQuantity' || 
                key === 'createdAt' || key === 'purchaseDate' || key === 'lastUpdated' ||
                key === 'requestedAt' || key === 'paymentReceivedTimestamp') {
              return typeof value === 'string' ? BigInt(value) : value;
            }
            return value;
          });
          
          // Basic validation
          if (!parsed.products || !parsed.contacts || !parsed.estimates || !parsed.purchases) {
            throw new Error('Invalid backup file format');
          }
          
          setParsedBackup(parsed);
          setIsImportDialogOpen(true);
        } catch (error: any) {
          toast.error(`Invalid backup file: ${error.message}`);
          setSelectedFile(null);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleImport = async () => {
    if (!parsedBackup) return;

    try {
      await importBackup.mutateAsync(parsedBackup);
      setIsImportDialogOpen(false);
      setSelectedFile(null);
      setParsedBackup(null);
      toast.success('Backup imported successfully. All data has been restored.');
    } catch (error: any) {
      toast.error(`Import failed: ${error.message}`);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle>Admin Access Required</CardTitle>
            <CardDescription>
              Only administrators can access backup and restore functionality.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ModulePageHeader
        icon={<Database className="w-8 h-8 text-primary" />}
        title="Backup & Restore"
        subtitle="Export and import your ERP data"
      />

      <Alert variant="default" className="border-amber-500/50 bg-amber-500/10">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle>Important</AlertTitle>
        <AlertDescription>
          Importing a backup will <strong>overwrite all current data</strong>. Make sure to export a backup before importing if you want to preserve your current data.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Export Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export Backup
            </CardTitle>
            <CardDescription>
              Download a complete backup of all your data including products, contacts, estimates, purchases, and company branding.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleExport}
              disabled={exportBackup.isPending}
              className="w-full"
            >
              {exportBackup.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Backup
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Import Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Import Backup
            </CardTitle>
            <CardDescription>
              Restore data from a previously exported backup file. This will replace all current data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="backup-file">Select Backup File</Label>
              <Input
                id="backup-file"
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="mt-2"
              />
            </div>
            {selectedFile && (
              <div className="text-sm text-muted-foreground">
                Selected: {selectedFile.name}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Import Confirmation Dialog */}
      <AlertDialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <AlertDialogContent className="bg-card border-2 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirm Data Import
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to import a backup file. This action will:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Delete all current products, contacts, estimates, and purchases</li>
                <li>Replace them with data from the backup file</li>
                <li>Update company branding settings</li>
              </ul>
              <p className="font-semibold text-destructive mt-4">
                This action cannot be undone. Are you sure you want to continue?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setIsImportDialogOpen(false);
              setSelectedFile(null);
              setParsedBackup(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleImport}
              disabled={importBackup.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {importBackup.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Importing...
                </>
              ) : (
                'Import Backup'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
