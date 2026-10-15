# Conecta CEEP - Sistema de Reserva de Ambientes 🏫

O **Conecta CEEP** é uma plataforma institucional desenvolvida para automatizar e otimizar a gestão e o agendamento de espaços e recursos compartilhados no colégio (como laboratórios de informática, auditório, ginásio e salas especializadas).

## 🎯 Objetivos do Projeto

* **Evitar conflitos de horários:** Regras automáticas que impedem reservas duplicadas para o mesmo espaço e turno no mesmo dia/horário.
* **Transparência e Autonomia:** Consulta simples do calendário e da grade de horários disponíveis.
* **Acesso Autorizado:** Controle de acesso restrito a professores e coordenação identificados pelo CPF.

## 🛠️ Tecnologias Utilizadas

* **Back-End / API:** Python 3 com Framework Flask e extensão Flask-CORS
* **Banco de Dados:** SQLite3
* **Front-End Web:** HTML5, CSS3 (com suporte a temas e acessibilidade) e JavaScript Assíncrono (Fetch API)
* **Controle de Versão:** Git & GitHub

## 📁 Estrutura do Projeto

```
CONECTA-CEEP/
├── .gitignore            # Arquivos ignorados pelo Git (venv, banco_do_grupo.db, etc.)
├── README.md             # Documentação técnica completa do projeto
├── bd/
│   ├── script.sql        # Script DDL com a criação das tabelas
│   └── banco_do_grupo.db # Banco SQLite (gerado automaticamente pela API)
├── backend/
│   ├── app.py            # Servidor Flask e rotas da API RESTful
│   ├── requirements.txt  # Dependências da aplicação Python
│   └── testes.http       # Ficheiro de testes de requisições HTTP
└── frontend/
    ├── index.html        # Estrutura e páginas da aplicação Web
    ├── style.css         # Estilização, temas e acessibilidade
    ├── script.js         # Lógica da interface Web e consumo da API
    ├── Logo Conecta-CEEP.png
    └── title.png
```

## 🛠️ Como Executar o Projeto

### **1. Iniciar o Back-End (API Flask)**

```bash
# Navegar até a pasta do backend
cd backend

# Instalar as dependências do Python
pip install -r requirements.txt

# Iniciar o servidor
python app.py
```

*O servidor ficará disponível na rede local no endereço `http://0.0.0.0:5000`.*

### **2. Executar a Aplicação Web**

1. Acesse a pasta `frontend/`.
2. Abra o arquivo `index.html` em qualquer navegador (ou utilize a extensão *Live Server* do VS Code).

---

## ✨ Funcionalidades Principais

* 🔒 **Autenticação de Usuários:** Login e registro de professores validados via CPF.
* 📅 **Consulta de Disponibilidade:** Filtros por espaço físico e por turnos (Matutino, Vespertino e Noturno).
* ⚡ **Reserva Instantânea:** Agendamento rápido com prevenção de conflitos de horário.
* 📋 **Gestão de Reservas:** Visualização e cancelamento de agendamentos efetuados.
* 🛡️ **Painel da Coordenação:** Autorização e gestão da equipe docente.

---

## 📡 Documentação das Rotas da API (Endpoints)

A API RESTful aceita e retorna dados estritamente no formato **JSON**.

### **1. Professores e Autenticação**

#### 🔹 `GET /professores`

* **Descrição:** Retorna a lista de todos os professores cadastrados/autorizados no sistema.
* **Verbo HTTP:** `GET`
* **Resposta de Sucesso (`200 OK`):**

```json
[
  {
    "cpf": "12345678900",
    "nome": "Professor Exemplo"
  }
]
```

#### 🔹 `POST /professores`

* **Descrição:** Cadastra um novo professor autorizado na base de dados (Ação restrita à Coordenação).
* **Verbo HTTP:** `POST`
* **Corpo da Requisição (JSON):**

```json
{
  "cpf": "12345678900",
  "nome": "Professor Exemplo"
}
```

* **Resposta de Sucesso (`201 Created`):**

```json
{
  "mensagem": "Professor cadastrado com sucesso!"
}
```

* **Resposta de Erro (`400 Bad Request`):**

```json
{
  "erro": "CPF já cadastrado."
}
```

#### 🔹 `POST /usuarios`

* **Descrição:** Cria uma conta de acesso/login para um professor previamente autorizado pela coordenação.
* **Verbo HTTP:** `POST`
* **Corpo da Requisição (JSON):**

```json
{
  "cpf": "12345678900",
  "nome": "Professor Exemplo",
  "senha": "senhaSegura123"
}
```

* **Resposta de Sucesso (`201 Created`):**

```json
{
  "mensagem": "Usuário criado com sucesso!",
  "papel": "professor"
}
```

#### 🔹 `POST /login`

* **Descrição:** Autentica um usuário (Professor ou Coordenação) no sistema.
* **Verbo HTTP:** `POST`
* **Corpo da Requisição (JSON):**

```json
{
  "cpf": "12345678900",
  "senha": "senhaSegura123"
}
```

* **Resposta de Sucesso (`200 OK`):**

```json
{
  "mensagem": "Login realizado com sucesso!",
  "usuario": {
    "cpf": "12345678900",
    "nome": "Professor Exemplo",
    "papel": "professor"
  }
}
```

---

### **2. Gestão de Reservas**

#### 🔹 `GET /reservas`

* **Descrição:** Lista todas as reservas ativas cadastradas no sistema.
* **Verbo HTTP:** `GET`
* **Resposta de Sucesso (`200 OK`):**

```json
[
  {
    "id": "1710000000000",
    "data": "2026-10-15",
    "espaco": "Laboratório 1",
    "horario": "07:10 - 08:00",
    "cpf": "12345678900",
    "nome": "Professor Exemplo",
    "turma": "3º Ano Informática"
  }
]
```

#### 🔹 `POST /reservas`

* **Descrição:** Cria uma nova reserva de espaço validando automaticamente contra conflitos de horário.
* **Verbo HTTP:** `POST`
* **Corpo da Requisição (JSON):**

```json
{
  "id": "1710000000000",
  "data": "2026-10-15",
  "espaco": "Laboratório 1",
  "horario": "07:10 - 08:00",
  "cpf": "12345678900",
  "nome": "Professor Exemplo",
  "turma": "3º Ano Informática"
}
```

* **Resposta de Sucesso (`201 Created`):**

```json
{
  "mensagem": "Reserva realizada com sucesso!"
}
```

* **Resposta de Conflito (`409 Conflict`):**

```json
{
  "erro": "Este horário já está reservado por outro professor."
}
```

#### 🔹 `DELETE /reservas/<id>`

* **Descrição:** Cancela/remove uma reserva existente pelo seu ID.
* **Verbo HTTP:** `DELETE`
* **Parâmetro de URL:** `id` (ex: `/reservas/1710000000000`)
* **Resposta de Sucesso (`200 OK`):**

```json
{
  "mensagem": "Reserva cancelada com sucesso!"
}
```