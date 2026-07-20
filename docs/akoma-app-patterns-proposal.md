# Akoma — Padrões de App Mobile (proposta de documentação)

> **Contexto:** Este documento resume convenções descobertas ao alinhar **StudyFlow PWA** com **Habitify PWA**, dois apps que usam `@rafael_dias/akoma` v0.8.4.  
> Objetivo: tornar explícito o que hoje só existe como convenção implícita nos apps, para que novos projetos herdem consistência visual e estrutural sem reler código-fonte.

**Referências:**
- [habitify-pwa](https://github.com/RafaelGondi/habitify-pwa) — app de hábitos (accent `evergreen`)
- [studyflow-pwa](https://github.com/RafaelGondi/studyflow-pwa) — app de estudos (accent `slate`)

---

## 1. O que significa “editorial” no Akoma

**“Editorial”** descreve um **tom visual**, não um tipo de conteúdo.

É a linguagem em que a hierarquia vem da **tipografia**, não de caixas, sombras ou cores decorativas. Inspirada em layouts de revista/app de leitura: calma, legível, com respiro.

### Stack tipográfico de página (já existente no Akoma)

| Camada | Classe / token | Função | Exemplo |
|--------|----------------|--------|---------|
| Eyebrow / label | `.page-label` | Contexto da seção | “Sua rotina”, “Sua evolução” |
| Título hero | `.page-title` | Foco principal (`clamp`, display) | “Hoje”, “Progresso” |
| Meta | texto secundário | Data, contagem, intro | “sábado, 19 de julho” |
| Corpo | listas, seções | Conteúdo operacional | matérias, registros, hábitos |

### Editorial vs. outros estilos

| | Editorial (mood `app`) | Dashboard / admin | Card-heavy (Material) |
|---|------------------------|-------------------|------------------------|
| Fundo | Plano, off-white (`--bg`) | Neutro denso | Cinza + elevação |
| Hierarquia | Tipo grande no topo | KPIs em grid | Cards empilhados |
| Sombras | `none` ou mínimas | Moderadas | Fortes |
| Radius | `--card-radius: 10px` | Variável | 16px+ |
| Cor | Accent reservado a ações | Semântica everywhere | Superfícies coloridas |

**Regra proposta:** no mood `app`, apps irmãos **não devem override** `--bg`, `--card-radius`, `--card-shadow` — confiar nos tokens Akoma + accent palette escolhida por app.

---

## 2. Anatomia do app shell

Padrão observado no Habitify; StudyFlow migrou para este modelo na Fase 2.

```
┌─────────────────────────────────────┐
│  app-root / app-shell               │  height: 100dvh; overflow: hidden
│  max-width: var(--shell-max)        │
│  ┌───────────────────────────────┐  │
│  │  page-header (FIXO)           │  label + title + meta + nav
│  │  border-bottom: var(--border) │  chip-row opcional (“Ir para hoje”)
│  ├───────────────────────────────┤  │
│  │  app-scroll (ROLÁVEL)         │  flex: 1; overflow-y: auto
│  │    page-body                  │  listas, seções, empty states
│  │                               │  padding-bottom: nav + safe + fab?
│  └───────────────────────────────┘  │
│                          [ FAB ]    │  position: fixed (só posicionamento)
│  ┌───────────────────────────────┐  │
│  │  tab bar                      │  AkTabBar
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### CSS de referência (layout only)

```css
.app-shell {
  height: 100dvh;
  max-width: var(--shell-max);
  margin: 0 auto;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

.app-main {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-page {
  padding: 0; /* sobrescreve padding uniforme de .akoma-page quando necessário */
}

.app-page__header {
  flex-shrink: 0;
  padding:
    calc(var(--page-pad-top) + var(--safe-top))
    var(--page-pad-x)
    0;
  border-bottom: 1px solid var(--border); /* header “editorial” */
}

.app-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding:
    0
    var(--page-pad-x)
    calc(var(--nav-height) + var(--safe-bottom) + var(--space-6));
}

.app-page--with-fab .app-scroll {
  padding-bottom: calc(
    var(--nav-height) + var(--safe-bottom) + var(--fab-height) + var(--space-8)
  );
}
```

### Tokens propostos para o shell

| Token | Valor sugerido | Uso |
|-------|----------------|-----|
| `--fab-height` | `3.25rem` | Padding inferior quando há FAB |
| `--fab-offset` | `var(--space-3)` | Distância FAB ↔ tab bar |
| `--theme-color-light` | `var(--bg)` | Meta tag / PWA (não usar accent!) |
| `--theme-color-dark` | `#1d211f` | Meta tag dark (= `--bg` dark) |

---

## 3. Padrões que o DS não deixa óbvios hoje

### 3.1 Accent do app ≠ cor de entidade

| Conceito | Implementação | Exemplo |
|----------|---------------|---------|
| **Accent do app** | `applyAccentPalette(root, 'slate')` fixo por produto | Botões primários, links, `--accent`, tab bar ativa |
| **Cor de entidade** | Paleta `--cat-*` + swatches no picker | Cor de matéria (StudyFlow) ou hábito (Habitify) |

**Erro comum:** usar o accent do app como `DEFAULT_SUBJECT_COLOR` ou vice-versa.

**Regra:** accent = identidade do app; `--cat-*` / picker = dados do usuário.

---

### 3.2 FAB = posicionamento, botão = `AkButton size="lg"`

**Anti-pattern (gera FAB duplicado):**

```html
<!-- ERRADO: .fab estilizado como botão + AkButton dentro -->
<div class="fab" style="background: accent; border-radius: full;">
  <AkButton size="lg">Adicionar</AkButton>
</div>
```

**Pattern correto (Habitify):**

```html
<!-- .fab só posiciona -->
<div class="fab">
  <AkButton size="lg" aria-label="Nova ação">
    <template #icon><!-- ícone --></template>
    Label
  </AkButton>
</div>
```

```css
.fab {
  position: fixed;
  z-index: 40;
  right: var(--page-pad-x);
  bottom: calc(var(--safe-bottom) + var(--nav-height) + var(--space-3));
}
```

**Componente proposto:** `AkFab` — wrapper posicionado + slot default para `AkButton lg`.

---

### 3.3 Bottom sheet como primitive compartilhada

Modais mobile devem ser **bottom sheets** com:
- Teleport + backdrop
- Handle com swipe-to-dismiss (`dy > 60px` → close)
- Header opcional (título + `AkIconButton` fechar)
- Body scrollável + footer fixo (CTA `size="lg" block`)

Formulários (criar/editar entidade, confirmar exclusão) **nunca** usam `window.confirm()`.

**Componentes propostos:**
- `AkBottomSheet` (ou `AkSheet`)
- `AkConfirmSheet` — variant para ações destrutivas

---

### 3.4 Sistema de toast

Feedback de save/delete/update via toast acima da tab bar:

```
bottom: calc(var(--safe-bottom) + var(--nav-height) + var(--space-4))
```

**API proposta:**

```typescript
const toast = useToast()
toast.success('Matéria criada')
toast.error('Falha ao salvar', 'Tente novamente')
```

**Componente:** `AkToastHost` montado uma vez no app shell.

---

### 3.5 `theme-color` = fundo, não accent

```typescript
const THEME_COLORS = {
  light: '#f8f6f1', // = --bg do mood app
  dark: '#1d211f',  // = --bg dark
}

function applyThemeColor(mode: 'light' | 'dark') {
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLORS[mode])
}
```

PWA manifest: `background_color` = `--bg` light; `theme_color` pode seguir o mesmo (Habitify) ou accent — **documentar uma escolha única**.

---

### 3.6 Completion shades (calendário / heatmap)

Mapear intensidade usando a **escala cromática do accent** (já existente no Akoma 0.8.3+):

```css
.completion-shade--none    { background: var(--bg-muted); color: var(--text-tertiary); }
.completion-shade--lighter { background: var(--accent-lighter); color: var(--text); }
.completion-shade--light   { background: var(--accent-light); color: var(--text); }
.completion-shade--base    { background: var(--accent); color: var(--accent-contrast); }
.completion-shade--dark    { background: var(--accent-dark); color: var(--accent-contrast); }
.completion-shade--darker  { background: var(--accent-darker); color: var(--accent-contrast); }
```

**Utilitário proposto:**

```typescript
type CompletionShade = 'none' | 'lighter' | 'light' | 'base' | 'dark' | 'darker'

function completionShade(rate: number): CompletionShade // 0–1
function completionShadeClass(shade: CompletionShade): string
function completionShadeNeedsContrast(shade: CompletionShade): boolean
```

**Regra:** heatmaps/calendários usam escala do **accent do app**, não `color-mix` ad hoc por entidade.

---

### 3.7 Card de overview (Progresso / Histórico)

Padrão de composição editorial para telas de evolução — **não é um primitivo Akoma hoje**:

```
┌─────────────────────────────────────┐
│ Consistência              [badge] │  eyebrow + trend label
│ 73%                                 │  score display (clamp grande)
│ ████████████░░░░  AkProgress        │
│ Mensagem de tendência contextual    │
├──────────┬──────────┬───────────────┤
│   12     │    8     │     4h 20m    │  grid 3 colunas
│ dias     │ sessões  │ tempo total   │
│ ativos   │          │               │
└──────────┴──────────┴───────────────┘
```

**Classes CSS propostas:** `.ak-overview`, `.ak-overview__score`, `.ak-overview__metrics`  
**Componente proposto:** `AkOverviewCard` com slots/props para score, badge, progress, metrics[].

---

### 3.8 Chips, listas e estados ativos

| Elemento | Convenção mood `app` |
|----------|---------------------|
| `AkChip` ativo | `--bg-muted` + `--text` (cinza suave, **não** accent preenchido) |
| `AkList` | `--bg-elevated`, border `var(--border)`, `--card-shadow: none` |
| `AkListRow` | `min-height: 56px`; título `font-weight: 600` |
| Header de data | Swipe horizontal + transição `slide-left` / `slide-right` |
| Dia ≠ hoje | Chip “Ir para hoje” abaixo do header |

---

### 3.9 CSS do app = layout shell only

**Convenção Habitify** (`app/assets/css/app.css`):

> *"Habitify — layout shell only. Visual language lives in @rafael_dias/akoma tokens."*

O CSS do app contém:
- Shell (app-root, app-scroll, fab positioning)
- Utilitários de domínio sem tokens (`completion-shade`, `history-overview`)
- Animações de navegação (slide, fade, accordion)

O CSS do app **não** contém:
- Override de `--bg`, `--card-radius`, paleta de cores
- Estilos que duplicam `AkButton`, `AkList`, etc.

---

## 4. Composables de app propostos

Pacote `@rafael_dias/akoma/app` (ou subpath export):

| Composable | Responsabilidade |
|------------|------------------|
| `useAppTheme()` | `data-mood="app"`, accent fixo, `theme-color` dinâmico |
| `useToast()` | Fila de toasts, auto-dismiss |
| `useConfirmSheet()` | Promise-based confirm para ações destrutivas |
| `usePageScroll()` | Opcional: helper header fixo + ref scroll |

### `useAppTheme` — referência

```typescript
export type ThemeMode = 'light' | 'dark'

export function useAppTheme(accent: AccentPalette) {
  // Persiste mode em localStorage
  // applyAccentPalette(document.documentElement, accent)
  // dataset.mood = 'app'
  // Atualiza meta theme-color = THEME_COLORS[mode]
}
```

---

## 5. Componentes propostos para o DS

### Tier 1 — Shell (fundacional)

| Componente | Descrição |
|------------|-----------|
| `AkAppShell` | 100dvh, ambient opcional, slot main + tab bar |
| `AkPage` | Flex column, variantes `scroll` / `fixed-header` |
| `AkPageHeader` | Label + title + meta + slot nav (nav-cluster) |

### Tier 2 — Padrões mobile

| Componente | Descrição |
|------------|-----------|
| `AkBottomSheet` | Sheet + backdrop + swipe dismiss |
| `AkFab` | Wrapper posicionado + default slot `AkButton lg` |
| `AkToastHost` | Host global de toasts |
| `AkConfirmSheet` | Sheet de confirmação destrutiva |

### Tier 3 — Composições editoriais

| Componente | Descrição |
|------------|-----------|
| `AkOverviewCard` | Score + badge + progress + metric grid |
| `AkDayHeader` | Header de home diária (nav de data + chip “hoje”) |
| `AkCompletionCalendar` | Calendário mensal com `completion-shade` |

---

## 6. Checklists por tipo de tela

### Home diária (rotina)

- [ ] `AkPageHeader` ou `AkDayHeader` **fixo** (não rola com conteúdo)
- [ ] Nav de data (prev/next) no canto do header
- [ ] Chip “Ir para hoje” quando `viewDate !== today`
- [ ] Métrica hero útil (ex.: tempo total) — evitar progress bars sem significado claro
- [ ] Lista principal dentro de `app-scroll`
- [ ] Um único `AkFab` para ação primária de criação
- [ ] Swipe horizontal entre dias + transição slide
- [ ] Haptic opcional em ações de conclusão (`navigator.vibrate`)

### Progresso / histórico

- [ ] `AkOverviewCard` no topo
- [ ] Filtro de período em `AkChip` horizontal
- [ ] Calendário com `completion-shade`
- [ ] Histórico agrupado por dia com `AkSectionHeader`

### Formulários (create/edit)

- [ ] Sempre em `AkBottomSheet`
- [ ] Footer fixo: `AkButton variant="primary" size="lg" block`
- [ ] Toast no save success
- [ ] `AkConfirmSheet` no delete

### Checklist global — app irmão Akoma

- [ ] `data-mood="app"` + accent fixo escolhido na criação
- [ ] Sem override de tokens light (`--bg`, `--card-radius`, `--card-shadow`)
- [ ] `theme-color` = `--bg`, não accent
- [ ] PWA `background_color` = `--bg` light
- [ ] Sem `window.confirm()` / `window.alert()` para UX destrutiva
- [ ] Um sistema de ícones por família (Cuida **ou** Iconify — documentar)
- [ ] CSS do app = shell + utilitários; visual no Akoma

---

## 7. Anti-patterns documentados

| Anti-pattern | Por quê evitar | Alternativa |
|--------------|----------------|-------------|
| Override `#f9f9f7` em vez de `#f8f6f1` | Drift entre apps irmãos | Usar `--bg` Akoma |
| `.fab` estilizado + `AkButton` dentro | Dois FABs visuais empilhados | `.fab` só posiciona |
| `confirm()` nativo | Quebra imersão mobile | `AkConfirmSheet` |
| `theme-color: accent` | Barra do sistema discorda do fundo | `theme-color: --bg` |
| Accent do app como cor default de entidade | Confunde marca vs dado | `AKOMA_CAT_COLORS[0]` |
| `AkProgress` “X de Y matérias” sem meta clara | Métrica sem significado para o usuário | Só métricas com meta definida |
| Página inteira scrollando com header dentro | Perde sensação nativa | Header fixo + `app-scroll` |
| `AkCard` em toda lista | Visual card-heavy, não editorial | `AkList` flat elevado |

---

## 8. Estrutura de monorepo sugerida

```
packages/
  akoma/                 # Primitivos: Button, List, Chip, tokens, motion
  akoma-patterns/        # AppShell, BottomSheet, OverviewCard, Fab
  akoma-app/             # Composables: useAppTheme, useToast, CSS shell base

apps/
  habitify-pwa/          # Domínio: hábitos, accent evergreen
  studyflow-pwa/         # Domínio: estudos, accent slate
```

Alternativa: subpath exports no pacote Akoma existente:

```json
{
  "exports": {
    ".": "./dist/akoma.js",
    "./style.css": "./dist/style.css",
    "./app": "./dist/app/index.js",
    "./app.css": "./dist/app/shell.css",
    "./patterns": "./dist/patterns/index.js"
  }
}
```

---

## 9. Conteúdo sugerido para `content/` do Akoma

| Arquivo | Conteúdo |
|---------|----------|
| `content/app-shell.md` | Anatomia 100dvh, header fixo, app-scroll, FAB |
| `content/editorial-pages.md` | page-label / page-title / meta, tom visual mood `app` |
| `content/mobile-feedback.md` | Toast, confirm sheet, haptics |
| `content/completion-shades.md` | Calendário, heatmap, escala accent |
| `content/overview-card.md` | Padrão de tela Progresso |
| `content/app-checklist.md` | Checklist de novo app irmão |

---

## 10. Priorização sugerida (ROI)

1. **Documentar** app shell + FAB + theme-color (zero código, alto impacto)
2. **`completion-shade` utilities** no CSS do Akoma
3. **`AkBottomSheet` + `useToast` + `useConfirmSheet`**
4. **`AkFab`** (composto posicionamento + button)
5. **`AkPage` / `AkPageHeader`** com variant fixed-header
6. **`AkOverviewCard`**
7. **Lint/checklist** no template de PR dos apps

---

## 11. Diff real: StudyFlow antes vs. depois

| Aspecto | Antes | Depois (alinhado Habitify) |
|---------|-------|----------------------------|
| `--bg` light | `#f9f9f7` (override) | `#f8f6f1` (Akoma default) |
| `--card-radius` | `16px` | `10px` (Akoma) |
| `--card-shadow` | sombra sutil | `none` |
| Shell scroll | página inteira | header fixo + app-scroll |
| Modais | `.modal-overlay` custom × N | `AppBottomSheet` compartilhado |
| Confirmação | `confirm()` | confirm sheet |
| Feedback | silencioso | toasts |
| FAB Home | ghost “Adicionar” + FAB duplicado | um `FabButton` |
| Calendário | `color-mix` ad hoc | `completion-shade--*` |
| theme-color | accent `#5e7894` | bg `#f8f6f1` |

---

## 12. Glossário

| Termo | Definição |
|-------|-----------|
| **Editorial** | Hierarquia tipográfica (label → title → meta → body); fundo plano; pouca decoração |
| **App shell** | Estrutura fixa: viewport lock, header, scroll region, tab bar, FAB |
| **Accent do app** | Paleta de marca do produto via `data-accent` |
| **Cor de entidade** | Cor escolhida pelo usuário para hábito/matiria (`--cat-*`) |
| **Completion shade** | Degrau visual de intensidade usando escala `--accent-*` |
| **Overview card** | Bloco de consistência/tendência no topo de telas de progresso |
| **Layout shell only** | CSS do app sem override de tokens visuais do Akoma |

---

*Documento gerado a partir da migração StudyFlow ↔ Habitify (2026). Para discussão no desenvolvimento do Akoma DS.*
