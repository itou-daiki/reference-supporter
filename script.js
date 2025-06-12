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
const methodTabs = document.querySelectorAll('.method-tab');
const methodContents = document.querySelectorAll('.input-method-content');
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

// 論文入力方法の切り替え
function switchInputMethod(method) {
    // 全ての入力方法タブを非アクティブに
    methodTabs.forEach(tab => tab.classList.remove('active'));
    methodContents.forEach(content => content.classList.remove('active'));

    // 選択された入力方法をアクティブに
    document.querySelector(`[data-method="${method}"]`).classList.add('active');
    document.getElementById(`${method}-input`).classList.add('active');

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

// DOIから論文情報を抽出
async function extractFromDOI() {
    const doiText = doiTextInput.value.trim();

    if (!doiText) {
        showError('DOIを入力してください。');
        return;
    }

    // DOIの形式チェック
    const doiPattern = /^10\.\d{4,}\/\S+$/;
    if (!doiPattern.test(doiText)) {
        showError('正しいDOI形式を入力してください（例: 10.1000/182）。');
        return;
    }

    hideResults();
    showLoading(paperLoading);

    try {
        // CrossRef APIを使用してDOI情報を取得
        const crossRefUrl = `https://api.crossref.org/works/${encodeURIComponent(doiText)}`;
        
        const response = await fetch(crossRefUrl, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'CitationGenerator/1.0 (mailto:example@email.com)' // CrossRefではUser-Agentが推奨
            }
        });

        hideLoading(paperLoading);

        if (response.ok) {
            const data = await response.json();
            if (data.status === 'ok' && data.message) {
                parseCrossRefData(data.message);
            } else {
                showError('DOIから論文情報を取得できませんでした。DOIを確認してください。');
            }
        } else if (response.status === 404) {
            showError('指定されたDOIは見つかりませんでした。DOIを確認してください。');
        } else {
            showError('DOI検索中にエラーが発生しました。しばらく時間をおいてお試しください。');
        }
    } catch (error) {
        hideLoading(paperLoading);
        showError('DOI検索中にネットワークエラーが発生しました。インターネット接続を確認してください。');
        console.error('DOI extraction error:', error);
    }
}

// CrossRefからの論文データを解析
function parseCrossRefData(work) {
    try {
        // 著者情報の抽出（「・」区切りに変更）
        const authors = work.author ? work.author.map(author => {
            const given = author.given || '';
            const family = author.family || '';
            return given ? `${family} ${given}` : family;
        }).join('・') : '著者不明';

        // タイトルの抽出
        const title = work.title && work.title[0] ? work.title[0] : 'タイトル不明';

        // 雑誌名の抽出
        const journal = work['container-title'] && work['container-title'][0] 
            ? work['container-title'][0] 
            : '雑誌名不明';

        // 巻・号・ページの抽出
        const volume = work.volume || '';
        const issue = work.issue || '';
        const pages = work.page || '';

        // 発行年の抽出
        let year = '';
        if (work.published && work.published['date-parts'] && work.published['date-parts'][0]) {
            year = work.published['date-parts'][0][0].toString();
        } else if (work['published-online'] && work['published-online']['date-parts'] && work['published-online']['date-parts'][0]) {
            year = work['published-online']['date-parts'][0][0].toString();
        } else {
            year = '発表年不明';
        }

        // DOI情報を含めて手動フォームを表示
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

        showManualPaperForm(`DOI: ${work.DOI}`, prefilledData);
        
    } catch (error) {
        showError('論文情報の解析中にエラーが発生しました。');
        console.error('CrossRef data parsing error:', error);
    }
}

// 論文抽出
async function extractPaper() {
    const url = jstageUrlInput.value.trim();

    if (!url) {
        showError('J-STAGEのURLを入力してください。');
        return;
    }

    // URLの妥当性チェック
    try {
        new URL(url);
    } catch {
        showError('有効なURLを入力してください。');
        return;
    }

    // J-STAGEのURLかチェック
    if (!url.includes('jstage.jst.go.jp')) {
        showError('J-STAGEのURLを入力してください。他のサイトのURLは対応していません。');
        return;
    }

    hideResults();

    // J-STAGEのURL解析を試行
    const paperInfo = extractPaperInfoFromUrl(url);
    if (paperInfo) {
        showManualPaperForm(url, paperInfo);
        return;
    }

    showLoading(paperLoading);

    try {
        // DOI取得の試行
        const doiInfo = await tryExtractDOI(url);
        hideLoading(paperLoading);
        
        if (doiInfo) {
            showManualPaperForm(url, doiInfo);
        } else {
            showManualPaperForm(url);
        }
        
    } catch (error) {
        hideLoading(paperLoading);
        showManualPaperForm(url);
        console.error('Paper extraction error:', error);
    }
}

