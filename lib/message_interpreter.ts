import DataChannel = require("./data_channel")
import MessageError = require("./message_error")
import Stubs = require("./stubs")

class MessageInterpreter {
	
	private _dataChannel : DataChannel
	private _eventHandlers = { }
	private _resultMessagesBuffer = []
	
	constructor(dataChannel : DataChannel) {
		this._dataChannel = dataChannel;
	}
	
	registerEventHandler(objectId, event : string, callback) {
		if (callback !== undefined && callback !== null) {
			let objEvents = this._setObjectDefault(this._eventHandlers, objectId, {})
			let evtHandlers = this._setObjectDefault(objEvents, event, [])
			
			evtHandlers.push(callback)
		}
	}
	
	invokeApi(objectId, method : string, args : any[]) {
		let message = {
			'objectId': objectId,
			'method': method,
			'args': args
		}
		
		this._dataChannel.sendMessage(message)
		
		// *coff* synchronously wait for the result message
		if (this._resultMessagesBuffer.length == 0) {
			require('deasync').loopWhile(function() {
				return this._resultMessagesBuffer.length == 0
			}.bind(this));
		}
		
		let reply = this._resultMessagesBuffer.shift()
		
		let result = [reply["result"]]
		this._convertStubs(result)
		result = result[0]
		
		if (reply["err"] !== MessageError.ErrorCode.NONE) {
			throw new MessageError.MessageError(reply["err"], reply["errStr"])
		}
		
		return result;
	}
	
	processMessage(message : any) {
		if (message["event"] !== undefined) {
			this._processEventMessage(message)
		} else if (message["result"] !== undefined) {
			this._resultMessagesBuffer.push(message)
		}
	}
	
	private _processEventMessage(message : any) {
		let event = message["event"]
		let objectId = message["objectId"]
		
		if (this._eventHandlers.hasOwnProperty(objectId) &&
			this._eventHandlers[objectId].hasOwnProperty(event)) {
				
				let handlers = this._eventHandlers[objectId][event]
				let args = message["args"]
				this._convertStubs(args)
				
				for (let i = handlers.length - 1; i >= 0; i--) {
					handlers[i].apply(handlers[i], args)
				}
		}
	}
	
	private _convertStubs(dataArray : any[]) {
		// FIXME Use a stack
		
		for (let i = 0; i < dataArray.length; i++) {
			if (dataArray[i] !== null && dataArray[i] !== undefined) {
				if (Array.isArray(dataArray[i])) {
					this._convertStubs(dataArray[i]);
					
				} else if (typeof dataArray[i]["$__nqq__stub_type"] === 'string'
						   && typeof dataArray[i]["id"] === 'number') {
					
					let stubType = dataArray[i]["$__nqq__stub_type"];
						   
					if (typeof Stubs[stubType] === 'function') {  
						let id = dataArray[i]["id"];
						dataArray[i] = new Stubs[stubType](this, id);
					} else {
						console.error("Unknown stub: " + stubType);
					}
					
				} else if (typeof dataArray[i] === 'object') {
					for (let property in dataArray[i]) {
						if (dataArray[i].hasOwnProperty(property)) {
							let propValue = [dataArray[i][property]];
							this._convertStubs(propValue);
							dataArray[i][property] = propValue[0];
						}
					}
				}
			}
		}
	}
	
	private _setObjectDefault(object, key, value) {
		if (!object.hasOwnProperty(key)) {
			object[key] = value
		}
		return object[key]
	}
}

export = MessageInterpreter