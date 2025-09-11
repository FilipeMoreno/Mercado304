// Importa todas as funções das ferramentas
import { dashboardFunctions } from './dashboard-functions';
import { productFunctions } from './product-functions';
import { marketFunctions } from './market-functions';
import { categoryBrandFunctions } from './category-brand-functions';
import { shoppingListFunctions } from './shopping-list-functions';
import { purchaseFunctions } from './purchase-functions';
import { stockFunctions } from './stock-functions';
import { recipeFunctions } from './recipe-functions';
import { analyticsFunctions } from './analytics-functions';
import { selectionFunctions } from './selection-functions';
import { priceFunctions } from './price-functions';
import { churrascoFunctions } from './churrasco-functions';

// Exporta todas as funções das ferramentas em um único objeto
export const toolFunctions = {
	...dashboardFunctions,
	...productFunctions,
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
};