import os
import sqlite3
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Libera o acesso para requisições externas do navegador (Front-End)

# Definição dos caminhos absolutos para o banco de dados e script SQL
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, '..', 'bd', 'banco_do_grupo.db')
SQL_PATH = os.path.join(BASE_DIR, '..', 'bd', 'script.sql')

def obter_conexao():
    """Abre a conexão com o banco SQLite e define o retorno das linhas como dicionários."""
    conexao = sqlite3.connect(DB_PATH)
    conexao.row_factory = sqlite3.Row
    return conexao

def inicializar_banco():
    """Executa o arquivo script.sql caso o banco de dados ainda não exista."""
    if not os.path.exists(DB_PATH):
        if os.path.exists(SQL_PATH):
            conexao = sqlite3.connect(DB_PATH)
            with open(SQL_PATH, mode='r', encoding='utf-8') as f:
                conexao.executescript(f.read())
            conexao.commit()
            conexao.close()
            print("Banco de dados SQLite inicializado com sucesso!")

# Inicializa as tabelas ao rodar a aplicação
inicializar_banco()

# ==========================================
# ROTA DE STATUS DA API (Etapa 1)
# ==========================================
@app.route('/', methods=['GET'])
def status_api():
    return jsonify({
        "status": "sucesso",
        "mensagem": "API do Conecta-CEEP rodando com sucesso!"
    }), 200

# ==========================================
# ROTAS DE AUTENTICAÇÃO E USUÁRIOS
# ==========================================

@app.route('/login', methods=['POST'])
def login():
    dados = request.get_json()
    cpf = dados.get('cpf')
    senha = dados.get('senha')

    if not cpf or not senha:
        return jsonify({"erro": "CPF e senha são obrigatórios!"}), 400

    conexao = obter_conexao()
    usuario = conexao.execute(
        "SELECT * FROM usuarios WHERE cpf = ? AND senha = ?", (cpf, senha)
    ).fetchone()
    conexao.close()

    if not usuario:
        return jsonify({"erro": "CPF ou senha incorretos."}), 401

    return jsonify({
        "mensagem": "Login realizado com sucesso!",
        "usuario": {
            "nome": usuario['nome'],
            "cpf": usuario['cpf'],
            "papel": usuario['papel']
        }
    }), 200

@app.route('/usuarios', methods=['POST'])
def cadastrar_usuario():
    dados = request.get_json()
    cpf = dados.get('cpf')
    nome = dados.get('nome')
    senha = dados.get('senha')

    if not cpf or not nome or not senha:
        return jsonify({"erro": "Todos os campos são obrigatórios!"}), 400

    conexao = obter_conexao()
    
    # Verifica se o CPF consta nos autorizados
    autorizado = conexao.execute(
        "SELECT * FROM autorizados WHERE cpf = ?", (cpf,)
    ).fetchone()

    if not autorizado:
        conexao.close()
        return jsonify({"erro": "CPF não cadastrado na lista de professores autorizados."}), 403

    # Verifica se o usuário já possui conta
    existente = conexao.execute(
        "SELECT * FROM usuarios WHERE cpf = ?", (cpf,)
    ).fetchone()

    if existente:
        conexao.close()
        return jsonify({"erro": "Este CPF já possui uma conta cadastrada."}), 400

    # Define papel de coordenação ou professor
    coordenadores = ['10754772985', '09082967979', '12616379929']
    papel = 'coordenacao' if cpf in coordenadores else 'professor'

    conexao.execute(
        "INSERT INTO usuarios (cpf, nome, senha, papel) VALUES (?, ?, ?, ?)",
        (cpf, nome, senha, papel)
    )
    conexao.commit()
    conexao.close()

    return jsonify({"mensagem": "Usuário cadastrado com sucesso!", "papel": papel}), 201

# ==========================================
# ROTAS DO CRUD DE PROFESSORES AUTORIZADOS
# ==========================================

@app.route('/professores', methods=['GET'])
def listar_professores():
    conexao = obter_conexao()
    professores = conexao.execute("SELECT * FROM autorizados").fetchall()
    conexao.close()
    return jsonify([dict(p) for p in professores]), 200