// URLから論文情報を抽出（J-STAGEのURL構造を利用）
function extractPaperInfoFromUrl(url) {
    try {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        
        // J-STAGEのURL構造：/article/journal_code/volume_issue/article_id/
        if (pathParts.length >= 4) {
            const journalCode = pathParts[2];
            const volumeIssue = pathParts[3];
            
            // 巻号情報の解析
            const volumeMatch = volumeIssue.match(/(\d+)_(\d+)/);
            if (volumeMatch) {
                return {
                    journal: journalCode.replace(/_/g, ' ').toUpperCase(),
                    volume: volumeMatch[1],
                    issue: volumeMatch[2]
                };
            }
        }
        
        return null;
    } catch (error) {
        return null;
    }
}

// DOI情報の取得を試行
async function tryExtractDOI(url) {
    try {
        // J-STAGEのAPIエンドポイントを試行（公開されている場合）
        const apiUrl = url.replace('/article/', '/api/v1/article/');
        const response = await fetch(apiUrl);
        
        if (response.ok) {
            const data = await response.json();
            return {
                title: data.title,
                authors: data.authors?.map(a => a.name).join('・'), // 「・」区切りに変更
                journal: data.journal?.name,
                volume: data.volume,
                issue: data.issue,
                pages: data.pages,
                year: data.year
            };
        }
    } catch (error) {
        // APIが利用できない場合は無視
    }
    
    return null;
}

// 手動入力フォーム表示（論文用）
function showManualPaperForm(sourceInfo, prefilledData = null) {
    const paperTab = document.getElementById('paper-tab');
    
    // 既存の手動フォームがあれば削除
    const existingForm = paperTab.querySelector('.manual-form');
    if (existingForm) {
        existingForm.remove();
    }
    
    const isDOI = sourceInfo.startsWith('DOI:');
    
    const manualForm = document.createElement('div');
    manualForm.className = 'manual-form';
    manualForm.innerHTML = `
        <div class="manual-input-section">
            <h3><i class="fas fa-edit"></i> 論文情報${isDOI ? '確認・編集' : '入力'}</h3>
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
    
    // イベントリスナー追加
    document.getElementById('generate-manual-paper-citation').addEventListener('click', generateManualPaperCitation);
    document.getElementById('cancel-manual-paper').addEventListener('click', () => {
        manualForm.remove();
        hideResults();
    });
    
    // 最初の空の入力フィールドにフォーカス
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
    
    // 必須項目のチェック
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
    
    // 年の形式チェック
    if (!/^\d{4}$/.test(year)) {
        showError('発表年は4桁の西暦で入力してください（例: 2016）。');
        return;
    }
    
    // ページ番号の正規化
    if (pages && !pages.toLowerCase().startsWith('pp.')) {
        pages = `pp.${pages}`;
    }
    
    generatePaperCitation(authors, title, journal, volume, issue, pages, year);
    
    // フォームを削除
    document.querySelector('.manual-form').remove();
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

    // URLの妥当性チェック
    try {
        new URL(url);
    } catch {
        showError('有効なURLを入力してください。');
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
        // 複数のCORSプロキシサービスを試行
        const proxyServices = [
            `https://corsproxy.io/?${encodeURIComponent(url)}`,
            `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
            `https://cors-anywhere.herokuapp.com/${url}`
        ];

        let success = false;
        
        for (const proxyUrl of proxyServices) {
            try {
                const response = await fetch(proxyUrl, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    hideLoading(websiteLoading);
                    
                    if (data.contents || data.data) {
                        parseWebsiteInfo(data.contents || data.data, url);
                        success = true;
                        break;
                    }
                }
            } catch (proxyError) {
                console.warn(`Proxy ${proxyUrl} failed:`, proxyError);
                continue;
            }
        }
        
        if (!success) {
            hideLoading(websiteLoading);
            // 手動入力フォームを表示
            showManualWebsiteForm(url);
        }
        
    } catch (error) {
        hideLoading(websiteLoading);
        showManualWebsiteForm(url);
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

// 手動入力フォーム表示
function showManualWebsiteForm(url) {
    const websiteTab = document.getElementById('website-tab');
    
    // 既存の手動フォームがあれば削除
    const existingForm = websiteTab.querySelector('.manual-form');
    if (existingForm) {
        existingForm.remove();
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
    
    // イベントリスナー追加
    document.getElementById('generate-manual-citation').addEventListener('click', generateManualCitation);
    document.getElementById('cancel-manual').addEventListener('click', () => {
        manualForm.remove();
        hideResults();
    });
    
    // 最初の入力フィールドにフォーカス
    document.getElementById('manual-title').focus();
}

// ドメイン名から推測されるサイト名を取得
function getDomainName(url) {
    try {
        const domain = new URL(url).hostname;
        // www.を削除
        const cleanDomain = domain.replace(/^www\./, '');
        // ドメインの最初の部分を大文字にして返す
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
    
    // フォームを削除
    document.querySelector('.manual-form').remove();
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