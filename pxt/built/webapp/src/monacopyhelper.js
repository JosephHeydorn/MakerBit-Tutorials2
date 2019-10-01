"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var INDENT = 4;
function getIndent(s) {
    if (!s)
        return 0;
    return s.match(/^\s*/)[0].length || 0;
}
function setIndent(i, s) {
    return new Array(i + 1).join(' ') + s.trim();
}
function getLine(source, model, lineNumber) {
    return source.slice(model.getOffsetAt({ lineNumber: lineNumber, column: 0 }), model.getOffsetAt({ lineNumber: lineNumber + 1, column: 0 }));
}
// checks to see if the line ends in a colon, indicating the start of a code block
function isCodeBlock(s) {
    s = s.trim();
    return s[s.length - 1] == ':';
}
function provideDocumentRangeFormattingEdits(model, range, options, token) {
    var source = model.getValue();
    // TODO indentation for paste blocks
    var partial = range.startLineNumber != 0;
    var s = model.getOffsetAt({ lineNumber: range.startLineNumber, column: range.startColumn });
    var e = model.getOffsetAt({ lineNumber: range.endLineNumber, column: range.endColumn });
    var lines = source.slice(s, e).split('\n');
    var codeLines = lines.map(function (s, i) { return !!s ? i : -1; }).filter(function (i) { return i >= 0; });
    var prev;
    if (partial) {
        prev = getLine(source, model, range.startLineNumber - 1);
    }
    for (var i = 0; i < codeLines.length; i++) {
        var currIndex = codeLines[i];
        var curr = lines[currIndex];
        var next = lines[codeLines[i + 1]];
        if (prev) {
            var prevIndent = getIndent(prev);
            var nextIndent = getIndent(next);
            // TODO additional heuristics based on position of next line?
            if (isCodeBlock(prev)) {
                // at the start of a code block, add one additional indent
                var indent = prevIndent + INDENT;
                lines[currIndex] = setIndent(indent, curr);
            }
            else if (next && prevIndent == nextIndent && prevIndent != getIndent(curr) && !isCodeBlock(curr)) {
                // if previous and next line have same indent, adjust current to match
                lines[currIndex] = setIndent(prevIndent, curr);
            }
        }
        prev = lines[currIndex];
    }
    return [{
            text: lines.join('\n'),
            range: range
        }];
}
exports.provideDocumentRangeFormattingEdits = provideDocumentRangeFormattingEdits;
