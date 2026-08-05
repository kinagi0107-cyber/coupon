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
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// CORS設定
const allowedOrigins = process.env.CLIENT_URL
  ? [process.env.CLIENT_URL]
  : ["http://localhost:5173", "http://localhost:4173"];

app.use(
  cors({
    origin: (origin, callback) => {
      // 開発環境ではoriginなしのリクエスト（同一オリジン）も許可
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy violation"));
      }
    },
    credentials: true,
  })
);

// レートリミット: API全体に適用（15分間に100リクエストまで）
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "リクエストが多すぎます。しばらく待ってから再試行してください" },
  standardHeaders: true,
  legacyHeaders: false,
});

// クーポン使用APIには厳しいレートリミット（15分間に10リクエストまで）
const couponUseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "クーポン使用リクエストが多すぎます" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);

// ===== ボディパーサー =====
app.use(express.json({ limit: "10kb" })); // リクエストボディサイズ制限
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ===== ヘルスチェック =====
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ===== APIルート =====
app.use("/api/coupon/use", couponUseLimiter); // クーポン使用に追加レートリミット
app.use("/api/coupon", couponRouter);
app.use("/api/admin", adminRouter);

// ===== 本番環境: フロントエンドの静的ファイルを配信 =====
if (process.env.NODE_ENV === "production") {
  const clientBuildPath = path.join(__dirname, "../../client/dist");
  app.use(express.static(clientBuildPath));

  // SPAのフォールバック（React Router対応）
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientBuildPath, "index.html"));
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
