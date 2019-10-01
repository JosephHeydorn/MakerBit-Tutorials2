"use strict";
/// <reference path="../../localtypings/smoothie.d.ts" />
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var core = require("./core");
var srceditor = require("./srceditor");
var sui = require("./sui");
var data = require("./data");
var Util = pxt.Util;
var maxEntriesPerChart = 4000;
var Editor = /** @class */ (function (_super) {
    __extends(Editor, _super);
    function Editor(parent) {
        var _this = _super.call(this, parent) || this;
        _this.parent = parent;
        _this.savedMessageQueue = [];
        _this.maxSavedMessages = 1000;
        _this.charts = [];
        _this.chartIdx = 0;
        _this.sourceMap = {};
        _this.serialInputDataBuffer = "";
        _this.maxSerialInputDataLength = 255;
        _this.isSim = true;
        _this.maxConsoleEntries = 500;
        _this.active = true;
        _this.rawDataBuffer = "";
        _this.maxBufferLength = 10000;
        _this.csvHeaders = [];
        _this.highContrast = false;
        _this.handleStartPauseRef = function (c) {
            _this.startPauseButton = c;
        };
        _this.handleChartRootRef = function (c) {
            _this.chartRoot = c;
        };
        _this.handleConsoleRootRef = function (c) {
            _this.consoleRoot = c;
        };
        window.addEventListener("message", _this.processEvent.bind(_this), false);
        var serialTheme = pxt.appTarget.serial && pxt.appTarget.serial.editorTheme;
        _this.lineColors = (serialTheme && serialTheme.lineColors) || ["#e00", "#00e", "#0e0"];
        _this.hcLineColors = ["#000"];
        _this.currentLineColors = _this.lineColors;
        _this.goBack = _this.goBack.bind(_this);
        _this.toggleRecording = _this.toggleRecording.bind(_this);
        _this.downloadRaw = _this.downloadRaw.bind(_this);
        _this.downloadCSV = _this.downloadCSV.bind(_this);
        return _this;
    }
    Editor.prototype.getId = function () {
        return "serialEditor";
    };
    Editor.prototype.hasHistory = function () { return false; };
    Editor.prototype.hasEditorToolbar = function () {
        return false;
    };
    Editor.prototype.setVisible = function (b) {
        if (this.parent.state.highContrast !== this.highContrast) {
            this.setHighContrast(this.parent.state.highContrast);
        }
        this.isVisible = b;
        if (this.isVisible) {
            this.processQueuedMessages();
            this.startRecording();
        }
        else {
            this.pauseRecording();
            this.clear();
        }
    };
    Editor.prototype.setHighContrast = function (hc) {
        if (hc !== this.highContrast) {
            this.highContrast = hc;
            if (hc) {
                this.currentLineColors = this.hcLineColors;
            }
            else {
                this.currentLineColors = this.lineColors;
            }
            this.clear();
        }
    };
    Editor.prototype.acceptsFile = function (file) {
        return file.name === pxt.SERIAL_EDITOR_FILE;
    };
    Editor.prototype.setSim = function (b) {
        if (this.isSim != b) {
            this.isSim = b;
            this.clear();
        }
    };
    Editor.prototype.loadSmoothieChartsAsync = function () {
        if (!this.loadSmoothieChartsPromise) {
            this.loadSmoothieChartsPromise = pxt.BrowserUtils.loadScriptAsync("smoothie/smoothie_compressed.js");
        }
        return this.loadSmoothieChartsPromise;
    };
    Editor.prototype.saveMessageForLater = function (m) {
        this.savedMessageQueue.push(m);
        if (this.savedMessageQueue.length > this.maxSavedMessages) {
            this.savedMessageQueue.shift();
        }
    };
    Editor.prototype.processQueuedMessages = function () {
        var _this = this;
        this.savedMessageQueue.forEach(function (m) { return _this.processMessage(m); });
        this.savedMessageQueue = [];
    };
    Editor.prototype.processEvent = function (ev) {
        var _this = this;
        var msg = ev.data;
        if (msg.type === "serial") {
            this.processEventCore(msg);
        }
        else if (msg.type === "bulkserial") {
            msg.data.forEach(function (datum) {
                _this.processEventCore({
                    type: "serial",
                    data: datum.data,
                    receivedTime: datum.time,
                    sim: msg.sim,
                    id: msg.id
                });
            });
        }
    };
    Editor.prototype.processEventCore = function (smsg) {
        smsg.receivedTime = smsg.receivedTime || Util.now();
        if (!this.active) {
            this.saveMessageForLater(smsg);
            return;
        }
        this.processMessage(smsg);
    };
    Editor.prototype.mapSource = function (source) {
        if (!this.sourceMap[source]) {
            var sourceIdx = Object.keys(this.sourceMap).length + 1;
            this.sourceMap[source] = lf("source") + sourceIdx.toString();
        }
        return this.sourceMap[source];
    };
    Editor.prototype.processMessage = function (smsg) {
        var sim = !!smsg.sim;
        if (sim != this.isSim)
            return;
        // clean up input
        var data = smsg.data || "";
        var source = smsg.id || "?";
        var receivedTime = smsg.receivedTime || Util.now();
        this.appendRawData(data);
        var niceSource = this.mapSource(source);
        // chunk into lines
        var lines = this.chunkDataIntoLines(data);
        // process each line
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
            this.processMessageLine(line, niceSource, receivedTime);
        }
    };
    Editor.prototype.processMessageLine = function (line, niceSource, receivedTime) {
        var _this = this;
        // packet payload as json
        if (/^\s*\{[^}]+\}\s*$/.test(line)) {
            try {
                var json = JSON.parse(line);
                var t = parseInt(json["t"]);
                var s = this.mapSource(json["s"]);
                var n = json["n"] || "";
                var v = parseFloat(json["v"]);
                if (!isNaN(t) && !isNaN(v))
                    this.appendGraphEntry(s, n, v, receivedTime);
            }
            catch (e) { } // invalid js
        }
        else if (/^\s*(-?\d+(\.\d*)?(e[\+\-]\d+)?)(\s*,\s*(-?\d+(\.\d*)?(e[\+\-]\d+)?))+\s*,?\s*$/.test(line)) {
            line.split(/\s*,\s*/).map(function (s) { return parseFloat(s); })
                .filter(function (d) { return !isNaN(d); })
                .forEach(function (d, i) {
                var variable = "data." + (_this.csvHeaders[i] || i);
                _this.appendGraphEntry(niceSource, variable, d, receivedTime);
            });
            // is this a CSV header entry
        }
        else if (/^\s*[\s\w]+(\s*,\s*[\w\s]+)+\s*,?\s*$/.test(line)) {
            this.csvHeaders = line.split(/\s*,\s*/).map(function (h) { return h.trim(); });
        }
        else {
            // is this a key-value pair, or just a number?
            var m = /^\s*(([^:]+):)?\s*(-?\d+(\.\d*)?(e[\+\-]\d+)?)/i.exec(line);
            if (m) {
                var variable = m[2] || '';
                var nvalue = parseFloat(m[3]);
                if (!isNaN(nvalue)) {
                    this.appendGraphEntry(niceSource, variable, nvalue, receivedTime);
                }
            }
        }
        this.appendConsoleEntry(line);
    };
    Editor.prototype.appendRawData = function (data) {
        this.rawDataBuffer += data;
        if (this.rawDataBuffer.length > this.maxBufferLength) {
            this.rawDataBuffer.slice(this.rawDataBuffer.length / 4);
        }
    };
    Editor.prototype.appendGraphEntry = function (source, variable, nvalue, receivedTime) {
        var _this = this;
        this.loadSmoothieChartsAsync()
            .then(function () {
            //See if there is a "home chart" that this point belongs to -
            //if not, create a new chart
            var homeChart = undefined;
            for (var i = 0; i < _this.charts.length; ++i) {
                var chart = _this.charts[i];
                if (chart.shouldContain(source, variable)) {
                    homeChart = chart;
                    break;
                }
            }
            if (!homeChart) {
                homeChart = new Chart(source, variable, _this.chartIdx, _this.currentLineColors);
                _this.chartIdx++;
                _this.charts.push(homeChart);
                _this.chartRoot.appendChild(homeChart.getElement());
                pxt.BrowserUtils.removeClass(_this.chartRoot, "nochart");
                if (_this.consoleRoot) {
                    pxt.BrowserUtils.removeClass(_this.consoleRoot, "nochart");
                }
            }
            homeChart.addPoint(variable, nvalue, receivedTime);
        });
    };
    Editor.prototype.chunkDataIntoLines = function (data) {
        var lines = [];
        for (var i = 0; i < data.length; ++i) {
            var ch = data[i];
            this.serialInputDataBuffer += ch;
            if (ch !== "\n" && this.serialInputDataBuffer.length < this.maxSerialInputDataLength) {
                continue;
            }
            if (ch === "\n") {
                // remove trailing white space
                this.serialInputDataBuffer = this.serialInputDataBuffer.replace(/\s+$/, '');
                // if anything remaining...
                if (this.serialInputDataBuffer.length) {
                    lines.push(this.serialInputDataBuffer);
                }
            }
            else {
                lines.push(this.serialInputDataBuffer);
            }
            this.serialInputDataBuffer = "";
        }
        return lines;
    };
    Editor.prototype.appendConsoleEntry = function (line) {
        if (line.length >= this.maxSerialInputDataLength) {
            //Buffer was full, this is a big chunk of data
            //Make a new entry with <span>, not <div>
            var newEntry = document.createElement("span");
            newEntry.appendChild(document.createTextNode(line));
            this.consoleRoot.appendChild(newEntry);
        }
        else {
            var lastEntry = this.consoleRoot.lastChild;
            var newEntry = document.createElement("div");
            if (lastEntry && lastEntry.lastChild.textContent == line) {
                if (lastEntry.childNodes.length == 2) {
                    //Matches already-collapsed entry
                    var count = parseInt(lastEntry.firstChild.textContent);
                    lastEntry.firstChild.textContent = (count + 1).toString();
                }
                else {
                    //Make a new collapsed entry with count = 2
                    var newLabel = document.createElement("a");
                    newLabel.className = "ui horizontal label";
                    newLabel.textContent = "2";
                    lastEntry.insertBefore(newLabel, lastEntry.lastChild);
                }
            }
            else {
                //Make a new non-collapsed entry
                newEntry.appendChild(document.createTextNode(line));
                this.consoleRoot.appendChild(newEntry);
            }
        }
        this.consoleRoot.scrollTop = this.consoleRoot.scrollHeight;
        while (this.consoleRoot.childElementCount > this.maxConsoleEntries) {
            this.consoleRoot.removeChild(this.consoleRoot.firstChild);
        }
        if (this.consoleRoot && this.consoleRoot.childElementCount > 0) {
            if (this.chartRoot) {
                pxt.BrowserUtils.removeClass(this.chartRoot, "noconsole");
            }
            if (this.consoleRoot) {
                pxt.BrowserUtils.removeClass(this.consoleRoot, "noconsole");
            }
        }
    };
    Editor.prototype.pauseRecording = function () {
        this.active = false;
        if (this.startPauseButton)
            this.startPauseButton.setState({ active: this.active });
        this.charts.forEach(function (s) { return s.stop(); });
    };
    Editor.prototype.startRecording = function () {
        this.active = true;
        if (this.startPauseButton)
            this.startPauseButton.setState({ active: this.active });
        this.charts.forEach(function (s) { return s.start(); });
    };
    Editor.prototype.toggleRecording = function () {
        pxt.tickEvent("serial.toggleRecording", undefined, { interactiveConsent: true });
        if (this.active)
            this.pauseRecording();
        else
            this.startRecording();
    };
    Editor.prototype.clearNode = function (e) {
        while (e.hasChildNodes()) {
            e.removeChild(e.firstChild);
        }
    };
    Editor.prototype.clear = function () {
        if (this.chartRoot) {
            this.clearNode(this.chartRoot);
            pxt.BrowserUtils.addClass(this.chartRoot, "noconsole");
            pxt.BrowserUtils.addClass(this.chartRoot, "nochart");
        }
        if (this.consoleRoot) {
            this.clearNode(this.consoleRoot);
            pxt.BrowserUtils.addClass(this.consoleRoot, "noconsole");
            pxt.BrowserUtils.addClass(this.consoleRoot, "nochart");
        }
        this.charts = [];
        this.serialInputDataBuffer = "";
        this.rawDataBuffer = "";
        this.savedMessageQueue = [];
        this.sourceMap = {};
        this.csvHeaders = [];
    };
    Editor.prototype.isCSV = function (nl, datas) {
        if (datas.length < 2)
            return false;
        for (var i = 0; i < datas.length; ++i)
            if (datas[i].length != nl)
                return false;
        for (var l = 0; l < nl; ++l) {
            var t = datas[0][l][0];
            for (var d = 1; d < datas.length; ++d) {
                if (datas[d][l][0] != t)
                    return false;
            }
        }
        return true;
    };
    Editor.prototype.downloadCSV = function () {
        var _this = this;
        var sep = lf("{id:csvseparator}\t");
        var csv = [];
        var hasData = this.charts.length && this.charts.some(function (chart) {
            return Object.keys(chart.datas).length > 0;
        });
        if (!hasData) {
            core.confirmAsync({
                header: lf("No data to export"),
                hideAgree: true,
                disagreeLbl: lf("Ok"),
                body: lf("You must generate some serial data before you can export it.")
            });
            return;
        }
        this.charts.forEach(function (chart) {
            var lines = [];
            Object.keys(chart.datas).forEach(function (k) { return lines.push({ name: k, line: chart.datas[k] }); });
            var datas = lines.map(function (line) { return line.line; });
            var nl = datas.length > 0 ? datas.map(function (data) { return data.length; }).reduce(function (l, c) { return Math.max(l, c); }) : 0;
            // if all lines have same timestamp, condense output
            var isCSV = _this.isCSV(nl, datas);
            if (isCSV) {
                var h = "time (" + chart.source + ")" + sep + lines.map(function (line) { return line.name; }).join(sep) + sep;
                csv[0] = csv[0] ? csv[0] + sep + h : h;
                var _loop_1 = function (i) {
                    var t = (datas[0][i][0] - datas[0][0][0]) / 1000;
                    var da = t + sep + datas.map(function (data) { return data[i][1]; }).join(sep) + sep;
                    csv[i + 1] = csv[i + 1] ? csv[i + 1] + sep + da : da;
                };
                for (var i = 0; i < nl; ++i) {
                    _loop_1(i);
                }
            }
            else {
                var h = lines.map(function (line) { return "time (" + chart.source + ")" + sep + line.name; }).join(sep);
                csv[0] = csv[0] ? csv[0] + sep + h : h;
                var _loop_2 = function (i) {
                    var da = datas.map(function (data) { return i < data.length ? "" + (data[i][0] - data[0][0]) / 1000 + sep + data[i][1] : sep; }).join(sep);
                    csv[i + 1] = csv[i + 1] ? csv[i + 1] + sep + da : da;
                };
                for (var i = 0; i < nl; ++i) {
                    _loop_2(i);
                }
            }
        });
        csv.unshift("sep=" + sep);
        var csvText = csv.join('\r\n');
        core.infoNotification(lf("Exporting data...."));
        var time = new Date(Date.now()).toString().replace(/[^\d]+/g, '-').replace(/(^-|-$)/g, '');
        pxt.commands.browserDownloadAsync(Util.toUTF8(csvText), pxt.appTarget.id + '-' + lf("{id:csvfilename}data") + '-' + time + ".csv", "text/csv");
    };
    Editor.prototype.downloadRaw = function () {
        core.infoNotification(lf("Exporting text...."));
        var time = new Date(Date.now()).toString().replace(/[^\d]+/g, '-').replace(/(^-|-$)/g, '');
        pxt.commands.browserDownloadAsync(Util.toUTF8(this.rawDataBuffer), pxt.appTarget.id + '-' + lf("{id:csvfilename}console") + '-' + time + ".txt", "text/plain");
    };
    Editor.prototype.goBack = function () {
        pxt.tickEvent("serial.backButton", undefined, { interactiveConsent: true });
        this.parent.openPreviousEditor();
    };
    Editor.prototype.display = function () {
        return (React.createElement("div", { id: "serialArea" },
            React.createElement("div", { id: "serialHeader", className: "ui serialHeader" },
                React.createElement("div", { className: "leftHeaderWrapper" },
                    React.createElement("div", { className: "leftHeader" },
                        React.createElement(sui.Button, { title: lf("Go back"), tabIndex: 0, onClick: this.goBack, onKeyDown: sui.fireClickOnEnter },
                            React.createElement(sui.Icon, { icon: "arrow left" }),
                            React.createElement("span", { className: "ui text landscape only" }, lf("Go back"))))),
                React.createElement("div", { className: "rightHeader" },
                    React.createElement(sui.Button, { title: lf("Copy text"), className: "ui icon button editorExport", ariaLabel: lf("Copy text"), onClick: this.downloadRaw },
                        React.createElement(sui.Icon, { icon: "copy" })),
                    React.createElement(sui.Button, { title: lf("Export data"), className: "ui icon blue button editorExport", ariaLabel: lf("Export data"), onClick: this.downloadCSV },
                        React.createElement(sui.Icon, { icon: "download" })),
                    React.createElement(StartPauseButton, { ref: this.handleStartPauseRef, active: this.active, toggle: this.toggleRecording }),
                    React.createElement("span", { className: "ui small header" }, this.isSim ? lf("Simulator") : lf("Device")))),
            React.createElement("div", { id: "serialCharts", ref: this.handleChartRootRef }),
            React.createElement("div", { id: "serialConsole", ref: this.handleConsoleRootRef })));
    };
    Editor.prototype.domUpdate = function () {
    };
    return Editor;
}(srceditor.Editor));
exports.Editor = Editor;
var StartPauseButton = /** @class */ (function (_super) {
    __extends(StartPauseButton, _super);
    function StartPauseButton(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            active: _this.props.active
        };
        return _this;
    }
    StartPauseButton.prototype.renderCore = function () {
        var toggle = this.props.toggle;
        var active = this.state.active;
        return React.createElement(sui.Button, { title: active ? lf("Pause recording") : lf("Start recording"), className: "ui left floated icon button " + (active ? "green" : "red circular") + " toggleRecord", onClick: toggle },
            React.createElement(sui.Icon, { icon: active ? "pause icon" : "circle icon" }));
    };
    return StartPauseButton;
}(data.PureComponent));
exports.StartPauseButton = StartPauseButton;
var Chart = /** @class */ (function () {
    function Chart(source, variable, chartIdx, lineColors) {
        var _this = this;
        this.rootElement = document.createElement("div");
        this.lines = {};
        this.datas = {};
        // Initialize chart
        var serialTheme = pxt.appTarget.serial && pxt.appTarget.serial.editorTheme;
        var chartConfig = {
            interpolation: 'bezier',
            labels: {
                disabled: false,
                fillStyle: 'black',
                fontSize: 14
            },
            responsive: true,
            millisPerPixel: 20,
            grid: {
                verticalSections: 0,
                borderVisible: false,
                millisPerLine: 5000,
                fillStyle: serialTheme && serialTheme.gridFillStyle || 'transparent',
                strokeStyle: serialTheme && serialTheme.gridStrokeStyle || '#fff'
            },
            tooltip: true,
            tooltipFormatter: function (ts, data) { return _this.tooltip(ts, data); }
        };
        this.lineColors = lineColors;
        this.chartIdx = chartIdx;
        this.chart = new SmoothieChart(chartConfig);
        this.rootElement.className = "ui segment";
        this.source = source;
        this.variable = variable.replace(/\..*$/, ''); // keep prefix only
        this.rootElement.appendChild(this.makeLabel());
        this.rootElement.appendChild(this.makeCanvas());
    }
    Chart.prototype.tooltip = function (timestamp, data) {
        return data.map(function (n) {
            var name = n.series.timeSeries.__name;
            return "<span>" + (name ? name + ': ' : '') + n.value + "</span>";
        }).join('<br/>');
    };
    Chart.prototype.getLine = function (name) {
        var line = this.lines[name];
        if (!line) {
            var lineColor = this.lineColors[this.chartIdx++ % this.lineColors.length];
            this.lines[name] = line = new TimeSeries();
            line.__name = Util.htmlEscape(name.substring(this.variable.length + 1));
            this.chart.addTimeSeries(line, {
                strokeStyle: lineColor,
                lineWidth: 3
            });
            this.datas[name] = [];
        }
        return line;
    };
    Chart.prototype.makeLabel = function () {
        this.label = document.createElement("div");
        this.label.className = "ui orange bottom left attached no-select label seriallabel";
        this.label.innerText = this.variable || "...";
        return this.label;
    };
    Chart.prototype.makeCanvas = function () {
        var canvas = document.createElement("canvas");
        this.chart.streamTo(canvas);
        this.canvas = canvas;
        return canvas;
    };
    Chart.prototype.getCanvas = function () {
        return this.canvas;
    };
    Chart.prototype.getElement = function () {
        return this.rootElement;
    };
    Chart.prototype.shouldContain = function (source, variable) {
        return this.source == source
            && this.variable == variable.replace(/\..*$/, '');
    };
    Chart.prototype.addPoint = function (name, value, timestamp) {
        var line = this.getLine(name);
        line.append(timestamp, value);
        if (Object.keys(this.lines).length == 1) {
            // update label with last value
            var valueText = pxsim.Math_.roundWithPrecision(value, 2).toString();
            this.label.innerText = this.variable ? this.variable + ": " + valueText : valueText;
        }
        else {
            this.label.innerText = this.variable || '';
        }
        // store data
        var data = this.datas[name];
        data.push([timestamp, value]);
        // remove a third of the card
        if (data.length > maxEntriesPerChart)
            data.splice(0, data.length / 4);
    };
    Chart.prototype.start = function () {
        this.chart.start();
    };
    Chart.prototype.stop = function () {
        this.chart.stop();
    };
    return Chart;
}());
var ResourceImporter = /** @class */ (function () {
    function ResourceImporter() {
    }
    ResourceImporter.prototype.canImport = function (data) {
        return data.type == "text/plain";
    };
    ResourceImporter.prototype.importAsync = function (project, data) {
        return ts.pxtc.Util.fileReadAsTextAsync(data)
            .then(function (txt) {
            if (!txt) {
                core.errorNotification(lf("Ooops, could not read file"));
                return;
            }
            // parse times
            var lines = txt.split(/\n/g).map(function (line) {
                // extract timespace
                var t = /^\s*(\d+)>/.exec(line);
                if (t)
                    line = line.substr(t[0].length);
                return {
                    type: "serial",
                    data: line + "\n",
                    id: data.name,
                    receivedTime: t ? parseFloat(t[1]) : undefined
                };
            });
            if (!lines.length)
                return;
            // normalize timestamps
            var now = Util.now();
            var linest = lines.filter(function (line) { return !!line.receivedTime; });
            if (linest.length) {
                var tmax_1 = linest[linest.length - 1].receivedTime || 0;
                linest.forEach(function (line) { return line.receivedTime += now - tmax_1; });
            }
            // show console
            // send as serial message
            lines.forEach(function (line) { return window.postMessage(line, "*"); });
        });
    };
    return ResourceImporter;
}());
exports.ResourceImporter = ResourceImporter;
