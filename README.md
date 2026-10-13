# 🏫 Conecta CEEP - Sistema de Reserva de Ambientes

O **Conecta CEEP** é uma plataforma web centralizada desenvolvida para automatizar e otimizar a gestão e o agendamento de espaços e recursos compartilhados no colégio (como laboratórios de informática, auditório e quadra esportiva). 

O sistema garante transparência na disponibilidade de horários, previne conflitos de agendamento e facilita a comunicação entre professores e a administração escolar.

---

## 🎯 Objetivos do Projeto

- **Evitar conflitos de horários:** Regras automáticas que impedem reservas duplicadas para o mesmo espaço e turno no mesmo dia/horário.
- **Transparência e Autonomia:** Consulta simples do calendário e da grade de horários disponíveis.
- **Acesso Autorizado:** Controle de acesso restrito a professores e coordenação identificados pelo CPF.

---

## 🛠️ Tecnologias Utilizadas

- **Front-End:** HTML5, CSS3 (com recursos de acessibilidade) e JavaScript Assíncrono (Fetch API)
- **Linguagem Back-End:** Python 3.x
- **Framework Web:** Flask (com extensão Flask-CORS)
- **Banco de Dados:** SQLite3
- **Testes de API:** REST Client / Thunder Client (VS Code)
- **Controle de Versão:** Git & GitHub

---

## 📁 Estrutura do Projeto

```plaintext
CONECTA-CEEP/
├── .gitignore            # Arquivos ignorados pelo Git (venv, .db)
├── README.md             # Documentação técnica do projeto
├── bd/
│   ├── script.sql        # Script DDL com a criação das tabelas
│   └── banco_do_grupo.db # Banco SQLite (Gerado automaticamente ao rodar a API)
├── backend/
│   ├── venv/             # Ambiente virtual do Python
│   ├── app.py            # Servidor Flask e rotas da API RESTful
│   ├── requirements.txt  # Dependências da aplicação
│   └── testes.http       # Ficheiro de testes de requisições HTTP
└── frontend/
    ├── index.html        # Estrutura e páginas da aplicação
    ├── style.css         # Estilização, temas e acessibilidade
    ├── script.js         # Lógica da interface e integração Fetch API
    ├── Logo Conecta-CEEP.png
    └── title.png