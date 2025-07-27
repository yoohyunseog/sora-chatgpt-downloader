# 🎨 Sora ChatGPT 자동 저장 확장 프로그램

Sora ChatGPT 라이브러리에서 프롬프트와 이미지를 자동으로 수집하고 관리하는 Chrome 확장 프로그램입니다.

## 🌟 주요 기능

### 🔄 자동 모니터링
- **실시간 프롬프트 감지**: Sora 페이지에서 새로운 프롬프트를 자동으로 감지
- **중복 검사**: 기존 프롬프트와 유사도 분석을 통한 중복 방지
- **자동 저장**: 설정된 간격으로 프롬프트와 이미지 정보 자동 저장

### 📊 데이터 관리
- **data.json → auto-*.json 변환**: 프롬프트 데이터를 자동으로 이미지 생성용 형식으로 변환
- **JSON 형식 지원**: 표준화된 JSON 형식으로 데이터 저장
- **실시간 동기화**: 팝업과 페이지 간 실시간 데이터 동기화

### 🌐 다국어 지원
- **한국어/영어**: 완전한 다국어 지원
- **실시간 언어 변경**: 언어 설정 즉시 적용
- **일관된 UI**: 모든 인터페이스 요소 번역 지원

## 🔗 두 확장 프로그램 연동 시스템

### 📋 확장 프로그램 구조

#### **첫 번째 확장 프로그램 (`auto-save-json-test`)**
```
🎯 목적: Sora ChatGPT 라이브러리에서 이미지/프롬프트 자동 수집
📁 구조:
├── manifest.json (Manifest V3)
├── popup.html + popup.js (브라우저 액션 팝업)
├── content.js (페이지 스크립트)
├── background.js (백그라운드 서비스 워커)
└── _locales/ (다국어 지원)
```

#### **두 번째 확장 프로그램 (`chrome-extension-test`)**
```
🎯 목적: data.json → auto-*.json 변환 및 자동 모드 관리
📁 구조:
├── manifest.json (Manifest V3)
├── popup.html + popup.js (브라우저 액션 팝업)
├── content.js (페이지 스크립트 + 로그 오버레이)
├── background.js (백그라운드 서비스 워커)
├── data.json (입력 데이터)
└── _locales/ (다국어 지원)
```

### 🔄 연동 방식

#### **A. 독립적 실행**
```
🔄 각 확장 프로그램은 독립적으로 실행됩니다:

1️⃣ auto-save-json-test:
   - Sora 페이지에서 이미지/프롬프트 수집
   - data.json 파일 생성/업데이트
   - 자동 저장 타이머 관리

2️⃣ chrome-extension-test:
   - data.json 파일 읽기
   - auto-*.json 파일 생성
   - 자동 모드 로그 오버레이 표시
```

#### **B. 데이터 흐름**
```
📊 데이터 연동 흐름:

data.json (첫 번째 확장 프로그램이 생성)
    ↓
chrome-extension-test가 읽기
    ↓
auto-*.json (두 번째 확장 프로그램이 생성)
```

### ⚙️ 구동 메커니즘

#### **A. Manifest V3 아키텍처**
```json
{
  "manifest_version": 3,
  "background": {
    "service_worker": "background.js"  // 백그라운드 서비스 워커
  },
  "content_scripts": [
    {
      "matches": ["https://sora.chatgpt.com/*"],  // Sora 페이지에서만 실행
      "js": ["content.js"],
      "run_at": "document_end"  // 페이지 로드 완료 후 실행
    }
  ]
}
```

#### **B. 컴포넌트별 역할**

##### **1. Background Service Worker**
```javascript
// auto-save-json-test/background.js
- 자동 저장 타이머 관리
- 메시지 리스너 (popup ↔ content script)
- 저장된 설정 복원
- 확장 프로그램 생명주기 관리

// chrome-extension-test/background.js  
- data.json 파일 로드
- 프롬프트 데이터 제공
- 메시지 라우팅
- 확장 프로그램 상태 관리
```

