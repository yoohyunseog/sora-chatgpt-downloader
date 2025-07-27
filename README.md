# 🎨 Sora Auto Image Downloader v2.1.0

**Sora 페이지에서 이미지 자동 생성 및 다운로드 + JSON 기반 프롬프트 소모형 자동화 시스템**

## 🚀 주요 기능

### 🎮 수동 모드
- **프롬프트 입력**: 직접 프롬프트를 입력하여 이미지 생성
- **이미지 생성**: Sora 페이지에서 자동으로 이미지 생성
- **다운로드**: 생성된 이미지 URL 추출 및 다운로드
- **실시간 로그**: 단계별 진행 상황 실시간 표시

### 🤖 자동화 모드 (NEW!)
- **프롬프트 소모형 자동화**: `save_prompt.json`에서 프롬프트를 읽어 자동 처리
- **ON/OFF 토글**: 간편한 자동화 모드 전환
- **15초 폴링**: 15초마다 새로운 프롬프트 확인
- **자동 초기화**: 처리 완료 후 `save_prompt.json` 자동 초기화
- **결과 저장**: 생성된 이미지 URL을 `load_prompt.json`에 저장

## 🍽️ 프롬프트 소모형 자동화

### 작동 원리
```
1. save_prompt.json에 프롬프트 저장
2. 자동화 시스템이 프롬프트를 "소모" (사용)
3. 이미지 생성 완료
4. 소모된 프롬프트는 초기화 (삭제)
5. 다음 프롬프트 준비
```

### 소모 패턴
```
입력 → 소모 → 출력 → 초기화
프롬프트 → 처리 → 이미지 → 빈 파일
```

## 📁 파일 구조

```
nb_wfa/sora-auto-image/
├── manifest.json              # 확장 프로그램 설정
├── popup.html                 # 팝업 UI
├── popup.js                   # 팝업 로직
├── content.js                 # 콘텐츠 스크립트
├── json_automation.js         # JSON 자동화 시스템
├── data/
│   ├── save_prompt.json       # 입력 프롬프트 (소모됨)
│   └── load_prompt.json       # 출력 결과 (생성된 이미지)
├── prompt_generator.py        # Python 프롬프트 생성기
├── example_usage.py           # 사용 예시
├── run_python.bat            # Windows 실행 스크립트
├── run_python.ps1            # PowerShell 실행 스크립트
└── README.md                 # 이 파일
```

## 🛠️ 설치 방법

### 1. Chrome Extension 설치
1. Chrome 브라우저에서 `chrome://extensions/` 접속
2. 우측 상단의 "개발자 모드" 활성화
3. "압축해제된 확장 프로그램을 로드합니다" 클릭
4. `nb_wfa/sora-auto-image` 폴더 선택
5. 확장 프로그램이 설치되면 툴바에서 아이콘 클릭

### 2. Python 환경 설정
```bash
# Python 스크립트 실행 (__pycache__ 폴더 생성 방지)
# Windows Batch 스크립트 사용
run_python.bat prompt_generator.py

# 또는 PowerShell 스크립트 사용
.\run_python.ps1 prompt_generator.py

# 또는 직접 실행 (환경 변수 설정)
set PYTHONDONTWRITEBYTECODE=1
python prompt_generator.py
```

## 📖 사용 방법

### 🎮 수동 모드
1. Sora 페이지 (`sora.chatgpt.com`) 접속
2. 확장 프로그램 팝업 열기
3. 프롬프트 입력
4. "🎨 이미지 생성" 버튼 클릭
5. 자동으로 이미지 생성 및 URL 추출

### 🤖 자동화 모드
1. **자동화 ON**: 팝업에서 자동화 토글을 ON으로 설정
2. **프롬프트 입력**: `save_prompt.json`에 프롬프트 저장
3. **자동 처리**: 15초마다 자동으로 프롬프트 확인 및 처리
4. **결과 확인**: `load_prompt.json`에서 생성된 이미지 URL 확인

