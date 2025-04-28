import { pgTable, text, serial, integer, boolean, jsonb, timestamp, doublePrecision, date, real, varchar, unique, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Definindo a estrutura de permissões por módulo
export interface UserPermissions {
  dashboard?: boolean;
  admin?: boolean;
  finance?: boolean;
  production?: boolean;
  maintenance?: boolean;
  inventory?: boolean;
  quality?: boolean;
  commercial?: boolean;
  purchase?: boolean;
  hr?: boolean;
  chat?: boolean;
  support?: boolean;
  [key: string]: boolean | undefined;
}

// User and auth related tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  role: text("role").notNull().default("user"),
  active: boolean("active").notNull().default(true),
  status: text("status").default("online"), // online, away, busy, offline
  statusMessage: text("status_message"),
  permissions: jsonb("permissions").default({
    dashboard: false,
    admin: false,
    finance: false,
    production: false,
    maintenance: false,
    inventory: false,
    quality: false,
    commercial: false,
    purchase: false,
    hr: false,       // Adicionada permissão para Recursos Humanos
    chat: false,
    support: false,
  }),  // Objeto de permissões por módulo
  createdAt: timestamp("created_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  email: true, 
  role: true,
  permissions: true
});

// Company Info
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  logo: text("logo"),
  taxId: text("tax_id"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
  logo: true,
  taxId: true,
  address: true,
  phone: true,
  email: true,
  website: true
});

