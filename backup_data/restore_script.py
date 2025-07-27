
# 복원 스크립트
import json
import shutil
from pathlib import Path

def restore_from_backup(backup_file, target_path):
    """백업 파일에서 복원"""
    try:
        shutil.copy2(backup_file, target_path)
        print(f"✅ 복원 완료: {backup_file} → {target_path}")
        return True
    except Exception as e:
        print(f"❌ 복원 실패: {e}")
        return False

# 사용 예시:
# restore_from_backup("backup_data/data_save_prompt_20250101_120000.json", 
#                    "nb_wfa/sora-auto-image/data/save_prompt.json")
