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
      // 管理画面のトークンが無効な場合はクリア
      const currentPath = window.location.pathname;
      if (currentPath.startsWith("/admin") && currentPath !== "/admin/login") {
        localStorage.removeItem("admin_token");
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(error);
  }
);

// ===== クーポンAPI =====

export interface CouponData {
  title: string;
  code: string;
  description: string;
  expires: string;
  note?: string;
}

export interface CouponStatusResponse {
  used: boolean;
  usedAt?: string;
  couponCode?: string;
}

export interface UseResponse {
  success: boolean;
  message: string;
  usedAt: string;
}

/** 現在のクーポン情報を取得する */
export const getCoupon = async (): Promise<CouponData> => {
  const res = await api.get<{ coupon: CouponData }>("/coupon");
  return res.data.coupon;
};

/** 端末の本日の利用状況を確認する */
export const getCouponStatus = async (
  fingerprint: string
): Promise<CouponStatusResponse> => {
  const res = await api.get<CouponStatusResponse>("/coupon/status", {
    params: { fingerprint },
  });
  return res.data;
};

/** クーポンを使用する */
export const useCoupon = async (
  fingerprint: string,
  couponCode: string
): Promise<UseResponse> => {
  const res = await api.post<UseResponse>("/coupon/use", {
    fingerprint,
    couponCode,
  });
  return res.data;
};

// ===== 管理者API =====

export interface LoginResponse {
  success: boolean;
  token: string;
  message: string;
}

export interface TodayResponse {
  date: string;
  count: number;
}

export interface HistoryLog {
  id: number;
  fingerprint: string;
  couponCode: string;
  usedDate: string;
  usedAt: string;
  usedAtFormatted: string;
}

export interface HistoryResponse {
  logs: HistoryLog[];
  total: number;
  limit: number;
  offset: number;
}

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

/** 管理者用クーポン情報を取得する */
export const getAdminCoupon = async (): Promise<CouponData> => {
  const res = await api.get<{ coupon: CouponData }>("/admin/coupon");
  return res.data.coupon;
};

export default api;
