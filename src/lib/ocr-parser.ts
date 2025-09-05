// src/lib/ocr-parser.ts

interface ParsedNutritionalInfo {
  servingSize?: string;
  calories?: number;
  proteins?: number;
  totalFat?: number;
  saturatedFat?: number;
  transFat?: number;
  carbohydrates?: number;
  totalSugars?: number;
  addedSugars?: number;
  fiber?: number;
  sodium?: number;
  allergensContains: string[];
  allergensMayContain: string[];
}

// Padrões para tabela nutricional brasileira (ANVISA)
const nutrientMap = {
  // Valor energético
  calories: [
    /valor\s+energ[ée]tico\s*[:\-]?\s*(\d+(?:[,\.]?\d*)?)\s*(?:kcal|cal)/i,
    /energia\s*[:\-]?\s*(\d+(?:[,\.]?\d*)?)\s*(?:kcal|cal)/i,
    /caloria[s]?\s*[:\-]?\s*(\d+(?:[,\.]?\d*)?)/i
  ],
  
  // Carboidratos
  carbohydrates: [
    /carboidrato[s]?\s*[:\-]?\s*(\d+(?:[,\.]?\d*)?)\s*g/i,
    /carboidrato[s]?\s*totais\s*[:\-]?\s*(\d+(?:[,\.]?\d*)?)\s*g/i,
    /glicídio[s]?\s*[:\-]?\s*(\d+(?:[,\.]?\d*)?)\s*g/i
  ],
  
  // Açúcares
  totalSugars: [
    /açúcar(?:es)?\s*[:\-]?\s*(\d+(?:[,\.]?\d*)?)\s*g/i,
    /açúcar(?:es)?\s*totais\s*[:\-]?\s*(\d+(?:[,\.]?\d*)?)\s*g/i
  ],
  
  addedSugars: [
    /açúcar(?:es)?\s*adicionado[s]?\s*[:\-]?\s*(\d+(?:[,\.]?\d*)?)\s*g/i,
    /açúcar(?:es)?\s*livre[s]?\s*[:\-]?\s*(\d+(?:[,\.]?\d*)?)\s*g/i
  ],
  
  // Proteínas
  proteins: [
    /prote[íi]na[s]?\s*[:\-]?\s*(\d+(?:[,\.]?\d*)?)\s*g/i
  ],
  
  // Gorduras
  totalFat: [
    /gordura[s]?\s*[:\-]?\s*(\d+(?:[,\.]?\d*)?)\s*g/i,
    /gordura[s]?\s*totais\s*[:\-]?\s*(\d+(?:[,\.]?\d*)?)\s*g/i,
    /lip[íi]dio[s]?\s*[:\-]?\s*(\d+(?:[,\.]?\d*)?)\s*g/i
  ],
  
  saturatedFat: [
    /gordura[s]?\s*saturada[s]?\s*[:\-]?\s*(\d+(?:[,\.]?\d*)?)\s*g/i,
    /ácido[s]?\s*graxo[s]?\s*saturado[s]?\s*[:\-]?\s*(\d+(?:[,\.]?\d*)?)\s*g/i
  ],
  
  transFat: [
    /gordura[s]?\s*trans\s*[:\-]?\s*(\d+(?:[,\.]?\d*)?)\s*g/i,
    /ácido[s]?\s*graxo[s]?\s*trans\s*[:\-]?\s*(\d+(?:[,\.]?\d*)?)\s*g/i
  ],
  
  // Fibras
  fiber: [
    /fibra[s]?\s*[:\-]?\s*(\d+(?:[,\.]?\d*)?)\s*g/i,
    /fibra[s]?\s*alimentar(?:es)?\s*[:\-]?\s*(\d+(?:[,\.]?\d*)?)\s*g/i
  ],
  
  // Sódio
  sodium: [
    /s[óo]dio\s*[:\-]?\s*(\d+(?:[,\.]?\d*)?)\s*mg/i,
    /sal\s*[:\-]?\s*(\d+(?:[,\.]?\d*)?)\s*g/i // Converter sal para sódio se necessário
  ]
};

// Padrões para porção
const servingSizePatterns = [
  /por[çc][ãa]o\s*[:\-]?\s*(\d+(?:[,\.]?\d*)?)\s*(g|ml|unidade[s]?|fatia[s]?|colher(?:es)?|x[íi]cara[s]?)/i,
  /por[çc][ãa]o\s*de\s*(\d+(?:[,\.]?\d*)?)\s*(g|ml)/i,
  /(\d+(?:[,\.]?\d*)?)\s*(g|ml|unidade[s]?|fatia[s]?)\s*(?:\(.*?\))?$/im
];

// Padrões para alérgenos brasileiros
const allergenPatterns = {
  contains: [
    /al[ée]rgico[s]?\s*[:\-]?\s*cont[ée]m\s*[:\-]?\s*([^\.]+?)(?:\.|$)/i,
    /cont[ée]m\s*[:\-]?\s*([^\.]+?)(?:\.|pode conter|$)/i,
    /ingrediente[s]?\s*al[ée]rg[êe]nico[s]?\s*[:\-]?\s*([^\.]+?)(?:\.|$)/i
  ],
  mayContain: [
    /pode conter\s*[:\-]?\s*([^\.]+?)(?:\.|$)/i,
    /conter tra[çc]o[s]?\s*de\s*[:\-]?\s*([^\.]+?)(?:\.|$)/i,
    /processado em equipamento[s]?\s*que processam?\s*([^\.]+?)(?:\.|$)/i
  ]
};

