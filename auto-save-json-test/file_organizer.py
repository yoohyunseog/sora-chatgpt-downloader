#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sora Auto Save 파일 정리 프로그램
다운로드 폴더의 sora_auto_save_*.json 파일들을 정리하고 최신 파일만 지정한 폴더에 저장
"""

import os
import json
import shutil
import glob
import logging
from datetime import datetime
from pathlib import Path
import argparse
from typing import List, Dict, Optional

class FileOrganizer:
    def __init__(self, config_file: str = "file_organizer_config.json"):
        self.config_file = config_file
        self.setup_logging()  # 먼저 로깅 설정
        self.config = self.load_config()  # 그 다음 설정 로드

    def setup_logging(self):
        """로깅 설정"""
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)

        log_file = log_dir / f"file_organizer_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"

        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file, encoding='utf-8'),
                logging.StreamHandler()
            ]
        )

        self.logger = logging.getLogger(__name__)
        self.logger.info("=== Sora Auto Save 파일 정리 프로그램 시작 ===")

    def load_config(self) -> Dict:
        """설정 파일 로드"""
        default_config = {
            "download_folder": str(Path.home() / "Downloads"),
            "target_folder": str(Path.cwd() / "organized_files"),
            "file_pattern": "sora_auto_save_*.json",
            "output_filename": "sora_latest_data.json",
            "backup_old_files": True,
            "backup_folder": str(Path.cwd() / "backup"),
            "auto_run_interval": 300,  # 5분
            "max_backup_files": 10
        }

        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    # 기본값과 병합
                    for key, value in default_config.items():
                        if key not in config:
                            config[key] = value
                    self.logger.info(f"설정 파일 로드됨: {self.config_file}")
                    return config
            except Exception as e:
                self.logger.error(f"설정 파일 로드 실패: {e}")
                return default_config
        else:
            self.logger.info("설정 파일이 없어 기본 설정을 사용합니다.")
            return default_config

    def save_config(self):
        """설정 파일 저장"""
        try:
            with open(self.config_file, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, indent=2, ensure_ascii=False)
            self.logger.info(f"설정 파일 저장됨: {self.config_file}")
        except Exception as e:
            self.logger.error(f"설정 파일 저장 실패: {e}")

    def find_files(self, pattern: str) -> List[Path]:
        """패턴에 맞는 파일들 찾기"""
        download_path = Path(self.config["download_folder"])
        search_pattern = download_path / pattern

        self.logger.info(f"파일 검색 패턴: {search_pattern}")

        files = list(Path(download_path).glob(pattern))
        files = [f for f in files if f.is_file()]

        self.logger.info(f"발견된 파일 수: {len(files)}")
        for file in files:
            self.logger.info(f"  - {file.name}")

        return files

    def get_latest_file(self, files: List[Path]) -> Optional[Path]:
        """가장 최신 파일 찾기"""
        if not files:
            return None

        # 파일 수정 시간 기준으로 정렬
        latest_file = max(files, key=lambda x: x.stat().st_mtime)

        self.logger.info(f"최신 파일: {latest_file.name}")
        self.logger.info(f"수정 시간: {datetime.fromtimestamp(latest_file.stat().st_mtime)}")

        return latest_file

    def validate_json_file(self, file_path: Path) -> bool:
        """JSON 파일 유효성 검사"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # 필수 키 확인
            required_keys = ['metadata', 'images', 'prompts']
            if not all(key in data for key in required_keys):
                self.logger.warning(f"필수 키가 누락됨: {file_path.name}")
                return False

            self.logger.info(f"JSON 파일 유효성 검사 통과: {file_path.name}")
            self.logger.info(f"  - 이미지: {len(data.get('images', []))}개")
            self.logger.info(f"  - 프롬프트: {len(data.get('prompts', []))}개")

            return True

        except json.JSONDecodeError as e:
            self.logger.error(f"JSON 파싱 오류: {file_path.name} - {e}")
            return False
        except Exception as e:
            self.logger.error(f"파일 읽기 오류: {file_path.name} - {e}")
            return False

    def copy_file(self, source: Path, target: Path) -> bool:
        """파일 복사"""
        try:
            # 대상 폴더 생성
            target.parent.mkdir(parents=True, exist_ok=True)

            # 파일 복사
            shutil.copy2(source, target)

            self.logger.info(f"파일 복사 완료: {source.name} → {target}")
            return True

        except Exception as e:
            self.logger.error(f"파일 복사 실패: {source.name} → {target} - {e}")
            return False

    def backup_old_files(self, files: List[Path]):
        """기존 파일들을 백업 폴더로 이동"""
        if not self.config["backup_old_files"]:
            return

        backup_path = Path(self.config["backup_folder"])
        backup_path.mkdir(parents=True, exist_ok=True)

        self.logger.info(f"백업 폴더: {backup_path}")

        for file in files:
            try:
                backup_file = backup_path / file.name

                # 백업 파일이 이미 존재하면 이름 변경
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
                self.logger.info(f"백업 완료: {file.name} → {backup_file.name}")

            except Exception as e:
                self.logger.error(f"백업 실패: {file.name} - {e}")

    def cleanup_old_backups(self):
        """오래된 백업 파일 정리"""
        backup_path = Path(self.config["backup_folder"])
        if not backup_path.exists():
            return

        # 백업 파일들을 수정 시간 순으로 정렬
        backup_files = list(backup_path.glob("*.json"))
        backup_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)

        # 최대 백업 파일 수를 초과하는 파일들 삭제
        max_files = self.config["max_backup_files"]
        if len(backup_files) > max_files:
            files_to_delete = backup_files[max_files:]

            for file in files_to_delete:
                try:
                    file.unlink()
                    self.logger.info(f"오래된 백업 파일 삭제: {file.name}")
                except Exception as e:
                    self.logger.error(f"백업 파일 삭제 실패: {file.name} - {e}")

    def organize_files(self) -> bool:
        """파일 정리 메인 함수"""
        try:
            self.logger.info("=== 파일 정리 시작 ===")

            # 1. 파일 찾기
            files = self.find_files(self.config["file_pattern"])

            if not files:
                self.logger.warning("정리할 파일이 없습니다.")
                return False

            # 2. 최신 파일 찾기
            latest_file = self.get_latest_file(files)
            if not latest_file:
                self.logger.error("최신 파일을 찾을 수 없습니다.")
                return False

            # 3. JSON 파일 유효성 검사
            if not self.validate_json_file(latest_file):
                self.logger.error("최신 파일이 유효하지 않습니다.")
                return False

            # 4. 대상 폴더에 복사
            target_path = Path(self.config["target_folder"]) / self.config["output_filename"]

            if self.copy_file(latest_file, target_path):
                self.logger.info(f"파일 정리 완료: {target_path}")

                # 5. 백업 처리
                if self.config["backup_old_files"]:
                    self.backup_old_files(files)
                    self.cleanup_old_backups()

                return True
            else:
                return False

        except Exception as e:
            self.logger.error(f"파일 정리 중 오류 발생: {e}")
            return False

    def update_config(self, **kwargs):
        """설정 업데이트"""
        for key, value in kwargs.items():
            if key in self.config:
                self.config[key] = value
                self.logger.info(f"설정 업데이트: {key} = {value}")
            else:
                self.logger.warning(f"알 수 없는 설정 키: {key}")

        self.save_config()

    def show_status(self):
        """현재 상태 표시"""
        self.logger.info("=== 현재 설정 ===")
        for key, value in self.config.items():
            self.logger.info(f"  {key}: {value}")

        # 다운로드 폴더 파일 목록
        files = self.find_files(self.config["file_pattern"])
        if files:
            self.logger.info(f"다운로드 폴더의 {self.config['file_pattern']} 파일들:")
            for file in sorted(files, key=lambda x: x.stat().st_mtime, reverse=True):
                mtime = datetime.fromtimestamp(file.stat().st_mtime)
                self.logger.info(f"  - {file.name} (수정: {mtime})")
        else:
            self.logger.info("다운로드 폴더에 해당 파일이 없습니다.")

