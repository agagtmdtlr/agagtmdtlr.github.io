/**
 * BlogApp 클래스
 * 
 * 블로그의 뷰 전환, 카테고리 필터링, 검색, 상세 보기,
 * 로컬 환경 판별에 따른 글쓰기 버튼 제어 및 마크다운 다운로드 기능을 총괄합니다.
 */
export default class BlogApp {
    constructor() {
        // 샘플 포스트 데이터 (최초 로드용)
        this.posts = [
            {
                id: 1,
                title: "노란귤 블로그에 오신 것을 환영합니다",
                excerpt: "깃허브 블로그 디자인 및 기능 설정을 소개합니다. 미니멀리즘과 노란색 테마로 산뜻한 느낌을 제공합니다.",
                content: `# 환영합니다!
노란귤 블로그는 다음과 같은 스택으로 구성되어 있습니다:
1. **HTML5 & CSS3**: 라이브러리 없는 순수 스타일링
2. **Vanilla JS**: 깔끔하고 가벼운 동작

## 테마 컨셉
우리는 4가지의 엄선된 제한 컬러를 사용하여 일관성 있고 아름다운 디자인을 지향합니다.
* **Sun Yellow**: \`#ffce00\` (강조색)
* **Dark Slate**: \`#0f172a\` (텍스트)
* **Pure White**: \`#ffffff\` (배경)
* **Cool Gray**: \`#e2e8f0\` (테두리 및 라인)

마크다운 양식으로 글을 편하게 작성하고, 로컬 환경에서 글쓰기 폼을 통해 마크다운 파일을 손쉽게 내려받을 수 있습니다.`,
                category: "General",
                tags: ["Welcome", "Guide"],
                date: "2026-06-14",
                readtime: "2 min read"
            },
            {
                id: 2,
                title: "마크다운(Markdown) 사용법 및 스타일 가이드",
                excerpt: "블로그 글 작성 시 사용할 수 있는 마크다운 문법과 본문 렌더링 스타일 예시입니다.",
                content: `# 마크다운 렌더링 데모

본문 영역에서 마크다운 요소들이 어떻게 스타일링되는지 확인하세요.

## 1. 코드 블록
개발 블로그 필수 요소인 코드 블록입니다:
\`\`\`javascript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

인라인 코드 표시 예시: \`const isLocal = true;\` 처럼 강조할 수 있습니다.

## 2. 인용구 (Blockquote)
> "창조적인 일은 정돈된 환경에서 나오며, 세련됨은 단순함에서 시작된다." - 미니멀리스트 격언

## 3. 리스트
- 순서 없는 첫 번째 항목
- 두 번째 항목
  - 하위 레벨 항목

1. 순서 있는 항목
2. 다음 항목`,
                category: "Guide",
                tags: ["Markdown", "Style"],
                date: "2026-06-13",
                readtime: "4 min read"
            }
        ];

        this.currentCategory = "All";
        this.searchQuery = "";

        // DOM 요소 캐싱
        this.btnWrite = document.getElementById("btn-write-post");
        this.viewList = document.getElementById("view-list");
        this.viewDetail = document.getElementById("view-detail");
        this.viewEditor = document.getElementById("view-editor");
        
        // 상세 페이지 요소
        this.btnBack = document.getElementById("btn-back-to-list");
        this.detailCategory = document.getElementById("detail-category");
        this.detailTitle = document.getElementById("detail-title");
        this.detailDate = document.getElementById("detail-date");
        this.detailReadtime = document.getElementById("detail-readtime");
        this.detailContent = document.getElementById("detail-content");

        // 에디터 요소
        this.editorTitle = document.getElementById("editor-title");
        this.editorCategory = document.getElementById("editor-category");
        this.editorTags = document.getElementById("editor-tags");
        this.editorTextarea = document.getElementById("editor-textarea");
        this.btnCancelWrite = document.getElementById("btn-cancel-write");
        this.btnDownloadMd = document.getElementById("btn-download-md");
        this.btnSavePost = document.getElementById("btn-save-post");

        // 사이드바 및 레이아웃 요소
        this.categoryList = document.getElementById("category-list");
        this.widgetRecentList = document.getElementById("widget-recent-list");
        this.searchInput = document.getElementById("search-input");
        this.logo = document.getElementById("nav-logo");
        this.tocCard = document.getElementById("toc-card");
    }

