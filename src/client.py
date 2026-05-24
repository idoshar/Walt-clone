import socket
import sys


def main():
    if len(sys.argv) != 3:
        return 1

    server_ip = sys.argv[1]

    try:
        server_port = int(sys.argv[2])
    except ValueError:
        return 1

    if server_port < 1 or server_port > 65535:
        return 1

    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as client_socket:
            client_socket.connect((server_ip, server_port))

            while True:
                command = input()
                client_socket.sendall((command + "\n").encode())
                response = client_socket.recv(4096).decode()
                print(response, end="")

    except EOFError:
        return 0
    except OSError:
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())