// WebViewBuilder.js

/**
 * Replaces all blanks (_) in a template string with provided answers.
 * (Unchanged)
 */
const fillBlanks = (template = '', answers = []) => {
  let filledContent = template;
  answers.forEach((answer) => {
    if (typeof answer === 'string') {
      filledContent = filledContent.replace('_', answer);
    }
  });
  return filledContent.replace(/_/g, ''); 
};


/**
 * This is the critical part that makes mobile behave like desktop.
 * These tags force light mode and set a standard baseline.
 */
const MOBILE_WEBVIEW_FIXES = `
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <!-- CRITICAL: Tell iOS/Android not to auto-invert colors -->
    <meta name="color-scheme" content="light only">
    <style>
        /* CRITICAL: CSS forcing light mode and baseline colors */
        :root {
            color-scheme: light only;
        }
        html, body {
            /* Force white background and black text like a desktop browser */
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0;
            padding: 0; 
            box-sizing: border-box;
            /* Optional: ensure full height */
            min-height: 100%;
            width: 100%;
        }
        /* Ensure box-sizing applies to everything for predictable sizing */
        *, *:before, *:after {
            box-sizing: inherit;
        }
    </style>
`;


/**
 * assemblePage
 * 
 * Strategy:
 * 1. If the user provides a fragment, wrap it in a standard skeleton containing the fixes.
 * 2. If the user provides a full document, INJECT the fixes into their <head> so we don't break their structure, but still ensure correct rendering.
 */
export const assemblePage = (htmlContent) => {
    let finalHtml = htmlContent || '';

    // 1. Ensure DOCTYPE exists (prevents Quirks Mode)
    if (!/<!DOCTYPE html>/i.test(finalHtml)) {
        finalHtml = `<!DOCTYPE html>\n${finalHtml}`;
    }

    // 2. Check if it's a full document structure (has <html> or <body>)
    const hasHtmlStructure = /<html/i.test(finalHtml) || /<body/i.test(finalHtml);

    if (hasHtmlStructure) {
        // --- FULL DOCUMENT STRATEGY ---
        // The user provided their own structure. We must inject our fixes 
        // into their existing <head> without destroying it.
        
        if (/<head/i.test(finalHtml)) {
            // Inject fixes right after the opening <head> tag
            finalHtml = finalHtml.replace(/<head[^>]*>/i, `$&${MOBILE_WEBVIEW_FIXES}`);
        } else if (/<html/i.test(finalHtml)) {
            // No head, but has html tag. Inject head with fixes.
            finalHtml = finalHtml.replace(/<html[^>]*>/i, `$&\n<head>${MOBILE_WEBVIEW_FIXES}</head>`);
        } else {
            // Has body but no html/head wrap. Prepend right before body.
             finalHtml = finalHtml.replace(/<body/i, `<head>${MOBILE_WEBVIEW_FIXES}</head>\n<body`);
        }
    } else {
        // --- FRAGMENT STRATEGY ---
        // The user just provided some tags (e.g., just <h1>...</h1>).
        // Wrap it in a perfect skeleton with fixes.
        finalHtml = `
<!DOCTYPE html>
<html>
<head>
${MOBILE_WEBVIEW_FIXES}
</head>
<body>
    ${finalHtml}
</body>
</html>
`;
    }

    return finalHtml.trim();
}


/**
 * Generates a complete HTML document.
 * Simplified to rely on assemblePage's robust injection logic.
 */
export const generateCombinedHtml = (currentQuestion, answers = []) => {
    if (!currentQuestion || !currentQuestion.question) {
        return assemblePage('<p>No question content available.</p>');
    }

    const questionType = currentQuestion?.question_type?.toLowerCase();
    // Fill blanks in the user's answer
    const filledAnswer = fillBlanks(currentQuestion.question, answers);

    // Start with base files defined in the challenge
    let baseHtml = currentQuestion.html_file || '';
    let baseCss = currentQuestion.css_file || '';
    let baseJs = currentQuestion.javascript_file || '';

    // Combine inputs based on type
    switch (questionType) {
        case 'css':
             baseCss += '\n' + filledAnswer;
            break;
        case 'javascript':
             baseJs += '\n' + filledAnswer;
            break;
        case 'html':
        default:
            baseHtml += '\n' + filledAnswer;
            break;
    }

    // If there is separate CSS or JS, inject them into the HTML string
    // before passing to assemblePage.
    if (baseCss) {
        // Add CSS styles to the HTML
        const styleTag = `<style>${baseCss}</style>`;
        if (baseHtml.includes('</head>')) {
             baseHtml = baseHtml.replace('</head>', `${styleTag}</head>`);
        } else {
             baseHtml = styleTag + baseHtml;
        }
    }

    if (baseJs) {
        // Add JS script to the HTML
        const scriptTag = `<script>try{${baseJs}}catch(e){console.error(e)}</script>`;
        if (baseHtml.includes('</body>')) {
             baseHtml = baseHtml.replace('</body>', `${scriptTag}</body>`);
        } else {
             baseHtml += scriptTag;
        }
    }

    return assemblePage(baseHtml);
};