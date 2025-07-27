// Internationalization utility for Chrome extension
class I18n {
  constructor() {
    this.currentLocale = 'en';
    this.messages = {};
    this.init();
  }

  async init() {
    // Get current locale from Chrome
    this.currentLocale = chrome.i18n.getUILanguage().split('-')[0];
    
    // Fallback to English if locale is not supported
    if (!['en', 'ko'].includes(this.currentLocale)) {
      this.currentLocale = 'en';
    }

    // Load messages
    await this.loadMessages();
  }

  async loadMessages() {
    try {
      // Chrome extension automatically loads messages from _locales
      // We can access them via chrome.i18n.getMessage()
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  }

  // Get localized message
  getMessage(key, substitutions = []) {
    try {
      return chrome.i18n.getMessage(key, substitutions);
    } catch (error) {
      console.error(`Failed to get message for key: ${key}`, error);
      return key; // Fallback to key if message not found
    }
  }

  // Get current locale
  getCurrentLocale() {
    return this.currentLocale;
  }

  // Set locale (for user preference)
  async setLocale(locale) {
    if (['en', 'ko'].includes(locale)) {
      this.currentLocale = locale;
      await chrome.storage.sync.set({ 'language': locale });
      this.updateUI();
    }
  }

  // Update UI with current language
  updateUI() {
    // Update all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const message = this.getMessage(key);
      if (message) {
        if (element.tagName === 'INPUT' && element.type === 'placeholder') {
          element.placeholder = message;
        } else {
          element.textContent = message;
        }
      }
    });

    // Update title attributes
    const titleElements = document.querySelectorAll('[data-i18n-title]');
    titleElements.forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      const message = this.getMessage(key);
      if (message) {
        element.title = message;
      }
    });
  }

  // Initialize language selector
  initLanguageSelector() {
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
      // Set current language
      languageSelect.value = this.currentLocale;
      
      // Add event listener
      languageSelect.addEventListener('change', async (e) => {
        await this.setLocale(e.target.value);
      });
    }
  }

  // Format number according to locale
  formatNumber(number) {
    return new Intl.NumberFormat(this.currentLocale).format(number);
  }

  // Format date according to locale
  formatDate(date) {
    return new Intl.DateTimeFormat(this.currentLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  // Format time according to locale
  formatTime(date) {
    return new Intl.DateTimeFormat(this.currentLocale, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  }
}

// Create global instance
const i18n = new I18n();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = I18n;
} 