// 프롬프트 테스트 확장 프로그램 - 콘텐츠 스크립트
console.log('Prompt test extension - Content script loaded');

// Chrome i18n 지원 함수들
function getCurrentLanguage() {
    return chrome.i18n.getUILanguage().split('-')[0] || 'en';
}

function getLocalizedMessage(messageKey, substitutions = []) {
    return chrome.i18n.getMessage(messageKey, substitutions) || messageKey;
}

// 언어 설정
let currentLanguage = 'en';

// 페이지 로드 시 언어 설정 로드 (안전한 방식)
safeStorageGet(['language'], function(result) {
    if (result && result.language) {
        currentLanguage = result.language;
        console.log('언어 설정 로드됨:', currentLanguage);
    } else {
        console.log('언어 설정 없음, 기본값(en) 사용');
        currentLanguage = 'en';
    }
});

// Chrome 저장소 변경 감지 (실시간 언어 변경, 안전한 방식)
try {
    if (chrome && chrome.storage && chrome.storage.onChanged) {
        chrome.storage.onChanged.addListener(function(changes, namespace) {
            try {
                // 확장 프로그램 컨텍스트 검증
                if (!isExtensionContextValid()) {
                    console.warn('⚠️ 확장 프로그램 컨텍스트가 무효화되어 저장소 변경을 처리할 수 없습니다.');
                    return;
                }

        if (namespace === 'local' && changes.language) {
            const newLanguage = changes.language.newValue;
            if (newLanguage && newLanguage !== currentLanguage) {
                console.log('언어 설정 변경 감지:', newLanguage);
                currentLanguage = newLanguage;
                updateUITexts();
                
                // 언어 변경 알림 메시지
                const changeMessage = currentLanguage === 'ko' ? '🌐 언어가 한국어로 변경되었습니다' : '🌐 Language changed to English';
                addLogMessage(changeMessage);
                
                // 시각적 피드백 (로그 오버레이 깜빡임)
                const logOverlay = document.getElementById('log-overlay');
                if (logOverlay) {
                    logOverlay.style.transition = 'all 0.3s ease';
                    logOverlay.style.transform = 'scale(1.02)';
                    logOverlay.style.boxShadow = '0 8px 32px rgba(0, 255, 0, 0.5)';
                    
                    // 자동 모드 버튼도 함께 깜빡임
                    const autoModeButton = document.getElementById('auto-mode-button');
                    if (autoModeButton) {
                        autoModeButton.style.transition = 'all 0.3s ease';
                        autoModeButton.style.transform = 'scale(1.05)';
                        autoModeButton.style.boxShadow = '0 4px 16px rgba(0, 255, 0, 0.4)';
                        
                        setTimeout(() => {
                            autoModeButton.style.transform = 'scale(1)';
                            autoModeButton.style.boxShadow = 'none';
                        }, 300);
                    }
                    
                    setTimeout(() => {
                        logOverlay.style.transform = 'scale(1)';
                        logOverlay.style.boxShadow = '0 4px 20px rgba(0, 255, 0, 0.3)';
                    }, 300);
                }
            }
        }
            } catch (error) {
                console.error('❌ 저장소 변경 처리 중 오류:', error);
            }
        });
    } else {
        console.warn('⚠️ Chrome storage API가 사용 불가합니다.');
    }
} catch (error) {
    console.error('❌ 저장소 변경 감지 초기화 오류:', error);
}

// 팝업으로부터의 메시지 수신 (안전한 방식)
try {
    if (chrome && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    try {
        // 확장 프로그램 컨텍스트 검증
        if (!isExtensionContextValid()) {
            console.warn('⚠️ 확장 프로그램 컨텍스트가 무효화되어 메시지를 처리할 수 없습니다.');
            if (sendResponse) {
                sendResponse({ success: false, error: 'Extension context invalidated' });
            }
            return true;
        }

        if (request.action === 'languageChanged') {
            console.log('팝업으로부터 언어 변경 메시지 수신:', request.language);
            currentLanguage = request.language;
            updateUITexts();
            
            // 언어 변경 알림 메시지
            const changeMessage = currentLanguage === 'ko' ? '🌐 언어가 한국어로 변경되었습니다' : '🌐 Language changed to English';
            addLogMessage(changeMessage);
            
            // 시각적 피드백 (로그 오버레이 깜빡임)
            const logOverlay = document.getElementById('log-overlay');
            if (logOverlay) {
                logOverlay.style.transition = 'all 0.3s ease';
                logOverlay.style.transform = 'scale(1.02)';
                logOverlay.style.boxShadow = '0 8px 32px rgba(0, 255, 0, 0.5)';
                
                // 자동 모드 버튼도 함께 깜빡임
                const autoModeButton = document.getElementById('auto-mode-button');
                if (autoModeButton) {
                    autoModeButton.style.transition = 'all 0.3s ease';
                    autoModeButton.style.transform = 'scale(1.05)';
                    autoModeButton.style.boxShadow = '0 4px 16px rgba(0, 255, 0, 0.4)';
                    
                    setTimeout(() => {
                        autoModeButton.style.transform = 'scale(1)';
                        autoModeButton.style.boxShadow = 'none';
                    }, 300);
                }
                
                setTimeout(() => {
                    logOverlay.style.transform = 'scale(1)';
                    logOverlay.style.boxShadow = '0 4px 20px rgba(0, 255, 0, 0.3)';
                }, 300);
            }

            // 성공 응답
            if (sendResponse) {
                sendResponse({ success: true, message: '언어 변경 처리 완료' });
            }
            return true;
        }

        // 다른 액션들도 처리할 수 있도록 로그 출력
        console.warn('⚠️ 처리되지 않은 액션:', request.action);
        if (sendResponse) {
            sendResponse({ success: false, error: `Unknown action: ${request.action}` });
        }
        return true;

        } catch (error) {
            console.error('❌ 메시지 처리 중 오류:', error);
            if (sendResponse) {
                sendResponse({ success: false, error: error.message });
            }
            return true;
        }
        });
    } else {
        console.warn('⚠️ Chrome runtime API가 사용 불가합니다.');
    }
} catch (error) {
    console.error('❌ 메시지 수신 초기화 오류:', error);
}

// UI 텍스트 업데이트 함수
function updateUITexts() {
  console.log('UI 텍스트 업데이트:', currentLanguage);
  
  // 오버레이의 텍스트들을 업데이트
  const overlay = document.getElementById('prompt-test-overlay');
  if (overlay) {
    updateOverlayTexts(overlay);
  }
  
  // 로그 오버레이의 텍스트들을 업데이트
  const logOverlay = document.getElementById('log-overlay');
  if (logOverlay) {
    updateLogOverlayTexts(logOverlay);
  }
  
  // 자동 모드 버튼 업데이트
  updateAutoModeButton();
  
  // 진행 단계 텍스트 업데이트
  updateProgressSteps();
}

// 오버레이 텍스트 업데이트
function updateOverlayTexts(overlay) {
    const texts = {
        ko: {
            title: '🎨 Sora Auto Save',
            autoMonitoring: '자동 모니터링',
            monitoringInterval: '모니터링 간격',
            startMonitoring: '모니터링 시작',
            stopMonitoring: '모니터링 중지',
            saveSettings: '설정 저장',
            resetSettings: '설정 초기화'
        },
        en: {
            title: '🎨 Sora Auto Save',
            autoMonitoring: 'Auto Monitoring',
            monitoringInterval: 'Monitoring Interval',
            startMonitoring: 'Start Monitoring',
            stopMonitoring: 'Stop Monitoring',
            saveSettings: 'Save Settings',
            resetSettings: 'Reset Settings'
        }
    };
    
    const currentTexts = texts[currentLanguage] || texts.en;
    
    // 제목 업데이트
    const titleElement = overlay.querySelector('.overlay-title');
    if (titleElement) {
        titleElement.textContent = currentTexts.title;
    }
    
    // 라벨들 업데이트
    const labels = overlay.querySelectorAll('.overlay-label');
    labels.forEach(label => {
        const key = label.getAttribute('data-text-key');
        if (key && currentTexts[key]) {
            label.textContent = currentTexts[key];
        }
    });
}

// 로그 오버레이 텍스트 업데이트
function updateLogOverlayTexts(logOverlay) {
    const texts = {
        ko: {
            title: '📊 모니터링 로그',
            close: '닫기',
            clear: '지우기'
        },
        en: {
            title: '📊 Monitoring Log',
            close: 'Close',
            clear: 'Clear'
        }
    };
    
    const currentTexts = texts[currentLanguage] || texts.en;
    
    // 제목 업데이트
    const titleElement = logOverlay.querySelector('.log-title');
    if (titleElement) {
        titleElement.textContent = currentTexts.title;
    }
    
    // 버튼들 업데이트
    const closeBtn = logOverlay.querySelector('.log-close-btn');
    if (closeBtn) {
        closeBtn.textContent = currentTexts.close;
    }
    
    const clearBtn = logOverlay.querySelector('.log-clear-btn');
    if (clearBtn) {
        clearBtn.textContent = currentTexts.clear;
    }
}

// 자동 모드 버튼 업데이트
function updateAutoModeButton() {
  const autoModeButton = document.getElementById('auto-mode-button');
  if (autoModeButton) {
    if (isGlobalIntervalRunning) {
      autoModeButton.textContent = currentLanguage === 'ko' ? '🔄 자동 모드 ON' : '🔄 Auto Mode ON';
      autoModeButton.style.background = '#28a745';
    } else {
      autoModeButton.textContent = currentLanguage === 'ko' ? '🔄 자동 모드 OFF' : '🔄 Auto Mode OFF';
      autoModeButton.style.background = '#dc3545';
    }
  }
}

// 진행 단계 텍스트 업데이트
function updateProgressSteps() {
  const stepTexts = {
    ko: {
      step0: '초기화',
      step1: '카운터',
      step2: '모니터링',
      step3: '프롬프트',
      step4: '이미지생성',
      step5: '저장',
      step6: '완료'
    },
    en: {
      step0: 'Init',
      step1: 'Counter',
      step2: 'Monitor',
      step3: 'Prompt',
      step4: 'ImageGen',
      step5: 'Save',
      step6: 'Complete'
    }
  };
  
  const currentTexts = stepTexts[currentLanguage] || stepTexts.en;
  
  for (let i = 0; i < 7; i++) {
    const stepButton = document.getElementById(`step-${i}`);
    if (stepButton) {
      stepButton.textContent = `${i + 1}. ${currentTexts[`step${i}`]}`;
    }
  }
}

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

