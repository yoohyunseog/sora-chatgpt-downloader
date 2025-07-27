// JSON 파일 기반 자동화 시스템
// save_prompt.json에서 프롬프트를 읽어와서 자동으로 이미지 생성 후 load_prompt.json에 저장

class JsonAutomationSystem {
    constructor() {
        this.isRunning = false;
        this.checkInterval = null;
        this.checkIntervalMs = 15000; // 15초마다 확인
        this.dataFolder = 'extension_data';
        this.savePromptFile = 'save_prompt.json';
        this.loadPromptFile = 'load_prompt.json';
        this.currentProcessingPrompt = null;
        
        console.log('🔄 JSON 자동화 시스템 초기화 완료');
    }

    // 파일 경로 생성
    getFilePath(filename) {
        return `${this.dataFolder}/${filename}`;
    }

    // JSON 파일 읽기
    async readJsonFile(filename) {
        try {
            const filePath = this.getFilePath(filename);
            const response = await fetch(chrome.runtime.getURL(filePath));
            if (response.ok) {
                const data = await response.json();
                console.log(`📖 ${filename} 읽기 성공:`, data);
                return data;
            } else {
                console.log(`📖 ${filename} 파일이 없거나 읽기 실패`);
                return null;
            }
        } catch (error) {
            console.error(`❌ ${filename} 읽기 오류:`, error);
            return null;
        }
    }

    // JSON 파일 쓰기 (Chrome Extension에서는 직접 파일 쓰기가 제한적이므로 localStorage 사용)
    async writeJsonFile(filename, data) {
        try {
            const filePath = this.getFilePath(filename);
            const jsonData = JSON.stringify(data, null, 2);
            
            // localStorage에 저장 (실제 파일 시스템 대신)
            localStorage.setItem(`json_${filename}`, jsonData);
            
            console.log(`💾 ${filename} 저장 성공:`, data);
            return true;
        } catch (error) {
            console.error(`❌ ${filename} 저장 오류:`, error);
            return false;
        }
    }

    // save_prompt.json에서 프롬프트 읽기 (Chrome Storage + localStorage)
    async readSavePrompt() {
        try {
            // Chrome Storage에서 읽기 (우선)
            return new Promise((resolve) => {
                chrome.storage.sync.get(['save_prompt_data'], (result) => {
                    if (result.save_prompt_data) {
                        console.log('📖 Chrome Storage에서 save_prompt.json 읽기 성공:', result.save_prompt_data);
                        resolve(result.save_prompt_data);
                    } else {
                        // localStorage에서 읽기 (백업)
                        const savedData = localStorage.getItem(`json_${this.savePromptFile}`);
                        if (savedData) {
                            const data = JSON.parse(savedData);
                            console.log('📖 localStorage에서 save_prompt.json 읽기 성공:', data);
                            resolve(data);
                        } else {
                            console.log('📖 저장된 프롬프트 데이터가 없습니다.');
                            resolve(null);
                        }
                    }
                });
            });
        } catch (error) {
            console.error('❌ save_prompt.json 읽기 오류:', error);
            return null;
        }
    }

    // load_prompt.json에 결과 저장 (localStorage 사용)
    async saveToLoadPrompt(prompt, imageUrl, status = 'completed') {
        try {
            // 기존 데이터 읽기 (localStorage에서)
            const existingDataStr = localStorage.getItem(`json_${this.loadPromptFile}`);
            const existingData = existingDataStr ? JSON.parse(existingDataStr) : { results: [] };
            
            // 새 결과 추가
            const newResult = {
                id: Date.now(),
                prompt: prompt,
                imageUrl: imageUrl,
                status: status,
                timestamp: new Date().toISOString(),
                processingTime: this.currentProcessingPrompt ? 
                    Date.now() - this.currentProcessingPrompt.startTime : null
            };
            
            existingData.results.push(newResult);
            
            // 최근 50개만 유지
            if (existingData.results.length > 50) {
                existingData.results = existingData.results.slice(-50);
            }
            
            // localStorage에 저장
            localStorage.setItem(`json_${this.loadPromptFile}`, JSON.stringify(existingData));
            
            console.log('✅ load_prompt.json에 결과 저장 완료:', newResult);
            return true;
        } catch (error) {
            console.error('❌ load_prompt.json 저장 오류:', error);
            return false;
        }
    }

