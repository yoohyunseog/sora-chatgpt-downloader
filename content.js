// 자동 저장 확장 프로그램 콘텐츠 스크립트
console.log('Auto Save Extension Content Script 로드됨');

// 저장된 데이터 추적
let savedImages = new Set();
let savedPrompts = new Set();
let lastSaveTime = Date.now();

// DOM 변화 감지용 MutationObserver
let observer = null;
let saveInterval = null;

// 자동 저장 활성화
function enableAutoSave() {
  console.log('자동 저장 활성화');
  
  // 기존 데이터 로드
  loadSavedData();
  
  // DOM 변화 감지 시작
  startObserving();
  
  // 주기적 저장 시작
  startPeriodicSave();
}

// 자동 저장 비활성화
function disableAutoSave() {
  console.log('자동 저장 비활성화');
  
  // DOM 변화 감지 중지
  stopObserving();
  
  // 주기적 저장 중지
  stopPeriodicSave();
}

// DOM 변화 감지 시작 (프롬프트만 감지)
function startObserving() {
  if (observer) {
    observer.disconnect();
  }
  
  observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // 새로 추가된 프롬프트만 감지 (이미지는 주기적 스캔)
            detectNewPrompts(node);
          }
        });
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('DOM 변화 감지 시작 (프롬프트만)');
}

// DOM 변화 감지 중지
function stopObserving() {
  if (observer) {
    observer.disconnect();
    observer = null;
    console.log('DOM 변화 감지 중지');
  }
}

// 페이지의 모든 이미지 저장 (한 번에)
function saveAllPageImages() {
  console.log('페이지의 모든 이미지 저장 시작...');
  
  const allImages = document.querySelectorAll('img');
  let savedCount = 0;
  let skippedCount = 0;
  
  allImages.forEach(img => {
    if (img.src && img.src.trim() !== '') {
      // 중복 체크
      if (!savedImages.has(img.src)) {
        const imageData = {
          url: img.src,
          alt: img.alt || '',
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          pageUrl: window.location.href,
          pageTitle: document.title,
          timestamp: new Date().toISOString(),
          type: 'image'
        };
        
        savedImages.add(img.src);
        saveImageData(imageData);
        savedCount++;
        console.log(`이미지 저장됨 (${savedCount}):`, img.src.substring(0, 50) + '...');
      } else {
        skippedCount++;
      }
    }
  });
  
  console.log(`이미지 저장 완료: ${savedCount}개 저장, ${skippedCount}개 건너뛰기`);
  return { saved: savedCount, skipped: skippedCount };
}

// 새 프롬프트 감지
function detectNewPrompts(container) {
  // textarea에서 프롬프트 찾기
  const textareas = container.querySelectorAll ? container.querySelectorAll('textarea') : [];
  textareas.forEach(textarea => {
    const text = textarea.value || '';
    if (text.length > 10 && !savedPrompts.has(text)) {
      const promptData = {
        content: text,
        pageUrl: window.location.href,
        pageTitle: document.title,
        timestamp: new Date().toISOString(),
        type: 'prompt',
        source: 'textarea'
      };
      
      savedPrompts.add(text);
      savePromptData(promptData);
      console.log('새 프롬프트 감지 (textarea):', text.substring(0, 50) + '...');
    }
  });
  
  // 채팅 메시지에서 프롬프트 찾기
  const messages = container.querySelectorAll ? container.querySelectorAll('[data-message-author-role="user"], .message, .chat-message') : [];
  messages.forEach(message => {
    const text = message.textContent || '';
    if (text.length > 10 && !savedPrompts.has(text)) {
      const promptData = {
        content: text,
        pageUrl: window.location.href,
        pageTitle: document.title,
        timestamp: new Date().toISOString(),
        type: 'prompt',
        source: 'chat'
      };
      
      savedPrompts.add(text);
      savePromptData(promptData);
      console.log('새 프롬프트 감지 (chat):', text.substring(0, 50) + '...');
    }
  });
}

// 이미지 데이터 저장
function saveImageData(imageData) {
  // 브라우저 스토리지에 저장
  saveToBrowserStorage('image', imageData);
}

// 프롬프트 데이터 저장
function savePromptData(promptData) {
  // 브라우저 스토리지에 저장
  saveToBrowserStorage('prompt', promptData);
}

// 브라우저 스토리지에 저장 + 자동 JSON 다운로드
function saveToBrowserStorage(type, data) {
  chrome.storage.local.get(['savedData'], function(result) {
    const savedData = result.savedData || { images: [], prompts: [] };
    
    if (type === 'image') {
      savedData.images.push(data);
      if (savedData.images.length > 1000) {
        savedData.images = savedData.images.slice(-1000);
      }
    } else if (type === 'prompt') {
      savedData.prompts.push(data);
      if (savedData.prompts.length > 1000) {
        savedData.prompts = savedData.prompts.slice(-1000);
      }
    }
    
    savedData.lastSaved = new Date().toISOString();
    
    chrome.storage.local.set({ savedData: savedData }, function() {
      console.log(`${type} 데이터 브라우저 스토리지에 저장됨`);
      
      // 자동 JSON 다운로드 (10개마다)
      const totalItems = savedData.images.length + savedData.prompts.length;
      if (totalItems % 10 === 0) {
        autoDownloadJSON(savedData);
      }
    });
  });
}

// 페이지 데이터 저장
function savePageData(pageData) {
  // 브라우저 스토리지에 저장
  chrome.storage.local.get(['monitoredPages'], function(result) {
    const pages = result.monitoredPages || [];
    const existingPage = pages.find(p => p.url === pageData.url);
    
    if (!existingPage) {
      pages.push(pageData);
      chrome.storage.local.set({ monitoredPages: pages }, function() {
        console.log('페이지 데이터 저장됨:', pageData.url);
      });
    }
  });
}

