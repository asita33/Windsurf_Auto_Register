"""
Windsurf Auto Register API客户端
用于从后端获取账号信息
"""

import requests
from typing import List, Dict, Optional
import json


class WindsurfAPIClient:
    """Windsurf后端API客户端"""
    
    def __init__(self, base_url: str, api_key: str):
        """
        初始化API客户端
        
        Args:
            base_url: 后端服务器地址
            api_key: API密钥
        """
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.headers = {
            'Content-Type': 'application/json',
            'X-API-Key': api_key
        }
    
    def get_accounts(self) -> List[Dict]:
        """
        获取所有账号
        
        Returns:
            账号列表，每个账号包含 email, password, service, createdAt
        """
        try:
            url = f"{self.base_url}/api/accounts"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            
            data = response.json()
            if data.get('success'):
                return data.get('accounts', [])
            else:
                print(f"❌ 获取账号失败: {data.get('error', '未知错误')}")
                return []
        except Exception as e:
            print(f"❌ 请求失败: {e}")
            return []
    
    def get_latest_account(self) -> Optional[Dict]:
        """
        获取最新的一个账号
        
        Returns:
            最新账号信息，如果没有则返回None
        """
        accounts = self.get_accounts()
        if accounts:
            # 按创建时间排序，返回最新的
            sorted_accounts = sorted(accounts, key=lambda x: x.get('createdAt', ''), reverse=True)
            return sorted_accounts[0]
        return None
    
    def generate_email(self) -> Optional[str]:
        """
        生成一个临时邮箱
        
        Returns:
            邮箱地址，失败返回None
        """
        try:
            url = f"{self.base_url}/api/generate-email"
            response = requests.post(url, headers=self.headers)
            response.raise_for_status()
            
            data = response.json()
            if data.get('success'):
                return data.get('email')
            else:
                print(f"❌ 生成邮箱失败: {data.get('error', '未知错误')}")
                return None
        except Exception as e:
            print(f"❌ 请求失败: {e}")
            return None
    
    def get_messages(self, email: str) -> List[Dict]:
        """
        获取邮箱的邮件列表
        
        Args:
            email: 邮箱地址
            
        Returns:
            邮件列表
        """
        try:
            url = f"{self.base_url}/api/get-messages/{email}"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            
            data = response.json()
            if data.get('success'):
                return data.get('messages', [])
            else:
                return []
        except Exception as e:
            print(f"❌ 获取邮件失败: {e}")
            return []
    
    def get_verification_code(self, email: str, message_id: str) -> Optional[str]:
        """
        获取邮件中的验证码
        
        Args:
            email: 邮箱地址
            message_id: 邮件ID
            
        Returns:
            验证码，如果没有则返回None
        """
        try:
            url = f"{self.base_url}/api/get-message/{email}/{message_id}"
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            
            data = response.json()
            if data.get('success'):
                return data.get('verificationCode')
            else:
                return None
        except Exception as e:
            print(f"❌ 获取验证码失败: {e}")
            return None
    
    def save_account(self, email: str, password: str, service: str = "Windsurf") -> bool:
        """
        保存账号到后端
        
        Args:
            email: 邮箱地址
            password: 密码
            service: 服务名称，默认为Windsurf
            
        Returns:
            是否保存成功
        """
        try:
            url = f"{self.base_url}/api/save-account"
            payload = {
                'email': email,
                'password': password,
                'service': service
            }
            response = requests.post(url, headers=self.headers, json=payload)
            response.raise_for_status()
            
            data = response.json()
            return data.get('success', False)
        except Exception as e:
            print(f"❌ 保存账号失败: {e}")
            return False


# 使用示例
if __name__ == "__main__":
    # 初始化客户端
  
    client = WindsurfAPIClient(BASE_URL, API_KEY)
    
    # 示例1：获取所有账号
    print("📋 获取所有账号...")
    accounts = client.get_accounts()
    print(f"✅ 共有 {len(accounts)} 个账号")
    for account in accounts:
        print(f"  - {account['email']} | {account['password']}")
    
    # 示例2：获取最新账号
    print("\n🆕 获取最新账号...")
    latest = client.get_latest_account()
    if latest:
        print(f"✅ 最新账号: {latest['email']} | {latest['password']}")
    else:
        print("❌ 没有账号")
    
    # 示例3：生成临时邮箱
    print("\n📧 生成临时邮箱...")
    email = client.generate_email()
    if email:
        print(f"✅ 生成邮箱: {email}")
    
    # 示例4：保存账号
    print("\n💾 保存账号...")
    success = client.save_account("test@example.com", "password123")
    if success:
        print("✅ 账号保存成功")
    else:
        print("❌ 账号保存失败")
