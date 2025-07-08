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
});

// イベントリスナーの設定
function setupEventListeners() {
    // タブ切り替え
    tabButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    // 論文入力方法の切り替え
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

// 論文入力方法の切り替え
function switchInputMethod(method) {
    methodTabs.forEach(tab => tab.classList.remove('active'));
    methodContents.forEach(content => content.classList.remove('active'));

    document.querySelector(`[data-method="${method}"]`).classList.add('active');
    document.getElementById(`${method}-input`).classList.add('active');

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

// 共通のプロキシ抽出関数
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
    
    // タイトル要素の抽出（優先順位順）
    const titleSelectors = [
        'h1.title', 'h1.paper-title', 'h1.article-title', 'h1.entry-title',
        '.title:not(.journal-title)', '.paper-title', '.article-title',
        'h1', 'h2.title', '.main-title', '.content-title'
    ];
    content.titles = extractElementsBySelectors(doc, titleSelectors);
    
    // 著者要素の抽出
    const authorSelectors = [
        '.authors', '.author-list', '.paper-authors', '.author-names',
        '.contributor-list', '.creators', '[class*="author"]:not([class*="journal"])',
        '.byline', '.author-info'
    ];
    content.authors = extractElementsBySelectors(doc, authorSelectors);
    
    // 雑誌/サイト名要素の抽出
    const journalSelectors = [
        '.journal-title', '.publication-title', '.journal-name', '.source-title',
        '.container-title', '.journal', '[class*="journal"][class*="title"]',
        '.source', '.site-title', '.brand', '.logo'
    ];
    content.journals = extractElementsBySelectors(doc, journalSelectors);
    
    // 数値情報の抽出
    const numberSelectors = [
        '.volume', '.issue', '.pages', '.page-range', '[class*="volume"]',
        '[class*="issue"]', '[class*="page"]'
    ];
    content.numbers = extractElementsBySelectors(doc, numberSelectors);
    
    return content;
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
    if (!aiAssistEnabled || !geminiApiKey) {
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
                } catch {
                    return parsePartialInfo(text);
                }
            }
        }
    } catch (error) {
        console.error('AI J-STAGE extraction error:', error);
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
    if (!aiAssistEnabled || !geminiApiKey) {
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
            }
        }
    } catch (error) {
        console.error('AI DOI extraction error:', error);
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
            const extractedInfo = await extractWithProxy(url);
            hideLoadingState(websiteLoading);
            parseWebsiteInfo(extractedInfo, url);
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
    if (!aiAssistEnabled || !geminiApiKey) {
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
                } catch {
                    return {
                        title: 'ページタイトル不明',
                        siteName: getDomainName(url)
                    };
                }
            }
        }
    } catch (error) {
        console.error('AI website extraction error:', error);
    }
    
    return null;
}

