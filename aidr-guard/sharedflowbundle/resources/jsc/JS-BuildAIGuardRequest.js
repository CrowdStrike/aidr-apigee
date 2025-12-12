/**
 * Builds the AI Guard API request
 */
var messages = context.getVariable('aiguard_messages');
var guardType = context.getVariable('aiguard_guard_type');
var token = context.getVariable('cs_aidr_token');

if (!messages || messages === '') {
  throw new Error('aiguard_messages is required');
}

if (!token || token === '') {
  throw new Error('cs_aidr_token is required');
}

var messagesArray;
try {
  messagesArray = JSON.parse(messages);
} catch (e) {
  throw new Error('Invalid aiguard_messages JSON: ' + e.message);
}

var requestPayload = {
  guard_input: {
    messages: messagesArray,
  },
  event_type: guardType || 'input',
};

context.setVariable('aiguard_request_payload', JSON.stringify(requestPayload));
context.setVariable('aiguard_auth_header', 'Bearer ' + token);
