// Sora ChatGPT 라이브러리 페이지에서 이미지와 프롬프트 수집

// 이미지와 프롬프트 데이터 저장소
let savedImages = [];
let savedPrompts = [];

// 페이지 컨트롤 패널
let controlPanel = null;
let isPanelCreated = false;

// 카운트다운 관련 변수
let pageCountdownTimer = null;
let pageCountdownInterval = null;

// 페이지 로드 시 기존 데이터 불러오기
chrome.storage.local.get(['savedImages', 'savedPrompts'], function(result) {
  if (result.savedImages) {
    savedImages = result.savedImages;
  }
  if (result.savedPrompts) {
    savedPrompts = result.savedPrompts;
  }
  console.log('기존 데이터 로드됨:', {
    images: savedImages.length,
    prompts: savedPrompts.length
  });
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
      
      // 페이지에서 직접 저장 실행
      console.log('카운트다운 완료 - 페이지에서 직접 저장 실행');
      const result = saveImagesAndPrompts();
      
      // 자동 다운로드 확인
      const autoDownloadEnabled = document.getElementById('page-auto-download-toggle')?.checked;
      if (autoDownloadEnabled && result.success) {
        setTimeout(() => {
          performDownload();
          console.log('자동 다운로드 완료');
        }, 1000);
      }
      
      // 새로운 카운트다운 시작
      setTimeout(() => {
        const autoSaveEnabled = document.getElementById('page-auto-save-toggle')?.checked;
        if (autoSaveEnabled) {
          startPageCountdown(30); // 30초로 재시작
        }
      }, 2000);
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
      <div style="margin-bottom: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 12px;">자동 저장</span>
          <label class="toggle-switch" style="width: 40px; height: 20px; margin: 0;">
            <input type="checkbox" id="page-auto-save-toggle" style="opacity: 0; width: 0; height: 0;">
            <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255,255,255,0.3); transition: .4s; border-radius: 20px;">
              <span style="position: absolute; content: ''; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%;"></span>
            </span>
          </label>
        </div>
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 12px;">자동 다운로드</span>
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
        이미지: 0개 | 프롬프트: 0개
      </div>
      
      <div id="page-countdown" style="display: none; text-align: center; margin-top: 8px; font-size: 12px; font-weight: bold; background: rgba(255,255,255,0.15); padding: 8px; border-radius: 8px;">
        ⏰ 다음 저장까지: <span id="page-countdown-number" style="color: #ffeb3b;">30</span>초
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
  
  // 초기 상태 설정
  loadPanelState();
  
  console.log('페이지 컨트롤 패널 생성 완료');
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
      console.log('페이지에서 자동 저장 시작 (직접 실행)');
    } else {
      // 카운트다운 중지
      stopPageCountdown();
      console.log('페이지에서 자동 저장 중지');
    }
    
    // 상태 저장
    savePanelState();
  });
  
  // 자동 다운로드 토글
  document.getElementById('page-auto-download-toggle').addEventListener('change', function() {
    const isEnabled = this.checked;
    
    // 상태 저장
    savePanelState();
    
    console.log('페이지에서 자동 다운로드 토글:', isEnabled ? 'ON' : 'OFF');
  });
  
  // 수동 저장 버튼
  document.getElementById('page-manual-save').addEventListener('click', function() {
    console.log('페이지에서 수동 저장 실행');
    
    // 페이지에서 직접 저장 실행
    const result = saveImagesAndPrompts();
    
    if (result.success) {
      console.log('수동 저장 완료:', result);
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
    console.log('페이지에서 다운로드 실행');
    performDownload();
    
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
      console.log('✅ 패널 상태 저장 완료');
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
    
    stats.innerHTML = `
      📊 저장 통계<br>
      이미지: ${imageCount}개 | 프롬프트: ${promptCount}개
    `;
  });
}

// 다운로드 실행
function performDownload() {
  console.log('다운로드 시작...');
  
  // 먼저 현재 페이지에서 직접 데이터 수집 시도
  const currentImages = collectImages();
  const currentPrompts = collectPrompts();
  
  console.log('현재 수집된 데이터:', {
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
      console.log('저장된 데이터:', {
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
    
    console.log('다운로드할 데이터:', {
      total_images: data.images.length,
      total_prompts: data.prompts.length,
      method: data.metadata.download_method
    });
    
    if (data.images.length === 0 && data.prompts.length === 0) {
      console.error('❌ 다운로드할 데이터가 없습니다.');
      return;
    }
    
    try {
      // JSON 파일 다운로드
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `sora_auto_save_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // URL 해제
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
      
      console.log('✅ 다운로드 완료:', a.download);
      console.log('파일 크기:', blob.size, 'bytes');
      
    } catch (error) {
      console.error('❌ 다운로드 중 오류:', error);
    }
  });
}

// 이미지 수집 함수
function collectImages() {
  console.log('이미지 수집 시작');
  
  // 모든 이미지 컨테이너 찾기 (data-index 속성을 가진 div들)
  const imageContainers = document.querySelectorAll('[data-index]');
  
  console.log(`발견된 이미지 컨테이너: ${imageContainers.length}개`);
  
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
        
        console.log(`컨테이너 ${containerIndex} - 첫 번째 완성된 이미지 발견:`, imgSrc.substring(0, 50) + '...');
        console.log(`연결된 프롬프트:`, cleanPrompt.substring(0, 50) + '...');
        
        // 첫 번째 이미지만 반환
        return [imageData];
      }
    }
  }
  
  console.log('완성된 이미지를 찾을 수 없음');
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
  console.log('프롬프트 수집 시작');
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

console.log('Sora ChatGPT 콘텐츠 스크립트 로드됨'); 