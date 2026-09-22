# 🏫 Conecta CEEP - Sistema de Reserva de Ambientes

O **Conecta CEEP** é uma plataforma web centralizada desenvolvida para automatizar e otimizar a gestão e o agendamento de espaços e recursos compartilhados no colégio (como laboratórios de informática, auditório e quadra esportiva). 

O sistema garante transparência na disponibilidade de horários, previne conflitos de agendamento e facilita a comunicação entre alunos, professores e a administração escolar.

---

## 🎯 Objetivos do Projeto

- **Evitar conflitos de horários:** Regras automáticas que impedem reservas duplicadas para o mesmo espaço no mesmo dia/horário.
- **Transparência e Autonomia:** Consulta simples da grade de horários disponíveis.
- **Gestão Centralizada:** Painel administrativo para aprovação ou recusa de solicitações e gerenciamento dos ambientes.

---

## 🛠️ Tecnologias Utilizadas

- **Linguagem:** Python 3.x
- **Framework Web:** Flask (com extensão Flask-CORS)
- **Banco de Dados:** SQLite
- **Testes de API:** REST Client / Thunder Client (VS Code)
- **Controle de Versão:** Git & GitHub

---

## 📁 Estrutura do Projeto

```plaintext
Conecta-CEEP/
├── .gitignore          # Arquivos ignorados pelo Git (venv, .db)
├── README.md           # Documentação técnica do projeto
├── bd/
│   ├── script.sql      # Script DDL com a criação das tabelas
│   └── conecta_ceep.db # Banco SQLite (Gerado automaticamente ao rodar a API)
└── backend/
    ├── venv/           # Ambiente virtual do Python
    ├── app.py          # Servidor Flask e rotas da API (CRUD de Reservas)
    ├── requirements.txt # Dependências da aplicação
    └── testes.http     # Testes das requisições HTTP
```

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- **Python 3.10+** instalado no seu computador.
- **VS Code** (recomendado).

### Passo a Passo

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git
   cd NOME-DO-REPOSITORIO
   ```

2. **Acessar a pasta do back-end:**
   ```bash
   cd backend
   ```

3. **Criar e ativar o ambiente virtual (venv):**
   - **Windows:**
     ```bash
     python -m venv venv
     venv\Scripts\activate
     ```
   - **Linux/Mac:**
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

4. **Instalar as dependências:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Iniciar o servidor Flask:**
   ```bash
   python app.py
   ```
   > 💡 **Nota:** Ao rodar a API pela primeira vez, o arquivo de banco de dados `conecta_ceep.db` será criado automaticamente na pasta `bd/` a partir das instruções do `script.sql`.

6. **Endereço da API:**
   A API estará rodando em: `http://127.0.0.1:5000`

---

## 📡 Endpoints da API (CRUD - Entidade Reservas)

| Método | Endpoint | Descrição |
| :--- | :--- | :--- |
| `GET` | `/reservas` | Retorna a lista de todas as reservas cadastradas |
| `POST` | `/reservas` | Cria uma nova solicitação de reserva |
| `PUT` | `/reservas/<id>` | Atualiza dados ou status de uma reserva existente |
| `DELETE` | `/reservas/<id>` | Deleta/cancela uma reserva pelo ID |

### Exemplo de Payload para Cadastro (`POST /reservas`):

```json
{
  "usuario_id": 1,
  "ambiente_id": 2,
  "data_reserva": "2026-10-15",
  "hora_inicio": "08:00",
  "hora_fim": "10:00",
  "finalidade": "Aula prática de Algoritmos"
}
```

---

## 📄 Licença e Créditos

Projeto desenvolvido como parte do **Projeto Integrador (EXPOCEEP 2026)** do curso Técnico em Desenvolvimento de Sistemas — CEEP.