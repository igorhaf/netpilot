"""
WebSocket Routes para streaming em tempo real
Endpoints WebSocket para logs Docker, métricas do sistema e eventos
"""

import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import HTMLResponse

from services.websocket_service import connection_manager

logger = logging.getLogger(__name__)
router = APIRouter()

# ===========================
# WEBSOCKET ENDPOINTS
# ===========================

@router.websocket("/docker/logs/{container_id}")
async def websocket_docker_logs(websocket: WebSocket, container_id: str):
    """WebSocket para streaming de logs de container em tempo real"""
    try:
        await connection_manager.connect_docker_logs(websocket, container_id)

        # Manter conexão ativa
        while True:
            try:
                # Aguardar mensagens do cliente (heartbeat ou comandos)
                data = await websocket.receive_text()
                logger.debug(f"📨 Mensagem recebida do cliente: {data}")
            except WebSocketDisconnect:
                break

    except Exception as e:
        logger.error(f"❌ Erro no WebSocket de logs do container {container_id}: {e}")
    finally:
        await connection_manager.disconnect_docker_logs(websocket, container_id)
        logger.info(f"🔌 WebSocket desconectado dos logs do container {container_id}")

@router.websocket("/system/metrics")
async def websocket_system_metrics(websocket: WebSocket):
    """WebSocket para streaming de métricas do sistema em tempo real"""
    try:
        await connection_manager.connect_system_metrics(websocket)

        # Manter conexão ativa
        while True:
            try:
                # Aguardar mensagens do cliente (heartbeat ou comandos)
                data = await websocket.receive_text()
                logger.debug(f"📨 Mensagem recebida do cliente: {data}")
            except WebSocketDisconnect:
                break

    except Exception as e:
        logger.error(f"❌ Erro no WebSocket de métricas do sistema: {e}")
    finally:
        await connection_manager.disconnect_system_metrics(websocket)
        logger.info("🔌 WebSocket desconectado das métricas do sistema")

@router.websocket("/docker/events")
async def websocket_docker_events(websocket: WebSocket):
    """WebSocket para streaming de eventos do Docker em tempo real"""
    try:
        await connection_manager.connect_docker_events(websocket)

        # Manter conexão ativa
        while True:
            try:
                # Aguardar mensagens do cliente (heartbeat ou comandos)
                data = await websocket.receive_text()
                logger.debug(f"📨 Mensagem recebida do cliente: {data}")
            except WebSocketDisconnect:
                break

    except Exception as e:
        logger.error(f"❌ Erro no WebSocket de eventos do Docker: {e}")
    finally:
        await connection_manager.disconnect_docker_events(websocket)
        logger.info("🔌 WebSocket desconectado dos eventos do Docker")

# ===========================
# PÁGINAS DE TESTE
# ===========================

