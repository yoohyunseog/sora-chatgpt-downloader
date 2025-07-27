// 자동 저장 타이머
let autoSaveTimer = null;
let isAutoSaveEnabled = false;

// 메시지 리스너
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('백그라운드 메시지 수신:', request);
  
  switch (request.action) {
    case 'startAutoSave':
      startAutoSave(request.interval);
      break;
    case 'stopAutoSave':
      stopAutoSave();
      break;
    case 'manualSave':
      performSave();
      break;
  }
});

// 자동 저장 시작
function startAutoSave(interval) {
  console.log('자동 저장 시작:', interval, 'ms (', interval/1000, '초)');
  
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
  }
  
  isAutoSaveEnabled = true;
  
  // 즉시 첫 번째 저장 실행
  performSave();
  
  // 주기적 저장 설정
  autoSaveTimer = setInterval(() => {
    if (isAutoSaveEnabled) {
      performSave();
    }
  }, interval);
  
  // 상태 영구 저장
  saveAutoSaveState(true, interval);
}

// 자동 저장 중지
function stopAutoSave() {
  console.log('자동 저장 중지');
  
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
  }
  
  isAutoSaveEnabled = false;
  
  // 상태 영구 저장
  saveAutoSaveState(false, 0);
}

// 자동 저장 상태 영구 저장
function saveAutoSaveState(enabled, interval) {
  const state = {
    autoSaveEnabled: enabled,
    saveInterval: interval / 1000, // 밀리초를 초로 변환
    lastUpdated: new Date().toISOString()
  };
  
  chrome.storage.local.set(state, function() {
    if (chrome.runtime.lastError) {
      console.error('백그라운드 자동 저장 상태 저장 실패:', chrome.runtime.lastError);
    } else {
      console.log('백그라운드 자동 저장 상태 저장 완료:', state);
    }
  });
}

// 저장 실행
function performSave() {
  console.log('저장 실행 시작');
  
  // 현재 활성 탭 찾기
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs.length === 0) {
      console.log('활성 탭을 찾을 수 없습니다.');
      return;
    }
    
    const activeTab = tabs[0];
    const url = activeTab.url;
    
    // Sora ChatGPT 라이브러리 페이지인지 확인
    if (!url.includes('sora.chatgpt.com/library')) {
      console.log('Sora ChatGPT 라이브러리 페이지가 아닙니다:', url);
      chrome.runtime.sendMessage({
        action: 'pageNotMatch'
      });
      return;
    }
    
    console.log('Sora ChatGPT 라이브러리 페이지에서 저장 시작:', url);
    
    // 콘텐츠 스크립트에 저장 요청
    chrome.tabs.sendMessage(activeTab.id, {
      action: 'saveImagesAndPrompts'
    }, function(response) {
      if (chrome.runtime.lastError) {
        console.log('콘텐츠 스크립트 응답 오류:', chrome.runtime.lastError);
        chrome.runtime.sendMessage({
          action: 'saveError',
          error: '콘텐츠 스크립트를 찾을 수 없습니다. 페이지를 새로고침해주세요.'
        });
        return;
      }
      
      if (response && response.success) {
        console.log('저장 완료:', response);
        
        // 자동 다운로드 상태 확인
        chrome.storage.local.get(['autoDownloadEnabled'], function(result) {
          const autoDownloadEnabled = result.autoDownloadEnabled || false;
          
          chrome.runtime.sendMessage({
            action: 'saveComplete',
            imageCount: response.imageCount,
            promptCount: response.promptCount,
            autoDownloadEnabled: autoDownloadEnabled
          });
          
          if (autoDownloadEnabled) {
            console.log('자동 다운로드가 활성화되어 있습니다.');
          }
        });
      } else {
        console.log('저장 실패:', response);
        chrome.runtime.sendMessage({
          action: 'saveError',
          error: response ? response.error : '알 수 없는 오류'
        });
      }
    });
  });
}

// 확장 프로그램 설치/업데이트 시 초기화
chrome.runtime.onInstalled.addListener(function() {
  console.log('Sora ChatGPT 자동 저장 확장 프로그램이 설치되었습니다.');
  
  // 기본 설정 초기화
  chrome.storage.local.get(['autoSaveEnabled', 'saveInterval', 'autoDownloadEnabled'], function(result) {
    if (result.autoSaveEnabled === undefined) {
      chrome.storage.local.set({
        autoSaveEnabled: false,
        saveInterval: 30, // 기본값을 30초로 변경
        autoDownloadEnabled: false // 자동 다운로드 기본값
      });
    } else if (result.autoSaveEnabled) {
      // 이미 자동 저장이 활성화되어 있다면 복원
      const interval = (result.saveInterval || 30) * 1000;
      console.log('설치 시 자동 저장 상태 복원:', interval, 'ms');
      startAutoSave(interval);
    }
  });
});

// 탭 업데이트 시 자동 저장 상태 확인
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && isAutoSaveEnabled) {
    // 페이지 로드 완료 시 자동 저장이 활성화되어 있다면 저장 실행
    setTimeout(() => {
      if (tab.url && tab.url.includes('sora.chatgpt.com/library')) {
        console.log('페이지 로드 완료, 자동 저장 실행');
        performSave();
      }
    }, 2000); // 2초 대기 후 저장
  }
});

// 확장 프로그램 시작 시 저장된 설정 복원
chrome.runtime.onStartup.addListener(function() {
  console.log('확장 프로그램 시작 - 자동 저장 상태 복원');
  
  chrome.storage.local.get(['autoSaveEnabled', 'saveInterval', 'autoDownloadEnabled'], function(result) {
    if (result.autoSaveEnabled) {
      const interval = (result.saveInterval || 30) * 1000; // 기본값을 30초로 변경
      console.log('시작 시 자동 저장 복원:', interval, 'ms');
      startAutoSave(interval);
    } else {
      console.log('자동 저장이 비활성화 상태입니다.');
    }
  });
});

// 브라우저가 포커스를 받았을 때 상태 복원
chrome.windows.onFocusChanged.addListener(function(windowId) {
  if (windowId !== chrome.windows.WINDOW_ID_NONE) {
    console.log('브라우저 포커스 - 자동 저장 상태 확인');
    
    chrome.storage.local.get(['autoSaveEnabled', 'saveInterval', 'autoDownloadEnabled'], function(result) {
      if (result.autoSaveEnabled && !isAutoSaveEnabled) {
        const interval = (result.saveInterval || 30) * 1000;
        console.log('포커스 시 자동 저장 복원:', interval, 'ms');
        startAutoSave(interval);
      }
    });
  }
}); 