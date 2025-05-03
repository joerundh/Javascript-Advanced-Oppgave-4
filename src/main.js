import './style.css';
import './app.css';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';

const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);

const tex = new TeX();
const svg = new SVG();

const html = mathjax.document('', {
  InputJax: tex,
  OutputJax: svg
});

/*
Rendering function
*/

async function renderSvg(latex) {
  /*
  Takes a LaTeX string as an argument, uses MathJax to oconvert it to SVG,
  and returns the resulting SVG element
  */
  const output = await html.convert(latex, { display: true });
  const result = adaptor.outerHTML(output);
  return result;
}

/*
Save function
*/

async function saveResult(type="svg") {
  /*
  The SVG that is in the result area is fetched, color is added if that is 
  wanted, and then the image is saved either as an SVG or a PNG, depending
  on the argument passed
  */
  const result = latexResult.querySelector("svg");
  if (result) {
    /*
    If no error occurred, resultArea contains an SVG element (inside a wrapper). 
    Then the saving may go ahead. If no SVG is present, nothing happens,
    seeing as there should be nothing to save.
    */

    /*
    Make a clone of the <svg> element
    */
    const svgResult = result.cloneNode(true);

    /*
    Set the size of the SVG according to the set scaling, by fetching the width and height
    attributes, separating the numerical values and the units, multiplying the 
    numerical values by the scaling (after converting them to numbers), and conjoining
    the two again. Tedious as hell, went through lots of NaN for this to work.
    */
    const svgWidth = svgResult.getAttribute("width");
    const svgHeight = svgResult.getAttribute("height");
    
    svgResult.setAttribute(
      "width",
      [
        `${Number(svgWidth.slice(0, svgWidth.length - 2))*(scaleInput.value/100)}`,
        svgWidth.slice(svgWidth.length - 2)
      ].join("")
    );
    svgResult.setAttribute(
      "height",
      [
        `${Number(svgHeight.slice(0, svgHeight.length - 2))*(scaleInput.value/100)}`,
        svgWidth.slice(svgHeight.length - 2)
      ].join("")
    );

    /*
    Hardcode the text colors in the clone
    */
    for (let node of svgResult.querySelectorAll("g")) {
      if (node.getAttribute("fill")) {
        node.setAttribute("fill", textColorInput.value);
      }
      if (node.getAttribute("stroke")) {
        node.setAttribute("stroke", textColorInput.value);
      }
    }
    /*
    If a background color is set, add a style sheet that sets the 
    background color of the SVG
    */
    if (!transparentBgInput.checked) {
      const style = document.createElement("style");
      style.innerHTML = `
        svg {
          background-color: ${bgColorInput.value};
        }
      `;
      svgResult.prepend(style);
    }

    /*
    Serialize the SVG as a text string, create a blob (adding a charset specification to the type
    if PNG is wanted), and create an object URL
    */
    const svgString = new XMLSerializer().serializeToString(svgResult);
    const svgBlob = new Blob([ svgString ], { type: `image/svg+xml${type === "png" ? ";charset=utf-8" : ""}` });
    const svgUrl = URL.createObjectURL(svgBlob);

    if (type === "svg") {
      /*
      Save the SVG from the result area, using the URL created above
      */
      const a = document.createElement("a");
      a.href = svgUrl;
      a.download = "output.svg";
      a.click();

      URL.revokeObjectURL(svgUrl);
    } else if (type === "png") {
      /*
      Render into PNG by creating an Image object, and then, when the 
      image gets loaded eventually, create a Cavnas object and draw the
      image onto it, then make a blob and create an URL for it, and 
      download from that as a PNG file. To initiate all of this, finally,
      the source of the Image object is set to the SVG URL made above.
      */
      const img = new Image();
      img.onload = () => {
        /*
        Create a cavnas, get the 2D context, and draw the image
        onto it, again using the scaled dimensions
        */
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, img.width, img.height);

        canvas.toBlob((blob) => {
          const pngUrl = URL.createObjectURL(blob);

          const a = document.createElement("a");
          a.href = pngUrl;
          a.download = "output.png";
          a.click();

          URL.revokeObjectURL(pngUrl);
          URL.revokeObjectURL(svgUrl);
        }, "image/png");
      };
      img.src = svgUrl;
    }
    /*
    If another type is passed as an argument, do nothing.
    */
  }
}

