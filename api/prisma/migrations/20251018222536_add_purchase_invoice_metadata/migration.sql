-- AlterTable
ALTER TABLE "purchases" ADD COLUMN     "currency" VARCHAR(10),
ADD COLUMN     "invoice_number" VARCHAR(50),
ADD COLUMN     "supplier_tax_id" VARCHAR(32),
ADD COLUMN     "total_amount" DECIMAL(10,2);
