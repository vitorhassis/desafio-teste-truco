const {
  Truco,
  criarBaralho,
  compararCartas,
  manilhaDa,
} = require('../src/truco');

const carta = (valor, naipe = 'ouros') => ({ valor, naipe });
const chave = ({ valor, naipe }) => `${valor}:${naipe}`;

function baralhoComecando(...inicio) {
  const usadas = new Set(inicio.map(chave));
  return [...inicio, ...criarBaralho().filter((item) => !usadas.has(chave(item)))];
}

describe('Baralho paulista', () => {
  test('possui 40 cartas únicas, com dez valores e quatro naipes', () => {
    const baralho = criarBaralho();
    expect(baralho).toHaveLength(40);
    expect(new Set(baralho.map(chave)).size).toBe(40);
    expect(new Set(baralho.map(({ valor }) => valor))).toEqual(new Set(['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3']));
    expect(new Set(baralho.map(({ naipe }) => naipe))).toEqual(new Set(['ouros', 'espadas', 'copas', 'paus']));
  });

  test('cada chamada entrega cartas independentes', () => {
    const alterado = criarBaralho();
    alterado[0].valor = '3';
    alterado.pop();
    expect(criarBaralho()).toHaveLength(40);
    expect(criarBaralho()[0]).toEqual(carta('4'));
  });
});

describe('Vira, manilha e força das cartas', () => {
  test.each([
    ['4', '5'], ['7', 'Q'], ['Q', 'J'], ['A', '2'], ['3', '4'],
  ])('a vira %s produz a manilha %s', (vira, esperada) => {
    expect(manilhaDa(carta(vira))).toBe(esperada);
  });

  test('recusa uma vira fora do baralho', () => {
    expect(() => manilhaDa(carta('8'))).toThrow(RangeError);
    expect(() => manilhaDa(null)).toThrow(RangeError);
  });

  test('entre cartas comuns vale a ordem 4, 5, 6, 7, Q, J, K, A, 2 e 3', () => {
    const vira = carta('4');
    expect(compararCartas(carta('3'), carta('2'), vira)).toBeGreaterThan(0);
    expect(compararCartas(carta('Q'), carta('7'), vira)).toBeGreaterThan(0);
    expect(compararCartas(carta('4'), carta('6'), vira)).toBeLessThan(0);
    expect(compararCartas(carta('A'), carta('A', 'paus'), vira)).toBe(0);
  });

  test('qualquer manilha vence as cartas comuns', () => {
    const vira = carta('Q');
    expect(compararCartas(carta('J'), carta('3'), vira)).toBeGreaterThan(0);
    expect(compararCartas(carta('4'), carta('J'), vira)).toBeLessThan(0);
  });

  test('entre manilhas a ordem é ouros, espadas, copas e paus', () => {
    const vira = carta('6');
    expect(compararCartas(carta('7', 'paus'), carta('7', 'copas'), vira)).toBeGreaterThan(0);
    expect(compararCartas(carta('7', 'espadas'), carta('7', 'ouros'), vira)).toBeGreaterThan(0);
    expect(compararCartas(carta('7', 'ouros'), carta('7', 'paus'), vira)).toBeLessThan(0);
  });

  test('comparar cartas rejeita valores ou naipes desconhecidos', () => {
    expect(() => compararCartas(carta('8'), carta('3'), carta('4'))).toThrow(RangeError);
    expect(() => compararCartas(carta('3', 'estrelas'), carta('2'), carta('4'))).toThrow(RangeError);
  });
});

