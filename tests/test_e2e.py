#!/usr/bin/env python3
import os
import socket
import subprocess
import sys
import time

PORT = 5557
DATA_FILE = "data/users.txt"


def receive_response(client):
    return client.recv(4096).decode()


def wait_for_server(port, timeout_seconds=3):
    deadline = time.time() + timeout_seconds

    while time.time() < deadline:
        try:
            with socket.create_connection(("127.0.0.1", port), timeout=0.2):
                return True
        except OSError:
            time.sleep(0.05)

    return False


def run_e2e_tests():
    print("\n=== End-to-End TCP Server Tests ===")

    os.makedirs("data", exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8"):
        pass

    server_process = subprocess.Popen(
        ["./server", str(PORT)],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    passed = 0
    failed = 0

    try:
        if not wait_for_server(PORT):
            print("  ✗ Server did not start")
            return False

        client = socket.create_connection(("127.0.0.1", PORT), timeout=2)

        checks = [
            ("POST creates first user", "POST 1 100 200", "201 Created\n"),
            ("GET without recommendations", "GET 1 100", "200 Ok\n\n\n"),
            ("POST creates second user", "POST 2 100 300", "201 Created\n"),
        ]

        for name, command, expected in checks:
            client.sendall((command + "\n").encode())
            response = receive_response(client)
            if response == expected:
                print(f"  ✓ {name}")
                passed += 1
            else:
                print(f"  ✗ {name}: {response!r}")
                failed += 1

        client.sendall(b"GET 1 100\n")
        response = receive_response(client)
        if response == "200 Ok\n\n300\n":
            print("  ✓ GET returns a recommendation")
            passed += 1
        else:
            print(f"  ✗ GET returns a recommendation: {response!r}")
            failed += 1

        checks = [
            ("DELETE removes watched product", "DELETE 2 300", "204 No Content\n"),
            ("GET after deletion has no recommendation", "GET 1 100", "200 Ok\n\n\n"),
            ("GET missing user returns 404", "GET 999 123", "404 Not Found\n"),
            ("Invalid command returns 400", "INVALID", "400 Bad Request\n"),
        ]

        for name, command, expected in checks:
            client.sendall((command + "\n").encode())
            response = receive_response(client)
            if response == expected:
                print(f"  ✓ {name}")
                passed += 1
            else:
                print(f"  ✗ {name}: {response!r}")
                failed += 1

        client.sendall(b"help\n")
        response = receive_response(client)
        if all(command in response for command in ("POST", "GET", "PATCH", "DELETE", "help")):
            print("  ✓ HELP lists supported commands")
            passed += 1
        else:
            print(f"  ✗ HELP lists supported commands: {response!r}")
            failed += 1

        client.close()
    except OSError as error:
        print(f"  ✗ Socket error: {error}")
        failed += 1
    finally:
        server_process.terminate()
        try:
            server_process.wait(timeout=2)
        except subprocess.TimeoutExpired:
            server_process.kill()
            server_process.wait()

    print(f"\n  Results: {passed} passed, {failed} failed")
    return failed == 0


if __name__ == "__main__":
    sys.exit(0 if run_e2e_tests() else 1)
