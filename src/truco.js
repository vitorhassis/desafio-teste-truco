'use strict';

const {
  compararCartas,
  copiarCarta,
  criarBaralho,
  manilhaDa,
  validarBaralho,
} = require('./baralho');

class Truco {
  constructor({ aleatorio = Math.random, cartasEmbaralhadas } = {}) {
    const ordem = cartasEmbaralhadas === undefined
      ? this._embaralhar(criarBaralho(), aleatorio)
      : validarBaralho(cartasEmbaralhadas);

    this._maos = {
      1: ordem.slice(0, 3).map(copiarCarta),
      2: ordem.slice(3, 6).map(copiarCarta),
    };
    this._vira = copiarCarta(ordem[6]);
    this.manilha = manilhaDa(this._vira);
    this._pontuacao = [0, 0];
    this.valorMao = 1;
    this.vez = 1;
    this.estado = 'jogando';
  }

  get vira() {
    return copiarCarta(this._vira);
  }

  get pontuacao() {
    return [...this._pontuacao];
  }

  mao(jogador) {
    this._validarJogador(jogador);
    return this._maos[jogador].map(copiarCarta);
  }

  _validarJogador(jogador) {
    if (jogador !== 1 && jogador !== 2) throw new RangeError('Jogador deve ser 1 ou 2');
  }

  _embaralhar(cartas, aleatorio) {
    const ordem = cartas.map(copiarCarta);
    for (let atual = ordem.length - 1; atual > 0; atual--) {
      const sorteada = Math.floor(aleatorio() * (atual + 1));
      [ordem[atual], ordem[sorteada]] = [ordem[sorteada], ordem[atual]];
    }
    return ordem;
  }
}

module.exports = { Truco, compararCartas, criarBaralho, manilhaDa };
