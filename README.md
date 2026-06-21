# Mini-Projeto: CLI de referência em Node + TypeScript

## Objetivo e restrições

Este projeto é um CLI (interface de linha de comando, um app que roda no terminal, sem interface
gráfica) interativo que navega a [PokeAPI](https://pokeapi.co/), captura Pokémon e os persiste
numa "PC box" local (`pc_box.json`). Não é um produto; é um **exemplo de referência**: o objetivo
é modelar um desenho correto e robusto, não apenas fazer funcionar.

Três restrições moldam todas as decisões:

1. **Só primitivas da plataforma.** Nada de axios, zod, inquirer ou qualquer biblioteca externa.
   Apenas built-ins do Node (módulos já incluídos na plataforma, sem precisar instalar):
   `node:fs/promises`, `node:readline/promises`, `fetch`, `URL`, `AbortController` + TypeScript.
   As versões feitas à mão *são a aula*: quando você mesmo escreve a camada HTTP (a parte do
   código responsável apenas por fazer requisições de rede), o framework de telas e o modelo de
   erros, entende o que as bibliotecas escondem.
2. **TypeScript sobre Node.** Certas características da linguagem, como a ausência do operador `?`
   de propagação ergonômica e o `catch (e: unknown)`, influenciam diretamente as decisões de
   tratamento de erros (seção 4).
3. **CLI em camadas rasas com um laço de vida longa.** Essa forma simplifica toda a política de
   erros, como a seção 4 explica.

> O PDF da avaliação é tratado como **contexto solto**. O app excede propositalmente o que ele
> pede para ensinar padrões reais.

## Como rodar

```bash
npm install
npm run start:dev    # type-check (tsc) + tsx --watch src/main.ts
```

O app lê e escreve `pc_box.json` **relativo ao diretório atual**; rode a partir da raiz do projeto.

Antes de considerar qualquer tarefa concluída:

```bash
npx tsc --noEmit     # checagem de tipos
npx eslint .         # lint estrito (strictTypeChecked)
npx prettier -w .    # formatação
npm test             # suite de testes (vitest)
```

## 1. Arquitetura em camadas e raiz de composição

O fluxo respeita uma hierarquia estrita entre camadas (grupos de código com uma única
responsabilidade, que só se comunicam com a camada imediatamente abaixo). Cada camada conhece a
de baixo por uma dependência recebida no construtor, nunca por variável global ou singleton
(uma instância única e global de um objeto, compartilhada por todo o código) visível:

```
View → Controller → Service → Repository (arquivo)
                         └────→ HttpService (rede)
```

| Camada | Responsabilidade | Onde |
|---|---|---|
| View | Todo I/O de console e o laço de interação | `src/views/` |
| Controller | Repasse fino (sem lógica de negócio) | `src/controllers/` |
| Service | Regras de negócio (dedupe, paginação, filtro) | `src/services/` |
| Repository | Persistência das entidades do negócio | `src/repositories/` |
| HttpService | Abstração de rede | `src/@common/http/` |

Toda a montagem ocorre em `src/main.ts`, a raiz de composição (o ponto do programa onde todos os
objetos são criados e conectados entre si):

```ts
function bootstrap() {
  const boxService = new BoxService(new BoxFileRepository())
  const boxController = new BoxController(boxService)
  const pokeApiService = new PokeApiService(new NativeHttpService())
  const pokeApiController = new PokeApiController(pokeApiService)
  const boxView = new BoxView(boxController)
  const exploreView = new ExploreView(pokeApiController, boxController)
  const menuView = new MenuView(exploreView, boxView)
  return menuView.start()
}
```

"Injeção de dependência" é, na essência, passar argumentos para construtores. O container é
opcional; o princípio não é. Com o grafo inteiro concentrado em `bootstrap()`, qualquer peça,
um repository de SQLite ou um HTTP mockado, é substituível sem tocar em quem a usa. Os controllers
são finos de propósito: hoje só repassam, mas marcam a fronteira da camada (o ponto onde uma
camada entrega o controle para a próxima) e têm um lugar pronto para crescer (autorização,
mapeamento de entrada) sem inchar service nem view.

## 2. O ciclo de vida de `ConsoleView` (um micro-framework de telas)

Toda tela estende a classe abstrata `ConsoleView` (uma classe que não pode ser instanciada
diretamente, só serve de base para outras classes) em `src/views/console.view.ts`. O método
`start()` implementa um **laço de evento** (um loop que fica rodando continuamente, processando
cada interação do usuário) com um ciclo de vida de três fases:

```ts
async start(): Promise<void> {
  this.resetState()
  // ...
  try {
    await this.onEnter()               // setup: roda uma vez
    while (this.isInView) {
      try {
        this.clear()
        await this.update()            // desenha + lê input: repete
      } catch (error: unknown) {
        await this.onUpdateError(error) // piso de erros do laço
      }
    }
    await this.onExit()
  } catch (error) {                    // fronteira externa: encerra a tela
    if (error instanceof Error) this.showError(error)
    this.display('View exiting with error')
    await this.prompt('Press ENTER to continue:')
  }
}
```

Regras do framework:

- `onEnter()` roda **uma vez**: cargas e setup que não devem repetir a cada tecla.
- `update()` é o **laço de interação**: desenha o estado, lê o input, age.
- `this.exit()` quebra o laço; `onExit()` roda na saída.
- Sub-telas compõem por `await`: `MenuView` chama `await this.exploreView.start()` e fica
  bloqueado até a sub-tela sair.
- `resetState()` garante reentrância (a capacidade de usar a tela mais de uma vez sem estado
  acumulado da visita anterior): revisitar uma tela funciona corretamente na segunda visita.

O `try/catch` do laço interno delega a `onUpdateError`, que define a política de sobrevivência da
tela (seção 4). O `try/catch` externo captura o que `onUpdateError` relançou e encerra a tela. A
distinção entre os dois níveis é intencional e é explicada na seção 4.

> **Readline como singleton estático:** `ReadlineInterfaceUtil` é compartilhado por todas as telas.
> Só a raiz de composição fecha a interface ao sair. Uma sub-tela que feche o readline mata a
> entrada do app inteiro, portanto sub-telas chamam `exit()`, nunca `close()`. O comentário em
> `src/views/console.view.ts:13` documenta o trade-off de usar um estático aqui em vez de injeção.

## 3. Ports & Adapters: dependa de interfaces, não de implementações

Disco e rede entram por uma **interface** (a porta, que define o contrato do que a camada
precisa), com a implementação concreta (o adaptador, que cumpre esse contrato) injetada na raiz
de composição.

**Repository** (`src/repositories/domain/box.repository.ts`):

```ts
export interface BoxRepository {
  list(): Promise<Pokemon[]>
  addPokemon(pokemon: Pokemon): Promise<void>
  removePokemon(id: number): Promise<void>
}
```

`BoxService` depende dessa interface; `BoxFileRepository` (contra `pc_box.json`) é o adaptador
injetado. Trocar para SQLite é escrever outra implementação, e o service não muda. `HttpService`
(`src/@common/http/http.service.ts`) cumpre o mesmo papel para a rede: o código nunca chama `fetch`
diretamente.

> **Convenção `@common/`:** infraestrutura genérica (HTTP, exceções) mora em `src/@common/`. O
> prefixo `@` sinaliza "núcleo compartilhado" e ordena no topo do explorador. É só convenção de
> nome; não há alias no `tsconfig`.

## 4. Política de erros

Esta é a parte que mais vale estudar. O raciocínio completo, incluindo referências bibliográficas
e pontos de divergência com a literatura, está em `error-architecture.md`.

### 4.1 Três canais, não dois

A maior fonte de confusão em tratamento de erros é tratar tudo o que "dá errado" como uma coisa
só. O projeto distingue três resultados possíveis de qualquer operação, cada um com um canal
próprio (uma forma distinta de devolver o resultado ao código que chamou a função):

1. **Sucesso:** quando não há alternativas de domínio (resultados esperados pelas regras do
   negócio além do caminho feliz), retorna-se um valor puro sem invólucro (sem estrutura extra
   ao redor), como `Pokemon[]`, `PokemonSliceDto` ou `void`. O caminho feliz parece o caminho
   feliz. Quando há alternativas, o sucesso é a variante `Ok<T>` (uma das formas possíveis do
   tipo) dentro de `Result<T, E>`. O invólucro existe para dar ao chamador algo a discriminar,
   não para empacotar o sucesso em si.
2. **Resultado de domínio:** domínio, aqui, significa as regras e conceitos do negócio que o app
   representa. Um resultado de domínio é uma alternativa esperada dessas regras: Pokémon não
   encontrado, já está na box, box vazia. Isso não é erro, é dado. Quando coexiste com o sucesso,
   o conjunto inteiro é modelado como **união discriminada** (um tipo que pode ser uma entre
   várias formas fixas, diferenciadas pelo campo `kind`) via `Result<T, E>`, percorrida num
   `switch` exaustivo. Quando a função só pode ter o caminho feliz ou lançar, o invólucro não
   existe.
3. **Falha técnica:** um defeito (disco indisponível, contrato de API violado, bug). Usa um único
   tipo opaco (`BaseException`), **lançado** (*thrown*: o mecanismo do `throw`, que dispara um
   erro e o faz subir pela pilha até ser capturado por um `try/catch`) e nunca devolvido como
   valor de retorno.

A pergunta que roteia uma situação entre os canais 2 e 3 é única: *o domínio tem algo a dizer
sobre este resultado?* Se sim, é dado tipado. Se não, é detalhe técnico opaco.

### 4.2 Por que o técnico é lançado, não retornado

Existe uma escola influente que recomenda modelar toda falha como valor de retorno (`Result<T, E>`).
O projeto a adota para o canal de domínio e a recusa para o técnico. A razão é específica da
linguagem:

- TypeScript não tem o operador `?` de Rust. Reencaminhar `T | Error` por cada quadro
  intermediário (cada função na pilha de chamadas entre onde o erro surgiu e onde será tratado)
  obriga a escrever `if (isErr) return err` à mão em cada um. O custo cresce com a distância.
- O sistema de tipos não rastreia exceções. `catch` recebe `unknown`; qualquer função pode lançar
  sem que isso apareça na assinatura (a declaração da função: nome, parâmetros e tipo de retorno).
  Um retorno `Result<T, BaseException>` não prova que `BaseException` é o conjunto completo,
  apenas documenta as falhas que o autor lembrou de capturar. A segurança seria real só com a
  stack inteira escrita nesse estilo.
- Diante de uma falha técnica, o chamador não age de modo diferente perante um tipo ou outro.
  Assinar a falha no tipo obrigaria apenas um repasse mecânico, sem oferecer nenhum poder de
  decisão.

A conclusão: assina-se no tipo apenas o canal de domínio, sobre o qual o chamador de fato decide.
O técnico segue pela via do lançamento.

### 4.3 Os tipos que materializam os canais

Definidos em `src/@common/result/result.ts`:

```ts
type Result<T, E extends string = never>  = Ok<T> | Fail<E>
type Outcome<T, E extends string = never> = Ok<T> | Fail<E> | Err
```

`Result` é o canal de domínio puro. `Outcome` acrescenta `Err` (que carrega um `BaseException`
como valor) e vem com um contrato: uma função que retorna `Outcome` não deve lançar
conscientemente. `Outcome` justifica-se apenas num repasse de distância zero, onde o chamador
imediato quer ramificar sobre a falha técnica sem escrever um `try/catch`. É o caso de
`parseJSON` (`src/utils/common.util.ts`), cujo `Err` é consumido e relançado por `getBox` no
repositório, um único quadro acima. Se `Err` viajasse por mais de um quadro como valor, o custo
de repasse da seção 4.2 reapareceria, e o correto teria sido lançar.

A exaustividade dos switches é garantida por `assertNever`:

```ts
export function assertNever(value: never): never {
  throw new BaseException({ cause: `Unhandled variant: ${JSON.stringify(value)}` })
}
```

Se um `switch` deixa de cobrir uma variante de `Result` ou `Outcome`, o valor que chega a
`assertNever` não é `never` e a compilação falha. TypeScript não obriga a exaustividade num
`switch`; `assertNever` é o parafuso que compensa.

Veja o padrão completo em `BoxService` (`src/services/box.service.ts`):

```ts
async add(pokemon: Pokemon): Promise<Result<void, 'duplicate'>> {
  const box = await this.boxRepository.list()           // lança se I/O falhar
  const isDuplicate = box.some((p) => p.id === pokemon.id)
  if (isDuplicate) return Result.fail('duplicate')      // canal 2: dado
  await this.boxRepository.addPokemon(pokemon)          // lança se I/O falhar
  return Result.void()                                  // canal 1: sucesso
}
```

E o chamador em `ExploreView.addToBox`:

```ts
const addResult = await this.boxController.add(pokemon)
const kind = addResult.kind
switch (kind) {
  case 'Ok': this.display(`${pokemon.name} capturado!`); break
  case 'duplicate': this.display(`${pokemon.name} já está na box.`); break
  default: assertNever(kind)
}
```

### 4.4 Fronteiras de tradução (camada anticorrupção)

Para que o canal técnico possa ser uma única exceção opaca no topo, nenhum erro de baixo nível
deve vazar para cima na sua forma original. Cada fronteira (o ponto onde os dados externos entram
no app) que entende uma falha externa a traduz. Essa política de tradução é o que a literatura
chama de camada anticorrupção: código que converte o vocabulário externo (códigos HTTP, erros do
sistema de arquivos) para o vocabulário interno do app, protegendo o resto do código de detalhes
de infraestrutura:

- **404 da PokeAPI** tem significado de domínio na busca: "este Pokémon não existe". Traduzido
  para `Result.fail('not-found')` em `getPokemonDetail` (`src/services/poke-api.service.ts`).
  Qualquer outra falha de transporte não tem significado de domínio e é embrulhada em
  `BaseException` e lançada.

- **`ENOENT` no repositório** é, conceitualmente, "a box ainda não foi criada": não uma falha,
  mas o estado inicial. `readBox` distingue esse código e retorna `'[]'`; qualquer outro erro de
  I/O é relançado como `BaseException`. É a mesma regra do 404, aplicada ao disco.

A mesma fronteira que traduz erros também valida dados externos. `isPokemonArray`,
`isGetPokemonsResponse` e `isGetPokemonDetailResponse` recebem `unknown` e conquistam o tipo em
tempo de execução antes que qualquer código confie nele. O espírito de "parse, don't validate":
produzir um valor já tipado ou uma falha declarada, não validar e prosseguir com um tipo otimista.

### 4.5 A sobrevivência da tela

A `ConsoleView` implementa um mecanismo de sobrevivência de duas camadas.

**Piso do laço** (`onUpdateError` em `src/views/console.view.ts:93`):

```ts
protected async onUpdateError(error: unknown): Promise<void> {
  if (error instanceof FatalViewException) {
    this.exit(error)   // encerra este loop; a view pai (menu) continua
    await this.prompt('Pressione ENTER para continuar:')
    return
  }
  if (error instanceof BaseException) {
    LoggerUtil.error(error)
    await this.prompt('Pressione ENTER para continuar:')
    return
  }
  throw error
}
```

O piso tem três vias. `FatalViewException` é uma subclasse de `BaseException` usada para encerrar
a tela corrente de forma controlada: é o que `ExploreView` lança quando a carga inicial da lista
falha; em vez de continuar num estado sem dados, encerra e devolve o usuário ao menu. Um
`BaseException` comum é registrado em log e absorvido: o laço continua e a tela sobrevive.
Qualquer outro lançamento é relançado e alcança a fronteira externa de `start()`, que encerra a
tela.

O papel de `BaseException` revela-se aqui: "normalizei esta falha para o meu tipo técnico" e "a
tela sabe como reagir a esta falha" são a mesma coisa. A reação pode ser continuar (`BaseException`
comum) ou encerrar controladamente (`FatalViewException`).

