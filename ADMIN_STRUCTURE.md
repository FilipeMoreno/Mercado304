# Estrutura de Admin Reorganizada

## 📋 Visão Geral

Reorganização completa da área de administração do Mercado304 com estrutura hierárquica e agrupamentos lógicos na sidebar.

## 🏗️ Nova Estrutura de Rotas

### Admin Principal
```
/admin
├── /sync-precos              # Sincronização de preços
├── /sync-precos/historico    # Histórico de sincronizações
├── /nota-parana              # Comparador Nota Paraná
└── /playground               # Área de testes
    └── /teste-camera         # Teste de câmera PWA
```

### Rotas Anteriores Movidas

| Rota Antiga                    | Nova Rota                        | Status    |
| ------------------------------ | -------------------------------- | --------- |
| `/teste-camera`                | `/admin/playground/teste-camera` | ✅ Movida  |
| `/nota-parana`                 | `/admin/nota-parana`             | ✅ Movida  |
| `/admin/sync-precos`           | `/admin/sync-precos`             | ✅ Mantida |
| `/admin/sync-precos/historico` | `/admin/sync-precos/historico`   | ✅ Mantida |

## 🎨 Sidebar com Grupos e Subgrupos

A sidebar agora suporta **até 3 níveis de hierarquia**:

```
Admin (Grupo Principal)
├── Sync Preços (Subgrupo)
│   ├── Sincronizar
│   └── Histórico
├── Nota Paraná (Item)
└── Playground (Subgrupo)
    └── Teste Câmera
```

### Características da Nova Sidebar

#### 1. **Auto-Expand Inteligente**
- Expande automaticamente o grupo quando você navega para uma página dentro dele
- Mantém grupos expandidos mesmo ao navegar entre páginas do mesmo grupo
- Suporte para grupos aninhados

#### 2. **Indicadores Visuais**
- **Grupo ativo**: Fundo azul claro, texto azul escuro
- **Item ativo**: Fundo azul, texto branco
- **Ícones rotacionáveis**: Chevron indica se o grupo está expandido ou não
- **Tamanhos diferentes**: 
  - Nível 1 (grupos): Ícones maiores (h-5 w-5)
  - Nível 2 (subitens): Ícones médios (h-4 w-4)
  - Nível 3 (itens aninhados): Ícones menores (h-3 w-3)

#### 3. **Responsividade**
- Em mobile: Menu hamburguer com Sheet lateral
- Em desktop: Sidebar fixa com opção de colapsar
- Modo colapsado: Mostra apenas ícones com tooltips

## 🎯 Ícones Utilizados

| Item         | Ícone          | Descrição                        |
| ------------ | -------------- | -------------------------------- |
| Admin        | `Settings`     | Engrenagem - Configurações       |
| Sync Preços  | `RefreshCw`    | Setas circulares - Sincronização |
| Histórico    | `History`      | Relógio - Histórico              |
| Nota Paraná  | `FileText`     | Documento - Arquivos/Notas       |
| Playground   | `FlaskConical` | Frasco - Experimentos/Testes     |
| Teste Câmera | `Camera`       | Câmera - Captura de fotos        |

## 🔧 Implementação Técnica

### Estrutura do Menu

```typescript
{
  name: "Admin",
  href: "/admin",
  icon: Settings,
  subItems: [
    {
      name: "Sync Preços",
      href: "/admin/sync-precos",
      icon: RefreshCw,
      subItems: [ // Suporte a 3 níveis!
        { name: "Sincronizar", href: "/admin/sync-precos", icon: RefreshCw },
        { name: "Histórico", href: "/admin/sync-precos/historico", icon: History },
      ],
    },
    { name: "Nota Paraná", href: "/admin/nota-parana", icon: FileText },
    {
      name: "Playground",
      href: "/admin/playground",
      icon: FlaskConical,
      subItems: [
        { name: "Teste Câmera", href: "/admin/playground/teste-camera", icon: Camera }
      ],
    },
  ],
}
```

### Auto-Expand Logic

```typescript
// Detecta a rota atual e expande automaticamente
if (pathname.startsWith("/admin")) {
  expanded.push("Admin")
  
  if (pathname.startsWith("/admin/sync-precos")) {
    expanded.push("Sync Preços")
  }
  
  if (pathname.startsWith("/admin/playground")) {
    expanded.push("Playground")
  }
}
```