    /**
     * 로컬 환경 판별
     * - localhost, 127.0.0.1, file:// 일 경우 true 반환
     */
    checkIsLocal() {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        return hostname === "localhost" || 
               hostname === "127.0.0.1" || 
               hostname === "" || // file:// 프로토콜인 경우 종종 hostname이 빈 문자열임
               protocol === "file:";
    }

    /**
     * 초기 실행 메서드
     */
    init() {
        this.setupEnvironment();
        this.renderCategories();
        this.renderRecentPostsWidget();
        this.renderPostList();
        this.bindEvents();
    }

    /**
     * 환경 설정 (로컬 환경 여부에 따른 처리)
     */
    setupEnvironment() {
        const isLocal = this.checkIsLocal();
        if (this.btnWrite) {
            if (isLocal) {
                this.btnWrite.style.display = "flex";
            } else {
                this.btnWrite.style.display = "none";
            }
        }
    }

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 로고 클릭 시 홈(목록)으로 이동
        if (this.logo) {
            this.logo.addEventListener("click", () => this.switchView("list"));
        }

        // 글쓰기 버튼 클릭
        if (this.btnWrite) {
            this.btnWrite.addEventListener("click", () => this.switchView("editor"));
        }

        // 목록으로 가기 버튼 클릭
        if (this.btnBack) {
            this.btnBack.addEventListener("click", () => this.switchView("list"));
        }

        // 에디터 취소 버튼 클릭
        if (this.btnCancelWrite) {
            this.btnCancelWrite.addEventListener("click", () => this.switchView("list"));
        }

        // 에디터 발행 버튼 클릭 (로컬 저장소 추가 시연 및 뷰 전환)
        if (this.btnSavePost) {
            this.btnSavePost.addEventListener("click", () => this.savePostLocally());
        }

        // 에디터 마크다운 다운로드 버튼 클릭
        if (this.btnDownloadMd) {
            this.btnDownloadMd.addEventListener("click", () => this.downloadMarkdownFile());
        }

