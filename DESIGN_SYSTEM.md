# Design System - Mercado304

## 🎨 Visão Geral

Este documento define o design system minimalista e moderno aplicado em toda a aplicação Mercado304, garantindo consistência visual e experiência de usuário coesa.

---

## 📐 Princípios de Design

### 1. **Minimalismo**
- Remoção de elementos desnecessários
- Foco no conteúdo essencial
- Espaçamento generoso
- Hierarquia visual clara

### 2. **Consistência**
- Uso de variáveis do design system
- Padrões repetíveis
- Componentes reutilizáveis
- Cores semânticas

### 3. **Acessibilidade**
- Contraste adequado
- Dark mode automático
- Textos legíveis
- Estados visuais claros

---

## 🎨 Cores

### Variáveis do Design System

#### **Cores Principais**
```tsx
bg-background        // Fundo principal da página
bg-foreground        // Texto principal
bg-muted            // Fundos secundários
text-muted-foreground // Textos secundários
bg-primary          // Cor primária (azul)
text-primary        // Texto em cor primária
text-primary-foreground // Texto em botões primários
```

#### **Cores de Estado**
```tsx
bg-green-500/10     // Sucesso (com opacidade)
text-green-600 dark:text-green-400 // Texto de sucesso

bg-red-500/10       // Erro (com opacidade)
text-red-600 dark:text-red-400 // Texto de erro

bg-orange-500/10    // Aviso (com opacidade)
text-orange-600 dark:text-orange-400 // Texto de aviso
```

#### **Opacidades Padrão**
```tsx
bg-primary/5        // Background muito sutil (5%)
bg-primary/10       // Background sutil (10%)
bg-muted/30         // Background de items (30%)
bg-background/80    // Background com transparência (80%)
```

---

## 🧩 Componentes

### Cards

#### **Card Padrão**
```tsx
<Card className="shadow-sm">
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Conteúdo */}
  </CardContent>
</Card>
```

**Características:**
- `shadow-sm` - Sombra sutil
- Bordas padrão do sistema (não usar `border-0`)
- Background automático do tema

#### **Card com Header Colorido**
```tsx
<Card className="shadow-sm overflow-hidden">
  <div className="p-6 border-b bg-primary/5">
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-full bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <div>
        <h3 className="font-semibold">Título</h3>
        <p className="text-sm text-muted-foreground">Descrição</p>
      </div>
    </div>
  </div>
  <CardContent className="pt-6">
    {/* Conteúdo */}
  </CardContent>
</Card>
```

**Variações de Cor:**
- Sucesso: `bg-green-500/5` + `bg-green-500/10`
- Erro: `bg-red-500/5` + `bg-red-500/10`
- Aviso: `bg-orange-500/5` + `bg-orange-500/10`
- Primário: `bg-primary/5` + `bg-primary/10`

---

### Banners Informativos

#### **Banner Padrão**
```tsx
<div className="p-6 bg-primary/5 rounded-lg">
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-full bg-primary/10">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <div>
      <h3 className="font-semibold">Título</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Descrição do banner
      </p>
    </div>
  </div>
</div>
```

**Características:**
- Padding generoso: `p-6` ou `p-4`
- Ícone em círculo colorido
- Título em negrito
- Descrição com `text-muted-foreground`

#### **Banner de Sucesso**
```tsx
<div className="p-4 bg-green-500/5 rounded-lg">
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-full bg-green-500/10">
      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
    </div>
    <div>
      <h4 className="font-semibold text-sm">Título de Sucesso</h4>
      <p className="text-xs text-muted-foreground mt-1">
        Mensagem de sucesso
      </p>
    </div>
  </div>
</div>
```

---

### Tabs

#### **TabsList Moderna**
```tsx
<TabsList className="inline-flex h-11 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-auto">
  <TabsTrigger value="tab1" className="rounded-md px-4">
    <Icon className="h-4 w-4 mr-2" />
    Tab 1
  </TabsTrigger>
  <TabsTrigger value="tab2" className="rounded-md px-4">
    <Icon className="h-4 w-4 mr-2" />
    Tab 2
  </TabsTrigger>
</TabsList>
```

