// グローバル変数
let selectedBook = null;
let geminiApiKey = '';
let aiAssistEnabled = false;

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
const doiTextInput = document.getElementById('doi-text');
const extractDoiButton = document.getElementById('extract-doi');
const urlDoiTextInput = document.getElementById('url-doi-text');
const extractUrlDoiButton = document.getElementById('extract-url-doi');
const methodTabs = document.querySelectorAll('.method-tab');
const methodContents = document.querySelectorAll('.input-method-content');
const paperLoading = document.getElementById('paper-loading');
const websiteUrlInput = document.getElementById('website-url');
const extractWebsiteButton = document.getElementById('extract-website');
const websiteLoading = document.getElementById('website-loading');
const resultSection = document.getElementById('result-section');
const citationResult = document.getElementById('citation-result');
const copyButton = document.getElementById('copy-button');
const editButton = document.getElementById('edit-button');
const editSection = document.getElementById('edit-section');
const citationEdit = document.getElementById('citation-edit');
const saveEditButton = document.getElementById('save-edit');
const cancelEditButton = document.getElementById('cancel-edit');
const errorSection = document.getElementById('error-section');
const errorText = document.getElementById('error-text');

// サイドバー関連
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebarClose = document.getElementById('sidebar-close');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const geminiApiKeyInput = document.getElementById('gemini-api-key');
const toggleApiKeyButton = document.getElementById('toggle-api-key');
const enableAiAssistCheckbox = document.getElementById('enable-ai-assist');
const apiStatus = document.getElementById('api-status');

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadSettings();
    initializeManualForms();
    
    // デバッグ: 要素の存在確認
    console.log('Edit button element:', editButton);
    console.log('Edit section element:', editSection);
});

// 手動入力フォームの初期化
function initializeManualForms() {
    // Webサイト手動入力の日付を現在の日付に設定
    const websiteDateInput = document.getElementById('website-manual-date');
    if (websiteDateInput) {
        websiteDateInput.value = getCurrentDateString();
    }
    
    // Webサイト編集フォームの日付を現在の日付に設定
    const websiteEditDateInput = document.getElementById('website-edit-date');
    if (websiteEditDateInput) {
        websiteEditDateInput.value = getCurrentDateString();
    }
}

// イベントリスナーの設定
function setupEventListeners() {
    // タブ切り替え
    tabButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    // 入力方法の切り替え（全タブ共通）
    methodTabs.forEach(tab => {
        tab.addEventListener('click', () => switchInputMethod(tab.dataset.method));
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

    // DOI抽出
    extractDoiButton.addEventListener('click', extractFromDOI);
    doiTextInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') extractFromDOI();
    });

    // URL (DOI含む)抽出
    extractUrlDoiButton.addEventListener('click', extractFromUrlDoi);
    urlDoiTextInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') extractFromUrlDoi();
    });

    // Webサイト抽出
    extractWebsiteButton.addEventListener('click', extractWebsite);
    websiteUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') extractWebsite();
    });

    // コピーボタン
    copyButton.addEventListener('click', copyCitation);
    
    // 編集ボタン
    editButton.addEventListener('click', editCitation);
    saveEditButton.addEventListener('click', saveEditedCitation);
    cancelEditButton.addEventListener('click', cancelEdit);

    // 手動入力フォーム
    setupManualFormListeners();

    // サイドバー関連
    sidebarToggle.addEventListener('click', openSidebar);
    sidebarClose.addEventListener('click', closeSidebar);
    sidebarOverlay.addEventListener('click', closeSidebar);
    
    // API設定関連
    toggleApiKeyButton.addEventListener('click', toggleApiKeyVisibility);
    geminiApiKeyInput.addEventListener('input', updateApiKey);
    enableAiAssistCheckbox.addEventListener('change', toggleAiAssist);
}

// 設定の読み込み
function loadSettings() {
    const savedApiKey = localStorage.getItem('gemini-api-key');
    const savedAiAssist = localStorage.getItem('ai-assist-enabled') === 'true';
    
    if (savedApiKey) {
        geminiApiKeyInput.value = savedApiKey;
        geminiApiKey = savedApiKey;
    }
    
    enableAiAssistCheckbox.checked = savedAiAssist;
    aiAssistEnabled = savedAiAssist;
    
    updateApiStatus();
}

// サイドバー開閉
function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

// APIキー表示切り替え
function toggleApiKeyVisibility() {
    const input = geminiApiKeyInput;
    const icon = toggleApiKeyButton.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

// APIキー更新
function updateApiKey() {
    geminiApiKey = geminiApiKeyInput.value.trim();
    localStorage.setItem('gemini-api-key', geminiApiKey);
    updateApiStatus();
}

// AI補助機能切り替え
function toggleAiAssist() {
    aiAssistEnabled = enableAiAssistCheckbox.checked && geminiApiKey.length > 0;
    localStorage.setItem('ai-assist-enabled', aiAssistEnabled.toString());
    updateApiStatus();
}

// APIステータス更新
function updateApiStatus() {
    const statusIcon = apiStatus.querySelector('i');
    const statusText = apiStatus.querySelector('span');
    
    if (aiAssistEnabled && geminiApiKey.length > 0) {
        statusIcon.className = 'fas fa-circle status-active';
        statusText.textContent = '有効';
    } else {
        statusIcon.className = 'fas fa-circle status-inactive';
        statusText.textContent = '無効';
    }
}

// タブ切り替え
function switchTab(tabName) {
    tabButtons.forEach(btn => btn.classList.remove('active'));
    tabContents.forEach(content => content.classList.remove('active'));

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(`${tabName}-tab`).classList.add('active');

    hideResults();
}

// 入力方法の切り替え
function switchInputMethod(method) {
    methodTabs.forEach(tab => tab.classList.remove('active'));
    methodContents.forEach(content => content.classList.remove('active'));

    document.querySelector(`[data-method="${method}"]`).classList.add('active');
    document.getElementById(`${method}-input`).classList.add('active');

    // Webサイト手動入力の場合、現在の日付を設定
    if (method === 'website-manual') {
        const dateInput = document.getElementById('website-manual-date');
        if (dateInput) {
            dateInput.value = getCurrentDateString();
        }
    }

    hideResults();
}

// 共通のローディング管理関数
function showLoadingState(loadingElement) {
    hideResults();
    loadingElement.classList.remove('hidden');
}

function hideLoadingState(loadingElement) {
    loadingElement.classList.add('hidden');
}

// 共通のAPI呼び出し関数
async function makeApiCall(url, options = {}) {
    const defaultOptions = {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'CitationGenerator/1.0'
        },
        ...options
    };

    try {
        const response = await fetch(url, defaultOptions);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// 書籍検索（修正版）
async function searchBooks() {
    const query = bookSearchInput.value.trim();
    const searchType = searchTypeSelect.value;

    if (!query) {
        showError('検索キーワードを入力してください。');
        return;
    }

    showLoadingState(loading);

    try {
        // CORSプロキシを使用してGoogle Books APIにアクセス
        const searchQuery = searchType === 'isbn' 
            ? `isbn:${encodeURIComponent(query)}`
            : encodeURIComponent(query);
        
        const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${searchQuery}&langRestrict=ja&maxResults=5`;
        
        // 複数のCORSプロキシを試行
        const proxyUrls = [
            `https://api.allorigins.win/get?url=${encodeURIComponent(apiUrl)}`,
            `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`
        ];

        let data = null;
        let lastError = null;

        for (const proxyUrl of proxyUrls) {
            try {
                const response = await fetch(proxyUrl);
                if (response.ok) {
                    const proxyData = await response.json();
                    // allorigins.winの場合はcontentsプロパティを使用
                    const jsonData = proxyData.contents ? JSON.parse(proxyData.contents) : proxyData;
                    if (jsonData && (jsonData.items || jsonData.totalItems !== undefined)) {
                        data = jsonData;
                        break;
                    }
                }
            } catch (error) {
                lastError = error;
                console.warn(`プロキシ ${proxyUrl} でエラー:`, error);
                continue;
            }
        }

        hideLoadingState(loading);

        if (data && data.items && data.items.length > 0) {
            displaySearchResults(data.items);
        } else if (data && data.totalItems === 0) {
            showError('書籍が見つかりませんでした。検索キーワードを変更してお試しください。');
        } else {
            showError('書籍検索でエラーが発生しました。インターネット接続を確認するか、しばらく時間をおいてお試しください。');
        }
    } catch (error) {
        hideLoadingState(loading);
        showError('検索中にエラーが発生しました。インターネット接続を確認してください。');
        console.error('Book search error:', error);
    }
}

// 検索結果表示
function displaySearchResults(books) {
    searchResults.innerHTML = '';
    
    books.forEach((book) => {
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
    document.querySelectorAll('.search-item').forEach(item => {
        item.classList.remove('selected');
    });

    element.classList.add('selected');
    selectedBook = book;

    // 書籍情報を編集フォームに事前入力して表示
    const volumeInfo = book.volumeInfo;
    const authors = volumeInfo.authors ? volumeInfo.authors.join('・') : '';
    const title = volumeInfo.title || '';
    const publisher = volumeInfo.publisher || '';
    const publishedDate = volumeInfo.publishedDate ? volumeInfo.publishedDate.split('-')[0] : '';
    
    fillBookEditForm(authors, title, publisher, publishedDate);
    showBookEditForm();
}

// 書籍引用文献生成（オーバーロード対応）
function generateBookCitation(authorsOrBook, title = null, publisher = null, year = null) {
    let authors, bookTitle, bookPublisher, bookYear;
    
    if (typeof authorsOrBook === 'object' && authorsOrBook.volumeInfo) {
        // 書籍オブジェクトから生成
        const volumeInfo = authorsOrBook.volumeInfo;
        authors = volumeInfo.authors ? volumeInfo.authors.join('・') : '著者不明';
        bookTitle = volumeInfo.title || 'タイトル不明';
        bookPublisher = volumeInfo.publisher || '出版社不明';
        bookYear = volumeInfo.publishedDate ? volumeInfo.publishedDate.split('-')[0] : '発行年不明';
    } else {
        // 個別パラメータから生成
        authors = authorsOrBook || '著者不明';
        bookTitle = title || 'タイトル不明';
        bookPublisher = publisher || '出版社不明';
        bookYear = year || '発行年不明';
    }

    const citation = `${authors}(${bookYear}), ${bookTitle}, ${bookPublisher}`;
    
    // 引用文献を表示
    showResult(citation);
}

// 書籍手動入力フォームに情報を事前入力
function fillBookManualForm(authors, title, publisher, year) {
    const authorsInput = document.getElementById('book-manual-authors');
    const titleInput = document.getElementById('book-manual-title');
    const publisherInput = document.getElementById('book-manual-publisher');
    const yearInput = document.getElementById('book-manual-year');
    
    if (authorsInput) authorsInput.value = authors !== '著者不明' ? authors : '';
    if (titleInput) titleInput.value = title !== 'タイトル不明' ? title : '';
    if (publisherInput) publisherInput.value = publisher !== '出版社不明' ? publisher : '';
    if (yearInput) yearInput.value = year !== '発行年不明' ? year : '';
}

// 書籍手動入力フォームを表示
function showBookManualForm() {
    const bookTab = document.getElementById('book-tab');
    const manualTab = bookTab.querySelector('[data-method="book-manual"]');
    const manualContent = document.getElementById('book-manual-input');
    
    if (manualTab && manualContent) {
        // タブを手動入力に切り替え
        bookTab.querySelectorAll('.method-tab').forEach(tab => tab.classList.remove('active'));
        bookTab.querySelectorAll('.input-method-content').forEach(content => content.classList.remove('active'));
        
        manualTab.classList.add('active');
        manualContent.classList.add('active');
        
        // フォームを表示状態にする
        manualContent.style.display = 'block';
    }
}

// 論文抽出（J-STAGE）
async function extractPaper() {
    const url = jstageUrlInput.value.trim();

    if (!url) {
        showError('J-STAGEのURLを入力してください。');
        return;
    }

    if (!isValidUrl(url)) {
        showError('有効なURLを入力してください。');
        return;
    }

    if (!url.includes('jstage.jst.go.jp')) {
        showError('J-STAGEのURLを入力してください。他のサイトのURLは対応していません。');
        return;
    }

    showLoadingState(paperLoading);

    try {
        const basicInfo = extractPaperInfoFromUrl(url);
        
        if (aiAssistEnabled) {
            const aiExtractedInfo = await extractJstageInfoWithAI(url);
            hideLoadingState(paperLoading);
            
            if (aiExtractedInfo) {
                const combinedInfo = { ...basicInfo, ...aiExtractedInfo };
                showManualPaperForm(url, combinedInfo);
            } else {
                showManualPaperForm(url, basicInfo);
            }
        } else {
            try {
                const extractedInfo = await extractWithProxy(url);
                hideLoadingState(paperLoading);
                const combinedInfo = { ...basicInfo, ...extractedInfo };
                showManualPaperForm(url, combinedInfo);
            } catch {
                hideLoadingState(paperLoading);
                showManualPaperForm(url, basicInfo);
            }
        }
        
    } catch (error) {
        hideLoadingState(paperLoading);
        showManualPaperForm(url);
        console.error('Paper extraction error:', error);
    }
}

// 共通のプロキシ抽出関数（論文用）
async function extractWithProxy(url) {
    const proxyServices = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`
    ];

    for (const proxyUrl of proxyServices) {
        try {
            const response = await fetch(proxyUrl);
            if (response.ok) {
                const data = await response.json();
                if (data.contents || data.data) {
                    return parsePaperInfoFromHtml(data.contents || data.data, url);
                }
            }
        } catch (error) {
            continue;
        }
    }

    throw new Error('プロキシでの抽出に失敗しました');
}

// Webサイト抽出用のプロキシ関数（HTML文字列を返す）
async function extractWebsiteWithProxy(url) {
    const proxyServices = [
        `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
        `https://corsproxy.io/?${encodeURIComponent(url)}`
    ];

    for (const proxyUrl of proxyServices) {
        try {
            const response = await fetch(proxyUrl);
            if (response.ok) {
                const data = await response.json();
                if (data.contents || data.data) {
                    return data.contents || data.data; // HTML文字列をそのまま返す
                }
            }
        } catch (error) {
            continue;
        }
    }

    throw new Error('プロキシでの抽出に失敗しました');
}

// 構造化されたページデータ抽出関数
function extractStructuredPageData(html, url) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const extractedData = {
            metadata: extractMetadata(doc),
            content: extractContentElements(doc),
            structured: extractStructuredData(doc),
            url: url
        };
        
        return extractedData;
    } catch (error) {
        console.error('Structured data extraction error:', error);
        return null;
    }
}