        // 검색어 입력 이벤트
        if (this.searchInput) {
            this.searchInput.addEventListener("input", (e) => {
                this.searchQuery = e.target.value;
                this.renderPostList();
            });
        }
    }

    /**
     * 뷰 전환 처리
     */
    switchView(viewName) {
        // 기본 뷰 숨김
        this.viewList.style.display = "none";
        this.viewDetail.style.display = "none";
        this.viewEditor.style.display = "none";

        if (viewName === "list") {
            this.viewList.style.display = "flex";
            this.renderPostList();
            this.clearTOC();
        } else if (viewName === "detail") {
            this.viewDetail.style.display = "block";
            window.scrollTo({ top: 0, behavior: "smooth" });
        } else if (viewName === "editor") {
            this.viewEditor.style.display = "block";
            this.clearEditorForm();
            window.scrollTo({ top: 0, behavior: "smooth" });
            this.clearTOC();
        }
    }

    /**
     * 에디터 폼 지우기
     */
    clearEditorForm() {
        this.editorTitle.value = "";
        this.editorCategory.value = "";
        this.editorTags.value = "";
        this.editorTextarea.value = "";
    }

    /**
     * 마크다운 렌더러 (심플 파서)
     */
    parseMarkdown(markdown) {
        if (!markdown) return "";
        let html = markdown;

        // XSS 방지를 위한 기본적인 이스케이프 (상황에 맞게 조율)
        html = html
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // 코드 블록 처리
        html = html.replace(/```(javascript|js|css|html|json)?\n([\s\S]*?)```/gm, (match, lang, code) => {
            return `<pre><code class="language-${lang || 'txt'}">${code.trim()}</code></pre>`;
        });

        // 인라인 코드 처리
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

        // 제목 처리 (h1 ~ h3)
        html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
        html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
        html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');

        // 인용구 처리
        html = html.replace(/^> (.*?)$/gm, '<blockquote><p>$1</p></blockquote>');

        // 리스트 처리 (심플)
        html = html.replace(/^\s*-\s+(.*?)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*?<\/li>)+/gs, '<ul>$&</ul>');

        // 문단 구분 (줄바꿈이 두번 있을 때 p로 래핑)
        html = html.split(/\n\n+/).map(p => {
            if (p.trim().startsWith('<h') || p.trim().startsWith('<pre') || p.trim().startsWith('<blockquote') || p.trim().startsWith('<ul') || p.trim().startsWith('<ol')) {
                return p;
            }
            // 줄바꿈 <br> 처리
            return `<p>${p.trim().replace(/\n/g, '<br>')}</p>`;
        }).join('');

        return html;
    }

    /**
     * 카테고리 렌더링
     */
    renderCategories() {
        if (!this.categoryList) return;

        // 카테고리 개수 계산
        const counts = { "All": this.posts.length };
        this.posts.forEach(post => {
            const cat = post.category || "General";
            counts[cat] = (counts[cat] || 0) + 1;
        });

        this.categoryList.innerHTML = "";
        Object.keys(counts).forEach(cat => {
            const li = document.createElement("li");
            li.className = `category-item ${this.currentCategory === cat ? 'active' : ''}`;
            li.innerHTML = `
                <span>${cat}</span>
                <span class="category-count">${counts[cat]}</span>
            `;
            li.addEventListener("click", () => {
                this.currentCategory = cat;
                this.renderCategories();
                this.renderPostList();
                this.switchView("list");
            });
            this.categoryList.appendChild(li);
        });
    }

    /**
     * 최근 게시글 위젯 렌더링
     */
    renderRecentPostsWidget() {
        if (!this.widgetRecentList) return;

        this.widgetRecentList.innerHTML = "";
        // 최신순 5개만 추출
        const sorted = [...this.posts].reverse().slice(0, 5);

        sorted.forEach(post => {
            const li = document.createElement("li");
            li.className = "widget-post-item";
            li.innerHTML = `
                <div class="widget-post-title">${post.title}</div>
                <div class="widget-post-date">${post.date}</div>
            `;
            li.addEventListener("click", () => this.showPostDetail(post.id));
            this.widgetRecentList.appendChild(li);
        });
    }

    /**
     * 포스트 목록 렌더링
     */
    renderPostList() {
        if (!this.viewList) return;

        this.viewList.innerHTML = "";

        // 필터링 적용
        const filtered = this.posts.filter(post => {
            const matchesCategory = this.currentCategory === "All" || post.category === this.currentCategory;
            const matchesQuery = post.title.toLowerCase().includes(this.searchQuery.toLowerCase()) || 
                                 post.excerpt.toLowerCase().includes(this.searchQuery.toLowerCase());
            return matchesCategory && matchesQuery;
        });

        if (filtered.length === 0) {
            this.viewList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                    게시글이 존재하지 않습니다.
                </div>
            `;
            return;
        }

        // 최신 글 순서로 렌더링
        [...filtered].reverse().forEach(post => {
            const card = document.createElement("div");
            card.className = "post-card";
            card.innerHTML = `
                <div class="post-meta-top">
                    <span class="post-category">${post.category || "General"}</span>
                    <span>${post.date}</span>
                </div>
                <h3 class="post-title">${post.title}</h3>
                <p class="post-excerpt">${post.excerpt}</p>
                <div class="post-meta-bottom">
                    <div class="post-tags">
                        ${post.tags.map(tag => `<span class="post-tag">#${tag}</span>`).join('')}
                    </div>
                    <span class="post-readmore">읽기 <span>→</span></span>
                </div>
            `;
            card.addEventListener("click", () => this.showPostDetail(post.id));
            this.viewList.appendChild(card);
        });
    }

    /**
     * 포스트 상세 보기
     */
    showPostDetail(id) {
        const post = this.posts.find(p => p.id === id);
        if (!post) return;

        this.detailCategory.textContent = post.category || "General";
        this.detailTitle.textContent = post.title;
        this.detailDate.textContent = post.date;
        this.detailReadtime.textContent = post.readtime || "3 min read";

        // 본문 마크다운 파싱 주입
        this.detailContent.innerHTML = this.parseMarkdown(post.content);

        this.switchView("detail");
        this.generateTOC();
    }

    /**
     * 실시간 목차(TOC) 생성
     */
    generateTOC() {
        if (!this.tocCard) return;

        this.tocCard.innerHTML = `<h3 class="toc-title">Table of Contents</h3>`;
        
        // 상세 콘텐츠 내부의 h1, h2, h3 추출
        const headings = this.detailContent.querySelectorAll("h1, h2, h3");

        if (headings.length === 0) {
            this.tocCard.innerHTML += `<div class="no-toc">목차가 없습니다.</div>`;
            return;
        }

        const ul = document.createElement("ul");
        ul.className = "toc-list";

        headings.forEach((heading, idx) => {
            // 스크롤 이동을 위해 heading에 ID가 없으면 설정
            const headingId = `heading-${idx}`;
            heading.id = headingId;

            const li = document.createElement("li");
            const depth = heading.tagName.toLowerCase() === "h1" ? 1 : (heading.tagName.toLowerCase() === "h2" ? 2 : 3);
            li.className = `toc-item depth-${depth}`;
            
            const a = document.createElement("a");
            a.href = `#${headingId}`;
            a.textContent = heading.textContent;
            
            // 부드러운 스크롤 이동
            a.addEventListener("click", (e) => {
                e.preventDefault();
                heading.scrollIntoView({ behavior: "smooth", block: "start" });
                
                // active 효과 적용
                ul.querySelectorAll(".toc-item").forEach(item => item.classList.remove("active"));
                li.classList.add("active");
            });

            li.appendChild(a);
            ul.appendChild(li);
        });

        this.tocCard.appendChild(ul);
    }

    /**
     * TOC 비우기
     */
    clearTOC() {
        if (this.tocCard) {
            this.tocCard.innerHTML = `
                <h3 class="toc-title">Table of Contents</h3>
                <div class="no-toc">상세 보기 시 활성화됩니다.</div>
            `;
        }
    }

    /**
     * 포스트 로컬 임시 저장 및 목록 추가 (프론트엔드 상태 유지 데모)
     */
    savePostLocally() {
        const title = this.editorTitle.value.trim();
        const category = this.editorCategory.value.trim() || "General";
        const tagsRaw = this.editorTags.value.trim();
        const content = this.editorTextarea.value;

        if (!title || !content) {
            alert("제목과 본문을 입력해 주세요.");
            return;
        }

        const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()) : [];
        const excerpt = content.length > 150 ? content.substring(0, 150) + "..." : content;

        // 새 임시 포스트 생성
        const newPost = {
            id: Date.now(),
            title,
            excerpt,
            content,
            category,
            tags,
            date: new Date().toISOString().split('T')[0],
            readtime: `${Math.ceil(content.length / 500)} min read`
        };

        this.posts.push(newPost);
        
        // 카테고리 갱신 및 사이드바 목록 갱신
        this.renderCategories();
        this.renderRecentPostsWidget();
        this.switchView("list");
        alert("게시글이 목록에 추가되었습니다. (임시 동적 반영)");
    }

    /**
     * 마크다운 파일로 다운로드
     */
    downloadMarkdownFile() {
        const title = this.editorTitle.value.trim();
        const category = this.editorCategory.value.trim() || "General";
        const tagsRaw = this.editorTags.value.trim();
        const content = this.editorTextarea.value;

        if (!title || !content) {
            alert("제목과 본문을 입력해 주세요.");
            return;
        }

        const tags = tagsRaw ? tagsRaw.split(",").map(t => t.trim()) : [];
        const date = new Date().toISOString().split('T')[0];
        const excerpt = content.substring(0, 150).replace(/\n/g, " ").trim() + "...";

        // Jekyll / Static Site Generator 친화적인 Front Matter 생성
        const markdownContent = `---
title: "${title}"
date: "${date}"
category: "${category}"
tags: [${tags.map(t => `"${t}"`).join(", ")}]
excerpt: "${excerpt}"
---

${content}
`;

        // 파일명 생성 (예: 2026-06-15-my-first-post.md)
        const formattedTitle = title
            .toLowerCase()
            .replace(/[^a-z0-9가-힣\s-]/g, "")
            .replace(/\s+/g, "-");
        const filename = `${date}-${formattedTitle}.md`;

        // 다운로드 실행
        const blob = new Blob([markdownContent], { type: "text/markdown;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