// Sora 페이지에서 현재 프롬프트 가져오기 (0~7번 data-index 모두 포함)
function getCurrentSoraPrompt() {
  try {
    console.log('🔍 Sora 페이지에서 현재 프롬프트 검색 중 (0~7번 data-index)...');
    
    const allPrompts = [];
    
    // 0. data-index="0"부터 "7"까지 순차적으로 검색
    for (let i = 0; i <= 7; i++) {
      console.log(`📍 data-index="${i}" 검색 중...`);
      
      // data-index로 요소 찾기
      const indexElement = document.querySelector(`[data-index="${i}"]`);
      if (!indexElement) {
        console.log(`❌ data-index="${i}" 요소 없음`);
        continue;
      }
      
      // 해당 data-index 내에서 프롬프트 텍스트 찾기
      const promptContainer = indexElement.querySelector('.text-token-text-primary');
      if (promptContainer) {
        const promptText = promptContainer.textContent || promptContainer.innerText || '';
        if (promptText.trim().length > 10) {
          allPrompts.push({
            index: i,
            text: promptText.trim(),
            source: `data-index-${i}`
          });
          console.log(`✅ data-index="${i}"에서 프롬프트 발견: ${promptText.substring(0, 60)}...`);
        }
      }
      
      // "Prompt" 텍스트 다음의 프롬프트도 찾기
      const promptElements = indexElement.querySelectorAll('*');
      for (const element of promptElements) {
        const text = element.textContent || element.innerText || '';
        if (text.includes('Prompt') && text.length > 20) {
          const promptIndex = text.indexOf('Prompt');
          const afterPrompt = text.substring(promptIndex + 6).trim();
          if (afterPrompt && afterPrompt.length > 10 && !afterPrompt.includes('undefined')) {
            allPrompts.push({
              index: i,
              text: afterPrompt,
              source: `data-index-${i}-prompt-text`
            });
            console.log(`✅ data-index="${i}"에서 "Prompt" 텍스트 발견: ${afterPrompt.substring(0, 60)}...`);
          }
        }
      }
    }
    
    // 1. 추가로 일반적인 프롬프트 검색 (생성 중/완성된 프롬프트 모두 포함)
    const promptElements = document.querySelectorAll('div, span, p');
    
    for (const element of promptElements) {
      const text = element.textContent || element.innerText || '';
      if (text.includes('Prompt') && text.length > 10) {
        const promptIndex = text.indexOf('Prompt');
        const afterPrompt = text.substring(promptIndex + 6).trim();
        if (afterPrompt && afterPrompt.length > 10 && !afterPrompt.includes('undefined')) {
          allPrompts.push({
            index: 'general',
            text: afterPrompt,
            source: 'general-prompt-search'
          });
        }
      }
    }
    
         // 2. .text-token-text-primary 클래스에서 추가 프롬프트 찾기
     const textPrimaryElements = document.querySelectorAll('.text-token-text-primary');
     for (const element of textPrimaryElements) {
       const text = element.textContent || element.innerText || '';
       if (text.length > 20 && text.length < 1000 && 
           !text.includes('undefined') && 
           !text.includes('Today') &&
           !text.includes('Image Generation') &&
           !text.includes('Generated image') &&
           // 시간 패턴 제외 (2:56pm, 오전/오후 등)
           !/^\d{1,2}:\d{2}(?:am|pm)$/.test(text.trim()) &&
           !/^오전|오후\s*\d{1,2}:\d{2}$/.test(text.trim()) &&
           // 단순한 제목이나 URL이 아닌 실제 프롬프트 내용
           !text.startsWith('http') &&
           !text.match(/^[a-zA-Z\s]{1,30}$/) && // 영어 단어만 있는 짧은 제목 제외
           // 문장 형태의 프롬프트만 추출 (한국어 조사나 구두점 포함)
           (text.includes('을') || text.includes('를') || text.includes('이') || text.includes('가') || 
            text.includes('에서') || text.includes('의') || text.includes('과') || text.includes('와') ||
            text.includes('하고') || text.includes('있는') || text.includes('그려') || text.includes('표현') ||
            text.includes('모습') || text.includes('장면') || text.includes('배경') || text.includes('주세요') ||
            text.includes('.') || text.includes('다') || text.includes('요'))) {
         allPrompts.push({
           index: 'text-primary',
           text: text.trim(),
           source: 'text-token-text-primary'
         });
         console.log(`✅ .text-token-text-primary에서 프롬프트 발견: ${text.substring(0, 60)}...`);
       }
     }
     
     // 3. 중복 제거 및 최종 프롬프트 구성
     console.log(`📊 총 발견된 프롬프트 수: ${allPrompts.length}개`);
     
     if (allPrompts.length === 0) {
       console.log('❌ 프롬프트를 찾을 수 없음');
       return '';
     }
     
     // 중복 제거 (텍스트 기준)
     const uniquePrompts = [];
     const seenTexts = new Set();
     
     for (const prompt of allPrompts) {
       if (!seenTexts.has(prompt.text)) {
         seenTexts.add(prompt.text);
         uniquePrompts.push(prompt);
       }
     }
     
     console.log(`🔍 중복 제거 후 고유 프롬프트 수: ${uniquePrompts.length}개`);
     
     // 각 프롬프트 로그 출력
     uniquePrompts.forEach((prompt, index) => {
       console.log(`   프롬프트 ${index + 1} [${prompt.source}]: ${prompt.text.substring(0, 80)}...`);
     });
     
     // 모든 고유 프롬프트를 하나로 합치기 (구분자로 분리)
     const finalPrompt = uniquePrompts.map(p => p.text).join(' | ');
     console.log('✅ 0~7번 data-index 포함 모든 프롬프트 수집 완료:', finalPrompt.substring(0, 200) + '...');
     
     return finalPrompt.trim();
    
    
      } catch (error) {
      console.error('❌ 현재 프롬프트 가져오기 실패:', error);
      return '';
    }
  }
  
  // 이미지 생성 중인지 확인하는 함수
  function checkIfImageGenerating() {
    try {
      // Sora 로딩 스피너 확인
      const soraSpinner = document.querySelector('svg[viewBox="0 0 120 120"] circle[class*="animate-spin"]');
      const soraLoadingContainer = document.querySelector('div[class*="bg-token-bg-secondary"] svg[viewBox="0 0 120 120"]');
      
      // 일반적인 로딩 요소들 확인
      const generalLoading = document.querySelector('[class*="loading"], [class*="spinner"], [class*="progress"]');
      
      const isGenerating = !!(soraSpinner || soraLoadingContainer || generalLoading);
      
      if (isGenerating) {
        console.log('🔄 이미지 생성 중 감지됨');
      } else {
        console.log('✅ 이미지 생성 완료 상태');
      }
      
      return isGenerating;
    } catch (error) {
      console.error('❌ 이미지 생성 상태 확인 실패:', error);
      return false;
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

// 프롬프트 중복 검사 관련 변수들 (더 이상 사용하지 않음)

// 최종 프롬프트 유효성 검증 함수 (최소한의 검증만)
function validateFinalPrompt(finalPrompt) {
  console.log('🔍 최종 프롬프트 유효성 검사 시작:', finalPrompt?.substring(0, 50) + '...');
  
  // 1. 프롬프트 존재 여부 확인
  if (!finalPrompt || typeof finalPrompt !== 'string') {
    console.log('❌ 최종 프롬프트가 존재하지 않음');
    return {
      isValid: false,
      error: '최종 프롬프트가 존재하지 않습니다.',
      errorCode: 'NO_PROMPT'
    };
  }
  
  // 2. 공백 제거 후 실제 내용 확인
  const trimmedPrompt = finalPrompt.trim();
  if (trimmedPrompt.length === 0) {
    console.log('❌ 최종 프롬프트가 공백만 있음');
    return {
      isValid: false,
      error: '최종 프롬프트가 공백만 있습니다.',
      errorCode: 'EMPTY_OR_WHITESPACE'
    };
  }
  
  // 3. 무의미한 내용만 걸러내기 (최소한의 검증)
  const invalidPatterns = [
    /^[\s\n\r\t]*$/, // 공백만 있는 경우
    /^[0-9\s:]+(?:am|pm)?[\s]*$/i, // 시간 패턴만 있는 경우 (2:56pm, 2:56 AM 등)
    /^https?:\/\/[^\s]+[\s]*$/ // URL만 있는 경우
  ];
  
  for (const pattern of invalidPatterns) {
    if (pattern.test(trimmedPrompt)) {
      console.log('❌ 최종 프롬프트가 무의미한 패턴:', pattern);
      return {
        isValid: false,
        error: '최종 프롬프트가 무의미한 내용입니다 (시간, URL 등).',
        errorCode: 'MEANINGLESS_CONTENT'
      };
    }
  }
  
  console.log('✅ 최종 프롬프트 유효성 검사 통과:', trimmedPrompt.length, '자');
  return {
    isValid: true,
    cleanedPrompt: trimmedPrompt,
    wordCount: trimmedPrompt.split(/\s+/).length
  };
}

// 단순한 단어 기반 중복 검사 함수 (최종 프롬프트로만 검사)
function checkPromptDuplication(finalPrompt, dataJsonPrompts) {
  console.log('🔍 최종 프롬프트 기반 중복 검사 시작:', finalPrompt?.substring(0, 50) + '...');
  
  // 1. 최종 프롬프트 유효성 검사 먼저 수행
  const validation = validateFinalPrompt(finalPrompt);
  if (!validation.isValid) {
    console.log('❌ 최종 프롬프트 유효성 검사 실패:', validation.error);
    return {
      isDuplicate: false,
      matchRatio: 0,
      matchedWords: [],
      matchedPrompt: '',
      matchIndex: -1,
      validationError: validation.error,
      errorCode: validation.errorCode
    };
  }
  
  // 2. data.json 프롬프트 데이터 확인
  if (!dataJsonPrompts || dataJsonPrompts.length === 0) {
    console.log('❌ data.json 프롬프트 데이터 부족');
    return {
      isDuplicate: false,
      matchRatio: 0,
      matchedWords: [],
      matchedPrompt: '',
      matchIndex: -1,
      validationError: 'data.json 프롬프트 데이터가 없습니다.',
      errorCode: 'NO_DATA'
    };
  }
  
  console.log('✅ 최종 프롬프트 유효성 검사 통과 - 중복 검사 진행');
  const cleanedFinalPrompt = validation.cleanedPrompt;
  
  // 3. 최종 프롬프트를 소문자로 변환하여 중복 검사 준비
  const finalPromptLower = cleanedFinalPrompt.toLowerCase().trim();
  
  // 4. data.json의 각 프롬프트와 최종 프롬프트 비교
  console.log(`🔍 ${dataJsonPrompts.length}개의 data.json 프롬프트와 비교 시작`);
  
  for (let i = 0; i < dataJsonPrompts.length; i++) {
    const dataPrompt = dataJsonPrompts[i];
    const promptContent = dataPrompt.content || dataPrompt.text || dataPrompt;
    
    if (!promptContent || typeof promptContent !== 'string') continue;
    
    // data.json 프롬프트를 공백으로 분할하여 단어 배열 생성
    const words = promptContent.toLowerCase().trim().split(/\s+/).filter(word => word.length > 0);
    console.log(`📝 검사 중 [${i+1}/${dataJsonPrompts.length}]: ${words.length}개 단어`);
    
    if (words.length === 0) continue;
    
    // 각 단어가 최종 프롬프트에 포함되어 있는지 확인
    let matchedWords = 0;
    const matchedWordsList = [];
    
    for (const word of words) {
      if (finalPromptLower.includes(word)) {
        matchedWords++;
        matchedWordsList.push(word);
      }
    }
    
    // 매칭 비율 계산 (50% 이상 매칭되면 중복으로 판단)
    const matchRatio = (matchedWords / words.length) * 100;
    console.log(`🔍 단어 매칭률 [${i+1}]: ${matchedWords}/${words.length} (${matchRatio.toFixed(1)}%)`);
    
    if (matchRatio >= 50) {
      console.log(`✅ 중복 발견! 매칭률: ${matchRatio.toFixed(1)}%`, matchedWordsList);
      return {
        isDuplicate: true,
        matchRatio: matchRatio,
        matchedWords: matchedWordsList,
        matchedPrompt: promptContent,
        matchIndex: i
      };
    }
  }
  
  console.log('✅ 중복 없음');
  return {
    isDuplicate: false,
    matchRatio: 0,
    matchedWords: [],
    matchedPrompt: '',
    matchIndex: -1
  };
}

// 확장 프로그램 컨텍스트 유효성 검사 함수
function isExtensionContextValid() {
  try {
    // Chrome API 접근 가능 여부 확인
    if (!chrome || !chrome.runtime) {
      console.warn('🔍 확장 프로그램 컨텍스트 검증: chrome.runtime 없음');
      return false;
    }
    
    // Extension ID 접근 가능 여부 확인
    if (!chrome.runtime.id) {
      console.warn('🔍 확장 프로그램 컨텍스트 검증: runtime.id 없음');
      return false;
    }
    
    // 컨텍스트가 유효한지 테스트 (간단한 API 호출)
    chrome.runtime.getManifest();
    
    return true;
  } catch (error) {
    console.warn('❌ 확장 프로그램 컨텍스트 검증 실패:', error.message);
    return false;
  }
}

// Runtime URL 가져오기 함수 (컨텍스트 검증 포함)
function getRuntimeURL(path) {
  try {
    console.log('🔍 getRuntimeURL 호출:', path);
    
    if (!isExtensionContextValid()) {
      console.warn('⚠️ 확장 프로그램 컨텍스트가 무효화되어 URL을 가져올 수 없습니다.');
      return null;
    }
    
    const url = chrome.runtime.getURL(path);
    console.log('🔗 생성된 URL:', url);
    return url;
  } catch (error) {
    console.error('❌ runtime URL 가져오기 실패:', error);
    return null;
  }
}

// 모니터링 설정 저장 함수 (컨텍스트 무효화 방지)
function saveMonitoringSettings() {
  try {
    // 컨텍스트 유효성 검사
    if (!isExtensionContextValid()) {
      console.warn('⚠️ 확장 프로그램 컨텍스트가 무효화됨 - 설정 저장 건너뜀');
      addLogMessage('⚠️ 확장 프로그램 컨텍스트가 무효화됨 - 페이지를 새로고침해주세요.');
      return;
    }

    const settings = {
      language: currentLanguage,
      isAutoMonitoringEnabled: typeof isAutoMonitoringEnabled !== 'undefined' ? isAutoMonitoringEnabled : true,
      monitoringState: typeof monitoringState !== 'undefined' ? monitoringState : 0,
      monitoringCounter: typeof monitoringCounter !== 'undefined' ? monitoringCounter : 0,
      mainLoopState: typeof mainLoopState !== 'undefined' ? mainLoopState : 0,
      lastUpdated: new Date().toISOString()
    };
    
    chrome.storage.local.set({ soraAutoImageSettings: settings }, function() {
      if (chrome.runtime.lastError) {
        console.error('설정 저장 실패:', chrome.runtime.lastError);
        addLogMessage('⚠️ 설정 저장 실패: ' + chrome.runtime.lastError.message);
      } else {
        console.log('✅ 모니터링 설정 저장 완료:', settings);
        addLogMessage('💾 모니터링 설정 자동 저장 완료');
      }
    });
  } catch (error) {
    console.error('모니터링 설정 저장 중 오류:', error);
    addLogMessage('⚠️ 확장 프로그램 컨텍스트가 무효화되어 설정을 저장할 수 없습니다. 페이지를 새로고침해주세요.');
  }
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
        error: '실행주기는 항상 5초로 고정됩니다.'
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
let monitoringIntervalMs = 5000; // 실행주기 (기본값: 5초)

// 전역 main setInterval 관리
let globalIntervalId = null;
let mainLoopTick = 0; // mainLoop 실행 카운터
let mainLoopState = 0; // mainLoop 상태 (0~4)
let isGlobalIntervalRunning = false; // main setInterval 실행 상태
let isPaused = false; // setInterval 일시 중지 상태
let activeTimeouts = []; // 활성 setTimeout들을 추적
const MAIN_LOOP_INTERVAL = 5000; // 5초 고정

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
  console.log('▶️ main setInterval 시작 (5초 주기)');
  addLogMessage(currentLanguage === 'ko' ? '▶️ main setInterval 시작 (5초 주기)' : '▶️ Main setInterval started (5 second cycle)');
}

function stopMainLoop() {
  addLogMessage(currentLanguage === 'ko' ? '⏹️ mainLoop 중지 시작...' : '⏹️ MainLoop stop started...');
  
  // main setInterval 정리
  if (globalIntervalId) {
    clearInterval(globalIntervalId);
    globalIntervalId = null;
    isGlobalIntervalRunning = false;
    console.log('⏹️ main setInterval 중지');
    addLogMessage(currentLanguage === 'ko' ? '⏹️ main setInterval 중지' : '⏹️ Main setInterval stopped');
  }
  
  // 모든 활성 setTimeout 정리
  if (activeTimeouts.length > 0) {
    addLogMessage(currentLanguage === 'ko' 
      ? `🧹 ${activeTimeouts.length}개의 활성 setTimeout 정리 중...`
      : `🧹 Cleaning up ${activeTimeouts.length} active setTimeout...`);
    activeTimeouts.forEach(timeoutId => {
      clearTimeout(timeoutId);
    });
    activeTimeouts = [];
    addLogMessage(currentLanguage === 'ko' ? '✅ 모든 setTimeout 정리 완료' : '✅ All setTimeout cleanup completed');
  } else {
    addLogMessage(currentLanguage === 'ko' ? 'ℹ️ 정리할 활성 setTimeout이 없음' : 'ℹ️ No active setTimeout to clean up');
  }
  
  // 상태 초기화
  mainLoopState = 0;
  mainLoopTick = 0;
  isPaused = false;
  
  addLogMessage(currentLanguage === 'ko' ? '✅ mainLoop 완전 중지 및 모든 타이머 정리 완료' : '✅ MainLoop completely stopped and all timers cleaned up');
}

function mainLoop() {
  // 일시 중지 상태면 실행 안함
  if (isPaused) return;

  // 진행 패널 데이터 업데이트 (매 루프마다)
  if (typeof updateProgressPanelData === 'function') {
    updateProgressPanelData();
  }

  switch (mainLoopState) {
    case 0: // 초기화 상태
      updateProgressStep(0);
      step1_ManageOverlay();
      mainLoopState = 1;
      addLogMessage(currentLanguage === 'ko' ? '🔄 mainLoop 상태 변경: 0 → 1' : '🔄 MainLoop state change: 0 → 1');
      break;

    case 1: // 카운터 업데이트 상태 (딜레이 적용)
      updateProgressStep(1);
      isPaused = true;
      addLogMessage(currentLanguage === 'ko' ? '📊 Step 2 시작...' : '📊 Step 2 started...');
      trackedSetTimeout(() => {
        mainLoopTick++;
        addLogMessage(currentLanguage === 'ko' ? '✅ 카운터 업데이트 완료' : '✅ Counter update completed');
        trackedSetTimeout(() => {
          updateProgressStep(1, 'success');
          mainLoopState = 2;
          addLogMessage(currentLanguage === 'ko' ? '🔄 상태 변경: 1→2' : '🔄 State change: 1→2');
          isPaused = false;
        }, MAIN_LOOP_INTERVAL);
      }, MAIN_LOOP_INTERVAL);
      break;

    case 2: // 프롬프트 모니터링 상태 (딜레이 적용)
      updateProgressStep(2);
      isPaused = true;
      addLogMessage(currentLanguage === 'ko' ? '🔍 Step 3: 프롬프트 모니터링 시작...' : '🔍 Step 3: Prompt monitoring started...');
      trackedSetTimeout(() => {
        addLogMessage(currentLanguage === 'ko' 
          ? '📋 단순화된 프롬프트 모니터링 시작'
          : '📋 Simplified prompt monitoring started');
        // 기존의 복잡한 promptMonitoringStep 함수 대신 단순한 로직 사용
        // 더 이상 복잡한 상태 머신을 사용하지 않음
        addLogMessage(currentLanguage === 'ko'
          ? '✅ 단순화된 프롬프트 모니터링 완료'
          : '✅ Simplified prompt monitoring completed');
        addLogMessage(currentLanguage === 'ko' ? '✅ Step 3: 프롬프트 모니터링 완료' : '✅ Step 3: Prompt monitoring completed');
        trackedSetTimeout(() => {
          updateProgressStep(2, 'success');
          mainLoopState = 3;
          addLogMessage(currentLanguage === 'ko' ? '🔄 상태 변경: 2→3' : '🔄 State change: 2→3');
          addLogMessage(currentLanguage === 'ko' ? '🔧 중복 검사 단계로 강제 진행' : '🔧 Forcing to duplicate check stage');
          isPaused = false;
        }, MAIN_LOOP_INTERVAL);
      }, MAIN_LOOP_INTERVAL);
      break;

    case 3: // 프롬프트 출력 상태 (딜레이 적용)
      updateProgressStep(3);
      isPaused = true;
      addLogMessage(currentLanguage === 'ko' ? '🎯 case 3 진입 - 중복 검사 단계 시작' : '🎯 Entering case 3 - duplicate check stage started');
      addLogMessage(currentLanguage === 'ko' ? '📝 Step 4: 페이지 프롬프트 가져오기 시작...' : '📝 Step 4: Getting page prompt started...');
      trackedSetTimeout(() => {
        // 1. 현재 페이지 프롬프트 가져오기
        const currentPrompt = getCurrentSoraPrompt();
        if (currentPrompt) {
          const shortContent = currentPrompt.length > 50 ? currentPrompt.substring(0, 50) + '...' : currentPrompt;
          addLogMessage(currentLanguage === 'ko' 
            ? `📋 현재 페이지 프롬프트: "${shortContent}"`
            : `📋 Current page prompt: "${shortContent}"`);
          addLogMessage(currentLanguage === 'ko'
            ? `📊 프롬프트 길이: ${currentPrompt.length}자`
            : `📊 Prompt length: ${currentPrompt.length} characters`);
        } else {
          addLogMessage(currentLanguage === 'ko' ? '❌ 페이지에서 프롬프트를 찾을 수 없음' : '❌ Cannot find prompt on page');
        }
        
        // 2. data.json 프롬프트들 가져오기 및 중복 검사
        addLogMessage(currentLanguage === 'ko' ? '📝 data.json 프롬프트들 가져오기 시작...' : '📝 Getting data.json prompts started...');
        const dataUrl = getRuntimeURL('data.json');
        if (dataUrl) {
          addLogMessage(currentLanguage === 'ko' ? '🔗 data.json URL 생성 성공' : '🔗 data.json URL created successfully');
          fetch(dataUrl)
            .then(response => response.json())
            .then(data => {
              if (data && data.prompts) {
                // data.json 데이터를 전역 변수에 저장
                window.lastPromptData = data;
                
                addLogMessage(currentLanguage === 'ko'
                  ? `📊 data.json에서 ${data.prompts.length}개의 프롬프트 로드됨`
                  : `📊 Loaded ${data.prompts.length} prompts from data.json`);
                data.prompts.forEach((prompt, index) => {
                  const shortContent = prompt.content.length > 50 ? prompt.content.substring(0, 50) + '...' : prompt.content;
                  addLogMessage(currentLanguage === 'ko'
                    ? `📋 data.json 프롬프트 ${index + 1}: "${shortContent}"`
                    : `📋 data.json prompt ${index + 1}: "${shortContent}"`);
                });
                
                // 3. 중복 검사 실행 (최종 프롬프트로만)
                if (currentPrompt && data.prompts && Array.isArray(data.prompts)) {
                  addLogMessage(currentLanguage === 'ko' ? '🔍 최종 프롬프트 기반 중복 검사 시작...' : '🔍 Final prompt based duplicate check started...');
                  addLogMessage(currentLanguage === 'ko'
                    ? `📋 최종 프롬프트: "${currentPrompt.substring(0, 100)}..."`
                    : `📋 Final prompt: "${currentPrompt.substring(0, 100)}..."`);
                  addLogMessage(currentLanguage === 'ko'
                    ? `📊 data.json 프롬프트 데이터: ${data.prompts.length}개`
                    : `📊 data.json prompt data: ${data.prompts.length} items`);
                  
                  // 최종 프롬프트로만 중복 검사 실행
                  const result = checkPromptDuplication(currentPrompt, data.prompts);
                  
                  // 중복 검사 결과를 전역 변수에 저장
                  window.lastDuplicationResult = result;
                  
                  // 최종 프롬프트 검증 실패 시 다음 단계로 진행하지 않음
                  if (result.validationError) {
                    addLogMessage(currentLanguage === 'ko'
                      ? `❌ 최종 프롬프트 검증 실패: ${result.validationError}`
                      : `❌ Final prompt validation failed: ${result.validationError}`);
                    addLogMessage(currentLanguage === 'ko'
                      ? `🚫 오류 코드: ${result.errorCode}`
                      : `🚫 Error code: ${result.errorCode}`);
                    addLogMessage(currentLanguage === 'ko'
                      ? '⏹️ 최종 프롬프트에 문제가 있어 다음 단계로 진행하지 않습니다.'
                      : '⏹️ Cannot proceed to next step due to final prompt issues.');
                    
                    // 상태를 초기화하여 다음 루프에서 다시 시도
                    trackedSetTimeout(() => {
                      updateProgressStep(3, 'fail');
                      mainLoopState = 0; // 처음부터 다시 시작
                      addLogMessage(currentLanguage === 'ko' 
                        ? '🔄 최종 프롬프트 검증 실패로 인한 상태 초기화: 3 → 0'
                        : '🔄 State reset due to final prompt validation failure: 3 → 0');
                      isPaused = false;
                    }, MAIN_LOOP_INTERVAL);
                    return; // 다음 단계로 진행하지 않음
                  }
                  
                  // 최종 프롬프트가 유효한 경우에만 중복 검사 결과 처리
                  if (result.isDuplicate) {
                    addLogMessage(currentLanguage === 'ko'
                      ? `⚠️ 중복 프롬프트 발견: ${result.matchRatio.toFixed(1)}% 매칭`
                      : `⚠️ Duplicate prompt found: ${result.matchRatio.toFixed(1)}% match`);
                    addLogMessage(currentLanguage === 'ko'
                      ? `📝 매칭된 단어들: ${result.matchedWords.join(', ')}`
                      : `📝 Matched words: ${result.matchedWords.join(', ')}`);
                    addLogMessage(currentLanguage === 'ko'
                      ? `📋 매칭된 프롬프트: "${result.matchedPrompt.substring(0, 50)}..."`
                      : `📋 Matched prompt: "${result.matchedPrompt.substring(0, 50)}..."`);
                  } else {
                    addLogMessage(currentLanguage === 'ko' ? '✅ 중복 없음 - 유효한 새로운 프롬프트' : '✅ No duplicates - valid new prompt');
                  }
                } else {
                  addLogMessage(currentLanguage === 'ko' 
                    ? '❌ 중복 검사 불가: currentPrompt 또는 data.prompts가 유효하지 않음' 
                    : '❌ Cannot perform duplicate check: currentPrompt or data.prompts is invalid');
                  addLogMessage(currentLanguage === 'ko'
                    ? `   currentPrompt: ${currentPrompt ? '존재함' : '없음'}`
                    : `   currentPrompt: ${currentPrompt ? 'exists' : 'none'}`);
                  addLogMessage(currentLanguage === 'ko'
                    ? `   data.prompts: ${data.prompts ? (Array.isArray(data.prompts) ? `${data.prompts.length}개` : '배열아님') : '없음'}`
                    : `   data.prompts: ${data.prompts ? (Array.isArray(data.prompts) ? `${data.prompts.length} items` : 'not array') : 'none'}`);
                  
                  // 최종 프롬프트가 없으면 다음 단계로 진행하지 않음
                  if (!currentPrompt) {
                    addLogMessage(currentLanguage === 'ko'
                      ? '⏹️ 최종 프롬프트가 없어 다음 단계로 진행하지 않습니다.'
                      : '⏹️ Cannot proceed to next step without final prompt.');
                    
                    trackedSetTimeout(() => {
                      updateProgressStep(3, 'warning');
                      mainLoopState = 0; // 처음부터 다시 시작
                      addLogMessage(currentLanguage === 'ko' 
                        ? '🔄 최종 프롬프트 부재로 인한 상태 초기화: 3 → 0'
                        : '🔄 State reset due to missing final prompt: 3 → 0');
                      isPaused = false;
                    }, MAIN_LOOP_INTERVAL);
                    return; // 다음 단계로 진행하지 않음
                  }
                }
              } else {
                addLogMessage(currentLanguage === 'ko' ? '❌ data.json에 프롬프트가 없음' : '❌ No prompts in data.json');
              }
            })
            .catch(error => {
              addLogMessage(currentLanguage === 'ko' ? '❌ data.json 로드 실패: ' + error.message : '❌ data.json load failed: ' + error.message);
              addLogMessage(currentLanguage === 'ko' ? '💡 기본 데이터로 중복 검사를 건너뜁니다.' : '💡 Skipping duplicate check with default data.');
              
              // 기본 프롬프트 데이터 생성
              const defaultData = {
                prompts: [
                  {
                    title: "기본 프롬프트",
                    content: "기본 데이터 - 중복 검사 불가",
                    category: "default"
                  }
                ],
                metadata: {
                  created: new Date().toISOString(),
                  totalPrompts: 1,
                  source: "default_fallback"
                }
              };
              
              // 전역 변수에 기본 데이터 저장
              window.lastPromptData = defaultData;
              addLogMessage(currentLanguage === 'ko' ? '✅ 기본 데이터 로드 완료' : '✅ Default data loaded');
              
              // data.json 로드 실패 시에도 최종 프롬프트 검증은 필요
              if (currentPrompt) {
                // 최종 프롬프트 유효성 검사
                const validation = validateFinalPrompt(currentPrompt);
                
                if (!validation.isValid) {
                  addLogMessage(currentLanguage === 'ko'
                    ? `❌ data.json 로드 실패했지만 최종 프롬프트도 유효하지 않음: ${validation.error}`
                    : `❌ data.json load failed and final prompt is also invalid: ${validation.error}`);
                  addLogMessage(currentLanguage === 'ko'
                    ? '⏹️ 최종 프롬프트 검증 실패로 다음 단계로 진행하지 않습니다.'
                    : '⏹️ Cannot proceed to next step due to final prompt validation failure.');
                  
                  // 상태를 초기화하여 다음 루프에서 다시 시도
                  trackedSetTimeout(() => {
                    updateProgressStep(3, 'fail');
                    mainLoopState = 0; // 처음부터 다시 시작
                    addLogMessage(currentLanguage === 'ko' 
                      ? '🔄 data.json 로드 실패 + 최종 프롬프트 검증 실패로 상태 초기화: 3 → 0'
                      : '🔄 State reset due to data.json load failure + final prompt validation failure: 3 → 0');
                    isPaused = false;
                  }, MAIN_LOOP_INTERVAL);
                  return; // 다음 단계로 진행하지 않음
                }
                
                // 최종 프롬프트가 유효하면 중복 검사를 건너뛰고 진행
                addLogMessage(currentLanguage === 'ko' ? '⏭️ 중복 검사 건너뜀 - 유효한 새로운 프롬프트로 처리' : '⏭️ Skipping duplicate check - treating as valid new prompt');
                window.lastDuplicationResult = {
                  isDuplicate: false,
                  matches: [],
                  similarity: 0,
                  note: "data.json 로드 실패로 중복 검사 건너뜀, 최종 프롬프트는 유효함"
                };
              } else {
                addLogMessage(currentLanguage === 'ko'
                  ? '❌ data.json 로드 실패 + 최종 프롬프트 없음'
                  : '❌ data.json load failed + no final prompt');
                addLogMessage(currentLanguage === 'ko'
                  ? '⏹️ 최종 프롬프트가 없어 다음 단계로 진행하지 않습니다.'
                  : '⏹️ Cannot proceed to next step without final prompt.');
                
                // 상태를 초기화하여 다음 루프에서 다시 시도
                trackedSetTimeout(() => {
                  updateProgressStep(3, 'warning');
                  mainLoopState = 0; // 처음부터 다시 시작
                  addLogMessage(currentLanguage === 'ko' 
                    ? '🔄 data.json 로드 실패 + 최종 프롬프트 부재로 상태 초기화: 3 → 0'
                    : '🔄 State reset due to data.json load failure + missing final prompt: 3 → 0');
                  isPaused = false;
                }, MAIN_LOOP_INTERVAL);
                return; // 다음 단계로 진행하지 않음
              }
            });
        } else {
          addLogMessage(currentLanguage === 'ko' ? '❌ data.json URL을 가져올 수 없음 - 확장 프로그램 컨텍스트 무효화됨' : '❌ Cannot get data.json URL - extension context invalidated');
          
          // 컨텍스트 무효화 처리
          handleContextInvalidation();
          
          // 기본 데이터로 대체하여 계속 진행
          addLogMessage(currentLanguage === 'ko' ? '💡 기본 데이터로 대체하여 진행합니다.' : '💡 Proceeding with default data.');
          
          const defaultData = {
            prompts: [
              {
                title: "기본 프롬프트",
                content: "기본 데이터 - 확장 프로그램 컨텍스트 무효화로 인한 대체",
                category: "default"
              }
            ],
            metadata: {
              created: new Date().toISOString(),
              totalPrompts: 1,
              source: "context_invalidated_fallback"
            }
          };
          
          // 전역 변수에 기본 데이터 저장
          window.lastPromptData = defaultData;
          
          // 최종 프롬프트가 있으면 검증 후 진행
          if (currentPrompt) {
            const validation = validateFinalPrompt(currentPrompt);
            
            if (validation.isValid) {
              addLogMessage(currentLanguage === 'ko' ? '✅ 최종 프롬프트는 유효함 - 기본 데이터로 진행' : '✅ Final prompt is valid - proceeding with default data');
              window.lastDuplicationResult = {
                isDuplicate: false,
                matches: [],
                similarity: 0,
                note: "확장 프로그램 컨텍스트 무효화로 중복 검사 건너뜀"
              };
            } else {
              addLogMessage(currentLanguage === 'ko'
                ? `❌ 최종 프롬프트도 유효하지 않음: ${validation.error}`
                : `❌ Final prompt is also invalid: ${validation.error}`);
              
              // 상태 초기화
              trackedSetTimeout(() => {
                updateProgressStep(3, 'fail');
                mainLoopState = 0;
                addLogMessage(currentLanguage === 'ko' 
                  ? '🔄 컨텍스트 무효화 + 최종 프롬프트 검증 실패로 상태 초기화: 3 → 0'
                  : '🔄 State reset due to context invalidation + final prompt validation failure: 3 → 0');
                isPaused = false;
              }, MAIN_LOOP_INTERVAL);
              return;
            }
          } else {
            addLogMessage(currentLanguage === 'ko' ? '❌ 최종 프롬프트도 없음' : '❌ No final prompt either');
            
            // 상태 초기화
            trackedSetTimeout(() => {
              updateProgressStep(3, 'warning');
              mainLoopState = 0;
              addLogMessage(currentLanguage === 'ko' 
                ? '🔄 컨텍스트 무효화 + 최종 프롬프트 부재로 상태 초기화: 3 → 0'
                : '🔄 State reset due to context invalidation + missing final prompt: 3 → 0');
              isPaused = false;
            }, MAIN_LOOP_INTERVAL);
            return;
          }
        }
        
        trackedSetTimeout(() => {
          updateProgressStep(3, 'success');
          addLogMessage(currentLanguage === 'ko' ? '✅ case 3 완료 - 중복 검사 단계 끝' : '✅ Case 3 completed - duplicate check stage finished');
          mainLoopState = 4;
          addLogMessage(currentLanguage === 'ko' ? '🔄 상태 변경: 3→4' : '🔄 State change: 3→4');
          addLogMessage(currentLanguage === 'ko' ? '🎨 이미지 생성 단계로 진행' : '🎨 Proceeding to image generation stage');
          isPaused = false;
        }, MAIN_LOOP_INTERVAL);
      }, MAIN_LOOP_INTERVAL);
      break;

    case 4: // 중복 검사 후 이미지 생성 상태 (딜레이 적용)
      updateProgressStep(4);
      isPaused = true;
      addLogMessage(currentLanguage === 'ko' ? '🎯 case 4 진입 - 이미지 생성 단계 시작' : '🎯 Entering case 4 - image generation stage started');
      addLogMessage(currentLanguage === 'ko' ? '🎨 Step 5: 중복 검사 후 이미지 생성 처리 중...' : '🎨 Step 5: Processing image generation after duplicate check...');
      // 중복 검사 결과 확인 로그
      if (window.lastDuplicationResult) {
        addLogMessage(currentLanguage === 'ko' 
          ? `📊 중복 검사 결과: ${window.lastDuplicationResult.isDuplicate ? '중복됨' : '중복 없음'}`
          : `📊 Duplicate check result: ${window.lastDuplicationResult.isDuplicate ? 'Duplicate found' : 'No duplicates'}`);
      } else {
        addLogMessage(currentLanguage === 'ko' ? '⚠️ 중복 검사 결과 없음' : '⚠️ No duplicate check result');
      }
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
    
    // data.json에서 프롬프트 가져오기 (항상 data.json 프롬프트 사용)
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
    
    addLogMessage('🎯 data.json 프롬프트를 사용하여 이미지 생성');
    
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
              
              // 기본 데이터로 대체
              addLogMessage('💡 기본 데이터로 대체합니다...');
              promptData = {
                prompts: [{
                  title: "기본 프롬프트",
                  content: "기본 데이터 - 중복 검사 불가",
                  category: "default"
                }],
                metadata: {
                  created: new Date().toISOString(),
                  totalPrompts: 1,
                  source: "monitoring_fallback"
                }
              };
              addLogMessage('✅ 기본 데이터 로드 완료 - 모니터링 계속 진행');
              monitoringState = 2; // 상태 2로 진행 (0으로 리셋하지 않음)
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
          
          // 좌측 진행 패널도 생성
          console.log('📊 좌측 진행 패널 자동 생성');
          createProgressPanel();
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
        
        // 좌측 진행 패널도 생성
        console.log('📊 좌측 진행 패널 자동 생성');
        createProgressPanel();
      }, 3000);
    } else {
      console.warn('⚠️ 확장 프로그램 컨텍스트가 무효화되어 초기화를 건너뜁니다.');
    }
  }, 1000);
} 

