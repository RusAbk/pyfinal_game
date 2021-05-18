'use strict';

class Player {
  id = undefined
  gameIndex = undefined
  role = undefined
  name = undefined
  solved = 0
  spent = 0
  cash = 0
  status = ''
  dealId = undefined
  // constructor(ws) {
  //   this.id = ws.id
  //   this.gameIndex = ws.gameIndex
  //   this.name = ws.name
  //   this.solved = ws.solved
  //   this.spent = ws.spent
  //   this.cash = ws.cash
  //   this.status = ws.status
  // }
}

module.exports = Player;