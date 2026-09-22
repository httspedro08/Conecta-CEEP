from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
import os

app = Flask(__name__)
CORS(app)

# Caminho dinamico para as pastas
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, '..', 'bd', 'conecta_ceep.db')
SQL_PATH = os.path.join(BASE_DIR, '..', 'bd', 'script.sql')

def obter_conexao():
    conexao = sqlite3.connect(DB_PATH)
    conexao.row_factory = sqlite3.Row
    return conexao

def inicializar_banco():
    """Gera o arquivo de banco de dados na pasta 'bd' e cria as tabelas caso nao exista."""
    pasta_bd = os.path.dirname(DB_PATH)
    if not os.path.exists(pasta_bd):
        os.makedirs(pasta_bd)

    if not os.path.exists(DB_PATH):
        if os.path.exists(SQL_PATH):
            conexao = obter_conexao()
            with open(SQL_PATH, 'r', encoding='utf-8') as script_file:
                conexao.executescript(script_file.read())
            conexao.close()
            print("=> Banco de dados e tabelas criados com sucesso na pasta 'bd'!")
        else:
            print("=> Aviso: O arquivo 'bd/script.sql' nao foi encontrado para inicializar o banco.")

inicializar_banco()

# =======================================================
# ROTAS DO CRUD - ENTIDADE RESERVAS
# =======================================================

# 1. READ (GET) - Listar todas as reservas
@app.route('/reservas', methods=['GET'])
def listar_reservas():
    conexao = obter_conexao()
    reservas = conexao.execute("SELECT * FROM reservas").fetchall()
    conexao.close()
    return jsonify([dict(linha) for linha in reservas]), 200

# 2. CREATE (POST) - Criar nova reserva
@app.route('/reservas', methods=['POST'])
def cadastrar_reserva():
    corpo = request.get_json()
    
    usuario_id = corpo.get('usuario_id')
    ambiente_id = corpo.get('ambiente_id')
    data_reserva = corpo.get('data_reserva')
    hora_inicio = corpo.get('hora_inicio')
    hora_fim = corpo.get('hora_fim')
    finalidade = corpo.get('finalidade')

    if not all([usuario_id, ambiente_id, data_reserva, hora_inicio, hora_fim, finalidade]):
        return jsonify({"erro": "Todos os campos obrigatorios devem ser preenchidos!"}), 400

    conexao = obter_conexao()
    cursor = conexao.cursor()
    cursor.execute("""
        INSERT INTO reservas (usuario_id, ambiente_id, data_reserva, hora_inicio, hora_fim, finalidade, status)
        VALUES (?, ?, ?, ?, ?, ?, 'pendente')
    """, (usuario_id, ambiente_id, data_reserva, hora_inicio, hora_fim, finalidade))
    
    conexao.commit()
    novo_id = cursor.lastrowid
    conexao.close()

    return jsonify({"mensagem": "Reserva solicitada com sucesso!", "id": novo_id}), 201

# 3. UPDATE (PUT) - Atualizar reserva existente
@app.route('/reservas/<int:id>', methods=['PUT'])
def atualizar_reserva(id):
    corpo = request.get_json()
    
    conexao = obter_conexao()
    cursor = conexao.cursor()
    
    reserva = cursor.execute("SELECT * FROM reservas WHERE id = ?", (id,)).fetchone()
    if not reserva:
        conexao.close()
        return jsonify({"erro": "Reserva nao encontrada!"}), 404

    data_reserva = corpo.get('data_reserva', reserva['data_reserva'])
    hora_inicio = corpo.get('hora_inicio', reserva['hora_inicio'])
    hora_fim = corpo.get('hora_fim', reserva['hora_fim'])
    finalidade = corpo.get('finalidade', reserva['finalidade'])
    status = corpo.get('status', reserva['status'])

    cursor.execute("""
        UPDATE reservas 
        SET data_reserva = ?, hora_inicio = ?, hora_fim = ?, finalidade = ?, status = ?
        WHERE id = ?
    """, (data_reserva, hora_inicio, hora_fim, finalidade, status, id))
    
    conexao.commit()
    conexao.close()

    return jsonify({"mensagem": "Reserva atualizada com sucesso!"}), 200

# 4. DELETE (DELETE) - Remover uma reserva por ID
@app.route('/reservas/<int:id>', methods=['DELETE'])
def deletar_reserva(id):
    conexao = obter_conexao()
    cursor = conexao.cursor()
    
    reserva = cursor.execute("SELECT * FROM reservas WHERE id = ?", (id,)).fetchone()
    if not reserva:
        conexao.close()
        return jsonify({"erro": "Reserva nao encontrada!"}), 404

    cursor.execute("DELETE FROM reservas WHERE id = ?", (id,))
    conexao.commit()
    conexao.close()

    return jsonify({"mensagem": "Reserva removida com sucesso!"}), 200

# 5. DELETE (DELETE) - Limpar TODAS as reservas (Utilitario de testes)
@app.route('/reservas/todas', methods=['DELETE'])
def deletar_todas_reservas():
    conexao = obter_conexao()
    cursor = conexao.cursor()
    cursor.execute("DELETE FROM reservas")
    conexao.commit()
    conexao.close()
    return jsonify({"mensagem": "Todas as reservas foram removidas com sucesso!"}), 200

if __name__ == '__main__':
    app.run(debug=True)