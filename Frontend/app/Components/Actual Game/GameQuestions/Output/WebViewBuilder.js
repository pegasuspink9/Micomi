/**
 * Replaces all blanks (_) in a template string with provided answers.
 * @param {string} template The string containing blanks.
 * @param {string[]} answers An array of strings to fill the blanks.
 * @returns {string} The template with blanks filled.
 */
const fillBlanks = (template = '', answers = []) => {
  let filledContent = template;
  answers.forEach((answer) => {
    if (typeof answer === 'string') {
      filledContent = filledContent.replace('_', answer);
    }
  });
  return filledContent.replace(/_/g, ''); // Clean up any remaining blanks
};

/**
 * Injects CSS and JS content into a base HTML string.
 * @param {string} html The base HTML document string.
 * @param {string} css The CSS code to inject.
 * @param {string} js The JavaScript code to inject.
 * @returns {string} The final combined HTML string.
 */
const assemblePage = (html, css, js) => {
    let finalHtml = html;
    const errorHandlingScript = `
        const errorDiv = document.createElement('div');
        errorDiv.style.position = 'fixed'; errorDiv.style.bottom = '0'; errorDiv.style.left = '0';
        errorDiv.style.right = '0'; errorDiv.style.backgroundColor = '#ff5f56'; errorDiv.style.color = 'white';
        errorDiv.style.padding = '10px'; errorDiv.style.fontFamily = 'monospace'; errorDiv.style.zIndex = '10000';
        errorDiv.innerText = 'JavaScript Error: ' + e.message; document.body.appendChild(errorDiv);
    `;
    const cssInjection = `<style>${css || ''}</style>`;
    const jsInjection = `<script>try { ${js || ''} } catch(e) { ${errorHandlingScript} }</script>`;

    // Inject CSS into the head
    if (finalHtml.includes('</head>')) {
        finalHtml = finalHtml.replace('</head>', `${cssInjection}</head>`);
    } else {
        finalHtml = `<html><head>${cssInjection}</head><body>${finalHtml.replace(/<body[^>]*>|<\/body>/g, '')}</body></html>`;
    }
    
    // Inject JS before closing body tag
    if (finalHtml.includes('</body>')) {
        finalHtml = finalHtml.replace('</body>', `${jsInjection}</body>`);
    } else {
        finalHtml += jsInjection;
    }

    return finalHtml;
}

/**
 * Generates a complete HTML document based on the question type, filled answers, and associated files.
 * @param {object} currentQuestion The challenge object from the API.
 * @param {string[]} answers The array of answers to fill the blanks.
 * @returns {string} A complete HTML document as a string.
 */
export const generateCombinedHtml = (currentQuestion, answers = []) => {
    if (!currentQuestion || !currentQuestion.question) {
        return '<html><body><p>No question content available.</p></body></html>';
    }

    const questionType = currentQuestion?.question_type?.toLowerCase();
    const filledQuestion = fillBlanks(currentQuestion.question, answers);

    let baseHtml = currentQuestion.html_file || `<!DOCTYPE html><html><head><title>Preview</title><meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no"></head><body></body></html>`;
    let cssToInject = currentQuestion.css_file || '';
    let jsToInject = currentQuestion.javascript_file || '';

    switch (questionType) {
        case 'css':
            cssToInject += '\n' + filledQuestion;
            break;
        case 'javascript':
            jsToInject += '\n' + filledQuestion;
            break;
        case 'html':
        default:
            // Assume the main question content replaces the body of the base HTML file.
            if (baseHtml.includes('</body>')) {
                 baseHtml = baseHtml.replace(/<body[^>]*>[\s\S]*?<\/body>/, `<body>${filledQuestion}</body>`);
            } else {
                baseHtml = filledQuestion;
            }
            break;
    }

    return assemblePage(baseHtml, cssToInject, jsToInject);
};