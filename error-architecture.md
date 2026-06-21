# Arquitetura de tratamento de erros

## 1. Objetivo e contexto

Este texto descreve e justifica as decisões de tratamento de erros do mini-projeto. A intenção não é servir de manual de consulta, e sim expor o raciocínio por trás do desenho: que problema cada decisão resolve, em que literatura ela se apoia e em que pontos se afasta dessa literatura, com a respectiva justificativa.

Três restrições de contexto moldam todas as escolhas seguintes:

1. **Apenas primitivas da plataforma.** Não há bibliotecas externas de validação, HTTP ou programação funcional. O modelo de erros precisa ser construído à mão, o que torna cada decisão visível no código em vez de delegada a um framework.
2. **A linguagem.** TypeScript sobre Node. Como a seção 3 detalha, certas características da linguagem deslocam o ponto de equilíbrio entre retornar e lançar um erro.
3. **A forma da aplicação.** Um CLI (interface de linha de comando, um app que roda no terminal) interativo com camadas rasas (grupos de código com responsabilidades distintas que se comunicam em sequência: View cuida da tela, Controller repassa, Service aplica regras, Repository persiste dados) e um laço de interação de vida longa (um loop que fica rodando enquanto o usuário não sai). A seção 6 mostra como essa forma simplifica todo o resto.

## 2. Premissa: "erro" não é uma categoria única

A maior fonte de confusão em tratamento de erros é tratar tudo o que "dá errado" como uma coisa só. O projeto parte da premissa oposta e distingue três resultados possíveis de qualquer operação, cada um com um canal próprio (uma forma de devolver o resultado ao código que chamou a função).

**Sucesso.** Quando não há alternativas de domínio nomeadas, um valor puro sem invólucro (sem estrutura extra ao redor): `Pokemon[]`, `PokemonSliceDto`, `void`. O caminho feliz parece o caminho feliz. Quando há alternativas, o sucesso é a variante `Ok<T>` (uma das formas possíveis do tipo) dentro do `Result<T, E>`. O invólucro existe para que o chamador possa discriminar entre possibilidades, não para empacotar o sucesso em si.

**Resultado de domínio.** Domínio, aqui, significa as regras e conceitos do problema que o app representa, no caso a lógica de capturar e gerenciar Pokémon. Um resultado de domínio é uma alternativa esperada e legítima dessas regras: o Pokémon não foi encontrado, já está na box, ou a box ainda está vazia. Isso não é um erro, é um dado. Muitas vezes o chamador invoca a função justamente para ramificar sobre esse resultado. Quando coexiste com o sucesso numa função que pode ter mais de um desfecho, o conjunto inteiro é modelado como união discriminada (um tipo que pode ser uma entre várias formas fixas, identificadas por um campo `kind`) via `Result<T, E>`: sucesso como `Ok<T>`, alternativa como `Fail<E>`. Quando a função só pode ter o caminho feliz ou lançar, o invólucro não existe.

**Falha técnica.** Um defeito: disco indisponível, contrato de API violado, um bug. O chamador comum não tem o que fazer com a identidade específica da falha; no máximo registra e degrada.

A pergunta que roteia uma situação entre o canal de domínio e o canal técnico é única: *o domínio tem algo a dizer sobre este resultado?* Em caso afirmativo, trata-se de resultado de domínio e ele vira dado tipado. Caso contrário, é detalhe técnico.

Essa distinção tem amparo na literatura. Eric Lippert, ao classificar exceções em quatro famílias (fatais, "boneheaded", "vexing" e "exogenous"), observa que apenas as exógenas (falhas externas inevitáveis, como I/O) justificam captura rotineira, enquanto as "vexing" (lançadas para situações que não são realmente excepcionais) deveriam ter sido modeladas como valor de retorno. Joe Duffy, no relato do sistema Midori, separa "bugs" (que devem abortar o programa) de "recoverable errors" (que pertencem ao contrato da função). E a tradição de Domain-Driven Design, DDD (uma abordagem de design que organiza o software ao redor das regras do negócio), de Evans e Vernon, trata resultados alternativos do negócio como parte do modelo, nunca como exceção. O canal de domínio deste projeto é a leitura dessas ideias.

## 3. A decisão central: o técnico é lançado, não retornado

