// Popup script for Sora ChatGPT Auto Save Extension - Multi-language Support
class PopupManager {
    constructor() {
        this.currentLanguage = 'en';
        this.init();
    }

    async init() {
        try {
            // Wait for i18n to be ready
            await this.waitForI18n();
            
            // Initialize UI
            this.initializeUI();
            
            // Load saved settings
            await this.loadSettings();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Update UI with current language
            this.updateUI();
            
            console.log('Popup initialized successfully');
        } catch (error) {
            console.error('Failed to initialize popup:', error);
        }
    }

    async waitForI18n() {
        return new Promise((resolve) => {
            if (chrome.i18n) {
                resolve();
            } else {
                setTimeout(() => this.waitForI18n().then(resolve), 100);
            }
        });
    }

    initializeUI() {
        // Get DOM elements
        this.elements = {
            statusMessage: document.getElementById('statusMessage'),
            statusText: document.getElementById('statusText'),
            languageSelector: document.getElementById('languageSelector'),
            pageTitle: document.getElementById('pageTitle'),
            title: document.querySelector('.title[data-i18n="appName"]'),
            subtitle: document.querySelector('.subtitle[data-i18n="appDescription"]'),
            languageLabel: document.querySelector('.section-title[data-i18n="language"]'),
            extensionReady: document.querySelector('.info-text strong[data-i18n="extensionReady"]'),
            extensionReadyDesc: document.querySelector('.info-text span[data-i18n="extensionReadyDesc"]')
        };
    }

    async loadSettings() {
        try {
            // Load language preference
            const result = await chrome.storage.local.get(['language']);
            this.currentLanguage = result.language || 'en';
            
            // Set language selector
            if (this.elements.languageSelector) {
                this.elements.languageSelector.value = this.currentLanguage;
            }
            
            console.log('Settings loaded, current language:', this.currentLanguage);
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    setupEventListeners() {
        // Language change event - 즉시 반응하도록 개선
        if (this.elements.languageSelector) {
            this.elements.languageSelector.addEventListener('change', async (e) => {
                const newLanguage = e.target.value;
                console.log('Language selector changed to:', newLanguage);
                
                // 시각적 피드백 추가
                this.showLanguageChangeFeedback(newLanguage);
                
                // 언어 변경 실행
                await this.changeLanguage(newLanguage);
            });
        }
        
        console.log('Event listeners set up');
    }

    showLanguageChangeFeedback(language) {
        // 언어 변경 중임을 표시
        if (this.elements.statusMessage) {
            const languageName = language === 'ko' ? '한국어' : 'English';
            const changingText = language === 'ko' ? '언어 변경 중' : 'Changing language';
            this.elements.statusMessage.className = 'status info';
            this.elements.statusText.textContent = `${changingText}: ${languageName}...`;
            this.elements.statusMessage.classList.remove('hidden');
            console.log('Language change feedback shown:', `${changingText}: ${languageName}...`);
            
            // 즉시 UI 업데이트 (피드백과 동시에)
            this.currentLanguage = language;
            this.updateTextElements();
        }
    }

    async changeLanguage(language) {
        try {
            console.log('Changing language to:', language);
            
            // Save language preference
            await chrome.storage.local.set({ language });
            this.currentLanguage = language;
            
            // 즉시 UI 업데이트
            this.updateUI();
            
            // Sora 페이지에 언어 변경 메시지 전송 (더 강력한 방식)
            try {
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tabs.length > 0 && tabs[0].url && tabs[0].url.includes('sora.chatgpt.com')) {
                    // 여러 번 시도하여 확실히 전송
                    for (let i = 0; i < 3; i++) {
                        try {
                            await chrome.tabs.sendMessage(tabs[0].id, {
                                action: 'languageChanged',
                                language: language
                            });
                            console.log(`언어 변경 메시지 전송 성공 (시도 ${i + 1})`);
                            break;
                        } catch (err) {
                            console.log(`언어 변경 메시지 전송 실패 (시도 ${i + 1}):`, err);
                            if (i < 2) await new Promise(resolve => setTimeout(resolve, 100));
                        }
                    }
                }
            } catch (error) {
                console.log('Sora 페이지에 메시지 전송 실패 (정상):', error);
            }
            
            // 성공 메시지 표시
            setTimeout(() => {
                const successText = this.currentLanguage === 'ko' ? '언어가 변경되었습니다' : 'Language changed successfully';
                this.showStatus('success', successText);
            }, 100);
            
            // 언어 변경 완료 후 상태 메시지 숨김
            setTimeout(() => {
                if (this.elements.statusMessage) {
                    this.elements.statusMessage.classList.add('hidden');
                }
            }, 2000);
            
            console.log(`Language changed to: ${language}`);
        } catch (error) {
            console.error('Failed to change language:', error);
            const errorText = this.currentLanguage === 'ko' ? '언어 변경에 실패했습니다' : 'Failed to change language';
            this.showStatus('error', errorText);
        }
    }

    updateUI() {
        console.log('Updating UI with language:', this.currentLanguage);
        
        // Update all text elements with localized messages
        this.updateTextElements();
        
        // Update language selector options
        this.updateLanguageSelector();
        
        console.log('UI updated successfully');
    }

    updateTextElements() {
        console.log('Updating text elements...');
        
        // Update page title
        if (this.elements.pageTitle) {
            const pageTitleText = this.currentLanguage === 'ko' ? 'Sora ChatGPT 자동 저장' : 'Sora ChatGPT Auto Save';
            this.elements.pageTitle.textContent = pageTitleText;
            console.log('Page title updated:', pageTitleText);
        }
        
        // Update title
        if (this.elements.title) {
            const titleText = this.currentLanguage === 'ko' ? 'Sora ChatGPT 자동 저장' : 'Sora ChatGPT Auto Save';
            this.elements.title.textContent = titleText;
            console.log('Title updated:', titleText);
        }
        
        // Update subtitle
        if (this.elements.subtitle) {
            const subtitleText = this.currentLanguage === 'ko' 
                ? 'Sora ChatGPT 라이브러리에서 이미지와 프롬프트를 자동으로 저장'
                : 'Automatically save images and prompts from Sora ChatGPT library';
            this.elements.subtitle.textContent = subtitleText;
            console.log('Subtitle updated:', subtitleText);
        }
        
        // Update language label
        if (this.elements.languageLabel) {
            const languageText = this.currentLanguage === 'ko' ? '언어' : 'Language';
            this.elements.languageLabel.textContent = languageText;
            console.log('Language label updated:', languageText);
        }
        
        // Update extension ready text
        if (this.elements.extensionReady) {
            const readyText = this.currentLanguage === 'ko' ? '확장 프로그램 준비 완료!' : 'Extension Ready!';
            this.elements.extensionReady.textContent = readyText;
            console.log('Extension ready updated:', readyText);
        }
        
        // Update extension ready description
        if (this.elements.extensionReadyDesc) {
            const readyDescText = this.currentLanguage === 'ko' 
                ? '모든 기능이 활성화된 확장 프로그램을 사용할 준비가 되었습니다.'
                : 'The extension is ready to use with all features enabled.';
            this.elements.extensionReadyDesc.textContent = readyDescText;
            console.log('Extension ready desc updated:', readyDescText);
        }
        
        // Update all other elements with data-i18n attributes
        const allI18nElements = document.querySelectorAll('[data-i18n]');
        allI18nElements.forEach(element => {
            const messageKey = element.getAttribute('data-i18n');
            
            // 이미 업데이트된 요소는 건너뛰기
            if (this.isElementUpdated(element)) {
                return;
            }
            
            // 특별한 처리 필요한 요소들
            if (messageKey === 'english') {
                element.textContent = 'English';
            } else if (messageKey === 'korean') {
                element.textContent = '한국어';
            } else if (messageKey === 'extensionReady') {
                // 이미 처리됨
            } else {
                // 기본적으로 chrome.i18n.getMessage 사용
                const message = chrome.i18n.getMessage(messageKey);
                if (message) {
                    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                        element.placeholder = message;
                    } else {
                        element.textContent = message;
                    }
                }
            }
        });
        
        console.log('All text elements updated successfully');
    }
    
