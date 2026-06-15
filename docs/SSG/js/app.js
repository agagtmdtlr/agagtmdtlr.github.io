import PostEditor from './PostEditor.js';
import PostExporter from './PostExporter.js';

document.addEventListener("DOMContentLoaded", async () => {
    const editor = new PostEditor();
    const exporter = new PostExporter();

    // DOM 제어 요소
    const btnSelectDir = document.getElementById("btn-select-dir");
    const dirStatus = document.getElementById("directory-status");
    const backendStatus = document.getElementById("backend-status");
    const btnSave = document.getElementById("btn-save");

    // 토스트 헬퍼
    const showToast = (message) => {
        const toast = document.createElement("div");
        toast.className = "ssg-toast";
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add("show"), 10);
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    };

    // 로컬 백엔드 상태 검사 함수
    const checkBackendServer = async () => {
        const isOnline = await exporter.checkBackend();
        if (isOnline) {
            backendStatus.textContent = "로컬 백엔드 온라인";
            backendStatus.className = "status-badge status-online";
            btnSelectDir.style.display = "none";
            dirStatus.style.display = "none";
        } else {
            backendStatus.textContent = "로컬 백엔드 오프라인";
            backendStatus.className = "status-badge status-offline";
            btnSelectDir.style.display = "inline-flex";
            dirStatus.style.display = "inline-block";
        }
    };

    // 최초 백엔드 확인 및 주기적 확인
    await checkBackendServer();
    setInterval(checkBackendServer, 5000);

    // 디렉토리 선택 이벤트 바인딩
    btnSelectDir.addEventListener("click", async () => {
        const handle = await exporter.selectDirectory();
        if (handle) {
            dirStatus.textContent = `연동됨: ${handle.name}`;
            dirStatus.style.color = "var(--text-primary)";
            showToast("로컬 프로젝트 폴더와 연동되었습니다.");
        } else {
            dirStatus.textContent = "폴더가 선택되지 않음";
            dirStatus.style.color = "var(--text-secondary)";
        }
    });

    // 저장 & 발행 이벤트 바인딩
    btnSave.addEventListener("click", async () => {
        const data = editor.getPostData();
        if (!data.title.trim()) {
            showToast("제목을 입력해주세요.");
            return;
        }

        if (!data.body.trim()) {
            showToast("본문 내용을 작성해주세요.");
            return;
        }

        // 헤더 엘리먼트 수집 (TOC 빌딩을 위함)
        const headings = [];
        const headingEls = editor.previewContent.querySelectorAll("h1, h2, h3");
        headingEls.forEach(el => {
            headings.push({
                tag: el.tagName,
                text: el.textContent,
                id: el.id
            });
        });

        btnSave.disabled = true;
        btnSave.textContent = "발행 중...";

        try {
            const result = await exporter.exportPost(data, editor.previewContent.innerHTML, headings);
            if (result.success) {
                showToast(`성공적으로 발행되었습니다! (${data.filename})`);
            } else {
                showToast(`발행 실패: ${result.message}`);
            }
        } catch (error) {
            console.error(error);
            showToast(`오류 발생: ${error.message}`);
        } finally {
            btnSave.disabled = false;
            btnSave.textContent = "게시글 저장 & 발행";
        }
    });
});
