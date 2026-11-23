'use strict';

const {
  cartaValida,
  chaveDaCarta,
  compararCartas,
  copiarCarta,
  criarBaralho,
  manilhaDa,
  validarBaralho,
} = require('./baralho');

class Truco {
  constructor({ aleatorio = Math.random, cartasEmbaralhadas, pontuacaoInicial = [0, 0] } = {}) {
    const pontuacaoValida = Array.isArray(pontuacaoInicial)
      && pontuacaoInicial.length === 2
      && pontuacaoInicial.every((pontos) => Number.isInteger(pontos) && pontos >= 0 && pontos < 12);
    if (!pontuacaoValida) throw new RangeError('Pontuação inicial inválida');

    this._pontuacao = [...pontuacaoInicial];
    this._maoInicial = 1;
    this.vencedor = null;
    const ordem = this._obterOrdem({ aleatorio, cartasEmbaralhadas });
    this._prepararMao(ordem);
  }

  get vira() {
    return copiarCarta(this._vira);
  }

  get pontuacao() {
    return [...this._pontuacao];
  }

  get mesa() {
    return this._mesa.map(({ jogador, carta }) => ({ jogador, carta: copiarCarta(carta) }));
  }

  get rodadas() {
    return [...this._rodadas];
  }

  get pedidoTruco() {
    return this._pedido === null ? null : { ...this._pedido };
  }

  mao(jogador) {
    this._validarJogador(jogador);
    return this._maos[jogador].map(copiarCarta);
  }

  jogar(jogador, cartaJogada) {
    this._validarAcao(jogador);
    if (this._pedido !== null) throw new Error('Responda ao pedido de truco');
    if (this.vez !== jogador) throw new Error('Não é a vez');
    if (!cartaValida(cartaJogada)) throw new RangeError('Carta inválida');

    const indice = this._maos[jogador]
      .findIndex((carta) => chaveDaCarta(carta) === chaveDaCarta(cartaJogada));
    if (indice < 0) throw new Error('Carta não está na mão');

    const carta = this._maos[jogador].splice(indice, 1)[0];
    this._mesa.push({ jogador, carta });
    if (this._mesa.length === 1) {
      this.vez = this._adversario(jogador);
      return null;
    }

    const [primeira, segunda] = this._mesa;
    const comparacao = compararCartas(primeira.carta, segunda.carta, this._vira);
    const vencedorRodada = comparacao > 0
      ? primeira.jogador
      : comparacao < 0 ? segunda.jogador : null;
    this._rodadas.push(vencedorRodada);
    this._mesa = [];

    const vencedorMao = this._avaliarMao();
    if (vencedorMao !== null) {
      this._encerrarMao(vencedorMao);
      return { vencedorRodada, vencedorMao };
    }

    this._liderRodada = vencedorRodada === null ? this._liderRodada : vencedorRodada;
    this.vez = this._liderRodada;
    return { vencedorRodada, vencedorMao: null };
  }

  pedirTruco(jogador) {
    this._validarAcao(jogador);
    if (this.vez !== jogador) throw new Error('Não é a vez');
    if (this._pedido !== null) throw new Error('Já existe um pedido');
    if (this.valorMao === 12) throw new Error('A mão já vale 12');

    const proximo = { 1: 3, 3: 6, 6: 9, 9: 12 }[this.valorMao];
    this._pedido = { solicitante: jogador, valorProposto: proximo };
    return { ...this._pedido };
  }

  responderTruco(jogador, resposta) {
    this._validarAcao(jogador);
    if (this._pedido === null) throw new Error('Não há pedido de truco');
    if (jogador === this._pedido.solicitante) throw new Error('Somente o adversário pode responder');
    if (resposta !== 'aceitar' && resposta !== 'correr') throw new RangeError('Resposta inválida');

    const pedido = this._pedido;
    this._pedido = null;
    if (resposta === 'aceitar') {
      this.valorMao = pedido.valorProposto;
      return;
    }
    this._encerrarMao(pedido.solicitante);
  }

  novaMao({ aleatorio = Math.random, cartasEmbaralhadas } = {}) {
    if (this.estado === 'fim') throw new Error('Partida encerrada');
    if (this.estado !== 'fim-mao') throw new Error('A mão atual ainda não terminou');
    this._maoInicial = this._adversario(this._maoInicial);
    const ordem = this._obterOrdem({ aleatorio, cartasEmbaralhadas });
    this._prepararMao(ordem);
  }

  _validarJogador(jogador) {
    if (jogador !== 1 && jogador !== 2) throw new RangeError('Jogador deve ser 1 ou 2');
  }

  _validarAcao(jogador) {
    this._validarJogador(jogador);
    if (this.estado !== 'jogando') throw new Error('Partida encerrada');
  }

  _adversario(jogador) {
    return jogador === 1 ? 2 : 1;
  }

  _obterOrdem({ aleatorio, cartasEmbaralhadas }) {
    return cartasEmbaralhadas === undefined
      ? this._embaralhar(criarBaralho(), aleatorio)
      : validarBaralho(cartasEmbaralhadas);
  }

  _prepararMao(ordem) {
    this._maos = {
      1: ordem.slice(0, 3).map(copiarCarta),
      2: ordem.slice(3, 6).map(copiarCarta),
    };
    this._vira = copiarCarta(ordem[6]);
    this.manilha = manilhaDa(this._vira);
    this.valorMao = 1;
    this._mesa = [];
    this._rodadas = [];
    this._pedido = null;
    this._liderRodada = this._maoInicial;
    this.vez = this._maoInicial;
    this.vencedorMao = null;
    this.estado = 'jogando';
  }

  _avaliarMao() {
    const vitorias1 = this._rodadas.filter((vencedor) => vencedor === 1).length;
    const vitorias2 = this._rodadas.filter((vencedor) => vencedor === 2).length;
    if (vitorias1 === 2) return 1;
    if (vitorias2 === 2) return 2;

    const [primeira, segunda, terceira] = this._rodadas;
    if (this._rodadas.length >= 2 && primeira === null && segunda !== null) return segunda;
    if (this._rodadas.length >= 2 && primeira !== null && segunda === null) return primeira;
    if (this._rodadas.length < 3) return null;
    if (terceira !== null) return terceira;
    return primeira === null ? this._maoInicial : primeira;
  }

  _encerrarMao(vencedor) {
    this.vencedorMao = vencedor;
    this._pontuacao[vencedor - 1] += this.valorMao;
    this._pedido = null;
    this.vez = null;
    if (this._pontuacao[vencedor - 1] >= 12) {
      this.estado = 'fim';
      this.vencedor = vencedor;
    } else {
      this.estado = 'fim-mao';
    }
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