describe('Preparação da mão', () => {
  const inicio = [
    carta('3', 'paus'), carta('A', 'copas'), carta('4', 'ouros'),
    carta('2', 'espadas'), carta('K', 'paus'), carta('6', 'copas'),
    carta('7', 'ouros'),
  ];

  test('distribui três cartas para cada jogador e revela a vira', () => {
    const jogo = new Truco({ cartasEmbaralhadas: baralhoComecando(...inicio) });
    expect(jogo.mao(1)).toEqual(inicio.slice(0, 3));
    expect(jogo.mao(2)).toEqual(inicio.slice(3, 6));
    expect(jogo.vira).toEqual(inicio[6]);
    expect(jogo.manilha).toBe('Q');
    expect(jogo.vez).toBe(1);
    expect(jogo.estado).toBe('jogando');
    expect(jogo.valorMao).toBe(1);
    expect(jogo.pontuacao).toEqual([0, 0]);
  });

  test('embaralha o baralho quando uma ordem fixa não é informada', () => {
    const jogo = new Truco({ aleatorio: () => 0 });
    const distribuidas = [...jogo.mao(1), ...jogo.mao(2), jogo.vira];
    expect(distribuidas).toHaveLength(7);
    expect(new Set(distribuidas.map(chave)).size).toBe(7);
  });

  test.each([
    ['quantidade incorreta', criarBaralho().slice(1)],
    ['carta repetida', [...criarBaralho().slice(0, 39), carta('4')]],
    ['valor inválido', [...criarBaralho().slice(0, 39), carta('8')]],
    ['naipe inválido', [...criarBaralho().slice(0, 39), carta('3', 'estrelas')]],
    ['item nulo', [...criarBaralho().slice(0, 39), null]],
    ['entrada não é lista', 'baralho'],
  ])('recusa baralho fixo com %s', (_caso, cartasEmbaralhadas) => {
    expect(() => new Truco({ cartasEmbaralhadas })).toThrow(RangeError);
  });

  test('mãos, vira e pontuação são devolvidas como cópias', () => {
    const jogo = new Truco({ cartasEmbaralhadas: baralhoComecando(...inicio) });
    jogo.mao(1)[0].valor = '4';
    jogo.vira.valor = '3';
    jogo.pontuacao[0] = 11;
    expect(jogo.mao(1)[0]).toEqual(inicio[0]);
    expect(jogo.vira).toEqual(inicio[6]);
    expect(jogo.pontuacao).toEqual([0, 0]);
  });

  test('recusa jogador inexistente ao consultar a mão', () => {
    expect(() => new Truco().mao(3)).toThrow(RangeError);
  });
});

function jogoCom(mao1, mao2, vira = carta('4', 'copas'), pontuacaoInicial = [0, 0]) {
  return new Truco({
    cartasEmbaralhadas: baralhoComecando(...mao1, ...mao2, vira),
    pontuacaoInicial,
  });
}

describe('Disputa de uma rodada', () => {
  test('cada jogador baixa uma carta e a mais forte vence', () => {
    const jogo = jogoCom(
      [carta('3', 'paus'), carta('A'), carta('K')],
      [carta('2', 'copas'), carta('7'), carta('6')],
    );
    jogo.jogar(1, carta('3', 'paus'));
    expect(jogo.vez).toBe(2);
    expect(jogo.mesa).toHaveLength(1);
    const resultado = jogo.jogar(2, carta('2', 'copas'));
    expect(resultado).toEqual({ vencedorRodada: 1, vencedorMao: null });
    expect(jogo.rodadas).toEqual([1]);
    expect(jogo.mesa).toEqual([]);
    expect(jogo.vez).toBe(1);
  });

  test('uma manilha vence qualquer carta comum', () => {
    const jogo = jogoCom(
      [carta('5', 'ouros'), carta('4'), carta('6')],
      [carta('3', 'paus'), carta('7'), carta('Q')],
    );
    jogo.jogar(1, carta('5', 'ouros'));
    jogo.jogar(2, carta('3', 'paus'));
    expect(jogo.rodadas).toEqual([1]);
  });

  test('cartas comuns de mesmo valor empatam independentemente do naipe', () => {
    const jogo = jogoCom(
      [carta('A', 'ouros'), carta('3'), carta('6')],
      [carta('A', 'paus'), carta('2'), carta('7')],
    );
    jogo.jogar(1, carta('A', 'ouros'));
    jogo.jogar(2, carta('A', 'paus'));
    expect(jogo.rodadas).toEqual([null]);
    expect(jogo.vez).toBe(1);
  });

  test('rejeita jogador fora da vez, carta ausente e carta inválida', () => {
    const jogo = jogoCom(
      [carta('3'), carta('A'), carta('K')],
      [carta('2'), carta('7'), carta('6')],
    );
    expect(() => jogo.jogar(2, carta('2'))).toThrow('Não é a vez');
    expect(() => jogo.jogar(1, carta('Q'))).toThrow('Carta não está na mão');
    expect(() => jogo.jogar(1, carta('8'))).toThrow(RangeError);
    expect(() => jogo.jogar(3, carta('3'))).toThrow(RangeError);
  });

  test('não permite baixar a mesma carta duas vezes', () => {
    const jogo = jogoCom(
      [carta('3'), carta('A'), carta('K')],
      [carta('2'), carta('7'), carta('6')],
    );
    jogo.jogar(1, carta('3'));
    jogo.jogar(2, carta('2'));
    expect(() => jogo.jogar(1, carta('3'))).toThrow('Carta não está na mão');
  });
});

