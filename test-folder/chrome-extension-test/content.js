// 프롬프트 테스트 확장 프로그램 - 콘텐츠 스크립트
console.log('프롬프트 테스트 확장 프로그램 - 콘텐츠 스크립트 로드됨');

// 확장 프로그램 컨텍스트 검증 함수
function isExtensionContextValid() {
  try {
    const isValid = chrome.runtime && chrome.runtime.id;
    console.log('🔍 확장 프로그램 컨텍스트 검증:', isValid, chrome.runtime?.id);
    return isValid;
  } catch (error) {
    console.error('❌ 확장 프로그램 컨텍스트 검증 실패:', error);
    return false;
  }
}

// 안전한 chrome.runtime 메시지 전송 함수
function sendMessageSafe(message, callback) {
  if (!isExtensionContextValid()) {
    console.warn('⚠️ 확장 프로그램 컨텍스트가 무효화되어 메시지 전송을 건너뜁니다.');
    if (callback) {
      callback({ success: false, error: 'Extension context invalidated' });
    }
    return;
  }
  
  try {
    // 타임아웃 설정
    const timeoutId = setTimeout(() => {
      if (callback) {
        callback({ success: false, error: '메시지 전송 시간 초과' });
      }
    }, 5000);
    
    chrome.runtime.sendMessage(message, (response) => {
      clearTimeout(timeoutId);
      
      if (chrome.runtime.lastError) {
        console.error('❌ 메시지 전송 실패:', chrome.runtime.lastError);
        if (callback) {
          callback({ success: false, error: chrome.runtime.lastError.message });
        }
      } else {
        if (callback) {
          callback(response);
        }
      }
    });
  } catch (error) {
    console.error('❌ 메시지 전송 실패:', error);
    if (callback) {
      callback({ success: false, error: error.message });
    }
  }
}

// 안전한 chrome.runtime.getURL 함수
function getRuntimeURL(path) {
  addLogMessage(`🔍 getRuntimeURL 호출: ${path}`);
  if (!isExtensionContextValid()) {
    addLogMessage('⚠️ 확장 프로그램 컨텍스트가 무효화되어 URL을 가져올 수 없습니다.');
    return null;
  }
  
  try {
    const url = chrome.runtime.getURL(path);
    addLogMessage(`🔗 생성된 URL: ${url}`);
    return url;
  } catch (error) {
    addLogMessage('❌ runtime URL 가져오기 실패: ' + error.message);
    return null;
  }
}

// Sora 페이지에서 현재 프롬프트 가져오기
function getCurrentSoraPrompt() {
  try {
    console.log('🔍 Sora 페이지에서 현재 프롬프트 검색 중...');
    
    let currentPrompt = '';
    
    // 1. 먼저 페이지에서 "Prompt" 텍스트가 포함된 요소들을 찾기
    const promptElements = document.querySelectorAll('div, span, p');
    const promptTexts = [];
    
    for (const element of promptElements) {
      const text = element.textContent || element.innerText || '';
      if (text.includes('Prompt') && text.length > 10) {
        // Prompt 다음에 오는 텍스트 찾기
        const promptIndex = text.indexOf('Prompt');
        const afterPrompt = text.substring(promptIndex + 6).trim();
        if (afterPrompt && afterPrompt.length > 10 && !afterPrompt.includes('undefined')) {
          promptTexts.push(afterPrompt);
        }
      }
    }
    
    // 2. 특정 클래스에서 프롬프트 찾기 (Sora 페이지 구조에 맞춤)
    const textPrimaryElements = document.querySelectorAll('.text-token-text-primary');
    for (const element of textPrimaryElements) {
      const text = element.textContent || element.innerText || '';
      if (text.length > 20 && text.length < 1000 && 
          !text.includes('undefined') && 
          !text.includes('Prompt') &&
          (text.includes('어두운') || text.includes('밤') || text.includes('남성') || 
           text.includes('배경') || text.includes('장면') || text.includes('그림자') ||
           text.includes('도시') || text.includes('산') || text.includes('호수') ||
           text.includes('디지털') || text.includes('추상') || text.includes('미스터리'))) {
        promptTexts.push(text.trim());
      }
    }
    
    // 3. 가장 긴 프롬프트 텍스트 선택 (일반적으로 실제 프롬프트가 가장 길다)
    if (promptTexts.length > 0) {
      promptTexts.sort((a, b) => b.length - a.length);
      currentPrompt = promptTexts[0];
      console.log('✅ 프롬프트 텍스트 발견:', currentPrompt.substring(0, 100) + '...');
    }
    
    // 4. 여전히 찾지 못했다면, 특정 클래스나 구조를 가진 요소에서 찾기
    if (!currentPrompt.trim()) {
      // Sora 페이지의 특정 구조에서 프롬프트 찾기
      const promptContainers = document.querySelectorAll('[class*="text-token-text-primary"]');
      for (const container of promptContainers) {
        const text = container.textContent || container.innerText || '';
        if (text.length > 20 && text.length < 1000 && 
            !text.includes('undefined') && 
            (text.includes('어두운') || text.includes('밤') || text.includes('남성') || 
             text.includes('배경') || text.includes('장면') || text.includes('그림자'))) {
          currentPrompt = text.trim();
          console.log('✅ 프롬프트 컨테이너에서 발견:', currentPrompt.substring(0, 100) + '...');
          break;
        }
      }
    }
    
    // 5. 마지막으로 일반적인 프롬프트 입력 필드 찾기
    if (!currentPrompt.trim()) {
      const promptSelectors = [
        'textarea[placeholder*="prompt"]',
        'textarea[placeholder*="프롬프트"]',
        'textarea[placeholder*="Describe"]',
        'textarea[placeholder*="설명"]',
        'textarea[data-testid="prompt-input"]',
        'textarea[name="prompt"]',
        'textarea[id*="prompt"]',
        'textarea[class*="prompt"]',
        'div[contenteditable="true"]',
        'input[placeholder*="prompt"]',
        'input[placeholder*="프롬프트"]'
      ];
      
      for (const selector of promptSelectors) {
        const promptElement = document.querySelector(selector);
        if (promptElement) {
          console.log('✅ 프롬프트 입력 필드 발견:', selector);
          if (promptElement.tagName === 'TEXTAREA') {
            currentPrompt = promptElement.value || promptElement.textContent || '';
          } else if (promptElement.getAttribute('contenteditable') === 'true') {
            currentPrompt = promptElement.textContent || promptElement.innerText || '';
          } else if (promptElement.tagName === 'INPUT') {
            currentPrompt = promptElement.value || '';
          }
          break;
        }
      }
    }
    
    console.log('📝 최종 프롬프트:', currentPrompt);
    
    // 여러 프롬프트가 합쳐져 있는지 확인하고 분리
    const separatedPrompts = separatePrompts(currentPrompt);
    
    if (separatedPrompts.length > 1) {
      console.log(`🔍 ${separatedPrompts.length}개의 프롬프트로 분리됨`);
      // 첫 번째 프롬프트만 반환 (가장 최근 것)
      return separatedPrompts[0].trim();
    }
    
    return currentPrompt.trim();
    
  } catch (error) {
    console.error('❌ 현재 프롬프트 가져오기 실패:', error);
    return '';
  }
}

// 여러 프롬프트를 분리하는 함수
function separatePrompts(text) {
  const prompts = [];
  
  if (!text || text.length < 10) {
    return [text];
  }
  
  // "Prompt" 키워드로 분리 (우선순위)
  if (text.includes('Prompt')) {
    console.log('🔍 Prompt 키워드로 분리 시도');
    const promptParts = text.split(/Prompt/i);
    
    for (let i = 1; i < promptParts.length; i++) { // 첫 번째는 제외
      const part = promptParts[i].trim();
      if (part && part.length > 10) {
        // 시간 패턴과 기타 불필요한 텍스트 제거
        let cleanPrompt = part;
        
        // 시간 패턴 제거 (8:06pm, 8:05pm 등)
        cleanPrompt = cleanPrompt.replace(/^\d{1,2}:\d{2}(?:am|pm)\s*/i, '');
        
        // 특수 문자와 이모지 제거
        cleanPrompt = cleanPrompt.replace(/[✦✧✩✪✬✮]/g, '');
        
        // 연속된 공백 정리
        cleanPrompt = cleanPrompt.replace(/\s+/g, ' ').trim();
        
        if (cleanPrompt && cleanPrompt.length > 10) {
          prompts.push(cleanPrompt);
          console.log(`📝 Prompt로 분리된 프롬프트 ${i}: ${cleanPrompt.substring(0, 50)}...`);
        }
      }
    }
  }
  
  // Prompt로 분리되지 않았으면 시간 패턴으로 분리
  if (prompts.length === 0) {
    const timePattern = /\d{1,2}:\d{2}(?:am|pm)/gi;
    const timeMatches = text.match(timePattern);
    
    if (timeMatches && timeMatches.length > 1) {
      console.log(`🕐 시간 패턴 발견: ${timeMatches.length}개`);
      
      // 시간을 기준으로 분리
      const parts = text.split(/(?=\d{1,2}:\d{2}(?:am|pm))/);
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].trim();
        if (part && part.length > 10) {
          // 프롬프트 부분 추출 (시간 이후의 텍스트)
          const promptMatch = part.match(/(?:am|pm)\s*(.+)/i);
          if (promptMatch && promptMatch[1].trim()) {
            const cleanPrompt = promptMatch[1].trim();
            if (cleanPrompt.length > 10) {
              prompts.push(cleanPrompt);
              console.log(`📝 분리된 프롬프트 ${i+1}: ${cleanPrompt.substring(0, 50)}...`);
            }
          }
        }
      }
    }
  }
  
  // 분리된 프롬프트가 없으면 원본 텍스트 반환
  if (prompts.length === 0) {
    prompts.push(text);
  }
  
  return prompts;
}

// 프롬프트 중복 검사 상태 머신 변수들
let promptCheckState = 0;
let currentPromptData = null;
let promptListData = null;
let currentPromptIndex = 0;
let duplicateMatches = [];
let highestSimilarity = 0;
let isCheckingInProgress = false;

