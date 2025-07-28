// Sora ChatGPT 라이브러리 페이지에서 이미지와 프롬프트 수집

// Chrome i18n 지원 함수들
function getCurrentLanguage() {
    return chrome.i18n.getUILanguage().split('-')[0] || 'en';
}

function getLocalizedMessage(messageKey, substitutions = []) {
    return chrome.i18n.getMessage(messageKey, substitutions) || messageKey;
}

// 이미지와 프롬프트 데이터 저장소
let savedImages = [];
let savedPrompts = [];

// 언어 설정
let currentLanguage = 'en';

// 페이지 컨트롤 패널
let controlPanel = null;
let isPanelCreated = false;

// 카운트다운 관련 변수
let pageCountdownTimer = null;
let pageCountdownInterval = null;

// 페이지 로드 시 기존 데이터 불러오기
chrome.storage.local.get(['savedImages', 'savedPrompts', 'language'], function(result) {
  if (result.savedImages) {
    savedImages = result.savedImages;
  }
  if (result.savedPrompts) {
    savedPrompts = result.savedPrompts;
  }
  
  // 언어 설정 로드
  if (result.language) {
    currentLanguage = result.language;
  }
  
  console.log(getLocalizedMessage('consoleLogs.existingDataLoaded'), {
    images: savedImages.length,
    prompts: savedPrompts.length,
    language: currentLanguage
  });
});

// Chrome 저장소 변경 감지 (실시간 언어 변경)
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'local' && changes.language) {
    const newLanguage = changes.language.newValue;
    if (newLanguage && newLanguage !== currentLanguage) {
      console.log('언어 설정 변경 감지:', newLanguage);
      changePanelLanguage(newLanguage);
    }
  }
});

// 팝업으로부터의 메시지 수신
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'languageChanged') {
    console.log('팝업으로부터 언어 변경 메시지 수신:', request.language);
    changePanelLanguage(request.language);
  }
});

// 페이지 카운트다운 시작
function startPageCountdown(seconds) {
  stopPageCountdown(); // 기존 타이머 정리
  
  const countdown = document.getElementById('page-countdown');
  const countdownNumber = document.getElementById('page-countdown-number');
  
  if (!countdown || !countdownNumber) return;
  
  let remainingSeconds = seconds;
  
  // 초기 표시
  countdown.style.display = 'block';
  countdownNumber.textContent = remainingSeconds;
  
  // 1초마다 업데이트
  pageCountdownInterval = setInterval(() => {
    remainingSeconds--;
    countdownNumber.textContent = remainingSeconds;
    
    if (remainingSeconds <= 0) {
      clearInterval(pageCountdownInterval);
      pageCountdownInterval = null;
      
      // 자동 저장 시 진행 단계 표시
      resetProcessSteps();
      updateProcessStep(1, 'running', '자동 저장 시작');
      
      setTimeout(() => {
        updateProcessStep(1, 'success', '완료');
        updateProcessStep(2, 'running', '자동 수집 중...');
        
        // 페이지에서 직접 저장 실행
        console.log(getLocalizedMessage('consoleLogs.countdownComplete'));
        const result = saveImagesAndPrompts();
        
        if (result.success) {
          updateProcessStep(2, 'success', `이미지 ${result.imageCount}개, 프롬프트 ${result.promptCount}개`);
          updateProcessStep(3, 'running', '자동 저장 중...');
          
          setTimeout(() => {
            updateProcessStep(3, 'success', '저장 완료');
            
            // 자동 다운로드 확인
            const autoDownloadEnabled = document.getElementById('page-auto-download-toggle')?.checked;
            if (autoDownloadEnabled) {
              updateProcessStep(4, 'running', '자동 다운로드 중...');
              
              setTimeout(() => {
                performDownload();
                updateProcessStep(4, 'success', '다운로드 완료');
                console.log(getLocalizedMessage('consoleLogs.autoDownloadComplete'));
              }, 500);
            }
          }, 300);
        } else {
          updateProcessStep(2, 'error', '수집 실패');
          updateProcessStep(3, 'error', '저장 실패');
        }
      }, 500);
      
      // 새로운 카운트다운 시작
      setTimeout(() => {
        const autoSaveEnabled = document.getElementById('page-auto-save-toggle')?.checked;
        if (autoSaveEnabled) {
          startPageCountdown(30); // 30초로 재시작
        }
      }, 3000); // 진행 단계 표시 후 3초 뒤 재시작
    }
  }, 1000);
}

