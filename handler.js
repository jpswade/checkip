/**
 * Lambda Handler
 * @see http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-handler.html
 * @see https://serverless.com/framework/docs/providers/aws/events/apigateway/
 */

module.exports.check = function(event, context, callback) {

    console.log(event); // Contains incoming request data (e.g., query params, headers and more)

    var json = { "message": "Hello World!" };

    const response = {
      statusCode: 200,
      body: JSON.stringify(json)
    };

    callback(null, response);
};
