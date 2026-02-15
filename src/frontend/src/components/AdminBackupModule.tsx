import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Download, Upload, AlertTriangle } from 'lucide-react';
import { exportBackupToFile, importBackupFromFile } from '../utils/backupFileIO';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function AdminBackupModule() {
  const queryClient = useQueryClient();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportBackupToFile();
      toast.success('Backup exported successfully');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setIsConfirmDialogOpen(true);
    }
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setIsConfirmDialogOpen(false);

    try {
      await importBackupFromFile(selectedFile);
      
      // Invalidate all queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['companyBranding'] });
      
      toast.success('Backup restored successfully');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsImporting(false);
      setSelectedFile(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Backup & Restore</h2>
        <p className="text-muted-foreground">
          Export and import your application data (works offline)
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Export Backup</CardTitle>
            <CardDescription>
              Download all your data as a single JSON file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExport} disabled={isExporting} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export Backup'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Import Backup</CardTitle>
            <CardDescription>
              Restore data from a backup file (will overwrite existing data)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <label htmlFor="backup-file-input">
              <Button asChild disabled={isImporting} className="w-full">
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  {isImporting ? 'Importing...' : 'Import Backup'}
                </span>
              </Button>
            </label>
            <input
              id="backup-file-input"
              type="file"
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </CardContent>
        </Card>
      </div>

      <Card className="border-warning">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle className="w-5 h-5" />
            Important Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• Backup files are stored locally on your device</p>
          <p>• Importing a backup will overwrite all existing data</p>
          <p>• Backup and restore work offline without internet connection</p>
          <p>• Keep your backup files safe and secure</p>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Data Overwrite</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all existing data and replace it with the backup file.
              This action cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedFile(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmImport}>
              Yes, Restore Backup
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
