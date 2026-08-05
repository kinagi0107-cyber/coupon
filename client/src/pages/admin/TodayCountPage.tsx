/**
 * 管理画面 - 本日の利用人数ページ
 * クーポン別の内訳も表示する
 */

import { useState, useEffect } from "react";
import { getTodayCount } from "../../lib/api";
import type { TodayResponse } from "../../lib/api";

export default function TodayCountPage() {
  const [data, setData] = useState<TodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCount = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTodayCount();
      setData(result);
    } catch (err) {
      console.error("利用人数取得エラー:", err);
      setError("利用人数の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();
    // 1分ごとに自動更新
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
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
          <button className="btn btn-secondary" onClick={fetchCount}>
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="page-header-section">
        <h2 className="page-title">📊 本日の利用人数</h2>
        <p className="page-description">
          本日（日本時間）クーポンを利用した人数です。
        </p>
      </div>

      {data && (
        <>
          {/* 合計カード */}
          <div className="count-card">
            <div className="count-date">{data.date}</div>
            <div className="count-number">{data.count}</div>
            <div className="count-unit">件</div>
          </div>

          {/* クーポン別内訳 */}
          {data.breakdown && data.breakdown.length > 0 && (
            <div className="breakdown-section">
              <h3 className="breakdown-title">クーポン別内訳</h3>
              <div className="table-container">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>クーポン名</th>
                      <th>クーポンコード</th>
                      <th>利用件数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.breakdown.map((item) => (
                      <tr key={item.couponCode}>
                        <td>{item.couponTitle || "—"}</td>
                        <td><code className="code-inline">{item.couponCode}</code></td>
                        <td><strong>{item.count}</strong> 件</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="count-info">
            <p>
              ※ 毎日0:00（日本時間）にリセットされます。
              <br />
              ※ 1分ごとに自動更新されます。
            </p>
            <button className="btn btn-secondary" onClick={fetchCount}>
              今すぐ更新
            </button>
          </div>
        </>
      )}
    </div>
  );
}
