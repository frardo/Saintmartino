# Teste Rápido da API de Checkout

## 🧪 Teste 1: Verificar se o Servidor Está Rodando

```bash
# No terminal, rodar:
curl http://localhost:5000/api/products/list
```

Esperado: Lista de produtos em JSON

---

## 🧪 Teste 2: Testar o Endpoint de Preferência

### Opção A: Usando cURL (Terminal)

```bash
curl -X POST http://localhost:5000/api/checkout/create-preference \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{
      "product": {
        "id": 1,
        "name": "Teste",
        "price": "100.00",
        "metal": "Ouro",
        "imageUrls": ["https://example.com/image.jpg"]
      },
      "quantity": 1,
      "selected": true
    }]
  }'
```

### Opção B: Usando DevTools do Navegador (F12)

1. Abrir Console (F12)
2. Colar o código:

```javascript
fetch('/api/checkout/create-preference', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [{
      product: {
        id: 1,
        name: "Teste",
        price: "100.00",
        metal: "Ouro",
        imageUrls: ["https://example.com/image.jpg"]
      },
      quantity: 1,
      selected: true
    }]
  })
})
.then(r => r.json())
.then(d => console.log(d))
.catch(e => console.error(e))
```

3. Pressionar Enter
4. Ver a resposta

---

## ✅ Resposta Esperada

```json
{
  "success": true,
  "checkoutUrl": "https://mercadopago.com.ar/checkout/...",
  "preferenceId": "12345678",
  "total": 100.00
}
```

---

## ❌ Resposta com Erro Esperada

Se houver erro, verá algo como:

```json
{
  "message": "Error creating checkout",
  "error": "Product 1 not found"
}
```

---

## 🔍 O Que Verificar nos Logs

### No Terminal (Servidor):

```
=== CREATE PREFERENCE REQUEST ===
Items received: [...]  // ✓ Deve mostrar os itens
Preference items built: [...]  // ✓ Deve estar OK
Access Token: ✓ Present  // ✓ IMPORTANTE: Deve ter ✓
MP Response status: 200  // ✓ Deve ser 200
```

### No Navegador (Console do DevTools):

```
Sending checkout request with items: [...]
Response status: 200
Response text: {...}
Parsed data: {success: true, ...}
```

---

## 🐛 Erros Comuns e Soluções

| Erro | Causa | Solução |
|------|-------|---------|
| `Product X not found` | ID do produto não existe | Verificar banco de dados |
| `Access Token: ✗ Missing` | Variável de ambiente não carregada | Reiniciar servidor `npm run dev` |
| `Response status: 500` | Erro interno do servidor | Ver logs no terminal |
| `Cannot read property 'id' of undefined` | Estrutura de item incorreta | Verificar formato dos dados |

---

## 🚀 Se Tudo der Certo

1. Você verá a URL de checkout do Mercado Pago
2. Será redirecionado para `https://mercadopago.com.ar/checkout/...`
3. Poderá preencher dados de teste
4. E escolher método de pagamento

---

**Teste agora e me avise qual é o erro específico que está recebendo!** 🧪
