import json
import time
import os
import shutil
from datetime import datetime
from pathlib import Path
import hashlib
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class FileWatcherBackup:
    def __init__(self, extension_path, backup_folder="backup_data"):
        self.extension_path = Path(extension_path)
        self.backup_folder = Path(backup_folder)
        self.watching = False
        self.file_hashes = {}  # 파일 해시 저장
        self.localStorage_hash = None  # localStorage 해시 저장
        self.driver = None  # Chrome 드라이버
        
        # 백업 폴더 생성
        self.backup_folder.mkdir(exist_ok=True)
        
        # 감시할 파일 목록
        self.watch_files = [
            "data/save_prompt.json",
            "data/localStorage_sync.json", 
            "data/load_prompt.json",
            "extension_data/save_prompt.json"
        ]
        
        print(f"📁 확장 프로그램 경로: {self.extension_path}")
        print(f"📁 로그 폴더: {self.backup_folder}")
        print(f"👀 감시 파일: {len(self.watch_files)}개")
        print(f"🌐 localStorage 감시: 활성화")
    
    def setup_chrome_driver(self):
        """Chrome 드라이버 설정"""
        try:
            chrome_options = Options()
            chrome_options.add_argument("--headless")  # 백그라운드 실행
            chrome_options.add_argument("--disable-web-security")
            chrome_options.add_argument("--allow-running-insecure-content")
            chrome_options.add_argument("--disable-gpu")
            chrome_options.add_argument("--no-sandbox")
            chrome_options.add_argument("--disable-dev-shm-usage")
            
            self.driver = webdriver.Chrome(options=chrome_options)
            print("✅ Chrome 드라이버 설정 완료")
            return True
        except Exception as e:
            print(f"❌ Chrome 드라이버 설정 실패: {e}")
            return False
    
    def get_file_hash(self, filepath):
        """파일의 MD5 해시 계산"""
        try:
            with open(filepath, 'rb') as f:
                return hashlib.md5(f.read()).hexdigest()
        except:
            return None
    
    def get_localStorage_hash(self):
        """localStorage 데이터의 해시 계산 (save_prompt_data 특별 감지)"""
        try:
            if not self.driver:
                return None
            
            # Sora 페이지로 이동
            self.driver.get("https://sora.chatgpt.com/")
            time.sleep(3)  # 페이지 로딩 대기
            
            # localStorage 데이터 가져오기 (확장 프로그램 키들 특별 감지)
            localStorage_script = """
            let data = {};
            let savePromptData = null;
            let jsonSavePromptData = null;
            let jsonLoadPromptData = null;
            
            // 모든 localStorage 데이터 수집
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                data[key] = value;
                
                // 확장 프로그램 관련 키들 특별 감지
                if (key === 'save_prompt_data') {
                    savePromptData = value;
                } else if (key === 'json_save_prompt.json') {
                    jsonSavePromptData = value;
                } else if (key === 'json_load_prompt.json') {
                    jsonLoadPromptData = value;
                }
            }
            
            // 확장 프로그램 데이터가 있으면 우선적으로 반환
            if (savePromptData || jsonSavePromptData || jsonLoadPromptData) {
                return {
                    all_data: JSON.stringify(data),
                    save_prompt_data: savePromptData,
                    json_save_prompt: jsonSavePromptData,
                    json_load_prompt: jsonLoadPromptData,
                    has_extension_data: true
                };
            }
            
            return {
                all_data: JSON.stringify(data),
                save_prompt_data: null,
                json_save_prompt: null,
                json_load_prompt: null,
                has_extension_data: false
            };
            """
            
            localStorage_result = self.driver.execute_script(localStorage_script)
            
            if localStorage_result:
                # 확장 프로그램 데이터가 있으면 해당 데이터의 해시 반환
                if localStorage_result.get('has_extension_data'):
                    # 우선순위: json_save_prompt.json > save_prompt_data > json_load_prompt.json
                    json_save_prompt = localStorage_result.get('json_save_prompt')
                    save_prompt_data = localStorage_result.get('save_prompt_data')
                    json_load_prompt = localStorage_result.get('json_load_prompt')
                    
                    if json_save_prompt:
                        return hashlib.md5(json_save_prompt.encode('utf-8')).hexdigest()
                    elif save_prompt_data:
                        return hashlib.md5(save_prompt_data.encode('utf-8')).hexdigest()
                    elif json_load_prompt:
                        return hashlib.md5(json_load_prompt.encode('utf-8')).hexdigest()
                    else:
                        # 전체 localStorage 데이터의 해시 반환
                        all_data = localStorage_result.get('all_data', '')
                        return hashlib.md5(all_data.encode('utf-8')).hexdigest()
                else:
                    # 전체 localStorage 데이터의 해시 반환
                    all_data = localStorage_result.get('all_data', '')
                    return hashlib.md5(all_data.encode('utf-8')).hexdigest()
            return None
            
        except Exception as e:
            print(f"❌ localStorage 해시 계산 실패: {e}")
            return None
    
    def log_localStorage_change(self, reason="변경"):
        """localStorage 변경 로그 기록 (save_prompt_data 특별 표시)"""
        try:
            log_file = self.backup_folder / "change_log.txt"
            
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # 확장 프로그램 데이터 내용 확인
            extension_data_content = "없음"
            try:
                if self.driver:
                    extension_data_script = """
                    let result = [];
                    
                    // json_save_prompt.json 확인
                    const jsonSavePrompt = localStorage.getItem('json_save_prompt.json');
                    if (jsonSavePrompt) {
                        try {
                            const parsed = JSON.parse(jsonSavePrompt);
                            if (parsed.prompts && parsed.prompts.length > 0) {
                                result.push(`json_save_prompt: ${parsed.prompts.length}개 프롬프트`);
                            } else {
                                result.push('json_save_prompt: 빈 배열');
                            }
                        } catch (e) {
                            result.push('json_save_prompt: JSON 오류');
                        }
                    }
                    
                    // save_prompt_data 확인
                    const savePromptData = localStorage.getItem('save_prompt_data');
                    if (savePromptData) {
                        try {
                            const parsed = JSON.parse(savePromptData);
                            if (parsed.prompts && parsed.prompts.length > 0) {
                                result.push(`save_prompt_data: ${parsed.prompts.length}개 프롬프트`);
                            } else {
                                result.push('save_prompt_data: 빈 배열');
                            }
                        } catch (e) {
                            result.push('save_prompt_data: JSON 오류');
                        }
                    }
                    
                    // json_load_prompt.json 확인
                    const jsonLoadPrompt = localStorage.getItem('json_load_prompt.json');
                    if (jsonLoadPrompt) {
                        try {
                            const parsed = JSON.parse(jsonLoadPrompt);
                            if (parsed.results && parsed.results.length > 0) {
                                result.push(`json_load_prompt: ${parsed.results.length}개 결과`);
                            } else {
                                result.push('json_load_prompt: 빈 결과');
                            }
                        } catch (e) {
                            result.push('json_load_prompt: JSON 오류');
                        }
                    }
                    
                    return result.length > 0 ? result.join(', ') : '확장 프로그램 데이터 없음';
                    """
                    extension_data_content = self.driver.execute_script(extension_data_script) or "확인 실패"
            except:
                extension_data_content = "확인 실패"
            
            log_entry = f"[{timestamp}] localStorage ({reason}) - 확장프로그램 데이터: {extension_data_content}\n"
            
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(log_entry)
            
            print(f"📝 localStorage 변경 감지 ({reason}) - 확장프로그램 데이터: {extension_data_content}")
            
        except Exception as e:
            print(f"❌ localStorage 로그 기록 실패: {e}")
    
    def log_file_change(self, filepath, reason="변경"):
        """파일 변경 로그 기록"""
        try:
            log_file = self.backup_folder / "change_log.txt"
            
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            relative_path = filepath.relative_to(self.extension_path)
            
            log_entry = f"[{timestamp}] {relative_path} ({reason})\n"
            
            with open(log_file, 'a', encoding='utf-8') as f:
                f.write(log_entry)
            
            print(f"📝 변경 감지: {relative_path} ({reason})")
            
        except Exception as e:
            print(f"❌ 로그 기록 실패: {e}")
    
    def log_backup(self, original_path, backup_path, reason):
        """백업 로그 기록"""
        log_file = self.backup_folder / "backup_log.txt"
        
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        relative_path = original_path.relative_to(self.extension_path)
        
        log_entry = f"[{timestamp}] {relative_path} → {backup_path.name} ({reason})\n"
        
        with open(log_file, 'a', encoding='utf-8') as f:
            f.write(log_entry)
    
    def check_files(self):
        """모든 감시 파일 확인"""
        changed_files = []
        
        for file_rel_path in self.watch_files:
            filepath = self.extension_path / file_rel_path
            
            if not filepath.exists():
                continue
            
            current_hash = self.get_file_hash(filepath)
            previous_hash = self.file_hashes.get(str(filepath))
            
            if current_hash != previous_hash:
                changed_files.append((filepath, previous_hash is None))
                self.file_hashes[str(filepath)] = current_hash
        
        return changed_files
    
    def check_localStorage(self):
        """localStorage 변경 확인"""
        try:
            current_hash = self.get_localStorage_hash()
            if current_hash != self.localStorage_hash:
                is_new = self.localStorage_hash is None
                self.localStorage_hash = current_hash
                return True, is_new
            return False, False
        except Exception as e:
            print(f"❌ localStorage 확인 실패: {e}")
            return False, False
    
    def watch_and_backup(self, interval=10):
        """파일 및 localStorage 감시 및 자동 백업"""
        self.watching = True
        print(f"🔄 파일 및 localStorage 감시 시작 (간격: {interval}초)")
        
        # Chrome 드라이버 설정
        if not self.setup_chrome_driver():
            print("⚠️ Chrome 드라이버 설정 실패, 파일만 감시합니다.")
        
        # 초기 해시 설정
        for file_rel_path in self.watch_files:
            filepath = self.extension_path / file_rel_path
            if filepath.exists():
                self.file_hashes[str(filepath)] = self.get_file_hash(filepath)
                print(f"📝 초기 해시 설정: {file_rel_path}")
        
        # localStorage 초기 해시 설정
        if self.driver:
            self.localStorage_hash = self.get_localStorage_hash()
            print(f"📝 localStorage 초기 해시 설정 완료")
        
        while self.watching:
            try:
                # 변경된 파일 확인
                changed_files = self.check_files()
                
                # localStorage 변경 확인
                localStorage_changed = False
                localStorage_is_new = False
                if self.driver:
                    localStorage_changed, localStorage_is_new = self.check_localStorage()
                
                if changed_files or localStorage_changed:
                    print(f"\n⏰ {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - 변경 감지")
                    
                    # 파일 변경 로그
                    if changed_files:
                        print(f"📁 파일 변경: {len(changed_files)}개")
                    for filepath, is_new in changed_files:
                        reason = "신규 파일" if is_new else "변경"
                        self.log_file_change(filepath, reason)
                    
                    # localStorage 변경 로그
                    if localStorage_changed:
                        print(f"🌐 localStorage 변경")
                        reason = "신규 데이터" if localStorage_is_new else "변경"
                        self.log_localStorage_change(reason)
                else:
                    print(f"⏰ {datetime.now().strftime('%H:%M:%S')} - 변경 없음")
                
                time.sleep(interval)
                
            except KeyboardInterrupt:
                print("\n⏹️ 감시 중단됨")
                break
            except Exception as e:
                print(f"❌ 감시 중 오류: {e}")
                time.sleep(interval)
    
    def create_log_file(self):
        """로그 파일 생성"""
        log_file = self.backup_folder / "change_log.txt"
        
        if not log_file.exists():
            with open(log_file, 'w', encoding='utf-8') as f:
                f.write("# 파일 및 localStorage 변경 로그\n")
                f.write("# 형식: [시간] 파일명 (변경사유)\n\n")
        
            print(f"📝 로그 파일 생성: {log_file}")
    
    def show_log_status(self):
        """로그 상태 출력"""
        log_file = self.backup_folder / "change_log.txt"
        
        if log_file.exists():
            with open(log_file, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            change_count = len([line for line in lines if line.startswith('[')])
            print(f"📋 변경 로그: {change_count}개 항목 기록됨")
        else:
            print("📭 변경 로그가 없습니다.")
    
    def stop_watching(self):
        """감시 중단"""
        self.watching = False
        if self.driver:
            self.driver.quit()
        print("🛑 감시 중단됨")

def main():
    # 확장 프로그램 경로 설정
    extension_path = r"E:\Ai project\nb_wfa\sora-auto-image"
    
    # 파일 감시기 생성
    watcher = FileWatcherBackup(extension_path)
    
    # 로그 파일 생성
    watcher.create_log_file()
    
    # 로그 상태 출력
    watcher.show_log_status()
    
    try:
        # 파일 감시 시작 (10초 간격)
        watcher.watch_and_backup(interval=10)
    except KeyboardInterrupt:
        print("\n⏹️ 프로그램 종료")
    finally:
        watcher.stop_watching()

if __name__ == "__main__":
    main() 