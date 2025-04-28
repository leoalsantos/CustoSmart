import { Express, Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { db, pool } from "../db";

// Validação para a simulação de preços
const simulationSchema = z.object({
  productId: z.number(),
  quantity: z.number().positive(),
  includeFixedCosts: z.boolean().optional().default(true),
  includeLabor: z.boolean().optional().default(true),
  includeOverhead: z.boolean().optional().default(true)
});

type SimulationResult = {
  productId: number;
  productName: string;
  quantity: number;
  materialCost: number;
  laborCost: number;
  fixedCost: number;
  overheadCost: number;
  unitCost: number;
  totalCost: number;
  suggestedPrice: number;
  materials: Array<{
    id: number;
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }>;
};

/**
 * Configuração das rotas para simulação de precificação de produtos
 */
export function setupPricingSimulationRoutes(app: Express, middlewares: any) {
  const { ensureAuthenticated, ensurePermission } = middlewares;
  
  /**
   * Rota para obter detalhes de custo para um produto específico
   */
  app.get("/api/product-costs/:id", ensurePermission('commercial'), async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      
      // Buscar produto
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      
      // Buscar precificação existente
      const pricing = await storage.getProductPricingByProductId(productId);
      
      // Buscar fórmula do produto
      const productFormulas = await storage.getProductFormulas(productId);
      
      // Analisar custos dos materiais
      const breakdown: Array<{
        materialId: number;
        materialName: string;
        quantity: number;
        unit: string;
        unitCost: number;
        totalCost: number;
      }> = [];
      
      let totalMaterialCost = 0;
      
      if (productFormulas && productFormulas.length > 0) {
        for (const formula of productFormulas) {
          const material = await storage.getRawMaterial(formula.materialId);
          
          if (material) {
            const unitCost = material.price || 0;
            const totalCost = unitCost * formula.quantity;
            totalMaterialCost += totalCost;
            
            breakdown.push({
              materialId: formula.materialId,
              materialName: material.name,
              quantity: formula.quantity,
              unit: formula.unit,
              unitCost,
              totalCost
            });
          }
        }
      }
      
      // Usar valores da precificação ou valores padrão
      const laborCost = pricing?.laborCost || 0;
      const overheadCost = pricing?.overheadCost || 0;
      const freightCost = pricing?.freightCost || 0;
      const taxes = pricing?.taxes || 0;
      const profitMargin = pricing?.margin || 30; // Margem padrão de 30%
      
      // Calcular custo total
      const totalProductionCost = totalMaterialCost + laborCost + overheadCost;
      const totalCost = totalProductionCost + freightCost + taxes;
      
      // Calcular preço sugerido
      const suggestedPrice = totalCost * (1 + (profitMargin / 100));
      
      // Retornar análise de custo
      res.json({
        productId,
        productName: product.name,
        materialCost: totalMaterialCost,
        laborCost,
        overhead: overheadCost,
        totalProductionCost,
        freightCost,
        taxes,
        profitMargin,
        suggestedPrice,
        totalCost,
        breakdown
      });
    } catch (error: any) {
      console.error("Erro ao calcular custos do produto:", error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Rota para simular o preço de um produto com base nas cotações selecionadas
   */
  app.post("/api/product-pricing/simulate", ensurePermission('commercial'), async (req: Request, res: Response) => {
    try {
      const data = simulationSchema.parse(req.body);
      const { 
        productId, 
        quantity, 
        includeFixedCosts = true, 
        includeLabor = true, 
        includeOverhead = true 
      } = data;

      // Buscar dados do produto
      const product = await storage.getProduct(productId);
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }

      // Buscar a fórmula do produto
      const productFormulas = await storage.getProductFormulas(productId);
      
      if (!productFormulas || productFormulas.length === 0) {
        return res.status(400).json({ 
          message: "Produto não possui fórmula definida para cálculo de custo" 
        });
      }

      // Inicializar os resultados da simulação
      const simulationResult: SimulationResult = {
        productId,
        productName: product.name,
        quantity,
        materialCost: 0,
        laborCost: 0,
        fixedCost: 0,
        overheadCost: 0,
        unitCost: 0,
        totalCost: 0,
        suggestedPrice: 0,
        materials: []
      };

      // Calcular custo de materiais
      let totalMaterialCost = 0;
      
      for (const formula of productFormulas) {
        const material = await storage.getRawMaterial(formula.materialId);
        
        if (material) {
          const materialQuantity = formula.quantity * quantity;
          const materialUnitPrice = material.price || 0;
          const materialTotalPrice = materialUnitPrice * materialQuantity;
          
          totalMaterialCost += materialTotalPrice;
          
          simulationResult.materials.push({
            id: material.id,
            name: material.name,
            quantity: materialQuantity,
            unit: material.unit,
            unitPrice: materialUnitPrice,
            totalPrice: materialTotalPrice
          });
        }
      }
      
      simulationResult.materialCost = totalMaterialCost / quantity; // Custo por unidade

      // Buscar precificação existente ou usar valores padrão
      const pricing = await storage.getProductPricingByProductId(productId);
      
      // Adicionar outros custos se solicitado
      if (includeLabor) {
        simulationResult.laborCost = pricing ? pricing.laborCost : 0;
      }
      
      if (includeFixedCosts) {
        simulationResult.fixedCost = 0; // Será implementado conforme a lógica de negócio
      }
      
      if (includeOverhead) {
        simulationResult.overheadCost = pricing ? pricing.overheadCost : 0;
      }
      
      // Calcular custo total por unidade
      simulationResult.unitCost = 
        simulationResult.materialCost + 
        simulationResult.laborCost + 
        simulationResult.fixedCost + 
        simulationResult.overheadCost;
      
      // Calcular custo total da produção
      simulationResult.totalCost = simulationResult.unitCost * quantity;
      
      // Calcular preço sugerido (usando margem padrão de 30% se não houver precificação)
      const margin = pricing ? pricing.margin : 30; // Margem padrão de 30%
      simulationResult.suggestedPrice = simulationResult.unitCost * (1 + (margin / 100));
      
      res.json(simulationResult);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Rota para atualizar a precificação do produto com base no cálculo de custos
   */
  app.post("/api/product-pricing/update/:id", ensurePermission('commercial'), async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      
      if (isNaN(productId)) {
        return res.status(400).json({ message: "ID de produto inválido" });
      }
      
      // Buscar o produto
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      
      // Buscar as fórmulas do produto
      const productFormulas = await storage.getProductFormulas(productId);
      
      // Calcular o custo de material
      let totalMaterialCost = 0;
      const materialDetails = [];
      
      if (productFormulas && productFormulas.length > 0) {
        for (const formula of productFormulas) {
          const material = await storage.getRawMaterial(formula.materialId);
          
          if (material) {
            const unitCost = material.price || 0;
            const totalCost = unitCost * formula.quantity;
            totalMaterialCost += totalCost;
            
            materialDetails.push({
              id: material.id,
              name: material.name,
              quantity: formula.quantity,
              unit: material.unit,
              unitPrice: material.price,
              totalPrice: totalCost
            });
          }
        }
      }
      
      // Verificar qual tabela existe no banco de dados
      const tableCheckResult = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'product_pricing'
        ) AS "product_pricing_exists",
        EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'product_pricings'
        ) AS "product_pricings_exists"
      `);
      
      const { product_pricing_exists, product_pricings_exists } = tableCheckResult.rows[0];
      
      // Determinar qual tabela utilizar
      const tableName = product_pricing_exists ? 'product_pricing' : 'product_pricings';
      console.log(`Usando tabela: ${tableName}`);
      
      // Verificar se a tabela tem colunas extras (freight_cost, taxes)
      const columnsResult = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [tableName]);
      
      const columns = columnsResult.rows.map(row => row.column_name);
      const hasFreightCost = columns.includes('freight_cost');
      const hasTaxes = columns.includes('taxes');
      
      // Buscar precificação existente
      const existingPricingResult = await pool.query(
        `SELECT * FROM ${tableName} WHERE product_id = $1`, 
        [productId]
      );
      
      let pricing = existingPricingResult.rows[0];
      
      if (!pricing) {
        // Criar nova precificação
        const insertColumns = [
          'product_id', 
          'raw_material_cost', 
          'labor_cost', 
          'overhead_cost', 
          'total_cost', 
          'margin', 
          'suggested_price', 
          'calculation_date', 
          'created_by'
        ];
        
        const values = [
          productId, 
          totalMaterialCost, 
          0, 
          0, 
          totalMaterialCost, 
          30, 
          totalMaterialCost * 1.3, 
          new Date().toISOString().split('T')[0],
          req.user!.id
        ];
        
        // Adicionar colunas extras se existirem
        if (hasFreightCost) {
          insertColumns.push('freight_cost');
          values.push(0);
        }
        
        if (hasTaxes) {
          insertColumns.push('taxes');
          values.push(0);
        }
        
        // Construir placeholders
        const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
        
        // Executar a inserção
        const insertQuery = `
          INSERT INTO ${tableName} (${insertColumns.join(', ')})
          VALUES (${placeholders})
          RETURNING *
        `;
        
        const result = await pool.query(insertQuery, values);
        pricing = result.rows[0];
      } else {
        // Construir a query de atualização considerando colunas extras
        let updateQuery = `
          UPDATE ${tableName}
          SET raw_material_cost = $1,
              total_cost = $1 + labor_cost + overhead_cost
        `;
        
        // Adicionar colunas extras na soma se existirem
        if (hasFreightCost) {
          updateQuery += ` + COALESCE(freight_cost, 0)`;
        }
        
        if (hasTaxes) {
          updateQuery += ` + COALESCE(taxes, 0)`;
        }
        
        // Continuar com o preço sugerido
        updateQuery += `,
          suggested_price = ($1 + labor_cost + overhead_cost
        `;
        
        if (hasFreightCost) {
          updateQuery += ` + COALESCE(freight_cost, 0)`;
        }
        
        if (hasTaxes) {
          updateQuery += ` + COALESCE(taxes, 0)`;
        }
        
        updateQuery += `) * (1 + margin/100),
          calculation_date = $2
        WHERE product_id = $3
        RETURNING *`;
        
        const result = await pool.query(updateQuery, [
          totalMaterialCost,
          new Date().toISOString().split('T')[0],
          productId
        ]);
        
        pricing = result.rows[0];
      }
      
      // Atualizar o produto também
      if (pricing) {
        // Obter valores seguros para atualização
        const totalCost = pricing.total_cost !== undefined ? pricing.total_cost : 
                      (pricing.totalCost !== undefined ? pricing.totalCost : totalMaterialCost);
        
        const suggestedPrice = pricing.suggested_price !== undefined ? pricing.suggested_price : 
                            (pricing.suggestedPrice !== undefined ? pricing.suggestedPrice : totalMaterialCost * 1.3);
        
        // Validar se os valores são números válidos
        const validTotalCost = Number.isFinite(totalCost) ? totalCost : totalMaterialCost;
        const validSuggestedPrice = Number.isFinite(suggestedPrice) ? suggestedPrice : totalMaterialCost * 1.3;
        
        // Atualizar o produto diretamente com SQL para evitar problemas com valores NaN
        await pool.query(
          `UPDATE products 
          SET unit_cost = $1, selling_price = $2 
          WHERE id = $3`,
          [validTotalCost, validSuggestedPrice, productId]
        );
      }
      
      res.json({
        message: "Precificação atualizada com sucesso",
        pricing,
        materials: materialDetails,
        totalMaterialCost
      });
      
    } catch (error: any) {
      console.error("Erro ao atualizar precificação:", error);
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Rota para aplicar os preços de cotação aos preços das matérias-primas
   */
  app.post("/api/quotations/:id/apply-prices", ensurePermission('purchase'), async (req: Request, res: Response) => {
    try {
      const quotationId = parseInt(req.params.id);
      const quotation = await storage.getQuotation(quotationId);
      
      if (!quotation) {
        return res.status(404).json({ message: "Cotação não encontrada" });
      }
      
      // Verificar se a cotação já está fechada
      if (quotation.status !== 'closed') {
        return res.status(400).json({ 
          message: "Apenas cotações fechadas podem ter seus preços aplicados" 
        });
      }
      
      // Buscar itens de cotação
      const items = await storage.getQuotationItems(quotationId);
      
      if (!items || items.length === 0) {
        return res.status(400).json({ message: "Cotação não possui itens" });
      }
      
      // Para cada item, buscar a cotação de fornecedor selecionada
      const updatedMaterials = [];
      
      for (const item of items) {
        const supplierQuotations = await storage.getSupplierQuotations(item.id);
        const selectedQuotation = supplierQuotations.find(sq => sq.isSelected);
        
        if (selectedQuotation) {
          const material = await storage.getRawMaterial(item.materialId);
          
          if (material) {
            // Atualizar o preço da matéria-prima
            const updatedMaterial = await storage.updateRawMaterial(item.materialId, {
              price: selectedQuotation.unitPrice
            });
            
            updatedMaterials.push({
              id: material.id,
              name: material.name,
              oldPrice: material.price,
              newPrice: selectedQuotation.unitPrice
            });
          }
        }
      }
      
      res.json({
        message: `Preços atualizados para ${updatedMaterials.length} matérias-primas`,
        materials: updatedMaterials
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  /**
   * Rota para recalcular o preço base de um produto com base nos preços atuais de matérias-primas
   */
  app.post("/api/products/:id/recalculate-price", ensurePermission('commercial'), async (req: Request, res: Response) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProduct(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Produto não encontrado" });
      }
      
      // Buscar a fórmula do produto
      const productFormulas = await storage.getProductFormulas(productId);
      
      if (!productFormulas || productFormulas.length === 0) {
        return res.status(400).json({ 
          message: "Produto não possui fórmula definida para cálculo de custo" 
        });
      }
      
      // Calcular custo de materiais
      let totalMaterialCost = 0;
      const materialDetails = [];
      
      for (const formula of productFormulas) {
        const material = await storage.getRawMaterial(formula.materialId);
        
        if (material) {
          const materialCost = (material.price || 0) * formula.quantity;
          totalMaterialCost += materialCost;
          
          materialDetails.push({
            id: material.id,
            name: material.name,
            quantity: formula.quantity,
            unit: material.unit,
            unitPrice: material.price,
            totalPrice: materialCost
          });
        }
      }
      
      // Verificar qual tabela existe no banco de dados
      const tableCheckResult = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'product_pricing'
        ) AS "product_pricing_exists",
        EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'product_pricings'
        ) AS "product_pricings_exists"
      `);
      
      const { product_pricing_exists, product_pricings_exists } = tableCheckResult.rows[0];
      
      // Determinar qual tabela utilizar
      const tableName = product_pricing_exists ? 'product_pricing' : 'product_pricings';
      console.log(`Usando tabela: ${tableName}`);
      
      // Verificar se a tabela tem colunas extras (freight_cost, taxes)
      const columnsResult = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1
      `, [tableName]);
      
      const columns = columnsResult.rows.map(row => row.column_name);
      const hasFreightCost = columns.includes('freight_cost');
      const hasTaxes = columns.includes('taxes');
      
      // Buscar precificação existente
      const existingPricingResult = await pool.query(
        `SELECT * FROM ${tableName} WHERE product_id = $1`, 
        [productId]
      );
      
      let pricing = existingPricingResult.rows[0];
      
      if (!pricing) {
        // Criar nova precificação
        const insertColumns = [
          'product_id', 
          'raw_material_cost', 
          'labor_cost', 
          'overhead_cost', 
          'total_cost', 
          'margin', 
          'suggested_price', 
          'calculation_date', 
          'created_by'
        ];
        
        const values = [
          productId, 
          totalMaterialCost, 
          0, 
          0, 
          totalMaterialCost, 
          30, 
          totalMaterialCost * 1.3, 
          new Date().toISOString().split('T')[0],
          req.user!.id
        ];
        
        // Adicionar colunas extras se existirem
        if (hasFreightCost) {
          insertColumns.push('freight_cost');
          values.push(0);
        }
        
        if (hasTaxes) {
          insertColumns.push('taxes');
          values.push(0);
        }
        
        // Construir placeholders
        const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
        
        // Executar a inserção
        const insertQuery = `
          INSERT INTO ${tableName} (${insertColumns.join(', ')})
          VALUES (${placeholders})
          RETURNING *
        `;
        
        const result = await pool.query(insertQuery, values);
        pricing = result.rows[0];
      } else {
        // Construir a query de atualização considerando colunas extras
        let updateQuery = `
          UPDATE ${tableName}
          SET raw_material_cost = $1,
              total_cost = $1 + labor_cost + overhead_cost
        `;
        
        // Adicionar colunas extras na soma se existirem
        if (hasFreightCost) {
          updateQuery += ` + COALESCE(freight_cost, 0)`;
        }
        
        if (hasTaxes) {
          updateQuery += ` + COALESCE(taxes, 0)`;
        }
        
        // Continuar com o preço sugerido
        updateQuery += `,
          suggested_price = ($1 + labor_cost + overhead_cost
        `;
        
        if (hasFreightCost) {
          updateQuery += ` + COALESCE(freight_cost, 0)`;
        }
        
        if (hasTaxes) {
          updateQuery += ` + COALESCE(taxes, 0)`;
        }
        
        updateQuery += `) * (1 + margin/100),
          calculation_date = $2
        WHERE product_id = $3
        RETURNING *`;
        
        const result = await pool.query(updateQuery, [
          totalMaterialCost,
          new Date().toISOString().split('T')[0],
          productId
        ]);
        
        pricing = result.rows[0];
      }
      
      // Obter total_cost e suggested_price da precificação
      // Os nomes dos campos podem variar dependendo do banco
      const totalCost = pricing.total_cost !== undefined ? pricing.total_cost : 
                      (pricing.totalCost !== undefined ? pricing.totalCost : totalMaterialCost);
      
      const suggestedPrice = pricing.suggested_price !== undefined ? pricing.suggested_price : 
                           (pricing.suggestedPrice !== undefined ? pricing.suggestedPrice : totalMaterialCost * 1.3);
      
      console.log('Pricing:', pricing);
      console.log('Valores para atualização do produto:');
      console.log('- Total Cost:', totalCost);
      console.log('- Suggested Price:', suggestedPrice);
      
      // Validar se os valores são números válidos
      const validTotalCost = Number.isFinite(totalCost) ? totalCost : totalMaterialCost;
      const validSuggestedPrice = Number.isFinite(suggestedPrice) ? suggestedPrice : totalMaterialCost * 1.3;
      
      console.log('Valores validados para atualização:');
      console.log('- Valid Total Cost:', validTotalCost);
      console.log('- Valid Suggested Price:', validSuggestedPrice);
      
      // Atualizar o produto
      let updatedProduct;
      try {
        // Em vez de usar o ORM, vamos executar SQL direto para garantir que os valores sejam definidos corretamente
        const updateResult = await pool.query(
          `UPDATE products 
           SET unit_cost = $1, selling_price = $2 
           WHERE id = $3 
           RETURNING *`,
          [validTotalCost, validSuggestedPrice, productId]
        );
        
        updatedProduct = updateResult.rows[0];
        console.log('Produto após atualização via SQL:', updatedProduct);
      } catch (updateError) {
        console.error('Erro ao atualizar produto:', updateError);
      }
      
      // Buscar o produto novamente para verificar as mudanças
      const productAfter = await storage.getProduct(productId);
      console.log('Produto após busca do banco:', productAfter);
      
      res.json({
        message: "Preço recalculado com sucesso",
        product: productAfter || updatedProduct,
        pricing,
        materials: materialDetails,
        totalMaterialCost
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
}