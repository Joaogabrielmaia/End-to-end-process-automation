-- Rede de seguranca (ADR-002): o banco nunca aceita estoque ou credito inconsistentes.
ALTER TABLE "Product" ADD CONSTRAINT "Product_stock_nonnegative" CHECK ("stock" >= 0);
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_credit_nonnegative" CHECK ("creditUsed" >= 0 AND "creditLimit" >= 0);
