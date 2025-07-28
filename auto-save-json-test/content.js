// Sora ChatGPT 라이브러리 페이지에서 이미지와 프롬프트 수집

// Chrome i18n 지원 함수들 (안전한 버전)
function getCurrentLanguage() {
    try {
        if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getUILanguage) {
            return chrome.i18n.getUILanguage().split('-')[0] || 'en';
        }
    } catch (error) {
        console.warn('언어 정보 가져오기 실패, 기본값 사용:', error);
    }
    return 'en';
}

function getLocalizedMessage(messageKey, substitutions = []) {
    try {
        if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getMessage) {
            const message = chrome.i18n.getMessage(messageKey, substitutions);
            return message || getDefaultMessage(messageKey);
        }
    } catch (error) {
        console.warn(`메시지 키 '${messageKey}' 번역 실패, 기본값 사용:`, error);
    }
    return getDefaultMessage(messageKey);
}

// 기본 메시지 제공 함수 (확장 프로그램 컨텍스트가 무효화된 경우 사용)
function getDefaultMessage(messageKey) {
    const defaultMessages = {
        'consoleLogs.existingDataLoaded': 'Existing data loaded',
        'consoleLogs.controlPanelCreated': 'Control panel created',
        'consoleLogs.autoSaveStarted': 'Auto save started',
        'consoleLogs.autoSaveStopped': 'Auto save stopped',
        'consoleLogs.autoDownloadToggle': 'Auto download toggle',
        'consoleLogs.manualSaveExecuted': 'Manual save executed',
        'consoleLogs.manualSaveComplete': 'Manual save complete',
        'consoleLogs.downloadExecuted': 'Download executed',
        'consoleLogs.panelStateSaved': 'Panel state saved',
        'consoleLogs.imageCollectionStarted': 'Image collection started',
        'consoleLogs.imageContainersFound': 'Image containers found',
        'consoleLogs.completedImageFound': 'Completed image found',
        'consoleLogs.connectedPrompt': 'Connected prompt',
        'consoleLogs.noCompletedImageFound': 'No completed image found',
        'consoleLogs.promptCollectionStarted': 'Prompt collection started'
    };
    
    return defaultMessages[messageKey] || messageKey;
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

// 중복 검사 관련 함수들
function calculateSimilarity(str1, str2) {
  try {
    if (!str1 || !str2) return 0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 100;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length * 100;
  } catch (error) {
    console.error('유사도 계산 오류:', error);
    return 0;
  }
}

function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

function checkImageDuplication(newImage, existingImages) {
  if (!newImage || !existingImages || existingImages.length === 0) {
    return false;
  }
  
  for (const existingImage of existingImages) {
    // URL이 동일한 경우
    if (newImage.url === existingImage.url) {
      console.log('🔍 이미지 URL 중복 발견:', newImage.url.substring(0, 50) + '...');
      return true;
    }
    
    // 프롬프트 유사도가 80% 이상인 경우
    const promptSimilarity = calculateSimilarity(
      newImage.prompt || '', 
      existingImage.prompt || ''
    );
    
    if (promptSimilarity >= 80) {
      console.log(`🔍 이미지 프롬프트 중복 발견 (유사도: ${promptSimilarity.toFixed(1)}%)`);
      console.log(`   새 프롬프트: "${(newImage.prompt || '').substring(0, 50)}..."`);
      console.log(`   기존 프롬프트: "${(existingImage.prompt || '').substring(0, 50)}..."`);
      return true;
    }
  }
  
  return false;
}

function checkPromptDuplication(newPrompt, existingPrompts) {
  if (!newPrompt || !existingPrompts || existingPrompts.length === 0) {
    return false;
  }
  
  for (const existingPrompt of existingPrompts) {
    const similarity = calculateSimilarity(newPrompt, existingPrompt);
    
    if (similarity >= 80) {
      console.log(`🔍 프롬프트 중복 발견 (유사도: ${similarity.toFixed(1)}%)`);
      console.log(`   새 프롬프트: "${newPrompt.substring(0, 50)}..."`);
      console.log(`   기존 프롬프트: "${existingPrompt.substring(0, 50)}..."`);
      return true;
    }
  }
  
  return false;
}

// 페이지 로드 시 기존 데이터 불러오기 (안전한 버전)
function loadExistingData() {
    safeChromeStorageGet(['savedImages', 'savedPrompts', 'language'], function(result) {
        if (result && result.success !== false) {
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
            
            console.log('기존 데이터 로드 완료:', {
                images: savedImages.length,
                prompts: savedPrompts.length,
                language: currentLanguage
            });
        } else {
            console.warn('기존 데이터 로드 실패 또는 데이터 없음:', result);
            // 기본값 설정
            savedImages = [];
            savedPrompts = [];
            currentLanguage = 'en';
        }
    });
}

// Chrome 저장소 변경 감지 (안전한 버전)
function setupStorageListener() {
    try {
        if (isExtensionContextValid() && chrome.storage && chrome.storage.onChanged) {
            chrome.storage.onChanged.addListener(function(changes, namespace) {
                if (namespace === 'local' && changes.language) {
                    const newLanguage = changes.language.newValue;
                    if (newLanguage && newLanguage !== currentLanguage) {
                        console.log('언어 설정 변경 감지:', newLanguage);
                        changePanelLanguage(newLanguage);
                    }
                }
            });
        }
    } catch (error) {
        console.warn('저장소 리스너 설정 실패:', error);
    }
}

// 팝업 메시지 리스너 (안전한 버전)
function setupMessageListener() {
    try {
        if (isExtensionContextValid() && chrome.runtime && chrome.runtime.onMessage) {
            chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
                try {
                    if (request.action === 'languageChanged') {
                        console.log('팝업으로부터 언어 변경 메시지 수신:', request.language);
                        changePanelLanguage(request.language);
                        sendResponse({ success: true });
                    }
                } catch (error) {
                    console.error('메시지 처리 중 오류:', error);
                    sendResponse({ success: false, error: error.message });
                }
            });
        }
    } catch (error) {
        console.warn('메시지 리스너 설정 실패:', error);
    }
}