// メタデータ抽出
function extractMetadata(doc) {
    const metadata = {};
    
    // 基本的なメタデータ
    const metaTags = [
        { key: 'title', selector: 'title' },
        { key: 'ogTitle', selector: 'meta[property="og:title"]', attr: 'content' },
        { key: 'twitterTitle', selector: 'meta[name="twitter:title"]', attr: 'content' },
        { key: 'siteName', selector: 'meta[property="og:site_name"]', attr: 'content' },
        { key: 'description', selector: 'meta[name="description"]', attr: 'content' },
        { key: 'ogDescription', selector: 'meta[property="og:description"]', attr: 'content' },
        
        // 学術論文用メタデータ
        { key: 'citationTitle', selector: 'meta[name="citation_title"]', attr: 'content' },
        { key: 'citationAuthors', selector: 'meta[name="citation_author"]', attr: 'content' },
        { key: 'citationJournal', selector: 'meta[name="citation_journal_title"]', attr: 'content' },
        { key: 'citationVolume', selector: 'meta[name="citation_volume"]', attr: 'content' },
        { key: 'citationIssue', selector: 'meta[name="citation_issue"]', attr: 'content' },
        { key: 'citationFirstPage', selector: 'meta[name="citation_firstpage"]', attr: 'content' },
        { key: 'citationLastPage', selector: 'meta[name="citation_lastpage"]', attr: 'content' },
        { key: 'citationDate', selector: 'meta[name="citation_publication_date"]', attr: 'content' },
        { key: 'citationDoi', selector: 'meta[name="citation_doi"]', attr: 'content' },
        
        // Dublin Core
        { key: 'dcTitle', selector: 'meta[name="DC.title"]', attr: 'content' },
        { key: 'dcCreator', selector: 'meta[name="DC.creator"]', attr: 'content' },
        { key: 'dcSource', selector: 'meta[name="DC.source"]', attr: 'content' },
        { key: 'dcDate', selector: 'meta[name="DC.date"]', attr: 'content' }
    ];
    
    metaTags.forEach(({ key, selector, attr }) => {
        const element = doc.querySelector(selector);
        if (element) {
            metadata[key] = attr ? element.getAttribute(attr) : element.textContent?.trim();
        }
    });
    
    return metadata;
}

// コンテンツ要素抽出
function extractContentElements(doc) {
    const content = {};
    
    // 1. Article要素のheader構造から優先抽出
    content.articleHeaders = extractArticleHeaders(doc);
    
    // 2. 一般的なタイトル要素の抽出（優先順位順）
    const titleSelectors = [
        'h1.title', 'h1.paper-title', 'h1.article-title', 'h1.entry-title',
        '.title:not(.journal-title)', '.paper-title', '.article-title',
        'h1', 'h2.title', '.main-title', '.content-title'
    ];
    content.titles = extractElementsBySelectors(doc, titleSelectors);
    
    // 3. 著者要素の抽出
    const authorSelectors = [
        '.authors', '.author-list', '.paper-authors', '.author-names',
        '.contributor-list', '.creators', '[class*="author"]:not([class*="journal"])',
        '.byline', '.author-info'
    ];
    content.authors = extractElementsBySelectors(doc, authorSelectors);
    
    // 4. 雑誌/サイト名要素の抽出
    const journalSelectors = [
        '.journal-title', '.publication-title', '.journal-name', '.source-title',
        '.container-title', '.journal', '[class*="journal"][class*="title"]',
        '.source', '.site-title', '.brand', '.logo'
    ];
    content.journals = extractElementsBySelectors(doc, journalSelectors);
    
    // 5. 数値情報の抽出
    const numberSelectors = [
        '.volume', '.issue', '.pages', '.page-range', '[class*="volume"]',
        '[class*="issue"]', '[class*="page"]'
    ];
    content.numbers = extractElementsBySelectors(doc, numberSelectors);
    
    return content;
}

// Article要素のheader構造から情報抽出
function extractArticleHeaders(doc) {
    const articleHeaders = [];
    
    // article > header の構造を検索
    const articles = doc.querySelectorAll('article');
    
    articles.forEach((article, articleIndex) => {
        const header = article.querySelector('header');
        if (header) {
            const headerInfo = {
                articleIndex: articleIndex,
                elements: {}
            };
            
            // header内の主要要素を抽出
            const headerSelectors = {
                title: [
                    'h1', 'h2', 'h3', '.title', '.headline', '.entry-title', 
                    '.post-title', '.article-title', '.header-title'
                ],
                subtitle: [
                    '.subtitle', '.subheading', '.summary', '.excerpt', '.lead'
                ],
                author: [
                    '.author', '.byline', '.author-name', '.contributor', 
                    '.writers', '[rel="author"]'
                ],
                date: [
                    'time', '.date', '.published', '.timestamp', '.publish-date',
                    '[datetime]', '.entry-date'
                ],
                category: [
                    '.category', '.section', '.topic', '.tag', '.genre'
                ],
                source: [
                    '.source', '.publication', '.site-name', '.brand'
                ]
            };
            
            // 各タイプの要素を抽出
            Object.entries(headerSelectors).forEach(([type, selectors]) => {
                headerInfo.elements[type] = [];
                
                selectors.forEach(selector => {
                    const elements = header.querySelectorAll(selector);
                    elements.forEach(element => {
                        const text = element.textContent?.trim();
                        const datetime = element.getAttribute('datetime');
                        
                        if (text && text.length > 0 && text.length < 500) {
                            headerInfo.elements[type].push({
                                selector: selector,
                                text: text,
                                datetime: datetime,
                                tagName: element.tagName.toLowerCase(),
                                confidence: calculateArticleHeaderConfidence(selector, text, type, element)
                            });
                        }
                    });
                });
                
                // 信頼度順にソート
                headerInfo.elements[type].sort((a, b) => b.confidence - a.confidence);
            });
            
            // 有効な情報が含まれているheaderのみ追加
            if (Object.values(headerInfo.elements).some(arr => arr.length > 0)) {
                articleHeaders.push(headerInfo);
            }
        }
    });
    
    return articleHeaders;
}

