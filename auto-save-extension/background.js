// 자동 저장 확장 프로그램 백그라운드 스크립트
console.log('Auto Save Extension Background Script 로드됨');

// 자동 저장 활성화
function enableAutoSave() {
  console.log('백그라운드: 자동 저장 활성화');
  
  // 모든 탭에 자동 저장 활성화 메시지 전송
  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { action: 'enableAutoSave' }, function(response) {
        if (chrome.runtime.lastError) {
          console.log(`탭 ${tab.id}에 메시지 전송 실패:`, chrome.runtime.lastError.message);
        } else {
          console.log(`탭 ${tab.id}에 자동 저장 활성화됨`);
        }
      });
    });
  });
}

// 자동 저장 비활성화
function disableAutoSave() {
  console.log('백그라운드: 자동 저장 비활성화');
  
  // 모든 탭에 자동 저장 비활성화 메시지 전송
  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { action: 'disableAutoSave' }, function(response) {
        if (chrome.runtime.lastError) {
          console.log(`탭 ${tab.id}에 메시지 전송 실패:`, chrome.runtime.lastError.message);
        } else {
          console.log(`탭 ${tab.id}에 자동 저장 비활성화됨`);
        }
      });
    });
  });
}

// 설정 업데이트
function updateSettings(settings) {
  console.log('백그라운드: 설정 업데이트', settings);
  
  // 모든 탭에 설정 업데이트 메시지 전송
  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { 
        action: 'updateSettings', 
        settings: settings 
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.log(`탭 ${tab.id}에 설정 업데이트 실패:`, chrome.runtime.lastError.message);
        } else {
          console.log(`탭 ${tab.id}에 설정 업데이트됨`);
        }
      });
    });
  });
}

// 데이터 내보내기
function exportData() {
  console.log('백그라운드: 데이터 내보내기');
  
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['savedData', 'monitoredPages'], function(result) {
      const data = {
        savedData: result.savedData || { images: [], prompts: [] },
        monitoredPages: result.monitoredPages || [],
        exportInfo: {
          timestamp: new Date().toISOString(),
          totalImages: (result.savedData || {}).images?.length || 0,
          totalPrompts: (result.savedData || {}).prompts?.length || 0,
          totalPages: (result.monitoredPages || []).length
        }
      };
      
      resolve({ success: true, data: data });
    });
  });
}

// 데이터 삭제
function clearData() {
  console.log('백그라운드: 데이터 삭제');
  
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(['savedData', 'monitoredPages'], function() {
      if (chrome.runtime.lastError) {
        reject({ success: false, error: chrome.runtime.lastError.message });
      } else {
        resolve({ success: true });
      }
    });
  });
}

// 새 탭이 생성될 때 자동 저장 활성화
chrome.tabs.onCreated.addListener(function(tab) {
  console.log('새 탭 생성됨:', tab.id);
  
  // 자동 저장이 활성화되어 있으면 새 탭에도 적용
  chrome.storage.local.get(['autoSaveEnabled'], function(result) {
    if (result.autoSaveEnabled) {
      // 탭이 완전히 로드된 후 메시지 전송
      chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, tab) {
        if (tabId === tab.id && changeInfo.status === 'complete') {
          chrome.tabs.sendMessage(tabId, { action: 'enableAutoSave' }, function(response) {
            if (chrome.runtime.lastError) {
              console.log(`새 탭 ${tabId}에 자동 저장 활성화 실패:`, chrome.runtime.lastError.message);
            } else {
              console.log(`새 탭 ${tabId}에 자동 저장 활성화됨`);
            }
          });
          chrome.tabs.onUpdated.removeListener(listener);
        }
      });
    }
  });
});

// 탭이 업데이트될 때 자동 저장 활성화
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete') {
    console.log('탭 업데이트 완료:', tabId);
    
    // 자동 저장이 활성화되어 있으면 탭에 적용
    chrome.storage.local.get(['autoSaveEnabled'], function(result) {
      if (result.autoSaveEnabled) {
        chrome.tabs.sendMessage(tabId, { action: 'enableAutoSave' }, function(response) {
          if (chrome.runtime.lastError) {
            console.log(`탭 ${tabId}에 자동 저장 활성화 실패:`, chrome.runtime.lastError.message);
          } else {
            console.log(`탭 ${tabId}에 자동 저장 활성화됨`);
          }
        });
      }
    });
  }
});

// 메시지 리스너
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('백그라운드 메시지 수신:', request);
  
  if (request.action === 'enableAutoSave') {
    enableAutoSave();
    sendResponse({ success: true });
  } else if (request.action === 'disableAutoSave') {
    disableAutoSave();
    sendResponse({ success: true });
  } else if (request.action === 'updateSettings') {
    updateSettings(request);
    sendResponse({ success: true });
  } else if (request.action === 'exportData') {
    exportData().then(response => {
      sendResponse(response);
    }).catch(error => {
      sendResponse(error);
    });
    return true; // 비동기 응답
  } else if (request.action === 'clearData') {
    clearData().then(response => {
      sendResponse(response);
    }).catch(error => {
      sendResponse(error);
    });
    return true; // 비동기 응답
  }
});

// 확장 프로그램 설치 시 초기화
chrome.runtime.onInstalled.addListener(function(details) {
  console.log('확장 프로그램 설치됨:', details.reason);
  
  if (details.reason === 'install') {
    // 초기 설정
    chrome.storage.local.set({
      autoSaveEnabled: false,
      saveInterval: 5,
      maxItems: 1000
    });
    
    console.log('초기 설정 완료');
  }
});

// 확장 프로그램 시작 시 자동 저장 상태 복원
chrome.runtime.onStartup.addListener(function() {
  console.log('확장 프로그램 시작됨');
  
  chrome.storage.local.get(['autoSaveEnabled'], function(result) {
    if (result.autoSaveEnabled) {
      console.log('자동 저장 상태 복원 중...');
      enableAutoSave();
    }
  });
}); 