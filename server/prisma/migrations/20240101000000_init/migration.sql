-- CreateTable
CREATE TABLE "coupon_logs" (
    "id" SERIAL NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "couponCode" TEXT NOT NULL,
    "usedDate" TEXT NOT NULL,
    "usedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coupon_logs_fingerprint_usedDate_idx" ON "coupon_logs"("fingerprint", "usedDate");

-- CreateIndex
CREATE INDEX "coupon_logs_usedDate_idx" ON "coupon_logs"("usedDate");