// 프롬프트 중복 검사 함수 (setInterval 기반 상태 머신)
function checkPromptDuplication(currentPrompt, promptList) {
  return new Promise((resolve) => {
    try {
      addLogMessage('🔍 프롬프트 중복 검사 시작...');
      
      // promptList 안전성 검사
      if (!promptList) {
        addLogMessage('❌ promptList가 undefined 또는 null입니다');
        resolve({
          isDuplicate: false,
          matches: [],
          similarity: 0,
          error: 'promptList is undefined or null'
        });
        return;
      }
      
      if (!Array.isArray(promptList)) {
        addLogMessage('❌ promptList가 배열이 아닙니다');
        resolve({
          isDuplicate: false,
          matches: [],
          similarity: 0,
          error: 'promptList is not an array'
        });
        return;
      }
      
      addLogMessage(`📋 비교 대상 프롬프트 수: ${promptList.length}개`);
      
      if (!currentPrompt || promptList.length === 0) {
        addLogMessage('❌ 중복 검사를 위한 데이터가 부족함');
        resolve({
        isDuplicate: false,
        matches: [],
        similarity: 0
        });
        return;
    }
    
      const duplicateMatches = [];
    let highestSimilarity = 0;
    
    // 각 프롬프트와 비교
      for (let i = 0; i < promptList.length; i++) {
        const prompt = promptList[i];
        const promptContent = prompt.content || prompt || '';
      const promptTitle = prompt.title || '';
      
      // 제목과 내용 모두 비교
      const titleSimilarity = calculateSimilarity(currentPrompt, promptTitle);
      const contentSimilarity = calculateSimilarity(currentPrompt, promptContent);
      
      // 더 높은 유사도를 사용
      const similarity = Math.max(titleSimilarity, contentSimilarity);
      
        // 각 비교 과정을 로그로 출력
        const truncatedCurrent = currentPrompt.length > 20 ? currentPrompt.substring(0, 20) + '...' : currentPrompt;
        const truncatedContent = promptContent.length > 20 ? promptContent.substring(0, 20) + '...' : promptContent;
        const truncatedTitle = promptTitle.length > 20 ? promptTitle.substring(0, 20) + '...' : promptTitle;
        
        addLogMessage(`🔍 비교 ${i+1}/${promptList.length}: 유사도 분석`);
        addLogMessage(`   현재 프롬프트: "${currentPrompt}"`);
        addLogMessage(`   비교 대상 제목: "${promptTitle}"`);
        addLogMessage(`   비교 대상 내용: "${promptContent}"`);
        addLogMessage(`   제목 유사도: ${titleSimilarity.toFixed(1)}%`);
        addLogMessage(`   내용 유사도: ${contentSimilarity.toFixed(1)}%`);
        addLogMessage(`   최종 유사도: ${similarity.toFixed(1)}% (${similarity >= 80 ? '중복' : '중복아님'})`);
      
      // 유사도가 80% 이상이면 중복으로 판정
      if (similarity >= 80) {
        const matchType = similarity >= 95 ? 'exact' : 
                         similarity >= 90 ? 'partial' : 'similar';
        
          duplicateMatches.push({
          prompt: prompt,
          similarity: similarity,
          type: matchType,
            index: i
        });
        
        if (similarity > highestSimilarity) {
          highestSimilarity = similarity;
        }
          
          addLogMessage(`🎯 중복 발견! (유사도: ${similarity.toFixed(1)}%)`);
      }
      }
    
    // 유사도 순으로 정렬
      duplicateMatches.sort((a, b) => b.similarity - a.similarity);
    
    const result = {
        isDuplicate: duplicateMatches.length > 0,
        matches: duplicateMatches,
      similarity: highestSimilarity
    };
    
      if (duplicateMatches.length > 0) {
        addLogMessage(`✅ 중복 검사 완료 - ${duplicateMatches.length}개 중복 발견`);
        addLogMessage(`📊 최고 유사도: ${highestSimilarity.toFixed(1)}%`);
        addLogMessage('📋 중복된 프롬프트 상세:');
        duplicateMatches.forEach((match, index) => {
          try {
            const matchText = match.prompt && match.prompt.content ? match.prompt.content : 
                             (match.prompt || match.text || '');
            const truncatedMatch = matchText.length > 50 ? matchText.substring(0, 50) + '...' : matchText;
            addLogMessage(`   ${index + 1}. 유사도 ${match.similarity.toFixed(1)}%: "${truncatedMatch}"`);
          } catch (error) {
            addLogMessage(`   ${index + 1}. 유사도 ${match.similarity.toFixed(1)}%: [프롬프트 텍스트 추출 실패]`);
          }
        });
      } else {
        addLogMessage('✅ 중복 검사 완료 - 중복 없음');
        addLogMessage(`📊 모든 프롬프트와의 최고 유사도: ${highestSimilarity.toFixed(1)}%`);
      }
      
      resolve(result);
    
  } catch (error) {
      addLogMessage(`❌ 프롬프트 중복 검사 오류: ${error.message}`);
      resolve({
      isDuplicate: false,
      matches: [],
      similarity: 0,
      error: error.message
      });
  }
  });
}

// 문자열 유사도 계산 함수
function calculateSimilarity(str1, str2) {
  try {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 100;
    
    const editDistance = levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length * 100;
  } catch (error) {
    return 0;
  }
}