// Article header要素の信頼度計算
function calculateArticleHeaderConfidence(selector, text, type, element) {
    let confidence = 15; // article > header にあることで基本的に高い信頼度
    
    // セレクタベースの信頼度
    if (selector.includes('h1')) confidence += 8;
    else if (selector.includes('h2')) confidence += 6;
    else if (selector.includes('h3')) confidence += 4;
    
    if (selector.includes('.title')) confidence += 6;
    if (selector.includes('.headline')) confidence += 5;
    if (selector.includes('.author')) confidence += 5;
    if (selector.includes('[rel="author"]')) confidence += 7;
    if (selector.includes('time')) confidence += 6;
    if (selector.includes('[datetime]')) confidence += 7;
    
    // タイプ別の調整
    switch (type) {
        case 'title':
            if (text.length > 10 && text.length < 150) confidence += 3;
            break;
        case 'author':
            if (text.length > 2 && text.length < 100) confidence += 2;
            if (!/\d{4}/.test(text)) confidence += 2; // 年を含まない
            break;
        case 'date':
            if (element.getAttribute('datetime')) confidence += 5;
            if (/\d{4}/.test(text)) confidence += 3; // 年を含む
            break;
        case 'source':
            if (text.length > 2 && text.length < 50) confidence += 2;
            break;
    }
    
    // セマンティック要素の優遇
    if (element.tagName.toLowerCase() === 'time') confidence += 5;
    if (element.hasAttribute('itemProp')) confidence += 3;
    if (element.hasAttribute('rel')) confidence += 3;
    
    return confidence;
}

// セレクタ配列から要素を抽出
function extractElementsBySelectors(doc, selectors) {
    const results = [];
    
    selectors.forEach(selector => {
        const elements = doc.querySelectorAll(selector);
        elements.forEach(element => {
            const text = element.textContent?.trim();
            if (text && text.length > 0 && text.length < 500) {
                results.push({
                    selector: selector,
                    text: text,
                    confidence: calculateConfidence(selector, text)
                });
            }
        });
    });
    
    // 信頼度順にソート
    return results.sort((a, b) => b.confidence - a.confidence);
}

// 要素の信頼度を計算
function calculateConfidence(selector, text) {
    let confidence = 0;
    
    // セレクタベースの信頼度
    if (selector.includes('citation_')) confidence += 10;
    if (selector.includes('DC.')) confidence += 8;
    if (selector.includes('og:')) confidence += 6;
    if (selector.includes('h1')) confidence += 5;
    if (selector.includes('.title')) confidence += 4;
    if (selector.includes('#')) confidence += 3;
    
    // テキスト内容ベースの信頼度
    if (text.length > 10 && text.length < 200) confidence += 2;
    if (!/\d{4,}/.test(text) && text.length < 100) confidence += 1; // 長い数字列を含まない短いテキスト
    
    return confidence;
}

// 構造化データ抽出
function extractStructuredData(doc) {
    const structured = {};
    
    // JSON-LD抽出
    const jsonLdElements = doc.querySelectorAll('script[type="application/ld+json"]');
    structured.jsonLd = [];
    jsonLdElements.forEach(element => {
        try {
            const data = JSON.parse(element.textContent);
            structured.jsonLd.push(data);
        } catch (error) {
            // JSON解析エラーは無視
        }
    });
    
    // microdata抽出
    structured.microdata = extractMicrodata(doc);
    
    return structured;
}

// microdata抽出
function extractMicrodata(doc) {
    const microdata = {};
    const itemElements = doc.querySelectorAll('[itemscope]');
    
    itemElements.forEach(element => {
        const itemType = element.getAttribute('itemtype');
        if (itemType) {
            const props = {};
            const propElements = element.querySelectorAll('[itemprop]');
            propElements.forEach(propElement => {
                const propName = propElement.getAttribute('itemprop');
                const propValue = propElement.textContent?.trim() || propElement.getAttribute('content');
                if (propName && propValue) {
                    props[propName] = propValue;
                }
            });
            microdata[itemType] = props;
        }
    });
    
    return microdata;
}

// URL妥当性チェック関数
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch {
        return false;
    }
}

// J-STAGEの情報をAIで抽出（改良版）
async function extractJstageInfoWithAI(url) {
    if (!aiAssistEnabled) {
        console.log('AI補助が無効です');
        return null;
    }

    if (!geminiApiKey) {
        console.warn('Gemini APIキーが設定されていません。AI補助機能を使用するには、APIキーを設定してください。');
        return null;
    }

    try {
        // まずページデータを構造化して抽出
        let structuredData = null;
        try {
            const proxyServices = [
                `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
                `https://corsproxy.io/?${encodeURIComponent(url)}`
            ];

            for (const proxyUrl of proxyServices) {
                try {
                    const response = await fetch(proxyUrl);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.contents || data.data) {
                            structuredData = extractStructuredPageData(data.contents || data.data, url);
                            if (structuredData) break;
                        }
                    }
                } catch (error) {
                    continue;
                }
            }
        } catch (error) {
            console.warn('構造化データの取得に失敗:', error);
        }

        // 構造化データがある場合はそれをAIに提供
        const prompt = structuredData 
            ? createStructuredPromptForJstage(url, structuredData)
            : createBasicPromptForJstage(url);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

            if (text) {
                const jsonMatch = text.match(/```json\s*(.*?)\s*```/s) || text.match(/```\s*(.*?)\s*```/s);
                const jsonText = jsonMatch ? jsonMatch[1] : text;

                try {
                    const result = JSON.parse(jsonText);
                    // 構造化データとの一致を検証
                    if (structuredData) {
                        return validateAndCorrectResult(result, structuredData);
                    }
                    return result;
                } catch (parseError) {
                    console.warn('JSON解析に失敗しましたが、部分的な情報を抽出します:', parseError);
                    return parsePartialInfo(text);
                }
            } else {
                console.warn('AIから有効なレスポンスが得られませんでした');
            }
        } else {
            const errorText = await response.text();
            console.error('Gemini API呼び出しに失敗:', response.status, errorText);
        }
    } catch (error) {
        console.error('AI J-STAGE抽出中にエラーが発生:', error.message || error);
    }
    
    return null;
}

// 構造化データを使用したプロンプト作成
function createStructuredPromptForJstage(url, structuredData) {
    const metadataInfo = structuredData.metadata;
    const contentInfo = structuredData.content;
    
    let extractedElements = "【ページから抽出された要素】\n";
    
    // メタデータ情報
    if (metadataInfo.citationTitle) extractedElements += `- citation_title: "${metadataInfo.citationTitle}"\n`;
    if (metadataInfo.citationAuthors) extractedElements += `- citation_author: "${metadataInfo.citationAuthors}"\n`;
    if (metadataInfo.citationJournal) extractedElements += `- citation_journal: "${metadataInfo.citationJournal}"\n`;
    if (metadataInfo.citationVolume) extractedElements += `- citation_volume: "${metadataInfo.citationVolume}"\n`;
    if (metadataInfo.citationIssue) extractedElements += `- citation_issue: "${metadataInfo.citationIssue}"\n`;
    if (metadataInfo.citationFirstPage) extractedElements += `- citation_firstpage: "${metadataInfo.citationFirstPage}"\n`;
    if (metadataInfo.citationDate) extractedElements += `- citation_date: "${metadataInfo.citationDate}"\n`;
    
    // コンテンツ要素（上位3つまで）
    if (contentInfo.titles?.length > 0) {
        extractedElements += "- タイトル候補:\n";
        contentInfo.titles.slice(0, 3).forEach(title => {
            extractedElements += `  - "${title.text}" (信頼度: ${title.confidence})\n`;
        });
    }
    
    if (contentInfo.authors?.length > 0) {
        extractedElements += "- 著者候補:\n";
        contentInfo.authors.slice(0, 3).forEach(author => {
            extractedElements += `  - "${author.text}" (信頼度: ${author.confidence})\n`;
        });
    }
    
    if (contentInfo.journals?.length > 0) {
        extractedElements += "- 雑誌名候補:\n";
        contentInfo.journals.slice(0, 3).forEach(journal => {
            extractedElements += `  - "${journal.text}" (信頼度: ${journal.confidence})\n`;
        });
    }

    return `あなたは学術論文の情報抽出の専門家です。以下のJ-STAGEページから抽出された構造化データを元に、正確な論文情報を選択してください。

URL: ${url}

${extractedElements}

【重要な制約事項】
1. 上記の抽出された要素の中から最も適切なものを選択してください
2. 抽出された要素にない情報は絶対に追加しないでください
3. 推測や想像で情報を補完してはいけません
4. 不明な項目は空文字列にしてください

【選択ルール】
- 最も信頼度の高い要素を優先してください
- citation_* メタデータがある場合はそれを最優先してください
- 著者名は日本語表記を優先し、姓名の間にスペースを入れない
- 複数著者は「・」で区切る

以下の形式のJSONで返してください：
{
  "authors": "選択した著者名",
  "title": "選択したタイトル",
  "journal": "選択した雑誌名",
  "volume": "選択した巻数",
  "issue": "選択した号数",
  "pages": "選択したページ範囲",
  "year": "選択した発表年"
}

抽出された要素にない情報は必ず空文字列 "" にしてください。JSONのみを返してください。`;
}

