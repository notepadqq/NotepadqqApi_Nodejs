export enum ErrorCode {
	NONE = 0,
	INVALID_REQUEST = 1,
	INVALID_ARGUMENT_NUMBER = 2,
	INVALID_ARGUMENT_TYPE = 3,
	OBJECT_DEALLOCATED = 4,
	OBJECT_NOT_FOUND = 5,
	METHOD_NOT_FOUND = 6
}

export class MessageError {
	
	private _errorCode : ErrorCode
	private _errorString : string
	
	constructor(errorCode : ErrorCode, errorString : string) {
		this._errorCode = errorCode
		this._errorString = errorString
	}
	
	public get errorCode() {
		return this._errorCode
	}
	
	public get errorString() {
		return this._errorString
	}
	
	public description() {
		let descr = ""
		
		if (this._errorCode == ErrorCode.NONE) descr = "None"
		else if (this._errorCode == ErrorCode.INVALID_REQUEST) descr = "Invalid request"
		else if (this._errorCode == ErrorCode.INVALID_ARGUMENT_NUMBER) descr = "Invalid argument number"
        else if (this._errorCode == ErrorCode.INVALID_ARGUMENT_TYPE) descr = "Invalid argument type"
        else if (this._errorCode == ErrorCode.OBJECT_DEALLOCATED) descr = "Object deallocated"
        else if (this._errorCode == ErrorCode.OBJECT_NOT_FOUND) descr = "Object not found"
        else if (this._errorCode == ErrorCode.METHOD_NOT_FOUND) descr = "Method not found"
		else descr = "Unknown error"
		
		if (this._errorString !== undefined && this._errorString !== null && this.errorString !== "")
			descr += ": " + this._errorString
			
		return descr
	}
	
}