**Refinamento acima do piso:** a `ExploreView` captura erros em `handleNext` e `handlePrevious`
antes que cheguem ao piso, apenas para exibir uma mensagem contextual sob medida. É refinamento
de experiência, não necessidade de sobrevivência: a tela sobreviveria de qualquer forma pelo piso.

**`onEnter` com proteção própria:** a carga inicial da `ExploreView` ocorre em `onEnter`, fora
do laço. O piso do laço não cobre `onEnter`; por isso, a `ExploreView` protege `onEnter` com
`.catch` próprio.

A forma da aplicação (uma única fronteira de captura e pilha rasa) é o que torna esse mecanismo
suficiente. Resultado de domínio é sempre consumido pelo chamador imediato; falha técnica sempre
sobe até a mesma fronteira. A variável difícil (quem está distante do tratador) é constante aqui,
e isso elimina toda a análise caso a caso.

## 5. Modelos, DTOs e type-guards de fronteira

Modelos (`src/models/`) e DTOs (Data Transfer Objects, estruturas que carregam dados entre camadas
sem lógica de negócio, `src/dtos/`) são classes simples cujo construtor recebe um objeto com a
própria forma da classe:

```ts
export class Pokemon {
  id: number; name: string; types: string[]; height: number; weight: number
  constructor(props: Pokemon) {
    this.id = props.id; this.name = props.name; this.types = props.types
    this.height = props.height; this.weight = props.weight
  }
}
```

