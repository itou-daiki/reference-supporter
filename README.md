# 引用参考文献作成ツール

書籍、論文、Webサイトの引用文献を自動生成するWebアプリケーションです。

## 🚀 機能

- **書籍検索**: タイトルまたはISBNで書籍を検索し、引用文献を生成
- **論文抽出**: J-STAGEのURLから論文情報を抽出し、引用文献を生成
- **Webサイト抽出**: WebサイトのURLからページ情報を抽出し、引用文献を生成
- **モダンなUI**: レスポンシブデザインでスマートフォンにも対応

## 📋 出力形式

### 書籍
```
著者名 (発行年), 書名, 出版社
例: めじろん太郎(2014), 大分県の鳥類, 日田出版
```

### 論文
```
著者名：タイトル, 雑誌名, 巻数(号数) , ページ (発表年)
例: 豆田町子：大分川の水質, 水の友, 50(10), pp.45-50 (2016)
```

### Webサイト
```
ページタイトル, サイト名, URL（アクセス年月日）
例: 日田高校の概要, 大分県立日田高等学校, http://kou.oita-ed.jp/oitamaizuru/index.html (2020.7.27)
```

## 🛠️ 技術仕様

- **フロントエンド**: HTML5, CSS3, Vanilla JavaScript
- **API**: Google Books API（書籍検索）
- **デザイン**: レスポンシブデザイン、モダンUI/UX
- **フォント**: Noto Sans JP, Font Awesome アイコン

## 📁 ファイル構成

```
.
├── index.html          # メインHTMLファイル
├── styles.css          # スタイルシート
├── script.js          # JavaScript機能
└── README.md          # このファイル
```

## 🚀 GitHub Pagesでのデプロイ方法

### 1. リポジトリの作成
1. GitHubで新しいリポジトリを作成
2. リポジトリ名は任意（例: `citation-generator`）

### 2. ファイルのアップロード
以下のファイルをリポジトリのルートディレクトリにアップロード:
- `index.html`
- `styles.css`
- `script.js`
- `README.md`

### 3. GitHub Pagesの有効化
1. リポジトリの「Settings」タブを開く
2. 左側メニューから「Pages」を選択
3. 「Source」で「Deploy from a branch」を選択
4. 「Branch」で「main」（または「master」）を選択
5. フォルダは「/ (root)」を選択
6. 「Save」をクリック

### 4. アクセス
5-10分後に `https://[ユーザー名].github.io/[リポジトリ名]/` でアクセス可能

## ⚠️ 注意事項

### CORS制限について
- J-STAGEおよび外部Webサイトからのデータ取得は、CORS（Cross-Origin Resource Sharing）制限により、ブラウザから直接アクセスできない場合があります
- 現在は `api.allorigins.win` というCORSプロキシサービスを使用していますが、本格運用では以下の対策を推奨します：

1. **バックエンドサーバーの設置**
   - Node.js + Express などでプロキシサーバーを作成
   - Netlify Functions や Vercel Functions などのサーバーレス関数を活用

2. **ブラウザ拡張機能**
   - CORS制限を無効にするブラウザ拡張機能の使用（開発用途のみ）

### API制限について
- Google Books APIは無料プランでは1日1000リクエストまでの制限があります
- 本格的な利用にはAPIキーの取得と設定が必要です

## 🔧 カスタマイズ

### Google Books APIキーの設定
1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを作成
2. Books APIを有効化
3. APIキーを作成
4. `script.js` の該当箇所にAPIキーを追加:

```javascript
const apiUrl = searchType === 'isbn' 
    ? `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(query)}&langRestrict=ja&key=YOUR_API_KEY`
    : `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&langRestrict=ja&maxResults=10&key=YOUR_API_KEY`;
```

### スタイルのカスタマイズ
`styles.css` を編集することで、色合いやレイアウトを変更できます。

## 📱 対応ブラウザ

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 📄 ライセンス

MIT License

## 🤝 コントリビューション

バグ報告や機能要求は Issues でお気軽にお知らせください。

## 🔮 今後の改善予定

- [ ] バックエンドAPI実装によるCORS制限解決
- [ ] より正確な論文情報抽出
- [ ] 引用スタイルの選択機能（APA、MLA等）
- [ ] 一括引用文献生成機能
- [ ] PDF出力機能