# Como Reiniciar o Servidor

## 🔴 IMPORTANTE: Você DEVE reiniciar o servidor para os novos arquivos serem carregados!

O código foi compilado com sucesso (`npm run build`), mas o servidor pode estar ainda rodando o código antigo.

---

## 📋 Opção 1: Parar e Reiniciar (Recomendado)

### No Terminal/PowerShell onde o servidor está rodando:

1. **Pressione CTRL + C** para parar o servidor
2. **Espere a mensagem "Process terminated successfully"**
3. **Rode este comando:**

```bash
npm run dev
```

Espere aparecer:
```
📡 Setting up API routes...
🔧 Registering API routes...
📦 Registering POST /api/checkout/create-preference
serving on port 5000
```

---

## 📋 Opção 2: Matar Processo e Reiniciar (Se não responder)

```bash
# Matar todos os processos node
npx kill-port 5000

# Ou no PowerShell:
Get-Process node | Stop-Process -Force

# Depois reiniciar:
npm run dev
```

---

## ✅ Como Verificar se Está Funcionando

### Sinais de Sucesso:

1. **No Terminal do Servidor:**
   ```
   📡 Setting up API routes...
   🔧 Registering API routes...
   📦 Registering POST /api/checkout/create-preference
   ```

2. **No Navegador (Console DevTools - F12):**
   Quando clicar em "Ir para Checkout":
   ```
   Sending checkout request with items: [...]
   Response status: 200
   Parsed data: {success: true, checkoutUrl: "https://mercadopago...", ...}
   Redirecting to: https://mercadopago...
   ```

3. **Redireciona para o Mercado Pago** ✅

---

## ❌ Se Ainda Estiver Retornando HTML:

### Debug Checklist:

- [ ] Terminal mostra `📦 Registering POST /api/checkout/create-preference`?
- [ ] Servidor está rodando com `npm run dev` (não `npm run build`)?
- [ ] Navegador mostra status 200 mas content-type é `text/html`?
- [ ] Console mostra `⏭️  Skipping SPA handler for: /api/checkout/create-preference`?

### Se não:

1. **Verifique se está em modo DEV:**
   ```bash
   # Errado (produção):
   npm run build

   # Correto (desenvolvimento):
   npm run dev
   ```

2. **Verifique `.env`:**
   ```bash
   cat .env
   ```
   Deve ter:
   ```
   MERCADOPAGO_ACCESS_TOKEN=APP_USR-...
   ```

3. **Limpe cache do navegador:**
   - F12 → Network → Desabilite cache
   - Ou use modo anônimo

---

## 🧪 Teste Rápido no Terminal

Depois de reiniciar, rode:

```bash
# Em outro terminal, teste o endpoint:
curl -X POST http://localhost:5000/api/checkout/create-preference \
  -H "Content-Type: application/json" \
  -d '{"items": []}'
```

Esperado: Erro JSON
```json
{"message":"No items in cart"}
```

Não esperado: Página HTML

---

## 📝 Resumo

1. ✅ Build foi bem-sucedido (`npm run build`)
2. ❌ **Você precisa REINICIAR o servidor**
3. 🔧 Rode `npm run dev`
4. 🧪 Teste novamente o checkout
5. 🚀 Deve redirecionar para Mercado Pago

---

**Avise-me quando o servidor for reiniciado! 🚀**