    // save_prompt.json 초기화
    async clearSavePrompt() {
        try {
            const emptyData = { prompts: [] };
            await this.writeJsonFile(this.savePromptFile, emptyData);
            
            // localStorage도 초기화
            localStorage.removeItem(`json_${this.savePromptFile}`);
            
            console.log('🗑️ save_prompt.json 초기화 완료 (파일 + localStorage)');
            return true;
        } catch (error) {
            console.error('❌ save_prompt.json 초기화 오류:', error);
            return false;
        }
    }

    // localStorage 초기화 (수동)
    clearLocalStorage() {
        try {
            localStorage.removeItem(`json_${this.savePromptFile}`);
            localStorage.removeItem(`json_${this.loadPromptFile}`);
            console.log('🗑️ localStorage 초기화 완료');
            return true;
        } catch (error) {
            console.error('❌ localStorage 초기화 오류:', error);
            return false;
        }
    }

    // 프롬프트 데이터 저장 (Chrome Storage + localStorage) - 1개씩만
    setPromptData(prompts) {
        try {
            // 1개씩만 처리하도록 첫 번째 프롬프트만 사용
            const singlePrompt = Array.isArray(prompts) && prompts.length > 0 ? [prompts[0]] : prompts;
            
            const data = {
                prompts: singlePrompt,
                timestamp: new Date().toISOString()
            };
            
            // Chrome Storage에 저장 (우선)
            chrome.storage.sync.set({save_prompt_data: data}, () => {
                console.log('💾 Chrome Storage에 프롬프트 데이터 저장 완료 (1개):', data);
            });
            
            // localStorage에도 백업 저장
            localStorage.setItem(`json_${this.savePromptFile}`, JSON.stringify(data));
            console.log('💾 localStorage에 프롬프트 데이터 백업 완료 (1개):', data);
            
            return true;
        } catch (error) {
            console.error('❌ 프롬프트 저장 오류:', error);
            return false;
        }
    }

    // localStorage에서 프롬프트 데이터 직접 가져오기
    getPromptData() {
        try {
            const savedData = localStorage.getItem(`json_${this.savePromptFile}`);
            if (savedData) {
                const data = JSON.parse(savedData);
                console.log('📖 localStorage에서 프롬프트 데이터 읽기 완료:', data);
                return data;
            }
            return null;
        } catch (error) {
            console.error('❌ localStorage 프롬프트 읽기 오류:', error);
            return null;
        }
    }