Existe uma escola influente, costumeiramente chamada de "errors as values", que recomenda modelar toda falha, inclusive a técnica, como um valor no tipo de retorno (o que a função declara que devolve, a parte depois dos `:` na sua assinatura). É o que fazem o tipo `Result` de Rust acompanhado do operador `?`, a "Railway Oriented Programming" de Scott Wlaschin e bibliotecas como `fp-ts` e `Effect`. O projeto adota essa escola para o canal de domínio, mas a recusa de forma deliberada para o canal técnico. A razão é específica da linguagem, e vale enunciá-la em três partes que se somam.

**TypeScript não tem propagação ergonômica de erros.** Não existe o `?` de Rust. Reencaminhar um `T | Error` por cada quadro intermediário da pilha de chamadas (cada função na sequência que levou até onde o erro surgiu) obriga a escrever à mão, em cada um, a verificação `if (isErr) return err`. Esse custo cresce na proporção da distância entre onde o erro surge e onde é tratado. Para um erro que só uma fronteira distante resolve (a função mais acima na pilha que sabe o que fazer com a falha), cada quadro no meio paga uma linha de cerimônia sem nenhum ganho.

**O sistema de tipos não rastreia exceções.** O bloco `catch` recebe `unknown`, e qualquer função pode lançar (em inglês: *throw*, disparar um erro que interrompe o fluxo normal e sobe pela pilha até ser capturado por um `try/catch`) sem que isso apareça na sua assinatura (a declaração pública da função: nome, parâmetros e tipo de retorno). A consequência é decisiva: um retorno do tipo `Result<T, BaseException>` não prova que `BaseException` é o conjunto completo de falhas possíveis. Ele apenas documenta as falhas que o autor lembrou de capturar e converter, e qualquer função chamada abaixo pode lançar e furar o tipo. A assinatura passa, então, uma falsa sensação de segurança, prometendo um conjunto fechado de falhas que a linguagem não garante. É justamente para sanar isso que `Effect` e `neverthrow` existem, rastreando o canal de erro no próprio tipo. O projeto diverge dessas bibliotecas por uma questão de coerência: a segurança só seria real com a stack inteira escrita nesse estilo, e uma adoção parcial cobra o custo de sintaxe sem entregar a garantia que justificaria o custo.

**O ganho seria opaco** (sem informação utilizável para quem recebe). Diante de uma falha técnica, o chamador não consegue agir de modo diferente perante um `BaseException` ou outro. Não há o que discriminar num `switch`. Assinar a falha no tipo apenas obrigaria um repasse mecânico, sem oferecer nenhum poder de decisão novo.

A conclusão é assinar no tipo somente o canal de domínio, que é enumerável e sobre o qual o chamador de fato decide, e lançar o canal técnico. Isso reencontra a lição do recuo das checked exceptions de Java: obrigar o chamador a declarar e repassar um erro que ele apenas relança é um antipadrão reconhecido.

Na prática, diante de uma falha técnica, uma de três saídas se aplica, e nenhuma delas devolve o erro técnico cru como valor de retorno:

1. A própria função consegue resolver, repetindo a operação ou usando um valor padrão. Trata com `try/catch` ali mesmo, e o erro morre nesse ponto.
2. O domínio tem o que dizer sobre a falha. Captura-se na fronteira mais próxima que entende o erro, traduz-se para uma variante de domínio e devolve-se essa variante, um `Result.fail`, e não a exceção.
3. Apenas uma fronteira distante resolve. Lança-se.

## 4. Como os canais aparecem nos tipos

O canal de domínio usa duas formas, definidas em `@common/result/result.ts`:

```ts
type Result<T, E extends string = never>  = Ok<T> | Fail<E>
type Outcome<T, E extends string = never> = Ok<T> | Fail<E> | Err
```

`Result` modela o domínio como dado e deixa o técnico seguir pela via do lançamento. O tipo só aparece na assinatura de uma função quando ela possui alternativas de domínio nomeadas (as variantes `Fail<E>`). Quando o único desfecho não técnico é o sucesso, a função devolve `T` diretamente, sem invólucro. `Outcome` acrescenta a variante `Err`, que carrega a falha técnica como valor, e vem acompanhada de um contrato explícito: uma função que retorna `Outcome` não deve lançar conscientemente.

