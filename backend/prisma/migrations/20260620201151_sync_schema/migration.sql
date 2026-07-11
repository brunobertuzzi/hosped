/*
  Warnings:

  - Added the required column `hotel_id` to the `Consumption` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hotel_id` to the `InventoryMovement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hotel_id` to the `MaintenanceOrder` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Consumption" ADD COLUMN     "hotel_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Hotel" ADD COLUMN     "mrr" DOUBLE PRECISION NOT NULL DEFAULT 150.0,
ADD COLUMN     "nextBillingDate" TIMESTAMP(3),
ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'STARTUP',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "InventoryMovement" ADD COLUMN     "hotel_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "MaintenanceOrder" ADD COLUMN     "hotel_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Consumption_hotel_id_idx" ON "Consumption"("hotel_id");

-- CreateIndex
CREATE INDEX "InventoryMovement_hotel_id_idx" ON "InventoryMovement"("hotel_id");

-- CreateIndex
CREATE INDEX "MaintenanceOrder_hotel_id_idx" ON "MaintenanceOrder"("hotel_id");

-- CreateIndex
CREATE INDEX "MaintenanceOrder_status_room_id_idx" ON "MaintenanceOrder"("status", "room_id");

-- CreateIndex
CREATE INDEX "Reservation_branch_id_category_id_status_dataCheckIn_dataCh_idx" ON "Reservation"("branch_id", "category_id", "status", "dataCheckIn", "dataCheckOut");

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consumption" ADD CONSTRAINT "Consumption_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceOrder" ADD CONSTRAINT "MaintenanceOrder_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
