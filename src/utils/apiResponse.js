class apiResponse{
    constructor(statusCode, message="success", data){
        this.statusCode = statusCode;
        this.sucess = statusCode<400;
        this.message = message;
        this.data = data;
    }
}