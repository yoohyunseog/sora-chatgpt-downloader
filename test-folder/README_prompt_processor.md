# Prompt Processor (프롬프트 프로세서)

크롬 확장 프로그램과 연동하여 `data.json` 파일을 관리하는 파이썬 스크립트입니다.

## 기능

- ✅ JSON 데이터 파일 관리
- ✅ 아이템 추가/수정/삭제
- ✅ 설정 관리
- ✅ 대화형 모드
- ✅ 명령행 인터페이스
- ✅ 자동 저장

## 설치 및 실행

### 1. 기본 실행 (대화형 모드)
```bash
python prompt_processor.py
```

### 2. 명령행 옵션 사용
```bash
# 아이템 목록 보기
python prompt_processor.py --list

# 새 아이템 추가
python prompt_processor.py --add "제목" "내용"

# 아이템 삭제
python prompt_processor.py --remove 1

# 아이템 수정
python prompt_processor.py --update 1 "새제목" "새내용"

# 설정 보기
python prompt_processor.py --settings

# 다른 파일 지정
python prompt_processor.py --file my_data.json
```

## 대화형 모드 사용법

프로그램을 실행하면 다음과 같은 메뉴가 나타납니다:

```
=== 프롬프트 프로세서 대화형 모드 ===
사용 가능한 명령어:
1. add - 새 아이템 추가
2. list - 아이템 목록 보기
3. update - 아이템 수정
4. remove - 아이템 삭제
5. settings - 설정 보기
6. set - 설정 변경
7. save - 데이터 저장
8. quit - 종료

명령어를 입력하세요:
```

### 명령어 상세 설명

#### 1. `add` - 새 아이템 추가
```
명령어를 입력하세요: add
제목을 입력하세요: 테스트 아이템
내용을 입력하세요: 이것은 테스트 내용입니다.
아이템 '테스트 아이템'이 추가되었습니다. (ID: 4)
```

#### 2. `list` - 아이템 목록 보기
```
명령어를 입력하세요: list

=== 아이템 목록 ===
ID: 1
제목: First Item
내용: This is the first test item
생성일: 2025-01-27 10:30:00
------------------------------
ID: 2
제목: Second Item
내용: This is the second test item
생성일: 2025-01-27 10:31:00
------------------------------
```

#### 3. `update` - 아이템 수정
```
명령어를 입력하세요: update
수정할 아이템 ID를 입력하세요: 1
새 제목 (변경하지 않으려면 엔터): 수정된 제목
새 내용 (변경하지 않으려면 엔터): 수정된 내용
아이템 ID 1이 수정되었습니다.
```

#### 4. `remove` - 아이템 삭제
```
명령어를 입력하세요: remove
삭제할 아이템 ID를 입력하세요: 3
아이템 'Third Item'이 삭제되었습니다.
```

#### 5. `settings` - 설정 보기
```
명령어를 입력하세요: settings

=== 현재 설정 ===
enabled: True
autoLoad: False
theme: dark
```

#### 6. `set` - 설정 변경
```
명령어를 입력하세요: set
변경할 설정을 선택하세요:
1. enabled
2. autoLoad
3. theme
설정 번호: 1
enabled 값 (true/false): false
설정 'enabled'이 'False'로 업데이트되었습니다.
```

#### 7. `save` - 데이터 저장
```
명령어를 입력하세요: save
데이터가 data.json에 저장되었습니다.
```

#### 8. `quit` - 종료
```
명령어를 입력하세요: quit
프로그램을 종료합니다.
```

## 데이터 구조

생성되는 JSON 파일의 구조:

```json
{
  "name": "Test Data",
  "version": "1.0.0",
  "description": "This is a test data file for the Chrome extension",
  "items": [
    {
      "id": 1,
      "title": "First Item",
      "content": "This is the first test item",
      "created": "2025-01-27 10:30:00"
    }
  ],
  "settings": {
    "enabled": true,
    "autoLoad": false,
    "theme": "dark"
  },
  "metadata": {
    "created": "2025-01-27",
    "lastModified": "2025-01-27",
    "author": "Test User"
  }
}
```

## 크롬 확장 프로그램과의 연동

1. **데이터 수정**: 파이썬 스크립트로 `data.json` 파일을 수정
2. **확장 프로그램 새로고침**: 크롬에서 `chrome://extensions/` → 확장 프로그램 새로고침
3. **확장 프로그램 테스트**: 확장 프로그램 아이콘 클릭하여 수정된 데이터 확인

## 예제 사용 시나리오

### 시나리오 1: 새로운 아이템 추가
```bash
# 파이썬 스크립트 실행
python prompt_processor.py

# 대화형 모드에서 아이템 추가
add
제목: 새로운 테스트 아이템
내용: 이것은 파이썬 스크립트로 추가한 아이템입니다.

# 저장
save

# 종료
quit
```

### 시나리오 2: 명령행에서 빠른 추가
```bash
python prompt_processor.py --add "빠른 추가" "명령행에서 추가한 아이템"
```

### 시나리오 3: 설정 변경
```bash
python prompt_processor.py --interactive
# 대화형 모드에서 set 명령어 사용
```

## 오류 처리

- **파일 없음**: 자동으로 기본 데이터 구조 생성
- **잘못된 JSON**: 기본 데이터로 초기화
- **권한 오류**: 적절한 오류 메시지 출력
- **키보드 인터럽트**: 안전한 종료

## 주의사항

1. **파일 백업**: 중요한 데이터는 정기적으로 백업
2. **권한 확인**: 파일 쓰기 권한이 있는지 확인
3. **확장 프로그램 새로고침**: 데이터 수정 후 확장 프로그램 새로고침 필요
4. **인코딩**: UTF-8 인코딩 사용

## 확장 가능성

- 데이터베이스 연동
- API 연동
- 웹 인터페이스
- 자동 백업
- 데이터 검증
- 템플릿 시스템 