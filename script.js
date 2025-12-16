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

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    initializeManualForms();
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
    let url = jstageUrlInput.value.trim();

    if (!url) {
        showError('J-STAGEのURLを入力してください。');
        return;
    }

    if (!isValidUrl(url)) {
        showError('有効なURLを入力してください。');
        return;
    }

    // Attempt to extract DOI first, regardless of J-STAGE URL.
    const extractedDoi = extractDoiFromUrl(url);
    if (extractedDoi) {
        showLoadingState(paperLoading); // Show loading before DOI extraction
        await extractFromDOIInternal(extractedDoi, `URL: ${url}`);
        return; // Exit after processing as DOI
    }

    if (!url.includes('jstage.jst.go.jp')) {
        showError('J-STAGEのURLを入力してください。他のサイトのURLは対応していません。');
        return;
    }

    const originalUrl = url;
    // PDFのURLだった場合、記事ページのURLに変換
    if (url.includes('/_pdf')) {
        url = url.replace('/_pdf', '/_article/-char/ja');
    }

    showLoadingState(paperLoading);

    try {
        // URLから基本的な情報を抽出（フォールバック用）
        const basicInfo = extractPaperInfoFromUrl(originalUrl);

        try {
            // プロキシ経由でHTMLを取得し、詳細情報を抽出
            const extractedInfo = await extractWithProxy(url);
            hideLoadingState(paperLoading);
            
            // 抽出した情報と基本情報をマージ
            const combinedInfo = { ...basicInfo, ...extractedInfo };
            
            // ユーザーが確認・編集できるようにフォームに情報を設定して表示
            showManualPaperForm(originalUrl, combinedInfo);

        } catch (proxyError) {
            // プロキシでの抽出に失敗した場合は、URLから抽出した基本情報のみでフォームを表示
            hideLoadingState(paperLoading);
            showManualPaperForm(originalUrl, basicInfo);
            console.warn('Proxy extraction failed, falling back to basic info:', proxyError);
        }

    } catch (error) {
        hideLoadingState(paperLoading);
        // その他のエラーが発生した場合
        showManualPaperForm(originalUrl);
        console.error('Paper extraction error:', error);
    }
}

// 共通のプロキシ抽出関数（論文用）
async function extractWithProxy(url) {
    const proxyConfigs = [
        {
            url: `https://proxy.cors.sh/${url}`,
            parseResponse: (text) => text,
            timeout: 15000, // Increase timeout slightly
            isText: true,
            headers: { 'x-cors-api-key': 'temp_892349872349872' } // A different temp key, might help
        },
        {
            url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
            parseResponse: (text) => text,
            timeout: 15000,
            isText: true
        }
    ];

    for (const config of proxyConfigs) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.timeout);

            const response = await fetch(config.url, {
                signal: controller.signal,
                headers: config.headers || {}
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const htmlContent = config.isText
                    ? await response.text()
                    : config.parseResponse(await response.json());

                if (htmlContent && htmlContent.length > 100) {
                    return parsePaperInfoFromHtml(htmlContent, url);
                }
            }
        } catch (error) {
            // タイムアウトやネットワークエラーは次のプロキシを試行
            continue;
        }
    }

    throw new Error('プロキシでの抽出に失敗しました');
}

