'use strict';

class Game {
  title
  adminCode
  playerCode
  players
  constructor(title) {
    this.title
  }
  addPlayer(player) {
    if (this.players.indexOf(player) == -1)
      this.players.push(player)
  }
  deletePlayer(player){
    let index = this.players.indexOf(player)
    if(index != -1)
      this.players.splice(index, 1)
  }
  hasPlayer(player){
    return this.players.indexOf(player) != -1
  }
  getPlayersCopy(){
    return Object.assign(this.players)
  }
  static findByCode(games, code) {
    for (let i in games) {
      if (games[i].adminCode == code || games[i].playerCode == code)
        return i
    } 
    return -1
  }
  static getCodeStatus(games, code) {
    let index = Game.findByCode(games, code)
    if(index != -1){
      if (games[index].adminCode == code)
        return 'admin'
      if (games[index].playerCode == code)
        return 'player'
    }
    return false
  }
}

module.exports = Game;