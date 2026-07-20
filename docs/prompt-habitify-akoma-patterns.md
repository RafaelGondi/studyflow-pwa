# Prompt — Habitify × padrões Akoma não documentados

Copie tudo abaixo da linha `---` para o chat do **habitify-pwa**.

---

## Contexto

Estou evoluindo o **Akoma DS** (`@rafael_dias/akoma`) para documentar padrões de app mobile que hoje existem só como **convenção implícita** nos meus PWAs, não no design system.

Dois apps usam Akoma 0.8.4:
- **habitify-pwa** — https://github.com/RafaelGondi/habitify-pwa (accent `evergreen`, referência original)
- **studyflow-pwa** — https://github.com/RafaelGondi/studyflow-pwa (accent `slate`, migrado para ficar próximo do Habitify)

No StudyFlow, outro agente analisou os dois repos e gerou uma **proposta de documentação** para o Akoma:
- `docs/akoma-app-patterns-proposal.md` no studyflow-pwa

Essa proposta foi escrita **a partir do Habitify como referência**, mas interpretada pelo lado do StudyFlow. Quero a **visão do Habitify** — como *este* app definiria, nomearia e formalizaria esses padrões se fossem virar API/doc do Akoma.

---

## Sua tarefa

Analise o repositório **habitify-pwa** (código real, não suposições) e responda:

### 1. Inventário de padrões implícitos

Liste convenções que o Habitify usa mas que **não estão documentadas no Akoma** (README, `content/*.md`, tokens, componentes exportados).

Para cada padrão, indique:
- **Nome** que você daria (curto, reutilizável no DS)
- **Onde vive hoje** (arquivos/caminhos)
- **Regra** em uma frase (“sempre X, nunca Y”)
- **Por quê** existe assim (decisão de produto/UX, não só estética)

Áreas obrigatórias a cobrir:
- App shell (`app-root`, `100dvh`, scroll interno vs página inteira)
- Header editorial (`day-header`, `page-label`, `page-title`, borda inferior)
- FAB (`.fab` = posicionamento vs botão)
- Bottom sheets (`AppBottomSheet`, swipe dismiss, formulários)
- Toasts (`useAppToast`, `AppToastHost`)
- Confirmações destrutivas (sheet vs `confirm()`)
- `theme-color` e PWA manifest (`background_color`, accent vs bg)
- `completion-shade--*` e calendário/heatmap
- Card de overview em Progresso (`history-overview`, consistência, trend)
- Chips ativos (cinza muted vs accent)
- Listas flat vs cards (`AkList` sem `AkCard` wrapper)
- Accent fixo do app vs cor de hábito
- Animações (slide entre dias, fade, accordion)
- Ícones (AppIcon / Iconify vs Cuida direto)

### 2. O que é “editorial” no Habitify

Explique com **exemplos concretos do teu código** o que você entende por interface editorial neste app — sem jargão vago. Relacione com classes/tokens Akoma existentes.

### 3. Comparação com a proposta do StudyFlow

Leia (ou peça para abrir) a proposta:
https://github.com/RafaelGondi/studyflow-pwa/blob/main/docs/akoma-app-patterns-proposal.md

Para cada seção da proposta, diga:
| Proposta StudyFlow | Habitify concorda? | Ajuste / divergência | Como o Habitify faria diferente |

Foco especial em divergências reais — coisas que a migração do StudyFlow **interpretou errado** ou **simplificou demais**.

### 4. O que viraria API do Akoma

Priorize o que deveria entrar no pacote `@rafael_dias/akoma`:

**Tier A — documentação only** (zero código novo)  
**Tier B — CSS utilities** (`completion-shade`, shell base)  
**Tier C — componentes** (`AkBottomSheet`, `AkFab`, `AkPageHeader`…)  
**Tier D — composables** (`useAppTheme`, `useToast`…)

Para cada item Tier B/C/D:
- Nome sugerido da API
- Props/signature mínima
- O que **não** deve entrar no DS (fica no app de domínio)

### 5. Checklist “novo app irmão”

Gere um checklist que você daria para alguém criar um terceiro PWA no mesmo ecossistema (ex.: app de finanças, diário). Máximo 15 itens, verificáveis em PR review.

### 6. Anti-patterns

Liste erros que você viu ou prevê ao replicar o Habitify sem ler o código — incluindo o bug do **FAB duplicado** (`.fab` estilizado + `AkButton` dentro).

---

## Formato da resposta

- Português
- Markdown estruturado
- Cite arquivos com caminho completo (`app/pages/index.vue`, `app/assets/css/app.css`, etc.)
- Inclua snippets curtos só quando forem a **fonte da convenção**
- Seja opinativo: prefiro “Habitify faz X porque Y” a listas genéricas
- Se algo no Habitify ainda não está consistente internamente, aponte — não idealize

---

## Restrições

- Não implemente código agora — só análise e proposta para o Akoma
- Não assuma que StudyFlow está correto; o Habitify é a fonte de verdade de intenção
- Trate Akoma 0.8.4 como baseline; se sugerir breaking change, marque explicitamente
- Apps irmãos terão **accents diferentes** (`evergreen`, `slate`, …) — padrões devem ser accent-agnostic

---

## Output extra desejado

Ao final, produza:

1. **Um parágrafo “manifesto”** (5–8 linhas) — como você descreveria o tom visual dos apps Akoma mood `app` para um designer novo na equipe

2. **Tabela de glossário** — termos que o Akoma deveria definir oficialmente (`editorial`, `app shell`, `completion shade`, `overview card`, etc.)

3. **Diff de prioridades** — top 5 coisas para documentar primeiro vs top 5 para codificar como componente

Obrigado. Quero usar essa resposta junto com a proposta do StudyFlow para escrever a doc oficial do Akoma.
