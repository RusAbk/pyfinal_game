'use strict';

class Deal {
  id
  gameIndex
  first
  second
  firstAct
  secondAct
  constructor(id, gameIndex) {
    this.id = id
    this.gameIndex = gameIndex
  }
}

module.exports = Deal;