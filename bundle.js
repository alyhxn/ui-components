(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
module.exports.action_bar = require("Action-Bar");
// module.exports.graph_explorer = require("Graph-Explorer");
// module.exports.tabbed_editor = require("Tabbed-Editor");
// module.exports.chat_history = require("Chat-History");

},{"Action-Bar":4}],2:[function(require,module,exports){
const { TerminalIcon, MagicWandIcon, HelpIcon } = require('./icons');
const SearchBar = require('./search-bar');

function ActionBar() {
  const actionBarContainerClass = 'actionBarContainer';
  const iconButtonClass = 'iconButton';

  const actionBar = document.createElement('div');
  actionBar.className = actionBarContainerClass;

  const terminalButton = document.createElement('button');
  terminalButton.className = iconButtonClass;
  terminalButton.setAttribute('aria-label', 'Open Terminal');
  terminalButton.appendChild(TerminalIcon());
  terminalButton.addEventListener('click', () => {console.log('Terminal button clicked')});
  const magicWandButton = document.createElement('button');
  magicWandButton.className = iconButtonClass;
  magicWandButton.setAttribute('aria-label', 'Magic Wand');
  magicWandButton.appendChild(MagicWandIcon());

  const helpButton = document.createElement('button');
  helpButton.className = iconButtonClass;
  helpButton.setAttribute('aria-label', 'Help');
  helpButton.appendChild(HelpIcon());

  actionBar.appendChild(terminalButton);
  actionBar.appendChild(Separator());
  actionBar.appendChild(magicWandButton);
  actionBar.appendChild(SearchBar());
  actionBar.appendChild(Separator());
  actionBar.appendChild(helpButton);

  return actionBar;
}
const Separator = () => {
  const separatorClass = 'separator';

  const div = document.createElement('div');
  div.className = separatorClass;
  return div;
}
module.exports = ActionBar;
},{"./icons":3,"./search-bar":5}],3:[function(require,module,exports){
const stroke = '#a0a0a0';
const strokeWidth = "1.5";
const width = "24";
const height = "24";

function TerminalIcon() {
  const path = `<svg width=${width} height=${height} viewBox="0 0 22 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_256_7194)">
<path d="M16.6365 16.0813H16.8365V15.8813V14.8297V14.6297H16.6365H11.453H11.253V14.8297V15.8813V16.0813H11.453H16.6365ZM5.09034 7.85454L4.9519 7.99496L5.09034 8.13538L8.58038 11.6752L5.09034 15.2151L4.9519 15.3555L5.09034 15.4959L5.8234 16.2394L5.96582 16.3839L6.10824 16.2394L10.4698 11.8156L10.6082 11.6752L10.4698 11.5348L6.10824 7.11102L5.96582 6.96656L5.8234 7.11102L5.09034 7.85454ZM17.6732 0.960156H4.19606C2.36527 0.960156 0.885937 2.46471 0.885937 4.31468V15.8813C0.885937 17.7313 2.36527 19.2358 4.19606 19.2358H17.6732C19.5041 19.2358 20.9834 17.7313 20.9834 15.8813V4.31468C20.9834 2.46471 19.5041 0.960156 17.6732 0.960156ZM2.33285 4.11468C2.43133 3.15557 3.23023 2.41167 4.19606 2.41167H17.6732C18.6391 2.41167 19.438 3.15557 19.5364 4.11468H2.33285ZM4.19606 17.7843C3.16406 17.7843 2.32264 16.935 2.32264 15.8813V5.5662H19.5467V15.8813C19.5467 16.935 18.7053 17.7843 17.6732 17.7843H4.19606Z" fill=${stroke} stroke=${stroke} stroke-width=${strokeWidth/4} />
</g>
<defs>
<clipPath id="clip0_256_7194">
<rect width="22" height="20" fill="white"/>
</clipPath>
</defs>
</svg>
`;

  const container = document.createElement('div');
  container.innerHTML = path;

  return container.firstChild;
}

function MagicWandIcon() {
  const path = `<svg width=${width} height=${height} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_256_6751)">
<path d="M5 17.5L17.5 5L15 2.5L2.5 15L5 17.5Z" stroke=${stroke} stroke-width=${strokeWidth} stroke-linecap="round" stroke-linejoin="round"/>
<path d="M12.5 5L15 7.5" stroke=${stroke} stroke-width=${strokeWidth} stroke-linecap="round" stroke-linejoin="round"/>
<path d="M7.4987 2.5C7.4987 2.94203 7.67429 3.36595 7.98685 3.67851C8.29941 3.99107 8.72334 4.16667 9.16536 4.16667C8.72334 4.16667 8.29941 4.34226 7.98685 4.65482C7.67429 4.96738 7.4987 5.39131 7.4987 5.83333C7.4987 5.39131 7.3231 4.96738 7.01054 4.65482C6.69798 4.34226 6.27406 4.16667 5.83203 4.16667C6.27406 4.16667 6.69798 3.99107 7.01054 3.67851C7.3231 3.36595 7.4987 2.94203 7.4987 2.5Z" stroke=${stroke} stroke-width=${strokeWidth} stroke-linecap="round" stroke-linejoin="round"/>
<path d="M15.8346 10.8333C15.8346 11.2753 16.0102 11.6992 16.3228 12.0118C16.6354 12.3243 17.0593 12.4999 17.5013 12.4999C17.0593 12.4999 16.6354 12.6755 16.3228 12.9881C16.0102 13.3006 15.8346 13.7246 15.8346 14.1666C15.8346 13.7246 15.659 13.3006 15.3465 12.9881C15.0339 12.6755 14.61 12.4999 14.168 12.4999C14.61 12.4999 15.0339 12.3243 15.3465 12.0118C15.659 11.6992 15.8346 11.2753 15.8346 10.8333Z" stroke=${stroke} stroke-width=${strokeWidth} stroke-linecap="round" stroke-linejoin="round"/>
</g>
<defs>
<clipPath id="clip0_256_6751">
<rect width="20" height="20" fill="white"/>
</clipPath>
</defs>
</svg>`;

  const container = document.createElement('div');
  container.innerHTML = path;

  return container.firstChild;
}

function SearchIcon() {
  const path = `<svg width=${width} height=${height} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Group for the circle (background) -->
  <g id="circle">
    <circle cx="12" cy="12" r="12" fill="#1A1A1A"/>
  </g>

  <!-- Group for the search icon (foreground) -->
  <g id="search-icon" transform="translate(7 7)">
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clip-path="url(#clip0_256_6745)">
        <path d="M4.68129 8.49368C6.78776 8.49368 8.49539 6.78605 8.49539 4.67958C8.49539 2.57311 6.78776 0.865479 4.68129 0.865479C2.57482 0.865479 0.867188 2.57311 0.867188 4.67958C0.867188 6.78605 2.57482 8.49368 4.68129 8.49368Z" stroke=${stroke} stroke-width=${strokeWidth}
       stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9.22987 9.23084L7.69141 7.69238" stroke=${stroke} stroke-width=${strokeWidth}
       stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      <defs>
        <clipPath id="clip0_256_6745">
          <rect width="10" height="10" fill="white"/>
        </clipPath>
      </defs>
    </svg>
  </g>
</svg>`;

  const container = document.createElement('div');
  container.innerHTML = path;

  return container.firstChild;
}

function CloseIcon() {
  const path = `<svg width=${width} height=${height} viewBox="0 0 15 16" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_256_7190)">
<path d="M11.25 4.25L3.75 11.75" stroke=${stroke} stroke-width=${strokeWidth} stroke-linecap="round" stroke-linejoin="round"/>
<path d="M3.75 4.25L11.25 11.75" stroke=${stroke} stroke-width=${strokeWidth} stroke-linecap="round" stroke-linejoin="round"/>
</g>
<defs>
<clipPath id="clip0_256_7190">
<rect width="15" height="15" fill="white" transform="translate(0 0.5)"/>
</clipPath>
</defs>
</svg>`;

  const container = document.createElement('div');
  container.innerHTML = path;

  return container.firstChild;
}

function HelpIcon() {
  const path = `<svg width=${width} height=${height} viewBox="0 0 18 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<g clip-path="url(#clip0_256_7199)">
<path d="M6 6.66675C6 6.00371 6.27656 5.36782 6.76884 4.89898C7.26113 4.43014 7.92881 4.16675 8.625 4.16675H9.375C10.0712 4.16675 10.7389 4.43014 11.2312 4.89898C11.7234 5.36782 12 6.00371 12 6.66675C12.0276 7.20779 11.8963 7.74416 11.6257 8.19506C11.3552 8.64596 10.9601 8.98698 10.5 9.16675C10.0399 9.40644 9.64482 9.86113 9.37428 10.4623C9.10374 11.0635 8.97238 11.7787 9 12.5001" stroke=${stroke} stroke-width=${strokeWidth*1.5} stroke-linecap="round" stroke-linejoin="round"/>
<path d="M9 15.8333V15.8416" stroke=${stroke} stroke-width=${strokeWidth*1.5} stroke-linecap="round" stroke-linejoin="round"/>
</g>
<defs>
<clipPath id="clip0_256_7199">
<rect width="18" height="20" fill="white"/>
</clipPath>
</defs>
</svg>`;

  const container = document.createElement('div');
  container.innerHTML = path;

  return container.firstChild;
}
 function BreadCrumbIcon() {
  const path = `<svg class="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
  <path stroke=${stroke} stroke-width=${strokeWidth} stroke-linecap="round" stroke-linejoin="round" d="m10 16 4-4-4-4"/>
 </svg>`
 const container = document.createElement('div');
 container.innerHTML = path;

 return container.firstChild;
}
module.exports = {
  TerminalIcon,
  MagicWandIcon,
  SearchIcon,
  CloseIcon,
  HelpIcon,
  BreadCrumbIcon,
};
},{}],4:[function(require,module,exports){
const ActionBar = require('./action-bar');

function Page() {
  const pageContainerClass = 'pageContainer';
  const pageContentClass = 'pageContent';
  const pageHeadingClass = 'pageHeading';
  const pageParagraphClass = 'pageParagraph';

  const container = document.createElement('div');
  container.className = pageContainerClass;

  const actionBar = ActionBar();
  container.appendChild(actionBar);

  const contentDiv = document.createElement('div');
  contentDiv.className = pageContentClass;

  const heading = document.createElement('h1');
  heading.className = pageHeadingClass;
  heading.textContent = 'Theme Widget v0.0.1';
  contentDiv.appendChild(heading);

  const paragraph = document.createElement('p');
  paragraph.className = pageParagraphClass;
  paragraph.textContent = 'Click on the search bar below to see it in action!';
  contentDiv.appendChild(paragraph);
  container.appendChild(contentDiv);
  const styleElement = document.createElement('style');
  styleElement.textContent = style;
  container.appendChild(styleElement); 

  return container;

}

module.exports = Page;
const style = `
:root {
  background-color: #000000
}

.actionBarContainer {
  height: 3rem;
  padding-left: 1rem;
  padding-right: 1rem;
  margin: 0;
  display: flex;
  align-items: center;
  background-color: #1a1a1a;
  gap: 0.5rem;
  border: 0.068rem solid #464646;
}

.iconButton {
  background-color: #1a1a1a;
  transition: background-color 0.3s;
  border: 0;
  shadow: 0;
  display: flex;
  align-items: center;
  flex-direction: row;
  min-height: 2rem;
  border-radius: 0.5rem;
}

.iconButton:hover {
  cursor: pointer;
  }
.iconButton:active {
  background-color: #303030;
}
.separator {
  width: 1px;
  height: 1.5rem;
  background-color: #e5e7eb;
  margin-left: 0.5rem;
  margin-right: 0.5rem;
}

.searchBarContainer {
  flex: 1;
  position: relative;
}

.searchInputContainer {
  height: 2rem;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #303030;
  border-radius: 0.375rem;
  cursor: text;
}

.searchInputContent {
  flex: 1;
}

.searchInputText {
  font-size: 0.875rem;
  color: #a0a0a0;
}

.searchInput {
  width: 100%;
  background-color: transparent;
  outline: none;
  border: none;
  color: #a0a0a0;
  font-size: 0.875rem;
}

.searchResetButton {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 0;
  padding: 0;
  border: none;
  background-color: transparent;
}

.searchResetButton:hover {
  cursor: pointer;
}

.pageContainer {
  display: flex;
  flex-direction: column-reverse;
  height: 100vh;
  justify-content: space-between;
  min-height: 100vh;
  background-color: black;
}

.pageContent {
  padding: 1rem;
}

.pageHeading {
  font-size: 1.5rem;
  font-weight: bold;
  color: #6b7280;
}

.pageParagraph {
  margin-top: 0.5rem;
  color: #6b7280;
}
`
},{"./action-bar":2}],5:[function(require,module,exports){
const { SearchIcon, CloseIcon } = require('./icons');

function SearchBar({ defaultPath = "Home > Documents > Current" } = {}) {
    const searchBarContainerClass = 'searchBarContainer';
    const inputContainerClass = 'searchInputContainer';
    const contentDivClass = 'searchInputContent';
    const textSpanClass = 'searchInputText';
    const inputElementClass = 'searchInput';
    const resetButtonClass = 'searchResetButton';

    const searchBarContainer = document.createElement('div');
    searchBarContainer.className = searchBarContainerClass;

    const inputContainer = document.createElement('div');
    inputContainer.className = inputContainerClass;

    const contentDiv = document.createElement('div');
    contentDiv.className = contentDivClass;

    const textSpan = document.createElement('div');
    textSpan.className = textSpanClass;
    textSpan.textContent = defaultPath;

    const inputElement = document.createElement('input');
    inputElement.setAttribute('type', 'text');
    inputElement.className = inputElementClass;
    inputElement.style.display = 'none';

    const resetButton = document.createElement('button');
    resetButton.className = resetButtonClass;
    resetButton.appendChild(SearchIcon());

    let isActionState = false;
    let isBreadcrumbMode = true;
    let actionValue = '';

    const handleActionInputFocus = () => {
      contentDiv.innerHTML=''; 
      contentDiv.appendChild(inputElement);
        inputElement.style.display = 'block';
        inputElement.focus();
        resetButton.innerHTML = '';
        resetButton.appendChild(CloseIcon());
        isActionState = true;
        isBreadcrumbMode = false;
    };

    const handleActionInputBlur = () => {
        if (inputElement.value === '' && !isBreadcrumbMode) {
          contentDiv.innerHTML='';
          contentDiv.appendChild(textSpan);
            inputElement.style.display = 'none';
            resetButton.innerHTML = '';
            resetButton.appendChild(SearchIcon());
           isActionState = false;
        }
    };

    const handleReset = () => {
        actionValue = '';
        inputElement.value = '';
        contentDiv.innerHTML='';
        contentDiv.appendChild(textSpan);
        inputElement.style.display = 'none';
        resetButton.innerHTML = '';
        resetButton.appendChild(SearchIcon());
        isActionState = false;
        isBreadcrumbMode = true;
    };

    const handleBreadcrumbClick = () => {
        isActionState = true;
        isBreadcrumbMode = false;
        contentDiv.innerHTML='';
        contentDiv.appendChild(inputElement);
        inputElement.style.display = 'block';
        inputElement.placeholder = '#night';
        inputElement.focus();
        resetButton.innerHTML = '';
        resetButton.appendChild(CloseIcon());
    };

    inputElement.addEventListener('input', (e) => {
        actionValue = e.target.value;
    });

    inputContainer.addEventListener('click', () => {
        if (!isActionState) {
            handleActionInputFocus();
        }
    });

    resetButton.addEventListener('click', (event) => {
        event.stopPropagation();
        handleReset();
    });

    textSpan.addEventListener('click', (event) => {
        event.stopPropagation();
        handleBreadcrumbClick();
    });

    contentDiv.appendChild(textSpan);
    inputContainer.appendChild(contentDiv);
    inputContainer.appendChild(resetButton);
    searchBarContainer.appendChild(inputContainer);

    return searchBarContainer;
}

module.exports = SearchBar;
},{"./icons":3}],6:[function(require,module,exports){
const components = require("..");

const factories = Object.keys(components).map((name) => [
  name,
  components[name],
]);
document.createElement("div").className = "root";
document.body.append(
  ...factories.map(([name, fn]) => {
    const container = document.createElement("div");
    container.append(fn());
    return container;
  })
);

},{"..":1}]},{},[6]);