def main():
    parser = argparse.ArgumentParser(description="Sora Auto Save 파일 정리 프로그램")
    parser.add_argument("--config", default="file_organizer_config.json", help="설정 파일 경로")
    parser.add_argument("--download-folder", help="다운로드 폴더 경로")
    parser.add_argument("--target-folder", help="대상 폴더 경로")
    parser.add_argument("--file-pattern", help="파일 패턴 (예: sora_auto_save_*.json)")
    parser.add_argument("--output-filename", help="출력 파일명")
    parser.add_argument("--status", action="store_true", help="현재 상태 표시")
    parser.add_argument("--no-backup", action="store_true", help="백업 비활성화")

    args = parser.parse_args()

    # 파일 정리기 초기화
    organizer = FileOrganizer(args.config)

    # 명령행 인수로 설정 업데이트
    config_updates = {}
    if args.download_folder:
        config_updates["download_folder"] = args.download_folder
    if args.target_folder:
        config_updates["target_folder"] = args.target_folder
    if args.file_pattern:
        config_updates["file_pattern"] = args.file_pattern
    if args.output_filename:
        config_updates["output_filename"] = args.output_filename
    if args.no_backup:
        config_updates["backup_old_files"] = False

    if config_updates:
        organizer.update_config(**config_updates)

    # 상태 표시
    if args.status:
        organizer.show_status()
        return

    # 파일 정리 실행
    success = organizer.organize_files()

    if success:
        print("파일 정리가 완료되었습니다!")
    else:
        print("파일 정리에 실패했습니다. 로그를 확인해주세요.")

    print(f"로그 파일: logs/file_organizer_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log")

if __name__ == "__main__":
    main() 