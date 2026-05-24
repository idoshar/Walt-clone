#!/usr/bin/env python3
import subprocess
import socket
import time
import sys
import os

def run_e2e_tests():
    print("\n=== SCRUM-101: End-to-End Tests with Python Client ===")
    
    # Clear data file
    if os.path.exists("data/views.txt"):
        os.remove("data/views.txt")
    
    # Start server
    server_process = subprocess.Popen(["./server", "8080"], 
                                       stdout=subprocess.DEVNULL,
                                       stderr=subprocess.DEVNULL)
    time.sleep(1)
    
    passed = 0
    failed = 0
    
    try:
        # Connect Python client
        client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        client.connect(("127.0.0.1", 8080))
        
        # Test 1: POST
        client.send(b"POST 1 100 200\n")
        resp = client.recv(1024).decode()
        if resp == "204 No Content\n\n":
            print("  ✓ POST test passed")
            passed += 1
        else:
            print(f"  ✗ POST test failed: {repr(resp)}")
            failed += 1
        
        # Test 2: GET (empty)
        client.send(b"GET 1 100\n")
        resp = client.recv(1024).decode()
        if resp == "200 Ok\n\n\n":
            print("  ✓ GET (empty) test passed")
            passed += 1
        else:
            print(f"  ✗ GET (empty) test failed: {repr(resp)}")
            failed += 1
        
        # Test 3: POST second user
        client.send(b"POST 2 100 300\n")
        resp = client.recv(1024).decode()
        if resp == "204 No Content\n\n":
            print("  ✓ POST second user passed")
            passed += 1
        else:
            print(f"  ✗ POST second user failed: {repr(resp)}")
            failed += 1
        
        # Test 4: GET with recommendation
        client.send(b"GET 1 100\n")
        resp = client.recv(1024).decode()
        if "300" in resp and "200 Ok" in resp:
            print("  ✓ GET with recommendation passed")
            passed += 1
        else:
            print(f"  ✗ GET with recommendation failed: {repr(resp)}")
            failed += 1
        
        # Test 5: DELETE
        client.send(b"DELETE 2 300\n")
        resp = client.recv(1024).decode()
        if resp == "204 No Content\n\n":
            print("  ✓ DELETE test passed")
            passed += 1
        else:
            print(f"  ✗ DELETE test failed: {repr(resp)}")
            failed += 1
        
        # Test 6: GET after DELETE
        client.send(b"GET 1 100\n")
        resp = client.recv(1024).decode()
        if "300" not in resp:
            print("  ✓ GET after DELETE passed")
            passed += 1
        else:
            print(f"  ✗ GET after DELETE failed: {repr(resp)}")
            failed += 1
        
        # Test 7: HELP
        client.send(b"help\n")
        resp = client.recv(4096).decode()
        if "POST" in resp and "GET" in resp and "DELETE" in resp:
            print("  ✓ HELP test passed")
            passed += 1
        else:
            print(f"  ✗ HELP test failed")
            failed += 1
        
        # Test 8: 404
        client.send(b"GET 999 123\n")
        resp = client.recv(1024).decode()
        if resp == "404 Not Found\n\n":
            print("  ✓ 404 test passed")
            passed += 1
        else:
            print(f"  ✗ 404 test failed: {repr(resp)}")
            failed += 1
        
        # Test 9: 400
        client.send(b"INVALID\n")
        resp = client.recv(1024).decode()
        if resp == "400 Bad Request\n\n":
            print("  ✓ 400 test passed")
            passed += 1
        else:
            print(f"  ✗ 400 test failed: {repr(resp)}")
            failed += 1
        
        client.close()
        
    except Exception as e:
        print(f"  ✗ Exception: {e}")
        failed += 1
    
    server_process.terminate()
    
    print(f"\n  Results: {passed} passed, {failed} failed")
    
    return failed == 0

if __name__ == "__main__":
    success = run_e2e_tests()
    sys.exit(0 if success else 1)