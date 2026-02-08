import { useState, useEffect } from 'react';
import {
  useGetAllEstimates,
  useCreateEstimate,
  useUpdateEstimate,
  useRecordEstimatePayment,
  useGetCallerUserRole,
  useGetBillToContacts,
  useGetAllProducts,
  useGetCompanyBranding,
  useSetCompanyBranding,
  usePrintEstimate,
} from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Plus, Printer, Settings, X, Edit, AlertCircle, DollarSign } from 'lucide-react';
import type { Estimate, EstimateItem, Variant_wholesaler_retailer, EstimatePrintData } from '../backend';
import { ExternalBlob } from '../backend';
import EstimatePrintView from './EstimatePrintView';
import ProductAutocomplete from './ProductAutocomplete';
import { toast } from 'sonner';
import { useBluetoothThermalPrinter } from '../hooks/useBluetoothThermalPrinter';

export default function BillingModule() {
  const { data: estimates = [], isLoading } = useGetAllEstimates();
  const { data: billToContacts = [] } = useGetBillToContacts();
  const { data: products = [] } = useGetAllProducts();
  const { data: companyBranding } = useGetCompanyBranding();
  const { data: userRole } = useGetCallerUserRole();
  const createEstimate = useCreateEstimate();
  const updateEstimate = useUpdateEstimate();
  const recordPayment = useRecordEstimatePayment();
  const setCompanyBranding = useSetCompanyBranding();
  const printEstimate = usePrintEstimate();

  // Bluetooth printer hook - session-scoped state
  const bluetoothPrinter = useBluetoothThermalPrinter();

  const isAdmin = userRole === 'admin';

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBrandingDialogOpen, setIsBrandingDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null);
  const [estimateForPayment, setEstimateForPayment] = useState<Estimate | null>(null);
  const [printData, setPrintData] = useState<EstimatePrintData | null>(null);
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [paymentDateTimeInput, setPaymentDateTimeInput] = useState('');
  const [paymentError, setPaymentError] = useState('');

  const [estimateForm, setEstimateForm] = useState({
    customerName: '',
    customerAddress: '',
    contactCategory: 'wholesaler' as Variant_wholesaler_retailer,
    lineItems: [] as EstimateItem[],
  });

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

  const [currentLineItem, setCurrentLineItem] = useState({
    productId: '',
    description: '',
    quantity: '',
    rate: '',
  });

  const resetEstimateForm = () => {
    setEstimateForm({
      customerName: '',
      customerAddress: '',
      contactCategory: 'wholesaler' as Variant_wholesaler_retailer,
      lineItems: [],
    });
    setCurrentLineItem({
      productId: '',
      description: '',
      quantity: '',
      rate: '',
    });
  };

  const handleCustomerSelect = (customerId: string) => {
    const customer = billToContacts.find((c) => c.id.toString() === customerId);
    if (customer) {
      setEstimateForm({
        ...estimateForm,
        customerName: customer.name,
        customerAddress: customer.contactInfo,
        contactCategory: customer.contactCategory,
      });
    }
  };

  const handleProductSelect = (productId: string, product: any) => {
    if (product) {
      setCurrentLineItem({
        ...currentLineItem,
        productId,
        description: product.name,
        rate: product.price.toString(),
      });
    }
  };

  const addLineItem = () => {
    if (!currentLineItem.description || !currentLineItem.quantity || !currentLineItem.rate) {
      return;
    }

    const quantity = parseFloat(currentLineItem.quantity);
    const rate = parseFloat(currentLineItem.rate);
    const amount = quantity * rate;

    const newItem: EstimateItem = {
      description: currentLineItem.description,
      quantity,
      rate,
      amount,
    };

    setEstimateForm({
      ...estimateForm,
      lineItems: [...estimateForm.lineItems, newItem],
    });

    setCurrentLineItem({
      productId: '',
      description: '',
      quantity: '',
      rate: '',
    });
  };

  const removeLineItem = (index: number) => {
    setEstimateForm({
      ...estimateForm,
      lineItems: estimateForm.lineItems.filter((_, i) => i !== index),
    });
  };

  const calculateTotals = () => {
    const totalAmount = estimateForm.lineItems.reduce((sum, item) => sum + item.amount, 0);
    const netAmount = totalAmount;
    return { totalAmount, netAmount };
  };

  const handleCreateEstimate = async () => {
    if (!estimateForm.customerName || estimateForm.lineItems.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const { totalAmount, netAmount } = calculateTotals();

    createEstimate.mutate(
      {
        customerName: estimateForm.customerName,
        customerAddress: estimateForm.customerAddress,
        lineItems: estimateForm.lineItems,
        totalAmount,
        netAmount,
      },
      {
        onSuccess: () => {
          setIsCreateDialogOpen(false);
          resetEstimateForm();
        },
      }
    );
  };

  const openEditDialog = (estimate: Estimate) => {
    setSelectedEstimate(estimate);
    setEstimateForm({
      customerName: estimate.customerName,
      customerAddress: estimate.customerAddress,
      contactCategory: 'wholesaler' as Variant_wholesaler_retailer,
      lineItems: [...estimate.lineItems],
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateEstimate = () => {
    if (!selectedEstimate || !estimateForm.customerName || estimateForm.lineItems.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const { totalAmount, netAmount } = calculateTotals();

    updateEstimate.mutate(
      {
        id: selectedEstimate.id,
        customerName: estimateForm.customerName,
        customerAddress: estimateForm.customerAddress,
        lineItems: estimateForm.lineItems,
        totalAmount,
        netAmount,
        isPaid: selectedEstimate.isPaid,
        pendingAmount: selectedEstimate.pendingAmount,
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false);
          setSelectedEstimate(null);
          resetEstimateForm();
        },
      }
    );
  };

  const openPaymentDialog = (estimate: Estimate) => {
    setEstimateForPayment(estimate);
    setPaidAmountInput(estimate.paidAmount.toString());
    
    // Set default date-time to current local date-time
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

    // Validation
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

    // Note: The backend currently doesn't accept the timestamp parameter
    // It will automatically set the timestamp to Time.now()
    // The selected date/time is validated but not sent to backend yet
    recordPayment.mutate(
      {
        estimateId: estimateForPayment.id,
        paidAmount,
      },
      {
        onSuccess: () => {
          setIsPaymentDialogOpen(false);
          setEstimateForPayment(null);
          setPaidAmountInput('');
          setPaymentDateTimeInput('');
          toast.info('Payment recorded with current timestamp (custom date/time not yet supported by backend)');
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
        onSuccess: () => {
          setIsBrandingDialogOpen(false);
        },
      }
    );
  };

  const openPrintDialog = async (estimate: Estimate) => {
    try {
      const data = await printEstimate.mutateAsync(estimate.id);
      setPrintData(data);
      setIsPrintDialogOpen(true);
    } catch (error) {
      console.error('Failed to load print data:', error);
    }
  };

  // Calculate pending amounts for Bill To contacts
  const calculatePendingAmount = (contactName: string) => {
    const contactEstimates = estimates.filter(
      (est) => est.customerName === contactName && !est.isPaid
    );
    return contactEstimates.reduce((sum, est) => sum + est.pendingAmount, 0);
  };

  // Get pending amount for currently selected customer in form
  const getCurrentCustomerPendingAmount = () => {
    if (!estimateForm.customerName) return 0;
    return calculatePendingAmount(estimateForm.customerName);
  };

  // Format payment received timestamp
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

  const { totalAmount, netAmount } = calculateTotals();

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
              <Button onClick={() => setIsCreateDialogOpen(true)}>
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
                <Button onClick={() => setIsCreateDialogOpen(true)}>
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
                            size="sm"
                            onClick={() => openPrintDialog(estimate)}
                          >
                            <Printer className="w-4 h-4" />
                          </Button>
                          {isAdmin && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openPaymentDialog(estimate)}
                                title="Record Payment"
                              >
                                <DollarSign className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(estimate)}
                              >
                                <Edit className="w-4 h-4" />
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

      {/* Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Enter the payment amount received for this estimate
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {estimateForPayment && (
              <>
                <div className="space-y-2">
                  <Label>Estimate #</Label>
                  <div className="text-sm font-medium">EST-{estimateForPayment.id.toString().padStart(4, '0')}</div>
                </div>
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <div className="text-sm">{estimateForPayment.customerName}</div>
                </div>
                <div className="space-y-2">
                  <Label>Total Amount</Label>
                  <div className="text-sm font-medium">₹{estimateForPayment.totalAmount.toFixed(2)}</div>
                </div>
                <div className="space-y-2">
                  <Label>Current Paid Amount</Label>
                  <div className="text-sm">₹{estimateForPayment.paidAmount.toFixed(2)}</div>
                </div>
                <div className="space-y-2">
                  <Label>Current Pending Amount</Label>
                  <div className="text-sm text-destructive font-semibold">₹{estimateForPayment.pendingAmount.toFixed(2)}</div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="paid-amount">New Paid Amount *</Label>
                  <Input
                    id="paid-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={estimateForPayment.totalAmount}
                    value={paidAmountInput}
                    onChange={(e) => setPaidAmountInput(e.target.value)}
                    placeholder="Enter paid amount"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-datetime">Payment Date & Time *</Label>
                  <Input
                    id="payment-datetime"
                    type="datetime-local"
                    value={paymentDateTimeInput}
                    onChange={(e) => setPaymentDateTimeInput(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Note: Custom date/time is not yet supported by backend. Current timestamp will be used.
                  </p>
                </div>
                {paymentError && (
                  <div className="flex items-center gap-2 text-sm text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    {paymentError}
                  </div>
                )}
              </>
            )}
          </div>
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

      {/* Create Estimate Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Estimate</DialogTitle>
            <DialogDescription>Fill in the estimate details</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Bill To Contact</Label>
                <Select onValueChange={handleCustomerSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {billToContacts.map((contact) => (
                      <SelectItem key={contact.id.toString()} value={contact.id.toString()}>
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-name">Customer Name *</Label>
                <Input
                  id="customer-name"
                  value={estimateForm.customerName}
                  onChange={(e) => setEstimateForm({ ...estimateForm, customerName: e.target.value })}
                  placeholder="Enter customer name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-address">Customer Address</Label>
              <Textarea
                id="customer-address"
                value={estimateForm.customerAddress}
                onChange={(e) => setEstimateForm({ ...estimateForm, customerAddress: e.target.value })}
                placeholder="Enter customer address"
                rows={2}
              />
            </div>

            {getCurrentCustomerPendingAmount() > 0 && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <div className="text-sm">
                  <span className="font-semibold">Previous Pending Amount: </span>
                  <span className="text-destructive font-bold">₹{getCurrentCustomerPendingAmount().toFixed(2)}</span>
                </div>
              </div>
            )}

            <Separator />

            {/* Line Items Section */}
            <div className="space-y-4">
              <h3 className="font-semibold">Line Items</h3>

              {/* Add Line Item Form */}
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4 space-y-2">
                  <Label>Product</Label>
                  <ProductAutocomplete
                    products={products}
                    value={currentLineItem.productId}
                    onSelect={handleProductSelect}
                    placeholder="Search product..."
                  />
                </div>
                <div className="col-span-3 space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={currentLineItem.description}
                    onChange={(e) => setCurrentLineItem({ ...currentLineItem, description: e.target.value })}
                    placeholder="Item description"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={currentLineItem.quantity}
                    onChange={(e) => setCurrentLineItem({ ...currentLineItem, quantity: e.target.value })}
                    placeholder="Qty"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="rate">Rate</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    value={currentLineItem.rate}
                    onChange={(e) => setCurrentLineItem({ ...currentLineItem, rate: e.target.value })}
                    placeholder="Rate"
                  />
                </div>
                <div className="col-span-1">
                  <Button onClick={addLineItem} size="sm" className="w-full">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Line Items Table */}
              {estimateForm.lineItems.length > 0 && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {estimateForm.lineItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">₹{item.rate.toFixed(2)}</TableCell>
                          <TableCell className="text-right">₹{item.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLineItem(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount:</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold">
                <span>Net Amount:</span>
                <span>₹{netAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateEstimate} disabled={createEstimate.isPending}>
              {createEstimate.isPending ? 'Creating...' : 'Create Estimate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Estimate Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Estimate</DialogTitle>
            <DialogDescription>Update estimate details</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-customer">Bill To Contact</Label>
                <Select onValueChange={handleCustomerSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {billToContacts.map((contact) => (
                      <SelectItem key={contact.id.toString()} value={contact.id.toString()}>
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-customer-name">Customer Name *</Label>
                <Input
                  id="edit-customer-name"
                  value={estimateForm.customerName}
                  onChange={(e) => setEstimateForm({ ...estimateForm, customerName: e.target.value })}
                  placeholder="Enter customer name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-customer-address">Customer Address</Label>
              <Textarea
                id="edit-customer-address"
                value={estimateForm.customerAddress}
                onChange={(e) => setEstimateForm({ ...estimateForm, customerAddress: e.target.value })}
                placeholder="Enter customer address"
                rows={2}
              />
            </div>

            <Separator />

            {/* Line Items Section */}
            <div className="space-y-4">
              <h3 className="font-semibold">Line Items</h3>

              {/* Add Line Item Form */}
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4 space-y-2">
                  <Label>Product</Label>
                  <ProductAutocomplete
                    products={products}
                    value={currentLineItem.productId}
                    onSelect={handleProductSelect}
                    placeholder="Search product..."
                  />
                </div>
                <div className="col-span-3 space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Input
                    id="edit-description"
                    value={currentLineItem.description}
                    onChange={(e) => setCurrentLineItem({ ...currentLineItem, description: e.target.value })}
                    placeholder="Item description"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="edit-quantity">Quantity</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    step="0.01"
                    value={currentLineItem.quantity}
                    onChange={(e) => setCurrentLineItem({ ...currentLineItem, quantity: e.target.value })}
                    placeholder="Qty"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="edit-rate">Rate</Label>
                  <Input
                    id="edit-rate"
                    type="number"
                    step="0.01"
                    value={currentLineItem.rate}
                    onChange={(e) => setCurrentLineItem({ ...currentLineItem, rate: e.target.value })}
                    placeholder="Rate"
                  />
                </div>
                <div className="col-span-1">
                  <Button onClick={addLineItem} size="sm" className="w-full">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Line Items Table */}
              {estimateForm.lineItems.length > 0 && (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {estimateForm.lineItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">₹{item.rate.toFixed(2)}</TableCell>
                          <TableCell className="text-right">₹{item.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLineItem(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total Amount:</span>
                <span>₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold">
                <span>Net Amount:</span>
                <span>₹{netAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateEstimate} disabled={updateEstimate.isPending}>
              {updateEstimate.isPending ? 'Updating...' : 'Update Estimate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Company Branding Dialog */}
      <Dialog open={isBrandingDialogOpen} onOpenChange={setIsBrandingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Company Branding</DialogTitle>
            <DialogDescription>Configure company information for estimates</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={brandingForm.name}
                onChange={(e) => setBrandingForm({ ...brandingForm, name: e.target.value })}
                placeholder="Company name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-address">Company Address</Label>
              <Textarea
                id="company-address"
                value={brandingForm.address}
                onChange={(e) => setBrandingForm({ ...brandingForm, address: e.target.value })}
                placeholder="Company address"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-logo">Company Logo</Label>
              <Input
                id="company-logo"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
              />
              {brandingForm.logoPreview && (
                <div className="mt-2">
                  <img
                    src={brandingForm.logoPreview}
                    alt="Logo preview"
                    className="h-20 object-contain"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBrandingDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBranding} disabled={setCompanyBranding.isPending}>
              {setCompanyBranding.isPending ? 'Saving...' : 'Save Branding'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Dialog */}
      {printData && (
        <EstimatePrintView
          estimate={printData.estimate}
          companyBranding={printData.companyBranding}
          previousPendingAmount={printData.previousPendingAmount}
          isOpen={isPrintDialogOpen}
          onClose={() => setIsPrintDialogOpen(false)}
          bluetoothPrinter={bluetoothPrinter}
        />
      )}
    </div>
  );
}
