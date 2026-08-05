/**
 * JWT認証ミドルウェア
 * 管理画面APIへのアクセスを保護する
 */

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// JWT ペイロードの型定義
interface JwtPayload {
  username: string;
  role: string;
}

// Express の Request に user プロパティを追加
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * JWT トークンを検証する認証ミドルウェア
 * Authorization: Bearer <token> ヘッダーからトークンを取得する
 */
export function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer TOKEN"

  if (!token) {
    res.status(401).json({ error: "認証トークンが必要です" });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("JWT_SECRET が環境変数に設定されていません");
    res.status(500).json({ error: "サーバー設定エラー" });
    return;
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: "無効または期限切れのトークンです" });
  }
}
