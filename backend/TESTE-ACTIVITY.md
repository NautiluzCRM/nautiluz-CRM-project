# 🧪 Guia: Como Testar o ActivityModel

## 📋 Pré-requisitos

1. **MongoDB rodando** (local ou Atlas)
2. **Node.js instalado** (versão 18+)
3. **Dependências instaladas** (`npm install`)

---

## 🚀 Passo a Passo

### **Passo 1: Verificar se o MongoDB está rodando**

#### Se estiver usando MongoDB local:
```bash
# Verificar se o MongoDB está rodando
sudo systemctl status mongod
# ou
ps aux | grep mongod
```

Se não estiver rodando, inicie:
```bash
sudo systemctl start mongod
# ou
mongod
```

#### Se estiver usando MongoDB Atlas:
- Certifique-se de que a connection string está correta no arquivo `.env`

---

### **Passo 2: Verificar/Criar arquivo `.env`**

Na pasta `backend/`, crie ou verifique o arquivo `.env`:

```env
# MongoDB (local ou Atlas)
MONGO_URI=mongodb://localhost:27017/nautiluz_crm
MONGO_DB_NAME=nautiluz_crm

# JWT (necessário para o código funcionar, mesmo que não use no teste)
JWT_SECRET=uma_chave_bem_secreta_para_teste
JWT_REFRESH_SECRET=outra_chave_secreta_para_teste

# Outros (valores padrão)
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
STORAGE_PROVIDER=local
UPLOAD_DIR=./uploads
EXPORT_SIGNED_URL_TTL_SECONDS=3600
```

> **Nota:** Para MongoDB Atlas, use a connection string completa:
> ```
> MONGO_URI=mongodb+srv://usuario:senha@cluster.mongodb.net/nautiluz_crm
> ```

---

### **Passo 3: Instalar dependências (se ainda não instalou)**

```bash
cd backend
npm install
```

---

### **Passo 4: Executar o teste**

Você tem **duas opções**:

#### **Opção A: Usando o script npm (recomendado)**
```bash
npm run test:activity
```

#### **Opção B: Executando diretamente**
```bash
npx ts-node-dev --esm --transpile-only test-activity.ts
```

---

## ✅ O que esperar

O teste irá:

1. ✅ Conectar ao MongoDB
2. 🧹 Limpar dados de teste anteriores
3. 📝 Criar dados de teste (Pipeline, Stage, Lead)
4. 🧪 Executar 13 testes diferentes:
   - Criação de atividades
   - Buscas e filtros
   - Atualizações
   - Deleções
   - Validações
   - Agregações
5. 🧹 Limpar os dados de teste
6. 🔌 Desconectar do MongoDB

**Saída esperada:**
```
🔌 Conectando ao MongoDB...
✅ Conectado com sucesso!

🧹 Limpando dados de teste anteriores...
✅ Dados limpos!

📝 Criando dados de teste (Pipeline, Stage, Lead)...
✅ Dados criados!
   - Pipeline ID: ...
   - Stage ID: ...
   - Lead ID: ...

📋 Teste 1: Criar atividade básica
✅ Atividade criada: ...
...

✅ Todos os testes passaram com sucesso!

🎉 Testes concluídos!
```

---

## ❌ Possíveis Erros e Soluções

### **Erro: "MongoServerError: connection refused"**
- **Causa:** MongoDB não está rodando
- **Solução:** Inicie o MongoDB (ver Passo 1)

### **Erro: "MongoServerError: authentication failed"**
- **Causa:** Credenciais incorretas no `.env`
- **Solução:** Verifique `MONGO_URI` e credenciais

### **Erro: "Cannot find module"**
- **Causa:** Dependências não instaladas
- **Solução:** Execute `npm install`

### **Erro: "JWT_SECRET is required"**
- **Causa:** Variáveis JWT não definidas no `.env`
- **Solução:** Adicione `JWT_SECRET` e `JWT_REFRESH_SECRET` no `.env`

---

## 📝 Notas Importantes

- ⚠️ O teste **limpa e cria dados** no banco. Use um banco de **desenvolvimento/teste**.
- 🔒 O teste usa o banco especificado em `MONGO_DB_NAME` (padrão: `nautiluz_crm`).
- 🧹 Todos os dados de teste são **automaticamente removidos** ao final.
- 📊 O teste cria dados temporários (Pipeline, Stage, Lead) necessários para testar o ActivityModel.

---

## 🎯 Próximos Passos

Após verificar que o teste funciona, você pode:

1. Modificar o teste para adicionar mais casos
2. Integrar com um framework de testes (Jest, Vitest)
3. Adicionar testes de integração mais complexos


