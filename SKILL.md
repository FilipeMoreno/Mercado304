# Padrões de Arquitetura e Stack Tecnológica (Next.js 16)

Este documento define a arquitetura, stack tecnológica e padrões de codificação do projeto. O objetivo é garantir consistência, performance e o uso das melhores práticas e tecnologias.

O assistente de IA deve aderir a estes padrões ao gerar ou modificar código.

## 1. Configuração do Assistente de IA

* **Modelo de IA:** **Gemini 2.5-flash**
* **Finalidade:** O assistente (executando este modelo) é responsável por entender este documento e aplicar ativamente esses padrões ao responder perguntas, gerar código, ou modificar arquivos.
* **Foco do Modelo:** Sendo um modelo "flash", a IA deve priorizar a velocidade e a eficiência no uso de ferramentas (tool use), entendendo que as definições de ferramentas estão em `src/lib/ai-assistant/tool-definitions.ts`.

## 2. Stack de Tecnologias Principal

1.  **Framework:** **Next.js 16 (App Router)**.
2.  **Compilador React:** **React Compile** (Habilitado por padrão).
3.  **Gerenciamento de Estado de Servidor (Server State):** **TanStack Query (React Query)**.
4.  **Gerenciamento de Estado de Cliente (Client State):** **Zustand**.
5.  **UI:** `shadcn/ui` e Tailwind CSS.
6.  **Formulários:** `react-hook-form` e `zod` (para validação).
7.  **Banco de Dados:** Prisma ORM.
8.  **Gerenciamento de Erros:** Sistema de classes e códigos de erro personalizados (`src/lib/errors.ts`).

---

## 3. Padrão de Otimização (React Compile)

Com a adoção do **Next.js 16**, este projeto usa **React Compile** para otimização automática. Isso muda fundamentalmente como escrevemos componentes.

### Regra de Ouro: NÃO MEMOIZE MANUALMENTE

O React Compile analisa o código e insere automaticamente o equivalente a `useMemo`, `useCallback` e `React.memo` onde for necessário.

1.  **NÃO USE `useMemo()`:** O compilador analisará as dependências e memoizará valores complexos automaticamente.
2.  **NÃO USE `useCallback()`:** O compilador memoizará funções automaticamente, garantindo a estabilidade de referência.
3.  **NÃO USE `React.memo()`:** O compilador otimizará os componentes e seus re-renders, tornando o `React.memo()` obsoleto.

O assistente de IA **NÃO DEVE** sugerir o uso de `useMemo`, `useCallback`, ou `React.memo` em novo código.

### O Padrão Correto (Simplicidade)

Escreva componentes e lógica de forma "ingênua" (reativa pura), sem se preocupar com otimização manual. O compilador fará o trabalho pesado.

* **NÃO FAÇA (Legado):**
    ```tsx
    // ERRADO - Padrão antigo
    const expensiveValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
    const handleClick = useCallback(() => { /*...*/ }, [dep]);
    export const MyComponent = React.memo(({ value }) => { /*...*/ });
    ```

* **FAÇA ISSO (Next 16 / React Compile):**
    ```tsx
    // CERTO - O compilador faz o trabalho
    const expensiveValue = computeExpensiveValue(a, b);
    const handleClick = () => { /*...*/ };
    export const MyComponent = ({ value }) => { /*...*/ };
    ```

---

## 4. Padrões de Gerenciamento de Dados (O Padrão Ouro)

Este é o fluxo de trabalho mais importante do projeto.

### Fluxo 1: Como buscar dados (Data Fetching)

1.  **NÃO USE** `useEffect` + `useState` para data fetching.
2.  **FAÇA ISSO:**
    1.  **API Route:** Crie a lógica de backend em `/src/app/api/...`.
    2.  **Serviço:** Crie a função de *fetch* pura em `/src/services/...` (ex: `getProducts`).
    3.  **Hook (TanStack):** Crie um hook `useQuery` em `/src/hooks/...` (ex: `useGetProducts`).
    4.  **Componente:** Use o hook (ex: `const { data, isLoading } = useGetProducts();`).

### Fluxo 2: Como modificar dados (Data Mutation)

1.  **Hook (TanStack):** Crie um hook `useMutation` (ex: `useCreateProduct`).
2.  **Callbacks:**
    * `mutationFn`: A função do serviço que faz o `POST`/`PUT`/`DELETE`.
    * `onSuccess`: Use `queryClient.invalidateQueries(...)` para revalidar o cache.
    * `onError`: Trate os erros personalizados (veja a seção 5).

### Fluxo 3: Como usar Estado Global (Client State)

1.  **NÃO FAÇA:** Use React Context para estado que muda frequentemente.
2.  **FAÇA ISSO:** Use **Zustand** para estado global de UI (ex: `isSidebarOpen`).
    * Defina stores em `/src/store/...` (ex: `useUIStore.ts`).

---

## 5. Padrões de Gerenciamento de Erros Personalizado

Este projeto **DEVE** usar um sistema de erros personalizados para padronizar a comunicação de falhas entre o backend (API routes) e o frontend.

### Arquivos Principais de Erros

* **`src/lib/errors.ts`**: Define as classes de erro base (ex: `ApiError`) e códigos de erro genéricos (ex: `ErrorCode.NOT_FOUND`).
* **`src/lib/auth-errors.ts`**: Define códigos de erro específicos para autenticação (ex: `AuthErrorCode.INVALID_CREDENTIALS`).
* **`src/lib/api-utils.ts`**: Deve conter um *handler* (ex: `handleApiError`) para capturar erros e formatar a resposta JSON.

### Fluxo de Trabalho de Erros

1.  **Backend (Lançando Erros na API):**
    * **FAÇA:** `throw new ApiError('Produto não encontrado', ErrorCode.NOT_FOUND, 404);`
    * O *handler* `handleApiError` deve capturar esse erro e retornar um `Response.json({ message: '...', code: '...' }, { status: 404 })` padronizado.

2.  **Frontend (Tratando Erros no Cliente):**
    * Use o hook `onError` do `useMutation` (TanStack Query).
    * O objeto `error` conterá `message` e `code`.
    * **Use `error.code` para lógica condicional** (ex: redirecionamentos, mensagens específicas).
    * **Use `error.message` para exibir ao usuário** (ex: `toast.error(error.message)`).