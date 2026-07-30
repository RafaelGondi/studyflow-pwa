# Offline-first: diagnóstico e plano

Última análise: 29 de julho de 2026.

## Resumo

O StudyFlow atualmente possui suporte offline parcial, mas ainda não pode ser
considerado offline-first.

- A PWA guarda os arquivos da interface e pode abrir offline depois de uma
  visita anterior.
- O timer funciona sem conexão e mantém seu estado no `localStorage`.
- O Firebase Authentication normalmente restaura o usuário no mesmo
  dispositivo.
- O Firestore usa apenas o cache em memória padrão da Web.
- Uma escrita iniciada offline pode ser enviada quando a conexão retorna,
  desde que a mesma instância da aplicação continue aberta.
- Fechar ou recarregar a aplicação antes da sincronização pode descartar
  escritas pendentes.
- Matérias, categorias e sessões não possuem disponibilidade durável depois de
  fechar e reabrir a aplicação offline.

## Principal risco identificado

Ao encerrar uma sessão comum, o timer é removido do `localStorage` antes de a
gravação no Firestore ser confirmada. Sem persistência durável do Firestore, o
usuário pode concluir uma sessão offline, fechar a aplicação e perder tanto o
estado do timer quanto a escrita pendente.

## Por que habilitar o cache persistente não basta

Configurar `persistentLocalCache()` no Firestore é a fundação necessária. Isso
permite que dados em cache e escritas pendentes sobrevivam ao fechamento da
PWA e sejam sincronizados posteriormente.

Entretanto, a aplicação ainda precisa:

- atualizar a interface imediatamente, sem aguardar a confirmação remota;
- evitar bloquear ações em Promises que só concluem quando o backend responde;
- distinguir dados locais, pendentes e sincronizados;
- proteger o encerramento do timer contra perda;
- tratar inicialização e autenticação sem conexão;
- atualizar os dados quando a conexão retorna;
- definir uma política de conflitos entre dispositivos;
- apresentar erros definitivos de permissão ou validação;
- funcionar com dados persistidos após reload ou fechamento offline.

## Fluxo desejado

1. O usuário conclui uma sessão.
2. A sessão aparece imediatamente na interface.
3. A escrita fica armazenada de forma durável no dispositivo.
4. O timer pode ser limpo com segurança.
5. A interface indica que a sessão aguarda sincronização.
6. Quando a conexão retorna, o Firestore envia a escrita.
7. A interface passa a indicar que a sessão foi sincronizada.

## Plano recomendado

### 1. Persistência do Firestore

- Inicializar o Firestore com `persistentLocalCache()`.
- Escolher e configurar o gerenciamento de uma ou múltiplas abas.
- Tratar navegadores sem suporte e falhas de inicialização do IndexedDB.
- Remover ou reavaliar o cache HTTP de Firestore no Workbox, pois ele não
  implementa a fila durável de escritas.

### 2. Stores offline-first

- Aplicar criação, edição e remoção de forma otimista nas stores.
- Não esperar a confirmação remota para refletir mudanças válidas na UI.
- Usar IDs conhecidos antes da gravação quando necessário.
- Acompanhar metadados de cache e escritas pendentes.
- Impedir duplicação visual quando a confirmação remota chegar.

### 3. Segurança do timer

- Garantir que a sessão concluída esteja persistida localmente antes de apagar
  o estado recuperável do timer.
- Tornar a operação de conclusão idempotente para evitar sessões duplicadas.
- Recuperar automaticamente conclusões interrompidas.

### 4. Estado de conexão e sincronização

- Exibir estados como `offline`, `salvo localmente`, `sincronizando`,
  `sincronizado` e `erro`.
- Não usar apenas `navigator.onLine` como prova de acesso ao Firebase.
- Disponibilizar nova tentativa para falhas definitivas.

### 5. Inicialização offline

- Permitir a abertura com o último usuário autenticado e dados persistidos.
- Tratar a primeira abertura sem conexão com uma tela clara, sem loading
  infinito.
- Evitar substituir dados locais por arrays vazios quando uma consulta offline
  não tiver cache suficiente.

### 6. Conflitos

- Definir comportamento para alterações concorrentes em dispositivos
  diferentes.
- Registrar horários de atualização de maneira consistente.
- Avaliar `serverTimestamp()` e regras por tipo de entidade.

## Critérios para considerar offline-first

- A aplicação abre offline após uso anterior.
- Matérias, categorias, preferências e histórico recente aparecem offline.
- É possível iniciar, pausar, retomar e concluir uma sessão offline.
- Uma sessão concluída sobrevive a reload, fechamento e encerramento forçado.
- Alterações offline são sincronizadas automaticamente ao recuperar conexão.
- A interface nunca confirma sincronização antes da confirmação real.
- Falhas permanentes ficam visíveis e podem ser corrigidas ou tentadas
  novamente.
- Não há duplicação de sessão após recuperação ou nova tentativa.
- Alterações em duas abas e em dois dispositivos têm comportamento definido.

## Cenários mínimos de teste

1. Abrir online, iniciar o timer, perder conexão, concluir e reconectar.
2. Concluir offline, fechar a PWA, reabrir offline e depois reconectar.
3. Recarregar a página durante um timer em andamento.
4. Criar, editar e excluir matéria offline e fechar a aplicação.
5. Fazer várias alterações offline antes de reconectar.
6. Usar duas abas simultaneamente.
7. Alterar o mesmo registro em dois dispositivos.
8. Limpar os dados do site e tentar a primeira abertura offline.
9. Simular regra do Firestore negando uma escrita pendente.
10. Atualizar o service worker enquanto existem escritas pendentes.

## Arquivos relacionados

- `src/firebase/config.ts`
- `src/firebase/db.ts`
- `src/stores/auth.ts`
- `src/stores/subjects.ts`
- `src/stores/sessions.ts`
- `src/stores/timer.ts`
- `src/App.vue`
- `vite.config.ts`

