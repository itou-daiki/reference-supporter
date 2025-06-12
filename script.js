// グローバル変数
let selectedBook = null;

// DOM要素の取得
const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');
const searchButton = document.getElementById('search-button');
const bookSearchInput = document.getElementById('book-search');
const searchTypeSelect = document.getElementById('search-type');
const searchResults = document.getElementById('search-results');
const loading = document.getElementById('loading');
const jstageUrlInput = document.getElementById('jstage-url');
const extractPaperButton = document.getElementById('extract-paper');
const paperLoading = document.getElementById('paper-loading');
const websiteUrlInput = document.getElementById('website-url');
const extractWebsiteButton = document.getElementById('extract-website');
const websiteLoading = document.getElementById('website-loading');
const resultSection = document.getElementById('result-section');
const citationResult = document.getElementById('citation-result');
const copyButton = document.getElementById('copy-button');
const errorSection = document.getElementById('error-section');
const errorText = document.getElementById('error-text');

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
});

// イベントリスナーの設定
function setupEventListeners() {
    // タブ切り替え
    tabButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    // 書籍検索
    searchButton.addEventListener('click', searchBooks);
    bookSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchBooks();
    });

    // 論文抽出
    extractPaperButton.addEventListener('click', extractPaper);
    jstageUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') extractPaper();
    });

    // Webサイト抽出
    extractWebsiteButton.addEventListener('click', extractWebsite);
    websiteUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') extractWebsite();
    });

    // コピーボタン
    copyButton.addEventListener('click', copyCitation);
}

// タブ切り替え
function switchTab(tabName) {
    // 全てのタブボタンとコンテンツを非アクティブに
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    // 選択されたタブを アクティブに
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // 結果とエラーを隠す
    hideResults();
}

// 書籍検索
async function searchBooks() {
    const query = bookSearchInput.value.trim();
    const searchType = searchTypeSelect.value;

    if (!query) {
        showError('検索キーワードを入力してください。');
        return;
    }

    hideResults();
    showLoading(loading);

    try {
        // Google Books APIを使用（実際の実装では適切なAPIキーが必要）
        const apiUrl = searchType === 'isbn' 
            ? `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(query)}&langRestrict=ja`
            : `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&langRestrict=ja&maxResults=10`;

        const response = await fetch(apiUrl);
        const data = await response.json();

        hideLoading(loading);

        if (data.items && data.items.length > 0) {
            displaySearchResults(data.items);
        } else {
            showError('書籍が見つかりませんでした。検索キーワードを変更してお試しください。');
        }
    } catch (error) {
        hideLoading(loading);
        showError('検索中にエラーが発生しました。インターネット接続を確認してください。');
        console.error('Book search error:', error);
    }
}

// 検索結果表示
function displaySearchResults(books) {
    searchResults.innerHTML = '';
    
    books.forEach((book, index) => {
        const volumeInfo = book.volumeInfo;
        const authors = volumeInfo.authors ? volumeInfo.authors.join(', ') : '著者不明';
        const title = volumeInfo.title || 'タイトル不明';
        const publisher = volumeInfo.publisher || '出版社不明';
        const publishedDate = volumeInfo.publishedDate || '発行年不明';
        const isbn = volumeInfo.industryIdentifiers 
            ? volumeInfo.industryIdentifiers.find(id => id.type === 'ISBN_13' || id.type === 'ISBN_10')?.identifier || 'ISBN不明'
            : 'ISBN不明';

        const resultItem = document.createElement('div');
        resultItem.className = 'search-item';
        resultItem.innerHTML = `
            <h3>${title}</h3>
            <p><strong>著者:</strong> ${authors}</p>
            <p><strong>出版社:</strong> ${publisher}</p>
            <p><strong>発行年:</strong> ${publishedDate}</p>
            <p><strong>ISBN:</strong> <span class="isbn">${isbn}</span></p>
        `;

        resultItem.addEventListener('click', () => selectBook(book, resultItem));
        searchResults.appendChild(resultItem);
    });
}

// 書籍選択
function selectBook(book, element) {
    // 既存の選択を解除
    document.querySelectorAll('.search-item').forEach(item => {
        item.classList.remove('selected');
    });

    // 新しい選択を設定
    element.classList.add('selected');
    selectedBook = book;

    // 引用文献を生成
    generateBookCitation(book);
}

// 書籍引用文献生成
function generateBookCitation(book) {
    const volumeInfo = book.volumeInfo;
    const authors = volumeInfo.authors ? volumeInfo.authors.join(', ') : '著者不明';
    const title = volumeInfo.title || 'タイトル不明';
    const publisher = volumeInfo.publisher || '出版社不明';
    const publishedDate = volumeInfo.publishedDate ? volumeInfo.publishedDate.split('-')[0] : '発行年不明';

    const citation = `${authors}(${publishedDate}), ${title}, ${publisher}`;
    
    showResult(citation);
}

// 論文抽出
async function extractPaper() {
    const url = jstageUrlInput.value.trim();

    if (!url) {
        showError('J-STAGEのURLを入力してください。');
        return;
    }

    // J-STAGEのURLかチェック
    if (!url.includes('jstage.jst.go.jp')) {
        showError('J-STAGEのURLを入力してください。他のサイトのURLは対応していません。');
        return;
    }

    hideResults();
    showLoading(paperLoading);

    try {
        // CORSプロキシを使用してJ-STAGEから情報を取得
        // 実際の実装では、バックエンドサーバーまたはCORSプロキシが必要
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();

        hideLoading(paperLoading);

        if (data.contents) {
            parsePaperInfo(data.contents, url);
        } else {
            showError('論文情報を取得できませんでした。URLを確認してください。');
        }
    } catch (error) {
        hideLoading(paperLoading);
        showError('論文情報の取得中にエラーが発生しました。URLを確認してください。');
        console.error('Paper extraction error:', error);
    }
}