// 페이지 카운트다운 중지
function stopPageCountdown() {
  if (pageCountdownInterval) {
    clearInterval(pageCountdownInterval);
    pageCountdownInterval = null;
  }
  
  const countdown = document.getElementById('page-countdown');
  if (countdown) {
    countdown.style.display = 'none';
  }
}

// 페이지 컨트롤 패널 생성
function createControlPanel() {
  if (isPanelCreated) return;
  
  // 기존 패널 제거
  const existingPanel = document.getElementById('sora-auto-save-panel');
  if (existingPanel) {
    existingPanel.remove();
  }
  
  // 새로운 패널 생성
  controlPanel = document.createElement('div');
  controlPanel.id = 'sora-auto-save-panel';
  controlPanel.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 280px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 15px;
    padding: 15px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: white;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.2);
  `;
  
  // 패널 내용
  controlPanel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <h3 style="margin: 0; font-size: 14px; font-weight: 600;">🎨 Sora Auto Save</h3>
      <button id="minimize-panel" style="background: none; border: none; color: white; cursor: pointer; font-size: 16px;">−</button>
    </div>
    
    <div id="panel-content">
      <!-- 진행 단계 표시 -->
      <div id="process-steps" style="margin-bottom: 12px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">
        <div style="font-size: 12px; font-weight: bold; margin-bottom: 8px; color: #fff200;">📋 진행 단계</div>
        <div id="step-list" style="font-size: 10px; line-height: 1.4;">
          <div id="step-1" style="margin-bottom: 3px;">⏳ 1. 데이터 수집 준비</div>
          <div id="step-2" style="margin-bottom: 3px;">⏳ 2. 이미지 및 프롬프트 수집</div>
          <div id="step-3" style="margin-bottom: 3px;">⏳ 3. 데이터 저장</div>
          <div id="step-4" style="margin-bottom: 3px;">⏳ 4. 파일 관리</div>
        </div>
      </div>
      
      <!-- 자동 기능 설정 -->
      <div style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 12px;" id="auto-save-label">자동 저장</span>
          <label class="toggle-switch" style="width: 40px; height: 20px; margin: 0;">
            <input type="checkbox" id="page-auto-save-toggle" style="opacity: 0; width: 0; height: 0;">
            <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255,255,255,0.3); transition: .4s; border-radius: 20px;">
              <span style="position: absolute; content: ''; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%;"></span>
            </span>
          </label>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 12px;" id="auto-download-label">자동 다운로드</span>
          <label class="toggle-switch" style="width: 40px; height: 20px; margin: 0;">
            <input type="checkbox" id="page-auto-download-toggle" style="opacity: 0; width: 0; height: 0;">
            <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255,255,255,0.3); transition: .4s; border-radius: 20px;">
              <span style="position: absolute; content: ''; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%;"></span>
            </span>
          </label>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
        <button id="page-manual-save" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px; border-radius: 8px; cursor: pointer; font-size: 11px; transition: all 0.3s;">📸 수동 저장</button>
        <button id="page-download" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px; border-radius: 8px; cursor: pointer; font-size: 11px; transition: all 0.3s;">💾 다운로드</button>
      </div>
      
      <div id="page-stats" style="font-size: 11px; line-height: 1.4; background: rgba(255,255,255,0.1); padding: 8px; border-radius: 8px;">
        📊 저장 통계<br>
        이미지: 0개 | 프롬프트: 0개<br>
        <span id="file-management-status" style="color: #4CAF50;">🗂️ 파일 관리: 활성화 (최대 10개)</span>
      </div>
      
      <div id="page-countdown" style="display: none; text-align: center; margin-top: 8px; font-size: 12px; font-weight: bold; background: rgba(255,255,255,0.15); padding: 8px; border-radius: 8px;">
        <span id="countdown-text">⏰ 다음 저장까지:</span> <span id="page-countdown-number" style="color: #ffeb3b;">30</span><span id="countdown-unit">초</span>
      </div>
      

      
      <div id="page-status" style="font-size: 10px; text-align: center; margin-top: 8px; color: rgba(255,255,255,0.8);">
        페이지에서 직접 실행
      </div>
    </div>
  `;
  
  // 패널을 페이지에 추가
  document.body.appendChild(controlPanel);
  isPanelCreated = true;
  
  // 이벤트 리스너 추가
  addPanelEventListeners();
  
  // 초기 텍스트 설정
  updatePanelTexts();
  
  // 초기 상태 설정
  loadPanelState();
  
  console.log(getLocalizedMessage('consoleLogs.controlPanelCreated'));
}

