-- AlterEnum
ALTER TYPE "ContractStatus" ADD VALUE 'CANCELADO';

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN "cancelledAt" TIMESTAMP(3);
