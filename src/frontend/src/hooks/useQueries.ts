import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import type { UserProfile, Product, Contact, UserRole, Estimate, EstimateItem, CompanyBranding, Purchase, Variant_purchaser_billTo, Variant_wholesaler_retailer, ProfitAndLoss, Transaction, Time, BackupData } from '../backend';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save profile: ${error.message}`);
    },
  });
}

// User Role Queries
export function useGetCallerUserRole() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<UserRole>({
    queryKey: ['currentUserRole'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['isAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching,
  });
}

// Backup Queries
export function useBackupExport() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.backupExport();
    },
    onError: (error: Error) => {
      toast.error(`Failed to export backup: ${error.message}`);
    },
  });
}

export function useBackupImport() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (backup: BackupData) => {
      if (!actor) throw new Error('Actor not available');
      return actor.backupImport(backup);
    },
    onSuccess: () => {
      // Invalidate all data queries after import
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['billToContacts'] });
      queryClient.invalidateQueries({ queryKey: ['purchaserContacts'] });
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['companyBranding'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      toast.success('Backup imported successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to import backup: ${error.message}`);
    },
  });
}

// Product Queries
export function useGetAllProducts() {
  const { actor, isFetching } = useActor();

  return useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; category: string; price: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addProduct(data.name, data.category, data.price);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add product: ${error.message}`);
    },
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: bigint; name: string; category: string; price: number }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateProduct(data.id, data.name, data.category, data.price);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update product: ${error.message}`);
    },
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (productId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteProduct(productId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete product: ${error.message}`);
    },
  });
}

export function useUpdateStock() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { productId: bigint; quantity: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateStock(data.productId, data.quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Stock updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update stock: ${error.message}`);
    },
  });
}

// Contact Queries
export function useGetAllContacts() {
  const { actor, isFetching } = useActor();

  return useQuery<Contact[]>({
    queryKey: ['contacts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllContacts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetBillToContacts() {
  const { actor, isFetching } = useActor();

  return useQuery<Contact[]>({
    queryKey: ['billToContacts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBillToContacts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPurchaserContacts() {
  const { actor, isFetching } = useActor();

  return useQuery<Contact[]>({
    queryKey: ['purchaserContacts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPurchaserContacts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      name: string; 
      contactInfo: string; 
      contactType: Variant_purchaser_billTo;
      contactCategory: Variant_wholesaler_retailer;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addContact(data.name, data.contactInfo, data.contactType, data.contactCategory);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['billToContacts'] });
      queryClient.invalidateQueries({ queryKey: ['purchaserContacts'] });
      toast.success('Contact added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add contact: ${error.message}`);
    },
  });
}

export function useUpdateContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { 
      id: bigint; 
      name: string; 
      contactInfo: string; 
      contactType: Variant_purchaser_billTo;
      contactCategory: Variant_wholesaler_retailer;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateContact(data.id, data.name, data.contactInfo, data.contactType, data.contactCategory);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['billToContacts'] });
      queryClient.invalidateQueries({ queryKey: ['purchaserContacts'] });
      toast.success('Contact updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update contact: ${error.message}`);
    },
  });
}

export function useDeleteContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteContact(contactId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['billToContacts'] });
      queryClient.invalidateQueries({ queryKey: ['purchaserContacts'] });
      toast.success('Contact deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete contact: ${error.message}`);
    },
  });
}