// 構造化データを使用したWebサイト用プロンプト作成
function createStructuredPromptForWebsite(url, structuredData) {
    const metadataInfo = structuredData.metadata;
    const contentInfo = structuredData.content;
    
    let extractedElements = "【ページから抽出された要素】\n";
    
    // メタデータ情報
    if (metadataInfo.title) extractedElements += `- <title>: "${metadataInfo.title}"\n`;
    if (metadataInfo.ogTitle) extractedElements += `- og:title: "${metadataInfo.ogTitle}"\n`;
    if (metadataInfo.twitterTitle) extractedElements += `- twitter:title: "${metadataInfo.twitterTitle}"\n`;
    if (metadataInfo.siteName) extractedElements += `- og:site_name: "${metadataInfo.siteName}"\n`;
    if (metadataInfo.description) extractedElements += `- description: "${metadataInfo.description}"\n`;
    
    // コンテンツ要素（上位3つまで）
    if (contentInfo.titles?.length > 0) {
        extractedElements += "- タイトル候補:\n";
        contentInfo.titles.slice(0, 3).forEach(title => {
            extractedElements += `  - "${title.text}" (信頼度: ${title.confidence}, セレクタ: ${title.selector})\n`;
        });
    }
    
    if (contentInfo.journals?.length > 0) {
        extractedElements += "- サイト名候補:\n";
        contentInfo.journals.slice(0, 3).forEach(site => {
            extractedElements += `  - "${site.text}" (信頼度: ${site.confidence}, セレクタ: ${site.selector})\n`;
        });
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
- 最も信頼度の高い要素を優先してください
- メタデータ（og:title、<title>等）がある場合はそれを最優先してください
- サイト名とページタイトルを混同しないでください
- 明らかに関連記事やナビゲーションのタイトルは除外してください

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
    
    // メタデータとの照合
    const metadata = structuredData.metadata;
    
    // タイトルの検証（優先順位: og:title > title > その他）
    if (!validated.title || validated.title === "") {
        if (metadata.ogTitle && metadata.ogTitle.length > 5 && metadata.ogTitle.length < 200) {
            validated.title = metadata.ogTitle;
        } else if (metadata.title && metadata.title.length > 5 && metadata.title.length < 200) {
            validated.title = metadata.title;
        } else if (structuredData.content.titles?.length > 0) {
            validated.title = structuredData.content.titles[0].text;
        }
    }
    
    // サイト名の検証
    if (!validated.siteName || validated.siteName === "") {
        if (metadata.siteName && metadata.siteName.length > 2 && metadata.siteName.length < 100) {
            validated.siteName = metadata.siteName;
        } else {
            validated.siteName = getDomainName(url);
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

// Webサイト情報解析
function parseWebsiteInfo(html, url) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const pageTitle = doc.querySelector('title')?.textContent?.trim() || 
                         doc.querySelector('h1')?.textContent?.trim() || 
                         doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                         'ページタイトル不明';

        const siteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || 
                        doc.querySelector('meta[name="application-name"]')?.getAttribute('content') || 
                        getDomainName(url);

        const currentDate = getCurrentDateString();
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

// 手動入力フォーム表示（論文用）
function showManualPaperForm(sourceInfo, prefilledData = null) {
    const paperTab = document.getElementById('paper-tab');
    
    const existingForm = paperTab.querySelector('.manual-form');
    if (existingForm) {
        existingForm.style.display = 'block';
        return;
    }
    
    const isDOI = sourceInfo.startsWith('DOI:');
    const isAI = sourceInfo.includes('(AI抽出)');
    
    const manualForm = document.createElement('div');
    manualForm.className = 'manual-form';
    manualForm.innerHTML = `
        <div class="manual-input-section">
            <h3><i class="fas fa-edit"></i> 論文情報${isDOI ? '確認・編集' : '入力'}${isAI ? '<span class="ai-assist-badge"><i class="fas fa-robot"></i>AI補助</span>' : ''}</h3>
            <p class="help-text">${isDOI 
                ? 'DOIから自動取得した情報です。必要に応じて編集してください。' 
                : 'J-STAGEのページから論文情報をコピーして入力してください。URLから一部の情報は自動入力されています。'}</p>
            
            <div class="url-display">
                <label>${isDOI ? 'DOI:' : '参照URL:'}</label>
                <div class="url-box">${sourceInfo}</div>
            </div>
            
            <div class="form-grid">
                <div class="form-group">
                    <label for="manual-paper-authors">著者名: <span class="required">*</span></label>
                    <input type="text" id="manual-paper-authors" placeholder="例: 豆田町子" value="${prefilledData?.authors || ''}">
                    <small class="field-help">複数著者の場合は「・」（中点）で区切ってください</small>
                </div>
                <div class="form-group">
                    <label for="manual-paper-title">論文タイトル: <span class="required">*</span></label>
                    <input type="text" id="manual-paper-title" placeholder="例: 大分川の水質" value="${prefilledData?.title || ''}">
                </div>
                <div class="form-group">
                    <label for="manual-paper-journal">雑誌名: <span class="required">*</span></label>
                    <input type="text" id="manual-paper-journal" placeholder="例: 水の友" value="${prefilledData?.journal || ''}">
                </div>
                <div class="form-group">
                    <label for="manual-paper-volume">巻数:</label>
                    <input type="text" id="manual-paper-volume" placeholder="例: 50" value="${prefilledData?.volume || ''}">
                </div>
                <div class="form-group">
                    <label for="manual-paper-issue">号数:</label>
                    <input type="text" id="manual-paper-issue" placeholder="例: 10" value="${prefilledData?.issue || ''}">
                </div>
                <div class="form-group">
                    <label for="manual-paper-pages">ページ:</label>
                    <input type="text" id="manual-paper-pages" placeholder="例: pp.45-50 または 45-50" value="${prefilledData?.pages || ''}">
                    <small class="field-help">「pp.」は自動で追加されます</small>
                </div>
                <div class="form-group">
                    <label for="manual-paper-year">発表年: <span class="required">*</span></label>
                    <input type="text" id="manual-paper-year" placeholder="例: 2016" value="${prefilledData?.year || new Date().getFullYear()}">
                </div>
            </div>
            
            <div class="input-tips">
                <h4><i class="fas fa-lightbulb"></i> ${isDOI ? '編集のコツ' : '入力のコツ'}</h4>
                <ul>
                    ${isDOI ? `
                        <li>自動取得された情報を確認し、必要に応じて修正してください</li>
                        <li>英語の論文の場合、著者名を日本語形式に変更できます</li>
                        <li>雑誌名は日本語に翻訳または略称に変更できます</li>
                    ` : `
                        <li>J-STAGEのページタイトルや論文詳細ページから情報をコピーしてください</li>
                        <li>著者名は「姓名」の順で入力してください（例: 田中太郎）</li>
                    `}
                    <li>複数著者の場合は「・」（中点）で区切ってください</li>
                    <li>ページ番号に「pp.」が含まれていない場合は自動で追加されます</li>
                    <li><span class="required">*</span> マークの項目は必須です</li>
                </ul>
            </div>
            
            <div class="form-actions">
                <button id="generate-manual-paper-citation" class="btn-primary">
                    <i class="fas fa-quote-right"></i> 引用文献を生成
                </button>
                <button id="cancel-manual-paper" class="btn-secondary">
                    <i class="fas fa-times"></i> キャンセル
                </button>
            </div>
        </div>
    `;
    
    paperTab.appendChild(manualForm);
    
    document.getElementById('generate-manual-paper-citation').addEventListener('click', generateManualPaperCitation);
    document.getElementById('cancel-manual-paper').addEventListener('click', () => {
        manualForm.style.display = 'none';
        hideResults();
    });
    
    const firstEmptyField = manualForm.querySelector('input[value=""]') || document.getElementById('manual-paper-authors');
    firstEmptyField.focus();
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
    const websiteTab = document.getElementById('website-tab');
    
    const existingForm = websiteTab.querySelector('.manual-form');
    if (existingForm) {
        existingForm.style.display = 'block';
        return;
    }
    
    const manualForm = document.createElement('div');
    manualForm.className = 'manual-form';
    manualForm.innerHTML = `
        <div class="manual-input-section">
            <h3><i class="fas fa-edit"></i> 手動入力</h3>
            <p class="help-text">自動取得ができませんでした。以下の項目を手動で入力してください。</p>
            <div class="form-grid">
                <div class="form-group">
                    <label for="manual-title">ページタイトル:</label>
                    <input type="text" id="manual-title" placeholder="例: 日田高校の概要">
                </div>
                <div class="form-group">
                    <label for="manual-site">サイト名:</label>
                    <input type="text" id="manual-site" placeholder="例: 大分県立日田高等学校" value="${getDomainName(url)}">
                </div>
                <div class="form-group">
                    <label for="manual-url">URL:</label>
                    <input type="text" id="manual-url" value="${url}" readonly>
                </div>
                <div class="form-group">
                    <label for="manual-date">アクセス日:</label>
                    <input type="text" id="manual-date" value="${getCurrentDateString()}" readonly>
                </div>
            </div>
            <div class="form-actions">
                <button id="generate-manual-citation" class="btn-primary">
                    <i class="fas fa-create"></i> 引用文献を生成
                </button>
                <button id="cancel-manual" class="btn-secondary">
                    <i class="fas fa-times"></i> キャンセル
                </button>
            </div>
        </div>
    `;
    
    websiteTab.appendChild(manualForm);
    
    document.getElementById('generate-manual-citation').addEventListener('click', generateManualCitation);
    document.getElementById('cancel-manual').addEventListener('click', () => {
        manualForm.style.display = 'none';
        hideResults();
    });
    
    document.getElementById('manual-title').focus();
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

// 手動入力から引用文献生成
function generateManualCitation() {
    const title = document.getElementById('manual-title').value.trim();
    const siteName = document.getElementById('manual-site').value.trim();
    const url = document.getElementById('manual-url').value.trim();
    const accessDate = document.getElementById('manual-date').value.trim();
    
    if (!title) {
        showError('ページタイトルを入力してください。');
        return;
    }
    
    if (!siteName) {
        showError('サイト名を入力してください。');
        return;
    }
    
    generateWebsiteCitation(title, siteName, url, accessDate);
    
    const manualForm = document.querySelector('.manual-form');
    if (manualForm) {
        manualForm.style.display = 'none';
    }
}

// 結果表示
function showResult(citation) {
    citationResult.textContent = citation;
    resultSection.classList.remove('hidden');
    editSection.classList.add('hidden');
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
    editSection.classList.add('hidden');
    errorSection.classList.add('hidden');
}

// 引用文献編集開始
function editCitation() {
    const citation = citationResult.textContent;
    citationEdit.value = citation;
    editSection.classList.remove('hidden');
    resultSection.classList.add('hidden');
    citationEdit.focus();
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
