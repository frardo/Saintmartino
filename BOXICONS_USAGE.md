# Boxicons Integration Guide

## Overview
Este projeto usa **Boxicons** para todos os ícones. Os ícones estão centralizados no arquivo `client/src/components/Icons.tsx`.

## Como Usar

### 1. Importar o Ícone
```tsx
import { UserIcon, EmailIcon, PhoneIcon, MapPinIcon, LockIcon } from "@/components/Icons";
```

### 2. Usar no Componente
```tsx
// Tamanho padrão (md)
<UserIcon />

// Com tamanho customizado
<UserIcon size="lg" />
<EmailIcon size="sm" />

// Com cor customizada
<UserIcon className="text-blue-600" />

// Combinação
<PhoneIcon size="lg" className="text-green-600" />
```

## Tamanhos Disponíveis
- `xs` - 12px (0.75rem)
- `sm` - 16px (1rem)
- `md` - 20px (1.25rem) - padrão
- `lg` - 24px (1.5rem)
- `xl` - 32px (2rem)

## Ícones Disponíveis

### Usuário/Perfil
- `UserIcon` - Ícone de usuário
- `UserCheckIcon` - Ícone de usuário com checkmark

### Contato
- `EmailIcon` - Envelope/Email
- `PhoneIcon` - Telefone

### Localização
- `MapPinIcon` - Localização
- `LocationIcon` - Localização alternativa

### Segurança
- `LockIcon` - Cadeado/Segurança
- `ShieldIcon` - Escudo de proteção

### Pagamento
- `CreditCardIcon` - Cartão de crédito
- `WalletIcon` - Carteira
- `DollarSignIcon` - Símbolo de dólar
- `PixIcon` - Ícone PIX (transferência instantânea)
- `BoletoIcon` - Ícone Boleto Bancário (documento)
- `DebitCardIcon` - Cartão de débito

### Navegação
- `ChevronRightIcon` - Seta para direita pequena
- `ChevronLeftIcon` - Seta para esquerda pequena
- `ArrowRightIcon` - Seta grande para direita (→)
- `ArrowLeftIcon` - Seta grande para esquerda (←)

### Status
- `CheckCircleIcon` - Círculo com checkmark (sucesso)
- `AlertCircleIcon` - Círculo com alerta
- `InfoIcon` - Ícone de informação

### Shopping
- `ShoppingCartIcon` - Carrinho de compras
- `ShoppingBagIcon` - Sacola de compras

### Ações
- `CopyIcon` - Ícone de copiar
- `DownloadIcon` - Ícone de download
- `LoaderIcon` - Spinner/Loading

### Especiais
- `QrCodeIcon` - QR Code

## Exemplos Práticos

### Em um formulário
```tsx
<label className="flex items-center gap-2">
  <EmailIcon size="sm" className="text-blue-600" />
  <span>Email</span>
</label>
```

### Em um botão
```tsx
<button className="flex items-center gap-2">
  <LoaderIcon size="sm" />
  Carregando...
</button>
```

### Em um card de pagamento
```tsx
<div className="flex gap-3">
  <CreditCardIcon size="lg" className="text-blue-600" />
  <div>
    <h3>Cartão de Crédito</h3>
    <p>Parcele em até 12 vezes</p>
  </div>
</div>
```

## Adicionar Novos Ícones

1. Vá para https://boxicons.com
2. Encontre o ícone desejado
3. Copie o SVG
4. Adicione uma nova função no arquivo `client/src/components/Icons.tsx`:

```tsx
export const MyIcon = ({ size = 'md', className = '' }: IconProps) => (
  <svg className={`${sizeMap[size]} ${className}`} viewBox="0 0 24 24" fill="currentColor">
    {/* Cole o SVG path aqui */}
  </svg>
);
```

5. Importe e use em seus componentes

## Benefícios
- ✅ Ícones consistentes em todo o site
- ✅ Tamanho customizável
- ✅ Cores herdadas do tema (via `currentColor`)
- ✅ SVG puro (rápido, sem dependências)
- ✅ Suporte a animações (ex: `animate-spin`)
- ✅ Fácil de manter e atualizar

## Referência
- **Site Oficial:** https://boxicons.com
- **Documentação:** https://docs.boxicons.com/
- **GitHub:** https://github.com/atisawd/boxicons
