# Troubleshooting - Mercado Pago Checkout Pro

## 🔴 Erro: "Resposta inválida do servidor"

**Causa**: O servidor está retornando HTML em vez de JSON (geralmente uma página de erro 500).

**Solução**:
1. Abrir o Console do navegador (F12)
2. Verificar a mensagem de erro exata que aparece
3. Ver qual é o `Response text` que está sendo retornado

---

## 🔴 Erro: "SyntaxError: Unexpected token '<'"

**Causa**: O servidor retornou HTML (provavelmente erro) em vez de JSON.

**Debug**:
1. Console do navegador mostrará o texto da resposta (HTML)
2. Copiar o texto completo
3. Verificar qual é o erro

---

## 🔴 Erro na Preferência do Mercado Pago

Se a resposta mostrar um erro do Mercado Pago, comum são:

### "Invalid Authorization Header"
- ❌ Token expirou ou está inválido
- ✅ Verificar em `.env` se `MERCADOPAGO_ACCESS_TOKEN` está correto
- ✅ Token deve começar com `APP_USR-`

### "Invalid items"
- ❌ Algum item não está com o formato correto
- ✅ Verificar se `item.product.id` existe no banco de dados
- ✅ Verificar se `product.price` é um número válido

### "Preference creation failed"
- ❌ Dados obrigatórios faltando
- ✅ Verificar se `items` não está vazio
- ✅ Cada item deve ter `title`, `quantity`, `unit_price`, `currency_id`

---

## 📋 Checklist de Debug

- [ ] Console do navegador mostra a resposta exata?
- [ ] Logs do servidor são exibidos quando clica "Ir para Checkout"?
- [ ] Token de Mercado Pago está em `.env`?
- [ ] Banco de dados tem produtos?
- [ ] Produtos têm `price` e `imageUrls`?
- [ ] Servidor está rodando em `http://localhost:5000`?

---

## 🔧 Como Verificar os Logs

### No Navegador (F12):
```javascript
// Procure por:
"Sending checkout request with items:"
"Response status:"
"Response text:"
"Parsed data:"
```

### No Terminal do Servidor:
```
=== CREATE PREFERENCE REQUEST ===
Items received: [...]
Preference items built: [...]
Preference object created: {...}
Access Token: ✓ Present
MP Response status: 200
```

---

## 🔐 Verificar Token do Mercado Pago

### No Terminal:
```bash
# Verificar se .env tem o token
cat .env | grep MERCADOPAGO_ACCESS_TOKEN
```

### No Código:
```typescript
// server/routes.ts linha 249
console.log("Access Token:", process.env.MERCADOPAGO_ACCESS_TOKEN ? "✓ Present" : "✗ Missing");
```

---

## 🧪 Teste Manual com CURL

```bash
# Testar o endpoint direto (substituir o token)
curl -X POST http://localhost:5000/api/checkout/create-preference \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{
      "product": {
        "id": 1,
        "name": "Teste",
        "price": "100.00",
        "metal": "Ouro",
        "stone": "Diamante",
        "imageUrls": ["https://example.com/image.jpg"]
      },
      "quantity": 1,
      "selected": true
    }]
  }'
```

---

## 📞 Se o Problema Persistir

1. **Abrir a aba "Network" do DevTools**
   - F12 → Network
   - Clicar em "Ir para Checkout"
   - Ver requisição `/api/checkout/create-preference`
   - Ver a resposta completa

2. **Copiar a mensagem de erro exata**
   - Console mostra qual é o problema
   - Mercado Pago API erro está nos logs

3. **Verificar documentação do Mercado Pago**
   - https://www.mercadopago.com.br/developers
   - Procurar pela mensagem de erro específica

---

## ✅ Teste de Sucesso

Quando funcionar, você verá:

```
Console:
✓ Sending checkout request with items: [...]
✓ Response status: 200
✓ Parsed data: {success: true, checkoutUrl: "https://mercadopago...", ...}
✓ Redirecting to: https://mercadopago...

Navegador:
✓ Redirecionado para o site do Mercado Pago
✓ Formulário de checkout aparece
```

---

## 📝 Notas Importantes

- **Dados de Teste**: Use o `MERCADOPAGO_ACCESS_TOKEN` em `.env`
- **Cartões de Teste**: Procure a documentação do MP para cartões válidos
- **URL de Retorno**: Deve ser `http://localhost:5000/checkout-success` etc em desenvolvimento

---

**Boa sorte!** 🚀
