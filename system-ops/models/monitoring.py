"""
Modelos para monitoramento avançado do sistema
Pydantic models para métricas detalhadas, alertas e dashboards
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Literal, Union
from datetime import datetime
from enum import Enum

# ===========================
# ENUMS E TIPOS
# ===========================

class MetricType(str, Enum):
    """Tipos de métricas"""
    COUNTER = "counter"
    GAUGE = "gauge"
    HISTOGRAM = "histogram"
    SUMMARY = "summary"

class AlertSeverity(str, Enum):
    """Níveis de severidade de alertas"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertStatus(str, Enum):
    """Status de alertas"""
    ACTIVE = "active"
    RESOLVED = "resolved"
    ACKNOWLEDGED = "acknowledged"
    SUPPRESSED = "suppressed"

class MonitoringStatus(str, Enum):
    """Status do sistema de monitoramento"""
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    UNKNOWN = "unknown"

# ===========================
# MÉTRICAS DO SISTEMA
# ===========================

class SystemMetrics(BaseModel):
    """Métricas básicas do sistema"""
    timestamp: datetime = Field(..., description="Timestamp da coleta")
    cpu_usage_percent: float = Field(..., description="Uso de CPU em percentual")
    memory_total: int = Field(..., description="Memória total em bytes")
    memory_used: int = Field(..., description="Memória usada em bytes")
    memory_percent: float = Field(..., description="Percentual de memória usada")
    disk_total: int = Field(..., description="Espaço total em disco em bytes")
    disk_used: int = Field(..., description="Espaço usado em disco em bytes")
    disk_percent: float = Field(..., description="Percentual de disco usado")
    load_average: List[float] = Field(default_factory=list, description="Load average 1m, 5m, 15m")
    uptime_seconds: int = Field(..., description="Tempo de atividade em segundos")

class NetworkMetrics(BaseModel):
    """Métricas de rede"""
    interface: str = Field(..., description="Nome da interface")
    bytes_sent: int = Field(..., description="Bytes enviados")
    bytes_recv: int = Field(..., description="Bytes recebidos")
    packets_sent: int = Field(..., description="Pacotes enviados")
    packets_recv: int = Field(..., description="Pacotes recebidos")
    errors_in: int = Field(..., description="Erros de entrada")
    errors_out: int = Field(..., description="Erros de saída")
    drops_in: int = Field(..., description="Drops de entrada")
    drops_out: int = Field(..., description="Drops de saída")

class ProcessMetrics(BaseModel):
    """Métricas de processo específico"""
    pid: int = Field(..., description="Process ID")
    name: str = Field(..., description="Nome do processo")
    cpu_percent: float = Field(..., description="Uso de CPU do processo")
    memory_percent: float = Field(..., description="Uso de memória do processo")
    memory_rss: int = Field(..., description="RSS memory em bytes")
    memory_vms: int = Field(..., description="VMS memory em bytes")
    num_threads: int = Field(..., description="Número de threads")
    create_time: datetime = Field(..., description="Tempo de criação do processo")
    status: str = Field(..., description="Status do processo")

class ServiceMetrics(BaseModel):
    """Métricas de serviços específicos"""
    service_name: str = Field(..., description="Nome do serviço")
    status: str = Field(..., description="Status do serviço")
    uptime: int = Field(..., description="Tempo de atividade em segundos")
    memory_usage: int = Field(..., description="Uso de memória em bytes")
    cpu_usage: float = Field(..., description="Uso de CPU em percentual")
    connections: int = Field(default=0, description="Número de conexões ativas")
    requests_per_second: float = Field(default=0.0, description="Requests por segundo")
    response_time_avg: float = Field(default=0.0, description="Tempo médio de resposta em ms")

# ===========================
# ALERTAS E MONITORAMENTO
# ===========================

class AlertRule(BaseModel):
    """Regra de alerta"""
    id: str = Field(..., description="ID único da regra")
    name: str = Field(..., description="Nome da regra")
    description: str = Field(..., description="Descrição da regra")
    metric: str = Field(..., description="Métrica a ser monitorada")
    condition: str = Field(..., description="Condição do alerta (>, <, ==, etc)")
    threshold: float = Field(..., description="Valor limite")
    severity: AlertSeverity = Field(..., description="Severidade do alerta")
    enabled: bool = Field(default=True, description="Se a regra está ativa")
    duration: int = Field(default=60, description="Duração em segundos antes de disparar")
    labels: Dict[str, str] = Field(default_factory=dict, description="Labels adicionais")

class Alert(BaseModel):
    """Alerta ativo"""
    id: str = Field(..., description="ID único do alerta")
    rule_id: str = Field(..., description="ID da regra que gerou o alerta")
    rule_name: str = Field(..., description="Nome da regra")
    message: str = Field(..., description="Mensagem do alerta")
    severity: AlertSeverity = Field(..., description="Severidade")
    status: AlertStatus = Field(..., description="Status atual")
    started_at: datetime = Field(..., description="Quando o alerta começou")
    resolved_at: Optional[datetime] = Field(default=None, description="Quando foi resolvido")
    acknowledged_at: Optional[datetime] = Field(default=None, description="Quando foi confirmado")
    current_value: float = Field(..., description="Valor atual da métrica")
    threshold: float = Field(..., description="Valor limite")
    labels: Dict[str, str] = Field(default_factory=dict, description="Labels do alerta")

