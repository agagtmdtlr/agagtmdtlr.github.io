const fs = require('fs');
const path = require('path');

const DOCS_DIR = path.resolve(__dirname, '..');
const POSTS_DIR = path.join(DOCS_DIR, '_posts');
const PAGES_DIR = path.join(DOCS_DIR, '_pages');

// 간단한 마크다운 파서 및 YAML Front Matter 파서 (JS 구현 호환)
function parseFrontMatter(mdString) {
    if (!mdString) return null;
    const normalized = mdString.replace(/\r\n/g, '\n');
    const lines = normalized.split('\n');
    
    let frontMatter = {};
    let contentLines = [];
    let inFrontMatter = false;
    let dividerCount = 0;

    for (let line of lines) {
        if (line.trim() === '---') {
            dividerCount++;
            if (dividerCount === 1) {
                inFrontMatter = true;
                continue;
            } else if (dividerCount === 2) {
                inFrontMatter = false;
                continue;
            }
        }

        if (inFrontMatter) {
            const colonIdx = line.indexOf(':');
            if (colonIdx !== -1) {
                const key = line.substring(0, colonIdx).trim();
                let val = line.substring(colonIdx + 1).trim();

                if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                    val = val.substring(1, val.length - 1);
                }

                if (val.startsWith('[') && val.endsWith(']')) {
                    const arrayContent = val.substring(1, val.length - 1);
                    val = arrayContent ? arrayContent.split(',').map(item => {
                        let cleanItem = item.trim();
                        if ((cleanItem.startsWith('"') && cleanItem.endsWith('"')) || (cleanItem.startsWith("'") && cleanItem.endsWith("'"))) {
                            cleanItem = cleanItem.substring(1, cleanItem.length - 1);
                        }
                        return cleanItem;
                    }) : [];
                }

                if (key === 'id') {
                    val = parseInt(val, 10);
                }

                frontMatter[key] = val;
            }
        } else {
            contentLines.push(line);
        }
    }

    return {
        frontMatter,
        content: contentLines.join('\n').trim()
    };
}

function parseMarkdown(markdown) {
    if (!markdown) return "";
    let html = markdown;

    // 이스케이프
    html = html
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    // 코드 블록
    html = html.replace(/```(javascript|js|css|html|json)?\n([\s\S]*?)```/gm, (match, lang, code) => {
        return `<pre><code class="language-${lang || 'txt'}">${code.trim()}</code></pre>`;
    });

    // 인라인 코드
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 제목
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');

    // 인용구
    html = html.replace(/^> (.*?)$/gm, '<blockquote><p>$1</p></blockquote>');

    // 리스트
    html = html.replace(/^\s*-\s+(.*?)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*?<\/li>)+/gs, '<ul>$&</ul>');

    // 문단
    html = html.split(/\n\n+/).map(p => {
        if (p.trim().startsWith('<h') || p.trim().startsWith('<pre') || p.trim().startsWith('<blockquote') || p.trim().startsWith('<ul')) {
            return p;
        }
        return `<p>${p.trim().replace(/\n/g, '<br>')}</p>`;
    }).join('');

    return html;
}

// 제목 태그들로부터 TOC 객체 리스트 추출
function extractHeadings(contentHtml) {
    const headings = [];
    let idx = 0;
    // 단순 정규식을 통해 h1, h2, h3 추출
    const headingRegex = /<(h1|h2|h3)[^>]*>(.*?)<\/h[1-3]>/gi;
    
    // 매핑 시 사용할 유니크 ID 주입을 위해 contentHtml을 갱신하는 역할도 병행
    let parsedHtml = contentHtml.replace(headingRegex, (match, tag, text) => {
        const id = `heading-${idx++}`;
        const cleanText = text.replace(/<[^>]*>/g, ''); // 태그 제거
        headings.push({ tag: tag.toUpperCase(), text: cleanText, id });
        return `<${tag} id="${id}">${text}</${tag}>`;
    });

    return { headings, parsedHtml };
}

