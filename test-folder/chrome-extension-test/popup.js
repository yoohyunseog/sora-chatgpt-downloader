document.addEventListener('DOMContentLoaded', function() {
  console.log('팝업 DOM 로드 완료');

  // UI 요소 참조
  const testButton = document.getElementById('test-button');
  const extractButton = document.getElementById('extract-button');
  const statusDisplay = document.getElementById('status-display');

  // 상태 표시 함수
  function showStatus(message, type = 'info') {
    if (!statusDisplay) return;
    
    const colors = {
      'info': '#007bff',
      'success': '#28a745',
      'error': '#dc3545',
      'warning': '#ffc107',
      'loading': '#6c757d'
    };
    
    statusDisplay.textContent = message;
    statusDisplay.style.color = colors[type] || colors.info;
  }

  // 프롬프트 테스트 함수
  async function testPromptData() {
    try {
      showStatus('프롬프트 데이터 테스트 중...', 'loading');
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        showStatus('활성 탭을 찾을 수 없습니다', 'error');
        return;
      }
      
      const response = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => reject(new Error('테스트 시간 초과')), 10000);
        
        chrome.tabs.sendMessage(tab.id, { action: 'testPromptData' }, (response) => {
          clearTimeout(timeoutId);
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      
      if (response && response.success) {
        showStatus('프롬프트 데이터 테스트 완료', 'success');
        console.log('✅ 프롬프트 데이터 테스트 완료:', response);
      } else {
        showStatus(`프롬프트 데이터 테스트 실패: ${response?.error || '알 수 없는 오류'}`, 'error');
      }
    } catch (error) {
      console.error('❌ 프롬프트 테스트 오류:', error);
      showStatus(`프롬프트 테스트 오류: ${error.message}`, 'error');
    }
  }

  // 프롬프트 추출 함수
  async function extractCurrentPrompt() {
    try {
      showStatus('현재 프롬프트 추출 중...', 'loading');
      
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab) {
        showStatus('활성 탭을 찾을 수 없습니다', 'error');
        return;
      }
      
      const response = await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => reject(new Error('추출 시간 초과')), 10000);
        
        chrome.tabs.sendMessage(tab.id, { action: 'extractCurrentPrompt' }, (response) => {
          clearTimeout(timeoutId);
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
      
      if (response && response.success) {
        showStatus('프롬프트 추출 완료', 'success');
        console.log('✅ 프롬프트 추출 완료:', response);
      } else {
        showStatus(`프롬프트 추출 실패: ${response?.error || '알 수 없는 오류'}`, 'error');
      }
    } catch (error) {
      console.error('❌ 프롬프트 추출 오류:', error);
      showStatus(`프롬프트 추출 오류: ${error.message}`, 'error');
    }
  }

  // 이벤트 리스너 등록
  if (testButton) {
    testButton.addEventListener('click', testPromptData);
  }
  
  if (extractButton) {
    extractButton.addEventListener('click', extractCurrentPrompt);
  }

  // 초기 상태 설정
  showStatus('좌측 로그 오버레이에서 자동 모드를 제어하세요.', 'info');
}); 
}); 