class apiErrors extends Error {
    constructor(
        message="Something went wrong",
        statusCode,
        errors=[],
        statck=""
    ){
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.sucess = false;
        this.data = null;
        this.message = message;

        if(statck){
            this.stack = statck;
        }
        else{
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export {apiErrors};