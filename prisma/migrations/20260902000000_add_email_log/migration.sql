-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "contractId" TEXT,
    "tipo" TEXT NOT NULL,
    "destinatario" TEXT NOT NULL,
    "clienteNome" TEXT,
    "status" TEXT NOT NULL,
    "erro" TEXT,
    "messageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailLog_contractId_idx" ON "EmailLog"("contractId");

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
