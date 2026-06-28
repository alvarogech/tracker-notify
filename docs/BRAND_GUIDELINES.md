# Diretrizes de Marca — Pastoreio HUIOS

## Identidade Visual

### Cores Oficiais

| Token         | Hex       | HSL               | Uso                                      |
|---------------|-----------|-------------------|------------------------------------------|
| `huios-green` | `#0A6B47` | `156 83% 23%`     | Cor primária, CTAs, destaques            |
| `huios-dark`  | `#0D2825` | `174 50% 10%`     | Fundos de interface, cabeçalhos          |
| `huios-cream` | `#EDE8D8` | `40 33% 89%`      | Texto sobre verde/escuro, fundos claros  |

As cores estão disponíveis como tokens Tailwind (`bg-huios-green`, `text-huios-cream`, etc.) e como variáveis CSS (`--huios-green`, `--huios-dark`, `--huios-cream`).

O token primário do shadcn/ui é mapeado para `huios-green`; `primary-foreground` para `huios-cream`.

### Tipografia

- **Marca / Display:** Outfit ExtraBold (700) / Black (800/900) — variável `--font-brand`, classe Tailwind `font-brand`
- **Corpo:** Inter — variável `--font-sans`, classe Tailwind `font-sans`

### Grafia Oficial

O nome é grafado **HUiOS** — o "i" minúsculo é elemento intencional da identidade visual.

Em contextos de interface, o nome completo do sistema é **Pastoreio HUIOS**.

---

## Componentes de Marca

### HuiosLogo

Wordmark tipográfico "HUiOS". O "i" é sempre renderizado em minúsculo.

```tsx
import { HuiosLogo } from '@/components/brand/HuiosLogo'

// Variantes: 'default' (verde), 'light' (creme), 'dark' (verde escuro)
// Tamanhos: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
<HuiosLogo variant="light" size="md" />
```

### HuiosAppIcon

Marca compacta "Hi" em quadrado arredondado. Usada como favicon e ícone de app.

```tsx
import { HuiosAppIcon } from '@/components/brand/HuiosLogo'

// size: número em px (padrão 32)
<HuiosAppIcon size={40} />
```

A marca "Hi" representa as letras H e i do wordmark em formato compacto para uso em espaços pequenos (ícone de app, favicon, cabeçalho mobile).

### EmausLogo

Logotipo textual "EMAÚS" da Igreja Emaús. Usado no rodapé institucional.

```tsx
import { EmausLogo } from '@/components/brand/EmausLogo'

// Variantes: 'default' | 'light'
// Tamanhos: 'xs' | 'sm' | 'md'
<EmausLogo variant="light" size="sm" />
```

### AppBrandHeader

Cabeçalho da aplicação com a marca HUIOS. Mobile-first.

```tsx
import { AppBrandHeader } from '@/components/brand/AppBrandHeader'

// compact: apenas ícone + nome do GR (mobile)
// full: wordmark completo
<AppBrandHeader groupName="GR Nordeste" compact={false} />
```

### InstitutionalFooter

Rodapé institucional com presença da marca Emaús.

```tsx
import { InstitutionalFooter } from '@/components/brand/InstitutionalFooter'

// Variantes: 'light' | 'dark'
<InstitutionalFooter variant="dark" />
```

---

## Arquivos SVG

Localizados em `public/brand/`:

| Arquivo                          | Descrição                                      |
|----------------------------------|------------------------------------------------|
| `huios-mark.svg`                 | Ícone "Hi" — fundo creme, letras verde escuro  |
| `huios-mark-on-green.svg`        | Ícone "Hi" — fundo verde escuro, letras creme  |
| `huios-wordmark-placeholder.svg` | Wordmark provisório em SVG geométrico          |

> **Nota:** O wordmark em SVG é provisório. Substituir pelo vetor oficial da HUIOS quando disponível.
> Fonte aproximada: Outfit ExtraBold / Black.

O favicon (`public/favicon.svg`) usa o ícone "Hi" sobre fundo verde (`#0A6B47`).

---

## Tokens de Status

Para estados operacionais na interface (presenças, casos, etc.):

| Estado    | Classe Tailwind          | Uso                     |
|-----------|--------------------------|-------------------------|
| Sucesso   | `text-status-present`    | Presente, concluído     |
| Alerta    | `text-status-absent`     | Ausente, pendente       |
| Perigo    | `text-status-escalated`  | Escalado, urgente       |
| Info      | `text-status-visitor`    | Visitante, informativo  |

---

## Acessibilidade

- Todos os elementos interativos têm altura mínima de **44px** (touch targets)
- Componentes de marca incluem `role="img"` e `aria-label` adequados
- Contraste entre `huios-green` e `huios-cream`: aprovado WCAG AA para texto grande
- Fonte mínima de interface: 12px (`text-xs`)
