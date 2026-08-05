/**
 * 管理者APIルート
 *
 * POST /api/admin/login    - 管理者ログイン（JWTトークン発行）
 * GET  /api/admin/history  - 利用履歴一覧取得（認証必須）
 * GET  /api/admin/today    - 本日の利用人数取得（認証必須）
 * GET  /api/admin/coupon   - 現在のクーポン情報取得（認証必須）
 */

import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../lib/prisma";
import { authenticateToken } from "../middleware/auth";
import { getTodayJST, toJSTDateTimeString } from "../lib/dateUtils";

const router = Router();

// ログインリクエストのバリデーションスキーマ
const loginSchema = z.object({
  username: z.string().min(1, "ユーザー名は必須です"),
  password: z.string().min(1, "パスワードは必須です"),
});

/**
 * POST /api/admin/login
 * 管理者ログイン
 * 環境変数で設定されたユーザー名・パスワードと照合し、JWTを発行する
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);

    if (!parseResult.success) {
      res
        .status(400)
        .json({ error: parseResult.error.errors[0]?.message || "入力エラー" });
      return;
    }

    const { username, password } = parseResult.data;

    // 環境変数から管理者認証情報を取得
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const jwtSecret = process.env.JWT_SECRET;

    if (!adminUsername || !adminPassword || !jwtSecret) {
      console.error("管理者認証情報または JWT_SECRET が設定されていません");
      res.status(500).json({ error: "サーバー設定エラー" });
      return;
    }

    // ユーザー名・パスワードの照合（タイミング攻撃対策として両方確認）
    const isUsernameValid = username === adminUsername;
    const isPasswordValid = password === adminPassword;

    if (!isUsernameValid || !isPasswordValid) {
      res.status(401).json({ error: "ユーザー名またはパスワードが正しくありません" });
      return;
    }

    // JWTトークンを発行（有効期限: 24時間）
    const token = jwt.sign(
      { username, role: "admin" },
      jwtSecret,
      { expiresIn: "24h" }
    );

    res.json({
      success: true,
      token,
      message: "ログインしました",
    });
  } catch (err) {
    console.error("管理者ログインエラー:", err);
    res.status(500).json({ error: "ログイン処理に失敗しました" });
  }
});

/**
 * GET /api/admin/today
 * 本日の利用人数を取得する（認証必須）
 */
router.get("/today", authenticateToken, async (_req: Request, res: Response) => {
  try {
    const today = getTodayJST();

    const count = await prisma.couponLog.count({
      where: {
        usedDate: today,
      },
    });

    res.json({ date: today, count });
  } catch (err) {
    console.error("本日利用人数取得エラー:", err);
    res.status(500).json({ error: "利用人数の取得に失敗しました" });
  }
});

/**
 * GET /api/admin/history
 * 利用履歴一覧を取得する（認証必須）
 * 最新順で返す
 */
router.get("/history", authenticateToken, async (req: Request, res: Response) => {
  try {
    // ページネーション（デフォルト: 最新100件）
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
    const offset = parseInt(req.query.offset as string) || 0;

    const [logs, total] = await Promise.all([
      prisma.couponLog.findMany({
        orderBy: { usedAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          fingerprint: true,
          couponCode: true,
          usedDate: true,
          usedAt: true,
        },
      }),
      prisma.couponLog.count(),
    ]);

    // 日時を日本時間に変換して返す
    const formattedLogs = logs.map((log) => ({
      ...log,
      usedAtFormatted: toJSTDateTimeString(log.usedAt),
    }));

    res.json({ logs: formattedLogs, total, limit, offset });
  } catch (err) {
    console.error("利用履歴取得エラー:", err);
    res.status(500).json({ error: "利用履歴の取得に失敗しました" });
  }
});

/**
 * GET /api/admin/coupon
 * 現在のクーポン情報を取得する（認証必須）
 */
router.get("/coupon", authenticateToken, async (_req: Request, res: Response) => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const couponData = require("../../shared/coupon.json");
    res.json({ coupon: couponData });
  } catch (err) {
    console.error("クーポンデータ読み込みエラー:", err);
    res.status(500).json({ error: "クーポン情報の取得に失敗しました" });
  }
});

export default router;
