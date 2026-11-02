export const sendSuccess = (res, statusCode = 200, data = null, message = null, pagination = null) => {
  const responseBody = {
    success: true,
  };

  if (data !== null && data !== undefined) {
    responseBody.data = data;
  } else {
    responseBody.data = {};
  }

  if (message) {
    responseBody.message = message;
  }

  if (pagination) {
    responseBody.pagination = pagination;
  }

  return res.status(statusCode).json(responseBody);
};

export const sendError = (res, statusCode = 500, message = 'Internal Server Error', errors = []) => {
  const responseBody = {
    success: false,
    message,
  };

  if (errors && errors.length > 0) {
    responseBody.errors = errors;
  }

  return res.status(statusCode).json(responseBody);
};