// 페이지 카운트다운 시작
function startPageCountdown(seconds) {
  stopPageCountdown(); // 기존 타이머 정리
  
  const countdown = document.getElementById('page-countdown');
  const countdownNumber = document.getElementById('page-countdown-number');
  
  if (!countdown || !countdownNumber) {
    console.error('❌ 카운트다운 UI 요소를 찾을 수 없음');
    return;
  }
  
  let remainingSeconds = seconds;
  
  // 초기 표시
  countdown.style.display = 'block';
  countdownNumber.textContent = remainingSeconds;
  
  console.log(`⏰ 카운트다운 시작: ${seconds}초`);
  
  // 1초마다 업데이트
  pageCountdownInterval = setInterval(() => {
    remainingSeconds--;
    countdownNumber.textContent = remainingSeconds;
    
    if (remainingSeconds <= 0) {
      clearInterval(pageCountdownInterval);
      pageCountdownInterval = null;
      
      console.log('🎯 카운트다운 완료 - 저장 및 다운로드 실행');
      
      // 페이지에서 직접 저장 실행
      const result = saveImagesAndPrompts();
      console.log('💾 저장 결과:', result);
      
      // 자동 다운로드 확인 및 실행
      const autoDownloadToggle = document.getElementById('page-auto-download-toggle');
      console.log('🔍 자동 다운로드 토글 상태:', autoDownloadToggle ? autoDownloadToggle.classList.contains('active') : '토글 없음');
      
      if (autoDownloadToggle && autoDownloadToggle.classList.contains('active')) {
        if (result.success) {
          console.log('🔄 자동 다운로드 활성화됨 - 다운로드 실행 중...');
          
          // 즉시 다운로드 실행
          setTimeout(() => {
            try {
              console.log('📥 다운로드 함수 호출 시작');
              performDownload();
              console.log('✅ 자동 다운로드 완료');
            } catch (error) {
              console.error('❌ 자동 다운로드 실행 중 오류:', error);
            }
          }, 1000);
        } else {
          console.log('⚠️ 자동 다운로드 활성화됨 - 저장 실패로 다운로드 건너뜀');
          console.error('저장 실패 상세:', result.error);
        }
      } else {
        console.log('ℹ️ 자동 다운로드 비활성화됨 - 수동 다운로드 필요');
      }
      
      // 카운트다운 다시 시작 (자동 저장 모드가 계속 활성화된 경우)
      const autoSaveToggle = document.getElementById('page-auto-save-toggle');
      if (autoSaveToggle && autoSaveToggle.classList.contains('active')) {
        console.log('🔄 자동 저장 모드 계속 - 카운트다운 재시작');
        setTimeout(() => {
          startPageCountdown(seconds);
        }, 2000); // 2초 후 재시작
      } else {
        // 자동 저장 모드가 비활성화된 경우 카운트다운 숨김
        console.log('⏹️ 자동 저장 모드 비활성화 - 카운트다운 중지');
        countdown.style.display = 'none';
      }
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
  console.log('🔧 컨트롤 패널 생성 시작...');
  
  if (isPanelCreated) {
    console.log('⚠️ 패널이 이미 생성되어 있음');
    return;
  }
  
  // 기존 패널 제거
  const existingPanel = document.getElementById('sora-auto-save-panel');
  if (existingPanel) {
    console.log('🗑️ 기존 패널 제거');
    existingPanel.remove();
  }
  
  console.log('🏗️ 새로운 패널 생성 중...');
  
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
      <!-- 언어 설정 -->
      <div style="margin-bottom: 10px; padding: 8px; background: rgba(255,255,255,0.1); border-radius: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 12px;" id="language-label">언어</span>
          <select id="page-language-selector" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
            <option value="ko">한국어</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
      
      <div style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 12px;" id="auto-save-label">자동 저장</span>
          <button id="page-auto-save-toggle" style="width: 40px; height: 20px; background: rgba(255,255,255,0.3); border: none; border-radius: 10px; cursor: pointer; position: relative; transition: all 0.3s;">
            <span id="auto-save-slider" style="position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: all 0.3s;"></span>
          </button>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 12px;" id="auto-download-label">자동 다운로드</span>
          <button id="page-auto-download-toggle" style="width: 40px; height: 20px; background: rgba(255,255,255,0.3); border: none; border-radius: 10px; cursor: pointer; position: relative; transition: all 0.3s;">
            <span id="auto-download-slider" style="position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; background: white; border-radius: 50%; transition: all 0.3s;"></span>
          </button>
        </div>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
        <button id="page-manual-save" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px; border-radius: 8px; cursor: pointer; font-size: 11px; transition: all 0.3s;">📸 수동 저장</button>
        <button id="page-download" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 8px; border-radius: 8px; cursor: pointer; font-size: 11px; transition: all 0.3s;">💾 다운로드</button>
      </div>
      
      <div id="page-stats" style="font-size: 11px; line-height: 1.4; background: rgba(255,255,255,0.1); padding: 8px; border-radius: 8px;">
        📊 저장 통계<br>
        이미지: 0개 | 프롬프트: 0개
      </div>
      
      <div id="page-countdown" style="display: none; text-align: center; margin-top: 8px; font-size: 12px; font-weight: bold; background: rgba(255,255,255,0.15); padding: 8px; border-radius: 8px;">
        <span id="countdown-text">⏰ 다음 저장까지:</span> <span id="page-countdown-number" style="color: #ffeb3b;">15</span><span id="countdown-unit">초</span>
      </div>
      
      <div id="page-status" style="font-size: 10px; text-align: center; margin-top: 8px; color: rgba(255,255,255,0.8);">
        페이지에서 직접 실행
      </div>
    </div>
  `;
  
  // 패널을 페이지에 추가
  document.body.appendChild(controlPanel);
  isPanelCreated = true;
  
  console.log('✅ 패널이 페이지에 추가됨');
  
  // 이벤트 리스너 추가
  console.log('🔗 이벤트 리스너 추가 중...');
  addPanelEventListeners();
  
  // 초기 텍스트 설정
  console.log('📝 초기 텍스트 설정 중...');
  updatePanelTexts();
  
  // 초기 상태 설정
  console.log('⚙️ 초기 상태 설정 중...');
  loadPanelState();
  
  console.log('🎉 컨트롤 패널 생성 완료!');
  console.log(getLocalizedMessage('consoleLogs.controlPanelCreated'));
}

// 패널 이벤트 리스너 추가
function addPanelEventListeners() {
  // 언어 선택기
  const languageSelector = document.getElementById('page-language-selector');
  if (languageSelector) {
    // 현재 언어 설정
    languageSelector.value = currentLanguage;
    
    // 언어 변경 이벤트
    languageSelector.addEventListener('change', function() {
      const newLanguage = this.value;
      console.log('언어 변경 요청:', newLanguage);
      changePanelLanguage(newLanguage);
    });
  }
  
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
  document.getElementById('page-auto-save-toggle').addEventListener('click', function() {
    // 토글 상태 변경
    const isEnabled = this.classList.contains('active');
    
    if (!isEnabled) {
      // 활성화
      this.classList.add('active');
      this.style.background = 'rgba(76, 175, 80, 0.6)';
      document.getElementById('auto-save-slider').style.left = '22px';
      
      // 페이지에서 직접 카운트다운 시작 (백그라운드 통신 없이)
      startPageCountdown(15);
      console.log(getLocalizedMessage('consoleLogs.autoSaveStarted'));
    } else {
      // 비활성화
      this.classList.remove('active');
      this.style.background = 'rgba(255,255,255,0.3)';
      document.getElementById('auto-save-slider').style.left = '2px';
      
      // 카운트다운 중지
      stopPageCountdown();
      console.log(getLocalizedMessage('consoleLogs.autoSaveStopped'));
    }
    
    // 상태 저장
    savePanelState();
  });
  
  // 자동 다운로드 토글
  document.getElementById('page-auto-download-toggle').addEventListener('click', function() {
    // 토글 상태 변경
    const isEnabled = this.classList.contains('active');
    
    if (!isEnabled) {
      // 활성화
      this.classList.add('active');
      this.style.background = 'rgba(76, 175, 80, 0.6)';
      document.getElementById('auto-download-slider').style.left = '22px';
      
      console.log('✅ 자동 다운로드 활성화됨 - 저장 완료 시 자동으로 다운로드됩니다');
      // 시각적 피드백
      this.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.5)';
      setTimeout(() => {
        this.style.boxShadow = 'none';
      }, 1000);
    } else {
      // 비활성화
      this.classList.remove('active');
      this.style.background = 'rgba(255,255,255,0.3)';
      document.getElementById('auto-download-slider').style.left = '2px';
      
      console.log('❌ 자동 다운로드 비활성화됨 - 수동으로 다운로드해야 합니다');
      // 시각적 피드백
      this.style.boxShadow = '0 0 10px rgba(244, 67, 54, 0.5)';
      setTimeout(() => {
        this.style.boxShadow = 'none';
      }, 1000);
    }
    
    // 상태 저장
    savePanelState();
    
    console.log(getLocalizedMessage('consoleLogs.autoDownloadToggle'), isEnabled ? 'OFF' : 'ON');
  });
  
  // 수동 저장 버튼
  document.getElementById('page-manual-save').addEventListener('click', function() {
    console.log(getLocalizedMessage('consoleLogs.manualSaveExecuted'));
    
    // 페이지에서 직접 저장 실행
    const result = saveImagesAndPrompts();
    
    if (result.success) {
      console.log(getLocalizedMessage('consoleLogs.manualSaveComplete'), result);
      updatePageStats();
      
      // 버튼 효과
      this.style.background = 'rgba(76, 175, 80, 0.4)';
      setTimeout(() => {
        this.style.background = 'rgba(255,255,255,0.2)';
      }, 1000);
    } else {
      console.error('수동 저장 실패:', result.error);
      
      // 버튼 효과 (에러)
      this.style.background = 'rgba(244, 67, 54, 0.4)';
      setTimeout(() => {
        this.style.background = 'rgba(255,255,255,0.2)';
      }, 1000);
    }
  });
  
  // 다운로드 버튼
  document.getElementById('page-download').addEventListener('click', function() {
    console.log(getLocalizedMessage('consoleLogs.downloadExecuted'));
    performDownload();
    
    // 버튼 효과
    this.style.background = 'rgba(255,255,255,0.4)';
    setTimeout(() => {
      this.style.background = 'rgba(255,255,255,0.2)';
    }, 200);
  });
}

// 확장 프로그램 컨텍스트 검증 함수 (개선된 버전)
function isExtensionContextValid() {
    try {
        // Chrome 객체 존재 확인
        if (typeof chrome === 'undefined') {
            return false;
        }
        
        // Runtime 객체 확인
        if (!chrome.runtime) {
            return false;
        }
        
        // Extension ID 확인
        const extensionId = chrome.runtime.id;
        if (!extensionId || extensionId === 'invalid') {
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('❌ 확장 프로그램 컨텍스트 검증 실패:', error);
        return false;
    }
}

// 안전한 chrome.storage 사용 함수 (개선된 버전)
function safeChromeStorageSet(data, callback) {
    if (!isExtensionContextValid()) {
        console.warn('⚠️ 확장 프로그램 컨텍스트가 무효화되어 저장을 건너뜁니다.');
        if (callback) {
            callback({ success: false, error: 'Extension context invalidated' });
        }
        return;
    }
    
    try {
        chrome.storage.local.set(data, function() {
            if (chrome.runtime.lastError) {
                console.error('❌ chrome.storage 저장 실패:', chrome.runtime.lastError);
                if (callback) {
                    callback({ success: false, error: chrome.runtime.lastError.message });
                }
            } else {
                if (callback) {
                    callback({ success: true });
                }
            }
        });
    } catch (error) {
        console.error('❌ chrome.storage 저장 중 예외:', error);
        if (callback) {
            callback({ success: false, error: error.message });
        }
    }
}

function safeChromeStorageGet(keys, callback) {
    if (!isExtensionContextValid()) {
        console.warn('⚠️ 확장 프로그램 컨텍스트가 무효화되어 데이터를 가져올 수 없습니다.');
        if (callback) {
            callback({ success: false, error: 'Extension context invalidated' });
        }
        return;
    }
    
    try {
        chrome.storage.local.get(keys, function(result) {
            if (chrome.runtime.lastError) {
                console.error('❌ chrome.storage 가져오기 실패:', chrome.runtime.lastError);
                if (callback) {
                    callback({ success: false, error: chrome.runtime.lastError.message });
                }
            } else {
                if (callback) {
                    callback(result);
                }
            }
        });
    } catch (error) {
        console.error('❌ chrome.storage 가져오기 중 예외:', error);
        if (callback) {
            callback({ success: false, error: error.message });
        }
    }
}

// 패널 상태 저장
function savePanelState() {
  const autoSaveEnabled = document.getElementById('page-auto-save-toggle').classList.contains('active');
  const autoDownloadEnabled = document.getElementById('page-auto-download-toggle').classList.contains('active');
  
  safeChromeStorageSet({
    autoSaveEnabled: autoSaveEnabled,
    autoDownloadEnabled: autoDownloadEnabled,
    saveInterval: 15
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
      autoSaveToggle.classList.add('active');
      autoSaveToggle.style.background = 'rgba(76, 175, 80, 0.6)';
      document.getElementById('auto-save-slider').style.left = '22px';
      // 자동 저장이 활성화되어 있다면 카운트다운 시작
      setTimeout(() => {
        startPageCountdown(15);
      }, 1000);
    }
    
    if (result.autoDownloadEnabled) {
      autoDownloadToggle.classList.add('active');
      autoDownloadToggle.style.background = 'rgba(76, 175, 80, 0.6)';
      document.getElementById('auto-download-slider').style.left = '22px';
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
    console.log('🚀 다운로드 시작...');
    
    try {
        // 먼저 현재 페이지에서 직접 데이터 수집 시도
        console.log('📊 현재 페이지 데이터 수집 중...');
        const currentImages = collectImages();
        const currentPrompts = collectPrompts();
        
        console.log('📊 수집된 데이터:', {
            images: currentImages.length,
            prompts: currentPrompts.length
        });
        
        // 수집된 데이터 상세 로그
        if (currentImages.length > 0) {
            const image = currentImages[0];
            console.log('📸 수집된 이미지 데이터:', {
                type: image.type,
                title: image.title,
                url: image.url || '(빈 URL)',
                promptLength: image.prompt?.length || 0,
                promptPreview: image.prompt?.substring(0, 100) + '...' || '(프롬프트 없음)'
            });
        }
        
        // 저장된 데이터와 현재 데이터를 합침
        safeChromeStorageGet(['savedImages', 'savedPrompts'], function(result) {
            let savedImages = [];
            let savedPrompts = [];
            
            if (result && result.success !== false) {
                savedImages = result.savedImages || [];
                savedPrompts = result.savedPrompts || [];
                console.log('💾 저장된 데이터:', {
                    images: savedImages.length,
                    prompts: savedPrompts.length
                });
            } else {
                console.warn('⚠️ 저장된 데이터를 가져올 수 없음:', result);
            }
            
            // 현재 데이터가 있으면 우선 사용, 없으면 저장된 데이터 사용
            const finalImages = currentImages.length > 0 ? currentImages : savedImages;
            const finalPrompts = currentPrompts.length > 0 ? currentPrompts : savedPrompts;
            
            console.log('📋 최종 다운로드 데이터:', {
                images: finalImages.length,
                prompts: finalPrompts.length,
                source: currentImages.length > 0 ? 'current_page' : 'stored_data'
            });
            
            const data = {
                metadata: {
                    created_at: new Date().toISOString(),
                    version: '1.0.0',
                    source: 'Sora ChatGPT Auto Save Extension (Page Control)',
                    total_images: finalImages.length,
                    total_prompts: finalPrompts.length,
                    download_method: currentImages.length > 0 ? 'current_page' : 'stored_data',
                    note: '정책 위반 콘텐츠는 url이 빈 값으로 표시됩니다'
                },
                images: finalImages,
                prompts: finalPrompts
            };
            
            if (data.images.length === 0 && data.prompts.length === 0) {
                console.error('❌ 다운로드할 데이터가 없습니다.');
                return;
            }
            
            try {
                console.log('📄 JSON 파일 생성 중...');
                // JSON 파일 다운로드
                const jsonString = JSON.stringify(data, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                
                console.log('📎 다운로드 링크 생성:', url);
                
                const a = document.createElement('a');
                a.href = url;
                a.download = `sora_auto_save_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
                a.style.display = 'none';
                
                console.log('📥 다운로드 파일명:', a.download);
                
                document.body.appendChild(a);
                console.log('🖱️ 다운로드 클릭 실행...');
                a.click();
                document.body.removeChild(a);
                
                // URL 해제
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                    console.log('🧹 URL 객체 해제 완료');
                }, 1000);
                
                console.log('✅ 다운로드 완료:', a.download);
                console.log('📊 파일 크기:', blob.size, 'bytes');
                
                // 다운로드된 데이터 요약 출력
                console.log('📋 다운로드된 데이터 요약:');
                finalImages.forEach((img, index) => {
                    console.log(`  이미지 ${index + 1}: ${img.type} - ${img.title} - URL: ${img.url || '(빈 URL)'} - 프롬프트: ${img.prompt?.length || 0}자`);
                });
                
            } catch (error) {
                console.error('❌ 다운로드 중 오류:', error);
                throw error;
            }
        });
        
    } catch (error) {
        console.error('❌ performDownload 함수 오류:', error);
        throw error;
    }
}

