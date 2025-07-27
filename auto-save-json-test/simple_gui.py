#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sora Auto Save 파일 정리 프로그램 - 간단한 GUI 버전
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import json
import os
import threading
from datetime import datetime
from pathlib import Path
import shutil
import glob

class SimpleFileOrganizerGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Sora Auto Save 파일 정리 프로그램")
        self.root.geometry("700x500")
        self.root.resizable(True, True)
        
        # 설정 파일 경로
        self.config_file = "file_organizer_config.json"
        self.config = self.load_config()
        
        # UI 초기화
        self.setup_ui()
        self.load_config_to_ui()
        
    def load_config(self):
        """설정 파일 로드"""
        default_config = {
            "download_folder": str(Path.cwd()),
            "target_folder": str(Path.cwd() / "organized_files"),
            "file_pattern": "sora_auto_save_*.json",
            "output_filename": "sora_latest_data.json",
            "backup_old_files": True,
            "backup_folder": str(Path.cwd() / "backup")
        }
        
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    # 기본값과 병합
                    for key, value in default_config.items():
                        if key not in config:
                            config[key] = value
                    return config
            except Exception as e:
                messagebox.showerror("오류", f"설정 파일 로드 실패: {e}")
                return default_config
        else:
            return default_config
            
    def save_config(self):
        """설정 파일 저장"""
        try:
            # UI에서 설정값 가져오기
            self.config["download_folder"] = self.download_folder_var.get()
            self.config["target_folder"] = self.target_folder_var.get()
            self.config["file_pattern"] = self.file_pattern_var.get()
            self.config["output_filename"] = self.output_filename_var.get()
            self.config["backup_old_files"] = self.backup_enabled_var.get()
            self.config["backup_folder"] = self.backup_folder_var.get()
            
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)
                
            self.log_message("✅ 설정이 저장되었습니다.")
            
        except Exception as e:
            messagebox.showerror("오류", f"설정 저장 실패: {e}")
            
    def setup_ui(self):
        """UI 구성"""
        # 메인 프레임
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # 그리드 가중치 설정
        self.root.columnconfigure(0, weight=1)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        
        # 제목
        title_label = ttk.Label(main_frame, text="🎨 Sora Auto Save 파일 정리 프로그램", 
                               font=("Arial", 14, "bold"))
        title_label.grid(row=0, column=0, columnspan=3, pady=(0, 15))
        
        # 설정 프레임
        settings_frame = ttk.LabelFrame(main_frame, text="설정", padding="10")
        settings_frame.grid(row=1, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        settings_frame.columnconfigure(1, weight=1)
        
        # 다운로드 폴더
        ttk.Label(settings_frame, text="다운로드 폴더:").grid(row=0, column=0, sticky=tk.W, pady=2)
        self.download_folder_var = tk.StringVar()
        download_entry = ttk.Entry(settings_frame, textvariable=self.download_folder_var, width=40)
        download_entry.grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(5, 5), pady=2)
        ttk.Button(settings_frame, text="찾아보기", command=self.browse_download_folder).grid(row=0, column=2, pady=2)
        
        # 대상 폴더
        ttk.Label(settings_frame, text="대상 폴더:").grid(row=1, column=0, sticky=tk.W, pady=2)
        self.target_folder_var = tk.StringVar()
        target_entry = ttk.Entry(settings_frame, textvariable=self.target_folder_var, width=40)
        target_entry.grid(row=1, column=1, sticky=(tk.W, tk.E), padx=(5, 5), pady=2)
        ttk.Button(settings_frame, text="찾아보기", command=self.browse_target_folder).grid(row=1, column=2, pady=2)
        
        # 파일 패턴
        ttk.Label(settings_frame, text="파일 패턴:").grid(row=2, column=0, sticky=tk.W, pady=2)
        self.file_pattern_var = tk.StringVar()
        pattern_entry = ttk.Entry(settings_frame, textvariable=self.file_pattern_var, width=40)
        pattern_entry.grid(row=2, column=1, sticky=(tk.W, tk.E), padx=(5, 5), pady=2)
        ttk.Label(settings_frame, text="예: sora_auto_save_*.json").grid(row=2, column=2, pady=2)
        
        # 출력 파일명
        ttk.Label(settings_frame, text="출력 파일명:").grid(row=3, column=0, sticky=tk.W, pady=2)
        self.output_filename_var = tk.StringVar()
        output_entry = ttk.Entry(settings_frame, textvariable=self.output_filename_var, width=40)
        output_entry.grid(row=3, column=1, sticky=(tk.W, tk.E), padx=(5, 5), pady=2)
        
        # 백업 설정
        self.backup_enabled_var = tk.BooleanVar()
        backup_check = ttk.Checkbutton(settings_frame, text="백업 활성화", 
                                      variable=self.backup_enabled_var)
        backup_check.grid(row=4, column=0, sticky=tk.W, pady=2)
        
        ttk.Label(settings_frame, text="백업 폴더:").grid(row=5, column=0, sticky=tk.W, pady=2)
        self.backup_folder_var = tk.StringVar()
        backup_entry = ttk.Entry(settings_frame, textvariable=self.backup_folder_var, width=40)
        backup_entry.grid(row=5, column=1, sticky=(tk.W, tk.E), padx=(5, 5), pady=2)
        ttk.Button(settings_frame, text="찾아보기", command=self.browse_backup_folder).grid(row=5, column=2, pady=2)
        
        # 버튼 프레임
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=2, column=0, columnspan=3, pady=(0, 10))
        
        ttk.Button(button_frame, text="설정 저장", command=self.save_config).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(button_frame, text="파일 정리 실행", command=self.run_organizer).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(button_frame, text="상태 확인", command=self.check_status).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(button_frame, text="폴더 열기", command=self.open_folders).pack(side=tk.LEFT)
        
        # 로그 프레임
        log_frame = ttk.LabelFrame(main_frame, text="실행 로그", padding="10")
        log_frame.grid(row=3, column=0, columnspan=3, sticky=(tk.W, tk.E, tk.N, tk.S), pady=(0, 10))
        log_frame.columnconfigure(0, weight=1)
        log_frame.rowconfigure(0, weight=1)
        main_frame.rowconfigure(3, weight=1)
        
        # 로그 텍스트 영역
        self.log_text = scrolledtext.ScrolledText(log_frame, height=12, width=70)
        self.log_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # 초기 로그 메시지
        self.log_message("🚀 간단한 GUI가 시작되었습니다.")
        self.log_message("설정을 조정하고 '파일 정리 실행' 버튼을 클릭하세요.")
        
    def load_config_to_ui(self):
        """설정값을 UI에 로드"""
        self.download_folder_var.set(self.config["download_folder"])
        self.target_folder_var.set(self.config["target_folder"])
        self.file_pattern_var.set(self.config["file_pattern"])
        self.output_filename_var.set(self.config["output_filename"])
        self.backup_enabled_var.set(self.config["backup_old_files"])
        self.backup_folder_var.set(self.config["backup_folder"])
        
    def browse_download_folder(self):
        """다운로드 폴더 선택"""
        folder = filedialog.askdirectory(title="다운로드 폴더 선택")
        if folder:
            self.download_folder_var.set(folder)
            
    def browse_target_folder(self):
        """대상 폴더 선택"""
        folder = filedialog.askdirectory(title="대상 폴더 선택")
        if folder:
            self.target_folder_var.set(folder)
            
    def browse_backup_folder(self):
        """백업 폴더 선택"""
        folder = filedialog.askdirectory(title="백업 폴더 선택")
        if folder:
            self.backup_folder_var.set(folder)
            
    def log_message(self, message):
        """로그 메시지 추가"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {message}\n"
        self.log_text.insert(tk.END, log_entry)
        self.log_text.see(tk.END)
        self.root.update_idletasks()
        
    def find_files(self, pattern):
        """패턴에 맞는 파일들 찾기"""
        download_path = Path(self.config["download_folder"])
        search_pattern = download_path / pattern
        
        self.log_message(f"파일 검색 패턴: {search_pattern}")
        
        files = list(Path(download_path).glob(pattern))
        files = [f for f in files if f.is_file()]
        
        self.log_message(f"발견된 파일 수: {len(files)}")
        for file in files:
            self.log_message(f"  - {file.name}")
            
        return files
        
    def get_latest_file(self, files):
        """가장 최신 파일 찾기"""
        if not files:
            return None
            
        latest_file = max(files, key=lambda x: x.stat().st_mtime)
        
        self.log_message(f"최신 파일: {latest_file.name}")
        self.log_message(f"수정 시간: {datetime.fromtimestamp(latest_file.stat().st_mtime)}")
        
        return latest_file
        
    def validate_json_file(self, file_path):
        """JSON 파일 유효성 검사"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            required_keys = ['metadata', 'images', 'prompts']
            if not all(key in data for key in required_keys):
                self.log_message(f"⚠️ 필수 키가 누락됨: {file_path.name}")
                return False
                
            self.log_message(f"✅ JSON 파일 유효성 검사 통과: {file_path.name}")
            self.log_message(f"  - 이미지: {len(data.get('images', []))}개")
            self.log_message(f"  - 프롬프트: {len(data.get('prompts', []))}개")
            
            return True
            
        except Exception as e:
            self.log_message(f"❌ JSON 파싱 오류: {file_path.name} - {e}")
            return False
            
    def copy_file(self, source, target):
        """파일 복사"""
        try:
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
            self.log_message(f"✅ 파일 복사 완료: {source.name} → {target}")
            return True
        except Exception as e:
            self.log_message(f"❌ 파일 복사 실패: {source.name} → {target} - {e}")
            return False
            
    def backup_files(self, files):
        """기존 파일들을 백업 폴더로 이동"""
        if not self.config["backup_old_files"]:
            return
            
        backup_path = Path(self.config["backup_folder"])
        backup_path.mkdir(parents=True, exist_ok=True)
        
        self.log_message(f"📁 백업 폴더: {backup_path}")
        
        for file in files:
            try:
                backup_file = backup_path / file.name
                
                counter = 1
                while backup_file.exists():
                    name_parts = file.stem.rsplit('_', 1)
                    if len(name_parts) > 1 and name_parts[1].isdigit():
                        base_name = name_parts[0]
                        counter = int(name_parts[1]) + 1
                    else:
                        base_name = file.stem
                    
                    backup_file = backup_path / f"{base_name}_{counter}{file.suffix}"
                    counter += 1
                
                shutil.move(str(file), str(backup_file))
                self.log_message(f"✅ 백업 완료: {file.name} → {backup_file.name}")
                
            except Exception as e:
                self.log_message(f"❌ 백업 실패: {file.name} - {e}")
                
    def run_organizer(self):
        """파일 정리 실행"""
        def run_in_thread():
            try:
                self.log_message("🔄 파일 정리를 시작합니다...")
                
                # 설정 저장
                self.save_config()
                
                # 1. 파일 찾기
                files = self.find_files(self.config["file_pattern"])
                
                if not files:
                    self.log_message("⚠️ 정리할 파일이 없습니다.")
                    return
                    
                # 2. 최신 파일 찾기
                latest_file = self.get_latest_file(files)
                if not latest_file:
                    self.log_message("❌ 최신 파일을 찾을 수 없습니다.")
                    return
                    
                # 3. JSON 파일 유효성 검사
                if not self.validate_json_file(latest_file):
                    self.log_message("❌ 최신 파일이 유효하지 않습니다.")
                    return
                    
                # 4. 대상 폴더에 복사
                target_path = Path(self.config["target_folder"]) / self.config["output_filename"]
                
                if self.copy_file(latest_file, target_path):
                    self.log_message(f"✅ 파일 정리 완료: {target_path}")
                    
                    # 5. 백업 처리
                    if self.config["backup_old_files"]:
                        self.backup_files(files)
                        
                    self.log_message("🎉 모든 작업이 완료되었습니다!")
                else:
                    self.log_message("❌ 파일 정리에 실패했습니다.")
                    
            except Exception as e:
                self.log_message(f"❌ 실행 중 오류 발생: {e}")
                
        thread = threading.Thread(target=run_in_thread)
        thread.daemon = True
        thread.start()
        
    def check_status(self):
        """상태 확인"""
        try:
            self.log_message("📊 현재 상태를 확인합니다...")
            
            # 설정 표시
            self.log_message("=== 현재 설정 ===")
            for key, value in self.config.items():
                self.log_message(f"  {key}: {value}")
                
            # 파일 목록 확인
            files = self.find_files(self.config["file_pattern"])
            if files:
                self.log_message(f"📁 다운로드 폴더의 {self.config['file_pattern']} 파일들:")
                for file in sorted(files, key=lambda x: x.stat().st_mtime, reverse=True):
                    mtime = datetime.fromtimestamp(file.stat().st_mtime)
                    self.log_message(f"  - {file.name} (수정: {mtime})")
            else:
                self.log_message("📁 다운로드 폴더에 해당 파일이 없습니다.")
                
        except Exception as e:
            self.log_message(f"❌ 상태 확인 중 오류 발생: {e}")
            
    def open_folders(self):
        """폴더들 열기"""
        try:
            # 대상 폴더 열기
            target_dir = Path(self.target_folder_var.get())
            if target_dir.exists():
                os.startfile(target_dir)
                self.log_message(f"📁 대상 폴더를 열었습니다: {target_dir}")
            else:
                self.log_message("📁 대상 폴더가 존재하지 않습니다.")
                
            # 백업 폴더 열기
            backup_dir = Path(self.backup_folder_var.get())
            if backup_dir.exists():
                os.startfile(backup_dir)
                self.log_message(f"📁 백업 폴더를 열었습니다: {backup_dir}")
            else:
                self.log_message("📁 백업 폴더가 존재하지 않습니다.")
                
        except Exception as e:
            self.log_message(f"❌ 폴더 열기 중 오류 발생: {e}")

def main():
    root = tk.Tk()
    app = SimpleFileOrganizerGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main() 