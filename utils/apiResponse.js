class ApiResponse {
  constructor(success, message, data = null, statusCode = 200) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    this.cookies = []
  }


  cookie(name, value, options) {
    this.cookies.push({name, value, options})
    return this
  }

  static success(message, data = null, statusCode = 200) {
    return new ApiResponse(true, message, data, statusCode);
  }

  static error(message, statusCode = 400, data = null) {
    return new ApiResponse(false, message, data, statusCode);
  }

  send(res) {
    // definir les cookies s'il y en a 
    this.cookies.forEach(cookie => {
      res.cookie(cookie.name, cookie.value, cookie.options)
    })
    
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
      timestamp: this.timestamp,
    });
  }
}

module.exports = ApiResponse;
