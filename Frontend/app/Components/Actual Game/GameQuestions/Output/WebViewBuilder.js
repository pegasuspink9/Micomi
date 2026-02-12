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

export const assemblePage = (html, css, js) => {
    let finalHtml = html || '';
    
    // 1. Standardize Error Handling Script
    const errorHandlingScript = `
        window.onerror = function(msg, url, lineNo, columnNo, error) {
            const errorDiv = document.getElementById('micomi-error-display') || document.createElement('div');
            errorDiv.id = 'micomi-error-display';
            errorDiv.style.position = 'fixed'; errorDiv.style.bottom = '0'; errorDiv.style.left = '0'; 
            errorDiv.style.right = '0'; errorDiv.style.backgroundColor = '#ff5f56'; errorDiv.style.color = 'white'; 
            errorDiv.style.padding = '10px'; errorDiv.style.fontFamily = 'monospace'; errorDiv.style.zIndex = '10000';
            errorDiv.style.fontSize = '12px';
            errorDiv.innerText = 'Runtime Error: ' + msg; 
            if(!document.getElementById('micomi-error-display')) document.body.appendChild(errorDiv);
            return false;
        };
    `;

    // 2. Prepare Injections
    const cssInjection = css ? `<style id="micomi-injected-css">${css}</style>` : '';
    const jsInjection = `<script id="micomi-injected-js">${errorHandlingScript}\ntry { ${js || ''} } catch(e) { console.error(e); }</script>`;
    
    // 3. AUTO-FIX: Inject Viewport Meta Tag if missing (Case Insensitive)
    // This is critical for mobile WebView rendering
    if (!/<meta[^>]+name=["']viewport["']/i.test(finalHtml)) {
        const viewportTag = '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">';
        if (/<head>/i.test(finalHtml)) {
            finalHtml = finalHtml.replace(/<head>/i, `<head>${viewportTag}`);
        } else if (/<html>/i.test(finalHtml)) {
            finalHtml = finalHtml.replace(/<html>/i, `<html><head>${viewportTag}</head>`);
        } else if (!/<!DOCTYPE/i.test(finalHtml)) {
            // If fragment, prepend the tag
            finalHtml = viewportTag + finalHtml;
        }
    }

    // 4. Inject CSS (Safe Injection - Case Insensitive)
    if (cssInjection) {
        if (/<\/head>/i.test(finalHtml)) {
            finalHtml = finalHtml.replace(/<\/head>/i, `${cssInjection}</head>`);
        } else if (/<body/i.test(finalHtml)) {
            // Inject before body start if no head found
            finalHtml = finalHtml.replace(/<body/i, `<head>${cssInjection}</head><body`);
        } else {
            finalHtml = `<style>${css}</style>${finalHtml}`;
        }
    }
    
    // 5. Inject JS (Case Insensitive)
    if (/<\/body>/i.test(finalHtml)) {
        finalHtml = finalHtml.replace(/<\/body>/i, `${jsInjection}</body>`);
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

    // Initialize defaults
    let baseHtml = currentQuestion.html_file || '';
    let cssToInject = currentQuestion.css_file || '';
    let jsToInject = currentQuestion.javascript_file || '';

    // Default Skeleton used for fragments
    const defaultSkeleton = `<!DOCTYPE html><html><head><title>Preview</title><meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no"></head><body></body></html>`;

    switch (questionType) {
        case 'css':
             // If baseHtml is empty, use skeleton
             if (!baseHtml) baseHtml = defaultSkeleton;
             // The user input is purely CSS here
             cssToInject += '\n' + filledQuestion;
            break;
            
        case 'javascript':
             if (!baseHtml) baseHtml = defaultSkeleton;
             // The user input is purely JS here
             jsToInject += '\n' + filledQuestion;
            break;
            
        case 'html':
        default:
            // Check if user wrote a Full Document (starts with doctype or html tag)
            const isFullDocument = /^\s*<!DOCTYPE/i.test(filledQuestion) || /^\s*<html/i.test(filledQuestion);

            if (isFullDocument) {
                // USE USER INPUT AS BASE
                baseHtml = filledQuestion;
            } else {
                // HANDLE FRAGMENTS (e.g., just <h1>Hello</h1>)
                if (!baseHtml) baseHtml = defaultSkeleton;

                if (baseHtml.includes('</body>')) {
                     baseHtml = baseHtml.replace('</body>', `${filledQuestion}</body>`);
                } else {
                    baseHtml += filledQuestion;
                }
            }
            break;
    }

    return assemblePage(baseHtml, cssToInject, jsToInject);
};