function createErrorMessage(message) {
  const err = document.createElement("p");
  err.className = "error-message";
  err.textContent = message;
  err.style.backgroundColor = "inherit";
  err.style.color = "inherit";
  return err;
}

document.querySelector('#app').innerHTML = `
  <div>
    <div id="insertions">
      <button class="insertion" data-bg-latex="x^y" data-latex-insert="\{\}^\{\}" data-insert-shift="1" title="Insert power"></button>
      <button class="insertion" data-bg-latex="\\frac{x}{y}" data-latex-insert="\\frac{}{}" data-insert-shift="6" title="Insert fraction"></button>
      <button class="insertion" data-bg-latex="\\frac{\\partial f}{\\partial x}" data-latex-insert="\\frac{\\partial{}}{\\partial{}}" data-insert-shift="15" title="Insert partial derivative"></button>
      <button class="insertion" data-bg-latex="\\int" data-latex-insert="\\int " data-insert-shift="5" title="Insert indefinite integral"></button>
      <button class="insertion" data-bg-latex="\\int_{a}^{b}" data-latex-insert="\\int\\limits_{}^{}" data-insert-shift="13" title="Insert definite integral"></button>
      <button class="insertion" data-bg-latex="\\sum\\limits_{i = 1}^{n}" data-latex-insert="\\sum\\limits_{}^{}" data-insert-shift="13" title="Insert sum"></button>
      <button class="insertion" data-bg-latex="\\prod\\limits_{i = 1}^{n}" data-latex-insert="\\prod\\limits_{}^{}" data-insert-shift="14" title="Insert product"></button>
      <button class="insertion" data-bg-latex="\\lim\\limits_{x \\rightarrow 0}" data-latex-insert="\\lim\\limits_{}" data-insert-shift="13" title="Insert limit"></button>
    </div>
    <textarea id="latex-input" placeholder="Enter LaTeX math expression..."></textarea>
    <button id="copy-latex" title="Copy to clipboard"></button>
    <div id="settings">
      <label for="scale-input">Scaling:</label>
      <select id="scale-input" title="Scaling percentage">
        <option value="50">50%</option>
        <option value="75">75%</option>
        <option value="100" selected>100%</option>
        <option value="125">125%</option>
        <option value="150">150%</option>
        <option value="200">200%</option>
        <option value="250">250%</option>
        <option value="300">300%</option>
        <option value="500">500%</option>
      </select>
      <label for="text-color-input">Text color:</label>
      <input type="color" id="text-color-input" value="#000000" title="Set text color" />
      <button id="swap-colors" id="Swap text and backgroud color">&#x21c4;</button>
      <label>Background:</label>
      <input type="color" id="bg-color-input" value="#ffffff" disabled title="Set background color" />
      <label for="transparent-bg-input">Transparent:</label>
      <input type="checkbox" id="transparent-bg-input" checked title="Toggle transparent background" />
    </div>
    <div id="buttons">
      <button id="latex-render">Render</button>
      <button id="latex-reset">Reset</button>
    </div>
    <div id="latex-result"></div>
    <div id="save-buttons">
      <button id="save-as-svg">Save as SVG</button>
      <button id="save-as-png">Save as PNG</button>
    </div>
  </div>
`
/*
DOM elements
*/

const latexInput = document.querySelector("#latex-input");
const copyLatex = document.querySelector("#copy-latex");

const insertPow = document.querySelector("#insert-pow");
const insertFrac = document.querySelector("#insert-frac");
const insertInt = document.querySelector("#insert-int");

const scaleInput = document.querySelector("#scale-input");
const textColorInput = document.querySelector("#text-color-input");
const bgColorInput = document.querySelector("#bg-color-input");
const swapColors = document.querySelector("#swap-colors");
const transparentBgInput = document.querySelector("#transparent-bg-input");

const renderButton = document.querySelector("#latex-render");
const resetButton = document.querySelector("#latex-reset");

const latexResult = document.querySelector("#latex-result");

const saveAsSvgButton = document.querySelector("#save-as-svg");
const saveAsPngButton = document.querySelector("#save-as-png");

/*
Insertion buttons
*/

