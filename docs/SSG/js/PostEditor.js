/**
 * PostEditor 클래스
 * 
 * 에디터 UI 입력값 상태를 모니터링하고 실시간으로
 * 원본 블로그 스타일 프리뷰 및 TOC를 갱신합니다.
 */
export default class PostEditor {
    constructor() {
        // DOM 요소 캐싱 (에디터 폼)
        this.inputTitle = document.getElementById("post-title");
        this.inputCategory = document.getElementById("post-category");
        this.inputDate = document.getElementById("post-date");
        this.inputTags = document.getElementById("post-tags");
        this.inputReadtime = document.getElementById("post-readtime");
        this.inputExcerpt = document.getElementById("post-excerpt");
        this.inputBody = document.getElementById("post-body");

        // DOM 요소 캐싱 (프리뷰)
        this.previewCategory = document.getElementById("preview-category");
        this.previewTitle = document.getElementById("preview-title");
        this.previewDate = document.getElementById("preview-date");
        this.previewReadtime = document.getElementById("preview-readtime");
        this.previewContent = document.getElementById("preview-content");
        this.previewTOC = document.getElementById("preview-toc-card");

        this.init();
    }

    init() {
        // 오늘 날짜 기본값 세팅 (YYYY-MM-DD)
        const today = new Date().toISOString().split('T')[0];
        this.inputDate.value = today;

        // 이벤트 바인딩
        const inputs = [
            this.inputTitle, this.inputCategory, this.inputDate,
            this.inputTags, this.inputReadtime, this.inputBody
        ];

        inputs.forEach(input => {
            input.addEventListener("input", () => this.updatePreview());
        });

        // 초기 프리뷰 렌더링
        this.updatePreview();
    }

    /**
     * 현재 에디터 상태 데이터 반환
     */
    getPostData() {
        const title = this.inputTitle.value.trim() || "제목 없는 게시글";
        const category = this.inputCategory.value.trim() || "General";
        const date = this.inputDate.value || new Date().toISOString().split('T')[0];
        const tags = this.inputTags.value.split(",")
            .map(t => t.trim())
            .filter(t => t.length > 0);
        const readtime = this.inputReadtime.value.trim() || "3 min read";
        const excerpt = this.inputExcerpt.value.trim() || title;
        const body = this.inputBody.value;

        // 파일명 생성 규격: YYYY-MM-DD-title-slug.md
        // 영문/숫자/하이픈만 남기는 간단한 슬러그 처리
        const cleanTitle = title.toLowerCase()
            .replace(/[^a-zA-Z0-9가-힣\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-");
        const filename = `${date}-${cleanTitle || "untitled"}`;

        return {
            title,
            category,
            date,
            tags,
            readtime,
            excerpt,
            body,
            filename
        };
    }

    /**
     * 프리뷰 실시간 업데이트
     */
    updatePreview() {
        const data = this.getPostData();

        // 텍스트 바인딩
        this.previewCategory.textContent = data.category;
        this.previewTitle.textContent = data.title;
        this.previewDate.textContent = data.date;
        this.previewReadtime.textContent = data.readtime;

        // 마크다운 파싱 및 본문 렌더링
        this.previewContent.innerHTML = this.parseMarkdown(data.body);

        // TOC 갱신
        this.generateTOC();
    }

    /**
     * 원본 BlogApp.js와 동일한 단순 마크다운 파서
     */
    parseMarkdown(markdown) {
        if (!markdown) return "<p style='color: var(--text-secondary); font-style: italic;'>본문 내용을 입력하면 여기에 실시간으로 표시됩니다...</p>";
        let html = markdown;

        // HTML 특수기호 이스케이프 (코드 가독성용)
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

        // 리스트 처리
        html = html.replace(/^\s*-\s+(.*?)$/gm, '<li>$1</li>');
        html = html.replace(/(<li>.*?<\/li>)+/gs, '<ul>$&</ul>');

        // 문단 구분 (줄바꿈이 두번 있을 때 p로 래핑)
        html = html.split(/\n\n+/).map(p => {
            if (p.trim().startsWith('<h') || p.trim().startsWith('<pre') || p.trim().startsWith('<blockquote') || p.trim().startsWith('<ul')) {
                return p;
            }
            return `<p>${p.trim().replace(/\n/g, '<br>')}</p>`;
        }).join('');

        return html;
    }

    /**
     * 실시간 목차(TOC) 생성
     */
    generateTOC() {
        if (!this.previewTOC) return;

        this.previewTOC.innerHTML = `<h3 class="toc-title">Table of Contents</h3>`;
        const headings = this.previewContent.querySelectorAll("h1, h2, h3");

        if (headings.length === 0) {
            this.previewTOC.innerHTML += `<div class="no-toc">목차가 없습니다.</div>`;
            return;
        }

        const ul = document.createElement("ul");
        ul.className = "toc-list";

        headings.forEach((heading, idx) => {
            const headingId = `preview-heading-${idx}`;
            heading.id = headingId;

            const li = document.createElement("li");
            const depth = heading.tagName.toLowerCase() === "h1" ? 1 : (heading.tagName.toLowerCase() === "h2" ? 2 : 3);
            li.className = `toc-item depth-${depth}`;
            
            const a = document.createElement("a");
            a.href = `#${headingId}`;
            a.textContent = heading.textContent;
            
            // 부드러운 스크롤 프리뷰용 이벤트 바인딩
            a.addEventListener("click", (e) => {
                e.preventDefault();
                heading.scrollIntoView({ behavior: "smooth", block: "start" });
                ul.querySelectorAll(".toc-item").forEach(item => item.classList.remove("active"));
                li.classList.add("active");
            });

            li.appendChild(a);
            ul.appendChild(li);
        });

        this.previewTOC.appendChild(ul);
    }
}