O uso de uniões discriminadas casadas de forma exaustiva segue o princípio de tornar estados ilegais irrepresentáveis, formulado por Yaron Minsky. TypeScript, no entanto, não obriga a exaustividade de um `switch`. O projeto compensa isso com a função `assertNever`, que recebe um parâmetro do tipo `never`: se um `switch` deixa de cobrir uma variante, o valor que chega a `assertNever` não é `never` e a compilação falha. É uma checagem possível, e não obrigatória pela linguagem, mas aparafusada de modo a se comportar como obrigatória.

A variante `Err` de `Outcome` aparece em um único ponto do código, e isso é intencional. Ela só se justifica num repasse de distância zero, quando o chamador imediato quer ramificar sobre a falha técnica sem escrever um `try/catch`. É o caso de `parseJSON`, cujo resultado é consumido e relançado por `getBox` no repositório, um único quadro acima. Se um `Err` viajasse por mais de um quadro como valor, recairíamos no custo de repasse que a seção 3 rejeita, e o correto teria sido lançar.

## 5. Fronteiras de tradução

Para que o canal técnico possa ser uma única exceção opaca no topo, é preciso que nenhum erro de baixo nível vaze para cima na sua forma original. Uma camada de interface ou de negócio jamais deve receber um `HttpClientError` ou um erro do módulo `fs`. Essa é a função de uma camada anticorrupção (código que traduz o vocabulário externo, como códigos HTTP e erros do sistema de arquivos, para o vocabulário interno do app, protegendo o domínio de detalhes de infraestrutura) no sentido do DDD de Eric Evans e da arquitetura hexagonal de Alistair Cockburn: cada fronteira (o ponto onde uma camada entrega o controle para a próxima) que entende uma falha externa ou a traduz para um resultado de domínio, quando ela carrega significado de domínio naquele ponto, ou a embrulha no tipo técnico opaco.

O `PokeApiService` ilustra os dois lados. Uma resposta `404` da PokeAPI tem significado de domínio na fronteira da busca, pois quer dizer "este Pokémon não existe". Ela é traduzida para `Result.fail('not-found')`. Qualquer outra falha de transporte não tem significado de domínio, é convertida em `BaseException` e lançada.

O repositório de arquivo oferece o exemplo mais instrutivo, porque a decisão foi revista durante o desenvolvimento. Na primeira versão, a leitura do arquivo capturava qualquer erro e o lançava. Isso produzia um defeito de primeiro uso: na ausência do arquivo `pc_box.json`, a leitura lançava `ENOENT`, a tela da box caía, e o usuário não conseguia sequer começar. O problema conceitual era tratar como falha técnica algo que é, na verdade, um resultado de domínio, já que "o arquivo ainda não existe" é a própria definição de "box vazia". A versão atual distingue o código `ENOENT` e o traduz para uma lista vazia, lançando apenas o I/O genuíno, como permissão negada, falha de disco ou JSON corrompido. É a mesma regra do `404 → not-found`, agora aplicada ao disco. A literatura antecipa esse caso: arquivo inexistente é o exemplo clássico da fronteira entre o exógeno e o "vexing" de Lippert, e é também onde Joe Duffy insistiria que uma condição recuperável não deve desaparecer dentro de um lançamento mudo. O projeto honra esse ponto, embora por um caminho diferente do que Duffy proporia: em vez de colocar o técnico na assinatura, promove a condição recuperável ao canal de domínio, que já está na assinatura.

A mesma fronteira que traduz erros também valida dados externos não confiáveis. Os type-guards (funções que verificam, em tempo de execução, se um valor tem o formato esperado) `isPokemonArray` e `isGetPokemonsResponse` recebem `unknown` e conquistam o tipo antes que qualquer código confie nele. A ideia segue o espírito de "parse, don't validate" (Alexis King): em vez de validar e prosseguir com um tipo otimista, produz-se um valor já tipado ou uma falha declarada. Sem uma biblioteca de schema, o custo é manter esses guards à mão e sincronizados com as interfaces que descrevem o payload.

## 6. A forma da aplicação e a sobrevivência da tela

A regra de roteamento da seção 2, sobre o domínio ter ou não algo a dizer, é mais simples do que a análise clássica de erros costuma permitir. Em geral, decidir entre retornar e lançar depende de duas perguntas independentes: se a falha é esperada ou um defeito, e se quem a trata é o chamador imediato ou uma fronteira distante. A segunda pergunta normalmente varia caso a caso. Neste projeto ela não varia, e é isso que permite a simplificação.