// 이미지 수집 함수 (정책 위반 콘텐츠 프롬프트 추출 개선)
function collectImages() {
    console.log('📊 data-index 순서대로 첫 번째 콘텐츠 수집 시작...');
    
    // data-index 순서대로 정렬된 컨테이너들
    const dataIndexContainers = Array.from(document.querySelectorAll('div[data-index]'))
        .sort((a, b) => {
            const indexA = parseInt(a.getAttribute('data-index')) || 0;
            const indexB = parseInt(b.getAttribute('data-index')) || 0;
            return indexA - indexB;
        });
    
    console.log(`📋 총 ${dataIndexContainers.length}개 컨테이너 검사 중...`);
    
    // 첫 번째 실제 콘텐츠 찾기 (정상 이미지든 정책 위반이든)
    for (let i = 0; i < dataIndexContainers.length; i++) {
        const container = dataIndexContainers[i];
        const dataIndex = container.getAttribute('data-index');
        
        console.log(`🔍 data-index="${dataIndex}" 검사 중...`);
        
        // 1. 정상 이미지 확인
        const imgElement = container.querySelector('img[src*="videos.openai.com"], img[src*="openai"]');
        
        // 2. 정책 위반 콘텐츠 확인
        const hasAlertIcon = container.querySelector('.lucide-alert-circle');
        const hasPolicyText = container.textContent.includes('This content might violate our policies') ||
                             container.textContent.includes('Review prompt');
        const taskLink = container.querySelector('a[href*="/t/task_"]');
        
        // 3. 텍스트만 있는 컨테이너는 건너뛰기
        const hasOnlyText = !imgElement && !hasAlertIcon && !hasPolicyText && !taskLink;
        if (hasOnlyText) {
            console.log(`⏭️ data-index="${dataIndex}" - 텍스트만 있음, 건너뛰기`);
            continue;
        }
        
        // 공통: 제목과 프롬프트 추출 (개선된 방식)
        const titleElement = container.querySelector('.text-token-text-primary a') || taskLink;
        const title = titleElement?.textContent?.trim() || `Content ${dataIndex}`;
        
        // 프롬프트 추출 개선: 더 정확한 방식
        let promptText = '';
        
        // 방법 1: "Prompt" 텍스트 다음에 오는 .truncate 클래스 요소에서 추출
        const truncateElement = container.querySelector('.truncate.text-token-text-primary');
        if (truncateElement) {
            promptText = truncateElement.textContent?.trim() || '';
            console.log(`📝 방법 1로 프롬프트 추출: "${promptText.substring(0, 50)}..."`);
        }
        
        // 방법 2: 전체 텍스트에서 "Prompt" 이후 부분 추출 (방법 1이 실패한 경우)
        if (!promptText || promptText.length < 10) {
            const fullText = container.textContent || '';
            console.log(`🔍 전체 텍스트 샘플: "${fullText.substring(0, 200)}..."`);
            
            // "Prompt" 다음에 오는 실제 프롬프트 내용 찾기
            const promptMatch = fullText.match(/Prompt\s*(.+?)(?:\d{1,2}:\d{2}[ap]m|$)/s);
            if (promptMatch && promptMatch[1]) {
                promptText = promptMatch[1].trim();
                console.log(`📝 방법 2로 프롬프트 추출: "${promptText.substring(0, 50)}..."`);
            }
        }
        
        // 방법 3: 모든 텍스트 요소를 검사해서 가장 긴 텍스트 찾기 (마지막 수단)
        if (!promptText || promptText.length < 10) {
            const allTextElements = container.querySelectorAll('*');
            let longestText = '';
            
            allTextElements.forEach(element => {
                const text = element.textContent?.trim() || '';
                // 링크가 아니고, 시간이 아니고, "Prompt"가 아니고, 충분히 긴 텍스트
                if (!element.href && 
                    !text.match(/^\d{1,2}:\d{2}[ap]m$/) && 
                    text !== 'Prompt' && 
                    text !== 'Review prompt' &&
                    text !== 'This content might violate our policies' &&
                    text.length > longestText.length &&
                    text.length > 20) {
                    longestText = text;
                }
            });
            
            if (longestText) {
                promptText = longestText;
                console.log(`📝 방법 3으로 프롬프트 추출: "${promptText.substring(0, 50)}..."`);
            }
        }
        
        // 최종 검증
        if (!promptText || promptText.length < 10) {
            console.warn(`⚠️ 프롬프트 추출 실패 또는 너무 짧음: "${promptText}"`);
            console.log('🔍 컨테이너 전체 HTML:', container.outerHTML.substring(0, 500) + '...');
            promptText = '프롬프트를 추출할 수 없습니다.';
        }
        
        console.log(`📝 최종 추출된 프롬프트 (data-index=${dataIndex}): "${promptText.substring(0, 100)}..."`);
        console.log(`📊 프롬프트 길이: ${promptText.length}자`);
        
        // 4. 정상 이미지가 있는 경우
        if (imgElement && imgElement.src) {
            const imgSrc = imgElement.src;
            
            const imageData = {
                id: `img_${Date.now()}_${dataIndex}`,
                url: imgSrc, // 정상 이미지는 실제 URL
                alt: imgElement.alt || 'Generated image',
                width: imgElement.naturalWidth || imgElement.width || 1536,
                height: imgElement.naturalHeight || imgElement.height || 1024,
                pageUrl: window.location.href,
                prompt: promptText, // 개선된 프롬프트 추출
                title: title,
                dataIndex: dataIndex,
                timestamp: new Date().toISOString(),
                type: 'normal'
            };
            
            console.log(`✅ 첫 번째 정상 이미지 수집 완료 (data-index=${dataIndex}):`, {
                title: title,
                url: imgSrc.substring(0, 50) + '...',
                promptPreview: promptText.substring(0, 50) + '...',
                promptLength: promptText.length
            });
            
            return [imageData];
        }
        
        // 5. 정책 위반 콘텐츠가 있는 경우
        else if ((hasAlertIcon || hasPolicyText) && taskLink) {
            const taskId = taskLink.href.match(/\/t\/(task_[^\/]+)/)?.[1];
            
            const policyData = {
                id: `policy_${Date.now()}_${dataIndex}`,
                url: '', // 정책 위반 콘텐츠는 빈 URL
                taskId: taskId,
                taskUrl: taskLink.href, // 태스크 URL은 별도 필드로 저장
                alt: 'Policy violation content',
                width: 0,
                height: 0,
                pageUrl: window.location.href,
                prompt: promptText, // 개선된 프롬프트 추출
                title: title,
                dataIndex: dataIndex,
                timestamp: new Date().toISOString(),
                type: 'policy_violation',
                note: '정책 위반으로 이미지가 차단된 콘텐츠'
            };
            
            console.log(`⚠️ 첫 번째 정책 위반 콘텐츠 수집 완료 (data-index=${dataIndex}):`, {
                title: title,
                taskId: taskId,
                url: '(빈 URL)', // 빈 URL 표시
                promptPreview: promptText.substring(0, 50) + '...',
                promptLength: promptText.length,
                fullPromptCheck: promptText // 전체 프롬프트 확인용
            });
            
            return [policyData];
        }
        
        console.log(`⏭️ data-index="${dataIndex}" - 콘텐츠 없음, 다음 확인`);
    }
    
    console.log('❌ 수집할 수 있는 첫 번째 콘텐츠가 없음');
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

// 데이터 저장 함수 (안전한 오류 처리)
function saveData(newImages, newPrompts) {
    try {
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
                throw new Error('데이터 저장 실패: ' + result.error);
            } else {
                console.log('✅ 데이터 저장 완료:', {
                    totalImages: savedImages.length,
                    totalPrompts: savedPrompts.length,
                    newImages: newImages.length,
                    newPrompts: newPrompts.length
                });
            }
        });
        
        return {
            success: true,
            totalImages: savedImages.length,
            totalPrompts: savedPrompts.length,
            newImages: newImages.length,
            newPrompts: newPrompts.length
        };
        
    } catch (error) {
        console.error('저장 중 오류 발생:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// 메인 저장 함수
function saveImagesAndPrompts() {
  console.log('=== Sora ChatGPT 데이터 저장 시작 ===');
  
  try {
    // 이미지 수집
    const newImages = collectImages();
    
    // 프롬프트 수집
    const newPrompts = collectPrompts();
    
    // 중복 검사
    const hasDuplicates = checkImageDuplication(newImages[0], savedImages) || checkPromptDuplication(newPrompts[0]?.text || '', savedPrompts.map(p => p.text));
    
    if (hasDuplicates) {
      console.log('🔄 중복된 데이터가 발견되어 저장을 건너뜁니다.');
      return {
        success: true,
        imageCount: newImages.length,
        promptCount: newPrompts.length,
        totalImages: savedImages.length,
        totalPrompts: savedPrompts.length
      };
    }

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

// 메시지 리스너 개선 (비동기 응답 처리)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('메시지 수신:', request);
    
    try {
        if (request.action === 'startMonitoring') {
            handleStartMonitoring(request, sendResponse);
            return true; // 비동기 응답을 위해 true 반환
        } else if (request.action === 'stopMonitoring') {
            handleStopMonitoring(request, sendResponse);
            return true; // 비동기 응답을 위해 true 반환
        } else if (request.action === 'getStatus') {
            handleGetStatus(request, sendResponse);
            return true; // 비동기 응답을 위해 true 반환
        } else if (request.action === 'downloadImages') {
            handleDownloadImages(request, sendResponse);
            return true; // 비동기 응답을 위해 true 반환
        } else {
            // 알 수 없는 액션의 경우 즉시 응답
            sendResponse({ success: false, error: 'Unknown action' });
            return false;
        }
    } catch (error) {
        console.error('메시지 처리 오류:', error);
        sendResponse({ success: false, error: error.message });
        return false;
    }
});

// 모니터링 시작 처리 함수
async function handleStartMonitoring(request, sendResponse) {
    try {
        addLogMessage('▶️ 모니터링 시작 요청 수신');
        
        if (!isMonitoring) {
            startMonitoring();
            addLogMessage('✅ 모니터링이 시작되었습니다');
            sendResponse({ success: true, message: '모니터링 시작됨' });
        } else {
            addLogMessage('⚠️ 이미 모니터링 중입니다');
            sendResponse({ success: true, message: '이미 모니터링 중' });
        }
    } catch (error) {
        console.error('모니터링 시작 오류:', error);
        addLogMessage(`❌ 모니터링 시작 실패: ${error.message}`);
        sendResponse({ success: false, error: error.message });
    }
}

// 모니터링 중지 처리 함수
async function handleStopMonitoring(request, sendResponse) {
    try {
        addLogMessage('⏹️ 모니터링 중지 요청 수신');
        
        if (isMonitoring) {
            stopMonitoring();
            addLogMessage('✅ 모니터링이 중지되었습니다');
            sendResponse({ success: true, message: '모니터링 중지됨' });
        } else {
            addLogMessage('⚠️ 모니터링이 실행 중이 아닙니다');
            sendResponse({ success: true, message: '모니터링이 실행 중이 아님' });
        }
    } catch (error) {
        console.error('모니터링 중지 오류:', error);
        addLogMessage(`❌ 모니터링 중지 실패: ${error.message}`);
        sendResponse({ success: false, error: error.message });
    }
}

// 상태 조회 처리 함수
async function handleGetStatus(request, sendResponse) {
    try {
        const imageElements = findImageElements();
        const status = {
            isMonitoring: isMonitoring,
            imageCount: imageElements.length,
            normalImages: imageElements.filter(img => img.type === 'normal').length,
            policyViolationImages: imageElements.filter(img => img.type === 'policy_violation').length,
            lastCheck: new Date().toISOString()
        };
        
        addLogMessage(`📊 상태 조회: 모니터링=${status.isMonitoring}, 이미지=${status.imageCount}개`);
        sendResponse({ success: true, status: status });
    } catch (error) {
        console.error('상태 조회 오류:', error);
        addLogMessage(`❌ 상태 조회 실패: ${error.message}`);
        sendResponse({ success: false, error: error.message });
    }
}

// 이미지 다운로드 처리 함수
async function handleDownloadImages(request, sendResponse) {
    try {
        addLogMessage('📥 이미지 다운로드 요청 수신');
        
        const imageElements = findImageElements();
        if (imageElements.length === 0) {
            addLogMessage('⚠️ 다운로드할 이미지가 없습니다');
            sendResponse({ success: true, message: '다운로드할 이미지 없음', downloaded: 0 });
            return;
        }
        
        addLogMessage(`📊 ${imageElements.length}개의 이미지 다운로드 시작`);
        
        let downloadedCount = 0;
        let errorCount = 0;
        
        // 순차적으로 다운로드 (동시 다운로드로 인한 오류 방지)
        for (let i = 0; i < imageElements.length; i++) {
            try {
                await downloadImage(imageElements[i], i);
                downloadedCount++;
                addLogMessage(`✅ ${i + 1}/${imageElements.length} 다운로드 완료`);
                
                // 다운로드 간 딜레이 (서버 부하 방지)
                if (i < imageElements.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            } catch (error) {
                errorCount++;
                addLogMessage(`❌ ${i + 1}/${imageElements.length} 다운로드 실패: ${error.message}`);
            }
        }
        
        const resultMessage = `다운로드 완료: 성공 ${downloadedCount}개, 실패 ${errorCount}개`;
        addLogMessage(`🎯 ${resultMessage}`);
        
        sendResponse({ 
            success: true, 
            message: resultMessage,
            downloaded: downloadedCount,
            errors: errorCount,
            total: imageElements.length
        });
        
    } catch (error) {
        console.error('이미지 다운로드 오류:', error);
        addLogMessage(`❌ 이미지 다운로드 실패: ${error.message}`);
        sendResponse({ success: false, error: error.message });
    }
}

// 페이지 로드 완료 후 초기화
window.addEventListener('load', function() {
  console.log('🌐 Sora ChatGPT 페이지 로드 완료');
  
  // 페이지가 완전히 로드된 후 컨트롤 패널 생성
  setTimeout(() => {
    console.log('⏰ 3초 대기 완료 - 패널 생성 시작');
    try {
      createControlPanel();
      console.log('✅ 초기 데이터 수집 시작');
      saveImagesAndPrompts();
    } catch (error) {
      console.error('❌ 초기화 중 오류:', error);
    }
  }, 3000); // 3초 대기
});

// DOM 변경 감지 (MutationObserver)
const observer = new MutationObserver(function(mutations) {
  mutations.forEach(function(mutation) {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      // 새로운 노드가 추가되면 잠시 후 데이터 수집
      setTimeout(() => {
        console.log('🔄 DOM 변경 감지, 데이터 재수집');
        try {
          saveImagesAndPrompts();
        } catch (error) {
          console.error('❌ DOM 변경 시 데이터 수집 오류:', error);
        }
      }, 1000);
    }
  });
});

// 페이지 로드 후 MutationObserver 시작
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 DOM 로드 완료 - MutationObserver 시작');
  try {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    console.log('✅ DOM 변경 감지 시작');
  } catch (error) {
    console.error('❌ MutationObserver 시작 실패:', error);
  }
});