// 좌측 진행 단계 패널 생성 함수
function createProgressPanel() {
  console.log('📊 좌측 진행 단계 패널 생성 시작...');
  
  // 기존 패널 제거
  const existingPanel = document.getElementById('sora-progress-panel');
  if (existingPanel) {
    existingPanel.remove();
  }
  
  // 진행 패널 생성
  const progressPanel = document.createElement('div');
  progressPanel.id = 'sora-progress-panel';
  progressPanel.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    width: 320px;
    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
    border-radius: 15px;
    padding: 20px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    z-index: 9998;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: white;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255,255,255,0.2);
    animation: slideInFromLeft 0.5s ease-out;
  `;
  
  // 애니메이션 CSS 추가
  if (!document.getElementById('progress-panel-styles')) {
    const style = document.createElement('style');
    style.id = 'progress-panel-styles';
    style.textContent = `
      @keyframes slideInFromLeft {
        from { opacity: 0; transform: translateX(-100%); }
        to { opacity: 1; transform: translateX(0); }
      }
    `;
    document.head.appendChild(style);
  }
  
  // 패널 내용
  progressPanel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
      <h3 style="margin: 0; font-size: 16px; font-weight: 600;">📊 진행 단계</h3>
      <button id="progress-minimize" style="background: rgba(255,255,255,0.2); border: none; color: white; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 12px;">−</button>
    </div>
    
    <div style="margin-bottom: 15px;">
      <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px;">현재 단계</div>
      <div id="current-step" style="background: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 8px; font-size: 13px;">
        ✅ 확장 프로그램 로드 완료
      </div>
    </div>
    
    <div style="margin-bottom: 15px;">
      <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px;">수집 현황</div>
      <div style="background: rgba(255,255,255,0.2); padding: 10px; border-radius: 8px;">
        <div style="margin-bottom: 5px; font-size: 12px;">
          📸 정상 이미지: <span id="normal-image-count">0</span>개
        </div>
        <div style="margin-bottom: 5px; font-size: 12px;">
          ⚠️ 정책 위반: <span id="policy-violation-count">0</span>개  
        </div>
        <div style="font-size: 12px;">
          📝 프롬프트: <span id="prompt-count">0</span>개
        </div>
      </div>
    </div>
    
    <div style="margin-bottom: 15px;">
      <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px;">자동 모드 상태</div>
      <div style="background: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 8px; font-size: 12px;">
        <div id="auto-mode-status">🔴 자동 모드: OFF</div>
        <div id="mainloop-status">⏹️ MainLoop: 중지됨</div>
      </div>
    </div>
    
    <div>
      <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px;">다음 단계</div>
      <div id="next-step" style="background: rgba(255,255,255,0.2); padding: 8px 12px; border-radius: 8px; font-size: 12px;">
        🎯 자동 모드를 켜서 모니터링을 시작하세요
      </div>
    </div>
  `;
  
  // 패널을 페이지에 추가
  document.body.appendChild(progressPanel);
  
  // 최소화 버튼 이벤트
  document.getElementById('progress-minimize').addEventListener('click', function() {
    const panel = document.getElementById('sora-progress-panel');
    if (panel.style.height === '60px') {
      // 확장
      panel.style.height = 'auto';
      Array.from(panel.children).forEach((child, index) => {
        if (index > 0) child.style.display = 'block';
      });
      this.textContent = '−';
    } else {
      // 최소화
      panel.style.height = '60px';
      Array.from(panel.children).forEach((child, index) => {
        if (index > 0) child.style.display = 'none';
      });
      this.textContent = '+';
    }
  });
  
  console.log('✅ 좌측 진행 단계 패널 생성 완료');
  
  // 초기 데이터 업데이트
  updateProgressPanelData();
}

