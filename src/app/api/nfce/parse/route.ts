import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Interface para os itens (sem alteração)
interface NfceItem {
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

// Nova interface para as informações do mercado
interface NfceMarketInfo {
  name: string;
  address: string;
}

// Função auxiliar (sem alteração)
const extractNumber = (text: string): number => {
  const match = text.match(/:\s*([\d,.]+)/);
  if (!match || !match[1]) return 0;
  return parseFloat(match[1].replace('.', '').replace(',', '.'));
};

export async function POST(request: Request) {
  let htmlContent = '';

  try {
    const { url } = await request.json();
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL da NFC-e é inválida.' }, { status: 400 });
    }

    console.log(`[NFCe Parse V4] Iniciando processo para URL: ${url}`);
    const { data: html } = await axios.get(url, {
      timeout: 15000,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36' },
    });

    htmlContent = html;
    const $ = cheerio.load(html);

    // --- NOVA EXTRAÇÃO DE DADOS DO MERCADO ---
    const marketName = $('#u20.txtTopo').text().trim();
    // Pega o terceiro div com a classe 'text', que contém o endereço
    const marketAddress = $('.txtCenter .text').eq(1).text().trim().replace(/\s+/g, ' ');

    const marketInfo: NfceMarketInfo = {
      name: marketName,
      address: marketAddress,
    };
    console.log(`[NFCe Parse V4] Mercado encontrado:`, marketInfo);

    // --- Extração de Itens (código anterior, sem alterações) ---
    const itemsTable = $('table#tabResult');
    if (itemsTable.length === 0) {
      throw new Error('A tabela de produtos principal (#tabResult) não foi encontrada.');
    }

    const items: NfceItem[] = [];
    itemsTable.find('tr').each((i, row) => {
      const firstColumn = $(row).find('td').first();
      const secondColumn = $(row).find('td').last();
      if (firstColumn.length === 0) return;

      const nameText = firstColumn.find('.txtTit2').text().trim();
      const quantityText = firstColumn.find('.Rqtd').text().trim();
      const unitText = firstColumn.find('.RUN').text().trim().replace('UN:', '').trim();
      const unitPriceText = firstColumn.find('.RvlUnit').text().trim();
      const totalPriceText = secondColumn.find('.valor').text().trim();

      if (nameText) {
        items.push({
          name: nameText,
          quantity: extractNumber(quantityText) || 1,
          unit: unitText || 'UN',
          unitPrice: extractNumber(unitPriceText) || 0,
          totalPrice: parseFloat(totalPriceText.replace(',', '.')) || 0,
        });
      }
    });

    if (items.length === 0) {
      throw new Error('Nenhum item foi extraído.');
    }

    console.log(`[NFCe Parse V4] Total de itens: ${items.length}.`);

    // Retorna um objeto com os itens E as informações do mercado
    return NextResponse.json({ items, marketInfo });

  } catch (error: any) {
    // ... (o bloco de erro continua o mesmo)
    console.error('[NFCe Parse V4] Erro detalhado:', error.message);
    const errorResponse = {
      error: 'Não foi possível processar a nota fiscal.',
      details: error.message || 'Erro desconhecido.',
      debug: { htmlSnapshot: htmlContent.substring(0, 2000) + (htmlContent.length > 2000 ? '...' : '') },
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}