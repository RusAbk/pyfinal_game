'use strict';

class Command{
    type
    data
    params
    constructor(type = '', data = undefined, params = undefined){
        if(data != undefined){
            this.type = type
            this.data = data
            this.params = params
        } else {
            let obj = JSON.parse(type)
            this.type = obj.type
            this.data = obj.data
            this.params = obj.params
        }
    }
    toString(){
        return JSON.stringify(this)
    }
}

module.exports = Command;