// 패널 이벤트 리스너 추가
function addPanelEventListeners() {
  // 최소화 버튼
  document.getElementById('minimize-panel').addEventListener('click', function() {
    const content = document.getElementById('panel-content');
    const button = this;
    
    if (content.style.display === 'none') {
      content.style.display = 'block';
      button.textContent = '−';
    } else {
      content.style.display = 'none';
      button.textContent = '+';
    }
  });
  
  // 자동 저장 토글
  document.getElementById('page-auto-save-toggle').addEventListener('change', function() {
    const isEnabled = this.checked;
    
    if (isEnabled) {
      // 페이지에서 직접 카운트다운 시작 (백그라운드 통신 없이)
      startPageCountdown(30);
      console.log(getLocalizedMessage('consoleLogs.autoSaveStarted'));
    } else {
      // 카운트다운 중지
      stopPageCountdown();
      console.log(getLocalizedMessage('consoleLogs.autoSaveStopped'));
    }
    
    // 상태 저장
    savePanelState();
  });
  
  // 자동 다운로드 토글
  document.getElementById('page-auto-download-toggle').addEventListener('change', function() {
    const isEnabled = this.checked;
    
    // 상태 저장
    savePanelState();
    
    console.log(getLocalizedMessage('consoleLogs.autoDownloadToggle'), isEnabled ? 'ON' : 'OFF');
  });
  
  // 수동 저장 버튼
  document.getElementById('page-manual-save').addEventListener('click', function() {
    console.log(getLocalizedMessage('consoleLogs.manualSaveExecuted'));
    
    // 진행 단계 초기화
    resetProcessSteps();
    
    // Step 1: 데이터 수집 준비
    updateProcessStep(1, 'running', '준비 중...');
    
    setTimeout(() => {
      updateProcessStep(1, 'success', '완료');
      
      // Step 2: 이미지 및 프롬프트 수집
      updateProcessStep(2, 'running', '수집 중...');
      
      setTimeout(() => {
        // 페이지에서 직접 저장 실행
        const result = saveImagesAndPrompts();
        
        if (result.success) {
          updateProcessStep(2, 'success', `이미지 ${result.imageCount}개, 프롬프트 ${result.promptCount}개`);
          
          // Step 3: 데이터 저장
          updateProcessStep(3, 'running', '저장 중...');
          
          setTimeout(() => {
            updateProcessStep(3, 'success', '저장 완료');
            updatePageStats();
            
            console.log(getLocalizedMessage('consoleLogs.manualSaveComplete'), result);
            
            // 버튼 효과
            this.style.background = 'rgba(76, 175, 80, 0.4)';
            setTimeout(() => {
              this.style.background = 'rgba(255,255,255,0.2)';
            }, 1000);
          }, 300);
          
        } else {
          updateProcessStep(2, 'error', '수집 실패');
          updateProcessStep(3, 'error', '저장 실패');
          
          console.error('수동 저장 실패:', result.error);
          
          // 버튼 효과 (에러)
          this.style.background = 'rgba(244, 67, 54, 0.4)';
          setTimeout(() => {
            this.style.background = 'rgba(255,255,255,0.2)';
          }, 1000);
        }
      }, 500);
    }, 200);
  });
  
  // 다운로드 버튼
  document.getElementById('page-download').addEventListener('click', function() {
    console.log(getLocalizedMessage('consoleLogs.downloadExecuted'));
    
    // Step 4: 파일 관리
    updateProcessStep(4, 'running', '다운로드 및 파일 관리 중...');
    
    performDownload();
    
    // 파일 관리 완료 표시 (약간의 지연 후)
    setTimeout(() => {
      updateProcessStep(4, 'success', '다운로드 완료, 파일 관리됨');
    }, 1000);
    
    // 버튼 효과
    this.style.background = 'rgba(255,255,255,0.4)';
    setTimeout(() => {
      this.style.background = 'rgba(255,255,255,0.2)';
    }, 200);
  });
}

