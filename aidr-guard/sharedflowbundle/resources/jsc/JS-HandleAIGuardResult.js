var blocked = context.getVariable('aiguard_blocked');
var transformed = context.getVariable('aiguard_transformed');
var aiguardOutput = context.getVariable('aiguard_output');
var aiguardStatus = context.getVariable('aiguard_status');
var guardType = context.getVariable('aiguard_guard_type');

if (aiguardStatus !== 'Success') {
  context.setVariable(
    'aiguard_error',
    'AI Guard API returned status: ' + aiguardStatus
  );
  throw new Error('AI Guard API returned status: ' + aiguardStatus);
}

// If blocked, raise an error.
if (blocked === 'true' || blocked === true) {
  context.setVariable('aiguard_blocked', 'true');
  throw new Error('Content blocked by AI Guard');
}

// If transformed, update the original request/response.
if (transformed === 'true' || transformed === true) {
  try {
    var output = JSON.parse(aiguardOutput);

    if (
      guardType === 'input' &&
      output.messages &&
      Array.isArray(output.messages)
    ) {
      // Transform back to Vertex AI format.
      var vertexContents = [];
      var systemInstruction = null;

      output.messages.forEach((msg) => {
        if (msg.role === 'system' && msg.content) {
          systemInstruction = {
            parts: [
              {
                text: msg.content,
              },
            ],
          };
        } else if (msg.role === 'user' && msg.content) {
          vertexContents.push({
            role: 'user',
            parts: [
              {
                text: msg.content,
              },
            ],
          });
        }
      });

      // Update the payload.
      var requestContent = context.getVariable('request.content');
      if (requestContent) {
        var originalRequest = JSON.parse(requestContent);

        if (systemInstruction) {
          originalRequest.systemInstruction = systemInstruction;
        }

        if (vertexContents.length > 0) {
          originalRequest.contents = vertexContents;
        }

        context.setVariable('request.content', JSON.stringify(originalRequest));
        context.setVariable('aiguard_transformed_applied', 'true');
      }
    } else if (
      guardType === 'output' &&
      output.messages &&
      Array.isArray(output.messages)
    ) {
      // Transform back to Vertex AI format.
      var candidates = [];

      output.messages.forEach((msg) => {
        if (msg.role === 'assistant' && msg.content) {
          candidates.push({
            content: {
              role: 'model',
              parts: [
                {
                  text: msg.content,
                },
              ],
            },
            finishReason: 'STOP',
          });
        }
      });

      if (candidates.length > 0) {
        // Update the original response.
        var responseContent = context.getVariable('response.content');
        if (responseContent) {
          var originalResponse = JSON.parse(responseContent);
          originalResponse.candidates = candidates;
          context.setVariable(
            'response.content',
            JSON.stringify(originalResponse)
          );
          context.setVariable('aiguard_transformed_applied', 'true');
        }
      }
    } else {
      context.setVariable(
        'aiguard_transform_warning',
        'Transformation detected but output format not recognized'
      );
    }
  } catch (e) {
    context.setVariable(
      'aiguard_transform_error',
      'Failed to apply transformation: ' + e.message
    );
    // Continue without transformation.
  }
}
