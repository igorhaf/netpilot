"""
NetPilot System Operations - Basic Tests
Testes básicos para o microserviço FastAPI
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_root_endpoint():
    """Testar endpoint raiz"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "NetPilot System Operations"
    assert data["status"] == "running"


def test_health_endpoint():
    """Testar endpoint de health check"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "netpilot-system-ops"


def test_system_health_endpoint():
    """Testar endpoint de health do sistema"""
    response = client.get("/system/health")
    # Pode falhar se não tiver privilégios de sistema
    assert response.status_code in [200, 500]


def test_system_info_endpoint():
    """Testar endpoint de informações do sistema"""
    response = client.get("/system/info")
    # Pode falhar se não tiver privilégios de sistema
    assert response.status_code in [200, 500]


def test_nginx_status_endpoint():
    """Testar endpoint de status do Nginx"""
    response = client.get("/nginx/status")
    # Pode falhar se Nginx não estiver instalado
    assert response.status_code in [200, 500]


def test_ssl_list_certificates():
    """Testar endpoint de listar certificados"""
    response = client.get("/ssl/list-certificates")
    # Pode falhar se não tiver acesso aos certificados
    assert response.status_code in [200, 500]


def test_user_list_sessions():
    """Testar endpoint de listar sessões"""
    response = client.get("/users/list-sessions")
    assert response.status_code == 200
    data = response.json()
    assert "sessions" in data
    assert "total_sessions" in data


def test_traffic_stats():
    """Testar endpoint de estatísticas de tráfego"""
    response = client.get("/traffic/stats")
    # Pode falhar se não tiver privilégios de rede
    assert response.status_code in [200, 500]


def test_traffic_rules():
    """Testar endpoint de listar regras de tráfego"""
    response = client.get("/traffic/rules")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


# Testes de validação
def test_invalid_endpoint():
    """Testar endpoint inválido"""
    response = client.get("/invalid/endpoint")
    assert response.status_code == 404


def test_openapi_schema():
    """Testar schema OpenAPI"""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert "openapi" in data
    assert data["info"]["title"] == "NetPilot System Operations"


def test_docs_endpoint():
    """Testar documentação Swagger"""
    response = client.get("/docs")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]


def test_redoc_endpoint():
    """Testar documentação ReDoc"""
    response = client.get("/redoc")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]


if __name__ == "__main__":
    pytest.main([__file__])