A listagem da PokeAPI devolve stubs (registros incompletos com apenas nome e url), não Pokémon
completos. Manter `PokemonSliceDto` distinto de `Pokemon` impede que dados de fio se passem por
entidade de domínio. Ao capturar, o app faz um *detail fetch* e enriquece o stub no modelo
completo antes de persistir.

Os type-guards de fronteira (funções que checam em tempo de execução se um valor tem o formato
esperado), `isPokemonArray`, `isGetPokemonsResponse` e `isGetPokemonDetailResponse`, recebem
`unknown` e produzem um valor tipado ou uma falha declarada. Sem biblioteca de schema (biblioteca
que define e valida formatos de dados de forma declarativa, como Zod), o custo é manter esses
guards sincronizados à mão com as interfaces que descrevem o payload.

## 6. Recursos modernos de TS/Node usados de propósito

- **`using` + `Symbol.dispose`:** `defer()` (`src/utils/common.util.ts`) dá cleanup determinístico
  no estilo Go, sem `try/finally`. Usado em `ConsoleView.start()` para fechar o readline ao sair
  da view raiz.
- **`fetch` nativo:** sem axios ou node-fetch.
- **`URL` / `URLSearchParams`:** a paginação extrai `offset` do campo `next` da PokeAPI com
  `new URL(next).searchParams.get('offset')`, não com split de string frágil.