// Webサイト抽出用のプロキシ関数（HTML文字列を返す）
async function extractWebsiteWithProxy(url) {
    // 複数のプロキシサービスを試行（優先順位順）
    const proxyConfigs = [
        {
            url: `https://proxy.cors.sh/${url}`,
            parseResponse: (text) => text,
            timeout: 15000, // Increase timeout slightly
            isText: true,
            headers: { 'x-cors-api-key': 'temp_892349872349872' } // A different temp key, might help
        },
        {
            url: `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
            parseResponse: (text) => text,
            timeout: 15000,
            isText: true
        }
    ];

    for (const config of proxyConfigs) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), config.timeout);

            const response = await fetch(config.url, {
                signal: controller.signal,
                headers: config.headers || {}
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const htmlContent = config.isText
                    ? await response.text()
                    : config.parseResponse(await response.json());

                if (htmlContent && htmlContent.length > 100) {
                    return htmlContent; // HTML文字列をそのまま返す
                }
            }
        } catch (error) {
            // タイムアウトやネットワークエラーは次のプロキシを試行
            continue;
        }
    }

    throw new Error('プロキシでの抽出に失敗しました');
}

// HTMLから論文情報を解析
function parsePaperInfoFromHtml(html, url) {
    const data = extractStructuredPageData(html, url);
    if (!data) return {};

    const meta = data.metadata;

    // Priority: Japanese Tag -> OpenGraph -> DC -> English Citation Tag -> Page Title
    const title = meta.metaTitle || meta.ogTitle || meta.dcTitle || meta.citationTitle || meta.pageTitle || '';

    let authorsArray = [];
    // Priority: Japanese 'authors' tag -> DC -> English 'citation_author'
    if (meta.authors) {
        authorsArray = Array.isArray(meta.authors) ? meta.authors : [meta.authors];
    } else if (meta.dcCreator) {
        authorsArray = Array.isArray(meta.dcCreator) ? meta.dcCreator : [meta.dcCreator];
    } else if (meta.citationAuthors) {
        authorsArray = Array.isArray(meta.citationAuthors) ? meta.citationAuthors : [meta.citationAuthors];
    }
    const authors = authorsArray.join('・');

    // Priority: Japanese Tag -> OpenGraph -> DC -> English Citation Tag
    const journal = meta.journal_title || meta.ogSiteName || meta.dcSource || meta.citationJournal || '';

    // For numeric/date data, Japanese and English tags are often the same, but we prioritize the specific ones.
    const year = (meta.publication_date || meta.citationDate || meta.dcDate || '').split(/[\/-]/)[0];
    const volume = meta.volume || meta.citationVolume || '';
    const issue = meta.issue || meta.citationIssue || '';
    const doi = meta.doi || meta.citationDoi || '';

    let pages = '';
    if (meta.firstpage && meta.lastpage) {
        pages = `${meta.firstpage}-${meta.lastpage}`;
    } else if (meta.citationFirstPage && meta.citationLastPage) {
        pages = `${meta.firstpage}-${meta.lastpage}`;
    } else if (meta.firstpage) {
        pages = meta.firstpage;
    } else if (meta.citationFirstPage) {
        pages = meta.citationFirstPage;
    }

    return {
        authors: authors,
        title: title,
        journal: journal,
        volume: volume,
        issue: issue,
        pages: pages,
        year: year,
        doi: doi
    };
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
    const multiValueKeys = ['citationAuthors', 'dcCreator', 'authors', 'keywords', 'references']; // Added more multi-keys
    
    const metaTags = [
        // The order here doesn't matter, parsePaperInfoFromHtml will handle priority
        { key: 'pageTitle', selector: 'title' },
        { key: 'ogTitle', selector: 'meta[property="og:title"]', attr: 'content' },
        { key: 'twitterTitle', selector: 'meta[name="twitter:title"]', attr: 'content' },
        { key: 'ogSiteName', selector: 'meta[property="og:site_name"]', attr: 'content' },
        { key: 'citationTitle', selector: 'meta[name="citation_title"]', attr: 'content' },
        { key: 'citationAuthors', selector: 'meta[name="citation_author"]', attr: 'content' },
        { key: 'citationJournal', selector: 'meta[name="citation_journal_title"]', attr: 'content' },
        { key: 'citationVolume', selector: 'meta[name="citation_volume"]', attr: 'content' },
        { key: 'citationIssue', selector: 'meta[name="citation_issue"]', attr: 'content' },
        { key: 'citationFirstPage', selector: 'meta[name="citation_firstpage"]', attr: 'content' },
        { key: 'citationLastPage', selector: 'meta[name="citation_lastpage"]', attr: 'content' },
        { key: 'citationDate', selector: 'meta[name="citation_publication_date"]', attr: 'content' },
        { key: 'citationDoi', selector: 'meta[name="citation_doi"]', attr: 'content' },
        { key: 'dcTitle', selector: 'meta[name="DC.title"]', attr: 'content' },
        { key: 'dcCreator', selector: 'meta[name="DC.creator"]', attr: 'content' },
        { key: 'dcSource', selector: 'meta[name="DC.source"]', attr: 'content' },
        { key: 'dcDate', selector: 'meta[name="DC.date"]', attr: 'content' },
        
        // J-STAGE specific tags discovered during debugging
        { key: 'metaTitle', selector: 'meta[name="title"]', attr: 'content' },
        { key: 'journal_title', selector: 'meta[name="journal_title"]', attr: 'content' },
        { key: 'authors', selector: 'meta[name="authors"]', attr: 'content' },
        { key: 'publication_date', selector: 'meta[name="publication_date"]', attr: 'content' },
        { key: 'volume', selector: 'meta[name="volume"]', attr: 'content' },
        { key: 'issue', selector: 'meta[name="issue"]', attr: 'content' },
        { key: 'firstpage', selector: 'meta[name="firstpage"]', attr: 'content' },
        { key: 'lastpage', selector: 'meta[name="lastpage"]', attr: 'content' },
        { key: 'doi', selector: 'meta[name="doi"]', attr: 'content' },
        { key: 'keywords', selector: 'meta[name="keywords"]', attr: 'content' },
        { key: 'references', selector: 'meta[name="references"]', attr: 'content' }
    ];
    
    metaTags.forEach(({ key, selector, attr }) => {
        const elements = doc.querySelectorAll(selector);
        if (elements.length === 0) return;

        const values = Array.from(elements)
            .map(el => attr ? el.getAttribute(attr) : el.textContent?.trim())
            .filter(Boolean);

        if (values.length === 0) return;

        if (multiValueKeys.includes(key)) {
            metadata[key] = values;
        } else {
            // For single-value keys, just take the first one. 
            // The priority logic will be in the calling function.
            if (!metadata[key]) {
                metadata[key] = values[0];
            }
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

// Webサイト情報解析（大幅改善版）
function parseWebsiteInfo(html, url) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // JSON-LD構造化データを抽出
        const structuredData = extractStructuredData(doc);
        let jsonLdTitle = null;
        let jsonLdSiteName = null;

        if (structuredData.jsonLd && structuredData.jsonLd.length > 0) {
            for (const data of structuredData.jsonLd) {
                // Article, NewsArticle, BlogPostingなど
                if (data.headline) jsonLdTitle = data.headline;
                if (data.name && !jsonLdTitle) jsonLdTitle = data.name;

                // Publisherやサイト情報
                if (data.publisher?.name) jsonLdSiteName = data.publisher.name;
                if (data.author?.name && !jsonLdSiteName) jsonLdSiteName = data.author.name;
                if (data['@type'] === 'WebSite' && data.name) jsonLdSiteName = data.name;
            }
        }

        // 拡張されたタイトル抽出（優先順位順）
        const titleSources = [
            { value: jsonLdTitle, priority: 10, source: 'JSON-LD' },
            { value: doc.querySelector('meta[property="og:title"]')?.getAttribute('content'), priority: 9, source: 'og:title' },
            { value: doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content'), priority: 8, source: 'twitter:title' },
            { value: doc.querySelector('meta[property="article:title"]')?.getAttribute('content'), priority: 7, source: 'article:title' },
            { value: doc.querySelector('meta[name="DC.title"]')?.getAttribute('content'), priority: 6, source: 'DC.title' },
            { value: doc.querySelector('h1')?.textContent?.trim(), priority: 5, source: 'h1' },
            { value: doc.querySelector('.article-title')?.textContent?.trim(), priority: 5, source: '.article-title' },
            { value: doc.querySelector('.entry-title')?.textContent?.trim(), priority: 5, source: '.entry-title' },
            { value: doc.querySelector('.page-title')?.textContent?.trim(), priority: 4, source: '.page-title' },
            { value: doc.querySelector('title')?.textContent?.trim(), priority: 3, source: 'title' }
        ];

        // 拡張されたサイト名抽出（優先順位順）
        const siteNameSources = [
            { value: jsonLdSiteName, priority: 10, source: 'JSON-LD' },
            { value: doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content'), priority: 9, source: 'og:site_name' },
            { value: doc.querySelector('meta[property="article:publisher"]')?.getAttribute('content'), priority: 8, source: 'article:publisher' },
            { value: doc.querySelector('meta[name="application-name"]')?.getAttribute('content'), priority: 7, source: 'application-name' },
            { value: doc.querySelector('meta[name="DC.publisher"]')?.getAttribute('content'), priority: 6, source: 'DC.publisher' },
            { value: doc.querySelector('meta[name="site_name"]')?.getAttribute('content'), priority: 5, source: 'site_name' },
            { value: doc.querySelector('.site-title')?.textContent?.trim(), priority: 4, source: '.site-title' },
            { value: doc.querySelector('.site-name')?.textContent?.trim(), priority: 4, source: '.site-name' },
            { value: doc.querySelector('.brand')?.textContent?.trim(), priority: 3, source: '.brand' },
            { value: doc.querySelector('header .logo')?.textContent?.trim(), priority: 3, source: 'header .logo' }
        ];

        // 最適なタイトルを選択（信頼度スコアリング）
        let bestTitle = null;
        let bestTitleScore = -100;

        for (const source of titleSources) {
            if (!source.value) continue;

            const title = source.value;
            let score = source.priority;
            
            // お知らせやプライバシー関連のタイトルにペナルティを課す
            const rejectPatterns = ['お知らせ', '欧州経済領域', 'EEA', 'Cookie', 'クッキー', 'プライバシー'];
            if (rejectPatterns.some(pattern => title.includes(pattern))) {
                score -= 10; // Apply a heavy penalty
            }

            // 品質による追加スコア
            if (title.length > 10 && title.length < 150) score += 3;
            if (!title.includes('404') && !title.includes('Error') && !title.includes('Page Not Found')) score += 2;
            if (!/^\s*$/.test(title)) score += 1;

            if (score > bestTitleScore) {
                bestTitleScore = score;
                bestTitle = title;
            }
        }

        // 最適なサイト名を選択（信頼度スコアリング）
        let bestSiteName = null;
        let bestSiteScore = 0;

        for (const source of siteNameSources) {
            if (!source.value) continue;

            const name = source.value;
            let score = source.priority;

            // 品質による追加スコア
            if (name.length > 2 && name.length < 50) score += 2;
            if (!/\d{4,}/.test(name)) score += 1; // 長い数字列を含まない

            if (score > bestSiteScore) {
                bestSiteScore = score;
                bestSiteName = name;
            }
        }

        // タイトルからサイト名を分離（"ページタイトル | サイト名" 形式の処理）
        let finalPageTitle = bestTitle || 'ページタイトル不明';
        let finalSiteName = bestSiteName || getDomainName(url);

        if (finalPageTitle && !bestSiteName) {
            const separators = [' | ', ' - ', ' – ', ' — ', ' :: ', ' » '];
            for (const sep of separators) {
                if (finalPageTitle.includes(sep)) {
                    const parts = finalPageTitle.split(sep);
                    if (parts.length === 2) {
                        // 通常は "ページタイトル | サイト名" の形式
                        finalPageTitle = parts[0].trim();
                        finalSiteName = parts[1].trim();
                        break;
                    } else if (parts.length > 2) {
                        // "サイト名 | カテゴリ | ページタイトル" のような場合は最後を使用
                        finalPageTitle = parts[parts.length - 1].trim();
                        finalSiteName = parts[0].trim();
                        break;
                    }
                }
            }
        } else if (finalPageTitle && bestSiteName) {
            // タイトルにサイト名が含まれている場合は削除
            const separators = [' | ', ' - ', ' – ', ' — ', ' :: ', ' » '];
            for (const sep of separators) {
                if (finalPageTitle.includes(sep + finalSiteName)) {
                    finalPageTitle = finalPageTitle.replace(sep + finalSiteName, '').trim();
                    break;
                } else if (finalPageTitle.includes(finalSiteName + sep)) {
                    finalPageTitle = finalPageTitle.replace(finalSiteName + sep, '').trim();
                    break;
                }
            }
        }

        const currentDate = getCurrentDateString();
        generateWebsiteCitation(finalPageTitle, finalSiteName, url, currentDate);
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
        } else {
            hideLoadingState(paperLoading);
            showError('URLからDOIを見つけることができませんでした。DOIが含まれるURLであることを確認してください。');
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
        // Use the universal doi.org resolver via a CORS proxy to handle redirects
        const proxy = 'https://cors.eu.org/'; // Using the proxy I added before
        const doiUrl = `${proxy}https://doi.org/${encodeURIComponent(doi)}`;
        
        const data = await makeApiCall(doiUrl, {
            headers: {
                'Accept': 'application/vnd.citationstyles.csl+json',
                'Accept-Language': 'ja, en;q=0.9' // Request Japanese content
            }
        });

        hideLoadingState(paperLoading);

        if (data) {
            parseDoiData(data, sourceInfo);
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
function parseDoiData(work, sourceInfo) {
    try {
        const authors = work.author ? work.author.map(author => {
            const given = author.given || '';
            const family = author.family || '';
            // 姓名の間にスペースを入れない
            return given ? `${family}${given}` : family;
        }).join('・') : '著者不明';

        // CSL-JSON title is not an array
        const title = work.title || 'タイトル不明';
        
        // CSL-JSON container-title is not an array
        const journal = work['container-title'] || '雑誌名不明';

        const volume = work.volume || '';
        const issue = work.issue || '';
        const pages = work.page || '';

        let year = '';
        // Use 'issued' field from CSL-JSON
        if (work.issued && work.issued['date-parts'] && work.issued['date-parts'][0]) {
            year = work.issued['date-parts'][0][0].toString();
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
        showError('DOIから取得した論文情報の解析中にエラーが発生しました。');
        console.error('DOI data parsing error:', error);
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
