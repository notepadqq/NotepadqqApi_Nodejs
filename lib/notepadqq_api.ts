/// <reference path="types/node.d.ts" />

import DataChannel = require("./data_channel")
import MessageInterpreter = require("./message_interpreter")
import Stubs = require("./stubs")

class NotepadqqApi {
	private _socketPath : string
	private _extensionId : string
	private _dataChannel : DataChannel
	private _messageInterpreter : MessageInterpreter
	private _nqq : Stubs.Notepadqq
	
	private static get NQQ_STUB_ID() { return 1 }
	
	constructor(socketPath : string, extensionId : string, connectedCallback : (api: NotepadqqApi) => void) {
		// Get socketPath from argv if not specified
		if (socketPath === null) {
			if (process.argv[2] !== undefined)
				socketPath = process.argv[2]
			else
				throw "Socket path not provided"
		}
		
		// Get extensionId from argv if not specified
		if (extensionId === null) {
			if (process.argv[3] !== undefined)
				extensionId = process.argv[3]
			else
				throw "Extension id not provided"
		}
		
		this._socketPath = socketPath
		this._extensionId = extensionId
		
		// Connect
		this._dataChannel = new DataChannel(this._socketPath, this._onNewMessage.bind(this), function() {
			// Invoke the callback on the next tick, so we avoid every
			// possibility to block within Socket's "connectionListener" callback.
			process.nextTick(() => connectedCallback(this))
		}.bind(this))
		this._messageInterpreter = new MessageInterpreter(this._dataChannel)
		
		this._nqq = new Stubs.Notepadqq(this._messageInterpreter, NotepadqqApi.NQQ_STUB_ID)
	}
	
	static connect(connectedCallback : () => void) : NotepadqqApi
	static connect(socketPath : string, extensionId : string) : NotepadqqApi
	static connect(socketPath : string, extensionId : string, connectedCallback : (api: NotepadqqApi) => void) : NotepadqqApi
	static connect() : NotepadqqApi {
		let socketPath : string = null
		let extensionId : string = null
		let connectedCallback : (api: NotepadqqApi) => void = null
		
		// Handle overloads
		if (arguments.length == 0) {
			// Everything is null
		} else if (arguments.length == 1) {
			if (typeof arguments[0] === 'function') {
				connectedCallback = arguments[0]
			} else throw `Invalid arguments: a function was expected, got ${typeof arguments[0]}`
		} else if (arguments.length == 2) {
			socketPath = arguments[0]
			extensionId = arguments[1]
		} else if (arguments.length == 3) {
			socketPath = arguments[0]
			extensionId = arguments[1]
			connectedCallback = arguments[2]
		} else {
			throw "Invalid number of arguments"
		}
		
		return new NotepadqqApi(socketPath, extensionId, connectedCallback) 
	}
	
	onWindowInitialization(callback) : void {
		let capturedWindows = []
		
		// Invoke the callback for every currently open window
		let curWindows = (<any>this.notepadqq).windows()
		for (let i = 0; i < curWindows.length; i++) {
			if (!this._stubIsInArray(capturedWindows, curWindows[i])) {
				capturedWindows.push(curWindows[i])
				callback(curWindows[i])
			}
		}
		
		// Each time a new window gets opened, invoke the callback.
		// When Notepadqq is starting and initializing all the extensions,
		// we might not be fast enough to receive this event: this is why
		// we manually invoked the callback for every currently open window.
		this.notepadqq.on("newWindow", function(window) {
			if (!this._stubIsInArray(capturedWindows, window)) {
				callback(window)
			}
		}.bind(this))
	}
	
	get extensionId() : string {
		return this._extensionId
	}
	
	get notepadqq() : Stubs.Notepadqq {
		return this._nqq
	}
	
	private _onNewMessage(message) {
		this._messageInterpreter.processMessage(message)
	}
	
	private _stubIsInArray(array : Stubs.Stub[], stub : Stubs.Stub) {
		for (let i = 0; i < array.length; i++) {
			if (stub.equals(array[i]))
				return true
		}
		return false
	}
}

export = NotepadqqApi