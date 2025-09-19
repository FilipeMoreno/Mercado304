# Componentes Responsivos de Dialog

Este documento explica como usar os novos componentes de dialog responsivos que alternam automaticamente entre desktop e mobile.

## Componentes Criados

### 1. ResponsiveDialog
Base para todos os dialogs responsivos.

```typescript
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"

<ResponsiveDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Título do Dialog"
  description="Descrição opcional"
  maxWidth="md" // sm, md, lg, xl, 2xl
>
  {/* Conteúdo do dialog */}
</ResponsiveDialog>
```

### 2. ResponsiveConfirmDialog
Para dialogs de confirmação (excluir, cancelar, etc.).

```typescript
import { ResponsiveConfirmDialog } from "@/components/ui/responsive-confirm-dialog"

<ResponsiveConfirmDialog
  open={deleteState.show}
  onOpenChange={(open) => !open && closeDeleteConfirm()}
  title="Confirmar Exclusão"
  description="Esta ação não pode ser desfeita"
  onConfirm={handleDelete}
  onCancel={closeDeleteConfirm}
  confirmText="Sim, Excluir"
  cancelText="Cancelar"
  confirmVariant="destructive"
  isLoading={isDeleting}
  icon={<Trash2 className="h-8 w-8 text-red-500" />}
>
  <p className="text-lg font-medium">
    Tem certeza que deseja excluir <strong>{item?.name}</strong>?
  </p>
  <p className="text-sm text-gray-600 mt-2">
    Todas as informações serão perdidas permanentemente.
  </p>
</ResponsiveConfirmDialog>
```

### 3. ResponsiveFormDialog
Para dialogs com formulários (editar, criar, etc.).

```typescript
import { ResponsiveFormDialog } from "@/components/ui/responsive-form-dialog"

<ResponsiveFormDialog
  open={!!editingItem}
  onOpenChange={(open) => !open && setEditingItem(null)}
  title="Editar Item"
  onSubmit={handleSubmit}
  onCancel={() => setEditingItem(null)}
  submitText="Salvar"
  isLoading={isSaving}
  maxWidth="lg"
>
  <div>
    <Label htmlFor="name">Nome</Label>
    <Input
      id="name"
      value={form.name}
      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
    />
  </div>
  {/* Mais campos do formulário */}
</ResponsiveFormDialog>
```

## Comportamento Automático

### 🖥️ Desktop (Mouse/Trackpad)
- Usa Dialog padrão do shadcn/ui
- Modal centralizado na tela
- Botões lado a lado
- Comportamento tradicional

### 📱 Mobile (Touch Device)
- Usa MobileModal otimizado
- Slide up from bottom
- Drag-to-close e swipe-to-close
- Botões empilhados (melhor para thumb)
- Ícones visuais centralizados

## Detecção Automática

A detecção é feita através do hook `useMobile()` que verifica:
- Suporte a touch (`'ontouchstart' in window`)
- Tamanho da tela
- User agent (como fallback)

## Páginas Já Implementadas

✅ **Produtos** (`/src/app/produtos/products-client.tsx`)
- Dialog de confirmação de exclusão

✅ **Mercados** (`/src/app/mercados/mercados-client.tsx`)  
- Dialog de confirmação de exclusão

✅ **Categorias** (`/src/app/categorias/categorias-client.tsx`)
- Dialog de edição (ResponsiveFormDialog)
- Dialog de confirmação de exclusão

✅ **Marcas** (`/src/app/marcas/marcas-client.tsx`)
- Dialog de edição (ResponsiveFormDialog)
- Dialog de confirmação de exclusão

✅ **Compras** (`/src/app/compras/purchases-client.tsx`)
- Dialog de visualização de detalhes (ResponsiveDialog)
- Dialog de confirmação de exclusão

✅ **Receitas** (`/src/app/receitas/receitas-client.tsx`)
- Dialog de confirmação de exclusão (NOVO!)

🔄 **Estoque** (`/src/app/estoque/estoque-client.tsx`)
- Deixado para refatoração futura (dialogs muito complexos)

## Como Migrar Páginas Existentes

### Passo 1: Substituir Imports
```typescript
// ❌ Antes
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// ✅ Depois
import { ResponsiveConfirmDialog } from "@/components/ui/responsive-confirm-dialog"
// ou
import { ResponsiveFormDialog } from "@/components/ui/responsive-form-dialog"
```

### Passo 2: Substituir Implementação

#### Dialog de Confirmação
```typescript
// ❌ Antes
<Dialog open={deleteState.show} onOpenChange={(open) => !open && closeDeleteConfirm()}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Trash2 className="h-5 w-5 text-red-500" />
        Confirmar Exclusão
      </DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <p>Tem certeza que deseja excluir {item?.name}?</p>
      <div className="flex gap-2 pt-4">
        <Button variant="destructive" onClick={handleDelete}>
          Sim, Excluir
        </Button>
        <Button variant="outline" onClick={closeDeleteConfirm}>
          Cancelar
        </Button>
      </div>
    </div>
  </DialogContent>
</Dialog>

// ✅ Depois
<ResponsiveConfirmDialog
  open={deleteState.show}
  onOpenChange={(open) => !open && closeDeleteConfirm()}
  title="Confirmar Exclusão"
  onConfirm={handleDelete}
  confirmText="Sim, Excluir"
  confirmVariant="destructive"
  icon={<Trash2 className="h-8 w-8 text-red-500" />}
>
  <p>Tem certeza que deseja excluir <strong>{item?.name}</strong>?</p>
</ResponsiveConfirmDialog>
```

## Benefícios

1. **UX Consistente**: Mesma experiência otimizada em desktop e mobile
2. **Manutenção Simples**: Um componente para todos os casos
3. **Automático**: Não precisa gerenciar manualmente mobile vs desktop
4. **Reutilizável**: Funciona em qualquer página do sistema
5. **Type-Safe**: TypeScript completo
6. **Acessível**: Mantém todas as funcionalidades de acessibilidade

## Próximos Passos

Para implementar em uma nova página:

1. Substitua os imports de Dialog
2. Use ResponsiveConfirmDialog para confirmações
3. Use ResponsiveFormDialog para formulários  
4. Use ResponsiveDialog para casos customizados
5. Teste em desktop e mobile

**Todas as demais páginas do sistema podem ser migradas seguindo estes padrões!**