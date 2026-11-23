# Desafio de testes: Truco

Implementação em JavaScript do **Truco Paulista para dois jogadores**, com uma suíte de testes automatizados em Jest (52 testes, 100% de cobertura).

> **Variante adotada:** Truco Paulista (a manilha é definida pela vira a cada mão), jogado em **dois jogadores**, e não em duplas.

## Colaboradores

- Vitor Hugo Assis da Silva — RA: 24140023-2
- Fernando Queiroz — RA: 24038237-2

## Regras adotadas

### Baralho e força das cartas

- Baralho de 40 cartas, sem 8, 9 e 10: valores `4, 5, 6, 7, Q, J, K, A, 2, 3` em quatro naipes.
- Ordem das cartas comuns, da mais fraca para a mais forte: `4, 5, 6, 7, Q, J, K, A, 2, 3`. Os naipes não desempatam cartas comuns.
- **Manilha:** a cada mão, uma carta é virada (a **vira**) e a manilha é o valor seguinte ao da vira (depois do `3` volta para o `4`).
- As manilhas vencem qualquer carta comum e, entre si, seguem a ordem dos naipes: ouros, espadas, copas e paus (a mais forte).

### Mão e rodadas

- Cada jogador recebe 3 cartas, e a 7ª carta do baralho embaralhado é a vira.
- A mão é disputada em até 3 rodadas, e cada jogador baixa uma carta por rodada. Quem vence a rodada começa a seguinte.
- Vence a mão quem ganhar duas rodadas. Em caso de empate:
  - empate na 1ª rodada: quem vencer a 2ª ganha a mão;
  - vitória na 1ª e empate na 2ª: o vencedor da 1ª ganha a mão;
  - empate na 3ª rodada: vence quem ganhou a 1ª;
  - três empates: vence quem começou a mão.

### Truco

- A mão vale 1 ponto e pode subir para **3** (truco), **6**, **9** e **12**.
- Quem está na vez pode pedir o aumento, e o adversário responde:
  - **aceitar:** a mão passa a valer o valor proposto;
  - **correr:** a mão termina e o solicitante recebe o **valor atual** da mão, ou seja, o valor anterior ao aumento recusado.
- Enquanto há um pedido pendente, nenhuma carta pode ser jogada.

### Partida

- Vence quem alcançar **12 pontos** primeiro.
- A pontuação é preservada de uma mão para outra, e o jogador que começa a mão **alterna** a cada nova mão (o jogador 1 começa a primeira).

### Fora do escopo

Não foram implementadas a mão de onze, a mão de ferro e as variações de outras regiões (como o Truco Mineiro, com manilhas fixas).

## Estrutura

```
.
├── .github/workflows/testes.yml   # CI: roda npm ci e npm test
├── src/
│   ├── baralho.js                 # cartas, manilha e comparação de força
│   └── truco.js                   # classe Truco (mão, rodadas, pedidos e partida)
├── tests/
│   └── truco.test.js              # testes unitários e simulações
└── package.json
```

### Testes

- Baralho, vira e manilha, preparação da mão, rodadas, resultado da mão, pedidos de truco e continuidade da partida.
- Grupo **Simulações completas**, com gerador pseudoaleatório por semente (definido no próprio arquivo de teste):
  - partidas completas, com 30 sementes, disputando várias mãos (com pedidos de truco, aceites e fugas) até alguém alcançar 12 pontos;
  - recusa depois de um aumento já aceito: o solicitante recebe o valor atual da mão;
  - alternância de quem começa em várias mãos consecutivas;
  - 100 distribuições aleatórias, nas quais as cartas entregues e a vira nunca se repetem.

## Instalação

Requer [Node.js](https://nodejs.org/) 18 ou superior.

```bash
npm ci
```

## Execução

```bash
npm test
```

O comando roda o Jest com relatório de cobertura. O projeto exige 100% de cobertura (instruções, ramos, funções e linhas); se ficar abaixo disso, o comando falha. O relatório HTML é gerado na pasta `coverage/`.

## Integração contínua

O workflow `.github/workflows/testes.yml` executa `npm ci` e `npm test` a cada push e pull request.

## Licença

MIT