// 진행 패널 데이터 업데이트 함수
function updateProgressPanelData() {
  try {
    // 진행 패널이 존재하는지 확인
    const progressPanel = document.getElementById('sora-progress-panel');
    if (!progressPanel) {
      return; // 패널이 없으면 업데이트하지 않음
    }
    
    // 페이지에서 실제 콘텐츠 카운트
    const normalImages = document.querySelectorAll('img[src*="videos.openai.com"], img[src*="openai"]').length;
    const policyViolations = document.querySelectorAll('.lucide-alert-circle').length;
    const totalPrompts = document.querySelectorAll('[class*="text-token-text-primary"]').length;
    
    // UI 업데이트
    const normalImageEl = document.getElementById('normal-image-count');
    const policyViolationEl = document.getElementById('policy-violation-count'); 
    const promptCountEl = document.getElementById('prompt-count');
    const currentStepEl = document.getElementById('current-step');
    const nextStepEl = document.getElementById('next-step');
    const autoModeStatusEl = document.getElementById('auto-mode-status');
    const mainloopStatusEl = document.getElementById('mainloop-status');
    
    if (normalImageEl) normalImageEl.textContent = normalImages;
    if (policyViolationEl) policyViolationEl.textContent = policyViolations;
    if (promptCountEl) promptCountEl.textContent = totalPrompts;
    
    // 현재 단계 업데이트
    if (currentStepEl) {
      if (typeof isGlobalIntervalRunning !== 'undefined' && isGlobalIntervalRunning) {
        const counter = typeof monitoringCounter !== 'undefined' ? monitoringCounter : 0;
        const state = typeof mainLoopState !== 'undefined' ? mainLoopState : 0;
        currentStepEl.innerHTML = `🔄 MainLoop 실행 중 (${counter}/1000, 상태:${state})`;
      } else {
        currentStepEl.innerHTML = '✅ 확장 프로그램 로드 완료';
      }
    }
    
    // 다음 단계 업데이트
    if (nextStepEl) {
      if (typeof isGlobalIntervalRunning !== 'undefined' && isGlobalIntervalRunning) {
        nextStepEl.innerHTML = '🔍 프롬프트 모니터링 진행 중...';
      } else {
        nextStepEl.innerHTML = '🎯 자동 모드를 켜서 모니터링을 시작하세요';
      }
    }
    
    // 자동 모드 상태 업데이트
    if (autoModeStatusEl) {
      const isRunning = typeof isGlobalIntervalRunning !== 'undefined' && isGlobalIntervalRunning;
      autoModeStatusEl.innerHTML = isRunning ? '🟢 자동 모드: ON' : '🔴 자동 모드: OFF';
    }
    
    if (mainloopStatusEl) {
      const isRunning = typeof isGlobalIntervalRunning !== 'undefined' && isGlobalIntervalRunning;
      mainloopStatusEl.innerHTML = isRunning ? '▶️ MainLoop: 실행 중' : '⏹️ MainLoop: 중지됨';
    }
    
  } catch (error) {
    console.warn('진행 패널 데이터 업데이트 중 오류:', error);
  }
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
    autoModeButton.textContent = currentLanguage === 'ko' ? '🔄 자동 모드 ON' : '🔄 Auto Mode ON';
    autoModeButton.style.background = '#28a745';
  } else {
    autoModeButton.textContent = currentLanguage === 'ko' ? '🔄 자동 모드 OFF' : '🔄 Auto Mode OFF';
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
      // 언어 설정에 따라 즉시 업데이트
      setTimeout(() => {
        updateAutoModeButton();
        if (typeof updateProgressPanelData === 'function') {
          updateProgressPanelData(); // 진행 패널도 즉시 업데이트
        }
      }, 100);
      addLogMessage(currentLanguage === 'ko' ? '⏹️ 자동 모드 중지됨' : '⏹️ Auto mode stopped');
    } else {
      startMainLoop();
      // 언어 설정에 따라 즉시 업데이트
      setTimeout(() => {
        updateAutoModeButton();
        if (typeof updateProgressPanelData === 'function') {
          updateProgressPanelData(); // 진행 패널도 즉시 업데이트
        }
      }, 100);
      addLogMessage(currentLanguage === 'ko' ? '▶️ 자동 모드 시작됨' : '▶️ Auto mode started');
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
  progressTitle.className = 'log-title';
  progressTitle.textContent = currentLanguage === 'ko' ? '📊 진행 단계' : '📊 Progress Steps';
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
  
  // 7개 단계 버튼 생성 (언어별 텍스트)
  const stepNames = currentLanguage === 'ko' 
    ? ['초기화', '카운터', '모니터링', '프롬프트', '이미지생성', '저장', '완료']
    : ['Init', 'Counter', 'Monitor', 'Prompt', 'ImageGen', 'Save', 'Complete'];
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
    addLogMessage(currentLanguage === 'ko' ? '🚀 로그 오버레이 생성됨' : '🚀 Log overlay created');
    addLogMessage(currentLanguage === 'ko' ? '📊 main setInterval 모니터링 준비 완료' : '📊 Main setInterval monitoring ready');
    addLogMessage(currentLanguage === 'ko' ? '🔄 자동 모드 버튼을 클릭하여 시작하세요' : '🔄 Click auto mode button to start');
    window.logOverlayInitialized = true;
  }
  
  // 언어 설정 적용
  updateUITexts();
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

  // 메시지 번역 처리
  const translatedMessage = translateLogMessage(message);
  
  const logEntry = document.createElement('div');
  logEntry.style.cssText = `
    margin-bottom: 5px;
    padding: 3px 0;
    border-bottom: 1px solid rgba(0, 255, 0, 0.2);
  `;
  
  const timestamp = new Date().toLocaleTimeString();
  logEntry.textContent = `[${timestamp}] ${translatedMessage}`;
  
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

