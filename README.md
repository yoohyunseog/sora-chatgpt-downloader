# 🎨 Sora ChatGPT 자동 저장 & 관리 도구

Sora ChatGPT 라이브러리에서 이미지와 프롬프트를 자동으로 수집하고 관리하는 Chrome 확장 프로그램 모음입니다.

## 📦 프로젝트 구성

### 🔄 **chrome-extension-test** - 기본 자동 저장 확장 프로그램
- Sora ChatGPT 라이브러리에서 이미지와 프롬프트 자동 수집
- 30초마다 자동 저장 (설정 가능)
- 실시간 카운트다운 표시
- JSON 형태로 데이터 다운로드

### 🗂️ **auto-save-json-test** - 고급 관리 도구
- 기본 자동 저장 기능 + 파일 정리 도구
- Python GUI 프로그램 포함
- 자동 백업 및 파일 관리
- 고급 설정 및 로깅

## 🚀 빠른 시작

### 1. 기본 확장 프로그램 설치 (chrome-extension-test)
```bash
# Chrome 브라우저에서
1. chrome://extensions/ 접속
2. "개발자 모드" 활성화
3. "압축해제된 확장 프로그램을 로드합니다" 클릭
4. chrome-extension-test 폴더 선택
```

### 2. 고급 도구 설치 (auto-save-json-test)
```bash
# Chrome 확장 프로그램 설치 (위와 동일)
# Python 도구 실행
cd auto-save-json-test
python file_organizer.py
```

## ✨ 주요 기능

### 🔄 자동 저장 시스템
- **30초마다 자동 저장**: 설정 가능한 간격 (10초~3600초)
- **실시간 카운트다운**: 다음 저장까지 남은 시간 표시
- **중복 방지**: 이미 저장된 데이터는 건너뜀
- **실시간 감지**: 페이지 변경 시 자동 새 데이터 수집

### 📸 데이터 수집
- **이미지 수집**: URL, 크기, alt 텍스트, 메타데이터
- **프롬프트 수집**: 텍스트, 타임스탬프, 페이지 정보
- **JSON 형식**: 구조화된 데이터로 저장

### 💾 파일 관리
- **자동 정리**: 최신 파일만 유지
- **백업 시스템**: 기존 파일 자동 백업
- **GUI 도구**: 사용자 친화적 인터페이스
- **로그 시스템**: 상세한 작업 기록

## 📁 폴더 구조

```
sora-auto-image/
├── chrome-extension-test/          # 기본 자동 저장 확장 프로그램
│   ├── manifest.json              # 확장 프로그램 설정
│   ├── popup.html                 # 팝업 인터페이스
│   ├── popup.js                   # 팝업 로직
│   ├── content.js                 # 페이지 콘텐츠 스크립트
│   ├── background.js              # 백그라운드 스크립트
│   └── data.json                  # 샘플 데이터
├── auto-save-json-test/            # 고급 관리 도구
│   ├── manifest.json              # 확장 프로그램 설정
│   ├── popup.html                 # 고급 팝업 인터페이스
│   ├── popup.js                   # 고급 팝업 로직
│   ├── content.js                 # 고급 콘텐츠 스크립트
│   ├── background.js              # 백그라운드 스크립트
│   ├── file_organizer.py          # Python 파일 정리 도구
│   ├── file_organizer_gui.py      # GUI 인터페이스
│   ├── simple_gui.py              # 간단한 GUI
│   ├── file_saver.py              # 파일 저장 도구
│   ├── README.md                  # 상세 사용법
│   ├── README_file_organizer.md   # 파일 정리 도구 설명
│   └── ... (기타 설정 파일들)
└── README.md                      # 이 파일
```

## 🎯 사용 시나리오

### 시나리오 1: 간단한 자동 저장
1. **chrome-extension-test** 설치
2. Sora ChatGPT 라이브러리 페이지 접속
3. 자동 저장 ON 설정
4. 30초마다 자동으로 데이터 수집

### 시나리오 2: 고급 데이터 관리
1. **auto-save-json-test** 설치
2. 자동 저장 기능 사용
3. Python 도구로 파일 정리
4. GUI로 데이터 관리

### 시나리오 3: 대량 데이터 수집
1. 고급 도구 설치
2. 자동 저장 간격 조정 (예: 10초)
3. 장시간 수집 실행
4. 파일 정리 도구로 최신 데이터만 유지