document.querySelectorAll(".insertion").forEach(btn => {
  /*
  Insert background image from https://math.vercel.app
  */
  const bg = new Image();
  bg.onload = () => {
    /*
    When the image is loaded, set the background image with the source of the Image object
    */
    btn.style.backgroundImage = `url("${bg.src}")`;
  }
  bg.src = `https://math.vercel.app?inline=${encodeURIComponent(btn.getAttribute("data-bg-latex"))}&color=white`;
  btn.onclick = () => {
    /*
    When clicking the button, fetch the LaTeX string to be inserted from the button's attributes,
    insert it at the selection start (replacing any text that in the selection,) and set the
    selection start to the appropriate place given by the attribute data-shift
    */
    const start = latexInput.selectionStart;
    latexInput.value = [
      latexInput.value.slice(0, latexInput.selectionStart),
      btn.getAttribute("data-latex-insert"),
      latexInput.value.slice(latexInput.selectionEnd)
    ].join("");
    latexInput.selectionStart = start + Number(btn.getAttribute("data-insert-shift"));
    latexInput.selectionEnd = latexInput.selectionStart;
    latexInput.focus();
  }
})

/*
Events
*/

copyLatex.onclick = () => {
  /*
  Copy the value entered into the LaTeX input to clipboard, if there is 
  a value entered, otherwise do nothing
  */
  if (latexInput.value !== "") {
    navigator.clipboard.writeText(latexInput.value);
  }
}

renderButton.onclick = async () => {
  /*
  Run the entered LaTeX value through the converter (asynchronously), 
  in display mode (meaning the LaTeX math in not in-line, and so
  integral signs, summation symbols et.al. will be full-sized), 
  get output 
  */
  latexResult.innerHTML = "";
  if (latexInput.value !== "") {
    const result = await renderSvg(latexInput.value);

    /*
    Parse the results and search for an error message
    */
    const container = new DOMParser().parseFromString(result, "text/xml").querySelector("mjx-container");
    for (let node of container.querySelectorAll("g")) {
      /*
      Loop through the <g> elements of the SVG and search for an element with attribute data-mml-node
      set to "merror"
      */
      if (node.getAttribute("data-mml-node") && node.getAttribute("data-mml-node") === "merror") {
        /*
        If found, a error occured somewhere, for example a syntax error. Thus fetch the error message
        and place it in a <p> tag, and put the <p> tag in the result area. Then exit the function.
        */
        latexResult.append(createErrorMessage(`Error: ${node.querySelector("text").innerHTML}`));
        return;
      }
    }
    /*
    If no error message is found, put the result into the result area
    */
    latexResult.innerHTML = result;
  }
};

resetButton.onclick = () => {
  /*
  Clear the LaTeX input and remove the SVG viewed in the result area
  */
  latexInput.value = "";
  latexResult.innerHTML = "";
};

scaleInput.onchange = () => {
  latexResult.style.setProperty("--result-font-size", `${scaleInput.value/100}rem`);
}

textColorInput.onchange = () => {
  /*
  Set the text color of the result area
  */
  latexResult.style.color = `${textColorInput.value}`;
};

bgColorInput.onchange = () => {
  /*
  Set the background color of the result area
  */
  latexResult.style.backgroundImage = "none";
  latexResult.style.backgroundColor = `${bgColorInput.value}`;
};

swapColors.onclick = () => {
  /*
  Swap the values of the text color input and the background color input,
  if transparent checkbox is not checked
  */
  [ textColorInput.value, bgColorInput.value ] = [ bgColorInput.value, textColorInput.value ];
  latexResult.style.color = `${textColorInput.value}`;
  latexResult.style.backgroundColor = `${bgColorInput.value}`;
};

transparentBgInput.onchange = () => {
  /*
  If the transparent-background checkbox is checked, the result area 
  is given a chessboard background, and the background color input
  is disabled; when saved as an image then, it will be saved with 
  no background color (i.e. transparent);
  if it is unchecked, the background color will be put in, and the
  image will be saved with a corresponding background color
  */
  if (transparentBgInput.checked) {
    bgColorInput.setAttribute("disabled", "disabled");
    latexResult.style.backgroundColor = "none";
    latexResult.style.background = `var(--chessboard)`;
  } else {
    bgColorInput.removeAttribute("disabled");
    latexResult.style.backgroundImage = "none";
    latexResult.style.backgroundColor = `${bgColorInput.value}`;
  }
};

saveAsSvgButton.onclick = () => {
  saveResult("svg");
};
saveAsPngButton.onclick = () => {
  saveResult("png");
};