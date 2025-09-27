# Configuração SSH para Console NetPilot

Para usar o console SSH, coloque a chave privada SSH em:
- ssh/id_rsa (chave privada)

Configuração atual no docker-compose.yml:
- SSH_HOST=38.242.135.31
- SSH_PORT=22
- SSH_USER=windsurf
- SSH_PRIVATE_KEY_PATH=./id_ed25519

Para conectar ao host local, certifique-se de que:
1. SSH está habilitado no servidor
2. A chave pública está em ~/.ssh/authorized_keys do usuário root
3. A chave privada está em ./ssh/id_rsa (sem senha para automação)