describe('Resultado da mão', () => {
  test('duas vitórias encerram a mão e somam seu valor', () => {
    const jogo = jogoCom(
      [carta('3'), carta('2'), carta('A')],
      [carta('7'), carta('6'), carta('4', 'espadas')],
    );
    jogo.jogar(1, carta('3')); jogo.jogar(2, carta('7'));
    jogo.jogar(1, carta('2')); jogo.jogar(2, carta('6'));
    expect(jogo.estado).toBe('fim-mao');
    expect(jogo.vencedorMao).toBe(1);
    expect(jogo.pontuacao).toEqual([1, 0]);
    expect(jogo.vez).toBeNull();
  });

  test('empate na primeira rodada faz a segunda decidir a mão', () => {
    const jogo = jogoCom(
      [carta('A', 'ouros'), carta('3'), carta('6')],
      [carta('A', 'paus'), carta('2'), carta('7')],
    );
    jogo.jogar(1, carta('A', 'ouros')); jogo.jogar(2, carta('A', 'paus'));
    jogo.jogar(1, carta('3')); jogo.jogar(2, carta('2'));
    expect(jogo.vencedorMao).toBe(1);
  });

  test('com uma vitória para cada lado, empate na terceira favorece a primeira', () => {
    const jogo = jogoCom(
      [carta('3'), carta('4'), carta('A', 'ouros')],
      [carta('2'), carta('6'), carta('A', 'paus')],
    );
    jogo.jogar(1, carta('3')); jogo.jogar(2, carta('2'));
    jogo.jogar(1, carta('4')); jogo.jogar(2, carta('6'));
    jogo.jogar(2, carta('A', 'paus')); jogo.jogar(1, carta('A', 'ouros'));
    expect(jogo.rodadas).toEqual([1, 2, null]);
    expect(jogo.vencedorMao).toBe(1);
  });

  test('três empates entregam a mão a quem começou', () => {
    const jogo = jogoCom(
      [carta('A', 'ouros'), carta('K', 'ouros'), carta('Q', 'ouros')],
      [carta('A', 'paus'), carta('K', 'paus'), carta('Q', 'paus')],
    );
    jogo.jogar(1, carta('A', 'ouros')); jogo.jogar(2, carta('A', 'paus'));
    jogo.jogar(1, carta('K', 'ouros')); jogo.jogar(2, carta('K', 'paus'));
    jogo.jogar(1, carta('Q', 'ouros')); jogo.jogar(2, carta('Q', 'paus'));
    expect(jogo.vencedorMao).toBe(1);
  });

  test('o jogador dois também encerra a mão ao vencer duas rodadas', () => {
    const jogo = jogoCom(
      [carta('4'), carta('6'), carta('A')],
      [carta('3'), carta('2'), carta('K')],
    );
    jogo.jogar(1, carta('4')); jogo.jogar(2, carta('3'));
    jogo.jogar(2, carta('2')); jogo.jogar(1, carta('6'));
    expect(jogo.vencedorMao).toBe(2);
    expect(jogo.pontuacao).toEqual([0, 1]);
  });

  test('empate na segunda rodada mantém a vitória obtida na primeira', () => {
    const jogo = jogoCom(
      [carta('3'), carta('A', 'ouros'), carta('6')],
      [carta('2'), carta('A', 'paus'), carta('7')],
    );
    jogo.jogar(1, carta('3')); jogo.jogar(2, carta('2'));
    jogo.jogar(1, carta('A', 'ouros')); jogo.jogar(2, carta('A', 'paus'));
    expect(jogo.vencedorMao).toBe(1);
  });

  test('depois de dois empates a terceira rodada define a mão', () => {
    const jogo = jogoCom(
      [carta('A', 'ouros'), carta('K', 'ouros'), carta('4')],
      [carta('A', 'paus'), carta('K', 'paus'), carta('3')],
    );
    jogo.jogar(1, carta('A', 'ouros')); jogo.jogar(2, carta('A', 'paus'));
    jogo.jogar(1, carta('K', 'ouros')); jogo.jogar(2, carta('K', 'paus'));
    jogo.jogar(1, carta('4')); jogo.jogar(2, carta('3'));
    expect(jogo.vencedorMao).toBe(2);
  });

  test('ao alcançar 12 pontos a partida termina', () => {
    const jogo = jogoCom(
      [carta('3'), carta('2'), carta('A')],
      [carta('7'), carta('6'), carta('4', 'espadas')],
      carta('4', 'copas'),
      [11, 4],
    );
    jogo.jogar(1, carta('3')); jogo.jogar(2, carta('7'));
    jogo.jogar(1, carta('2')); jogo.jogar(2, carta('6'));
    expect(jogo.estado).toBe('fim');
    expect(jogo.vencedor).toBe(1);
    expect(jogo.pontuacao).toEqual([12, 4]);
  });

  test.each([[[-1, 0]], [[12, 0]], [[1.5, 0]], [[0]], ['pontos']])(
    'recusa pontuação inicial inválida: %p',
    (pontuacaoInicial) => expect(() => new Truco({ pontuacaoInicial })).toThrow(RangeError),
  );
});

