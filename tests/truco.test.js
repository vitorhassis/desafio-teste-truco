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