## 📊 수집되는 데이터 형식

### 이미지 데이터
```json
{
  "id": "img_1234567890_0",
  "url": "https://example.com/image.jpg",
  "alt": "이미지 설명",
  "width": 1024,
  "height": 768,
  "timestamp": "2025-01-27T12:00:00.000Z",
  "pageUrl": "https://sora.chatgpt.com/library"
}
```

### 프롬프트 데이터
```json
{
  "id": "prompt_1234567890_0",
  "text": "프롬프트 텍스트 내용",
  "timestamp": "2025-01-27T12:00:00.000Z",
  "pageUrl": "https://sora.chatgpt.com/library",
  "selector": "[data-testid=\"prompt-text\"]"
}
```

## ⚙️ 설정 옵션

### 자동 저장 간격
- **최소**: 10초 (빠른 수집)
- **기본**: 30초 (권장)
- **최대**: 3600초 (1시간, 느린 수집)

### 파일 관리 설정
```json
{
  "download_folder": "C:\\Users\\사용자명\\Downloads",
  "target_folder": "organized_files",
  "file_pattern": "sora_auto_save_*.json",
  "output_filename": "sora_latest_data.json",
  "backup_old_files": true,
  "max_backup_files": 10
}
```

## 🔧 고급 기능

### 실시간 모니터링
- **DOM 변경 감지**: MutationObserver 사용
- **페이지 변경 감지**: URL 변경 시 자동 대응
- **에러 처리**: 네트워크 오류 자동 복구

### 스마트 백업
- **자동 백업**: 기존 파일 자동 보관
- **중복 방지**: 파일명 충돌 자동 해결
- **공간 관리**: 최대 백업 파일 수 제한

### 로깅 시스템
- **상세 로그**: 모든 작업 과정 기록
- **타임스탬프**: 정확한 시간 정보
- **로그 레벨**: INFO, WARNING, ERROR 구분

## 🐛 문제 해결

### 자동 저장이 작동하지 않는 경우
1. **페이지 URL 확인**: `https://sora.chatgpt.com/library`
2. **권한 확인**: 확장 프로그램 권한 허용
3. **페이지 새로고침**: F5 키로 재로드
4. **확장 프로그램 재로드**: chrome://extensions/에서 재로드

### Python 도구 오류
1. **Python 설치 확인**: Python 3.6 이상 필요
2. **권한 확인**: 대상 폴더 쓰기 권한
3. **로그 확인**: logs 폴더의 로그 파일 확인

### 데이터가 수집되지 않는 경우
1. **콘솔 로그 확인**: F12 → Console 탭
2. **네트워크 연결**: 인터넷 연결 상태 확인
3. **페이지 로딩 대기**: 완전히 로드될 때까지 대기

## 📞 지원 및 기여

### 버그 리포트
문제가 발생하면 다음 정보를 포함하여 이슈를 생성해주세요:
- **브라우저 버전**: Chrome 버전
- **확장 프로그램 버전**: 설치된 확장 프로그램
- **오류 메시지**: 콘솔 로그 내용
- **재현 단계**: 문제 발생 과정

### 기능 제안
새로운 기능이나 개선 사항이 있으면:
- **사용 사례**: 어떤 상황에서 필요한지
- **기대 동작**: 어떻게 작동하면 좋을지
- **우선순위**: 얼마나 중요한지

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🔄 업데이트 내역

### v2.3.0 (2025-01-27)
- ✅ 폴더 구조 정리
- ✅ 두 개의 확장 프로그램 분리
- ✅ Python 관리 도구 추가
- ✅ 자동 백업 시스템 구현
- ✅ GUI 인터페이스 추가

### v2.2.0 (2025-01-26)
- ✅ 실시간 카운트다운 기능
- ✅ 중복 방지 시스템
- ✅ JSON 파일 검증
- ✅ 에러 처리 개선

### v2.1.0 (2025-01-25)
- ✅ 자동 저장 기능
- ✅ 이미지/프롬프트 수집
- ✅ JSON 다운로드
- ✅ 기본 UI 구현

---

**개발자**: yoohyunseog  
**GitHub**: https://github.com/yoohyunseog/sora-chatgpt-downloader  
**지원 브라우저**: Chrome 88+  
**최종 업데이트**: 2025-01-27 