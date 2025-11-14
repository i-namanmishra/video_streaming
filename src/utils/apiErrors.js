class apiErrors extends Error {
    constructor(
        message="Something went wrong",
        statusCode,
        errors=[],
        stack=""
    ){
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.sucess = false;
        this.data = null;
        this.message = message;

        if(stack){
            this.stack = stack;
        }
        else{
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export {apiErrors};