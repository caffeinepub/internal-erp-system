import { useState, useEffect } from 'react';
import {
  useGetAllEstimates,
  useRecordEstimatePayment,
  useGetCallerUserRole,
  useGetBillToContacts,
  useGetAllProducts,
  useGetCompanyBranding,
  useSetCompanyBranding,
  usePrintEstimate,
} from '../hooks/useQueries';
import { useHashRoute } from '../hooks/useHashRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Printer, Settings, Edit, DollarSign } from 'lucide-react';
import type { Estimate } from '../backend';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';
import { indexedDB } from '../utils/indexedDbClient';

export default function BillingModule() {
  const { data: estimates = [], isLoading } = useGetAllEstimates();
  const { data: companyBranding } = useGetCompanyBranding();
  const { data: userRole } = useGetCallerUserRole();
  const recordPayment = useRecordEstimatePayment();
  const setCompanyBranding = useSetCompanyBranding();
  const { navigate } = useHashRoute();

  const isAdmin = userRole === 'admin';

  const [isBrandingDialogOpen, setIsBrandingDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [estimateForPayment, setEstimateForPayment] = useState<Estimate | null>(null);
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [paymentDateTimeInput, setPaymentDateTimeInput] = useState('');
  const [paymentError, setPaymentError] = useState('');

  const [brandingForm, setBrandingForm] = useState({
    name: 'PN TRADING',
    address: '121 Gopi Krishna Vihar Colony Ahmedabad',
    logoFile: null as File | null,
    logoPreview: '',
  });

  useEffect(() => {
    if (companyBranding) {
      setBrandingForm({
        name: companyBranding.name || 'PN TRADING',
        address: companyBranding.address || '121 Gopi Krishna Vihar Colony Ahmedabad',
        logoFile: null,
        logoPreview: companyBranding.logo?.getDirectURL() || '',
      });
    }
  }, [companyBranding]);

  // Sync estimates to IndexedDB
  useEffect(() => {
    if (estimates.length > 0) {
      estimates.forEach((estimate) => {
        indexedDB.put('estimates', estimate);
      });
    }
  }, [estimates]);

  const openPaymentDialog = (estimate: Estimate) => {
    setEstimateForPayment(estimate);
    setPaidAmountInput(estimate.paidAmount.toString());
    
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const defaultDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    setPaymentDateTimeInput(defaultDateTime);
    
    setPaymentError('');
    setIsPaymentDialogOpen(true);
  };

  const handleRecordPayment = () => {
    if (!estimateForPayment) return;

    const paidAmount = parseFloat(paidAmountInput);

    if (isNaN(paidAmount)) {
      setPaymentError('Please enter a valid amount');
      return;
    }

    if (paidAmount < 0) {
      setPaymentError('Paid amount cannot be negative');
      return;
    }

    if (paidAmount > estimateForPayment.totalAmount) {
      setPaymentError('Paid amount cannot exceed total amount');
      return;
    }

    if (!paymentDateTimeInput) {
      setPaymentError('Please select a payment date and time');
      return;
    }

    setPaymentError('');

    recordPayment.mutate(
      {
        estimateId: estimateForPayment.id,
        paidAmount,
      },
      {
        onSuccess: async () => {
          // Update IndexedDB
          const updatedEstimate = {
            ...estimateForPayment,
            paidAmount,
            pendingAmount: estimateForPayment.totalAmount - paidAmount,
            isPaid: paidAmount >= estimateForPayment.totalAmount,
            paymentReceivedTimestamp: BigInt(Date.now() * 1000000),
          };
          await indexedDB.put('estimates', updatedEstimate);

          setIsPaymentDialogOpen(false);
          setEstimateForPayment(null);
          setPaidAmountInput('');
          setPaymentDateTimeInput('');
          toast.success('Payment recorded successfully');
        },
      }
    );
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBrandingForm({
        ...brandingForm,
        logoFile: file,
        logoPreview: URL.createObjectURL(file),
      });
    }
  };

  const handleSaveBranding = async () => {
    let logoBlob: ExternalBlob | null = null;

    if (brandingForm.logoFile) {
      const arrayBuffer = await brandingForm.logoFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      logoBlob = ExternalBlob.fromBytes(uint8Array);
    } else if (companyBranding?.logo) {
      logoBlob = companyBranding.logo;
    }

    setCompanyBranding.mutate(
      {
        name: brandingForm.name,
        address: brandingForm.address,
        logo: logoBlob,
      },
      {
        onSuccess: async () => {
          // Update IndexedDB
          const branding = {
            name: brandingForm.name,
            address: brandingForm.address,
            logo: logoBlob || undefined,
          };
          await indexedDB.put('companyBranding', branding, 'default');
          setIsBrandingDialogOpen(false);
        },
      }
    );
  };

  const formatPaymentTimestamp = (timestamp: bigint | undefined) => {
    if (!timestamp) return '—';
    try {
      const date = new Date(Number(timestamp) / 1000000);
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="w-8 h-8" />
            Billing & Estimates
          </h2>
          <p className="text-muted-foreground">Create and manage estimates for PN TRADING</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <Button variant="outline" onClick={() => setIsBrandingDialogOpen(true)}>
                <Settings className="w-4 h-4 mr-2" />
                Company Branding
              </Button>
              <Button onClick={() => navigate({ type: 'estimate-editor', mode: 'create' })}>
                <Plus className="w-4 h-4 mr-2" />
                Create Estimate
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estimates</CardTitle>
          <CardDescription>View and manage all estimates</CardDescription>
        </CardHeader>
        <CardContent>
          {estimates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No estimates yet</p>
              {isAdmin && (
                <Button onClick={() => navigate({ type: 'estimate-editor', mode: 'create' })}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Estimate
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estimate #</TableHead>
                    <TableHead>Bill To</TableHead>
                    <TableHead>Created Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Payment Received</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estimates.map((estimate) => (
                    <TableRow key={estimate.id.toString()}>
                      <TableCell className="font-medium">EST-{estimate.id.toString().padStart(4, '0')}</TableCell>
                      <TableCell>{estimate.customerName}</TableCell>
                      <TableCell>
                        {new Date(Number(estimate.createdAt) / 1000000).toLocaleString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>₹{estimate.netAmount.toFixed(2)}</TableCell>
                      <TableCell>₹{estimate.paidAmount.toFixed(2)}</TableCell>
                      <TableCell className={estimate.pendingAmount > 0 ? 'text-destructive font-semibold' : ''}>
                        ₹{estimate.pendingAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {formatPaymentTimestamp(estimate.paymentReceivedTimestamp)}
                      </TableCell>
                      <TableCell>
                        {estimate.isPaid ? (
                          <Badge variant="secondary">Paid</Badge>
                        ) : (
                          <Badge variant="outline">Unpaid</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate({ type: 'estimate-print', id: estimate.id.toString() })}
                            title="Print"
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate({ type: 'estimate-editor', mode: 'edit', id: estimate.id.toString() })}
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openPaymentDialog(estimate)}
                                title="Record Payment"
                              >
                                <DollarSign className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Branding Dialog */}
      <Dialog open={isBrandingDialogOpen} onOpenChange={setIsBrandingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Company Branding</DialogTitle>
            <DialogDescription>
              Update your company information for estimates and invoices
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={brandingForm.name}
                onChange={(e) => setBrandingForm({ ...brandingForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-address">Address</Label>
              <Input
                id="company-address"
                value={brandingForm.address}
                onChange={(e) => setBrandingForm({ ...brandingForm, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-logo">Logo</Label>
              <Input
                id="company-logo"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
              />
              {brandingForm.logoPreview && (
                <img
                  src={brandingForm.logoPreview}
                  alt="Logo preview"
                  className="mt-2 h-20 object-contain"
                />
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBrandingDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBranding} disabled={setCompanyBranding.isPending}>
              {setCompanyBranding.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Update payment information for estimate{' '}
              {estimateForPayment && `EST-${estimateForPayment.id.toString().padStart(4, '0')}`}
            </DialogDescription>
          </DialogHeader>
          {estimateForPayment && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Total Amount</Label>
                <div className="text-lg font-semibold">₹{estimateForPayment.totalAmount.toFixed(2)}</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paid-amount">Paid Amount</Label>
                <Input
                  id="paid-amount"
                  type="number"
                  step="0.01"
                  value={paidAmountInput}
                  onChange={(e) => setPaidAmountInput(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment-datetime">Payment Date & Time</Label>
                <Input
                  id="payment-datetime"
                  type="datetime-local"
                  value={paymentDateTimeInput}
                  onChange={(e) => setPaymentDateTimeInput(e.target.value)}
                />
              </div>
              {paymentError && (
                <p className="text-sm text-destructive">{paymentError}</p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={recordPayment.isPending}>
              {recordPayment.isPending ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