// Lista de alérgenos comuns no Brasil
const commonAllergens = [
  'leite', 'ovos', 'peixes', 'crustáceos', 'nozes', 'amendoim', 'trigo', 'soja',
  'gergelim', 'sulfitos', 'glúten', 'castanhas', 'amêndoas', 'avelãs', 'pistache',
  'macadâmia', 'pecã', 'caju', 'brasil', 'mostarda', 'aipo', 'lupin'
];

function parseValue(value: string | undefined): number | undefined {
  if (!value) return undefined;
  
  // Lidar com vírgula decimal brasileira
  const cleanValue = value.replace(',', '.').replace(/[^\d\.]/g, '');
  const numValue = parseFloat(cleanValue);
  
  return isNaN(numValue) ? undefined : numValue;
}

function extractServingSize(text: string): string | undefined {
  for (const pattern of servingSizePatterns) {
    const match = text.match(pattern);
    if (match) {
      const amount = match[1];
      const unit = match[2];
      return `${amount} ${unit}`;
    }
  }
  return undefined;
}

function extractNutrients(text: string): Partial<ParsedNutritionalInfo> {
  const data: Partial<ParsedNutritionalInfo> = {};
  
  for (const [key, patterns] of Object.entries(nutrientMap)) {
    for (const regex of patterns) {
      const match = text.match(regex);
      if (match && match[1]) {
        const value = parseValue(match[1]);
        if (value !== undefined) {
          // Conversão especial para sal em sódio (1g sal ≈ 400mg sódio)
          if (key === 'sodium' && text.includes('sal') && !text.includes('sódio')) {
            data[key as keyof typeof nutrientMap] = value * 400;
          } else {
            data[key as keyof typeof nutrientMap] = value;
          }
          break;
        }
      }
    }
  }
  
  return data;
}

function extractAllergens(text: string): { contains: string[], mayContain: string[] } {
  const allergensContains: string[] = [];
  const allergensMayContain: string[] = [];
  
  // Buscar alérgenos que contém
  for (const pattern of allergenPatterns.contains) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const allergenList = match[1]
        .toLowerCase()
        .split(/[,;]|\s+e\s+|\s+ou\s+/)
        .map(s => s.trim())
        .filter(Boolean);
        
      for (const allergen of allergenList) {
        // Verificar se é um alérgeno conhecido
        const foundAllergen = commonAllergens.find(common => 
          allergen.includes(common) || common.includes(allergen)
        );
        if (foundAllergen && !allergensContains.includes(foundAllergen)) {
          allergensContains.push(foundAllergen);
        }
      }
    }
  }
  
  // Buscar alérgenos que pode conter
  for (const pattern of allergenPatterns.mayContain) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const allergenList = match[1]
        .toLowerCase()
        .split(/[,;]|\s+e\s+|\s+ou\s+/)
        .map(s => s.trim())
        .filter(Boolean);
        
      for (const allergen of allergenList) {
        const foundAllergen = commonAllergens.find(common => 
          allergen.includes(common) || common.includes(allergen)
        );
        if (foundAllergen && !allergensMayContain.includes(foundAllergen)) {
          allergensMayContain.push(foundAllergen);
        }
      }
    }
  }
  
  return { contains: allergensContains, mayContain: allergensMayContain };
}

export function parseOcrResult(text: string): ParsedNutritionalInfo {
  // Limpar e normalizar o texto
  const cleanedText = text
    .replace(/(\r\n|\n|\r)/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
  
  // Extrair porção
  const servingSize = extractServingSize(cleanedText);
  
  // Extrair nutrientes
  const nutrients = extractNutrients(cleanedText);
  
  // Extrair alérgenos
  const allergens = extractAllergens(cleanedText);
  
  return {
    servingSize,
    ...nutrients,
    allergensContains: allergens.contains,
    allergensMayContain: allergens.mayContain,
  };
}

// Função auxiliar para validar dados extraídos
export function validateNutritionalData(data: ParsedNutritionalInfo): {
  isValid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Verificações básicas
  if (data.calories && data.calories > 900) {
    warnings.push('Valor calórico muito alto, verifique se está correto');
  }
  
  if (data.proteins && data.proteins > 100) {
    warnings.push('Valor de proteínas muito alto, verifique se está correto');
  }
  
  if (data.sodium && data.sodium > 5000) {
    warnings.push('Valor de sódio muito alto, verifique se está correto');
  }
  
  // Verificar se pelo menos um nutriente foi encontrado
  const hasNutrients = Object.values(data).some(value => 
    typeof value === 'number' && value > 0
  );
  
  return {
    isValid: hasNutrients || data.allergensContains.length > 0 || data.allergensMayContain.length > 0,
    warnings
  };
}