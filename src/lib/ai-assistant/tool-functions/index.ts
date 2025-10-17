// Importa todas as funções das ferramentas

import { analyticsFunctions } from "./analytics-functions"
import { categoryBrandFunctions } from "./category-brand-functions"
import { churrascoFunctions } from "./churrasco-functions"
import { dashboardFunctions } from "./dashboard-functions"
import { marketFunctions } from "./market-functions"
import { priceFunctions } from "./price-functions"
import { productFunctions } from "./product-functions"
import { productRecognitionFunctions } from "./product-recognition-functions"
import { purchaseFunctions } from "./purchase-functions"
import { recipeFunctions } from "./recipe-functions"
import { selectionFunctions } from "./selection-functions"
import { shoppingListFunctions } from "./shopping-list-functions"
import { stockFunctions } from "./stock-functions"
import { advancedAnalyticsFunctions } from "./advanced-analytics-functions"
import { advancedStockFunctions } from "./advanced-stock-functions"
import { predictionFunctions } from "./prediction-functions"
import { kitFunctions } from "./kit-functions"

// Exporta todas as funções das ferramentas em um único objeto
export const toolFunctions = {
	...dashboardFunctions,
	...productFunctions,
	...productRecognitionFunctions,
	...marketFunctions,
	...categoryBrandFunctions,
	...shoppingListFunctions,
	...purchaseFunctions,
	...stockFunctions,
	...recipeFunctions,
	...analyticsFunctions,
	...selectionFunctions,
	...priceFunctions,
	...churrascoFunctions,
	...advancedAnalyticsFunctions,
	...advancedStockFunctions,
	...predictionFunctions,
	...kitFunctions,
}
