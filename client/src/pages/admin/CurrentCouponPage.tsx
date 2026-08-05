/**
 * 管理画面 - 発行中クーポン表示ページ
 * 現在GitHubで設定されているクーポン内容を表示する
 */

import { useState, useEffect } from "react";
import { getAdminCoupon } from "../../lib/api";
import type { CouponData } from "../../lib/api";

export default function CurrentCouponPage() {
  const [coupon, setCoupon] = useState<CouponData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCoupon = async () => {
      try {
        const data = await getAdminCoupon();
        setCoupon(data);
      } catch (err) {
        console.error("クーポン取得エラー:", err);
        setError("クーポン情報の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };

    fetchCoupon();
  }, []);

  // 利用期限チェック
  const isExpired = (expires: string) => {
    const today = new Date().toISOString().split("T")[0];
    return expires < today;
  };

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
          <button
            className="btn btn-secondary"
            onClick={() => window.location.reload()}
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header-section">
        <h2 className="page-title">🎫 発行中クーポン</h2>
        <p className="page-description">
          現在 GitHub の <code>coupon.ts</code> に設定されているクーポン内容です。
        </p>
      </div>

      {coupon && (
        <div className="coupon-detail-card">
          <div className="coupon-status-badge">
            {isExpired(coupon.expires) ? (
              <span className="badge badge-expired">期限切れ</span>
            ) : (
              <span className="badge badge-active">配布中</span>
            )}
          </div>

          <table className="detail-table">
            <tbody>
              <tr>
                <th>クーポン名</th>
                <td>{coupon.title}</td>
              </tr>
              <tr>
                <th>クーポンコード</th>
                <td>
                  <code className="code-inline">{coupon.code}</code>
                </td>
              </tr>
              <tr>
                <th>利用期限</th>
                <td
                  className={
                    isExpired(coupon.expires) ? "text-danger" : "text-success"
                  }
                >
                  {coupon.expires}
                  {isExpired(coupon.expires) && " （期限切れ）"}
                </td>
              </tr>
              <tr>
                <th>説明文</th>
                <td>{coupon.description}</td>
              </tr>
              {coupon.note && (
                <tr>
                  <th>補足</th>
                  <td>{coupon.note}</td>
                </tr>
              )}
            </tbody>
          </table>

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
      )}
    </div>
  );
}
