# Configuração SSH para Console NetPilot

Para usar o console SSH, coloque a chave privada SSH em:
- ssh/id_rsa (chave privada)

Configuração atual no docker-compose.yml:
- SSH_HOST=172.18.0.1 (IP do host Docker)
- SSH_PORT=22
- SSH_USER=root
- SSH_PRIVATE_KEY_PATH=/app/ssh/id_rsa

Para conectar ao host local, certifique-se de que:
1. SSH está habilitado no servidor
2. A chave pública está em ~/.ssh/authorized_keys do usuário root
3. A chave privada está em ./ssh/id_rsa (sem senha para automação)