    isElementUpdated(element) {
        // 이미 업데이트된 요소인지 확인
        return this.elements.pageTitle === element ||
               this.elements.title === element || 
               this.elements.subtitle === element ||
               this.elements.languageLabel === element ||
               this.elements.extensionReady === element ||
               this.elements.extensionReadyDesc === element;
    }

    updateLanguageSelector() {
        // Update language selector options specifically
        if (this.elements.languageSelector) {
            const englishOption = this.elements.languageSelector.querySelector('option[value="en"]');
            const koreanOption = this.elements.languageSelector.querySelector('option[value="ko"]');
            
            if (englishOption) {
                englishOption.textContent = chrome.i18n.getMessage('english');
            }
            if (koreanOption) {
                koreanOption.textContent = chrome.i18n.getMessage('korean');
            }
        }
    }

    showStatus(type, messageKey) {
        let message;
        
        // messageKey가 이미 메시지인 경우와 키인 경우를 구분
        if (typeof messageKey === 'string' && messageKey.includes(' ')) {
            message = messageKey; // 이미 메시지인 경우
        } else {
            message = chrome.i18n.getMessage(messageKey) || messageKey;
        }
        
        if (this.elements.statusMessage && this.elements.statusText) {
            this.elements.statusMessage.className = `status ${type}`;
            this.elements.statusText.textContent = message;
            this.elements.statusMessage.classList.remove('hidden');
            
            // Hide status after 3 seconds
            setTimeout(() => {
                this.elements.statusMessage.classList.add('hidden');
            }, 3000);
        }
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing popup...');
    new PopupManager();
}); 