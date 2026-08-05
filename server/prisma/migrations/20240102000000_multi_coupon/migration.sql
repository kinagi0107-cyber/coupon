-- 複数クーポン対応マイグレーション
-- coupon_logs テーブルに couponTitle カラムを追加
-- code_use_counts テーブルを新規作成
-- フィンガープリント+クーポンコード+日付のユニーク制約を追加

-- couponTitle カラムを追加（既存レコードは空文字）
ALTER TABLE "coupon_logs" ADD COLUMN IF NOT EXISTS "couponTitle" TEXT NOT NULL DEFAULT '';

-- フィンガープリント+クーポンコード+日付のユニーク制約を追加
-- （既存のデータが重複している場合はスキップ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'coupon_logs_fingerprint_couponCode_usedDate_key'
  ) THEN
    ALTER TABLE "coupon_logs"
      ADD CONSTRAINT "coupon_logs_fingerprint_couponCode_usedDate_key"
      UNIQUE ("fingerprint", "couponCode", "usedDate");
  END IF;
END $$;

-- couponCode インデックスを追加
CREATE INDEX IF NOT EXISTS "coupon_logs_couponCode_idx" ON "coupon_logs"("couponCode");

-- code_use_counts テーブルを新規作成
CREATE TABLE IF NOT EXISTS "code_use_counts" (
  "id"         SERIAL PRIMARY KEY,
  "couponCode" TEXT NOT NULL UNIQUE,
  "useCount"   INTEGER NOT NULL DEFAULT 0,
  "updatedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