// 키워드 기반 유사도 계산 함수
function calculateKeywordSimilarity(str1, str2) {
  try {
    const keywords1 = str1.split(/\s+/).filter(word => word.length > 2);
    const keywords2 = str2.split(/\s+/).filter(word => word.length > 2);
    
    if (keywords1.length === 0 || keywords2.length === 0) return 0;
    
    const commonKeywords = keywords1.filter(keyword => 
      keywords2.some(k => k.includes(keyword) || keyword.includes(k))
    );
    
    return (commonKeywords.length / Math.max(keywords1.length, keywords2.length)) * 100;
  } catch (error) {
    return 0;
  }
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

// 콘텐츠 스크립트에서 프롬프트 데이터 로드 테스트 함수
async function testPromptDataLoading() {
  try {
    console.log('콘텐츠 스크립트에서 프롬프트 데이터 로딩 테스트 중...');
    
    // 확장 프로그램 컨텍스트 검증
    if (!isExtensionContextValid()) {
      console.warn('⚠️ 확장 프로그램 컨텍스트가 무효화되어 데이터 로드를 건너뜁니다.');
      return null;
    }
    
    // 직접 data.json 파일 로드
    const dataUrl = getRuntimeURL('data.json');
    if (!dataUrl) {
      throw new Error('확장 프로그램 URL을 가져올 수 없습니다.');
    }
    
    console.log('데이터 URL:', dataUrl);
    
    const response = await fetch(dataUrl);
    console.log('fetch 응답:', response);
    
    if (!response.ok) {
      throw new Error(`HTTP 오류! 상태: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('콘텐츠 스크립트에서 프롬프트 데이터 로드 성공:', data);
    
    // 현재 Sora 프롬프트 가져오기
    const currentPrompt = getCurrentSoraPrompt();
    
    // 프롬프트 중복 검사
    if (currentPrompt && data.prompts) {
      const duplicationResult = checkPromptDuplication(currentPrompt, data.prompts);
      
      // 중복 검사 결과를 페이지에 표시
      // displayDuplicationResult(currentPrompt, duplicationResult, data.prompts); // 비활성화됨
      
      // 팝업에서 사용할 수 있도록 구조화된 데이터 반환
      return {
        currentPrompt: currentPrompt,
        duplicationResult: duplicationResult,
        promptList: data.prompts
      };
    }
    
    // 페이지에 데이터 표시 (테스트용)
    // displayPromptDataInPage(data); // 비활성화됨
    
    return {
      currentPrompt: currentPrompt || '',
      duplicationResult: { isDuplicate: false, matches: [] },
      promptList: data.prompts || []
    };
    
  } catch (error) {
    console.error('콘텐츠 스크립트에서 프롬프트 데이터 로드 오류:', error);
    return null;
  }
}

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 콘텐츠 스크립트에서 메시지 수신:', request);
  
  // 확장 프로그램 컨텍스트 검증
  if (!isExtensionContextValid()) {
    console.warn('⚠️ 확장 프로그램 컨텍스트가 무효화되어 메시지를 처리할 수 없습니다.');
    sendResponse({ success: false, error: 'Extension context invalidated' });
    return true;
  }
  
  // 비동기 응답을 위한 플래그
  let responseSent = false;
  
  const sendResponseSafe = (response) => {
    if (!responseSent) {
      responseSent = true;
      try {
        sendResponse(response);
      } catch (error) {
        console.error('❌ 응답 전송 실패:', error);
      }
    }
  };
  
  // ping 메시지 응답
  if (request.action === 'ping') {
    console.log('🏓 ping 응답');
    sendResponseSafe({ success: true, message: 'pong' });
    return true;
  }
  
  if (request.action === 'testPromptData') {
    console.log('🧪 프롬프트 데이터 테스트 요청 받음');
    
    testPromptDataLoading().then(data => {
      if (data) {
        sendResponseSafe({ 
          success: true, 
          message: '프롬프트 데이터 테스트 성공',
          data: data
        });
      } else {
        sendResponseSafe({ 
          success: false, 
          error: '프롬프트 데이터 로드 실패'
        });
      }
    }).catch(error => {
      console.error('프롬프트 데이터 테스트 실패:', error);
      sendResponseSafe({ 
        success: false, 
        error: error.message
      });
    });
    
    return true;
  }

  if (request.action === 'checkDuplication') {
    console.log('🔍 중복 검사 요청 받음');
    
    testPromptDataLoading().then(data => {
      if (data) {
        sendResponseSafe({ 
          success: true, 
          message: '중복 검사 완료',
          data: data
        });
      } else {
        sendResponseSafe({ 
          success: false, 
          error: '중복 검사 실패'
        });
      }
    }).catch(error => {
      console.error('중복 검사 실패:', error);
      sendResponseSafe({ 
        success: false, 
        error: error.message
      });
    });
    
    return true;
  }

  if (request.action === 'extractCurrentPrompt') {
    console.log('📝 현재 프롬프트 추출 요청 받음');
    
    try {
      const currentPrompt = getCurrentSoraPrompt();
      sendResponseSafe({ 
        success: true, 
        data: { currentPrompt: currentPrompt }
      });
    } catch (error) {
      console.error('프롬프트 추출 실패:', error);
      sendResponseSafe({ 
        success: false, 
        error: error.message
      });
    }
    
    return true;
  }

  if (request.action === 'setAutoMonitoring') {
    console.log('🔄 자동 모니터링 설정 요청 받음:', request.enabled);
    
    try {
      setAutoMonitoringEnabled(request.enabled);
      sendResponseSafe({ 
        success: true, 
        message: `자동 모니터링이 ${request.enabled ? '활성화' : '비활성화'}되었습니다.`
      });
    } catch (error) {
      console.error('자동 모니터링 설정 실패:', error);
      sendResponseSafe({ 
        success: false, 
        error: error.message
      });
    }
    
    return true;
  }

  if (request.action === 'getAutoMonitoringStatus') {
    console.log('📊 자동 모니터링 상태 요청 받음');
    
    try {
      sendResponseSafe({ 
        success: true, 
        data: { 
          isEnabled: isAutoMonitoringEnabled,
          isRunning: isGlobalIntervalRunning, // 전역 인터벌 상태 사용
          monitoringState: monitoringState,
          monitoringCounter: monitoringCounter,
          maxCounter: 1000,
          monitoringIntervalMs: MAIN_LOOP_INTERVAL // 실행주기 추가
        }
      });
    } catch (error) {
      console.error('자동 모니터링 상태 조회 실패:', error);
      sendResponseSafe({ 
        success: false, 
        error: error.message
      });
    }
    
    return true;
  }

  if (request.action === 'setMonitoringInterval') {
    console.log('⚙️ 실행주기 설정 요청 받음:', request.intervalMs);
    
    try {
      const newInterval = parseInt(request.intervalMs);
      
      // 실행주기를 항상 1초로 강제 설정
      setMonitoringInterval(newInterval);
      sendResponseSafe({ 
        success: true, 
        message: `실행주기가 1000ms (1초)로 강제 설정되었습니다. (요청: ${newInterval}ms 무시)`
      });
    } catch (error) {
      console.error('실행주기 설정 실패:', error);
      sendResponseSafe({ 
        success: false, 
        error: '실행주기는 항상 1초로 고정됩니다.'
      });
    }
    
    return true;
  }

  if (request.action === 'showLogOverlay') {
    console.log('📊 로그 오버레이 표시 요청 받음');
    
    try {
      createLogOverlay();
      sendResponseSafe({ 
        success: true, 
        message: '로그 오버레이가 표시되었습니다.'
      });
    } catch (error) {
      console.error('로그 오버레이 표시 실패:', error);
      sendResponseSafe({ 
        success: false, 
        error: error.message
      });
    }
    
    return true;
  }

  if (request.action === 'hideLogOverlay') {
    console.log('📊 로그 오버레이 숨김 요청 받음');
    
    try {
      removeLogOverlay();
      sendResponseSafe({ 
        success: true, 
        message: '로그 오버레이가 숨겨졌습니다.'
      });
    } catch (error) {
      console.error('로그 오버레이 숨김 실패:', error);
      sendResponseSafe({ 
        success: false, 
        error: error.message
      });
    }
    
    return true;
  }

  console.warn('⚠️ 처리되지 않은 액션:', request.action);
  sendResponseSafe({ success: false, error: '알 수 없는 액션: ' + request.action });
  return true;
});

// 지속적인 프롬프트 모니터링을 위한 전역 변수들
let monitoringState = 0;
let lastPrompt = '';
let currentPrompt = '';
let promptData = null;
let monitoringInterval = null; // 이 변수는 더 이상 사용되지 않음
let isAutoMonitoringEnabled = false; // 자동 모니터링 활성화 상태
let monitoringCounter = 0; // 모니터링 실행 횟수 카운터
let logOverlay = null; // 로그 오버레이 요소
let logContainer = null; // 로그 컨테이너
let autoSaveTimer = null; // 자동 저장 타이머
let monitoringIntervalMs = 1000; // 실행주기 (기본값: 1초)

// 전역 main setInterval 관리
let globalIntervalId = null;
let mainLoopTick = 0; // mainLoop 실행 카운터
let mainLoopState = 0; // mainLoop 상태 (0~4)
let isGlobalIntervalRunning = false; // main setInterval 실행 상태
let isPaused = false; // setInterval 일시 중지 상태
let activeTimeouts = []; // 활성 setTimeout들을 추적
const MAIN_LOOP_INTERVAL = 1000; // 1초 고정

// setTimeout 추적 헬퍼 함수
function trackedSetTimeout(callback, delay) {
  const timeoutId = setTimeout(() => {
    // 실행 후 배열에서 제거
    const index = activeTimeouts.indexOf(timeoutId);
    if (index > -1) {
      activeTimeouts.splice(index, 1);
    }
    callback();
  }, delay);
  
  // 배열에 추가
  activeTimeouts.push(timeoutId);
  return timeoutId;
}

function startMainLoop() {
  if (globalIntervalId) {
    clearInterval(globalIntervalId);
  }
  mainLoopTick = 0;
  createLogOverlay(); // ← 반드시 오버레이 생성!
  globalIntervalId = setInterval(mainLoop, MAIN_LOOP_INTERVAL);
  isGlobalIntervalRunning = true;
  console.log('▶️ main setInterval 시작 (1초 주기)');
  addLogMessage('▶️ main setInterval 시작 (1초 주기)');
}

function stopMainLoop() {
  addLogMessage('⏹️ mainLoop 중지 시작...');
  
  // main setInterval 정리
  if (globalIntervalId) {
    clearInterval(globalIntervalId);
    globalIntervalId = null;
    isGlobalIntervalRunning = false;
    console.log('⏹️ main setInterval 중지');
    addLogMessage('⏹️ main setInterval 중지');
  }
  
  // 모든 활성 setTimeout 정리
  if (activeTimeouts.length > 0) {
    addLogMessage(`🧹 ${activeTimeouts.length}개의 활성 setTimeout 정리 중...`);
    activeTimeouts.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    activeTimeouts = [];
    addLogMessage('✅ 모든 setTimeout 정리 완료');
  } else {
    addLogMessage('ℹ️ 정리할 활성 setTimeout이 없음');
  }
  
  // 상태 초기화
  mainLoopState = 0;
  mainLoopTick = 0;
  isPaused = false;
  
  addLogMessage('✅ mainLoop 완전 중지 및 모든 타이머 정리 완료');
}

function mainLoop() {
  // 일시 중지 상태면 실행 안함
  if (isPaused) return;

  switch (mainLoopState) {
    case 0: // 초기화 상태
      updateProgressStep(0);
      step1_ManageOverlay();
      mainLoopState = 1;
      addLogMessage('🔄 mainLoop 상태 변경: 0 → 1');
      break;

    case 1: // 카운터 업데이트 상태 (딜레이 적용)
      updateProgressStep(1);
      isPaused = true;
      addLogMessage('📊 Step 2 시작...');
      trackedSetTimeout(() => {
        mainLoopTick++;
        addLogMessage('✅ 카운터 업데이트 완료');
        trackedSetTimeout(() => {
          updateProgressStep(1, 'success');
          mainLoopState = 2;
          addLogMessage('🔄 상태 변경: 1→2');
          isPaused = false;
        }, MAIN_LOOP_INTERVAL);
      }, MAIN_LOOP_INTERVAL);
      break;

    case 2: // 프롬프트 모니터링 상태 (딜레이 적용)
      updateProgressStep(2);
      isPaused = true;
      addLogMessage('🔍 Step 3: 프롬프트 모니터링 시작...');
      trackedSetTimeout(() => {
        addLogMessage('📋 promptMonitoringStep() 호출 전 promptData 상태: ' + (promptData ? '존재함' : 'null'));
        promptMonitoringStep();
        addLogMessage('📋 promptMonitoringStep() 호출 후 promptData 상태: ' + (promptData ? '존재함' : 'null'));
        addLogMessage('✅ Step 3: 프롬프트 모니터링 완료');
        trackedSetTimeout(() => {
          updateProgressStep(2, 'success');
          mainLoopState = 3;
          addLogMessage('🔄 상태 변경: 2→3');
          isPaused = false;
        }, MAIN_LOOP_INTERVAL);
      }, MAIN_LOOP_INTERVAL);
      break;

    case 3: // 프롬프트 출력 상태 (딜레이 적용)
      updateProgressStep(3);
      isPaused = true;
      addLogMessage('📝 Step 4: 페이지 프롬프트 가져오기 시작...');
      trackedSetTimeout(() => {
        // 1. 현재 페이지 프롬프트 가져오기
        const currentPrompt = getCurrentSoraPrompt();
        if (currentPrompt) {
          const shortContent = currentPrompt.length > 50 ? currentPrompt.substring(0, 50) + '...' : currentPrompt;
          addLogMessage(`📋 현재 페이지 프롬프트: "${shortContent}"`);
          addLogMessage(`📊 프롬프트 길이: ${currentPrompt.length}자`);
        } else {
          addLogMessage('❌ 페이지에서 프롬프트를 찾을 수 없음');
        }
        
        // 2. data.json 프롬프트들 가져오기 및 중복 검사
        addLogMessage('📝 data.json 프롬프트들 가져오기 시작...');
        const dataUrl = getRuntimeURL('data.json');
        if (dataUrl) {
          fetch(dataUrl)
            .then(response => response.json())
            .then(data => {
              if (data && data.prompts) {
                // data.json 데이터를 전역 변수에 저장
                window.lastPromptData = data;
                
                addLogMessage(`📊 data.json에서 ${data.prompts.length}개의 프롬프트 로드됨`);
                data.prompts.forEach((prompt, index) => {
                  const shortContent = prompt.content.length > 50 ? prompt.content.substring(0, 50) + '...' : prompt.content;
                  addLogMessage(`📋 data.json 프롬프트 ${index + 1}: "${shortContent}"`);
                });
                
                // 3. 중복 검사 실행
                if (currentPrompt && data.prompts && Array.isArray(data.prompts)) {
                  addLogMessage('🔍 중복 검사 시작...');
                  addLogMessage(`📋 전달할 프롬프트 데이터: ${data.prompts.length}개`);
                  checkPromptDuplication(currentPrompt, data.prompts)
                    .then(result => {
                      // 중복 검사 결과를 전역 변수에 저장
                      window.lastDuplicationResult = result;
                      
                      if (result.isDuplicate && result.matches && Array.isArray(result.matches)) {
                        addLogMessage(`⚠️ 중복 프롬프트 발견: ${result.matches.length}개 매치`);
                        addLogMessage(`📈 최고 유사도: ${result.similarity.toFixed(1)}%`);
                        result.matches.forEach((match, index) => {
                          try {
                            const matchText = match.text || (match.prompt && match.prompt.content) || match.prompt || '';
                            const shortMatch = matchText.length > 50 ? matchText.substring(0, 50) + '...' : matchText;
                            addLogMessage(`   매치 ${index + 1}: "${shortMatch}" (${match.similarity.toFixed(1)}%)`);
                          } catch (error) {
                            addLogMessage(`   매치 ${index + 1}: [텍스트 추출 실패] (${match.similarity.toFixed(1)}%)`);
                          }
                        });
                      } else {
                        addLogMessage('✅ 중복 없음 - 새로운 프롬프트');
                      }
                    })
                    .catch(error => {
                      addLogMessage('❌ 중복 검사 실패: ' + error.message);
                    });
                } else {
                  addLogMessage('❌ 중복 검사 건너뜀: currentPrompt 또는 data.prompts가 유효하지 않음');
                  addLogMessage(`   currentPrompt: ${currentPrompt ? '존재함' : '없음'}`);
                  addLogMessage(`   data.prompts: ${data.prompts ? (Array.isArray(data.prompts) ? `${data.prompts.length}개` : '배열아님') : '없음'}`);
                }
              } else {
                addLogMessage('❌ data.json에 프롬프트가 없음');
              }
            })
            .catch(error => {
              addLogMessage('❌ data.json 로드 실패: ' + error.message);
            });
        } else {
          addLogMessage('❌ data.json URL을 가져올 수 없음');
        }
        
        trackedSetTimeout(() => {
          updateProgressStep(3, 'success');
          mainLoopState = 4;
          addLogMessage('🔄 상태 변경: 3→4');
          isPaused = false;
        }, MAIN_LOOP_INTERVAL);
      }, MAIN_LOOP_INTERVAL);
      break;

    case 4: // 중복 검사 후 이미지 생성 상태 (딜레이 적용)
      updateProgressStep(4);
      isPaused = true;
      addLogMessage('🎨 Step 5: 중복 검사 후 이미지 생성 처리 중...');
      trackedSetTimeout(() => {
        // 이미지 생성 중인지 확인
        const soraSpinner = document.querySelector('svg[viewBox="0 0 120 120"] circle[class*="animate-spin"]');
        const soraLoadingContainer = document.querySelector('div[class*="bg-token-bg-secondary"] svg[viewBox="0 0 120 120"]');
        const isImageGenerating = !!(soraSpinner || soraLoadingContainer);
        
        if (isImageGenerating) {
          addLogMessage('🔄 이미지 생성 중 - 단계 유지');
          updateProgressStep(4, 'running');
          // 이미지 생성이 완료될 때까지 이 단계에서 대기
          checkImageGenerationAndWait();
        } else {
          // 중복 검사 결과 확인
          if (window.lastDuplicationResult && !window.lastDuplicationResult.isDuplicate) {
            addLogMessage('✅ 중복 없음 - 이미지 생성 시작');
            generateImageFromPrompt();
            updateProgressStep(4, 'success');
          } else if (window.lastDuplicationResult && window.lastDuplicationResult.isDuplicate) {
            addLogMessage('⚠️ 중복 발견 - 이미지 생성 건너뜀');
            updateProgressStep(4, 'skip');
          } else {
            addLogMessage('❓ 중복 검사 결과 없음 - 이미지 생성 건너뜀');
            updateProgressStep(4, 'skip');
          }
          // 다음 단계로 진행
          mainLoopState = 5;
          addLogMessage('🔄 상태 변경: 4→5');
          isPaused = false;
        }
      }, MAIN_LOOP_INTERVAL);
      break;

    case 5: // 자동 저장 상태 (딜레이 적용)
      updateProgressStep(5);
      isPaused = true;
      addLogMessage('💾 Step 6: 자동 저장 확인 중...');
      trackedSetTimeout(() => {
        if (mainLoopTick % 30 === 0) {
          saveMonitoringSettings();
          addLogMessage('✅ Step 6: 자동 저장 완료 (30초마다)');
        } else {
          addLogMessage('⏭️ Step 6: 자동 저장 건너뜀 (30초 주기 아님)');
        }
        trackedSetTimeout(() => {
          updateProgressStep(5, 'success');
          mainLoopState = 6;
          addLogMessage('🔄 상태 변경: 5→6');
          isPaused = false;
        }, MAIN_LOOP_INTERVAL);
      }, MAIN_LOOP_INTERVAL);
      break;

    case 6: // 완료 처리 상태 (딜레이 적용)
      updateProgressStep(6);
      isPaused = true;
      addLogMessage('🎯 Step 7: mainLoop 완료 처리 중...');
      trackedSetTimeout(() => {
        step5_Complete(); // 완료 처리 함수 호출 (모든 setTimeout 정리)
        trackedSetTimeout(() => {
          mainLoopState = 1;
          addLogMessage('🔄 mainLoop 상태 변경: 6 → 1 (순환 완료, case 0 건너뜀)');
          isPaused = false;
        }, MAIN_LOOP_INTERVAL);
      }, MAIN_LOOP_INTERVAL);
      break;

    default:
      addLogMessage('❌ mainLoop 상태 오류: ' + mainLoopState);
      mainLoopState = 0;
      break;
  }
}

// Step 1: 오버레이 관리
function step1_ManageOverlay() {
  addLogMessage('🔄 Step 1: 오버레이 관리 시작...');
  removeLogOverlay();
  createLogOverlay();
  addLogMessage('✅ Step 1: 오버레이 관리 완료');
}

// Step 2: 카운터 업데이트
function step2_UpdateCounters() {
  addLogMessage('📊 Step 2: 카운터 업데이트 시작...');
  mainLoopTick++;
  addLogMessage(`✅ Step 2: 카운터 업데이트 완료 (${mainLoopTick})`);
}

// Step 3: 프롬프트 모니터링
function step3_MonitorPrompt() {
  addLogMessage('🔍 Step 3: 프롬프트 모니터링 시작...');
  promptMonitoringStep();
  addLogMessage('✅ Step 3: 프롬프트 모니터링 완료');
}

// Step 4: 자동 저장
function step4_AutoSave() {
  addLogMessage('💾 Step 4: 자동 저장 확인 중...');
  if (mainLoopTick % 30 === 0) {
    saveMonitoringSettings();
    addLogMessage('✅ Step 4: 자동 저장 완료 (30초마다)');
  } else {
    addLogMessage('⏭️ Step 4: 자동 저장 건너뜀 (30초 주기 아님)');
  }
}

// Step 5: 완료 처리
function step5_Complete() {
  addLogMessage('🎯 Step 5: mainLoop 완료 처리 중...');
  
  // 모든 활성 setTimeout 정리
  if (activeTimeouts.length > 0) {
    addLogMessage(`🧹 ${activeTimeouts.length}개의 활성 setTimeout 정리 중...`);
    activeTimeouts.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    activeTimeouts = [];
    addLogMessage('✅ 모든 setTimeout 정리 완료');
  }
  
  // mainLoop 상태 초기화
  mainLoopState = 0;
  mainLoopTick = 0;
  isPaused = false;
  
  addLogMessage('✅ Step 5: mainLoop 완료 및 모든 타이머 정리 완료');
}

// 오류 처리
function handleMainLoopError(error) {
  addLogMessage(`❌ mainLoop 오류: ${error.message}`);
  console.error('mainLoop 오류:', error);
}

// 이미지 생성 함수
function generateImageFromPrompt() {
  try {
    addLogMessage('🎨 이미지 생성 시작...');
    
    // 현재 페이지의 프롬프트 입력 필드 찾기
    const promptInput = document.querySelector('textarea[placeholder*="prompt"], textarea[placeholder*="Prompt"], input[placeholder*="prompt"], input[placeholder*="Prompt"]') ||
                       document.querySelector('textarea[name*="prompt"], input[name*="prompt"]') ||
                       document.querySelector('textarea, input[type="text"]');
    
    if (!promptInput) {
      addLogMessage('❌ 프롬프트 입력 필드를 찾을 수 없음');
      return;
    }
    
    // data.json에서 프롬프트 가져오기
    if (!window.lastPromptData || !window.lastPromptData.prompts || window.lastPromptData.prompts.length === 0) {
      addLogMessage('❌ data.json 프롬프트 데이터가 없음');
      return;
    }
    
    // 첫 번째 프롬프트 사용 (또는 랜덤 선택 가능)
    const dataPrompt = window.lastPromptData.prompts[0];
    const promptToUse = dataPrompt.content || dataPrompt || '';
    
    if (!promptToUse) {
      addLogMessage('❌ data.json에서 유효한 프롬프트를 찾을 수 없음');
      return;
    }
    
    addLogMessage(`📝 사용할 프롬프트: "${promptToUse.substring(0, 50)}..."`);
    
    addLogMessage(`📝 프롬프트 입력 필드 발견: ${promptInput.tagName}`);
    
    // 기존 프롬프트 완전 제거
    promptInput.value = '';
    promptInput.dispatchEvent(new Event('input', { bubbles: true }));
    promptInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    // 1단계: 프롬프트 입력 및 확인
    setTimeout(() => {
      addLogMessage('📝 1단계: 프롬프트 입력 시작...');
      promptInput.value = promptToUse;
      promptInput.dispatchEvent(new Event('input', { bubbles: true }));
      promptInput.dispatchEvent(new Event('change', { bubbles: true }));
      
      // 입력 확인
      setTimeout(() => {
        const actualValue = promptInput.value;
        if (actualValue === promptToUse) {
          addLogMessage('✅ 1단계 완료: 프롬프트 입력 성공');
          addLogMessage(`   입력된 내용: "${actualValue.substring(0, 50)}..."`);
          
          // 2단계: 이미지 생성 버튼 찾기 및 클릭
          addLogMessage('🔍 2단계: 이미지 생성 버튼 검색 시작...');
          
          // 다양한 선택자로 버튼 찾기
          let generateButton = null;
          const buttonSelectors = [
            // Sora 특화 선택자
            'button[data-state="closed"]',
            'button[data-disabled="false"]',
            'button .sr-only:contains("Create image")',
            'button svg[fill="currentColor"]',
            'button[class*="bg-token-bg-inverse"]',
            'button[class*="rounded-full"]',
            // 일반적인 선택자
            'button[type="submit"]',
            'button:contains("Generate")',
            'button:contains("Create")',
            'button:contains("생성")',
            'button[aria-label*="generate"]',
            'button[aria-label*="create"]',
            'button[data-testid*="generate"]',
            'button[data-testid*="create"]',
            'button:not([disabled])'
          ];
          
          // Sora 특화 버튼 먼저 찾기
          let soraButton = document.querySelector('button[data-state="closed"][data-disabled="false"]');
          if (soraButton && soraButton.offsetParent !== null) {
            generateButton = soraButton;
            addLogMessage(`🎯 2단계: Sora 버튼 발견: ${soraButton.querySelector('.sr-only')?.textContent || 'Create image'}`);
          } else {
            // 일반적인 선택자로 찾기
            for (const selector of buttonSelectors) {
              try {
                const button = document.querySelector(selector);
                if (button && button.offsetParent !== null) { // 보이는 버튼인지 확인
                  generateButton = button;
                  addLogMessage(`🎯 2단계: 버튼 발견 (${selector}): ${button.textContent || button.innerText || button.ariaLabel || '텍스트 없음'}`);
                  break;
                }
              } catch (e) {
                // 선택자 오류 무시하고 계속 진행
              }
            }
          }
          
          if (generateButton) {
            addLogMessage('🖱️ 2단계: 이미지 생성 버튼 클릭 시도...');
            
            // 클릭 전 상태 기록
            const beforeClickState = {
              disabled: generateButton.disabled,
              text: generateButton.textContent || generateButton.innerText || '텍스트 없음',
              visible: generateButton.offsetParent !== null
            };
            addLogMessage(`📊 2단계: 클릭 전 버튼 상태 - 비활성화=${beforeClickState.disabled}, 텍스트="${beforeClickState.text}"`);
            
            try {
              // 클릭 이벤트 발생
              generateButton.click();
              addLogMessage('🚀 2단계: 이미지 생성 버튼 클릭 완료');
              
              // 이미지 생성 진행률 모니터링 시작
              startImageGenerationProgress();
              
              // 클릭 성공 확인
              setTimeout(() => {
                const afterClickState = {
                  disabled: generateButton.disabled,
                  text: generateButton.textContent || generateButton.innerText || '텍스트 없음',
                  visible: generateButton.offsetParent !== null
                };
                
                addLogMessage('📊 2단계: 클릭 성공 여부 확인...');
                addLogMessage(`   비활성화: ${beforeClickState.disabled} → ${afterClickState.disabled}`);
                addLogMessage(`   텍스트: "${beforeClickState.text}" → "${afterClickState.text}"`);
                
                // 클릭 성공 여부 판단
                if (afterClickState.disabled && !beforeClickState.disabled) {
                  addLogMessage('✅ 2단계 완료: 클릭 성공! - 버튼이 비활성화됨');
                } else if (afterClickState.text !== beforeClickState.text) {
                  addLogMessage('✅ 2단계 완료: 클릭 성공! - 버튼 텍스트가 변경됨');
                } else if (!afterClickState.visible && beforeClickState.visible) {
                  addLogMessage('✅ 2단계 완료: 클릭 성공! - 버튼이 사라짐');
                } else {
                  addLogMessage('⚠️ 2단계: 클릭 효과 불확실 - 추가 확인 필요');
                }
                
                // 최종 결과 요약
                addLogMessage('🎯 이미지 생성 프로세스 완료 요약:');
                addLogMessage('   1단계: 프롬프트 입력 ✅');
                addLogMessage('   2단계: 버튼 클릭 ✅');
                
              }, 200);
              
            } catch (error) {
              addLogMessage(`❌ 2단계 실패: 버튼 클릭 오류 - ${error.message}`);
            }
          } else {
            addLogMessage('❌ 2단계 실패: 이미지 생성 버튼을 찾을 수 없음');
            addLogMessage('🔍 페이지의 모든 버튼 목록:');
            const allButtons = document.querySelectorAll('button');
            allButtons.forEach((btn, index) => {
              if (index < 10) { // 처음 10개만 출력
                const btnText = btn.textContent || btn.innerText || btn.ariaLabel || '텍스트 없음';
                const btnVisible = btn.offsetParent !== null ? '보임' : '숨김';
                addLogMessage(`   ${index + 1}. "${btnText}" (${btnVisible})`);
              }
            });
          }
        } else {
          addLogMessage('❌ 1단계 실패: 프롬프트 입력 실패');
          addLogMessage(`   예상: "${promptToUse.substring(0, 50)}..."`);
          addLogMessage(`   실제: "${actualValue.substring(0, 50)}..."`);
        }
      }, 5000); // 프롬프트 입력 후 5초 대기
      
    }, 100);
    
  } catch (error) {
    addLogMessage(`❌ 이미지 생성 오류: ${error.message}`);
    console.error('이미지 생성 오류:', error);
  }
}

// 이미지 생성 진행률 모니터링 변수들
let imageGenerationProgress = 0;
let imageGenerationTimer = null;
let imageGenerationStartTime = null;
let imageGenerationDuration = 60; // 기본 60초
let soraSpinnerDetected = false;
let lastSpinnerState = false;

// 이미지 생성 진행률 모니터링 시작
function startImageGenerationProgress() {
  // 기존 타이머 정리
  if (imageGenerationTimer) {
    clearInterval(imageGenerationTimer);
  }
  
  // 초기화
  imageGenerationProgress = 0;
  imageGenerationStartTime = Date.now();
  soraSpinnerDetected = false;
  lastSpinnerState = false;
  
  addLogMessage('🎨 이미지 생성 진행률 모니터링 시작...');
  
  // 진행률 UI 생성
  createImageProgressUI();
  
  // 1초마다 진행률 업데이트
  imageGenerationTimer = setInterval(() => {
    imageGenerationProgress += (100 / imageGenerationDuration);
    
    if (imageGenerationProgress >= 100) {
      imageGenerationProgress = 100;
      stopImageGenerationProgress('완료');
      return;
    }
    
    // 진행률 UI 업데이트
    updateImageProgressUI();
    
    // 로그 업데이트 (10초마다)
    if (Math.floor(imageGenerationProgress) % 10 === 0) {
      const remainingTime = Math.ceil(imageGenerationDuration - (imageGenerationProgress / 100 * imageGenerationDuration));
      addLogMessage(`🎨 이미지 생성 진행률: ${Math.floor(imageGenerationProgress)}% (남은 시간: ${remainingTime}초)`);
    }
    
    // Sora 스피너 상태 확인
    checkSoraSpinnerState();
    
    // 이미지 생성 완료 감지
    checkImageGenerationComplete();
    
  }, 1000);
}

// 이미지 생성 진행률 모니터링 중지
function stopImageGenerationProgress(reason = '중지') {
  if (imageGenerationTimer) {
    clearInterval(imageGenerationTimer);
    imageGenerationTimer = null;
  }
  
  addLogMessage(`🎨 이미지 생성 진행률 모니터링 ${reason}`);
  removeImageProgressUI();
}

// 이미지 생성 완료 감지
function checkImageGenerationComplete() {
  // Sora 특화 로딩 스피너 감지
  const soraSpinner = document.querySelector('svg[viewBox="0 0 120 120"] circle[class*="animate-spin"]');
  const soraLoadingContainer = document.querySelector('div[class*="bg-token-bg-secondary"] svg[viewBox="0 0 120 120"]');
  
  // 이미지 생성 완료를 감지하는 여러 방법
  const completionIndicators = [
    // Sora 로딩 스피너가 사라짐
    !soraSpinner && !soraLoadingContainer,
    // 일반적인 로딩 스피너가 사라짐
    !document.querySelector('[class*="loading"], [class*="spinner"], [class*="progress"]'),
    // 버튼이 다시 활성화됨
    document.querySelector('button[data-state="closed"][data-disabled="false"]'),
    // 새로운 이미지가 나타남
    document.querySelector('img[src*="generated"], img[src*="output"]'),
    // 완료 메시지가 나타남
    document.querySelector('[class*="complete"], [class*="success"], [class*="done"]'),
    // Sora 그리드에 실제 이미지가 나타남
    document.querySelector('div[class*="grid-cols-4"] img[src]')
  ];
  
  // 완료 조건 확인
  const isComplete = completionIndicators.some(indicator => indicator);
  
  if (isComplete) {
    stopImageGenerationProgress('완료 감지됨');
    addLogMessage('✅ 이미지 생성 완료!');
  }
  
  // Sora 스피너 상태 로깅 (디버깅용)
  if (soraSpinner) {
    addLogMessage('🔄 Sora 이미지 생성 진행 중... (스피너 감지됨)');
  }
}

// 이미지 생성 완료 대기 함수
function checkImageGenerationAndWait() {
  const checkInterval = setInterval(() => {
    // Sora 스피너 상태 확인
    const soraSpinner = document.querySelector('svg[viewBox="0 0 120 120"] circle[class*="animate-spin"]');
    const soraLoadingContainer = document.querySelector('div[class*="bg-token-bg-secondary"] svg[viewBox="0 0 120 120"]');
    const isImageGenerating = !!(soraSpinner || soraLoadingContainer);
    
    if (!isImageGenerating) {
      // 이미지 생성 완료
      clearInterval(checkInterval);
      addLogMessage('✅ 이미지 생성 완료 - 다음 단계로 진행');
      updateProgressStep(4, 'success');
      mainLoopState = 5;
      addLogMessage('🔄 상태 변경: 4→5');
      isPaused = false;
    } else {
      // 이미지 생성 중 - 진행률 업데이트
      addLogMessage('🔄 이미지 생성 진행 중... (단계 유지)');
      updateProgressStep(4, 'running');
    }
  }, 2000); // 2초마다 확인
  
  // 최대 대기 시간 설정 (5분)
  setTimeout(() => {
    clearInterval(checkInterval);
    addLogMessage('⏰ 이미지 생성 시간 초과 - 다음 단계로 진행');
    updateProgressStep(4, 'warning');
    mainLoopState = 5;
    addLogMessage('🔄 상태 변경: 4→5');
    isPaused = false;
  }, 300000); // 5분
}

// Sora 스피너 상태 확인
function checkSoraSpinnerState() {
  // Sora 특화 로딩 스피너 감지
  const soraSpinner = document.querySelector('svg[viewBox="0 0 120 120"] circle[class*="animate-spin"]');
  const soraLoadingContainer = document.querySelector('div[class*="bg-token-bg-secondary"] svg[viewBox="0 0 120 120"]');
  
  const currentSpinnerState = !!(soraSpinner || soraLoadingContainer);
  
  // 스피너 상태 변경 감지
  if (currentSpinnerState !== lastSpinnerState) {
    if (currentSpinnerState) {
      // 스피너가 나타남
      soraSpinnerDetected = true;
      addLogMessage('🔄 Sora 이미지 생성 스피너 감지됨 - 생성 시작!');
      
      // 진행률을 더 빠르게 증가 (스피너가 실제로 돌고 있음)
      imageGenerationProgress = Math.min(imageGenerationProgress + 5, 95);
      updateImageProgressUI();
      
    } else {
      // 스피너가 사라짐
      addLogMessage('✅ Sora 이미지 생성 스피너 사라짐 - 생성 완료!');
      imageGenerationProgress = 100;
      updateImageProgressUI();
    }
    
    lastSpinnerState = currentSpinnerState;
  }
  
  // 스피너가 계속 돌고 있는 동안 진행률 조정
  if (currentSpinnerState && soraSpinnerDetected) {
    // 스피너가 돌고 있으면 진행률을 더 빠르게 증가
    const timeElapsed = (Date.now() - imageGenerationStartTime) / 1000;
    const estimatedProgress = Math.min((timeElapsed / 30) * 100, 95); // 30초 기준
    
    if (estimatedProgress > imageGenerationProgress) {
      imageGenerationProgress = estimatedProgress;
      updateImageProgressUI();
    }
  }
}

// 이미지 진행률 UI 생성
function createImageProgressUI() {
  // 기존 UI 제거
  removeImageProgressUI();
  
  const progressContainer = document.createElement('div');
  progressContainer.id = 'image-progress-container';
  progressContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 300px;
    background: rgba(0, 0, 0, 0.9);
    border: 2px solid #00ff00;
    border-radius: 10px;
    padding: 15px;
    z-index: 10000;
    font-family: Arial, sans-serif;
    color: white;
  `;
  
  progressContainer.innerHTML = `
    <div style="margin-bottom: 10px; font-weight: bold; color: #00ff00;">🎨 이미지 생성 진행률</div>
    <div style="margin-bottom: 10px;">
      <div style="width: 100%; height: 20px; background: #333; border-radius: 10px; overflow: hidden;">
        <div id="image-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, #00ff00, #00cc00); transition: width 0.3s;"></div>
      </div>
    </div>
    <div id="image-progress-text" style="text-align: center; font-size: 14px;">0%</div>
    <div id="image-progress-time" style="text-align: center; font-size: 12px; color: #ccc;">남은 시간: 60초</div>
    <div id="image-progress-status" style="text-align: center; font-size: 11px; color: #ffaa00; margin-top: 5px;">대기 중...</div>
  `;
  
  document.body.appendChild(progressContainer);
}

// 이미지 진행률 UI 업데이트
function updateImageProgressUI() {
  const progressBar = document.getElementById('image-progress-bar');
  const progressText = document.getElementById('image-progress-text');
  const progressTime = document.getElementById('image-progress-time');
  const progressStatus = document.getElementById('image-progress-status');
  
  if (progressBar && progressText && progressTime && progressStatus) {
    const percentage = Math.min(imageGenerationProgress, 100);
    const remainingTime = Math.ceil(imageGenerationDuration - (percentage / 100 * imageGenerationDuration));
    
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${Math.floor(percentage)}%`;
    progressTime.textContent = `남은 시간: ${remainingTime}초`;
    
    // 상태 메시지 업데이트
    if (soraSpinnerDetected) {
      if (lastSpinnerState) {
        progressStatus.textContent = '🔄 Sora 스피너 감지됨 - 생성 중...';
        progressStatus.style.color = '#00ff00';
      } else {
        progressStatus.textContent = '✅ Sora 스피너 완료 - 생성 완료!';
        progressStatus.style.color = '#00ff00';
      }
    } else {
      progressStatus.textContent = '⏳ Sora 스피너 대기 중...';
      progressStatus.style.color = '#ffaa00';
    }
  }
}

// 이미지 진행률 UI 제거
function removeImageProgressUI() {
  const progressContainer = document.getElementById('image-progress-container');
  if (progressContainer) {
    progressContainer.remove();
  }
}

// 프롬프트 모니터링 로직 (기존 startPromptMonitoring의 내용 분리)
function promptMonitoringStep() {
  // 기존 startPromptMonitoring의 1회 실행 내용을 여기에 옮김
  // (monitoringState, currentPrompt 등은 전역 상태로 유지)
  monitoringCounter++;
  const intervalSeconds = MAIN_LOOP_INTERVAL / 1000;
  const logMessage = `⏰ mainLoop #${monitoringCounter}/1000 (${intervalSeconds}초 주기) - ${new Date().toLocaleTimeString()}`;
  addLogMessage(logMessage);

  // 1000회 실행 후 초기화
  if (monitoringCounter >= 1000) {
    addLogMessage('🔄 1000회 실행 완료 - 모니터링 초기화');
    monitoringCounter = 0;
    monitoringState = 0;
    promptData = null;
  }

  // 모니터링 상태 분기 (기존 startPromptMonitoring의 switch문)
  switch (monitoringState) {
    case 0:
      addLogMessage(`📋 상태 0: 초기화 중... (${monitoringCounter}/1000)`);
      if (isExtensionContextValid()) {
        addLogMessage(`🔄 프롬프트 모니터링 시작... (${monitoringCounter}/1000)`);
        monitoringState = 1;
      } else {
        addLogMessage('❌ 확장 프로그램 컨텍스트가 무효화됨');
      }
      break;
    case 1:
      addLogMessage(`📋 상태 1: 데이터 로드 시도 중... (${monitoringCounter}/1000)`);
      addLogMessage(`🔍 현재 promptData 상태: ${promptData ? '존재함' : 'null'}`);
      if (!promptData) {
        const dataUrl = getRuntimeURL('data.json');
        addLogMessage(`🔗 데이터 URL: ${dataUrl}`);
        if (dataUrl) {
          addLogMessage('📥 프롬프트 데이터 로드 중...');
          addLogMessage('🔄 fetch 시작...');
          fetch(dataUrl)
            .then(response => {
              addLogMessage(`📡 HTTP 상태: ${response.status} ${response.statusText}`);
              if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
              }
              addLogMessage('🔄 response.json() 호출...');
              return response.json();
            })
            .then(data => {
              addLogMessage('🔄 JSON 파싱 완료, promptData에 저장 중...');
              promptData = data;
              addLogMessage('✅ 프롬프트 데이터 로드 완료');
              addLogMessage(`📊 로드된 데이터: ${JSON.stringify(data).substring(0, 100)}...`);
              addLogMessage(`🔍 저장 후 promptData 상태: ${promptData ? '존재함' : 'null'}`);
              monitoringState = 2;
            })
            .catch(error => {
              addLogMessage('❌ 프롬프트 데이터 로드 실패: ' + error.message);
              addLogMessage(`🔍 에러 상세: ${error.stack ? error.stack.substring(0, 200) : '스택 없음'}`);
              monitoringState = 0;
            });
        } else {
          addLogMessage('❌ 데이터 URL을 가져올 수 없음');
          monitoringState = 0;
        }
      } else {
        addLogMessage('✅ 프롬프트 데이터가 이미 로드됨');
        monitoringState = 2;
      }
      break;
    case 2:
      addLogMessage(`📋 상태 2: 프롬프트 변경 감지 중... (${monitoringCounter}/1000)`);
      currentPrompt = getCurrentSoraPrompt();
      if (currentPrompt && currentPrompt !== lastPrompt) {
        const shortPrompt = currentPrompt.length > 20 ? currentPrompt.substring(0, 20) + '...' : currentPrompt;
        addLogMessage(`🔄 새로운 프롬프트 감지 (${monitoringCounter}/1000): "${shortPrompt}"`);
        lastPrompt = currentPrompt;
        monitoringState = 3;
      } else {
        addLogMessage(`👀 프롬프트 변경 없음 (${monitoringCounter}/1000)`);
      }
      break;
    case 3:
      addLogMessage(`📋 상태 3: 중복 검사 실행 중... (${monitoringCounter}/1000)`);
      if (currentPrompt && promptData && promptData.prompts) {
        const shortPrompt = currentPrompt.length > 20 ? currentPrompt.substring(0, 20) + '...' : currentPrompt;
        addLogMessage(`🔍 프롬프트 중복 검사 시작 (${monitoringCounter}/1000)`);
        addLogMessage(`📝 검사 대상: "${shortPrompt}"`);
        addLogMessage(`📊 비교 대상: ${promptData.prompts.length}개 프롬프트`);
        
        checkPromptDuplication(currentPrompt, promptData.prompts)
          .then(result => {
            if (result.isDuplicate) {
              addLogMessage(`⚠️ 중복 프롬프트 발견: ${result.matches.length}개 매치`);
              addLogMessage(`📈 최고 유사도: ${result.similarity.toFixed(1)}%`);
              // 매치된 프롬프트들도 20자로 제한하여 표시
              result.matches.forEach((match, index) => {
                const shortMatch = match.text.length > 20 ? match.text.substring(0, 20) + '...' : match.text;
                addLogMessage(`   매치 ${index + 1}: "${shortMatch}" (${match.similarity.toFixed(1)}%)`);
              });
              displayDuplicateWarning(result);
            } else {
              addLogMessage('✅ 중복 없음 - 새로운 프롬프트');
            }
            monitoringState = 2;
          })
          .catch(error => {
            addLogMessage('❌ 중복 검사 실패: ' + error.message);
            monitoringState = 2;
          });
      } else {
        addLogMessage('❌ 중복 검사를 위한 데이터가 부족함');
        monitoringState = 2;
      }
      break;
  }
}

// 자동 모니터링 설정 함수
function setAutoMonitoringEnabled(enabled) {
  isAutoMonitoringEnabled = enabled;
  console.log(`🔄 자동 모니터링 ${enabled ? '활성화' : '비활성화'}`);
  console.log(`⏰ setInterval ${enabled ? '시작' : '중지'} 예정`);
  
  const intervalSeconds = monitoringIntervalMs / 1000;
  addLogMessage(`🔄 자동 모니터링 ${enabled ? '활성화' : '비활성화'} (${intervalSeconds}초 주기)`);
  addLogMessage(`⏰ setInterval ${enabled ? '시작' : '중지'} 예정`);
  
  if (enabled) {
    createLogOverlay(); // 로그 오버레이 생성
    startMainLoop(); // 메인 루프 시작
    startAutoSaveTimer(); // 자동 저장 타이머 시작
  } else {
    stopMainLoop(); // 메인 루프 중지
    stopAutoSaveTimer(); // 자동 저장 타이머 중지
  }
  
  // 설정을 storage에 자동 저장
  saveMonitoringSettings();
}

// 모니터링 설정 자동 저장 함수
function saveMonitoringSettings() {
  if (isExtensionContextValid()) {
    // 실행주기를 항상 1초로 강제 설정
    monitoringIntervalMs = 1000;
    
    const settings = {
      autoMonitoringEnabled: isAutoMonitoringEnabled,
      monitoringIntervalMs: 1000, // 항상 1초로 저장
      lastSaved: new Date().toISOString(),
      monitoringCounter: monitoringCounter,
      monitoringState: monitoringState
    };
    
    chrome.storage.local.set(settings, () => {
      if (chrome.runtime.lastError) {
        console.error('❌ 설정 저장 실패:', chrome.runtime.lastError);
        addLogMessage('❌ 설정 저장 실패: ' + chrome.runtime.lastError.message);
      } else {
        console.log('💾 설정이 자동 저장됨:', settings);
        addLogMessage('💾 설정이 자동 저장됨');
      }
    });
  } else {
    console.warn('⚠️ 확장 프로그램 컨텍스트가 무효화되어 설정을 저장할 수 없습니다.');
    addLogMessage('⚠️ 설정 저장 실패: 확장 프로그램 컨텍스트 무효화');
  }
}

// 자동 저장 타이머 시작 함수
function startAutoSaveTimer() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
  }
  
  // 30초마다 자동 저장
  autoSaveTimer = setInterval(() => {
    if (isAutoMonitoringEnabled) {
      console.log('🔄 자동 저장 실행 중...');
      saveMonitoringSettings();
    }
  }, 30000); // 30초
  
  console.log('⏰ 자동 저장 타이머 시작 (30초 주기)');
  addLogMessage('⏰ 자동 저장 타이머 시작 (30초 주기)');
}

// 자동 저장 타이머 중지 함수
function stopAutoSaveTimer() {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer);
    autoSaveTimer = null;
    console.log('⏹️ 자동 저장 타이머 중지');
    addLogMessage('⏹️ 자동 저장 타이머 중지');
  }
}

