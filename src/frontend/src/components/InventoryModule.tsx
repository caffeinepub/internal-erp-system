import { useState, useMemo } from 'react';
import { useGetAllProducts, useUpdateStock, useIsCallerAdmin } from '../hooks/useQueries';
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
import { Package, Edit, Search } from 'lucide-react';
import type { Product } from '../backend';
import ModulePageHeader from './ModulePageHeader';

export default function InventoryModule() {
  const { data: products = [], isLoading } = useGetAllProducts();
  const { data: isAdmin } = useIsCallerAdmin();
  const updateStock = useUpdateStock();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newQuantity, setNewQuantity] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Sort and filter products
  const sortedAndFilteredProducts = useMemo(() => {
    // First filter by search query
    let filtered = products;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = products.filter((product) =>
        product.name.toLowerCase().includes(query)
      );
    }

    // Then sort: in-stock first, then out-of-stock
    return [...filtered].sort((a, b) => {
      const aQuantity = Number(a.stockQuantity);
      const bQuantity = Number(b.stockQuantity);
      
      // In-stock (quantity > 0) comes before out-of-stock (quantity === 0)
      if (aQuantity > 0 && bQuantity === 0) return -1;
      if (aQuantity === 0 && bQuantity > 0) return 1;
      
      // Within same stock status, maintain original order
      return 0;
    });
  }, [products, searchQuery]);

  const handleUpdateStock = () => {
    if (selectedProduct && newQuantity) {
      updateStock.mutate(
        {
          productId: selectedProduct.id,
          quantity: BigInt(newQuantity),
        },
        {
          onSuccess: () => {
            setSelectedProduct(null);
            setNewQuantity('');
          },
        }
      );
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
    <div className="space-y-4">
      <ModulePageHeader
        icon={<Package className="w-5 h-5" />}
        title="Inventory Management"
        subtitle="Track and manage stock levels"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Current Inventory</CardTitle>
          <CardDescription className="text-sm">
            View and update stock quantities for all products
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No products in inventory</p>
              <p className="text-xs text-muted-foreground">Add products in the Products module</p>
            </div>
          ) : (
            <>
              {/* Search Filter */}
              <div className="mb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search products by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {sortedAndFilteredProducts.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground text-sm">No products found matching "{searchQuery}"</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Stock Quantity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedAndFilteredProducts.map((product) => {
                        const quantity = Number(product.stockQuantity);
                        const isLowStock = quantity < 10 && quantity > 0;
                        const isOutOfStock = quantity === 0;

                        return (
                          <TableRow key={product.id.toString()}>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.category}</TableCell>
                            <TableCell>
                              <span
                                className={
                                  isOutOfStock
                                    ? 'text-destructive font-semibold'
                                    : isLowStock
                                      ? 'text-orange-600 dark:text-orange-400 font-semibold'
                                      : ''
                                }
                              >
                                {quantity}
                              </span>
                            </TableCell>
                            <TableCell>
                              {isOutOfStock ? (
                                <Badge variant="destructive">Out of Stock</Badge>
                              ) : isLowStock ? (
                                <Badge variant="outline" className="border-orange-600 text-orange-600">
                                  Low Stock
                                </Badge>
                              ) : (
                                <Badge variant="secondary">In Stock</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date().toLocaleDateString('en-IN')}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setNewQuantity(quantity.toString());
                                }}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Update
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock Quantity</DialogTitle>
            <DialogDescription>
              Update the stock quantity for {selectedProduct?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">New Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={newQuantity}
                onChange={(e) => setNewQuantity(e.target.value)}
                placeholder="Enter quantity"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProduct(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStock}
              disabled={!newQuantity || updateStock.isPending}
            >
              {updateStock.isPending ? 'Updating...' : 'Update Stock'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