- **`AbortController` / `AbortSignal`:** trata Ctrl+C e EOF no `prompt()`
  (`src/views/console.view.ts:25`).
- Prefixos `node:` nos imports de built-ins; alvo ES2020, saída CommonJS.

## 7. Convenções de estilo e ferramentas

- **Prettier:** aspas simples, sem ponto e vírgula, sem vírgula final.
- **ESLint:** `strictTypeChecked` + `stylisticTypeChecked`, com `import/order` (grupos
  builtin → external → internal, alfabetizados, linha em branco entre grupos).
- **Strings de UI em português:** mantenha o tom ao adicionar texto visível ao usuário.
- `dist/`, `node_modules/` e `pc_box.json` são ignorados por eslint e prettier: são saída de
  build ou arquivo mutado em runtime, não fonte.

## 8. Mapa do código

```
src/
├── main.ts                         # bootstrap(): raiz de composição (DI manual)
├── views/                          # I/O de console + laço de interação
│   ├── console.view.ts             # classe base: ciclo de vida + mecanismo de sobrevivência
│   ├── menu.view.ts                # despacha para sub-telas
│   ├── explore.view.ts             # navega a PokeAPI, captura
│   └── box.view.ts                 # lista, libera e filtra a box
├── controllers/                    # repasses finos para services
├── services/                       # regras de negócio (dedupe, paginação, filtro)
├── repositories/
│   ├── domain/box.repository.ts    # interface (porta)
│   └── box-file.repository.ts      # adaptador contra pc_box.json
├── models/ + dtos/                 # entidades de domínio / formatos de transporte
├── errors/base.exception.ts        # tipo técnico opaco + fábricas
├── @common/http/                   # interface HttpService + NativeHttpService (fetch)
└── utils/                          # defer, assertNever, parseJSON, logger, readline
```

## Leitura complementar

`error-architecture.md` (na raiz do projeto) registra o raciocínio completo por trás da política
de erros: as três famílias de exceções de Eric Lippert, a separação entre bugs e erros
recuperáveis de Joe Duffy, a divergência com `Effect` e `neverthrow`, e os limites do desenho
quando a forma da aplicação muda.
