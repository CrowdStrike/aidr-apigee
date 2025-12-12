var vertexContents = context.getVariable('vertex_contents');
var vertexSystemInstruction = context.getVariable('vertex_system_instruction');
var vertexCandidates = context.getVariable('vertex_candidates');

var messages = [];
var guardType = 'input';

// Determine if we're guarding input (request) or output (response, candidates).
if (
  vertexCandidates &&
  vertexCandidates !== '' &&
  vertexCandidates !== '[]' &&
  vertexCandidates !== 'null'
) {
  guardType = 'output';
}

// Extract system instruction if present.
var systemContent = '';
if (
  vertexSystemInstruction &&
  vertexSystemInstruction !== '' &&
  vertexSystemInstruction !== 'null'
) {
  try {
    var systemInst = JSON.parse(vertexSystemInstruction);
    if (systemInst.parts && Array.isArray(systemInst.parts)) {
      systemContent = systemInst.parts.map((part) => part.text || '').join(' ');
    }
  } catch (_) {
    // Fallback to treating it as a string.
    systemContent = vertexSystemInstruction;
  }
}

// Add system message if we have it.
if (systemContent && systemContent.trim() !== '') {
  messages.push({
    role: 'system',
    content: systemContent.trim(),
  });
}

// Get user messages.
if (
  guardType === 'input' &&
  vertexContents &&
  vertexContents !== '' &&
  vertexContents !== '[]'
) {
  try {
    var contents = JSON.parse(vertexContents);
    if (Array.isArray(contents)) {
      contents.forEach((content) => {
        if (content.parts && Array.isArray(content.parts)) {
          var userContent = content.parts
            .map((part) => part.text || '')
            .join(' ');

          if (userContent && userContent.trim() !== '') {
            messages.push({
              role: 'user',
              content: userContent.trim(),
            });
          }
        }
      });
    }
  } catch (e) {
    context.setVariable(
      'transform_error',
      'Failed to parse vertex_contents: ' + e.message
    );
  }
}

// Get assistant messages.
if (
  guardType === 'output' &&
  vertexCandidates &&
  vertexCandidates !== '' &&
  vertexCandidates !== '[]'
) {
  try {
    var candidates = JSON.parse(vertexCandidates);
    if (Array.isArray(candidates)) {
      candidates.forEach((candidate) => {
        if (
          candidate.content &&
          candidate.content.parts &&
          Array.isArray(candidate.content.parts)
        ) {
          var assistantContent = candidate.content.parts
            .map((part) => part.text || '')
            .join(' ');

          if (assistantContent && assistantContent.trim() !== '') {
            messages.push({
              role: 'assistant',
              content: assistantContent.trim(),
            });
          }
        }
      });
    }
  } catch (e) {
    context.setVariable(
      'transform_error',
      'Failed to parse vertex_candidates: ' + e.message
    );
  }
}

context.setVariable('aiguard_messages', JSON.stringify(messages));
context.setVariable('aiguard_guard_type', guardType);
