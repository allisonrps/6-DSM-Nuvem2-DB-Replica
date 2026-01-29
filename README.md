# 🚀 Replicação de Banco de Dados PostgreSQL (Master-Slave)

Este projeto demonstra a implementação de uma arquitetura de alta disponibilidade utilizando **Replicação em Streaming** com PostgreSQL. O ambiente é totalmente orquestrado via **Docker** e **Docker Compose**, permitindo a simulação de um cenário real de base de dados principal (*Primary*) e uma réplica de leitura (*Standby*).

## 📋 Sobre o Projeto

O objetivo deste repositório é fornecer uma infraestrutura automatizada para configurar a replicação de dados. Em ambientes produtivos, esta técnica é essencial para garantir a segurança dos dados, permitir a recuperação de desastres e balancear a carga de leitura entre múltiplos servidores.

### Principais Funcionalidades:
- **Replicação Assíncrona:** Sincronização automática entre o nó Master e o Slave.
- **Isolamento de Funções:** O Master gere as operações de escrita (INSERT, UPDATE, DELETE), enquanto o Slave fica disponível para consultas de leitura.
- **Orquestração com Docker:** Facilidade para subir e destruir o ambiente de testes rapidamente.

## 🏗️ Arquitetura do Sistema

- **DB Master:** O nó principal que aceita ligações de leitura e escrita.
- **DB Slave:** Um nó configurado em modo *Hot Standby*, que recebe os registos do WAL (*Write Ahead Log*) do Master e permite apenas consultas de leitura.

## 🛠️ Tecnologias Utilizadas

- **PostgreSQL 15+**
- **Docker & Docker Compose**
- **Shell Script** (automação da configuração inicial)

## 🚀 Como Executar

### Pré-requisitos
- Docker instalado.
- Docker Compose instalado.

### Passo a Passo

1. **Clonar o repositório:**
   ```bash
   git clone [https://github.com/allisonrps/6-DSM-Nuvem2-DB-Replica.git](https://github.com/allisonrps/6-DSM-Nuvem2-DB-Replica.git)
   cd 6-DSM-Nuvem2-DB-Replica
   ```
   
2. **Subir os containers:**

 ```bash
docker-compose up -d
```

3. **Verificar se os serviços estão ativos:**
 ```bash
docker-compose ps
```

### 🧪 Testando a Replicação
Para validar se a replicação está a funcionar corretamente:
Aceder ao container Master e criar um dado:
 ```bash
docker exec -it pg_master psql -U user -d mydb -c "CREATE TABLE teste (id SERIAL PRIMARY KEY, nome VARCHAR(50));"
docker exec -it pg_master psql -U user -d mydb -c "INSERT INTO teste (nome) VALUES ('Dados replicados');"
```

Consultar o dado no container Slave:
 ```bash
docker exec -it pg_slave psql -U user -d mydb -c "SELECT * FROM teste;"
```

Tentar escrever no Slave (Deve falhar):
 ```bash
docker exec -it pg_slave psql -U user -d mydb -c "INSERT INTO teste (nome) VALUES ('Tentativa falha');"
```

O PostgreSQL deverá retornar um erro informando que a base de dados está em modo "read-only".

### 📂 Estrutura de Ficheiros
docker-compose.yml: Definição dos serviços, volumes e redes.
config/: Arquivos de configuração personalizados do PostgreSQL (postgresql.conf, pg_hba.conf).
scripts/: Scripts automatizados para configurar o utilizador de replicação e o backup base.
Este projeto foi desenvolvido como parte dos estudos de Nuvem e Infraestrutura (6º Semestre de Desenvolvimento de Software Multiplataforma).
