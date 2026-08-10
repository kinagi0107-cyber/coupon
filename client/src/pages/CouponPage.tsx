/**
 * ユーザー向けクーポン表示ページ
 *
 * - 通常配布クーポンを複数カード形式で表示
 * - クーポン単位で1日1回の使用済み判定（DBで確認）
 * - 「クーポンコードをお持ちの方はこちら」ボタンでコード入力欄を展開
 * - シークレットコード入力で隠れたクーポンを取得
 */

import { useState, useEffect, useCallback } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  getCoupons,
  getCouponStatusMap,
  verifySecretCode,
  useCoupon,
  type CouponData,
  type VerifyCodeResponse,
} from "../lib/api";
import { useFingerprint } from "../hooks/useFingerprint";

type PageState = "loading" | "ready" | "error";

/** 使用済みモーダルの情報 */
interface UsedModalInfo {
  couponTitle: string;
  usedAt: string;
}

export default function CouponPage() {
  const { fingerprint, loading: fpLoading, error: fpError } = useFingerprint();

  // ページ全体の状態
  const [pageState, setPageState] = useState<PageState>("loading");

  // 通常配布クーポン一覧
  const [coupons, setCoupons] = useState<CouponData[]>([]);

  // 本日の利用状況マップ { couponCode: usedAt }
  const [usedMap, setUsedMap] = useState<Record<string, string>>({});

  // 処理中のクーポンコード
  const [processingCode, setProcessingCode] = useState<string | null>(null);

  // 使用済みモーダル
  const [usedModal, setUsedModal] = useState<UsedModalInfo | null>(null);

  // コード入力欄の表示/非表示
  const [showCodeInput, setShowCodeInput] = useState(false);

  // シークレットコード入力値
  const [secretCode, setSecretCode] = useState("");

  // コード入力クーポン（取得済み）
  const [codeCoupon, setCodeCoupon] = useState<VerifyCodeResponse | null>(null);

  // コード検証中フラグ
  const [verifying, setVerifying] = useState(false);

  // ===== データ取得 =====

  const loadData = useCallback(async () => {
    if (!fingerprint) return;
    try {
      setPageState("loading");
      const [fetchedCoupons, fetchedUsedMap] = await Promise.all([
        getCoupons(),
        getCouponStatusMap(fingerprint),
      ]);
      setCoupons(fetchedCoupons);
      setUsedMap(fetchedUsedMap);
      setPageState("ready");
    } catch (err) {
      console.error("データ取得エラー:", err);
      setPageState("error");
    }
  }, [fingerprint]);

  useEffect(() => {
    if (!fpLoading && fingerprint) {
      loadData();
    } else if (!fpLoading && fpError) {
      setPageState("error");
    }
  }, [fpLoading, fingerprint, fpError, loadData]);

  // ===== クーポン使用処理 =====

  const handleUseCoupon = async (coupon: CouponData) => {
    if (!fingerprint || processingCode) return;

    setProcessingCode(coupon.code);
    try {
      const result = await useCoupon(fingerprint, coupon.code, coupon.title);
      const formattedAt = new Date(result.usedAt).toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo",
      });
      // usedMapを更新
      setUsedMap((prev) => ({ ...prev, [coupon.code]: result.usedAt }));
      // コード入力クーポンの場合はcodeCouponのalreadyUsedも更新
      if (codeCoupon && codeCoupon.coupon.code === coupon.code) {
        setCodeCoupon({ ...codeCoupon, alreadyUsed: true, usedAt: result.usedAt });
      }
      setUsedModal({ couponTitle: coupon.title, usedAt: formattedAt });
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { error?: string } } };
      if (error.response?.status === 409) {
        setUsedMap((prev) => ({ ...prev, [coupon.code]: new Date().toISOString() }));
        toast.error("このクーポンはすでに使用済みです");
      } else if (error.response?.status === 410) {
        toast.error(error.response.data?.error || "このクーポンは利用できません");
      } else {
        toast.error("クーポンの使用に失敗しました。再度お試しください。");
      }
    } finally {
      setProcessingCode(null);
    }
  };

  // ===== シークレットコード検証 =====

  const handleVerifyCode = async () => {
    if (!fingerprint || !secretCode.trim() || verifying) return;

    setVerifying(true);
    try {
      const result = await verifySecretCode(secretCode.trim(), fingerprint);
      setCodeCoupon(result);
      setSecretCode("");
      toast.success("クーポンを取得しました！");
    } catch (err: unknown) {
      const error = err as { response?: { status?: number; data?: { error?: string } } };
      const msg = error.response?.data?.error;
      if (error.response?.status === 404) {
        toast.error("クーポンコードが正しくありません");
      } else if (error.response?.status === 410) {
        toast.error(msg || "このクーポンは利用できません");
      } else {
        toast.error("コードの確認に失敗しました。再度お試しください。");
      }
    } finally {
      setVerifying(false);
    }
  };

  // ===== 日時フォーマット =====

  const formatUsedAt = (isoString: string) =>
    new Date(isoString).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });

  // ===== レンダリング =====

  return (
    <div className="coupon-page">
      <Toaster position="top-center" />

      {/* ヘッダー */}
      <header className="page-header">
        <h1 className="site-title">萬屋七重浜店で使えるクーポン一覧</h1>
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

        {/* クーポン一覧 */}
        {pageState === "ready" && (
          <>
            {/* 通常配布クーポン */}
            {coupons.length === 0 ? (
              <div className="no-coupon-message">
                <p>現在配布中のクーポンはありません</p>
              </div>
            ) : (
              <div className="coupon-list">
                {coupons.map((coupon) => {
                  const isUsed = !!usedMap[coupon.code];
                  const usedAtStr = usedMap[coupon.code]
                    ? formatUsedAt(usedMap[coupon.code])
                    : null;

                  return (
                    <div
                      key={coupon.code}
                      className={`coupon-card ${isUsed ? "coupon-card--used" : ""}`}
                    >
                      <div className="coupon-badge-row">
                        {isUsed ? (
                          <span className="badge badge--used">使用済み</span>
                        ) : (
                          <span className="badge badge--available">本日利用可能</span>
                        )}
                      </div>

                      <div className="coupon-content">
                        <h2 className="coupon-title">{coupon.title}</h2>
                        <div className="coupon-code-box">
                          <span className="coupon-code-label">クーポンコード</span>
                          <span className="coupon-code">{coupon.code}</span>
                        </div>
                        <p className="coupon-description">{coupon.description}</p>
                        <p className="coupon-expires">利用期限: {coupon.expires}</p>
                        {isUsed && usedAtStr && (
                          <p className="coupon-used-time">使用日時: {usedAtStr}</p>
                        )}
                      </div>

                      <div className="coupon-action">
                        {isUsed ? (
                          <button className="btn btn-disabled" disabled>
                            本日使用済み
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary"
                            onClick={() => handleUseCoupon(coupon)}
                            disabled={processingCode === coupon.code}
                          >
                            {processingCode === coupon.code
                              ? "処理中..."
                              : "クーポンを使用する"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* コード入力セクション */}
            <div className="code-input-section">
              {!codeCoupon && (
                <button
                  className="btn btn-outline code-toggle-btn"
                  onClick={() => setShowCodeInput((prev) => !prev)}
                >
                  {showCodeInput
                    ? "閉じる"
                    : "クーポンコードをお持ちの方はこちら"}
                </button>
              )}

              {showCodeInput && !codeCoupon && (
                <div className="code-input-form">
                  <p className="code-input-hint">
                    シークレットコードを入力してクーポンを取得してください
                  </p>
                  <div className="code-input-row">
                    <input
                      type="text"
                      className="code-input"
                      placeholder="コードを入力"
                      value={secretCode}
                      onChange={(e) => setSecretCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleVerifyCode();
                      }}
                      maxLength={100}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={handleVerifyCode}
                      disabled={verifying || !secretCode.trim()}
                    >
                      {verifying ? "確認中..." : "取得する"}
                    </button>
                  </div>
                </div>
              )}

              {/* 取得済みコード入力クーポン */}
              {codeCoupon && (() => {
                const c = codeCoupon.coupon;
                const isUsed = codeCoupon.alreadyUsed || !!usedMap[c.code];
                const usedAtStr = usedMap[c.code]
                  ? formatUsedAt(usedMap[c.code])
                  : codeCoupon.usedAt
                  ? formatUsedAt(codeCoupon.usedAt)
                  : null;

                return (
                  <div className={`coupon-card coupon-card--code ${isUsed ? "coupon-card--used" : ""}`}>
                    <div className="coupon-badge-row">
                      <span className="badge badge--code">シークレット</span>
                      {isUsed ? (
                        <span className="badge badge--used">使用済み</span>
                      ) : (
                        <span className="badge badge--available">利用可能</span>
                      )}
                    </div>

                    <div className="coupon-content">
                      <h2 className="coupon-title">{c.title}</h2>
                      <div className="coupon-code-box">
                        <span className="coupon-code-label">クーポンコード</span>
                        <span className="coupon-code">{c.code}</span>
                      </div>
                      <p className="coupon-description">{c.description}</p>
                      <p className="coupon-expires">利用期限: {c.expires}</p>
                      {isUsed && usedAtStr && (
                        <p className="coupon-used-time">使用日時: {usedAtStr}</p>
                      )}
                    </div>

                    <div className="coupon-action">
                      {isUsed ? (
                        <button className="btn btn-disabled" disabled>
                          本日使用済み
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary"
                          onClick={() => handleUseCoupon(c)}
                          disabled={processingCode === c.code}
                        >
                          {processingCode === c.code
                            ? "処理中..."
                            : "クーポンを使用する"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </>
        )}
      </main>

      {/* 使用済みモーダル */}
      {usedModal && (
        <div className="modal-overlay" onClick={() => setUsedModal(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-icon">✓</div>
            <h2 className="modal-title">クーポンを使用しました</h2>
            <p className="modal-coupon-name">{usedModal.couponTitle}</p>
            <p className="modal-time">使用日時: {usedModal.usedAt}</p>
            <p className="modal-message">
              またのご来店をお待ちしております。
            </p>
            <button
              className="btn btn-primary"
              onClick={() => setUsedModal(null)}
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