// 基本的なプロンプト（構造化データなしの場合）
function createBasicPromptForJstage(url) {
    return `あなたは学術論文の情報抽出の専門家です。以下のJ-STAGEのURLから、実際に存在する正確な論文情報のみを抽出してください。

URL: ${url}

【重要な制約事項】
1. 実際にページに記載されている情報のみを抽出してください
2. 推測や想像で情報を補完してはいけません
3. 情報が不明確な場合は空文字列にしてください
4. ハルシネーション（存在しない情報の生成）は絶対に避けてください

【抽出ルール】
- 著者名：日本語表記を優先し、姓名の間にスペースを入れない（例：田中太郎）
- 複数著者：「・」で区切る（例：田中太郎・佐藤花子）
- タイトル：ページに実際に表示されている日本語タイトル
- 雑誌名：正式名称のみ
- 数値：実際に記載されている数字のみ

以下の形式のJSONで返してください：
{
  "authors": "著者名（姓名間スペースなし、複数は・区切り）",
  "title": "実際のページに記載されている論文タイトル",
  "journal": "実際のページに記載されている雑誌名",
  "volume": "実際に記載されている巻数（数字のみ）",
  "issue": "実際に記載されている号数（数字のみ）",
  "pages": "実際に記載されているページ範囲",
  "year": "実際に記載されている発表年（4桁）"
}

情報が確認できない項目は必ず空文字列 "" にしてください。
JSONのみを返し、説明や推測は一切含めないでください。`;
}

// 結果の検証と修正
function validateAndCorrectResult(aiResult, structuredData) {
    const validated = { ...aiResult };
    
    // メタデータとの照合
    const metadata = structuredData.metadata;
    if (metadata.citationTitle && (!validated.title || validated.title === "")) {
        validated.title = metadata.citationTitle;
    }
    if (metadata.citationAuthors && (!validated.authors || validated.authors === "")) {
        validated.authors = metadata.citationAuthors.replace(/,\s*/g, '・');
    }
    if (metadata.citationJournal && (!validated.journal || validated.journal === "")) {
        validated.journal = metadata.citationJournal;
    }
    if (metadata.citationVolume && (!validated.volume || validated.volume === "")) {
        validated.volume = metadata.citationVolume;
    }
    if (metadata.citationIssue && (!validated.issue || validated.issue === "")) {
        validated.issue = metadata.citationIssue;
    }
    
    // 年の抽出
    if (metadata.citationDate && (!validated.year || validated.year === "")) {
        const yearMatch = metadata.citationDate.match(/(\d{4})/);
        if (yearMatch) {
            validated.year = yearMatch[1];
        }
    }
    
    // ページ情報の組み立て
    if (metadata.citationFirstPage && (!validated.pages || validated.pages === "")) {
        let pages = metadata.citationFirstPage;
        if (metadata.citationLastPage && metadata.citationLastPage !== metadata.citationFirstPage) {
            pages += `-${metadata.citationLastPage}`;
        }
        validated.pages = pages;
    }
    
    return validated;
}

// 部分的な情報の解析
function parsePartialInfo(text) {
    const info = {};
    
    const patterns = {
        title: /(?:title|タイトル)[:：]\s*"?([^"\n]+)"?/i,
        authors: /(?:author|著者)[:：]\s*"?([^"\n]+)"?/i,
        journal: /(?:journal|雑誌)[:：]\s*"?([^"\n]+)"?/i,
        volume: /(?:volume|巻)[:：]\s*"?(\d+)"?/i,
        issue: /(?:issue|号)[:：]\s*"?(\d+)"?/i,
        pages: /(?:pages|ページ)[:：]\s*"?([^"\n]+)"?/i,
        year: /(?:year|年)[:：]\s*"?(\d{4})"?/i
    };
    
    for (const [key, pattern] of Object.entries(patterns)) {
        const match = text.match(pattern);
        if (match) {
            info[key] = match[1].trim();
        }
    }
    
    return info;
}

// HTMLからの論文情報解析（改善版）
function parsePaperInfoFromHtml(html, url) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // より具体的なセレクタを使用
        const titleSelectors = [
            'h1.title', '.article-title', '.paper-title', 
            '.main-title', '.content-title', '.entry-title',
            'h1', 'h2.title', '[class*="title"]:not([class*="journal"])',
            '#title', '.title:not(.journal-title)'
        ];
        
        const authorSelectors = [
            '.authors', '.author-list', '.paper-authors', 
            '.author-names', '.contributor-list', '.creators',
            '[class*="author"]:not([class*="journal"])', 
            '.byline', '.author-info'
        ];
        
        const journalSelectors = [
            '.journal-title', '.publication-title', '.journal-name',
            '.source-title', '.container-title', '.journal',
            '[class*="journal"][class*="title"]', '.source'
        ];

        // 実際のコンテンツから抽出
        const contentTitle = findTextFromSelectors(doc, titleSelectors);
        const contentAuthors = findTextFromSelectors(doc, authorSelectors);
        const contentJournal = findTextFromSelectors(doc, journalSelectors);
        
        // 複数のメタデータソースを確認（優先順位付き）
        const metaSources = [
            // 学術論文用メタデータ（最優先）
            {
                title: doc.querySelector('meta[name="citation_title"]')?.getAttribute('content'),
                authors: doc.querySelector('meta[name="citation_author"]')?.getAttribute('content'),
                journal: doc.querySelector('meta[name="citation_journal_title"]')?.getAttribute('content'),
                volume: doc.querySelector('meta[name="citation_volume"]')?.getAttribute('content'),
                issue: doc.querySelector('meta[name="citation_issue"]')?.getAttribute('content'),
                pages: doc.querySelector('meta[name="citation_firstpage"]')?.getAttribute('content'),
                year: doc.querySelector('meta[name="citation_publication_date"]')?.getAttribute('content')
            },
            // Dublin Core メタデータ
            {
                title: doc.querySelector('meta[name="DC.title"]')?.getAttribute('content'),
                authors: doc.querySelector('meta[name="DC.creator"]')?.getAttribute('content'),
                journal: doc.querySelector('meta[name="DC.source"]')?.getAttribute('content'),
                year: doc.querySelector('meta[name="DC.date"]')?.getAttribute('content')
            },
            // Open Graph メタデータ
            {
                title: doc.querySelector('meta[property="og:title"]')?.getAttribute('content'),
                journal: doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content')
            }
        ];

        // 最も信頼できる情報を選択
        let bestMeta = metaSources[0]; // citation_* を最優先
        
        // メタデータの検証と選択
        for (const meta of metaSources) {
            if (meta.title && meta.title.length > 10 && !meta.title.includes('PDF')) {
                bestMeta = meta;
                break;
            }
        }

        // 年の抽出を改善
        let extractedYear = '';
        if (bestMeta.year) {
            const yearMatch = bestMeta.year.match(/(\d{4})/);
            extractedYear = yearMatch ? yearMatch[1] : '';
        }
        if (!extractedYear) {
            const urlYearMatch = url.match(/(\d{4})/);
            extractedYear = urlYearMatch ? urlYearMatch[1] : '';
        }

        // 著者名の処理を改善
        let processedAuthors = bestMeta.authors || contentAuthors || '著者不明';
        if (processedAuthors !== '著者不明') {
            // 複数著者の区切り文字を統一
            processedAuthors = processedAuthors
                .replace(/,\s*/g, '・')
                .replace(/;\s*/g, '・')
                .replace(/\s+and\s+/g, '・')
                .replace(/\s*・\s*/g, '・');
        }

        return {
            title: bestMeta.title || contentTitle || 'タイトル不明',
            authors: processedAuthors,
            journal: bestMeta.journal || contentJournal || '雑誌名不明',
            volume: bestMeta.volume || '',
            issue: bestMeta.issue || '',
            pages: bestMeta.pages || '',
            year: extractedYear
        };
        
    } catch (error) {
        console.error('HTML parsing error:', error);
        return {};
    }
}
// Webサイト情報解析（改善版）
function parseWebsiteInfo(html, url) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // より正確なタイトル抽出
        const titleSources = [
            doc.querySelector('title')?.textContent?.trim(),
            doc.querySelector('meta[property="og:title"]')?.getAttribute('content'),
            doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content'),
            doc.querySelector('h1')?.textContent?.trim(),
            doc.querySelector('.page-title')?.textContent?.trim(),
            doc.querySelector('.entry-title')?.textContent?.trim()
        ];

        // より正確なサイト名抽出
        const siteNameSources = [
            doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content'),
            doc.querySelector('meta[name="application-name"]')?.getAttribute('content'),
            doc.querySelector('meta[name="site_name"]')?.getAttribute('content'),
            doc.querySelector('.site-title')?.textContent?.trim(),
            doc.querySelector('.brand')?.textContent?.trim(),
            doc.querySelector('.logo')?.textContent?.trim()
        ];

        // 最適なタイトルを選択（短すぎるものや一般的すぎるものを除外）
        let pageTitle = 'ページタイトル不明';
        for (const title of titleSources) {
            if (title && title.length > 5 && title.length < 200 && 
                !title.includes('404') && !title.includes('Error')) {
                pageTitle = title;
                break;
            }
        }

        // 最適なサイト名を選択
        let siteName = getDomainName(url);
        for (const name of siteNameSources) {
            if (name && name.length > 2 && name.length < 100 && 
                name !== pageTitle) {
                siteName = name;
                break;
            }
        }

        const currentDate = getCurrentDateString();
        generateWebsiteCitation(pageTitle, siteName, url, currentDate);
    } catch (error) {
        showError('Webサイト情報の解析中にエラーが発生しました。');
        console.error('Website parsing error:', error);
    }
}

// セレクタからテキストを検索
function findTextFromSelectors(doc, selectors) {
    for (const selector of selectors) {
        const element = doc.querySelector(selector);
        if (element && element.textContent.trim()) {
            return element.textContent.trim();
        }
    }
    return null;
}