// 로그 메시지 번역 함수
function translateLogMessage(message) {
  const messageMap = {
    ko: {
      // 기본 시스템 메시지
      '🚀 로그 오버레이 생성됨': '🚀 로그 오버레이 생성됨',
      '📊 main setInterval 모니터링 준비 완료': '📊 main setInterval 모니터링 준비 완료',
      '🔄 자동 모드 버튼을 클릭하여 시작하세요': '🔄 자동 모드 버튼을 클릭하여 시작하세요',
      '⏹️ 자동 모드 중지됨': '⏹️ 자동 모드 중지됨',
      '▶️ 자동 모드 시작됨': '▶️ 자동 모드 시작됨',
      '🧹 메시지 250개 도달 - 로그 및 상태 초기화': '🧹 메시지 250개 도달 - 로그 및 상태 초기화',
      '✅ 로그/상태 초기화 완료': '✅ 로그/상태 초기화 완료',
      
      // 확장 프로그램 컨텍스트 관련
      '🔍 확장 프로그램 컨텍스트 검증:': '🔍 확장 프로그램 컨텍스트 검증:',
      '❌ 확장 프로그램 컨텍스트 검증 실패:': '❌ 확장 프로그램 컨텍스트 검증 실패:',
      '⚠️ 확장 프로그램 컨텍스트가 무효화되어 메시지 전송을 건너뜁니다.': '⚠️ 확장 프로그램 컨텍스트가 무효화되어 메시지 전송을 건너뜁니다.',
      '⚠️ 확장 프로그램 컨텍스트가 무효화됨 - 설정 저장 건너뜀': '⚠️ 확장 프로그램 컨텍스트가 무효화됨 - 설정 저장 건너뜀',
      '⚠️ 확장 프로그램 컨텍스트가 무효화됨 - 페이지를 새로고침해주세요.': '⚠️ 확장 프로그램 컨텍스트가 무효화됨 - 페이지를 새로고침해주세요.',
      '⚠️ 확장 프로그램 컨텍스트가 무효화되어 설정을 저장할 수 없습니다. 페이지를 새로고침해주세요.': '⚠️ 확장 프로그램 컨텍스트가 무효화되어 설정을 저장할 수 없습니다. 페이지를 새로고침해주세요.',
      '💾 모니터링 설정 자동 저장 완료': '💾 모니터링 설정 자동 저장 완료',
      '❌ 메시지 전송 실패:': '❌ 메시지 전송 실패:',
      '메시지 전송 시간 초과': '메시지 전송 시간 초과',
      '🔍 getRuntimeURL 호출:': '🔍 getRuntimeURL 호출:',
      '⚠️ 확장 프로그램 컨텍스트가 무효화되어 URL을 가져올 수 없습니다.': '⚠️ 확장 프로그램 컨텍스트가 무효화되어 URL을 가져올 수 없습니다.',
      '🔗 생성된 URL:': '🔗 생성된 URL:',
      '❌ runtime URL 가져오기 실패:': '❌ runtime URL 가져오기 실패:',
      
      // 프롬프트 모니터링 관련
      '🔍 Sora 페이지에서 현재 프롬프트 검색 중...': '🔍 Sora 페이지에서 현재 프롬프트 검색 중...',
      '📊 자동 모니터링 설정 복원:': '📊 자동 모니터링 설정 복원:',
      '⚙️ 실행주기를 5초로 강제 설정': '⚙️ 실행주기를 5초로 강제 설정',
      '⚠️ 확장 프로그램 컨텍스트가 무효화되어 기본값(true)으로 설정': '⚠️ 확장 프로그램 컨텍스트가 무효화되어 기본값(true)으로 설정',
      '🔄 카운터 초기화됨': '🔄 카운터 초기화됨',
      '✅ 콘텐츠 스크립트 로드 완료': '✅ 콘텐츠 스크립트 로드 완료',
      '⚙️ 실행주기를 5초로 설정': '⚙️ 실행주기를 5초로 설정',
      '🔧 테스트용 로그 오버레이 자동 생성': '🔧 테스트용 로그 오버레이 자동 생성',
      '🔧 테스트용으로 자동 생성된 로그 오버레이입니다.': '🔧 테스트용으로 자동 생성된 로그 오버레이입니다.',
      '📊 자동 모니터링 상태를 확인하세요.': '📊 자동 모니터링 상태를 확인하세요.',
      '⚙️ 실행주기: 5초': '⚙️ 실행주기: 5초',
      
      // 메인 루프 관련
      '🔄 메인 루프 시작': '🔄 메인 루프 시작',
      '⏹️ 메인 루프 중지': '⏹️ 메인 루프 중지',
      '📊 메인 루프 실행 중': '📊 메인 루프 실행 중',
      '✅ 메인 루프 완료': '✅ 메인 루프 완료',
      '❌ 메인 루프 오류': '❌ 메인 루프 오류',
      
      // 진행 단계 관련
      '📋 1단계: 오버레이 관리': '📋 1단계: 오버레이 관리',
      '📊 2단계: 카운터 업데이트': '📊 2단계: 카운터 업데이트',
      '🔍 3단계: 프롬프트 모니터링': '🔍 3단계: 프롬프트 모니터링',
      '💾 4단계: 자동 저장': '💾 4단계: 자동 저장',
      '✅ 5단계: 완료': '✅ 5단계: 완료',
      '🎨 6단계: 이미지 생성': '🎨 6단계: 이미지 생성',
      '📈 7단계: 진행률 업데이트': '📈 7단계: 진행률 업데이트',
      
      // 프롬프트 관련
      '🔍 프롬프트 검색 중': '🔍 프롬프트 검색 중',
      '✅ 프롬프트 발견': '✅ 프롬프트 발견',
      '❌ 프롬프트 없음': '❌ 프롬프트 없음',
      '🔄 프롬프트 변경 감지': '🔄 프롬프트 변경 감지',
      '📝 새 프롬프트 저장': '📝 새 프롬프트 저장',
      '⚠️ 중복 프롬프트 발견': '⚠️ 중복 프롬프트 발견',
      
      // 이미지 생성 관련
      '🎨 이미지 생성 시작': '🎨 이미지 생성 시작',
      '⏳ 이미지 생성 중': '⏳ 이미지 생성 중',
      '✅ 이미지 생성 완료': '✅ 이미지 생성 완료',
      '❌ 이미지 생성 실패': '❌ 이미지 생성 실패',
      '🔄 이미지 생성 대기': '🔄 이미지 생성 대기',
      
      // 저장 관련
      '💾 데이터 저장 중': '💾 데이터 저장 중',
      '✅ 데이터 저장 완료': '✅ 데이터 저장 완료',
      '❌ 데이터 저장 실패': '❌ 데이터 저장 실패',
      '📁 JSON 파일 생성': '📁 JSON 파일 생성',
      '📥 파일 다운로드 준비': '📥 파일 다운로드 준비',
      
      // 상태 관련
      '🟢 모니터링 활성화': '🟢 모니터링 활성화',
      '🔴 모니터링 비활성화': '🔴 모니터링 비활성화',
      '⚙️ 설정 저장': '⚙️ 설정 저장',
      '🔄 설정 로드': '🔄 설정 로드',
      '🧹 상태 초기화': '🧹 상태 초기화',
      
      // 오류 및 경고
      '⚠️ 경고': '⚠️ 경고',
      '❌ 오류 발생': '❌ 오류 발생',
      '🔄 재시도 중': '🔄 재시도 중',
      '⏸️ 일시 중지': '⏸️ 일시 중지',
      '▶️ 재개': '▶️ 재개',
      
      // 언어 변경
      '🌐 언어가 한국어로 변경되었습니다': '🌐 언어가 한국어로 변경되었습니다',
      '🌐 언어가 영어로 변경되었습니다': '🌐 언어가 영어로 변경되었습니다',
      
      // 디버깅 메시지
      '🔧 중복 검사 단계로 강제 진행': '🔧 중복 검사 단계로 강제 진행',
      '🎯 case 3 진입 - 중복 검사 단계 시작': '🎯 case 3 진입 - 중복 검사 단계 시작',
      '✅ case 3 완료 - 중복 검사 단계 끝': '✅ case 3 완료 - 중복 검사 단계 끝',
      '🎨 이미지 생성 단계로 진행': '🎨 이미지 생성 단계로 진행',
      '🎯 case 4 진입 - 이미지 생성 단계 시작': '🎯 case 4 진입 - 이미지 생성 단계 시작',
      '⚠️ 중복 검사 결과 없음': '⚠️ 중복 검사 결과 없음',
      '🎯 data.json 프롬프트를 사용하여 이미지 생성': '🎯 data.json 프롬프트를 사용하여 이미지 생성',
      
      // 최종 프롬프트 검증 관련 (단순화됨)
      '🔍 최종 프롬프트 기반 중복 검사 시작...': '🔍 최종 프롬프트 기반 중복 검사 시작...',
      '⏹️ 최종 프롬프트에 문제가 있어 다음 단계로 진행하지 않습니다.': '⏹️ 최종 프롬프트에 문제가 있어 다음 단계로 진행하지 않습니다.',
      '⏹️ 최종 프롬프트가 없어 다음 단계로 진행하지 않습니다.': '⏹️ 최종 프롬프트가 없어 다음 단계로 진행하지 않습니다.',
      '✅ 중복 없음 - 유효한 새로운 프롬프트': '✅ 중복 없음 - 유효한 새로운 프롬프트',
      '❌ 중복 검사 불가: currentPrompt 또는 data.prompts가 유효하지 않음': '❌ 중복 검사 불가: currentPrompt 또는 data.prompts가 유효하지 않음',
      '❌ 최종 프롬프트 검증 실패:': '❌ 최종 프롬프트 검증 실패:',
      '🚫 오류 코드:': '🚫 오류 코드:',
      '🔄 최종 프롬프트 검증 실패로 인한 상태 초기화: 3 → 0': '🔄 최종 프롬프트 검증 실패로 인한 상태 초기화: 3 → 0',
      '🔄 최종 프롬프트 부재로 인한 상태 초기화: 3 → 0': '🔄 최종 프롬프트 부재로 인한 상태 초기화: 3 → 0',
      
      // data.json 로드 실패 + 최종 프롬프트 검증
      '❌ data.json 로드 실패했지만 최종 프롬프트도 유효하지 않음:': '❌ data.json 로드 실패했지만 최종 프롬프트도 유효하지 않음:',
      '⏭️ 중복 검사 건너뜀 - 유효한 새로운 프롬프트로 처리': '⏭️ 중복 검사 건너뜀 - 유효한 새로운 프롬프트로 처리',
      '❌ data.json 로드 실패 + 최종 프롬프트 없음': '❌ data.json 로드 실패 + 최종 프롬프트 없음',
      '🔄 data.json 로드 실패 + 최종 프롬프트 검증 실패로 상태 초기화: 3 → 0': '🔄 data.json 로드 실패 + 최종 프롬프트 검증 실패로 상태 초기화: 3 → 0',
      '🔄 data.json 로드 실패 + 최종 프롬프트 부재로 상태 초기화: 3 → 0': '🔄 data.json 로드 실패 + 최종 프롬프트 부재로 상태 초기화: 3 → 0',
      
      // 단순화된 검증 메시지
      '최종 프롬프트가 존재하지 않습니다.': '최종 프롬프트가 존재하지 않습니다.',
      '최종 프롬프트가 공백만 있습니다.': '최종 프롬프트가 공백만 있습니다.',
      '최종 프롬프트가 무의미한 내용입니다 (시간, URL 등).': '최종 프롬프트가 무의미한 내용입니다 (시간, URL 등).'
    },
    en: {
      // 기본 시스템 메시지
      '🚀 로그 오버레이 생성됨': '🚀 Log overlay created',
      '📊 main setInterval 모니터링 준비 완료': '📊 Main setInterval monitoring ready',
      '🔄 자동 모드 버튼을 클릭하여 시작하세요': '🔄 Click auto mode button to start',
      '⏹️ 자동 모드 중지됨': '⏹️ Auto mode stopped',
      '▶️ 자동 모드 시작됨': '▶️ Auto mode started',
      '🧹 메시지 250개 도달 - 로그 및 상태 초기화': '🧹 250 messages reached - clearing log and state',
      '✅ 로그/상태 초기화 완료': '✅ Log/state reset complete',
      
      // 확장 프로그램 컨텍스트 관련
      '🔍 확장 프로그램 컨텍스트 검증:': '🔍 Extension context validation:',
      '❌ 확장 프로그램 컨텍스트 검증 실패:': '❌ Extension context validation failed:',
      '⚠️ 확장 프로그램 컨텍스트가 무효화되어 메시지 전송을 건너뜁니다.': '⚠️ Extension context invalidated, skipping message send',
      '⚠️ 확장 프로그램 컨텍스트가 무효화됨 - 설정 저장 건너뜀': '⚠️ Extension context invalidated - skipping settings save',
      '⚠️ 확장 프로그램 컨텍스트가 무효화됨 - 페이지를 새로고침해주세요.': '⚠️ Extension context invalidated - please refresh the page.',
      '⚠️ 확장 프로그램 컨텍스트가 무효화되어 설정을 저장할 수 없습니다. 페이지를 새로고침해주세요.': '⚠️ Extension context invalidated - cannot save settings. Please refresh the page.',
      '💾 모니터링 설정 자동 저장 완료': '💾 Monitoring settings auto-save completed',
      '❌ 메시지 전송 실패:': '❌ Message send failed:',
      '메시지 전송 시간 초과': 'Message send timeout',
      '🔍 getRuntimeURL 호출:': '🔍 getRuntimeURL call:',
      '⚠️ 확장 프로그램 컨텍스트가 무효화되어 URL을 가져올 수 없습니다.': '⚠️ Extension context invalidated, cannot get URL',
      '🔗 생성된 URL:': '🔗 Generated URL:',
      '❌ runtime URL 가져오기 실패:': '❌ Runtime URL fetch failed:',
      
      // 프롬프트 모니터링 관련
      '🔍 Sora 페이지에서 현재 프롬프트 검색 중...': '🔍 Searching for current prompt in Sora page...',
      '📊 자동 모니터링 설정 복원:': '📊 Auto monitoring settings restored:',
      '⚙️ 실행주기를 5초로 강제 설정': '⚙️ Forcing execution cycle to 5 seconds',
      '⚠️ 확장 프로그램 컨텍스트가 무효화되어 기본값(true)으로 설정': '⚠️ Extension context invalidated, using default (true)',
      '🔄 카운터 초기화됨': '🔄 Counter reset',
      '✅ 콘텐츠 스크립트 로드 완료': '✅ Content script load complete',
      '⚙️ 실행주기를 5초로 설정': '⚙️ Setting execution cycle to 5 seconds',
      '🔧 테스트용 로그 오버레이 자동 생성': '🔧 Auto-creating test log overlay',
      '🔧 테스트용으로 자동 생성된 로그 오버레이입니다.': '🔧 This is an auto-generated test log overlay',
      '📊 자동 모니터링 상태를 확인하세요.': '📊 Check auto monitoring status',
      '⚙️ 실행주기: 5초': '⚙️ Execution cycle: 5 seconds',
      
      // 메인 루프 관련
      '🔄 메인 루프 시작': '🔄 Main loop started',
      '⏹️ 메인 루프 중지': '⏹️ Main loop stopped',
      '📊 메인 루프 실행 중': '📊 Main loop running',
      '✅ 메인 루프 완료': '✅ Main loop completed',
      '❌ 메인 루프 오류': '❌ Main loop error',
      
      // 진행 단계 관련
      '📋 1단계: 오버레이 관리': '📋 Step 1: Overlay Management',
      '📊 2단계: 카운터 업데이트': '📊 Step 2: Counter Update',
      '🔍 3단계: 프롬프트 모니터링': '🔍 Step 3: Prompt Monitoring',
      '💾 4단계: 자동 저장': '💾 Step 4: Auto Save',
      '✅ 5단계: 완료': '✅ Step 5: Complete',
      '🎨 6단계: 이미지 생성': '🎨 Step 6: Image Generation',
      '📈 7단계: 진행률 업데이트': '📈 Step 7: Progress Update',
      
      // 프롬프트 관련
      '🔍 프롬프트 검색 중': '🔍 Searching for prompt',
      '✅ 프롬프트 발견': '✅ Prompt found',
      '❌ 프롬프트 없음': '❌ No prompt found',
      '🔄 프롬프트 변경 감지': '🔄 Prompt change detected',
      '📝 새 프롬프트 저장': '📝 Saving new prompt',
      '⚠️ 중복 프롬프트 발견': '⚠️ Duplicate prompt found',
      
      // 이미지 생성 관련
      '🎨 이미지 생성 시작': '🎨 Image generation started',
      '⏳ 이미지 생성 중': '⏳ Image generation in progress',
      '✅ 이미지 생성 완료': '✅ Image generation completed',
      '❌ 이미지 생성 실패': '❌ Image generation failed',
      '🔄 이미지 생성 대기': '🔄 Waiting for image generation',
      
      // 저장 관련
      '💾 데이터 저장 중': '💾 Saving data',
      '✅ 데이터 저장 완료': '✅ Data saved successfully',
      '❌ 데이터 저장 실패': '❌ Data save failed',
      '📁 JSON 파일 생성': '📁 Creating JSON file',
      '📥 파일 다운로드 준비': '📥 Preparing file download',
      
      // 상태 관련
      '🟢 모니터링 활성화': '🟢 Monitoring enabled',
      '🔴 모니터링 비활성화': '🔴 Monitoring disabled',
      '⚙️ 설정 저장': '⚙️ Settings saved',
      '🔄 설정 로드': '🔄 Settings loaded',
      '🧹 상태 초기화': '🧹 State reset',
      
      // 오류 및 경고
      '⚠️ 경고': '⚠️ Warning',
      '❌ 오류 발생': '❌ Error occurred',
      '🔄 재시도 중': '🔄 Retrying',
      '⏸️ 일시 중지': '⏸️ Paused',
      '▶️ 재개': '▶️ Resumed',
      
      // 언어 변경
      '🌐 언어가 한국어로 변경되었습니다': '🌐 Language changed to Korean',
      '🌐 언어가 영어로 변경되었습니다': '🌐 Language changed to English',
      
      // 디버깅 메시지
      '🔧 중복 검사 단계로 강제 진행': '🔧 Forcing to duplicate check stage',
      '🎯 case 3 진입 - 중복 검사 단계 시작': '🎯 Entering case 3 - duplicate check stage started',
      '✅ case 3 완료 - 중복 검사 단계 끝': '✅ Case 3 completed - duplicate check stage finished',
      '🎨 이미지 생성 단계로 진행': '🎨 Proceeding to image generation stage',
      '🎯 case 4 진입 - 이미지 생성 단계 시작': '🎯 Entering case 4 - image generation stage started',
      '⚠️ 중복 검사 결과 없음': '⚠️ No duplicate check result',
      '🎯 data.json 프롬프트를 사용하여 이미지 생성': '🎯 Using data.json prompt for image generation',
      
      // 최종 프롬프트 검증 관련 (단순화됨)
      '🔍 최종 프롬프트 기반 중복 검사 시작...': '🔍 Final prompt based duplicate check started...',
      '⏹️ 최종 프롬프트에 문제가 있어 다음 단계로 진행하지 않습니다.': '⏹️ Cannot proceed to next step due to final prompt issues.',
      '⏹️ 최종 프롬프트가 없어 다음 단계로 진행하지 않습니다.': '⏹️ Cannot proceed to next step without final prompt.',
      '✅ 중복 없음 - 유효한 새로운 프롬프트': '✅ No duplicates - valid new prompt',
      '❌ 중복 검사 불가: currentPrompt 또는 data.prompts가 유효하지 않음': '❌ Cannot perform duplicate check: currentPrompt or data.prompts is invalid',
      '❌ 최종 프롬프트 검증 실패:': '❌ Final prompt validation failed:',
      '🚫 오류 코드:': '🚫 Error code:',
      '🔄 최종 프롬프트 검증 실패로 인한 상태 초기화: 3 → 0': '🔄 State reset due to final prompt validation failure: 3 → 0',
      '🔄 최종 프롬프트 부재로 인한 상태 초기화: 3 → 0': '🔄 State reset due to missing final prompt: 3 → 0',
      
      // data.json 로드 실패 + 최종 프롬프트 검증
      '❌ data.json 로드 실패했지만 최종 프롬프트도 유효하지 않음:': '❌ data.json load failed and final prompt is also invalid:',
      '⏭️ 중복 검사 건너뜀 - 유효한 새로운 프롬프트로 처리': '⏭️ Skipping duplicate check - treating as valid new prompt',
      '❌ data.json 로드 실패 + 최종 프롬프트 없음': '❌ data.json load failed + no final prompt',
      '🔄 data.json 로드 실패 + 최종 프롬프트 검증 실패로 상태 초기화: 3 → 0': '🔄 State reset due to data.json load failure + final prompt validation failure: 3 → 0',
      '🔄 data.json 로드 실패 + 최종 프롬프트 부재로 상태 초기화: 3 → 0': '🔄 State reset due to data.json load failure + missing final prompt: 3 → 0',
      
      // 단순화된 검증 메시지
      '최종 프롬프트가 존재하지 않습니다.': 'Final prompt does not exist.',
      '최종 프롬프트가 공백만 있습니다.': 'Final prompt contains only whitespace.',
      '최종 프롬프트가 무의미한 내용입니다 (시간, URL 등).': 'Final prompt contains meaningless content (time, URL, etc).'
    }
  };
  
  const currentMessages = messageMap[currentLanguage] || messageMap.en;
  
  // 정확한 매치가 있으면 번역된 메시지 반환
  if (currentMessages[message]) {
    return currentMessages[message];
  }
  
  // 부분 매치 검색 (메시지가 포함된 경우)
  for (const [original, translated] of Object.entries(currentMessages)) {
    if (message.includes(original)) {
      return message.replace(original, translated);
    }
  }
  
  // 번역할 수 없는 경우 원본 메시지 반환
  return message;
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

// 확장 프로그램 컨텍스트 유효성 검사 함수
function isExtensionContextValid() {
  try {
    // Chrome 확장 프로그램 API가 존재하는지 확인
    if (!chrome || !chrome.runtime) {
      console.log('🔍 확장 프로그램 컨텍스트 검증: chrome.runtime 없음');
      return false;
    }
    
    // runtime.id가 존재하는지 확인 (컨텍스트가 유효한 경우에만 존재)
    if (!chrome.runtime.id) {
      console.log('🔍 확장 프로그램 컨텍스트 검증: chrome.runtime.id 없음');
      return false;
    }
    
    // lastError가 설정되어 있는지 확인
    if (chrome.runtime.lastError) {
      console.log('🔍 확장 프로그램 컨텍스트 검증: lastError 존재 -', chrome.runtime.lastError.message);
      return false;
    }
    
    // console.log('✅ 확장 프로그램 컨텍스트 유효함');
    return true;
    
  } catch (error) {
    console.log('❌ 확장 프로그램 컨텍스트 검증 실패:', error.message);
    return false;
  }
}

// Chrome storage 안전 저장 함수 (컨텍스트 무효화 대응)
function safeStorageSet(data, callback) {
  try {
    if (!isExtensionContextValid()) {
      console.warn('⚠️ 확장 프로그램 컨텍스트가 무효화되어 설정을 저장할 수 없습니다.');
      if (callback) callback({ success: false, error: 'Extension context invalidated' });
      return;
    }
    
    chrome.storage.local.set(data, function() {
      if (chrome.runtime.lastError) {
        console.error('❌ 설정 저장 실패:', chrome.runtime.lastError.message);
        if (callback) callback({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('💾 설정 저장 성공:', Object.keys(data));
        if (callback) callback({ success: true });
      }
    });
    
  } catch (error) {
    console.error('❌ 설정 저장 중 오류:', error);
    if (callback) callback({ success: false, error: error.message });
  }
}

// Chrome storage 안전 로드 함수 (컨텍스트 무효화 대응)
function safeStorageGet(keys, callback) {
  try {
    if (!isExtensionContextValid()) {
      console.warn('⚠️ 확장 프로그램 컨텍스트가 무효화되어 설정을 로드할 수 없습니다.');
      if (callback) callback({});
      return;
    }
    
    chrome.storage.local.get(keys, function(result) {
      if (chrome.runtime.lastError) {
        console.error('❌ 설정 로드 실패:', chrome.runtime.lastError.message);
        if (callback) callback({});
      } else {
        console.log('📂 설정 로드 성공:', Object.keys(result));
        if (callback) callback(result);
      }
    });
    
  } catch (error) {
    console.error('❌ 설정 로드 중 오류:', error);
    if (callback) callback({});
  }
}

// Chrome runtime URL 안전 생성 함수 (컨텍스트 무효화 대응)
function getRuntimeURL(path) {
  try {
    console.log('🔍 getRuntimeURL 호출:', path);
    
    if (!isExtensionContextValid()) {
      console.warn('⚠️ 확장 프로그램 컨텍스트가 무효화되어 URL을 가져올 수 없습니다.');
      return null;
    }
    
    const url = chrome.runtime.getURL(path);
    console.log('🔗 생성된 URL:', url);
    return url;
    
  } catch (error) {
    console.error('❌ runtime URL 가져오기 실패:', error);
    return null;
  }
}

// 컨텍스트 무효화 복구 함수
function handleContextInvalidation() {
  console.warn('⚠️ 확장 프로그램 컨텍스트가 무효화됨 - 페이지를 새로고침해주세요.');
  
  // UI에 경고 메시지 표시
  addLogMessage('⚠️ 확장 프로그램 컨텍스트가 무효화됨 - 페이지를 새로고침해주세요.');
  
  // 자동 모니터링 중지
  if (typeof isAutoMonitoringEnabled !== 'undefined' && isAutoMonitoringEnabled) {
    console.log('⏹️ 컨텍스트 무효화로 자동 모니터링 중지');
    if (typeof mainInterval !== 'undefined' && mainInterval) {
      clearInterval(mainInterval);
      mainInterval = null;
    }
    isAutoMonitoringEnabled = false;
    updateAutoModeButton();
  }
  
  // 진행률 UI 제거
  const progressContainer = document.getElementById('image-progress-container');
  if (progressContainer) {
    progressContainer.remove();
  }
}

// 메시지 전송 안전 함수 (컨텍스트 무효화 대응)
function safeSendMessage(message, callback) {
  try {
    if (!isExtensionContextValid()) {
      console.warn('⚠️ 확장 프로그램 컨텍스트가 무효화되어 메시지 전송을 건너뜁니다.');
      if (callback) callback({ success: false, error: 'Extension context invalidated' });
      return;
    }
    
    // 타임아웃 설정 (5초)
    const timeoutId = setTimeout(() => {
      console.error('❌ 메시지 전송 실패: 메시지 전송 시간 초과');
      if (callback) callback({ success: false, error: '메시지 전송 시간 초과' });
    }, 5000);
    
    chrome.runtime.sendMessage(message, function(response) {
      clearTimeout(timeoutId);
      
      if (chrome.runtime.lastError) {
        console.error('❌ 메시지 전송 실패:', chrome.runtime.lastError.message);
        if (callback) callback({ success: false, error: chrome.runtime.lastError.message });
      } else {
        console.log('✅ 메시지 전송 성공:', response);
        if (callback) callback(response || { success: true });
      }
    });
    
  } catch (error) {
    console.error('❌ 메시지 전송 중 오류:', error);
    if (callback) callback({ success: false, error: error.message });
  }
}