class HealthCheck(BaseModel):
    """Check de saúde de um componente"""
    component: str = Field(..., description="Nome do componente")
    status: MonitoringStatus = Field(..., description="Status de saúde")
    message: str = Field(..., description="Mensagem descritiva")
    timestamp: datetime = Field(..., description="Timestamp do check")
    response_time: float = Field(..., description="Tempo de resposta em ms")
    details: Dict[str, Any] = Field(default_factory=dict, description="Detalhes adicionais")

# ===========================
# DASHBOARDS E RELATÓRIOS
# ===========================

class MetricSeries(BaseModel):
    """Série temporal de uma métrica"""
    metric_name: str = Field(..., description="Nome da métrica")
    labels: Dict[str, str] = Field(default_factory=dict, description="Labels da métrica")
    values: List[tuple[datetime, float]] = Field(..., description="Pontos (timestamp, valor)")

class DashboardWidget(BaseModel):
    """Widget de dashboard"""
    id: str = Field(..., description="ID do widget")
    title: str = Field(..., description="Título do widget")
    type: str = Field(..., description="Tipo do widget (chart, gauge, table, etc)")
    metrics: List[str] = Field(..., description="Métricas exibidas")
    config: Dict[str, Any] = Field(default_factory=dict, description="Configuração específica")
    position: Dict[str, int] = Field(..., description="Posição e tamanho (x, y, w, h)")

class Dashboard(BaseModel):
    """Dashboard de monitoramento"""
    id: str = Field(..., description="ID do dashboard")
    title: str = Field(..., description="Título do dashboard")
    description: str = Field(..., description="Descrição")
    widgets: List[DashboardWidget] = Field(..., description="Widgets do dashboard")
    refresh_interval: int = Field(default=30, description="Intervalo de atualização em segundos")
    created_at: datetime = Field(..., description="Data de criação")
    updated_at: datetime = Field(..., description="Última atualização")

# ===========================
# REQUISIÇÕES E RESPOSTAS
# ===========================

class MetricsRequest(BaseModel):
    """Requisição para obter métricas"""
    start_time: Optional[datetime] = Field(default=None, description="Início do período")
    end_time: Optional[datetime] = Field(default=None, description="Fim do período")
    metrics: Optional[List[str]] = Field(default=None, description="Métricas específicas")
    labels: Optional[Dict[str, str]] = Field(default=None, description="Filtros por label")
    step: Optional[int] = Field(default=60, description="Intervalo entre pontos em segundos")

class AlertsRequest(BaseModel):
    """Requisição para listar alertas"""
    status: Optional[AlertStatus] = Field(default=None, description="Filtrar por status")
    severity: Optional[AlertSeverity] = Field(default=None, description="Filtrar por severidade")
    start_time: Optional[datetime] = Field(default=None, description="Alertas desde")
    end_time: Optional[datetime] = Field(default=None, description="Alertas até")
    labels: Optional[Dict[str, str]] = Field(default=None, description="Filtros por label")

class MonitoringOverview(BaseModel):
    """Visão geral do monitoramento"""
    system_status: MonitoringStatus = Field(..., description="Status geral do sistema")
    active_alerts: int = Field(..., description="Número de alertas ativos")
    critical_alerts: int = Field(..., description="Alertas críticos")
    services_up: int = Field(..., description="Serviços funcionando")
    services_down: int = Field(..., description="Serviços com problema")
    last_update: datetime = Field(..., description="Última atualização")
    components: List[HealthCheck] = Field(..., description="Status dos componentes")

class MonitoringResponse(BaseModel):
    """Resposta padrão do sistema de monitoramento"""
    success: bool = Field(..., description="Sucesso da operação")
    message: str = Field(..., description="Mensagem de resultado")
    data: Optional[Any] = Field(default=None, description="Dados de retorno")
    timestamp: datetime = Field(default_factory=datetime.now, description="Timestamp da resposta")

# ===========================
# CONFIGURAÇÕES
# ===========================

class MonitoringConfig(BaseModel):
    """Configuração do sistema de monitoramento"""
    collection_interval: int = Field(default=60, description="Intervalo de coleta em segundos")
    retention_days: int = Field(default=30, description="Dias de retenção dos dados")
    alert_rules: List[AlertRule] = Field(default_factory=list, description="Regras de alerta")
    notification_channels: List[str] = Field(default_factory=list, description="Canais de notificação")
    enabled_metrics: List[str] = Field(default_factory=list, description="Métricas habilitadas")

class NotificationChannel(BaseModel):
    """Canal de notificação"""
    id: str = Field(..., description="ID do canal")
    name: str = Field(..., description="Nome do canal")
    type: str = Field(..., description="Tipo (webhook, email, slack, etc)")
    config: Dict[str, Any] = Field(..., description="Configuração específica do canal")
    enabled: bool = Field(default=True, description="Se o canal está ativo")
    severity_filter: List[AlertSeverity] = Field(default_factory=list, description="Severidades a notificar")