// URLから論文情報を抽出
function extractPaperInfoFromUrl(url) {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        
        if (pathParts.length >= 4) {
            const journalCode = pathParts[2];
            const volumeIssue = pathParts[3];
            
            const volumeMatch = volumeIssue.match(/(\d+)_(\d+)/);
            if (volumeMatch) {
                return {
                    journal: journalCode.replace(/_/g, ' ').toUpperCase(),
                    volume: volumeMatch[1],
                    issue: volumeMatch[2]
                };
            }
        }
        
        return {};
    } catch (error) {
        return {};
    }
}

// DOIから論文情報を抽出
async function extractFromDOI() {
    const doiText = doiTextInput.value.trim();

    if (!doiText) {
        showError('DOIを入力してください。');
        return;
    }

    if (!isValidDoi(doiText)) {
        showError('正しいDOI形式を入力してください（例: 10.1000/182）。');
        return;
    }

    showLoadingState(paperLoading);
    await extractFromDOIInternal(doiText, `DOI: ${doiText}`);
}

// DOI形式チェック
function isValidDoi(doi) {
    return /^10\.\d{4,}\/\S+$/.test(doi);
}

// URL (DOI含む)から抽出
async function extractFromUrlDoi() {
    const url = urlDoiTextInput.value.trim();

    if (!url) {
        showError('URLを入力してください。');
        return;
    }

    if (!isValidUrl(url)) {
        showError('有効なURLを入力してください。');
        return;
    }

    showLoadingState(paperLoading);

    try {
        const extractedDoi = extractDoiFromUrl(url);
        
        if (extractedDoi) {
            hideLoadingState(paperLoading);
            await extractFromDOIInternal(extractedDoi, `URL: ${url}`);
        } else if (aiAssistEnabled) {
            const aiExtractedDoi = await extractDoiWithAI(url);
            hideLoadingState(paperLoading);
            
            if (aiExtractedDoi) {
                await extractFromDOIInternal(aiExtractedDoi, `URL (AI抽出): ${url}`);
            } else {
                showError('URLからDOIを見つけることができませんでした。DOIが含まれるURLであることを確認してください。');
            }
        } else {
            hideLoadingState(paperLoading);
            showError('URLからDOIを見つけることができませんでした。AI補助機能を有効にするとより正確な抽出が可能です。');
        }
    } catch (error) {
        hideLoadingState(paperLoading);
        showError('URL処理中にエラーが発生しました。');
        console.error('URL DOI extraction error:', error);
    }
}

// URLからDOI抽出
function extractDoiFromUrl(url) {
    const doiPatterns = [
        /doi\.org\/(.*)$/,
        /dx\.doi\.org\/(.*)$/,
        /doi:(.*)$/,
        /DOI:(.*)$/,
        /\/doi\/(.*)$/,
        /doi=(.*)$/,
        /doi\/full\/(.*)$/,
        /doi\/abs\/(.*)$/
    ];
    
    for (const pattern of doiPatterns) {
        const match = url.match(pattern);
        if (match) {
            let doi = match[1];
            doi = decodeURIComponent(doi);
            doi = doi.replace(/[?&#].*$/, '');
            if (isValidDoi(doi)) {
                return doi;
            }
        }
    }
    
    return null;
}

// DOI抽出の内部処理
async function extractFromDOIInternal(doi, sourceInfo) {
    try {
        const crossRefUrl = `https://api.crossref.org/works/${encodeURIComponent(doi)}`;
        
        const data = await makeApiCall(crossRefUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'CitationGenerator/1.0 (mailto:example@email.com)'
            }
        });

        hideLoadingState(paperLoading);

        if (data.status === 'ok' && data.message) {
            parseCrossRefData(data.message, sourceInfo);
        } else {
            showError('DOIから論文情報を取得できませんでした。DOIを確認してください。');
        }
    } catch (error) {
        hideLoadingState(paperLoading);
        if (error.message.includes('404')) {
            showError('指定されたDOIは見つかりませんでした。DOIを確認してください。');
        } else {
            showError('DOI検索中にエラーが発生しました。しばらく時間をおいてお試しください。');
        }
        console.error('DOI extraction error:', error);
    }
}

// AI補助機能でDOI抽出
async function extractDoiWithAI(url) {
    if (!aiAssistEnabled) {
        console.log('AI補助が無効です');
        return null;
    }

    if (!geminiApiKey) {
        console.warn('Gemini APIキーが設定されていません。AI補助機能を使用するには、APIキーを設定してください。');
        return null;
    }

    try {
        const prompt = `以下のURLからDOI（Digital Object Identifier）を抽出してください。DOIは "10." で始まる形式です。

URL: ${url}

DOIが見つかった場合は、DOIのみを返してください（例: 10.1000/182）。
DOIが見つからない場合は "NOT_FOUND" と返してください。`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

            if (text && text !== 'NOT_FOUND' && isValidDoi(text)) {
                return text;
            } else if (!text) {
                console.warn('AIから有効なレスポンスが得られませんでした');
            } else {
                console.log('AIがDOIを検出できませんでした');
            }
        } else {
            const errorText = await response.text();
            console.error('Gemini API呼び出しに失敗:', response.status, errorText);
        }
    } catch (error) {
        console.error('AIによるDOI抽出中にエラーが発生:', error.message || error);
    }

    return null;
}

// CrossRefからの論文データを解析
function parseCrossRefData(work, sourceInfo) {
    try {
        const authors = work.author ? work.author.map(author => {
            const given = author.given || '';
            const family = author.family || '';
            // 姓名の間にスペースを入れない
            return given ? `${family}${given}` : family;
        }).join('・') : '著者不明';

        const title = work.title && work.title[0] ? work.title[0] : 'タイトル不明';
        const journal = work['container-title'] && work['container-title'][0] 
            ? work['container-title'][0] 
            : '雑誌名不明';

        const volume = work.volume || '';
        const issue = work.issue || '';
        const pages = work.page || '';

        let year = '';
        if (work.published && work.published['date-parts'] && work.published['date-parts'][0]) {
            year = work.published['date-parts'][0][0].toString();
        } else if (work['published-online'] && work['published-online']['date-parts'] && work['published-online']['date-parts'][0]) {
            year = work['published-online']['date-parts'][0][0].toString();
        } else {
            year = '発表年不明';
        }

        const prefilledData = {
            authors: authors,
            title: title,
            journal: journal,
            volume: volume,
            issue: issue,
            pages: pages,
            year: year,
            doi: work.DOI
        };

        showManualPaperForm(sourceInfo, prefilledData);
        
    } catch (error) {
        showError('論文情報の解析中にエラーが発生しました。');
        console.error('CrossRef data parsing error:', error);
    }
}

// Webサイト抽出
async function extractWebsite() {
    const url = websiteUrlInput.value.trim();

    if (!url) {
        showError('WebサイトのURLを入力してください。');
        return;
    }

    if (!isValidUrl(url)) {
        showError('有効なURLを入力してください。');
        return;
    }

    if (url.includes('jstage.jst.go.jp')) {
        showError('J-STAGEのURLは論文タブで処理してください。');
        return;
    }

    showLoadingState(websiteLoading);

    try {
        if (aiAssistEnabled) {
            const aiExtractedInfo = await extractWebsiteInfoWithAI(url);
            hideLoadingState(websiteLoading);
            
            if (aiExtractedInfo) {
                const currentDate = getCurrentDateString();
                generateWebsiteCitation(aiExtractedInfo.title, aiExtractedInfo.siteName, url, currentDate);
                return;
            }
        }

        try {
            const htmlContent = await extractWebsiteWithProxy(url);
            hideLoadingState(websiteLoading);
            parseWebsiteInfo(htmlContent, url);
        } catch {
            hideLoadingState(websiteLoading);
            showManualWebsiteForm(url);
        }
        
    } catch (error) {
        hideLoadingState(websiteLoading);
        showManualWebsiteForm(url);
        console.error('Website extraction error:', error);
    }
}

// AI補助機能でWebサイト情報抽出（改良版）
async function extractWebsiteInfoWithAI(url) {
    if (!aiAssistEnabled) {
        console.log('AI補助が無効です');
        return null;
    }

    if (!geminiApiKey) {
        console.warn('Gemini APIキーが設定されていません。AI補助機能を使用するには、APIキーを設定してください。');
        return null;
    }

    try {
        // まずページデータを構造化して抽出
        let structuredData = null;
        try {
            const proxyServices = [
                `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
                `https://corsproxy.io/?${encodeURIComponent(url)}`
            ];

            for (const proxyUrl of proxyServices) {
                try {
                    const response = await fetch(proxyUrl);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.contents || data.data) {
                            structuredData = extractStructuredPageData(data.contents || data.data, url);
                            if (structuredData) break;
                        }
                    }
                } catch (error) {
                    continue;
                }
            }
        } catch (error) {
            console.warn('構造化データの取得に失敗:', error);
        }

        // 構造化データがある場合はそれをAIに提供
        const prompt = structuredData 
            ? createStructuredPromptForWebsite(url, structuredData)
            : createBasicPromptForWebsite(url);

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

            if (text) {
                const jsonMatch = text.match(/```json\s*(.*?)\s*```/s) || text.match(/```\s*(.*?)\s*```/s);
                const jsonText = jsonMatch ? jsonMatch[1] : text;

                try {
                    const result = JSON.parse(jsonText);
                    // 構造化データとの一致を検証
                    if (structuredData) {
                        return validateAndCorrectWebsiteResult(result, structuredData, url);
                    }
                    return result;
                } catch (parseError) {
                    console.warn('Webサイト情報のJSON解析に失敗:', parseError);
                    return {
                        title: 'ページタイトル不明',
                        siteName: getDomainName(url)
                    };
                }
            } else {
                console.warn('AIから有効なレスポンスが得られませんでした');
            }
        } else {
            const errorText = await response.text();
            console.error('Gemini API呼び出しに失敗:', response.status, errorText);
        }
    } catch (error) {
        console.error('AIによるWebサイト抽出中にエラーが発生:', error.message || error);
    }
    
    return null;
}

