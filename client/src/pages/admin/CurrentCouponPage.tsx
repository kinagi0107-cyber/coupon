/**
 * 管理画面 - 発行中クーポン表示ページ
 * 全クーポン一覧を表示し、有効期限切れ・利用上限到達の警告を表示する
 */

import { useState, useEffect } from "react";
import { getAdminCoupons } from "../../lib/api";
import type { AdminCouponData } from "../../lib/api";

export default function CurrentCouponPage() {
  const [coupons, setCoupons] = useState<AdminCouponData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const data = await getAdminCoupons();
        setCoupons(data);
      } catch (err) {
        console.error("クーポン取得エラー:", err);
        setError("クーポン情報の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    fetchCoupons();
  }, []);

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading-container">
          <div className="spinner" />
          <p>読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <button className="btn btn-secondary" onClick={() => window.location.reload()}>
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  // 警告があるクーポンを先頭に表示
  const sortedCoupons = [...coupons].sort((a, b) => {
    const aWarn = a.warnings.length > 0 ? 0 : 1;
    const bWarn = b.warnings.length > 0 ? 0 : 1;
    return aWarn - bWarn;
  });

  const warningCount = coupons.filter((c) => c.warnings.length > 0).length;

  return (
    <div className="admin-page">
      <div className="page-header-section">
        <h2 className="page-title">🎫 発行中クーポン</h2>
        <p className="page-description">
          現在 GitHub の <code>coupon.json</code> に設定されている全クーポンです。
        </p>
      </div>

      {/* 警告サマリー */}
      {warningCount > 0 && (
        <div className="alert alert--warning">
          <span className="alert-icon">⚠️</span>
          <span>
            {warningCount}件のクーポンに注意が必要です。
            内容を確認して対応してください。
          </span>
        </div>
      )}

      {coupons.length === 0 ? (
        <div className="empty-state">
          <p>クーポンが設定されていません</p>
        </div>
      ) : (
        <div className="coupon-admin-list">
          {sortedCoupons.map((coupon) => (
            <div
              key={coupon.code}
              className={`coupon-admin-card ${coupon.warnings.length > 0 ? "coupon-admin-card--warning" : ""}`}
            >
              {/* ステータスバッジ */}
              <div className="coupon-badge-row">
                <span className={`badge ${coupon.type === "code" ? "badge--code" : "badge--public"}`}>
                  {coupon.type === "code" ? "コード入力" : "通常配布"}
                </span>
                {coupon.isExpired && (
                  <span className="badge badge--expired">期限切れ</span>
                )}
                {coupon.isLimitReached && (
                  <span className="badge badge--limit">上限到達</span>
                )}
                {!coupon.isExpired && !coupon.isLimitReached && (
                  <span className="badge badge--active">配布中</span>
                )}
              </div>

              {/* 警告メッセージ */}
              {coupon.warnings.length > 0 && (
                <div className="coupon-warnings">
                  {coupon.warnings.map((w) => (
                    <p key={w} className="warning-text">⚠️ {w}</p>
                  ))}
                </div>
              )}

              {/* クーポン詳細 */}
              <table className="detail-table">
                <tbody>
                  <tr>
                    <th>クーポン名</th>
                    <td>{coupon.title}</td>
                  </tr>
                  <tr>
                    <th>クーポンコード</th>
                    <td><code className="code-inline">{coupon.code}</code></td>
                  </tr>
                  <tr>
                    <th>利用期限</th>
                    <td className={coupon.isExpired ? "text-danger" : "text-success"}>
                      {coupon.expires}
                      {coupon.isExpired && " （期限切れ）"}
                    </td>
                  </tr>
                  <tr>
                    <th>説明文</th>
                    <td>{coupon.description}</td>
                  </tr>
                  {coupon.type === "code" && (
                    <>
                      <tr>
                        <th>シークレットコード</th>
                        <td><code className="code-inline">{coupon.secretCode}</code></td>
                      </tr>
                      <tr>
                        <th>利用上限</th>
                        <td>
                          {coupon.maxUses != null ? (
                            <span className={coupon.isLimitReached ? "text-danger" : ""}>
                              {coupon.useCount ?? 0} / {coupon.maxUses} 人
                              {coupon.isLimitReached && " （上限到達）"}
                            </span>
                          ) : (
                            "上限なし"
                          )}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      <div className="info-box">
        <p>
          クーポン内容を変更するには、GitHub の{" "}
          <code>client/src/data/coupon.ts</code> と{" "}
          <code>server/shared/coupon.json</code> を書き換えてPushしてください。
          <br />
          「新規クーポン作成」メニューからコードを生成できます。
        </p>
      </div>
    </div>
  );
}
