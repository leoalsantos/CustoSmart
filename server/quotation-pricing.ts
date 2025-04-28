import { Express } from "express";
import { storage } from "./storage";
import {
  insertQuotationSchema,
  insertQuotationItemSchema,
  insertSupplierQuotationSchema,
  insertProductPricingSchema
} from "@shared/schema";

export function setupQuotationPricingRoutes(app: Express, middlewares: any) {
  const { ensureAuthenticated, ensureAdmin, ensurePermission } = middlewares;
  // Rotas para cotações
  app.get("/api/quotations", ensurePermission('purchase'), async (req, res) => {
    try {
      const quotations = await storage.getQuotations();
      res.json(quotations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/quotations/:id", ensurePermission('purchase'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quotation = await storage.getQuotation(id);
      
      if (!quotation) {
        return res.status(404).json({ message: "Cotação não encontrada" });
      }
      
      res.json(quotation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/quotations", ensurePermission('purchase'), async (req, res) => {
    try {
      const data = insertQuotationSchema.parse(req.body);
      const newQuotation = await storage.createQuotation({
        ...data,
        status: data.status || "aberta",
        createdBy: req.user?.id || null
      });
      
      res.status(201).json(newQuotation);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/quotations/:id", ensurePermission('purchase'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quotation = await storage.getQuotation(id);
      
      if (!quotation) {
        return res.status(404).json({ message: "Cotação não encontrada" });
      }
      
      const updatedQuotation = await storage.updateQuotation(id, req.body);
      res.json(updatedQuotation);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/quotations/:id", ensurePermission('purchase'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quotation = await storage.getQuotation(id);
      
      if (!quotation) {
        return res.status(404).json({ message: "Cotação não encontrada" });
      }
      
      const success = await storage.deleteQuotation(id);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Erro ao excluir cotação" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Rotas para itens de cotação
  app.get("/api/quotations/:quotationId/items", ensurePermission('purchase'), async (req, res) => {
    try {
      const quotationId = parseInt(req.params.quotationId);
      const items = await storage.getQuotationItems(quotationId);
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/quotation-items", ensurePermission('purchase'), async (req, res) => {
    try {
      const data = insertQuotationItemSchema.parse(req.body);
      const newItem = await storage.createQuotationItem(data);
      res.status(201).json(newItem);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/quotation-items/:id", ensurePermission('purchase'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getQuotationItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Item de cotação não encontrado" });
      }
      
      const updatedItem = await storage.updateQuotationItem(id, req.body);
      res.json(updatedItem);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/quotation-items/:id", ensurePermission('purchase'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getQuotationItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Item de cotação não encontrado" });
      }
      
      const success = await storage.deleteQuotationItem(id);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Erro ao excluir item de cotação" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Rotas para cotações de fornecedores
  app.get("/api/quotation-items/:itemId/supplier-quotations", ensurePermission('purchase'), async (req, res) => {
    try {
      const itemId = parseInt(req.params.itemId);
      const supplierQuotations = await storage.getSupplierQuotations(itemId);
      res.json(supplierQuotations);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/supplier-quotations", ensurePermission('purchase'), async (req, res) => {
    try {
      const data = insertSupplierQuotationSchema.parse(req.body);
      const newQuote = await storage.createSupplierQuotation({
        ...data,
        isSelected: false
      });
      res.status(201).json(newQuote);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/supplier-quotations/:id/select", ensurePermission('purchase'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quote = await storage.getSupplierQuotation(id);
      
      if (!quote) {
        return res.status(404).json({ message: "Cotação de fornecedor não encontrada" });
      }
      
      const selectedQuote = await storage.selectBestSupplierQuotation(id);
      res.json(selectedQuote);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.patch("/api/supplier-quotations/:id", ensurePermission('purchase'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quote = await storage.getSupplierQuotation(id);
      
      if (!quote) {
        return res.status(404).json({ message: "Cotação de fornecedor não encontrada" });
      }
      
      const updatedQuote = await storage.updateSupplierQuotation(id, req.body);
      res.json(updatedQuote);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/supplier-quotations/:id", ensurePermission('purchase'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const quote = await storage.getSupplierQuotation(id);
      
      if (!quote) {
        return res.status(404).json({ message: "Cotação de fornecedor não encontrada" });
      }
      
      const success = await storage.deleteSupplierQuotation(id);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Erro ao excluir cotação de fornecedor" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Rotas para precificação de produtos
  app.get("/api/product-pricings", ensurePermission('commercial'), async (req, res) => {
    try {
      const pricings = await storage.getProductPricings();
      res.json(pricings);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/product-pricings/product/:productId", ensurePermission('commercial'), async (req, res) => {
    try {
      const productId = parseInt(req.params.productId);
      const pricing = await storage.getProductPricingByProductId(productId);
      
      if (!pricing) {
        return res.status(404).json({ message: "Precificação não encontrada para este produto" });
      }
      
      res.json(pricing);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/product-pricings/:id", ensurePermission('commercial'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pricing = await storage.getProductPricing(id);
      
      if (!pricing) {
        return res.status(404).json({ message: "Precificação não encontrada" });
      }
      
      res.json(pricing);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/product-pricings", ensurePermission('commercial'), async (req, res) => {
    try {
      const data = insertProductPricingSchema.parse(req.body);
      const newPricing = await storage.createProductPricing({
        ...data,
        createdBy: req.user?.id || null
      });
      res.status(201).json(newPricing);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/product-pricings/:id", ensurePermission('commercial'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pricing = await storage.getProductPricing(id);
      
      if (!pricing) {
        return res.status(404).json({ message: "Precificação não encontrada" });
      }
      
      const updatedPricing = await storage.updateProductPricing(id, req.body);
      res.json(updatedPricing);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/product-pricings/:id", ensurePermission('commercial'), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const pricing = await storage.getProductPricing(id);
      
      if (!pricing) {
        return res.status(404).json({ message: "Precificação não encontrada" });
      }
      
      const success = await storage.deleteProductPricing(id);
      
      if (success) {
        res.status(204).send();
      } else {
        res.status(500).json({ message: "Erro ao excluir precificação" });
      }
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
}