// 실행주기 설정 함수 (1초로 고정)
function setMonitoringInterval(intervalMs) {
  // 실행주기를 항상 1초로 강제 설정
  const forcedInterval = 1000;
  const oldInterval = monitoringIntervalMs;
  monitoringIntervalMs = forcedInterval;
  
  console.log(`⚙️ 실행주기 강제 설정: ${oldInterval}ms → ${forcedInterval}ms (요청: ${intervalMs}ms 무시)`);
  addLogMessage(`⚙️ 실행주기 강제 설정: ${oldInterval}ms → ${forcedInterval}ms`);
  
  // 설정 자동 저장
  saveMonitoringSettings();
  
  // 모니터링이 실행 중이면 재시작
  if (isAutoMonitoringEnabled && globalIntervalId) { // 전역 인터벌 상태 사용
    console.log('🔄 실행주기 변경으로 모니터링 재시작');
    addLogMessage('🔄 실행주기 변경으로 모니터링 재시작');
    stopMainLoop(); // 메인 루프 중지
    startMainLoop(); // 메인 루프 시작
  }
}

// 실행주기 가져오기 함수
function getMonitoringInterval() {
  return monitoringIntervalMs;
}

// 자동 모니터링 설정 로드 함수
function loadAutoMonitoringSetting() {
  if (isExtensionContextValid()) {
    chrome.storage.local.get([
      'autoMonitoringEnabled', 
      'monitoringIntervalMs', // 실행주기 추가
      'monitoringCounter', 
      'monitoringState', 
      'lastSaved'
    ], (result) => {
      console.log('📊 저장된 설정 로드:', result);
      
      // 자동 모니터링 설정 복원
      const enabled = result.autoMonitoringEnabled !== undefined ? result.autoMonitoringEnabled : true;
      
      // 실행주기를 무조건 1초로 설정 (5초 문제 해결)
      monitoringIntervalMs = 1000; // 강제로 1초 설정
      console.log('📊 실행주기 강제 설정: 1000ms (1초)');
      addLogMessage('📊 실행주기 강제 설정: 1000ms (1초)');
      
      // 저장된 설정이 1초가 아니면 경고
      if (result.monitoringIntervalMs !== undefined && result.monitoringIntervalMs !== 1000) {
        console.log('⚠️ 저장된 실행주기가 1초가 아님:', result.monitoringIntervalMs + 'ms');
        addLogMessage(`⚠️ 저장된 실행주기 무시: ${result.monitoringIntervalMs}ms → 1000ms`);
      }
      
      // 카운터와 상태 복원 (선택적)
      if (result.monitoringCounter !== undefined) {
        monitoringCounter = result.monitoringCounter;
        console.log('📊 카운터 복원:', monitoringCounter);
      }
      
      if (result.monitoringState !== undefined) {
        monitoringState = result.monitoringState;
        console.log('📊 상태 복원:', monitoringState);
      }
      
      if (result.lastSaved) {
        const lastSaved = new Date(result.lastSaved);
        console.log('📊 마지막 저장 시간:', lastSaved.toLocaleString());
        addLogMessage(`📊 마지막 저장: ${lastSaved.toLocaleString()}`);
      }
      
      console.log('📊 자동 모니터링 설정 복원:', enabled);
      
      // 실행주기를 명시적으로 1초로 설정
      if (monitoringIntervalMs !== 1000) {
        console.log('⚙️ 실행주기를 1초로 강제 설정');
        addLogMessage('⚙️ 실행주기를 1초로 강제 설정');
        monitoringIntervalMs = 1000;
      }
      
      setAutoMonitoringEnabled(enabled);
    });
  } else {
    console.log('⚠️ 확장 프로그램 컨텍스트가 무효화되어 기본값(true)으로 설정');
    setAutoMonitoringEnabled(true);
  }
}

