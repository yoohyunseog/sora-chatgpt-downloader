# Sora Auto Save 파일 정리 프로그램

다운로드 폴더의 `sora_auto_save_*.json` 파일들을 정리하고 최신 파일만 지정한 폴더에 저장하는 파이썬 프로그램입니다.

## 🚀 주요 기능

### ✅ **자동 파일 정리**
- 다운로드 폴더에서 `sora_auto_save_*.json` 패턴의 파일들을 자동 검색
- 가장 최신 파일만 선택하여 지정한 폴더에 복사
- 와일드카드 패턴 지원 (`*sora_auto_save*` 등)

### ✅ **스마트 백업 시스템**
- 기존 파일들을 백업 폴더로 자동 이동
- 중복 파일명 자동 처리 (숫자 추가)
- 오래된 백업 파일 자동 정리 (최대 10개 유지)

### ✅ **JSON 파일 검증**
- 파일 구조 유효성 검사 (`metadata`, `images`, `prompts` 키 확인)
- 이미지/프롬프트 개수 표시
- 손상된 파일 자동 감지

### ✅ **설정 자동 저장**
- 모든 설정값을 JSON 파일로 자동 저장
- 프로그램 재시작 시 설정 자동 복원
- 명령행 인수로 설정 변경 가능

### ✅ **상세 로그 시스템**
- 모든 작업 과정을 로그 파일에 기록
- 콘솔과 파일에 동시 출력
- 타임스탬프와 로그 레벨 포함

## 📁 파일 구조

```
auto-save-json-test/
├── file_organizer.py              # 메인 프로그램
├── file_organizer_config.json     # 설정 파일
├── run_file_organizer.bat         # 실행 스크립트
├── organized_files/               # 정리된 파일 저장 폴더
│   └── sora_latest_data.json      # 최신 데이터 파일
├── backup/                        # 백업 폴더
│   └── sora_auto_save_*.json      # 백업된 파일들
└── logs/                          # 로그 폴더
    └── file_organizer_*.log       # 로그 파일들
```

## ⚙️ 설정 옵션

### **기본 설정**
```json
{
  "download_folder": "C:\\Users\\사용자명\\Downloads",
  "target_folder": "organized_files",
  "file_pattern": "sora_auto_save_*.json",
  "output_filename": "sora_latest_data.json",
  "backup_old_files": true,
  "backup_folder": "backup",
  "auto_run_interval": 300,
  "max_backup_files": 10
}
```

### **설정 설명**
- `download_folder`: 다운로드 폴더 경로
- `target_folder`: 정리된 파일을 저장할 폴더
- `file_pattern`: 검색할 파일 패턴 (와일드카드 지원)
- `output_filename`: 출력 파일명
- `backup_old_files`: 백업 기능 활성화 여부
- `backup_folder`: 백업 폴더 경로
- `auto_run_interval`: 자동 실행 간격 (초)
- `max_backup_files`: 최대 백업 파일 수

## 🎯 사용법

### **1. 간단 실행**
```bash
# 배치 파일로 실행 (Windows)
run_file_organizer.bat

# 또는 직접 실행
python file_organizer.py
```

### **2. 명령행 옵션**
```bash
# 현재 상태 확인
python file_organizer.py --status

# 다운로드 폴더 변경
python file_organizer.py --download-folder "C:\MyDownloads"

# 대상 폴더 변경
python file_organizer.py --target-folder "C:\MyData"

# 파일 패턴 변경
python file_organizer.py --file-pattern "my_data_*.json"

# 출력 파일명 변경
python file_organizer.py --output-filename "latest_data.json"

# 백업 비활성화
python file_organizer.py --no-backup

# 설정 파일 지정
python file_organizer.py --config "my_config.json"
```

### **3. 설정 파일 수정**
`file_organizer_config.json` 파일을 직접 편집하여 설정을 변경할 수 있습니다.

## 📊 로그 확인

### **로그 파일 위치**
```
logs/file_organizer_YYYYMMDD_HHMMSS.log
```

