import BlogApp from './BlogApp.js';

document.addEventListener("DOMContentLoaded", () => {
    const blog = new BlogApp();
    blog.init().catch(err => {
        console.error("블로그 앱 초기화 실패:", err);
    });
});