##### **2. Content Script**
```javascript
// auto-save-json-test/content.js
- 페이지 DOM 조작
- 이미지/프롬프트 수집
- 인페이지 컨트롤 패널 생성
- 실시간 데이터 모니터링

// chrome-extension-test/content.js
- 로그 오버레이 생성
- 자동 모드 관리
- data.json → auto-*.json 변환
- 실시간 로그 표시
```

##### **3. Popup Script**
```javascript
// 두 확장 프로그램 모두
- 사용자 인터페이스 관리
- 언어 설정 처리
- 설정 저장/로드
- content script와 통신
```

### 🔄 메시지 통신 시스템

#### **A. Chrome Extension API 사용**
```javascript
// Popup → Content Script
chrome.tabs.sendMessage(tabId, { action: 'languageChanged', language: 'ko' });

// Content Script → Background
chrome.runtime.sendMessage({ action: 'getPromptData' });

// Background → Content Script
chrome.tabs.sendMessage(tabId, { action: 'saveData', data: collectedData });
```

#### **B. Storage API 공유**
```javascript
// 두 확장 프로그램이 공유하는 저장소
chrome.storage.local.set({ language: 'ko' });
chrome.storage.local.get(['language'], (result) => {
  console.log('언어 설정:', result.language);
});
```

### 🎯 실제 구동 시나리오

#### **시나리오 1: 기본 사용**
```
1️⃣ 사용자가 Sora ChatGPT 라이브러리 페이지 접속
2️⃣ 두 확장 프로그램의 content script가 동시에 로드
3️⃣ auto-save-json-test: 이미지/프롬프트 수집 시작
4️⃣ chrome-extension-test: 로그 오버레이 표시
5️⃣ 사용자가 자동 모드 활성화
6️⃣ 두 확장 프로그램이 독립적으로 작동
```

#### **시나리오 2: 데이터 변환**
```
1️⃣ auto-save-json-test가 data.json 생성/업데이트
2️⃣ chrome-extension-test가 data.json 감지
3️⃣ 자동으로 auto-*.json 생성
4️⃣ 로그 오버레이에 변환 상태 표시
5️⃣ 완료된 데이터를 사용자에게 제공
```

#### **시나리오 3: 언어 변경**
```
1️⃣ 사용자가 팝업에서 언어 변경
2️⃣ popup.js가 chrome.storage.local에 저장
3️⃣ chrome.storage.onChanged 이벤트 발생
4️⃣ content script가 이벤트 감지
5️⃣ UI 텍스트 즉시 업데이트
6️⃣ 두 확장 프로그램 모두 동일한 언어 설정 적용
```

## 📦 설치 방법

### 1. 확장 프로그램 로드
1. Chrome 브라우저에서 `chrome://extensions/` 접속
2. 우측 상단의 "개발자 모드" 활성화
3. "압축해제된 확장 프로그램을 로드합니다" 클릭
4. `chrome-extension-test` 폴더 선택

### 2. 권한 확인
- **활성 탭**: 현재 페이지 접근
- **저장소**: 설정 및 데이터 저장
- **Sora ChatGPT**: `https://sora.chatgpt.com/*` 도메인 접근

## 🚀 사용법

### 1. 기본 설정
1. **확장 프로그램 활성화**: 브라우저 툴바에서 확장 프로그램 아이콘 클릭
2. **언어 설정**: 팝업에서 한국어/영어 선택
3. **자동 모드 시작**: Sora 페이지에서 자동 모드 버튼 클릭

### 2. 자동 모니터링 사용
```
📋 단계별 프로세스:
1단계: 오버레이 관리
2단계: 카운터 업데이트  
3단계: 프롬프트 모니터링
4단계: 자동 저장
5단계: 완료
6단계: 이미지 생성
7단계: 진행률 업데이트
```

