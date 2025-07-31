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
import queue
import time
import shutil

class FileOrganizerGUI:
    def __init__(self, root):
        self.root = root
        self.root.title("Sora Auto Save 파일 정리 프로그램")
        self.root.geometry("1400x800")
        self.root.resizable(True, True)
        
        # 창 크기 변경 이벤트 바인딩
        self.root.bind('<Configure>', self.on_window_resize)
        
        # 설정 파일 경로
        self.config_file = "file_organizer_config.json"
        self.config = self.load_config()
        
        # 로그 메시지 큐
        self.log_queue = queue.Queue()
        
        # 자동 실행 관련 변수
        self.auto_timer = None
        self.is_auto_running = False
        self.countdown_seconds = 0
        
        # UI 초기화
        self.setup_ui()
        self.load_config_to_ui()
        
        # 로그 업데이트 타이머
        self.update_log()
        
        # 자동 실행 상태 복원
        self.restore_auto_state()
        
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
            
    def setup_ui(self):
        """UI 구성"""
        # 메인 프레임
        main_frame = ttk.Frame(self.root, padding="10")
        main_frame.grid(row=0, column=0, columnspan=2, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # 그리드 가중치 설정 - 2열 레이아웃 (60:40 비율)
        self.root.columnconfigure(0, weight=10)  # 왼쪽 설정 영역 (60%)
        self.root.columnconfigure(1, weight=1)  # 오른쪽 로그 영역 (40%)
        self.root.rowconfigure(0, weight=1)
        main_frame.columnconfigure(1, weight=1)
        
        # 제목
        title_label = ttk.Label(main_frame, text="🎨 Sora Auto Save 파일 정리 프로그램", 
                               font=("Arial", 16, "bold"))
        title_label.grid(row=0, column=0, columnspan=3, pady=(0, 20))
        
        # 자동 실행 프레임
        auto_frame = ttk.LabelFrame(main_frame, text="자동 실행 설정", padding="10")
        auto_frame.grid(row=1, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        auto_frame.columnconfigure(1, weight=1)
        
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
        settings_frame = ttk.LabelFrame(main_frame, text="메인 설정", padding="10")
        settings_frame.grid(row=2, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        settings_frame.columnconfigure(1, weight=1)
        
        # 다운로드 폴더
        ttk.Label(settings_frame, text="다운로드 폴더:").grid(row=0, column=0, sticky=tk.W, pady=2)
        self.download_folder_var = tk.StringVar()
        download_entry = ttk.Entry(settings_frame, textvariable=self.download_folder_var)
        download_entry.grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(5, 5), pady=2)
        ttk.Button(settings_frame, text="찾아보기", command=self.browse_download_folder).grid(row=0, column=2, pady=2)
        
        # 대상 폴더
        ttk.Label(settings_frame, text="대상 폴더:").grid(row=1, column=0, sticky=tk.W, pady=2)
        self.target_folder_var = tk.StringVar()
        target_entry = ttk.Entry(settings_frame, textvariable=self.target_folder_var)
        target_entry.grid(row=1, column=1, sticky=(tk.W, tk.E), padx=(5, 5), pady=2)
        ttk.Button(settings_frame, text="찾아보기", command=self.browse_target_folder).grid(row=1, column=2, pady=2)
        
        # 파일 패턴
        ttk.Label(settings_frame, text="파일 패턴:").grid(row=2, column=0, sticky=tk.W, pady=2)
        self.file_pattern_var = tk.StringVar()
        pattern_entry = ttk.Entry(settings_frame, textvariable=self.file_pattern_var)
        pattern_entry.grid(row=2, column=1, sticky=(tk.W, tk.E), padx=(5, 5), pady=2)
        
        # 출력 파일명
        ttk.Label(settings_frame, text="출력 파일명:").grid(row=3, column=0, sticky=tk.W, pady=2)
        self.output_filename_var = tk.StringVar()
        output_entry = ttk.Entry(settings_frame, textvariable=self.output_filename_var)
        output_entry.grid(row=3, column=1, sticky=(tk.W, tk.E), padx=(5, 5), pady=2)
        
        # 백업 설정
        self.backup_enabled_var = tk.BooleanVar()
        backup_check = ttk.Checkbutton(settings_frame, text="기존 파일 백업", variable=self.backup_enabled_var)
        backup_check.grid(row=4, column=0, sticky=tk.W, pady=2)
        
        ttk.Label(settings_frame, text="백업 폴더:").grid(row=4, column=1, sticky=tk.W, padx=(20, 5), pady=2)
        self.backup_folder_var = tk.StringVar()
        backup_entry = ttk.Entry(settings_frame, textvariable=self.backup_folder_var)
        backup_entry.grid(row=4, column=1, sticky=(tk.W, tk.E), padx=(100, 5), pady=2)
        ttk.Button(settings_frame, text="찾아보기", command=self.browse_backup_folder).grid(row=4, column=2, pady=2)
        
        # 최대 백업 파일 수
        ttk.Label(settings_frame, text="최대 백업 파일 수:").grid(row=5, column=0, sticky=tk.W, pady=2)
        self.max_backup_var = tk.StringVar(value="10")
        max_backup_entry = ttk.Entry(settings_frame, textvariable=self.max_backup_var, width=10)
        max_backup_entry.grid(row=5, column=1, sticky=tk.W, padx=(5, 5), pady=2)
        
        # 파일 정리 옵션 프레임
        cleanup_frame = ttk.LabelFrame(main_frame, text="파일 정리 옵션", padding="10")
        cleanup_frame.grid(row=3, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        cleanup_frame.columnconfigure(1, weight=1)
        
        # 정리 모드 선택
        ttk.Label(cleanup_frame, text="정리 모드:").grid(row=0, column=0, sticky=tk.W, pady=2)
        self.cleanup_mode_var = tk.StringVar(value="delete")
        cleanup_combo = ttk.Combobox(cleanup_frame, textvariable=self.cleanup_mode_var, 
                                    values=["delete", "backup", "keep", "rename"], state="readonly")
        cleanup_combo.grid(row=0, column=1, sticky=tk.W, padx=(5, 5), pady=2)
        cleanup_combo.set("delete")
        
        # 정리 모드 설명
        cleanup_desc = ttk.Label(cleanup_frame, text="delete: 완전 삭제 | backup: 백업 후 삭제 | keep: 유지 | rename: 이름 변경")
        cleanup_desc.grid(row=0, column=2, sticky=tk.W, padx=(10, 0), pady=2)
        
        # 최대 정리 백업 파일 수
        ttk.Label(cleanup_frame, text="최대 정리 백업 파일 수:").grid(row=1, column=0, sticky=tk.W, pady=2)
        self.max_cleanup_backup_var = tk.StringVar(value="5")
        max_cleanup_entry = ttk.Entry(cleanup_frame, textvariable=self.max_cleanup_backup_var, width=10)
        max_cleanup_entry.grid(row=1, column=1, sticky=tk.W, padx=(5, 5), pady=2)
        
        ttk.Label(cleanup_frame, text="최대 로그 파일 수:").grid(row=2, column=0, sticky=tk.W, pady=2)
        self.max_log_files_var = tk.StringVar(value="10")
        max_log_entry = ttk.Entry(cleanup_frame, textvariable=self.max_log_files_var, width=10)
        max_log_entry.grid(row=2, column=1, sticky=tk.W, padx=(5, 5), pady=2)
        
        # 파일 이동 설정 프레임
        move_frame = ttk.LabelFrame(main_frame, text="파일 이동/덮어쓰기 설정", padding="10")
        move_frame.grid(row=4, column=0, columnspan=3, sticky=(tk.W, tk.E), pady=(0, 10))
        move_frame.columnconfigure(0, weight=1)
        move_frame.columnconfigure(1, weight=1)
        
        # 이동 설정 1 (왼쪽)
        move1_frame = ttk.LabelFrame(move_frame, text="이동 설정 1", padding="5")
        move1_frame.grid(row=0, column=0, sticky=(tk.W, tk.E), padx=(0, 5), pady=(0, 10))
        move1_frame.columnconfigure(1, weight=1)
        
        ttk.Label(move1_frame, text="소스 폴더:").grid(row=0, column=0, sticky=tk.W, pady=2)
        self.move1_source_var = tk.StringVar()
        move1_source_entry = ttk.Entry(move1_frame, textvariable=self.move1_source_var)
        move1_source_entry.grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(5, 5), pady=2)
        ttk.Button(move1_frame, text="찾아보기", command=self.browse_move1_source).grid(row=0, column=2, pady=2)
        
        ttk.Label(move1_frame, text="대상 폴더:").grid(row=1, column=0, sticky=tk.W, pady=2)
        self.move1_target_var = tk.StringVar()
        move1_target_entry = ttk.Entry(move1_frame, textvariable=self.move1_target_var)
        move1_target_entry.grid(row=1, column=1, sticky=(tk.W, tk.E), padx=(5, 5), pady=2)
        ttk.Button(move1_frame, text="찾아보기", command=self.browse_move1_target).grid(row=1, column=2, pady=2)
        
        ttk.Label(move1_frame, text="파일명 패턴:").grid(row=2, column=0, sticky=tk.W, pady=2)
        self.move1_filename_var = tk.StringVar()
        move1_filename_entry = ttk.Entry(move1_frame, textvariable=self.move1_filename_var)
        move1_filename_entry.grid(row=2, column=1, sticky=(tk.W, tk.E), padx=(5, 5), pady=2)
        
        self.move1_enabled_var = tk.BooleanVar()
        move1_check = ttk.Checkbutton(move1_frame, text="활성화", variable=self.move1_enabled_var)
        move1_check.grid(row=3, column=0, sticky=tk.W, pady=2)
        
        ttk.Button(move1_frame, text="즉시 실행", command=self.execute_move1).grid(row=3, column=1, sticky=tk.W, padx=(5, 5), pady=2)
        ttk.Button(move1_frame, text="파일 정리 옵션으로 저장", command=self.execute_move1_to_organized).grid(row=3, column=2, sticky=tk.W, pady=2)
        
        # 이동 설정 2 (오른쪽)
        move2_frame = ttk.LabelFrame(move_frame, text="이동 설정 2", padding="5")
        move2_frame.grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(5, 0), pady=(0, 10))
        move2_frame.columnconfigure(1, weight=1)
        
        ttk.Label(move2_frame, text="소스 폴더:").grid(row=0, column=0, sticky=tk.W, pady=2)
        self.move2_source_var = tk.StringVar()
        move2_source_entry = ttk.Entry(move2_frame, textvariable=self.move2_source_var)
        move2_source_entry.grid(row=0, column=1, sticky=(tk.W, tk.E), padx=(5, 5), pady=2)
        ttk.Button(move2_frame, text="찾아보기", command=self.browse_move2_source).grid(row=0, column=2, pady=2)
        
        ttk.Label(move2_frame, text="대상 폴더:").grid(row=1, column=0, sticky=tk.W, pady=2)
        self.move2_target_var = tk.StringVar()
        move2_target_entry = ttk.Entry(move2_frame, textvariable=self.move2_target_var)
        move2_target_entry.grid(row=1, column=1, sticky=(tk.W, tk.E), padx=(5, 5), pady=2)
        ttk.Button(move2_frame, text="찾아보기", command=self.browse_move2_target).grid(row=1, column=2, pady=2)
        
        ttk.Label(move2_frame, text="파일명 패턴:").grid(row=2, column=0, sticky=tk.W, pady=2)
        self.move2_filename_var = tk.StringVar()
        move2_filename_entry = ttk.Entry(move2_frame, textvariable=self.move2_filename_var)
        move2_filename_entry.grid(row=2, column=1, sticky=(tk.W, tk.E), padx=(5, 5), pady=2)
        
        self.move2_enabled_var = tk.BooleanVar()
        move2_check = ttk.Checkbutton(move2_frame, text="활성화", variable=self.move2_enabled_var)
        move2_check.grid(row=3, column=0, sticky=tk.W, pady=2)
        
        ttk.Button(move2_frame, text="즉시 실행", command=self.execute_move2).grid(row=3, column=1, sticky=tk.W, padx=(5, 5), pady=2)
        ttk.Button(move2_frame, text="파일 정리 옵션으로 저장", command=self.execute_move2_to_organized).grid(row=3, column=2, sticky=tk.W, pady=2)
        
        # 버튼 프레임 (좌측 정렬, 반응형)
        button_frame = ttk.Frame(main_frame)
        button_frame.grid(row=5, column=0, columnspan=1, pady=(0, 10), sticky=tk.W)
        
        ttk.Button(button_frame, text="설정 저장", command=self.save_config).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(button_frame, text="수동 실행", command=self.run_organizer).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(button_frame, text="상태 확인", command=self.check_status).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(button_frame, text="로그 폴더 열기", command=self.open_log_folder).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(button_frame, text="대상 폴더 열기", command=self.open_target_folder).pack(side=tk.LEFT)
        
        # 로그 프레임 (오른쪽 열)
        log_frame = ttk.LabelFrame(self.root, text="실행 로그", padding="10")
        log_frame.grid(row=0, column=1, sticky=(tk.W, tk.E, tk.N, tk.S), padx=(10, 10))
        log_frame.columnconfigure(0, weight=1)
        log_frame.rowconfigure(0, weight=1)
        
        # 로그 텍스트 영역 (반응형)
        self.log_text = scrolledtext.ScrolledText(log_frame, height=15)
        self.log_text.grid(row=0, column=0, sticky=(tk.W, tk.E, tk.N, tk.S))
        
        # 초기 로그 메시지
        self.log_message("🚀 자동 실행 타이머 GUI가 시작되었습니다.")
        self.log_message("자동 실행을 활성화하면 설정된 간격으로 자동으로 파일 정리가 실행됩니다.")
        
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
            self.log_message(f"🔍 이동 설정 {move_num} 검증 시작...")
            
            if not source_path or not target_path:
                self.log_message(f"❌ 이동 설정 {move_num}: 소스 또는 대상 경로가 설정되지 않았습니다.")
                self.log_message(f"   소스 경로: {source_path}")
                self.log_message(f"   대상 경로: {target_path}")
                return
                
            source_dir = Path(source_path)
            target_dir = Path(target_path)
            
            self.log_message(f"📂 소스 폴더 확인: {source_path}")
            if not source_dir.exists():
                self.log_message(f"❌ 이동 설정 {move_num}: 소스 폴더가 존재하지 않습니다: {source_path}")
                return
            else:
                self.log_message(f"✅ 소스 폴더 존재 확인: {source_path}")
                
            self.log_message(f"📂 대상 폴더 확인: {target_path}")
            if not target_dir.exists():
                self.log_message(f"📁 이동 설정 {move_num}: 대상 폴더를 생성합니다: {target_path}")
                target_dir.mkdir(parents=True, exist_ok=True)
                self.log_message(f"✅ 대상 폴더 생성 완료: {target_path}")
            else:
                self.log_message(f"✅ 대상 폴더 존재 확인: {target_path}")
                
            self.log_message(f"🔄 이동 설정 {move_num}: 파일 복사를 시작합니다...")
            self.log_message(f"   📍 소스 경로: {source_path}")
            self.log_message(f"   📍 대상 경로: {target_path}")
            if filename_pattern:
                self.log_message(f"   📝 파일명 패턴: '{filename_pattern}' (이동 설정 {move_num}에서 설정된 패턴)")
            else:
                self.log_message(f"   📝 파일명: 원본 파일명 그대로 사용 (이동 설정 {move_num}에 패턴 미설정)")
            
            # 이동 설정용 덮어쓰기 모드 (백업 없음)
            self.log_message(f"   ⚙️ 정리 모드: 덮어쓰기 (백업 없음)")
            
            # 해당 이동 설정에 맞는 파일만 처리
            moved_count = 0
            
            # 파일명 패턴이 있는 경우: 해당 패턴에 맞는 파일만 처리
            if filename_pattern:
                self.log_message(f"🔍 정확한 파일명 매칭 검색 시작...")
                self.log_message(f"   🔍 검색할 정확한 파일명: '{filename_pattern}'")
                
                # 소스 폴더에서 정확히 일치하는 파일 찾기
                target_file_path = source_dir / filename_pattern
                matching_files = []
                
                if target_file_path.exists() and target_file_path.is_file():
                    matching_files = [target_file_path]
                    self.log_message(f"   ✅ 정확한 파일명 발견: {filename_pattern}")
                else:
                    self.log_message(f"   ❌ 정확한 파일명을 찾을 수 없습니다: {filename_pattern}")
                    self.log_message(f"   🔍 소스 폴더 내용:")
                    try:
                        for file in source_dir.iterdir():
                            if file.is_file():
                                file_time = datetime.fromtimestamp(file.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')
                                self.log_message(f"      📄 {file.name} (수정시간: {file_time})")
                    except Exception as e:
                        self.log_message(f"      ❌ 폴더 내용 읽기 실패: {e}")
                
                if matching_files:
                    # 파일 목록 출력
                    for i, file in enumerate(matching_files, 1):
                        file_time = datetime.fromtimestamp(file.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')
                        self.log_message(f"   📄 {i}. {file.name} (수정시간: {file_time})")
                    
                    # 정확히 일치하는 파일 선택 (하나만 있을 것)
                    selected_file = matching_files[0]
                    selected_time = datetime.fromtimestamp(selected_file.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')
                    self.log_message(f"   🎯 선택된 파일: {selected_file.name} (수정시간: {selected_time})")
                    
                    # 파일명 패턴 처리 (원본 파일명 유지)
                    target_file = target_dir / selected_file.name
                    self.log_message(f"   📝 대상 파일명: {selected_file.name} (원본 파일명 유지)")
                    
                    # 기존 파일 처리 (이동 설정용 덮어쓰기 모드 - 백업 없음)
                    if target_file.exists():
                        existing_time = datetime.fromtimestamp(target_file.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')
                        self.log_message(f"   ⚠️ 기존 파일 발견: {target_file.name} (수정시간: {existing_time})")
                        self.log_message(f"   ⚠️ 기존 파일 덮어쓰기: {target_file.name} (백업 없음)")
                    else:
                        self.log_message(f"   ✅ 새 파일로 저장: {target_file.name}")
                    
                    try:
                        # 이동 설정에서는 복사로 변경 (원본 파일 유지)
                        self.log_message(f"   📋 파일 복사 시작...")
                        shutil.copy2(str(selected_file), str(target_file))
                        moved_count += 1
                        self.log_message(f"   ✅ 복사 완료: {selected_file.name} → {target_file.name}")
                        
                        # 복사된 파일 정보 확인
                        copied_file = Path(target_file)
                        if copied_file.exists():
                            copied_size = copied_file.stat().st_size
                            copied_time = datetime.fromtimestamp(copied_file.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')
                            self.log_message(f"   📊 복사된 파일 정보:")
                            self.log_message(f"      📁 경로: {copied_file}")
                            self.log_message(f"      📏 크기: {copied_size:,} bytes")
                            self.log_message(f"      🕒 수정시간: {copied_time}")
                        else:
                            self.log_message(f"   ❌ 복사된 파일이 존재하지 않습니다!")
                            
                    except Exception as e:
                        self.log_message(f"   ❌ 복사 실패: {selected_file.name}")
                        self.log_message(f"   🔍 오류 상세: {e}")
                else:
                    self.log_message(f"   ⚠️ 정확한 파일명을 찾을 수 없습니다: {filename_pattern}")
            
            # 파일명 패턴이 없는 경우: 가장 최신 파일만 처리
            else:
                self.log_message(f"🔍 전체 파일 검색 시작...")
                # 소스 폴더의 모든 파일 중 가장 최신 파일 선택
                all_files = [f for f in source_dir.iterdir() if f.is_file()]
                self.log_message(f"   📊 소스 폴더 파일 수: {len(all_files)}개")
                
                if all_files:
                    # 파일 목록 출력
                    for i, file in enumerate(all_files, 1):
                        file_time = datetime.fromtimestamp(file.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')
                        self.log_message(f"   📄 {i}. {file.name} (수정시간: {file_time})")
                    
                    latest_file = max(all_files, key=lambda x: x.stat().st_mtime)
                    latest_time = datetime.fromtimestamp(latest_file.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')
                    self.log_message(f"   🎯 최신 파일 선택: {latest_file.name} (수정시간: {latest_time})")
                    
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
                        self.log_message(f"   📋 파일 복사 시작...")
                        shutil.copy2(str(latest_file), str(target_file))
                        moved_count += 1
                        self.log_message(f"   ✅ 복사 완료: {latest_file.name}")
                        
                        # 복사된 파일 정보 확인
                        copied_file = Path(target_file)
                        if copied_file.exists():
                            copied_size = copied_file.stat().st_size
                            copied_time = datetime.fromtimestamp(copied_file.stat().st_mtime).strftime('%Y-%m-%d %H:%M:%S')
                            self.log_message(f"   📊 복사된 파일 정보:")
                            self.log_message(f"      📁 경로: {copied_file}")
                            self.log_message(f"      📏 크기: {copied_size:,} bytes")
                            self.log_message(f"      🕒 수정시간: {copied_time}")
                        else:
                            self.log_message(f"   ❌ 복사된 파일이 존재하지 않습니다!")
                            
                    except Exception as e:
                        self.log_message(f"   ❌ 복사 실패: {latest_file.name}")
                        self.log_message(f"   🔍 오류 상세: {e}")
                else:
                    self.log_message(f"   ⚠️ 소스 폴더에 파일이 없습니다: {source_path}")
                    self.log_message(f"   🔍 소스 폴더 내용:")
                    try:
                        for item in source_dir.iterdir():
                            if item.is_dir():
                                self.log_message(f"      📁 [폴더] {item.name}")
                            else:
                                self.log_message(f"      📄 {item.name}")
                    except Exception as e:
                        self.log_message(f"      ❌ 폴더 내용 읽기 실패: {e}")
                        
            self.log_message(f"✅ 이동 설정 {move_num} 완료: {moved_count}개 파일 복사됨")
            self.log_message(f"   📊 처리 결과 요약:")
            self.log_message(f"      📁 소스: {source_path}")
            self.log_message(f"      📁 대상: {target_path}")
            self.log_message(f"      📝 패턴: {filename_pattern if filename_pattern else '원본 파일명'}")
            self.log_message(f"      📊 복사된 파일: {moved_count}개")
            
        except Exception as e:
            self.log_message(f"❌ 이동 설정 {move_num} 실행 중 오류: {e}")
            self.log_message(f"🔍 오류 상세 정보:")
            import traceback
            for line in traceback.format_exc().split('\n'):
                if line.strip():
                    self.log_message(f"   {line}")
    
    def handle_existing_file(self, target_file, cleanup_mode, max_backup_files):
        """기존 파일 처리 (정리 모드에 따라)"""
        try:
            if cleanup_mode == "backup":
                # 백업 모드: 타임스탬프로 백업
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                backup_path = target_file.with_suffix(f'.backup_{timestamp}')
                target_file.rename(backup_path)
                self.log_message(f"  📦 백업 생성: {target_file.name} → {backup_path.name}")
                
                # 오래된 백업 파일 정리
                self.cleanup_old_backups(target_file, max_backup_files)
                
            elif cleanup_mode == "delete":
                # 삭제 모드: 기존 파일 삭제
                target_file.unlink()
                self.log_message(f"  🗑️ 기존 파일 삭제: {target_file.name}")
                
            elif cleanup_mode == "keep":
                # 유지 모드: 기존 파일 덮어쓰기
                self.log_message(f"  ⚠️ 기존 파일 덮어쓰기: {target_file.name}")
                
            elif cleanup_mode == "rename":
                # 이름 변경 모드: 기존 파일 이름 변경
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                rename_path = target_file.with_suffix(f'.old_{timestamp}')
                target_file.rename(rename_path)
                self.log_message(f"  🔄 기존 파일 이름 변경: {target_file.name} → {rename_path.name}")
                
        except Exception as e:
            self.log_message(f"  ❌ 기존 파일 처리 중 오류: {e}")
    

    
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
                    self.log_message(f"  🗑️ 오래된 백업 삭제: {backup_file.name}")
                    
        except Exception as e:
            self.log_message(f"  ⚠️ 백업 정리 중 오류: {e}")
    
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
                        if filename_pattern:
                            self.log_message(f"  ✅ 저장 완료: {file_path.name} → {target_file.name}")
                        else:
                            self.log_message(f"  ✅ 저장 완료: {file_path.name}")
                    except Exception as e:
                        self.log_message(f"  ❌ 저장 실패: {file_path.name} - {e}")
            
            self.log_message(f"✅ 파일 정리 옵션으로 저장 완료: {saved_count}개 파일 저장됨")
            return True
            
        except Exception as e:
            self.log_message(f"❌ 파일 정리 옵션으로 저장 중 오류: {e}")
            return False
        
    def log_message(self, message):
        """로그 메시지 추가"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] {message}\n"
        self.log_queue.put(log_entry)
        
    def update_log(self):
        """로그 업데이트"""
        try:
            while True:
                message = self.log_queue.get_nowait()
                self.log_text.insert(tk.END, message)
                self.log_text.see(tk.END)
        except queue.Empty:
            pass
        
        # 100ms 후 다시 업데이트
        self.root.after(100, self.update_log)
        
    def run_organizer(self):
        """파일 정리 실행"""
        def run_in_thread():
            try:
                self.log_message("�� 파일 정리를 시작합니다...")
                self.log_message(f"   📅 실행 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                
                # 설정 저장
                self.save_config()
                self.log_message("✅ 설정이 저장되었습니다.")
                
                # 파일 정리 스크립트 실행
                self.log_message("📋 파일 정리 스크립트를 실행합니다...")
                self.log_message(f"   📁 현재 작업 디렉토리: {Path.cwd()}")
                
                result = subprocess.run([sys.executable, "file_organizer.py"], 
                                      capture_output=True, text=True, 
                                      encoding='cp949', errors='replace')  # Windows 한글 인코딩
                
                self.log_message(f"   📊 스크립트 실행 결과:")
                self.log_message(f"      🔢 종료 코드: {result.returncode}")
                self.log_message(f"      📏 출력 길이: {len(result.stdout)} 문자")
                self.log_message(f"      📏 오류 길이: {len(result.stderr)} 문자")
                
                if result.returncode == 0:
                    self.log_message("✅ 파일 정리가 완료되었습니다!")
                    if result.stdout:
                        self.log_message("   📄 스크립트 출력:")
                        for line in result.stdout.strip().split('\n'):
                            if line.strip():
                                self.log_message(f"      {line.strip()}")
                else:
                    self.log_message("❌ 파일 정리에 실패했습니다.")
                    if result.stderr:
                        self.log_message("   ❌ 오류 출력:")
                        for line in result.stderr.strip().split('\n'):
                            if line.strip():
                                self.log_message(f"      {line.strip()}")
                
                # 활성화된 파일 이동 작업 실행
                self.log_message("🔄 파일 이동 작업을 시작합니다...")
                self.execute_enabled_moves()
                
                # 로그 파일 정리
                max_log_files = int(self.max_log_files_var.get())
                self.log_message(f"🧹 로그 파일 정리를 시작합니다... (최대 {max_log_files}개 유지)")
                self.cleanup_old_log_files(max_log_files)
                
                self.log_message("🎯 모든 작업이 완료되었습니다!")
                                
            except Exception as e:
                self.log_message(f"❌ 실행 중 오류 발생: {e}")
                self.log_message(f"🔍 오류 상세 정보:")
                import traceback
                for line in traceback.format_exc().split('\n'):
                    if line.strip():
                        self.log_message(f"   {line}")
                
        thread = threading.Thread(target=run_in_thread)
        thread.daemon = True
        thread.start()
        
    def execute_enabled_moves(self):
        """활성화된 파일 이동 작업 순차 실행"""
        def execute_moves_sequentially():
            self.log_message("🔄 활성화된 파일 이동 작업을 순차적으로 실행합니다...")
            self.log_message(f"   📅 실행 시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
            # 활성화된 이동 설정 확인
            enabled_moves = []
            if self.move1_enabled_var.get() and self.move1_source_var.get() and self.move1_target_var.get():
                enabled_moves.append(1)
            if self.move2_enabled_var.get() and self.move2_source_var.get() and self.move2_target_var.get():
                enabled_moves.append(2)
            
            self.log_message(f"   📊 활성화된 이동 설정: {enabled_moves}")
            self.log_message(f"   📊 총 실행할 이동 설정 수: {len(enabled_moves)}개")
            
            if not enabled_moves:
                self.log_message("   ⚠️ 활성화된 이동 설정이 없습니다.")
                return
            
            # 이동 설정 1
            if 1 in enabled_moves:
                self.log_message("📁 이동 설정 1을 실행합니다...")
                self.log_message(f"   📍 소스: {self.move1_source_var.get()}")
                self.log_message(f"   📍 대상: {self.move1_target_var.get()}")
                self.log_message(f"   📝 패턴: {self.move1_filename_var.get()}")
                start_time = datetime.now()
                self.execute_file_move_sync(1, self.move1_source_var.get(), self.move1_target_var.get(), self.move1_filename_var.get())
                end_time = datetime.now()
                duration = (end_time - start_time).total_seconds()
                self.log_message(f"✅ 이동 설정 1 완료 (소요시간: {duration:.2f}초)")
            
            # 이동 설정 2
            if 2 in enabled_moves:
                self.log_message("📁 이동 설정 2를 실행합니다...")
                self.log_message(f"   📍 소스: {self.move2_source_var.get()}")
                self.log_message(f"   📍 대상: {self.move2_target_var.get()}")
                self.log_message(f"   📝 패턴: {self.move2_filename_var.get()}")
                start_time = datetime.now()
                self.execute_file_move_sync(2, self.move2_source_var.get(), self.move2_target_var.get(), self.move2_filename_var.get())
                end_time = datetime.now()
                duration = (end_time - start_time).total_seconds()
                self.log_message(f"✅ 이동 설정 2 완료 (소요시간: {duration:.2f}초)")
            
            self.log_message(f"🎯 모든 이동 설정 실행 완료")
            self.log_message(f"   📅 실행 완료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        thread = threading.Thread(target=execute_moves_sequentially)
        thread.daemon = True
        thread.start()
        
    def check_status(self):
        """상태 확인"""
        def check_in_thread():
            try:
                self.log_message("📊 현재 상태를 확인합니다...")
                
                result = subprocess.run([sys.executable, "file_organizer.py", "--status"], 
                                      capture_output=True, text=True, 
                                      encoding='cp949', errors='replace')  # Windows 한글 인코딩
                
                if result.stdout:
                    for line in result.stdout.strip().split('\n'):
                        if line.strip():
                            self.log_message(line.strip())
                            
            except Exception as e:
                self.log_message(f"❌ 상태 확인 중 오류 발생: {e}")
                
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
            self.log_message(f"📁 로그 폴더를 열었습니다: {log_dir}")
        else:
            self.log_message("📁 로그 폴더가 존재하지 않습니다.")
            
    def open_target_folder(self):
        """대상 폴더 열기"""
        target_dir = Path(self.target_folder_var.get())
        if target_dir.exists():
            if os.name == 'nt':  # Windows
                os.startfile(target_dir)
            else:  # Linux/Mac
                subprocess.run(["xdg-open", str(target_dir)])
            self.log_message(f"📁 대상 폴더를 열었습니다: {target_dir}")
        else:
            self.log_message("📁 대상 폴더가 존재하지 않습니다.")

    def on_window_resize(self, event):
        """창 크기 변경 시 레이아웃 재조정"""
        # 창 크기가 너무 작을 때 최소 크기 유지
        if event.width < 800:
            self.root.geometry("800x600")
        elif event.height < 600:
            self.root.geometry("1400x600")
        
        # 로그 텍스트 영역 크기 동적 조정
        try:
            log_frame = self.root.grid_slaves(row=0, column=1)[0]
            log_text = log_frame.grid_slaves(row=0, column=0)[0]
            
            # 창 크기에 따라 로그 텍스트 영역 크기 조정
            window_width = self.root.winfo_width()
            window_height = self.root.winfo_height()
            
            # 로그 영역이 전체 창의 40%를 차지하도록 조정
            log_width = max(50, int(window_width * 0.4 / 10))  # 문자 단위로 변환
            log_height = max(10, int(window_height * 0.6 / 20))  # 줄 단위로 변환
            
            log_text.configure(width=log_width, height=log_height)
            
        except (IndexError, AttributeError):
            pass  # 위젯이 아직 생성되지 않은 경우 무시

def main():
    root = tk.Tk()
    app = FileOrganizerGUI(root)
    root.mainloop()

if __name__ == "__main__":
    main() 