// 모니터링 중지 함수
function stopPromptMonitoring() {
  // 이 함수는 더 이상 사용되지 않으며, 메인 루프에서 처리
  // 메인 루프가 중지되면 모니터링도 중지됨
  monitoringState = 0;
  monitoringCounter = 0; // 카운터 초기화
  const counterResetMessage = '🔄 카운터 초기화됨';
  console.log(counterResetMessage);
  addLogMessage(counterResetMessage);
  
  // 마지막 설정 저장
  saveMonitoringSettings();
}

// 중복 경고 표시 함수
function displayDuplicateWarning(result) {
  // 페이지에 중복 경고 표시
  const warningDiv = document.createElement('div');
  warningDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ff6b6b;
    color: white;
    padding: 15px;
    border-radius: 8px;
    z-index: 10000;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-family: Arial, sans-serif;
  `;
  
  // 매치된 프롬프트들을 20자로 제한하여 표시
  const matchList = result.matches.map((match, index) => {
    const shortText = match.text.length > 20 ? match.text.substring(0, 20) + '...' : match.text;
    return `${index + 1}. "${shortText}" (${match.similarity.toFixed(1)}%)`;
  }).join('<br>');
  
  warningDiv.innerHTML = `
    <h4>⚠️ 중복 프롬프트 발견</h4>
    <p>${result.matches.length}개의 유사한 프롬프트가 있습니다.</p>
    <p>최고 유사도: ${result.similarity.toFixed(1)}%</p>
    <div style="font-size: 11px; margin: 10px 0; max-height: 100px; overflow-y: auto;">
      ${matchList}
    </div>
    <button onclick="this.parentElement.remove()" style="background: white; color: #ff6b6b; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">닫기</button>
  `;
  
  document.body.appendChild(warningDiv);
  
  // 10초 후 자동 제거
  setTimeout(() => {
    if (warningDiv.parentElement) {
      warningDiv.remove();
    }
  }, 10000);
}

// 콘텐츠 스크립트 로드 확인 로그
console.log('🚀 콘텐츠 스크립트 로드됨 - content.js');

// 페이지 로드 시 자동 오버레이 생성 및 모니터링 설정 로드
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      if (isExtensionContextValid()) {
        console.log('✅ 콘텐츠 스크립트 로드 완료');
        
        // 실행주기를 1초로 강제 설정
        monitoringIntervalMs = 1000;
        console.log('⚙️ 실행주기를 1초로 설정');
        
        loadAutoMonitoringSetting(); // 자동 모니터링 설정 로드
        
        // 3초 후 자동으로 로그 오버레이 생성 (테스트용)
        setTimeout(() => {
          if (!logOverlay) {
            console.log('🔧 테스트용 로그 오버레이 자동 생성');
            createLogOverlay();
            addLogMessage('🔧 테스트용으로 자동 생성된 로그 오버레이입니다.');
            addLogMessage('📊 자동 모니터링 상태를 확인하세요.');
            addLogMessage('⚙️ 실행주기: 1초');
          }
        }, 3000);
      } else {
        console.warn('⚠️ 확장 프로그램 컨텍스트가 무효화되어 초기화를 건너뜁니다.');
      }
    }, 1000);
  });
} else {
  setTimeout(() => {
    if (isExtensionContextValid()) {
      console.log('✅ 콘텐츠 스크립트 로드 완료');
      
      // 실행주기를 1초로 강제 설정
      monitoringIntervalMs = 1000;
      console.log('⚙️ 실행주기를 1초로 설정');
      
      loadAutoMonitoringSetting(); // 자동 모니터링 설정 로드
      
      // 3초 후 자동으로 로그 오버레이 생성 (테스트용)
      setTimeout(() => {
        if (!logOverlay) {
          console.log('🔧 테스트용 로그 오버레이 자동 생성');
          createLogOverlay();
          addLogMessage('🔧 테스트용으로 자동 생성된 로그 오버레이입니다.');
          addLogMessage('📊 자동 모니터링 상태를 확인하세요.');
          addLogMessage('⚙️ 실행주기: 1초');
        }
      }, 3000);
    } else {
      console.warn('⚠️ 확장 프로그램 컨텍스트가 무효화되어 초기화를 건너뜁니다.');
    }
  }, 1000);
} 

// 로그 오버레이 생성 함수
function createLogOverlay() {
  if (logOverlay) {
    return; // 이미 존재하면 생성하지 않음
  }

  logOverlay = document.createElement('div');
  logOverlay.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    width: 400px;
    height: 600px;
    background: rgba(0, 0, 0, 0.9);
    color: #00ff00;
    font-family: 'Courier New', monospace;
    font-size: 12px;
    padding: 15px;
    border-radius: 10px;
    z-index: 10000;
    border: 2px solid #00ff00;
    box-shadow: 0 4px 20px rgba(0, 255, 0, 0.3);
    display: flex;
    flex-direction: column;
  `;



  // 자동 모드 버튼 추가
  const autoModeButton = document.createElement('button');
  autoModeButton.id = 'auto-mode-button';
  // 실제 상태에 따라 텍스트/색상 설정
  if (isGlobalIntervalRunning) {
    autoModeButton.textContent = '🔄 자동 모드 ON';
    autoModeButton.style.background = '#28a745';
  } else {
    autoModeButton.textContent = '🔄 자동 모드 OFF';
    autoModeButton.style.background = '#dc3545';
  }
  autoModeButton.style.cssText += `
    width: 100%;
    padding: 8px;
    margin-bottom: 10px;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 12px;
    font-weight: bold;
  `;
  
  autoModeButton.addEventListener('click', () => {
    if (isGlobalIntervalRunning) {
      stopMainLoop();
      autoModeButton.textContent = '🔄 자동 모드 OFF';
      autoModeButton.style.background = '#dc3545';
      addLogMessage('⏹️ 자동 모드 중지됨');
    } else {
      startMainLoop();
      autoModeButton.textContent = '🔄 자동 모드 ON';
      autoModeButton.style.background = '#28a745';
      addLogMessage('▶️ 자동 모드 시작됨');
    }
  });

  logContainer = document.createElement('div');
  logContainer.style.cssText = `
    flex: 1;
    overflow-y: auto;
    margin-bottom: 10px;
    border: 1px solid #00ff00;
    padding: 10px;
    background: rgba(0, 0, 0, 0.5);
  `;

  // 진행 단계 표시 UI 추가
  const progressContainer = document.createElement('div');
  progressContainer.id = 'progress-container';
  progressContainer.style.cssText = `
    height: auto;
    border: 1px solid #00ff00;
    padding: 10px;
    background: rgba(0, 0, 0, 0.7);
    margin-bottom: 10px;
  `;
  
  const progressTitle = document.createElement('div');
  progressTitle.textContent = '📊 진행 단계';
  progressTitle.style.cssText = `
    font-weight: bold;
    margin-bottom: 5px;
    color: #00ff00;
  `;
  
  const progressSteps = document.createElement('div');
  progressSteps.id = 'progress-steps';
  progressSteps.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  `;
  
  // 7개 단계 버튼 생성
  const stepNames = ['초기화', '카운터', '모니터링', '프롬프트', '이미지생성', '저장', '완료'];
  for (let i = 0; i < 7; i++) {
    const stepContainer = document.createElement('div');
    stepContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 5px;
      margin-bottom: 3px;
    `;
    
    const stepButton = document.createElement('div');
    stepButton.id = `step-${i}`;
    stepButton.textContent = `${i + 1}. ${stepNames[i]}`;
    stepButton.style.cssText = `
      padding: 3px 8px;
      border: 1px solid #00ff00;
      border-radius: 3px;
      font-size: 10px;
      background: rgba(0, 0, 0, 0.5);
      color: #666;
      transition: all 0.3s;
      min-width: 60px;
    `;
    
    const stepStatus = document.createElement('div');
    stepStatus.id = `step-status-${i}`;
    stepStatus.textContent = '⏳';
    stepStatus.style.cssText = `
      padding: 2px 6px;
      border: 1px solid #00ff00;
      border-radius: 3px;
      font-size: 10px;
      background: rgba(0, 0, 0, 0.5);
      color: #666;
      transition: all 0.3s;
      min-width: 20px;
      text-align: center;
    `;
    
    stepContainer.appendChild(stepButton);
    stepContainer.appendChild(stepStatus);
    progressSteps.appendChild(stepContainer);
  }
  
  progressContainer.appendChild(progressTitle);
  progressContainer.appendChild(progressSteps);
  
  logOverlay.appendChild(autoModeButton);
  logOverlay.appendChild(logContainer);
  logOverlay.appendChild(progressContainer);
  document.body.appendChild(logOverlay);

  // 초기 메시지는 한 번만 추가 (static 변수로 관리)
  if (!window.logOverlayInitialized) {
    addLogMessage('🚀 로그 오버레이 생성됨');
    addLogMessage('📊 main setInterval 모니터링 준비 완료');
    addLogMessage('🔄 자동 모드 버튼을 클릭하여 시작하세요');
    window.logOverlayInitialized = true;
  }
}

