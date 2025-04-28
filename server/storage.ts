import { users, type User, type InsertUser, companies, type Company, type InsertCompany, 
  expenses, type Expense, type InsertExpense, accounts, type Account, type InsertAccount,
  products, type Product, type InsertProduct, productionOrders, type ProductionOrder, type InsertProductionOrder,
  equipment, type Equipment, type InsertEquipment, maintenanceOrders, type MaintenanceOrder, type InsertMaintenanceOrder,
  rawMaterials, type RawMaterial, type InsertRawMaterial,
  chatRooms, type ChatRoom, type InsertChatRoom, chatMessages, type ChatMessage, type InsertChatMessage,
  chatRoomParticipants, type ChatRoomParticipant, type InsertChatRoomParticipant,
  fiscalCertificates, type FiscalCertificate, type InsertFiscalCertificate,
  fiscalNCMs, type FiscalNCM, type InsertFiscalNCM,
  fiscalCFOPs, type FiscalCFOP, type InsertFiscalCFOP,
  fiscalCSTs, type FiscalCST, type InsertFiscalCST,
  fiscalConfigs, type FiscalConfig, type InsertFiscalConfig,
  nfes, type NFe, type InsertNFe,
  nfeItens, type NFeItem, type InsertNFeItem,
  nfeEventos, type NFeEvento, type InsertNFeEvento,
  produtosFiscais, type ProdutoFiscal, type InsertProdutoFiscal,
  measurementUnits, type MeasurementUnit, type InsertMeasurementUnit,
  // Quotation and Pricing
  quotations, type Quotation, type InsertQuotation,
  quotationItems, type QuotationItem, type InsertQuotationItem,
  supplierQuotations, type SupplierQuotation, type InsertSupplierQuotation,
  productPricing, type ProductPricing, type InsertProductPricing,
  productFormulas, type ProductFormula, type InsertProductFormula,
  // HR Module
  employees, type Employee, type InsertEmployee,
  departments, type Department, type InsertDepartment,
  positions, type Position, type InsertPosition,
  leaves, type Leave, type InsertLeave,
  payroll, type Payroll, type InsertPayroll,
  // Alert System
  systemAlerts, type SystemAlert, type InsertSystemAlert,
  // Support Module
  supportTickets, type SupportTicket, type InsertSupportTicket,
  knowledgeArticles, type KnowledgeArticle, type InsertKnowledgeArticle
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

// Importa a implementação do armazenamento de banco de dados PostgreSQL
import { DatabaseStorage } from "./database-storage";

const MemoryStore = createMemoryStore(session);
// Definindo o tipo como any para evitar problemas de tipagem
type SessionStore = any;

export interface IStorage {
  // Métodos para Chat e uploads
  isChatRoomParticipant(roomId: number, userId: number): Promise<boolean>;
  getChatRoom(roomId: number): Promise<any>;
  getChatMessages(roomId: number, limit: number, offset: number): Promise<any[]>;
  createChatMessage(message: any): Promise<any>;
  updateChatMessageReadStatus(messageId: number, userId: number): Promise<boolean>;
  getChatUpload(uploadId: number): Promise<any>;
  getChatUploads(roomId: number): Promise<any[]>;
  createChatUpload(upload: any): Promise<any>;
  deleteChatUpload(uploadId: number): Promise<boolean>;
  // User related
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number | string, data: Partial<User>): Promise<User>;
  
  // Company related
  getCompany(): Promise<Company | undefined>;
  updateCompany(data: Partial<Company>): Promise<Company>;
  
  // Customers (Clientes) related
  getCustomer(id: number): Promise<any | undefined>;
  getCustomerByCnpj(cnpj: string): Promise<any | undefined>;
  getCustomerByCpf(cpf: string): Promise<any | undefined>;
  createCustomer(customer: any): Promise<any>;
  
  // Suppliers (Fornecedores) related
  getSupplierByCnpj(cnpj: string): Promise<any | undefined>;
  getSupplierByCpf(cpf: string): Promise<any | undefined>;
  createSupplier(supplier: any): Promise<any>;
  
  // Raw Materials related
  getRawMaterial(id: number): Promise<RawMaterial | undefined>;
  getRawMaterialByCode(code: string): Promise<RawMaterial | undefined>;
  getRawMaterialByName(name: string): Promise<RawMaterial | undefined>;
  updateRawMaterialStock(id: number, quantityToAdd: number): Promise<RawMaterial>;
  
  // Products related
  getProduct(id: number): Promise<Product | undefined>;
  getProductByCode(code: string): Promise<Product | undefined>;
  getProductFormulas(productId: number): Promise<ProductFormula[]>;
  getProductFormula(id: number): Promise<ProductFormula | undefined>;
  createProductFormula(formula: InsertProductFormula): Promise<ProductFormula>;
  updateProductFormula(id: number, data: Partial<ProductFormula>): Promise<ProductFormula>;
  deleteProductFormula(id: number): Promise<boolean>;
  
  // Fiscal certificates
  getFiscalCertificates(): Promise<FiscalCertificate[]>;
  getFiscalCertificateById(id: number): Promise<FiscalCertificate | undefined>;
  createFiscalCertificate(certificate: InsertFiscalCertificate): Promise<FiscalCertificate>;
  updateFiscalCertificate(id: number, data: Partial<FiscalCertificate>): Promise<FiscalCertificate>;
  deleteFiscalCertificate(id: number): Promise<boolean>;
  
  // Fiscal NCMs
  getFiscalNCMs(): Promise<FiscalNCM[]>;
  getFiscalNCM(id: number): Promise<FiscalNCM | undefined>;
  getFiscalNCMByCode(code: string): Promise<FiscalNCM | undefined>;
  createFiscalNCM(ncm: InsertFiscalNCM): Promise<FiscalNCM>;
  updateFiscalNCM(id: number, data: Partial<FiscalNCM>): Promise<FiscalNCM>;
  deleteFiscalNCM(id: number): Promise<boolean>;
  
  // Fiscal CFOPs
  getFiscalCFOPs(): Promise<FiscalCFOP[]>;
  getFiscalCFOP(id: number): Promise<FiscalCFOP | undefined>;
  getFiscalCFOPByCode(code: string): Promise<FiscalCFOP | undefined>;
  createFiscalCFOP(cfop: InsertFiscalCFOP): Promise<FiscalCFOP>;
  updateFiscalCFOP(id: number, data: Partial<FiscalCFOP>): Promise<FiscalCFOP>;
  deleteFiscalCFOP(id: number): Promise<boolean>;
  
  // Fiscal CSTs
  getFiscalCSTs(): Promise<FiscalCST[]>;
  getFiscalCST(id: number): Promise<FiscalCST | undefined>;
  getFiscalCSTByCode(code: string, tipo: string): Promise<FiscalCST | undefined>;
  createFiscalCST(cst: InsertFiscalCST): Promise<FiscalCST>;
  updateFiscalCST(id: number, data: Partial<FiscalCST>): Promise<FiscalCST>;
  deleteFiscalCST(id: number): Promise<boolean>;
  
  // Fiscal Config
  getFiscalConfig(): Promise<FiscalConfig | undefined>;
  createFiscalConfig(config: InsertFiscalConfig): Promise<FiscalConfig>;
  updateFiscalConfig(id: number, data: Partial<FiscalConfig>): Promise<FiscalConfig>;
  
  // NFes
  getNFes(): Promise<NFe[]>;
  getNFeById(id: number): Promise<NFe | undefined>;
  getNFeByChave(chave: string): Promise<NFe | undefined>;
  getNFesByTipo(tipo: string): Promise<NFe[]>;
  createNFe(nfe: InsertNFe & { xmlEnvio?: string }): Promise<NFe>;
  updateNFe(id: number, data: Partial<NFe>): Promise<NFe>;
  deleteNFe(id: number): Promise<boolean>;
  
  // Para entrada de notas fiscais e integração com estoque
  getSupplierByTaxId(taxId: string): Promise<any>;
  getSuppliersByIds(ids: number[]): Promise<any[]>;
  getRawMaterialByCode(code: string): Promise<RawMaterial | undefined>;
  getRawMaterialByName(name: string): Promise<RawMaterial | undefined>;
  updateRawMaterialStock(id: number, quantity: number): Promise<void>;
  addInventoryTransaction(transaction: any): Promise<any>;
  
  // NFe Items
  getNFeItems(nfeId: number): Promise<NFeItem[]>;
  getNFeItem(id: number): Promise<NFeItem | undefined>;
  createNFeItem(item: InsertNFeItem): Promise<NFeItem>;
  updateNFeItem(id: number, data: Partial<NFeItem>): Promise<NFeItem>;
  deleteNFeItem(id: number): Promise<boolean>;
  
  // NFe Events
  getNFeEvents(nfeId: number): Promise<NFeEvento[]>;
  getNFeEvent(id: number): Promise<NFeEvento | undefined>;
  createNFeEvent(event: InsertNFeEvento): Promise<NFeEvento>;
  
  // Produto Fiscal
  getProdutosFiscais(): Promise<ProdutoFiscal[]>;
  getProdutoFiscal(produtoId: number): Promise<ProdutoFiscal | undefined>;
  createProdutoFiscal(produtoFiscal: InsertProdutoFiscal): Promise<ProdutoFiscal>;
  updateProdutoFiscal(produtoId: number, data: Partial<ProdutoFiscal>): Promise<ProdutoFiscal>;
  
  // Support Tickets (acessível para todos usuários autenticados)
  getSupportTicketsByUserId(userId: number): Promise<SupportTicket[]>;
  getAllSupportTickets(): Promise<SupportTicket[]>;
  getSupportTicketById(id: number): Promise<SupportTicket | undefined>;
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  updateSupportTicket(id: number, ticket: Partial<SupportTicket>): Promise<SupportTicket>;
  deleteSupportTicket(id: number): Promise<boolean>;
  
  // Knowledge Base (acessível para todos usuários autenticados)
  getAllKnowledgeArticles(): Promise<KnowledgeArticle[]>;
  getKnowledgeArticleById(id: number): Promise<KnowledgeArticle | undefined>;
  getKnowledgeArticlesByCategory(category: string): Promise<KnowledgeArticle[]>;
  createKnowledgeArticle(article: InsertKnowledgeArticle): Promise<KnowledgeArticle>;
  updateKnowledgeArticle(id: number, article: Partial<KnowledgeArticle>): Promise<KnowledgeArticle>;
  deleteKnowledgeArticle(id: number): Promise<boolean>;
  incrementKnowledgeArticleViews(id: number): Promise<KnowledgeArticle>;
  deleteUser(id: number): Promise<boolean>;
  getUsers(): Promise<User[]>;
  
  // Quotations
  getQuotations(): Promise<Quotation[]>;
  getQuotation(id: number): Promise<Quotation | undefined>;
  createQuotation(quotation: InsertQuotation): Promise<Quotation>;
  updateQuotation(id: number, data: Partial<Quotation>): Promise<Quotation>;
  deleteQuotation(id: number): Promise<boolean>;
  
  // Quotation Items
  getQuotationItems(quotationId: number): Promise<QuotationItem[]>;
  getQuotationItem(id: number): Promise<QuotationItem | undefined>;
  createQuotationItem(item: InsertQuotationItem): Promise<QuotationItem>;
  updateQuotationItem(id: number, data: Partial<QuotationItem>): Promise<QuotationItem>;
  deleteQuotationItem(id: number): Promise<boolean>;
  
  // Supplier Quotations
  getSupplierQuotations(quotationItemId: number): Promise<SupplierQuotation[]>;
  getSupplierQuotation(id: number): Promise<SupplierQuotation | undefined>;
  createSupplierQuotation(quote: InsertSupplierQuotation): Promise<SupplierQuotation>;
  updateSupplierQuotation(id: number, data: Partial<SupplierQuotation>): Promise<SupplierQuotation>;
  selectBestSupplierQuotation(id: number): Promise<SupplierQuotation>;
  deleteSupplierQuotation(id: number): Promise<boolean>;
  
  // Product Pricing
  getProductPricings(): Promise<ProductPricing[]>;
  getProductPricing(id: number): Promise<ProductPricing | undefined>;
  getProductPricingByProductId(productId: number): Promise<ProductPricing | undefined>;
  createProductPricing(pricing: InsertProductPricing): Promise<ProductPricing>;
  updateProductPricing(id: number, data: Partial<ProductPricing>): Promise<ProductPricing>;
  deleteProductPricing(id: number): Promise<boolean>;
  
  // HR - Employees
  getEmployees(): Promise<Employee[]>;
  getEmployee(id: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, data: Partial<Employee>): Promise<Employee>;
  deleteEmployee(id: number): Promise<boolean>;
  
  // HR - Departments
  getDepartments(): Promise<Department[]>;
  getDepartment(id: number): Promise<Department | undefined>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, data: Partial<Department>): Promise<Department>;
  deleteDepartment(id: number): Promise<boolean>;
  
  // HR - Positions
  getPositions(): Promise<Position[]>;
  getPosition(id: number): Promise<Position | undefined>;
  createPosition(position: InsertPosition): Promise<Position>;
  updatePosition(id: number, data: Partial<Position>): Promise<Position>;
  deletePosition(id: number): Promise<boolean>;
  
  // HR - Leaves
  getLeaves(): Promise<Leave[]>;
  getLeave(id: number): Promise<Leave | undefined>;
  createLeave(leave: InsertLeave): Promise<Leave>;
  updateLeave(id: number, data: Partial<Leave>): Promise<Leave>;
  deleteLeave(id: number): Promise<boolean>;
  
  // HR - Payroll
  getPayrolls(): Promise<Payroll[]>;
  getPayroll(id: number): Promise<Payroll | undefined>;
  getPayrollsByYearMonth(year: number, month: number): Promise<Payroll[]>;
  getPayrollByEmployeeYearMonth(employeeId: number, year: number, month: number): Promise<Payroll | undefined>;
  createPayroll(payroll: InsertPayroll): Promise<Payroll>;
  updatePayroll(id: number, data: Partial<Payroll>): Promise<Payroll>;
  deletePayroll(id: number): Promise<boolean>;
  
  // Measurement Units
  getMeasurementUnits(): Promise<MeasurementUnit[]>;
  getMeasurementUnit(id: number): Promise<MeasurementUnit | undefined>;
  createMeasurementUnit(unit: InsertMeasurementUnit): Promise<MeasurementUnit>;
  updateMeasurementUnit(id: number, data: Partial<MeasurementUnit>): Promise<MeasurementUnit>;
  deleteMeasurementUnit(id: number): Promise<boolean>;
  
  // Company related
  getCompany(): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, data: Partial<Company>): Promise<Company>;
  
  // Financial related
  getExpenses(): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, data: Partial<Expense>): Promise<Expense>;
  deleteExpense(id: number): Promise<boolean>;
  
  getAccounts(type?: string): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  updateAccount(id: number, data: Partial<Account>): Promise<Account>;
  deleteAccount(id: number): Promise<boolean>;
  
  // Production related
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, data: Partial<Product>): Promise<Product>;
  deleteProduct(id: number): Promise<boolean>;
  
  getProductionOrders(): Promise<ProductionOrder[]>;
  getProductionOrder(id: number): Promise<ProductionOrder | undefined>;
  createProductionOrder(order: InsertProductionOrder): Promise<ProductionOrder>;
  updateProductionOrder(id: number, data: Partial<ProductionOrder>): Promise<ProductionOrder>;
  deleteProductionOrder(id: number): Promise<boolean>;
  
  // Maintenance related
  getEquipment(): Promise<Equipment[]>;
  getEquipmentById(id: number): Promise<Equipment | undefined>;
  createEquipment(equipment: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: number, data: Partial<Equipment>): Promise<Equipment>;
  deleteEquipment(id: number): Promise<boolean>;
  
  getMaintenanceOrders(): Promise<MaintenanceOrder[]>;
  getMaintenanceOrder(id: number): Promise<MaintenanceOrder | undefined>;
  createMaintenanceOrder(order: InsertMaintenanceOrder): Promise<MaintenanceOrder>;
  updateMaintenanceOrder(id: number, data: Partial<MaintenanceOrder>): Promise<MaintenanceOrder>;
  deleteMaintenanceOrder(id: number): Promise<boolean>;
  
  // Inventory related
  getRawMaterials(): Promise<RawMaterial[]>;
  getRawMaterial(id: number): Promise<RawMaterial | undefined>;
  createRawMaterial(material: InsertRawMaterial): Promise<RawMaterial>;
  updateRawMaterial(id: number, data: Partial<RawMaterial>): Promise<RawMaterial>;
  deleteRawMaterial(id: number): Promise<boolean>;
  
  // Chat related
  getChatRooms(): Promise<ChatRoom[]>;
  getChatRoomById(id: number): Promise<ChatRoom | undefined>;
  createChatRoom(room: InsertChatRoom): Promise<ChatRoom>;
  updateChatRoom(id: number, data: Partial<ChatRoom>): Promise<ChatRoom>;
  deleteChatRoom(id: number): Promise<boolean>;
  
  getChatMessages(roomId: number): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  markMessageAsRead(id: number): Promise<boolean>;
  
  getChatRoomParticipants(roomId: number): Promise<ChatRoomParticipant[]>;
  addChatRoomParticipant(participant: InsertChatRoomParticipant): Promise<ChatRoomParticipant>;
  removeChatRoomParticipant(roomId: number, userId: number): Promise<boolean>;
  updateChatRoomParticipant(id: number, data: Partial<ChatRoomParticipant>): Promise<ChatRoomParticipant>;
  
  getUserChatRooms(userId: number): Promise<ChatRoom[]>;
  getUnreadMessagesCount(userId: number, roomId?: number): Promise<number>;
  
  // Métodos para gerenciamento de participantes
  getChatRoomParticipants(roomId: number): Promise<ChatRoomParticipant[]>;
  removeChatRoomParticipant(roomId: number, userId: number): Promise<boolean>;
  
  // Métodos adicionais para chat
  getChatMessage(id: number): Promise<ChatMessage | undefined>;
  updateChatMessage(id: number, data: Partial<ChatMessage>): Promise<ChatMessage>;
  updateParticipantStatus(roomId: number, userId: number, status: string, statusMessage?: string): Promise<void>;
  
  // Chat uploads
  createChatUpload(upload: any): Promise<any>;
  getChatUploads(roomId: number): Promise<any[]>;
  getChatUpload(id: number): Promise<any | undefined>;
  deleteChatUpload(id: number): Promise<boolean>;
  
  // Dashboard related
  getDashboardData(): Promise<any>;
  
  // System Alerts
  getSystemAlerts(): Promise<SystemAlert[]>;
  getSystemAlert(id: number): Promise<SystemAlert | undefined>;
  getActiveSystemAlerts(): Promise<SystemAlert[]>;
  getSystemAlertsByModule(module: string): Promise<SystemAlert[]>;
  createSystemAlert(alert: InsertSystemAlert): Promise<SystemAlert>;
  updateSystemAlert(id: number, data: Partial<SystemAlert>): Promise<SystemAlert>;
  acknowledgeSystemAlert(id: number, userId: number): Promise<SystemAlert>;
  resolveSystemAlert(id: number, userId: number): Promise<SystemAlert>;
  deleteSystemAlert(id: number): Promise<boolean>;
  
  // NFe - Fiscal Module
  
  // Certificates
  getFiscalCertificates(): Promise<FiscalCertificate[]>;
  getFiscalCertificate(id: number): Promise<FiscalCertificate | undefined>;
  createFiscalCertificate(certificate: InsertFiscalCertificate): Promise<FiscalCertificate>;
  updateFiscalCertificate(id: number, data: Partial<FiscalCertificate>): Promise<FiscalCertificate>;
  deleteFiscalCertificate(id: number): Promise<boolean>;
  
  // NCMs
  getFiscalNCMs(): Promise<FiscalNCM[]>;
  getFiscalNCM(id: number): Promise<FiscalNCM | undefined>;
  getFiscalNCMByCode(code: string): Promise<FiscalNCM | undefined>;
  createFiscalNCM(ncm: InsertFiscalNCM): Promise<FiscalNCM>;
  updateFiscalNCM(id: number, data: Partial<FiscalNCM>): Promise<FiscalNCM>;
  deleteFiscalNCM(id: number): Promise<boolean>;
  
  // CFOPs
  getFiscalCFOPs(): Promise<FiscalCFOP[]>;
  getFiscalCFOP(id: number): Promise<FiscalCFOP | undefined>;
  getFiscalCFOPByCode(code: string): Promise<FiscalCFOP | undefined>;
  createFiscalCFOP(cfop: InsertFiscalCFOP): Promise<FiscalCFOP>;
  updateFiscalCFOP(id: number, data: Partial<FiscalCFOP>): Promise<FiscalCFOP>;
  deleteFiscalCFOP(id: number): Promise<boolean>;
  
  // CSTs
  getFiscalCSTs(tipo?: string): Promise<FiscalCST[]>;
  getFiscalCST(id: number): Promise<FiscalCST | undefined>;
  getFiscalCSTByCode(code: string, tipo: string): Promise<FiscalCST | undefined>;
  createFiscalCST(cst: InsertFiscalCST): Promise<FiscalCST>;
  updateFiscalCST(id: number, data: Partial<FiscalCST>): Promise<FiscalCST>;
  deleteFiscalCST(id: number): Promise<boolean>;
  
  // Fiscal Config
  getFiscalConfig(): Promise<FiscalConfig | undefined>;
  createFiscalConfig(config: InsertFiscalConfig): Promise<FiscalConfig>;
  updateFiscalConfig(id: number, data: Partial<FiscalConfig>): Promise<FiscalConfig>;
  
  // NFes
  getNFes(): Promise<NFe[]>;
  getNFeById(id: number): Promise<NFe | undefined>;
  getNFeByChave(chave: string): Promise<NFe | undefined>;
  createNFe(nfe: InsertNFe): Promise<NFe>;
  updateNFe(id: number, data: Partial<NFe>): Promise<NFe>;
  
  // NFe Items
  getNFeItems(nfeId: number): Promise<NFeItem[]>;
  getNFeItem(id: number): Promise<NFeItem | undefined>;
  createNFeItem(item: InsertNFeItem): Promise<NFeItem>;
  updateNFeItem(id: number, data: Partial<NFeItem>): Promise<NFeItem>;
  deleteNFeItem(id: number): Promise<boolean>;
  
  // NFe Events
  getNFeEvents(nfeId: number): Promise<NFeEvento[]>;
  createNFeEvent(event: InsertNFeEvento): Promise<NFeEvento>;
  
  // Product Fiscal Data
  getProdutoFiscal(produtoId: number): Promise<ProdutoFiscal | undefined>;
  createProdutoFiscal(produto: InsertProdutoFiscal): Promise<ProdutoFiscal>;
  updateProdutoFiscal(produtoId: number, data: Partial<ProdutoFiscal>): Promise<ProdutoFiscal>;
  
  // Quotation related
  getQuotations(): Promise<Quotation[]>;
  getQuotation(id: number): Promise<Quotation | undefined>;
  createQuotation(quotation: InsertQuotation): Promise<Quotation>;
  updateQuotation(id: number, data: Partial<Quotation>): Promise<Quotation>;
  deleteQuotation(id: number): Promise<boolean>;
  
  getQuotationItems(quotationId: number): Promise<QuotationItem[]>;
  getQuotationItem(id: number): Promise<QuotationItem | undefined>;
  createQuotationItem(item: InsertQuotationItem): Promise<QuotationItem>;
  updateQuotationItem(id: number, data: Partial<QuotationItem>): Promise<QuotationItem>;
  deleteQuotationItem(id: number): Promise<boolean>;
  
  getSupplierQuotations(quotationItemId: number): Promise<SupplierQuotation[]>;
  getSupplierQuotation(id: number): Promise<SupplierQuotation | undefined>;
  createSupplierQuotation(quotation: InsertSupplierQuotation): Promise<SupplierQuotation>;
  updateSupplierQuotation(id: number, data: Partial<SupplierQuotation>): Promise<SupplierQuotation>;
  deleteSupplierQuotation(id: number): Promise<boolean>;
  selectBestSupplierQuotation(id: number): Promise<SupplierQuotation>;
  
  // Product Pricing related
  getProductPricings(): Promise<ProductPricing[]>;
  getProductPricing(id: number): Promise<ProductPricing | undefined>;
  getProductPricingByProductId(productId: number): Promise<ProductPricing | undefined>;
  createProductPricing(pricing: InsertProductPricing): Promise<ProductPricing>;
  updateProductPricing(id: number, data: Partial<ProductPricing>): Promise<ProductPricing>;
  deleteProductPricing(id: number): Promise<boolean>;
  calculateProductMaterialCost(productId: number): Promise<{ rawMaterialCost: number }>;
  
  // Measurement Units
  getMeasurementUnits(): Promise<MeasurementUnit[]>;
  getMeasurementUnit(id: number): Promise<MeasurementUnit | undefined>;
  createMeasurementUnit(unit: InsertMeasurementUnit): Promise<MeasurementUnit>;
  updateMeasurementUnit(id: number, data: Partial<MeasurementUnit>): Promise<MeasurementUnit>;
  deleteMeasurementUnit(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private companies: Map<number, Company>;
  private expenses: Map<number, Expense>;
  private accounts: Map<number, Account>;
  private products: Map<number, Product>;
  private productionOrders: Map<number, ProductionOrder>;
  private equipment: Map<number, Equipment>;
  private maintenanceOrders: Map<number, MaintenanceOrder>;
  private rawMaterials: Map<number, RawMaterial>;
  private chatRooms: Map<number, ChatRoom>;
  private chatMessages: Map<number, ChatMessage>;
  private chatRoomParticipants: Map<number, ChatRoomParticipant>;
  
  // HR module collections
  private employees: Map<number, Employee>;
  private departments: Map<number, Department>;
  private positions: Map<number, Position>;
  private leaves: Map<number, Leave>;
  private payrolls: Map<number, Payroll>;
  
  // Quotation and Pricing module collections
  private quotations: Map<number, Quotation>;
  private quotationItems: Map<number, QuotationItem>;
  private supplierQuotations: Map<number, SupplierQuotation>;
  private productPricings: Map<number, ProductPricing>;
  private productFormulas: Map<number, ProductFormula>;
  
  // Fiscal module collections
  private fiscalCertificates: Map<number, FiscalCertificate>;
  private fiscalNCMs: Map<number, FiscalNCM>;
  private fiscalCFOPs: Map<number, FiscalCFOP>;
  private fiscalCSTs: Map<number, FiscalCST>;
  private fiscalConfigs: Map<number, FiscalConfig>;
  private nfes: Map<number, NFe>;
  private nfeItens: Map<number, NFeItem>;
  private nfeEventos: Map<number, NFeEvento>;
  private produtosFiscais: Map<number, ProdutoFiscal>;
  private measurementUnits: Map<number, MeasurementUnit>;
  private supportTickets: Map<number, SupportTicket>;
  private knowledgeArticles: Map<number, KnowledgeArticle>;
  

  
  currentId: {
    users: number;
    companies: number;
    expenses: number;
    accounts: number;
    products: number;
    productionOrders: number;
    equipment: number;
    maintenanceOrders: number;
    rawMaterials: number;
    chatRooms: number;
    chatMessages: number;
    chatRoomParticipants: number;
    // HR module
    employees: number;
    departments: number;
    positions: number;
    leaves: number;
    payrolls: number;
    // Fiscal module
    fiscalCertificates: number;
    fiscalNCMs: number;
    fiscalCFOPs: number;
    fiscalCSTs: number;
    fiscalConfigs: number;
    nfes: number;
    nfeItens: number;
    nfeEventos: number;
    produtosFiscais: number;
    measurementUnits: number;
  };
  
  sessionStore: SessionStore;

  constructor() {
    this.users = new Map();
    this.companies = new Map();
    this.expenses = new Map();
    this.accounts = new Map();
    this.products = new Map();
    this.productionOrders = new Map();
    this.equipment = new Map();
    this.maintenanceOrders = new Map();
    this.rawMaterials = new Map();
    this.chatRooms = new Map();
    this.chatMessages = new Map();
    this.chatRoomParticipants = new Map();
    
    // Inicializar as coleções do módulo HR
    this.employees = new Map();
    this.departments = new Map();
    this.positions = new Map();
    this.leaves = new Map();
    this.payrolls = new Map();
    
    // Inicializar as coleções do módulo fiscal
    this.fiscalCertificates = new Map();
    this.fiscalNCMs = new Map();
    this.fiscalCFOPs = new Map();
    this.fiscalCSTs = new Map();
    this.fiscalConfigs = new Map();
    this.nfes = new Map();
    this.nfeItens = new Map();
    this.nfeEventos = new Map();
    this.produtosFiscais = new Map();
    this.measurementUnits = new Map();
    this.supportTickets = new Map();
    this.knowledgeArticles = new Map();
    
    // Inicializar as coleções de cotação e precificação
    this.quotations = new Map();
    this.quotationItems = new Map();
    this.supplierQuotations = new Map();
    this.productPricings = new Map();
    this.productFormulas = new Map();
    
    this.currentId = {
      users: 1,
      companies: 1,
      expenses: 1,
      accounts: 1,
      products: 1,
      productionOrders: 1,
      equipment: 1,
      maintenanceOrders: 1,
      rawMaterials: 1,
      chatRooms: 1,
      chatMessages: 1,
      chatRoomParticipants: 1,
      // HR module IDs
      employees: 1,
      departments: 1,
      positions: 1,
      leaves: 1,
      payrolls: 1,
      // Fiscal module IDs
      fiscalCertificates: 1,
      fiscalNCMs: 1,
      fiscalCFOPs: 1,
      fiscalCSTs: 1,
      fiscalConfigs: 1,
      nfes: 1,
      nfeItens: 1,
      nfeEventos: 1,
      produtosFiscais: 1,
      measurementUnits: 1,
      supportTickets: 1,
      knowledgeArticles: 1,
      // Quotation and Pricing IDs
      quotations: 1,
      quotationItems: 1,
      supplierQuotations: 1,
      productPricings: 1,
      productFormulas: 1
    };
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      active: true,
      permissions: insertUser.permissions || [],
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  // Company methods
  async getCompany(): Promise<Company | undefined> {
    // In a real app, this would fetch the company associated with the current user
    // For now, just return the first company
    if (this.companies.size === 0) {
      return undefined;
    }
    return this.companies.values().next().value;
  }
  
  async createCompany(company: InsertCompany): Promise<Company> {
    const id = this.currentId.companies++;
    const now = new Date();
    const newCompany: Company = { ...company, id, createdAt: now };
    this.companies.set(id, newCompany);
    return newCompany;
  }
  
  async updateCompany(id: number, data: Partial<Company>): Promise<Company> {
    const company = this.companies.get(id);
    if (!company) {
      throw new Error(`Company with id ${id} not found`);
    }
    
    const updatedCompany = { ...company, ...data };
    this.companies.set(id, updatedCompany);
    return updatedCompany;
  }
  
  // Financial methods
  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values());
  }
  
  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }
  
  async createExpense(expense: InsertExpense): Promise<Expense> {
    const id = this.currentId.expenses++;
    const now = new Date();
    const newExpense: Expense = { ...expense, id, createdAt: now };
    this.expenses.set(id, newExpense);
    return newExpense;
  }
  
  async updateExpense(id: number, data: Partial<Expense>): Promise<Expense> {
    const expense = await this.getExpense(id);
    if (!expense) {
      throw new Error(`Expense with id ${id} not found`);
    }
    
    const updatedExpense = { ...expense, ...data };
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }
  
  async deleteExpense(id: number): Promise<boolean> {
    return this.expenses.delete(id);
  }
  
  async getAccounts(type?: string): Promise<Account[]> {
    const accounts = Array.from(this.accounts.values());
    if (type) {
      return accounts.filter(account => account.type === type);
    }
    return accounts;
  }
  
  async getAccount(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }
  
  async createAccount(account: InsertAccount): Promise<Account> {
    const id = this.currentId.accounts++;
    const now = new Date();
    const newAccount: Account = { ...account, id, createdAt: now };
    this.accounts.set(id, newAccount);
    return newAccount;
  }
  
  async updateAccount(id: number, data: Partial<Account>): Promise<Account> {
    const account = await this.getAccount(id);
    if (!account) {
      throw new Error(`Account with id ${id} not found`);
    }
    
    const updatedAccount = { ...account, ...data };
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }
  
  async deleteAccount(id: number): Promise<boolean> {
    return this.accounts.delete(id);
  }
  
  // Production methods
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }
  
  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }
  
  async createProduct(product: InsertProduct): Promise<Product> {
    const id = this.currentId.products++;
    const now = new Date();
    const newProduct: Product = { ...product, id, createdAt: now };
    this.products.set(id, newProduct);
    return newProduct;
  }
  
  async updateProduct(id: number, data: Partial<Product>): Promise<Product> {
    const product = await this.getProduct(id);
    if (!product) {
      throw new Error(`Product with id ${id} not found`);
    }
    
    const updatedProduct = { ...product, ...data };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }
  
  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }
  
  async getProductFormulas(productId: number): Promise<ProductFormula[]> {
    return Array.from(this.productFormulas.values())
      .filter(formula => formula.productId === productId);
  }
  
  async createProductFormula(formula: InsertProductFormula): Promise<ProductFormula> {
    const id = this.currentId.productFormulas++;
    const now = new Date();
    const newFormula: ProductFormula = { ...formula, id, createdAt: now };
    this.productFormulas.set(id, newFormula);
    return newFormula;
  }
  
  async updateProductFormula(id: number, data: Partial<ProductFormula>): Promise<ProductFormula> {
    const formula = await this.getProductFormula(id);
    if (!formula) {
      throw new Error(`Product formula with id ${id} not found`);
    }
    
    const updatedFormula = { ...formula, ...data };
    this.productFormulas.set(id, updatedFormula);
    return updatedFormula;
  }
  
  async deleteProductFormula(id: number): Promise<boolean> {
    return this.productFormulas.delete(id);
  }
  
  async getProductFormula(id: number): Promise<ProductFormula | undefined> {
    return this.productFormulas.get(id);
  }
  
  async getProductionOrders(): Promise<ProductionOrder[]> {
    return Array.from(this.productionOrders.values());
  }
  
  async getProductionOrder(id: number): Promise<ProductionOrder | undefined> {
    return this.productionOrders.get(id);
  }
  
  async createProductionOrder(order: InsertProductionOrder): Promise<ProductionOrder> {
    const id = this.currentId.productionOrders++;
    const now = new Date();
    const newOrder: ProductionOrder = { ...order, id, createdAt: now };
    this.productionOrders.set(id, newOrder);
    return newOrder;
  }
  
  async updateProductionOrder(id: number, data: Partial<ProductionOrder>): Promise<ProductionOrder> {
    const order = await this.getProductionOrder(id);
    if (!order) {
      throw new Error(`Production order with id ${id} not found`);
    }
    
    const updatedOrder = { ...order, ...data };
    this.productionOrders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  async deleteProductionOrder(id: number): Promise<boolean> {
    return this.productionOrders.delete(id);
  }
  
  // Maintenance methods
  async getEquipment(): Promise<Equipment[]> {
    return Array.from(this.equipment.values());
  }
  
  async getEquipmentById(id: number): Promise<Equipment | undefined> {
    return this.equipment.get(id);
  }
  
  async createEquipment(equipment: InsertEquipment): Promise<Equipment> {
    const id = this.currentId.equipment++;
    const now = new Date();
    const newEquipment: Equipment = { ...equipment, id, createdAt: now };
    this.equipment.set(id, newEquipment);
    return newEquipment;
  }
  
  async updateEquipment(id: number, data: Partial<Equipment>): Promise<Equipment> {
    const equipment = await this.getEquipmentById(id);
    if (!equipment) {
      throw new Error(`Equipment with id ${id} not found`);
    }
    
    const updatedEquipment = { ...equipment, ...data };
    this.equipment.set(id, updatedEquipment);
    return updatedEquipment;
  }
  
  async deleteEquipment(id: number): Promise<boolean> {
    return this.equipment.delete(id);
  }
  
  async getMaintenanceOrders(): Promise<MaintenanceOrder[]> {
    return Array.from(this.maintenanceOrders.values());
  }
  
  async getMaintenanceOrder(id: number): Promise<MaintenanceOrder | undefined> {
    return this.maintenanceOrders.get(id);
  }
  
  async createMaintenanceOrder(order: InsertMaintenanceOrder): Promise<MaintenanceOrder> {
    const id = this.currentId.maintenanceOrders++;
    const now = new Date();
    const newOrder: MaintenanceOrder = { ...order, id, createdAt: now };
    this.maintenanceOrders.set(id, newOrder);
    return newOrder;
  }
  
  async updateMaintenanceOrder(id: number, data: Partial<MaintenanceOrder>): Promise<MaintenanceOrder> {
    const order = await this.getMaintenanceOrder(id);
    if (!order) {
      throw new Error(`Maintenance order with id ${id} not found`);
    }
    
    const updatedOrder = { ...order, ...data };
    this.maintenanceOrders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  async deleteMaintenanceOrder(id: number): Promise<boolean> {
    return this.maintenanceOrders.delete(id);
  }
  
  // Inventory methods
  async getRawMaterials(): Promise<RawMaterial[]> {
    return Array.from(this.rawMaterials.values());
  }
  
  async getRawMaterial(id: number): Promise<RawMaterial | undefined> {
    return this.rawMaterials.get(id);
  }
  
  async createRawMaterial(material: InsertRawMaterial): Promise<RawMaterial> {
    const id = this.currentId.rawMaterials++;
    const now = new Date();
    const newMaterial: RawMaterial = { ...material, id, createdAt: now };
    this.rawMaterials.set(id, newMaterial);
    return newMaterial;
  }
  
  async updateRawMaterial(id: number, data: Partial<RawMaterial>): Promise<RawMaterial> {
    const material = await this.getRawMaterial(id);
    if (!material) {
      throw new Error(`Raw material with id ${id} not found`);
    }
    
    const updatedMaterial = { ...material, ...data };
    this.rawMaterials.set(id, updatedMaterial);
    return updatedMaterial;
  }
  
  async deleteRawMaterial(id: number): Promise<boolean> {
    return this.rawMaterials.delete(id);
  }
  
  // HR methods - Employees
  async getEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }
  
  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employees.get(id);
  }
  
  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const id = this.currentId.employees++;
    const now = new Date();
    const newEmployee: Employee = { 
      ...employee, 
      id, 
      createdAt: now,
      status: employee.status || 'active'
    };
    this.employees.set(id, newEmployee);
    return newEmployee;
  }
  
  async updateEmployee(id: number, data: Partial<Employee>): Promise<Employee> {
    const employee = await this.getEmployee(id);
    if (!employee) {
      throw new Error(`Employee with id ${id} not found`);
    }
    
    const updatedEmployee = { ...employee, ...data };
    this.employees.set(id, updatedEmployee);
    return updatedEmployee;
  }
  
  async deleteEmployee(id: number): Promise<boolean> {
    return this.employees.delete(id);
  }
  
  // HR methods - Departments
  async getDepartments(): Promise<Department[]> {
    return Array.from(this.departments.values());
  }
  
  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departments.get(id);
  }
  
  async createDepartment(department: InsertDepartment): Promise<Department> {
    const id = this.currentId.departments++;
    const now = new Date();
    const newDepartment: Department = { 
      ...department, 
      id, 
      createdAt: now 
    };
    this.departments.set(id, newDepartment);
    return newDepartment;
  }
  
  async updateDepartment(id: number, data: Partial<Department>): Promise<Department> {
    const department = await this.getDepartment(id);
    if (!department) {
      throw new Error(`Department with id ${id} not found`);
    }
    
    const updatedDepartment = { ...department, ...data };
    this.departments.set(id, updatedDepartment);
    return updatedDepartment;
  }
  
  async deleteDepartment(id: number): Promise<boolean> {
    return this.departments.delete(id);
  }
  
  // HR methods - Positions
  async getPositions(): Promise<Position[]> {
    return Array.from(this.positions.values());
  }
  
  async getPosition(id: number): Promise<Position | undefined> {
    return this.positions.get(id);
  }
  
  async createPosition(position: InsertPosition): Promise<Position> {
    const id = this.currentId.positions++;
    const now = new Date();
    const newPosition: Position = { 
      ...position, 
      id, 
      createdAt: now 
    };
    this.positions.set(id, newPosition);
    return newPosition;
  }
  
  async updatePosition(id: number, data: Partial<Position>): Promise<Position> {
    const position = await this.getPosition(id);
    if (!position) {
      throw new Error(`Position with id ${id} not found`);
    }
    
    const updatedPosition = { ...position, ...data };
    this.positions.set(id, updatedPosition);
    return updatedPosition;
  }
  
  async deletePosition(id: number): Promise<boolean> {
    return this.positions.delete(id);
  }
  
  // HR methods - Leaves
  async getLeaves(): Promise<Leave[]> {
    return Array.from(this.leaves.values());
  }
  
  async getLeave(id: number): Promise<Leave | undefined> {
    return this.leaves.get(id);
  }
  
  async createLeave(leave: InsertLeave): Promise<Leave> {
    const id = this.currentId.leaves++;
    const now = new Date();
    
    // Converte as datas para strings
    let startDate = leave.startDate;
    let endDate = leave.endDate;
    
    // Se são objetos Date, converte para string
    if (startDate instanceof Date) {
      startDate = startDate.toISOString().split('T')[0];
    }
    
    if (endDate instanceof Date) {
      endDate = endDate.toISOString().split('T')[0];
    }
    
    const newLeave: Leave = { 
      ...leave, 
      id, 
      createdAt: now,
      status: leave.status || 'pending',
      startDate,
      endDate,
      reason: leave.reason || null,
      approvedById: leave.approvedById || null,
      approvedDate: leave.approvedDate || null
    };
    this.leaves.set(id, newLeave);
    return newLeave;
  }
  
  async updateLeave(id: number, data: Partial<Leave>): Promise<Leave> {
    const leave = await this.getLeave(id);
    if (!leave) {
      throw new Error(`Leave with id ${id} not found`);
    }
    
    // Processa datas se fornecidas
    let processedData = { ...data };
    
    if (data.startDate instanceof Date) {
      processedData.startDate = data.startDate.toISOString().split('T')[0];
    }
    
    if (data.endDate instanceof Date) {
      processedData.endDate = data.endDate.toISOString().split('T')[0];
    }
    
    if (data.approvedDate instanceof Date) {
      processedData.approvedDate = data.approvedDate;
    }
    
    const updatedLeave = { ...leave, ...processedData };
    this.leaves.set(id, updatedLeave);
    return updatedLeave;
  }
  
  async deleteLeave(id: number): Promise<boolean> {
    return this.leaves.delete(id);
  }
  
  // HR methods - Payroll
  async getPayrolls(): Promise<Payroll[]> {
    return Array.from(this.payrolls.values());
  }
  
  async getPayroll(id: number): Promise<Payroll | undefined> {
    return this.payrolls.get(id);
  }
  
  async getPayrollsByYearMonth(year: number, month: number): Promise<Payroll[]> {
    return Array.from(this.payrolls.values())
      .filter(p => p.year === year && p.month === month);
  }
  
  async getPayrollByEmployeeYearMonth(
    employeeId: number, 
    year: number, 
    month: number
  ): Promise<Payroll | undefined> {
    return Array.from(this.payrolls.values())
      .find(p => p.employeeId === employeeId && p.year === year && p.month === month);
  }
  
  async createPayroll(payroll: InsertPayroll): Promise<Payroll> {
    const id = this.currentId.payrolls++;
    const now = new Date();
    
    // Converte a data de pagamento se for um objeto Date
    let paymentDate = payroll.paymentDate;
    if (paymentDate instanceof Date) {
      paymentDate = paymentDate.toISOString().split('T')[0];
    }
    
    const newPayroll: Payroll = { 
      ...payroll, 
      id, 
      createdAt: now,
      status: payroll.status || 'pending',
      notes: payroll.notes || null,
      createdBy: payroll.createdBy || null,
      deductions: payroll.deductions || 0,
      additions: payroll.additions || 0,
      taxes: payroll.taxes || 0,
      benefits: payroll.benefits || 0,
      paymentDate: paymentDate || null,
      paymentMethod: payroll.paymentMethod || null,
      processingDate: payroll.processingDate || null
    };
    this.payrolls.set(id, newPayroll);
    return newPayroll;
  }
  
  async updatePayroll(id: number, data: Partial<Payroll>): Promise<Payroll> {
    const payroll = await this.getPayroll(id);
    if (!payroll) {
      throw new Error(`Payroll with id ${id} not found`);
    }
    
    // Processa data de pagamento se fornecida como Date
    let processedData = { ...data };
    
    if (data.paymentDate instanceof Date) {
      processedData.paymentDate = data.paymentDate.toISOString().split('T')[0];
    }
    
    if (data.processingDate instanceof Date) {
      processedData.processingDate = data.processingDate.toISOString().split('T')[0];
    }
    
    const updatedPayroll = { ...payroll, ...processedData };
    this.payrolls.set(id, updatedPayroll);
    return updatedPayroll;
  }
  
  async deletePayroll(id: number): Promise<boolean> {
    return this.payrolls.delete(id);
  }
  
  // Chat related methods
  async getChatRooms(): Promise<ChatRoom[]> {
    return Array.from(this.chatRooms.values());
  }
  
  async getUserChatRooms(userId: number): Promise<ChatRoom[]> {
    // Buscar todas as salas onde o usuário é participante
    const participants = Array.from(this.chatRoomParticipants.values())
      .filter(p => p.userId === userId);
    const roomIds = participants.map(p => p.roomId);
    
    // Retornar as salas correspondentes
    return Array.from(this.chatRooms.values())
      .filter(room => roomIds.includes(room.id));
  }
  
  async getChatRoomById(id: number): Promise<ChatRoom | undefined> {
    return this.chatRooms.get(id);
  }
  
  // Alias para compatibilidade com o novo código
  async getChatRoom(id: number): Promise<ChatRoom | undefined> {
    return this.getChatRoomById(id);
  }
  
  async createChatRoom(room: InsertChatRoom): Promise<ChatRoom> {
    const id = this.currentId.chatRooms++;
    const now = new Date();
    const newRoom: ChatRoom = { 
      ...room, 
      id, 
      createdAt: now,
      updatedAt: now,
      type: room.type || 'direct',
      description: room.description || null,
      createdBy: room.createdBy || null,
      visibility: room.visibility || 'public',
      isGroup: room.isGroup || false,
      avatarUrl: room.avatarUrl || null,
      readOnly: room.readOnly || false,
      lastMessageAt: null,
      archived: false
    };
    this.chatRooms.set(id, newRoom);
    return newRoom;
  }
  
  async updateChatRoom(id: number, data: Partial<ChatRoom>): Promise<ChatRoom> {
    const room = await this.getChatRoomById(id);
    if (!room) {
      throw new Error(`Chat room with id ${id} not found`);
    }
    
    const updatedRoom = { 
      ...room, 
      ...data,
      updatedAt: new Date()
    };
    this.chatRooms.set(id, updatedRoom);
    return updatedRoom;
  }
  
  async deleteChatRoom(id: number): Promise<boolean> {
    return this.chatRooms.delete(id);
  }
  
  async archiveChatRoom(id: number): Promise<ChatRoom | undefined> {
    const room = await this.getChatRoomById(id);
    if (!room) {
      return undefined;
    }
    
    const updatedRoom = {
      ...room,
      archived: true,
      updatedAt: new Date()
    };
    
    this.chatRooms.set(id, updatedRoom);
    return updatedRoom;
  }
  
  async getChatMessages(roomId: number, limit = 50, offset = 0): Promise<ChatMessage[]> {
    const messages = Array.from(this.chatMessages.values())
      .filter(message => message.roomId === roomId)
      .sort((a, b) => {
        if (a.createdAt === null) return -1;
        if (b.createdAt === null) return 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    
    return messages.slice(offset, offset + limit);
  }
  
  async getChatThreadMessages(parentId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(message => message.parentId === parentId)
      .sort((a, b) => {
        if (a.createdAt === null) return -1;
        if (b.createdAt === null) return 1;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }
  
  async getChatMessage(id: number): Promise<ChatMessage | undefined> {
    return this.chatMessages.get(id);
  }
  
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentId.chatMessages++;
    const now = new Date();
    const newMessage: ChatMessage = { 
      ...message, 
      id, 
      isRead: false,
      createdAt: now,
      updatedAt: now,
      message: message.message,
      isSystem: message.isSystem || false,
      parentId: message.parentId || null,
      attachments: message.attachments || {},
      mentions: message.mentions || [],
      reactions: {},
      editedAt: null,
      editedBy: null
    };
    this.chatMessages.set(id, newMessage);
    return newMessage;
  }
  
  async updateChatMessage(id: number, data: Partial<ChatMessage>): Promise<ChatMessage | undefined> {
    const message = this.chatMessages.get(id);
    if (!message) {
      return undefined;
    }
    
    const updatedMessage = {
      ...message,
      ...data,
      updatedAt: new Date()
    };
    
    this.chatMessages.set(id, updatedMessage);
    return updatedMessage;
  }
  
  async deleteChatMessage(id: number): Promise<boolean> {
    return this.chatMessages.delete(id);
  }
  
  async markMessageAsRead(id: number): Promise<boolean> {
    const message = this.chatMessages.get(id);
    if (!message) {
      return false;
    }
    
    message.isRead = true;
    this.chatMessages.set(id, message);
    return true;
  }
  
  async markMessagesAsRead(roomId: number, userId: number): Promise<boolean> {
    let updated = false;
    
    for (const [id, message] of this.chatMessages.entries()) {
      if (message.roomId === roomId && message.userId !== userId && !message.isRead) {
        this.chatMessages.set(id, { 
          ...message, 
          isRead: true 
        });
        updated = true;
      }
    }
    
    return updated;
  }
  
  async searchChatMessages(query: string): Promise<ChatMessage[]> {
    const queryLower = query.toLowerCase();
    return Array.from(this.chatMessages.values())
      .filter(message => message.message.toLowerCase().includes(queryLower))
      .sort((a, b) => {
        if (a.createdAt === null) return -1;
        if (b.createdAt === null) return 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }
  
  async getChatRoomParticipants(roomId: number): Promise<ChatRoomParticipant[]> {
    return Array.from(this.chatRoomParticipants.values())
      .filter(participant => participant.roomId === roomId);
  }
  
  async getChatRoomParticipant(roomId: number, userId: number): Promise<ChatRoomParticipant | undefined> {
    return Array.from(this.chatRoomParticipants.values())
      .find(p => p.roomId === roomId && p.userId === userId);
  }
  
  async createChatRoomParticipant(participant: InsertChatRoomParticipant): Promise<ChatRoomParticipant> {
    const id = this.currentId.chatRoomParticipants++;
    const now = new Date();
    const newParticipant: ChatRoomParticipant = { 
      ...participant, 
      id, 
      joinedAt: now,
      lastSeenAt: now,
      status: participant.status || 'online',
      isAdmin: participant.isAdmin || false,
      isOwner: participant.isOwner || false,
      isModerator: participant.isModerator || false,
      statusMessage: participant.statusMessage || null,
      notifications: participant.notifications || 'default',
      muted: false
    };
    this.chatRoomParticipants.set(id, newParticipant);
    return newParticipant;
  }
  
  // Alias para compatibilidade com o código existente
  async addChatRoomParticipant(participant: InsertChatRoomParticipant): Promise<ChatRoomParticipant> {
    return this.createChatRoomParticipant(participant);
  }
  
  async updateParticipant(id: number, data: Partial<ChatRoomParticipant>): Promise<ChatRoomParticipant | undefined> {
    const participant = this.chatRoomParticipants.get(id);
    if (!participant) {
      return undefined;
    }
    
    const updatedParticipant = {
      ...participant,
      ...data
    };
    
    this.chatRoomParticipants.set(id, updatedParticipant);
    return updatedParticipant;
  }
  
  // Alias para compatibilidade com a interface IStorage
  async updateChatRoomParticipant(id: number, data: Partial<ChatRoomParticipant>): Promise<ChatRoomParticipant> {
    const participant = await this.updateParticipant(id, data);
    if (!participant) {
      throw new Error(`Chat room participant with id ${id} not found`);
    }
    return participant;
  }
  
  async updateParticipantStatus(roomId: number, userId: number, status: string, statusMessage?: string): Promise<ChatRoomParticipant | undefined> {
    const participants = await this.getChatRoomParticipants(roomId);
    const participant = participants.find(p => p.userId === userId);
    
    if (!participant) {
      return undefined;
    }
    
    const updatedParticipant = {
      ...participant,
      status,
      lastSeenAt: new Date()
    };
    
    if (statusMessage !== undefined) {
      updatedParticipant.statusMessage = statusMessage;
    }
    
    this.chatRoomParticipants.set(participant.id, updatedParticipant);
    return updatedParticipant;
  }
  
  async removeChatRoomParticipant(roomId: number, userId: number): Promise<boolean> {
    const participants = await this.getChatRoomParticipants(roomId);
    const participant = participants.find(p => p.userId === userId);
    if (!participant) {
      return false;
    }
    
    return this.chatRoomParticipants.delete(participant.id);
  }
  
  // Alias para compatibilidade
  async removeParticipant(roomId: number, userId: number): Promise<boolean> {
    return this.removeChatRoomParticipant(roomId, userId);
  }
  
  async getUserChatRooms(userId: number): Promise<ChatRoom[]> {
    const participations = Array.from(this.chatRoomParticipants.values())
      .filter(participant => participant.userId === userId);
    
    const roomIds = participations.map(p => p.roomId);
    return Array.from(this.chatRooms.values())
      .filter(room => roomIds.includes(room.id));
  }
  
  async getUnreadMessagesCount(userId: number, roomId?: number): Promise<number> {
    let messages = Array.from(this.chatMessages.values())
      .filter(message => !message.isRead && message.userId !== userId);
    
    if (roomId) {
      messages = messages.filter(message => message.roomId === roomId);
    } else {
      // Para contagem total, verificar se o usuário é participante da sala
      const userRooms = await this.getUserChatRooms(userId);
      const roomIds = userRooms.map(room => room.id);
      messages = messages.filter(message => roomIds.includes(message.roomId));
    }
    
    return messages.length;
  }
  
  // Dashboard related
  async getDashboardData(): Promise<any> {
    const productionOrders = await this.getProductionOrders();
    const maintenanceOrders = await this.getMaintenanceOrders();
    const rawMaterials = await this.getRawMaterials();
    const accounts = await this.getAccounts();
    
    const productionCount = productionOrders.length;
    const openMaintenanceCount = maintenanceOrders.filter(order => order.status !== 'completed').length;
    const urgentMaintenanceCount = maintenanceOrders.filter(order => order.urgency === 'high' && order.status !== 'completed').length;
    
    const lowStockMaterials = rawMaterials.filter(material => material.currentStock < material.minimumStock);
    
    const receivableAccounts = accounts.filter(account => account.type === 'receivable');
    const receivableTotal = receivableAccounts.reduce((sum, account) => sum + account.amount, 0);
    
    return {
      production: {
        count: productionCount,
        inProgress: productionOrders.filter(order => order.status === 'in-progress').length,
        completed: productionOrders.filter(order => order.status === 'completed').length,
        planned: productionOrders.filter(order => order.status === 'planned').length
      },
      maintenance: {
        openCount: openMaintenanceCount,
        urgentCount: urgentMaintenanceCount
      },
      inventory: {
        lowStockCount: lowStockMaterials.length,
        lowStockItems: lowStockMaterials
      },
      financial: {
        receivableTotal: receivableTotal,
        upcomingPayments: accounts.filter(account => account.type === 'payable' && account.status === 'pending').length
      },
      recentOrders: productionOrders.slice(-3),
      recentMaintenanceOrders: maintenanceOrders.slice(-3),
      recentAccounts: accounts.slice(-3)
    };
  }
  
  // Fiscal Module - NFe
  
  // Certificados
  async getFiscalCertificates(): Promise<FiscalCertificate[]> {
    return Array.from(this.fiscalCertificates.values());
  }
  
  async getFiscalCertificate(id: number): Promise<FiscalCertificate | undefined> {
    return this.fiscalCertificates.get(id);
  }
  
  async createFiscalCertificate(certificate: InsertFiscalCertificate): Promise<FiscalCertificate> {
    const id = this.currentId.fiscalCertificates++;
    const now = new Date();
    const newCertificate: FiscalCertificate = { ...certificate, id, createdAt: now };
    this.fiscalCertificates.set(id, newCertificate);
    return newCertificate;
  }
  
  async updateFiscalCertificate(id: number, data: Partial<FiscalCertificate>): Promise<FiscalCertificate> {
    const certificate = await this.getFiscalCertificate(id);
    if (!certificate) {
      throw new Error(`Certificado fiscal com id ${id} não encontrado`);
    }
    
    const updatedCertificate = { ...certificate, ...data };
    this.fiscalCertificates.set(id, updatedCertificate);
    return updatedCertificate;
  }
  
  async deleteFiscalCertificate(id: number): Promise<boolean> {
    return this.fiscalCertificates.delete(id);
  }
  
  // NCMs
  async getFiscalNCMs(): Promise<FiscalNCM[]> {
    return Array.from(this.fiscalNCMs.values());
  }
  
  async getFiscalNCM(id: number): Promise<FiscalNCM | undefined> {
    return this.fiscalNCMs.get(id);
  }
  
  async getFiscalNCMByCode(code: string): Promise<FiscalNCM | undefined> {
    return Array.from(this.fiscalNCMs.values()).find(
      (ncm) => ncm.code === code
    );
  }
  
  async createFiscalNCM(ncm: InsertFiscalNCM): Promise<FiscalNCM> {
    const id = this.currentId.fiscalNCMs++;
    const now = new Date();
    const newNCM: FiscalNCM = { ...ncm, id, createdAt: now, updatedAt: now };
    this.fiscalNCMs.set(id, newNCM);
    return newNCM;
  }
  
  async updateFiscalNCM(id: number, data: Partial<FiscalNCM>): Promise<FiscalNCM> {
    const ncm = await this.getFiscalNCM(id);
    if (!ncm) {
      throw new Error(`NCM com id ${id} não encontrado`);
    }
    
    const now = new Date();
    const updatedNCM = { ...ncm, ...data, updatedAt: now };
    this.fiscalNCMs.set(id, updatedNCM);
    return updatedNCM;
  }
  
  async deleteFiscalNCM(id: number): Promise<boolean> {
    return this.fiscalNCMs.delete(id);
  }
  
  // CFOPs
  async getFiscalCFOPs(): Promise<FiscalCFOP[]> {
    return Array.from(this.fiscalCFOPs.values());
  }
  
  async getFiscalCFOP(id: number): Promise<FiscalCFOP | undefined> {
    return this.fiscalCFOPs.get(id);
  }
  
  async getFiscalCFOPByCode(code: string): Promise<FiscalCFOP | undefined> {
    return Array.from(this.fiscalCFOPs.values()).find(
      (cfop) => cfop.code === code
    );
  }
  
  async createFiscalCFOP(cfop: InsertFiscalCFOP): Promise<FiscalCFOP> {
    const id = this.currentId.fiscalCFOPs++;
    const now = new Date();
    const newCFOP: FiscalCFOP = { ...cfop, id, createdAt: now };
    this.fiscalCFOPs.set(id, newCFOP);
    return newCFOP;
  }
  
  async updateFiscalCFOP(id: number, data: Partial<FiscalCFOP>): Promise<FiscalCFOP> {
    const cfop = await this.getFiscalCFOP(id);
    if (!cfop) {
      throw new Error(`CFOP com id ${id} não encontrado`);
    }
    
    const updatedCFOP = { ...cfop, ...data };
    this.fiscalCFOPs.set(id, updatedCFOP);
    return updatedCFOP;
  }
  
  async deleteFiscalCFOP(id: number): Promise<boolean> {
    return this.fiscalCFOPs.delete(id);
  }
  
  // CSTs
  async getFiscalCSTs(tipo?: string): Promise<FiscalCST[]> {
    let csts = Array.from(this.fiscalCSTs.values());
    if (tipo) {
      csts = csts.filter(cst => cst.tipo === tipo);
    }
    return csts;
  }
  
  async getFiscalCST(id: number): Promise<FiscalCST | undefined> {
    return this.fiscalCSTs.get(id);
  }
  
  async getFiscalCSTByCode(code: string, tipo: string): Promise<FiscalCST | undefined> {
    return Array.from(this.fiscalCSTs.values()).find(
      (cst) => cst.code === code && cst.tipo === tipo
    );
  }
  
  async createFiscalCST(cst: InsertFiscalCST): Promise<FiscalCST> {
    const id = this.currentId.fiscalCSTs++;
    const now = new Date();
    const newCST: FiscalCST = { ...cst, id, createdAt: now };
    this.fiscalCSTs.set(id, newCST);
    return newCST;
  }
  
  async updateFiscalCST(id: number, data: Partial<FiscalCST>): Promise<FiscalCST> {
    const cst = await this.getFiscalCST(id);
    if (!cst) {
      throw new Error(`CST com id ${id} não encontrado`);
    }
    
    const updatedCST = { ...cst, ...data };
    this.fiscalCSTs.set(id, updatedCST);
    return updatedCST;
  }
  
  async deleteFiscalCST(id: number): Promise<boolean> {
    return this.fiscalCSTs.delete(id);
  }
  
  // Fiscal Config
  async getFiscalConfig(): Promise<FiscalConfig | undefined> {
    if (this.fiscalConfigs.size === 0) {
      return undefined;
    }
    return this.fiscalConfigs.values().next().value;
  }
  
  async createFiscalConfig(config: InsertFiscalConfig): Promise<FiscalConfig> {
    const id = this.currentId.fiscalConfigs++;
    const now = new Date();
    const newConfig: FiscalConfig = { ...config, id, createdAt: now, updatedAt: now };
    this.fiscalConfigs.set(id, newConfig);
    return newConfig;
  }
  
  async updateFiscalConfig(id: number, data: Partial<FiscalConfig>): Promise<FiscalConfig> {
    const config = await this.getFiscalConfig();
    if (!config) {
      throw new Error(`Configuração fiscal com id ${id} não encontrada`);
    }
    
    const now = new Date();
    const updatedConfig = { ...config, ...data, updatedAt: now };
    this.fiscalConfigs.set(id, updatedConfig);
    return updatedConfig;
  }
  
  // NFes
  async getNFes(): Promise<NFe[]> {
    return Array.from(this.nfes.values());
  }
  
  async getNFesByTipo(tipo: string): Promise<NFe[]> {
    return Array.from(this.nfes.values()).filter(
      (nfe) => nfe.tipoOperacao === tipo
    );
  }
  
  async getNFeById(id: number): Promise<NFe | undefined> {
    return this.nfes.get(id);
  }
  
  async getNFeByChave(chave: string): Promise<NFe | undefined> {
    return Array.from(this.nfes.values()).find(
      (nfe) => nfe.chave === chave
    );
  }
  
  async createNFe(nfe: InsertNFe): Promise<NFe> {
    const id = this.currentId.nfes++;
    const now = new Date();
    
    // Gerar chave de acesso da NFe (NFeKey) para simulação - formato simplificado
    // Na implementação real, isso seria calculado conforme a documentação da SEFAZ
    // usando UF, Ano/Mês, CNPJ, modelo, série, etc. + dígito verificador
    const chave = `${nfe.serie}${nfe.numero.toString().padStart(9, '0')}${Date.now()}`;
    
    const newNFe: NFe = { 
      ...nfe, 
      id, 
      createdAt: now, 
      updatedAt: now,
      chave
    };
    
    this.nfes.set(id, newNFe);
    return newNFe;
  }
  
  async updateNFe(id: number, data: Partial<NFe>): Promise<NFe> {
    const nfe = await this.getNFeById(id);
    if (!nfe) {
      throw new Error(`NFe com id ${id} não encontrada`);
    }
    
    const now = new Date();
    const updatedNFe = { ...nfe, ...data, updatedAt: now };
    this.nfes.set(id, updatedNFe);
    return updatedNFe;
  }
  
  // NFe Items
  async getNFeItems(nfeId: number): Promise<NFeItem[]> {
    return Array.from(this.nfeItens.values())
      .filter(item => item.nfeId === nfeId);
  }
  
  async getNFeItem(id: number): Promise<NFeItem | undefined> {
    return this.nfeItens.get(id);
  }
  
  async createNFeItem(item: InsertNFeItem): Promise<NFeItem> {
    const id = this.currentId.nfeItens++;
    const now = new Date();
    const newItem: NFeItem = { ...item, id, createdAt: now };
    this.nfeItens.set(id, newItem);
    return newItem;
  }
  
  async updateNFeItem(id: number, data: Partial<NFeItem>): Promise<NFeItem> {
    const item = await this.getNFeItem(id);
    if (!item) {
      throw new Error(`Item de NFe com id ${id} não encontrado`);
    }
    
    const updatedItem = { ...item, ...data };
    this.nfeItens.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteNFeItem(id: number): Promise<boolean> {
    return this.nfeItens.delete(id);
  }
  
  // NFe Events
  async getNFeEvents(nfeId: number): Promise<NFeEvento[]> {
    return Array.from(this.nfeEventos.values())
      .filter(event => event.nfeId === nfeId)
      .sort((a, b) => a.dataEvento.getTime() - b.dataEvento.getTime());
  }
  
  async createNFeEvent(event: InsertNFeEvento): Promise<NFeEvento> {
    const id = this.currentId.nfeEventos++;
    const now = new Date();
    const newEvent: NFeEvento = { ...event, id, createdAt: now };
    this.nfeEventos.set(id, newEvent);
    return newEvent;
  }
  
  // Para entrada de notas fiscais e integração com estoque
  async getSupplierByTaxId(taxId: string): Promise<any> {
    // Busca fornecedor pelo CNPJ/CPF
    // Implementação simplificada para demonstração
    return Array.from(this.suppliers.values()).find(
      (supplier) => supplier.taxId === taxId
    );
  }
  
  async createSupplier(supplier: any): Promise<any> {
    const id = this.currentId.suppliers ? 
      this.currentId.suppliers++ : 
      (this.currentId.suppliers = 1);
      
    const now = new Date();
    const newSupplier = { 
      ...supplier, 
      id, 
      createdAt: now 
    };
    
    if (!this.suppliers) {
      this.suppliers = new Map();
    }
    
    this.suppliers.set(id, newSupplier);
    return newSupplier;
  }
  
  async getSuppliersByIds(ids: number[]): Promise<any[]> {
    return Array.from(this.suppliers.values()).filter(
      (supplier) => ids.includes(supplier.id)
    );
  }
  
  async getRawMaterialByCode(code: string): Promise<RawMaterial | undefined> {
    return Array.from(this.rawMaterials.values()).find(
      (material) => material.code === code
    );
  }
  
  async getRawMaterialByName(name: string): Promise<RawMaterial | undefined> {
    return Array.from(this.rawMaterials.values()).find(
      (material) => material.name.toLowerCase() === name.toLowerCase()
    );
  }
  
  async updateRawMaterialStock(id: number, quantity: number): Promise<void> {
    const material = await this.getRawMaterial(id);
    if (!material) {
      throw new Error(`Matéria-prima com id ${id} não encontrada`);
    }
    
    const updatedMaterial = { 
      ...material, 
      currentStock: (material.currentStock || 0) + quantity 
    };
    this.rawMaterials.set(id, updatedMaterial);
  }
  
  async addInventoryTransaction(transaction: any): Promise<any> {
    const id = this.currentId.inventoryTransactions ? 
      this.currentId.inventoryTransactions++ : 
      (this.currentId.inventoryTransactions = 1);
    
    const now = new Date();
    const newTransaction = { 
      ...transaction, 
      id, 
      createdAt: now 
    };
    
    if (!this.inventoryTransactions) {
      this.inventoryTransactions = new Map();
    }
    
    this.inventoryTransactions.set(id, newTransaction);
    return newTransaction;
  }
  
  // Product Fiscal Data
  async getProdutoFiscal(produtoId: number): Promise<ProdutoFiscal | undefined> {
    return Array.from(this.produtosFiscais.values()).find(
      (pf) => pf.produtoId === produtoId
    );
  }
  
  async createProdutoFiscal(produto: InsertProdutoFiscal): Promise<ProdutoFiscal> {
    const id = this.currentId.produtosFiscais++;
    const now = new Date();
    const newProdutoFiscal: ProdutoFiscal = { 
      ...produto, 
      id, 
      createdAt: now,
      updatedAt: now
    };
    this.produtosFiscais.set(id, newProdutoFiscal);
    return newProdutoFiscal;
  }
  
  async updateProdutoFiscal(produtoId: number, data: Partial<ProdutoFiscal>): Promise<ProdutoFiscal> {
    const produtoFiscal = await this.getProdutoFiscal(produtoId);
    if (!produtoFiscal) {
      throw new Error(`Dados fiscais para o produto ${produtoId} não encontrados`);
    }
    
    const now = new Date();
    const updatedProdutoFiscal = { ...produtoFiscal, ...data, updatedAt: now };
    this.produtosFiscais.set(produtoFiscal.id, updatedProdutoFiscal);
    return updatedProdutoFiscal;
  }
  
  // Quotation methods
  async getQuotations(): Promise<Quotation[]> {
    return Array.from(this.quotations.values());
  }
  
  async getQuotation(id: number): Promise<Quotation | undefined> {
    return this.quotations.get(id);
  }
  
  async createQuotation(quotation: InsertQuotation): Promise<Quotation> {
    const id = this.currentId.quotations++;
    const now = new Date();
    const newQuotation: Quotation = { 
      ...quotation, 
      id, 
      createdAt: now 
    };
    this.quotations.set(id, newQuotation);
    return newQuotation;
  }
  
  async updateQuotation(id: number, data: Partial<Quotation>): Promise<Quotation> {
    const quotation = await this.getQuotation(id);
    if (!quotation) {
      throw new Error(`Cotação com id ${id} não encontrada`);
    }
    
    const updatedQuotation = { ...quotation, ...data };
    this.quotations.set(id, updatedQuotation);
    return updatedQuotation;
  }
  
  async deleteQuotation(id: number): Promise<boolean> {
    return this.quotations.delete(id);
  }
  
  // Quotation Items methods
  async getQuotationItems(quotationId: number): Promise<QuotationItem[]> {
    return Array.from(this.quotationItems.values())
      .filter(item => item.quotationId === quotationId);
  }
  
  async getQuotationItem(id: number): Promise<QuotationItem | undefined> {
    return this.quotationItems.get(id);
  }
  
  async createQuotationItem(item: InsertQuotationItem): Promise<QuotationItem> {
    const id = this.currentId.quotationItems++;
    const now = new Date();
    const newItem: QuotationItem = { 
      ...item, 
      id, 
      createdAt: now 
    };
    this.quotationItems.set(id, newItem);
    return newItem;
  }
  
  async updateQuotationItem(id: number, data: Partial<QuotationItem>): Promise<QuotationItem> {
    const item = await this.getQuotationItem(id);
    if (!item) {
      throw new Error(`Item de cotação com id ${id} não encontrado`);
    }
    
    const updatedItem = { ...item, ...data };
    this.quotationItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteQuotationItem(id: number): Promise<boolean> {
    return this.quotationItems.delete(id);
  }
  
  // Supplier Quotations methods
  async getSupplierQuotations(quotationItemId: number): Promise<SupplierQuotation[]> {
    return Array.from(this.supplierQuotations.values())
      .filter(quote => quote.quotationItemId === quotationItemId);
  }
  
  async getSupplierQuotation(id: number): Promise<SupplierQuotation | undefined> {
    return this.supplierQuotations.get(id);
  }
  
  async createSupplierQuotation(quote: InsertSupplierQuotation): Promise<SupplierQuotation> {
    const id = this.currentId.supplierQuotations++;
    const now = new Date();
    const newQuote: SupplierQuotation = { 
      ...quote, 
      id, 
      createdAt: now 
    };
    this.supplierQuotations.set(id, newQuote);
    return newQuote;
  }
  
  async updateSupplierQuotation(id: number, data: Partial<SupplierQuotation>): Promise<SupplierQuotation> {
    const quote = await this.getSupplierQuotation(id);
    if (!quote) {
      throw new Error(`Cotação de fornecedor com id ${id} não encontrada`);
    }
    
    const updatedQuote = { ...quote, ...data };
    this.supplierQuotations.set(id, updatedQuote);
    return updatedQuote;
  }
  
  async selectBestSupplierQuotation(id: number): Promise<SupplierQuotation> {
    const quotation = await this.getSupplierQuotation(id);
    if (!quotation) {
      throw new Error(`Cotação de fornecedor com id ${id} não encontrada`);
    }
    
    // Primeiro desmarca todos os outros
    if (quotation.quotationItemId) {
      const allQuotations = await this.getSupplierQuotations(quotation.quotationItemId);
      for (const q of allQuotations) {
        if (q.id !== id) {
          await this.updateSupplierQuotation(q.id, { isSelected: false });
        }
      }
    }
    
    // Então marca o selecionado
    const selectedQuotation = await this.updateSupplierQuotation(id, { isSelected: true });
    return selectedQuotation;
  }
  
  async deleteSupplierQuotation(id: number): Promise<boolean> {
    return this.supplierQuotations.delete(id);
  }
  
  // Product Pricing methods
  async getProductPricings(): Promise<ProductPricing[]> {
    return Array.from(this.productPricings.values());
  }
  
  async getProductPricing(id: number): Promise<ProductPricing | undefined> {
    return this.productPricings.get(id);
  }
  
  async getProductPricingByProductId(productId: number): Promise<ProductPricing | undefined> {
    return Array.from(this.productPricings.values())
      .find(pricing => pricing.productId === productId);
  }
  
  async createProductPricing(pricing: InsertProductPricing): Promise<ProductPricing> {
    const id = this.currentId.productPricings++;
    const now = new Date();
    const newPricing: ProductPricing = { 
      ...pricing, 
      id, 
      createdAt: now 
    };
    this.productPricings.set(id, newPricing);
    return newPricing;
  }
  
  async updateProductPricing(id: number, data: Partial<ProductPricing>): Promise<ProductPricing> {
    const pricing = await this.getProductPricing(id);
    if (!pricing) {
      throw new Error(`Precificação de produto com id ${id} não encontrada`);
    }
    
    const updatedPricing = { ...pricing, ...data };
    this.productPricings.set(id, updatedPricing);
    return updatedPricing;
  }
  
  async deleteProductPricing(id: number): Promise<boolean> {
    return this.productPricings.delete(id);
  }
  
  // Measurement Units methods
  async getMeasurementUnits(): Promise<MeasurementUnit[]> {
    return Array.from(this.measurementUnits.values());
  }
  
  async getMeasurementUnit(id: number): Promise<MeasurementUnit | undefined> {
    return this.measurementUnits.get(id);
  }
  
  async createMeasurementUnit(unit: InsertMeasurementUnit): Promise<MeasurementUnit> {
    const id = this.currentId.measurementUnits++;
    const now = new Date();
    const newUnit: MeasurementUnit = { 
      ...unit, 
      id, 
      createdAt: now,
      active: true 
    };
    this.measurementUnits.set(id, newUnit);
    return newUnit;
  }
  
  async updateMeasurementUnit(id: number, data: Partial<MeasurementUnit>): Promise<MeasurementUnit> {
    const unit = await this.getMeasurementUnit(id);
    if (!unit) {
      throw new Error(`Unidade de medida com id ${id} não encontrada`);
    }
    
    const updatedUnit = { ...unit, ...data };
    this.measurementUnits.set(id, updatedUnit);
    return updatedUnit;
  }
  
  async deleteMeasurementUnit(id: number): Promise<boolean> {
    return this.measurementUnits.delete(id);
  }

  // Support Ticket methods
  async getSupportTicketsByUserId(userId: number): Promise<SupportTicket[]> {
    return Array.from(this.supportTickets.values())
      .filter(ticket => ticket.userId === userId);
  }

  async getAllSupportTickets(): Promise<SupportTicket[]> {
    return Array.from(this.supportTickets.values());
  }

  async getSupportTicketById(id: number): Promise<SupportTicket | undefined> {
    return this.supportTickets.get(id);
  }

  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    const id = this.currentId.supportTickets++;
    const now = new Date();
    const newTicket: SupportTicket = {
      ...ticket,
      id,
      createdAt: now,
      updatedAt: now,
      status: ticket.status || 'aberto'
    };
    this.supportTickets.set(id, newTicket);
    return newTicket;
  }

  async updateSupportTicket(id: number, data: Partial<SupportTicket>): Promise<SupportTicket> {
    const ticket = await this.getSupportTicketById(id);
    if (!ticket) {
      throw new Error(`Ticket de suporte com id ${id} não encontrado`);
    }
    
    const updatedTicket = { 
      ...ticket, 
      ...data,
      updatedAt: new Date()
    };
    this.supportTickets.set(id, updatedTicket);
    return updatedTicket;
  }
  
  async deleteSupportTicket(id: number): Promise<boolean> {
    return this.supportTickets.delete(id);
  }
  
  // Knowledge Base methods
  async getAllKnowledgeArticles(): Promise<KnowledgeArticle[]> {
    return Array.from(this.knowledgeArticles.values());
  }
  
  async getKnowledgeArticleById(id: number): Promise<KnowledgeArticle | undefined> {
    return this.knowledgeArticles.get(id);
  }
  
  async getKnowledgeArticlesByCategory(category: string): Promise<KnowledgeArticle[]> {
    return Array.from(this.knowledgeArticles.values())
      .filter(article => article.category === category);
  }
  
  async createKnowledgeArticle(article: InsertKnowledgeArticle): Promise<KnowledgeArticle> {
    const id = this.currentId.knowledgeArticles++;
    const now = new Date();
    
    const newArticle: KnowledgeArticle = {
      ...article,
      id,
      createdAt: now,
      updatedAt: now,
      viewCount: 0,
      status: article.status || 'publicado'
    };
    
    this.knowledgeArticles.set(id, newArticle);
    return newArticle;
  }
  
  async updateKnowledgeArticle(id: number, data: Partial<KnowledgeArticle>): Promise<KnowledgeArticle> {
    const article = await this.getKnowledgeArticleById(id);
    if (!article) {
      throw new Error(`Artigo de conhecimento com id ${id} não encontrado`);
    }
    
    const updatedArticle = { 
      ...article, 
      ...data,
      updatedAt: new Date() 
    };
    
    this.knowledgeArticles.set(id, updatedArticle);
    return updatedArticle;
  }
  
  async deleteKnowledgeArticle(id: number): Promise<boolean> {
    return this.knowledgeArticles.delete(id);
  }
  
  async incrementKnowledgeArticleViews(id: number): Promise<KnowledgeArticle> {
    const article = await this.getKnowledgeArticleById(id);
    if (!article) {
      throw new Error(`Artigo de conhecimento com id ${id} não encontrado`);
    }
    
    const updatedArticle = { 
      ...article,
      viewCount: article.viewCount + 1
    };
    
    this.knowledgeArticles.set(id, updatedArticle);
    return updatedArticle;
  }
}

// Utilize a implementação de PostgreSQL
export const storage = new DatabaseStorage();

// Função para inicializar o sistema com usuários administradores padrão
export async function initializeDefaultUsers() {
  try {
    // Importar função para gerar hash de senha
    const { hashPassword } = await import('./auth');
    
    // Verificar se o usuário 'administrador' já existe
    const adminUser = await storage.getUserByUsername('administrador');
    if (!adminUser) {
      // Criar hash de senha usando scrypt
      const adminPassword = await hashPassword('administrador');
      
      // Criar usuário administrador padrão
      await storage.createUser({
        username: 'administrador',
        password: adminPassword,
        fullName: 'Administrador do Sistema',
        email: 'admin@custosmart.com.br',
        role: 'admin',
        permissions: {
          dashboard: true,
          admin: true,
          finance: true,
          production: true,
          maintenance: true,
          inventory: true,
          quality: true,
          commercial: true,
          purchase: true,
          chat: true
        }
      });
      console.log('Usuário administrador padrão criado com sucesso.');
    }

    // Verificar se o usuário 'leoalmeidas' já existe
    const leoUser = await storage.getUserByUsername('leoalmeidas');
    if (!leoUser) {
      // Criar hash de senha usando scrypt
      const leoPassword = await hashPassword('L30n4rd0@052085');
      
      // Criar usuário leoalmeidas padrão
      await storage.createUser({
        username: 'leoalmeidas',
        password: leoPassword,
        fullName: 'Leonardo Almeida',
        email: 'leo@custosmart.com.br',
        role: 'admin',
        permissions: {
          dashboard: true,
          admin: true,
          finance: true,
          production: true,
          maintenance: true,
          inventory: true,
          quality: true,
          commercial: true,
          purchase: true,
          chat: true
        }
      });
      console.log('Usuário leoalmeidas padrão criado com sucesso.');
    }
  } catch (error) {
    console.error('Erro ao inicializar usuários padrão:', error);
  }
}
