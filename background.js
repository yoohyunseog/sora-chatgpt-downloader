// 프롬프트 테스트 확장 프로그램 - 백그라운드 스크립트
console.log('프롬프트 테스트 확장 프로그램 - 백그라운드 스크립트 로드됨');

// 프롬프트 데이터 로드 함수
async function getPromptData() {
  try {
    console.log('백그라운드 스크립트에서 프롬프트 데이터 로딩 중...');
    
    // data.json의 확장 프로그램 URL 가져오기
    const dataUrl = chrome.runtime.getURL('data.json');
    console.log('데이터 URL:', dataUrl);
    
    // 데이터 가져오기
    const response = await fetch(dataUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP 오류! 상태: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('백그라운드 스크립트에서 프롬프트 데이터 로드 성공:', data);
    
    return data;
    
  } catch (error) {
    console.error('백그라운드 스크립트에서 프롬프트 데이터 로드 오류:', error);
    throw error;
  }
}

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 백그라운드 스크립트 메시지 수신:', request.action);
  
  if (request.action === 'getPromptData') {
    getPromptData().then(data => {
      sendResponse({ success: true, data: data });
    }).catch(error => {
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  if (request.action === 'ping') {
    sendResponse({
      success: true,
      message: 'pong',
      timestamp: new Date().toISOString()
    });
    return true;
  }
  
  console.warn('⚠️ 처리되지 않은 액션:', request.action);
  sendResponse({ success: false, error: '알 수 없는 액션: ' + request.action });
  return true;
});

// 탭 업데이트 처리 (콘텐츠 스크립트 주입용)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('탭 업데이트됨:', tab.url);
    
    // 탭이 완전히 로드되었을 때 수행할 작업을 여기에 추가할 수 있습니다
    // 예: 콘텐츠 스크립트 주입 또는 기타 작업
  }
});

// 확장 프로그램 아이콘 클릭 처리
chrome.action.onClicked.addListener((tab) => {
  console.log('확장 프로그램 아이콘이 탭에서 클릭됨:', tab.id);
  
  // 아이콘 클릭 시 수행할 작업을 여기에 추가할 수 있습니다
  // 예: 팝업 열기 또는 콘텐츠 스크립트에 메시지 전송
});

// 확장 프로그램 설치 처리
chrome.runtime.onInstalled.addListener((details) => {
  console.log('확장 프로그램 설치됨:', details);
  
  if (details.reason === 'install') {
    console.log('첫 번째 설치');
    // 여기에 초기화 로직을 추가할 수 있습니다
  }
});

// 확장 프로그램 시작 처리
chrome.runtime.onStartup.addListener(() => {
  console.log('확장 프로그램 시작됨');
});

console.log('🚀 백그라운드 스크립트 시작됨:', new Date().toLocaleString()); 