// Estimate Queries
export function useGetAllEstimates() {
  const { actor, isFetching } = useActor();

  return useQuery<Estimate[]>({
    queryKey: ['estimates'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllEstimates();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateEstimate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      customerName: string;
      customerAddress: string;
      lineItems: EstimateItem[];
      totalAmount: number;
      netAmount: number;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const newId = await actor.createEstimate(
        data.customerName,
        data.customerAddress,
        data.lineItems,
        data.totalAmount,
        data.netAmount
      );

      // Optimistically update cache with new estimate
      const newEstimate: Estimate = {
        id: newId,
        customerName: data.customerName,
        customerAddress: data.customerAddress,
        lineItems: data.lineItems,
        totalAmount: data.totalAmount,
        netAmount: data.netAmount,
        createdAt: BigInt(Date.now() * 1000000),
        isPaid: false,
        paidAmount: 0,
        pendingAmount: data.totalAmount,
        paymentReceivedTimestamp: undefined,
      };

      queryClient.setQueryData<Estimate[]>(['estimates'], (old) => {
        return old ? [...old, newEstimate] : [newEstimate];
      });

      return newId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to create estimate: ${error.message}`);
    },
  });
}

export function useUpdateEstimate() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      customerName: string;
      customerAddress: string;
      lineItems: EstimateItem[];
      totalAmount: number;
      netAmount: number;
      isPaid: boolean;
      pendingAmount: number;
      paidAmount: number;
      paymentReceivedTimestamp: Time | null | undefined;
    }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.updateEstimate(
        data.id,
        data.customerName,
        data.customerAddress,
        data.lineItems,
        data.totalAmount,
        data.netAmount,
        data.isPaid,
        data.pendingAmount,
        data.paidAmount,
        data.paymentReceivedTimestamp ?? null
      );

      // Optimistically update cache - convert null to undefined for paymentReceivedTimestamp
      queryClient.setQueryData<Estimate[]>(['estimates'], (old) => {
        if (!old) return old;
        return old.map((est) =>
          est.id === data.id
            ? {
                ...est,
                customerName: data.customerName,
                customerAddress: data.customerAddress,
                lineItems: data.lineItems,
                totalAmount: data.totalAmount,
                netAmount: data.netAmount,
                isPaid: data.isPaid,
                pendingAmount: data.pendingAmount,
                paidAmount: data.paidAmount,
                paymentReceivedTimestamp: data.paymentReceivedTimestamp ?? undefined,
              }
            : est
        );
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to update estimate: ${error.message}`);
    },
  });
}

export function useRecordEstimatePayment() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { estimateId: bigint; paidAmount: number }) => {
      if (!actor) throw new Error('Actor not available');
      await actor.recordEstimatePayment(data.estimateId, data.paidAmount);

      // Optimistically update cache
      queryClient.setQueryData<Estimate[]>(['estimates'], (old) => {
        if (!old) return old;
        return old.map((est) => {
          if (est.id === data.estimateId) {
            const isPaid = data.paidAmount >= est.totalAmount;
            const pendingAmount = Math.max(est.totalAmount - data.paidAmount, 0);
            return {
              ...est,
              paidAmount: data.paidAmount,
              pendingAmount,
              isPaid,
              paymentReceivedTimestamp: data.paidAmount > 0 ? BigInt(Date.now() * 1000000) : undefined,
            };
          }
          return est;
        });
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to record payment: ${error.message}`);
    },
  });
}

export function usePrintEstimate() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (estimateId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.printEstimate(estimateId);
    },
  });
}

// Purchase Queries
export function useGetAllPurchases() {
  const { actor, isFetching } = useActor();

  return useQuery<Purchase[]>({
    queryKey: ['purchases'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPurchases();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreatePurchase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      item: string;
      quantity: bigint;
      costPrice: number;
      sellingPrice: number;
      purchaser: string;
      notes: string;
      hasOverride: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createPurchase(
        data.item,
        data.quantity,
        data.costPrice,
        data.sellingPrice,
        data.purchaser,
        data.notes,
        data.hasOverride
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Purchase created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create purchase: ${error.message}`);
    },
  });
}

export function useUpdatePurchase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: bigint;
      item: string;
      quantity: bigint;
      costPrice: number;
      sellingPrice: number;
      purchaser: string;
      notes: string;
      hasOverride: boolean;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updatePurchase(
        data.id,
        data.item,
        data.quantity,
        data.costPrice,
        data.sellingPrice,
        data.purchaser,
        data.notes,
        data.hasOverride
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Purchase updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update purchase: ${error.message}`);
    },
  });
}

export function useDeletePurchase() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (purchaseId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deletePurchase(purchaseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      toast.success('Purchase deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete purchase: ${error.message}`);
    },
  });
}

// Company Branding Queries
export function useGetCompanyBranding() {
  const { actor, isFetching } = useActor();

  return useQuery<CompanyBranding | null>({
    queryKey: ['companyBranding'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCompanyBranding();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSetCompanyBranding() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; address: string; logo: ExternalBlob | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setCompanyBranding(data.name, data.address, data.logo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyBranding'] });
      toast.success('Company branding updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update company branding: ${error.message}`);
    },
  });
}

// Transaction Queries
export function useGetAllTransactions() {
  const { actor, isFetching } = useActor();

  return useQuery<Transaction[]>({
    queryKey: ['transactions'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllTransactions();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSearchTransactions() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (search: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.searchTransactions(search);
    },
  });
}

// Report Queries
export function useGenerateProfitAndLossReport() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (data: { startTime: Time; endTime: Time }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.generateProfitAndLossReport(data.startTime, data.endTime);
    },
  });
}

export function useGetReportTotals() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (data: { startTime: Time; endTime: Time }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.getReportTotals(data.startTime, data.endTime);
    },
  });
}