// Financial module
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: doublePrecision("amount").notNull(),
  dueDate: date("due_date").notNull(),
  paymentDate: date("payment_date"),
  category: text("category").notNull(),
  isRecurring: boolean("is_recurring").default(false),
  recurrenceInfo: jsonb("recurrence_info"),
  costCenter: text("cost_center"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const insertExpenseSchema = createInsertSchema(expenses).pick({
  description: true,
  amount: true, 
  dueDate: true,
  paymentDate: true,
  category: true,
  isRecurring: true,
  recurrenceInfo: true,
  costCenter: true,
  createdBy: true
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: doublePrecision("amount").notNull(),
  dueDate: date("due_date").notNull(),
  type: text("type").notNull(), // 'payable' or 'receivable'
  status: text("status").notNull().default('pending'), // 'pending', 'paid', 'overdue'
  entityName: text("entity_name").notNull(), // client or supplier name
  entityId: integer("entity_id"),
  documentNumber: text("document_number"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const insertAccountSchema = createInsertSchema(accounts).pick({
  description: true,
  amount: true,
  dueDate: true,
  type: true,
  status: true,
  entityName: true,
  entityId: true,
  documentNumber: true,
  createdBy: true
});

// Production module
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
  unitCost: doublePrecision("unit_cost").notNull().default(0),
  sellingPrice: doublePrecision("selling_price"),
  formula: jsonb("formula"), // Components and amounts
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const insertProductSchema = createInsertSchema(products).pick({
  name: true,
  code: true,
  description: true,
  unitCost: true,
  sellingPrice: true,
  formula: true,
  createdBy: true
});

export const productFormulas = pgTable("product_formulas", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id).notNull(),
  materialId: integer("material_id").references(() => rawMaterials.id).notNull(),
  quantity: doublePrecision("quantity").notNull(),
  unit: text("unit"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const insertProductFormulaSchema = createInsertSchema(productFormulas).pick({
  productId: true,
  materialId: true,
  quantity: true,
  unit: true,
  description: true,
  createdBy: true
});

export type ProductFormula = typeof productFormulas.$inferSelect;
export type InsertProductFormula = z.infer<typeof insertProductFormulaSchema>;

export const productionOrders = pgTable("production_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  productId: integer("product_id").references(() => products.id),
  quantity: doublePrecision("quantity").notNull(),
  status: text("status").notNull().default('planned'), // 'planned', 'in-progress', 'completed', 'cancelled'
  startDate: date("start_date"),
  endDate: date("end_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const insertProductionOrderSchema = createInsertSchema(productionOrders).pick({
  orderNumber: true,
  productId: true,
  quantity: true,
  status: true,
  startDate: true,
  endDate: true,
  notes: true,
  createdBy: true
});

export const productionLosses = pgTable("production_losses", {
  id: serial("id").primaryKey(),
  productionOrderId: integer("production_order_id").references(() => productionOrders.id),
  quantity: doublePrecision("quantity").notNull(),
  reason: text("reason").notNull(),
  date: date("date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const insertProductionLossSchema = createInsertSchema(productionLosses).pick({
  productionOrderId: true,
  quantity: true,
  reason: true,
  date: true,
  notes: true,
  createdBy: true
});

// Maintenance module
export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  model: text("model"),
  serialNumber: text("serial_number"),
  manufacturer: text("manufacturer"),
  purchaseDate: date("purchase_date"),
  sector: text("sector").notNull(),
  type: text("type").notNull(),
  criticality: text("criticality").notNull(), // 'high', 'medium', 'low'
  status: text("status").notNull().default('operational'), // 'operational', 'maintenance', 'broken'
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const insertEquipmentSchema = createInsertSchema(equipment).pick({
  name: true,
  model: true,
  serialNumber: true,
  manufacturer: true,
  purchaseDate: true,
  sector: true,
  type: true,
  criticality: true,
  status: true,
  createdBy: true
});

export const maintenanceOrders = pgTable("maintenance_orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  equipmentId: integer("equipment_id").references(() => equipment.id),
  type: text("type").notNull(), // 'preventive', 'corrective'
  description: text("description").notNull(),
  urgency: text("urgency").notNull(), // 'high', 'medium', 'low'
  status: text("status").notNull().default('open'), // 'open', 'in-progress', 'completed'
  scheduledDate: date("scheduled_date"),
  completionDate: date("completion_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const insertMaintenanceOrderSchema = createInsertSchema(maintenanceOrders).pick({
  orderNumber: true,
  equipmentId: true,
  type: true,
  description: true,
  urgency: true,
  status: true,
  scheduledDate: true,
  completionDate: true,
  notes: true,
  createdBy: true
});

// Inventory module
export const rawMaterials = pgTable("raw_materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  unit: text("unit").notNull(), // 'kg', 'l', 'pcs', etc.
  currentStock: doublePrecision("current_stock").notNull().default(0),
  minimumStock: doublePrecision("minimum_stock").notNull().default(0),
  locationInWarehouse: text("location_in_warehouse"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const insertRawMaterialSchema = createInsertSchema(rawMaterials).pick({
  name: true,
  code: true,
  unit: true,
  currentStock: true,
  minimumStock: true,
  locationInWarehouse: true,
  createdBy: true
});

export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  materialId: integer("material_id").references(() => rawMaterials.id),
  quantity: doublePrecision("quantity").notNull(),
  transactionType: text("transaction_type").notNull(), // 'in', 'out'
  referenceType: text("reference_type"), // 'purchase', 'production', etc.
  referenceId: integer("reference_id"), // ID of the related record
  lotNumber: text("lot_number"),
  expirationDate: date("expiration_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const insertInventorySchema = createInsertSchema(inventory).pick({
  materialId: true,
  quantity: true,
  transactionType: true,
  referenceType: true,
  referenceId: true,
  lotNumber: true,
  expirationDate: true,
  notes: true,
  createdBy: true
});

// Quality module
export const qualityInspections = pgTable("quality_inspections", {
  id: serial("id").primaryKey(),
  inspectionType: text("inspection_type").notNull(), // 'incoming', 'outgoing', 'in-process'
  referenceType: text("reference_type").notNull(), // 'raw-material', 'product', 'production'
  referenceId: integer("reference_id").notNull(), // ID of related material, product or production
  result: text("result").notNull(), // 'approved', 'rejected', 'pending'
  notes: text("notes"),
  inspectionDate: date("inspection_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const insertQualityInspectionSchema = createInsertSchema(qualityInspections).pick({
  inspectionType: true,
  referenceType: true,
  referenceId: true,
  result: true,
  notes: true,
  inspectionDate: true,
  createdBy: true
});

// Commercial module
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  taxId: text("tax_id"),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const insertCustomerSchema = createInsertSchema(customers).pick({
  name: true,
  taxId: true,
  contactName: true,
  email: true,
  phone: true,
  address: true,
  createdBy: true
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: text("order_number").notNull().unique(),
  customerId: integer("customer_id").references(() => customers.id),
  orderDate: date("order_date").notNull(),
  deliveryDate: date("delivery_date"),
  status: text("status").notNull().default('new'), // 'new', 'in-progress', 'delivered', 'cancelled'
  totalAmount: doublePrecision("total_amount").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  orderNumber: true,
  customerId: true,
  orderDate: true,
  deliveryDate: true,
  status: true,
  totalAmount: true,
  notes: true,
  createdBy: true
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id),
  productId: integer("product_id").references(() => products.id),
  quantity: doublePrecision("quantity").notNull(),
  unitPrice: doublePrecision("unit_price").notNull(),
  totalPrice: doublePrecision("total_price").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  productId: true,
  quantity: true,
  unitPrice: true,
  totalPrice: true
});

// Purchase module
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  taxId: text("tax_id"),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const insertSupplierSchema = createInsertSchema(suppliers).pick({
  name: true,
  taxId: true,
  contactName: true,
  email: true,
  phone: true,
  address: true,
  createdBy: true
});

// Sistema de Alertas
export const systemAlerts = pgTable("system_alerts", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  priority: text("priority").notNull().default("medium"), // 'high', 'medium', 'low'
  status: text("status").notNull().default("active"), // 'active', 'acknowledged', 'resolved'
  module: text("module").notNull(), // 'inventory', 'maintenance', 'finance', 'production', 'quality', etc.
  referenceType: text("reference_type"), // Tipo de entidade relacionada
  referenceId: integer("reference_id"), // ID da entidade relacionada
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  acknowledgedAt: timestamp("acknowledged_at"),
  acknowledgedBy: integer("acknowledged_by").references(() => users.id),
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: integer("resolved_by").references(() => users.id)
});

export const insertSystemAlertSchema = createInsertSchema(systemAlerts).pick({
  message: true,
  priority: true,
  status: true,
  module: true,
  referenceType: true,
  referenceId: true,
  createdBy: true
});

// Sistema de Auditoria
export const systemAuditLogs = pgTable("system_audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // 'create', 'update', 'delete'
  entityType: text("entity_type").notNull(), // Tipo de entidade afetada (tabela)
  entityId: integer("entity_id"), // ID da entidade afetada
  details: jsonb("details"), // Detalhes das mudanças (antes/depois)
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").defaultNow(),
  module: text("module"), // Módulo do sistema onde ocorreu a ação
});

export const insertSystemAuditLogSchema = createInsertSchema(systemAuditLogs).pick({
  userId: true,
  action: true,
  entityType: true,
  entityId: true,
  details: true,
  ipAddress: true,
  userAgent: true,
  module: true,
});

// Logs de Chat
export const chatAuditLogs = pgTable("chat_audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: text("action").notNull(), // 'send', 'edit', 'delete'
  roomId: integer("room_id").references(() => chatRooms.id),
  messageId: integer("message_id").references(() => chatMessages.id),
  originalContent: text("original_content"), // Conteúdo original da mensagem (para edições/exclusões)
  newContent: text("new_content"), // Novo conteúdo (para edições)
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertChatAuditLogSchema = createInsertSchema(chatAuditLogs).pick({
  userId: true,
  action: true,
  roomId: true,
  messageId: true,
  originalContent: true,
  newContent: true,
});

// Nota: Interface UserPermissions já definida no início do arquivo

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type ProductionOrder = typeof productionOrders.$inferSelect;
export type InsertProductionOrder = z.infer<typeof insertProductionOrderSchema>;

export type ProductionLoss = typeof productionLosses.$inferSelect;
export type InsertProductionLoss = z.infer<typeof insertProductionLossSchema>;

export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;

export type MaintenanceOrder = typeof maintenanceOrders.$inferSelect;
export type InsertMaintenanceOrder = z.infer<typeof insertMaintenanceOrderSchema>;

export type RawMaterial = typeof rawMaterials.$inferSelect;
export type InsertRawMaterial = z.infer<typeof insertRawMaterialSchema>;

export type InventoryTransaction = typeof inventory.$inferSelect;
export type InsertInventoryTransaction = z.infer<typeof insertInventorySchema>;

export type QualityInspection = typeof qualityInspections.$inferSelect;
export type InsertQualityInspection = z.infer<typeof insertQualityInspectionSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

// Quotation module
export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  quotationNumber: text("quotation_number").notNull().unique(),
  status: text("status").notNull().default('open'), // 'open', 'closed', 'cancelled'
  creationDate: date("creation_date").notNull(),
  closingDate: date("closing_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const insertQuotationSchema = createInsertSchema(quotations).pick({
  quotationNumber: true,
  status: true,
  creationDate: true,
  closingDate: true,
  notes: true,
  createdBy: true
});

export const quotationItems = pgTable("quotation_items", {
  id: serial("id").primaryKey(),
  quotationId: integer("quotation_id").references(() => quotations.id),
  materialId: integer("material_id").references(() => rawMaterials.id),
  quantity: doublePrecision("quantity").notNull(),
  unitId: integer("unit_id").references(() => measurementUnits.id),
  unitMeasurement: text("unit_measurement").notNull(), // Mantemos para compatibilidade
  createdAt: timestamp("created_at").defaultNow()
});

export const insertQuotationItemSchema = createInsertSchema(quotationItems).pick({
  quotationId: true,
  materialId: true,
  quantity: true,
  unitId: true,
  unitMeasurement: true
});

export const supplierQuotations = pgTable("supplier_quotations", {
  id: serial("id").primaryKey(),
  quotationItemId: integer("quotation_item_id").references(() => quotationItems.id),
  supplierId: integer("supplier_id").references(() => suppliers.id),
  unitPrice: doublePrecision("unit_price").notNull(),
  freight: doublePrecision("freight").notNull().default(0),
  taxes: doublePrecision("taxes").notNull().default(0), 
  totalPrice: doublePrecision("total_price").notNull(),
  deliveryTime: integer("delivery_time"), // Em dias
  paymentTerms: text("payment_terms"),
  notes: text("notes"),
  isSelected: boolean("is_selected").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertSupplierQuotationSchema = createInsertSchema(supplierQuotations).pick({
  quotationItemId: true,
  supplierId: true,
  unitPrice: true,
  freight: true,
  taxes: true,
  totalPrice: true,
  deliveryTime: true,
  paymentTerms: true,
  notes: true,
  isSelected: true
});

// Product pricing
export const productPricing = pgTable("product_pricing", {
  id: serial("id").primaryKey(),
  productId: integer("product_id").references(() => products.id),
  rawMaterialCost: doublePrecision("raw_material_cost").notNull().default(0),
  laborCost: doublePrecision("labor_cost").notNull().default(0),
  overheadCost: doublePrecision("overhead_cost").notNull().default(0),
  freightCost: doublePrecision("freight_cost").notNull().default(0),
  taxes: doublePrecision("taxes").notNull().default(0),
  profitMargin: doublePrecision("profit_margin").notNull().default(0), // Em percentual
  totalCost: doublePrecision("total_cost").notNull().default(0),
  suggestedPrice: doublePrecision("suggested_price").notNull().default(0),
  margin: doublePrecision("margin").notNull().default(0), // Em percentual
  calculationDate: date("calculation_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const insertProductPricingSchema = createInsertSchema(productPricing).pick({
  productId: true,
  rawMaterialCost: true,
  laborCost: true,
  overheadCost: true,
  freightCost: true,
  taxes: true,
  profitMargin: true,
  totalCost: true,
  suggestedPrice: true,
  margin: true,
  calculationDate: true,
  createdBy: true
});

// Recursos Humanos (RH) module
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cpf: text("cpf").unique(),
  rg: text("rg"),
  birthDate: date("birth_date"),
  gender: text("gender"),
  maritalStatus: text("marital_status"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  email: text("email"),
  phone: text("phone"),
  cellphone: text("cellphone"),
  position: text("position").notNull(),
  department: text("department").notNull(),
  hiringDate: date("hiring_date").notNull(),
  salary: doublePrecision("salary"),
  status: text("status").notNull().default("active"), // active, terminated, on_leave
  terminationDate: date("termination_date"),
  notes: text("notes"),
  userId: integer("user_id").references(() => users.id), // Opcional, caso o funcionário tenha acesso ao sistema
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const insertEmployeeSchema = createInsertSchema(employees).pick({
  name: true,
  cpf: true,
  rg: true,
  birthDate: true,
  gender: true,
  maritalStatus: true,
  address: true,
  city: true,
  state: true,
  postalCode: true,
  email: true,
  phone: true,
  cellphone: true,
  position: true,
  department: true,
  hiringDate: true,
  salary: true,
  status: true,
  terminationDate: true,
  notes: true,
  userId: true,
  createdBy: true
});

export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  managerId: integer("manager_id").references(() => employees.id),
  parentDepartmentId: integer("parent_department_id"),
  budget: doublePrecision("budget"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const insertDepartmentSchema = createInsertSchema(departments).pick({
  name: true,
  description: true,
  managerId: true,
  parentDepartmentId: true,
  budget: true,
  createdBy: true
});

export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  departmentId: integer("department_id").references(() => departments.id),
  responsibilities: text("responsibilities"),
  requirements: text("requirements"),
  salaryRangeMin: doublePrecision("salary_range_min"),
  salaryRangeMax: doublePrecision("salary_range_max"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const insertPositionSchema = createInsertSchema(positions).pick({
  name: true,
  description: true,
  departmentId: true,
  salaryRangeMin: true,
  salaryRangeMax: true,
  responsibilities: true,
  requirements: true,
  createdBy: true
});

export const leaves = pgTable("leaves", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  type: text("type").notNull(), // vacation, sick, personal, maternity, paternity
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected, completed
  reason: text("reason"),
  notes: text("notes"),
  approvedById: integer("approved_by_id").references(() => users.id),
  approvedDate: timestamp("approved_date"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const insertLeaveSchema = createInsertSchema(leaves).pick({
  employeeId: true,
  type: true,
  startDate: true,
  endDate: true,
  status: true,
  reason: true,
  notes: true,
  approvedById: true,
  approvedDate: true,
  createdBy: true
});

export const payroll = pgTable("payroll", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => employees.id).notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  baseSalary: doublePrecision("base_salary").notNull(),
  grossSalary: doublePrecision("gross_salary").notNull(),
  netSalary: doublePrecision("net_salary").notNull(),
  inss: doublePrecision("inss"), // Contribuição para previdência social
  irrf: doublePrecision("irrf"), // Imposto de renda
  fgts: doublePrecision("fgts"), // Fundo de garantia
  benefits: doublePrecision("benefits").default(0),
  deductions: doublePrecision("deductions").default(0),
  bonuses: doublePrecision("bonuses").default(0),
  paymentDate: date("payment_date"),
  status: text("status").notNull().default("pending"), // pending, processed, paid
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const insertPayrollSchema = createInsertSchema(payroll).pick({
  employeeId: true,
  year: true,
  month: true,
  baseSalary: true,
  grossSalary: true,
  netSalary: true,
  inss: true,
  irrf: true,
  fgts: true,
  benefits: true,
  deductions: true,
  bonuses: true,
  paymentDate: true,
  status: true,
  notes: true,
  createdBy: true
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;

export type Leave = typeof leaves.$inferSelect;
export type InsertLeave = z.infer<typeof insertLeaveSchema>;

export type Payroll = typeof payroll.$inferSelect;
export type InsertPayroll = z.infer<typeof insertPayrollSchema>;

// Unidades de medida e conversão
export const measurementUnits = pgTable("measurement_units", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  symbol: text("symbol").notNull().unique(),
  type: text("type").notNull(), // 'weight', 'volume', 'length', 'unit'
  baseUnit: boolean("base_unit").notNull().default(false), // Se é a unidade base para o tipo
  conversionFactor: doublePrecision("conversion_factor").notNull().default(1), // Fator para converter para a unidade base
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const insertMeasurementUnitSchema = createInsertSchema(measurementUnits).pick({
  name: true,
  symbol: true,
  type: true,
  baseUnit: true,
  conversionFactor: true,
  createdBy: true
});

export type MeasurementUnit = typeof measurementUnits.$inferSelect;
export type InsertMeasurementUnit = z.infer<typeof insertMeasurementUnitSchema>;

// Quotation types
export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotation = z.infer<typeof insertQuotationSchema>;

export type QuotationItem = typeof quotationItems.$inferSelect;
export type InsertQuotationItem = z.infer<typeof insertQuotationItemSchema>;

export type SupplierQuotation = typeof supplierQuotations.$inferSelect;
export type InsertSupplierQuotation = z.infer<typeof insertSupplierQuotationSchema>;

export type ProductPricing = typeof productPricing.$inferSelect;
export type InsertProductPricing = z.infer<typeof insertProductPricingSchema>;

// Chat relacionado
export const chatRooms = pgTable("chat_rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull().default("channel"), // channel, direct, team
  visibility: text("visibility").notNull().default("public"), // public, private
  isGroup: boolean("is_group").notNull().default(false), // mantido para retrocompatibilidade
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  avatarUrl: text("avatar_url"),
  lastMessageAt: timestamp("last_message_at"),
  readOnly: boolean("read_only").default(false),
  archived: boolean("archived").default(false)
});

export const insertChatRoomSchema = createInsertSchema(chatRooms).pick({
  name: true,
  description: true,
  type: true,
  visibility: true,
  isGroup: true,
  createdBy: true,
  avatarUrl: true,
  readOnly: true
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => chatRooms.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  message: text("message").default(''),
  content: text("content").notNull().default(''),
  isRead: boolean("is_read").notNull().default(false),
  isSystem: boolean("is_system").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  parentId: integer("parent_id").references((): any => chatMessages.id), // Para threads
  attachments: jsonb("attachments").default({}), // Para arquivos anexados
  mentions: jsonb("mentions").default([]), // Para menções de usuários
  reactions: jsonb("reactions").default({}), // Para reações às mensagens
  editedAt: timestamp("edited_at"), // Para controle de edições
  editedBy: integer("edited_by").references(() => users.id) // Para controle de edições
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  roomId: true,
  userId: true,
  message: true,
  content: true,
  isSystem: true,
  parentId: true,
  attachments: true,
  mentions: true
});

export const chatRoomParticipants = pgTable("chat_room_participants", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => chatRooms.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  isOwner: boolean("is_owner").notNull().default(false),
  isModerator: boolean("is_moderator").notNull().default(false),
  joinedAt: timestamp("joined_at").defaultNow(),
  lastSeenAt: timestamp("last_seen_at"),
  status: text("status").default("online"), // online, away, busy, offline
  statusMessage: text("status_message"),
  muted: boolean("muted").default(false),
  notifications: text("notifications").default("default") // all, mentions, nothing, default
});

export const insertChatRoomParticipantSchema = createInsertSchema(chatRoomParticipants).pick({
  roomId: true,
  userId: true,
  isAdmin: true,
  isOwner: true,
  isModerator: true,
  status: true,
  statusMessage: true,
  notifications: true
});

// Tabela de uploads de arquivos
export const chatUploads = pgTable("chat_uploads", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").references(() => chatRooms.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  fileName: text("file_name").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  thumbnailPath: text("thumbnail_path"),
  createdAt: timestamp("created_at").defaultNow(),
  fileUrl: text("file_url").notNull(),
  thumbnailUrl: text("thumbnail_url")
});

export const insertChatUploadSchema = createInsertSchema(chatUploads).pick({
  roomId: true,
  userId: true,
  fileName: true,
  originalName: true,
  mimeType: true,
  size: true,
  fileUrl: true,
  thumbnailUrl: true,
  thumbnailPath: true,
  createdAt: true
});

// Configurações de chat para usuários
export const chatUserPreferences = pgTable("chat_user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  theme: text("theme").default("light"),
  messageViewMode: text("message_view_mode").default("normal"), // normal, compact
  showAvatars: boolean("show_avatars").default(true),
  hideUsernames: boolean("hide_usernames").default(false),
  notificationSound: boolean("notification_sound").default(true),
  desktopNotifications: text("desktop_notifications").default("all"), // all, mentions, nothing
  emailNotifications: text("email_notifications").default("mentions"), // all, mentions, nothing
  preferences: jsonb("preferences").default({})
});

export const insertChatUserPreferencesSchema = createInsertSchema(chatUserPreferences).pick({
  userId: true,
  theme: true,
  messageViewMode: true,
  showAvatars: true,
  hideUsernames: true,
  notificationSound: true,
  desktopNotifications: true,
  emailNotifications: true,
  preferences: true
});

export type ChatRoom = typeof chatRooms.$inferSelect;
export type InsertChatRoom = z.infer<typeof insertChatRoomSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type ChatRoomParticipant = typeof chatRoomParticipants.$inferSelect;
export type InsertChatRoomParticipant = z.infer<typeof insertChatRoomParticipantSchema>;

export type ChatUpload = typeof chatUploads.$inferSelect;
export type InsertChatUpload = z.infer<typeof insertChatUploadSchema>;

export type ChatUserPreference = typeof chatUserPreferences.$inferSelect;
export type InsertChatUserPreference = z.infer<typeof insertChatUserPreferencesSchema>;

// Módulo fiscal - NF-e
export const fiscalCertificates = pgTable("fiscal_certificates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  serialNumber: text("serial_number").notNull().unique(),
  validFrom: date("valid_from").notNull(),
  validTo: date("valid_to").notNull(),
  certificateData: text("certificate_data").notNull(), // Arquivo do certificado em formato base64
  password: text("password").notNull(), // Senha do certificado (deve ser criptografada)
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id)
});

export const insertFiscalCertificateSchema = createInsertSchema(fiscalCertificates).pick({
  name: true,
  serialNumber: true,
  validFrom: true,
  validTo: true,
  certificateData: true,
  password: true,
  isActive: true,
  createdBy: true
});

export const fiscalNCMs = pgTable("fiscal_ncms", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  aliquotaNacional: doublePrecision("aliquota_nacional"), // Alíquota para produtos nacionais
  aliquotaImportado: doublePrecision("aliquota_importado"), // Alíquota para produtos importados
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertFiscalNCMSchema = createInsertSchema(fiscalNCMs).pick({
  code: true,
  description: true,
  aliquotaNacional: true,
  aliquotaImportado: true
});

export const fiscalCFOPs = pgTable("fiscal_cfops", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  tipo: text("tipo").notNull(), // 'entrada' ou 'saida'
  operacao: text("operacao").notNull(), // Descrição da operação
  createdAt: timestamp("created_at").defaultNow()
});

export const insertFiscalCFOPSchema = createInsertSchema(fiscalCFOPs).pick({
  code: true,
  description: true,
  tipo: true,
  operacao: true
});

export const fiscalCSTs = pgTable("fiscal_csts", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  description: text("description").notNull(),
  tipo: text("tipo").notNull(), // 'ICMS', 'PIS', 'COFINS', 'IPI'
  createdAt: timestamp("created_at").defaultNow()
});

export const insertFiscalCSTSchema = createInsertSchema(fiscalCSTs).pick({
  code: true,
  description: true,
  tipo: true
});

export const fiscalConfigs = pgTable("fiscal_configs", {
  id: serial("id").primaryKey(),
  ambiente: text("ambiente").notNull().default('homologacao'), // 'homologacao' ou 'producao'
  serieNFe: integer("serie_nfe").notNull().default(1),
  proximoNumeroNFe: integer("proximo_numero_nfe").notNull().default(1),
  regimeTributario: text("regime_tributario").notNull().default('simples'), // 'simples', 'presumido', 'real'
  inscricaoEstadual: text("inscricao_estadual"),
  inscricaoMunicipal: text("inscricao_municipal"),
  cnae: text("cnae"),
  certificadoId: integer("certificado_id").references(() => fiscalCertificates.id),
  ufEmissor: text("uf_emissor").notNull().default('MG'), // Estado emissor
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
});

export const insertFiscalConfigSchema = createInsertSchema(fiscalConfigs).pick({
  ambiente: true,
  serieNFe: true,
  proximoNumeroNFe: true,
  regimeTributario: true,
  inscricaoEstadual: true,
  inscricaoMunicipal: true,
  cnae: true,
  certificadoId: true,
  ufEmissor: true
});

export const nfes = pgTable("nfes", {
  id: serial("id").primaryKey(),
  numero: integer("numero").notNull(),
  serie: integer("serie").notNull(),
  chave: text("chave").notNull().unique(),
  dataEmissao: timestamp("data_emissao").notNull(),
  status: text("status").notNull().default('em_digitacao'), // 'em_digitacao', 'enviada', 'autorizada', 'rejeitada', 'cancelada'
  modeloDocumento: text("modelo_documento").notNull().default('55'), // 55 = NF-e, 65 = NFC-e
  naturezaOperacao: text("natureza_operacao").notNull(),
  tipoOperacao: text("tipo_operacao").notNull(), // '0' = entrada, '1' = saída
  finalidade: text("finalidade").notNull().default('1'), // 1 = normal, 2 = complementar, 3 = ajuste, 4 = devolução
  destinatarioId: integer("destinatario_id").references(() => customers.id).notNull(),
  valorTotal: doublePrecision("valor_total").notNull(),
  valorProdutos: doublePrecision("valor_produtos").notNull(),
  valorFrete: doublePrecision("valor_frete").default(0),
  valorSeguro: doublePrecision("valor_seguro").default(0),
  valorDesconto: doublePrecision("valor_desconto").default(0),
  valorOutrasDespesas: doublePrecision("valor_outras_despesas").default(0),
  valorICMS: doublePrecision("valor_icms").default(0),
  valorICMSST: doublePrecision("valor_icms_st").default(0),
  valorIPI: doublePrecision("valor_ipi").default(0),
  valorPIS: doublePrecision("valor_pis").default(0),
  valorCOFINS: doublePrecision("valor_cofins").default(0),
  informacoesAdicionais: text("informacoes_adicionais"),
  xmlEnvio: text("xml_envio"),
  xmlRetorno: text("xml_retorno"),
  xmlCancelamento: text("xml_cancelamento"),
  motivoCancelamento: text("motivo_cancelamento"),
  dataCancelamento: timestamp("data_cancelamento"),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  updatedAt: timestamp("updated_at"),
  pedidoId: integer("pedido_id").references(() => orders.id),
});

export const insertNFeSchema = createInsertSchema(nfes).omit({
  id: true,
  chave: true,
  createdAt: true,
  updatedAt: true,
  xmlEnvio: true,
  xmlRetorno: true,
  xmlCancelamento: true
});

export const nfeItens = pgTable("nfe_itens", {
  id: serial("id").primaryKey(),
  nfeId: integer("nfe_id").references(() => nfes.id).notNull(),
  produtoId: integer("produto_id").references(() => products.id).notNull(),
  codigo: text("codigo").notNull(),
  descricao: text("descricao").notNull(),
  ncm: text("ncm").notNull(),
  cfop: text("cfop").notNull(),
  unidade: text("unidade").notNull(),
  quantidade: doublePrecision("quantidade").notNull(),
  valorUnitario: doublePrecision("valor_unitario").notNull(),
  valorTotal: doublePrecision("valor_total").notNull(),
  valorDesconto: doublePrecision("valor_desconto").default(0),
  cstICMS: text("cst_icms"),
  baseCalculoICMS: doublePrecision("base_calculo_icms").default(0),
  aliquotaICMS: doublePrecision("aliquota_icms").default(0),
  valorICMS: doublePrecision("valor_icms").default(0),
  cstPIS: text("cst_pis"),
  baseCalculoPIS: doublePrecision("base_calculo_pis").default(0),
  aliquotaPIS: doublePrecision("aliquota_pis").default(0),
  valorPIS: doublePrecision("valor_pis").default(0),
  cstCOFINS: text("cst_cofins"),
  baseCalculoCOFINS: doublePrecision("base_calculo_cofins").default(0),
  aliquotaCOFINS: doublePrecision("aliquota_cofins").default(0),
  valorCOFINS: doublePrecision("valor_cofins").default(0),
  cstIPI: text("cst_ipi"),
  baseCalculoIPI: doublePrecision("base_calculo_ipi").default(0),
  aliquotaIPI: doublePrecision("aliquota_ipi").default(0),
  valorIPI: doublePrecision("valor_ipi").default(0),
  informacoesAdicionais: text("informacoes_adicionais"),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertNFeItemSchema = createInsertSchema(nfeItens).omit({
  id: true,
  createdAt: true
});

export const nfeEventos = pgTable("nfe_eventos", {
  id: serial("id").primaryKey(),
  nfeId: integer("nfe_id").references(() => nfes.id).notNull(),
  tipo: text("tipo").notNull(), // 'envio', 'retorno', 'cancelamento', etc.
  status: text("status").notNull(),
  mensagem: text("mensagem"),
  xml: text("xml"),
  dataEvento: timestamp("data_evento").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertNFeEventoSchema = createInsertSchema(nfeEventos).omit({
  id: true,
  createdAt: true
});

export const produtosFiscais = pgTable("produtos_fiscais", {
  id: serial("id").primaryKey(),
  produtoId: integer("produto_id").references(() => products.id).notNull(),
  ncm: text("ncm").notNull(),
  cfopPadrao: text("cfop_padrao"),
  cstICMS: text("cst_icms"),
  aliquotaICMS: doublePrecision("aliquota_icms"),
  cstPIS: text("cst_pis"),
  aliquotaPIS: doublePrecision("aliquota_pis"),
  cstCOFINS: text("cst_cofins"),
  aliquotaCOFINS: doublePrecision("aliquota_cofins"),
  cstIPI: text("cst_ipi"),
  aliquotaIPI: doublePrecision("aliquota_ipi"),
  codigoBarras: text("codigo_barras"),
  codigoAnp: text("codigo_anp"), // Para combustíveis
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at")
}, (table) => {
  return {
    produtoIdx: unique("produtos_fiscais_produto_id_unique").on(table.produtoId)
  }
});

export const insertProdutoFiscalSchema = createInsertSchema(produtosFiscais).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

// Tipos para o módulo fiscal
export type FiscalCertificate = typeof fiscalCertificates.$inferSelect;
export type InsertFiscalCertificate = z.infer<typeof insertFiscalCertificateSchema>;

export type FiscalNCM = typeof fiscalNCMs.$inferSelect;
export type InsertFiscalNCM = z.infer<typeof insertFiscalNCMSchema>;

export type FiscalCFOP = typeof fiscalCFOPs.$inferSelect;
export type InsertFiscalCFOP = z.infer<typeof insertFiscalCFOPSchema>;

export type FiscalCST = typeof fiscalCSTs.$inferSelect;
export type InsertFiscalCST = z.infer<typeof insertFiscalCSTSchema>;

export type FiscalConfig = typeof fiscalConfigs.$inferSelect;
export type InsertFiscalConfig = z.infer<typeof insertFiscalConfigSchema>;

export type NFe = typeof nfes.$inferSelect;
export type InsertNFe = z.infer<typeof insertNFeSchema>;

export type NFeItem = typeof nfeItens.$inferSelect;
export type InsertNFeItem = z.infer<typeof insertNFeItemSchema>;

export type NFeEvento = typeof nfeEventos.$inferSelect;
export type InsertNFeEvento = z.infer<typeof insertNFeEventoSchema>;

export type ProdutoFiscal = typeof produtosFiscais.$inferSelect;
export type InsertProdutoFiscal = z.infer<typeof insertProdutoFiscalSchema>;

// Support tickets (accessible to all authenticated users)
export const supportTickets = pgTable('support_tickets', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull().default('aberto'), // aberto, em_andamento, resolvido, fechado
  priority: text('priority').notNull().default('normal'), // baixa, normal, alta, urgente
  userId: integer('user_id').notNull().references(() => users.id),
  assignedTo: integer('assigned_to').references(() => users.id),
  category: text('category').notNull(), // hardware, software, acesso, outro
  resolution: text('resolution'),
  closedAt: timestamp('closed_at')
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).pick({
  title: true,
  description: true,
  status: true,
  priority: true,
  userId: true,
  assignedTo: true,
  category: true,
  resolution: true,
  closedAt: true
});

export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;

// Base de conhecimento (Knowledge Base)
export const knowledgeArticles = pgTable('knowledge_articles', {
  id: serial('id').primaryKey(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category').notNull(), // técnico, financeiro, administrativo, tutorial, etc.
  tags: text('tags'),
  createdBy: integer('created_by').references(() => users.id),
  published: boolean('published').notNull().default(true),
  views: integer('views').notNull().default(0)
});

export const insertKnowledgeArticleSchema = createInsertSchema(knowledgeArticles).pick({
  title: true,
  content: true,
  category: true,
  tags: true,
  createdBy: true,
  published: true
});

export type KnowledgeArticle = typeof knowledgeArticles.$inferSelect;
export type InsertKnowledgeArticle = z.infer<typeof insertKnowledgeArticleSchema>;

export type SystemAlert = typeof systemAlerts.$inferSelect;
export type InsertSystemAlert = z.infer<typeof insertSystemAlertSchema>;

export type SystemAuditLog = typeof systemAuditLogs.$inferSelect;
export type InsertSystemAuditLog = z.infer<typeof insertSystemAuditLogSchema>;

export type ChatAuditLog = typeof chatAuditLogs.$inferSelect;
export type InsertChatAuditLog = z.infer<typeof insertChatAuditLogSchema>;