// 構造化データを使用したWebサイト用プロンプト作成
function createStructuredPromptForWebsite(url, structuredData) {
    const metadataInfo = structuredData.metadata;
    const contentInfo = structuredData.content;
    
    let extractedElements = "【ページから抽出された要素】\n";
    
    // 1. Article Header情報（最優先）
    if (contentInfo.articleHeaders?.length > 0) {
        extractedElements += "【Article Header構造から抽出（最優先）】\n";
        contentInfo.articleHeaders.forEach((articleHeader, index) => {
            extractedElements += `- Article ${index + 1}:\n`;
            
            // タイトル情報
            if (articleHeader.elements.title?.length > 0) {
                extractedElements += "  - タイトル:\n";
                articleHeader.elements.title.slice(0, 2).forEach(title => {
                    extractedElements += `    - "${title.text}" (信頼度: ${title.confidence}, ${title.tagName}${title.selector})\n`;
                });
            }
            
            // 著者情報
            if (articleHeader.elements.author?.length > 0) {
                extractedElements += "  - 著者:\n";
                articleHeader.elements.author.slice(0, 2).forEach(author => {
                    extractedElements += `    - "${author.text}" (信頼度: ${author.confidence}, ${author.tagName}${author.selector})\n`;
                });
            }
            
            // 日付情報
            if (articleHeader.elements.date?.length > 0) {
                extractedElements += "  - 日付:\n";
                articleHeader.elements.date.slice(0, 2).forEach(date => {
                    const datetimeInfo = date.datetime ? ` datetime="${date.datetime}"` : '';
                    extractedElements += `    - "${date.text}" (信頼度: ${date.confidence}, ${date.tagName}${date.selector}${datetimeInfo})\n`;
                });
            }
            
            // ソース/サイト名情報
            if (articleHeader.elements.source?.length > 0) {
                extractedElements += "  - ソース/サイト名:\n";
                articleHeader.elements.source.slice(0, 2).forEach(source => {
                    extractedElements += `    - "${source.text}" (信頼度: ${source.confidence}, ${source.tagName}${source.selector})\n`;
                });
            }
        });
        extractedElements += "\n";
    }
    
    // 2. メタデータ情報
    extractedElements += "【メタデータ】\n";
    if (metadataInfo.title) extractedElements += `- <title>: "${metadataInfo.title}"\n`;
    if (metadataInfo.ogTitle) extractedElements += `- og:title: "${metadataInfo.ogTitle}"\n`;
    if (metadataInfo.twitterTitle) extractedElements += `- twitter:title: "${metadataInfo.twitterTitle}"\n`;
    if (metadataInfo.siteName) extractedElements += `- og:site_name: "${metadataInfo.siteName}"\n`;
    if (metadataInfo.description) extractedElements += `- description: "${metadataInfo.description}"\n`;
    extractedElements += "\n";
    
    // 3. 一般的なコンテンツ要素（上位3つまで）
    if (contentInfo.titles?.length > 0) {
        extractedElements += "【一般的なタイトル候補】\n";
        contentInfo.titles.slice(0, 3).forEach(title => {
            extractedElements += `- "${title.text}" (信頼度: ${title.confidence}, セレクタ: ${title.selector})\n`;
        });
        extractedElements += "\n";
    }
    
    if (contentInfo.journals?.length > 0) {
        extractedElements += "【サイト名候補】\n";
        contentInfo.journals.slice(0, 3).forEach(site => {
            extractedElements += `- "${site.text}" (信頼度: ${site.confidence}, セレクタ: ${site.selector})\n`;
        });
        extractedElements += "\n";
    }

    return `あなたはWebサイト情報抽出の専門家です。以下のページから抽出された構造化データを元に、正確なページ情報を選択してください。

URL: ${url}

${extractedElements}

【重要な制約事項】
1. 上記の抽出された要素の中から最も適切なものを選択してください
2. 抽出された要素にない情報は絶対に追加しないでください
3. 推測や想像で情報を補完してはいけません
4. 不明な項目は空文字列にしてください

【選択ルール】
- Article Header構造から抽出された情報を最優先してください（最も信頼性が高い）
- Article Header内では信頼度の高い要素を優先してください
- Article Headerが複数ある場合は、最も信頼度の高いタイトルを持つものを選択してください
- Article Headerがない場合は、メタデータ（og:title、<title>等）を次の優先度とします
- サイト名とページタイトルを混同しないでください
- 明らかに関連記事やナビゲーションのタイトルは除外してください
- <time>要素のdatetime属性がある場合は、それを日付情報として活用してください

以下の形式のJSONで返してください：
{
  "title": "選択したページタイトル",
  "siteName": "選択したサイト名"
}

抽出された要素にない情報は必ず空文字列 "" にしてください。JSONのみを返してください。`;
}

// 基本的なWebサイト用プロンプト（構造化データなしの場合）
function createBasicPromptForWebsite(url) {
    return `あなたはWebサイト情報抽出の専門家です。以下のURLにアクセスして、メインコンテンツから正確な情報を抽出してください。

URL: ${url}

【重要な制約事項】
1. 実際にページに記載されている情報のみを抽出してください
2. 推測や想像で情報を補完してはいけません
3. ハルシネーション（存在しない情報の生成）は絶対に避けてください

【抽出ルール】
- メインコンテンツのタイトルを抽出（サイドバーやおすすめ記事は除外）
- ニュースサイトの場合：記事本文のタイトルを抽出（関連記事やおすすめ記事のタイトルは無視）
- <title>タグ、<h1>タグ、メインコンテンツエリアを優先
- サイト名は公式名称のみ（記事タイトルと混同しない）

【除外すべき要素】
- サイドバーの関連記事タイトル
- おすすめ記事のタイトル
- 広告のタイトル
- ナビゲーションメニューのテキスト
- フッターの情報

以下の形式のJSONで返してください：
{
  "title": "メインコンテンツの実際のタイトル",
  "siteName": "実際のサイト名（組織名・会社名）"
}

情報が確認できない場合は、URLのドメイン名から推測してください。
JSONのみを返し、説明や推測は一切含めないでください。`;
}

// Webサイト結果の検証と修正
function validateAndCorrectWebsiteResult(aiResult, structuredData, url) {
    const validated = { ...aiResult };
    
    const metadata = structuredData.metadata;
    const content = structuredData.content;
    
    // タイトルの検証（優先順位: Article Header > メタデータ > 一般要素）
    if (!validated.title || validated.title === "") {
        // 1. Article Header から最優先で取得
        if (content.articleHeaders?.length > 0) {
            for (const articleHeader of content.articleHeaders) {
                if (articleHeader.elements.title?.length > 0) {
                    const bestTitle = articleHeader.elements.title[0]; // 信頼度順でソート済み
                    if (bestTitle.text.length > 5 && bestTitle.text.length < 200) {
                        validated.title = bestTitle.text;
                        break;
                    }
                }
            }
        }
        
        // 2. Article Headerがない場合はメタデータから取得
        if (!validated.title || validated.title === "") {
            if (metadata.ogTitle && metadata.ogTitle.length > 5 && metadata.ogTitle.length < 200) {
                validated.title = metadata.ogTitle;
            } else if (metadata.title && metadata.title.length > 5 && metadata.title.length < 200) {
                validated.title = metadata.title;
            } else if (content.titles?.length > 0) {
                validated.title = content.titles[0].text;
            }
        }
    }
    
    // サイト名の検証（優先順位: Article Header source > メタデータ > ドメイン名）
    if (!validated.siteName || validated.siteName === "") {
        // 1. Article Header から取得
        if (content.articleHeaders?.length > 0) {
            for (const articleHeader of content.articleHeaders) {
                if (articleHeader.elements.source?.length > 0) {
                    const bestSource = articleHeader.elements.source[0]; // 信頼度順でソート済み
                    if (bestSource.text.length > 2 && bestSource.text.length < 100) {
                        validated.siteName = bestSource.text;
                        break;
                    }
                }
            }
        }
        
        // 2. Article Headerがない場合はメタデータから取得
        if (!validated.siteName || validated.siteName === "") {
            if (metadata.siteName && metadata.siteName.length > 2 && metadata.siteName.length < 100) {
                validated.siteName = metadata.siteName;
            } else {
                validated.siteName = getDomainName(url);
            }
        }
    }
    
    // 日付情報の追加（Article Headerから取得可能な場合）
    if (!validated.accessDate && content.articleHeaders?.length > 0) {
        for (const articleHeader of content.articleHeaders) {
            if (articleHeader.elements.date?.length > 0) {
                const bestDate = articleHeader.elements.date[0];
                if (bestDate.datetime) {
                    // ISO形式の日付を日本の形式に変換
                    try {
                        const dateObj = new Date(bestDate.datetime);
                        validated.publishDate = dateObj.toLocaleDateString('ja-JP', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                        }).replace(/\//g, '.');
                    } catch (error) {
                        // 日付解析エラーは無視
                    }
                }
                break;
            }
        }
    }
    
    // 結果の最終検証
    if (!validated.title || validated.title === "") {
        validated.title = "ページタイトル不明";
    }
    if (!validated.siteName || validated.siteName === "") {
        validated.siteName = getDomainName(url);
    }
    
    return validated;
}

// 重複していたparseWebsiteInfo関数を削除（行1189に優れた実装が存在）

// Webサイト引用文献生成
function generateWebsiteCitation(pageTitle, siteName, url, accessDate) {
    const citation = `${pageTitle}, ${siteName}, ${url} (${accessDate})`;
    showResult(citation);
    
    // 手動入力フォームに自動取得した情報を事前入力
    fillWebsiteManualForm(pageTitle, siteName, url, accessDate);
    showWebsiteManualForm();
}

// Webサイト手動入力フォームに情報を事前入力
function fillWebsiteManualForm(pageTitle, siteName, url, accessDate) {
    const titleInput = document.getElementById('website-manual-title');
    const siteInput = document.getElementById('website-manual-site');
    const urlInput = document.getElementById('website-manual-url');
    const dateInput = document.getElementById('website-manual-date');
    
    if (titleInput && pageTitle !== 'ページタイトル不明') titleInput.value = pageTitle;
    if (siteInput && siteName) siteInput.value = siteName;
    if (urlInput && url) urlInput.value = url;
    if (dateInput && accessDate) dateInput.value = accessDate;
}