@router.get("/test/docker-logs/{container_id}")
async def test_docker_logs_page(container_id: str):
    """Página de teste para WebSocket de logs do Docker"""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Docker Logs - {container_id}</title>
        <style>
            body {{ font-family: monospace; margin: 20px; }}
            #logs {{
                background: #000;
                color: #0f0;
                padding: 10px;
                height: 400px;
                overflow-y: scroll;
                border: 1px solid #ccc;
                white-space: pre-wrap;
            }}
            .controls {{ margin: 10px 0; }}
            button {{ padding: 5px 10px; margin-right: 10px; }}
            .connected {{ color: green; }}
            .disconnected {{ color: red; }}
            .log-entry {{ margin: 2px 0; }}
            .timestamp {{ color: #888; }}
        </style>
    </head>
    <body>
        <h1>Docker Logs - Container: {container_id}</h1>

        <div class="controls">
            <button onclick="connect()">Connect</button>
            <button onclick="disconnect()">Disconnect</button>
            <button onclick="clearLogs()">Clear</button>
            <span id="status" class="disconnected">Disconnected</span>
        </div>

        <div id="logs"></div>

        <script>
            let ws = null;
            const logsDiv = document.getElementById('logs');
            const statusDiv = document.getElementById('status');

            function connect() {{
                if (ws) {{
                    ws.close();
                }}

                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = `${{protocol}}//${{window.location.host}}/ws/docker/logs/{container_id}`;

                ws = new WebSocket(wsUrl);

                ws.onopen = function(event) {{
                    statusDiv.textContent = 'Connected';
                    statusDiv.className = 'connected';
                    addLog('🔗 Connected to WebSocket', 'system');
                }};

                ws.onmessage = function(event) {{
                    const data = JSON.parse(event.data);
                    addLog(data.message, 'log', data.timestamp);
                }};

                ws.onclose = function(event) {{
                    statusDiv.textContent = 'Disconnected';
                    statusDiv.className = 'disconnected';
                    addLog('🔌 Disconnected from WebSocket', 'system');
                }};

                ws.onerror = function(event) {{
                    addLog('❌ WebSocket error', 'error');
                }};
            }}

            function disconnect() {{
                if (ws) {{
                    ws.close();
                    ws = null;
                }}
            }}

            function clearLogs() {{
                logsDiv.innerHTML = '';
            }}

            function addLog(message, type, timestamp) {{
                const logEntry = document.createElement('div');
                logEntry.className = 'log-entry';

                const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
                const timestampSpan = `<span class="timestamp">[${timeStr}]</span> `;

                logEntry.innerHTML = timestampSpan + escapeHtml(message);
                logsDiv.appendChild(logEntry);
                logsDiv.scrollTop = logsDiv.scrollHeight;
            }}

            function escapeHtml(text) {{
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }}

            // Auto-connect on page load
            window.onload = function() {{
                connect();
            }};
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@router.get("/test/system-metrics")
async def test_system_metrics_page():
    """Página de teste para WebSocket de métricas do sistema"""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>System Metrics Real-time</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
            .metric-card {
                border: 1px solid #ccc;
                padding: 15px;
                border-radius: 5px;
                background: #f9f9f9;
            }
            .metric-value { font-size: 1.5em; font-weight: bold; color: #2196F3; }
            .controls { margin: 10px 0; }
            button { padding: 5px 10px; margin-right: 10px; }
            .connected { color: green; }
            .disconnected { color: red; }
            .container-stats { margin-top: 10px; }
            .container-item {
                padding: 5px;
                margin: 5px 0;
                background: white;
                border-left: 3px solid #2196F3;
            }
        </style>
    </head>
    <body>
        <h1>🖥️ System Metrics Real-time</h1>

        <div class="controls">
            <button onclick="connect()">Connect</button>
            <button onclick="disconnect()">Disconnect</button>
            <span id="status" class="disconnected">Disconnected</span>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <h3>🐳 Docker Containers</h3>
                <div class="metric-value" id="containers-running">-</div>
                <div>Running / <span id="containers-total">-</span> Total</div>
            </div>

            <div class="metric-card">
                <h3>📦 Images</h3>
                <div class="metric-value" id="images-total">-</div>
                <div>Total Images</div>
            </div>

            <div class="metric-card">
                <h3>💾 Volumes</h3>
                <div class="metric-value" id="volumes-total">-</div>
                <div>Total Volumes</div>
            </div>

            <div class="metric-card">
                <h3>🌐 Networks</h3>
                <div class="metric-value" id="networks-total">-</div>
                <div>Total Networks</div>
            </div>
        </div>

        <div class="metric-card" style="margin-top: 20px;">
            <h3>📊 Top Container Stats</h3>
            <div id="container-stats" class="container-stats">
                <div>No data available</div>
            </div>
        </div>

        <script>
            let ws = null;
            const statusDiv = document.getElementById('status');

            function connect() {
                if (ws) {
                    ws.close();
                }

                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = `${protocol}//${window.location.host}/ws/system/metrics`;

                ws = new WebSocket(wsUrl);

                ws.onopen = function(event) {
                    statusDiv.textContent = 'Connected';
                    statusDiv.className = 'connected';
                };

                ws.onmessage = function(event) {
                    const data = JSON.parse(event.data);
                    updateMetrics(data);
                };

                ws.onclose = function(event) {
                    statusDiv.textContent = 'Disconnected';
                    statusDiv.className = 'disconnected';
                };

                ws.onerror = function(event) {
                    console.error('WebSocket error:', event);
                };
            }

            function disconnect() {
                if (ws) {
                    ws.close();
                    ws = null;
                }
            }

            function updateMetrics(data) {
                if (data.type === 'system_metrics') {
                    const dockerInfo = data.docker_info;

                    document.getElementById('containers-running').textContent = dockerInfo.containers_running;
                    document.getElementById('containers-total').textContent = dockerInfo.containers_total;
                    document.getElementById('images-total').textContent = dockerInfo.images;
                    document.getElementById('volumes-total').textContent = dockerInfo.volumes;
                    document.getElementById('networks-total').textContent = dockerInfo.networks;

                    // Update container stats
                    const containerStatsDiv = document.getElementById('container-stats');
                    containerStatsDiv.innerHTML = '';

                    if (data.container_stats && data.container_stats.length > 0) {
                        data.container_stats.forEach(container => {
                            const div = document.createElement('div');
                            div.className = 'container-item';
                            div.innerHTML = `
                                <strong>${container.name}</strong><br>
                                CPU: ${container.cpu_usage}% |
                                Memory: ${container.memory_percent}%
                                (${(container.memory_usage / 1024 / 1024).toFixed(1)} MB)
                            `;
                            containerStatsDiv.appendChild(div);
                        });
                    } else {
                        containerStatsDiv.innerHTML = '<div>No running containers</div>';
                    }
                }
            }

            // Auto-connect on page load
            window.onload = function() {
                connect();
            };
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@router.get("/test/docker-events")
async def test_docker_events_page():
    """Página de teste para WebSocket de eventos do Docker"""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Docker Events Real-time</title>
        <style>
            body { font-family: monospace; margin: 20px; }
            #events {
                background: #000;
                color: #0f0;
                padding: 10px;
                height: 500px;
                overflow-y: scroll;
                border: 1px solid #ccc;
                white-space: pre-wrap;
            }
            .controls { margin: 10px 0; }
            button { padding: 5px 10px; margin-right: 10px; }
            .connected { color: green; }
            .disconnected { color: red; }
            .event-entry { margin: 2px 0; }
            .timestamp { color: #888; }
            .event-type { color: #ff0; }
            .action { color: #0ff; }
        </style>
    </head>
    <body>
        <h1>🐳 Docker Events Real-time</h1>

        <div class="controls">
            <button onclick="connect()">Connect</button>
            <button onclick="disconnect()">Disconnect</button>
            <button onclick="clearEvents()">Clear</button>
            <span id="status" class="disconnected">Disconnected</span>
        </div>

        <div id="events"></div>

        <script>
            let ws = null;
            const eventsDiv = document.getElementById('events');
            const statusDiv = document.getElementById('status');

            function connect() {
                if (ws) {
                    ws.close();
                }

                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = `${protocol}//${window.location.host}/ws/docker/events`;

                ws = new WebSocket(wsUrl);

                ws.onopen = function(event) {
                    statusDiv.textContent = 'Connected';
                    statusDiv.className = 'connected';
                    addEvent('🔗 Connected to Docker Events WebSocket', 'system');
                };

                ws.onmessage = function(event) {
                    const data = JSON.parse(event.data);
                    addEvent(formatEvent(data), 'event', data.timestamp);
                };

                ws.onclose = function(event) {
                    statusDiv.textContent = 'Disconnected';
                    statusDiv.className = 'disconnected';
                    addEvent('🔌 Disconnected from WebSocket', 'system');
                };

                ws.onerror = function(event) {
                    addEvent('❌ WebSocket error', 'error');
                };
            }

            function disconnect() {
                if (ws) {
                    ws.close();
                    ws = null;
                }
            }

            function clearEvents() {
                eventsDiv.innerHTML = '';
            }

            function formatEvent(data) {
                if (data.type === 'docker_event') {
                    const actor = data.actor || {};
                    const name = actor.Attributes?.name || actor.ID?.substring(0, 12) || 'unknown';
                    return `${data.event_type}: ${data.action} - ${name}`;
                }
                return JSON.stringify(data);
            }

            function addEvent(message, type, timestamp) {
                const eventEntry = document.createElement('div');
                eventEntry.className = 'event-entry';

                const timeStr = timestamp ? new Date(timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
                const timestampSpan = `<span class="timestamp">[${timeStr}]</span> `;

                eventEntry.innerHTML = timestampSpan + escapeHtml(message);
                eventsDiv.appendChild(eventEntry);
                eventsDiv.scrollTop = eventsDiv.scrollHeight;
            }

            function escapeHtml(text) {
                const div = document.createElement('div');
                div.textContent = text;
                return div.innerHTML;
            }

            // Auto-connect on page load
            window.onload = function() {
                connect();
            };
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)