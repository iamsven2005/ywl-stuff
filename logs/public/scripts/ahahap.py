import socket
def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # Use a dummy connection to determine the preferred outbound IP
        s.connect(("8.8.8.8", 80))
        return s.getsockname()[0]
    finally:
        s.close()

local_ip = get_local_ip()
print(local_ip)
server_url = f"http://{local_ip}:3000/api/screenshot/{local_ip}"
