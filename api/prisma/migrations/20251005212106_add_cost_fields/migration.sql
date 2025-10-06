-- AlterTable
ALTER TABLE "ingredients" ADD COLUMN     "cost_per_unit" DECIMAL(10,4) NOT NULL DEFAULT 0,
ADD COLUMN     "total_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "total_cost" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "cost_per_serving" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "servings" INTEGER NOT NULL DEFAULT 1;