// HTML 템플릿 빌드 (TemplateBuilder.js 로직 이식)
function buildTemplate(postData, contentHtml, headings) {
    let tocListHtml = '';
    if (headings.length === 0) {
        tocListHtml = '<div class="no-toc">목차가 없습니다.</div>';
    } else {
        tocListHtml = '<ul class="toc-list">';
        headings.forEach(h => {
            const depth = h.tag === "H1" ? 1 : (h.tag === "H2" ? 2 : 3);
            tocListHtml += `
                <li class="toc-item depth-${depth}">
                    <a href="#${h.id}">${h.text}</a>
                </li>
            `;
        });
        tocListHtml += '</ul>';
    }

    return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${postData.title} - 노란귤 블로그</title>
    <meta name="description" content="${postData.excerpt}">
    <meta name="post-id" content="${postData.id}">
    <meta name="tags" content="${postData.tags ? (Array.isArray(postData.tags) ? postData.tags.join(',') : postData.tags) : ''}">
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body>

    <!-- 상단 네비게이션 바 -->
    <nav class="navbar" id="blog-navbar">
        <div class="nav-brand" onclick="location.href='../index.html'">
            <span>노란귤</span><span class="brand-dot"></span>
        </div>
        <div class="nav-actions">
            <div class="search-container">
                <span class="search-icon">🔍</span>
                <input type="text" id="search-input" class="search-input" placeholder="게시글 검색..." onclick="location.href='../index.html'">
            </div>
        </div>
    </nav>

    <!-- 레이아웃 컨테이너 -->
    <div class="blog-layout">

        <!-- 좌측 사이드바: 프로필 및 카테고리 -->
        <aside class="profile-sidebar">
            <div class="profile-card">
                <div class="profile-image-container">
                    <img src="../assets/images/profile_avatar.png" alt="Profile Avatar" class="profile-image">
                </div>
                <h2 class="profile-name">agagtmdtlr</h2>
                <p class="profile-bio">제가 좋아하는 게임,그래픽스,개발 내용을 기록합니다.</p>
                <div class="profile-socials">
                    <a href="https://github.com/agagtmdtlr" target="_blank" class="social-link" title="GitHub">
                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 16 16" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"></path>
                        </svg>
                    </a>
                    <a href="mailto:agagtmdtlr@example.com" class="social-link" title="Email">
                        <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 24 24" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"></path>
                        </svg>
                    </a>
                </div>
            </div>
            
            <div class="category-card">
                <h3 class="card-title">Categories</h3>
                <ul class="category-list">
                    <li class="category-item" onclick="location.href='../index.html'">
                        <span>목록으로 돌아가기</span>
                    </li>
                </ul>
            </div>
        </aside>

        <!-- 중앙 메인 콘텐츠 영역 (정적 출력) -->
        <main class="main-content">
            <section class="post-detail-container">
                <div class="btn-back" onclick="location.href='../index.html'">
                    <span>←</span> 블로그 홈으로
                </div>
                <article class="post-article">
                    <header class="detail-header">
                        <span class="post-category">${postData.category}</span>
                        <h1 class="detail-title">${postData.title}</h1>
                        <div class="detail-meta">
                            <span>${postData.date}</span>
                            <span class="meta-dot">•</span>
                            <span>${postData.readtime}</span>
                        </div>
                    </header>
                    <div class="post-content">
                        ${contentHtml}
                    </div>
                </article>
            </section>
        </main>

        <!-- 우측 사이드바: 목차(TOC) -->
        <aside class="toc-sidebar">
            <div class="toc-card">
                <h3 class="toc-title">Table of Contents</h3>
                ${tocListHtml}
            </div>
        </aside>

    </div>

    <!-- 부드러운 스크롤용 TOC 보조 스크립트 -->
    <script>
        document.addEventListener("DOMContentLoaded", () => {
            const tocLinks = document.querySelectorAll(".toc-list a");
            tocLinks.forEach(link => {
                link.addEventListener("click", (e) => {
                    e.preventDefault();
                    const targetId = link.getAttribute("href").substring(1);
                    const targetEl = document.getElementById(targetId);
                    if (targetEl) {
                        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
                        document.querySelectorAll(".toc-item").forEach(item => item.classList.remove("active"));
                        link.parentElement.classList.add("active");
                    }
                });
            });
        });
    </script>
</body>
</html>
`;
}

// 대상 마크다운 리스트 (폴더 내 모든 마크다운 파일 자동 검색)
const files = fs.readdirSync(POSTS_DIR).filter(file => file.endsWith('.md'));

if (!fs.existsSync(PAGES_DIR)) {
    fs.mkdirSync(PAGES_DIR, { recursive: true });
}

files.forEach(file => {
    const filePath = path.join(POSTS_DIR, file);
    if (fs.existsSync(filePath)) {
        const markdown = fs.readFileSync(filePath, 'utf8');
        const parsed = parseFrontMatter(markdown);
        
        if (parsed) {
            const rawHtml = parseMarkdown(parsed.content);
            const { headings, parsedHtml } = extractHeadings(rawHtml);
            
            const htmlContent = buildTemplate(parsed.frontMatter, parsedHtml, headings);
            const outputFileName = file.replace('.md', '.html');
            const outputPath = path.join(PAGES_DIR, outputFileName);
            
            fs.writeFileSync(outputPath, htmlContent, 'utf8');
            console.log(`정적 생성 성공: ${outputFileName}`);
        }
    } else {
        console.warn(`파일을 찾을 수 없습니다: ${file}`);
    }
});

console.log('일괄 빌드 완료!');