// 즉시 실행 (페이지 로드 전에도)
console.log('🚀 Sora ChatGPT 콘텐츠 스크립트 로드됨');

// 추가 안전장치: 5초 후에도 패널이 없으면 강제 생성
setTimeout(() => {
  const existingPanel = document.getElementById('sora-auto-save-panel');
  if (!existingPanel) {
    console.log('⚠️ 5초 후에도 패널이 없음 - 강제 생성');
    try {
      createControlPanel();
    } catch (error) {
      console.error('❌ 강제 패널 생성 실패:', error);
    }
  }
}, 5000); 

// 이미지 요소 감지 함수 개선 (data-index 순서대로 첫 번째 콘텐츠)
function findImageElements() {
    const imageElements = [];
    
    console.log('🔍 data-index 순서대로 첫 번째 콘텐츠 검색 시작...');
    
    // data-index 순서대로 정렬하여 첫 번째 콘텐츠 찾기
    const dataIndexContainers = Array.from(document.querySelectorAll('div[data-index]'))
        .sort((a, b) => {
            const indexA = parseInt(a.getAttribute('data-index')) || 0;
            const indexB = parseInt(b.getAttribute('data-index')) || 0;
            return indexA - indexB;
        });
    
    console.log(`📊 data-index 컨테이너 ${dataIndexContainers.length}개 발견 (정렬됨)`);
    
    // 순서대로 검색하여 첫 번째 실제 콘텐츠 찾기
    for (let i = 0; i < dataIndexContainers.length; i++) {
        const container = dataIndexContainers[i];
        const dataIndex = container.getAttribute('data-index');
        
        console.log(`🔍 data-index="${dataIndex}" 컨테이너 검사 중...`);
        
        // 1. 정상 이미지 확인
        const normalImage = container.querySelector('img[src*="videos.openai.com"], img[src*="blob:"], img[src*="data:"], img[src*="openai"]');
        
        // 2. 정책 위반 콘텐츠 확인
        const hasAlertIcon = container.querySelector('.lucide-alert-circle');
        const hasPolicyText = container.textContent.includes('This content might violate our policies') ||
                             container.textContent.includes('Review prompt');
        const taskLink = container.querySelector('a[href*="/t/task_"]');
        
        // 3. 텍스트만 있는 컨테이너는 건너뛰기 (예: "Today")
        const hasOnlyText = !normalImage && !hasAlertIcon && !hasPolicyText && !taskLink;
        if (hasOnlyText) {
            console.log(`⏭️ data-index="${dataIndex}" - 텍스트만 있음, 건너뛰기`);
            continue;
        }
        
        // 4. 정상 이미지가 있는 경우
        if (normalImage && normalImage.src) {
            console.log(`✅ 첫 번째 콘텐츠는 정상 이미지! data-index="${dataIndex}"`);
            console.log(`📸 이미지 URL: ${normalImage.src.substring(0, 100)}...`);
            
            // 제목과 프롬프트 추출
            const titleElement = container.querySelector('.text-token-text-primary a') ||
                               container.querySelector('a[href*="/g/"]');
            const title = titleElement?.textContent?.trim() || `Image ${dataIndex}`;
            
            const promptElement = container.querySelector('.text-token-text-primary:not(a)');
            const promptText = promptElement?.textContent?.trim() || '';
            
            imageElements.push({
                element: container,
                src: normalImage.src,
                type: 'normal',
                title: title,
                prompt: promptText,
                dataIndex: dataIndex,
                width: normalImage.naturalWidth || normalImage.width || 1536,
                height: normalImage.naturalHeight || normalImage.height || 1024
            });
            
            console.log(`🎯 첫 번째 정상 이미지 정보:`, {
                title: title,
                dataIndex: dataIndex,
                promptPreview: promptText.substring(0, 50) + '...'
            });
            
            // 첫 번째 콘텐츠를 찾았으므로 즉시 반환
            break;
        }
        
        // 5. 정책 위반 콘텐츠가 있는 경우
        else if ((hasAlertIcon || hasPolicyText) && taskLink) {
            const taskId = taskLink.href.match(/\/t\/(task_[^\/]+)/)?.[1];
            
            console.log(`⚠️ 첫 번째 콘텐츠는 정책 위반! data-index="${dataIndex}"`);
            console.log(`🔗 태스크 ID: ${taskId}`);
            
            // 제목과 프롬프트 추출
            const titleElement = container.querySelector('.text-token-text-primary a') ||
                               taskLink;
            const title = titleElement?.textContent?.trim() || `Policy Violation ${dataIndex}`;
            
            const promptElement = container.querySelector('.text-token-text-primary:not(a)');
            const promptText = promptElement?.textContent?.trim() || '';
            
            imageElements.push({
                element: container,
                src: taskLink.href,
                taskId: taskId,
                type: 'policy_violation',
                title: title,
                prompt: promptText,
                dataIndex: dataIndex
            });
            
            console.log(`🎯 첫 번째 정책 위반 콘텐츠 정보:`, {
                title: title,
                taskId: taskId,
                dataIndex: dataIndex,
                promptPreview: promptText.substring(0, 50) + '...'
            });
            
            // 첫 번째 콘텐츠를 찾았으므로 즉시 반환
            break;
        }
        
        // 6. 아무것도 해당하지 않는 경우
        else {
            console.log(`⏭️ data-index="${dataIndex}" - 콘텐츠 없음, 다음으로 진행`);
        }
    }
    
    if (imageElements.length === 0) {
        console.log('❌ 첫 번째 콘텐츠를 찾을 수 없음');
    } else {
        const firstContent = imageElements[0];
        console.log(`🎉 첫 번째 콘텐츠 확정:`, {
            dataIndex: firstContent.dataIndex,
            type: firstContent.type,
            title: firstContent.title,
            isNormal: firstContent.type === 'normal',
            isPolicyViolation: firstContent.type === 'policy_violation'
        });
    }
    
    return imageElements; // 첫 번째 콘텐츠만 포함된 배열 반환
}

