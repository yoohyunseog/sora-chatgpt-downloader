document.addEventListener('DOMContentLoaded', function() {
  const status = document.getElementById('status');
  const toggleSwitch = document.getElementById('toggleSwitch');
  const savedImages = document.getElementById('savedImages');
  const savedPrompts = document.getElementById('savedPrompts');
  const monitoredPages = document.getElementById('monitoredPages');
  const lastSaved = document.getElementById('lastSaved');
  const saveInterval = document.getElementById('saveInterval');
  const maxItems = document.getElementById('maxItems');
  const saveAllImages = document.getElementById('saveAllImages');
  const exportData = document.getElementById('exportData');
  const clearData = document.getElementById('clearData');

  // 초기 상태 로드
  loadState();
  updateStats();

  // 토글 스위치 이벤트
  toggleSwitch.addEventListener('click', function() {
    const isActive = toggleSwitch.classList.contains('active');
    
    if (isActive) {
      disableAutoSave();
    } else {
      enableAutoSave();
    }
  });

  // 설정 변경 이벤트
  saveInterval.addEventListener('change', function() {
    chrome.storage.local.set({ saveInterval: parseInt(this.value) });
    if (toggleSwitch.classList.contains('active')) {
      // 자동 저장이 활성화되어 있으면 새로운 간격으로 업데이트
      chrome.runtime.sendMessage({ action: 'updateSettings', saveInterval: parseInt(this.value) });
    }
  });

  maxItems.addEventListener('change', function() {
    chrome.storage.local.set({ maxItems: parseInt(this.value) });
  });

  // 모든 이미지 저장
  saveAllImages.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'saveAllImages' }, function(response) {
          if (chrome.runtime.lastError) {
            showMessage('현재 페이지에서 이미지 저장에 실패했습니다.', 'error');
          } else if (response && response.success) {
            showMessage(`이미지 저장 완료! ${response.data.saved}개 저장, ${response.data.skipped}개 건너뛰기`, 'success');
            updateStats(); // 통계 업데이트
          } else {
            showMessage('이미지 저장에 실패했습니다.', 'error');
          }
        });
      } else {
        showMessage('활성 탭을 찾을 수 없습니다.', 'error');
      }
    });
  });

  // 데이터 내보내기
  exportData.addEventListener('click', function() {
    // 브라우저에서 내보내기
    exportFromBrowser();
  });
  
  // 브라우저에서 데이터 내보내기 (폴백)
  function exportFromBrowser() {
    chrome.storage.local.get(['savedData', 'monitoredPages'], function(result) {
      const data = {
        metadata: {
          exportTime: new Date().toISOString(),
          totalImages: (result.savedData?.images || []).length,
          totalPrompts: (result.savedData?.prompts || []).length,
          totalPages: (result.monitoredPages || []).length,
          version: '1.0.0'
        },
        savedData: result.savedData || { images: [], prompts: [] },
        monitoredPages: result.monitoredPages || []
      };
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `auto_save_data_${timestamp}.json`;
      
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      
      chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: true
      }, function(downloadId) {
        if (chrome.runtime.lastError) {
          showMessage('다운로드에 실패했습니다.', 'error');
        } else {
          showMessage('데이터가 성공적으로 내보내졌습니다!', 'success');
          updateStats();
        }
        URL.revokeObjectURL(url);
      });
    });
  }

  // 데이터 삭제
  clearData.addEventListener('click', function() {
    if (confirm('정말로 모든 데이터를 삭제하시겠습니까?')) {
      // 브라우저에서 삭제
      clearFromBrowser();
    }
  });
  
  // 브라우저에서 데이터 삭제 (폴백)
  function clearFromBrowser() {
    chrome.storage.local.remove(['savedData', 'monitoredPages'], function() {
      updateStats();
      showMessage('브라우저 데이터가 삭제되었습니다.', 'success');
    });
  }

  // 상태 로드
  function loadState() {
    chrome.storage.local.get(['autoSaveEnabled', 'saveInterval', 'maxItems'], function(result) {
      if (result.autoSaveEnabled) {
        toggleSwitch.classList.add('active');
        status.textContent = '자동 저장: 활성화';
        status.className = 'status active';
      } else {
        toggleSwitch.classList.remove('active');
        status.textContent = '자동 저장: 비활성화';
        status.className = 'status inactive';
      }
      
      if (result.saveInterval) {
        saveInterval.value = result.saveInterval;
      }
      
      if (result.maxItems) {
        maxItems.value = result.maxItems;
      }
    });
  }

  // 통계 업데이트
  function updateStats() {
    // 브라우저 스토리지에서 통계 확인
    updateStatsFromBrowser();
  }
  
  // 브라우저 스토리지에서 통계 업데이트 (폴백)
  function updateStatsFromBrowser() {
    chrome.storage.local.get(['savedData', 'monitoredPages'], function(result) {
      const data = result.savedData || { images: [], prompts: [] };
      const pages = result.monitoredPages || [];
      
      savedImages.textContent = data.images.length;
      savedPrompts.textContent = data.prompts.length;
      monitoredPages.textContent = pages.length;
      
      if (data.lastSaved) {
        const date = new Date(data.lastSaved);
        lastSaved.textContent = date.toLocaleString('ko-KR');
      } else {
        lastSaved.textContent = '-';
      }
    });
  }

  // 자동 저장 활성화
  function enableAutoSave() {
    chrome.storage.local.set({ autoSaveEnabled: true });
    toggleSwitch.classList.add('active');
    status.textContent = '자동 저장: 활성화';
    status.className = 'status active';
    
    chrome.runtime.sendMessage({ action: 'enableAutoSave' });
    showMessage('자동 저장이 활성화되었습니다.', 'success');
  }

  // 자동 저장 비활성화
  function disableAutoSave() {
    chrome.storage.local.set({ autoSaveEnabled: false });
    toggleSwitch.classList.remove('active');
    status.textContent = '자동 저장: 비활성화';
    status.className = 'status inactive';
    
    chrome.runtime.sendMessage({ action: 'disableAutoSave' });
    showMessage('자동 저장이 비활성화되었습니다.', 'info');
  }

  // 메시지 표시
  function showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
      position: fixed;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      padding: 10px 15px;
      border-radius: 5px;
      color: white;
      font-weight: bold;
      z-index: 1000;
      font-size: 12px;
    `;
    
    switch (type) {
      case 'success':
        messageDiv.style.background = '#4CAF50';
        break;
      case 'error':
        messageDiv.style.background = '#f44336';
        break;
      case 'info':
        messageDiv.style.background = '#2196F3';
        break;
      default:
        messageDiv.style.background = '#666';
    }
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.parentNode.removeChild(messageDiv);
      }
    }, 3000);
  }

  // 주기적으로 통계 업데이트
  setInterval(updateStats, 2000);
}); 