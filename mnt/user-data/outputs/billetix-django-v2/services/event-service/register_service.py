import consul
import socket
import os
import time

def register_service(name, port):
    c = consul.Consul(host=os.environ.get("CONSUL_HOST", "localhost"))
    
    # Récupérer l'IP du conteneur
    ip = socket.gethostbyname(socket.gethostname())
    
    while True:
        try:
            c.agent.service.register(
                name,
                service_id=f"{name}-{ip}",
                address=ip,
                port=port,
                check=consul.Check.http(f"http://{ip}:{port}/api/auth/health/" if "auth" in name else f"http://{ip}:{port}/api/events/health/" if "event" in name else f"http://{ip}:{port}/api/bookings/health/", interval="10s")
            )
            print(f"Service {name} registered in Consul at {ip}:{port}")
            break
        except Exception as e:
            print(f"Failed to register in Consul, retrying... {e}")
            time.sleep(5)

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 2:
        register_service(sys.argv[1], int(sys.argv[2]))
