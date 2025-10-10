# Design System - Guia Rápido de Referência

## 🎨 Cores Mais Usadas

```tsx
// Backgrounds
bg-background           // Fundo principal
bg-muted               // Fundo secundário
bg-primary/5           // Fundo sutil (5%)
bg-primary/10          // Fundo ícone (10%)
bg-muted/30            // Fundo item lista (30%)

// Textos
text-foreground        // Texto principal
text-muted-foreground  // Texto secundário
text-primary           // Texto destaque

// Estados
bg-green-500/5 + text-green-600 dark:text-green-400  // Sucesso
bg-red-500/5 + text-red-600 dark:text-red-400        // Erro
bg-orange-500/5 + text-orange-600                    // Aviso
```

## 🧩 Templates Prontos

### Card Básico
```tsx
<Card className="shadow-sm">
  <CardContent className="pt-6">
    {/* conteúdo */}
  </CardContent>
</Card>
```

### Banner Informativo
```tsx
<div className="p-6 bg-primary/5 rounded-lg">
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-full bg-primary/10">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <div>
      <h3 className="font-semibold">Título</h3>
      <p className="text-sm text-muted-foreground mt-1">Descrição</p>
    </div>
  </div>
</div>
```

### Item de Lista
```tsx
<div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-full bg-primary/10">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <div>
      <h4 className="font-medium">Título</h4>
      <p className="text-sm text-muted-foreground">Descrição</p>
    </div>
  </div>
  <Button variant="outline" size="sm">Ação</Button>
</div>
```

### Tabs Modernas
```tsx
<TabsList className="inline-flex h-11 items-center justify-center rounded-lg bg-muted p-1 w-auto">
  <TabsTrigger value="tab1" className="rounded-md px-4">
    <Icon className="h-4 w-4 mr-2" />
    Tab 1
  </TabsTrigger>
</TabsList>
```

### Input com Label
```tsx
<div className="space-y-2">
  <Label htmlFor="id" className="text-sm font-medium">Label</Label>
  <Input id="id" className="h-11" placeholder="Placeholder" />
</div>
```

### Skeleton de Loading
```tsx
<div className="space-y-3">
  {[1, 2, 3].map((i) => (
    <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
      <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse w-32" />
        <div className="h-3 bg-muted rounded animate-pulse w-48" />
      </div>
    </div>
  ))}
</div>
```

## 📏 Espaçamentos Padrão

```tsx
p-3, p-4, p-6          // Padding
gap-2, gap-3, gap-4    // Gap
space-y-2, space-y-4, space-y-6  // Espaçamento vertical
```

## 🔤 Tipografia

```tsx
text-3xl font-bold tracking-tight  // H1
text-2xl font-bold                 // H2
text-lg font-semibold              // H3
text-sm font-semibold              // H4
text-sm text-muted-foreground      // Texto secundário
text-xs text-muted-foreground      // Texto pequeno
```

## ✅ Regras de Ouro

1. **Sempre use variáveis do design system** (nunca `bg-blue-50`)
2. **Cards com `shadow-sm`** (não `border-0`)
3. **Ícones em círculos** com `bg-primary/10`
4. **Inputs com `h-11`** para melhor usabilidade
5. **Dark mode automático** com variáveis do sistema
6. **Espaçamento generoso** (p-4, gap-3)
7. **Skeletons ao invés de spinners** para loading
8. **Cores de estado com dark variant** (`text-green-600 dark:text-green-400`)

## 🚫 Evite

```tsx
// ❌ ERRADO
<Card className="border-0 shadow-sm">
<div className="bg-blue-50 text-blue-800">
<Icon className="text-green-600" />  // sem dark mode

// ✅ CORRETO
<Card className="shadow-sm">
<div className="bg-primary/5 text-foreground">
<Icon className="text-green-600 dark:text-green-400" />
```

## 📱 Responsividade Rápida

```tsx
// Grid
<div className="grid gap-6 md:grid-cols-2">

// Flex
<div className="flex flex-col md:flex-row gap-4">

// Padding
<div className="px-4 md:px-6">

// Texto
<h1 className="text-2xl md:text-3xl">
```
