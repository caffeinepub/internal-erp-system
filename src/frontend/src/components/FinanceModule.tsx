import { useState, useRef } from 'react';
import { useGetAllProducts, useGetAllContacts, useGetAllEstimates, useGetAllPurchases, useGetCallerUserRole, useGenerateProfitAndLossReport, useGetAllTransactions } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DollarSign, TrendingUp, Package, Users, Printer, ShoppingCart, FileText, TrendingDown } from 'lucide-react';
import type { ProfitAndLoss, Transaction } from '../backend';

export default function FinanceModule() {
  const { data: products = [], isLoading: productsLoading } = useGetAllProducts();
  const { data: contacts = [], isLoading: contactsLoading } = useGetAllContacts();
  const { data: estimates = [], isLoading: estimatesLoading } = useGetAllEstimates();
  const { data: purchases = [], isLoading: purchasesLoading } = useGetAllPurchases();
  const { data: transactions = [], isLoading: transactionsLoading } = useGetAllTransactions();
  const { data: userRole } = useGetCallerUserRole();

  const generateProfitAndLoss = useGenerateProfitAndLossReport();

  const isAdmin = userRole === 'admin';

  const [dateFilter, setDateFilter] = useState({
    startDate: '',
    endDate: '',
  });

  const [profitLossData, setProfitLossData] = useState<ProfitAndLoss | null>(null);
  const [transactionFilter, setTransactionFilter] = useState({
    startDate: '',
    endDate: '',
    companyName: '',
  });

  const [inventorySearchQuery, setInventorySearchQuery] = useState('');
  const [productPerformanceSearchQuery, setProductPerformanceSearchQuery] = useState('');

  const purchaseReportRef = useRef<HTMLDivElement>(null);
  const inventoryReportRef = useRef<HTMLDivElement>(null);
  const salesReportRef = useRef<HTMLDivElement>(null);
  const productReportRef = useRef<HTMLDivElement>(null);
  const profitLossReportRef = useRef<HTMLDivElement>(null);
  const transactionReportRef = useRef<HTMLDivElement>(null);

  const handlePrintReport = (reportRef: React.RefObject<HTMLDivElement | null>, title: string) => {
    const printContent = reportRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            .report-container { max-width: 1000px; margin: 0 auto; }
            .report-header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #333; }
            .report-title { font-size: 28px; font-weight: bold; margin-bottom: 8px; }
            .report-subtitle { font-size: 14px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { padding: 12px; text-align: left; font-size: 13px; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #333; background: #f5f5f5; }
            td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #ddd; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .summary-section { margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 8px; }
            .summary-row { display: flex; justify-content: space-between; padding: 8px 0; }
            .summary-label { font-weight: 600; }
            .summary-value { font-size: 18px; font-weight: bold; color: #1a1a1a; }
            .text-green { color: #16a34a; }
            .text-red { color: #dc2626; }
            @media print {
              body { padding: 20px; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // Filter data by date range
  const filterByDate = (timestamp: bigint) => {
    if (!dateFilter.startDate && !dateFilter.endDate) return true;
    const date = new Date(Number(timestamp) / 1000000);
    const start = dateFilter.startDate ? new Date(dateFilter.startDate) : null;
    const end = dateFilter.endDate ? new Date(dateFilter.endDate) : null;
    
    if (start && date < start) return false;
    if (end && date > end) return false;
    return true;
  };

  const filteredPurchases = purchases.filter((p) => filterByDate(p.purchaseDate));
  const filteredEstimates = estimates.filter((e) => filterByDate(e.createdAt));

  // Calculate metrics - using paidAmount for received sales
  const totalInventoryValue = products.reduce((sum, p) => sum + p.price * Number(p.stockQuantity), 0);
  const totalPurchaseValue = filteredPurchases.reduce((sum, p) => sum + p.costPrice * Number(p.quantity), 0);
  const totalSalesValue = filteredEstimates.reduce((sum, e) => sum + e.netAmount, 0);
  const totalReceivedSales = filteredEstimates.reduce((sum, e) => sum + e.paidAmount, 0);

  // Sales by contact type - using paidAmount for received and pendingAmount for pending
  const billToContacts = contacts.filter((c) => c.contactType === 'billTo');
  const salesByContact = billToContacts.map((contact) => {
    const contactEstimates = filteredEstimates.filter((e) => e.customerName === contact.name);
    const totalSold = contactEstimates.reduce((sum, e) => sum + e.netAmount, 0);
    const receivedAmount = contactEstimates.reduce((sum, e) => sum + e.paidAmount, 0);
    const pendingAmount = contactEstimates.reduce((sum, e) => sum + e.pendingAmount, 0);
    return {
      name: contact.name,
      category: contact.contactCategory,
      totalSold,
      receivedAmount,
      pendingAmount,
      estimateCount: contactEstimates.length,
    };
  });

  // Product performance - prefer productId matching, fallback to description
  const productPerformance = products.map((product) => {
    const productEstimates = filteredEstimates.flatMap((e) =>
      e.lineItems.filter((item) => {
        // Prefer productId match if available
        if (item.productId !== undefined && item.productId !== null) {
          return item.productId === product.id;
        }
        // Fallback to description match
        return item.description === product.name;
      })
    );
    const salesCount = productEstimates.reduce((sum, item) => sum + item.quantity, 0);
    const revenue = productEstimates.reduce((sum, item) => sum + item.amount, 0);
    const profitMargin = product.price > 0 ? ((product.price - product.price * 0.7) / product.price) * 100 : 0;
    
    return {
      name: product.name,
      category: product.category,
      salesCount,
      revenue,
      profitMargin,
      currentStock: Number(product.stockQuantity),
    };
  });

  // Filter inventory by search query
  const filteredInventory = products.filter((product) => {
    const query = inventorySearchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  });

  // Filter product performance by search query
  const filteredProductPerformance = productPerformance.filter((product) => {
    const query = productPerformanceSearchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  });

  // Generate Profit & Loss Report
  const handleGenerateProfitLoss = async () => {
    const startTime = dateFilter.startDate 
      ? BigInt(new Date(dateFilter.startDate).getTime() * 1000000)
      : BigInt(0);
    const endTime = dateFilter.endDate 
      ? BigInt(new Date(dateFilter.endDate).getTime() * 1000000)
      : BigInt(Date.now() * 1000000);

    const result = await generateProfitAndLoss.mutateAsync({ startTime, endTime });
    setProfitLossData(result);
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((t) => {
    const date = new Date(Number(t.date) / 1000000);
    const startDate = transactionFilter.startDate ? new Date(transactionFilter.startDate) : null;
    const endDate = transactionFilter.endDate ? new Date(transactionFilter.endDate) : null;
    
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    
    if (transactionFilter.companyName && !t.itemOrCustomer.toLowerCase().includes(transactionFilter.companyName.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Calculate transaction totals - using paidAmount for bills
  const transactionTotals = filteredTransactions.reduce(
    (acc, t) => {
      if (t.transactionType === 'purchase') {
        acc.totalPurchases += t.price * Number(t.quantity);
      } else {
        const estimate = estimates.find((e) => e.id === t.id);
        acc.totalBills += t.price;
        if (estimate) {
          acc.totalReceivedBills += estimate.paidAmount;
        }
      }
      return acc;
    },
    { totalPurchases: 0, totalBills: 0, totalReceivedBills: 0 }
  );

  if (productsLoading || contactsLoading || estimatesLoading || purchasesLoading || transactionsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <DollarSign className="w-8 h-8" />
          Finance & Reporting
        </h2>
        <p className="text-muted-foreground">Comprehensive financial reports and business insights</p>
      </div>

      {/* Date Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Filter reports by date range</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={dateFilter.startDate}
                onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={dateFilter.endDate}
                onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalInventoryValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Current stock valuation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalPurchaseValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{filteredPurchases.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSalesValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{filteredEstimates.length} estimates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Received Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalReceivedSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Paid amounts received</p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs defaultValue="purchases" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="purchases">Purchase Report</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Report</TabsTrigger>
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
          <TabsTrigger value="profitloss">Profit & Loss</TabsTrigger>
          <TabsTrigger value="transactions">Transactions Summary</TabsTrigger>
        </TabsList>

        {/* Purchase Management Report */}
        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    Purchase Management Report
                  </CardTitle>
                  <CardDescription>All purchase transactions with totals</CardDescription>
                </div>
                {isAdmin && (
                  <Button onClick={() => handlePrintReport(purchaseReportRef, 'Purchase Management Report')} size="sm">
                    <Printer className="w-4 h-4 mr-2" />
                    Print Report
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div ref={purchaseReportRef}>
                <div className="report-container">
                  <div className="report-header">
                    <div className="report-title">Purchase Management Report</div>
                    <div className="report-subtitle">PN TRADING</div>
                    {(dateFilter.startDate || dateFilter.endDate) && (
                      <div className="report-subtitle">
                        Period: {dateFilter.startDate || 'Start'} to {dateFilter.endDate || 'End'}
                      </div>
                    )}
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Purchaser</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Cost Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPurchases.map((purchase) => (
                        <TableRow key={purchase.id.toString()}>
                          <TableCell>
                            {new Date(Number(purchase.purchaseDate) / 1000000).toLocaleDateString('en-IN')}
                          </TableCell>
                          <TableCell>{purchase.item}</TableCell>
                          <TableCell>{purchase.purchaser}</TableCell>
                          <TableCell className="text-right">{Number(purchase.quantity)}</TableCell>
                          <TableCell className="text-right">₹{purchase.costPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-bold">
                            ₹{(purchase.costPrice * Number(purchase.quantity)).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="summary-section">
                    <div className="summary-row">
                      <span className="summary-label">Total Purchases:</span>
                      <span className="summary-value">₹{totalPurchaseValue.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Total Transactions:</span>
                      <span className="summary-value">{filteredPurchases.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Report */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Inventory Report
                  </CardTitle>
                  <CardDescription>Current stock levels and valuation</CardDescription>
                </div>
                {isAdmin && (
                  <Button onClick={() => handlePrintReport(inventoryReportRef, 'Inventory Report')} size="sm">
                    <Printer className="w-4 h-4 mr-2" />
                    Print Report
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label htmlFor="inventory-search">Search Products</Label>
                <Input
                  id="inventory-search"
                  type="text"
                  placeholder="Search by product name or category..."
                  value={inventorySearchQuery}
                  onChange={(e) => setInventorySearchQuery(e.target.value)}
                />
              </div>

              <div ref={inventoryReportRef}>
                <div className="report-container">
                  <div className="report-header">
                    <div className="report-title">Inventory Report</div>
                    <div className="report-subtitle">PN TRADING</div>
                    <div className="report-subtitle">
                      Generated on {new Date().toLocaleDateString('en-IN')}
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Stock Quantity</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total Value</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.map((product) => (
                        <TableRow key={product.id.toString()}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell className="text-right">{Number(product.stockQuantity)}</TableCell>
                          <TableCell className="text-right">₹{product.price.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-bold">
                            ₹{(product.price * Number(product.stockQuantity)).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="summary-section">
                    <div className="summary-row">
                      <span className="summary-label">Total Inventory Value:</span>
                      <span className="summary-value">
                        ₹{filteredInventory.reduce((sum, p) => sum + p.price * Number(p.stockQuantity), 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Total Products:</span>
                      <span className="summary-value">{filteredInventory.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Report */}
        <TabsContent value="sales">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Sales Report by Customer
                  </CardTitle>
                  <CardDescription>Sales performance by customer with pending amounts</CardDescription>
                </div>
                {isAdmin && (
                  <Button onClick={() => handlePrintReport(salesReportRef, 'Sales Report by Customer')} size="sm">
                    <Printer className="w-4 h-4 mr-2" />
                    Print Report
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div ref={salesReportRef}>
                <div className="report-container">
                  <div className="report-header">
                    <div className="report-title">Sales Report by Customer</div>
                    <div className="report-subtitle">PN TRADING</div>
                    {(dateFilter.startDate || dateFilter.endDate) && (
                      <div className="report-subtitle">
                        Period: {dateFilter.startDate || 'Start'} to {dateFilter.endDate || 'End'}
                      </div>
                    )}
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Total Sold</TableHead>
                        <TableHead className="text-right">Received</TableHead>
                        <TableHead className="text-right">Pending</TableHead>
                        <TableHead className="text-right">Estimates</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesByContact.map((contact) => (
                        <TableRow key={contact.name}>
                          <TableCell className="font-medium">{contact.name}</TableCell>
                          <TableCell className="capitalize">{contact.category}</TableCell>
                          <TableCell className="text-right">₹{contact.totalSold.toFixed(2)}</TableCell>
                          <TableCell className="text-right text-green-600">
                            ₹{contact.receivedAmount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right text-red-600">
                            ₹{contact.pendingAmount.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">{contact.estimateCount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="summary-section">
                    <div className="summary-row">
                      <span className="summary-label">Total Sales:</span>
                      <span className="summary-value">₹{totalSalesValue.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Total Received:</span>
                      <span className="summary-value text-green">₹{totalReceivedSales.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Total Pending:</span>
                      <span className="summary-value text-red">
                        ₹{(totalSalesValue - totalReceivedSales).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Performance */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Product Performance Report
                  </CardTitle>
                  <CardDescription>Sales performance by product</CardDescription>
                </div>
                {isAdmin && (
                  <Button onClick={() => handlePrintReport(productReportRef, 'Product Performance Report')} size="sm">
                    <Printer className="w-4 h-4 mr-2" />
                    Print Report
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Label htmlFor="product-performance-search">Search Products</Label>
                <Input
                  id="product-performance-search"
                  type="text"
                  placeholder="Search by product name or category..."
                  value={productPerformanceSearchQuery}
                  onChange={(e) => setProductPerformanceSearchQuery(e.target.value)}
                />
              </div>

              <div ref={productReportRef}>
                <div className="report-container">
                  <div className="report-header">
                    <div className="report-title">Product Performance Report</div>
                    <div className="report-subtitle">PN TRADING</div>
                    {(dateFilter.startDate || dateFilter.endDate) && (
                      <div className="report-subtitle">
                        Period: {dateFilter.startDate || 'Start'} to {dateFilter.endDate || 'End'}
                      </div>
                    )}
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Units Sold</TableHead>
                        <TableHead className="text-right">Revenue</TableHead>
                        <TableHead className="text-right">Current Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProductPerformance.map((product) => (
                        <TableRow key={product.name}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{product.category}</TableCell>
                          <TableCell className="text-right">{product.salesCount.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-bold">₹{product.revenue.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{product.currentStock}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="summary-section">
                    <div className="summary-row">
                      <span className="summary-label">Total Revenue:</span>
                      <span className="summary-value">
                        ₹{filteredProductPerformance.reduce((sum, p) => sum + p.revenue, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Total Units Sold:</span>
                      <span className="summary-value">
                        {filteredProductPerformance.reduce((sum, p) => sum + p.salesCount, 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profit & Loss */}
        <TabsContent value="profitloss">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Profit & Loss Report
                  </CardTitle>
                  <CardDescription>Comprehensive profit and loss statement</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleGenerateProfitLoss} size="sm" variant="outline">
                    Generate Report
                  </Button>
                  {isAdmin && profitLossData && (
                    <Button onClick={() => handlePrintReport(profitLossReportRef, 'Profit & Loss Report')} size="sm">
                      <Printer className="w-4 h-4 mr-2" />
                      Print Report
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!profitLossData ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Click "Generate Report" to create a profit & loss statement</p>
                </div>
              ) : (
                <div ref={profitLossReportRef}>
                  <div className="report-container">
                    <div className="report-header">
                      <div className="report-title">Profit & Loss Statement</div>
                      <div className="report-subtitle">PN TRADING</div>
                      <div className="report-subtitle">
                        Period: {new Date(Number(profitLossData.startTime) / 1000000).toLocaleDateString('en-IN')} to{' '}
                        {new Date(Number(profitLossData.endTime) / 1000000).toLocaleDateString('en-IN')}
                      </div>
                    </div>

                    <div className="summary-section">
                      <div className="summary-row">
                        <span className="summary-label">Total Income (Received):</span>
                        <span className="summary-value text-green">₹{profitLossData.totalIncome.toFixed(2)}</span>
                      </div>
                      <div className="summary-row">
                        <span className="summary-label">Total Expenses:</span>
                        <span className="summary-value text-red">₹{profitLossData.totalExpense.toFixed(2)}</span>
                      </div>
                      <div className="summary-row" style={{ borderTop: '2px solid #333', paddingTop: '16px', marginTop: '16px' }}>
                        <span className="summary-label">Net Profit/Loss:</span>
                        <span className={`summary-value ${profitLossData.netProfit >= 0 ? 'text-green' : 'text-red'}`}>
                          ₹{profitLossData.netProfit.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transactions Summary */}
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="w-5 h-5" />
                    Transactions Summary
                  </CardTitle>
                  <CardDescription>All purchases and bills in one view</CardDescription>
                </div>
                {isAdmin && (
                  <Button onClick={() => handlePrintReport(transactionReportRef, 'Transactions Summary')} size="sm">
                    <Printer className="w-4 h-4 mr-2" />
                    Print Report
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor="transaction-start-date">Start Date</Label>
                  <Input
                    id="transaction-start-date"
                    type="date"
                    value={transactionFilter.startDate}
                    onChange={(e) => setTransactionFilter({ ...transactionFilter, startDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transaction-end-date">End Date</Label>
                  <Input
                    id="transaction-end-date"
                    type="date"
                    value={transactionFilter.endDate}
                    onChange={(e) => setTransactionFilter({ ...transactionFilter, endDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transaction-company">Company/Item Name</Label>
                  <Input
                    id="transaction-company"
                    type="text"
                    placeholder="Search..."
                    value={transactionFilter.companyName}
                    onChange={(e) => setTransactionFilter({ ...transactionFilter, companyName: e.target.value })}
                  />
                </div>
              </div>

              <div ref={transactionReportRef}>
                <div className="report-container">
                  <div className="report-header">
                    <div className="report-title">Transactions Summary</div>
                    <div className="report-subtitle">PN TRADING</div>
                    {(transactionFilter.startDate || transactionFilter.endDate) && (
                      <div className="report-subtitle">
                        Period: {transactionFilter.startDate || 'Start'} to {transactionFilter.endDate || 'End'}
                      </div>
                    )}
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Item/Customer</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((transaction, index) => (
                        <TableRow key={`${transaction.transactionType}-${transaction.id.toString()}-${index}`}>
                          <TableCell>
                            {new Date(Number(transaction.date) / 1000000).toLocaleDateString('en-IN')}
                          </TableCell>
                          <TableCell className="capitalize">{transaction.transactionType}</TableCell>
                          <TableCell>{transaction.itemOrCustomer}</TableCell>
                          <TableCell className="text-right">{Number(transaction.quantity)}</TableCell>
                          <TableCell className="text-right font-bold">₹{transaction.price.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="summary-section">
                    <div className="summary-row">
                      <span className="summary-label">Total Purchases:</span>
                      <span className="summary-value text-red">₹{transactionTotals.totalPurchases.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Total Bills:</span>
                      <span className="summary-value">₹{transactionTotals.totalBills.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Total Received Bills:</span>
                      <span className="summary-value text-green">₹{transactionTotals.totalReceivedBills.toFixed(2)}</span>
                    </div>
                    <div className="summary-row" style={{ borderTop: '2px solid #333', paddingTop: '16px', marginTop: '16px' }}>
                      <span className="summary-label">Net (Received - Purchases):</span>
                      <span className={`summary-value ${(transactionTotals.totalReceivedBills - transactionTotals.totalPurchases) >= 0 ? 'text-green' : 'text-red'}`}>
                        ₹{(transactionTotals.totalReceivedBills - transactionTotals.totalPurchases).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
