# MANGHO-detector

> **헬다이버즈 갤러리 망호 실시간 감지 확장 프로그램**

해당 프로그램은 [SEAF-assistant](https://github.com/Toddoward/SEAF-Assistant)의 경량화 버전으로, 일부 기능만을 추출하여 개선하였습니다.

개선된 내용은 SEAF-assistant 정식 배포 버전에 반영됩니다.

과거 tampermonkey script 버전은 `5124557` 커밋 시점을 참고하십시오.

---

## 설치 방법

### 소스코드 설치
1. 녹색 `<> Code` 버튼을 누르고 Download ZIP 으로 압축파일 다운로드
  > <img width="428" height="359" alt="image" src="https://github.com/user-attachments/assets/4535e1b1-1d68-4af9-a606-3792bcbe73f1" />

2. 압축 해제
3. Chrome 주소창에 `chrome://extensions/` 입력
4. **개발자 모드** 활성화
5. **압축해제된 확장 프로그램을 로드합니다** 클릭
6. 압축 해제한 폴더 선택

### Chrome Web Store
```
SEAF-assistant 정식 배포를 확인하십시오. 이 프로젝트는 정식 배포 예정이 없습니다.
```
---
## 주요 기능

### foreground scanner
- 게시글 목록에서 모집글 제목에 `참가` 버튼을 추가해 즉시 참여 기능 제공
> <img width="356" height="55" alt="화면 캡처 2026-02-18 152257" src="https://github.com/user-attachments/assets/64e59525-f492-4944-9aa4-d5a849e3af64" />

### background scanner
- 주기적으로 최신 게시글 탐색
- 신규 모집글 감지 시 토스트 알림 제공
> <img width="375" height="133" alt="화면 캡처 2026-02-18 152342" src="https://github.com/user-attachments/assets/bc12a258-0c17-4984-97ae-7bc9fd5bb6c1" />

### configuration
- background scanner ON/OFF
- 탐색 주기 조정 (1~30초)
- 토스트 알림 지속 시간 조정 (3~30초)
> <img width="349" height="397" alt="화면 캡처 2026-02-18 152332" src="https://github.com/user-attachments/assets/fec6e2a7-8a79-4e4f-ad01-c048581f065f" />

---

## 개발 가이드라인
자세한 사항은 SEAF-assistant의 문서를 참조하십시오.

### 네이밍 규칙
- 모든 CSS 클래스: `seaf-` 접두사 (디시인사이드 스타일 충돌 방지)
- 예: `.seaf-toast-container`, `.seaf-btn`, `.seaf-category-grid`

### 요구 사항
- Chrome 88+ (Manifest V3 지원)
- 개발자 모드 활성화