**Características:**
- Design pill-shaped
- Altura fixa: `h-11`
- Background: `bg-muted`
- Padding interno: `p-1`
- Tabs individuais: `rounded-md px-4`
- Ícones opcionais com `mr-2`

---

### Items de Lista

#### **Item Padrão**
```tsx
<div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
  <div className="flex items-center gap-3">
    <div className="p-2 rounded-full bg-primary/10">
      <Icon className="h-5 w-5 text-primary" />
    </div>
    <div className="flex-1">
      <h4 className="font-medium">Título do Item</h4>
      <p className="text-sm text-muted-foreground">Descrição</p>
    </div>
  </div>
  <Button variant="outline" size="sm">Ação</Button>
</div>
```

**Características:**
- Background: `bg-muted/30`
- Sem bordas: `border-0` (opcional)
- Padding: `p-4` ou `p-3`
- Ícone em círculo colorido
- Ação à direita

---

### Inputs

#### **Input Padrão**
```tsx
<div className="space-y-2">
  <Label htmlFor="input-id" className="text-sm font-medium">
    Label
  </Label>
  <Input
    id="input-id"
    placeholder="Placeholder"
    className="h-11"
  />
</div>
```

**Características:**
- Altura: `h-11` (maior para melhor usabilidade)
- Label com `text-sm font-medium`
- Espaçamento: `space-y-2`

#### **Input com Ícone**
```tsx
<div className="relative">
  <Input
    placeholder="Placeholder"
    className="h-11 pr-10"
  />
  <Icon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
</div>
```

---

### Botões

#### **Botão Primário**
```tsx
<Button size="lg" className="px-8">
  <Icon className="mr-2 h-4 w-4" />
  Texto do Botão
</Button>
```

#### **Botão com Loading**
```tsx
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Carregando...
    </>
  ) : (
    <>
      <Icon className="mr-2 h-4 w-4" />
      Texto
    </>
  )}
</Button>
```

---

### Skeletons

#### **Skeleton de Lista**
```tsx
<div className="space-y-3">
  {[1, 2, 3].map((i) => (
    <div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
      <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded animate-pulse w-32" />
        <div className="h-3 bg-muted rounded animate-pulse w-48" />
        <div className="h-3 bg-muted rounded animate-pulse w-24" />
      </div>
    </div>
  ))}
</div>
```

**Características:**
- Background: `bg-muted`
- Animação: `animate-pulse`
- Larguras variadas para realismo
- Mesmo layout do conteúdo real

---

## 📏 Espaçamento

### Padding
```tsx
p-3   // Pequeno (12px)
p-4   // Médio (16px)
p-6   // Grande (24px)
```

### Gap
```tsx
gap-2  // Pequeno (8px)
gap-3  // Médio (12px)
gap-4  // Grande (16px)
```

### Space-y (vertical)
```tsx
space-y-2  // Pequeno (8px)
space-y-3  // Médio (12px)
space-y-4  // Grande (16px)
space-y-6  // Extra grande (24px)
```

---

## 🔤 Tipografia

### Títulos
```tsx
text-3xl font-bold tracking-tight  // Título principal (h1)
text-2xl font-bold                 // Título secundário (h2)
text-lg font-semibold              // Título de card (h3)
text-sm font-semibold              // Título pequeno (h4)
```

### Textos
```tsx
text-base                          // Texto normal
text-sm text-muted-foreground      // Texto secundário
text-xs text-muted-foreground      // Texto pequeno
```

---

## 🎭 Estados Visuais

### Hover
```tsx
hover:bg-muted              // Background no hover
hover:text-foreground       // Texto no hover
transition-colors           // Transição suave
```

### Focus
```tsx
focus-within:bg-background
focus-within:border-primary
```

### Disabled
```tsx
disabled:opacity-50
disabled:cursor-not-allowed
```

---

## 🌓 Dark Mode

### Regras Gerais
- **Sempre usar variáveis do design system** (`bg-background`, `text-foreground`, etc.)
- **Evitar cores hardcoded** (`bg-blue-50`, `text-blue-800`, etc.)
- **Usar opacidades** para variações (`bg-primary/5`, `bg-primary/10`)
- **Cores de estado com dark variant** (`text-green-600 dark:text-green-400`)