describe('Pedidos de truco', () => {
  test('o adversário pode aceitar um pedido e elevar a mão para três pontos', () => {
    const jogo = jogoCom(
      [carta('3'), carta('2'), carta('A')],
      [carta('7'), carta('6'), carta('4', 'espadas')],
    );
    expect(jogo.pedirTruco(1)).toEqual({ solicitante: 1, valorProposto: 3 });
    expect(jogo.pedidoTruco).toEqual({ solicitante: 1, valorProposto: 3 });
    jogo.responderTruco(2, 'aceitar');
    expect(jogo.valorMao).toBe(3);
    expect(jogo.pedidoTruco).toBeNull();
    expect(jogo.vez).toBe(1);
  });

  test('o aumento pode avançar por 3, 6, 9 e 12', () => {
    const jogo = jogoCom(
      [carta('3'), carta('2'), carta('A')],
      [carta('7'), carta('6'), carta('K')],
    );
    jogo.pedirTruco(1); jogo.responderTruco(2, 'aceitar');
    jogo.jogar(1, carta('3'));
    jogo.pedirTruco(2); jogo.responderTruco(1, 'aceitar');
    jogo.jogar(2, carta('7'));
    jogo.pedirTruco(1); jogo.responderTruco(2, 'aceitar');
    jogo.jogar(1, carta('2'));
    jogo.pedirTruco(2); jogo.responderTruco(1, 'aceitar');
    expect(jogo.valorMao).toBe(12);
    expect(() => jogo.pedirTruco(2)).toThrow('A mão já vale 12');
  });

  test('correr concede ao solicitante o valor atual da mão', () => {
    const jogo = jogoCom(
      [carta('3'), carta('2'), carta('A')],
      [carta('7'), carta('6'), carta('K')],
    );
    jogo.pedirTruco(1);
    jogo.responderTruco(2, 'correr');
    expect(jogo.estado).toBe('fim-mao');
    expect(jogo.vencedorMao).toBe(1);
    expect(jogo.pontuacao).toEqual([1, 0]);
  });

  test('enquanto há pedido pendente nenhuma carta pode ser jogada', () => {
    const jogo = jogoCom(
      [carta('3'), carta('2'), carta('A')],
      [carta('7'), carta('6'), carta('K')],
    );
    jogo.pedirTruco(1);
    expect(() => jogo.jogar(1, carta('3'))).toThrow('Responda ao pedido de truco');
  });

  test('recusa pedido duplicado, resposta sem pedido, jogador incorreto e resposta inválida', () => {
    const jogo = jogoCom(
      [carta('3'), carta('2'), carta('A')],
      [carta('7'), carta('6'), carta('K')],
    );
    expect(() => jogo.responderTruco(2, 'aceitar')).toThrow('Não há pedido');
    jogo.pedirTruco(1);
    expect(() => jogo.pedirTruco(1)).toThrow('Já existe um pedido');
    expect(() => jogo.responderTruco(1, 'aceitar')).toThrow('Somente o adversário');
    expect(() => jogo.responderTruco(2, 'talvez')).toThrow(RangeError);
  });

  test('somente quem está na vez pode pedir truco', () => {
    const jogo = jogoCom(
      [carta('3'), carta('2'), carta('A')],
      [carta('7'), carta('6'), carta('K')],
    );
    expect(() => jogo.pedirTruco(2)).toThrow('Não é a vez');
  });
});

describe('Continuidade da partida', () => {
  test('uma nova mão preserva a pontuação e alterna quem começa', () => {
    const jogo = jogoCom(
      [carta('3'), carta('2'), carta('A')],
      [carta('7'), carta('6'), carta('K')],
    );
    jogo.jogar(1, carta('3')); jogo.jogar(2, carta('7'));
    jogo.jogar(1, carta('2')); jogo.jogar(2, carta('6'));
    const proximo = baralhoComecando(
      carta('4'), carta('6'), carta('A'), carta('3'), carta('2'), carta('K'), carta('7'),
    );
    jogo.novaMao({ cartasEmbaralhadas: proximo });
    expect(jogo.estado).toBe('jogando');
    expect(jogo.vez).toBe(2);
    expect(jogo.pontuacao).toEqual([1, 0]);
    expect(jogo.valorMao).toBe(1);
    expect(jogo.rodadas).toEqual([]);
  });

  test('não inicia nova mão durante uma mão ativa ou depois do fim da partida', () => {
    const ativo = new Truco();
    expect(() => ativo.novaMao()).toThrow('A mão atual ainda não terminou');

    const final = jogoCom(
      [carta('3'), carta('2'), carta('A')],
      [carta('7'), carta('6'), carta('K')],
      carta('4', 'copas'),
      [11, 0],
    );
    final.jogar(1, carta('3')); final.jogar(2, carta('7'));
    final.jogar(1, carta('2')); final.jogar(2, carta('6'));
    expect(() => final.novaMao()).toThrow('Partida encerrada');
    expect(() => final.jogar(1, carta('A'))).toThrow('Partida encerrada');
  });
});
