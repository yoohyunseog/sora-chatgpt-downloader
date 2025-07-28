#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sora Auto Save 파일 정리 프로그램 - GUI 버전 (자동 실행 타이머 포함)
"""

import tkinter as tk
from tkinter import ttk, filedialog, messagebox, scrolledtext
import json
import os
import threading
import subprocess
import sys
from datetime import datetime
from pathlib import Path
import time
import shutil
import locale

class FileOrganizerGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Sora Auto Save 파일 정리 프로그램")
        self.root.geometry("1400x800")
        self.root.resizable(False, False)  # 창 크기 변경 비활성화
        
        # 설정 파일 경로
        self.config_file = "file_organizer_config.json"
        self.config = self.load_config()
        
        # 자동 실행 관련 변수
        self.auto_timer = None
        self.is_auto_running = False
        self.countdown_seconds = 0
        
        # 시스템 인코딩 감지
        self.system_encoding = self.detect_system_encoding()
        
        # UI 초기화
        self.setup_ui()
        self.load_config_to_ui()
        
        # 자동 실행 상태 복원
        self.restore_auto_state()
        
    def detect_system_encoding(self):
        """시스템 인코딩 감지"""
        try:
            # Windows에서 기본 인코딩 감지
            if os.name == 'nt':
                return locale.getpreferredencoding()
            else:
                return 'utf-8'
        except:
            return 'utf-8'
        
    def load_config(self):
        """설정 파일 로드"""
        default_config = {
            "download_folder": str(Path.home() / "Downloads"),
            "target_folder": str(Path.cwd() / "organized_files"),
            "file_pattern": "sora_auto_save_*.json",
            "output_filename": "sora_latest_data.json",
            "backup_old_files": True,
            "backup_folder": str(Path.cwd() / "backup"),
            "auto_run_interval": 300,  # 5분
            "max_backup_files": 10,
            "auto_run_enabled": False,  # 자동 실행 기본값
            "cleanup_mode": "delete",  # 파일 정리 모드 (메인 폴더용)
            "max_cleanup_backup_files": 5,  # 최대 정리 백업 파일 수
            "max_log_files": 10,  # 최대 로그 파일 수
            "move1_source": "",
            "move1_target": "",
            "move1_enabled": False,
            "move1_filename": "",
            "move2_source": "",
            "move2_target": "",
            "move2_enabled": False,
            "move2_filename": ""
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
            self.config["auto_run_interval"] = int(self.interval_var.get())
            self.config["max_backup_files"] = int(self.max_backup_var.get())
            self.config["auto_run_enabled"] = self.auto_run_enabled_var.get()
            
            # 파일 정리 옵션 저장
            self.config["cleanup_mode"] = self.cleanup_mode_var.get()
            self.config["max_cleanup_backup_files"] = int(self.max_cleanup_backup_var.get())
            self.config["max_log_files"] = int(self.max_log_files_var.get())
            
            # 파일 이동 설정 저장
            self.config["move1_source"] = self.move1_source_var.get()
            self.config["move1_target"] = self.move1_target_var.get()
            self.config["move1_enabled"] = self.move1_enabled_var.get()
            self.config["move1_filename"] = self.move1_filename_var.get()
            
            self.config["move2_source"] = self.move2_source_var.get()
            self.config["move2_target"] = self.move2_target_var.get()
            self.config["move2_enabled"] = self.move2_enabled_var.get()
            self.config["move2_filename"] = self.move2_filename_var.get()
            
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)
                
            self.log_message("✅ 설정이 저장되었습니다.")
            
        except Exception as e:
            messagebox.showerror("오류", f"설정 저장 실패: {e}")
            self.log_message(f"❌ 설정 저장 실패: {e}")
            
    def setup_ui(self):
        """UI 구성"""
        # 메인 프레임
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # 제목
        title_label = ttk.Label(main_frame, text="🎨 Sora Auto Save 파일 정리 프로그램", 
                               font=("Arial", 16, "bold"))
        title_label.grid(row=0, column=0, columnspan=3, pady=(0, 20))
        
        # 자동 실행 프레임
        auto_frame = ttk.LabelFrame(main_frame, text="🔄 자동 실행 설정", padding="10")
        auto_frame.grid(row=1, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        
        # 자동 실행 토글
        self.auto_run_enabled_var = tk.BooleanVar()
        auto_toggle = ttk.Checkbutton(auto_frame, text="자동 실행 활성화", 
                                     variable=self.auto_run_enabled_var,
                                     command=self.toggle_auto_run)
        auto_toggle.grid(row=0, column=0, sticky=tk.W, pady=2)
        
        # 실행 간격 설정
        ttk.Label(auto_frame, text="실행 간격 (초):").grid(row=0, column=1, sticky=tk.W, padx=(20, 5), pady=2)
        self.interval_var = tk.StringVar()
        interval_entry = ttk.Entry(auto_frame, textvariable=self.interval_var, width=10)
        interval_entry.grid(row=0, column=2, sticky=tk.W, pady=2)
        
        # 카운트다운 표시
        self.countdown_label = ttk.Label(auto_frame, text="다음 실행까지: --:--", 
                                        font=("Arial", 12, "bold"), foreground="blue")
        self.countdown_label.grid(row=1, column=0, columnspan=3, pady=(10, 0))
        
        # 설정 프레임
        settings_frame = ttk.LabelFrame(main_frame, text="⚙️ 메인 설정", padding="10")
        settings_frame.grid(row=2, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        
        # 다운로드 폴더
        ttk.Label(settings_frame, text="📁 다운로드 폴더:").grid(row=0, column=0, sticky=tk.W, pady=2)
        self.download_folder_var = tk.StringVar()
        download_entry = ttk.Entry(settings_frame, textvariable=self.download_folder_var)
        download_entry.grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(5, 5), pady=2)
        ttk.Button(settings_frame, text="찾아보기", command=self.browse_download_folder).grid(row=0, column=2, pady=2)
        
        # 대상 폴더
        ttk.Label(settings_frame, text="📂 대상 폴더:").grid(row=1, column=0, sticky=tk.W, pady=2)
        self.target_folder_var = tk.StringVar()
        target_entry = ttk.Entry(settings_frame, textvariable=self.target_folder_var)
        target_entry.grid(row=1, column=1, sticky=(tk.W, tk.E), padx=(5, 5), pady=2)
        ttk.Button(settings_frame, text="찾아보기", command=self.browse_target_folder).grid(row=1, column=2, pady=2)
        
        # 파일 패턴
        ttk.Label(settings_frame, text="🔍 파일 패턴:").grid(row=2, column=0, sticky=tk.W, pady=2)
        self.file_pattern_var = tk.StringVar()
        pattern_entry = ttk.Entry(settings_frame, textvariable=self.file_pattern_var)
        pattern_entry.grid(row=2, column=1, sticky=(tk.W, tk.E), padx=(5, 5), pady=2)
        
        # 출력 파일명
        ttk.Label(settings_frame, text="📄 출력 파일명:").grid(row=3, column=0, sticky=tk.W, pady=2)
        self.output_filename_var = tk.StringVar()
        output_entry = ttk.Entry(settings_frame, textvariable=self.output_filename_var)
        output_entry.grid(row=3, column=1, sticky=(tk.W, tk.E), padx=(5, 5), pady=2)
        
        # 백업 설정
        self.backup_enabled_var = tk.BooleanVar()
        backup_check = ttk.Checkbutton(settings_frame, text="💾 기존 파일 백업", variable=self.backup_enabled_var)
        backup_check.grid(row=4, column=0, sticky=tk.W, pady=2)
        
        ttk.Label(settings_frame, text="📦 백업 폴더:").grid(row=4, column=1, sticky=tk.W, padx=(20, 5), pady=2)
        self.backup_folder_var = tk.StringVar()
        backup_entry = ttk.Entry(settings_frame, textvariable=self.backup_folder_var)
        backup_entry.grid(row=4, column=1, sticky=(tk.W, tk.E), padx=(100, 5), pady=2)
        ttk.Button(settings_frame, text="찾아보기", command=self.browse_backup_folder).grid(row=4, column=2, pady=2)
        
        # 최대 백업 파일 수
        ttk.Label(settings_frame, text="🔢 최대 백업 파일 수:").grid(row=5, column=0, sticky=tk.W, pady=2)
        self.max_backup_var = tk.StringVar(value="10")
        max_backup_entry = ttk.Entry(settings_frame, textvariable=self.max_backup_var, width=10)
        max_backup_entry.grid(row=5, column=1, sticky=tk.W, padx=(5, 5), pady=2)
        
        # 파일 정리 옵션 프레임
        cleanup_frame = ttk.LabelFrame(main_frame, text="🗂️ 파일 정리 옵션", padding="10")
        cleanup_frame.grid(row=3, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        
        # 정리 모드 선택
        ttk.Label(cleanup_frame, text="🧹 정리 모드:").grid(row=0, column=0, sticky=tk.W, pady=2)
        self.cleanup_mode_var = tk.StringVar(value="delete")
        cleanup_combo = ttk.Combobox(cleanup_frame, textvariable=self.cleanup_mode_var, 
                                    values=["delete", "backup", "keep", "rename"], state="readonly")
        cleanup_combo.grid(row=0, column=1, sticky=tk.W, padx=(5, 5), pady=2)
        cleanup_combo.set("delete")
        
        # 정리 모드 설명
        cleanup_desc = ttk.Label(cleanup_frame, text="🗑️ delete: 완전 삭제 | 💾 backup: 백업 후 삭제 | 📁 keep: 유지 | ✏️ rename: 이름 변경")
        cleanup_desc.grid(row=0, column=2, sticky=tk.W, padx=(10, 0), pady=2)
        
        # 최대 정리 백업 파일 수
        ttk.Label(cleanup_frame, text="📦 최대 정리 백업 파일 수:").grid(row=1, column=0, sticky=tk.W, pady=2)
        self.max_cleanup_backup_var = tk.StringVar(value="5")
        max_cleanup_entry = ttk.Entry(cleanup_frame, textvariable=self.max_cleanup_backup_var, width=10)
        max_cleanup_entry.grid(row=1, column=1, sticky=tk.W, padx=(5, 5), pady=2)
        
        ttk.Label(cleanup_frame, text="📋 최대 로그 파일 수:").grid(row=2, column=0, sticky=tk.W, pady=2)
        self.max_log_files_var = tk.StringVar(value="10")
        max_log_entry = ttk.Entry(cleanup_frame, textvariable=self.max_log_files_var, width=10)
        max_log_entry.grid(row=2, column=1, sticky=tk.W, padx=(5, 5), pady=2)
        
        # 파일 이동 설정 프레임
        move_frame = ttk.LabelFrame(main_frame, text="📁 파일 이동/덮어쓰기 설정", padding="10")
        move_frame.grid(row=4, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        
        # 이동 설정 1 (왼쪽)
        move1_frame = ttk.LabelFrame(move_frame, text="📤 이동 설정 1", padding="5")
        move1_frame.grid(row=0, column=0, sticky=(tk.W, tk.E), padx=(0, 5), pady=(0, 10))
        
        ttk.Label(move1_frame, text="📂 소스 폴더:").grid(row=0, column=0, sticky=tk.W, pady=2)
        self.move1_source_var = tk.StringVar()
        move1_source_entry = ttk.Entry(move1_frame, textvariable=self.move1_source_var)
        move1_source_entry.grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(5, 5), pady=2)
        ttk.Button(move1_frame, text="찾아보기", command=self.browse_move1_source).grid(row=0, column=2, pady=2)
        
        ttk.Label(move1_frame, text="📁 대상 폴더:").grid(row=1, column=0, sticky=tk.W, pady=2)
        self.move1_target_var = tk.StringVar()
        move1_target_entry = ttk.Entry(move1_frame, textvariable=self.move1_target_var)
        move1_target_entry.grid(row=1, column=1, sticky=(tk.W, tk.E), padx=(5, 5), pady=2)
        ttk.Button(move1_frame, text="찾아보기", command=self.browse_move1_target).grid(row=1, column=2, pady=2)
        
        ttk.Label(move1_frame, text="🔍 파일명 패턴:").grid(row=2, column=0, sticky=tk.W, pady=2)
        self.move1_filename_var = tk.StringVar()
        move1_filename_entry = ttk.Entry(move1_frame, textvariable=self.move1_filename_var)
        move1_filename_entry.grid(row=2, column=1, sticky=(tk.W, tk.E), padx=(5, 5), pady=2)
        
        self.move1_enabled_var = tk.BooleanVar()
        move1_check = ttk.Checkbutton(move1_frame, text="✅ 활성화", variable=self.move1_enabled_var)
        move1_check.grid(row=3, column=0, sticky=tk.W, pady=2)
        
        ttk.Button(move1_frame, text="▶️ 즉시 실행", command=self.execute_move1).grid(row=3, column=1, sticky=tk.W, padx=(5, 5), pady=2)
        ttk.Button(move1_frame, text="💾 파일 정리 옵션으로 저장", command=self.execute_move1_to_organized).grid(row=3, column=2, sticky=tk.W, pady=2)
        
        # 이동 설정 2 (오른쪽)
        move2_frame = ttk.LabelFrame(move_frame, text="📥 이동 설정 2", padding="5")
        move2_frame.grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(5, 0), pady=(0, 10))
        
        ttk.Label(move2_frame, text="📂 소스 폴더:").grid(row=0, column=0, sticky=tk.W, pady=2)
        self.move2_source_var = tk.StringVar()
        move2_source_entry = ttk.Entry(move2_frame, textvariable=self.move2_source_var)
        move2_source_entry.grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(5, 5), pady=2)
        ttk.Button(move2_frame, text="찾아보기", command=self.browse_move2_source).grid(row=0, column=2, pady=2)
        
        ttk.Label(move2_frame, text="📁 대상 폴더:").grid(row=1, column=0, sticky=tk.W, pady=2)
        self.move2_target_var = tk.StringVar()
        move2_target_entry = ttk.Entry(move2_frame, textvariable=self.move2_target_var)
        move2_target_entry.grid(row=1, column=1, sticky=(tk.W, tk.E), padx=(5, 5), pady=2)
        ttk.Button(move2_frame, text="찾아보기", command=self.browse_move2_target).grid(row=1, column=2, pady=2)
        
        ttk.Label(move2_frame, text="🔍 파일명 패턴:").grid(row=2, column=0, sticky=tk.W, pady=2)
        self.move2_filename_var = tk.StringVar()
        move2_filename_entry = ttk.Entry(move2_frame, textvariable=self.move2_filename_var)
        move2_filename_entry.grid(row=2, column=1, sticky=(tk.W, tk.E), padx=(5, 5), pady=2)
        
        self.move2_enabled_var = tk.BooleanVar()
        move2_check = ttk.Checkbutton(move2_frame, text="✅ 활성화", variable=self.move2_enabled_var)
        move2_check.grid(row=3, column=0, sticky=tk.W, pady=2)
        
        ttk.Button(move2_frame, text="▶️ 즉시 실행", command=self.execute_move2).grid(row=3, column=1, sticky=tk.W, padx=(5, 5), pady=2)
        ttk.Button(move2_frame, text="💾 파일 정리 옵션으로 저장", command=self.execute_move2_to_organized).grid(row=3, column=2, sticky=tk.W, pady=2)
        
        # 버튼 프레임
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=5, column=0, columnspan=1, pady=(0, 10), sticky=tk.W)
        
        ttk.Button(button_frame, text="💾 설정 저장", command=self.save_config).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(button_frame, text="▶️ 수동 실행", command=self.run_organizer).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(button_frame, text="📊 상태 확인", command=self.check_status).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(button_frame, text="📋 로그 폴더 열기", command=self.open_log_folder).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(button_frame, text="📁 대상 폴더 열기", command=self.open_target_folder).pack(side=tk.LEFT)
        

        
    def load_config_to_ui(self):
        """설정값을 UI에 로드"""
        self.download_folder_var.set(self.config["download_folder"])
        self.target_folder_var.set(self.config["target_folder"])
        self.file_pattern_var.set(self.config["file_pattern"])
        self.output_filename_var.set(self.config["output_filename"])
        self.backup_enabled_var.set(self.config["backup_old_files"])
        self.backup_folder_var.set(self.config["backup_folder"])
        self.interval_var.set(str(self.config["auto_run_interval"]))
        self.max_backup_var.set(str(self.config["max_backup_files"]))
        self.auto_run_enabled_var.set(self.config["auto_run_enabled"])
        
        # 파일 정리 옵션 로드
        self.cleanup_mode_var.set(self.config.get("cleanup_mode", "delete"))
        self.max_cleanup_backup_var.set(str(self.config.get("max_cleanup_backup_files", 5)))
        self.max_log_files_var.set(str(self.config.get("max_log_files", 10)))
        
        # 파일 이동 설정 로드
        self.move1_source_var.set(self.config.get("move1_source", ""))
        self.move1_target_var.set(self.config.get("move1_target", ""))
        self.move1_enabled_var.set(self.config.get("move1_enabled", False))
        self.move1_filename_var.set(self.config.get("move1_filename", ""))
        
        self.move2_source_var.set(self.config.get("move2_source", ""))
        self.move2_target_var.set(self.config.get("move2_target", ""))
        self.move2_enabled_var.set(self.config.get("move2_enabled", False))
        self.move2_filename_var.set(self.config.get("move2_filename", ""))
        
    def restore_auto_state(self):
        """자동 실행 상태 복원"""
        if self.config["auto_run_enabled"]:
            self.log_message("🔄 이전 자동 실행 상태를 복원합니다...")
            self.start_auto_timer()
        
    def toggle_auto_run(self):
        """자동 실행 토글"""
        if self.auto_run_enabled_var.get():
            self.start_auto_timer()
            self.log_message("✅ 자동 실행이 활성화되었습니다.")
        else:
            self.stop_auto_timer()
            self.log_message("⏹️ 자동 실행이 비활성화되었습니다.")
        
        # 설정 저장
        self.save_config()
        
    def start_auto_timer(self):
        """자동 실행 타이머 시작"""
        if self.is_auto_running:
            return
            
        self.is_auto_running = True
        self.countdown_seconds = int(self.interval_var.get())
        self.update_countdown()
        self.log_message(f"⏰ 자동 실행 타이머 시작 (간격: {self.countdown_seconds}초)")
        
    def stop_auto_timer(self):
        """자동 실행 타이머 중지"""
        self.is_auto_running = False
        self.countdown_seconds = 0
        self.countdown_label.config(text="다음 실행까지: --:--")
        if self.auto_timer:
            self.root.after_cancel(self.auto_timer)
            self.auto_timer = None
            
    def update_countdown(self):
        """카운트다운 업데이트"""
        if not self.is_auto_running:
            return
            
        if self.countdown_seconds <= 0:
            # 타이머 완료 - 파일 정리 실행
            self.log_message("⏰ 자동 실행 타이머 완료 - 파일 정리 시작")
            self.run_organizer()
            
            # 새로운 타이머 시작
            self.countdown_seconds = int(self.interval_var.get())
            self.update_countdown()
        else:
            # 카운트다운 표시
            minutes = self.countdown_seconds // 60
            seconds = self.countdown_seconds % 60
            self.countdown_label.config(text=f"다음 실행까지: {minutes:02d}:{seconds:02d}")
            
            # 1초 후 다시 업데이트
            self.countdown_seconds -= 1
            self.auto_timer = self.root.after(1000, self.update_countdown)
        
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
            
    # 파일 이동 관련 메서드들
    def browse_move1_source(self):
        """이동 설정 1 소스 폴더 선택"""
        folder = filedialog.askdirectory(title="이동 설정 1 - 소스 폴더 선택")
        if folder:
            self.move1_source_var.set(folder)
            
    def browse_move1_target(self):
        """이동 설정 1 대상 폴더 선택"""
        folder = filedialog.askdirectory(title="이동 설정 1 - 대상 폴더 선택")
        if folder:
            self.move1_target_var.set(folder)
            
    def browse_move2_source(self):
        """이동 설정 2 소스 폴더 선택"""
        folder = filedialog.askdirectory(title="이동 설정 2 - 소스 폴더 선택")
        if folder:
            self.move2_source_var.set(folder)
            
    def browse_move2_target(self):
        """이동 설정 2 대상 폴더 선택"""
        folder = filedialog.askdirectory(title="이동 설정 2 - 대상 폴더 선택")
        if folder:
            self.move2_target_var.set(folder)
            
    def execute_move1(self):
        """이동 설정 1 실행"""
        self.execute_file_move(1, self.move1_source_var.get(), self.move1_target_var.get(), self.move1_filename_var.get())
        
    def execute_move2(self):
        """이동 설정 2 실행"""
        self.execute_file_move(2, self.move2_source_var.get(), self.move2_target_var.get(), self.move2_filename_var.get())
    
    def execute_move1_to_organized(self):
        """이동 설정 1을 파일 정리 옵션으로 저장"""
        source_path = self.move1_source_var.get()
        target_path = self.target_folder_var.get()  # 메인 폴더의 대상 폴더 사용
        filename_pattern = self.move1_filename_var.get()
        
        if not source_path:
            messagebox.showerror("오류", "소스 폴더를 설정해주세요.")
            return
            
        def save_in_thread():
            self.save_files_to_organized_folder(source_path, target_path, filename_pattern)
            
        thread = threading.Thread(target=save_in_thread)
        thread.daemon = True
        thread.start()
    
    def execute_move2_to_organized(self):
        """이동 설정 2를 파일 정리 옵션으로 저장"""
        source_path = self.move2_source_var.get()
        target_path = self.target_folder_var.get()  # 메인 폴더의 대상 폴더 사용
        filename_pattern = self.move2_filename_var.get()
        
        if not source_path:
            messagebox.showerror("오류", "소스 폴더를 설정해주세요.")
            return
            
        def save_in_thread():
            self.save_files_to_organized_folder(source_path, target_path, filename_pattern)
            
        thread = threading.Thread(target=save_in_thread)
        thread.daemon = True
        thread.start()
        
    def execute_file_move(self, move_num, source_path, target_path, filename_pattern):
        """파일 이동 실행"""
        def move_in_thread():
            try:
                if not source_path or not target_path:
                    self.log_message(f"❌ 이동 설정 {move_num}: 소스 또는 대상 경로가 설정되지 않았습니다.")
                    return
                    
                source_dir = Path(source_path)
                target_dir = Path(target_path)
                
                if not source_dir.exists():
                    self.log_message(f"❌ 이동 설정 {move_num}: 소스 폴더가 존재하지 않습니다: {source_path}")
                    return
                    
                if not target_dir.exists():
                    self.log_message(f"📁 이동 설정 {move_num}: 대상 폴더를 생성합니다: {target_path}")
                    target_dir.mkdir(parents=True, exist_ok=True)
                    
                self.log_message(f"🔄 이동 설정 {move_num}: 파일 복사를 시작합니다... (이동 설정의 패턴 파일명 그대로 복사)")
                self.log_message(f"  소스: {source_path}")
                self.log_message(f"  대상: {target_path}")
                if filename_pattern:
                    self.log_message(f"  파일명 패턴: '{filename_pattern}' (이동 설정 {move_num}에서 설정된 패턴)")
                else:
                    self.log_message(f"  파일명: 원본 파일명 그대로 사용 (이동 설정 {move_num}에 패턴 미설정)")
                
                # 이동 설정용 덮어쓰기 모드 (백업 없음)
                self.log_message(f"  이동 설정 정리 모드: 덮어쓰기 (백업 없음)")
                
                # 해당 이동 설정에 맞는 파일만 처리
                moved_count = 0
                
                # 파일명 패턴이 있는 경우: 해당 패턴에 맞는 파일만 처리
                if filename_pattern:
                    # 패턴에서 확장자 추출
                    if '.' in filename_pattern:
                        pattern_ext = filename_pattern.split('.')[-1]
                        if pattern_ext != filename_pattern:  # 확장자가 있는 경우
                            pattern_ext = '.' + pattern_ext
                        else:
                            pattern_ext = ''
                    else:
                        pattern_ext = ''
                    
                    # 소스 폴더에서 해당 패턴에 맞는 파일 찾기
                    matching_files = list(source_dir.glob(f"*{pattern_ext}"))
                    
                    if matching_files:
                        # 가장 최신 파일 선택
                        latest_file = max(matching_files, key=lambda x: x.stat().st_mtime)
                        
                        # 파일명 패턴 처리
                        new_filename = self.generate_filename_from_pattern(latest_file, filename_pattern)
                        target_file = target_dir / new_filename
                        
                        # 기존 파일 처리 (이동 설정용 덮어쓰기 모드 - 백업 없음)
                        if target_file.exists():
                            self.log_message(f"  ⚠️ 기존 파일 덮어쓰기: {target_file.name} (백업 없음)")
                        
                        try:
                            # 이동 설정에서는 복사로 변경 (원본 파일 유지)
                            shutil.copy2(str(latest_file), str(target_file))
                            moved_count += 1
                            self.log_message(f"  ✅ 복사 완료: {latest_file.name} → {target_file.name}")
                        except Exception as e:
                            self.log_message(f"  ❌ 복사 실패: {latest_file.name} - {e}")
                    else:
                        self.log_message(f"  ⚠️ 패턴에 맞는 파일을 찾을 수 없습니다: {filename_pattern}")
                
                # 파일명 패턴이 없는 경우: 가장 최신 파일만 처리
                else:
                    # 소스 폴더의 모든 파일 중 가장 최신 파일 선택
                    all_files = [f for f in source_dir.iterdir() if f.is_file()]
                    if all_files:
                        latest_file = max(all_files, key=lambda x: x.stat().st_mtime)
                        target_file = target_dir / latest_file.name
                        
                        # 기존 파일 처리 (이동 설정용 덮어쓰기 모드 - 백업 없음)
                        if target_file.exists():
                            self.log_message(f"  ⚠️ 기존 파일 덮어쓰기: {target_file.name} (백업 없음)")
                        
                        try:
                            # 이동 설정에서는 복사로 변경 (원본 파일 유지)
                            shutil.copy2(str(latest_file), str(target_file))
                            moved_count += 1
                            self.log_message(f"  ✅ 복사 완료: {latest_file.name}")
                        except Exception as e:
                            self.log_message(f"  ❌ 복사 실패: {latest_file.name} - {e}")
                    else:
                        self.log_message(f"  ⚠️ 소스 폴더에 파일이 없습니다: {source_path}")
                            
                self.log_message(f"✅ 이동 설정 {move_num} 완료: {moved_count}개 파일 복사됨 (이동 설정의 패턴 파일명 그대로 복사)")
                
            except Exception as e:
                self.log_message(f"❌ 이동 설정 {move_num} 실행 중 오류: {e}")
                
        thread = threading.Thread(target=move_in_thread)
        thread.daemon = True
        thread.start()
        
    def execute_file_move_sync(self, move_num, source_path, target_path, filename_pattern):
        """파일 이동 실행 (동기 버전 - 순차 실행용)"""
        try:
            if not source_path or not target_path:
                return
                
            source_dir = Path(source_path)
            target_dir = Path(target_path)
            
            if not source_dir.exists():
                return
                
            if not target_dir.exists():
                target_dir.mkdir(parents=True, exist_ok=True)
            
            # 해당 이동 설정에 맞는 파일만 처리
            moved_count = 0
            
            # 파일명 패턴이 있는 경우: 해당 패턴에 맞는 파일만 처리
            if filename_pattern:
                # 소스 폴더에서 정확히 일치하는 파일 찾기
                target_file_path = source_dir / filename_pattern
                matching_files = []
                
                if target_file_path.exists() and target_file_path.is_file():
                    matching_files = [target_file_path]
                
                if matching_files:
                    # 정확히 일치하는 파일 선택 (하나만 있을 것)
                    selected_file = matching_files[0]
                    
                    # 파일명 패턴 처리 (원본 파일명 유지)
                    target_file = target_dir / selected_file.name
                    
                    try:
                        # 이동 설정에서는 복사로 변경 (원본 파일 유지)
                        shutil.copy2(str(selected_file), str(target_file))
                        moved_count += 1
                            
                    except Exception as e:
                        pass
                # 소스 폴더의 모든 파일 중 가장 최신 파일 선택
                all_files = [f for f in source_dir.iterdir() if f.is_file()]
                self.log_message(f"   📊 소스 폴더 파일 수: {len(all_files)}개")
                
                if all_files:
                    latest_file = max(all_files, key=lambda x: x.stat().st_mtime)
                    self.log_message(f"   🎯 최신 파일 선택: {latest_file.name}")
                    
                    target_file = target_dir / latest_file.name
                    
                    # 기존 파일 처리 (이동 설정용 덮어쓰기 모드 - 백업 없음)
                    if target_file.exists():
                        existing_time = datetime.fromtimestamp(target_file.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')
                        self.log_message(f"   ⚠️ 기존 파일 발견: {target_file.name} (수정시간: {existing_time})")
                        self.log_message(f"   ⚠️ 기존 파일 덮어쓰기: {target_file.name} (백업 없음)")
                    else:
                        self.log_message(f"   ✅ 새 파일로 저장: {target_file.name}")
                    
                    try:
                        # 이동 설정에서는 복사로 변경 (원본 파일 유지)
                        shutil.copy2(str(latest_file), str(target_file))
                        moved_count += 1
                            
                    except Exception as e:
                        pass
                        
        except Exception as e:
            pass
    
    def handle_existing_file(self, target_file, cleanup_mode, max_backup_files):
        """기존 파일 처리 (정리 모드에 따라)"""
        try:
            if cleanup_mode == "backup":
                # 백업 모드: 타임스탬프로 백업
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                backup_path = target_file.with_suffix(f'.backup_{timestamp}')
                target_file.rename(backup_path)
                
                # 오래된 백업 파일 정리
                self.cleanup_old_backups(target_file, max_backup_files)
                
            elif cleanup_mode == "delete":
                # 삭제 모드: 기존 파일 삭제
                target_file.unlink()
                
            elif cleanup_mode == "keep":
                # 유지 모드: 기존 파일 덮어쓰기
                pass
                
            elif cleanup_mode == "rename":
                # 이름 변경 모드: 기존 파일 이름 변경
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                rename_path = target_file.with_suffix(f'.old_{timestamp}')
                target_file.rename(rename_path)
                
        except Exception as e:
            pass
    

    
    def cleanup_old_backups(self, original_file, max_backup_files):
        """오래된 백업 파일 정리"""
        try:
            backup_dir = original_file.parent
            backup_pattern = f"{original_file.stem}.backup_*{original_file.suffix}"
            backup_files = list(backup_dir.glob(backup_pattern))
            
            if len(backup_files) > max_backup_files:
                # 수정 시간 기준으로 정렬 (오래된 것부터)
                backup_files.sort(key=lambda x: x.stat().st_mtime)
                
                # 초과분 삭제
                files_to_delete = backup_files[:-max_backup_files]
                for backup_file in files_to_delete:
                    backup_file.unlink()
                    
        except Exception as e:
            pass
    
    def cleanup_old_log_files(self, max_log_files):
        """오래된 로그 파일 정리"""
        try:
            log_dir = Path("logs")
            if not log_dir.exists():
                return
                
            # 로그 파일 패턴 (txt 파일)
            log_files = list(log_dir.glob("*.txt"))
            
            if len(log_files) > max_log_files:
                # 수정 시간 기준으로 정렬 (오래된 것부터)
                log_files.sort(key=lambda x: x.stat().st_mtime)
                
                # 초과분 삭제
                files_to_delete = log_files[:-max_log_files]
                for log_file in files_to_delete:
                    log_file.unlink()
                    self.log_message(f"  🗑️ 오래된 로그 파일 삭제: {log_file.name}")
                    
        except Exception as e:
            self.log_message(f"  ⚠️ 로그 파일 정리 중 오류: {e}")
    
    def generate_filename_from_pattern(self, file_path, pattern):
        """파일명 패턴에서 실제 파일명 생성"""
        try:
            # 현재 날짜/시간 정보
            now = datetime.now()
            date_str = now.strftime("%Y%m%d")
            time_str = now.strftime("%H%M%S")
            datetime_str = now.strftime("%Y%m%d_%H%M%S")
            
            # 파일 정보
            original_name = file_path.stem  # 확장자 제외
            extension = file_path.suffix    # 확장자만
            full_name = file_path.name      # 전체 파일명
            
            # 패턴 치환
            new_filename = pattern
            new_filename = new_filename.replace("{name}", original_name)
            new_filename = new_filename.replace("{ext}", extension)
            new_filename = new_filename.replace("{fullname}", full_name)
            new_filename = new_filename.replace("{date}", date_str)
            new_filename = new_filename.replace("{time}", time_str)
            new_filename = new_filename.replace("{datetime}", datetime_str)
            new_filename = new_filename.replace("{year}", str(now.year))
            new_filename = new_filename.replace("{month}", f"{now.month:02d}")
            new_filename = new_filename.replace("{day}", f"{now.day:02d}")
            new_filename = new_filename.replace("{hour}", f"{now.hour:02d}")
            new_filename = new_filename.replace("{minute}", f"{now.minute:02d}")
            new_filename = new_filename.replace("{second}", f"{now.second:02d}")
            
            # 확장자가 패턴에 포함되지 않은 경우 추가
            if not new_filename.endswith(extension) and not new_filename.endswith(extension.lower()):
                new_filename += extension
                
            return new_filename
            
        except Exception as e:
            self.log_message(f"⚠️ 파일명 패턴 처리 중 오류: {e}")
            return file_path.name  # 오류 시 원본 파일명 사용
    
    def save_files_to_organized_folder(self, source_dir, target_dir, filename_pattern):
        """소스 폴더의 파일들을 대상 폴더에 파일명 패턴으로 저장"""
        try:
            source_path = Path(source_dir)
            target_path = Path(target_dir)
            
            if not source_path.exists():
                self.log_message(f"❌ 소스 폴더가 존재하지 않습니다: {source_dir}")
                return False
                
            if not target_path.exists():
                self.log_message(f"📁 대상 폴더를 생성합니다: {target_dir}")
                target_path.mkdir(parents=True, exist_ok=True)
            
            self.log_message(f"🔄 파일 정리 옵션으로 저장 시작...")
            self.log_message(f"  소스: {source_dir}")
            self.log_message(f"  대상: {target_dir}")
            self.log_message(f"  파일명 패턴: {filename_pattern}")
            
            # 메인 폴더의 정리 모드 가져오기
            cleanup_mode = self.cleanup_mode_var.get()
            max_backup_files = int(self.max_cleanup_backup_var.get())
            self.log_message(f"  정리 모드: {cleanup_mode}")
            
            saved_count = 0
            for file_path in source_path.iterdir():
                if file_path.is_file():
                    # 파일명 패턴 처리
                    if filename_pattern:
                        new_filename = self.generate_filename_from_pattern(file_path, filename_pattern)
                        target_file = target_path / new_filename
                    else:
                        target_file = target_path / file_path.name
                    
                    # 기존 파일 처리 (메인 폴더 정리 모드 사용)
                    if target_file.exists():
                        self.handle_existing_file(target_file, cleanup_mode, max_backup_files)
                    
                    try:
                        # 파일 복사
                        shutil.copy2(str(file_path), str(target_file))
                        saved_count += 1
                    except Exception as e:
                        pass
            
            return True
            
        except Exception as e:
            return False
        

        
    def run_organizer(self):
        """파일 정리 실행"""
        def run_in_thread():
            try:
                self.log_message("�� 파일 정리를 시작합니다...")
                self.log_message(f"   📅 실행 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                
                # 설정 저장
                self.save_config()
                
                # 파일 정리 스크립트 실행
                
                # file_organizer.py 파일 존재 확인
                script_path = Path("file_organizer.py")
                if not script_path.exists():
                    return
                
                # 시스템 인코딩 사용
                try:
                    result = subprocess.run([sys.executable, str(script_path)], 
                                          capture_output=True, text=True, 
                                          encoding=self.system_encoding, 
                                          errors='replace',
                                          cwd=Path.cwd())  # 명시적으로 작업 디렉토리 설정
                except Exception as subprocess_error:
                    # 인코딩 오류 시 utf-8로 재시도
                    try:
                        result = subprocess.run([sys.executable, str(script_path)], 
                                              capture_output=True, text=True, 
                                              encoding='utf-8', 
                                              errors='replace',
                                              cwd=Path.cwd())
                    except Exception as retry_error:
                        return
                
                # 활성화된 파일 이동 작업 실행
                self.execute_enabled_moves()
                
                # 로그 파일 정리
                max_log_files = int(self.max_log_files_var.get())
                self.cleanup_old_log_files(max_log_files)
                                
            except Exception as e:
                pass
                
        thread = threading.Thread(target=run_in_thread)
        thread.daemon = True
        thread.start()
        
    def execute_enabled_moves(self):
        """활성화된 파일 이동 작업 순차 실행"""
        def execute_moves_sequentially():
            # 활성화된 이동 설정 확인
            enabled_moves = []
            if self.move1_enabled_var.get() and self.move1_source_var.get() and self.move1_target_var.get():
                enabled_moves.append(1)
            if self.move2_enabled_var.get() and self.move2_source_var.get() and self.move2_target_var.get():
                enabled_moves.append(2)
            
            if not enabled_moves:
                return
            
            # 이동 설정 1
            if 1 in enabled_moves:
                start_time = datetime.now()
                self.execute_file_move_sync(1, self.move1_source_var.get(), self.move1_target_var.get(), self.move1_filename_var.get())
                end_time = datetime.now()
                duration = (end_time - start_time).total_seconds()
            
            # 이동 설정 2
            if 2 in enabled_moves:
                start_time = datetime.now()
                self.execute_file_move_sync(2, self.move2_source_var.get(), self.move2_target_var.get(), self.move2_filename_var.get())
                end_time = datetime.now()
                duration = (end_time - start_time).total_seconds()
        
        thread = threading.Thread(target=execute_moves_sequentially)
        thread.daemon = True
        thread.start()
        
    def check_status(self):
        """상태 확인"""
        def check_in_thread():
            try:
                # file_organizer.py 파일 존재 확인
                script_path = Path("file_organizer.py")
                if not script_path.exists():
                    return
                
                try:
                    result = subprocess.run([sys.executable, str(script_path), "--status"], 
                                          capture_output=True, text=True, 
                                          encoding=self.system_encoding, 
                                          errors='replace',
                                          cwd=Path.cwd())
                except Exception as subprocess_error:
                    # 인코딩 오류 시 utf-8로 재시도
                    try:
                        result = subprocess.run([sys.executable, str(script_path), "--status"], 
                                              capture_output=True, text=True, 
                                              encoding='utf-8', 
                                              errors='replace',
                                              cwd=Path.cwd())
                    except Exception as retry_error:
                        return
                            
            except Exception as e:
                pass
                
        thread = threading.Thread(target=check_in_thread)
        thread.daemon = True
        thread.start()
        
    def open_log_folder(self):
        """로그 폴더 열기"""
        log_dir = Path("logs")
        if log_dir.exists():
            if os.name == 'nt':  # Windows
                os.startfile(log_dir)
            else:  # Linux/Mac
                subprocess.run(["xdg-open", str(log_dir)])
            
    def open_target_folder(self):
        """대상 폴더 열기"""
        target_dir = Path(self.target_folder_var.get())
        if target_dir.exists():
            if os.name == 'nt':  # Windows
                os.startfile(target_dir)
            else:  # Linux/Mac
                subprocess.run(["xdg-open", str(target_dir)])



def main():
    try:
        root = tk.Tk()
        app = FileOrganizerGUI(root)
        root.mainloop()
    except Exception as e:
        pass  # 프로그램 실행 오류 무시

if __name__ == "__main__":
    main() 