'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, QrCode, TestTube2 } from 'lucide-react';
import { NfceBarcodeScanner } from '@/components/nfce-barcode-scanner';
import NfceItemReview, { MappedPurchaseItem, NfceItem } from '@/components/nfce-item-review';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MarketSelect } from '@/components/selects/market-select';
import { Separator } from '@/components/ui/separator';
import { Market } from '@prisma/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreatePurchaseMutation } from '@/hooks/use-react-query';
import { Skeleton } from '@/components/ui/skeleton';

type ViewState = 'idle' | 'processing' | 'reviewing';

// Nova interface para a resposta da API de parse
interface NfceParseResponse {
  items: NfceItem[];
  marketInfo: {
    name: string;
    address: string;
  };
}

export default function ImportarCompraPage() {
  const router = useRouter();
  const [viewState, setViewState] = useState<ViewState>('idle');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [nfceItems, setNfceItems] = useState<NfceItem[]>([]);
  const [manualUrl, setManualUrl] = useState(
    'http://www.fazenda.pr.gov.br/nfce/qrcode?p=41251076430438008237650080001712061008864722|2|1|1|C3B54BA4A5961DD79E730056392FBD377B092121'
  );

  // Estados da compra
  const [marketId, setMarketId] = useState<number | null>(null);
  const [suggestedMarket, setSuggestedMarket] = useState<Market | null>(null); // Estado para o mercado sugerido
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);

  const mutation = useCreatePurchaseMutation();

  const handleScanSuccess = async (url: string) => {
    setIsScannerOpen(false);
    setViewState('processing');
    setSuggestedMarket(null); // Limpa sugestão anterior
    setMarketId(null);

    try {
      const response = await fetch('/api/nfce/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Falha ao processar a nota fiscal.');
      }

      const { items, marketInfo }: NfceParseResponse = await response.json();

      setNfceItems(items);
      setViewState('reviewing');

      // Após o sucesso, tenta encontrar o mercado
      if (marketInfo?.name) {
        const marketResponse = await fetch('/api/markets/find-by-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(marketInfo),
        });
        const foundMarket = await marketResponse.json();
        if (foundMarket) {
          setSuggestedMarket(foundMarket);
          setMarketId(foundMarket.id); // Pré-seleciona o mercado
          toast.info(`Mercado sugerido: ${foundMarket.name}`, {
            description: "Verificamos o endereço da nota e encontramos um mercado correspondente.",
          });
        }
      }

    } catch (error: any) {
      toast.error("Erro ao ler a nota", { description: error.message });
      setViewState('idle');
    }
  };

  const handleReviewConfirm = (mappedItems: MappedPurchaseItem[]) => {
    if (!marketId) {
      toast.error('Selecione um mercado antes de salvar.');
      return;
    }
    const total = mappedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    // Preparar os itens para a API
    const purchaseItems = mappedItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.price,
      productName: item.productName,
      addToStock: true, // Adicionar ao estoque por padrão
      stockEntries: [{
        quantity: item.quantity,
        location: 'Despensa',
      }]
    }));
    
    mutation.mutate({ 
      marketId, 
      paymentMethod, 
      purchaseDate: new Date(purchaseDate), 
      totalAmount: total, 
      items: purchaseItems 
    });
  };

  const handleManualSubmit = () => {
    if (manualUrl.trim()) {
      handleScanSuccess(manualUrl.trim());
    } else {
      toast.warning('Por favor, insira uma URL válida.');
    }
  }

  const renderContent = () => {
    switch (viewState) {
      case 'processing':
        return (
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 grid md:grid-cols-3 gap-4">
                <div>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div>
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-12 w-12" />
                        <div>
                          <Skeleton className="h-5 w-40 mb-2" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      </div>
                      <div>
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-4 space-x-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </CardContent>
            </Card>
            <p className="text-center text-lg text-muted-foreground">Analisando nota fiscal...</p>
          </div>
        );

      case 'reviewing':
        return (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="market">Mercado *</Label>
                  <MarketSelect
                    key={suggestedMarket?.id} // Força a remontagem quando a sugestão muda
                    initialMarket={suggestedMarket}
                    onSelect={setMarketId}
                  />
                </div>
                <div>
                  <Label htmlFor="payment-method">Forma de Pagamento</Label>

                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent
                      id="payment-method" className="w-full rounded-md" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                      <SelectItem value="DEBIT_CARD">Cartão de Débito</SelectItem>
                      <SelectItem value="CASH">Dinheiro</SelectItem >
                      <SelectItem value="PIX">Pix</SelectItem>
                      <SelectItem value="OTHER">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date">Data da Compra</Label>
                  <Input id="date" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
                </div>
              </CardContent>
            </Card>
            <NfceItemReview items={nfceItems} onConfirm={handleReviewConfirm} onCancel={() => setViewState('idle')} isSubmitting={mutation.isPending} />
          </div>
        );

      case 'idle':
      default:
        return (
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="text-center">
                <QrCode className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Importar Compra via QR Code</h3>
                <p className="mt-2 text-sm text-muted-foreground">Use a câmera para escanear o código do seu cupom fiscal.</p>
                <Button className="mt-6" onClick={() => setIsScannerOpen(true)}>Escanear com a Câmera</Button></div>
              {process.env.NODE_ENV === 'development' && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <TestTube2 className="h-5 w-5 text-muted-foreground" />
                      <h4 className="font-medium text-muted-foreground">Para Desenvolvedor/Teste</h4>
                    </div>
                    <p className="text-xs text-muted-foreground">Cole a URL completa do QR Code da nota fiscal para testar a importação manualmente.</p>
                    <div>
                      <Label htmlFor="manual-url">URL da Nota Fiscal</Label>
                      <Input id="manual-url" placeholder="http://..." value={manualUrl} onChange={(e) => setManualUrl(e.target.value)} />
                    </div>
                    <Button variant="secondary" className="w-full" onClick={handleManualSubmit}>
                      Importar Manualmente
                    </Button>
                  </div>
                </>)}
            </CardContent>
          </Card>
        );
    }
  }

  return (
    <div className="container mx-auto p-4"><h1 className="text-3xl font-bold mb-6">Importar Compra por Nota Fiscal</h1>{renderContent()}<NfceBarcodeScanner isOpen={isScannerOpen} onScan={handleScanSuccess} onClose={() => setIsScannerOpen(false)} /></div>
  );
}