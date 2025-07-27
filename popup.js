// 버전 정보
const VERSION = '2.2.0';
console.log(`🖼️ Sora Auto Image Downloader v${VERSION} loaded`);

// 셀레니움 서버 연결 설정
const SELENIUM_SERVER_URL = 'http://localhost:5000';

// JSON 자동화 시스템 (content script와 통신)
let jsonAutomation = null;

// 셀레니움으로 데이터 전송하는 함수
async function sendToSelenium(data) {
  try {
    console.log('🔗 셀레니움 서버로 데이터 전송 중...', data);
    
    const response = await fetch(`${SELENIUM_SERVER_URL}/receive-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ 셀레니움 서버 응답:', result);
      return result;
    } else {
      console.error('❌ 셀레니움 서버 오류:', response.status);
      return null;
    }
  } catch (error) {
    console.error('❌ 셀레니움 서버 연결 실패:', error);
    return null;
  }
}

// 문자열 유사도 계산 함수 (Levenshtein 거리 기반)
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  
  // 대소문자 구분 없이 비교
  const normalizedStr1 = str1.toLowerCase().trim();
  const normalizedStr2 = str2.toLowerCase().trim();
  
  // 완전히 동일한 경우
  if (normalizedStr1 === normalizedStr2) return 1.0;
  
  // 한 문자열이 다른 문자열에 포함되는 경우 (부분 일치)
  if (normalizedStr1.includes(normalizedStr2) || normalizedStr2.includes(normalizedStr1)) {
    const longer = normalizedStr1.length > normalizedStr2.length ? normalizedStr1 : normalizedStr2;
    const shorter = normalizedStr1.length > normalizedStr2.length ? normalizedStr2 : normalizedStr1;
    return shorter.length / longer.length;
  }
  
  const longer = normalizedStr1.length > normalizedStr2.length ? normalizedStr1 : normalizedStr2;
  const shorter = normalizedStr1.length > normalizedStr2.length ? normalizedStr2 : normalizedStr1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

// Levenshtein 거리 계산 함수
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

// 상태 표시 함수
function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('status');
  if (statusDiv) {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
  }
  console.log(`📢 Status: ${message} (${type})`);
}

// 진행 상황 표시 함수
function showProgress() {
  const progressSection = document.getElementById('progressSection');
  if (progressSection) {
    progressSection.style.display = 'block';
  }
}

// 진행률 업데이트 함수
function updateProgress(currentStep, totalSteps, hasError = false) {
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  
  if (progressFill && progressText) {
    const percentage = (currentStep / totalSteps) * 100;
    progressFill.style.width = `${percentage}%`;
    
    if (hasError) {
      progressFill.style.background = 'linear-gradient(90deg, #f56565, #e53e3e)';
      progressFill.classList.add('error');
      progressText.textContent = `${currentStep} / ${totalSteps} 단계 완료 (오류 발생)`;
      progressText.style.color = '#f56565';
      progressText.classList.add('progress-text-error');
    } else {
      progressFill.style.background = 'linear-gradient(90deg, #48bb78, #38a169)';
      progressFill.classList.remove('error');
      progressText.textContent = `${currentStep} / ${totalSteps} 단계 완료`;
      progressText.style.color = '#e2e8f0';
      progressText.classList.remove('progress-text-error');
    }
  }
}

// 진행률 메시지 업데이트 함수
function updateProgressWithMessage(currentStep, totalSteps, progress, message) {
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  
  if (progressFill && progressText) {
    // 진행률 바는 단계 기반으로 설정
    const stepPercentage = (currentStep / totalSteps) * 100;
    progressFill.style.width = `${stepPercentage}%`;
    
    // 진행률 바 색상을 진행률에 따라 변경
    if (progress < 30) {
      progressFill.style.background = 'linear-gradient(90deg, #f6ad55, #ed8936)'; // 주황색
    } else if (progress < 70) {
      progressFill.style.background = 'linear-gradient(90deg, #f6e05e, #d69e2e)'; // 노란색
    } else {
      progressFill.style.background = 'linear-gradient(90deg, #68d391, #48bb78)'; // 초록색
    }
    
    progressFill.classList.remove('error');
    progressText.textContent = message;
    progressText.style.color = '#e2e8f0';
    progressText.classList.remove('progress-text-error');
  }
}

// 로그 표시 함수
function displayLogs(logs) {
  const logsContainer = document.getElementById('logsContainer');
  if (logsContainer) {
    logsContainer.innerHTML = '';
    
    if (logs && logs.length > 0) {
      logs.forEach(log => {
        const logItem = document.createElement('div');
        logItem.className = 'log-item';
        
        if (log.includes('❌')) {
          logItem.classList.add('log-error');
        }
        
        logItem.textContent = log;
        logsContainer.appendChild(logItem);
      });
      
      logsContainer.scrollTop = logsContainer.scrollHeight;
    }
  }
}

// 자동화 로그 표시 함수
function displayAutomationLogs(logs) {
  const automationLogsContainer = document.getElementById('automationLogsContainer');
  const automationLogSection = document.getElementById('automationLogSection');
  
  if (automationLogsContainer && automationLogSection) {
    // 자동화 로그 섹션 표시
    automationLogSection.style.display = 'block';
    
    automationLogsContainer.innerHTML = '';
    
    if (logs && logs.length > 0) {
      // 로그 개수 표시 업데이트
      const logCount = logs.length;
      const logTitle = document.querySelector('#automationLogSection h3');
      if (logTitle) {
        logTitle.textContent = `🤖 자동화 로그 (${logCount}개)`;
      }
      
      logs.forEach(log => {
        const logItem = document.createElement('div');
        logItem.className = 'automation-log-item';
        logItem.style.padding = '4px 0';
        logItem.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
        
        if (log.includes('❌')) {
          logItem.style.color = '#f56565';
        } else if (log.includes('✅')) {
          logItem.style.color = '#48bb78';
        } else {
          logItem.style.color = '#4299e1';
        }
        
        logItem.textContent = log;
        automationLogsContainer.appendChild(logItem);
      });
      
      // 스크롤을 맨 아래로
      automationLogsContainer.scrollTop = automationLogsContainer.scrollHeight;
    } else {
      // 로그 개수 표시 업데이트
      const logTitle = document.querySelector('#automationLogSection h3');
      if (logTitle) {
        logTitle.textContent = '🤖 자동화 로그 (0개)';
      }
      
      const logItem = document.createElement('div');
      logItem.className = 'automation-log-item';
      logItem.style.padding = '4px 0';
      logItem.style.color = '#a0aec0';
      logItem.textContent = '🤖 자동화 로그가 없습니다.';
      automationLogsContainer.appendChild(logItem);
    }
  }
}

// localStorage에서 로그 로드
function loadLogsFromStorage() {
  try {
    const savedLogs = localStorage.getItem('soraImageLogs');
    if (savedLogs) {
      const logs = JSON.parse(savedLogs);
      displayLogs(logs);
      
      const savedProgress = localStorage.getItem('soraImageProgress');
      if (savedProgress) {
        const progress = JSON.parse(savedProgress);
        const hasError = logs.some(log => log.includes('❌'));
        
        // 저장된 진행 상황에서 총 단계 수 결정
        let totalSteps = 16; // 기본값
        
        // 로그를 분석하여 모드 결정
        const isAutoExtractMode = logs.some(log => log.includes('자동 추출 모드'));
        
        if (isAutoExtractMode) {
          totalSteps = 4; // 자동 추출 모드
        }
        
        updateProgress(progress.currentStep, totalSteps, hasError);
        showProgress();
      }
    }
  } catch (error) {
    console.error('❌ 로그 로드 실패:', error);
  }
}

// 오류 상태 확인 함수
function checkForErrors(logs) {
  return logs.some(log => log.includes('❌'));
}

// 테이블 표시 함수
function showTable() {
  console.log('🔄 테이블 표시 함수 실행...');
  const tableSection = document.getElementById('tableSection');
  if (tableSection) {
    tableSection.style.display = 'block';
    console.log('✅ 테이블 섹션이 표시되었습니다.');
  } else {
    console.error('❌ 테이블 섹션을 찾을 수 없습니다!');
  }
}

// 테이블 업데이트 함수
function updateTable(results) {
  console.log('🔄 테이블 업데이트 시작...');
  console.log('📊 받은 결과 개수:', results.length);
  
  const tableBody = document.getElementById('tableBody');
  const imageUrlsList = document.getElementById('imageUrlsList');
  
  if (!tableBody || !imageUrlsList) {
    console.error('❌ 테이블 요소를 찾을 수 없음!');
    return;
  }
  
  // 테이블 내용 초기화
  tableBody.innerHTML = '';
  console.log('✅ 테이블 내용 초기화 완료');
  
  // 이미지 URL 목록 초기화
  imageUrlsList.innerHTML = '';
  console.log('✅ 이미지 URL 목록 초기화 완료');
  
  // 결과를 테이블에 추가
  results.forEach((result, index) => {
    console.log(`📝 결과 ${index + 1} 처리 중: "${result.title}" - URL: ${result.imageUrl ? '있음' : '없음'}`);
    const row = document.createElement('tr');
    row.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
    
    // 상태 아이콘 (모니터링 중인 이미지가 완료된 경우만 🎨 생성 완료로 표시)
    let statusIcon;
    let displayStatus = result.status;
    
    if (result.status === '완료') {
      // 모니터링 중인 이미지가 완료된 경우 (새로운 클래스 사용)
      if (window.imageMonitoringStatus && window.imageMonitoringStatus.isCurrentlyMonitoring(result.title)) {
        statusIcon = '🎨';
        displayStatus = '생성 완료';
      } else {
        // 이미 완료된 다른 이미지들
        statusIcon = '✅';
        displayStatus = '완료';
      }
    } else if (result.status === '정책 위반') {
      statusIcon = '❌';
    } else if (result.status === '진행 중') {
      statusIcon = '⏳';
    } else {
      statusIcon = '❓';
    }
    
    // 제목을 15글자로 제한
            const shortTitle = result.title && result.title.length > 15 ? result.title.substring(0, 15) + '...' : result.title || '제목 없음';
    
    row.innerHTML = `
      <td style="padding: 2px; border: 1px solid rgba(255, 255, 255, 0.2); text-align: center; font-size: 7px;">${result.index}</td>
      <td style="padding: 2px; border: 1px solid rgba(255, 255, 255, 0.2); text-align: center; font-size: 7px;" title="${result.title}">${shortTitle}</td>
      <td style="padding: 2px; border: 1px solid rgba(255, 255, 255, 0.2); text-align: center; font-size: 7px;">${statusIcon} ${displayStatus}</td>
      <td style="padding: 2px; border: 1px solid rgba(255, 255, 255, 0.2); text-align: center; font-size: 7px;">${result.time}</td>
    `;
    
    tableBody.appendChild(row);
    console.log(`✅ 테이블 행 추가 완료: ${result.title}`);
    
    // 이미지 URL이 있으면 목록에 추가
    if (result.imageUrl) {
              console.log(`✅ URL 추가: "${result.title}" - ${result.imageUrl ? result.imageUrl.substring(0, 50) + '...' : 'undefined'}`);
      
      const urlDiv = document.createElement('div');
      urlDiv.style.marginBottom = '6px';
      urlDiv.style.padding = '4px';
      urlDiv.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
      urlDiv.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
      urlDiv.style.borderRadius = '4px';
      
      // URL 타입 확인
      const isImageUrl = result.imageUrl.includes('openai.com') && (result.imageUrl.includes('.webp') || result.imageUrl.includes('.jpg') || result.imageUrl.includes('.png'));
      const urlType = isImageUrl ? '🖼️ 이미지 URL' : '🔗 링크 URL';
      
      urlDiv.innerHTML = `
        <div style="font-weight: bold; color: #48bb78; margin-bottom: 3px; font-size: 10px;">${result.title} (${urlType})</div>
        <div style="word-break: break-all; color: #e2e8f0; font-size: 8px; line-height: 1.2;">${result.imageUrl}</div>
      `;
      imageUrlsList.appendChild(urlDiv);
      console.log(`✅ URL div 추가 완료: ${result.title}`);
    } else {
      // URL이 없는 경우 표시
      console.log(`❌ URL 없음: "${result.title}"`);
      
      const noUrlDiv = document.createElement('div');
      noUrlDiv.style.marginBottom = '6px';
      noUrlDiv.style.padding = '4px';
      noUrlDiv.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
      noUrlDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
      noUrlDiv.style.borderRadius = '4px';
      
      noUrlDiv.innerHTML = `
        <div style="font-weight: bold; color: #f56565; margin-bottom: 3px; font-size: 10px;">${result.title} (❌ URL 없음)</div>
        <div style="color: #e2e8f0; font-size: 8px;">이미지 URL을 찾을 수 없습니다.</div>
      `;
      imageUrlsList.appendChild(noUrlDiv);
      console.log(`❌ URL 없음 div 추가 완료: ${result.title}`);
    }
  });
  
  console.log('✅ 테이블 업데이트 완료!');
}

// 완료된 이미지 URL 자동 입력 함수
function updateCompletedUrl(results) {
  console.log('🔍 완료된 이미지 URL 확인 중...');
  
  // 현재 입력된 프롬프트 가져오기
  const promptInput = document.getElementById('promptInput');
  const currentInputPrompt = promptInput ? promptInput.value.trim() : '';
  
  console.log('📝 현재 입력 프롬프트:', currentInputPrompt);
  
  // 진행 중인 이미지 확인
  const inProgressImages = results.filter(result => 
    result.status === '진행 중'
  );
  
  if (inProgressImages.length > 0) {
    const latestInProgress = inProgressImages.sort((a, b) => b.index - a.index)[0];
    console.log('⏳ 진행 중인 이미지 발견:', latestInProgress.title);
    setUrlStatus(`⏳ 진행 중: ${latestInProgress.title}`);
    
    // 진행 중인 이미지 모니터링 시작
    startProgressMonitoring(latestInProgress);
  }
  
  // 진행 중이었다가 완료된 이미지만 찾기 (모니터링 중인 이미지)
  if (window.monitoredImageTitle) {
    const monitoredCompletedImage = results.find(result => 
      result.title === window.monitoredImageTitle && 
      result.status === '완료' && 
      result.imageUrl
    );
    
    if (monitoredCompletedImage) {
      console.log('✅ 모니터링 중인 이미지가 완료되었습니다:', monitoredCompletedImage.title);
      
      // 모니터링 정보 가져오기
      const monitoringInfo = window.imageMonitoringStatus.getMonitoringInfo();
      if (monitoringInfo) {
        console.log(`🎨 [${monitoringInfo.id}] 생성 완료: "${monitoringInfo.title}" (${monitoringInfo.duration}초 소요)`);
        
        // 생성 완료 로그 저장
        const generationCompleteLog = `[${new Date().toLocaleString('ko-KR')}] 🎨 [${monitoringInfo.id}] 생성 완료: "${monitoringInfo.title}" (${monitoringInfo.duration}초 소요)`;
        saveLogToStorage(generationCompleteLog);
      }
      
      setCompletedUrl(monitoredCompletedImage.imageUrl, monitoredCompletedImage.title);
      
      // 셀레니움으로 완료된 이미지 데이터 전송
      const seleniumData = {
        type: 'image_completed',
        title: monitoredCompletedImage.title,
        imageUrl: monitoredCompletedImage.imageUrl,
        prompt: monitoredCompletedImage.prompt,
        timestamp: new Date().toISOString(),
        monitoringId: monitoringInfo ? monitoringInfo.id : null
      };
      
      sendToSelenium(seleniumData);
      
      // 모니터링 완료 후 초기화
      window.imageMonitoringStatus.stopMonitoring();
      window.monitoredImageTitle = null;
      return;
    }
  }
  
  // 유사도 기반 완료된 이미지 찾기 (90% 이상 유사한 프롬프트)
  if (currentInputPrompt) {
    console.log('🔍 유사도 기반 완료된 이미지 검색 중...');
    
    const completedImages = results.filter(result => 
      result.status === '완료' && 
      result.imageUrl && 
      result.prompt
    );
    
    let bestMatch = null;
    let bestSimilarity = 0;
    
    completedImages.forEach(result => {
      const similarity = calculateSimilarity(currentInputPrompt, result.prompt);
      console.log(`📊 유사도 비교: "${currentInputPrompt}" vs "${result.prompt}" = ${(similarity * 100).toFixed(1)}%`);
      
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = result;
      }
    });
    
    if (bestMatch && bestSimilarity >= 0.9) { // 90% 이상 유사
      console.log(`🎯 유사도 ${(bestSimilarity * 100).toFixed(1)}%로 매칭된 이미지 발견:`, bestMatch.title);
      
      // 유사도 매칭 로그 저장
      const similarityMatchLog = `[${new Date().toLocaleString('ko-KR')}] 🎯 유사도 ${(bestSimilarity * 100).toFixed(1)}% 매칭: "${currentInputPrompt}" → "${bestMatch.title}"`;
      saveLogToStorage(similarityMatchLog);
      
      setCompletedUrl(bestMatch.imageUrl, bestMatch.title);
      setUrlStatus(`🎯 유사도 ${(bestSimilarity * 100).toFixed(1)}% 매칭: ${bestMatch.title}`);
      
      // 셀레니움으로 유사도 매칭된 이미지 데이터 전송
      const seleniumData = {
        type: 'similarity_matched',
        title: bestMatch.title,
        imageUrl: bestMatch.imageUrl,
        prompt: bestMatch.prompt,
        inputPrompt: currentInputPrompt,
        similarity: bestSimilarity,
        timestamp: new Date().toISOString()
      };
      
      sendToSelenium(seleniumData);
      return;
    } else if (bestMatch) {
      console.log(`⚠️ 최고 유사도 ${(bestSimilarity * 100).toFixed(1)}%로 90% 미만:`, bestMatch.title);
    } else {
      console.log('❌ 완료된 이미지가 없거나 프롬프트가 없습니다.');
    }
  }
  
  // 모니터링 중인 이미지가 없으면 URL 입력란을 비움 (다른 완료된 이미지들은 입력하지 않음)
  if (inProgressImages.length === 0) {
    console.log('⏳ 모니터링 중인 이미지가 없습니다. URL 입력란을 비웁니다.');
    setUrlStatus('대기 중... (모니터링 중인 이미지 없음)');
    // URL 입력란을 비우지 않고 상태만 업데이트
  }
}

// 진행 중인 이미지 모니터링 함수
let progressMonitoringInterval = null;

// 모니터링 상태 클래스
class ImageMonitoringStatus {
  constructor() {
    this.isMonitoring = false;
    this.monitoredTitle = null;
    this.startTime = null;
    this.monitoringId = null;
  }
  
  startMonitoring(title) {
    this.isMonitoring = true;
    this.monitoredTitle = title;
    this.startTime = new Date();
    this.monitoringId = 'MON_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    console.log(`🔍 [${this.monitoringId}] 모니터링 시작: "${title}"`);
    console.log(`📝 [${this.monitoringId}] 모니터링 시작 시간: ${this.startTime.toLocaleString('ko-KR')}`);
    
    // 모니터링 시작 로그 저장
    const monitoringStartLog = `[${new Date().toLocaleString('ko-KR')}] 🔍 [${this.monitoringId}] 모니터링 시작: "${title}"`;
    saveLogToStorage(monitoringStartLog);
  }
  
  stopMonitoring() {
    if (this.isMonitoring) {
      const endTime = new Date();
      const duration = Math.floor((endTime - this.startTime) / 1000);
      
      console.log(`🛑 [${this.monitoringId}] 모니터링 종료: "${this.monitoredTitle}" (${duration}초 소요)`);
      
      // 모니터링 종료 로그 저장
      const monitoringEndLog = `[${new Date().toLocaleString('ko-KR')}] 🛑 [${this.monitoringId}] 모니터링 종료: "${this.monitoredTitle}" (${duration}초 소요)`;
      saveLogToStorage(monitoringEndLog);
      
      this.isMonitoring = false;
      this.monitoredTitle = null;
      this.startTime = null;
      this.monitoringId = null;
    }
  }
  
  isCurrentlyMonitoring(title) {
    return this.isMonitoring && this.monitoredTitle === title;
  }
  
  getMonitoringInfo() {
    if (this.isMonitoring) {
      const currentTime = new Date();
      const duration = Math.floor((currentTime - this.startTime) / 1000);
      return {
        id: this.monitoringId,
        title: this.monitoredTitle,
        duration: duration,
        startTime: this.startTime
      };
    }
    return null;
  }
}

// 전역 모니터링 상태 인스턴스
window.imageMonitoringStatus = new ImageMonitoringStatus();

function startProgressMonitoring(inProgressImage) {
  console.log('🔍 진행 중인 이미지 모니터링 시작:', inProgressImage.title);
  
  // 모니터링 상태 시작
  window.imageMonitoringStatus.startMonitoring(inProgressImage.title);
  
  // 모니터링할 이미지 제목 저장 (기존 호환성 유지)
  window.monitoredImageTitle = inProgressImage.title;
  console.log('📝 모니터링 대상 이미지 저장:', window.monitoredImageTitle);
  
  // 기존 모니터링 중지
  if (progressMonitoringInterval) {
    clearInterval(progressMonitoringInterval);
  }
  
  // 5초마다 진행 상황 확인
  progressMonitoringInterval = setInterval(async () => {
    try {
      console.log('🔍 진행 중인 이미지 상태 확인 중...');
      
      // 현재 활성 탭에서 이미지 결과 다시 추출
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const updatedResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          // extractImageResults 함수를 직접 실행
          const results = [];
          
          // 모든 이미지 컨테이너 검색 (헤더 제외)
          const imageContainers = document.querySelectorAll('[data-index]:not([data-index="0"])');
          
          imageContainers.forEach((container, containerIndex) => {
            try {
              const index = container.getAttribute('data-index');
              if (!index || index === '0') return;
              
              // 제목 추출
              const titleElement = container.querySelector('a[href*="/g/"], a[href*="/t/"]');
              const title = titleElement ? titleElement.textContent.trim() : '제목 없음';
              
              // 프롬프트 추출
              const promptElement = container.querySelector('.truncate.text-token-text-primary');
              const prompt = promptElement ? promptElement.textContent.trim() : '프롬프트 없음';
              
              // 시간 추출
              const timeElement = container.querySelector('div:last-child');
              const time = timeElement ? timeElement.textContent.trim() : '';
              
              // 이미지 URL 추출
              let imageUrl = null;
              const imgElement = container.querySelector('img[src*="openai.com"], img[src*="videos.openai.com"]');
              if (imgElement && imgElement.src) {
                imageUrl = imgElement.src;
              }
              
              // 상태 확인
              let status = '완료';
              let statusColor = 'green';
              
              // 진행 중 확인
              const progressElement = container.querySelector('.absolute.left-1\\/2.top-1\\/2.-translate-x-1\\/2.-translate-y-1\\/2.text-token-text-secondary');
              if (progressElement && progressElement.textContent.includes('%')) {
                status = '진행 중';
                statusColor = 'blue';
              }
              
              results.push({
                index: parseInt(index),
                title: title,
                prompt: prompt ? prompt.substring(0, 100) + (prompt.length > 100 ? '...' : '') : 'undefined',
                time: time,
                status: status,
                statusColor: statusColor,
                imageUrl: imageUrl,
                linkUrl: titleElement ? titleElement.href : null
              });
              
            } catch (error) {
              console.error('이미지 결과 추출 오류:', error);
            }
          });
          
          return results.sort((a, b) => a.index - b.index);
        }
      });
      
      if (updatedResults && updatedResults[0] && updatedResults[0].result) {
        const results = updatedResults[0].result;
        
        // 모니터링 중인 이미지의 상태 확인
        const targetImage = results.find(result => result.title === window.monitoredImageTitle);
        
        if (targetImage) {
          if (targetImage.status === '완료' && targetImage.imageUrl) {
            console.log('🎉 모니터링 중인 이미지가 완료되었습니다!');
            console.log('✅ 완료된 URL:', targetImage.imageUrl);
            
            // 모니터링 중지
            clearInterval(progressMonitoringInterval);
            progressMonitoringInterval = null;
            
            // 완료된 URL 설정 (모니터링 중인 이미지만)
            setCompletedUrl(targetImage.imageUrl, targetImage.title);
            
            // 모니터링 대상 초기화
            window.monitoredImageTitle = null;
            
            // 테이블 업데이트
            updateTable(results);
            
          } else if (targetImage.status === '진행 중') {
            console.log('⏳ 모니터링 중인 이미지가 아직 진행 중입니다...');
            setUrlStatus(`⏳ 진행 중: ${targetImage.title} (모니터링 중)`);
          }
        } else {
          console.log('⚠️ 모니터링 중인 이미지를 찾을 수 없습니다:', window.monitoredImageTitle);
        }
      }
      
    } catch (error) {
      console.error('진행 중인 이미지 모니터링 오류:', error);
    }
  }, 5000); // 5초마다 확인
}

// 완료된 URL 설정 함수
function setCompletedUrl(url, title) {
  const urlInput = document.getElementById('completedUrlInput');
  const urlStatus = document.getElementById('urlStatus');
  
  if (urlInput && urlStatus) {
    urlInput.value = url;
    urlStatus.textContent = `🎨 생성 완료: ${title}`;
    urlStatus.style.color = '#48bb78';
    
            console.log('✅ 완료된 URL 입력됨:', url ? url.substring(0, 50) + '...' : 'undefined');
    
    // URL 입력란을 녹색으로 강조
    urlInput.style.backgroundColor = 'rgba(72, 187, 120, 0.2)';
    urlInput.style.border = '2px solid #48bb78';
    
    // 3초 후 원래 스타일로 복원
    setTimeout(() => {
      urlInput.style.backgroundColor = '';
      urlInput.style.border = '';
    }, 3000);
  }
}

// URL 상태 설정 함수
function setUrlStatus(status) {
  const urlStatus = document.getElementById('urlStatus');
  if (urlStatus) {
    urlStatus.textContent = status;
    if (status.includes('완료')) {
      urlStatus.style.color = '#48bb78';
    } else if (status.includes('대기')) {
      urlStatus.style.color = '#e2e8f0';
    } else if (status.includes('진행 중')) {
      urlStatus.style.color = '#4299e1';
    } else {
      urlStatus.style.color = '#f56565';
    }
  }
}

// 모니터링 중지 함수
function stopProgressMonitoring() {
  if (progressMonitoringInterval) {
    clearInterval(progressMonitoringInterval);
    progressMonitoringInterval = null;
    console.log('🛑 진행 중인 이미지 모니터링 중지됨');
  }
  
  // 모니터링 상태 중지
  window.imageMonitoringStatus.stopMonitoring();
  
  // 모니터링 대상 이미지 초기화 (기존 호환성 유지)
  if (window.monitoredImageTitle) {
    console.log('🛑 모니터링 대상 이미지 초기화:', window.monitoredImageTitle);
    window.monitoredImageTitle = null;
  }
}

// URL 입력란 초기화 함수
function resetUrlInput() {
  const urlInput = document.getElementById('completedUrlInput');
  const urlStatus = document.getElementById('urlStatus');
  
  if (urlInput && urlStatus) {
    // URL 입력란 초기화
    urlInput.value = '';
    urlInput.placeholder = '진행 중인 이미지가 완료되면 자동으로 입력됩니다';
    
    // 상태 초기화
    urlStatus.textContent = '대기 중...';
    urlStatus.style.color = '#e2e8f0';
    
    // 스타일 초기화
    urlInput.style.backgroundColor = '';
    urlInput.style.border = '';
    
    console.log('🔄 URL 입력란 초기화 완료');
  }
}

// JSON 자동화 시스템 초기화
function initializeJsonAutomation() {
  console.log('✅ JSON 자동화 시스템 초기화 완료');
}

// 토글 버튼 이벤트 처리 (수동 단계 사용)
function setupToggleButton() {
  const toggleSwitch = document.getElementById('autoToggle');
  const autoStatus = document.getElementById('autoStatus');
  const promptInput = document.getElementById('promptInput');
  const generateBtn = document.getElementById('generateBtn');
  
  if (toggleSwitch) {
    toggleSwitch.addEventListener('click', () => {
      console.log('🔄 토글 버튼 클릭됨');
      
      // JSON 자동화 시스템 초기화
      initializeJsonAutomation();
      
      // content script와 통신하여 토글 상태 변경
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs[0]) {
          try {
            const result = await chrome.scripting.executeScript({
              target: { tabId: tabs[0].id },
              func: () => {
                // content script에서 JsonAutomationSystem 토글
                if (window.jsonAutomation) {
                  window.jsonAutomation.toggle();
                  return window.jsonAutomation.getStatus();
                } else {
                  return { isRunning: false, error: 'JsonAutomationSystem not found' };
                }
              }
            });
            
            const status = result[0]?.result || { isRunning: false };
            const isRunning = status.isRunning;
            
            if (isRunning) {
              toggleSwitch.classList.add('active');
              
                  // 자동화 로그 섹션 표시
    const automationLogSection = document.getElementById('automationLogSection');
    if (automationLogSection) {
      automationLogSection.style.display = 'block';
    }
    
                   // UI 업데이트
               updateAutomationUI(true);
              
            } else {
              toggleSwitch.classList.remove('active');
              
              // 자동화 로그 섹션 숨김
              const automationLogSection = document.getElementById('automationLogSection');
              if (automationLogSection) {
                automationLogSection.style.display = 'none';
              }
              
              // UI 업데이트
              updateAutomationUI(false);
            }
          } catch (error) {
            console.error('❌ 토글 버튼 오류:', error);
            autoStatus.className = 'auto-status off';
            autoStatus.textContent = '❌ 오류 발생';
          }
        }
      });
    });
    
    console.log('✅ 토글 버튼 이벤트 리스너 등록 완료');
  }
}

// 자동화 상태에 따른 UI 업데이트 함수
function updateAutomationUI(isRunning) {
  const promptInput = document.getElementById('promptInput');
  const generateBtn = document.getElementById('generateBtn');
  const autoStatus = document.getElementById('autoStatus');
  
  if (isRunning) {
    // 자동화 모드 ON - 수동 입력도 가능
    if (promptInput) {
      promptInput.placeholder = '자동화 모드: 프롬프트 입력 후 버튼 클릭으로 즉시 실행 가능';
      promptInput.disabled = false;
      promptInput.style.opacity = '1';
    }
    
    if (generateBtn) {
      generateBtn.textContent = '🚀 즉시 실행';
      generateBtn.disabled = false;
      generateBtn.style.opacity = '1';
    }
    
    if (autoStatus) {
      autoStatus.className = 'auto-status on';
      autoStatus.textContent = '🟢 자동화 활성화 - 수동 실행 가능';
    }
  } else {
    // 자동화 모드 OFF
    if (promptInput) {
      promptInput.placeholder = '이미지를 생성할 프롬프트를 입력하세요...';
      promptInput.disabled = false;
      promptInput.style.opacity = '1';
    }
    
    if (generateBtn) {
      generateBtn.textContent = '🎨 이미지 생성';
      generateBtn.disabled = false;
      generateBtn.style.opacity = '1';
    }
    
    if (autoStatus) {
      autoStatus.className = 'auto-status off';
      autoStatus.textContent = '🔴 자동화 비활성화';
    }
  }
}

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateLogs') {
    displayLogs(request.logs);
    
    // 성공 완료인지 확인
    let hasError = false;
    if (request.isSuccess) {
      // Library 모드 성공 완료
      hasError = false;
    } else {
      // 일반 모드에서 오류 확인
      hasError = checkForErrors(request.logs);
    }
    
    updateProgress(request.currentStep, request.totalSteps, hasError);
    showProgress();
  } else if (request.action === 'updateProgress') {
    // 진행률 업데이트
    updateProgressWithMessage(request.currentStep, request.totalSteps, request.progress, request.message);
    showProgress();
  } else if (request.action === 'updateTable') {
    // 테이블 업데이트
    console.log('📨 updateTable 메시지 수신:', request.results);
    updateTable(request.results);
    showTable();
    
    // 완료된 이미지 URL 자동 입력
    updateCompletedUrl(request.results);
  } else if (request.action === 'updateCompletedUrl') {
    // 완료된 URL 업데이트
    console.log('📨 updateCompletedUrl 메시지 수신:', request.url);
    setCompletedUrl(request.url, request.title);
  } else if (request.action === 'updateAutomationLogs') {
    // 자동화 로그 업데이트
    console.log('📨 updateAutomationLogs 메시지 수신:', request.logs);
    displayAutomationLogs(request.logs);
    
    // 자동화 상태 확인 및 UI 업데이트
    if (request.logs && request.logs.length > 0) {
      const lastLog = request.logs[request.logs.length - 1];
      if (lastLog.includes('자동화 활성화') || lastLog.includes('자동화 시작')) {
        updateAutomationUI(true);
      } else if (lastLog.includes('자동화 비활성화') || lastLog.includes('자동화 중지')) {
        updateAutomationUI(false);
      }
    }
  } else if (request.action === 'setManualPrompt') {
    // 수동 모드 입력폼에 프롬프트 설정
    console.log('📨 setManualPrompt 메시지 수신:', request.prompt);
    const promptInput = document.getElementById('promptInput');
    if (promptInput) {
      promptInput.value = request.prompt;
      console.log('✅ 수동 모드 입력폼에 프롬프트 설정 완료');
    }
  } else if (request.action === 'clickManualButton') {
    // 수동 모드 버튼 자동 클릭
    console.log('📨 clickManualButton 메시지 수신');
    const generateBtn = document.getElementById('generateBtn');
    if (generateBtn) {
      generateBtn.click();
      console.log('✅ 수동 모드 버튼 자동 클릭 완료');
    }
  }
});

// 메인 실행 함수
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔄 DOMContentLoaded 이벤트 발생');
  
  // 초기 로그 로드
  loadLogsFromStorage();
  
  // 토글 버튼 설정
  setupToggleButton();
  
  // 자동화 로그 새로고침 버튼 설정
  const refreshAutomationLogsBtn = document.getElementById('refreshAutomationLogs');
  if (refreshAutomationLogsBtn) {
    refreshAutomationLogsBtn.addEventListener('click', () => {
      console.log('🔄 자동화 로그 새로고침');
      const automationLogs = localStorage.getItem('sora_automation_logs');
      if (automationLogs) {
        try {
          const logs = JSON.parse(automationLogs);
          displayAutomationLogs(logs);
        } catch (error) {
          console.error('❌ 자동화 로그 파싱 오류:', error);
        }
      }
    });
  }
  
  // 자동화 로그 실시간 업데이트 (5초마다)
  setInterval(() => {
    const automationLogs = localStorage.getItem('sora_automation_logs');
    if (automationLogs) {
      try {
        const logs = JSON.parse(automationLogs);
        displayAutomationLogs(logs);
      } catch (error) {
        console.error('❌ 자동화 로그 파싱 오류:', error);
      }
    }
  }, 5000);
  
  // 이미지 생성 버튼 찾기
  const generateBtn = document.getElementById('generateBtn');
  console.log('🔍 이미지 생성 버튼 찾기:', generateBtn);
  
  if (!generateBtn) {
    console.error('❌ 이미지 생성 버튼을 찾을 수 없음!');
    showStatus('이미지 생성 버튼을 찾을 수 없습니다.', 'error');
    return;
  }
  
  // 이미지 생성 버튼 이벤트 리스너
  generateBtn.addEventListener('click', async function() {
    console.log('🚀 수동 실행 버튼 클릭됨');
    
    // 기존 모니터링 중지
    stopProgressMonitoring();
    
    // URL 입력란 초기화
    resetUrlInput();
    
    // 자동화 상태 확인
    let isAutomationRunning = false;
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        const result = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            if (window.jsonAutomation) {
              return window.jsonAutomation.getStatus();
            }
            return { isRunning: false };
          }
        });
        isAutomationRunning = result[0]?.result?.isRunning || false;
      }
    } catch (error) {
      console.log('자동화 상태 확인 실패:', error);
    }
    
    console.log('🤖 자동화 상태:', isAutomationRunning ? 'ON' : 'OFF');
    
    // 프롬프트 입력창 찾기
    const promptInput = document.getElementById('promptInput');
    console.log('🔍 프롬프트 입력창 찾기:', promptInput);
    
    if (!promptInput) {
      console.error('❌ 프롬프트 입력창을 찾을 수 없음!');
      showStatus('프롬프트 입력창을 찾을 수 없습니다.', 'error');
      return;
    }
    
    // 프롬프트 값 가져오기
    const promptText = promptInput.value.trim();
    console.log('📝 입력된 프롬프트:', promptText);
    
    if (!promptText) {
      showStatus('프롬프트를 입력해주세요.', 'error');
      return;
    }
    
    // 자동화 상태에 따른 메시지 표시
    if (isAutomationRunning) {
      showStatus('🚀 자동화 ON 상태에서 즉시 실행 시작...', 'info');
    } else {
      showStatus('수동 자동화 시작 중...', 'info');
    }
    
    updateProgress(1, 3, false); // 프롬프트 입력 단계
    
    try {
      // 현재 활성 탭 가져오기
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('📋 현재 탭:', tab);
      
      // Sora 페이지인지 확인
      if (!tab.url.includes('sora.chatgpt.com') && !tab.url.includes('sora.openai.com')) {
        showStatus('Sora 페이지에서 실행해주세요.', 'error');
        return;
      }
      
      console.log('🌐 현재 페이지:', tab.url);
      
      // 진행 상황 표시 시작
      showProgress();
      showTable();
      
      updateProgress(0, 3, false); // 수동 모드는 3단계: 프롬프트 입력, 버튼 클릭, 완료
      
      updateProgress(2, 3, false); // 버튼 클릭 단계
      
      // content script 주입 및 자동화 실행
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: async (userPromptText, isAutoMode) => {
          console.log('🎯 수동 모드 프롬프트 실행:', userPromptText, '자동화 모드:', isAutoMode);
          
          try {
            if (isAutoMode) {
              // 자동화 ON 상태: 프롬프트 입력 후 즉시 실행 버튼 클릭
              // 1. 프롬프트 입력창 찾기 ...
              // ... 프롬프트 입력 코드 ...
              // 3. 잠시 대기
              await new Promise(resolve => setTimeout(resolve, 1000));
              // 4. 즉시 실행 버튼 활성화 대기 및 클릭
              let generateBtn = null;
              const buttonSelectors = [
                'button[data-testid*="generate"]',
                'button[data-testid*="submit"]',
                'button[aria-label*="Generate"]',
                'button[aria-label*="Submit"]',
                'button[aria-label*="Create image"]',
                'button[type="submit"]',
                'button[class*="generate"]',
                'button[class*="submit"]',
                'button[data-state="closed"]',
                'button[data-disabled="false"]',
                'button.bg-token-bg-inverse',
                'button[class*="bg-token-bg-inverse"]',
                'button[class*="rounded-full"]',
                'button:has(svg)',
                'button svg[width="24"][height="24"]',
                '[role="button"]',
                'div[aria-label*="Create"]',
                'div[role="button"]'
              ];
              for (const selector of buttonSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                  generateBtn = element;
                  break;
                }
              }
              // 버튼 활성화 대기 및 클릭
              if (generateBtn) {
                let tries = 0;
                const maxTries = 20;
                const tryClick = () => {
                  if (!generateBtn.disabled) {
                    generateBtn.click();
                    generateBtn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
                    generateBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                    console.log('�� 즉시 실행 버튼 자동 클릭');
                    
                                         // 5. localStorage 초기화 (프롬프트 소모 완료)
                     setTimeout(async () => {
                       try {
                         // localStorage 초기화
                         localStorage.clear();
                         console.log('🗑️ localStorage 초기화 완료 (프롬프트 소모)');
                         
                         // save_prompt.json 파일도 초기화
                         const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                         if (tab) {
                           chrome.tabs.sendMessage(tab.id, {
                             action: 'clearSavePrompt'
                           }, (response) => {
                             if (response && response.success) {
                               console.log('✅ save_prompt.json 파일이 성공적으로 초기화되었습니다.');
                             } else {
                               console.error('❌ save_prompt.json 파일 초기화 실패:', response?.error);
                             }
                           });
                         } else {
                           console.error('❌ 활성 탭을 찾을 수 없습니다.');
                         }
                       } catch (error) {
                         console.error('❌ 초기화 중 오류:', error);
                       }
                     }, 2000); // 2초 후 초기화 실행
                    
                  } else if (tries < maxTries) {
                    tries++;
                    setTimeout(tryClick, 500);
                  } else {
                    console.error('❌ 즉시 실행 버튼이 활성화되지 않아 클릭 실패');
                  }
                };
                tryClick();
              } else {
                // Enter 키 fallback
                promptInput.dispatchEvent(new KeyboardEvent('keydown', {
                  key: 'Enter',
                  code: 'Enter',
                  keyCode: 13,
                  which: 13,
                  bubbles: true
                }));
                console.log('🚀 Enter 키로 이미지 생성 시작');
                
                                 // Enter 키 사용 시에도 localStorage 초기화 (프롬프트 소모 완료)
                 setTimeout(async () => {
                   try {
                     // localStorage 초기화
                     localStorage.clear();
                     console.log('🗑️ localStorage 초기화 완료 (프롬프트 소모 - Enter 키)');
                     
                     // save_prompt.json 파일도 초기화
                     const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                     if (tab) {
                       chrome.tabs.sendMessage(tab.id, {
                         action: 'clearSavePrompt'
                       }, (response) => {
                         if (response && response.success) {
                           console.log('✅ save_prompt.json 파일이 성공적으로 초기화되었습니다. (Enter 키 사용)');
                         } else {
                           console.error('❌ save_prompt.json 파일 초기화 실패:', response?.error);
                         }
                       });
                     } else {
                       console.error('❌ 활성 탭을 찾을 수 없습니다.');
                     }
                   } catch (error) {
                     console.error('❌ 초기화 중 오류:', error);
                   }
                 }, 2000);
              }
              // ... 이후 기존 코드 ...
            } else {
              // 자동화 OFF 상태: 기존 방식 (페이지 직접 조작)
              // 1. 프롬프트 입력창 찾기
              let promptInput = null;
              const selectors = [
                'textarea',
                'input[type="text"]',
                'div[contenteditable="true"]',
                '[data-testid*="prompt"]',
                '[data-testid*="input"]',
                '[placeholder*="prompt"]',
                '[placeholder*="Prompt"]',
                '[placeholder*="프롬프트"]',
                '[placeholder*="입력"]',
                '[placeholder*="input"]'
              ];
              
              for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element) {
                  console.log(`✅ 프롬프트 입력창 발견: ${selector}`, element);
                  promptInput = element;
                  break;
                }
              }
              
              if (!promptInput) {
                throw new Error('프롬프트 입력창을 찾을 수 없습니다.');
              }
              
              // 2. 프롬프트 입력
              promptInput.focus();
              promptInput.value = userPromptText;
              promptInput.dispatchEvent(new Event('input', { bubbles: true }));
              promptInput.dispatchEvent(new Event('change', { bubbles: true }));
              promptInput.dispatchEvent(new Event('blur', { bubbles: true }));
              
              console.log('📝 프롬프트 입력 완료:', promptInput.value);
              
              // 3. 잠시 대기
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              // 4. 생성 버튼 찾기 및 클릭
              let generateBtn = null;
              const buttonSelectors = [
                'button[data-testid*="generate"]',
                'button[data-testid*="submit"]',
                'button[aria-label*="Generate"]',
                'button[aria-label*="Submit"]',
                'button[type="submit"]',
                'button[class*="generate"]',
                'button[class*="submit"]'
              ];
              
              for (const selector of buttonSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                  console.log(`✅ 생성 버튼 발견: ${selector}`, element);
                  generateBtn = element;
                  break;
                }
              }
              
              // 5. 버튼이 없으면 Enter 키 사용
              if (generateBtn) {
                generateBtn.click();
                console.log('🚀 이미지 생성 버튼 클릭');
              } else {
                // Enter 키로 제출
                promptInput.dispatchEvent(new KeyboardEvent('keydown', {
                  key: 'Enter',
                  code: 'Enter',
                  keyCode: 13,
                  which: 13,
                  bubbles: true
                }));
                console.log('🚀 Enter 키로 이미지 생성 시작');
              }
              
              // 6. 이미지 생성 결과 대기 및 오류 감지
              console.log('⏳ 이미지 생성 결과 대기 중...');
              
              return new Promise(async (resolve) => {
                let attempts = 0;
                const maxAttempts = 3;
                const checkInterval = 5000; // 5초마다 확인
                const maxWaitTime = 60000; // 최대 60초 대기
                const startTime = Date.now();
                
                const checkForResult = async () => {
                  attempts++;
                  console.log(`🔍 이미지 생성 결과 확인 (시도 ${attempts}/${maxAttempts})`);
                  
                  try {
                    // 1. "Image trashed" 또는 실패 메시지 확인 (더 정확한 감지)
                    let hasError = false;
                    let errorMessage = '';
                    
                    // CSS 스타일이나 긴 텍스트는 제외하고 실제 오류 메시지만 감지
                    const errorSelectors = [
                      '[data-testid*="error"]',
                      '[class*="error"]',
                      '[class*="Error"]',
                      '[class*="failed"]',
                      '[class*="Failed"]',
                      '[class*="trashed"]',
                      '[class*="Trashed"]',
                      'button', 'div', 'span', 'p'
                    ];
                    for (const selector of errorSelectors) {
                      try {
                        const elements = document.querySelectorAll(selector);
                        for (const element of elements) {
                          const text = element.textContent || '';
                          // CSS 스타일이나 긴 텍스트 제외 (100자 이상은 제외)
                          // CSS 스타일 패턴 제외
                          if (text.length < 100 && 
                              !text.includes(':where(') &&
                              !text.includes('--toast-') &&
                              !text.includes('data-sonner-') &&
                              !text.includes('@keyframes') &&
                              !text.includes('@media') &&
                              !text.includes('self.__next_f') &&
                              !text.includes('chrome-extension') &&
                              (
                                text.includes('Image trashed') ||
                                text.includes('Failed to generate') ||
                                text.includes('Error') ||
                                text.includes('실패') ||
                                text.includes('오류') ||
                                text.includes('Undo') ||
                                text.includes('unexpected error') ||
                                text.includes('Unexpected error') ||
                                text.includes('There was an unexpected error running this prompt')
                              )) {
                            hasError = true;
                            errorMessage = text.trim();
                            break;
                          }
                        }
                        if (hasError) break;
                      } catch (e) { continue; }
                    }
                    // 추가로 버튼 텍스트에서 "Undo" 확인
                    if (!hasError) {
                      const buttons = document.querySelectorAll('button');
                      for (const button of buttons) {
                        const text = button.textContent || '';
                        if (text.includes('Undo') && text.length < 50) {
                          hasError = true;
                          errorMessage = 'Undo button detected';
                          break;
                        }
                      }
                    }
                    
                    if (hasError) {
                      console.log('❌ 이미지 생성 실패 감지:', errorMessage);
                      
                      if (attempts < maxAttempts) {
                        console.log(`🔄 재시도 중... (${attempts + 1}/${maxAttempts})`);
                        
                        // 잠시 대기 후 재시도
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        
                        // 프롬프트 다시 입력
                        promptInput.focus();
                        promptInput.value = userPromptText;
                        promptInput.dispatchEvent(new Event('input', { bubbles: true }));
                        promptInput.dispatchEvent(new Event('change', { bubbles: true }));
                        promptInput.dispatchEvent(new Event('blur', { bubbles: true }));
                        
                        // 버튼 다시 클릭
                        if (generateBtn) {
                          generateBtn.click();
                        } else {
                          promptInput.dispatchEvent(new KeyboardEvent('keydown', {
                            key: 'Enter',
                            code: 'Enter',
                            keyCode: 13,
                            which: 13,
                            bubbles: true
                          }));
                        }
                        
                        // 다음 확인까지 대기
                        setTimeout(checkForResult, checkInterval);
                        return;
                      } else {
                        resolve({
                          success: false,
                          error: `이미지 생성 실패: ${errorMessage}`,
                          message: '최대 재시도 횟수 초과'
                        });
                        return;
                      }
                    }
                    
                    // 2. 성공적인 이미지 생성 확인
                    const imageElements = document.querySelectorAll('img');
                    for (const img of imageElements) {
                      const src = img.src || '';
                      if (src.includes('blob:') || src.includes('data:image') || src.includes('sora')) {
                        console.log('✅ 이미지 생성 성공 감지:', src);
                        resolve({
                          success: true,
                          imageUrl: src,
                          message: '이미지 생성 완료'
                        });
                        return;
                      }
                    }
                    
                    // 3. 시간 초과 확인
                    if (Date.now() - startTime > maxWaitTime) {
                      console.log('⏰ 이미지 생성 시간 초과');
                      resolve({
                        success: false,
                        error: '이미지 생성 시간 초과',
                        message: '60초 대기 후 시간 초과'
                      });
                      return;
                    }
                    
                    // 4. 아직 처리 중인 경우 다음 확인까지 대기
                    console.log('⏳ 이미지 생성 처리 중...');
                    setTimeout(checkForResult, checkInterval);
                    
                  } catch (error) {
                    console.error('❌ 이미지 생성 결과 확인 중 오류:', error);
                    
                    if (attempts < maxAttempts) {
                      setTimeout(checkForResult, checkInterval);
                    } else {
                      resolve({
                        success: false,
                        error: error.message,
                        message: '결과 확인 중 오류 발생'
                      });
                    }
                  }
                };
                
                // 첫 번째 확인 시작
                setTimeout(checkForResult, checkInterval);
              });
            }
            
          } catch (error) {
            console.error('❌ 수동 모드 실행 실패:', error);
            return { success: false, error: error.message };
          }
        },
        args: [promptText, isAutomationRunning]
      });
      
             updateProgress(3, 3, false); // 완료 단계
       
       // 결과 처리
       if (result && result[0] && result[0].result) {
        const automationResult = result[0].result;
        if (automationResult.success) {
          showStatus('✅ 수동 모드 실행 완료!', 'success');
          console.log('✅ 수동 모드 실행 결과:', automationResult);
        } else {
          showStatus(`❌ 수동 모드 실행 실패: ${automationResult.error}`, 'error');
          console.error('❌ 수동 모드 실행 실패:', automationResult.error);
        }
             } else {
         showStatus('❌ 수동 모드 실행 중 오류 발생', 'error');
       }
      
    } catch (error) {
      console.error('❌ 수동 자동화 시작 오류:', error);
      showStatus(`오류: ${error.message}`, 'error');
    }
  });
  
  // localStorage 초기화 버튼
  const clearLocalStorageBtn = document.getElementById('clearLocalStorage');
  if (clearLocalStorageBtn) {
    clearLocalStorageBtn.addEventListener('click', async function() {
      console.log('🗑️ localStorage 초기화 버튼 클릭됨');
      
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.url.includes('sora.chatgpt.com') && !tab.url.includes('sora.openai.com')) {
          showStatus('Sora 페이지에서 실행해주세요.', 'error');
          return;
        }
        
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            if (window.jsonAutomation) {
              window.jsonAutomation.clearLocalStorage();
              return { success: true, message: 'localStorage 초기화 완료' };
            } else {
              return { success: false, message: 'JsonAutomationSystem을 찾을 수 없습니다' };
            }
          }
        });
        
        showStatus('localStorage가 초기화되었습니다!', 'success');
        
      } catch (error) {
        console.error('❌ localStorage 초기화 오류:', error);
        showStatus(`초기화 오류: ${error.message}`, 'error');
      }
    });
  }
  
  // 테스트 프롬프트 로드 버튼
  const loadTestPromptsBtn = document.getElementById('loadTestPrompts');
  if (loadTestPromptsBtn) {
    loadTestPromptsBtn.addEventListener('click', async function() {
      console.log('📝 테스트 프롬프트 로드 버튼 클릭됨');
      
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab.url.includes('sora.chatgpt.com') && !tab.url.includes('sora.openai.com')) {
          showStatus('Sora 페이지에서 실행해주세요.', 'error');
          return;
        }
        
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            if (window.jsonAutomation) {
              // 테스트 프롬프트 데이터
              const testPrompts = [
                {
                  prompt: "A beautiful sunset over the ocean with golden waves",
                  category: "test",
                  timestamp: new Date().toISOString()
                },
                {
                  prompt: "A cozy coffee shop with warm lighting and people working",
                  category: "test",
                  timestamp: new Date().toISOString()
                }
              ];
              
              window.jsonAutomation.setPromptData(testPrompts);
              return { success: true, message: '테스트 프롬프트 로드 완료', count: testPrompts.length };
            } else {
              return { success: false, message: 'JsonAutomationSystem을 찾을 수 없습니다' };
            }
          }
        });
        
        showStatus('테스트 프롬프트가 로드되었습니다!', 'success');
        
      } catch (error) {
        console.error('❌ 테스트 프롬프트 로드 오류:', error);
        showStatus(`로드 오류: ${error.message}`, 'error');
      }
    });
  }
  
  // JSON 파일 업로드 버튼
  const uploadJsonFileBtn = document.getElementById('uploadJsonFile');
  const jsonFileInput = document.getElementById('jsonFileInput');
  
  if (uploadJsonFileBtn && jsonFileInput) {
    uploadJsonFileBtn.addEventListener('click', () => {
      jsonFileInput.click();
    });
    
    jsonFileInput.addEventListener('change', async (event) => {
      const file = event.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        
        if (data.prompts && Array.isArray(data.prompts)) {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (!tab.url.includes('sora.chatgpt.com') && !tab.url.includes('sora.openai.com')) {
            showStatus('Sora 페이지에서 실행해주세요.', 'error');
            return;
          }
          
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (prompts) => {
              if (window.jsonAutomation) {
                window.jsonAutomation.setPromptData(prompts);
                return { success: true, message: 'JSON 파일 업로드 완료', count: prompts.length };
              } else {
                return { success: false, message: 'JsonAutomationSystem을 찾을 수 없습니다' };
              }
            },
            args: [data.prompts]
          });
          
          showStatus(`JSON 파일 업로드 완료! ${data.prompts.length}개 프롬프트 로드됨`, 'success');
        } else {
          showStatus('올바른 프롬프트 형식이 아닙니다.', 'error');
        }
      } catch (error) {
        console.error('❌ JSON 파일 읽기 오류:', error);
        showStatus('JSON 파일 읽기 실패', 'error');
      }
      
      // 파일 입력 초기화
      event.target.value = '';
    });
  }
  
  // 클립보드에서 로드 버튼
  const loadFromClipboardBtn = document.getElementById('loadFromClipboard');
  if (loadFromClipboardBtn) {
    loadFromClipboardBtn.addEventListener('click', async function() {
      console.log('📋 클립보드에서 로드 버튼 클릭됨');
      
      try {
        const text = await navigator.clipboard.readText();
        const data = JSON.parse(text);
        
        if (data.prompts && Array.isArray(data.prompts)) {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (!tab.url.includes('sora.chatgpt.com') && !tab.url.includes('sora.openai.com')) {
            showStatus('Sora 페이지에서 실행해주세요.', 'error');
            return;
          }
          
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (prompts) => {
              if (window.jsonAutomation) {
                window.jsonAutomation.setPromptData(prompts);
                return { success: true, message: '클립보드에서 로드 완료', count: prompts.length };
              } else {
                return { success: false, message: 'JsonAutomationSystem을 찾을 수 없습니다' };
              }
            },
            args: [data.prompts]
          });
          
          showStatus(`클립보드에서 로드 완료! ${data.prompts.length}개 프롬프트 로드됨`, 'success');
        } else {
          showStatus('클립보드에 올바른 프롬프트 형식이 없습니다.', 'error');
        }
      } catch (error) {
        console.error('❌ 클립보드 읽기 오류:', error);
        showStatus('클립보드 읽기 실패 또는 JSON 형식 오류', 'error');
      }
    });
  }
  
  // Native Host 테스트 버튼 (Background Script 사용)
  const testNativeHostBtn = document.getElementById('testNativeHost');
  if (testNativeHostBtn) {
    testNativeHostBtn.addEventListener('click', async function() {
      console.log('🌐 Native Host 테스트 버튼 클릭됨');
      
      try {
        // Background Script를 통해 Native Host 테스트
        const response = await chrome.runtime.sendMessage({
          action: 'testNativeHost',
          data: { action: 'ping' }
        });
        
        if (response && response.success) {
          showStatus('Native Host 연결 성공!', 'success');
        } else {
          showStatus('Native Host 연결 실패', 'error');
        }
        
      } catch (error) {
        console.error('❌ Native Host 테스트 오류:', error);
        showStatus(`테스트 오류: ${error.message}`, 'error');
      }
    });
  }
  
  // 다운로드 버튼 찾기
  const downloadBtn = document.getElementById('downloadBtn');
  console.log('🔍 다운로드 버튼 찾기:', downloadBtn);
  
  if (downloadBtn) {
    // 다운로드 버튼 이벤트 리스너
    downloadBtn.addEventListener('click', async function() {
      console.log('📥 다운로드 버튼 클릭됨');
      
      try {
        // 현재 활성 탭 가져오기
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Sora 페이지인지 확인
        if (!tab.url.includes('sora.chatgpt.com') && !tab.url.includes('sora.openai.com')) {
          showStatus('Sora 페이지에서 실행해주세요.', 'error');
          return;
        }
        
        // content script에서 다운로드 실행
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            console.log('📥 다운로드 기능 실행');
            // 다운로드 로직 구현
            return { success: true, message: '다운로드 기능 준비 중' };
          }
        });
        
        showStatus('다운로드 기능이 실행되었습니다!', 'success');
        
      } catch (error) {
        console.error('❌ 다운로드 오류:', error);
        showStatus(`다운로드 오류: ${error.message}`, 'error');
      }
    });
  }
  
  console.log('✅ 이벤트 리스너 등록 완료');
  showStatus('준비되었습니다. Sora 페이지에서 실행하세요.', 'info');
}); 