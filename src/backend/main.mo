import Map "mo:core/Map";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Float "mo:core/Float";
import Nat "mo:core/Nat";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import UserApproval "user-approval/approval";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";

actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let approvalState = UserApproval.initState(accessControlState);

  public shared ({ caller }) func requestApproval() : async () {
    UserApproval.requestApproval(approvalState, caller);
  };

  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set approval status");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list approvals");
    };
    UserApproval.listApprovals(approvalState);
  };

  public type Product = {
    id : Nat;
    name : Text;
    category : Text;
    price : Float;
    stockQuantity : Int;
    isActive : Bool;
  };

  module Product {
    public func compare(a : Product, b : Product) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  public type Contact = {
    id : Nat;
    name : Text;
    contactInfo : Text;
    contactType : { #purchaser; #billTo };
    contactCategory : { #wholesaler; #retailer };
  };

  module Contact {
    public func compare(a : Contact, b : Contact) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  public type InventoryItem = {
    productId : Nat;
    quantity : Int;
    lastUpdated : Time.Time;
  };

  public type UserProfile = {
    name : Text;
  };

  public type EstimateItem = {
    description : Text;
    quantity : Float;
    rate : Float;
    amount : Float;
  };

  public type Estimate = {
    id : Nat;
    customerName : Text;
    customerAddress : Text;
    lineItems : [EstimateItem];
    totalAmount : Float;
    netAmount : Float;
    createdAt : Time.Time;
    isPaid : Bool;
    pendingAmount : Float;
    paidAmount : Float;
    paymentReceivedTimestamp : ?Time.Time;
  };

  public type CompanyBranding = {
    name : Text;
    address : Text;
    logo : ?Storage.ExternalBlob;
  };

  public type EstimatePrintData = {
    estimate : Estimate;
    companyBranding : ?CompanyBranding;
    previousPendingAmount : Float;
  };

  module Estimate {
    public func compare(a : Estimate, b : Estimate) : Order.Order {
      Nat.compare(a.id, b.id);
    };
  };

  public type Purchase = {
    id : Nat;
    item : Text;
    quantity : Int;
    costPrice : Float;
    sellingPrice : Float;
    purchaser : Text;
    notes : Text;
    purchaseDate : Time.Time;
    profitPercentage : Float;
    hasOverride : Bool;
  };

  public type PriceOverrideRequest = {
    id : Nat;
    requestType : { #purchase; #estimate };
    referenceId : ?Nat;
    costPrice : Float;
    sellingPrice : Float;
    requestedBy : Principal;
    requestedAt : Time.Time;
    status : { #pending; #approved; #rejected };
  };

  public type TransactionType = { #purchase; #estimate };

  public type Transaction = {
    transactionType : TransactionType;
    id : Nat;
    itemOrCustomer : Text;
    quantity : Int;
    price : Float;
    date : Time.Time;
  };

  public type ProfitAndLoss = {
    totalIncome : Float;
    totalExpense : Float;
    netProfit : Float;
    startTime : Time.Time;
    endTime : Time.Time;
  };

  public type BackupData = {
    products : [(Nat, Product)];
    contacts : [(Nat, Contact)];
    inventory : [(Nat, InventoryItem)];
    estimates : [(Nat, Estimate)];
    purchases : [(Nat, Purchase)];
    userProfiles : [(Principal, UserProfile)];
    priceOverrideRequests : [(Nat, PriceOverrideRequest)];
    companyBranding : ?CompanyBranding;
  };

  let products = Map.empty<Nat, Product>();
  let contacts = Map.empty<Nat, Contact>();
  let inventory = Map.empty<Nat, InventoryItem>();
  let estimates = Map.empty<Nat, Estimate>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let purchases = Map.empty<Nat, Purchase>();
  let priceOverrideRequests = Map.empty<Nat, PriceOverrideRequest>();

  var companyBranding : ?CompanyBranding = ?{
    name = "PN TRADING";
    address = "121 Gopi Krishna Vihar Colony Ahmedabad";
    logo = null;
  };

  include MixinStorage();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public shared ({ caller }) func backupExport() : async BackupData {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can export backup data");
    };
    {
      products = products.toArray();
      contacts = contacts.toArray();
      inventory = inventory.toArray();
      estimates = estimates.toArray();
      purchases = purchases.toArray();
      userProfiles = userProfiles.toArray();
      priceOverrideRequests = priceOverrideRequests.toArray();
      companyBranding;
    };
  };

  public shared ({ caller }) func backupImport(backup : BackupData) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can import backup data");
    };

    products.clear();
    contacts.clear();
    inventory.clear();
    estimates.clear();
    purchases.clear();
    userProfiles.clear();
    priceOverrideRequests.clear();

    for ((k, v) in backup.products.values()) { products.add(k, v) };
    for ((k, v) in backup.contacts.values()) { contacts.add(k, v) };
    for ((k, v) in backup.inventory.values()) { inventory.add(k, v) };
    for ((k, v) in backup.estimates.values()) { estimates.add(k, v) };
    for ((k, v) in backup.purchases.values()) { purchases.add(k, v) };
    for ((k, v) in backup.userProfiles.values()) { userProfiles.add(k, v) };
    for ((k, v) in backup.priceOverrideRequests.values()) { priceOverrideRequests.add(k, v) };
    companyBranding := backup.companyBranding;
  };

  public shared ({ caller }) func addProduct(name : Text, category : Text, price : Float) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add products");
    };
    let productId = products.size() + 1;
    let product : Product = {
      id = productId;
      name;
      category;
      price;
      stockQuantity = 0;
      isActive = true;
    };
    products.add(productId, product);
    productId;
  };

  public query ({ caller }) func getAllProducts() : async [Product] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view products");
    };
    products.values().toArray().sort();
  };

  public shared ({ caller }) func updateProduct(productId : Nat, name : Text, category : Text, price : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update products");
    };
    switch (products.get(productId)) {
      case (null) { () };
      case (?existingProduct) {
        let updatedProduct : Product = {
          id = productId;
          name;
          category;
          price;
          stockQuantity = existingProduct.stockQuantity;
          isActive = existingProduct.isActive;
        };
        products.add(productId, updatedProduct);
      };
    };
  };

  public shared ({ caller }) func deleteProduct(productId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete products");
    };
    products.remove(productId);
  };

  public shared ({ caller }) func updateStock(productId : Nat, quantity : Int) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update stock");
    };
    switch (products.get(productId)) {
      case (null) { () };
      case (?existingProduct) {
        let updatedProduct : Product = {
          id = existingProduct.id;
          name = existingProduct.name;
          category = existingProduct.category;
          price = existingProduct.price;
          stockQuantity = quantity;
          isActive = existingProduct.isActive;
        };
        products.add(productId, updatedProduct);

        let inventoryItem : InventoryItem = {
          productId;
          quantity;
          lastUpdated = Time.now();
        };
        inventory.add(productId, inventoryItem);
      };
    };
  };

  public shared ({ caller }) func addContact(
    name : Text,
    contactInfo : Text,
    contactType : { #purchaser; #billTo },
    contactCategory : { #wholesaler; #retailer },
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add contacts");
    };
    let contactId = contacts.size() + 1;
    let contact : Contact = {
      id = contactId;
      name;
      contactInfo;
      contactType;
      contactCategory;
    };
    contacts.add(contactId, contact);
    contactId;
  };

  public query ({ caller }) func getAllContacts() : async [Contact] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view contacts");
    };
    contacts.values().toArray().sort();
  };

  public query ({ caller }) func getBillToContacts() : async [Contact] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view contacts");
    };
    contacts.values().toArray().sort().filter(
      func(c) {
        switch (c.contactType) {
          case (#billTo) { true };
          case (_) { false };
        };
      }
    );
  };

  public query ({ caller }) func getPurchaserContacts() : async [Contact] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view contacts");
    };
    contacts.values().toArray().sort().filter(
      func(c) {
        switch (c.contactType) {
          case (#purchaser) { true };
          case (_) { false };
        };
      }
    );
  };

  public shared ({ caller }) func updateContact(
    contactId : Nat,
    name : Text,
    contactInfo : Text,
    contactType : { #purchaser; #billTo },
    contactCategory : { #wholesaler; #retailer },
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update contacts");
    };
    switch (contacts.get(contactId)) {
      case (null) { () };
      case (?_) {
        let updatedContact : Contact = {
          id = contactId;
          name;
          contactInfo;
          contactType;
          contactCategory;
        };
        contacts.add(contactId, updatedContact);
      };
    };
  };

  public shared ({ caller }) func deleteContact(contactId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete contacts");
    };
    contacts.remove(contactId);
  };

  public query ({ caller }) func validatePricing(costPrice : Float, sellingPrice : Float) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can validate pricing");
    };
    sellingPrice >= costPrice;
  };

  public shared ({ caller }) func createPurchase(
    item : Text,
    quantity : Int,
    costPrice : Float,
    sellingPrice : Float,
    purchaser : Text,
    notes : Text,
    hasOverride : Bool,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create purchases");
    };
    let purchaseId = purchases.size() + 1;
    let purchase : Purchase = {
      id = purchaseId;
      item;
      quantity;
      costPrice;
      sellingPrice;
      purchaser;
      notes;
      purchaseDate = Time.now();
      profitPercentage = calculateProfitPercentage(costPrice, sellingPrice);
      hasOverride;
    };

    switch (products.values().find(func(product) { product.name == item })) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) {
        updateInventory(product.id, quantity);
        purchases.add(purchaseId, purchase);
        purchaseId;
      };
    };
  };

  public shared ({ caller }) func updatePurchase(
    purchaseId : Nat,
    item : Text,
    quantity : Int,
    costPrice : Float,
    sellingPrice : Float,
    purchaser : Text,
    notes : Text,
    hasOverride : Bool,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update purchases");
    };
    switch (purchases.get(purchaseId)) {
      case (null) { () };
      case (?existingPurchase) {
        switch (products.values().find(func(product) { product.name == item })) {
          case (null) { () };
          case (?_) {
            let updatedPurchase : Purchase = {
              id = purchaseId;
              item;
              quantity;
              costPrice;
              sellingPrice;
              purchaser;
              notes;
              purchaseDate = existingPurchase.purchaseDate;
              profitPercentage = calculateProfitPercentage(costPrice, sellingPrice);
              hasOverride;
            };
            purchases.add(purchaseId, updatedPurchase);
          };
        };
      };
    };
  };

  public query ({ caller }) func getAllPurchases() : async [Purchase] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view purchases");
    };
    purchases.values().toArray();
  };

  public shared ({ caller }) func deletePurchase(purchaseId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete purchases");
    };
    purchases.remove(purchaseId);
  };

  public shared ({ caller }) func requestPriceOverride(
    requestType : { #purchase; #estimate },
    costPrice : Float,
    sellingPrice : Float,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can request price overrides");
    };
    let requestId = priceOverrideRequests.size() + 1;
    let request : PriceOverrideRequest = {
      id = requestId;
      requestType;
      referenceId = null;
      costPrice;
      sellingPrice;
      requestedBy = caller;
      requestedAt = Time.now();
      status = #pending;
    };
    priceOverrideRequests.add(requestId, request);
    requestId;
  };

  public shared ({ caller }) func approvePriceOverride(requestId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can approve price overrides");
    };
    switch (priceOverrideRequests.get(requestId)) {
      case (null) { () };
      case (?request) {
        let updatedRequest : PriceOverrideRequest = {
          id = request.id;
          requestType = request.requestType;
          referenceId = request.referenceId;
          costPrice = request.costPrice;
          sellingPrice = request.sellingPrice;
          requestedBy = request.requestedBy;
          requestedAt = request.requestedAt;
          status = #approved;
        };
        priceOverrideRequests.add(requestId, updatedRequest);
      };
    };
  };

  public shared ({ caller }) func rejectPriceOverride(requestId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reject price overrides");
    };
    switch (priceOverrideRequests.get(requestId)) {
      case (null) { () };
      case (?request) {
        let updatedRequest : PriceOverrideRequest = {
          id = request.id;
          requestType = request.requestType;
          referenceId = request.referenceId;
          costPrice = request.costPrice;
          sellingPrice = request.sellingPrice;
          requestedBy = request.requestedBy;
          requestedAt = request.requestedAt;
          status = #rejected;
        };
        priceOverrideRequests.add(requestId, updatedRequest);
      };
    };
  };

  public query ({ caller }) func getPriceOverrideRequests() : async [PriceOverrideRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view price override requests");
    };
    priceOverrideRequests.values().toArray();
  };

  public shared ({ caller }) func createEstimate(
    customerName : Text,
    customerAddress : Text,
    lineItems : [EstimateItem],
    totalAmount : Float,
    netAmount : Float,
  ) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create estimates");
    };
    let estimateId = getNextEstimateId();
    let estimate : Estimate = {
      id = estimateId;
      customerName;
      customerAddress;
      lineItems;
      totalAmount;
      netAmount;
      createdAt = Time.now();
      isPaid = false;
      paidAmount = 0;
      pendingAmount = totalAmount;
      paymentReceivedTimestamp = null;
    };

    updateEstimateInventory(lineItems, false);
    estimates.add(estimateId, estimate);
    estimateId;
  };

  public query ({ caller }) func getAllEstimates() : async [Estimate] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view estimates");
    };
    estimates.values().toArray().sort();
  };

  public shared ({ caller }) func updateEstimate(
    estimateId : Nat,
    customerName : Text,
    customerAddress : Text,
    lineItems : [EstimateItem],
    totalAmount : Float,
    netAmount : Float,
    isPaid : Bool,
    pendingAmount : Float,
    paidAmount : Float,
    paymentReceivedTimestamp : ?Time.Time,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update estimates");
    };
    switch (estimates.get(estimateId)) {
      case (null) { () };
      case (?existingEstimate) {
        updateEstimateInventory(existingEstimate.lineItems, true);

        let updatedEstimate : Estimate = {
          id = estimateId;
          customerName;
          customerAddress;
          lineItems;
          totalAmount;
          netAmount;
          createdAt = existingEstimate.createdAt;
          isPaid;
          pendingAmount;
          paidAmount;
          paymentReceivedTimestamp;
        };

        updateEstimateInventory(lineItems, false);

        estimates.add(estimateId, updatedEstimate);
      };
    };
  };

  public shared ({ caller }) func markEstimateAsPaid(estimateId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark estimates as paid");
    };
    switch (estimates.get(estimateId)) {
      case (null) { () };
      case (?existingEstimate) {
        let updatedEstimate : Estimate = {
          id = estimateId;
          customerName = existingEstimate.customerName;
          customerAddress = existingEstimate.customerAddress;
          lineItems = existingEstimate.lineItems;
          totalAmount = existingEstimate.totalAmount;
          netAmount = existingEstimate.netAmount;
          createdAt = existingEstimate.createdAt;
          isPaid = true;
          paidAmount = existingEstimate.totalAmount;
          pendingAmount = 0.0;
          paymentReceivedTimestamp = ?Time.now();
        };
        estimates.add(estimateId, updatedEstimate);
      };
    };
  };

  public shared ({ caller }) func recordEstimatePayment(estimateId : Nat, paidAmount : Float) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can record estimate payments");
    };
    switch (estimates.get(estimateId)) {
      case (null) { () };
      case (?existingEstimate) {
        let updatedEstimate : Estimate = {
          id = estimateId;
          customerName = existingEstimate.customerName;
          customerAddress = existingEstimate.customerAddress;
          lineItems = existingEstimate.lineItems;
          totalAmount = existingEstimate.totalAmount;
          netAmount = existingEstimate.netAmount;
          createdAt = existingEstimate.createdAt;
          isPaid = paidAmount >= existingEstimate.totalAmount;
          paidAmount;
          pendingAmount = Float.max(existingEstimate.totalAmount - paidAmount, 0);
          paymentReceivedTimestamp = if (paidAmount > 0) { ?Time.now() } else { null };
        };
        estimates.add(estimateId, updatedEstimate);
      };
    };
  };

  public shared ({ caller }) func setCompanyBranding(name : Text, address : Text, logo : ?Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set company branding");
    };
    companyBranding := ?{
      name;
      address;
      logo;
    };
  };

  public query ({ caller }) func getCompanyBranding() : async ?CompanyBranding {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view company branding");
    };
    companyBranding;
  };

  public query ({ caller }) func printEstimate(estimateId : Nat) : async EstimatePrintData {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can print estimates");
    };
    switch (estimates.get(estimateId)) {
      case (null) { { estimate = getDefaultEstimate(); companyBranding = null; previousPendingAmount = 0.0 } };
      case (?estimate) {
        let previous = calculatePreviousPending(estimate.customerName, estimateId);
        {
          estimate;
          companyBranding;
          previousPendingAmount = previous;
        };
      };
    };
  };

  public query ({ caller }) func getReportTotals(startTime : Time.Time, endTime : Time.Time) : async (Float, Float) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view report totals");
    };
    var totalIncome : Float = 0;
    var totalExpense : Float = 0;

    for ((_, estimate) in estimates.entries()) {
      if (estimate.createdAt >= startTime and estimate.createdAt <= endTime) {
        totalIncome += estimate.paidAmount;
      };
    };

    for ((_, purchase) in purchases.entries()) {
      if (purchase.purchaseDate >= startTime and purchase.purchaseDate <= endTime) {
        totalExpense += purchase.costPrice * purchase.quantity.toFloat();
      };
    };

    (totalIncome, totalExpense);
  };

  public query ({ caller }) func generateProfitAndLossReport(startTime : Time.Time, endTime : Time.Time) : async ProfitAndLoss {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can generate profit and loss reports");
    };
    var totalIncome : Float = 0;
    var totalExpense : Float = 0;

    for ((_, estimate) in estimates.entries()) {
      if (estimate.createdAt >= startTime and estimate.createdAt <= endTime) {
        totalIncome += estimate.paidAmount;
      };
    };

    for ((_, purchase) in purchases.entries()) {
      if (purchase.purchaseDate >= startTime and purchase.purchaseDate <= endTime) {
        totalExpense += purchase.costPrice * purchase.quantity.toFloat();
      };
    };

    let netProfit = totalIncome - totalExpense;

    {
      totalIncome;
      totalExpense;
      netProfit;
      startTime;
      endTime;
    };
  };

  public shared ({ caller }) func getAllTransactions() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };
    let purchaseTransactions = purchases.values().toArray().map<Purchase, [Transaction]>(
      func(purchase) {
        [{ transactionType = #purchase; id = purchase.id; itemOrCustomer = purchase.item; quantity = purchase.quantity; price = purchase.costPrice; date = purchase.purchaseDate }];
      }
    );

    let estimateTransactions = estimates.values().toArray().map<Estimate, [Transaction]>(
      func(estimate) {
        [{ transactionType = #estimate; id = estimate.id; itemOrCustomer = estimate.customerName; quantity = estimate.lineItems.size(); price = estimate.totalAmount; date = estimate.createdAt }];
      }
    );

    purchaseTransactions.concat(estimateTransactions).flatten();
  };

  public shared ({ caller }) func searchTransactions(search : Text) : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search transactions");
    };
    let allTransactions = await getAllTransactions();
    allTransactions.filter(
      func(transaction) {
        transaction.itemOrCustomer.contains(#text search);
      }
    );
  };

  func calculateProfitPercentage(costPrice : Float, sellingPrice : Float) : Float {
    if (costPrice == 0) { return 0 };
    ((sellingPrice - costPrice) / costPrice) * 100.0;
  };

  func updateInventory(productId : Nat, quantityChange : Int) {
    switch (products.get(productId)) {
      case (null) { () };
      case (?product) {
        let newQuantity = product.stockQuantity + quantityChange;
        let updatedProduct = {
          id = product.id;
          name = product.name;
          category = product.category;
          price = product.price;
          stockQuantity = newQuantity;
          isActive = product.isActive;
        };
        products.add(productId, updatedProduct);

        let inventoryItem = {
          productId;
          quantity = newQuantity;
          lastUpdated = Time.now();
        };
        inventory.add(productId, inventoryItem);
      };
    };
  };

  func updateEstimateInventory(lineItems : [EstimateItem], restoring : Bool) {
    for (lineItem in lineItems.values()) {
      let quantity = lineItem.quantity.toInt();
      switch (products.values().find(func(product) { product.name == lineItem.description })) {
        case (null) { () };
        case (?product) {
          updateInventory(product.id, if (restoring) { quantity } else { -quantity });
        };
      };
    };
  };

  func getNextEstimateId() : Nat {
    estimates.size() + 1;
  };

  func calculatePreviousPending(customerName : Text, currentEstimateId : Nat) : Float {
    var previousPending : Float = 0;
    for (estimate in estimates.values()) {
      if (estimate.customerName == customerName and estimate.id < currentEstimateId) {
        previousPending += estimate.pendingAmount;
      };
    };
    previousPending;
  };

  func getDefaultEstimate() : Estimate {
    {
      id = 0;
      customerName = "N/A";
      customerAddress = "N/A";
      lineItems = [];
      totalAmount = 0.0;
      netAmount = 0.0;
      createdAt = 0;
      isPaid = false;
      paidAmount = 0.0;
      pendingAmount = 0.0;
      paymentReceivedTimestamp = null;
    };
  };
};
