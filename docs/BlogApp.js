/**
 * BlogApp 클래스
 * 
 * 블로그의 뷰 전환, 카테고리 필터링, 검색, 상세 보기,
 * 로컬 환경 판별에 따른 글쓰기 버튼 제어 및 마크다운 다운로드 기능을 총괄합니다.
 */
export default class BlogApp {
    constructor() {
        // 샘플 포스트 데이터 (최초 로드용)
        this.posts = [];

        this.currentCategory = "All";
        this.searchQuery = "";

        // DOM 요소 캐싱
        this.viewList = document.getElementById("view-list");
        this.viewDetail = document.getElementById("view-detail");
        
        // 상세 페이지 요소
        this.btnBack = document.getElementById("btn-back-to-list");
        this.detailCategory = document.getElementById("detail-category");
        this.detailTitle = document.getElementById("detail-title");
        this.detailDate = document.getElementById("detail-date");
        this.detailReadtime = document.getElementById("detail-readtime");
        this.detailContent = document.getElementById("detail-content");

        // 사이드바 및 레이아웃 요소
        this.categoryList = document.getElementById("category-list");
        this.widgetRecentList = document.getElementById("widget-recent-list");
        this.searchInput = document.getElementById("search-input");
        this.logo = document.getElementById("nav-logo");
        this.tocCard = document.getElementById("toc-card");
    }

    /**
     * posts.json 파일 및 개별 마크다운 파일 로드
     */
    async loadPosts() {
        try {
            // posts.json에서 마크다운 파일 목록 조회
            const response = await fetch('./posts.json');
            if (!response.ok) {
                throw new Error('posts.json을 불러올 수 없습니다.');
            }
            const postFiles = await response.json();
            
            const loadedPosts = [];
            for (const file of postFiles) {
                try {
                    const postRes = await fetch(`./_posts/${file}`);
                    if (!postRes.ok) {
                        console.error(`포스트 파일을 읽을 수 없습니다: ${file}`);
                        continue;
                    }
                    const mdText = await postRes.text();
                    const parsed = this.parseFrontMatter(mdText);
                    if (parsed) {
                        loadedPosts.push({
                            id: parsed.frontMatter.id,
                            title: parsed.frontMatter.title,
                            excerpt: parsed.frontMatter.excerpt,
                            content: parsed.content,
                            category: parsed.frontMatter.category,
                            tags: parsed.frontMatter.tags || [],
                            date: parsed.frontMatter.date,
                            updated: parsed.frontMatter.updated || parsed.frontMatter.date,
                            readtime: parsed.frontMatter.readtime || "2 min read"
                        });
                    }
                } catch (err) {
                    console.error(`포스트 파일 처리 실패 (${file}):`, err);
                }
            }
            this.posts = loadedPosts;
        } catch (error) {
            console.error('포스트 데이터 로딩 실패:', error);
            this.posts = [];
        }
    }

    /**
     * 마크다운 YAML Front Matter 파서
     */
    parseFrontMatter(mdString) {
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

                    // 큰따옴표/작은따옴표 제거
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                        val = val.substring(1, val.length - 1);
                    }

                    // 배열 파싱 (예: ["Welcome", "Guide"] 또는 ['Welcome', 'Guide'])
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

                    // id를 숫자로 변환
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

    /**
     * 초기 실행 메서드
     */
    async init() {
        await this.loadPosts();
        this.renderCategories();
        this.renderRecentPostsWidget();
        this.renderPostList();
        this.bindEvents();
    }

    /**
     * 이벤트 바인딩
     */
    bindEvents() {
        // 로고 클릭 시 홈(목록)으로 이동
        if (this.logo) {
            this.logo.addEventListener("click", () => this.switchView("list"));
        }

        // 목록으로 가기 버튼 클릭
        if (this.btnBack) {
            this.btnBack.addEventListener("click", () => this.switchView("list"));
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

        if (viewName === "list") {
            this.viewList.style.display = "flex";
            this.renderPostList();
            this.clearTOC();
        } else if (viewName === "detail") {
            this.viewDetail.style.display = "block";
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
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


}