// 로그 오버레이 제거 함수
function removeLogOverlay() {
  if (logOverlay) {
    logOverlay.remove();
    logOverlay = null;
    logContainer = null;
  }
}

// 진행 단계 업데이트 함수
function updateProgressStep(stepIndex, status = 'running') {
  const progressSteps = document.getElementById('progress-steps');
  if (!progressSteps) return;
  
  // 모든 단계를 비활성화
  for (let i = 0; i < 7; i++) {
    const stepButton = document.getElementById(`step-${i}`);
    const stepStatus = document.getElementById(`step-status-${i}`);
    if (stepButton) {
      stepButton.style.background = 'rgba(0, 0, 0, 0.5)';
      stepButton.style.color = '#666';
      stepButton.style.borderColor = '#00ff00';
    }
    if (stepStatus) {
      stepStatus.style.background = 'rgba(0, 0, 0, 0.5)';
      stepStatus.style.color = '#666';
      stepStatus.style.borderColor = '#00ff00';
    }
  }
  
  // 현재 단계를 활성화
  const currentStep = document.getElementById(`step-${stepIndex}`);
  const currentStatus = document.getElementById(`step-status-${stepIndex}`);
  if (currentStep) {
    currentStep.style.background = '#00ff00';
    currentStep.style.color = '#000';
    currentStep.style.borderColor = '#00ff00';
  }
      if (currentStatus) {
      if (status === 'running') {
        currentStatus.textContent = '⏳';
        currentStatus.style.background = '#ffaa00';
        currentStatus.style.color = '#000';
      } else if (status === 'success') {
        currentStatus.textContent = '✅';
        currentStatus.style.background = '#00ff00';
        currentStatus.style.color = '#000';
      } else if (status === 'clear') {
        currentStatus.textContent = '🧹';
        currentStatus.style.background = '#0088ff';
        currentStatus.style.color = '#fff';
      } else if (status === 'fail') {
        currentStatus.textContent = '❌';
        currentStatus.style.background = '#ff0000';
        currentStatus.style.color = '#fff';
      } else if (status === 'warning') {
        currentStatus.textContent = '⚠️';
        currentStatus.style.background = '#ffff00';
        currentStatus.style.color = '#000';
      } else if (status === 'skip') {
        currentStatus.textContent = '⏭️';
        currentStatus.style.background = '#888888';
        currentStatus.style.color = '#fff';
      }
    }
}

