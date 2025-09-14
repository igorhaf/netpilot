#!/usr/bin/env python3
"""
Mock application for port 8989 to simulate the main meadadigital.com service
"""
from http.server import HTTPServer, SimpleHTTPRequestHandler
import json

class MockHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        
        html = """
<!DOCTYPE html>
<html>
<head>
    <title>Meada Digital - Main Site</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; }
        h1 { color: #333; }
        .status { background: #e8f5e8; padding: 15px; border-radius: 4px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌐 Meada Digital - Main Website</h1>
        <div class="status">
            <strong>Status:</strong> Mock service running on port 8989<br>
            <strong>Domain:</strong> meadadigital.com<br>
            <strong>Accessed via:</strong> Traefik proxy
        </div>
        <p>This is a mock application simulating the main meadadigital.com website.</p>
        <p>In production, this would be your actual main website/application.</p>
    </div>
</body>
</html>
        """
        self.wfile.write(html.encode())

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 8989), MockHandler)
    print("Mock app running on http://0.0.0.0:8989")
    print("Simulating main meadadigital.com service")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down mock server...")
        server.shutdown()