// 論文情報解析
function parsePaperInfo(html, url) {
    try {
        // HTMLパーサーを使用して論文情報を抽出
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // J-STAGEの構造に基づいて情報を抽出（実際の構造に応じて調整が必要）
        const title = doc.querySelector('h1')?.textContent?.trim() || 
                     doc.querySelector('.title')?.textContent?.trim() || 
                     'タイトル不明';
        
        const authors = doc.querySelector('.authors')?.textContent?.trim() || 
                       doc.querySelector('.author')?.textContent?.trim() || 
                       '著者不明';
        
        const journal = doc.querySelector('.journal-title')?.textContent?.trim() || 
                       doc.querySelector('.publication')?.textContent?.trim() || 
                       '雑誌名不明';
        
        const volume = doc.querySelector('.volume')?.textContent?.trim() || '';
        const issue = doc.querySelector('.issue')?.textContent?.trim() || '';
        const pages = doc.querySelector('.pages')?.textContent?.trim() || '';
        const year = doc.querySelector('.year')?.textContent?.trim() || 
                    url.match(/\d{4}/)?.[0] || '発表年不明';

        generatePaperCitation(authors, title, journal, volume, issue, pages, year);
    } catch (error) {
        showError('論文情報の解析中にエラーが発生しました。');
        console.error('Paper parsing error:', error);
    }
}

// 論文引用文献生成
function generatePaperCitation(authors, title, journal, volume, issue, pages, year) {
    let citation = `${authors}：${title}, ${journal}`;
    
    if (volume) {
        citation += `, ${volume}`;
        if (issue) {
            citation += `(${issue})`;
        }
        if (pages) {
            citation += `, ${pages}`;
        }
    }
    
    citation += ` (${year})`;
    
    showResult(citation);
}

// Webサイト抽出
async function extractWebsite() {
    const url = websiteUrlInput.value.trim();

    if (!url) {
        showError('WebサイトのURLを入力してください。');
        return;
    }

    // J-STAGEのURLかチェック（エラー処理）
    if (url.includes('jstage.jst.go.jp')) {
        showError('J-STAGEのURLは論文タブで処理してください。');
        return;
    }

    hideResults();
    showLoading(websiteLoading);

    try {
        // CORSプロキシを使用してWebサイトから情報を取得
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        const data = await response.json();

        hideLoading(websiteLoading);

        if (data.contents) {
            parseWebsiteInfo(data.contents, url);
        } else {
            showError('Webサイト情報を取得できませんでした。URLを確認してください。');
        }
    } catch (error) {
        hideLoading(websiteLoading);
        showError('Webサイト情報の取得中にエラーが発生しました。URLを確認してください。');
        console.error('Website extraction error:', error);
    }
}

// Webサイト情報解析
function parseWebsiteInfo(html, url) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // ページタイトルを取得
        const pageTitle = doc.querySelector('title')?.textContent?.trim() || 
                         doc.querySelector('h1')?.textContent?.trim() || 
                         'ページタイトル不明';

        // サイト名を取得（meta tagまたはドメインから）
        const siteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || 
                        doc.querySelector('meta[name="application-name"]')?.getAttribute('content') || 
                        new URL(url).hostname;

        const currentDate = new Date().toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).replace(/\//g, '.');

        generateWebsiteCitation(pageTitle, siteName, url, currentDate);
    } catch (error) {
        showError('Webサイト情報の解析中にエラーが発生しました。');
        console.error('Website parsing error:', error);
    }
}

// Webサイト引用文献生成
function generateWebsiteCitation(pageTitle, siteName, url, accessDate) {
    const citation = `${pageTitle}, ${siteName}, ${url} (${accessDate})`;
    showResult(citation);
}

// 結果表示
function showResult(citation) {
    citationResult.textContent = citation;
    resultSection.classList.remove('hidden');
    errorSection.classList.add('hidden');
}

// エラー表示
function showError(message) {
    errorText.textContent = message;
    errorSection.classList.remove('hidden');
    resultSection.classList.add('hidden');
}

// 結果とエラーを隠す
function hideResults() {
    resultSection.classList.add('hidden');
    errorSection.classList.add('hidden');
}

// ローディング表示
function showLoading(element) {
    element.classList.remove('hidden');
}

// ローディング隠す
function hideLoading(element) {
    element.classList.add('hidden');
}

// 引用文献をクリップボードにコピー
async function copyCitation() {
    try {
        await navigator.clipboard.writeText(citationResult.textContent);
        
        // ボタンのテキストを一時的に変更
        const originalText = copyButton.innerHTML;
        copyButton.innerHTML = '<i class="fas fa-check"></i> コピー完了!';
        copyButton.style.background = '#28a745';
        
        setTimeout(() => {
            copyButton.innerHTML = originalText;
            copyButton.style.background = '';
        }, 2000);
        
    } catch (error) {
        // クリップボードAPIが使用できない場合のフォールバック
        const textArea = document.createElement('textarea');
        textArea.value = citationResult.textContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        // ボタンのテキストを一時的に変更
        const originalText = copyButton.innerHTML;
        copyButton.innerHTML = '<i class="fas fa-check"></i> コピー完了!';
        copyButton.style.background = '#28a745';
        
        setTimeout(() => {
            copyButton.innerHTML = originalText;
            copyButton.style.background = '';
        }, 2000);
    }
}