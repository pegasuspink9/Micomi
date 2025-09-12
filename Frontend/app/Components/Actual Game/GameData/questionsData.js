const questionsData = [{
  questionType: 'multiple-choice',
  question: 'This is a tag in HTML use to create a link?_',
  options: "p, /, anchor, link tag, fs",
  answer: 'anchor',
},{
  questionType: 'code-blanks',
  question: `<!DOCTYPE _>
    <html>
      <head>
        <title>My First Webpage</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: blue; }
          p { color: green; }
        </style>
      </head>
      <_>
        <h1>Hello, World!</h1>
        <p>This is my first webpage!</p>
      </body>
    </html>`,
  options: "html, head, body, title, DOCTYPE",
  answer: ['html', 'body'],
},{
  questionType: 'code-blanks',
  question: `<html>
  <body>
    <h1>Hello, _!</h1>
    <p>This is my first webpage!</p>
  </body>
  </html>`,
  options: "World, head, body, title, DOCTYPE",
  answer: ['World'],
}];

export default questionsData;