// 다운로드 함수 개선
async function downloadImage(imageData, index) {
    try {
        if (imageData.type === 'policy_violation') {
            // 정책 위반 콘텐츠의 경우 특별 처리
            await downloadPolicyViolationContent(imageData, index);
        } else {
            // 기존 정상 이미지 다운로드 로직
            await downloadNormalImage(imageData, index);
        }
    } catch (error) {
        console.error('다운로드 오류:', error);
        addLogMessage(`❌ 다운로드 실패: ${error.message}`);
    }
}

// 정상 이미지 다운로드 (기존 로직)
async function downloadNormalImage(imageData, index) {
    const response = await fetch(imageData.src);
    const blob = await response.blob();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = imageData.src.includes('video') ? 'mp4' : 'png';
    const filename = `sora-image-${timestamp}-${index + 1}.${extension}`;
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addLogMessage(`✅ 다운로드 완료: ${filename}`);
}

// 정책 위반 콘텐츠 다운로드 (새로 추가)
async function downloadPolicyViolationContent(imageData, index) {
    try {
        addLogMessage(`🔍 정책 위반 콘텐츠 처리 시작: ${imageData.title}`);
        addLogMessage(`🔗 태스크 URL: ${imageData.src}`);
        
        // 1. 태스크 페이지 접근 (더 자세한 로깅)
        addLogMessage('📡 태스크 페이지 요청 중...');
        const taskResponse = await safeFetch(imageData.src);
        
        if (!taskResponse.ok) {
            throw new Error(`HTTP ${taskResponse.status}: ${taskResponse.statusText}`);
        }
        
        addLogMessage('✅ 태스크 페이지 응답 수신');
        const taskHtml = await taskResponse.text();
        addLogMessage(`📄 HTML 크기: ${taskHtml.length} 바이트`);
        
        // 2. HTML 파싱
        const parser = new DOMParser();
        const taskDoc = parser.parseFromString(taskHtml, 'text/html');
        
        // 3. 다양한 선택자로 이미지 찾기
        const imageSelectors = [
            'img[src*="blob:"]',
            'img[src*="data:"]', 
            'img[src*="openai"]',
            'img[src*="chatgpt"]',
            'img[src*="sora"]',
            'video[src*="blob:"]',
            'video[src*="data:"]',
            'img[alt*="generated"]',
            'img[class*="generated"]'
        ];
        
        let foundImages = [];
        imageSelectors.forEach(selector => {
            const images = taskDoc.querySelectorAll(selector);
            addLogMessage(`🔍 "${selector}" 선택자로 ${images.length}개 이미지 발견`);
            foundImages.push(...Array.from(images));
        });
        
        // 중복 제거
        foundImages = foundImages.filter((img, index, self) => 
            index === self.findIndex(i => i.src === img.src)
        );
        
        addLogMessage(`📊 총 ${foundImages.length}개의 고유 이미지 발견`);
        
        if (foundImages.length > 0) {
            // 첫 번째 이미지 다운로드
            const targetImage = foundImages[0];
            const actualImageSrc = targetImage.src;
            addLogMessage(`📸 다운로드할 이미지: ${actualImageSrc.substring(0, 100)}...`);
            
            addLogMessage('📡 이미지 데이터 요청 중...');
            const imageResponse = await safeFetch(actualImageSrc);
            
            if (!imageResponse.ok) {
                throw new Error(`이미지 요청 실패: HTTP ${imageResponse.status}`);
            }
            
            const blob = await imageResponse.blob();
            addLogMessage(`💾 이미지 데이터 수신: ${blob.size} 바이트`);
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const extension = actualImageSrc.includes('video') ? 'mp4' : 'png';
            const filename = `sora-policy-violation-${timestamp}-${index + 1}.${extension}`;
            
            // 다운로드 실행
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            addLogMessage(`✅ 정책 위반 콘텐츠 다운로드 완료: ${filename}`);
        } else {
            // 이미지를 찾을 수 없는 경우
            addLogMessage('⚠️ 태스크 페이지에서 이미지를 찾을 수 없음');
            addLogMessage('📄 페이지 내용 샘플:');
            addLogMessage(taskHtml.substring(0, 500) + '...');
            
            // 메타데이터만 저장
            await savePolicyViolationMetadata(imageData, index);
        }
        
    } catch (error) {
        console.error('정책 위반 콘텐츠 처리 오류:', error);
        addLogMessage(`❌ 정책 위반 콘텐츠 처리 실패: ${error.message}`);
        
        // 실패 시 메타데이터라도 저장
        try {
            await savePolicyViolationMetadata(imageData, index);
        } catch (metaError) {
            console.error('메타데이터 저장도 실패:', metaError);
            addLogMessage(`❌ 메타데이터 저장 실패: ${metaError.message}`);
        }
    }
}

