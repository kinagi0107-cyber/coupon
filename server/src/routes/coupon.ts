/**
 * クーポン関連APIルート
 *
 * GET  /api/coupon         - 現在のクーポン情報を取得
 * POST /api/coupon/use     - クーポンを使用する（利用ログを保存）
 * GET  /api/coupon/status  - 端末の本日の利用状況を確認
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { getTodayJST } from "../lib/dateUtils";

const router = Router();

// クーポン使用リクエストのバリデーションスキーマ
const useSchema = z.object({
  fingerprint: z
    .string()
    .min(1, "フィンガープリントは必須です")
    .max(200, "フィンガープリントが長すぎます"),
  couponCode: z
    .string()
    .min(1, "クーポンコードは必須です")
    .max(100, "クーポンコードが長すぎます"),
});

// ステータス確認リクエストのバリデーションスキーマ
const statusSchema = z.object({
  fingerprint: z
    .string()
    .min(1, "フィンガープリントは必須です")
    .max(200, "フィンガープリントが長すぎます"),
});

/**
 * GET /api/coupon
 * 現在のクーポン情報を返す
 * クーポン内容はサーバー側の coupon.json から読み込む
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    // クーポンデータをサーバー側の共有ファイルから読み込む
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const couponData = require("../../shared/coupon.json");
    res.json({ coupon: couponData });
  } catch (err) {
    console.error("クーポンデータ読み込みエラー:", err);
    res.status(500).json({ error: "クーポン情報の取得に失敗しました" });
  }
});

/**
 * GET /api/coupon/status
 * 指定した端末（フィンガープリント）の本日の利用状況を確認する
 * クエリパラメータ: fingerprint
 */
router.get("/status", async (req: Request, res: Response) => {
  try {
    const parseResult = statusSchema.safeParse({
      fingerprint: req.query.fingerprint,
    });

    if (!parseResult.success) {
      res
        .status(400)
        .json({ error: parseResult.error.errors[0]?.message || "入力エラー" });
      return;
    }

    const { fingerprint } = parseResult.data;
    const today = getTodayJST();

    // 本日の利用ログをDBで確認（サーバー側で判定）
    const existingLog = await prisma.couponLog.findFirst({
      where: {
        fingerprint,
        usedDate: today,
      },
    });

    if (existingLog) {
      res.json({
        used: true,
        usedAt: existingLog.usedAt,
        couponCode: existingLog.couponCode,
      });
    } else {
      res.json({ used: false });
    }
  } catch (err) {
    console.error("ステータス確認エラー:", err);
    res.status(500).json({ error: "利用状況の確認に失敗しました" });
  }
});

/**
 * POST /api/coupon/use
 * クーポンを使用する
 * 同一端末・同一日の二重利用を防止する
 */
router.post("/use", async (req: Request, res: Response) => {
  try {
    const parseResult = useSchema.safeParse(req.body);

    if (!parseResult.success) {
      res
        .status(400)
        .json({ error: parseResult.error.errors[0]?.message || "入力エラー" });
      return;
    }

    const { fingerprint, couponCode } = parseResult.data;
    const today = getTodayJST();

    // 二重利用チェック（DBで判定 - Cookie/LocalStorageに依存しない）
    const existingLog = await prisma.couponLog.findFirst({
      where: {
        fingerprint,
        usedDate: today,
      },
    });

    if (existingLog) {
      // すでに本日利用済み
      res.status(409).json({
        error: "本日のクーポンは使用済みです",
        used: true,
        usedAt: existingLog.usedAt,
      });
      return;
    }

    // 利用ログをDBに保存
    const log = await prisma.couponLog.create({
      data: {
        fingerprint,
        couponCode,
        usedDate: today,
      },
    });

    res.status(201).json({
      success: true,
      message: "クーポンを使用しました",
      usedAt: log.usedAt,
    });
  } catch (err) {
    console.error("クーポン使用エラー:", err);
    res.status(500).json({ error: "クーポンの使用に失敗しました" });
  }
});

export default router;