// Webサイト手動入力フォームを表示
function showWebsiteManualForm() {
    const websiteTab = document.getElementById('website-tab');
    const manualTab = websiteTab.querySelector('[data-method="website-manual"]');
    const manualContent = document.getElementById('website-manual-input');
    
    if (manualTab && manualContent) {
        // タブを手動入力に切り替え
        websiteTab.querySelectorAll('.method-tab').forEach(tab => tab.classList.remove('active'));
        websiteTab.querySelectorAll('.input-method-content').forEach(content => content.classList.remove('active'));
        
        manualTab.classList.add('active');
        manualContent.classList.add('active');
        
        // フォームを表示状態にする
        manualContent.style.display = 'block';
    }
}

// 手動入力フォーム表示（論文用）
function showManualPaperForm(sourceInfo, prefilledData = null) {
    // インライン編集フォームを表示し、事前入力
    fillPaperEditForm(prefilledData);
    showPaperEditForm();
}

// 論文手動入力フォームに情報を事前入力
function fillPaperManualForm(prefilledData) {
    if (!prefilledData) return;
    
    const authorsInput = document.getElementById('paper-manual-authors');
    const titleInput = document.getElementById('paper-manual-title');
    const journalInput = document.getElementById('paper-manual-journal');
    const volumeInput = document.getElementById('paper-manual-volume');
    const issueInput = document.getElementById('paper-manual-issue');
    const pagesInput = document.getElementById('paper-manual-pages');
    const yearInput = document.getElementById('paper-manual-year');
    
    if (authorsInput && prefilledData.authors) authorsInput.value = prefilledData.authors;
    if (titleInput && prefilledData.title) titleInput.value = prefilledData.title;
    if (journalInput && prefilledData.journal) journalInput.value = prefilledData.journal;
    if (volumeInput && prefilledData.volume) volumeInput.value = prefilledData.volume;
    if (issueInput && prefilledData.issue) issueInput.value = prefilledData.issue;
    if (pagesInput && prefilledData.pages) pagesInput.value = prefilledData.pages;
    if (yearInput && prefilledData.year) yearInput.value = prefilledData.year;
}

// 論文手動入力フォームを表示
function showPaperManualForm() {
    const paperTab = document.getElementById('paper-tab');
    const manualTab = paperTab.querySelector('[data-method="paper-manual"]');
    const manualContent = document.getElementById('paper-manual-input');
    
    if (manualTab && manualContent) {
        // タブを手動入力に切り替え
        paperTab.querySelectorAll('.method-tab').forEach(tab => tab.classList.remove('active'));
        paperTab.querySelectorAll('.input-method-content').forEach(content => content.classList.remove('active'));
        
        manualTab.classList.add('active');
        manualContent.classList.add('active');
        
        // フォームを表示状態にする
        manualContent.style.display = 'block';
    }
}

