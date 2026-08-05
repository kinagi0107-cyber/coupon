/**
 * 管理画面 - 利用履歴ページ
 * 利用日時・端末ID・クーポンコードを最新順で表示する
 */

import { useState, useEffect } from "react";
import { getHistory } from "../../lib/api";
import type { HistoryLog } from "../../lib/api";

export default function HistoryPage() {
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const limit = 50;

  const fetchHistory = async (offset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getHistory(limit, offset);
      setLogs(result.logs);
      setTotal(result.total);
    } catch (err) {
      console.error("履歴取得エラー:", err);
      setError("利用履歴の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(page * limit);
  }, [page]);

  // フィンガープリントを短縮表示する（セキュリティのため一部マスク）
  const maskFingerprint = (fp: string) => {
    if (fp.length <= 12) return fp;
    return `${fp.substring(0, 8)}...${fp.substring(fp.length - 4)}`;
  };

  const totalPages = Math.ceil(total / limit);

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
            onClick={() => fetchHistory(page * limit)}
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
        <h2 className="page-title">📋 利用履歴</h2>
        <p className="page-description">
          全 {total} 件 / 最新順で表示しています
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="empty-state">
          <p>まだ利用履歴がありません</p>
        </div>
      ) : (
        <>
          {/* テーブル（PC表示） */}
          <div className="table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>利用日時</th>
                  <th>端末ID</th>
                  <th>クーポンコード</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => (
                  <tr key={log.id}>
                    <td className="text-muted">
                      {page * limit + index + 1}
                    </td>
                    <td className="nowrap">{log.usedAtFormatted}</td>
                    <td>
                      <code
                        className="fingerprint-code"
                        title={log.fingerprint}
                      >
                        {maskFingerprint(log.fingerprint)}
                      </code>
                    </td>
                    <td>
                      <code className="code-inline">{log.couponCode}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* モバイル表示 */}
          <div className="history-cards">
            {logs.map((log, index) => (
              <div key={log.id} className="history-card">
                <div className="history-card-row">
                  <span className="history-card-label">No.</span>
                  <span>{page * limit + index + 1}</span>
                </div>
                <div className="history-card-row">
                  <span className="history-card-label">利用日時</span>
                  <span>{log.usedAtFormatted}</span>
                </div>
                <div className="history-card-row">
                  <span className="history-card-label">端末ID</span>
                  <code
                    className="fingerprint-code"
                    title={log.fingerprint}
                  >
                    {maskFingerprint(log.fingerprint)}
                  </code>
                </div>
                <div className="history-card-row">
                  <span className="history-card-label">クーポンコード</span>
                  <code className="code-inline">{log.couponCode}</code>
                </div>
              </div>
            ))}
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage(0)}
                disabled={page === 0}
              >
                最初
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 0}
              >
                前へ
              </button>
              <span className="page-info">
                {page + 1} / {totalPages}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages - 1}
              >
                次へ
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setPage(totalPages - 1)}
                disabled={page >= totalPages - 1}
              >
                最後
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
