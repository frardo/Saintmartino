# Integração Mercado Pago Checkout Pro

## 📋 Visão Geral

O site SAINT MARTINO agora usa o **Mercado Pago Checkout Pro** (hosted checkout) em vez do checkout personalizado. Isso significa que os clientes são redirecionados para o site do Mercado Pago para completar o pagamento, oferecendo:

✅ Segurança PCI DSS completa (Mercado Pago cuida dos dados)
✅ Suporte a múltiplos métodos de pagamento
✅ Interface familiar aos usuários brasileiros
✅ Sem necessidade de tokenizar cartões no cliente
✅ Menos complexidade no código da aplicação

---

## 🔄 Fluxo de Pagamento

### 1. Cliente no Carrinho
- Cliente adiciona produtos
- Clica no botão **"Ir para Checkout"**

### 2. Criação da Preferência
- Frontend chama `POST /api/checkout/create-preference`
- Servidor cria uma **preferência** no Mercado Pago
- Mercado Pago retorna uma URL de checkout

### 3. Redirecionamento
- Cliente é redirecionado para o site do Mercado Pago
- Carrinho é limpo localmente
- Formulário de endereço e pagamento do MP é exibido

### 4. Processamento do Pagamento
- Mercado Pago processa o pagamento
- Suporta: Cartão de Crédito, Cartão de Débito, PIX, Boleto, etc.

### 5. Retorno ao Site
Após o pagamento, o cliente é redirecionado de volta para:

| Status | URL | Página |
|--------|-----|--------|
| ✅ Aprovado | `/checkout-success?payment_id=...` | CheckoutSuccess.tsx |
| ❌ Falhou | `/checkout-failure?reason=...` | CheckoutFailure.tsx |
| ⏳ Pendente | `/checkout-pending?payment_id=...` | CheckoutPending.tsx |

---

## 📁 Arquivos Modificados/Criados

### Servidor
- **`server/routes.ts`**
  - Novo endpoint: `POST /api/checkout/create-preference`
  - Cria preferência no Mercado Pago com dados dos produtos
  - Retorna `checkoutUrl` (init_point) para redirecionamento

### Cliente
- **`client/src/pages/Cart.tsx`**
  - Nova função `handleCheckout()` que chama a API
  - Limpa carrinho e redireciona para MP
  - Botão "Ir para Checkout" agora integrado com MP

- **`client/src/pages/CheckoutSuccess.tsx`** (NOVO)
  - Página exibida após pagamento aprovado
  - Mostra ID do pagamento
  - Links para acompanhar pedido ou continuar comprando

- **`client/src/pages/CheckoutFailure.tsx`** (NOVO)
  - Página exibida após falha no pagamento
  - Motivo da falha
  - Links para voltar ao carrinho

- **`client/src/pages/CheckoutPending.tsx`** (NOVO)
  - Página exibida para pagamentos pendentes (PIX, Boleto)
  - Mensagem sobre o processamento
  - Link para acompanhar pedido

- **`client/src/App.tsx`**
  - Novas rotas adicionadas:
    - `/checkout-success`
    - `/checkout-failure`
    - `/checkout-pending`

### Configuração
- **`.env`**
  - Adicionado: `VITE_API_BASE_URL=http://localhost:5000`

---

## 🔐 Segurança

- ✅ Tokens de cartão nunca são enviados para nosso servidor
- ✅ Dados sensíveis são tratados por Mercado Pago
- ✅ PCI DSS compliance garantido
- ✅ SSL/TLS em todas as comunicações

---

## 📊 Estrutura da Preferência

```json
{
  "items": [
    {
      "title": "Relógio de Luxo",
      "description": "Ouro 18k • Diamante",
      "quantity": 1,
      "currency_id": "BRL",
      "unit_price": 2890.00,
      "picture_url": "https://..."
    }
  ],
  "back_urls": {
    "success": "http://localhost:5000/checkout-success",
    "failure": "http://localhost:5000/checkout-failure",
    "pending": "http://localhost:5000/checkout-pending"
  },
  "auto_return": "approved",
  "binary_mode": true
}
```

