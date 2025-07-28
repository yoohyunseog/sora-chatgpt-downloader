#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Chrome 확장 프로그램용 파일 저장 Python 스크립트
Native Messaging을 통해 JSON 데이터를 받아 실제 파일로 저장
"""

import json
import sys
import os
import struct
from datetime import datetime
from pathlib import Path

# 표준 입력/출력에서 메시지를 읽고 쓰는 함수들
def get_message():
    """Chrome에서 보낸 메시지를 읽습니다."""
    raw_length = sys.stdin.buffer.read(4)
    if not raw_length:
        return None
    message_length = struct.unpack('=I', raw_length)[0]
    message = sys.stdin.buffer.read(message_length)
    return json.loads(message.decode('utf-8'))

def send_message(message):
    """Chrome으로 메시지를 보냅니다."""
    encoded_message = json.dumps(message).encode('utf-8')
    encoded_length = struct.pack('=I', len(encoded_message))
    sys.stdout.buffer.write(encoded_length)
    sys.stdout.buffer.write(encoded_message)
    sys.stdout.buffer.flush()

def save_json_data(data, filename=None):
    """JSON 데이터를 파일로 저장합니다."""
    try:
        # 지정된 저장 디렉토리 생성 (상대 경로)
        save_dir = Path("data")
        save_dir.mkdir(exist_ok=True, parents=True)
        
        # 고정 파일명 사용 (덮어쓰기)
        filename = "auto_save_data.json"
        file_path = save_dir / filename
        
        # 메타데이터 추가
        json_data = {
            "metadata": {
                "created_at": datetime.now().isoformat(),
                "version": "1.0.0",
                "source": "Chrome Extension Native Messaging",
                "updated_at": datetime.now().isoformat()
            },
            "data": data
        }
        
        # 파일 저장 (덮어쓰기)
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, ensure_ascii=False, indent=2)
        
        return {
            "success": True,
            "message": f"파일이 성공적으로 저장되었습니다: {file_path}",
            "file_path": str(file_path),
            "file_size": os.path.getsize(file_path),
            "overwrite": True
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"파일 저장 실패: {str(e)}"
        }

def get_saved_files():
    """저장된 파일 목록을 반환합니다."""
    try:
        save_dir = Path("data")
        if not save_dir.exists():
            return {"files": [], "total_count": 0}
        
        files = []
        for file_path in save_dir.glob("*.json"):
            files.append({
                "name": file_path.name,
                "size": os.path.getsize(file_path),
                "created": datetime.fromtimestamp(file_path.stat().st_ctime).isoformat(),
                "path": str(file_path)
            })
        
        return {
            "success": True,
            "files": files,
            "total_count": len(files),
            "save_directory": str(save_dir)
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"파일 목록 조회 실패: {str(e)}"
        }

def main():
    """메인 함수 - Chrome과 통신합니다."""
    try:
        while True:
            message = get_message()
            if not message:
                break
            
            action = message.get('action')
            
            if action == 'save_data':
                data = message.get('data', {})
                filename = message.get('filename')
                result = save_json_data(data, filename)
                send_message(result)
                
            elif action == 'get_files':
                result = get_saved_files()
                send_message(result)
                
            elif action == 'ping':
                send_message({
                    "success": True,
                    "message": "Python 스크립트가 정상 작동 중입니다",
                    "timestamp": datetime.now().isoformat()
                })
                
            else:
                send_message({
                    "success": False,
                    "message": f"알 수 없는 액션: {action}"
                })
                
    except Exception as e:
        send_message({
            "success": False,
            "message": f"오류 발생: {str(e)}"
        })

if __name__ == "__main__":
    main() 