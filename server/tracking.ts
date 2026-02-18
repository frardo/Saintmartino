/**
 * Gera um código de rastreamento único no formato: NNNNNNNLBR
 * Exemplo: 1234567A BR, 9876543Z BR
 * N = dígito (0-9)
 * L = letra maiúscula aleatória (A-Z)
 */
export function generateTrackingCode(): string {
  // Gera 7 dígitos aleatórios
  const numbers = Array.from({ length: 7 })
    .map(() => Math.floor(Math.random() * 10))
    .join("");

  // Gera 1 letra maiúscula aleatória
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const letter = letters[Math.floor(Math.random() * letters.length)];

  return `${numbers}${letter} BR`;
}

/**
 * Calcula o status de rastreamento baseado em quanto tempo passou desde o envio
 * - 0-3 dias: embalado
 * - 3-6 dias: em_transito (3 dias para chegar no Brasil)
 * - 6-10 dias: fiscalizacao (até 4 dias)
 * - 10+ dias: entregue
 */
export function getTrackingStatus(shippedAt: Date | string): string {
  const shippedDate = new Date(shippedAt);
  const now = new Date();
  const daysPassed = Math.floor((now.getTime() - shippedDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysPassed < 3) {
    return "embalado";
  } else if (daysPassed < 6) {
    return "em_transito";
  } else if (daysPassed < 10) {
    return "fiscalizacao";
  } else {
    return "entregue";
  }
}

/**
 * Calcula a data estimada de envio (2 dias após o pagamento)
 */
export function getEstimatedShipDate(paymentDate: Date | string): Date {
  const date = new Date(paymentDate);
  date.setDate(date.getDate() + 2);
  return date;
}

/**
 * Retorna informações legíveis sobre o status de rastreamento
 */
export function getTrackingInfo(trackingStatus: string) {
  const statusInfo: Record<string, { label: string; color: string; description: string }> = {
    pending: {
      label: "Pendente",
      color: "gray",
      description: "Aguardando embalagem",
    },
    embalado: {
      label: "Embalado",
      color: "blue",
      description: "Seu pedido foi embalado e será enviado em breve",
    },
    em_transito: {
      label: "Em Trânsito",
      color: "yellow",
      description: "Seu pedido está a caminho do Brasil",
    },
    fiscalizacao: {
      label: "Fiscalização",
      color: "orange",
      description: "Seu pedido chegou no Brasil e está em fiscalização alfandegária",
    },
    entregue: {
      label: "Entregue",
      color: "green",
      description: "Seu pedido foi entregue com sucesso!",
    },
  };

  return statusInfo[trackingStatus] || statusInfo.pending;
}
