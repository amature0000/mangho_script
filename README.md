# MANGHO-detector

> **헬다이버즈 시리즈 갤러리 망호 실시간 감지 및 자동 참여 Chrome 확장 프로그램**

해당 프로그램은 [SEAF-assistant]()의 경량화 버전으로, 일부 기능만을 추출하여 개선하였습니다.

개선된 내용은 SEAF-assistant 정식 배포 시 반영됩니다.

과거 tempermonkey script 버전은 `5124557` 커밋 시점을 참고하십시오.

---

## 주요 기능

### foreground scanner
- 게시글 목록에서 모집글 제목에 `참가` 버튼을 추가해 즉시 참여 기능 제공

### background scanner
- 사용자 설정(1~30초)에 따른 갤러리 폴링
- 신규 모집글 자동 감지 및 토스트 알림 제공

### configuration
- 갤러리 폴링 ON/OFF
- 폴링 간격 조정 (1~30초)
- 토스트 알림 지속 시간 조정 (3~30초)

---

## 설치 방법

### 소스코드 설치
1. [**Releases 페이지**](../../releases)에서 `Source code (zip)` 다운로드
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
## 개발 가이드라인
자세한 사항은 SEAF-assistant의 문서를 참조하십시오.

### 네이밍 규칙
- 모든 CSS 클래스: `seaf-` 접두사 (디시인사이드 스타일 충돌 방지)
- 예: `.seaf-toast-container`, `.seaf-btn`, `.seaf-category-grid`

### 요구 사항
- Chrome 88+ (Manifest V3 지원)
- 개발자 모드 활성화
