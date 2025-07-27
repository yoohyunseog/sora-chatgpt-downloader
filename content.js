// Sora 페이지에서 실행되는 content script
const VERSION = '1.1.7';

// 즉시 실행되는 로드 확인
console.log(`🎬 Sora Auto Downloader v${VERSION} loaded`);
console.log('📍 Current URL:', window.location.href);
console.log('🔍 Checking if we are on Sora page...');

// 페이지에 로드 표시 추가
function createLoadIndicator() {
  // 기존 표시가 있으면 제거
  const existingIndicator = document.getElementById('sora-auto-downloader-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }
  
  const loadIndicator = document.createElement('div');
  loadIndicator.id = 'sora-auto-downloader-indicator';
  loadIndicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    font-size: 12px;
    z-index: 10000;
    font-family: monospace;
  `;
  loadIndicator.textContent = `Sora Auto v${VERSION} loaded`;
  document.body.appendChild(loadIndicator);
  
  // 3초 후 표시 제거
  setTimeout(() => {
    if (loadIndicator.parentNode) {
      loadIndicator.parentNode.removeChild(loadIndicator);
    }
  }, 3000);
}

// 즉시 표시 생성
createLoadIndicator();

// 페이지 로드 완료 시 초기화 메시지
document.addEventListener('DOMContentLoaded', function() {
  console.log('🎬 Sora Auto Downloader DOM ready');
  showNotification('Sora Auto Downloader 로드됨!', 'info');
});

// 메시지 리스너 등록
function setupMessageListener() {
  console.log('🔧 Setting up message listener...');
  
  // 기존 리스너 제거 (중복 방지)
  if (window.soraMessageListener) {
    chrome.runtime.onMessage.removeListener(window.soraMessageListener);
  }
  
  window.soraMessageListener = async function(request, sender, sendResponse) {
    console.log('📨 Received message:', request);
    console.log('📨 Sender:', sender);
    
    try {
      if (request.action === 'ping') {
        console.log('🏓 Ping received, sending pong...');
        const response = {status: 'pong', version: VERSION, timestamp: Date.now()};
        console.log('🏓 Sending response:', response);
        sendResponse(response);
        return true;
      }
      
      if (request.action === 'executeSora') {
        console.log('🚀 Starting Sora automation...');
        executeSoraAutomation(request.prompt, request.filename);
        sendResponse({status: 'automation_started', version: VERSION});
        return true;
      }
      
      if (request.action === 'checkDownloadState') {
        console.log('📋 Checking download state...');
        sendResponse({
          status: 'download_state',
          state: window.soraDownloadState,
          version: VERSION
        });
        return true;
      }
      
      if (request.action === 'forceDownload') {
        console.log('🎬 Force downloading...');
        autoDownloadVideo();
        sendResponse({status: 'force_download_started', version: VERSION});
        return true;
      }
      
      if (request.action === 'clearSavePrompt') {
        console.log('🗑️ Clearing save_prompt.json file...');
        try {
          // JsonAutomationSystem의 clearSavePrompt 메서드 호출
          if (window.jsonAutomationSystem && typeof window.jsonAutomationSystem.clearSavePrompt === 'function') {
            const result = await window.jsonAutomationSystem.clearSavePrompt();
            if (result) {
              console.log('✅ save_prompt.json 파일이 성공적으로 초기화되었습니다.');
              sendResponse({success: true, message: '파일이 초기화되었습니다.'});
            } else {
              console.error('❌ save_prompt.json 초기화 실패');
              sendResponse({success: false, error: '초기화 실패'});
            }
          } else {
            // fallback: 직접 초기화
            const emptyData = { "prompts": [] };
            
            // chrome.storage에 저장
            chrome.storage.local.set({ 'save_prompt_data': emptyData }, function() {
              if (chrome.runtime.lastError) {
                console.error('❌ save_prompt.json 초기화 실패:', chrome.runtime.lastError);
                sendResponse({success: false, error: chrome.runtime.lastError.message});
              } else {
                console.log('✅ save_prompt.json 파일이 성공적으로 초기화되었습니다.');
                
                // 추가로 localStorage에도 저장 (백업)
                try {
                  localStorage.setItem('save_prompt_data', JSON.stringify(emptyData));
                  console.log('✅ localStorage에도 초기화 데이터 저장 완료');
                } catch (localError) {
                  console.warn('⚠️ localStorage 저장 실패:', localError);
                }
                
                sendResponse({success: true, message: '파일이 초기화되었습니다.'});
              }
            });
          }
        } catch (error) {
          console.error('❌ save_prompt.json 초기화 중 오류:', error);
          sendResponse({success: false, error: error.message});
        }
        return true;
      }
      
      // 기본 응답
      console.log('❓ Unknown action:', request.action);
      sendResponse({status: 'unknown_action', version: VERSION});
      return true;
      
    } catch (error) {
      console.error('❌ Error in message listener:', error);
      sendResponse({status: 'error', error: error.message, version: VERSION});
      return true;
    }
  };
  
  // 리스너 등록
  chrome.runtime.onMessage.addListener(window.soraMessageListener);
  console.log('✅ Message listener registered');
}

// 즉시 리스너 설정
setupMessageListener();

// 초기화 완료 표시
console.log('🎉 Content script initialization complete');
console.log('📋 Ready to receive messages');

// 전역 변수로 초기화 상태 표시
window.soraAutoDownloaderInitialized = true;

// 다운로드 상태 관리
window.soraDownloadState = {
  isReady: false,
  downloadUrl: null,
  filename: null,
  timestamp: null
};

// 로컬 스토리지에서 다운로드 상태 복원
function restoreDownloadState() {
  try {
    const savedState = localStorage.getItem('soraDownloadState');
    if (savedState) {
      const state = JSON.parse(savedState);
      window.soraDownloadState = { ...window.soraDownloadState, ...state };
      console.log('📦 Restored download state:', window.soraDownloadState);
      
      if (window.soraDownloadState.isReady && window.soraDownloadState.downloadUrl) {
        console.log('🎬 Download ready, auto-downloading...');
        autoDownloadVideo();
      }
    }
  } catch (error) {
    console.error('❌ Failed to restore download state:', error);
  }
}

// 다운로드 상태 저장
function saveDownloadState() {
  try {
    localStorage.setItem('soraDownloadState', JSON.stringify(window.soraDownloadState));
    console.log('💾 Saved download state:', window.soraDownloadState);
  } catch (error) {
    console.error('❌ Failed to save download state:', error);
  }
}

// 페이지 로드 시 상태 복원
restoreDownloadState();

async function executeSoraAutomation(prompt, filename) {
  try {
    console.log('🚀 Sora 자동화 시작:', prompt);
    console.log('📝 프롬프트:', prompt);
    console.log('📁 파일명:', filename);
    console.log('🌐 현재 URL:', window.location.href);
    
    // 1. 프롬프트 입력창 찾기 (실제 Sora 페이지 구조에 맞춤)
    console.log('🔍 프롬프트 입력창 검색 중...');
    const promptInput = await waitForElement('textarea[placeholder*="Describe your video"], textarea[placeholder*="prompt"], textarea, input[type="text"]');
          if (!promptInput) {
        console.error('❌ 프롬프트 입력창을 찾을 수 없습니다.');
        console.log('🔍 현재 페이지의 textarea 요소들:', document.querySelectorAll('textarea'));
        console.log('🔍 현재 페이지의 input 요소들:', document.querySelectorAll('input[type="text"]'));
        throw new Error(`프롬프트 입력창을 찾을 수 없습니다. (v${VERSION}) 페이지가 완전히 로드되었는지 확인해주세요.`);
      }
    
    // 2. 기존 내용 지우고 새 프롬프트 입력
    promptInput.value = prompt;
    promptInput.dispatchEvent(new Event('input', { bubbles: true }));
    promptInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log('✅ 프롬프트 입력 완료');
    
    // 3. 생성 버튼 찾기 및 클릭 (실제 Sora 페이지의 "Create video" 버튼)
    console.log('🔍 생성 버튼 검색 중...');
    const generateButton = await waitForElement('button[data-disabled="false"]:not([disabled]), button:contains("Create video"), button:contains("Generate"), button[type="submit"]');
          if (!generateButton) {
        console.error('❌ 생성 버튼을 찾을 수 없습니다.');
        console.log('🔍 현재 페이지의 button 요소들:', document.querySelectorAll('button'));
        console.log('🔍 비활성화된 버튼들:', document.querySelectorAll('button[disabled]'));
        console.log('🔍 활성화된 버튼들:', document.querySelectorAll('button:not([disabled])'));
        throw new Error(`생성 버튼을 찾을 수 없습니다. (v${VERSION}) 페이지가 Sora 생성 페이지인지 확인해주세요.`);
      }
    
    generateButton.click();
    console.log('✅ 생성 버튼 클릭 완료');
    
    // 4. 비디오 생성 대기
    await waitForVideoGeneration();
    
    // 5. 비디오 다운로드
    await downloadGeneratedVideo(filename);
    
    console.log('🎉 Sora 자동화 완료!');
    
  } catch (error) {
    console.error('❌ Sora 자동화 오류:', error);
    showNotification('오류: ' + error.message, 'error');
  }
}

// 요소 대기 함수
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    console.log(`⏳ 요소 대기 시작: ${selector} (${timeout}ms)`);
    
    const checkElement = () => {
      let element;
      
      // 다양한 선택자 시도
      if (selector.includes(':contains')) {
        // 텍스트 포함 버튼 찾기
        const buttons = document.querySelectorAll('button');
        console.log(`🔍 버튼 검색 중... (${buttons.length}개 발견)`);
        element = Array.from(buttons).find(btn => {
          const text = btn.textContent.toLowerCase();
          const matches = text.includes('generate') || 
                         text.includes('create') ||
                         text.includes('submit');
          if (matches) {
            console.log(`✅ 매칭된 버튼 발견: "${btn.textContent}"`);
          }
          return matches;
        });
      } else {
        element = document.querySelector(selector);
        if (element) {
          console.log(`✅ 요소 발견: ${selector}`);
        }
      }
      
      if (element) {
        console.log(`✅ 요소 대기 완료: ${selector}`);
        resolve(element);
        return;
      }
      
      const elapsed = Date.now() - startTime;
      if (elapsed > timeout) {
        console.error(`❌ 요소 대기 시간 초과: ${selector} (${elapsed}ms)`);
        reject(new Error(`요소를 찾을 수 없습니다: ${selector} (${timeout}ms 초과)`));
        return;
      }
      
      setTimeout(checkElement, 100);
    };
    
    checkElement();
  });
}

// 비디오 생성 대기 함수
async function waitForVideoGeneration(timeout = 120000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const checkVideo = () => {
      // 비디오 요소 찾기 (video 태그, canvas 등)
      const videos = document.querySelectorAll('video, canvas, [data-testid*="video"], [class*="video"]');
      const hasGeneratedContent = Array.from(videos).some(video => {
        return (video.src && video.src.length > 0 && !video.src.includes('placeholder')) ||
               (video.currentSrc && video.currentSrc.length > 0) ||
               (video.querySelector && video.querySelector('source'));
      });
      
      // 로딩 상태 확인 (로딩 스피너나 진행률 표시가 사라졌는지)
      const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"], [class*="progress"]');
      const isLoading = Array.from(loadingElements).some(el => {
        return el.style.display !== 'none' && el.offsetParent !== null;
      });
      
      if (hasGeneratedContent && !isLoading) {
        console.log('✅ 비디오 생성 완료');
        resolve();
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error('비디오 생성 시간 초과 (2분)'));
        return;
      }
      
      setTimeout(checkVideo, 2000);
    };
    
    checkVideo();
  });
}

// 자동 다운로드 함수
async function autoDownloadVideo() {
  try {
    console.log('🎬 Auto-downloading video...');
    
    if (!window.soraDownloadState.downloadUrl) {
      throw new Error('다운로드 URL이 없습니다.');
    }
    
    // 다운로드 링크 생성
    const downloadLink = document.createElement('a');
    downloadLink.href = window.soraDownloadState.downloadUrl;
    downloadLink.download = window.soraDownloadState.filename || `sora_video_${Date.now()}.mp4`;
    downloadLink.style.display = 'none';
    
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    console.log('✅ 자동 다운로드 완료:', downloadLink.download);
    showNotification('자동 다운로드 완료!', 'success');
    
    // 다운로드 완료 후 상태 초기화
    window.soraDownloadState.isReady = false;
    window.soraDownloadState.downloadUrl = null;
    saveDownloadState();
    
  } catch (error) {
    console.error('❌ 자동 다운로드 오류:', error);
    showNotification('자동 다운로드 실패: ' + error.message, 'error');
  }
}

// 비디오 다운로드 함수 (개선된 버전)
async function downloadGeneratedVideo(filename) {
  try {
    console.log('🔍 비디오 요소 검색 중...');
    
    // 비디오 요소 찾기 (더 포괄적으로)
    const videos = document.querySelectorAll('video, canvas, [data-testid*="video"], [class*="video"], [class*="player"], [class*="media"]');
    console.log('🔍 발견된 비디오 요소들:', videos.length);
    
    const videoElement = Array.from(videos).find(video => {
      const hasSrc = video.src && video.src.length > 0 && !video.src.includes('placeholder');
      const hasCurrentSrc = video.currentSrc && video.currentSrc.length > 0;
      const hasSource = video.querySelector && video.querySelector('source');
      
      console.log('🔍 비디오 요소 체크:', { hasSrc, hasCurrentSrc, hasSource, src: video.src });
      return hasSrc || hasCurrentSrc || hasSource;
    });
    
    if (!videoElement) {
      throw new Error('다운로드할 비디오를 찾을 수 없습니다.');
    }
    
    // 파일명 생성
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultFilename = filename || `sora_video_${timestamp}`;
    
    // 비디오 URL 가져오기
    let videoUrl = videoElement.src || videoElement.currentSrc;
    
    // source 태그에서 URL 가져오기
    if (!videoUrl && videoElement.querySelector) {
      const sourceElement = videoElement.querySelector('source');
      if (sourceElement) {
        videoUrl = sourceElement.src;
      }
    }
    
    if (!videoUrl) {
      throw new Error('비디오 URL을 찾을 수 없습니다.');
    }
    
    console.log('🎬 비디오 URL 발견:', videoUrl);
    console.log('📁 파일명:', defaultFilename);
    
    // 다운로드 상태 저장
    window.soraDownloadState = {
      isReady: true,
      downloadUrl: videoUrl,
      filename: `${defaultFilename}.mp4`,
      timestamp: Date.now()
    };
    saveDownloadState();
    
    // 다운로드 링크 생성
    const downloadLink = document.createElement('a');
    downloadLink.href = videoUrl;
    downloadLink.download = `${defaultFilename}.mp4`;
    downloadLink.style.display = 'none';
    
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    console.log('✅ 비디오 다운로드 완료:', downloadLink.download);
    showNotification(`비디오 다운로드 완료!\n\n📁 파일명: ${defaultFilename}.mp4\n🔗 URL: ${videoUrl}`, 'success');
    
    // URL을 Console에 출력
    console.log('🔗 다운로드 URL:', videoUrl);
    console.log('📁 다운로드 파일명:', `${defaultFilename}.mp4`);
    
  } catch (error) {
    console.error('❌ 비디오 다운로드 오류:', error);
    showNotification('비디오 다운로드 실패: ' + error.message, 'error');
  }
}

// 알림 표시 함수
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-family: 'Segoe UI', sans-serif;
    font-weight: 600;
    z-index: 10000;
    max-width: 300px;
    word-wrap: break-word;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  
  if (type === 'success') {
    notification.style.background = 'linear-gradient(135deg, #48bb78, #38a169)';
  } else if (type === 'error') {
    notification.style.background = 'linear-gradient(135deg, #f56565, #e53e3e)';
  } else {
    notification.style.background = 'linear-gradient(135deg, #4299e1, #3182ce)';
  }
  
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // 3초 후 제거
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

// 페이지 로드 완료 시 초기화
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    console.log('🎬 Sora Auto Downloader 초기화 완료');
  });
} else {
  console.log('🎬 Sora Auto Downloader 초기화 완료');
} 