// 로그 메시지 추가 함수
function addLogMessage(message) {
  if (!logContainer) {
    console.log('📝 로그:', message);
    return;
  }

  const logEntry = document.createElement('div');
  logEntry.style.cssText = `
    margin-bottom: 5px;
    padding: 3px 0;
    border-bottom: 1px solid rgba(0, 255, 0, 0.2);
  `;
  
  const timestamp = new Date().toLocaleTimeString();
  logEntry.textContent = `[${timestamp}] ${message}`;
  
  logContainer.appendChild(logEntry);
  
  // 자동 모드 ON 상태일 때 메시지 개수 확인 및 초기화
  if (typeof isAutoMonitoringEnabled !== 'undefined' && isAutoMonitoringEnabled) {
    const logEntries = logContainer.querySelectorAll('div');
    if (logEntries.length >= 250) {
      // 메시지가 250개에 도달하면 초기화
      const clearMsg = document.createElement('div');
      clearMsg.textContent = `[${new Date().toLocaleTimeString()}] 🧹 메시지 250개 도달 - 로그 및 상태 초기화`;
      logContainer.innerHTML = '';
      logContainer.appendChild(clearMsg);
      // 상태 변수 초기화
      resetMonitoringState();
      const doneMsg = document.createElement('div');
      doneMsg.textContent = `[${new Date().toLocaleTimeString()}] ✅ 로그/상태 초기화 완료`;
      logContainer.appendChild(doneMsg);
    }
  }

  // 스크롤을 맨 아래로
  logContainer.scrollTop = logContainer.scrollHeight;

  // 콘솔에도 출력
  console.log('📝 로그:', message);
}