// 手動入力から論文引用文献生成
function generateManualPaperCitation() {
    const authors = document.getElementById('manual-paper-authors').value.trim();
    const title = document.getElementById('manual-paper-title').value.trim();
    const journal = document.getElementById('manual-paper-journal').value.trim();
    const volume = document.getElementById('manual-paper-volume').value.trim();
    const issue = document.getElementById('manual-paper-issue').value.trim();
    let pages = document.getElementById('manual-paper-pages').value.trim();
    const year = document.getElementById('manual-paper-year').value.trim();
    
    const requiredFields = [
        { value: authors, name: '著者名' },
        { value: title, name: '論文タイトル' },
        { value: journal, name: '雑誌名' },
        { value: year, name: '発表年' }
    ];
    
    for (const field of requiredFields) {
        if (!field.value) {
            showError(`${field.name}を入力してください。`);
            return;
        }
    }
    
    if (!/^\d{4}$/.test(year)) {
        showError('発表年は4桁の西暦で入力してください（例: 2016）。');
        return;
    }
    
    if (pages && !pages.toLowerCase().startsWith('pp.')) {
        pages = `pp.${pages}`;
    }
    
    generatePaperCitation(authors, title, journal, volume, issue, pages, year);
    
    const manualForm = document.querySelector('.manual-form');
    if (manualForm) {
        manualForm.style.display = 'none';
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

// 手動入力フォーム表示（Webサイト用）
function showManualWebsiteForm(url) {
    // インライン編集フォームを表示し、事前入力
    fillWebsiteEditForm('', getDomainName(url), url, getCurrentDateString());
    showWebsiteEditForm();
}

// ドメイン名から推測されるサイト名を取得
function getDomainName(url) {
    try {
        const domain = new URL(url).hostname;
        const cleanDomain = domain.replace(/^www\./, '');
        const siteName = cleanDomain.split('.')[0];
        return siteName.charAt(0).toUpperCase() + siteName.slice(1);
    } catch {
        return '';
    }
}

// 現在の日付を取得
function getCurrentDateString() {
    const now = new Date();
    return now.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).replace(/\//g, '.');
}


// 結果表示
function showResult(citation) {
    citationResult.textContent = citation;
    resultSection.classList.remove('hidden');
    editSection.classList.add('hidden');
    errorSection.classList.add('hidden');
    
    // デバッグ: 編集ボタンの表示確認
    console.log('Result shown, edit button visible:', !editButton?.classList.contains('hidden'));
    console.log('Edit button element check:', document.getElementById('edit-button'));
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
    editSection.classList.add('hidden');
    errorSection.classList.add('hidden');
}

// 引用文献編集開始
function editCitation() {
    console.log('Edit function called');
    const citation = citationResult.textContent;
    console.log('Citation to edit:', citation);
    
    if (!citation || citation.trim() === '') {
        showError('編集する引用文献がありません。');
        return;
    }
    
    citationEdit.value = citation;
    editSection.classList.remove('hidden');
    resultSection.classList.add('hidden');
    citationEdit.focus();
    
    console.log('Edit section shown');
}

// 編集した引用文献を保存
function saveEditedCitation() {
    const editedCitation = citationEdit.value.trim();
    
    if (!editedCitation) {
        showError('引用文献が空欄です。内容を入力してください。');
        return;
    }
    
    citationResult.textContent = editedCitation;
    editSection.classList.add('hidden');
    resultSection.classList.remove('hidden');
    
    // 一時的に「保存完了」メッセージを表示
    const originalText = saveEditButton.innerHTML;
    saveEditButton.innerHTML = '<i class="fas fa-check"></i> 保存完了';
    saveEditButton.classList.add('copied');
    
    setTimeout(() => {
        saveEditButton.innerHTML = originalText;
        saveEditButton.classList.remove('copied');
    }, 2000);
}

// 編集をキャンセル
function cancelEdit() {
    editSection.classList.add('hidden');
    resultSection.classList.remove('hidden');
    citationEdit.value = '';
}

// 引用文献をコピー
function copyCitation() {
    const citation = citationResult.textContent;
    navigator.clipboard.writeText(citation).then(() => {
        const originalText = copyButton.innerHTML;
        copyButton.innerHTML = '<i class="fas fa-check"></i> コピー完了';
        copyButton.classList.add('copied');
        
        setTimeout(() => {
            copyButton.innerHTML = originalText;
            copyButton.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('コピーに失敗しました:', err);
        showError('コピーに失敗しました。');
    });
}

// 手動入力フォームのイベントリスナー設定
function setupManualFormListeners() {
    // 書籍手動入力
    const generateBookButton = document.getElementById('generate-book-manual-citation');
    const clearBookButton = document.getElementById('clear-book-manual');
    
    if (generateBookButton) {
        generateBookButton.addEventListener('click', generateBookManualCitation);
    }
    if (clearBookButton) {
        clearBookButton.addEventListener('click', clearBookManualForm);
    }

    // 論文手動入力
    const generatePaperButton = document.getElementById('generate-paper-manual-citation');
    const clearPaperButton = document.getElementById('clear-paper-manual');
    
    if (generatePaperButton) {
        generatePaperButton.addEventListener('click', generatePaperManualCitation);
    }
    if (clearPaperButton) {
        clearPaperButton.addEventListener('click', clearPaperManualForm);
    }

    // Webサイト手動入力
    const generateWebsiteButton = document.getElementById('generate-website-manual-citation');
    const clearWebsiteButton = document.getElementById('clear-website-manual');
    
    if (generateWebsiteButton) {
        generateWebsiteButton.addEventListener('click', generateWebsiteManualCitation);
    }
    if (clearWebsiteButton) {
        clearWebsiteButton.addEventListener('click', clearWebsiteManualForm);
    }

    // インライン編集フォーム
    const generateBookEditButton = document.getElementById('generate-book-edit-citation');
    const clearBookEditButton = document.getElementById('clear-book-edit');
    
    if (generateBookEditButton) {
        generateBookEditButton.addEventListener('click', generateBookEditCitation);
    }
    if (clearBookEditButton) {
        clearBookEditButton.addEventListener('click', clearBookEditForm);
    }

    const generatePaperEditButton = document.getElementById('generate-paper-edit-citation');
    const clearPaperEditButton = document.getElementById('clear-paper-edit');
    
    if (generatePaperEditButton) {
        generatePaperEditButton.addEventListener('click', generatePaperEditCitation);
    }
    if (clearPaperEditButton) {
        clearPaperEditButton.addEventListener('click', clearPaperEditForm);
    }

    const generateWebsiteEditButton = document.getElementById('generate-website-edit-citation');
    const clearWebsiteEditButton = document.getElementById('clear-website-edit');
    
    if (generateWebsiteEditButton) {
        generateWebsiteEditButton.addEventListener('click', generateWebsiteEditCitation);
    }
    if (clearWebsiteEditButton) {
        clearWebsiteEditButton.addEventListener('click', clearWebsiteEditForm);
    }
}

// 書籍手動入力からの引用文献生成
function generateBookManualCitation() {
    const authors = document.getElementById('book-manual-authors').value.trim();
    const title = document.getElementById('book-manual-title').value.trim();
    const publisher = document.getElementById('book-manual-publisher').value.trim();
    const year = document.getElementById('book-manual-year').value.trim();
    
    const requiredFields = [
        { value: authors, name: '著者名' },
        { value: title, name: '書籍タイトル' },
        { value: publisher, name: '出版社' },
        { value: year, name: '発行年' }
    ];
    
    for (const field of requiredFields) {
        if (!field.value) {
            showError(`${field.name}を入力してください。`);
            return;
        }
    }
    
    if (!/^\d{4}$/.test(year)) {
        showError('発行年は4桁の西暦で入力してください（例: 2023）。');
        return;
    }
    
    const citation = `${authors}(${year}), ${title}, ${publisher}`;
    showResult(citation);
}

// 論文手動入力からの引用文献生成
function generatePaperManualCitation() {
    const authors = document.getElementById('paper-manual-authors').value.trim();
    const title = document.getElementById('paper-manual-title').value.trim();
    const journal = document.getElementById('paper-manual-journal').value.trim();
    const volume = document.getElementById('paper-manual-volume').value.trim();
    const issue = document.getElementById('paper-manual-issue').value.trim();
    let pages = document.getElementById('paper-manual-pages').value.trim();
    const year = document.getElementById('paper-manual-year').value.trim();
    
    const requiredFields = [
        { value: authors, name: '著者名' },
        { value: title, name: '論文タイトル' },
        { value: journal, name: '雑誌名' },
        { value: year, name: '発表年' }
    ];
    
    for (const field of requiredFields) {
        if (!field.value) {
            showError(`${field.name}を入力してください。`);
            return;
        }
    }
    
    if (!/^\d{4}$/.test(year)) {
        showError('発表年は4桁の西暦で入力してください（例: 2023）。');
        return;
    }
    
    if (pages && !pages.toLowerCase().startsWith('pp.')) {
        pages = `pp.${pages}`;
    }
    
    generatePaperCitation(authors, title, journal, volume, issue, pages, year);
}

// Webサイト手動入力からの引用文献生成
function generateWebsiteManualCitation() {
    const title = document.getElementById('website-manual-title').value.trim();
    const siteName = document.getElementById('website-manual-site').value.trim();
    const url = document.getElementById('website-manual-url').value.trim();
    const accessDate = document.getElementById('website-manual-date').value.trim();
    
    const requiredFields = [
        { value: title, name: 'ページタイトル' },
        { value: siteName, name: 'サイト名' },
        { value: url, name: 'URL' },
        { value: accessDate, name: '閲覧年月日' }
    ];
    
    for (const field of requiredFields) {
        if (!field.value) {
            showError(`${field.name}を入力してください。`);
            return;
        }
    }
    
    if (!isValidUrl(url)) {
        showError('有効なURLを入力してください。');
        return;
    }
    
    generateWebsiteCitation(title, siteName, url, accessDate);
}

// フォームクリア機能
function clearBookManualForm() {
    document.getElementById('book-manual-authors').value = '';
    document.getElementById('book-manual-title').value = '';
    document.getElementById('book-manual-publisher').value = '';
    document.getElementById('book-manual-year').value = '';
    hideResults();
}

function clearPaperManualForm() {
    document.getElementById('paper-manual-authors').value = '';
    document.getElementById('paper-manual-title').value = '';
    document.getElementById('paper-manual-journal').value = '';
    document.getElementById('paper-manual-volume').value = '';
    document.getElementById('paper-manual-issue').value = '';
    document.getElementById('paper-manual-pages').value = '';
    document.getElementById('paper-manual-year').value = '';
    hideResults();
}

function clearWebsiteManualForm() {
    document.getElementById('website-manual-title').value = '';
    document.getElementById('website-manual-site').value = '';
    document.getElementById('website-manual-url').value = '';
    document.getElementById('website-manual-date').value = getCurrentDateString();
    hideResults();
}

// インライン編集フォーム表示機能
function showBookEditForm() {
    const editForm = document.getElementById('book-edit-form');
    if (editForm) {
        editForm.classList.remove('hidden');
    }
}

function showPaperEditForm() {
    const editForm = document.getElementById('paper-edit-form');
    if (editForm) {
        editForm.classList.remove('hidden');
    }
}

function showWebsiteEditForm() {
    const editForm = document.getElementById('website-edit-form');
    if (editForm) {
        editForm.classList.remove('hidden');
    }
}

// インライン編集フォームの事前入力機能
function fillBookEditForm(authors, title, publisher, year) {
    const authorsInput = document.getElementById('book-edit-authors');
    const titleInput = document.getElementById('book-edit-title');
    const publisherInput = document.getElementById('book-edit-publisher');
    const yearInput = document.getElementById('book-edit-year');
    
    if (authorsInput && authors) authorsInput.value = authors;
    if (titleInput && title) titleInput.value = title;
    if (publisherInput && publisher) publisherInput.value = publisher;
    if (yearInput && year) yearInput.value = year;
}

function fillPaperEditForm(prefilledData) {
    if (!prefilledData) return;
    
    const authorsInput = document.getElementById('paper-edit-authors');
    const titleInput = document.getElementById('paper-edit-title');
    const journalInput = document.getElementById('paper-edit-journal');
    const volumeInput = document.getElementById('paper-edit-volume');
    const issueInput = document.getElementById('paper-edit-issue');
    const pagesInput = document.getElementById('paper-edit-pages');
    const yearInput = document.getElementById('paper-edit-year');
    
    if (authorsInput && prefilledData.authors) authorsInput.value = prefilledData.authors;
    if (titleInput && prefilledData.title) titleInput.value = prefilledData.title;
    if (journalInput && prefilledData.journal) journalInput.value = prefilledData.journal;
    if (volumeInput && prefilledData.volume) volumeInput.value = prefilledData.volume;
    if (issueInput && prefilledData.issue) issueInput.value = prefilledData.issue;
    if (pagesInput && prefilledData.pages) pagesInput.value = prefilledData.pages;
    if (yearInput && prefilledData.year) yearInput.value = prefilledData.year;
}

function fillWebsiteEditForm(title, siteName, url, accessDate) {
    const titleInput = document.getElementById('website-edit-title');
    const siteInput = document.getElementById('website-edit-site');
    const urlInput = document.getElementById('website-edit-url');
    const dateInput = document.getElementById('website-edit-date');
    
    if (titleInput && title) titleInput.value = title;
    if (siteInput && siteName) siteInput.value = siteName;
    if (urlInput && url) urlInput.value = url;
    if (dateInput && accessDate) dateInput.value = accessDate;
}

// インライン編集フォームのクリア機能
function clearBookEditForm() {
    document.getElementById('book-edit-authors').value = '';
    document.getElementById('book-edit-title').value = '';
    document.getElementById('book-edit-publisher').value = '';
    document.getElementById('book-edit-year').value = '';
    hideResults();
}

function clearPaperEditForm() {
    document.getElementById('paper-edit-authors').value = '';
    document.getElementById('paper-edit-title').value = '';
    document.getElementById('paper-edit-journal').value = '';
    document.getElementById('paper-edit-volume').value = '';
    document.getElementById('paper-edit-issue').value = '';
    document.getElementById('paper-edit-pages').value = '';
    document.getElementById('paper-edit-year').value = '';
    hideResults();
}

function clearWebsiteEditForm() {
    document.getElementById('website-edit-title').value = '';
    document.getElementById('website-edit-site').value = '';
    document.getElementById('website-edit-url').value = '';
    document.getElementById('website-edit-date').value = getCurrentDateString();
    hideResults();
}

// インライン編集フォームの送信処理
function generateBookEditCitation() {
    const authors = document.getElementById('book-edit-authors').value.trim();
    const title = document.getElementById('book-edit-title').value.trim();
    const publisher = document.getElementById('book-edit-publisher').value.trim();
    const year = document.getElementById('book-edit-year').value.trim();
    
    const requiredFields = [
        { value: authors, name: '著者名' },
        { value: title, name: '書籍タイトル' },
        { value: publisher, name: '出版社' },
        { value: year, name: '発行年' }
    ];
    
    for (const field of requiredFields) {
        if (!field.value) {
            showError(`${field.name}を入力してください。`);
            return;
        }
    }
    
    generateBookCitation(authors, title, publisher, year);
}

function generatePaperEditCitation() {
    const authors = document.getElementById('paper-edit-authors').value.trim();
    const title = document.getElementById('paper-edit-title').value.trim();
    const journal = document.getElementById('paper-edit-journal').value.trim();
    const volume = document.getElementById('paper-edit-volume').value.trim();
    const issue = document.getElementById('paper-edit-issue').value.trim();
    const pages = document.getElementById('paper-edit-pages').value.trim();
    const year = document.getElementById('paper-edit-year').value.trim();
    
    const requiredFields = [
        { value: authors, name: '著者名' },
        { value: title, name: '論文タイトル' },
        { value: journal, name: '雑誌名' },
        { value: year, name: '発表年' }
    ];
    
    for (const field of requiredFields) {
        if (!field.value) {
            showError(`${field.name}を入力してください。`);
            return;
        }
    }
    
    generatePaperCitation(authors, title, journal, volume, issue, pages, year);
}

function generateWebsiteEditCitation() {
    const title = document.getElementById('website-edit-title').value.trim();
    const siteName = document.getElementById('website-edit-site').value.trim();
    const url = document.getElementById('website-edit-url').value.trim();
    const accessDate = document.getElementById('website-edit-date').value.trim();
    
    const requiredFields = [
        { value: title, name: 'ページタイトル' },
        { value: siteName, name: 'サイト名' },
        { value: url, name: 'URL' },
        { value: accessDate, name: '閲覧年月日' }
    ];
    
    for (const field of requiredFields) {
        if (!field.value) {
            showError(`${field.name}を入力してください。`);
            return;
        }
    }
    
    if (!isValidUrl(url)) {
        showError('有効なURLを入力してください。');
        return;
    }
    
    generateWebsiteCitation(title, siteName, url, accessDate);
}