// 정책 위반 콘텐츠 메타데이터 저장
async function savePolicyViolationMetadata(imageData, index) {
    const metadata = {
        type: 'policy_violation',
        title: imageData.title,
        taskId: imageData.taskId,
        url: imageData.src,
        timestamp: new Date().toISOString(),
        note: '정책 위반으로 차단된 콘텐츠'
    };
    
    const jsonString = JSON.stringify(metadata, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `sora-policy-violation-metadata-${timestamp}-${index + 1}.json`;
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    addLogMessage(`📄 정책 위반 메타데이터 저장: ${filename}`);
}

// 로그 메시지에 정책 위반 콘텐츠 감지 추가
function addLogMessage(message) {
    const logContainer = document.getElementById('log-container');
    if (!logContainer) {
        console.warn('로그 컨테이너를 찾을 수 없음');
        return;
    }

    // 메시지 번역 처리
    const translatedMessage = translateLogMessage ? translateLogMessage(message) : message;
    
    const logEntry = document.createElement('div');
    logEntry.style.cssText = `
        padding: 4px 8px;
        margin-bottom: 2px;
        border-radius: 4px;
        font-size: 11px;
        line-height: 1.4;
        background: rgba(255,255,255,0.05);
        border-left: 3px solid transparent;
        word-wrap: break-word;
    `;
    
    // 정책 위반 콘텐츠 감지 시 특별 표시
    if (message.includes('정책 위반') || message.includes('policy violation') || message.includes('Policy Violation')) {
        logEntry.style.backgroundColor = '#fff3cd';
        logEntry.style.borderLeft = '4px solid #ffc107';
        logEntry.style.color = '#856404';
        logEntry.style.fontWeight = 'bold';
    }
    
    const timestamp = new Date().toLocaleTimeString();
    logEntry.textContent = `[${timestamp}] ${translatedMessage}`;
    
    logContainer.appendChild(logEntry);
    logContainer.scrollTop = logContainer.scrollHeight;
    
    // 로그가 너무 많으면 오래된 것 제거
    if (logContainer.children.length > 100) {
        logContainer.removeChild(logContainer.firstChild);
    }
    
    console.log('📝 로그:', message);
}

// 안전한 fetch 함수 (타임아웃 포함)
async function safeFetch(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('요청 시간 초과');
        }
        throw error;
    }
}