### 3. 데이터 수집 과정
1. **프롬프트 감지**: Sora 페이지에서 새로운 프롬프트 자동 감지
2. **중복 검사**: 기존 `data.json`과 유사도 분석
3. **데이터 저장**: 중복되지 않은 프롬프트를 `data.json`에 저장
4. **자동 변환**: `data.json` → `auto-*.json` 자동 변환

## 📁 데이터 형식

### data.json (입력 형식)
```json
{
  "prompts": [
    {
      "id": "unique_id",
      "content": "프롬프트 내용",
      "timestamp": "2024-01-01T00:00:00Z",
      "category": "카테고리",
      "tags": ["태그1", "태그2"]
    }
  ]
}
```

### auto-*.json (출력 형식)
```json
{
  "prompts": [
    {
      "id": "auto_generated_id",
      "content": "프롬프트 내용",
      "image_url": "https://sora.chatgpt.com/generated/image.jpg",
      "timestamp": "2024-01-01T00:00:00Z",
      "status": "generated",
      "metadata": {
        "original_id": "unique_id",
        "generation_time": "2024-01-01T00:05:00Z",
        "image_size": "1024x1024"
      }
    }
  ],
  "summary": {
    "total_prompts": 100,
    "generated_images": 95,
    "pending": 5,
    "last_updated": "2024-01-01T00:10:00Z"
  }
}
```

## 🔄 data.json → auto-*.json 변환 과정

### 1. 자동 변환 프로세스
```
📊 변환 단계:
1. data.json 로드 → 프롬프트 데이터 읽기
2. 이미지 생성 요청 → Sora API 호출
3. 이미지 URL 수집 → 생성된 이미지 주소 저장
4. auto-*.json 생성 → 완성된 데이터 저장
```

### 2. 변환 규칙
- **ID 변환**: `unique_id` → `auto_YYYYMMDD_HHMMSS_XXX`
- **이미지 URL 추가**: Sora에서 생성된 이미지 주소 자동 추가
- **메타데이터 확장**: 생성 시간, 이미지 크기 등 추가 정보 포함
- **상태 관리**: `pending` → `generated` → `completed`

### 3. 사용 시나리오
```
📝 사용 예시:
1. data.json에 프롬프트 업로드
2. 확장 프로그램이 자동으로 이미지 생성 요청
3. auto-*.json에서 프롬프트 + 이미지 URL 수신
4. 완성된 데이터로 AI 모델 학습 또는 분석
```

## ⚙️ 고급 설정

### 모니터링 간격 조정
- **기본값**: 1초
- **조정 가능**: 0.5초 ~ 10초
- **실시간 변경**: 설정 즉시 적용

### 중복 검사 설정
- **유사도 임계값**: 80% (기본값)
- **검사 방법**: 
  - 키워드 기반 유사도
  - 레벤슈타인 거리
  - 의미적 유사도

### 저장 설정
- **자동 저장**: 활성화/비활성화
- **저장 형식**: JSON, CSV
- **백업**: 자동 백업 기능

## 🔧 동시 실행 시 고려사항

### A. 충돌 방지
```javascript
// 각 확장 프로그램이 고유한 ID 사용
const extensionId = chrome.runtime.id;
const uniquePrefix = `extension_${extensionId}_`;

// 고유한 DOM 요소 ID 생성
const overlayId = `${uniquePrefix}overlay`;
const logId = `${uniquePrefix}log`;
```

### B. 리소스 관리
```javascript
// 메모리 사용량 모니터링
setInterval(() => {
  if (logMessages.length > 250) {
    logMessages = logMessages.slice(-200); // 오래된 메시지 제거
  }
}, 5000);

// 타이머 정리
function cleanupTimers() {
  if (mainInterval) {
    clearInterval(mainInterval);
    mainInterval = null;
  }
}
```

## 📈 성능 최적화

