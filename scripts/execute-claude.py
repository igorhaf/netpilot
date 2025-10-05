#!/usr/bin/env python3
"""
Script para executar comandos Claude Code no HOST
Usa os usuários bender/marvin com suas credenciais Claude CLI
"""
import subprocess
import sys
import json
import random
import os

def execute_claude(project_path, prompt, agent=None):
    """
    Executa comando Claude Code no diretório do projeto

    Args:
        project_path: Caminho completo do projeto (/home/{project}/code)
        prompt: Prompt para o Claude
        agent: 'bender' ou 'marvin' (aleatório se None)

    Returns:
        dict com success, stdout, stderr, agent
    """
    # Selecionar agente aleatoriamente se não especificado
    if not agent:
        agent = random.choice(['bender', 'marvin'])

    # Escape para shell
    escaped_prompt = prompt.replace("'", "'\"'\"'")

    # Comando completo
    cmd = [
        'su', '-s', '/bin/bash', agent, '-c',
        f'cd "{project_path}" && claude --continue --verbose "{escaped_prompt}"'
    ]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minutos
        )

        return {
            'success': result.returncode == 0,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'agent': agent,
            'returncode': result.returncode
        }
    except subprocess.TimeoutExpired:
        return {
            'success': False,
            'stdout': '',
            'stderr': 'Timeout: Comando excedeu 5 minutos',
            'agent': agent,
            'returncode': -1
        }
    except Exception as e:
        return {
            'success': False,
            'stdout': '',
            'stderr': str(e),
            'agent': agent,
            'returncode': -1
        }

if __name__ == '__main__':
    # Receber dados como JSON do argumento
    if len(sys.argv) < 2:
        print(json.dumps({
            'success': False,
            'stdout': '',
            'stderr': 'Uso: execute-claude.py \'{"projectPath": "...", "prompt": "..."}\'',
            'agent': None
        }))
        sys.exit(1)

    try:
        data = json.loads(sys.argv[1])
        result = execute_claude(
            data['projectPath'],
            data['prompt'],
            data.get('agent')
        )
        print(json.dumps(result))
    except json.JSONDecodeError as e:
        print(json.dumps({
            'success': False,
            'stdout': '',
            'stderr': f'JSON inválido: {str(e)}',
            'agent': None
        }))
        sys.exit(1)
