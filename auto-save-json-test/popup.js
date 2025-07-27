// 상태 표시 함수
function showStatus(message, type = 'info') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = type;
}

// 카운트다운 관련 변수
let countdownTimer = null;
let countdownInterval = null;

// 카운트다운 표시 함수
function showCountdown(seconds) {
  const countdown = document.getElementById('countdown');
  const countdownNumber = document.getElementById('countdownNumber');
  
  countdown.classList.remove('hidden');
  countdownNumber.textContent = seconds;
}

// 카운트다운 숨기기 함수
function hideCountdown() {
  const countdown = document.getElementById('countdown');
  countdown.classList.add('hidden');
  
  if (countdownTimer) {
    clearTimeout(countdownTimer);
    countdownTimer = null;
  }
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

// 카운트다운 시작 함수
function startCountdown(seconds) {
  hideCountdown(); // 기존 타이머 정리
  
  const countdownNumber = document.getElementById('countdownNumber');
  let remainingSeconds = seconds;
  
  // 초기 표시
  showCountdown(remainingSeconds);
  
  // 1초마다 업데이트
  countdownInterval = setInterval(() => {
    remainingSeconds--;
    countdownNumber.textContent = remainingSeconds;
    
    if (remainingSeconds <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      // 저장 완료 후 새로운 카운트다운 시작
      setTimeout(() => {
        const interval = parseInt(document.getElementById('saveInterval').value);
        startCountdown(interval);
      }, 1000);
    }
  }, 1000);
}

// 통계 업데이트 함수
function updateStats() {
  chrome.storage.local.get(['savedImages', 'savedPrompts', 'lastSaveTime'], function(result) {
    const stats = document.getElementById('stats');
    const imageCount = result.savedImages ? result.savedImages.length : 0;
    const promptCount = result.savedPrompts ? result.savedPrompts.length : 0;
    const lastSave = result.lastSaveTime || '없음';
    
    stats.innerHTML = `
      📊 저장 통계
      저장된 이미지: ${imageCount}개
      저장된 프롬프트: ${promptCount}개
      마지막 저장: ${lastSave}
    `;
  });
}

// 자동 JSON 다운로드 실행 함수
function performAutoDownload() {
  chrome.storage.local.get(['savedImages', 'savedPrompts'], function(result) {
    const data = {
      metadata: {
        created_at: new Date().toISOString(),
        version: '1.0.0',
        source: 'Sora ChatGPT Auto Save Extension',
        total_images: result.savedImages ? result.savedImages.length : 0,
        total_prompts: result.savedPrompts ? result.savedPrompts.length : 0,
        auto_download: true
      },
      images: result.savedImages || [],
      prompts: result.savedPrompts || []
    };
    
    // JSON 파일 자동 다운로드
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `sora_auto_save_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('자동 JSON 다운로드 완료:', a.download);
  });
}

// 자동 저장 상태 영구 저장
function saveAutoSaveState(enabled, interval, autoDownloadEnabled) {
  const state = {
    autoSaveEnabled: enabled,
    saveInterval: interval,
    autoDownloadEnabled: autoDownloadEnabled,
    lastUpdated: new Date().toISOString()
  };
  
  chrome.storage.local.set(state, function() {
    if (chrome.runtime.lastError) {
      console.error('자동 저장 상태 저장 실패:', chrome.runtime.lastError);
    } else {
      console.log('자동 저장 상태 저장 완료:', state);
    }
  });
}

// 자동 저장 토글 처리
document.getElementById('autoSaveToggle').addEventListener('change', function() {
  const isEnabled = this.checked;
  const toggleLabel = document.getElementById('toggleLabel');
  const interval = parseInt(document.getElementById('saveInterval').value);
  const autoDownloadEnabled = document.getElementById('autoDownloadToggle').checked;
  
  if (isEnabled) {
    toggleLabel.textContent = '자동 저장 ON';
    startAutoSave();
    showStatus('✅ 자동 저장이 활성화되었습니다! (영구 저장됨)', 'success');
  } else {
    toggleLabel.textContent = '자동 저장 OFF';
    stopAutoSave();
    hideCountdown();
    showStatus('⏹️ 자동 저장이 비활성화되었습니다.', 'info');
  }
  
  // 영구 저장
  saveAutoSaveState(isEnabled, interval, autoDownloadEnabled);
});

// 자동 JSON 다운로드 토글 처리
document.getElementById('autoDownloadToggle').addEventListener('change', function() {
  const isEnabled = this.checked;
  const autoDownloadLabel = document.getElementById('autoDownloadLabel');
  const autoSaveEnabled = document.getElementById('autoSaveToggle').checked;
  const interval = parseInt(document.getElementById('saveInterval').value);
  
  if (isEnabled) {
    autoDownloadLabel.textContent = '자동 다운로드 ON';
    showStatus('✅ 자동 JSON 다운로드가 활성화되었습니다! (영구 저장됨)', 'success');
  } else {
    autoDownloadLabel.textContent = '자동 다운로드 OFF';
    showStatus('⏹️ 자동 JSON 다운로드가 비활성화되었습니다.', 'info');
  }
  
  // 영구 저장
  saveAutoSaveState(autoSaveEnabled, interval, isEnabled);
});

// 자동 저장 시작
function startAutoSave() {
  const interval = document.getElementById('saveInterval').value * 1000; // 초를 밀리초로 변환
  
  // 백그라운드에 자동 저장 시작 메시지 전송
  chrome.runtime.sendMessage({
    action: 'startAutoSave',
    interval: interval
  });
  
  // 카운트다운 시작
  startCountdown(parseInt(document.getElementById('saveInterval').value));
  
  console.log(`자동 저장 시작: ${interval/1000}초 간격 (영구 저장됨)`);
}

// 자동 저장 중지
function stopAutoSave() {
  chrome.runtime.sendMessage({
    action: 'stopAutoSave'
  });
  
  hideCountdown();
  console.log('자동 저장 중지');
}

// 수동 저장 버튼
document.getElementById('manualSaveBtn').addEventListener('click', function() {
  chrome.runtime.sendMessage({
    action: 'manualSave'
  });
  
  showStatus('📸 수동 저장을 시작합니다...', 'info');
});

// JSON 다운로드 버튼
document.getElementById('downloadBtn').addEventListener('click', function() {
  chrome.storage.local.get(['savedImages', 'savedPrompts'], function(result) {
    const data = {
      metadata: {
        created_at: new Date().toISOString(),
        version: '1.0.0',
        source: 'Sora ChatGPT Auto Save Extension',
        total_images: result.savedImages ? result.savedImages.length : 0,
        total_prompts: result.savedPrompts ? result.savedPrompts.length : 0
      },
      images: result.savedImages || [],
      prompts: result.savedPrompts || []
    };
    
    // JSON 파일 다운로드
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `sora_auto_save_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatus('✅ JSON 파일이 다운로드되었습니다!', 'success');
  });
});

