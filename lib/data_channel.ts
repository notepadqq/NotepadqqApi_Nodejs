/// <reference path="types/node.d.ts" />

let net = require('net');
class DataChannel {
	
	private _buffer = new Buffer(0)
	private _client
	
	constructor(socketPath : string, messageCallback : (message: any) => void) {
		this._client = net.Socket()
		this._client.connect(socketPath)
		
		this._client.on('data', function (data : Buffer | string) {
			let totalData = null;
			if (data instanceof Buffer) {
				totalData = Buffer.concat([this._buffer, data])
			} else {
				totalData = Buffer.concat([this._buffer, new Buffer(data.toString())])
			}
			
			let messages : Buffer[] = this._splitBuffer(totalData, new Buffer("\n"), false);
			// messages can be an array like the following ones:
			//     [msg1, msg2, ..., msgn, ""] => we received n complete messages.
			//     [msg1, msg2, ..., msgn] => we received n-1 complete messages, and an incomplete one.
			
			for (let i = 0; i < messages.length - 1; i++) {
				messageCallback(JSON.parse(messages[i].toString()))
			}
			
			this._buffer = messages[messages.length - 1];
		}.bind(this))
	}
	
	sendMessage(msg : any) : void {
		this._client.write(JSON.stringify(msg) + "\n");
	}
	
	private _splitBuffer(buf, splitBuf, includeDelim) : Buffer[] {
		let search = -1
		let lines = []
		let move = includeDelim ? splitBuf.length : 0
		
		while ((search = this._bufferIndexOf(buf, splitBuf)) > -1) {
			lines.push(buf.slice(0, search + move));
			buf = buf.slice(search + splitBuf.length, buf.length);
		}
		
		lines.push(buf);
		
		return lines;
	}
		
	private _bufferIndexOf(buf, search, offset = 0) {
		let m = 0;
		let s = -1;
		for (let i = offset; i < buf.length; ++i) {
			if (buf[i] == search[m]) {
				if (s == -1)
					s = i;
				++m;
				if (m == search.length)
					break;
			} else {
				s = -1;
				m = 0;
			}
		}
		
		if (s > -1 && buf.length - s < search.length)
			return -1;
			
		return s;
	}

}

export = DataChannel