// 확장 프로그램 컨텍스트 검증 함수
function isExtensionContextValid() {
  try {
    return typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
  } catch (error) {
    console.error('❌ 확장 프로그램 컨텍스트 검증 실패:', error);
    return false;
  }
}

// 안전한 chrome.storage 사용 함수
function safeChromeStorageSet(data, callback) {
  if (!isExtensionContextValid()) {
    console.warn('⚠️ 확장 프로그램 컨텍스트가 무효화되어 저장을 건너뜁니다.');
    if (callback) callback({ success: false, error: 'Extension context invalidated' });
    return;
  }
  
  try {
    chrome.storage.local.set(data, callback);
  } catch (error) {
    console.error('❌ chrome.storage 저장 실패:', error);
    if (callback) callback({ success: false, error: error.message });
  }
}

function safeChromeStorageGet(keys, callback) {
  if (!isExtensionContextValid()) {
    console.warn('⚠️ 확장 프로그램 컨텍스트가 무효화되어 데이터를 가져올 수 없습니다.');
    if (callback) callback({ success: false, error: 'Extension context invalidated' });
    return;
  }
  
  try {
    chrome.storage.local.get(keys, callback);
  } catch (error) {
    console.error('❌ chrome.storage 가져오기 실패:', error);
    if (callback) callback({ success: false, error: error.message });
  }
}

// 패널 상태 저장
function savePanelState() {
  const autoSaveEnabled = document.getElementById('page-auto-save-toggle').checked;
  const autoDownloadEnabled = document.getElementById('page-auto-download-toggle').checked;
  
  safeChromeStorageSet({
    autoSaveEnabled: autoSaveEnabled,
    autoDownloadEnabled: autoDownloadEnabled,
    saveInterval: 30
  }, (result) => {
    if (result && result.success === false) {
      console.error('❌ 패널 상태 저장 실패:', result.error);
    } else {
      console.log(getLocalizedMessage('consoleLogs.panelStateSaved'));
    }
  });
}

// 패널 상태 로드
function loadPanelState() {
  safeChromeStorageGet(['autoSaveEnabled', 'autoDownloadEnabled'], function(result) {
    if (result && result.success === false) {
      console.error('❌ 패널 상태 로드 실패:', result.error);
      return;
    }
    
    const autoSaveToggle = document.getElementById('page-auto-save-toggle');
    const autoDownloadToggle = document.getElementById('page-auto-download-toggle');
    
    if (result.autoSaveEnabled) {
      autoSaveToggle.checked = true;
      // 자동 저장이 활성화되어 있다면 카운트다운 시작
      setTimeout(() => {
        startPageCountdown(30);
      }, 1000);
    }
    
    if (result.autoDownloadEnabled) {
      autoDownloadToggle.checked = true;
    }
  });
}

// 언어 변경 함수
function changePanelLanguage(language) {
  currentLanguage = language;
  
  // 언어 설정 저장
  safeChromeStorageSet({ language: language }, function() {
    console.log('언어 설정 저장 완료:', language);
  });
  
  // 패널 텍스트 업데이트
  updatePanelTexts();
  
  // 통계도 업데이트
  updatePageStats();
  
  // 카운트다운이 활성화되어 있다면 텍스트 업데이트
  const countdown = document.getElementById('page-countdown');
  if (countdown && countdown.style.display !== 'none') {
    updateCountdownText();
  }
  
  // 언어 선택기 업데이트
  const languageSelector = document.getElementById('page-language-selector');
  if (languageSelector) {
    languageSelector.value = language;
  }
  
  // 시각적 피드백 (패널 깜빡임)
  if (controlPanel) {
    controlPanel.style.transition = 'all 0.3s ease';
    controlPanel.style.transform = 'scale(1.02)';
    controlPanel.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4)';
    
    setTimeout(() => {
      controlPanel.style.transform = 'scale(1)';
      controlPanel.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
    }, 300);
  }
  
  console.log('언어 변경 완료:', language);
}

