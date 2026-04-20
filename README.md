# TopicPulse

AIを活用したトピック監視・トレンド分析アプリ

## 技術スタック

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **AI**: Anthropic Claude / Google Gemini
- **Deploy**: Vercel

---

## セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/your-org/topicpulse.git
cd topicpulse
npm install
```

### 2. Firebase プロジェクト作成

1. [Firebase Console](https://console.firebase.google.com) でプロジェクトを作成
2. **Authentication** → メール/パスワード・匿名認証を有効化
3. **Firestore Database** → 本番モードで作成
4. セキュリティルールを `firestore.rules` の内容に更新

### 3. 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` にFirebaseの設定値を記入:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### 4. AI API キーの設定

通常利用は、アプリ内の「APIキー設定」からユーザーが各自のキーを登録します。現在は Anthropic と Gemini を選択できます。

必要ならフロントエンド用の既定値も設定できます:

```
VITE_ANTHROPIC_API_KEY=sk-ant-...
VITE_ANTHROPIC_MODEL=claude-sonnet-4-20250514
VITE_GEMINI_API_KEY=AIza...
VITE_GEMINI_MODEL=gemini-2.5-flash-lite
```

### 5. お試し更新のサーバー設定

APIキー未登録ユーザー向けの「月5回まで」のお試し更新は、Vercel のサーバレス関数から運営者の Gemini キーで実行します。以下を Vercel 環境変数へ設定してください。

```
TRIAL_GEMINI_API_KEY=AIza...
TRIAL_GEMINI_MODEL=gemini-2.5-flash-lite
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

`FIREBASE_ADMIN_PRIVATE_KEY` は改行を `\n` で保持した文字列を使います。

### 6. 開発サーバー起動

```bash
npm run dev
```

---

## Vercel デプロイ

1. GitHubにプッシュ
2. [Vercel](https://vercel.com) で新規プロジェクト → GitHubリポジトリを接続
3. 環境変数を Vercel Dashboard に設定
4. デプロイ完了 🎉

---

## 機能一覧

### トピック管理
- AIチャットで相談しながらトピック追加
- 最大登録数：匿名3件 / Free5件 / Premium10件
- デイリー更新：Free1件 / Premium全件

### 自動更新
- 週次自動更新（全プラン）
- デイリー自動更新（指定トピック or Premiumは全件）
- 即時更新ボタン
- APIキー未登録ユーザー向けの月5回お試し更新

### 分析表示
- AIサマリカード（盛り上がり指数・センチメント・関心規模）
- 検索条件（折り畳み）
- トレンド分析（折り畳み）
- 情報ソース一覧（折り畳み）

### UX
- 閲覧頻度トラッキング（週次/月次）
- 関心度低下検知 → AIによる変更提案
- レスポンシブ対応（モバイル/デスクトップ）
- 匿名モード対応

---

## プロジェクト構成

```
src/
├── types/          # TypeScript型定義
├── utils/          # 定数・ユーティリティ
├── firebase.ts     # Firebase初期化
├── services/
│   ├── firestoreService.ts  # Firestore CRUD
│   └── aiService.ts         # マルチプロバイダAI呼び出し
├── contexts/
│   ├── AuthContext.tsx      # 認証状態管理
│   └── TopicsContext.tsx    # トピック状態管理
├── api/
│   ├── _lib/firebaseAdmin.js       # Firebase Admin 初期化
│   └── trial-topic-refresh.js      # お試し更新用のサーバレスAPI
└── components/
    ├── layout/     # Sidebar, AppLayout
    ├── auth/       # AuthModal, ApiKeyPanel
    ├── chat/       # ChatPanel
    ├── topics/     # TopicItem, SummaryCard, TrendSection, ...
    └── common/     # CollapsibleSection, LoadingScreen
```

---

## TODO

- 公開運用では、通常のユーザー所有 API キーによる AI 呼び出しも含めて、最終的にはすべてサーバー経由へ移行する
- 現状でサーバー経由なのは、お試し更新の固定 Gemini 軽量モデルのみ