### 🐍 Python 스크립트 사용
```python
# 프롬프트 추가
from prompt_generator import PromptGenerator

generator = PromptGenerator()
generator.add_prompt("A beautiful sunset over the ocean")

# 결과 확인
results = generator.load_results()
for result in results:
    print(f"프롬프트: {result['prompt']}")
    print(f"이미지 URL: {result['imageUrl']}")
```

## 📊 JSON 파일 구조

### save_prompt.json (입력)
```json
{
  "prompts": [
    {
      "prompt": "A beautiful sunset over the ocean",
      "category": "nature",
      "timestamp": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

### load_prompt.json (출력)
```json
{
  "results": [
    {
      "prompt": "A beautiful sunset over the ocean",
      "imageUrl": "https://oaidalleapiprodscus.blob.core.windows.net/...",
      "status": "completed",
      "timestamp": "2024-01-01T12:01:30.000Z"
    }
  ]
}
```

## 🔧 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Chrome Extension**: Manifest V3
- **Backend**: Python 3.7+
- **데이터 형식**: JSON
- **자동화**: 폴링 기반 모니터링 (15초 간격)

## 📈 상태 표시

### 수동 모드 상태
- **대기 중**: 초기 상태
- **처리 중**: 이미지 생성 진행 중
- **완료**: 이미지 생성 성공
- **오류**: 처리 실패

### 자동화 모드 상태
- **자동화 대기 중**: 자동화 OFF 상태
- **자동화 활성화**: 자동화 ON 상태
- **처리 중**: 프롬프트 처리 진행 중
- **완료**: 프롬프트 처리 완료

## 📝 모니터링 시스템

### 실시간 로그
- **수동 모드 로그**: 단계별 진행 상황
- **자동화 로그**: 프롬프트 소모 및 처리 상태
- **오류 로그**: 문제 발생 시 상세 정보

### 진행 상황 표시
- **단계별 진행률**: 11단계 자동화 과정
- **현재 단계**: 실시간 단계 표시
- **예상 시간**: 남은 처리 시간

## 🔗 외부 프로그램 연동

### Python 스크립트
- **prompt_generator.py**: 프롬프트 관리 및 결과 확인
- **example_usage.py**: 사용 예시 및 테스트
- **ESC 키 종료**: 모든 스크립트에서 ESC 키로 종료 가능

### 배치 스크립트
- **run_python.bat**: Windows용 실행 스크립트
- **run_python.ps1**: PowerShell용 실행 스크립트
- **__pycache__ 방지**: 자동으로 Python 캐시 폴더 생성 방지

## 🚨 주의사항

### Chrome Extension
- Sora 페이지에서만 작동
- 로그인 상태에서 사용 권장
- 네트워크 연결 필요

### Python 스크립트
- Windows 환경에서 테스트됨
- Python 3.7 이상 필요
- 파일 권한 확인 필요

### 자동화 모드
- 15초 간격으로 파일 확인
- 처리 중 중복 실행 방지
- 오류 발생 시 자동 재시도

## 🔄 버전 히스토리

### v2.1.0 (2024-01-01)
- **프롬프트 소모형 자동화** 추가
- **JSON 파일 기반 자동화** 시스템 구현
- **Python 스크립트** 연동 기능 추가
- **실시간 자동화 로그** 표시
- **ESC 키 종료** 기능 추가
- **__pycache__ 폴더 생성 방지** 기능 추가

### v2.0.0 (2023-12-31)
- **JSON 기반 자동화** 시스템 추가
- **ON/OFF 토글** 버튼 구현
- **save_prompt.json** 및 **load_prompt.json** 지원
- **15초 폴링** 자동화 시스템
- **실시간 로그** 표시 기능

### v1.0.0 (2023-12-30)
- **기본 이미지 생성** 기능
- **수동 프롬프트 입력** 지원
- **이미지 URL 추출** 기능
- **다운로드** 기능

## 📞 지원

문제가 발생하거나 개선 사항이 있으면 이슈를 등록해주세요.

---

**🎨 Sora Auto Image Downloader v2.1.0 - 프롬프트 소모형 자동화 시스템** 