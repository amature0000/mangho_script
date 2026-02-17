const SEAF_CONTENT = {
  /**
   * 페이지 타입 감지
   */
  isWritePage: () => window.location.href.includes('board/write'),
  isListPage: () => window.location.href.includes('board/lists'),
  isViewPage: () => window.location.href.includes('board/view'),
  isHelldiversseriesgallery: () => window.location.href.includes('id=helldiversseries'),

  /**
   * 토스트 알림 생성
   */
  createToast: function (postId, title, duration) {
    // 컨테이너 확인 또는 생성
    let container = document.getElementById('seaf-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'seaf-toast-container';
      container.className = 'seaf-toast-container';
      document.body.appendChild(container);
    }

    // 토스트 생성
    const toast = document.createElement('div');
    toast.className = 'seaf-toast-item';

    const postUrl = `https://gall.dcinside.com/mgallery/board/view/?id=helldiversseries&no=${postId}`;

    toast.innerHTML = `
      <div class="seaf-toast-header">📡 새 임무</div>
      <a href="${postUrl}" target="_blank" class="seaf-toast-body" title="${title}">
        ${title}
      </a>
      <div class="seaf-toast-actions">
        <a href="" class="seaf-toast-btn">참가</a>
        <button class="seaf-toast-close-btn">닫기</button>
      </div>
    `;

    container.appendChild(toast);

    // 버튼 클릭 시 참가 로직
    toast.querySelector('.seaf-toast-btn').onclick = (e) => {
      e.preventDefault();
      const btn = e.target;
      btn.innerText = '...';
      btn.disabled = true;

      // 해당 게시글 id로 fetch
      chrome.runtime.sendMessage(
        { type: "GET_LOBBY_LINK", postId: postId },
        (response) => {
          if (response?.link) {
            window.location.href = response.link;
            btn.innerText = '성공🚀';
          } else {
            btn.innerText = '오류: 링크 없음';
          }
        }
      );
    };

    // 애니메이션 시작
    setTimeout(() => toast.classList.add('seaf-show'), 10);

    // 닫기 함수
    const close = () => {
      toast.classList.remove('seaf-show');
      setTimeout(() => toast.remove(), 400);
    };

    // 닫기 버튼 이벤트
    toast.querySelector('.seaf-toast-close-btn').onclick = close;

    // 자동 닫기
    setTimeout(close, duration);
  },

  /**
   * 목록 페이지 - 빠른 참여 버튼 주입
   */
  enhanceListPage: function () {
    const posts = document.querySelectorAll('.ub-content');

    posts.forEach(post => {
      if (post.hasAttribute('data-seaf-processed')) return;

      const subjectTd = post.querySelector('.gall_subject');
      const titleTd = post.querySelector('.gall_tit.ub-word');

      // 헬망호 게시글만 처리
      if (subjectTd && subjectTd.innerText.trim() === '헬망호' && titleTd) {
        const postLink = titleTd.querySelector('a')?.href;
        if (!postLink) return;

        post.setAttribute('data-seaf-processed', 'true');

        // 게시글 번호 추출
        const postIdMatch = postLink.match(/no=(\d+)/);
        if (!postIdMatch) return;
        const postId = postIdMatch[1];

        // 버튼 생성
        const btn = document.createElement('a');
        btn.href = "#"; // 
        btn.className = 'seaf-fast-join-btn';
        btn.innerText = '참가';

        // 사용자가 클릭 시에만 동작
        btn.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();

          const originalText = btn.innerText;
          btn.innerText = '...';
          btn.style.opacity = '0.5';

          // background.js에 로비 링크 요청
          chrome.runtime.sendMessage(
            { type: "GET_LOBBY_LINK", postId: postId },
            (response) => {
              if (response?.link) {
                window.location.href = response.link;
                btn.innerText = "성공🚀";
                setTimeout(() => {
                  btn.innerText = originalText;
                }, 2000);
              } else {
                btn.innerText = '링크 없음';
              }
            }
          );
        };

        titleTd.querySelector('a').after(btn);
      }
    });
  },

  /**
   * 초기화
   */
  init: function () {
    // 목록 페이지
    if (this.isListPage() || this.isViewPage()) {
      this.enhanceListPage();
    }

    // background.js로부터 알림 수신
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === "SEAF_NEW_POST") {
        this.createToast(
          message.postId,
          message.title,
          message.lobbyLink,
          message.toastDuration
        );
      }
    });
  }
};

// 실행
SEAF_CONTENT.init();