// 정책 위반 콘텐츠 다운로드 함수 개선
async function downloadPolicyViolationContent(imageData, index) {
    try {
        addLogMessage(`🔍 정책 위반 콘텐츠 처리 시작: ${imageData.title}`);
        addLogMessage(`🔗 태스크 URL: ${imageData.src}`);
        
        // 1. 태스크 페이지 접근 (더 자세한 로깅)
        addLogMessage('📡 태스크 페이지 요청 중...');
        const taskResponse = await safeFetch(imageData.src);
        
        if (!taskResponse.ok) {
            throw new Error(`HTTP ${taskResponse.status}: ${taskResponse.statusText}`);
        }
        
        addLogMessage('✅ 태스크 페이지 응답 수신');
        const taskHtml = await taskResponse.text();
        addLogMessage(`📄 HTML 크기: ${taskHtml.length} 바이트`);
        
        // 2. HTML 파싱
        const parser = new DOMParser();
        const taskDoc = parser.parseFromString(taskHtml, 'text/html');
        
        // 3. 다양한 선택자로 이미지 찾기
        const imageSelectors = [
            'img[src*="blob:"]',
            'img[src*="data:"]', 
            'img[src*="openai"]',
            'img[src*="chatgpt"]',
            'img[src*="sora"]',
            'video[src*="blob:"]',
            'video[src*="data:"]',
            'img[alt*="generated"]',
            'img[class*="generated"]'
        ];
        
        let foundImages = [];
        imageSelectors.forEach(selector => {
            const images = taskDoc.querySelectorAll(selector);
            addLogMessage(`🔍 "${selector}" 선택자로 ${images.length}개 이미지 발견`);
            foundImages.push(...Array.from(images));
        });
        
        // 중복 제거
        foundImages = foundImages.filter((img, index, self) => 
            index === self.findIndex(i => i.src === img.src)
        );
        
        addLogMessage(`📊 총 ${foundImages.length}개의 고유 이미지 발견`);
        
        if (foundImages.length > 0) {
            // 첫 번째 이미지 다운로드
            const targetImage = foundImages[0];
            const actualImageSrc = targetImage.src;
            addLogMessage(`📸 다운로드할 이미지: ${actualImageSrc.substring(0, 100)}...`);
            
            addLogMessage('📡 이미지 데이터 요청 중...');
            const imageResponse = await safeFetch(actualImageSrc);
            
            if (!imageResponse.ok) {
                throw new Error(`이미지 요청 실패: HTTP ${imageResponse.status}`);
            }
            
            const blob = await imageResponse.blob();
            addLogMessage(`💾 이미지 데이터 수신: ${blob.size} 바이트`);
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const extension = actualImageSrc.includes('video') ? 'mp4' : 'png';
            const filename = `sora-policy-violation-${timestamp}-${index + 1}.${extension}`;
            
            // 다운로드 실행
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            addLogMessage(`✅ 정책 위반 콘텐츠 다운로드 완료: ${filename}`);
        } else {
            // 이미지를 찾을 수 없는 경우
            addLogMessage('⚠️ 태스크 페이지에서 이미지를 찾을 수 없음');
            addLogMessage('📄 페이지 내용 샘플:');
            addLogMessage(taskHtml.substring(0, 500) + '...');
            
            // 메타데이터만 저장
            await savePolicyViolationMetadata(imageData, index);
        }
        
    } catch (error) {
        console.error('정책 위반 콘텐츠 처리 오류:', error);
        addLogMessage(`❌ 정책 위반 콘텐츠 처리 실패: ${error.message}`);
        
        // 실패 시 메타데이터라도 저장
        try {
            await savePolicyViolationMetadata(imageData, index);
        } catch (metaError) {
            console.error('메타데이터 저장도 실패:', metaError);
            addLogMessage(`❌ 메타데이터 저장 실패: ${metaError.message}`);
        }
    }
}

// 오류 처리 개선
window.addEventListener('error', (event) => {
    console.error('전역 오류:', event.error);
    addLogMessage(`❌ 전역 오류: ${event.error?.message || 'Unknown error'}`);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('처리되지 않은 Promise 거부:', event.reason);
    addLogMessage(`❌ Promise 오류: ${event.reason?.message || 'Unknown promise rejection'}`);
}); 

// 초기화 함수
function initializeExtension() {
    console.log('🚀 Sora Auto Save 확장 프로그램 초기화 시작');
    
    // 기존 데이터 로드
    loadExistingData();
    
    // 이벤트 리스너 설정
    setupStorageListener();
    setupMessageListener();
    
    // 페이지가 완전히 로드된 후 컨트롤 패널 생성
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(createControlPanel, 1000);
        });
    } else {
        setTimeout(createControlPanel, 1000);
    }
    
    console.log('✅ 확장 프로그램 초기화 완료');
}

// 페이지 로드 시 초기화 실행
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
    initializeExtension();
} 