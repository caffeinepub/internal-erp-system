import { useState } from 'react';
import {
  useGetAllProducts,
  useGetPurchaserContacts,
  useCreatePurchase,
  useUpdatePurchase,
  useDeletePurchase,
  useGetAllPurchases,
  useGetCallerUserRole,
} from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Separator } from '@/components/ui/separator';
import { ShoppingBag, Plus, AlertTriangle, X, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import PriceOverrideDialog from './PriceOverrideDialog';
import ProductAutocomplete from './ProductAutocomplete';
import type { Purchase } from '../backend';

interface PurchaseLineItem {
  productId: string;
  productName: string;
  quantity: string;
  costPrice: string;
  sellingPrice: string;
  profitPercentage: string;
}

export default function PurchaseModule() {
  const { data: products = [], isLoading: productsLoading } = useGetAllProducts();
  const { data: purchasers = [], isLoading: contactsLoading } = useGetPurchaserContacts();
  const { data: purchases = [], isLoading: purchasesLoading } = useGetAllPurchases();
  const { data: userRole } = useGetCallerUserRole();
  const createPurchase = useCreatePurchase();
  const updatePurchase = useUpdatePurchase();
  const deletePurchase = useDeletePurchase();

  const isAdmin = userRole === 'admin';

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = useState(false);
  const [overrideItem, setOverrideItem] = useState<{ costPrice: number; sellingPrice: number; itemName: string } | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [purchaseToDelete, setPurchaseToDelete] = useState<Purchase | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    contactId: '',
    notes: '',
    lineItems: [] as PurchaseLineItem[],
  });

  const [currentLineItem, setCurrentLineItem] = useState<PurchaseLineItem>({
    productId: '',
    productName: '',
    quantity: '',
    costPrice: '',
    sellingPrice: '',
    profitPercentage: '',
  });

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      contactId: '',
      notes: '',
      lineItems: [],
    });
    setCurrentLineItem({
      productId: '',
      productName: '',
      quantity: '',
      costPrice: '',
      sellingPrice: '',
      profitPercentage: '',
    });
  };

  // Calculate profit percentage from cost and selling prices
  const calculateProfitPercentage = (cost: number, selling: number): number => {
    if (cost === 0) return 0;
    return ((selling - cost) / cost) * 100;
  };

  // Calculate selling price from cost and profit percentage
  const calculateSellingPrice = (cost: number, profitPercent: number): number => {
    return cost + (cost * profitPercent) / 100;
  };

  // Check if pricing is valid for a line item
  const isLineItemPricingValid = (item: PurchaseLineItem): boolean => {
    const cost = parseFloat(item.costPrice);
    const selling = parseFloat(item.sellingPrice);
    if (isNaN(cost) || isNaN(selling)) return true;
    return selling >= cost;
  };

  // Check if all line items have valid pricing
  const areAllLineItemsValid = (): boolean => {
    return formData.lineItems.every(isLineItemPricingValid);
  };

  const handleProductSelect = (productId: string, product: any) => {
    if (product) {
      // Use functional state update to avoid stale state issues
      setCurrentLineItem((prev) => {
        const costPrice = product.price.toString();
        const sellingPrice = product.price.toString(); // Default selling price = cost price
        const profitPercent = calculateProfitPercentage(product.price, product.price);
        
        return {
          ...prev,
          productId,
          productName: product.name,
          costPrice,
          sellingPrice,
          profitPercentage: profitPercent.toFixed(2),
        };
      });
    }
  };

  const handleCostPriceChange = (value: string) => {
    const cost = parseFloat(value);
    const selling = parseFloat(currentLineItem.sellingPrice);

    if (!isNaN(cost) && !isNaN(selling)) {
      const profitPercent = calculateProfitPercentage(cost, selling);
      setCurrentLineItem({ 
        ...currentLineItem, 
        costPrice: value, 
        profitPercentage: profitPercent.toFixed(2) 
      });
    } else {
      setCurrentLineItem({ ...currentLineItem, costPrice: value });
    }
  };

  const handleSellingPriceChange = (value: string) => {
    const cost = parseFloat(currentLineItem.costPrice);
    const selling = parseFloat(value);

    if (!isNaN(cost) && !isNaN(selling)) {
      const profitPercent = calculateProfitPercentage(cost, selling);
      setCurrentLineItem({ 
        ...currentLineItem, 
        sellingPrice: value, 
        profitPercentage: profitPercent.toFixed(2) 
      });
    } else {
      setCurrentLineItem({ ...currentLineItem, sellingPrice: value });
    }
  };

  const handleProfitPercentageChange = (value: string) => {
    const cost = parseFloat(currentLineItem.costPrice);
    const profitPercent = parseFloat(value);

    if (!isNaN(cost) && !isNaN(profitPercent)) {
      const selling = calculateSellingPrice(cost, profitPercent);
      setCurrentLineItem({ 
        ...currentLineItem, 
        profitPercentage: value, 
        sellingPrice: selling.toFixed(2) 
      });
    } else {
      setCurrentLineItem({ ...currentLineItem, profitPercentage: value });
    }
  };

  const addLineItem = () => {
    if (!currentLineItem.productId || !currentLineItem.quantity || 
        !currentLineItem.costPrice || !currentLineItem.sellingPrice) {
      toast.error('Please fill in all line item fields');
      return;
    }

    if (formData.lineItems.length >= 100) {
      toast.error('Maximum 100 items per purchase');
      return;
    }

    setFormData({
      ...formData,
      lineItems: [...formData.lineItems, { ...currentLineItem }],
    });

    setCurrentLineItem({
      productId: '',
      productName: '',
      quantity: '',
      costPrice: '',
      sellingPrice: '',
      profitPercentage: '',
    });
  };

  const removeLineItem = (index: number) => {
    setFormData({
      ...formData,
      lineItems: formData.lineItems.filter((_, i) => i !== index),
    });
  };

  const handleCreatePurchase = async () => {
    if (!formData.contactId || formData.lineItems.length === 0) {
      toast.error('Please select a purchaser and add at least one item');
      return;
    }

    const contact = purchasers.find((c) => c.id.toString() === formData.contactId);
    if (!contact) {
      toast.error('Invalid purchaser selection');
      return;
    }

    // Check if all line items have valid pricing
    if (!areAllLineItemsValid()) {
      // Find first invalid item for override dialog
      const invalidItem = formData.lineItems.find(item => !isLineItemPricingValid(item));
      if (invalidItem) {
        setOverrideItem({
          costPrice: parseFloat(invalidItem.costPrice),
          sellingPrice: parseFloat(invalidItem.sellingPrice),
          itemName: invalidItem.productName,
        });
        setIsOverrideDialogOpen(true);
      }
      return;
    }

    // Proceed with normal purchase creation
    await submitAllPurchases(false);
  };

  const submitAllPurchases = async (hasOverride: boolean) => {
    const contact = purchasers.find((c) => c.id.toString() === formData.contactId);
    if (!contact) return;

    try {
      // Submit each line item as a separate purchase
      for (const item of formData.lineItems) {
        await createPurchase.mutateAsync({
          item: item.productName,
          quantity: BigInt(Math.floor(parseFloat(item.quantity))),
          costPrice: parseFloat(item.costPrice),
          sellingPrice: parseFloat(item.sellingPrice),
          purchaser: contact.name,
          notes: formData.notes,
          hasOverride,
        });
      }

      setIsCreateDialogOpen(false);
      resetForm();
      toast.success(`Successfully recorded ${formData.lineItems.length} purchase item(s)`);
    } catch (error: any) {
      toast.error(`Failed to create purchase: ${error.message}`);
    }
  };

  const handleApproveOverride = async () => {
    await submitAllPurchases(true);
    setIsOverrideDialogOpen(false);
    setOverrideItem(null);
  };

  const handleRejectOverride = () => {
    setIsOverrideDialogOpen(false);
    setOverrideItem(null);
  };

  const openEditDialog = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    const contact = purchasers.find((c) => c.name === purchase.purchaser);
    setFormData({
      date: new Date(Number(purchase.purchaseDate) / 1000000).toISOString().split('T')[0],
      contactId: contact?.id.toString() || '',
      notes: purchase.notes,
      lineItems: [{
        productId: '',
        productName: purchase.item,
        quantity: Number(purchase.quantity).toString(),
        costPrice: purchase.costPrice.toString(),
        sellingPrice: purchase.sellingPrice.toString(),
        profitPercentage: purchase.profitPercentage.toString(),
      }],
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdatePurchase = async () => {
    if (!selectedPurchase || !formData.contactId || formData.lineItems.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    const contact = purchasers.find((c) => c.id.toString() === formData.contactId);
    if (!contact) {
      toast.error('Invalid purchaser selection');
      return;
    }

    const item = formData.lineItems[0];
    const costPrice = parseFloat(item.costPrice);
    const sellingPrice = parseFloat(item.sellingPrice);
    const hasOverride = sellingPrice < costPrice;

    try {
      await updatePurchase.mutateAsync({
        id: selectedPurchase.id,
        item: item.productName,
        quantity: BigInt(Math.floor(parseFloat(item.quantity))),
        costPrice,
        sellingPrice,
        purchaser: contact.name,
        notes: formData.notes,
        hasOverride,
      });

      setIsEditDialogOpen(false);
      setSelectedPurchase(null);
      resetForm();
    } catch (error: any) {
      toast.error(`Failed to update purchase: ${error.message}`);
    }
  };

  const openDeleteDialog = (purchase: Purchase) => {
    setPurchaseToDelete(purchase);
    setIsDeleteDialogOpen(true);
  };

  const handleDeletePurchase = () => {
    if (!purchaseToDelete) return;

    deletePurchase.mutate(purchaseToDelete.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setPurchaseToDelete(null);
        toast.success('Purchase deleted successfully');
      },
      onError: (error: Error) => {
        toast.error(`Failed to delete purchase: ${error.message}`);
      },
    });
  };

  if (productsLoading || contactsLoading || purchasesLoading) {
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
            <ShoppingBag className="w-8 h-8" />
            Purchase Management
          </h2>
          <p className="text-muted-foreground">Record purchases and manage inventory (up to 100 items per purchase)</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Record Purchase
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Records</CardTitle>
          <CardDescription>View all purchase transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {purchases.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No purchase records yet</p>
              {isAdmin && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Record Your First Purchase
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Cost Price</TableHead>
                    <TableHead>Selling Price</TableHead>
                    <TableHead>Profit %</TableHead>
                    <TableHead>Purchaser</TableHead>
                    {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id.toString()}>
                      <TableCell>{new Date(Number(purchase.purchaseDate) / 1000000).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{purchase.item}</TableCell>
                      <TableCell>{Number(purchase.quantity)}</TableCell>
                      <TableCell>₹{purchase.costPrice.toFixed(2)}</TableCell>
                      <TableCell>₹{purchase.sellingPrice.toFixed(2)}</TableCell>
                      <TableCell className={purchase.profitPercentage < 0 ? 'text-destructive font-medium' : ''}>
                        {purchase.profitPercentage.toFixed(2)}%
                        {purchase.hasOverride && (
                          <span className="ml-2 text-xs text-muted-foreground">(Override)</span>
                        )}
                      </TableCell>
                      <TableCell>{purchase.purchaser}</TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(purchase)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(purchase)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Purchase Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record New Purchase</DialogTitle>
            <DialogDescription>Enter purchase details with multiple items (up to 100 items)</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Purchaser *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, contactId: value })} value={formData.contactId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select purchaser" />
                  </SelectTrigger>
                  <SelectContent>
                    {purchasers.map((purchaser) => (
                      <SelectItem key={purchaser.id.toString()} value={purchaser.id.toString()}>
                        {purchaser.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            {/* Line Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Purchase Items ({formData.lineItems.length}/100)</h3>
                {formData.lineItems.length >= 100 && (
                  <span className="text-sm text-muted-foreground">Maximum items reached</span>
                )}
              </div>

              {/* Add Line Item Form */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <div className="grid grid-cols-6 gap-3">
                  <div className="col-span-2 space-y-2">
                    <Label>Product *</Label>
                    <ProductAutocomplete
                      products={products}
                      value={currentLineItem.productId}
                      onSelect={handleProductSelect}
                      placeholder="Search product..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="1"
                      value={currentLineItem.quantity}
                      onChange={(e) => setCurrentLineItem({ ...currentLineItem, quantity: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="costPrice">Cost Price *</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      step="0.01"
                      value={currentLineItem.costPrice}
                      onChange={(e) => handleCostPriceChange(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sellingPrice">Selling Price *</Label>
                    <Input
                      id="sellingPrice"
                      type="number"
                      step="0.01"
                      value={currentLineItem.sellingPrice}
                      onChange={(e) => handleSellingPriceChange(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profitPercentage">Profit %</Label>
                    <Input
                      id="profitPercentage"
                      type="number"
                      step="0.01"
                      value={currentLineItem.profitPercentage}
                      onChange={(e) => handleProfitPercentageChange(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <Button onClick={addLineItem} className="mt-3" size="sm" disabled={formData.lineItems.length >= 100}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </div>

              {/* Line Items Table */}
              {formData.lineItems.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Qty</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Selling</TableHead>
                        <TableHead>Profit %</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {formData.lineItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.productName}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₹{parseFloat(item.costPrice).toFixed(2)}</TableCell>
                          <TableCell>₹{parseFloat(item.sellingPrice).toFixed(2)}</TableCell>
                          <TableCell className={parseFloat(item.profitPercentage) < 0 ? 'text-destructive' : ''}>
                            {parseFloat(item.profitPercentage).toFixed(2)}%
                          </TableCell>
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

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePurchase} disabled={createPurchase.isPending}>
              {createPurchase.isPending ? 'Recording...' : 'Record Purchase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Purchase Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Purchase</DialogTitle>
            <DialogDescription>Update purchase details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact">Purchaser *</Label>
                <Select onValueChange={(value) => setFormData({ ...formData, contactId: value })} value={formData.contactId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select purchaser" />
                  </SelectTrigger>
                  <SelectContent>
                    {purchasers.map((purchaser) => (
                      <SelectItem key={purchaser.id.toString()} value={purchaser.id.toString()}>
                        {purchaser.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.lineItems.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-3">
                  <div className="space-y-2">
                    <Label>Product</Label>
                    <Input value={formData.lineItems[0].productName} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-quantity">Quantity *</Label>
                    <Input
                      id="edit-quantity"
                      type="number"
                      step="1"
                      value={formData.lineItems[0].quantity}
                      onChange={(e) => {
                        const updated = [...formData.lineItems];
                        updated[0].quantity = e.target.value;
                        setFormData({ ...formData, lineItems: updated });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-costPrice">Cost Price *</Label>
                    <Input
                      id="edit-costPrice"
                      type="number"
                      step="0.01"
                      value={formData.lineItems[0].costPrice}
                      onChange={(e) => {
                        const updated = [...formData.lineItems];
                        updated[0].costPrice = e.target.value;
                        const cost = parseFloat(e.target.value);
                        const selling = parseFloat(updated[0].sellingPrice);
                        if (!isNaN(cost) && !isNaN(selling)) {
                          updated[0].profitPercentage = calculateProfitPercentage(cost, selling).toFixed(2);
                        }
                        setFormData({ ...formData, lineItems: updated });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-sellingPrice">Selling Price *</Label>
                    <Input
                      id="edit-sellingPrice"
                      type="number"
                      step="0.01"
                      value={formData.lineItems[0].sellingPrice}
                      onChange={(e) => {
                        const updated = [...formData.lineItems];
                        updated[0].sellingPrice = e.target.value;
                        const cost = parseFloat(updated[0].costPrice);
                        const selling = parseFloat(e.target.value);
                        if (!isNaN(cost) && !isNaN(selling)) {
                          updated[0].profitPercentage = calculateProfitPercentage(cost, selling).toFixed(2);
                        }
                        setFormData({ ...formData, lineItems: updated });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-profitPercentage">Profit %</Label>
                    <Input
                      id="edit-profitPercentage"
                      type="number"
                      step="0.01"
                      value={formData.lineItems[0].profitPercentage}
                      onChange={(e) => {
                        const updated = [...formData.lineItems];
                        updated[0].profitPercentage = e.target.value;
                        const cost = parseFloat(updated[0].costPrice);
                        const profitPercent = parseFloat(e.target.value);
                        if (!isNaN(cost) && !isNaN(profitPercent)) {
                          updated[0].sellingPrice = calculateSellingPrice(cost, profitPercent).toFixed(2);
                        }
                        setFormData({ ...formData, lineItems: updated });
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdatePurchase} disabled={updatePurchase.isPending}>
              {updatePurchase.isPending ? 'Updating...' : 'Update Purchase'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Purchase</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this purchase record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePurchase}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Price Override Dialog */}
      {overrideItem && (
        <PriceOverrideDialog
          isOpen={isOverrideDialogOpen}
          onClose={handleRejectOverride}
          costPrice={overrideItem.costPrice}
          sellingPrice={overrideItem.sellingPrice}
          itemName={overrideItem.itemName}
          onApprove={handleApproveOverride}
        />
      )}
    </div>
  );
}
