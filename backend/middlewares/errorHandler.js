const errorHandler = (err, req, res, next) => {
    // Use the status code from the response if set, otherwise default to 500
    const statusCode = res.statusCode ? res.statusCode : 500;
    let title;

    // Determine title based on statusCode
    switch (statusCode) {
        case 400:
            title = "Validation Failed";
            break;
        case 401:
            title = "Unauthorized";
            break;
        case 403:
            title = "Forbidden";
            break;
        case 404:
            title = "Not Found";
            break;
        case 500:
            title = "Server Error";
            break;
        default:
            // Handle unexpected status codes
            console.error(`Unexpected Error Status Code: ${statusCode}, Message: ${err.message}`);
            title = "Error"; 
            // Ensure statusCode is set for the response even if not explicitly handled
            // If the status code is somehow OK (e.g., 2xx) but an error still occurred, force 500.
            if (!res.statusCode || res.statusCode < 400) {
                 res.status(500);
            } else {
                 // Keep the original error status code if it's >= 400 but not explicitly handled
                 res.status(statusCode); 
            }    
            break;
    }

    // Send JSON response
    res.json({ 
        title: title,
        // Include the specific error message thrown by the controller or Mongoose
        message: err.message, 
        // Conditionally include stack trace only in development environment
        stackTrace: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });

    // DO NOT call next() after sending a response in an error handler
};

module.exports = errorHandler;