// 저장된 데이터 로드
function loadSavedData() {
  // 브라우저 스토리지에서 로드
  loadFromBrowserStorage();
}

// 브라우저 스토리지에서 데이터 로드 (폴백)
function loadFromBrowserStorage() {
  chrome.storage.local.get(['savedData'], function(result) {
    const data = result.savedData || { images: [], prompts: [] };
    
    // 기존 이미지 URL들 로드
    data.images.forEach(img => {
      savedImages.add(img.url);
    });
    
    // 기존 프롬프트들 로드
    data.prompts.forEach(prompt => {
      savedPrompts.add(prompt.content);
    });
    
    console.log(`브라우저 스토리지 데이터 로드: 이미지 ${data.images.length}개, 프롬프트 ${data.prompts.length}개`);
  });
}

// 주기적 저장 시작
function startPeriodicSave() {
  if (saveInterval) {
    clearInterval(saveInterval);
  }
  
  // 현재 페이지의 모든 이미지와 프롬프트 스캔
  scanCurrentPage();
  
  // 30초마다 현재 페이지 스캔 (이미지 전체 저장)
  saveInterval = setInterval(scanCurrentPage, 30000);
  console.log('주기적 저장 시작 (30초 간격)');
}

// 주기적 저장 중지
function stopPeriodicSave() {
  if (saveInterval) {
    clearInterval(saveInterval);
    saveInterval = null;
    console.log('주기적 저장 중지');
  }
}

// 현재 페이지 스캔
function scanCurrentPage() {
  console.log('페이지 전체 스캔 시작...');
  
  // 모든 이미지 한 번에 저장
  const imageResult = saveAllPageImages();
  
  // 모든 프롬프트 스캔
  const allTextareas = document.querySelectorAll('textarea');
  let promptCount = 0;
  allTextareas.forEach(textarea => {
    const text = textarea.value || '';
    if (text.length > 10 && !savedPrompts.has(text)) {
      const promptData = {
        content: text,
        pageUrl: window.location.href,
        pageTitle: document.title,
        timestamp: new Date().toISOString(),
        type: 'prompt',
        source: 'textarea'
      };
      
      savedPrompts.add(text);
      savePromptData(promptData);
      promptCount++;
    }
  });
  
  // 채팅 메시지 스캔
  const allMessages = document.querySelectorAll('[data-message-author-role="user"], .message, .chat-message');
  allMessages.forEach(message => {
    const text = message.textContent || '';
    if (text.length > 10 && !savedPrompts.has(text)) {
      const promptData = {
        content: text,
        pageUrl: window.location.href,
        pageTitle: document.title,
        timestamp: new Date().toISOString(),
        type: 'prompt',
        source: 'chat'
      };
      
      savedPrompts.add(text);
      savePromptData(promptData);
      promptCount++;
    }
  });
  
  console.log(`페이지 스캔 완료: 이미지 ${imageResult.saved}개 저장, 프롬프트 ${promptCount}개 저장`);
}

// 페이지 로드 시 초기 스캔
document.addEventListener('DOMContentLoaded', function() {
  console.log('페이지 로드 완료, 초기 스캔 시작');
  
  // 자동 저장 상태 확인
  chrome.storage.local.get(['autoSaveEnabled'], function(result) {
    if (result.autoSaveEnabled) {
      enableAutoSave();
    }
  });
  
  // 페이지 정보 저장
  const pageInfo = {
    url: window.location.href,
    title: document.title,
    timestamp: new Date().toISOString()
  };
  
  savePageData(pageInfo);
});

// 메시지 리스너
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Content script 메시지 수신:', request);
  
  if (request.action === 'enableAutoSave') {
    enableAutoSave();
    sendResponse({ success: true });
  } else if (request.action === 'disableAutoSave') {
    disableAutoSave();
    sendResponse({ success: true });
  } else if (request.action === 'scanPage') {
    scanCurrentPage();
    sendResponse({ success: true });
  } else if (request.action === 'saveAllImages') {
    const result = saveAllPageImages();
    sendResponse({ success: true, data: result });
  }
  
  return true;
});

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', function() {
  stopObserving();
  stopPeriodicSave();
});

// 수동 테스트를 위한 전역 함수 추가
window.saveAllPageImages = saveAllPageImages;
window.scanCurrentPage = scanCurrentPage;
window.enableAutoSave = enableAutoSave;
window.disableAutoSave = disableAutoSave;

// 자동 JSON 다운로드 함수
function autoDownloadJSON(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `auto_save_data_${timestamp}.json`;
  
  const jsonData = {
    metadata: {
      exportTime: new Date().toISOString(),
      totalImages: data.images.length,
      totalPrompts: data.prompts.length,
      version: '1.0.0'
    },
    data: data
  };
  
  const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
    type: 'application/json'
  });
  
  const url = URL.createObjectURL(blob);
  
  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: false
  }, function(downloadId) {
    if (chrome.runtime.lastError) {
      console.error('JSON 다운로드 실패:', chrome.runtime.lastError);
    } else {
      console.log(`JSON 파일 자동 다운로드 완료: ${filename}`);
      // URL 해제
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  });
}

// 수동 JSON 다운로드 함수
window.downloadJSON = function() {
  chrome.storage.local.get(['savedData'], function(result) {
    const data = result.savedData || { images: [], prompts: [] };
    autoDownloadJSON(data);
  });
};

// 이미지 저장 테스트 함수
window.testImageSave = function() {
  console.log('=== 이미지 저장 테스트 시작 ===');
  const result = saveAllPageImages();
  console.log(`이미지 저장 결과: ${result.saved}개 저장, ${result.skipped}개 건너뛰기`);
  return result;
}; 