    // Sora 자동화 실행 (간단한 버전)
    async runSoraAutomation(promptText) {
        try {
            console.log('🔄 Sora 자동화 시작:', promptText);
            this.logToPopup('🔄 Sora 자동화 시작');
            
            // 수동 모드의 입력폼과 버튼을 사용
            this.logToPopup('🎯 수동 모드 입력폼을 통한 처리');
            
            // 팝업의 수동 모드 입력폼에 프롬프트 설정
            if (window.chrome && window.chrome.runtime && window.chrome.runtime.id) {
                try {
                    // 팝업에 프롬프트 전송
                    await chrome.runtime.sendMessage({
                        action: 'setManualPrompt',
                        prompt: promptText
                    });
                    
                    this.logToPopup('📝 수동 모드 입력폼에 프롬프트 설정 완료');
                    
                    // 수동 모드 버튼 자동 클릭
                    await chrome.runtime.sendMessage({
                        action: 'clickManualButton'
                    });
                    
                    this.logToPopup('🚀 수동 모드 버튼 자동 클릭 완료');
                    
                } catch (error) {
                    console.error('❌ 팝업 통신 오류:', error);
                    this.logToPopup('❌ 팝업 통신 오류');
                    throw new Error('팝업과의 통신에 실패했습니다.');
                }
            } else {
                throw new Error('Chrome Extension 환경이 아닙니다.');
            }
            
            // 수동 모드 버튼 클릭 후 이미지 생성 결과 대기
            this.logToPopup('⏳ 수동 모드 버튼 클릭 완료, 이미지 생성 결과 대기 중...');
            
            // 잠시 대기 (수동 모드 버튼 클릭 후 처리 시간)
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            // 이미지 생성 결과 대기 및 실패 감지
            return new Promise(async (resolve) => {
                let attempts = 0;
                const maxAttempts = 3;
                const checkInterval = 5000; // 5초마다 확인
                const maxWaitTime = 60000; // 최대 60초 대기
                const startTime = Date.now();
                
                const checkForResult = async () => {
                    attempts++;
                    console.log(`🔍 이미지 생성 결과 확인 (시도 ${attempts}/${maxAttempts})`);
                    this.logToPopup(`🔍 이미지 생성 결과 확인 (시도 ${attempts}/${maxAttempts})`);
                    
                    try {
                        // 1. "Image trashed" 또는 실패 메시지 확인
                        const errorElements = document.querySelectorAll('*');
                        let hasError = false;
                        let errorMessage = '';
                        
                        for (const element of errorElements) {
                            const text = element.textContent || '';
                            if (text.includes('Image trashed') || 
                                text.includes('Failed to generate') ||
                                text.includes('Error') ||
                                text.includes('실패') ||
                                text.includes('오류')) {
                                hasError = true;
                                errorMessage = text.trim();
                                break;
                            }
                        }
                        
                        if (hasError) {
                            console.log('❌ 이미지 생성 실패 감지:', errorMessage);
                            this.logToPopup(`❌ 이미지 생성 실패: ${errorMessage}`);
                            
                            if (attempts < maxAttempts) {
                                this.logToPopup(`🔄 재시도 중... (${attempts + 1}/${maxAttempts})`);
                                
                                // 잠시 대기 후 재시도
                                await new Promise(resolve => setTimeout(resolve, 3000));
                                
                                // 프롬프트 다시 입력
                                promptInput.focus();
                                promptInput.value = promptText;
                                promptInput.dispatchEvent(new Event('input', { bubbles: true }));
                                promptInput.dispatchEvent(new Event('change', { bubbles: true }));
                                
                                // 버튼 다시 클릭
                                if (generateBtn) {
                                    generateBtn.click();
                                    this.logToPopup('🔄 재시도: 이미지 생성 버튼 클릭');
                                } else {
                                    promptInput.dispatchEvent(new KeyboardEvent('keydown', {
                                        key: 'Enter',
                                        code: 'Enter',
                                        keyCode: 13,
                                        which: 13,
                                        bubbles: true
                                    }));
                                    this.logToPopup('🔄 재시도: Enter 키로 이미지 생성 시작');
                                }
                                
                                // 다음 확인까지 대기
                                setTimeout(checkForResult, checkInterval);
                                return;
                            } else {
                                this.logToPopup('❌ 최대 재시도 횟수 초과');
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
                                this.logToPopup('✅ 이미지 생성 성공 감지');
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
                            this.logToPopup('⏰ 이미지 생성 시간 초과');
                            resolve({
                                success: false,
                                error: '이미지 생성 시간 초과',
                                message: '60초 대기 후 시간 초과'
                            });
                            return;
                        }
                        
                        // 4. 아직 처리 중인 경우 다음 확인까지 대기
                        console.log('⏳ 이미지 생성 처리 중...');
                        this.logToPopup('⏳ 이미지 생성 처리 중...');
                        setTimeout(checkForResult, checkInterval);
                        
                    } catch (error) {
                        console.error('❌ 이미지 생성 결과 확인 중 오류:', error);
                        this.logToPopup(`❌ 이미지 생성 결과 확인 중 오류: ${error.message}`);
                        
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
            
        } catch (error) {
            console.error('❌ Sora 자동화 오류:', error);
            this.logToPopup(`❌ Sora 자동화 오류: ${error.message}`);
            throw error;
        }
    }

    // 프롬프트 처리
    async processPrompt(promptData) {
        try {
            console.log('🔄 프롬프트 처리 시작:', promptData);
            this.logToPopup('🔄 프롬프트 처리 시작');
            this.logToPopup(`📝 프롬프트: ${promptData.prompt ? promptData.prompt.substring(0, 50) + '...' : 'undefined'}`);
            
            // 현재 처리 중인 프롬프트 설정
            this.currentProcessingPrompt = {
                prompt: promptData.prompt,
                startTime: Date.now()
            };
            
            // 상태 업데이트
            this.updateAutoStatus('processing', `처리 중: ${promptData.prompt ? promptData.prompt.substring(0, 30) + '...' : 'undefined'}`);
            
            // 현재 페이지에서 자동화 실행 (Content Script에서 직접 실행)
            this.logToPopup('✅ Sora 페이지에서 자동화 실행');
            
            // 현재 페이지에서 직접 자동화 실행
            const result = await this.runSoraAutomation(promptData.prompt);
            
            if (result && result.success && result.imageUrl) {
                // 성공적으로 이미지 생성된 경우
                this.logToPopup('✅ 이미지 생성 성공');
                this.logToPopup(`🖼️ 이미지 URL: ${result.imageUrl ? result.imageUrl.substring(0, 50) + '...' : 'undefined'}`);
                await this.saveToLoadPrompt(promptData.prompt, result.imageUrl, 'completed');
                this.updateAutoStatus('on', `완료: ${promptData.prompt ? promptData.prompt.substring(0, 30) + '...' : 'undefined'}`);
            } else {
                // 실패한 경우
                this.logToPopup('❌ 이미지 생성 실패');
                await this.saveToLoadPrompt(promptData.prompt, null, 'failed');
                this.updateAutoStatus('on', `실패: ${promptData.prompt ? promptData.prompt.substring(0, 30) + '...' : 'undefined'}`);
                // save_prompt.json 초기화 (재시도 전에)
                await this.clearSavePrompt();
            }
            
            // 처리 완료
            this.currentProcessingPrompt = null;
            
            console.log('✅ 프롬프트 처리 완료');
            this.logToPopup('✅ 프롬프트 처리 완료');
            return true;
            
        } catch (error) {
            console.error('❌ 프롬프트 처리 오류:', error);
            this.logToPopup(`❌ 프롬프트 처리 오류: ${error.message}`);
            // 오류 상태로 저장
            await this.saveToLoadPrompt(promptData.prompt, null, 'error');
            this.updateAutoStatus('on', `오류: ${error.message}`);
            // save_prompt.json 초기화 (재시도 전에)
            await this.clearSavePrompt();
            this.currentProcessingPrompt = null;
            return false;
        }
    }

    // 자동화 상태 업데이트
    updateAutoStatus(status, message) {
        const autoStatus = document.getElementById('autoStatus');
        if (autoStatus) {
            autoStatus.className = `auto-status ${status}`;
            autoStatus.textContent = message;
        }
        
        // 토글 상태도 업데이트
        const toggleSwitch = document.getElementById('toggleSwitch');
        const toggleStatus = document.getElementById('toggleStatus');
        
        if (toggleSwitch && toggleStatus) {
            if (status === 'on' || status === 'processing') {
                toggleSwitch.classList.add('active');
                toggleStatus.textContent = status === 'processing' ? 'ON - 처리 중' : 'ON - 자동 모드';
            } else {
                toggleSwitch.classList.remove('active');
                toggleStatus.textContent = 'OFF - 수동 모드';
            }
        }
    }

    // 자동화 시작
    start() {
        if (this.isRunning) {
            console.log('⚠️ 자동화가 이미 실행 중입니다.');
            this.logToPopup('⚠️ 자동화가 이미 실행 중입니다.');
            return;
        }
        
        this.isRunning = true;
        this.updateAutoStatus('on', '🟢 자동화 활성화 - 대기 중');
        
        console.log('🚀 JSON 자동화 시작');
        this.logToPopup('🚀 JSON 자동화 시작');
        this.logToPopup(`⏰ 확인 간격: ${this.checkIntervalMs / 1000}초`);
        this.logToPopup('📂 save_prompt.json 모니터링 시작');
        
        // 즉시 첫 번째 확인
        this.checkForNewPrompts();
        
        // 15초마다 확인
        this.checkInterval = setInterval(() => {
            this.checkForNewPrompts();
        }, this.checkIntervalMs);
    }

    // 자동화 중지
    stop() {
        if (!this.isRunning) {
            console.log('⚠️ 자동화가 실행 중이 아닙니다.');
            this.logToPopup('⚠️ 자동화가 실행 중이 아닙니다.');
            return;
        }
        
        this.isRunning = false;
        this.updateAutoStatus('off', '🔴 자동화 비활성화');
        
        console.log('⏹️ JSON 자동화 중지');
        this.logToPopup('⏹️ JSON 자동화 중지');
        this.logToPopup('📂 save_prompt.json 모니터링 중지');
        
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        
        // 현재 처리 중인 프롬프트가 있으면 중단
        if (this.currentProcessingPrompt) {
            console.log('⚠️ 현재 처리 중인 프롬프트 중단');
            this.logToPopup('⚠️ 현재 처리 중인 프롬프트 중단');
            this.currentProcessingPrompt = null;
        }
    }

    // 새로운 프롬프트 확인
    async checkForNewPrompts() {
        try {
            console.log('🔍 새로운 프롬프트 확인 중...');
            this.logToPopup('🔍 새로운 프롬프트 확인 중...');
            
            // 현재 처리 중인 프롬프트가 있으면 건너뛰기
            if (this.currentProcessingPrompt) {
                console.log('⏳ 현재 처리 중인 프롬프트가 있어서 건너뜀');
                this.logToPopup('⏳ 현재 처리 중인 프롬프트가 있어서 건너뜀');
                return;
            }
            
            // save_prompt.json 읽기
            const savePromptData = await this.readSavePrompt();
            
            if (savePromptData && savePromptData.prompts && savePromptData.prompts.length > 0) {
                console.log(`📝 새로운 프롬프트 1개 발견`);
                this.logToPopup(`📝 새로운 프롬프트 1개 발견`);
                
                // 첫 번째 프롬프트만 처리 (1개씩만)
                const firstPrompt = savePromptData.prompts[0];
                this.logToPopup(`🎯 처리할 프롬프트: ${firstPrompt.prompt ? firstPrompt.prompt.substring(0, 30) + '...' : 'undefined'}`);
                await this.processPrompt(firstPrompt);
                
            } else {
                console.log('📝 새로운 프롬프트 없음');
                this.logToPopup('📝 새로운 프롬프트 없음');
            }
            
        } catch (error) {
            console.error('❌ 프롬프트 확인 오류:', error);
            this.logToPopup(`❌ 프롬프트 확인 오류: ${error.message}`);
        }
    }

    // 토글 상태 변경
    toggle() {
        if (this.isRunning) {
            this.stop();
        } else {
            this.start();
        }
    }
    
    // 수동 모드에서 프롬프트 실행 (1개씩만)
    async runManualPrompt(promptText) {
        if (!promptText || promptText.trim() === '') {
            console.error('❌ 프롬프트가 비어있습니다.');
            this.logToPopup('❌ 프롬프트가 비어있습니다.');
            return;
        }
        
        console.log('🎯 수동 모드에서 프롬프트 실행 (1개):', promptText);
        this.logToPopup('🎯 수동 모드에서 프롬프트 실행 (1개)');
                    this.logToPopup(`📝 프롬프트: ${promptText ? promptText.substring(0, 30) + '...' : 'undefined'}`);
        
        try {
            await this.runSoraAutomation(promptText);
            this.logToPopup('✅ 수동 모드 실행 완료 (1개)');
        } catch (error) {
            console.error('❌ 수동 모드 실행 실패:', error);
            this.logToPopup('❌ 수동 모드 실행 실패');
        }
    }
    
    // 자동화 ON 상태에서 수동 프롬프트를 자동화 시스템으로 처리 (페이지 조작 없이) - 1개씩만
    async runManualPromptInAutomation(promptText) {
        if (!promptText || promptText.trim() === '') {
            console.error('❌ 프롬프트가 비어있습니다.');
            this.logToPopup('❌ 프롬프트가 비어있습니다.');
            return;
        }
        
        console.log('🚀 자동화 ON 상태에서 수동 프롬프트 처리 (1개):', promptText);
        this.logToPopup('🚀 자동화 ON 상태에서 수동 프롬프트 처리 시작 (1개)');
                    this.logToPopup(`📝 입력된 프롬프트: ${promptText ? promptText.substring(0, 30) + '...' : 'undefined'}`);
        
        try {
            // 현재 처리 중인 프롬프트 설정
            this.currentProcessingPrompt = {
                prompt: promptText,
                startTime: Date.now()
            };
            
            // 상태 업데이트
            this.updateAutoStatus('processing', `수동 처리 중 (1개): ${promptText ? promptText.substring(0, 30) + '...' : 'undefined'}`);
            
            // 페이지 조작 없이 자동화 시스템만 사용
            this.logToPopup('🤖 자동화 시스템을 통한 처리 (페이지 조작 없음, 1개)');
            
            // 수동 프롬프트를 save_prompt.json에 추가하여 자동화 시스템이 처리하도록 함 (1개씩만)
            const newPrompt = {
                prompt: promptText,
                timestamp: new Date().toISOString(),
                status: 'pending'
            };
            
            // 기존 데이터를 무시하고 새로운 프롬프트 1개만 저장
            await this.writeJsonFile('save_prompt.json', {
                prompts: [newPrompt]
            });
            
            this.logToPopup('📝 수동 프롬프트를 자동화 큐에 추가 완료');
            this.logToPopup('⏳ 자동화 시스템이 다음 확인 시 처리합니다...');
            
            // 처리 완료
            this.currentProcessingPrompt = null;
            this.updateAutoStatus('on', '🟢 자동화 활성화 - 수동 프롬프트 대기 중');
            
            this.logToPopup('✅ 자동화 ON 상태에서 수동 프롬프트 처리 완료');
        } catch (error) {
            console.error('❌ 자동화 ON 상태에서 수동 프롬프트 처리 실패:', error);
            this.logToPopup('❌ 자동화 ON 상태에서 수동 프롬프트 처리 실패');
            
            // 오류 시 처리 완료
            this.currentProcessingPrompt = null;
            this.updateAutoStatus('on', '🟢 자동화 활성화 - 대기 중');
        }
    }

    // 상태 확인
    getStatus() {
        return {
            isRunning: this.isRunning,
            currentProcessingPrompt: this.currentProcessingPrompt,
            checkIntervalMs: this.checkIntervalMs
        };
    }

    // 팝업에 로그 출력
    logToPopup(message) {
        try {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = `[${timestamp}] ${message}`;
            
            // localStorage에 로그 저장
            const existingLogs = JSON.parse(localStorage.getItem('sora_automation_logs') || '[]');
            existingLogs.push(logEntry);
            
            // 최대 100개 로그만 유지
            if (existingLogs.length > 100) {
                existingLogs.splice(0, existingLogs.length - 100);
            }
            
            localStorage.setItem('sora_automation_logs', JSON.stringify(existingLogs));
            
            // 팝업 UI 업데이트 (메시지 전송)
            if (window.chrome && window.chrome.runtime && window.chrome.runtime.id) {
                try {
                    chrome.runtime.sendMessage({
                        action: 'updateAutomationLogs',
                        logs: existingLogs
                    }).catch((error) => {
                        // 팝업이 닫혀있거나 컨텍스트가 무효화된 경우 무시
                        console.log('📝 팝업 메시지 전송 실패 (정상):', error.message);
                    });
                } catch (error) {
                    // 컨텍스트 무효화 등으로 인한 오류 무시
                    console.log('📝 팝업 메시지 전송 실패 (정상):', error.message);
                }
            }
            
        } catch (error) {
            console.error('❌ 로그 저장 실패:', error);
        }
    }
}

// 전역 인스턴스 생성
window.jsonAutomation = new JsonAutomationSystem();

// 수동 모드에서 프롬프트 실행하는 전역 함수
window.runManualSoraPrompt = async function(promptText) {
    console.log('🎯 수동 모드 프롬프트 실행:', promptText);
    
    if (!window.jsonAutomation) {
        console.error('❌ JSON 자동화 시스템이 초기화되지 않았습니다.');
        return;
    }
    
    try {
        await window.jsonAutomation.runManualPrompt(promptText);
        return { success: true, message: '수동 모드 실행 완료' };
    } catch (error) {
        console.error('❌ 수동 모드 실행 실패:', error);
        return { success: false, error: error.message };
    }
};

// 자동화 ON 상태에서 수동 프롬프트를 자동화 시스템으로 처리하는 전역 함수
window.runManualPromptInAutomation = async function(promptText) {
    console.log('🚀 자동화 ON 상태에서 수동 프롬프트 처리:', promptText);
    
    if (!window.jsonAutomation) {
        console.error('❌ JSON 자동화 시스템이 초기화되지 않았습니다.');
        return;
    }
    
    try {
        await window.jsonAutomation.runManualPromptInAutomation(promptText);
        return { success: true, message: '자동화 ON 상태에서 수동 프롬프트 처리 완료' };
    } catch (error) {
        console.error('❌ 자동화 ON 상태에서 수동 프롬프트 처리 실패:', error);
        return { success: false, error: error.message };
    }
};

// content script에 주입할 함수
window.processPromptForJsonAutomation = async function(promptText) {
    console.log('🔄 JSON 자동화용 프롬프트 처리 시작:', promptText);
    
    try {
        // 기존 자동화 로직을 재사용
        const result = await window.runSoraAutomation(promptText);
        
        return {
            success: true,
            imageUrl: result.imageUrl,
            prompt: promptText,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ JSON 자동화용 프롬프트 처리 실패:', error);
        
        return {
            success: false,
            error: error.message,
            prompt: promptText,
            timestamp: new Date().toISOString()
        };
    }
};

// 기존 자동화 함수 (content script에서 사용)
window.runSoraAutomation = async function(promptText) {
    console.log('🚀 Sora 자동화 실행:', promptText);
    
    // 여기에 기존의 자동화 로직을 구현
    // (기존 popup.js의 content script 부분을 여기로 이동)
    
    // 임시 구현 (실제로는 기존 로직을 사용)
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // 실제 자동화 로직 구현 필요
            resolve({
                imageUrl: 'https://example.com/generated-image.jpg',
                success: true
            });
        }, 5000);
    });
};

console.log('✅ JSON 자동화 시스템 로드 완료'); 