/**
 * アプリケーションルートコンポーネント
 * React Router によるルーティング設定
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import CouponPage from "./pages/CouponPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminLayout from "./components/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import CurrentCouponPage from "./pages/admin/CurrentCouponPage";
import CreateCouponPage from "./pages/admin/CreateCouponPage";
import TodayCountPage from "./pages/admin/TodayCountPage";
import HistoryPage from "./pages/admin/HistoryPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ユーザー向けクーポンページ */}
        <Route path="/" element={<CouponPage />} />

        {/* 管理者ログインページ */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* 管理画面（認証必須） */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <CurrentCouponPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/create"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <CreateCouponPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/today"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <TodayCountPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/history"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <HistoryPage />
              </AdminLayout>
            </ProtectedRoute>
          }
        />

        {/* 未定義ルートはトップへリダイレクト */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
