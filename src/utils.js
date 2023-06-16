export function drawText(ctx, text, x, y, maxWidth, maxHeight) {
  let words = text.split(' '); // split the text into words
  let line = ''; // current line of text
  let lineHeight = ctx.measureText('M').width * 1.6; // height of a line based on font size
  let lines = []; // array of lines

  for (let i = 0; i < words.length; i++) {
    // loop through each word
    const word = words[i].trim() === '' ? '' : words[i].trim() + ' ';
    let testLine = line + word; // add the word to the current line
    let testWidth = ctx.measureText(testLine).width; // measure the width of the line
    if (testWidth > maxWidth) {
      // if it exceeds the maximum width
      lines.push(line); // push the current line to the array
      line = words[i] + ' '; // start a new line with the current word
    } else {
      line = testLine; // otherwise keep adding words to the current line
    }
  }
  lines.push(line); // push the last line to the array

  for (let i = 0; i < lines.length; i++) {
    // loop through each line
    let dy = y + i * lineHeight; // calculate the y position of the line
    if (dy > maxHeight) break; // if it exceeds the maximum height, stop drawing
    ctx.fillText(lines[i], x, dy); // draw the line on the canvas
  }
}