### Exemplos
```tsx
// ✅ CORRETO
<div className="bg-primary/5 text-foreground">

// ❌ ERRADO
<div className="bg-blue-50 text-blue-800">

// ✅ CORRETO (com dark mode)
<Icon className="text-green-600 dark:text-green-400" />

// ❌ ERRADO (sem dark mode)
<Icon className="text-green-600" />
```

---

## 📱 Responsividade

### Breakpoints
```tsx
sm:   // 640px
md:   // 768px
lg:   // 1024px
xl:   // 1280px
2xl:  // 1536px
```

### Padrões Comuns
```tsx
// Grid responsivo
<div className="grid gap-6 md:grid-cols-2">

// Flex responsivo
<div className="flex flex-col md:flex-row gap-4">

// Padding responsivo
<div className="px-4 md:px-6 lg:px-8">

// Texto responsivo
<h1 className="text-2xl md:text-3xl">
```

---

## 🎯 Exemplos Completos

### Página de Configurações
```tsx
<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
  {/* Header */}
  <div className="border-b bg-background/95 backdrop-blur">
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie sua conta e preferências
            </p>
          </div>
        </div>
        <Avatar className="h-12 w-12 border-2 border-primary/20">
          {/* Avatar content */}
        </Avatar>
      </div>
    </div>
  </div>

  {/* Content */}
  <div className="container max-w-6xl mx-auto px-4 py-8">
    <Tabs defaultValue="perfil" className="space-y-6">
      <TabsList className="inline-flex h-11 items-center justify-center rounded-lg bg-muted p-1 w-auto">
        <TabsTrigger value="perfil" className="rounded-md px-4">
          <User className="h-4 w-4 mr-2" />
          Perfil
        </TabsTrigger>
        {/* Mais tabs */}
      </TabsList>

      <TabsContent value="perfil" className="space-y-6">
        <Card className="shadow-sm">
          <CardContent className="pt-6">
            {/* Conteúdo */}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</div>
```

### Card de Perfil
```tsx
<Card className="shadow-sm">
  <CardContent className="pt-6">
    <div className="flex flex-col md:flex-row gap-8">
      {/* Avatar Section */}
      <div className="flex flex-col items-center space-y-4">
        <div className="relative group">
          <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
            <AvatarImage src={image} />
            <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <Button
            size="icon"
            variant="secondary"
            className="absolute bottom-0 right-0 h-10 w-10 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Camera className="h-5 w-5" />
          </Button>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          <Mail className="h-3 w-3 mr-1" />
          Conta Google
        </Badge>
      </div>

      {/* Form Section */}
      <div className="flex-1 space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-1">{name}</h2>
          <p className="text-muted-foreground flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {email}
          </p>
        </div>

        <Separator />

        <form className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nome completo
              </Label>
              <Input id="name" className="h-11" />
            </div>
            {/* Mais campos */}
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" className="px-8">
              <Save className="mr-2 h-4 w-4" />
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  </CardContent>
</Card>
```

---

## ✅ Checklist de Implementação

Ao criar novos componentes, verifique:

- [ ] Usa variáveis do design system (não cores hardcoded)
- [ ] Tem suporte a dark mode automático
- [ ] Espaçamento consistente (p-4, gap-3, etc.)
- [ ] Ícones em círculos coloridos quando apropriado
- [ ] Hierarquia visual clara (títulos, descrições)
- [ ] Estados de loading com skeletons
- [ ] Responsivo (mobile-first)
- [ ] Acessível (ARIA labels, contraste)
- [ ] Animações suaves (transition-colors)
- [ ] Bordas sutis nos cards (shadow-sm)

---

## 📚 Recursos

### Componentes UI
- **shadcn/ui**: Biblioteca de componentes base
- **Radix UI**: Primitivos acessíveis
- **Tailwind CSS**: Framework de utilidades

### Ícones
- **Lucide React**: Biblioteca de ícones consistente

### Animações
- **Framer Motion**: Animações suaves e performáticas

---

**Última atualização**: 10/10/2025
**Versão**: 1.0.0
