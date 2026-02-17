import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useCart } from "@/hooks/use-cart";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  UserIcon,
  EmailIcon,
  PhoneIcon,
  MapPinIcon,
  LockIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  CopyIcon,
  QrCodeIcon,
  LoaderIcon,
  PixIcon,
  BoletoIcon,
  CreditCardIcon,
  DebitCardIcon,
  ShieldIcon,
} from "@/components/Icons";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

type PaymentMethod = "credit_card" | "debit_card" | "pix" | "boleto";

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  shippingAddress: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
}

interface PaymentResult {
  success: boolean;
  orderId: number;
  paymentStatus: string;
  paymentId?: string;
  qrCode?: string;
  qrCodeUrl?: string;
  boletoUrl?: string;
  boletoBarcode?: string;
}

export default function Checkout() {
  const [, setLocation] = useLocation();
  const { getSelectedItems, getSelectedTotal, clearCart } = useCart();
  const { toast } = useToast();

  const [step, setStep] = useState(1); // 1: Customer, 2: Address, 3: Payment, 4: Review, 5: Confirmation
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("credit_card");
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [cardToken, setCardToken] = useState<string | null>(null);
  const [installments, setInstallments] = useState(1);

  const cardFieldsRef = useRef<any>(null);
  const mpRef = useRef<any>(null);
  const [sdkReady, setSdkReady] = useState(false);

  const [customerData, setCustomerData] = useState<CustomerData>({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    shippingAddress: {
      cep: "",
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
    },
  });

  const selectedItems = getSelectedItems();
  const total = getSelectedTotal();

  // Initialize Mercado Pago SDK
  useEffect(() => {
    const publicKey = import.meta.env.VITE_MERCADOPAGO_PUBLIC_KEY || "";

    if (!publicKey) {
      console.error("Mercado Pago public key not configured");
      return;
    }

    // Check if SDK is available
    const waitForSDK = setInterval(() => {
      if (window.MercadoPago) {
        clearInterval(waitForSDK);
        if (!mpRef.current) {
          mpRef.current = new window.MercadoPago(publicKey);
          setSdkReady(true);
          console.log("Mercado Pago SDK initialized");
        }
      }
    }, 100);

    return () => clearInterval(waitForSDK);
  }, []);

  // Mount card fields when step changes and SDK is ready
  useEffect(() => {
    if (step === 3 && sdkReady && mpRef.current && (paymentMethod === "credit_card" || paymentMethod === "debit_card")) {
      // Only mount once
      if (!cardFieldsRef.current) {
        try {
          console.log("Mounting card fields...");
          const cardFieldsSettings = {
            amount: parseFloat(total),
            autoMount: true,
          };
          cardFieldsRef.current = mpRef.current.fields.create(cardFieldsSettings);
          cardFieldsRef.current.mount("cardPayment");
          console.log("Card fields mounted successfully");
        } catch (error) {
          console.error("Error mounting card fields:", error);
        }
      }
    }
  }, [step, sdkReady, paymentMethod, total]);

  // Fetch address based on CEP
  const handleCepChange = async (cep: string) => {
    const cleaned = cep.replace(/\D/g, "");
    setCustomerData(prev => ({
      ...prev,
      shippingAddress: { ...prev.shippingAddress, cep }
    }));

    if (cleaned.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setCustomerData(prev => ({
            ...prev,
            shippingAddress: {
              ...prev.shippingAddress,
              street: data.logradouro,
              neighborhood: data.bairro,
              city: data.localidade,
              state: data.uf,
            }
          }));
        }
      } catch (error) {
        console.error("Error fetching address:", error);
      }
    }
  };

  const handleCardPayment = async () => {
    try {
      if (!mpRef.current) {
        throw new Error("Mercado Pago SDK não inicializado. Tente novamente em alguns segundos.");
      }

      if (!cardFieldsRef.current) {
        throw new Error("Formulário de cartão não está pronto. Por favor, aguarde a carregamento completo.");
      }

      console.log("Creating card token...");

      // Create card token
      let tokenResult;
      try {
        tokenResult = await mpRef.current.fields.createCardToken({
          amount: parseFloat(total),
        });
      } catch (tokenError: any) {
        console.error("Token creation error:", tokenError);
        throw new Error(tokenError.message || "Erro ao processar dados do cartão. Verifique os dados e tente novamente.");
      }

      if (!tokenResult || tokenResult.status !== 200) {
        throw new Error(tokenResult?.message || "Erro ao criar token do cartão");
      }

      console.log("Token created successfully");
      setCardToken(tokenResult.data.token);

      // Send to backend
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenResult.data.token,
          amount: parseFloat(total),
          email: customerData.email,
          name: customerData.name,
          paymentMethod: "credit_card",
          installments: installments,
          customerData,
          items: selectedItems.map(item => ({
            productId: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
          })),
        }),
      });

      const result: PaymentResult = await response.json();
      return result;
    } catch (error: any) {
      console.error("Card payment error:", error);
      throw error;
    }
  };

  const handlePixPayment = async () => {
    try {
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(total),
          email: customerData.email,
          name: customerData.name,
          paymentMethod: "pix",
          customerData,
          items: selectedItems.map(item => ({
            productId: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
          })),
        }),
      });

      const result: PaymentResult = await response.json();
      return result;
    } catch (error) {
      console.error("PIX payment error:", error);
      throw error;
    }
  };

  const handleBoletoPayment = async () => {
    try {
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(total),
          email: customerData.email,
          name: customerData.name,
          paymentMethod: "boleto",
          customerData,
          items: selectedItems.map(item => ({
            productId: item.product.id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
          })),
        }),
      });

      const result: PaymentResult = await response.json();
      return result;
    } catch (error) {
      console.error("Boleto payment error:", error);
      throw error;
    }
  };

  const handlePayment = async () => {
    setIsLoading(true);
    setPaymentStatus("processing");

    try {
      let result: PaymentResult;

      if (paymentMethod === "credit_card" || paymentMethod === "debit_card") {
        result = await handleCardPayment();
      } else if (paymentMethod === "pix") {
        result = await handlePixPayment();
      } else if (paymentMethod === "boleto") {
        result = await handleBoletoPayment();
      } else {
        throw new Error("Método de pagamento inválido");
      }

      setPaymentResult(result);

      if (result.success && result.paymentStatus === "approved") {
        setPaymentStatus("success");
        setOrderId(result.orderId);
        clearCart();
        setStep(5);

        toast({
          title: "Pagamento aprovado!",
          description: `Pedido #${result.orderId} criado com sucesso.`,
        });
      } else if (result.success && result.paymentStatus === "pending") {
        // PIX or Boleto pending
        setPaymentStatus("success");
        setOrderId(result.orderId);
        clearCart();
        setStep(5);

        toast({
          title: "Pagamento iniciado",
          description: `Pedido #${result.orderId} aguardando confirmação.`,
        });
      } else {
        setPaymentStatus("error");
        toast({
          title: "Erro no pagamento",
          description: result.paymentStatus || "Verifique os dados e tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      setPaymentStatus("error");
      console.error("Payment error:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar pagamento",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: "Código PIX copiado para área de transferência.",
    });
  };

  // Format phone: (XX) XXXXX-XXXX
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  // Format CPF: XXX.XXX.XXX-XX
  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setCustomerData({ ...customerData, phone: formatted });
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCustomerData({ ...customerData, cpf: formatted });
  };

  if (selectedItems.length === 0 && step !== 4 && step !== 5) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center">
            <AlertCircleIcon size="xl" className="mx-auto mb-4 text-destructive" />
            <h1 className="text-2xl font-serif mb-4">Carrinho Vazio</h1>
            <p className="text-muted-foreground mb-6">Você não tem produtos selecionados para comprar.</p>
            <Button onClick={() => setLocation("/")}>Voltar para Loja</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Steps Indicator */}
          <div className="flex gap-4 mb-12">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex-1">
                <div
                  className={`h-2 rounded-full transition-colors ${
                    s <= step ? "bg-primary" : "bg-muted"
                  }`}
                />
                <p className="text-xs mt-2 text-muted-foreground">
                  {s === 1 ? "Dados" : s === 2 ? "Endereço" : s === 3 ? "Pagamento" : s === 4 ? "Revisão" : "Confirmação"}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              {/* Step 1: Customer Data */}
              {step === 1 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-serif mb-2">Seus Dados Pessoais</h2>
                    <p className="text-sm text-muted-foreground">Preencha com suas informações para que possamos completar seu pedido</p>
                  </div>

                  <div className="space-y-6">
                    {/* Nome Completo */}
                    <div>
                      <label className="flex items-center text-sm font-semibold text-gray-900 mb-3">
                        <UserIcon size="sm" className="mr-2 text-blue-600" />
                        Nome Completo
                      </label>
                      <Input
                        value={customerData.name}
                        onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                        placeholder="Digite seu nome completo"
                        maxLength={100}
                        className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Será usado para identificação na entrega</p>
                    </div>

                    {/* Email e Telefone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-900 mb-3">
                          <EmailIcon size="sm" className="mr-2 text-blue-600" />
                          Email
                        </label>
                        <Input
                          type="email"
                          value={customerData.email}
                          onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                          placeholder="seu.email@exemplo.com"
                          className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">Para confirmação do pedido</p>
                      </div>
                      <div>
                        <label className="flex items-center text-sm font-semibold text-gray-900 mb-3">
                          <PhoneIcon size="sm" className="mr-2 text-blue-600" />
                          Telefone
                        </label>
                        <Input
                          value={customerData.phone}
                          onChange={handlePhoneChange}
                          placeholder="(11) 99999-9999"
                          maxLength={15}
                          className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">Para contato sobre sua entrega</p>
                      </div>
                    </div>

                    {/* CPF */}
                    <div>
                      <label className="flex items-center text-sm font-semibold text-gray-900 mb-3">
                        <LockIcon size="sm" className="mr-2 text-blue-600" />
                        CPF
                      </label>
                      <Input
                        value={customerData.cpf}
                        onChange={handleCPFChange}
                        placeholder="000.000.000-00"
                        maxLength={14}
                        className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Sem pontuação: será formatado automaticamente</p>
                    </div>

                    {/* Info box */}
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>🔒 Seus dados estão seguros:</strong> Usaremos essas informações apenas para confirmação do pedido e entrega. Seus dados nunca serão compartilhados com terceiros.
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => setStep(2)}
                    disabled={!customerData.name || !customerData.email || !customerData.phone || !customerData.cpf}
                    className="w-full py-3 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Continuar para Endereço →
                  </Button>
                </div>
              )}

              {/* Step 2: Address */}
              {step === 2 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-serif mb-2">Endereço de Entrega</h2>
                    <p className="text-sm text-muted-foreground">Informe o endereço onde você deseja receber seu pedido</p>
                  </div>

                  <div className="space-y-6">
                    {/* CEP */}
                    <div>
                      <label className="flex items-center text-sm font-semibold text-gray-900 mb-3">
                        <MapPinIcon size="sm" className="mr-2 text-blue-600" />
                        CEP
                      </label>
                      <div className="relative">
                        <Input
                          value={customerData.shippingAddress.cep}
                          onChange={(e) => handleCepChange(e.target.value)}
                          placeholder="00000-000"
                          maxLength={9}
                          className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <a href="https://buscacep.correios.com.br/" target="_blank" rel="noopener noreferrer" className="absolute right-4 top-3 text-xs text-blue-600 hover:text-blue-700 font-medium">
                          Buscar CEP
                        </a>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Preencha para auto-completar o endereço</p>
                    </div>

                    {/* Rua */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">Rua / Avenida</label>
                      <Input
                        value={customerData.shippingAddress.street}
                        onChange={(e) => setCustomerData({
                          ...customerData,
                          shippingAddress: { ...customerData.shippingAddress, street: e.target.value }
                        })}
                        placeholder="Digite o nome da rua ou avenida"
                        readOnly={customerData.shippingAddress.street ? false : customerData.shippingAddress.cep.length < 8}
                        className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Número e Complemento */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-1">
                        <label className="block text-sm font-semibold text-gray-900 mb-3">Número *</label>
                        <Input
                          value={customerData.shippingAddress.number}
                          onChange={(e) => setCustomerData({
                            ...customerData,
                            shippingAddress: { ...customerData.shippingAddress, number: e.target.value }
                          })}
                          placeholder="1234"
                          className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-gray-900 mb-3">Complemento (opcional)</label>
                        <Input
                          value={customerData.shippingAddress.complement || ""}
                          onChange={(e) => setCustomerData({
                            ...customerData,
                            shippingAddress: { ...customerData.shippingAddress, complement: e.target.value }
                          })}
                          placeholder="Apto, sala, complemento..."
                          className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Bairro */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-3">Bairro</label>
                      <Input
                        value={customerData.shippingAddress.neighborhood}
                        onChange={(e) => setCustomerData({
                          ...customerData,
                          shippingAddress: { ...customerData.shippingAddress, neighborhood: e.target.value }
                        })}
                        placeholder="Digite o bairro"
                        readOnly={customerData.shippingAddress.neighborhood ? false : customerData.shippingAddress.cep.length < 8}
                        className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    {/* Cidade e Estado */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-gray-900 mb-3">Cidade</label>
                        <Input
                          value={customerData.shippingAddress.city}
                          onChange={(e) => setCustomerData({
                            ...customerData,
                            shippingAddress: { ...customerData.shippingAddress, city: e.target.value }
                          })}
                          placeholder="Digite a cidade"
                          readOnly={customerData.shippingAddress.city ? false : customerData.shippingAddress.cep.length < 8}
                          className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-sm font-semibold text-gray-900 mb-3">Estado</label>
                        <Input
                          value={customerData.shippingAddress.state}
                          onChange={(e) => setCustomerData({
                            ...customerData,
                            shippingAddress: { ...customerData.shippingAddress, state: e.target.value.toUpperCase() }
                          })}
                          placeholder="SP"
                          maxLength={2}
                          readOnly={customerData.shippingAddress.state ? false : customerData.shippingAddress.cep.length < 8}
                          className="border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Info box */}
                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                      <p className="text-sm text-amber-800">
                        <strong>📍 Informações:</strong> Preencha o CEP para auto-completar o endereço. Se ele não auto-completar, preencha manualmente os dados.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 py-3 text-sm font-semibold hover:bg-gray-100"
                    >
                      ← Voltar
                    </Button>
                    <Button
                      onClick={() => setStep(3)}
                      disabled={!customerData.shippingAddress.street || !customerData.shippingAddress.number}
                      className="flex-1 py-3 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continuar para Pagamento →
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Payment */}
              {step === 3 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-serif mb-2">Escolha Como Pagar</h2>
                    <p className="text-sm text-muted-foreground">Selecione o método de pagamento que você prefere</p>
                  </div>

                  {/* Payment Method Selection */}
                  <div className="space-y-6">
                    {/* Recomendados Section */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Recomendado</h3>

                      {/* PIX */}
                      <label className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        paymentMethod === "pix"
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="pix"
                          checked={paymentMethod === "pix"}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          className="w-5 h-5 mt-1"
                        />
                        <div className="ml-4 flex-1">
                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                            <PixIcon size="md" className="text-green-600" />
                            <span>PIX</span>
                            <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-semibold">Imediato</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">Transferência instantânea via Pix. Receba confirmação em segundos.</p>
                        </div>
                      </label>

                      {/* Boleto */}
                      <label className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        paymentMethod === "boleto"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="boleto"
                          checked={paymentMethod === "boleto"}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          className="w-5 h-5 mt-1"
                        />
                        <div className="ml-4 flex-1">
                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                            <BoletoIcon size="md" className="text-blue-600" />
                            <span>Boleto Bancário</span>
                            <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full font-semibold">1-2 dias</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">Gere o código de barras e pague no seu banco ou lotérica.</p>
                        </div>
                      </label>
                    </div>

                    {/* Cartões Section */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">Cartões</h3>

                      {/* Cartão de Crédito */}
                      <label className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        paymentMethod === "credit_card"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="credit_card"
                          checked={paymentMethod === "credit_card"}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          className="w-5 h-5 mt-1"
                        />
                        <div className="ml-4 flex-1">
                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                            <CreditCardIcon size="md" className="text-blue-600" />
                            <span>Cartão de Crédito</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">Compre parcelado em até 12 vezes. Seu pagamento é processado com segurança.</p>
                        </div>
                      </label>

                      {/* Cartão de Débito */}
                      <label className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        paymentMethod === "debit_card"
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 bg-white"
                      }`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="debit_card"
                          checked={paymentMethod === "debit_card"}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                          className="w-5 h-5 mt-1"
                        />
                        <div className="ml-4 flex-1">
                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                            <DebitCardIcon size="md" className="text-blue-600" />
                            <span>Cartão de Débito</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">Pagamento imediato. O valor é debitado direto de sua conta bancária.</p>
                        </div>
                      </label>
                    </div>

                    {/* Info box */}
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start gap-3">
                      <LockIcon size="md" className="text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-blue-800">
                          <strong>Pagamento Seguro:</strong> Todos os pagamentos são processados através do Mercado Pago com criptografia SSL, garantindo a segurança dos seus dados.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="flex-1 py-3 text-sm font-semibold hover:bg-gray-100"
                    >
                      ← Voltar
                    </Button>
                    <Button
                      onClick={() => setStep(4)}
                      className="flex-1 py-3 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Revisar Pedido →
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Review and Confirm */}
              {step === 4 && (
                <div className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-serif mb-2">Revise Seu Pedido</h2>
                    <p className="text-sm text-muted-foreground">Verifique todos os detalhes antes de confirmar a compra</p>
                  </div>

                  {/* Faturamento */}
                  <div className="space-y-4 pb-6 border-b">
                    <h3 className="font-semibold text-gray-900">Faturamento</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Nome</p>
                        <p className="text-sm font-medium text-gray-900">{customerData.name}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Email</p>
                        <p className="text-sm font-medium text-gray-900">{customerData.email}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Telefone</p>
                        <p className="text-sm font-medium text-gray-900">{customerData.phone}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">CPF</p>
                        <p className="text-sm font-medium text-gray-900">{customerData.cpf}</p>
                      </div>
                    </div>
                  </div>

                  {/* Detalhes da Entrega */}
                  <div className="space-y-4 pb-6 border-b">
                    <h3 className="font-semibold text-gray-900">Detalhes da entrega</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-full">
                        <p className="text-xs text-muted-foreground mb-1">Endereço</p>
                        <p className="text-sm font-medium text-gray-900">
                          {customerData.shippingAddress.street}, {customerData.shippingAddress.number}
                          {customerData.shippingAddress.complement && ` - ${customerData.shippingAddress.complement}`}
                        </p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Bairro</p>
                        <p className="text-sm font-medium text-gray-900">{customerData.shippingAddress.neighborhood}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Cidade</p>
                        <p className="text-sm font-medium text-gray-900">{customerData.shippingAddress.city}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Estado</p>
                        <p className="text-sm font-medium text-gray-900">{customerData.shippingAddress.state}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">CEP</p>
                        <p className="text-sm font-medium text-gray-900">{customerData.shippingAddress.cep}</p>
                      </div>
                    </div>
                  </div>

                  {/* Detalhes do Pagamento */}
                  <div className="space-y-4 pb-6 border-b">
                    <h3 className="font-semibold text-gray-900">Detalhes do pagamento</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Método</p>
                      <p className="text-sm font-medium text-gray-900">
                        {paymentMethod === "credit_card" ? "Cartão de Crédito" :
                         paymentMethod === "debit_card" ? "Cartão de Débito" :
                         paymentMethod === "pix" ? "PIX" : "Boleto"}
                      </p>
                    </div>
                  </div>

                  {/* Resumo da Compra */}
                  <div className="space-y-4 pb-6 border-b">
                    <h3 className="font-semibold text-gray-900">Resumo da Compra</h3>
                    <div className="space-y-3">
                      {selectedItems.map((item) => (
                        <div key={item.product.id} className="flex gap-4 bg-gray-50 p-4 rounded-lg">
                          {item.product.imageUrls && item.product.imageUrls.length > 0 && (
                            <img
                              src={item.product.imageUrls[0]}
                              alt={item.product.name}
                              className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900">{item.product.name}</p>
                              <p className="text-xs text-muted-foreground">Quantidade: {item.quantity}</p>
                            </div>
                            <p className="font-medium text-gray-900">R$ {(Number(item.product.price) * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium text-gray-900">R$ {total}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Frete</span>
                        <span className="font-medium text-gray-900">Grátis</span>
                      </div>
                      <div className="flex justify-between text-lg pt-2 border-t">
                        <span className="font-bold text-gray-900">Total</span>
                        <span className="font-bold text-blue-600">R$ {total}</span>
                      </div>
                    </div>
                  </div>

                  {(paymentMethod === "credit_card" || paymentMethod === "debit_card") && (
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Atenção:</strong> Você selecionou pagamento com cartão. Clique em "Voltar" para adicionar os dados do seu cartão.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setStep(3)}
                      className="flex-1 py-3 text-sm font-semibold"
                    >
                      Voltar
                    </Button>
                    <Button
                      onClick={handlePayment}
                      disabled={isLoading || paymentMethod === "credit_card" || paymentMethod === "debit_card"}
                      className="flex-1 py-3 text-sm font-semibold bg-blue-600 hover:bg-blue-700"
                    >
                      {isLoading ? (
                        <>
                          <LoaderIcon size="sm" className="mr-2" />
                          Processando...
                        </>
                      ) : (
                        `Confirmar a compra`
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 5: Confirmation */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <CheckCircleIcon size="xl" className="mx-auto text-green-600 mb-4" />
                    <h2 className="font-serif text-3xl mb-2">Pedido Criado!</h2>
                    <p className="text-xl text-muted-foreground">
                      Pedido <strong>#{orderId}</strong>
                    </p>
                  </div>

                  {/* Payment Status Messages */}
                  {paymentResult?.paymentStatus === "approved" && (
                    <>
                      <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>✓ Pagamento Aprovado!</strong> Seu pagamento foi processado com sucesso.
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Um email de confirmação foi enviado para <strong>{customerData.email}</strong>
                      </p>
                    </>
                  )}

                  {paymentResult?.paymentStatus === "pending" && paymentMethod === "pix" && (
                    <>
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                        <p className="text-sm text-yellow-800 mb-4">
                          <strong>Aguardando pagamento PIX</strong> - Escaneie o QR code ou copie a chave abaixo
                        </p>

                        {paymentResult?.qrCode && (
                          <div className="flex flex-col items-center gap-4">
                            <div className="bg-white p-4 rounded-lg border-2 border-yellow-200">
                              <QrCodeIcon size="xl" />
                            </div>
                            <button
                              onClick={() => copyToClipboard(paymentResult.qrCode || "")}
                              className="flex items-center gap-2 px-4 py-2 bg-yellow-100 hover:bg-yellow-200 rounded-lg transition-colors"
                            >
                              <CopyIcon size="sm" />
                              Copiar Código PIX
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        Confirmação será enviada para <strong>{customerData.email}</strong> após o pagamento
                      </p>
                    </>
                  )}

                  {paymentResult?.paymentStatus === "pending" && paymentMethod === "boleto" && (
                    <>
                      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                        <p className="text-sm text-yellow-800 mb-4">
                          <strong>Boleto Gerado</strong> - Seu código de barras foi criado
                        </p>
                        {paymentResult?.boletoUrl && (
                          <Button
                            onClick={() => window.open(paymentResult.boletoUrl, "_blank")}
                            className="w-full"
                          >
                            Visualizar Boleto
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        O código de barras também foi enviado para <strong>{customerData.email}</strong>
                      </p>
                    </>
                  )}

                  {/* Order Summary */}
                  <div className="bg-muted p-6 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Resumo do Pedido:</p>
                    <p className="text-2xl font-bold mb-4">R$ {parseFloat(total).toFixed(2)}</p>
                    <div className="text-sm space-y-1">
                      <p><strong>Método:</strong> {
                        paymentMethod === "credit_card" ? "Cartão de Crédito" :
                        paymentMethod === "debit_card" ? "Cartão de Débito" :
                        paymentMethod === "pix" ? "PIX" : "Boleto"
                      }</p>
                      <p><strong>Status:</strong> {
                        paymentResult?.paymentStatus === "approved" ? "Aprovado" :
                        paymentResult?.paymentStatus === "pending" ? "Aguardando" : "Rejeitado"
                      }</p>
                    </div>
                  </div>

                  <Button onClick={() => setLocation("/")} className="w-full mt-8">
                    Voltar para Loja
                  </Button>
                </div>
              )}
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-xl sticky top-20 shadow-sm">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-t-xl border-b border-blue-200">
                  <h3 className="font-serif text-xl font-semibold text-gray-900">Resumo do Pedido</h3>
                  <p className="text-xs text-gray-600 mt-1">Revise os itens antes de confirmar</p>
                </div>

                {/* Items */}
                <div className="p-6 space-y-3 border-b border-gray-200">
                  {selectedItems.map((item) => (
                    <div key={item.product.id} className="flex gap-3">
                      {item.product.imageUrls && item.product.imageUrls.length > 0 && (
                        <img
                          src={item.product.imageUrls[0]}
                          alt={item.product.name}
                          className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{item.product.name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-sm font-semibold text-blue-600">
                          R$ {(Number(item.product.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Costs */}
                <div className="p-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">R$ {total}</span>
                  </div>
                  <div className="flex justify-between text-sm bg-green-50 -mx-3 -mb-3 px-3 py-3 rounded-b-lg border-t border-green-100">
                    <span className="text-green-700 font-medium">Frete</span>
                    <span className="text-green-700 font-bold">Grátis</span>
                  </div>
                </div>

                {/* Total */}
                <div className="px-6 pt-4 pb-6 border-t-2 border-gray-200">
                  <div className="bg-blue-600 -mx-6 px-6 py-4 rounded-b-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-semibold">Total</span>
                      <span className="text-2xl font-bold text-white">R$ {total}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Note */}
                <div className="px-6 py-3 bg-gray-50 rounded-b-xl border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    ✓ Frete grátis em pedidos acima de R$ 500
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
