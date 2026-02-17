document.addEventListener('DOMContentLoaded', async () => {
  // 버전 정보 설정
  const manifestData = chrome.runtime.getManifest();
  const versionDisplay = document.getElementById('seaf-version-display');
  if (versionDisplay) {
    versionDisplay.innerText = `MANGHO detector v${manifestData.version}`;
  }
  initSettingsPage();
});

/**
 * settings.html 초기화
 */
async function initSettingsPage() {
  const detectionToggle = document.getElementById('seaf-detection-toggle');
  const pollingSlider = document.getElementById('seaf-polling-slider');
  const pollingValue = document.getElementById('seaf-polling-value');
  const toastDurationSlider = document.getElementById('seaf-toast-duration-slider');
  const toastDurationValue = document.getElementById('seaf-toast-duration-value');
  const saveStatus = document.getElementById('seaf-save-status');

  // 기본 설정값
  let currentSettings = {
    isDetectionActive: true,
    pollingInterval: 5,
    toastDuration: 6
  };

  // 저장된 설정 불러오기
  const saved = await chrome.storage.local.get(['seaf_settings']);
  if (saved.seaf_settings) {
    currentSettings = { ...currentSettings, ...saved.seaf_settings };
  }

  // UI 반영
  detectionToggle.checked = currentSettings.isDetectionActive;
  pollingSlider.value = currentSettings.pollingInterval;
  pollingValue.innerText = `${currentSettings.pollingInterval}초`;
  toastDurationSlider.value = currentSettings.toastDuration;
  toastDurationValue.innerText = `${currentSettings.toastDuration}초`;

  /**
   * 자동 저장 함수
   */
  async function autoSave() {
    await chrome.storage.local.set({ seaf_settings: currentSettings });
    chrome.runtime.sendMessage({ type: "SETTINGS_UPDATED" });
    showStatus("설정 저장됨");
  }

  /**
   * 토글 변경
   */
  detectionToggle.onchange = async (e) => {
    currentSettings.isDetectionActive = e.target.checked;
    await autoSave();
  };

  /**
   * 폴링 간격 변경
   */
  pollingSlider.oninput = (e) => {
    const value = parseInt(e.target.value);
    pollingValue.innerText = `${value}초`;
    currentSettings.pollingInterval = value;
  };

  pollingSlider.onchange = async () => {
    await autoSave();
  };

  /**
   * 토스트 지속 시간 변경
   */
  toastDurationSlider.oninput = (e) => {
    const value = parseInt(e.target.value);
    toastDurationValue.innerText = `${value}초`;
    currentSettings.toastDuration = value;
  };

  toastDurationSlider.onchange = async () => {
    await autoSave();
  };

  /**
   * 상태 메시지 표시
   */
  function showStatus(msg) {
    saveStatus.innerText = msg;
    saveStatus.style.color = 'var(--seaf-color-primary)';
    setTimeout(() => { saveStatus.innerText = ""; }, 2000);
  }
}