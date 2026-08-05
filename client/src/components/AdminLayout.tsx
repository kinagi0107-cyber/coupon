/**
 * 管理画面レイアウトコンポーネント
 * 左メニュー + 右コンテンツの2カラムレイアウト
 */

import { useState } from "react";
import type { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin/login");
  };

  const menuItems = [
    { path: "/admin", label: "発行中クーポン", icon: "🎫", end: true },
    { path: "/admin/create", label: "新規クーポン作成", icon: "✏️", end: false },
    { path: "/admin/today", label: "本日の利用人数", icon: "📊", end: false },
    { path: "/admin/history", label: "利用履歴", icon: "📋", end: false },
  ];

  return (
    <div className="admin-layout">
      {/* モバイルヘッダー */}
      <header className="admin-mobile-header">
        <h1 className="admin-mobile-title">クーポン管理</h1>
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="メニューを開く"
        >
          {isMobileMenuOpen ? "✕" : "☰"}
        </button>
      </header>

      <div className="admin-body">
        {/* サイドバー */}
        <aside
          className={`admin-sidebar ${isMobileMenuOpen ? "open" : ""}`}
        >
          <div className="sidebar-header">
            <h2 className="sidebar-title">クーポン管理</h2>
          </div>

          <nav className="sidebar-nav">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button className="logout-btn" onClick={handleLogout}>
              <span>🚪</span>
              <span>ログアウト</span>
            </button>
            <a href="/" className="user-page-link">
              <span>🏠</span>
              <span>ユーザー画面</span>
            </a>
          </div>
        </aside>

        {/* モバイルオーバーレイ */}
        {isMobileMenuOpen && (
          <div
            className="mobile-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* メインコンテンツ */}
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
