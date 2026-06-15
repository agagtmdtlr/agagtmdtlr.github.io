const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
// docs 폴더를 루트로 잡음
const DOCS_DIR = path.resolve(__dirname, '..');

// MIME 타입 매핑
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = decodeURIComponent(url.pathname);

    // API: 상태 체크
    if (pathname === '/api/status' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ status: 'ok' }));
        return;
    }

    // API: 포스트 목록 전체 조회
    if (pathname === '/api/posts' && req.method === 'GET') {
        const postsJsonPath = path.join(DOCS_DIR, 'posts.json');
        fs.readFile(postsJsonPath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify([]));
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(data);
            }
        });
        return;
    }

    // API: 특정 마크다운 파일 원본 조회
    if (pathname.startsWith('/api/posts/') && req.method === 'GET') {
        const file = pathname.replace('/api/posts/', '');
        const filePath = path.join(DOCS_DIR, '_posts', file);
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('파일을 찾을 수 없습니다.');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/markdown; charset=utf-8' });
                res.end(data);
            }
        });
        return;
    }

    // API: 포스트 저장 & 정적 HTML 빌드 & posts.json 업데이트
    if (pathname === '/api/save' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const { filename, markdown, html, postData } = JSON.parse(body);

                if (!filename || !markdown || !html) {
                    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(JSON.stringify({ success: false, message: '필수 데이터가 부족합니다.' }));
                    return;
                }

                // 1. _posts 폴더에 마크다운 파일 쓰기
                const postsDir = path.join(DOCS_DIR, '_posts');
                if (!fs.existsSync(postsDir)) {
                    fs.mkdirSync(postsDir, { recursive: true });
                }
                const mdPath = path.join(postsDir, `${filename}.md`);
                fs.writeFileSync(mdPath, markdown, 'utf8');

                // 2. _pages 폴더에 정적 HTML 쓰기
                const pagesDir = path.join(DOCS_DIR, '_pages');
                if (!fs.existsSync(pagesDir)) {
                    fs.mkdirSync(pagesDir, { recursive: true });
                }
                const htmlPath = path.join(pagesDir, `${filename}.html`);
                fs.writeFileSync(htmlPath, html, 'utf8');

                // 3. posts.json 파일 업데이트
                const postsJsonPath = path.join(DOCS_DIR, 'posts.json');
                let postsList = [];
                if (fs.existsSync(postsJsonPath)) {
                    try {
                        const fileContent = fs.readFileSync(postsJsonPath, 'utf8');
                        postsList = JSON.parse(fileContent);
                    } catch (e) {
                        postsList = [];
                    }
                }

                const filenameMD = `${filename}.md`;
                if (!postsList.includes(filenameMD)) {
                    postsList.push(filenameMD);
                    // 최신글이 앞에 오도록 날짜 기준 내림차순 정렬
                    postsList.sort((a, b) => b.localeCompare(a));
                    fs.writeFileSync(postsJsonPath, JSON.stringify(postsList, null, 2), 'utf8');
                }

                res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: true, message: '발행 및 정적 생성 성공' }));
            } catch (err) {
                console.error(err);
                res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
                res.end(JSON.stringify({ success: false, message: err.message }));
            }
        });
        return;
    }

    // 일반 정적 파일 서빙
    // /SSG 접근 시 후행 슬래시(/)가 없으면 리다이렉트하여 상대 경로 깨짐 방지
    if (pathname === '/SSG') {
        res.writeHead(301, { 'Location': '/SSG/' });
        res.end();
        return;
    }

    let targetPath = pathname;
    if (targetPath === '/') {
        targetPath = '/index.html';
    } else if (targetPath === '/SSG/') {
        targetPath = '/SSG/index.html';
    }

    const filePath = path.join(DOCS_DIR, targetPath);

    // 디렉토리 트래버설 취약점 방지
    if (!filePath.startsWith(DOCS_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Access Denied');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        const stream = fs.createReadStream(filePath);
        stream.pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`========================================`);
    console.log(` 노란귤 블로그 SSG 로컬 개발 서버 작동 중`);
    console.log(` 주소: http://localhost:${PORT}`);
    console.log(` 루트 디렉토리: ${DOCS_DIR}`);
    console.log(`========================================`);
});
