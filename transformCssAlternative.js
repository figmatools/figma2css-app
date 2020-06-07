// This function expects a single Figma Document param as JSON (documentJSON) and an array of CSS attribute names (includedAttributes).
// It spits out a string formatted to CSS notation.
// We need to use Decimal Unicode since this text will be displayed in a textarea.
// &#13 = new line

module.exports = (documentJSON, includedAttributes) => {
    if(typeof(documentJSON) !== "undefined") {
        let stringBuffer = "";
        stringBuffer += extractClassSelector(documentJSON.name) + " { \n";
        stringBuffer += extractClassBody(documentJSON.style, includedAttributes) + "\n }\n\n";
        return stringBuffer;
    } else {
        return "";
    }
}

const indentStr = "    ";

const extractClassSelector = (nameJSON) => {
    return JSON.stringify(nameJSON).replace(/\"/g, "");
}

const extractClassBody = (bodyJSON, includedAttributes) => {
    if(!bodyJSON) {
        return indentStr + "/* This Figma Node did not have any valid style! */";
    }
    let stringBuffer = "";

    for(let attr in bodyJSON) {
        if(includedAttributes.includes(attr)) {
            stringBuffer += indentStr + attr + ": " + bodyJSON[attr] + ";\n";
        }
    }

    // There will always be an extra line break before closing the selector, so we cut it out before returning the string :)
    stringBuffer = stringBuffer.substr(0, stringBuffer.length-2);

    return stringBuffer;
}