// 자동 모드 상태 변수 초기화 함수
function resetMonitoringState() {
  // 카운터 및 상태
  if (typeof mainLoopTick !== 'undefined') mainLoopTick = 0;
  if (typeof monitoringCounter !== 'undefined') monitoringCounter = 0;
  if (typeof mainLoopState !== 'undefined') mainLoopState = 0;
  if (typeof monitoringState !== 'undefined') monitoringState = 0;
  // 프롬프트 관련
  if (typeof currentPrompt !== 'undefined') currentPrompt = '';
  if (typeof lastPrompt !== 'undefined') lastPrompt = '';
  if (typeof promptData !== 'undefined') promptData = null;
  // 진행 단계/상태
  if (typeof progressStepStatus !== 'undefined') progressStepStatus = [];
  if (typeof imageGenerationProgress !== 'undefined') imageGenerationProgress = 0;
  if (typeof imageGenerationTimer !== 'undefined') imageGenerationTimer = null;
  if (typeof imageGenerationStartTime !== 'undefined') imageGenerationStartTime = null;
  if (typeof imageGenerationDuration !== 'undefined') imageGenerationDuration = null;
  if (typeof soraSpinnerDetected !== 'undefined') soraSpinnerDetected = false;
  if (typeof lastSpinnerState !== 'undefined') lastSpinnerState = null;
  // 기타 필요 변수 추가 가능
}