// 패널 텍스트 업데이트
function updatePanelTexts() {
  const texts = {
    ko: {
      language: '언어',
      autoSave: '자동 저장',
      autoDownload: '자동 다운로드',
      manualSave: '📸 수동 저장',
      download: '💾 다운로드',
      stats: '📊 저장 통계',
      countdown: '⏰ 다음 저장까지:',
      status: '페이지에서 직접 실행'
    },
    en: {
      language: 'Language',
      autoSave: 'Auto Save',
      autoDownload: 'Auto Download',
      manualSave: '📸 Manual Save',
      download: '💾 Download',
      stats: '📊 Save Stats',
      countdown: '⏰ Next save in:',
      status: 'Direct execution from page'
    }
  };
  
  const currentTexts = texts[currentLanguage] || texts.en;
  
  // 패널이 존재하는지 확인
  if (!controlPanel || !document.getElementById('language-label')) {
    console.log('패널이 아직 생성되지 않음, 텍스트 업데이트 건너뜀');
    return;
  }
  
  // 언어 라벨 업데이트
  const languageLabel = document.getElementById('language-label');
  if (languageLabel) {
    languageLabel.textContent = currentTexts.language;
  }
  
  // 자동 저장 라벨 업데이트
  const autoSaveLabel = document.getElementById('auto-save-label');
  if (autoSaveLabel) {
    autoSaveLabel.textContent = currentTexts.autoSave;
  }
  
  // 자동 다운로드 라벨 업데이트
  const autoDownloadLabel = document.getElementById('auto-download-label');
  if (autoDownloadLabel) {
    autoDownloadLabel.textContent = currentTexts.autoDownload;
  }
  
  // 버튼 텍스트 업데이트
  const manualSaveBtn = document.getElementById('page-manual-save');
  if (manualSaveBtn) {
    manualSaveBtn.textContent = currentTexts.manualSave;
  }
  
  const downloadBtn = document.getElementById('page-download');
  if (downloadBtn) {
    downloadBtn.textContent = currentTexts.download;
  }
  
  // 상태 텍스트 업데이트
  const statusDiv = document.getElementById('page-status');
  if (statusDiv) {
    statusDiv.textContent = currentTexts.status;
  }
  
  // 카운트다운 텍스트 업데이트
  const countdownText = document.getElementById('countdown-text');
  const countdownUnit = document.getElementById('countdown-unit');
  if (countdownText) {
    countdownText.textContent = currentTexts.countdown;
  }
  if (countdownUnit) {
    countdownUnit.textContent = currentLanguage === 'ko' ? '초' : 's';
  }
  
  console.log('패널 텍스트 업데이트 완료:', currentLanguage);
}

// 카운트다운 텍스트 업데이트
function updateCountdownText() {
  const countdownText = document.getElementById('countdown-text');
  const countdownUnit = document.getElementById('countdown-unit');
  
  if (countdownText) {
    const text = currentLanguage === 'ko' ? '⏰ 다음 저장까지:' : '⏰ Next save in:';
    countdownText.textContent = text;
  }
  
  if (countdownUnit) {
    const unit = currentLanguage === 'ko' ? '초' : 's';
    countdownUnit.textContent = unit;
  }
}

// 페이지 통계 업데이트
function updatePageStats() {
  safeChromeStorageGet(['savedImages', 'savedPrompts'], function(result) {
    if (result && result.success === false) {
      console.error('❌ 페이지 통계 업데이트 실패:', result.error);
      return;
    }
    
    const stats = document.getElementById('page-stats');
    if (!stats) return;
    
    const imageCount = result.savedImages ? result.savedImages.length : 0;
    const promptCount = result.savedPrompts ? result.savedPrompts.length : 0;
    
    const statsText = currentLanguage === 'ko' 
      ? `📊 저장 통계<br>이미지: ${imageCount}개 | 프롬프트: ${promptCount}개`
      : `📊 Save Stats<br>Images: ${imageCount} | Prompts: ${promptCount}`;
    
    stats.innerHTML = statsText;
  });
}