A aplicação tem uma única fronteira de captura para erros técnicos, o `try/catch` em `ConsoleView.start()`, e uma pilha de chamadas rasa. Em consequência, todo resultado de domínio é consumido pelo chamador imediato, a view, logo após o repasse do controller, e toda falha técnica não tem tratador intermediário, restando apenas o que fazer no topo. A localidade do tratador, que seria a variável difícil, é constante: domínio sempre local, técnico sempre distante. Eliminada essa variável, sobra apenas a pergunta sobre o domínio.

A view materializa esse arranjo num mecanismo de sobrevivência, cujo coração está em `ConsoleView`:

```ts
protected async onUpdateError(error: unknown): Promise<void> {
  // Mais específico primeiro: FatalViewException É um BaseException,
  // então precisa ser verificado antes do ramo recuperável.
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

O laço de interação envolve cada iteração de `update()` num `try/catch` que delega a esse método. A distinção feita ali define toda a política da tela em três vias:

1. **`FatalViewException`:** uma subclasse de `BaseException` usada para encerrar a tela corrente de forma controlada. Como estende `BaseException`, é tecnicamente um erro normalizado; mas carrega a intenção explícita de derrubar *este* loop sem derrubar o app. O método chama `this.exit()`, que quebra o `while`, e então a tela retorna ao menu pai. É o caso da `ExploreView` quando a carga inicial falha: em vez de continuar num estado sem dados, ela lança `FatalViewException` e devolve o usuário ao menu.
2. **`BaseException` (não-Fatal):** o tipo técnico normalizado. É registrado em log, exibido ao usuário e absorvido: o laço continua e a tela sobrevive.
3. **Qualquer outro lançamento:** por não ser `BaseException`, é por definição inesperado (um bug ou um throw cru não normalizado). É relançado e alcança a fronteira externa de `start()`, que encerra a tela e devolve o usuário ao menu.

Há um detalhe arquitetural que vale registrar, com uma nuance. O `BaseException` acumula dois papéis que se revelam quase o mesmo: ele é o tipo técnico opaco único e é a condição necessária para que o piso do laço atue. A `FatalViewException` introduz uma distinção: existe um `BaseException` que o piso reconhece mas decide encerrar a tela de propósito. "Normalizei esta falha para o meu tipo técnico" e "a tela sabe como reagir a esta falha" são a mesma coisa; a reação pode ser continuar (`BaseException` comum) ou encerrar controladamente (`FatalViewException`).

As outras duas camadas completam o desenho. Acima do piso, um handler pode capturar a falha localmente com um `.catch`, apenas para exibir uma mensagem sob medida no lugar da mensagem genérica do piso. Isso é refinamento de experiência, não necessidade de sobrevivência, e por essa razão aparece na `ExploreView` mas não na `BoxView`, sem que isso as torne incoerentes, pois ambas sobrevivem de qualquer forma. Abaixo de tudo, a fronteira externa de `start()` trata o que o piso relançou e também as falhas de `onEnter` e `onExit`, que ocorrem fora do laço e portanto não contam com o piso. É por isso que a carga inicial da `ExploreView`, feita em `onEnter`, protege a si mesma com um `.catch` próprio.

A inspiração para esse formato vem dos laços de evento de jogos e interfaces interativas, e tem um análogo contemporâneo nas error boundaries (limites de erro) de bibliotecas de interface, que isolam a falha de um componente sem derrubar a aplicação inteira.

## 7. Limites do desenho

A simplicidade descrita na seção anterior é uma propriedade da forma da aplicação, não uma verdade universal. Toda ela repousa em uma única coisa ter ficado constante: *a localidade do tratador*. Como a aplicação tem uma só fronteira de captura (o `try/catch` em `ConsoleView.start()`) e uma pilha rasa, soubemos de antemão que domínio é sempre tratado pelo chamador imediato e técnico é sempre tratado no topo. Foi essa constância que permitiu reduzir a decisão a uma única pergunta: "o domínio tem algo a dizer?".

Os três cenários a seguir são exatamente os que reintroduzem a variável que eliminamos. Para cada um, vale separar *por que o modelo quebra* de *o que a solução exigiria*.

### Cenário A — Múltiplas fronteiras de captura

**O contexto.** A aplicação deixa de ter um único ponto de captura no topo. É o que acontece num servidor HTTP, onde cada requisição tem sua própria fronteira (um erro numa requisição não pode derrubar as outras nem o processo), ou quando há uma transação de banco de dados no meio da pilha: um bloco que precisa decidir entre confirmar (*commit*: salvar permanentemente todas as alterações feitas) ou desfazer (*rollback*: reverter ao estado anterior, descartando as alterações) tudo o que fez, antes que o erro continue subindo.

**Por que o modelo quebra.** A regra atual "lance o técnico, alguém lá em cima trata" assume que *lá em cima* existe um único lugar e que esse lugar é genérico. Com múltiplas fronteiras, o erro que sobe encontra um tratador *intermediário* que tem uma obrigação própria antes de deixar o erro seguir.

Exemplo concreto com transação: imagine um caso de uso que abre uma transação, insere o Pokémon, e então grava um log de auditoria que falha por I/O. No modelo atual, esse erro de I/O viraria `BaseException` e seria lançado direto até o piso da view. Mas a transação ficou aberta. O banco mantém os recursos travados, e a inserção parcial nunca é desfeita: uma escrita "fantasma" que ninguém confirmou nem cancelou. O piso da tela exibe "Algo deu errado" e a tela sobrevive, mas o estado do banco ficou corrompido. O piso genérico não tem como saber que havia uma transação aberta três quadros abaixo; essa responsabilidade é *local* àquela fronteira.

O mesmo vale para o servidor: se um erro de uma requisição subir até um `try/catch` de processo, ele derruba o servidor inteiro. A fronteira certa é *por requisição*, e cada uma precisa capturar, traduzir para um código de status HTTP (500, 404...) e responder, isolando a falha das outras.

**O que a solução exigiria.** Reconhecer que a localidade do tratador voltou a variar e, portanto, a pergunta única não basta mais. É preciso reintroduzir a *segunda* pergunta que a seção 6 conseguiu aposentar: "quem trata esta falha: o topo ou uma fronteira intermediária?". Concretamente:

- Toda fronteira que detém um recurso com ciclo de vida (transação, conexão, lock de banco de dados, arquivo aberto) precisa capturar o erro técnico localmente, executar sua limpeza obrigatória (`rollback`, `close`) e só então **relançar**, para que o tratador genérico de cima ainda registre e degrade. O padrão de linguagem para isso é `try/catch/finally` (ou, neste projeto, o `using`/`Symbol.dispose` que já aparece em `start()`), garantindo que a limpeza rode aconteça o que acontecer.
- No caso do servidor, a "fronteira de tela única" da seção 6 vira uma *fronteira por requisição*: um middleware de erro (uma função que intercepta cada requisição antes ou depois do tratamento, adicionando lógica transversal como logs, autenticação ou tratamento de falhas) que faz o papel que `onUpdateError` faz hoje, mas com escopo de uma requisição, traduzindo o `BaseException` em resposta HTTP em vez de mensagem na tela.

Ou seja: o canal técnico continua sendo lançado, mas passam a existir **vários** pontos legítimos de captura, cada um com uma responsabilidade de limpeza própria antes de propagar.

### Cenário B — Pilha profunda

**O contexto.** A pilha deixa de ser rasa. Em vez de View → Controller → Service → Repository, imagine um serviço com muitas camadas intermediárias, onde uma falha de domínio nasce lá no fundo e só faz sentido ser tratada lá no topo, depois de atravessar 5 a 10 funções que não têm nada a dizer sobre ela.

**Por que o modelo quebra.** O problema aqui *não* é com o canal técnico: esse continua sendo lançado, e o lançamento atravessa qualquer número de quadros de graça, sem custo de sintaxe. Um `throw` no fundo chega ao `catch` do topo sem que as funções do meio escrevam uma única linha. É justamente por isso que a seção 3 escolheu lançar o técnico.

O problema aparece no **canal de domínio**, que viaja como *valor de retorno* (`Result<T, E>`). Um valor de retorno não sobe sozinho pela pilha: cada função intermediária que o recebe precisa, manualmente, verificar se é falha e repassá-lo. Como TypeScript não tem o operador `?` de Rust (a "propagação ergonômica" que a seção 3 menciona), cada quadro do meio paga uma linha de cerimônia:

```ts
const r = await camadaAbaixo()
if (r.kind !== 'Ok') return r   // repasse mecânico, repetido em cada quadro intermediário
// ... usa r.value
```

Com 8 camadas, são 8 cópias desse `if` que não fazem nada além de empurrar a falha adiante. É exatamente o "custo de repasse" que a seção 3 rejeita: só que na seção 3 ele não se manifestava, porque a pilha era rasa o bastante para que o domínio fosse sempre consumido pelo chamador imediato. Numa pilha profunda, a distância entre onde a falha de domínio nasce e onde é decidida volta a crescer, e com ela o custo.

**O que a solução exigiria.** Há dois caminhos, e a escolha é um trade-off, não uma resposta única:

- **Reclassificar parte do que era domínio como técnico.** Se uma falha de domínio precisa subir 8 quadros sem ninguém no meio agir sobre ela, vale perguntar se ela é mesmo "dado de domínio" para esses quadros ou se, da perspectiva deles, é tão opaca quanto uma falha técnica. Em caso afirmativo, lançá-la (talvez como uma subclasse de exceção com identidade própria) elimina o repasse, ao custo de sair da assinatura e perder a checagem exaustiva do `switch`/`assertNever`.
- **Adotar uma propagação automática para o canal de domínio.** É exatamente o nicho que bibliotecas como `neverthrow` e `Effect` preenchem: elas dão ao TypeScript o equivalente ao `?` de Rust, encadeando `Result`s sem o `if` manual em cada quadro. A seção 3 recusou essas bibliotecas porque, numa stack rasa, o custo de sintaxe não se pagava. Numa pilha profunda a conta inverte: o custo do repasse manual cresce a ponto de a biblioteca passar a valer a pena, desde que adotada na stack inteira, pela razão de coerência já discutida.

A lição é que "domínio como valor, técnico como lançamento" é ótimo *enquanto o domínio não precisa viajar longe*. A profundidade da pilha é a variável que define se ele viaja longe.

### Cenário C — Erro cruzando fronteira de rede

**O contexto.** O erro precisa atravessar uma fronteira de rede: nasce num processo (um serviço, um backend) e precisa ser entendido por outro processo (outro serviço, o cliente). Entre eles, o erro tem de ser **serializado** (convertido em texto ou bytes, tipicamente JSON, para trafegar) e depois reconstruído do outro lado.

**Por que o modelo quebra.** O coração da seção 6 é o teste `error instanceof BaseException`. Esse `instanceof` pergunta "este objeto foi construído pela classe `BaseException`?", e essa informação vive na *identidade de classe* do objeto em memória: um vínculo com o `prototype` da classe (o molde interno que o motor JavaScript usa para criar e reconhecer objetos de um mesmo tipo) naquele processo.

A serialização destrói esse vínculo. Quando um `BaseException` vira JSON, ele perde tudo o que não é dado puro: o nome da classe, o `prototype`, os métodos. Do outro lado da rede chega algo como `{ "message": "READ PC_BOX.JSON: ...", "code": "..." }`: um objeto comum, sem nenhuma ligação com a classe `BaseException` (que pode nem existir no processo cliente). O teste `instanceof BaseException` retorna `false` para ele. Pelo critério atual, o piso da tela o classificaria como "erro inesperado" e o **relançaria**, derrubando a view, mesmo sendo uma falha que o servidor já normalizou e que deveria ser absorvida. A regra de sobrevivência inverte de sinal: o que deveria manter a tela viva passa a derrubá-la.

A causa raiz é a mesma que a seção 6 celebra como elegância: "ser `BaseException`" e "a tela sabe absorver" eram a mesma coisa dentro de *um único processo*, onde a classe sobrevive. Cruzada a rede, essa identidade se rompe.

**O que a solução exigiria.** O critério de decisão precisa migrar da *identidade de classe* (que não atravessa a rede) para um *dado serializável* que ambos os lados reconheçam. É o papel dos **códigos de erro**: strings ou números estáveis, combinados por contrato entre cliente e servidor, ao estilo dos códigos de status HTTP (`404`, `500`). Concretamente:

- O servidor, ao normalizar uma falha, anexa a ela um código serializável (`"INTERNAL_ERROR"`, `"NOT_FOUND"`, etc.) que viaja no corpo da resposta junto com a mensagem.
- O cliente decide o que mantém a tela viva olhando para *esse código*, não para `instanceof`. A pergunta "absorvo ou derrubo?" passa a ser "este código está na minha lista de erros recuperáveis?".

Há uma simetria que vale notar: esse código de erro de transporte é o análogo *externo* do que `Result<T, E>` já faz internamente. O `kind: 'not-found'` da seção 4 é, em essência, um código de erro de domínio que nunca precisou ser serializado porque nunca saiu do processo. Numa arquitetura distribuída, esse mesmo conceito (uma etiqueta estável que diferencia desfechos) passa a ser a moeda de troca entre serviços, só que agora como parte de um *contrato de API* público entre cliente e servidor.

### Conclusão

Os três cenários atacam pontos diferentes do mesmo desenho: A reintroduz a variável da localidade, B reintroduz o custo da distância no canal de domínio, C quebra o critério de identidade do canal técnico. Mas todos têm a mesma origem: o modelo da seção 6 trocou generalidade por simplicidade, e essa troca foi deliberada e correta para o que a aplicação é. Enquanto for um CLI de camadas rasas rodando em um único processo, com uma fronteira de tela, a regra simples basta. Saber *por que* ela basta é o que permite reconhecer o dia em que ela deixará de bastar.

## 8. Síntese

O desenho se resume a poucas afirmações. Há três canais, e não dois: sucesso é valor puro quando não há alternativas de domínio, ou a variante `Ok<T>` dentro de `Result<T, E>` quando há (o invólucro só aparece para dar ao chamador algo a discriminar); resultado alternativo esperado é dado tipado, casado de forma exaustiva, e nunca chamado de erro; falha técnica é uma única exceção opaca. Em cada fronteira, o vocabulário do mecanismo (um `404` ou um `ENOENT`) é traduzido para o vocabulário do domínio quando carrega significado de domínio, e embrulhado de forma opaca caso contrário. O canal de domínio é assinado no tipo, porque o chamador decide sobre ele e o compilador pode cobrar a exaustividade. O canal técnico é lançado, porque assiná-lo em TypeScript custa sintaxe por quadro e entrega uma garantia que a linguagem não sustenta. A tela, por fim, sobrevive a tudo o que foi normalizado ao tipo técnico e encerra apenas diante do inesperado.

## Referências

As fontes abaixo serviram de inspiração. Onde o projeto se afasta delas, o motivo está indicado no corpo do texto.

- Eric Lippert. *Vexing exceptions* (2008). Taxonomia de exceções e origem da distinção entre falha exógena e situação não excepcional. Inspira a seção 2 e o tratamento do `ENOENT` na seção 5.
- Joe Duffy. *The Error Model* (2016). Relato do sistema Midori e separação entre bugs e erros recuperáveis. Concorda quanto a não enterrar condições recuperáveis em lançamentos mudos; o projeto diverge ao promovê-las ao canal de domínio em vez de assiná-las como técnico.
- Scott Wlaschin. *Railway Oriented Programming* (2014). Modelagem de sucesso e falha como valores componíveis. Adotada para o domínio e recusada para o técnico, pelas razões da seção 3.
- `Effect` e `neverthrow`. Rastreamento do canal de erro no tipo, em TypeScript. Principal ponto de divergência, discutido na seção 3.
- Alexis King. *Parse, don't validate* (2019). Validar produzindo um tipo, base dos type-guards de fronteira da seção 5.
- Yaron Minsky. *Make illegal states unrepresentable*. Uniões discriminadas e exaustividade, base da seção 4.
- Eric Evans, *Domain-Driven Design* (2003); Vaughn Vernon, *Implementing Domain-Driven Design* (2013). Resultado de negócio como modelo e camada anticorrupção.
- Alistair Cockburn. *Hexagonal Architecture (Ports and Adapters)*. Separação entre domínio e mecanismo, base das fronteiras da seção 5.
- Discussão sobre checked exceptions em Java, por exemplo Bruce Eckel, *Does Java Need Checked Exceptions?*. Antipadrão do repasse forçado citado na seção 3.
