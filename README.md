# 1日1回限定クーポン配布システム

店舗などで使用する、1日1回限定のクーポン配布システムです。
ユーザー登録不要で、ブラウザフィンガープリントを使用して端末を識別し、1日1回の利用制限を実現します。

## 特徴

- **ユーザー登録不要**: FingerprintJS を使用して端末を識別
- **1日1回限定**: 毎日0:00（日本時間）に利用状況がリセットされます
- **サーバー側での確実な判定**: Cookie や LocalStorage のみへの依存を避け、サーバー側（PostgreSQL）で利用状況を判定します
- **管理画面**: クーポンの発行状況確認、新規クーポンコードの生成、利用人数の確認、利用履歴の閲覧が可能
- **GitHub / Render 連携**: Render Free プランでの運用を想定し、クーポン内容は GitHub のコードを直接書き換えることで更新する構成です

## 技術スタック

### フロントエンド
- React 19
- Vite
- TypeScript
- FingerprintJS (端末識別)
- React Router (ルーティング)
- Axios (API通信)

### バックエンド
- Node.js
- Express
- TypeScript
- Prisma (ORM)
- PostgreSQL (データベース)
- JSON Web Token (管理者認証)

## Render へのデプロイ方法

このリポジトリは Render へのデプロイに最適化されています。

1. このリポジトリを GitHub に Push します
2. [Render ダッシュボード](https://dashboard.render.com/) にログインします
3. 「New」>「Blueprint」を選択します
4. この GitHub リポジトリを接続します
5. `render.yaml` が自動的に読み込まれ、Web Service と PostgreSQL が作成されます

### 環境変数

Render デプロイ時に以下の環境変数が設定されます（`render.yaml` 経由）。
必要に応じて Render ダッシュボードから変更してください。

| 変数名 | 説明 | デフォルト値 |
| --- | --- | --- |
| `DATABASE_URL` | PostgreSQL接続URL | 自動設定 |
| `NODE_ENV` | 実行環境 | `production` |
| `ADMIN_USERNAME` | 管理画面のログインID | `admin` |
| `ADMIN_PASSWORD` | 管理画面のパスワード | `nanaehama2611` |
| `JWT_SECRET` | JWT署名用シークレット | 自動生成 |

## クーポンの更新方法

Render Free プランではファイルシステムの永続化ができないため、クーポンの更新は GitHub を経由して行います。

1. 管理画面（`/admin`）にログインします
2. 左メニューの「新規クーポン作成」をクリックします
3. 新しいクーポンの内容を入力し、「コードを生成する」ボタンを押します
4. 生成された `coupon.ts` と `coupon.json` の内容をコピーします
5. GitHub 上で以下のファイルを編集し、コピーした内容を貼り付けます：
   - `client/src/data/coupon.ts`
   - `server/shared/coupon.json`
6. 変更をコミットして Push します
7. Render が自動的に再デプロイを行い、新しいクーポンが反映されます

## ローカル開発環境の構築

### 前提条件
- Node.js (v18以上推奨)
- PostgreSQL

### セットアップ

1. 依存関係のインストール
```bash
# バックエンド
cd server
npm install

# フロントエンド
cd ../client
npm install
```

2. 環境変数の設定
`server/.env.example` をコピーして `server/.env` を作成し、データベース接続情報を設定します。
```bash
cp server/.env.example server/.env
```

3. データベースのマイグレーション
```bash
cd server
npx prisma migrate dev
```

4. 開発サーバーの起動
```bash
# ターミナル1（バックエンド）
cd server
npm run dev

# ターミナル2（フロントエンド）
cd client
npm run dev
```

ブラウザで `http://localhost:5173` にアクセスします。
管理画面は `http://localhost:5173/admin` です。
