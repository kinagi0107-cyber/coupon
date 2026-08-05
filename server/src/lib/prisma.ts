/**
 * Prisma クライアントのシングルトンインスタンス
 * 開発環境でのホットリロード時に複数インスタンスが生成されるのを防ぐ
 */

import { PrismaClient } from "@prisma/client";

// グローバル変数の型拡張（開発環境用）
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// 本番環境では新規インスタンス、開発環境ではグローバルキャッシュを使用
const prisma =
  global.__prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

export default prisma;
