const jwt = require('jsonwebtoken');
const secretKey = "SUPER SECRET KEY DO NOT STEAL";

// check is current token is valid
// @param auth takes req.headers.authorization
function check(auth) {  
  let response = { error: false, message: "" };
  if (!auth || auth.split(" ").length !== 2) {
    response.error = true;
    response.message = "Authorization header is malformed"
  } else {
    const token = auth.split(" ")[1];
    try {
      const payload = jwt.verify(token, secretKey);
      if (Date.now() > payload.exp) {
        response.error = true;
        response.message = "Expired Token"
        return response;
      }
      response.error = false;
      response.message = "Good"
    } catch (e) {
      response.error = true;
      response.message = "Invalid JWT token"
      return response;
    }
  }
  return response;
}

module.exports = {check};