/**
 * APIクライアント
 * バックエンドAPIとの通信を担当する
 */

import axios from "axios";

// 環境変数からAPIのベースURLを取得（本番: 同一オリジン、開発: localhost:3001）
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// Axiosインスタンスの作成
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// リクエストインターセプター: JWTトークンを自動付与
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// レスポンスインターセプター: 認証エラー時にログアウト
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith("/admin") && currentPath !== "/admin/login") {
        localStorage.removeItem("admin_token");
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  }
);

// ===== 型定義 =====

/** クーポン1件の型（ユーザー向け） */
export interface CouponData {
  id: string;
  type: "public" | "code";
  title: string;
  code: string;
  description: string;
  expires: string;
  maxUses?: number | null;
}

/** 管理者向けクーポン（警告情報付き） */
export interface AdminCouponData extends CouponData {
  secretCode?: string;
  isExpired: boolean;
  isLimitReached: boolean;
  useCount: number | null;
  warnings: string[];
}

/** 全クーポンの利用状況マップ { couponCode: usedAt } */
export interface CouponStatusMapResponse {
  usedMap: Record<string, string>;
}

/** クーポン使用レスポンス */
export interface UseResponse {
  success: boolean;
  message: string;
  usedAt: string;
}

/** コード検証レスポンス */
export interface VerifyCodeResponse {
  coupon: CouponData;
  alreadyUsed: boolean;
  usedAt: string | null;
}

/** 管理者ログインレスポンス */
export interface LoginResponse {
  success: boolean;
  token: string;
  message: string;
}

/** 本日の利用人数レスポンス */
export interface TodayResponse {
  date: string;
  count: number;
  breakdown: Array<{
    couponCode: string;
    couponTitle: string;
    count: number;
  }>;
}

/** 利用履歴1件 */
export interface HistoryLog {
  id: number;
  fingerprint: string;
  couponCode: string;
  couponTitle: string;
  usedDate: string;
  usedAt: string;
  usedAtFormatted: string;
}

/** 利用履歴レスポンス */
export interface HistoryResponse {
  logs: HistoryLog[];
  total: number;
  limit: number;
  offset: number;
}

// ===== クーポンAPI =====

/**
 * 通常配布クーポン一覧を取得する（有効期限内のみ）
 */
export const getCoupons = async (): Promise<CouponData[]> => {
  const res = await api.get<{ coupons: CouponData[] }>("/coupon");
  return res.data.coupons;
};

/**
 * 端末の本日の全クーポン利用状況を取得する
 * @returns usedMap: { couponCode: usedAt } 形式
 */
export const getCouponStatusMap = async (
  fingerprint: string
): Promise<Record<string, string>> => {
  const res = await api.get<CouponStatusMapResponse>("/coupon/status", {
    params: { fingerprint },
  });
  return res.data.usedMap;
};

/**
 * シークレットコードを検証してコード入力クーポンを取得する
 */
export const verifySecretCode = async (
  secretCode: string,
  fingerprint: string
): Promise<VerifyCodeResponse> => {
  const res = await api.post<VerifyCodeResponse>("/coupon/verify-code", {
    secretCode,
    fingerprint,
  });
  return res.data;
};

/**
 * クーポンを使用する
 */
export const useCoupon = async (
  fingerprint: string,
  couponCode: string,
  couponTitle: string
): Promise<UseResponse> => {
  const res = await api.post<UseResponse>("/coupon/use", {
    fingerprint,
    couponCode,
    couponTitle,
  });
  return res.data;
};

// ===== 管理者API =====

/** 管理者ログイン */
export const adminLogin = async (
  username: string,
  password: string
): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>("/admin/login", {
    username,
    password,
  });
  return res.data;
};

/** 本日の利用人数を取得する */
export const getTodayCount = async (): Promise<TodayResponse> => {
  const res = await api.get<TodayResponse>("/admin/today");
  return res.data;
};

/** 利用履歴を取得する */
export const getHistory = async (
  limit = 100,
  offset = 0
): Promise<HistoryResponse> => {
  const res = await api.get<HistoryResponse>("/admin/history", {
    params: { limit, offset },
  });
  return res.data;
};

/** 管理者用クーポン一覧を取得する（警告情報付き） */
export const getAdminCoupons = async (): Promise<AdminCouponData[]> => {
  const res = await api.get<{ coupons: AdminCouponData[] }>("/admin/coupons");
  return res.data.coupons;
};

export default api;
