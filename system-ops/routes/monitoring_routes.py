"""
Rotas para Monitoramento Avançado
Endpoints para métricas, alertas, dashboards e health checks
"""

import logging
from typing import List, Optional
from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from fastapi.responses import HTMLResponse

from models.monitoring import (
    MetricsRequest, AlertsRequest, AlertRule, Alert,
    MonitoringOverview, MetricSeries, MonitoringResponse,
    SystemMetrics, HealthCheck, AlertSeverity, AlertStatus
)
from services.monitoring_service import monitoring_service
from utils.callbacks import callback_manager

logger = logging.getLogger(__name__)
router = APIRouter()

# ===========================
# ENDPOINTS DE MÉTRICAS
# ===========================

@router.get("/metrics/current", response_model=dict)
async def get_current_metrics():
    """Obtém as métricas atuais do sistema"""
    try:
        metrics = await monitoring_service.get_current_metrics()
        return {
            "success": True,
            "data": metrics,
            "count": len(metrics)
        }
    except Exception as e:
        logger.error(f"Erro ao obter métricas atuais: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/metrics/series", response_model=List[MetricSeries])
async def get_metric_series(request: MetricsRequest):
    """Obtém séries temporais de métricas"""
    try:
        series = await monitoring_service.get_metric_series(request)
        return series
    except Exception as e:
        logger.error(f"Erro ao obter séries de métricas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/metrics/names", response_model=List[str])
