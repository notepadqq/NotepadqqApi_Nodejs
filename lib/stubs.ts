import MessageInterpreter = require("./message_interpreter")

declare var Proxy

module Stubs
{
	export class Stub
	{
		private _objectId
		private _messageInterpreter : MessageInterpreter
		
		constructor(messageInterpreter : MessageInterpreter, objectId) {
			this._objectId = objectId
			this._messageInterpreter = messageInterpreter
			
			return Stub._proxify(this, this._methodMissing)
		}
		
		public on(event : string, callback) {
			this._messageInterpreter.registerEventHandler(this._objectId, event, callback)
		}
		
		public equals(other) {
			return other instanceof Stub &&
					this._objectId == other._objectId &&
					this._messageInterpreter == other._messageInterpreter;
		}
		
		protected _methodMissing(name, args) {
			//console.log("Calling remote " + name)
			return this._messageInterpreter.invokeApi(this._objectId, name, args)
		}
		
		protected static _proxify(object, getHandler : (name: string, args: any[]) => any) {
			return Proxy.create({
				get: function(receiver, name) {
					if (object[name] != null) {
						return object[name]
					} else if (name === "inspect") {
						// Avoid calling remote method "inspect" when
						// user does console.log(stub)
						return () => `[Stub ${object._objectId}]`
					} else {
						return function() {
							let args = []
							for (let i = 0; i < arguments.length; i++) {
    							args.push(arguments[i])
							}
							return getHandler.bind(object)(name, args)
						}
					}
				},
				getOwnPropertyNames: function() {
					return []
				}
			}, Object.getPrototypeOf(object));
	    }
	}
	
	export class Notepadqq extends Stub {
		constructor(messageInterpreter : MessageInterpreter, objectId) {
			super(messageInterpreter, objectId)
			return Stub._proxify(this, this._methodMissing)
		}
	}
	
	export class Editor extends Stub {
		constructor(messageInterpreter : MessageInterpreter, objectId) {
			super(messageInterpreter, objectId)
			return Stub._proxify(this, this._methodMissing)
		}
	}
	
	export class Window extends Stub {
		constructor(messageInterpreter : MessageInterpreter, objectId) {
			super(messageInterpreter, objectId)
			return Stub._proxify(this, this._methodMissing)
		}
	}
	
	export class MenuItem extends Stub {
		constructor(messageInterpreter : MessageInterpreter, objectId) {
			super(messageInterpreter, objectId)
			return Stub._proxify(this, this._methodMissing)
		}
	}
}

export = Stubs