@app.route('/professores', methods=['POST'])
def autorizar_professor():
    dados = request.get_json()
    cpf = dados.get('cpf')
    nome = dados.get('nome')

    if not cpf or not nome:
        return jsonify({"erro": "CPF e Nome são obrigatórios!"}), 400

    conexao = obter_conexao()
    existente = conexao.execute("SELECT * FROM autorizados WHERE cpf = ?", (cpf,)).fetchone()
    
    if existente:
        conexao.close()
        return jsonify({"erro": "Professor já está autorizado."}), 400

    conexao.execute("INSERT INTO autorizados (cpf, nome) VALUES (?, ?)", (cpf, nome))
    conexao.commit()
    conexao.close()

    return jsonify({"mensagem": "Professor autorizado com sucesso!"}), 201

@app.route('/professores/<string:cpf>', methods=['DELETE'])
def remover_professor(cpf):
    conexao = obter_conexao()
    professor = conexao.execute("SELECT * FROM autorizados WHERE cpf = ?", (cpf,)).fetchone()

    if not professor:
        conexao.close()
        return jsonify({"erro": "Professor não encontrado!"}), 404

    conexao.execute("DELETE FROM autorizados WHERE cpf = ?", (cpf,))
    conexao.execute("DELETE FROM usuarios WHERE cpf = ?", (cpf,))
    conexao.commit()
    conexao.close()

    return jsonify({"mensagem": "Professor e cadastro removidos com sucesso!"}), 200

# ==========================================
# ROTAS DO CRUD DE RESERVAS (Principal)
# ==========================================

@app.route('/reservas', methods=['GET'])
def listar_reservas():
    conexao = obter_conexao()
    reservas = conexao.execute("SELECT * FROM reservas").fetchall()
    conexao.close()
    return jsonify([dict(r) for r in reservas]), 200

@app.route('/reservas', methods=['POST'])
def criar_reserva():
    dados = request.get_json()
    reserva_id = dados.get('id')
    data = dados.get('data')
    espaco = dados.get('espaco')
    horario = dados.get('horario')
    cpf = dados.get('cpf')
    nome = dados.get('nome')
    turma = dados.get('turma')

    if not all([reserva_id, data, espaco, horario, cpf, nome, turma]):
        return jsonify({"erro": "Todos os campos da reserva são obrigatórios!"}), 400

    conexao = obter_conexao()

    # Validação 1: Verificar conflito de espaço e horário
    conflito_espaco = conexao.execute(
        "SELECT * FROM reservas WHERE data = ? AND espaco = ? AND horario = ?",
        (data, espaco, horario)
    ).fetchone()

    if conflito_espaco:
        conexao.close()
        return jsonify({"erro": "Este espaço já foi reservado para o mesmo dia e horário."}), 400

    # Validação 2: Verificar conflito do mesmo professor no mesmo horário
    conflito_professor = conexao.execute(
        "SELECT * FROM reservas WHERE data = ? AND cpf = ? AND horario = ?",
        (data, cpf, horario)
    ).fetchone()

    if conflito_professor:
        conexao.close()
        return jsonify({"erro": "Você já possui uma reserva neste mesmo horário em outro espaço."}), 400

    # Inserção da Reserva
    conexao.execute(
        "INSERT INTO reservas (id, data, espaco, horario, cpf, nome, turma) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (reserva_id, data, espaco, horario, cpf, nome, turma)
    )
    conexao.commit()
    conexao.close()

    return jsonify({"mensagem": "Reserva criada com sucesso!"}), 201

@app.route('/reservas/<string:id>', methods=['DELETE'])
def cancelar_reserva(id):
    conexao = obter_conexao()
    reserva = conexao.execute("SELECT * FROM reservas WHERE id = ?", (id,)).fetchone()

    if not reserva:
        conexao.close()
        return jsonify({"erro": "Reserva não encontrada!"}), 404

    conexao.execute("DELETE FROM reservas WHERE id = ?", (id,))
    conexao.commit()
    conexao.close()

    return jsonify({"mensagem": "Reserva cancelada com sucesso!"}), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)