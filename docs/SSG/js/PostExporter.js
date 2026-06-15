import TemplateBuilder from './TemplateBuilder.js';

/**
 * PostExporter 클래스
 * 
 * 포스트 저장을 처리합니다.
 * 1. 로컬 Node.js 백엔드 서버가 켜져 있으면 API 호출로 저장
 * 2. 백엔드가 없으면 브라우저 File System Access API로 로컬에 직접 저장
 */
export default class PostExporter {
    constructor() {
        this.dirHandle = null;
        this.backendUrl = window.location.origin;
        this.isBackendOnline = false;
    }

    /**
     * 로컬 백엔드 서버 상태 체크
     */
    async checkBackend() {
        try {
            const res = await fetch(`${this.backendUrl}/api/status`);
            if (res.ok) {
                const data = await res.json();
                this.isBackendOnline = data.status === 'ok';
                return this.isBackendOnline;
            }
        } catch (e) {
            // 서버 꺼져있음
        }
        this.isBackendOnline = false;
        return false;
    }

    /**
     * File System Access API를 위해 폴더 선택 창을 엽니다 (docs 폴더 선택 목적)
     */
    async selectDirectory() {
        try {
            this.dirHandle = await window.showDirectoryPicker({
                mode: 'readwrite'
            });
            return this.dirHandle;
        } catch (err) {
            console.error('폴더 선택 취소 또는 권한 없음:', err);
            return null;
        }
    }

    /**
     * 게시글 내보내기 (저장) 실행
     * @param {Object} postData - 에디터에서 전달된 포스트 메타 및 본문 데이터
     * @param {string} contentHtml - 파싱된 본문 HTML
     * @param {Array} headings - TOC 제목 목록
     */
    async exportPost(postData, contentHtml, headings) {
        // 1. 새 게시글의 ID 결정 (기존 글들을 읽어 max ID + 1 계산)
        const nextId = await this.getNextPostId();
        
        // 2. YAML Front Matter를 포함한 마크다운 리소스 문자열 생성
        const markdownContent = this.buildMarkdown(postData, nextId);
        
        // 3. 정적 HTML 문자열 빌드
        const htmlContent = TemplateBuilder.build(postData, contentHtml, headings);

        const filenameMD = `${postData.filename}.md`;
        const filenameHTML = `${postData.filename}.html`;

        // 4. 저장 시도
        if (this.isBackendOnline) {
            return await this.saveViaBackend(postData.filename, markdownContent, htmlContent, postData);
        } else if (this.dirHandle) {
            return await this.saveViaFileSystem(filenameMD, filenameHTML, markdownContent, htmlContent, postData);
        } else {
            throw new Error("저장할 방법이 없습니다. 백엔드 서버를 켜거나 '프로젝트 폴더 선택' 버튼을 클릭해주세요.");
        }
    }

    /**
     * YAML Front Matter를 포함한 마크다운 규격 빌드
     */
    buildMarkdown(postData, id) {
        const tagsString = JSON.stringify(postData.tags);
        return `---
id: ${id}
title: "${postData.title.replace(/"/g, '\\"')}"
excerpt: "${postData.excerpt.replace(/"/g, '\\"')}"
category: "${postData.category}"
tags: ${tagsString}
date: "${postData.date}"
updated: "${postData.date}"
readtime: "${postData.readtime}"
---
${postData.body}
`;
    }

    /**
     * 새 게시글을 위한 고유 ID를 가져옵니다.
     */
    async getNextPostId() {
        let maxId = 0;
        try {
            let postsList = [];
            if (this.isBackendOnline) {
                const res = await fetch(`${this.backendUrl}/api/posts`);
                if (res.ok) postsList = await res.json();
            } else if (this.dirHandle) {
                postsList = await this.readPostsJsonFromFileSystem();
            } else {
                // 백엔드가 없고 폴더 선택도 안된 경우, 기존 posts.json fetch 시도
                const res = await fetch('../posts.json');
                if (res.ok) postsList = await res.json();
            }

            // 각 마크다운 파일들의 id를 추적해 최대값 계산
            for (const file of postsList) {
                let mdText = '';
                if (this.isBackendOnline) {
                    const res = await fetch(`${this.backendUrl}/api/posts/${file}`);
                    if (res.ok) mdText = await res.text();
                } else if (this.dirHandle) {
                    mdText = await this.readMarkdownFromFileSystem(file);
                } else {
                    const res = await fetch(`../_posts/${file}`);
                    if (res.ok) mdText = await res.text();
                }

                if (mdText) {
                    const idMatch = mdText.match(/^id:\s*(\d+)/m);
                    if (idMatch) {
                        const id = parseInt(idMatch[1], 10);
                        if (id > maxId) maxId = id;
                    }
                }
            }
        } catch (e) {
            console.error('ID 계산 실패, 기본값(1) 적용:', e);
        }
        return maxId + 1;
    }

    /**
     * 로컬 백엔드를 통한 파일 저장
     */
    async saveViaBackend(filename, markdown, html, postData) {
        const response = await fetch(`${this.backendUrl}/api/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filename,
                markdown,
                html,
                postData
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`백엔드 서버 저장 실패: ${err}`);
        }
        return await response.json();
    }

    /**
     * File System Access API를 통한 파일 저장 및 posts.json 갱신
     */
    async saveViaFileSystem(filenameMD, filenameHTML, markdown, html, postData) {
        try {
            // 1. _posts 폴더에 마크다운 파일 쓰기
            const postsDir = await this.dirHandle.getDirectoryHandle('_posts', { create: true });
            const mdFileHandle = await postsDir.getFileHandle(filenameMD, { create: true });
            const mdWritable = await mdFileHandle.createWritable();
            await mdWritable.write(markdown);
            await mdWritable.close();

            // 2. _pages 폴더에 정적 HTML 쓰기
            const pagesDir = await this.dirHandle.getDirectoryHandle('_pages', { create: true });
            const htmlFileHandle = await pagesDir.getFileHandle(filenameHTML, { create: true });
            const htmlWritable = await htmlFileHandle.createWritable();
            await htmlWritable.write(html);
            await htmlWritable.close();

            // 3. posts.json 파일 업데이트
            const postsList = await this.readPostsJsonFromFileSystem();
            if (!postsList.includes(filenameMD)) {
                postsList.push(filenameMD);
                // 최신글이 앞에 오도록 날짜 기준 내림차순 정렬
                postsList.sort((a, b) => b.localeCompare(a));
                
                const jsonFileHandle = await this.dirHandle.getFileHandle('posts.json', { create: true });
                const jsonWritable = await jsonFileHandle.createWritable();
                await jsonWritable.write(JSON.stringify(postsList, null, 2));
                await jsonWritable.close();
            }

            return { success: true, message: '파일 시스템 저장 성공' };
        } catch (err) {
            console.error(err);
            throw new Error(`로컬 폴더 쓰기 오류: ${err.message}`);
        }
    }

    // 파일시스템 헬퍼 메서드
    async readPostsJsonFromFileSystem() {
        try {
            const fileHandle = await this.dirHandle.getFileHandle('posts.json');
            const file = await fileHandle.getFile();
            const text = await file.text();
            return JSON.parse(text);
        } catch (e) {
            return []; // 없으면 빈배열 반환
        }
    }

    async readMarkdownFromFileSystem(file) {
        try {
            const postsDir = await this.dirHandle.getDirectoryHandle('_posts');
            const fileHandle = await postsDir.getFileHandle(file);
            const fileData = await fileHandle.getFile();
            return await fileData.text();
        } catch (e) {
            return '';
        }
    }
}
