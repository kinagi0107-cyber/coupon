/**
 * ユーザー向けクーポン表示ページ
 *
 * - サイトへアクセスすると本日のクーポンを表示
 * - 「クーポンを使用する」ボタンで利用ログをDBに保存
 * - 使用済みの場合は必ずサーバー側DBで確認してモーダルを表示
 */

import { useState, useEffect, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import { coupon } from "../data/coupon";
import { getCouponStatus, useCoupon } from "../lib/api";
import { useFingerprint } from "../hooks/useFingerprint";

type PageState = "loading" | "available" | "used" | "error";

export default function CouponPage() {
  const { fingerprint, loading: fpLoading, error: fpError } = useFingerprint();
  const [pageState, setPageState] = useState<PageState>("loading");
  const [usedAt, setUsedAt] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // フィンガープリント取得後にサーバー側で利用状況を確認
  const checkStatus = useCallback(async () => {
    if (!fingerprint) return;

    try {
      setPageState("loading");
      // サーバー側DBで判定（Cookie/LocalStorageに依存しない）
      const status = await getCouponStatus(fingerprint);

      if (status.used) {
        setUsedAt(
          status.usedAt
            ? new Date(status.usedAt).toLocaleString("ja-JP", {
                timeZone: "Asia/Tokyo",
              })
            : null
        );
        setPageState("used");
        setShowModal(true);
      } else {
        setPageState("available");
      }
    } catch (err) {
      console.error("利用状況確認エラー:", err);
      setPageState("error");
    }
  }, [fingerprint]);

  useEffect(() => {
    if (!fpLoading && fingerprint) {
      checkStatus();
    } else if (!fpLoading && fpError) {
      setPageState("error");
    }
  }, [fpLoading, fingerprint, fpError, checkStatus]);

  // クーポン使用処理
  const handleUseCoupon = async () => {
    if (!fingerprint || isProcessing) return;

    setIsProcessing(true);
    try {
      const result = await useCoupon(fingerprint, coupon.code);
      setUsedAt(
        new Date(result.usedAt).toLocaleString("ja-JP", {
          timeZone: "Asia/Tokyo",
        })
      );
      setPageState("used");
      setShowModal(true);
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { error?: string } } };
      if (error.response?.status === 409) {
        // 二重利用（別タブ等）
        setPageState("used");
        setShowModal(true);
        toast.error("このクーポンはすでに使用済みです");
      } else {
        toast.error("クーポンの使用に失敗しました。再度お試しください。");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 利用期限チェック
  const isExpired = () => {
    const today = new Date().toISOString().split("T")[0];
    return coupon.expires < today;
  };

  return (
    <div className="coupon-page">
      <Toaster position="top-center" />

      {/* ヘッダー */}
      <header className="page-header">
        <h1 className="site-title">本日のクーポン</h1>
      </header>

      <main className="page-main">
        {/* ローディング */}
        {pageState === "loading" && (
          <div className="loading-container">
            <div className="spinner" />
            <p>クーポン情報を確認中...</p>
          </div>
        )}

        {/* エラー */}
        {pageState === "error" && (
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <p className="error-message">
              クーポン情報の取得に失敗しました。
              <br />
              ページを再読み込みしてください。
            </p>
            <button
              className="btn btn-secondary"
              onClick={() => window.location.reload()}
            >
              再読み込み
            </button>
          </div>
        )}

        {/* クーポン表示（利用可能） */}
        {pageState === "available" && (
          <div className="coupon-card">
            {isExpired() ? (
              <div className="expired-badge">期限切れ</div>
            ) : (
              <div className="available-badge">本日利用可能</div>
            )}

            <div className="coupon-content">
              <h2 className="coupon-title">{coupon.title}</h2>
              <div className="coupon-code-box">
                <span className="coupon-code-label">クーポンコード</span>
                <span className="coupon-code">{coupon.code}</span>
              </div>
              <p className="coupon-description">{coupon.description}</p>
              {coupon.note && (
                <p className="coupon-note">{coupon.note}</p>
              )}
              <p className="coupon-expires">
                利用期限: {coupon.expires}
              </p>
            </div>

            <div className="coupon-action">
              {isExpired() ? (
                <button className="btn btn-disabled" disabled>
                  このクーポンは期限切れです
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={handleUseCoupon}
                  disabled={isProcessing}
                >
                  {isProcessing ? "処理中..." : "クーポンを使用する"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* 使用済み表示 */}
        {pageState === "used" && !showModal && (
          <div className="used-container">
            <div className="used-icon">✓</div>
            <p className="used-message">本日のクーポンは使用済みです。</p>
            {usedAt && (
              <p className="used-time">使用日時: {usedAt}</p>
            )}
          </div>
        )}
      </main>

      {/* 使用済みモーダル */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-icon">✓</div>
            <h2 className="modal-title">本日のクーポンは使用済みです。</h2>
            {usedAt && (
              <p className="modal-time">使用日時: {usedAt}</p>
            )}
            <p className="modal-message">
              明日また新しいクーポンをご利用いただけます。
              <br />
              またのご来店をお待ちしております。
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(false)}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