// 다운로드 실행
function performDownload() {
  console.log(getLocalizedMessage('consoleLogs.downloadStarted'));
  
  // 먼저 현재 페이지에서 직접 데이터 수집 시도
  const currentImages = collectImages();
  const currentPrompts = collectPrompts();
  
  console.log(getLocalizedMessage('consoleLogs.currentCollectedData'), {
    images: currentImages.length,
    prompts: currentPrompts.length
  });
  
  // 저장된 데이터와 현재 데이터를 합침
  safeChromeStorageGet(['savedImages', 'savedPrompts'], function(result) {
    let savedImages = [];
    let savedPrompts = [];
    
    if (result && result.success !== false) {
      savedImages = result.savedImages || [];
      savedPrompts = result.savedPrompts || [];
      console.log(getLocalizedMessage('consoleLogs.savedData'), {
        images: savedImages.length,
        prompts: savedPrompts.length
      });
    }
    
    // 현재 데이터가 있으면 우선 사용, 없으면 저장된 데이터 사용
    const finalImages = currentImages.length > 0 ? currentImages : savedImages;
    const finalPrompts = currentPrompts.length > 0 ? currentPrompts : savedPrompts;
    
    const data = {
      metadata: {
        created_at: new Date().toISOString(),
        version: '1.0.0',
        source: 'Sora ChatGPT Auto Save Extension (Page Control)',
        total_images: finalImages.length,
        total_prompts: finalPrompts.length,
        download_method: currentImages.length > 0 ? 'current_page' : 'stored_data'
      },
      images: finalImages,
      prompts: finalPrompts
    };
    
    console.log(getLocalizedMessage('consoleLogs.downloadData'), {
      total_images: data.images.length,
      total_prompts: data.prompts.length,
      method: data.metadata.download_method
    });
    
    if (data.images.length === 0 && data.prompts.length === 0) {
      console.error('❌ 다운로드할 데이터가 없습니다.');
      return;
    }
    
    try {
      // Background script를 통한 다운로드 및 파일 관리
      downloadWithFileManagement(data);
      
    } catch (error) {
      console.error('❌ 다운로드 중 오류:', error);
    }
  });
}

// 이미지 수집 함수
function collectImages() {
  console.log(getLocalizedMessage('consoleLogs.imageCollectionStarted'));
  
  // 모든 이미지 컨테이너 찾기 (data-index 속성을 가진 div들)
  const imageContainers = document.querySelectorAll('[data-index]');
  
  console.log(getLocalizedMessage('consoleLogs.imageContainersFound', [imageContainers.length.toString()]));
  
  // 첫 번째 완성된 이미지만 찾기
  for (let i = 0; i < imageContainers.length; i++) {
    const container = imageContainers[i];
    const containerIndex = container.getAttribute('data-index');
    
    // 각 컨테이너에서 이미지와 프롬프트 찾기
    const imgElement = container.querySelector('img[src*="videos.openai.com"]');
    const promptElement = container.querySelector('.text-token-text-primary');
    
    if (imgElement && promptElement) {
      // 이미지 생성 완료 상태 (실제 이미지가 있는 경우)
      const imgSrc = imgElement.src;
      const promptText = promptElement.textContent?.trim() || '';
      
      // 원본 프롬프트를 위해 컨테이너 전체에서 텍스트 수집
      const originalPromptText = container.textContent?.trim() || '';
      
      if (imgSrc && promptText && imgSrc.includes('videos.openai.com')) {
        // 제목 정보만 찾기 (시간 정보는 제외)
        const titleElement = container.querySelector('a[href*="/g/"]');
        const titleText = titleElement?.textContent?.trim() || '';
        
        // originalPrompt에서 "Prompt"로 split해서 두 번째 부분(인덱스 1) 사용
        const cleanPrompt = originalPromptText.split('Prompt')[1] || promptText;
        
        const imageData = {
          id: `img_${Date.now()}_${containerIndex}`,
          url: imgSrc,
          alt: imgElement.alt || 'Generated image',
          width: imgElement.naturalWidth || 1024,
          height: imgElement.naturalHeight || 1536,
          pageUrl: window.location.href,
          prompt: cleanPrompt,
          originalPrompt: originalPromptText,
          title: titleText
        };
        
        console.log(getLocalizedMessage('consoleLogs.completedImageFound', [containerIndex]), imgSrc.substring(0, 50) + '...');
        console.log(getLocalizedMessage('consoleLogs.connectedPrompt'), cleanPrompt.substring(0, 50) + '...');
        
        // 첫 번째 이미지만 반환
        return [imageData];
      }
    }
  }
  
  console.log(getLocalizedMessage('consoleLogs.noCompletedImageFound'));
  return [];
}

