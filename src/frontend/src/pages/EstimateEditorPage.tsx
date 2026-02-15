import { useState, useEffect } from 'react';
import { useHashRoute } from '../hooks/useHashRoute';
import { useFocusedOverlay } from '../context/FocusedOverlayContext';
import {
  useGetAllEstimates,
  useCreateEstimate,
  useUpdateEstimate,
  useGetBillToContacts,
  useGetAllProducts,
  useGetAllPurchases,
} from '../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { X, Plus, ArrowLeft, Save, AlertCircle } from 'lucide-react';
import type { EstimateItem, Variant_wholesaler_retailer } from '../backend';
import ProductAutocomplete from '../components/ProductAutocomplete';
import { toast } from 'sonner';
import { indexedDB } from '../utils/indexedDbClient';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getLatestPurchasePrice } from '../utils/purchasePrice';

interface EstimateEditorPageProps {
  mode: 'create' | 'edit';
  estimateId?: string;
}

export default function EstimateEditorPage({ mode, estimateId }: EstimateEditorPageProps) {
  const { navigate } = useHashRoute();
  const { register, unregister } = useFocusedOverlay();
  const { data: estimates = [] } = useGetAllEstimates();
  const { data: billToContacts = [] } = useGetBillToContacts();
  const { data: products = [] } = useGetAllProducts();
  const { data: purchases = [] } = useGetAllPurchases();
  const createEstimate = useCreateEstimate();
  const updateEstimate = useUpdateEstimate();

  const [estimateForm, setEstimateForm] = useState({
    customerName: '',
    customerAddress: '',
    contactCategory: 'wholesaler' as Variant_wholesaler_retailer,
    lineItems: [] as EstimateItem[],
  });

  const [currentLineItem, setCurrentLineItem] = useState({
    productId: '',
    description: '',
    quantity: '',
    rate: '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [previousPendingBalance, setPreviousPendingBalance] = useState(0);
  const [validationError, setValidationError] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');

  // Register focused overlay on mount
  useEffect(() => {
    register();
    return () => unregister();
  }, [register, unregister]);

  // Load estimate for edit mode
  useEffect(() => {
    if (mode === 'edit' && estimateId) {
      const estimate = estimates.find((e) => e.id.toString() === estimateId);
      if (estimate) {
        setEstimateForm({
          customerName: estimate.customerName,
          customerAddress: estimate.customerAddress,
          contactCategory: 'wholesaler' as Variant_wholesaler_retailer,
          lineItems: [...estimate.lineItems],
        });

        // Find matching customer to set selected customer ID
        const matchingCustomer = billToContacts.find(
          (c) => c.name === estimate.customerName
        );
        if (matchingCustomer) {
          setSelectedCustomerId(matchingCustomer.id.toString());
        }
      }
    }
  }, [mode, estimateId, estimates, billToContacts]);

  // Calculate previous pending balance when customer changes
  useEffect(() => {
    if (estimateForm.customerName) {
      const currentEstimateId = mode === 'edit' && estimateId ? BigInt(estimateId) : null;
      const customerEstimates = estimates.filter(
        (e) =>
          e.customerName === estimateForm.customerName &&
          (!currentEstimateId || e.id !== currentEstimateId)
      );
      const pending = customerEstimates.reduce((sum, e) => sum + e.pendingAmount, 0);
      setPreviousPendingBalance(pending);
    } else {
      setPreviousPendingBalance(0);
    }
  }, [estimateForm.customerName, estimates, mode, estimateId]);

  const handleCustomerSelect = (customerId: string) => {
    const customer = billToContacts.find((c) => c.id.toString() === customerId);
    if (customer) {
      setSelectedCustomerId(customerId);
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
      // Get latest purchase price or fall back to product price
      const latestPrice = getLatestPurchasePrice(
        product.name,
        purchases,
        product.price || 0
      );

      // Use functional state update to atomically populate all fields
      setCurrentLineItem((prev) => ({
        ...prev,
        productId,
        description: product.name || '',
        rate: latestPrice.toString(),
      }));
    }
    // Clear validation error when product changes
    setValidationError('');
  };

  const handleDescriptionChange = (value: string) => {
    // Clear productId when user manually edits description to avoid mismatch
    setCurrentLineItem((prev) => ({
      ...prev,
      description: value,
      productId: prev.description === value ? prev.productId : '',
    }));
    setValidationError('');
  };

  const addLineItem = () => {
    setValidationError('');

    if (!currentLineItem.description || !currentLineItem.quantity || !currentLineItem.rate) {
      setValidationError('Please fill in all item fields (description, quantity, and rate)');
      return;
    }

    const quantity = parseFloat(currentLineItem.quantity);
    const rate = parseFloat(currentLineItem.rate);

    if (isNaN(quantity) || isNaN(rate) || quantity <= 0 || rate < 0) {
      setValidationError('Please enter valid quantity (greater than 0) and rate (non-negative)');
      return;
    }

    // Stock validation if product is selected
    if (currentLineItem.productId) {
      const product = products.find((p) => p.id.toString() === currentLineItem.productId);
      if (product) {
        let availableStock = Number(product.stockQuantity);

        // In edit mode, account for original quantity of this product
        if (mode === 'edit' && estimateId) {
          const estimate = estimates.find((e) => e.id.toString() === estimateId);
          if (estimate) {
            const originalQuantity = estimate.lineItems
              .filter((item) => item.productId?.toString() === currentLineItem.productId)
              .reduce((sum, item) => sum + item.quantity, 0);
            availableStock += originalQuantity;
          }
        }

        if (quantity > availableStock) {
          setValidationError(
            `Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${quantity}`
          );
          return;
        }
      }
    }

    const amount = quantity * rate;

    const newItem: EstimateItem = {
      productId: currentLineItem.productId ? BigInt(currentLineItem.productId) : undefined,
      description: currentLineItem.description,
      quantity,
      rate,
      amount,
    };

    setEstimateForm((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem],
    }));

    // Reset current line item including productId
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

  const handleSave = async () => {
    if (!estimateForm.customerName || estimateForm.lineItems.length === 0) {
      toast.error('Please fill in customer name and add at least one item');
      return;
    }

    // Final stock validation before save
    for (const item of estimateForm.lineItems) {
      if (item.productId) {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          let availableStock = Number(product.stockQuantity);

          // In edit mode, restore original quantities
          if (mode === 'edit' && estimateId) {
            const estimate = estimates.find((e) => e.id.toString() === estimateId);
            if (estimate) {
              const originalQuantity = estimate.lineItems
                .filter((origItem) => origItem.productId === item.productId)
                .reduce((sum, origItem) => sum + origItem.quantity, 0);
              availableStock += originalQuantity;
            }
          }

          if (item.quantity > availableStock) {
            toast.error(
              `Cannot save: Insufficient stock for ${product.name}. Available: ${availableStock}, Requested: ${item.quantity}`
            );
            return;
          }
        }
      }
    }

    setIsSaving(true);

    const { totalAmount, netAmount } = calculateTotals();

    try {
      if (mode === 'create') {
        const newId = await createEstimate.mutateAsync({
          customerName: estimateForm.customerName,
          customerAddress: estimateForm.customerAddress,
          lineItems: estimateForm.lineItems,
          totalAmount,
          netAmount,
        });

        // Persist to IndexedDB
        const newEstimate = {
          id: newId,
          customerName: estimateForm.customerName,
          customerAddress: estimateForm.customerAddress,
          lineItems: estimateForm.lineItems,
          totalAmount,
          netAmount,
          createdAt: BigInt(Date.now() * 1000000),
          isPaid: false,
          paidAmount: 0,
          pendingAmount: totalAmount,
          paymentReceivedTimestamp: undefined,
        };
        await indexedDB.put('estimates', newEstimate);

        toast.success('Estimate created successfully');

        // Navigate to full-screen print preview
        navigate({ type: 'estimate-print', id: newId.toString() });
      } else if (mode === 'edit' && estimateId) {
        const estimate = estimates.find((e) => e.id.toString() === estimateId);
        if (!estimate) {
          toast.error('Estimate not found');
          return;
        }

        await updateEstimate.mutateAsync({
          id: estimate.id,
          customerName: estimateForm.customerName,
          customerAddress: estimateForm.customerAddress,
          lineItems: estimateForm.lineItems,
          totalAmount,
          netAmount,
          isPaid: estimate.isPaid,
          pendingAmount: estimate.pendingAmount,
          paidAmount: estimate.paidAmount,
          paymentReceivedTimestamp: estimate.paymentReceivedTimestamp,
        });

        // Update IndexedDB
        const updatedEstimate = {
          ...estimate,
          customerName: estimateForm.customerName,
          customerAddress: estimateForm.customerAddress,
          lineItems: estimateForm.lineItems,
          totalAmount,
          netAmount,
        };
        await indexedDB.put('estimates', updatedEstimate);

        toast.success('Estimate updated successfully');

        // Navigate to full-screen print preview
        navigate({ type: 'estimate-print', id: estimateId });
      }
    } catch (error: any) {
      toast.error(`Failed to save estimate: ${error.message}`);
      setIsSaving(false);
    }
  };

  const { totalAmount, netAmount } = calculateTotals();

  return (
    <div className="fixed inset-0 z-[200] bg-background overflow-y-auto">
      <div className="container max-w-5xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ type: 'dashboard' })}
              disabled={isSaving}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {mode === 'create' ? 'Create New Estimate' : 'Edit Estimate'}
              </h1>
              <p className="text-sm text-muted-foreground">
                Fill in the details below to {mode === 'create' ? 'create' : 'update'} an estimate
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save & Preview'}
          </Button>
        </div>

        {/* Customer Selection */}
        <div className="bg-card border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Customer Information</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer-select">Select Customer</Label>
              <Select value={selectedCustomerId} onValueChange={handleCustomerSelect}>
                <SelectTrigger id="customer-select">
                  <SelectValue placeholder="Choose a customer" />
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
                onChange={(e) =>
                  setEstimateForm({ ...estimateForm, customerName: e.target.value })
                }
                placeholder="Enter customer name"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="customer-address">Customer Address</Label>
              <Textarea
                id="customer-address"
                value={estimateForm.customerAddress}
                onChange={(e) =>
                  setEstimateForm({ ...estimateForm, customerAddress: e.target.value })
                }
                placeholder="Enter customer address"
                rows={2}
              />
            </div>
          </div>

          {/* Previous Pending Balance Display */}
          {previousPendingBalance > 0 && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Previous Pending Balance:</strong> ₹{previousPendingBalance.toFixed(2)}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Add Line Item */}
        <div className="bg-card border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Add Items</h2>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2 md:col-span-2">
              <Label>Product</Label>
              <ProductAutocomplete
                products={products}
                value={currentLineItem.productId}
                onSelect={handleProductSelect}
                placeholder="Search product..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-description">Description *</Label>
              <Input
                id="item-description"
                value={currentLineItem.description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Item name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-quantity">Quantity *</Label>
              <Input
                id="item-quantity"
                type="number"
                step="0.01"
                value={currentLineItem.quantity}
                onChange={(e) => {
                  setCurrentLineItem({ ...currentLineItem, quantity: e.target.value });
                  setValidationError('');
                }}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-rate">Rate (₹) *</Label>
              <Input
                id="item-rate"
                type="number"
                step="0.01"
                value={currentLineItem.rate}
                onChange={(e) => {
                  setCurrentLineItem({ ...currentLineItem, rate: e.target.value });
                  setValidationError('');
                }}
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Validation Error Display */}
          {validationError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          <Button onClick={addLineItem} className="mt-4" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>

        {/* Line Items Table */}
        <div className="bg-card border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Estimate Items</h2>
          {estimateForm.lineItems.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No items added yet</p>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
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
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">₹{item.rate.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{item.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
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

        {/* Totals */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-2">
              <div className="flex justify-between text-lg">
                <span className="font-medium">Total Amount:</span>
                <span className="font-bold">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg border-t pt-2">
                <span className="font-medium">Net Amount:</span>
                <span className="font-bold">₹{netAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
