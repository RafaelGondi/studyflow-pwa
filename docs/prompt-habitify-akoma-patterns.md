# Prompt — Habitify × padrões Akoma não documentados

Copie tudo abaixo da linha `---` para o chat do **habitify-pwa**.

---

## Contexto

Estou evoluindo o **Akoma DS** (`@rafael_dias/akoma`) para documentar padrões de app mobile que hoje existem só como **convenção implícita** nos meus PWAs — coisas que o README e o `content/` do Akoma ainda não explicam.

O **habitify-pwa** (https://github.com/RafaelGondi/habitify-pwa) foi o primeiro app construído em cima do Akoma mood `app` e é a referência de intenção. Quero que você analise **este repositório** e diga como *você* definiria e formalizaria esses padrões se fossem virar documentação e API oficial do design system.

Não tenho ainda uma spec fechada — quero partir do que o Habitify realmente faz no código, sem assumir que outro app já interpretou certo.

---

## Definição de partida: o que chamamos de “editorial”

Antes de analisar o repo, alinhemo-nos neste termo (proposta de vocabulário para o Akoma):

**“Editorial”** descreve um **tom visual**, não um tipo de conteúdo (jornal, blog, etc.).

É a linguagem em que a **hierarquia vem da tipografia**, não de caixas coloridas, sombras pesadas ou grids de widgets. Inspirada em layouts de revista ou apps de leitura: calmo, legível, com respiro.

### Stack tipográfico típico

| Camada | Papel | Exemplo em app de rotina |
|--------|-------|--------------------------|
| Eyebrow / label | Contexto pequeno acima do título | “Sua rotina”, “Sua evolução” |
| Título hero | Foco principal da tela (display, grande) | “Hoje”, “Progresso” |
| Meta / subtítulo | Informação secundária | data por extenso, intro curta |
| Corpo | Conteúdo operacional abaixo | listas de hábitos, registros |

No Akoma isso mapeia para `.page-label`, `.page-title` e texto secundário com tokens `--text-secondary`.

### Editorial vs. outros estilos

| | Editorial (mood `app`) | Dashboard / admin | Card-heavy (Material) |
|---|------------------------|-------------------|------------------------|
| Fundo | Plano, off-white (`--bg`) | Denso, utilitário | Cinza + elevação |
| Hierarquia | Tipo grande no topo | KPIs em grid | Cards empilhados |
| Sombras | `none` ou mínimas | Moderadas | Fortes |
| Cor | Accent reservado a ações | Semântica everywhere | Superfícies coloridas |

**Pergunta para você:** essa definição descreve o que o Habitify faz de fato? O que ajustaria, renomearia ou tornaria mais preciso a partir do código?

---

## Sua tarefa

Analise o repositório **habitify-pwa** (código real, não suposições) e responda:

### 1. Inventário de padrões implícitos

Liste convenções que o Habitify usa mas que **não estão documentadas no Akoma** (README, `content/*.md`, tokens exportados, componentes do pacote).

Para cada padrão:
- **Nome** que você daria (curto, reutilizável no DS)
- **Onde vive hoje** (arquivos/caminhos)
- **Regra** em uma frase (“sempre X, nunca Y”)
- **Por quê** existe assim (decisão de produto/UX)

Áreas para cobrir (não limitar a estas):
- App shell e scroll (`100dvh`, header fixo vs página inteira rolando)
- Header de página / home diária
- FAB e ação primária flutuante
- Bottom sheets e modais
- Feedback (toast, confirmação de exclusão, haptics)
- PWA e `theme-color`
- Calendário / intensidade visual (heatmap, shades)
- Telas de progresso / consistência
- Chips, listas, hierarquia de seções
- Accent fixo do app vs cor de hábito
- Animações e gestos
- Estratégia de ícones

### 2. “Editorial” no Habitify — validação e refinamento

Com base no código:
- Onde o app segue (ou quebra) a definição de editorial acima?
- Quais classes, tokens ou composições Akoma são centrais para esse tom?
- O que um dev novo erraria ao tentar replicar o visual só lendo o Akoma, sem ver o Habitify?

### 3. O que viraria documentação vs. código no Akoma

Separe em tiers:

**Tier A — documentação only** (zero código novo)  
**Tier B — CSS utilities / tokens** (ex.: shades, shell base, spacing de page)  
**Tier C — componentes Vue** (sheets, fab, page header, overview…)  
**Tier D — composables** (theme, toast, confirm…)

Para cada item Tier B/C/D:
- Nome sugerido da API
- Signature / props mínimas
- O que **deve ficar no app de domínio** (hábitos, metas, etc.) e não no DS

### 4. Checklist para um novo app irmão

Checklist para quem criar um terceiro PWA no mesmo ecossistema Akoma mood `app`. Máximo 15 itens, verificáveis em PR review.

### 5. Anti-patterns

Erros comuns ao copiar o Habitify sem entender a intenção — inclua exemplos concretos do que **não** fazer (CSS, composição de componentes, tokens).

---

## Formato da resposta

- Português
- Markdown estruturado
- Cite arquivos com caminho completo
- Snippets curtos só quando forem a **fonte da convenção**
- Seja opinativo: “Habitify faz X porque Y”
- Se algo no repo ainda não está consistente internamente, aponte — não idealize

---

## Restrições

- **Não implemente código** — só análise e proposta para o Akoma
- Trate **Akoma 0.8.4** como baseline; breaking changes devem ser marcados
- Padrões devem ser **accent-agnostic** (outros apps usarão `slate`, `violet`, etc.)
- Não compare com outros apps meus — esta análise é só do Habitify como fonte de verdade

---

## Output extra

1. **Manifesto** (5–8 linhas) — tom visual dos apps mood `app` para um designer novo  
2. **Glossário** — termos que o Akoma deveria definir oficialmente  
3. **Prioridades** — top 5 para documentar primeiro vs top 5 para codificar como componente