// 현재 페이지의 프롬프트 가져오기 함수
function getCurrentPagePrompt() {
  // Sora 페이지에서 프롬프트 찾기
  const promptSelectors = [
    'textarea[placeholder*="prompt"], textarea[placeholder*="Prompt"]',
    'input[placeholder*="prompt"], input[placeholder*="Prompt"]',
    '[data-testid="prompt-text"]',
    '.prompt-text',
    '.prompt-content',
    '[class*="prompt"]',
    'div[class*="text"]',
    'p'
  ];
  
  for (const selector of promptSelectors) {
    const elements = document.querySelectorAll(selector);
    for (const element of elements) {
      const text = element.textContent?.trim() || element.value?.trim();
      if (text && text.length > 10 && text.length < 1000 && /[a-zA-Z가-힣]/.test(text)) {
        return text;
      }
    }
  }
  
  return '';
}

// 프롬프트 수집 함수
function collectPrompts() {
  console.log(getLocalizedMessage('consoleLogs.promptCollectionStarted'));
  const promptSelectors = [
    '[data-testid="prompt-text"]',
    '.prompt-text',
    '.prompt-content',
    '[class*="prompt"]',
    '[class*="text"]',
    'p',
    'div[class*="content"]',
    'span[class*="text"]'
  ];
  for (const selector of promptSelectors) {
    const elements = document.querySelectorAll(selector);
    for (let index = 0; index < elements.length; index++) {
      const element = elements[index];
      const text = element.textContent?.trim();
      if (text && text.length > 10 && text.length < 1000 && /[a-zA-Z가-힣]/.test(text)) {
        const promptData = {
          id: `prompt_${Date.now()}_${index}`,
          text: text,
          timestamp: new Date().toISOString(),
          pageUrl: window.location.href,
          selector: selector
        };
        console.log('첫 번째 프롬프트 발견:', text.substring(0, 50) + '...');
        return [promptData]; // 첫 번째 프롬프트만 배열로 반환
      }
    }
  }
  return [];
}

// 데이터 저장 함수
function saveData(newImages, newPrompts) {
  console.log('데이터 저장 시작');
  
  // 배열을 1개만 유지 (새 데이터로 교체)
  if (newImages.length > 0) {
    savedImages = newImages; // 기존 배열을 새 배열로 교체
  }
  
  if (newPrompts.length > 0) {
    savedPrompts = newPrompts; // 기존 배열을 새 배열로 교체
  }
  
  // chrome.storage에 저장
  const saveData = {
    savedImages: savedImages,
    savedPrompts: savedPrompts,
    lastSaveTime: new Date().toLocaleString()
  };
  
  safeChromeStorageSet(saveData, function(result) {
    if (result && result.success === false) {
      console.error('❌ 데이터 저장 실패:', result.error);
    } else {
      console.log('✅ 데이터 저장 완료:', {
        totalImages: savedImages.length,
        totalPrompts: savedPrompts.length,
        newImages: newImages.length,
        newPrompts: newPrompts.length
      });
      
      // 페이지 통계 업데이트
      updatePageStats();
    }
  });
  
  return {
    imageCount: newImages.length,
    promptCount: newPrompts.length,
    totalImages: savedImages.length,
    totalPrompts: savedPrompts.length
  };
}

