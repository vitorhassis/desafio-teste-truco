'use strict';

const VALORES = Object.freeze(['4', '5', '6', '7', 'Q', 'J', 'K', 'A', '2', '3']);
const NAIPES = Object.freeze(['ouros', 'espadas', 'copas', 'paus']);

const chaveDaCarta = ({ valor, naipe }) => `${valor}:${naipe}`;
const copiarCarta = ({ valor, naipe }) => ({ valor, naipe });

function cartaValida(carta) {
  return typeof carta === 'object'
    && carta !== null
    && VALORES.includes(carta.valor)
    && NAIPES.includes(carta.naipe);
}

function criarBaralho() {
  return VALORES.flatMap((valor) => NAIPES.map((naipe) => ({ valor, naipe })));
}

function validarBaralho(cartas) {
  const valido = Array.isArray(cartas)
    && cartas.length === 40
    && cartas.every(cartaValida)
    && new Set(cartas.map(chaveDaCarta)).size === 40;
  if (!valido) throw new RangeError('O baralho deve conter 40 cartas válidas e distintas');
  return cartas.map(copiarCarta);
}

function manilhaDa(vira) {
  if (!cartaValida(vira)) throw new RangeError('Vira inválida');
  const indice = VALORES.indexOf(vira.valor);
  return VALORES[(indice + 1) % VALORES.length];
}

function compararCartas(primeira, segunda, vira) {
  if (![primeira, segunda, vira].every(cartaValida)) throw new RangeError('Carta inválida');
  const manilha = manilhaDa(vira);
  const forca = (carta) => (
    carta.valor === manilha
      ? VALORES.length + NAIPES.indexOf(carta.naipe)
      : VALORES.indexOf(carta.valor)
  );
  return forca(primeira) - forca(segunda);
}

module.exports = {
  NAIPES,
  VALORES,
  cartaValida,
  chaveDaCarta,
  compararCartas,
  copiarCarta,
  criarBaralho,
  manilhaDa,
  validarBaralho,
};

