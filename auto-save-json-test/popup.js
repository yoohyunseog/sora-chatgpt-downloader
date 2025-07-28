// Popup script for Sora ChatGPT Auto Save Pro Extension - Multi-language Support
class PopupManagerPro {
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
            title: document.querySelector('.title span[data-i18n="appName"]'),
            subtitle: document.querySelector('.subtitle[data-i18n="appDescription"]'),
            languageLabel: document.querySelector('.language-label[data-i18n="language"]'),
            extensionReady: document.querySelector('.info-text strong[data-i18n="extensionReady"]'),
            extensionReadyDesc: document.querySelector('.info-text span[data-i18n="extensionReadyDesc"]'),
            proFeaturesTitle: document.querySelector('.pro-features h4[data-i18n="proFeaturesAvailable"]'),
            proFeaturesList: document.querySelectorAll('.pro-features li[data-i18n]')
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
            
            // Sora 페이지에 언어 변경 메시지 전송
            try {
                const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
                if (tabs.length > 0 && tabs[0].url && tabs[0].url.includes('sora.chatgpt.com')) {
                    await chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'languageChanged',
                        language: language
                    });
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
            const pageTitleText = this.currentLanguage === 'ko' ? 'Sora ChatGPT 자동 저장 Pro' : 'Sora ChatGPT Auto Save Pro';
            this.elements.pageTitle.textContent = pageTitleText;
            console.log('Page title updated:', pageTitleText);
        }
        
        // Update title
        if (this.elements.title) {
            const titleText = this.currentLanguage === 'ko' ? 'Sora ChatGPT 자동 저장 Pro' : 'Sora ChatGPT Auto Save Pro';
            this.elements.title.textContent = titleText;
            console.log('Title updated:', titleText);
        }
        
        // Update subtitle
        if (this.elements.subtitle) {
            const subtitleText = this.currentLanguage === 'ko' 
                ? '향상된 기능을 갖춘 Sora ChatGPT 라이브러리 고급 자동 저장 확장 프로그램'
                : 'Advanced auto save extension for Sora ChatGPT library with enhanced features';
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
        
        // Update pro features title
        if (this.elements.proFeaturesTitle) {
            const proTitleText = this.currentLanguage === 'ko' ? 'Pro 기능 사용 가능:' : 'Pro Features Available:';
            this.elements.proFeaturesTitle.textContent = proTitleText;
            console.log('Pro features title updated:', proTitleText);
        }
        
        // Update pro features list
        const proFeaturesData = {
            advancedAutoSave: {
                ko: '고급 자동 저장 기능',
                en: 'Advanced auto save functionality'
            },
            smartFiltering: {
                ko: '스마트 필터링 및 중복 제거',
                en: 'Smart filtering and deduplication'
            },
            detailedLogging: {
                ko: '상세 로깅 및 모니터링',
                en: 'Detailed logging and monitoring'
            },
            settingsImportExport: {
                ko: '설정 가져오기/내보내기',
                en: 'Settings import/export'
            },
            enhancedUI: {
                ko: '탭이 있는 향상된 UI',
                en: 'Enhanced UI with tabs'
            }
        };
        
        this.elements.proFeaturesList.forEach(element => {
            const messageKey = element.getAttribute('data-i18n');
            if (proFeaturesData[messageKey]) {
                const text = proFeaturesData[messageKey][this.currentLanguage];
                element.textContent = text;
                console.log(`Pro feature ${messageKey} updated:`, text);
            }
        });
        
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
               this.elements.extensionReadyDesc === element ||
               this.elements.proFeaturesTitle === element ||
               Array.from(this.elements.proFeaturesList).includes(element);
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
    new PopupManagerPro();
}); 