### 메모리 사용량
- **로그 제한**: 250개 메시지 자동 정리
- **타이머 관리**: 활성 타이머 자동 정리
- **데이터 캐싱**: 효율적인 데이터 로딩

### 속도 최적화
- **비동기 처리**: 모든 API 호출 비동기 처리
- **배치 처리**: 여러 프롬프트 동시 처리
- **지연 로딩**: 필요시에만 데이터 로드

### 비동기 처리
```javascript
// 모든 API 호출을 비동기로 처리
async function processData() {
  try {
    const data = await getPromptData();
    const result = await transformData(data);
    await saveResult(result);
  } catch (error) {
    console.error('처리 오류:', error);
  }
}
```

### 배치 처리
```javascript
// 여러 작업을 배치로 처리
function batchProcess(items, batchSize = 10) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    setTimeout(() => processBatch(batch), i * 100);
  }
}
```

## 🛠️ 개발자 정보

### 기술 스택
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Chrome Extension**: Manifest V3
- **데이터 형식**: JSON
- **API**: Chrome Extension API, Sora ChatGPT API

### 파일 구조
```
chrome-extension-test/
├── manifest.json          # 확장 프로그램 설정
├── popup.html            # 팝업 UI
├── popup.js              # 팝업 로직
├── content.js            # 페이지 스크립트
├── background.js         # 백그라운드 서비스
├── data.json             # 입력 데이터
├── auto-*.json           # 출력 데이터
└── _locales/             # 다국어 지원
    ├── en/
    └── ko/
```

## 🔧 문제 해결

### 자주 발생하는 문제

#### 1. 확장 프로그램이 작동하지 않음
- **해결책**: 개발자 모드 확인, 페이지 새로고침
- **확인사항**: 권한 설정, 콘솔 오류 메시지

#### 2. 데이터가 저장되지 않음
- **해결책**: 저장소 권한 확인, 디스크 공간 확인
- **확인사항**: Chrome 저장소 상태, 파일 권한

#### 3. 중복 검사가 작동하지 않음
- **해결책**: data.json 파일 형식 확인
- **확인사항**: JSON 구문, 데이터 구조

#### 4. 두 확장 프로그램 충돌
- **해결책**: 고유한 DOM 요소 ID 사용 확인
- **확인사항**: 확장 프로그램 ID, 네임스페이스

### 로그 확인 방법
1. **개발자 도구**: F12 → Console 탭
2. **확장 프로그램 로그**: 확장 프로그램 관리 페이지
3. **실시간 로그**: 자동 모드 오버레이에서 확인

## 🚨 중요 공지: 후원 없이는 지속 불가능!

### ⚠️ 프로젝트 지속성 경고
**이 프로젝트는 후원자들의 지원 없이는 지속적으로 개발할 수 없습니다.** 현재 기본 기능만 제공되고 있으며, 고급 기능 개발과 유지보수를 위해서는 여러분의 후원이 절대적으로 필요합니다.

### 🎁 후원자 전용 혜택
- **우선 기능 개발**: 후원자 요청 기능 우선 개발
- **베타 테스트 참여**: 새로운 기능 베타 테스트 권한
- **개발자와 직접 소통**: 기능 요청 및 피드백 직접 전달
- **고급 기능 조기 접근**: 일반 사용자보다 먼저 새로운 기능 사용