### **로그 내용 예시**
```
2025-01-27 15:30:45 - INFO - === Sora Auto Save 파일 정리 프로그램 시작 ===
2025-01-27 15:30:45 - INFO - 설정 파일 로드됨: file_organizer_config.json
2025-01-27 15:30:45 - INFO - 파일 검색 패턴: C:\Users\사용자명\Downloads\sora_auto_save_*.json
2025-01-27 15:30:45 - INFO - 발견된 파일 수: 3
2025-01-27 15:30:45 - INFO -   - sora_auto_save_2025-01-27T15-25-30.json
2025-01-27 15:30:45 - INFO -   - sora_auto_save_2025-01-27T15-28-15.json
2025-01-27 15:30:45 - INFO -   - sora_auto_save_2025-01-27T15-30-00.json
2025-01-27 15:30:45 - INFO - 최신 파일: sora_auto_save_2025-01-27T15-30-00.json
2025-01-27 15:30:45 - INFO - JSON 파일 유효성 검사 통과: sora_auto_save_2025-01-27T15-30-00.json
2025-01-27 15:30:45 - INFO -   - 이미지: 15개
2025-01-27 15:30:45 - INFO -   - 프롬프트: 12개
2025-01-27 15:30:45 - INFO - 파일 복사 완료: sora_auto_save_2025-01-27T15-30-00.json → organized_files\sora_latest_data.json
2025-01-27 15:30:45 - INFO - 백업 폴더: backup
2025-01-27 15:30:45 - INFO - 백업 완료: sora_auto_save_2025-01-27T15-25-30.json → backup\sora_auto_save_2025-01-27T15-25-30.json
2025-01-27 15:30:45 - INFO - 백업 완료: sora_auto_save_2025-01-27T15-28-15.json → backup\sora_auto_save_2025-01-27T15-28-15.json
2025-01-27 15:30:45 - INFO - 파일 정리 완료: organized_files\sora_latest_data.json
```

## 🔧 고급 사용법

### **자동 실행 스케줄링**
Windows 작업 스케줄러를 사용하여 주기적으로 실행할 수 있습니다:

1. 작업 스케줄러 열기
2. "기본 작업 만들기" 선택
3. 트리거: 매일 또는 매시간
4. 동작: 프로그램 시작
5. 프로그램: `python file_organizer.py`
6. 시작 위치: 프로그램 폴더 경로

### **다양한 파일 패턴 지원**
```bash
# 모든 sora 관련 파일
python file_organizer.py --file-pattern "*sora*"

# 특정 날짜 패턴
python file_organizer.py --file-pattern "sora_auto_save_2025-01-27*.json"

# 여러 패턴 (별도 실행)
python file_organizer.py --file-pattern "data_*.json"
python file_organizer.py --file-pattern "backup_*.json"
```

## ⚠️ 주의사항

1. **Python 설치 필요**: Python 3.6 이상이 설치되어 있어야 합니다.
2. **권한 확인**: 대상 폴더에 쓰기 권한이 있어야 합니다.
3. **백업 확인**: 중요한 파일은 백업 폴더에서 확인 후 삭제하세요.
4. **로그 관리**: 로그 파일이 많아지면 주기적으로 정리하세요.

## 🐛 문제 해결

### **파일을 찾을 수 없음**
- 다운로드 폴더 경로가 올바른지 확인
- 파일 패턴이 정확한지 확인
- `--status` 옵션으로 현재 상태 확인

### **권한 오류**
- 관리자 권한으로 실행
- 대상 폴더 권한 확인
- 안티바이러스 프로그램 예외 설정

### **JSON 파싱 오류**
- 파일이 손상되었는지 확인
- 파일 형식이 올바른지 확인
- 백업 폴더에서 이전 버전 확인

## 📞 지원

문제가 발생하면 로그 파일을 확인하고 다음 정보를 포함하여 문의하세요:
- 로그 파일 내용
- 사용한 명령어
- 운영체제 버전
- Python 버전 