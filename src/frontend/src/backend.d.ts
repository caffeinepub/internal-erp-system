import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface PriceOverrideRequest {
    id: bigint;
    status: Variant_pending_approved_rejected;
    referenceId?: bigint;
    sellingPrice: number;
    costPrice: number;
    requestType: Variant_estimate_purchase;
    requestedAt: Time;
    requestedBy: Principal;
}
export type Time = bigint;
export interface Contact {
    id: bigint;
    contactInfo: string;
    contactCategory: Variant_wholesaler_retailer;
    contactType: Variant_purchaser_billTo;
    name: string;
}
export interface ProfitAndLoss {
    startTime: Time;
    endTime: Time;
    totalIncome: number;
    totalExpense: number;
    netProfit: number;
}
export interface CompanyBranding {
    logo?: ExternalBlob;
    name: string;
    address: string;
}
export interface Transaction {
    id: bigint;
    transactionType: TransactionType;
    date: Time;
    itemOrCustomer: string;
    quantity: bigint;
    price: number;
}
export interface InventoryItem {
    lastUpdated: Time;
    productId: bigint;
    quantity: bigint;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface EstimatePrintData {
    companyBranding?: CompanyBranding;
    estimate: Estimate;
    previousPendingAmount: number;
}
export interface BackupData {
    contacts: Array<[bigint, Contact]>;
    priceOverrideRequests: Array<[bigint, PriceOverrideRequest]>;
    inventory: Array<[bigint, InventoryItem]>;
    companyBranding?: CompanyBranding;
    userProfiles: Array<[Principal, UserProfile]>;
    purchases: Array<[bigint, Purchase]>;
    estimates: Array<[bigint, Estimate]>;
    products: Array<[bigint, Product]>;
}
export interface Estimate {
    id: bigint;
    customerName: string;
    lineItems: Array<EstimateItem>;
    netAmount: number;
    createdAt: Time;
    paymentReceivedTimestamp?: Time;
    isPaid: boolean;
    customerAddress: string;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
}
export interface Purchase {
    id: bigint;
    hasOverride: boolean;
    purchaseDate: Time;
    item: string;
    sellingPrice: number;
    notes: string;
    purchaser: string;
    quantity: bigint;
    costPrice: number;
    profitPercentage: number;
}
export interface EstimateItem {
    rate: number;
    description: string;
    quantity: number;
    amount: number;
}
export interface Product {
    id: bigint;
    stockQuantity: bigint;
    name: string;
    isActive: boolean;
    category: string;
    price: number;
}
export interface UserProfile {
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_estimate_purchase {
    estimate = "estimate",
    purchase = "purchase"
}
export enum Variant_pending_approved_rejected {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum Variant_purchaser_billTo {
    purchaser = "purchaser",
    billTo = "billTo"
}
export enum Variant_wholesaler_retailer {
    wholesaler = "wholesaler",
    retailer = "retailer"
}
export interface backendInterface {
    addContact(name: string, contactInfo: string, contactType: Variant_purchaser_billTo, contactCategory: Variant_wholesaler_retailer): Promise<bigint>;
    addProduct(name: string, category: string, price: number): Promise<bigint>;
    approvePriceOverride(requestId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    backupExport(): Promise<BackupData>;
    backupImport(backup: BackupData): Promise<void>;
    createEstimate(customerName: string, customerAddress: string, lineItems: Array<EstimateItem>, totalAmount: number, netAmount: number): Promise<bigint>;
    createPurchase(item: string, quantity: bigint, costPrice: number, sellingPrice: number, purchaser: string, notes: string, hasOverride: boolean): Promise<bigint>;
    deleteContact(contactId: bigint): Promise<void>;
    deleteProduct(productId: bigint): Promise<void>;
    deletePurchase(purchaseId: bigint): Promise<void>;
    generateProfitAndLossReport(startTime: Time, endTime: Time): Promise<ProfitAndLoss>;
    getAllContacts(): Promise<Array<Contact>>;
    getAllEstimates(): Promise<Array<Estimate>>;
    getAllProducts(): Promise<Array<Product>>;
    getAllPurchases(): Promise<Array<Purchase>>;
    getAllTransactions(): Promise<Array<Transaction>>;
    getBillToContacts(): Promise<Array<Contact>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCompanyBranding(): Promise<CompanyBranding | null>;
    getPriceOverrideRequests(): Promise<Array<PriceOverrideRequest>>;
    getPurchaserContacts(): Promise<Array<Contact>>;
    getReportTotals(startTime: Time, endTime: Time): Promise<[number, number]>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    isOpenAccess(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    markEstimateAsPaid(estimateId: bigint): Promise<void>;
    printEstimate(estimateId: bigint): Promise<EstimatePrintData>;
    recordEstimatePayment(estimateId: bigint, paidAmount: number): Promise<void>;
    rejectPriceOverride(requestId: bigint): Promise<void>;
    requestApproval(): Promise<void>;
    requestPriceOverride(requestType: Variant_estimate_purchase, costPrice: number, sellingPrice: number): Promise<bigint>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    searchTransactions(search: string): Promise<Array<Transaction>>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    setCompanyBranding(name: string, address: string, logo: ExternalBlob | null): Promise<void>;
    toggleOpenAccess(value: boolean): Promise<void>;
    updateContact(contactId: bigint, name: string, contactInfo: string, contactType: Variant_purchaser_billTo, contactCategory: Variant_wholesaler_retailer): Promise<void>;
    updateEstimate(estimateId: bigint, customerName: string, customerAddress: string, lineItems: Array<EstimateItem>, totalAmount: number, netAmount: number, isPaid: boolean, pendingAmount: number, paidAmount: number, paymentReceivedTimestamp: Time | null): Promise<void>;
    updateProduct(productId: bigint, name: string, category: string, price: number): Promise<void>;
    updatePurchase(purchaseId: bigint, item: string, quantity: bigint, costPrice: number, sellingPrice: number, purchaser: string, notes: string, hasOverride: boolean): Promise<void>;
    updateStock(productId: bigint, quantity: bigint): Promise<void>;
    validatePricing(costPrice: number, sellingPrice: number): Promise<boolean>;
    validateUser(): Promise<boolean>;
}
