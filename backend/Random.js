'use strict';

class Randomizer {
  static alphabet = '1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&+-?@'

  static getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //Максимум не включается, минимум включается
  }
  static getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
  }
  static getRandomString(len = -1) {
    let result = ''
    if(len == -1) 
      len = this.getRandomInt(2, 100)
    for(let i = 0; i < len; i++)
      result += this.alphabet[this.getRandomInt(0, this.alphabet.length)]
    return result
  }
  static getUniqueRandomString(values, len = -1) {
    let result = ''
    if(len == -1) 
      if(values.length > 0)
        len = values[0].length
      else
        len = this.getRandomInt(2, 100)
    do{
      for(let i = 0; i < len; i++)
        result += this.alphabet[this.getRandomInt(0, this.alphabet.length)]
    } while (values.indexOf(result) != -1)
    return result
  }
}

module.exports = Randomizer;