// ==UserScript==
// @name         망호파인더
// @namespace    http://tampermonkey.net/
// @version      v0.0.1
// @description  화면 스캔과 크롤링 로직을 분리했으며, lazy fetching을 통해 ip 밴 가능성을 완화
// @author       amature0000
// @match        https://gall.dcinside.com/mgallery/board/lists*id=helldiversseries*
// @match        https://gall.dcinside.com/board/lists*id=helldiversseries*
// @match        https://gall.dcinside.com/mgallery/board/view*id=helldiversseries*
// @match        https://gall.dcinside.com/board/view*id=helldiversseries*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_setClipboard
// @connect      gall.dcinside.com
// ==/UserScript==

(function() {
    'use strict';

    // --- [설정] ---
    // 
    const TARGET_SUBJECT = "헬망호";
    const SCAN_INTERVAL = 20000;
    const DEADLINE = 10 * 60 * 1000;
    const STORAGE_KEY = 'hd_scanner_last_id';

    const lobbyRegex = /steam:\/\/joinlobby\/\d+\/\d+/;
    const consoleRegex = /#\d{4}-\d{4}/;

    const listUrl = "https://gall.dcinside.com/mgallery/board/lists/?id=helldiversseries&sort_type=N&search_head=60&page=1";

    let lastMaxId = parseInt(localStorage.getItem(STORAGE_KEY) || "0");

    // --- [UI 스타일] ---
    GM_addStyle(`
        #hd-notification-container { position: fixed; top: 20px; right: 20px; z-index: 10000; width: 300px; }
        .hd-notice { background: #1a1a1a; color: #f1c40f; border: 2px solid #f1c40f; padding: 15px; margin-bottom: 10px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); animation: slideIn 0.5s ease-out; }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .hd-notice-title { font-weight: bold; font-size: 13px; margin-bottom: 8px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .hd-btn-base { display: inline-block !important; margin-left: 8px !important; padding: 2px 8px !important; font-size: 11px !important; font-weight: bold !important; border-radius: 4px !important; text-decoration: none !important; border: 1px solid #000 !important; cursor: pointer !important; }
        .hd-lobby-ready { background-color: #f1c40f !important; color: #000 !important; }
        .hd-loading { background-color: #7f8c8d !important; color: #fff !important; cursor: wait !important; }
    `);

    const container = document.createElement('div');
    container.id = 'hd-notification-container';
    document.body.appendChild(container);

    // url을 fetch하고 내부 링크를 실행하는 함수
    async function processPostContent(url, btnElement) {
        if (btnElement.classList.contains('hd-loading')) return;
        btnElement.textContent = '...';
        btnElement.classList.add('hd-loading');

        GM_xmlhttpRequest({
            method: "GET",
            url: url,
            onload: function(res) {
                const doc = new DOMParser().parseFromString(res.responseText, "text/html");
                const content = doc.querySelector('.write_div');
                if (!content) { btnElement.textContent = '삭제됨'; return; }

                const text = content.innerText;
                const lobbyMatch = text.match(lobbyRegex);
                const consoleMatch = text.match(consoleRegex);

                if (lobbyMatch) {
                    window.location.href = lobbyMatch[0];
                    btnElement.textContent = '성공🚀';
                } else if (consoleMatch) {
                    GM_setClipboard(consoleMatch[0]);
                    btnElement.textContent = '복사됨!';
                } else {
                    btnElement.textContent = '없음';
                }
                setTimeout(() => { btnElement.textContent = '참가'; btnElement.classList.remove('hd-loading'); }, 2000);
            }
        });
    }

    // 실시간 알림창
    function showNotification(title, url) {
        const notice = document.createElement('div');
        notice.className = 'hd-notice';
        notice.innerHTML = `
            <div class="hd-notice-title">${title}</div>
            <div style="font-size:11px; margin-bottom:10px;">📡 새 임무</div>
            <button class="hd-btn-base hd-lobby-ready" style="width:100%;">지금 확인 및 참가</button>
        `;
        // lazy loading
        notice.querySelector('button').onclick = function() { processPostContent(url, this); };
        container.appendChild(notice);
        setTimeout(() => {
            notice.style.opacity = '0';
            notice.style.transition = '0.5s';
            setTimeout(() => notice.remove(), 500);
        }, 15000);
    }

    // 현재 화면에서 "헬망호" 탭 글에 참가 버튼을 추가
    function foregroundScanner() {
        const posts = document.querySelectorAll('.us-post, .ub-content');
        posts.forEach(post => {
            const titleA = post.querySelector('.gall_tit a:not(.reply_numbox)');
            const subjectEl = post.querySelector('.gall_subject');
            if (!titleA || !subjectEl) return;

            if (subjectEl.textContent.trim().includes(TARGET_SUBJECT)) {
                if (!post.querySelector('.hd-btn-base')) {
                    const btn = document.createElement('span');
                    btn.className = 'hd-btn-base hd-lobby-ready';
                    btn.textContent = '참가';
                    btn.onclick = (e) => {
                        e.preventDefault(); e.stopPropagation();
                        processPostContent(titleA.href, btn);
                    };
                    titleA.parentNode.appendChild(btn);
                }
            }
        });
    }

// 주기적으로 게시글 리스트를 fetch해서 새 글이 있는지 검사 후 알림
    async function backgroundScanner() {
        const now = Date.now();

        GM_xmlhttpRequest({
            method: "GET",
            url: listUrl,
            headers: { "Cache-Control": "no-cache" },
            onload: function(res) {
                const doc = new DOMParser().parseFromString(res.responseText, "text/html");
                const posts = Array.from(doc.querySelectorAll('.us-post, .ub-content')).reverse();

                let currentMaxId = lastMaxId;

                posts.forEach(post => {
                    const titleA = post.querySelector('.gall_tit a:not(.reply_numbox)');
                    const dateEl = post.querySelector('.gall_date');
                    if (!titleA || !dateEl) return;

                    const postIdMatch = titleA.href.match(/no=(\d+)/);
                    if (!postIdMatch) return;
                    const postId = parseInt(postIdMatch[1]);

                    // 파싱
                    const fullDateStr = dateEl.getAttribute('title');
                    let isRecent = true;
                    if (fullDateStr) {
                        const postTime = new Date(fullDateStr.replace(/-/g, '/')).getTime();
                        isRecent = (now - postTime < DEADLINE);
                    }

                    // 최근 작성된 글이며, 이전에 알림을 보내지 않은 글만 notify
                    if (postId > lastMaxId && isRecent) {
                        showNotification(titleA.textContent.trim(), titleA.href);
                    }
                    if (postId > currentMaxId) currentMaxId = postId;
                });

                // ID 저장
                if (currentMaxId > lastMaxId) {
                    lastMaxId = currentMaxId;
                    localStorage.setItem(STORAGE_KEY, lastMaxId.toString());
                }
            }
        });
        setTimeout(backgroundScanner, SCAN_INTERVAL + (Math.random() * 3000));
    }

    // --------------------------
    foregroundScanner();
    setTimeout(backgroundScanner, SCAN_INTERVAL); // 최초 딜레이 부여
})();