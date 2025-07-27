#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Prompt Processor for Chrome Extension Test
프롬프트 입력을 처리하고 JSON 데이터를 생성하는 파이썬 스크립트
"""

import json
import os
import sys
from datetime import datetime
from typing import Dict, List, Any, Optional
import argparse

class PromptProcessor:
    """프롬프트 입력을 처리하고 JSON 데이터를 생성하는 클래스"""
    
    def __init__(self, data_file: str = "data.json"):
        """
        초기화
        
        Args:
            data_file (str): JSON 데이터 파일 경로
        """
        self.data_file = data_file
        self.data = self.load_data()
    
    def load_data(self) -> Dict[str, Any]:
        """기존 데이터 파일 로드"""
        try:
            if os.path.exists(self.data_file):
                with open(self.data_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            else:
                return self.create_default_data()
        except Exception as e:
            print(f"데이터 로드 오류: {e}")
            return self.create_default_data()
    
    def create_default_data(self) -> Dict[str, Any]:
        """기본 데이터 구조 생성"""
        return {
            "name": "프롬프트 테스트 데이터",
            "version": "1.0.0",
            "description": "크롬 확장 프로그램용 프롬프트 테스트 데이터 파일",
            "prompts": [],
            "settings": {
                "enabled": True,
                "autoLoad": False,
                "theme": "dark",
                "language": "ko"
            },
            "metadata": {
                "created": datetime.now().strftime("%Y-%m-%d"),
                "lastModified": datetime.now().strftime("%Y-%m-%d"),
                "author": "프롬프트 테스터",
                "totalPrompts": 0
            }
        }
    
    def save_data(self) -> bool:
        """데이터를 JSON 파일로 저장"""
        try:
            self.data["metadata"]["lastModified"] = datetime.now().strftime("%Y-%m-%d")
            with open(self.data_file, 'w', encoding='utf-8') as f:
                json.dump(self.data, f, indent=2, ensure_ascii=False)
            print(f"데이터가 {self.data_file}에 저장되었습니다.")
            return True
        except Exception as e:
            print(f"데이터 저장 오류: {e}")
            return False
    
    def add_prompt(self, title: str, content: str, category: str = "일반", tags: List[str] = None) -> bool:
        """
        새로운 프롬프트 추가
        
        Args:
            title (str): 프롬프트 제목
            content (str): 프롬프트 내용
            category (str): 프롬프트 카테고리
            tags (List[str]): 프롬프트 태그들
            
        Returns:
            bool: 성공 여부
        """
        try:
            new_id = len(self.data["prompts"]) + 1
            new_prompt = {
                "id": new_id,
                "title": title,
                "content": content,
                "category": category,
                "tags": tags or [],
                "created": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            }
            self.data["prompts"].append(new_prompt)
            self.data["metadata"]["totalPrompts"] = len(self.data["prompts"])
            print(f"프롬프트 '{title}'이 추가되었습니다. (ID: {new_id})")
            return True
        except Exception as e:
            print(f"프롬프트 추가 오류: {e}")
            return False
    
    def remove_prompt(self, prompt_id: int) -> bool:
        """
        프롬프트 삭제
        
        Args:
            prompt_id (int): 삭제할 프롬프트 ID
            
        Returns:
            bool: 성공 여부
        """
        try:
            for i, prompt in enumerate(self.data["prompts"]):
                if prompt["id"] == prompt_id:
                    removed_prompt = self.data["prompts"].pop(i)
                    self.data["metadata"]["totalPrompts"] = len(self.data["prompts"])
                    print(f"프롬프트 '{removed_prompt['title']}'이 삭제되었습니다.")
                    return True
            print(f"ID {prompt_id}인 프롬프트를 찾을 수 없습니다.")
            return False
        except Exception as e:
            print(f"프롬프트 삭제 오류: {e}")
            return False
    
    def update_prompt(self, prompt_id: int, title: str = None, content: str = None, category: str = None, tags: List[str] = None) -> bool:
        """
        프롬프트 수정
        
        Args:
            prompt_id (int): 수정할 프롬프트 ID
            title (str): 새로운 제목 (선택사항)
            content (str): 새로운 내용 (선택사항)
            category (str): 새로운 카테고리 (선택사항)
            tags (List[str]): 새로운 태그들 (선택사항)
            
        Returns:
            bool: 성공 여부
        """
        try:
            for prompt in self.data["prompts"]:
                if prompt["id"] == prompt_id:
                    if title:
                        prompt["title"] = title
                    if content:
                        prompt["content"] = content
                    if category:
                        prompt["category"] = category
                    if tags:
                        prompt["tags"] = tags
                    prompt["modified"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    print(f"프롬프트 ID {prompt_id}이 수정되었습니다.")
                    return True
            print(f"ID {prompt_id}인 프롬프트를 찾을 수 없습니다.")
            return False
        except Exception as e:
            print(f"프롬프트 수정 오류: {e}")
            return False
    
    def list_prompts(self) -> None:
        """모든 프롬프트 목록 출력"""
        print("\n=== 프롬프트 목록 ===")
        if not self.data["prompts"]:
            print("등록된 프롬프트가 없습니다.")
            return
        
        for prompt in self.data["prompts"]:
            print(f"ID: {prompt['id']}")
            print(f"제목: {prompt['title']}")
            print(f"카테고리: {prompt['category']}")
            print(f"내용: {prompt['content']}")
            if prompt.get('tags'):
                print(f"태그: {', '.join(prompt['tags'])}")
            if 'created' in prompt:
                print(f"생성일: {prompt['created']}")
            if 'modified' in prompt:
                print(f"수정일: {prompt['modified']}")
            print("-" * 30)
    
    def update_settings(self, **kwargs) -> bool:
        """
        설정 업데이트
        
        Args:
            **kwargs: 업데이트할 설정들
            
        Returns:
            bool: 성공 여부
        """
        try:
            for key, value in kwargs.items():
                if key in self.data["settings"]:
                    self.data["settings"][key] = value
                    print(f"설정 '{key}'이 '{value}'로 업데이트되었습니다.")
                else:
                    print(f"알 수 없는 설정: {key}")
            return True
        except Exception as e:
            print(f"설정 업데이트 오류: {e}")
            return False
    
    def show_settings(self) -> None:
        """현재 설정 출력"""
        print("\n=== 현재 설정 ===")
        for key, value in self.data["settings"].items():
            print(f"{key}: {value}")
    
    def interactive_mode(self) -> None:
        """대화형 모드 실행"""
        print("=== 프롬프트 프로세서 대화형 모드 ===")
        print("사용 가능한 명령어:")
        print("1. add - 새 프롬프트 추가")
        print("2. list - 프롬프트 목록 보기")
        print("3. update - 프롬프트 수정")
        print("4. remove - 프롬프트 삭제")
        print("5. settings - 설정 보기")
        print("6. set - 설정 변경")
        print("7. save - 데이터 저장")
        print("8. quit - 종료")
        
        while True:
            try:
                command = input("\n명령어를 입력하세요: ").strip().lower()
                
                if command == "quit" or command == "exit":
                    print("프로그램을 종료합니다.")
                    break
                
                elif command == "add":
                    title = input("프롬프트 제목을 입력하세요: ").strip()
                    content = input("프롬프트 내용을 입력하세요: ").strip()
                    category = input("카테고리를 입력하세요 (기본값: 일반): ").strip() or "일반"
                    tags_input = input("태그들을 쉼표로 구분하여 입력하세요: ").strip()
                    tags = [tag.strip() for tag in tags_input.split(",")] if tags_input else []
                    
                    if title and content:
                        self.add_prompt(title, content, category, tags)
                    else:
                        print("제목과 내용을 모두 입력해주세요.")
                
                elif command == "list":
                    self.list_prompts()
                
                elif command == "update":
                    try:
                        prompt_id = int(input("수정할 프롬프트 ID를 입력하세요: "))
                        title = input("새 제목 (변경하지 않으려면 엔터): ").strip()
                        content = input("새 내용 (변경하지 않으려면 엔터): ").strip()
                        category = input("새 카테고리 (변경하지 않으려면 엔터): ").strip()
                        tags_input = input("새 태그들 (변경하지 않으려면 엔터): ").strip()
                        
                        title = title if title else None
                        content = content if content else None
                        category = category if category else None
                        tags = [tag.strip() for tag in tags_input.split(",")] if tags_input else None
                        
                        self.update_prompt(prompt_id, title, content, category, tags)
                    except ValueError:
                        print("올바른 ID를 입력해주세요.")
                
                elif command == "remove":
                    try:
                        prompt_id = int(input("삭제할 프롬프트 ID를 입력하세요: "))
                        self.remove_prompt(prompt_id)
                    except ValueError:
                        print("올바른 ID를 입력해주세요.")
                
                elif command == "settings":
                    self.show_settings()
                
                elif command == "set":
                    print("변경할 설정을 선택하세요:")
                    print("1. enabled")
                    print("2. autoLoad")
                    print("3. theme")
                    print("4. language")
                    
                    setting_choice = input("설정 번호: ").strip()
                    if setting_choice == "1":
                        value = input("enabled 값 (true/false): ").strip().lower()
                        self.update_settings(enabled=value == "true")
                    elif setting_choice == "2":
                        value = input("autoLoad 값 (true/false): ").strip().lower()
                        self.update_settings(autoLoad=value == "true")
                    elif setting_choice == "3":
                        value = input("theme 값: ").strip()
                        self.update_settings(theme=value)
                    elif setting_choice == "4":
                        value = input("language 값: ").strip()
                        self.update_settings(language=value)
                    else:
                        print("올바른 설정을 선택해주세요.")
                
                elif command == "save":
                    self.save_data()
                
                else:
                    print("알 수 없는 명령어입니다. 다시 시도해주세요.")
                    
            except KeyboardInterrupt:
                print("\n프로그램을 종료합니다.")
                break
            except Exception as e:
                print(f"오류가 발생했습니다: {e}")

def main():
    """메인 함수"""
    parser = argparse.ArgumentParser(description="프롬프트 프로세서")
    parser.add_argument("--file", "-f", default="data.json", help="JSON 데이터 파일 경로")
    parser.add_argument("--interactive", "-i", action="store_true", help="대화형 모드 실행")
    parser.add_argument("--add", "-a", nargs=2, metavar=("TITLE", "CONTENT"), help="새 프롬프트 추가")
    parser.add_argument("--list", "-l", action="store_true", help="프롬프트 목록 출력")
    parser.add_argument("--remove", "-r", type=int, help="프롬프트 삭제 (ID)")
    parser.add_argument("--update", "-u", nargs=3, metavar=("ID", "TITLE", "CONTENT"), help="프롬프트 수정")
    parser.add_argument("--settings", "-s", action="store_true", help="설정 출력")
    
    args = parser.parse_args()
    
    processor = PromptProcessor(args.file)
    
    if args.interactive:
        processor.interactive_mode()
    elif args.add:
        processor.add_prompt(args.add[0], args.add[1])
        processor.save_data()
    elif args.list:
        processor.list_prompts()
    elif args.remove is not None:
        processor.remove_prompt(args.remove)
        processor.save_data()
    elif args.update:
        try:
            prompt_id = int(args.update[0])
            processor.update_prompt(prompt_id, args.update[1], args.update[2])
            processor.save_data()
        except ValueError:
            print("올바른 ID를 입력해주세요.")
    elif args.settings:
        processor.show_settings()
    else:
        # 기본적으로 대화형 모드 실행
        processor.interactive_mode()

if __name__ == "__main__":
    main() 