### 💰 후원하기 (지금 바로!)
**[@yoohyunseog GitHub Sponsors 후원하기](https://github.com/sponsors/yoohyunseog?o=esb)**

- **월간 후원**: 정기적인 후원으로 지속적인 개발 지원
- **일회성 후원**: 원하는 금액으로 한 번에 후원
- **커스텀 금액**: 본인이 원하는 금액으로 후원 가능

---

## 🔮 향후 계획

### 현재 지원 기능
- ✅ **이미지 수집**: Sora ChatGPT에서 생성된 이미지 자동 수집
- ✅ **단일 이미지 설정**: 한 번에 하나의 이미지 처리 및 저장
- ✅ **JSON 형식 지원**: 표준화된 JSON 형식으로 데이터 저장
- ✅ **실시간 모니터링**: 페이지 변경 시 자동 데이터 수집

### 예정된 기능 (후원자 지원 시에만 개발 가능)
- [ ] **영상 업로드 지원**: 동영상 파일 업로드 및 처리 기능
- [ ] **다중 미디어 형식**: 이미지 + 영상 동시 처리
- [ ] **고급 영상 편집**: 기본적인 영상 편집 도구 제공
- [ ] **클라우드 동기화**: Google Drive, Dropbox 연동
- [ ] **다중 형식 지원**: CSV, XML, YAML
- [ ] **고급 필터링**: 태그, 카테고리별 필터
- [ ] **통계 대시보드**: 수집 데이터 분석 도구
- [ ] **API 연동**: 외부 AI 모델 연동

### 버전 히스토리
- **v1.0.0**: 기본 자동 저장 기능
- **v1.1.0**: 다국어 지원 추가
- **v1.2.0**: data.json → auto-*.json 변환 기능
- **v1.3.0**: 고급 중복 검사 및 성능 최적화
- **v2.0.0**: 영상 업로드 지원 (기부금 지원 시 예정)

## 📞 지원 및 문의

### 버그 리포트
- **GitHub Issues**: 프로젝트 이슈 페이지
- **이메일**: 개발자 이메일로 직접 문의
- **로그 첨부**: 문제 해결을 위한 로그 파일 포함

### 기능 요청
- **새로운 기능**: GitHub Discussions
- **개선 사항**: 피드백 양식 작성
- **우선순위**: 커뮤니티 투표로 결정

### 🚨 후원 없이는 개발 불가능!
- **영상 업로드 기능**: 후원자 지원 시에만 개발 가능
- **고급 기능**: 후원자들의 기여로만 구현 가능
- **지속적인 개발**: 후원 없이는 프로젝트 중단 위험

#### 💰 후원하기 (지금 바로!)
- **GitHub Sponsors**: [@yoohyunseog 후원하기](https://github.com/sponsors/yoohyunseog?o=esb)
- **월간 후원**: 정기적인 후원으로 지속적인 개발 지원
- **일회성 후원**: 원하는 금액으로 한 번에 후원
- **커스텀 금액**: 본인이 원하는 금액으로 후원 가능

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 🎯 결론

두 Chrome 확장 프로그램은 **독립적으로 실행되지만 데이터를 통해 연동**됩니다:

1. **첫 번째 확장 프로그램**이 Sora 페이지에서 데이터를 수집하여 `data.json` 생성
2. **두 번째 확장 프로그램**이 `data.json`을 읽어서 `auto-*.json`으로 변환
3. **Chrome Extension API**를 통해 안전하고 효율적인 통신
4. **공유 저장소**를 통해 설정 동기화
5. **독립적인 생명주기**로 안정적인 실행 보장

이러한 구조로 인해 각 확장 프로그램이 독립적으로 작동하면서도 필요한 데이터를 공유하여 완전한 워크플로우를 구성할 수 있습니다!

**🎉 Sora ChatGPT 자동 저장 확장 프로그램으로 효율적인 AI 이미지 데이터 수집을 시작하세요!**

---

## 🚨 마지막 호소: 후원이 필요합니다!

**이 프로젝트의 미래는 여러분의 후원에 달려있습니다.** 

현재 기본 기능만 제공되고 있으며, 영상 업로드 기능과 고급 기능들은 후원자들의 지원이 없으면 개발할 수 없습니다. 

**지금 바로 후원해주세요!** 
**[@yoohyunseog GitHub Sponsors 후원하기](https://github.com/sponsors/yoohyunseog?o=esb)**

여러분의 후원이 더 나은 기능과 지속적인 개발을 가능하게 합니다! 🙏 