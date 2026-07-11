-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDENTE', 'PAGO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "CleaningStatus" AS ENUM ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('RECEBIDO', 'PROCESSADO', 'FALHA');

-- AlterTable
ALTER TABLE "Hotel" ALTER COLUMN "diferenciais" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "otaReservationId" TEXT;

-- CreateTable
CREATE TABLE "HotelIntegration" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "googlePlaceId" TEXT,
    "tripAdvisorId" TEXT,
    "whatsappToken" TEXT,
    "whatsappNumber" TEXT,
    "whatsappApiUrl" TEXT,
    "channelManagerId" TEXT,
    "bookingEngineUrl" TEXT,
    "paymentGatewayProvider" TEXT,
    "paymentGatewayToken" TEXT,
    "paymentGatewayPubKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotelIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemErrorLog" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT,
    "user_id" TEXT,
    "route" TEXT,
    "method" TEXT,
    "statusCode" INTEGER,
    "errorMessage" TEXT NOT NULL,
    "stackTrace" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemErrorLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Season" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tariff" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "minimoNoites" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tariff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "dataPagamento" TIMESTAMP(3),
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDENTE',
    "categoria" TEXT NOT NULL,
    "fornecedor" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningTask" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "responsavel_id" TEXT,
    "status" "CleaningStatus" NOT NULL DEFAULT 'PENDENTE',
    "tipoLimpeza" TEXT NOT NULL,
    "observacoes" TEXT,
    "iniciadaEm" TIMESTAMP(3),
    "finalizadaEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleaningTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "WebhookStatus" NOT NULL DEFAULT 'RECEBIDO',
    "errorReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IcalSync" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "room_id" TEXT,
    "category_id" TEXT,
    "importUrls" TEXT[],
    "exportToken" TEXT NOT NULL,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IcalSync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "maxBranches" INTEGER NOT NULL DEFAULT 1,
    "maxRooms" INTEGER NOT NULL DEFAULT 20,
    "maxUsers" INTEGER NOT NULL DEFAULT 5,
    "features" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HotelIntegration_hotel_id_key" ON "HotelIntegration"("hotel_id");

-- CreateIndex
CREATE INDEX "SystemErrorLog_hotel_id_idx" ON "SystemErrorLog"("hotel_id");

-- CreateIndex
CREATE INDEX "SystemErrorLog_user_id_idx" ON "SystemErrorLog"("user_id");

-- CreateIndex
CREATE INDEX "SystemErrorLog_createdAt_idx" ON "SystemErrorLog"("createdAt");

-- CreateIndex
CREATE INDEX "Season_hotel_id_idx" ON "Season"("hotel_id");

-- CreateIndex
CREATE INDEX "Tariff_hotel_id_idx" ON "Tariff"("hotel_id");

-- CreateIndex
CREATE INDEX "Tariff_category_id_idx" ON "Tariff"("category_id");

-- CreateIndex
CREATE INDEX "Expense_hotel_id_idx" ON "Expense"("hotel_id");

-- CreateIndex
CREATE INDEX "CleaningTask_hotel_id_idx" ON "CleaningTask"("hotel_id");

-- CreateIndex
CREATE INDEX "CleaningTask_room_id_idx" ON "CleaningTask"("room_id");

-- CreateIndex
CREATE INDEX "WebhookEvent_hotel_id_idx" ON "WebhookEvent"("hotel_id");

-- CreateIndex
CREATE UNIQUE INDEX "IcalSync_exportToken_key" ON "IcalSync"("exportToken");

-- CreateIndex
CREATE INDEX "IcalSync_hotel_id_idx" ON "IcalSync"("hotel_id");

-- CreateIndex
CREATE UNIQUE INDEX "SystemPlan_name_key" ON "SystemPlan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Reservation_hotel_id_otaReservationId_key" ON "Reservation"("hotel_id", "otaReservationId");

-- AddForeignKey
ALTER TABLE "HotelIntegration" ADD CONSTRAINT "HotelIntegration_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemErrorLog" ADD CONSTRAINT "SystemErrorLog_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemErrorLog" ADD CONSTRAINT "SystemErrorLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Season" ADD CONSTRAINT "Season_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tariff" ADD CONSTRAINT "Tariff_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tariff" ADD CONSTRAINT "Tariff_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "Season"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tariff" ADD CONSTRAINT "Tariff_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "RoomCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningTask" ADD CONSTRAINT "CleaningTask_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningTask" ADD CONSTRAINT "CleaningTask_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningTask" ADD CONSTRAINT "CleaningTask_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IcalSync" ADD CONSTRAINT "IcalSync_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IcalSync" ADD CONSTRAINT "IcalSync_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IcalSync" ADD CONSTRAINT "IcalSync_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "RoomCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

