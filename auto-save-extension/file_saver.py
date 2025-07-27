#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Auto Save Extension - File Saver
Chrome 확장 프로그램과 통신하여 파일 시스템에 데이터를 저장하는 Python 스크립트
"""

import sys
import json
import os
import time
import shutil
import hashlib
from datetime import datetime
from pathlib import Path

class FileSaver:
    def __init__(self):
        self.data_dir = Path(__file__).parent / "saved_data"
        self.data_dir.mkdir(exist_ok=True)
        
        # 백업 폴더 생성
        self.backup_dir = Path(__file__).parent / "backup_data"
        self.backup_dir.mkdir(exist_ok=True)
        
        # 데이터 파일 경로
        self.images_file = self.data_dir / "saved_images.json"
        self.prompts_file = self.data_dir / "saved_prompts.json"
        self.pages_file = self.data_dir / "monitored_pages.json"
        self.stats_file = self.data_dir / "stats.json"
        
        # 파일 정리 설정
        self.cleanup_mode = "backup"  # "backup", "delete", "keep"
        self.max_backup_files = 5  # 최대 백업 파일 개수
        
        # 기존 데이터 로드
        self.load_existing_data()
        
    def load_existing_data(self):
        """기존 데이터 로드"""
        try:
            if self.images_file.exists():
                with open(self.images_file, 'r', encoding='utf-8') as f:
                    self.saved_images = json.load(f)
            else:
                self.saved_images = []
                
            if self.prompts_file.exists():
                with open(self.prompts_file, 'r', encoding='utf-8') as f:
                    self.saved_prompts = json.load(f)
            else:
                self.saved_prompts = []
                
            if self.pages_file.exists():
                with open(self.pages_file, 'r', encoding='utf-8') as f:
                    self.monitored_pages = json.load(f)
            else:
                self.monitored_pages = []
                
        except Exception as e:
            print(f"데이터 로드 오류: {e}", file=sys.stderr)
            self.saved_images = []
            self.saved_prompts = []
            self.monitored_pages = []
    
    def save_image_data(self, image_data, cleanup_mode=None):
        """이미지 데이터 저장"""
        try:
            # 중복 체크 (URL 기준)
            if not any(img.get('url') == image_data.get('url') for img in self.saved_images):
                self.saved_images.append(image_data)
                self._save_to_file(self.images_file, self.saved_images, cleanup_mode)
                print(f"이미지 저장됨: {image_data.get('url', '')[:50]}...")
                return True
            else:
                print(f"중복 이미지 건너뛰기: {image_data.get('url', '')[:50]}...")
                return False
        except Exception as e:
            print(f"이미지 저장 오류: {e}", file=sys.stderr)
            return False
    
    def save_prompt_data(self, prompt_data, cleanup_mode=None):
        """프롬프트 데이터 저장"""
        try:
            # 중복 체크 (내용 기준)
            if not any(p.get('content') == prompt_data.get('content') for p in self.saved_prompts):
                self.saved_prompts.append(prompt_data)
                self._save_to_file(self.prompts_file, self.saved_prompts, cleanup_mode)
                print(f"프롬프트 저장됨: {prompt_data.get('content', '')[:50]}...")
                return True
            else:
                print(f"중복 프롬프트 건너뛰기: {prompt_data.get('content', '')[:50]}...")
                return False
        except Exception as e:
            print(f"프롬프트 저장 오류: {e}", file=sys.stderr)
            return False
    
    def save_page_data(self, page_data, cleanup_mode=None):
        """페이지 데이터 저장"""
        try:
            # 중복 체크 (URL 기준)
            if not any(p.get('url') == page_data.get('url') for p in self.monitored_pages):
                self.monitored_pages.append(page_data)
                self._save_to_file(self.pages_file, self.monitored_pages, cleanup_mode)
                print(f"페이지 저장됨: {page_data.get('url', '')[:50]}...")
                return True
            else:
                return False
        except Exception as e:
            print(f"페이지 저장 오류: {e}", file=sys.stderr)
            return False
    
    def _save_to_file(self, file_path, data, cleanup_mode=None):
        """파일에 데이터 저장"""
        try:
            # 정리 모드 설정 (기본값 사용)
            mode = cleanup_mode or self.cleanup_mode
            
            # 기존 파일이 있으면 정리 모드에 따라 처리
            if file_path.exists():
                if mode == "backup":
                    # 백업 모드: 타임스탬프로 백업
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    backup_path = file_path.with_suffix(f'.backup_{timestamp}')
                    file_path.rename(backup_path)
                    print(f"기존 파일 백업: {file_path.name} -> {backup_path.name}")
                    
                elif mode == "delete":
                    # 삭제 모드: 기존 파일 삭제
                    file_path.unlink()
                    print(f"기존 파일 삭제: {file_path.name}")
                    
                elif mode == "keep":
                    # 유지 모드: 기존 파일 덮어쓰기
                    print(f"기존 파일 덮어쓰기: {file_path.name}")
                    
                elif mode == "rename":
                    # 이름 변경 모드: 기존 파일 이름 변경
                    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                    rename_path = file_path.with_suffix(f'.old_{timestamp}')
                    file_path.rename(rename_path)
                    print(f"기존 파일 이름 변경: {file_path.name} -> {rename_path.name}")
            
            # 새 파일 저장
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            # 통계 업데이트
            self._update_stats()
            
        except Exception as e:
            print(f"파일 저장 오류: {e}", file=sys.stderr)
    
    def _update_stats(self):
        """통계 정보 업데이트"""
        try:
            stats = {
                "last_updated": datetime.now().isoformat(),
                "total_images": len(self.saved_images),
                "total_prompts": len(self.saved_prompts),
                "total_pages": len(self.monitored_pages),
                "data_directory": str(self.data_dir)
            }
            
            with open(self.stats_file, 'w', encoding='utf-8') as f:
                json.dump(stats, f, ensure_ascii=False, indent=2)
                
        except Exception as e:
            print(f"통계 업데이트 오류: {e}", file=sys.stderr)
    
    def get_stats(self):
        """통계 정보 반환"""
        return {
            "total_images": len(self.saved_images),
            "total_prompts": len(self.saved_prompts),
            "total_pages": len(self.monitored_pages),
            "last_updated": datetime.now().isoformat(),
            "data_directory": str(self.data_dir)
        }
    
    def export_all_data(self):
        """모든 데이터를 하나의 파일로 내보내기"""
        try:
            export_data = {
                "export_info": {
                    "timestamp": datetime.now().isoformat(),
                    "total_images": len(self.saved_images),
                    "total_prompts": len(self.saved_prompts),
                    "total_pages": len(self.monitored_pages)
                },
                "images": self.saved_images,
                "prompts": self.saved_prompts,
                "pages": self.monitored_pages
            }
            
            export_file = self.data_dir / f"export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            with open(export_file, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, ensure_ascii=False, indent=2)
            
            return str(export_file)
            
        except Exception as e:
            print(f"데이터 내보내기 오류: {e}", file=sys.stderr)
            return None
    
    def clear_all_data(self):
        """모든 데이터 삭제"""
        try:
            self.saved_images = []
            self.saved_prompts = []
            self.monitored_pages = []
            
            # 파일들 삭제
            for file_path in [self.images_file, self.prompts_file, self.pages_file, self.stats_file]:
                if file_path.exists():
                    file_path.unlink()
            
            print("모든 데이터가 삭제되었습니다.")
            return True
            
        except Exception as e:
            print(f"데이터 삭제 오류: {e}", file=sys.stderr)
            return False
    
    def cleanup_old_files(self, file_path):
        """기존 파일 정리 (백업 또는 삭제)"""
        try:
            if not file_path.exists():
                return True
            
            if self.cleanup_mode == "delete":
                # 완전 삭제
                file_path.unlink()
                print(f"기존 파일 삭제: {file_path.name}")
                return True
                
            elif self.cleanup_mode == "backup":
                # 백업 폴더로 이동
                timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
                backup_path = self.backup_dir / f"{file_path.stem}_{timestamp}{file_path.suffix}"
                file_path.rename(backup_path)
                print(f"기존 파일 백업: {file_path.name} -> {backup_path.name}")
                
                # 오래된 백업 파일 정리
                self._cleanup_old_backups(file_path.stem)
                return True
                
            elif self.cleanup_mode == "keep":
                # 기존 파일 유지 (덮어쓰기)
                print(f"기존 파일 유지: {file_path.name}")
                return True
                
        except Exception as e:
            print(f"파일 정리 오류: {e}", file=sys.stderr)
            return False
    
    def _cleanup_old_backups(self, file_stem):
        """오래된 백업 파일 정리"""
        try:
            # 해당 파일의 백업들 찾기
            backup_files = list(self.backup_dir.glob(f"{file_stem}_*"))
            backup_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
            
            # 최대 개수 초과 시 오래된 파일 삭제
            if len(backup_files) > self.max_backup_files:
                for old_file in backup_files[self.max_backup_files:]:
                    old_file.unlink()
                    print(f"오래된 백업 파일 삭제: {old_file.name}")
                    
        except Exception as e:
            print(f"백업 파일 정리 오류: {e}", file=sys.stderr)
    
    def set_cleanup_mode(self, mode, max_backup_files=None):
        """파일 정리 모드 설정"""
        if mode in ["backup", "delete", "keep"]:
            self.cleanup_mode = mode
            if max_backup_files:
                self.max_backup_files = max_backup_files
            print(f"파일 정리 모드 설정: {mode}")
            return True
        else:
            print(f"잘못된 정리 모드: {mode}")
            return False
    
    def get_cleanup_info(self):
        """파일 정리 정보 반환"""
        backup_count = len(list(self.backup_dir.glob("*")))
        return {
            "cleanup_mode": self.cleanup_mode,
            "max_backup_files": self.max_backup_files,
            "backup_directory": str(self.backup_dir),
            "current_backup_count": backup_count
        }

def main():
    """메인 함수 - Chrome 확장 프로그램과 통신"""
    file_saver = FileSaver()
    
    # 표준 입력/출력으로 Chrome과 통신
    while True:
        try:
            # Chrome에서 보낸 메시지 읽기
            message_length = sys.stdin.buffer.read(4)
            if not message_length:
                break
                
            message_length = int.from_bytes(message_length, byteorder='little')
            message = sys.stdin.buffer.read(message_length).decode('utf-8')
            
            # JSON 파싱
            data = json.loads(message)
            action = data.get('action')
            
            response = {"success": False, "message": "Unknown action"}
            
            if action == 'save_image':
                cleanup_mode = data.get('cleanup_mode')
                success = file_saver.save_image_data(data.get('data', {}), cleanup_mode)
                response = {"success": success, "message": "Image saved" if success else "Image already exists"}
                
            elif action == 'save_prompt':
                cleanup_mode = data.get('cleanup_mode')
                success = file_saver.save_prompt_data(data.get('data', {}), cleanup_mode)
                response = {"success": success, "message": "Prompt saved" if success else "Prompt already exists"}
                
            elif action == 'save_page':
                cleanup_mode = data.get('cleanup_mode')
                success = file_saver.save_page_data(data.get('data', {}), cleanup_mode)
                response = {"success": success, "message": "Page saved" if success else "Page already exists"}
                
            elif action == 'get_stats':
                stats = file_saver.get_stats()
                response = {"success": True, "data": stats}
                
            elif action == 'export_data':
                export_path = file_saver.export_all_data()
                response = {"success": export_path is not None, "data": {"export_path": export_path}}
                
            elif action == 'clear_data':
                success = file_saver.clear_all_data()
                response = {"success": success, "message": "Data cleared" if success else "Failed to clear data"}
                
            elif action == 'set_cleanup_mode':
                mode = data.get('mode')
                max_backup = data.get('max_backup_files')
                success = file_saver.set_cleanup_mode(mode, max_backup)
                response = {"success": success, "message": f"Cleanup mode set to {mode}" if success else "Failed to set cleanup mode"}
                
            elif action == 'get_cleanup_info':
                info = file_saver.get_cleanup_info()
                response = {"success": True, "data": info}
                
            elif action == 'ping':
                response = {"success": True, "message": "pong"}
                
            # 응답 전송
            response_json = json.dumps(response, ensure_ascii=False)
            response_bytes = response_json.encode('utf-8')
            response_length = len(response_bytes).to_bytes(4, byteorder='little')
            
            sys.stdout.buffer.write(response_length)
            sys.stdout.buffer.write(response_bytes)
            sys.stdout.buffer.flush()
            
        except Exception as e:
            error_response = {"success": False, "error": str(e)}
            error_json = json.dumps(error_response, ensure_ascii=False)
            error_bytes = error_json.encode('utf-8')
            error_length = len(error_bytes).to_bytes(4, byteorder='little')
            
            sys.stdout.buffer.write(error_length)
            sys.stdout.buffer.write(error_bytes)
            sys.stdout.buffer.flush()

if __name__ == "__main__":
    main() 