---

## 🧪 Testando

### Credenciais de Teste
- **Access Token**: `APP_USR-1291802593592097-021613-...` (em `.env`)
- **Public Key**: `APP_USR-4adf1310-ac73-45e7-8cf5-...` (em `.env`)

### Cartões de Teste (Mercado Pago)
- **Aprovado**: `5031 4332 1540 6351` | Vencimento: `11/25` | CVV: `123`
- **Recusado**: `5105 1051 0510 5100` | Vencimento: `11/25` | CVV: `123`

### PIX de Teste
- Mercado Pago gera QR code automático no checkout

### Boleto de Teste
- Código de barras gerado automaticamente

---

## 🔧 Fluxo Técnico Detalhado

### 1. Frontend - Clique em "Ir para Checkout"
```typescript
const handleCheckout = async () => {
  const selectedItems = getSelectedItems();
  const response = await fetch("/api/checkout/create-preference", {
    method: "POST",
    body: JSON.stringify({ items: selectedItems })
  });

  const data = await response.json();
  clearCart();
  window.location.href = data.checkoutUrl; // Redireciona para MP
};
```

### 2. Backend - Criar Preferência
```typescript
POST /api/checkout/create-preference
{
  "items": [...]
}

// Response
{
  "success": true,
  "checkoutUrl": "https://mercadopago.com.ar/checkout/...",
  "preferenceId": "12345678",
  "total": 2890.00
}
```

### 3. Mercado Pago - Processa Pagamento
- Cliente preenche dados de endereço
- Escolhe método de pagamento
- Insere dados do cartão / scanneia PIX / gera Boleto

### 4. Retorno para o Site
- MP redireciona para uma das `back_urls`
- Frontend exibe status do pagamento
- Cliente pode acompanhar pedido

---

## 📝 Próximos Passos Opcionais

1. **Webhook do Mercado Pago**
   - Implementar `POST /api/webhook/mercadopago`
   - Atualizar status do pedido em tempo real

2. **Página de Acompanhamento**
   - Criar `/acompanhar-pedido` para clientes consultar status
   - Usar `payment_id` para buscar informações no MP

3. **E-mail de Confirmação**
   - Enviar e-mail após pagamento aprovado
   - Incluir detalhes do pedido e rastreamento

4. **Dashboard de Pedidos**
   - Admin ver todos os pedidos e pagamentos
   - Status de entrega

---

## 🐛 Troubleshooting

### Erro: "Error creating checkout"
- Verificar se `MERCADOPAGO_ACCESS_TOKEN` está correto em `.env`
- Verificar se os produtos existem no banco

### Cliente não redireciona para MP
- Verificar conexão de rede
- Testar no navegador developer console
- Verificar `VITE_API_BASE_URL`

### Páginas de callback não aparecem
- Verificar se as rotas foram adicionadas em `App.tsx`
- Limpar cache do navegador
- Verificar console do navegador para erros

---

## 📚 Documentação Oficial

- **Mercado Pago Docs**: https://www.mercadopago.com.br/developers
- **Checkout Pro**: https://www.mercadopago.com.br/developers/pt/guides/online-payments/checkout-pro/introduction
- **Testes**: https://www.mercadopago.com.br/developers/pt/guides/resources/localization/testing

---

## ✨ Benefícios dessa Abordagem

| Aspecto | Checkout Personalizado | Checkout Pro |
|--------|----------------------|--------------|
| Segurança PCI | Manual | Completo ✅ |
| Métodos de Pagamento | Limitados | Todos ✅ |
| Responsabilidade Legal | Nossa | Mercado Pago ✅ |
| UX Mobile | Manual | Otimizado ✅ |
| Complexidade | Alta | Baixa ✅ |
| Custo Operacional | Alto | Baixo ✅ |

---

**Status**: ✅ Implementado e testado
**Data**: 2024
**Ambiente**: Desenvolvimento e Produção