async def get_metric_names():
    """Lista todos os nomes de métricas disponíveis"""
    try:
        metrics = await monitoring_service.get_current_metrics()
        return list(metrics.keys())
    except Exception as e:
        logger.error(f"Erro ao listar nomes de métricas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# ENDPOINTS DE ALERTAS
# ===========================

@router.get("/alerts", response_model=List[Alert])
async def list_alerts(
    status: Optional[AlertStatus] = Query(default=None, description="Filtrar por status"),
    severity: Optional[AlertSeverity] = Query(default=None, description="Filtrar por severidade")
):
    """Lista alertas com filtros opcionais"""
    try:
        request = AlertsRequest(status=status, severity=severity)
        alerts = await monitoring_service.get_active_alerts(request)
        return alerts
    except Exception as e:
        logger.error(f"Erro ao listar alertas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/alerts/rules", response_model=MonitoringResponse)
async def add_alert_rule(
    rule: AlertRule,
    background_tasks: BackgroundTasks
):
    """Adiciona nova regra de alerta"""
    try:
        result = await monitoring_service.add_alert_rule(rule)

        # Callback assíncrono
        background_tasks.add_task(
            callback_manager.send_callback,
            "/monitoring/alert-rule/created",
            {
                "rule_id": rule.id,
                "rule_name": rule.name,
                "severity": rule.severity.value,
                "result": result.dict()
            }
        )

        return result
    except Exception as e:
        logger.error(f"Erro ao adicionar regra de alerta: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/alerts/{alert_id}/acknowledge", response_model=MonitoringResponse)
async def acknowledge_alert(
    alert_id: str,
    background_tasks: BackgroundTasks
):
    """Confirma um alerta"""
    try:
        result = await monitoring_service.acknowledge_alert(alert_id)

        # Callback assíncrono
        background_tasks.add_task(
            callback_manager.send_callback,
            "/monitoring/alert/acknowledged",
            {
                "alert_id": alert_id,
                "acknowledged_at": result.timestamp.isoformat(),
                "result": result.dict()
            }
        )

        return result
    except Exception as e:
        logger.error(f"Erro ao confirmar alerta: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts/rules", response_model=List[AlertRule])
async def list_alert_rules():
    """Lista todas as regras de alerta configuradas"""
    try:
        rules = list(monitoring_service.alert_rules.values())
        return rules
    except Exception as e:
        logger.error(f"Erro ao listar regras de alerta: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# ENDPOINTS DE HEALTH CHECKS
# ===========================

@router.get("/health", response_model=MonitoringOverview)
async def get_monitoring_overview():
    """Obtém visão geral do monitoramento e saúde do sistema"""
    try:
        overview = await monitoring_service.get_monitoring_overview()
        return overview
    except Exception as e:
        logger.error(f"Erro ao obter visão geral do monitoramento: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health/components", response_model=List[HealthCheck])
async def get_component_health():
    """Obtém status de saúde de todos os componentes"""
    try:
        components = list(monitoring_service.health_checks.values())
        return components
    except Exception as e:
        logger.error(f"Erro ao obter saúde dos componentes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health/components/{component_name}", response_model=HealthCheck)
async def get_specific_component_health(component_name: str):
    """Obtém status de saúde de um componente específico"""
    try:
        if component_name not in monitoring_service.health_checks:
            raise HTTPException(status_code=404, detail=f"Componente {component_name} não encontrado")

        return monitoring_service.health_checks[component_name]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao obter saúde do componente {component_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# ENDPOINTS DE DASHBOARD
# ===========================

@router.get("/dashboard/system", response_model=dict)
async def get_system_dashboard_data():
    """Obtém dados para dashboard do sistema"""
    try:
        # Métricas principais
        current_metrics = await monitoring_service.get_current_metrics()

        # Alertas ativos
        active_alerts = await monitoring_service.get_active_alerts()

        # Health checks
        components = list(monitoring_service.health_checks.values())

        # Resumo do sistema
        system_summary = {
            "cpu_usage": current_metrics.get("system.cpu_percent", {}).get("value", 0),
            "memory_usage": current_metrics.get("system.memory_percent", {}).get("value", 0),
            "disk_usage": current_metrics.get("system.disk_percent", {}).get("value", 0),
            "docker_containers": current_metrics.get("docker.containers_running", {}).get("value", 0),
            "active_alerts": len(active_alerts),
            "critical_alerts": len([a for a in active_alerts if a.severity == AlertSeverity.CRITICAL])
        }

        return {
            "success": True,
            "data": {
                "summary": system_summary,
                "metrics": current_metrics,
                "alerts": [alert.dict() for alert in active_alerts],
                "components": [comp.dict() for comp in components]
            }
        }
    except Exception as e:
        logger.error(f"Erro ao obter dados do dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ===========================
# PÁGINAS DE DASHBOARD HTML
# ===========================

@router.get("/dashboard/html", response_class=HTMLResponse)
async def monitoring_dashboard():
    """Dashboard HTML para monitoramento em tempo real"""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>NetPilot - System Monitoring Dashboard</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: #f5f5f5;
                padding: 20px;
            }
            .header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                border-radius: 10px;
                margin-bottom: 20px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .dashboard-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                margin-bottom: 20px;
            }
            .card {
                background: white;
                border-radius: 10px;
                padding: 20px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                border-left: 4px solid #667eea;
            }
            .card h3 {
                margin-bottom: 15px;
                color: #333;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .metric-value {
                font-size: 2.5em;
                font-weight: bold;
                margin: 10px 0;
            }
            .metric-label {
                color: #666;
                font-size: 0.9em;
            }
            .status-healthy { color: #4CAF50; }
            .status-warning { color: #FF9800; }
            .status-critical { color: #F44336; }
            .progress-bar {
                width: 100%;
                height: 10px;
                background: #eee;
                border-radius: 5px;
                overflow: hidden;
                margin: 10px 0;
            }
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #4CAF50, #8BC34A);
                transition: width 0.3s ease;
            }
            .progress-fill.warning { background: linear-gradient(90deg, #FF9800, #FFC107); }
            .progress-fill.critical { background: linear-gradient(90deg, #F44336, #E57373); }
            .alerts-container {
                max-height: 300px;
                overflow-y: auto;
            }
            .alert-item {
                padding: 10px;
                margin: 5px 0;
                border-radius: 5px;
                border-left: 4px solid;
            }
            .alert-critical { border-left-color: #F44336; background: #ffebee; }
            .alert-high { border-left-color: #FF9800; background: #fff3e0; }
            .alert-medium { border-left-color: #2196F3; background: #e3f2fd; }
            .alert-low { border-left-color: #4CAF50; background: #e8f5e8; }
            .controls {
                margin: 20px 0;
                text-align: center;
            }
            .btn {
                padding: 10px 20px;
                margin: 0 10px;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
                transition: background 0.3s;
            }
            .btn-primary { background: #667eea; color: white; }
            .btn-primary:hover { background: #5a6fd8; }
            .btn-success { background: #4CAF50; color: white; }
            .btn-success:hover { background: #45a049; }
            .timestamp {
                color: #888;
                font-size: 0.8em;
                margin-top: 10px;
            }
            .component-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 10px;
            }
            .component-item {
                padding: 15px;
                border-radius: 8px;
                text-align: center;
                font-weight: bold;
            }
            .loading {
                text-align: center;
                padding: 20px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🖥️ NetPilot System Monitoring Dashboard</h1>
            <p>Real-time system monitoring and alerting</p>
        </div>

        <div class="controls">
            <button class="btn btn-primary" onclick="refreshData()">🔄 Refresh</button>
            <button class="btn btn-success" onclick="toggleAutoRefresh()">⏰ Auto Refresh: <span id="auto-status">ON</span></button>
            <span class="timestamp">Last Update: <span id="last-update">Never</span></span>
        </div>

        <div class="dashboard-grid">
            <!-- System Metrics -->
            <div class="card">
                <h3>💻 System Resources</h3>
                <div>
                    <div class="metric-label">CPU Usage</div>
                    <div class="metric-value status-healthy" id="cpu-value">--%</div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="cpu-progress"></div>
                    </div>
                </div>
                <div>
                    <div class="metric-label">Memory Usage</div>
                    <div class="metric-value status-healthy" id="memory-value">--%</div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="memory-progress"></div>
                    </div>
                </div>
                <div>
                    <div class="metric-label">Disk Usage</div>
                    <div class="metric-value status-healthy" id="disk-value">--%</div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="disk-progress"></div>
                    </div>
                </div>
            </div>

            <!-- Docker Stats -->
            <div class="card">
                <h3>🐳 Docker Status</h3>
                <div>
                    <div class="metric-label">Running Containers</div>
                    <div class="metric-value status-healthy" id="docker-containers">--</div>
                </div>
                <div>
                    <div class="metric-label">Total Images</div>
                    <div class="metric-value" id="docker-images">--</div>
                </div>
                <div>
                    <div class="metric-label">Total Volumes</div>
                    <div class="metric-value" id="docker-volumes">--</div>
                </div>
            </div>

            <!-- Alerts -->
            <div class="card">
                <h3>🚨 Active Alerts</h3>
                <div>
                    <div class="metric-label">Total Alerts</div>
                    <div class="metric-value" id="alerts-total">--</div>
                </div>
                <div>
                    <div class="metric-label">Critical Alerts</div>
                    <div class="metric-value status-critical" id="alerts-critical">--</div>
                </div>
                <div class="alerts-container" id="alerts-list">
                    <div class="loading">Loading alerts...</div>
                </div>
            </div>

            <!-- Components Health -->
            <div class="card">
                <h3>🛡️ Components Health</h3>
                <div class="component-grid" id="components-grid">
                    <div class="loading">Loading components...</div>
                </div>
            </div>
        </div>

        <script>
            let autoRefresh = true;
            let refreshInterval;

            function updateProgressBar(elementId, value, warningThreshold = 70, criticalThreshold = 90) {
                const progressBar = document.getElementById(elementId);
                const percentage = Math.min(100, Math.max(0, value));

                progressBar.style.width = percentage + '%';
                progressBar.className = 'progress-fill';

                if (percentage >= criticalThreshold) {
                    progressBar.classList.add('critical');
                } else if (percentage >= warningThreshold) {
                    progressBar.classList.add('warning');
                }
            }

            function updateStatusClass(elementId, value, warningThreshold = 70, criticalThreshold = 90) {
                const element = document.getElementById(elementId);
                element.className = 'metric-value';

                if (value >= criticalThreshold) {
                    element.classList.add('status-critical');
                } else if (value >= warningThreshold) {
                    element.classList.add('status-warning');
                } else {
                    element.classList.add('status-healthy');
                }
            }

            async function refreshData() {
                try {
                    const response = await fetch('/monitoring/dashboard/system');
                    const data = await response.json();

                    if (data.success) {
                        const summary = data.data.summary;
                        const alerts = data.data.alerts;
                        const components = data.data.components;

                        // Update system metrics
                        document.getElementById('cpu-value').textContent = summary.cpu_usage.toFixed(1) + '%';
                        document.getElementById('memory-value').textContent = summary.memory_usage.toFixed(1) + '%';
                        document.getElementById('disk-value').textContent = summary.disk_usage.toFixed(1) + '%';

                        updateProgressBar('cpu-progress', summary.cpu_usage);
                        updateProgressBar('memory-progress', summary.memory_usage);
                        updateProgressBar('disk-progress', summary.disk_usage);

                        updateStatusClass('cpu-value', summary.cpu_usage);
                        updateStatusClass('memory-value', summary.memory_usage);
                        updateStatusClass('disk-value', summary.disk_usage);

                        // Update Docker stats
                        document.getElementById('docker-containers').textContent = summary.docker_containers;

                        // Update alerts
                        document.getElementById('alerts-total').textContent = summary.active_alerts;
                        document.getElementById('alerts-critical').textContent = summary.critical_alerts;

                        // Update alerts list
                        const alertsList = document.getElementById('alerts-list');
                        if (alerts.length === 0) {
                            alertsList.innerHTML = '<div style="color: #4CAF50; text-align: center;">✅ No active alerts</div>';
                        } else {
                            alertsList.innerHTML = alerts.map(alert => `
                                <div class="alert-item alert-${alert.severity}">
                                    <strong>${alert.rule_name}</strong><br>
                                    <small>${alert.message}</small><br>
                                    <small>Since: ${new Date(alert.started_at).toLocaleTimeString()}</small>
                                </div>
                            `).join('');
                        }

                        // Update components
                        const componentsGrid = document.getElementById('components-grid');
                        componentsGrid.innerHTML = components.map(comp => `
                            <div class="component-item status-${comp.status}">
                                ${comp.component.toUpperCase()}<br>
                                <small>${comp.status}</small>
                            </div>
                        `).join('');

                        document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
                    }
                } catch (error) {
                    console.error('Error refreshing data:', error);
                }
            }

            function toggleAutoRefresh() {
                autoRefresh = !autoRefresh;
                document.getElementById('auto-status').textContent = autoRefresh ? 'ON' : 'OFF';

                if (autoRefresh) {
                    startAutoRefresh();
                } else {
                    clearInterval(refreshInterval);
                }
            }

            function startAutoRefresh() {
                refreshInterval = setInterval(refreshData, 10000); // 10 seconds
            }

            // Initialize
            refreshData();
            startAutoRefresh();
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

# ===========================
# ENDPOINTS DE ESTATÍSTICAS
# ===========================

@router.get("/stats/summary", response_model=dict)
async def get_monitoring_stats():
    """Obtém estatísticas resumidas do monitoramento"""
    try:
        overview = await monitoring_service.get_monitoring_overview()
        current_metrics = await monitoring_service.get_current_metrics()

        stats = {
            "system_status": overview.system_status.value,
            "total_metrics": len(current_metrics),
            "active_alerts": overview.active_alerts,
            "critical_alerts": overview.critical_alerts,
            "services_monitored": len(overview.components),
            "uptime_hours": current_metrics.get("system.uptime_seconds", {}).get("value", 0) / 3600,
            "collection_interval": monitoring_service.collection_interval,
            "last_collection": overview.last_update.isoformat()
        }

        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        logger.error(f"Erro ao obter estatísticas: {e}")
        raise HTTPException(status_code=500, detail=str(e))