// ==UserScript==
// @name         헬망호 실시간 자동 탐지기
// @namespace    http://tampermonkey.net/
// @version      4.8
// @description  새로고침 없이도 20초마다 백그라운드에서 새 글을 감지하며, 한 번 스캔한 데이터는 저장하여 즉시 버튼을 생성합니다.
// @author       Gemini
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

    // --- [사용자 설정] ---
    const TARGET_SUBJECT = "헬망호";
    const MAX_POST_AGE_MS = 5 * 60 * 1000;
    const SCAN_INTERVAL = 20000; // 백그라운드 체크 주기 (20초)
    const STORAGE_KEY = 'hd_notified_posts';

    const lobbyRegex = /steam:\/\/joinlobby\/\d+\/\d+/;
    const consoleRegex = /#\d{4}-\d{4}/;

    const params = new URLSearchParams(window.location.search);
    const galleryId = params.get('id');
    const isMgallery = window.location.href.includes('/mgallery/');
    const listUrl = `https://gall.dcinside.com/${isMgallery ? 'mgallery/board' : 'board'}/lists/?id=${galleryId}`;

    let notifiedPosts = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

    // --- [유틸리티] ---
    function cleanupStorage() {
        const now = Date.now();
        let changed = false;
        for (const url in notifiedPosts) {
            // 하위 버전 호환성 고려 및 시간 체크
            const postData = notifiedPosts[url];
            const postTime = typeof postData === 'number' ? postData : postData.time;

            // 12시간 (12 * 60 * 60 * 1000) 경과 시 삭제
            if (now - postTime > 12 * 60 * 60 * 1000) {
                delete notifiedPosts[url];
                changed = true;
            }
        }
        if (changed) localStorage.setItem(STORAGE_KEY, JSON.stringify(notifiedPosts));
    }

    function saveNotified(url, lobbyStr, consoleStr) {
        // 통신 후 찾아낸 링크 정보를 시간과 함께 캐시로 저장
        notifiedPosts[url] = {
            time: Date.now(),
            lobby: lobbyStr,
            console: consoleStr
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifiedPosts));
    }

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // --- [UI 스타일] ---
    GM_addStyle(`
        #hd-notification-container { position: fixed; top: 20px; right: 20px; z-index: 10000; width: 300px; }
        .hd-notice { background: #1a1a1a; color: #f1c40f; border: 2px solid #f1c40f; padding: 15px; margin-bottom: 10px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.5); animation: slideIn 0.5s ease-out; position: relative; }
        @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .hd-notice-title { font-weight: bold; font-size: 13px; margin-bottom: 8px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .hd-btn-base { display: inline-block !important; margin-left: 8px !important; padding: 4px 10px !important; font-size: 11px !important; font-weight: bold !important; border-radius: 4px !important; text-decoration: none !important; border: 1px solid #000 !important; cursor: pointer !important; }
        .hd-lobby-link { background-color: #f1c40f !important; color: #000 !important; }
        .hd-console-copy { background-color: #3498db !important; color: #fff !important; }
    `);

    const container = document.createElement('div');
    container.id = 'hd-notification-container';
    document.body.appendChild(container);

    function showNotification(title, link) {
        const notice = document.createElement('div');
        notice.className = 'hd-notice';
        notice.innerHTML = `
            <div class="hd-notice-title">${title}</div>
            <div style="font-size:11px;">📡 실시간 새 글 감지!</div>
            <a href="${link}" class="hd-btn-base hd-lobby-link" style="margin-top:10px; display:block; text-align:center;">참가하기</a>
        `;
        container.appendChild(notice);
        setTimeout(() => {
            notice.style.opacity = '0';
            notice.style.transition = '0.5s';
            setTimeout(() => notice.remove(), 500);
        }, 15000);
    }

    // --- [핵심 로직] ---
    async function fetchAndProcess(url, titleText) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: "GET",
                url: url,
                headers: { "Cache-Control": "no-cache" },
                onload: function(res) {
                    const doc = new DOMParser().parseFromString(res.responseText, "text/html");
                    const content = doc.querySelector('.write_div');
                    if (!content) return resolve();

                    const text = content.innerText;
                    const lobbyMatch = text.match(lobbyRegex);
                    const consoleMatch = text.match(consoleRegex);

                    const lobbyStr = lobbyMatch ? lobbyMatch[0] : null;
                    const consoleStr = consoleMatch ? consoleMatch[0] : null;

                    // 스캔 내역 및 추출한 데이터 저장 (중복 통신 방지)
                    if (!notifiedPosts[url]) {
                        if (lobbyStr) showNotification(titleText, lobbyStr);
                        saveNotified(url, lobbyStr, consoleStr);
                    }

                    const onScreenTitle = document.querySelector(`.gall_tit a[href*="${url.split('no=')[1].split('&')[0]}"]`);

                    if (onScreenTitle) {
                        // 1. 로비 링크 버튼 부착
                        if (lobbyStr && !onScreenTitle.parentNode.querySelector('.hd-lobby-link')) {
                            const btn = document.createElement('a');
                            btn.href = lobbyStr;
                            btn.className = 'hd-btn-base hd-lobby-link';
                            btn.textContent = '참가 🚀';
                            onScreenTitle.parentNode.appendChild(btn);
                        }

                        // 2. 콘솔 코드 버튼 부착
                        if (consoleStr && !onScreenTitle.parentNode.querySelector('.hd-console-copy')) {
                            const cBtn = document.createElement('span');
                            cBtn.className = 'hd-btn-base hd-console-copy';
                            cBtn.textContent = '콘솔 복사';
                            cBtn.onclick = (e) => {
                                e.stopPropagation();
                                GM_setClipboard(consoleStr);
                                cBtn.textContent = '복사됨!';
                                setTimeout(() => cBtn.textContent = '콘솔 복사', 1000);
                            };
                            onScreenTitle.parentNode.appendChild(cBtn);
                        }
                    }
                    resolve();
                },
                onerror: () => resolve()
            });
        });
    }

    async function backgroundScanner() {
        cleanupStorage();
        const now = Date.now();
        const hour = new Date().getHours();
        const isNight = (hour >= 0 && hour < 7);

        GM_xmlhttpRequest({
            method: "GET",
            url: listUrl,
            headers: { "Cache-Control": "no-cache" },
            onload: async function(res) {
                const doc = new DOMParser().parseFromString(res.responseText, "text/html");
                const posts = doc.querySelectorAll('.us-post, .ub-content');

                for (const post of posts) {
                    const subjectEl = post.querySelector('.gall_subject');
                    const titleA = post.querySelector('.gall_tit a:not(.reply_numbox)');
                    const dateEl = post.querySelector('.gall_date');

                    if (!titleA || !dateEl || !subjectEl) continue;

                    const url = titleA.href;
                    const titleText = titleA.textContent.trim();

                    // 필터 1: 말머리
                    if (!subjectEl.textContent.trim().includes(TARGET_SUBJECT)) continue;

                    // 필터 2: 시간
                    const fullDateStr = dateEl.getAttribute('title');
                    if (fullDateStr) {
                        const postTime = new Date(fullDateStr.replace(/-/g, '/')).getTime();
                        if (now - postTime > MAX_POST_AGE_MS) continue;
                    }

                    // 필터 3: 데이터 캐싱 적용 (통신 전 로컬 스토리지 확인)
                    const cachedData = notifiedPosts[url];
                    if (cachedData) {
                        const onScreenTitle = document.querySelector(`.gall_tit a[href*="${url.split('no=')[1].split('&')[0]}"]`);
                        const hasBtn = onScreenTitle?.parentNode.querySelector('.hd-btn-base');

                        // 화면에 글 요소가 보이지만 아직 버튼이 없는 경우, 저장된 데이터로 즉시 생성
                        if (onScreenTitle && !hasBtn && typeof cachedData === 'object') {
                            if (cachedData.lobby) {
                                const btn = document.createElement('a');
                                btn.href = cachedData.lobby;
                                btn.className = 'hd-btn-base hd-lobby-link';
                                btn.textContent = '참가 🚀';
                                onScreenTitle.parentNode.appendChild(btn);
                            }
                            if (cachedData.console) {
                                const cBtn = document.createElement('span');
                                cBtn.className = 'hd-btn-base hd-console-copy';
                                cBtn.textContent = '콘솔 복사';
                                cBtn.onclick = (e) => {
                                    e.stopPropagation();
                                    GM_setClipboard(cachedData.console);
                                    cBtn.textContent = '복사됨!';
                                    setTimeout(() => cBtn.textContent = '콘솔 복사', 1000);
                                };
                                onScreenTitle.parentNode.appendChild(cBtn);
                            }
                        }
                        // 한 번 스캔한 글은 통신 절차를 생략하고 넘어감
                        continue;
                    }

                    // 조건 충족 시 본문 확인 (캐시에 없는 글만 fetch 실행)
                    await fetchAndProcess(url, titleText);
                    await sleep(2000 + (Math.random() * 2000));
                }
            }
        });

        const currentInterval = isNight ? 45000 : SCAN_INTERVAL;
        setTimeout(backgroundScanner, currentInterval + (Math.random() * 5000));
    }

    // 초기 실행
    backgroundScanner();
})();