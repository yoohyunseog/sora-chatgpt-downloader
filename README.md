# Sora ChatGPT Downloader

Chrome 확장 프로그램으로 Sora ChatGPT에서 생성된 이미지와 프롬프트를 자동으로 수집하고 다운로드하는 도구입니다.

## 🚀 주요 기능

- **자동 데이터 수집**: Sora ChatGPT 페이지에서 `data-index="1"` 컨테이너의 이미지/비디오와 프롬프트 자동 수집
- **실시간 모니터링**: 페이지 변경 감지 시 자동으로 데이터 재수집
- **자동 저장**: 설정 가능한 간격으로 데이터 자동 저장
- **자동 다운로드**: 수집된 데이터를 JSON 형식으로 자동 다운로드
- **파일 관리**: 다운로드된 파일들의 자동 정리 및 관리
- **다국어 지원**: 한국어/영어 인터페이스 지원

## 📦 설치 방법

### 1. 확장 프로그램 설치

1. 이 저장소를 클론하거나 다운로드합니다.
2. Chrome 브라우저에서 `chrome://extensions/`로 이동합니다.
3. 우측 상단의 "개발자 모드"를 활성화합니다.
4. "압축해제된 확장 프로그램을 로드합니다" 버튼을 클릭합니다.
5. `auto-save-json-test` 폴더를 선택합니다.

### 2. Python 도구 설치 (선택사항)

파일 관리 도구를 사용하려면:

```bash
pip install -r requirements.txt
```

## 🎯 사용 방법

### 확장 프로그램 사용

1. Sora ChatGPT 페이지에 접속합니다.
2. 우측 상단에 나타나는 "Sora Auto Save" 패널을 확인합니다.
3. "자동 저장" 토글을 활성화하면 30초마다 자동으로 데이터를 수집합니다.
4. "자동 다운로드" 토글을 활성화하면 수집 후 자동으로 JSON 파일을 다운로드합니다.
5. 수동으로 "📸 수동 저장" 또는 "💾 다운로드" 버튼을 사용할 수도 있습니다.

### Python 도구 사용

```bash
# GUI 버전 실행
python file_organizer_gui.py

# 또는 배치 파일 사용
run_gui.bat
```

## 📁 프로젝트 구조

```
auto-save-json-test/
├── manifest.json          # 확장 프로그램 매니페스트
├── content.js             # 콘텐츠 스크립트 (메인 로직)
├── background.js          # 백그라운드 스크립트
├── popup.html             # 팝업 UI
├── popup.js               # 팝업 로직
├── _locales/              # 다국어 지원
├── file_organizer.py      # 파일 관리 도구
├── file_organizer_gui.py  # GUI 버전
├── simple_gui.py          # 간단한 GUI
└── README.md              # 이 파일
```

## ⚙️ 설정

### 확장 프로그램 설정

- **자동 저장 간격**: 기본 30초 (코드에서 수정 가능)
- **데이터 필터**: `data-index="1"` 컨테이너만 수집
- **파일 형식**: JSON 형식으로 저장

### Python 도구 설정

`file_organizer_config.json` 파일에서 설정을 변경할 수 있습니다:

```json
{
  "download_folder": "downloads",
  "max_files": 10,
  "file_prefix": "sora_auto_save"
}
```

## 🔧 개발

### 확장 프로그램 개발

1. `content.js`에서 데이터 수집 로직 수정
2. `popup.js`에서 UI 로직 수정
3. `manifest.json`에서 권한 및 설정 수정

### Python 도구 개발

1. `file_organizer.py`에서 파일 관리 로직 수정
2. `file_organizer_gui.py`에서 GUI 수정

## 📝 데이터 형식

수집된 데이터는 다음과 같은 JSON 형식으로 저장됩니다:

```json
{
  "metadata": {
    "created_at": "2025-07-31T14:39:29.000Z",
    "version": "1.0.0",
    "source": "Sora ChatGPT Auto Save Extension - data-index-1-only",
    "total_images": 1,
    "total_prompts": 1,
    "data_index_filter": "1"
  },
  "images": [
    {
      "id": "video_1732983569123_1",
      "url": "https://videos.openai.com/...",
      "alt": "Generated video",
      "width": 1024,
      "height": 1536,
      "pageUrl": "https://chat.openai.com/...",
      "prompt": "리그 오브 레전드 대회 중...",
      "originalPrompt": "Image prompt 리그 오브 레전드...",
      "title": "Critical Play Moment",
      "mediaType": "video"
    }
  ],
  "prompts": [
    {
      "id": "prompt_1732983569123_1",
      "text": "리그 오브 레전드 대회 중...",
      "timestamp": "2025-07-31T14:39:29.000Z",
      "pageUrl": "https://chat.openai.com/...",
      "source": "data-index-1"
    }
  ]
}
```

## 🤝 기여하기

1. 이 저장소를 포크합니다.
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`).
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`).
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`).
5. Pull Request를 생성합니다.

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🐛 문제 보고

버그를 발견하거나 기능 요청이 있으시면 [Issues](https://github.com/yoohyunseog/sora-chatgpt-downloader/issues) 페이지에서 알려주세요.

## 📞 연락처

- GitHub: [@yoohyunseog](https://github.com/yoohyunseog)
- 이메일: [your-email@example.com]

---

**주의**: 이 도구는 교육 및 개인 사용 목적으로만 사용하시기 바랍니다. OpenAI의 서비스 약관을 준수하여 사용해주세요. 