export interface AccountGroup {
  id: number;
  name: string;
  accountType: number;
  code?: number | null;
  accountTypeName?: string;
}

export interface Category {
  id: number;
  name: string;
  SubCategories?: Subcategory[];
  categoryTotalValue?: number;
}

export interface Expense {
  id: number;
  expenseLedgerAccount: number;
  date: string;
  amount: number;
  description: string;
  LedgerAccount?: LedgerAccount;
}

export interface JournalEntry {
  ledgerId: number | "";
  description: string | null;
  amount: number | null;
  type: "Debit" | "Credit" | "";
  LedgerAccount?: LedgerAccount;
  accountGroup: number | "";
  accountType: number | "";
  filteredAccountGroups?: AccountGroup[];
  filteredLedgerAccount?: LedgerAccount[];
}

export interface LedgerAccount {
  id: number;
  name: string;
  accountGroup: number | "";
  AccountGroup?: AccountGroup;
  code?: string;
  accountType?: number | "";
}

export interface LedgerEntries {
  id: number;
  amount: number;
  type: "Debit" | "Credit";
  createdAt: string;
  description?: string;
  ledgerId: number;
  LedgerAccount: {
    id: number;
    name: string;
    AccountGroup: {
      id: number;
      name: string;
      accountType: number;
    };
  };
  Transaction: Transaction;
}

export interface Product {
  id: number;
  name: string;
  categoryId: number;
  subCategoryId: number;
  stock: number;
  price: number;
  Category: Category;
  SubCategory: Subcategory;
  unit: string;
  stockValue?: number;
}

export interface ProductSort {
  name: string;
  stock: number;
  category: string;
  SubCategory: Subcategory;
  price: number;
}

export interface Purchase {
  id: number;
  supplierId: number | "";
  date: string;
  totalPrice?: number;
  isPaymentMethodCash: boolean;
  Supplier?: { name: string };
  PurchaseItems?: PurchaseItem[];
  discount: number;
}

export interface PurchaseItem {
  productId: number | "";
  categoryId: number | "";
  subCategoryId: number | "";
  quantity: number | null;
  purchasePrice: number | null;
  Product?: Product;
  filteredSubcategories?: Subcategory[];
  filteredProducts?: Product[];
}

export interface PurchaseReturn {
  id: number;
  supplierId: number | "";
  date: string;
  totalPrice?: number;
  reason: string;
  isPaymentMethodCash: boolean;
  Supplier?: { name: string };
  PurchaseReturnItems?: PurchaseReturnItem[];
}

export interface PurchaseReturnItem {
  productId: number | "";
  categoryId: number | "";
  subCategoryId: number | "";
  quantity: number | null;
  purchaseReturnPrice: number | null;
  Product?: Product;
  filteredSubcategories?: Subcategory[];
  filteredProducts?: Product[];
}

export interface Sales {
  id: number;
  date: string;
  customerName: string;
  isPaymentMethodCash: boolean;
  discount: number;
  totalPrice?: number;
  SalesItems?: SalesItem[];
}

export interface SalesItem {
  productId: number | "";
  categoryId: number | "";
  subCategoryId: number | "";
  quantity: number | null;
  sellingPrice: number | null;
  costPrice: number | null;
  stock: number | null;
  unit: string | null;
  lastSellingPrice: number | null;
  Product?: Product;
  filteredSubcategories?: Subcategory[];
  filteredProducts?: Product[];
  totalSold?: number;
  Sale?: Sales;
}

export interface SalesReturn {
  id: number;
  date: string;
  customerName: string;
  isPaymentMethodCash: boolean;
  reason: string;
  totalPrice?: number;
  SalesReturnItems?: SalesReturnItem[];
}

export interface SalesReturnItem {
  productId: number | "";
  categoryId: number | "";
  subCategoryId: number | "";
  quantity: number | null;
  returnPrice: number | null;
  Product?: Product;
  filteredSubcategories?: Subcategory[];
  filteredProducts?: Product[];
}

export interface Subcategory {
  id: number;
  name: string;
  categoryId: number;
  Category?: Category;
  Products?: Product[];
  subTotalValue?: number;
}

export interface Supplier {
  id: number;
  name: string;
  phoneNumber?: string;
  payableAmount: number;
}

export interface Transaction {
  dataValues?: {
    purchaseDetails: Purchase;
  };
  refId?: number;
  id?: number;
  date: string;
  type:
    | "Sale"
    | "Purchase"
    | "Sales Return"
    | "Purchase Return"
    | "Manual Entry"
    | "Expense"
    | "";
  referenceId: string | null;
  totalAmount: number | null;
  JournalEntries?: JournalEntry[];
  quantity?: number;
  price?: number;
  purchaseDetails?: Purchase;
}

export interface _PurchaseItem {
  productId: number;
  quantity: number;
  purchasePrice: number;
}

export interface _PurchaseReturnItem {
  productId: number;
  quantity: number;
  purchaseReturnPrice: number;
}

export interface _SalesItem {
  productId: number;
  quantity: number;
  sellingPrice: number;
  costPrice: number;
}

export interface _SalesReturnItem {
  productId: number;
  quantity: number;
  returnPrice: number;
}

export interface SalesReportProduct {
  id: number;
  name: string;
  quantity: number;
  revenue: number;
  profit: number;
}

export interface SalesReportSubCategory {
  id: number;
  name: string;
  revenue: number;
  profit: number;
  products: Map<number, SalesReportProduct>;
}

export interface SalesReportCategory {
  id: number;
  name: string;
  revenue: number;
  profit: number;
  subcategories: Map<number, SalesReportSubCategory>;
}

export interface FinalSalesReportProduct {
  id: number;
  name: string;
  quantity: number;
  revenue: number;
  profit: number;
}

export interface FinalSalesReportSubCategory {
  id: number;
  name: string;
  revenue: number;
  profit: number;
  products: FinalSalesReportProduct[];
}

export interface FinalSalesReportCategory {
  id: number;
  name: string;
  revenue: number;
  profit: number;
  subcategories: FinalSalesReportSubCategory[];
}

export interface SalesReportResponse {
  totalRevenue: number;
  totalProfit: number;
  byCategory: FinalSalesReportCategory[];
}