## 📁 Arquivos Criados/Modificados

### Criados
```
src/app/admin/nota-parana/page.tsx
src/app/admin/playground/teste-camera/page.tsx (copiado de teste-camera)
ADMIN_STRUCTURE.md (este arquivo)
```

### Modificados
```
src/components/sidebar.tsx
├── Adicionados novos ícones
├── Estrutura de menu Admin
├── Lógica de auto-expand para Admin
└── Suporte a 3 níveis de hierarquia
```

## 🚀 Como Usar

### Acessar Páginas Admin

```bash
# Sincronização de Preços
http://localhost:3000/admin/sync-precos

# Histórico de Sync
http://localhost:3000/admin/sync-precos/historico

# Nota Paraná
http://localhost:3000/admin/nota-parana

# Teste de Câmera
http://localhost:3000/admin/playground/teste-camera
```

### Adicionar Novos Itens ao Admin

1. **Item Simples** (sem subgrupos):
```typescript
{
  name: "Meu Item",
  href: "/admin/meu-item",
  icon: MyIcon
}
```

2. **Subgrupo com Itens**:
```typescript
{
  name: "Meu Grupo",
  href: "/admin/meu-grupo",
  icon: MyIcon,
  subItems: [
    { name: "Item 1", href: "/admin/meu-grupo/item1", icon: Icon1 },
    { name: "Item 2", href: "/admin/meu-grupo/item2", icon: Icon2 },
  ]
}
```

3. **Atualizar Auto-Expand**:
```typescript
if (pathname.startsWith("/admin/meu-grupo")) {
  newExpanded.push("Meu Grupo")
}
```

## 🎨 Estilos e Classes

### Classes CSS Personalizadas

```typescript
// Grupo Principal (Nível 1)
className="w-full justify-start h-auto py-3 px-4 rounded-xl"

// Subitem (Nível 2)
className="w-full justify-start h-auto py-2 px-4 rounded-lg text-sm"

// Item Aninhado (Nível 3)
className="w-full justify-start h-auto py-2 px-4 rounded-lg text-xs"
```

### Estados

```typescript
// Ativo
"bg-primary/10 text-primary font-semibold"

// Hover
"hover:bg-muted"

// Expandido
"rotate-90" // Para o chevron
```

## 📊 Estatísticas

- **Níveis de hierarquia**: 3 (Grupo > Subgrupo > Item)
- **Itens no Admin**: 6 páginas
- **Ícones adicionados**: 6 novos ícones
- **Linhas de código**: ~100 linhas modificadas na sidebar

## 🔄 Migrações Futuras

Outras áreas que podem ser movidas para Admin:
- [ ] Configurações do Sistema
- [ ] Gerenciamento de Usuários
- [ ] Logs do Sistema
- [ ] Backups
- [ ] Relatórios Avançados

## 📝 Notas Importantes

1. **Permissões**: Adicione verificação de permissões admin nas rotas `/admin/*`
2. **Breadcrumbs**: Considere adicionar breadcrumbs para navegação mais clara
3. **Pesquisa**: Implemente busca na sidebar para encontrar itens rapidamente
4. **Favoritos**: Permita fixar itens frequentes no topo
5. **Histórico**: Mantenha histórico de páginas visitadas

## 🐛 Troubleshooting

### Grupo não expande automaticamente
- Verifique se o pathname está correto no `useEffect`
- Confirme que o nome do grupo está exatamente igual em `expandedItems`

### Ícone não aparece
- Verifique se o ícone foi importado de `lucide-react`
- Confirme que o nome do ícone está correto

### Link não funciona
- Verifique se a página existe em `src/app/[rota]/page.tsx`
- Confirme que o href está correto (com `/` inicial)

## 👥 Contribuindo

Para adicionar novos itens ao Admin:

1. Crie a página em `src/app/admin/[sua-rota]/page.tsx`
2. Adicione o item no array `navigation` em `sidebar.tsx`
3. Atualize a lógica de auto-expand se necessário
4. Adicione ícone apropriado
5. Teste em mobile e desktop

---

**Última atualização**: 19/10/2025
**Versão**: 1.0