// 메인 저장 함수
function saveImagesAndPrompts() {
  console.log('=== Sora ChatGPT 데이터 저장 시작 ===');
  
  try {
    // 이미지 수집
    const newImages = collectImages();
    
    // 프롬프트 수집
    const newPrompts = collectPrompts();
    
    // 데이터 저장
    const result = saveData(newImages, newPrompts);
    
    console.log('저장 결과:', result);
    
    return {
      success: true,
      imageCount: result.imageCount,
      promptCount: result.promptCount,
      totalImages: result.totalImages,
      totalPrompts: result.totalPrompts
    };
    
  } catch (error) {
    console.error('저장 중 오류 발생:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// 메시지 리스너
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('콘텐츠 스크립트 메시지 수신:', request);
  
  if (request.action === 'saveImagesAndPrompts') {
    const result = saveImagesAndPrompts();
    sendResponse(result);
  }
});

// 페이지 로드 완료 후 초기화
window.addEventListener('load', function() {
  console.log('Sora ChatGPT 페이지 로드 완료');
  
  // 페이지가 완전히 로드된 후 컨트롤 패널 생성
  setTimeout(() => {
    createControlPanel();
    console.log('초기 데이터 수집 시작');
    saveImagesAndPrompts();
  }, 3000); // 3초 대기
});

// DOM 변경 감지 (MutationObserver)
const observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      // 새로운 노드가 추가되면 잠시 후 데이터 수집
      setTimeout(() => {
        console.log('DOM 변경 감지, 데이터 재수집');
        saveImagesAndPrompts();
      }, 1000);
    }
  });
});

// 페이지 로드 후 MutationObserver 시작
document.addEventListener('DOMContentLoaded', function() {
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  console.log('DOM 변경 감지 시작');
});

// 진행 단계 업데이트 함수
function updateProcessStep(stepNumber, status, message = '') {
  const stepElement = document.getElementById(`step-${stepNumber}`);
  if (!stepElement) return;
  
  const icons = {
    waiting: '⏳',
    running: '🔄',
    success: '✅',
    error: '❌'
  };
  
  const colors = {
    waiting: 'rgba(255,255,255,0.6)',
    running: '#ffeb3b',
    success: '#4CAF50',
    error: '#f44336'
  };
  
  const icon = icons[status] || '⏳';
  const color = colors[status] || 'rgba(255,255,255,0.6)';
  
  const stepTexts = {
    1: '데이터 수집 준비',
    2: '이미지 및 프롬프트 수집',
    3: '데이터 저장',
    4: '파일 관리'
  };
  
  const baseText = stepTexts[stepNumber] || '';
  const displayText = message ? `${baseText} - ${message}` : baseText;
  
  stepElement.innerHTML = `${icon} ${stepNumber}. ${displayText}`;
  stepElement.style.color = color;
  
  console.log(`📋 진행 단계 업데이트: Step ${stepNumber} - ${status} - ${displayText}`);
}

// 모든 단계 초기화
function resetProcessSteps() {
  for (let i = 1; i <= 4; i++) {
    updateProcessStep(i, 'waiting');
  }
}

// 파일 관리 관련 함수들
async function downloadWithFileManagement(data) {
    console.log('🔗 downloadData 메시지 전송');
    try {
        chrome.runtime.sendMessage({ action: 'downloadData', data }, response => {
            if (response && response.success) {
                console.log('✅ downloadData 요청 성공');
            } else {
                console.error('❌ downloadData 요청 실패:', response && response.error);
                // 대체 브라우저 다운로드
                const jsonString = JSON.stringify(data, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const timestamp = new Date().toISOString().slice(0,19).replace(/:/g,'-');
                fallbackDownload(blob, `sora_auto_save_${timestamp}.json`);
            }
        });
    } catch (err) {
        console.error('❌ downloadWithFileManagement 오류:', err);
    }
}

function fallbackDownload(blob, filename) {
    console.log('🔄 대체 다운로드 실행:', filename);
    try {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 1000);
        
        // 대체 다운로드 후에도 파일 관리 실행
        manageDownloadedFiles();
        
        console.log('✅ 대체 다운로드 완료:', filename);
    } catch (error) {
        console.error('❌ 대체 다운로드 실패:', error);
    }
}

function manageDownloadedFiles() {
    console.log('🔄 content script: cleanupFiles 메시지 전송');
    try {
        chrome.runtime.sendMessage({ action: 'cleanupFiles' }, response => {
            console.log('🗑️ cleanupFiles 응답:', response);
        });
    } catch (error) {
        console.error('❌ cleanupFiles 메시지 전송 오류:', error);
    }
}

console.log('Sora ChatGPT 콘텐츠 스크립트 로드됨'); 