// 데이터 초기화 버튼
document.getElementById('clearDataBtn').addEventListener('click', function() {
  if (confirm('저장된 모든 데이터를 삭제하시겠습니까?')) {
    chrome.storage.local.clear(function() {
      updateStats();
      showStatus('🗑️ 모든 데이터가 초기화되었습니다.', 'success');
    });
  }
});

// 저장 간격 변경 처리
document.getElementById('saveInterval').addEventListener('change', function() {
  const interval = this.value;
  const autoSaveEnabled = document.getElementById('autoSaveToggle').checked;
  const autoDownloadEnabled = document.getElementById('autoDownloadToggle').checked;
  
  // 자동 저장이 활성화된 상태라면 새로운 간격으로 재시작
  if (autoSaveEnabled) {
    stopAutoSave();
    setTimeout(() => startAutoSave(), 100);
  }
  
  // 영구 저장
  saveAutoSaveState(autoSaveEnabled, interval, autoDownloadEnabled);
  
  showStatus(`⏰ 저장 간격이 ${interval}초로 변경되었습니다. (영구 저장됨)`, 'info');
});

// 페이지 로드 시 초기화 및 상태 복원
document.addEventListener('DOMContentLoaded', function() {
  console.log('팝업 페이지 로드 - 상태 복원 시작');
  
  // 저장된 설정 불러오기
  chrome.storage.local.get(['autoSaveEnabled', 'saveInterval', 'autoDownloadEnabled'], function(result) {
    const toggle = document.getElementById('autoSaveToggle');
    const autoDownloadToggle = document.getElementById('autoDownloadToggle');
    const intervalInput = document.getElementById('saveInterval');
    const toggleLabel = document.getElementById('toggleLabel');
    const autoDownloadLabel = document.getElementById('autoDownloadLabel');
    
    // 저장 간격 설정
    if (result.saveInterval) {
      intervalInput.value = result.saveInterval;
    }
    
    // 자동 다운로드 상태 복원
    if (result.autoDownloadEnabled) {
      autoDownloadToggle.checked = true;
      autoDownloadLabel.textContent = '자동 다운로드 ON';
    } else {
      autoDownloadToggle.checked = false;
      autoDownloadLabel.textContent = '자동 다운로드 OFF';
    }
    
    // 자동 저장 상태 복원
    if (result.autoSaveEnabled) {
      toggle.checked = true;
      toggleLabel.textContent = '자동 저장 ON';
      
      // 자동 저장 시작
      setTimeout(() => {
        startAutoSave();
        console.log('자동 저장 상태 복원 완료');
      }, 500);
    } else {
      toggle.checked = false;
      toggleLabel.textContent = '자동 저장 OFF';
    }
    
    console.log('설정 복원 완료:', {
      autoSaveEnabled: result.autoSaveEnabled,
      saveInterval: result.saveInterval,
      autoDownloadEnabled: result.autoDownloadEnabled
    });
  });
  
  // 통계 업데이트
  updateStats();
  
  // 상태 메시지
  showStatus('🎨 Sora ChatGPT 자동 저장 확장 프로그램이 준비되었습니다!', 'info');
});

// 메시지 리스너 (백그라운드에서 오는 메시지 처리)
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'saveComplete') {
    updateStats();
    showStatus(`✅ 저장 완료! 이미지: ${request.imageCount}개, 프롬프트: ${request.promptCount}개`, 'success');
    
    // 자동 JSON 다운로드 실행
    const autoDownloadEnabled = document.getElementById('autoDownloadToggle').checked;
    if (autoDownloadEnabled) {
      setTimeout(() => {
        performAutoDownload();
        showStatus('📥 자동 JSON 다운로드 완료!', 'success');
      }, 1000);
    }
    
    // 자동 저장이 활성화된 상태라면 카운트다운 재시작
    chrome.storage.local.get(['autoSaveEnabled'], function(result) {
      if (result.autoSaveEnabled) {
        const interval = parseInt(document.getElementById('saveInterval').value);
        startCountdown(interval);
      }
    });
  } else if (request.action === 'saveError') {
    showStatus(`❌ 저장 실패: ${request.error}`, 'error');
  } else if (request.action === 'pageNotMatch') {
    showStatus('⚠️ Sora ChatGPT 라이브러리 페이지가 아닙니다.', 'warning');
  }
}); 