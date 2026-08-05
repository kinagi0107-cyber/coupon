/**
 * 1日1回限定クーポン配布システム - バックエンドサーバー
 *
 * Express + Prisma + PostgreSQL で構成
 * Render へのデプロイを想定した設定
 */

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";

// 環境変数の読み込み（.env ファイルが存在する場合）
dotenv.config({ path: path.join(__dirname, "../../.env") });

import couponRouter from "./routes/coupon";
import adminRouter from "./routes/admin";

const app = express();
const PORT = process.env.PORT || 3001;

// ===== セキュリティミドルウェア =====

// Helmet: セキュリティ関連HTTPヘッダーを設定
// フロントエンドの読み込みを阻害しないよう、CSPは無効化または緩和する
app.use(
  helmet({
    contentSecurityPolicy: false, // テストのため一時的に無効化
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS設定
app.use(cors()); // 最も緩い設定でテスト

// レートリミット設定
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "リクエストが多すぎます。しばらく待ってから再試行してください" },
  standardHeaders: true,
  legacyHeaders: false,
});

const couponUseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "クーポン使用リクエストが多すぎます" },
  standardHeaders: true,
  legacyHeaders: false,
});

// ===== ボディパーサー =====
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ===== ヘルスチェック =====
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ===== APIルート (レートリミット適用) =====
app.use("/api", generalLimiter);
app.use("/api/coupon/use", couponUseLimiter);
app.use("/api/coupon", couponRouter);
app.use("/api/admin", adminRouter);

// ===== 本番環境: フロントエンドの静的ファイルを配信 =====
if (process.env.NODE_ENV === "production") {
  const clientBuildPath = path.join(__dirname, "../../client/dist");
  console.log(`📂 静的ファイルを配信中: ${clientBuildPath}`);
  app.use(express.static(clientBuildPath));

  // SPAのフォールバック
  app.get("*", (req, res) => {
    // APIリクエストでない場合のみindex.htmlを返す
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(clientBuildPath, "index.html"));
    } else {
      res.status(404).json({ error: "API endpoint not found" });
    }
  });
}

// ===== エラーハンドラー =====
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("未処理エラー:", err.message);
    res.status(500).json({ error: "サーバーエラーが発生しました" });
  }
);

// ===== サーバー起動 =====
app.listen(PORT, () => {
  console.log(`✅ サーバーが起動しました: http://localhost:${PORT}`);
  console.log(`   環境: ${process.env.NODE_ENV || "development"}`);
});

export default app;
