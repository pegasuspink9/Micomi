-- CreateTable
CREATE TABLE "PurchaseTransaction" (
    "transaction_id" TEXT NOT NULL,
    "player_id" INTEGER NOT NULL,
    "product_id" TEXT NOT NULL,
    "purchase_token" TEXT NOT NULL,
    "diamonds_added" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseTransaction_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseTransaction_purchase_token_key" ON "PurchaseTransaction"("purchase_token");

-- CreateIndex
CREATE INDEX "PurchaseTransaction_player_id_idx" ON "PurchaseTransaction"("player_id");

-- AddForeignKey
ALTER TABLE "PurchaseTransaction" ADD CONSTRAINT "PurchaseTransaction_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "Player"("player_id") ON DELETE CASCADE ON UPDATE CASCADE;
