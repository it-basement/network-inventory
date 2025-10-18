#!/usr/bin/env python3
"""
Backend API Testing for Network Scanner Application
Tests all backend endpoints with real API calls
"""

import requests
import json
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'http://localhost:8001')
API_BASE = f"{BACKEND_URL}/api"

class NetworkScannerAPITest:
    def __init__(self):
        self.scan_id = None
        self.device_id = None
        
    def test_api_health(self):
        """Test basic API health check"""
        print("🔍 Testing API Health Check...")
        try:
            response = requests.get(f"{API_BASE}/", timeout=10)
            print(f"   Status Code: {response.status_code}")
            print(f"   Response: {response.json()}")
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "Network Scanner API" in data["message"]:
                    print("   ✅ API Health Check PASSED")
                    return True
                else:
                    print("   ❌ API Health Check FAILED - Unexpected response format")
                    return False
            else:
                print("   ❌ API Health Check FAILED - Non-200 status code")
                return False
                
        except Exception as e:
            print(f"   ❌ API Health Check FAILED - Exception: {str(e)}")
            return False
    
    def test_network_discovery_scan(self):
        """Test network discovery scan with localhost"""
        print("\n🔍 Testing Network Discovery Scan...")
        try:
            # Test with localhost only for safety
            scan_data = {
                "network_range": "127.0.0.1/32"
            }
            
            response = requests.post(
                f"{API_BASE}/scan/discover", 
                json=scan_data,
                timeout=30
            )
            
            print(f"   Status Code: {response.status_code}")
            print(f"   Response: {response.json()}")
            
            if response.status_code == 200:
                data = response.json()
                if "scan_id" in data and "status" in data:
                    self.scan_id = data["scan_id"]
                    print(f"   ✅ Network Discovery Scan STARTED - Scan ID: {self.scan_id}")
                    return True
                else:
                    print("   ❌ Network Discovery Scan FAILED - Missing required fields")
                    return False
            else:
                print("   ❌ Network Discovery Scan FAILED - Non-200 status code")
                return False
                
        except Exception as e:
            print(f"   ❌ Network Discovery Scan FAILED - Exception: {str(e)}")
            return False
    
    def test_scan_status_check(self):
        """Test scan status check"""
        print("\n🔍 Testing Scan Status Check...")
        if not self.scan_id:
            print("   ❌ Scan Status Check SKIPPED - No scan_id available")
            return False
            
        try:
            response = requests.get(f"{API_BASE}/scan/status/{self.scan_id}", timeout=10)
            print(f"   Status Code: {response.status_code}")
            print(f"   Response: {response.json()}")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ["scan_id", "status", "progress", "total_devices", "message"]
                if all(field in data for field in required_fields):
                    print("   ✅ Scan Status Check PASSED")
                    
                    # Wait for scan to complete if still running
                    if data["status"] == "running":
                        print("   ⏳ Waiting for scan to complete...")
                        max_wait = 60  # 60 seconds max wait
                        wait_time = 0
                        while wait_time < max_wait:
                            time.sleep(5)
                            wait_time += 5
                            status_response = requests.get(f"{API_BASE}/scan/status/{self.scan_id}", timeout=10)
                            if status_response.status_code == 200:
                                status_data = status_response.json()
                                print(f"   Progress: {status_data.get('progress', 0)}% - Status: {status_data.get('status', 'unknown')}")
                                if status_data.get("status") in ["completed", "failed"]:
                                    break
                    
                    return True
                else:
                    print("   ❌ Scan Status Check FAILED - Missing required fields")
                    return False
            else:
                print("   ❌ Scan Status Check FAILED - Non-200 status code")
                return False
                
        except Exception as e:
            print(f"   ❌ Scan Status Check FAILED - Exception: {str(e)}")
            return False
    
    def test_get_devices(self):
        """Test get all devices endpoint"""
        print("\n🔍 Testing Get Devices...")
        try:
            response = requests.get(f"{API_BASE}/devices", timeout=10)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                devices = response.json()
                print(f"   Found {len(devices)} devices")
                
                if devices:
                    # Store first device ID for later tests
                    self.device_id = devices[0].get("id")
                    print(f"   Sample device: {devices[0].get('ip_address', 'N/A')} - {devices[0].get('hostname', 'N/A')}")
                
                print("   ✅ Get Devices PASSED")
                return True
            else:
                print("   ❌ Get Devices FAILED - Non-200 status code")
                return False
                
        except Exception as e:
            print(f"   ❌ Get Devices FAILED - Exception: {str(e)}")
            return False
    
    def test_get_scan_history(self):
        """Test get scan history endpoint"""
        print("\n🔍 Testing Get Scan History...")
        try:
            response = requests.get(f"{API_BASE}/scans", timeout=10)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                scans = response.json()
                print(f"   Found {len(scans)} scans in history")
                
                if scans:
                    print(f"   Latest scan: {scans[0].get('network_range', 'N/A')} - {scans[0].get('total_devices', 0)} devices")
                
                print("   ✅ Get Scan History PASSED")
                return True
            else:
                print("   ❌ Get Scan History FAILED - Non-200 status code")
                return False
                
        except Exception as e:
            print(f"   ❌ Get Scan History FAILED - Exception: {str(e)}")
            return False
    
    def test_get_device_details(self):
        """Test get specific device details"""
        print("\n🔍 Testing Get Device Details...")
        if not self.device_id:
            print("   ❌ Get Device Details SKIPPED - No device_id available")
            return False
            
        try:
            response = requests.get(f"{API_BASE}/devices/{self.device_id}", timeout=10)
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 200:
                device = response.json()
                print(f"   Device: {device.get('ip_address', 'N/A')} - {device.get('hostname', 'N/A')}")
                print("   ✅ Get Device Details PASSED")
                return True
            elif response.status_code == 404:
                print("   ⚠️  Get Device Details - Device not found (expected if no devices)")
                return True
            else:
                print("   ❌ Get Device Details FAILED - Unexpected status code")
                return False
                
        except Exception as e:
            print(f"   ❌ Get Device Details FAILED - Exception: {str(e)}")
            return False
    
    def test_invalid_network_range(self):
        """Test API error handling with invalid network range"""
        print("\n🔍 Testing Invalid Network Range Handling...")
        try:
            scan_data = {
                "network_range": "invalid_range"
            }
            
            response = requests.post(
                f"{API_BASE}/scan/discover", 
                json=scan_data,
                timeout=10
            )
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 400:
                print("   ✅ Invalid Network Range Handling PASSED - Correctly rejected invalid input")
                return True
            else:
                print("   ❌ Invalid Network Range Handling FAILED - Should return 400 for invalid input")
                return False
                
        except Exception as e:
            print(f"   ❌ Invalid Network Range Handling FAILED - Exception: {str(e)}")
            return False
    
    def test_nonexistent_scan_status(self):
        """Test scan status with non-existent scan ID"""
        print("\n🔍 Testing Non-existent Scan Status...")
        try:
            fake_scan_id = "00000000-0000-0000-0000-000000000000"
            response = requests.get(f"{API_BASE}/scan/status/{fake_scan_id}", timeout=10)
            
            print(f"   Status Code: {response.status_code}")
            
            if response.status_code == 404:
                print("   ✅ Non-existent Scan Status PASSED - Correctly returned 404")
                return True
            else:
                print("   ❌ Non-existent Scan Status FAILED - Should return 404 for non-existent scan")
                return False
                
        except Exception as e:
            print(f"   ❌ Non-existent Scan Status FAILED - Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all backend API tests"""
        print("=" * 60)
        print("🚀 STARTING NETWORK SCANNER BACKEND API TESTS")
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        tests = [
            ("API Health Check", self.test_api_health),
            ("Network Discovery Scan", self.test_network_discovery_scan),
            ("Scan Status Check", self.test_scan_status_check),
            ("Get Devices", self.test_get_devices),
            ("Get Scan History", self.test_get_scan_history),
            ("Get Device Details", self.test_get_device_details),
            ("Invalid Network Range", self.test_invalid_network_range),
            ("Non-existent Scan Status", self.test_nonexistent_scan_status),
        ]
        
        results = []
        for test_name, test_func in tests:
            try:
                result = test_func()
                results.append((test_name, result))
            except Exception as e:
                print(f"   ❌ {test_name} FAILED - Unexpected error: {str(e)}")
                results.append((test_name, False))
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        passed = 0
        failed = 0
        
        for test_name, result in results:
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{test_name}: {status}")
            if result:
                passed += 1
            else:
                failed += 1
        
        print(f"\nTotal Tests: {len(results)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        print(f"Success Rate: {(passed/len(results)*100):.1f}%")
        
        return passed, failed, results


if __name__ == "__main__":
    tester = NetworkScannerAPITest()
    passed, failed, results = tester.run_all_tests()
    
    # Exit with error code if any tests failed
    exit(0 if failed == 0 else 1)