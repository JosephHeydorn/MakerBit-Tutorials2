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
// Helpers designed to help to make a simulator accessible.
var pxsim;
(function (pxsim) {
    var accessibility;
    (function (accessibility) {
        var liveRegion;
        function makeFocusable(elem) {
            elem.setAttribute("focusable", "true");
            elem.setAttribute("tabindex", "0");
        }
        accessibility.makeFocusable = makeFocusable;
        function enableKeyboardInteraction(elem, handlerKeyDown, handlerKeyUp) {
            if (handlerKeyDown) {
                elem.addEventListener('keydown', function (e) {
                    var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
                    if (charCode === 32 || charCode === 13) {
                        handlerKeyDown();
                    }
                });
            }
            if (handlerKeyUp) {
                elem.addEventListener('keyup', function (e) {
                    var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
                    if (charCode === 32 || charCode === 13) {
                        handlerKeyUp();
                    }
                });
            }
        }
        accessibility.enableKeyboardInteraction = enableKeyboardInteraction;
        function setAria(elem, role, label) {
            if (role && !elem.hasAttribute("role")) {
                elem.setAttribute("role", role);
            }
            if (label && !elem.hasAttribute("aria-label")) {
                elem.setAttribute("aria-label", label);
            }
        }
        accessibility.setAria = setAria;
        function setLiveContent(value) {
            if (!liveRegion) {
                var style = "position: absolute !important;" +
                    "display: block;" +
                    "visibility: visible;" +
                    "overflow: hidden;" +
                    "width: 1px;" +
                    "height: 1px;" +
                    "margin: -1px;" +
                    "border: 0;" +
                    "padding: 0;" +
                    "clip: rect(0 0 0 0);";
                liveRegion = document.createElement("div");
                liveRegion.setAttribute("role", "status");
                liveRegion.setAttribute("aria-live", "polite");
                liveRegion.setAttribute("aria-hidden", "false");
                liveRegion.setAttribute("style", style);
                document.body.appendChild(liveRegion);
            }
            if (liveRegion.textContent !== value) {
                liveRegion.textContent = value;
            }
        }
        accessibility.setLiveContent = setLiveContent;
    })(accessibility = pxsim.accessibility || (pxsim.accessibility = {}));
})(pxsim || (pxsim = {}));
var pxsim;
(function (pxsim) {
    var GROUND_COLOR = "blue";
    var POWER_COLOR = "red";
    var POWER5V_COLOR = "orange";
    ;
    ;
    ;
    ;
    ;
    ;
    function isOnBreadboardBottom(location) {
        var isBot = false;
        if (typeof location !== "string" && location.type === "breadboard") {
            var bbLoc = location;
            var row = bbLoc.row;
            isBot = 0 <= ["a", "b", "c", "d", "e"].indexOf(row);
        }
        return isBot;
    }
    var arrCount = function (a) { return a.reduce(function (p, n) { return p + (n ? 1 : 0); }, 0); };
    var arrAny = function (a) { return arrCount(a) > 0; };
    function computePowerUsage(wire) {
        var ends = [wire.start, wire.end];
        var endIsGround = ends.map(function (e) { return e === "ground"; });
        var endIsThreeVolt = ends.map(function (e) { return e === "threeVolt"; });
        var endIsFiveVolt = ends.map(function (e) { return e === "fiveVolt"; });
        var endIsBot = ends.map(function (e) { return isOnBreadboardBottom(e); });
        var hasGround = arrAny(endIsGround);
        var hasThreeVolt = arrAny(endIsThreeVolt);
        var hasFiveVolt = arrAny(endIsFiveVolt);
        var hasBot = arrAny(endIsBot);
        return {
            topGround: hasGround && !hasBot,
            topThreeVolt: hasThreeVolt && !hasBot,
            topFiveVolt: hasFiveVolt && !hasBot,
            bottomGround: hasGround && hasBot,
            bottomThreeVolt: hasThreeVolt && hasBot,
            bottomFiveVolt: hasFiveVolt && hasBot,
            singleGround: hasGround,
            singleThreeVolt: hasThreeVolt,
            singleFiveVolt: hasFiveVolt
        };
    }
    function mergePowerUsage(powerUsages) {
        var finalPowerUsage = powerUsages.reduce(function (p, n) { return ({
            topGround: p.topGround || n.topGround,
            topThreeVolt: p.topThreeVolt || n.topThreeVolt,
            topFiveVolt: p.topFiveVolt || n.topFiveVolt,
            bottomGround: p.bottomGround || n.bottomGround,
            bottomThreeVolt: p.bottomThreeVolt || n.bottomThreeVolt,
            bottomFiveVolt: p.bottomFiveVolt || n.bottomFiveVolt,
            singleGround: n.singleGround ? p.singleGround === null : p.singleGround,
            singleThreeVolt: n.singleThreeVolt ? p.singleThreeVolt === null : p.singleThreeVolt,
            singleFiveVolt: n.singleFiveVolt ? p.singleFiveVolt === null : p.singleFiveVolt,
        }); }, {
            topGround: false,
            topThreeVolt: false,
            topFiveVolt: false,
            bottomGround: false,
            bottomThreeVolt: false,
            bottomFiveVolt: false,
            singleGround: null,
            singleThreeVolt: null,
            singleFiveVolt: null
        });
        if (finalPowerUsage.singleGround)
            finalPowerUsage.topGround = finalPowerUsage.bottomGround = false;
        if (finalPowerUsage.singleThreeVolt)
            finalPowerUsage.topThreeVolt = finalPowerUsage.bottomThreeVolt = false;
        if (finalPowerUsage.singleFiveVolt)
            finalPowerUsage.topFiveVolt = finalPowerUsage.bottomFiveVolt = false;
        return finalPowerUsage;
    }
    function copyDoubleArray(a) {
        return a.map(function (b) { return b.map(function (p) { return p; }); });
    }
    function merge2(a, b) {
        var res = {};
        for (var aKey in a)
            res[aKey] = a[aKey];
        for (var bKey in b)
            res[bKey] = b[bKey];
        return res;
    }
    function merge3(a, b, c) {
        return merge2(merge2(a, b), c);
    }
    function readPin(arg) {
        pxsim.U.assert(!!arg, "Invalid pin: " + arg);
        var pin = /^(\w+)\.\s*(?:[a-z]*)?([A-Z][A-Z\d_]+)$/.exec(arg);
        return pin ? pin[2] : undefined;
    }
    pxsim.readPin = readPin;
    function mkReverseMap(map) {
        var origKeys = [];
        var origVals = [];
        for (var key in map) {
            origKeys.push(key);
            origVals.push(map[key]);
        }
        var newMap = {};
        for (var i = 0; i < origKeys.length; i++) {
            var newKey = origVals[i];
            var newVal = origKeys[i];
            newMap[newKey] = newVal;
        }
        return newMap;
    }
    function isConnectedToBB(pin) {
        return pin.orientation === "-Z" && pin.style === "male";
    }
    var Allocator = /** @class */ (function () {
        function Allocator(opts) {
            this.availablePowerPins = {
                top: {
                    fiveVolt: pxsim.mkRange(26, 51).map(function (n) { return ({ type: "breadboard", row: "+", col: "" + n }); }),
                    threeVolt: pxsim.mkRange(26, 51).map(function (n) { return ({ type: "breadboard", row: "+", col: "" + n }); }),
                    ground: pxsim.mkRange(26, 51).map(function (n) { return ({ type: "breadboard", row: "-", col: "" + n }); }),
                },
                bottom: {
                    fiveVolt: pxsim.mkRange(1, 26).map(function (n) { return ({ type: "breadboard", row: "+", col: "" + n }); }),
                    threeVolt: pxsim.mkRange(1, 26).map(function (n) { return ({ type: "breadboard", row: "+", col: "" + n }); }),
                    ground: pxsim.mkRange(1, 26).map(function (n) { return ({ type: "breadboard", row: "-", col: "" + n }); }),
                },
            };
            this.opts = opts;
        }
        Allocator.prototype.allocPartIRs = function (def, name, bbFit) {
            var _this = this;
            var partIRs = [];
            var mkIR = function (def, name, instPins, partParams) {
                var pinIRs = [];
                for (var i = 0; i < def.numberOfPins; i++) {
                    var pinDef = def.pinDefinitions[i];
                    var pinTarget = void 0;
                    if (typeof pinDef.target === "string") {
                        pinTarget = pinDef.target;
                    }
                    else {
                        var instIdx = pinDef.target.pinInstantiationIdx;
                        if (!(!!instPins && instPins[instIdx] !== undefined)) {
                            console.log("error: parts no pin found for PinInstantiationIdx: " + instIdx + ". (Is the part missing an ArgumentRole or \"trackArgs=\" annotations?)");
                            return undefined;
                        }
                        pinTarget = instPins[instIdx];
                    }
                    var pinLoc = def.visual.pinLocations[i];
                    var adjustedY = bbFit.yOffset + pinLoc.y;
                    var relativeRowIdx = Math.round(adjustedY / def.visual.pinDistance);
                    var relativeYOffset = adjustedY - relativeRowIdx * def.visual.pinDistance;
                    var adjustedX = bbFit.xOffset + pinLoc.x;
                    var relativeColIdx = Math.round(adjustedX / def.visual.pinDistance);
                    var relativeXOffset = adjustedX - relativeColIdx * def.visual.pinDistance;
                    var pinBBFit = {
                        partRelativeRowIdx: relativeRowIdx,
                        partRelativeColIdx: relativeColIdx,
                        xOffset: relativeXOffset,
                        yOffset: relativeYOffset
                    };
                    pinIRs.push({
                        def: pinDef,
                        loc: pinLoc,
                        target: pinTarget,
                        bbFit: pinBBFit,
                    });
                }
                return {
                    name: name,
                    def: def,
                    pins: pinIRs,
                    partParams: partParams || {},
                    bbFit: bbFit
                };
            };
            // support for multiple possible instantions
            var instantiations = def.instantiations || [];
            if (def.instantiation)
                instantiations.push(def.instantiation);
            instantiations.forEach(function (instantiation) {
                if (instantiation.kind === "singleton") {
                    partIRs.push(mkIR(def, name));
                }
                else if (instantiation.kind === "function") {
                    var fnAlloc_1 = instantiation;
                    var fnNms_1 = fnAlloc_1.fullyQualifiedName.split(',');
                    var callsitesTrackedArgsHash_1 = {};
                    fnNms_1.forEach(function (fnNm) { if (_this.opts.fnArgs[fnNm])
                        _this.opts.fnArgs[fnNm].forEach(function (targetArg) { callsitesTrackedArgsHash_1[targetArg] = 1; }); });
                    var callsitesTrackedArgs = Object.keys(callsitesTrackedArgsHash_1);
                    if (!(!!callsitesTrackedArgs && !!callsitesTrackedArgs.length)) {
                        console.log("error: parts failed to read pin(s) from callsite for: " + fnNms_1);
                        return undefined;
                    }
                    callsitesTrackedArgs.forEach(function (fnArgsStr) {
                        var fnArgsSplit = fnArgsStr.split(",");
                        if (fnArgsSplit.length != fnAlloc_1.argumentRoles.length) {
                            console.log("error: parts mismatch between number of arguments at callsite (function name: " + fnNms_1 + ") vs number of argument roles in part definition (part: " + name + ").");
                            return;
                        }
                        var instPins = [];
                        var paramArgs = {};
                        fnArgsSplit.forEach(function (arg, idx) {
                            var role = fnAlloc_1.argumentRoles[idx];
                            if (role.partParameter !== undefined) {
                                paramArgs[role.partParameter] = arg;
                            }
                            if (role.pinInstantiationIdx !== undefined) {
                                var instIdx = role.pinInstantiationIdx;
                                var pin = readPin(arg);
                                instPins[instIdx] = pin;
                            }
                        });
                        partIRs.push(mkIR(def, name, instPins, paramArgs));
                    });
                }
            });
            return partIRs.filter(function (ir) { return !!ir; });
        };
        Allocator.prototype.computePartDimensions = function (def, name) {
            var pinLocs = def.visual.pinLocations;
            var pinDefs = def.pinDefinitions;
            var numPins = def.numberOfPins;
            pxsim.U.assert(pinLocs.length === numPins, "Mismatch between \"numberOfPins\" and length of \"visual.pinLocations\" for \"" + name + "\"");
            pxsim.U.assert(pinDefs.length === numPins, "Mismatch between \"numberOfPins\" and length of \"pinDefinitions\" for \"" + name + "\"");
            pxsim.U.assert(numPins > 0, "Part \"" + name + "\" has no pins");
            var pins = pinLocs.map(function (loc, idx) { return merge3({ idx: idx }, loc, pinDefs[idx]); });
            var bbPins = pins.filter(function (p) { return p.orientation === "-Z"; });
            var hasBBPins = bbPins.length > 0;
            var pinDist = def.visual.pinDistance;
            var xOff;
            var yOff;
            var colCount;
            var rowCount;
            if (hasBBPins) {
                var refPin = bbPins[0];
                var refPinColIdx = Math.ceil(refPin.x / pinDist);
                var refPinRowIdx = Math.ceil(refPin.y / pinDist);
                xOff = refPinColIdx * pinDist - refPin.x;
                yOff = refPinRowIdx * pinDist - refPin.y;
                colCount = Math.ceil((xOff + def.visual.width) / pinDist) + 1;
                rowCount = Math.ceil((yOff + def.visual.height) / pinDist) + 1;
            }
            else {
                colCount = Math.ceil(def.visual.width / pinDist);
                rowCount = Math.ceil(def.visual.height / pinDist);
                xOff = colCount * pinDist - def.visual.width;
                yOff = rowCount * pinDist - def.visual.height;
            }
            return {
                xOffset: xOff,
                yOffset: yOff,
                rowCount: rowCount,
                colCount: colCount
            };
        };
        Allocator.prototype.allocColumns = function (colCounts) {
            var partsCount = colCounts.length;
            var totalColumnsCount = pxsim.visuals.BREADBOARD_MID_COLS; //TODO allow multiple breadboards
            var totalSpaceNeeded = colCounts.map(function (d) { return d.colCount; }).reduce(function (p, n) { return p + n; }, 0);
            var extraSpace = totalColumnsCount - totalSpaceNeeded;
            if (extraSpace <= 0) {
                console.log("Not enough breadboard space!");
                //TODO
            }
            var padding = Math.floor(extraSpace / (partsCount - 1 + 2));
            var partSpacing = padding; //Math.floor(extraSpace/(partsCount-1));
            var totalPartPadding = extraSpace - partSpacing * (partsCount - 1);
            var leftPadding = Math.floor(totalPartPadding / 2);
            var rightPadding = Math.ceil(totalPartPadding / 2);
            var nextAvailableCol = 1 + leftPadding;
            var partStartCol = colCounts.map(function (part) {
                var col = nextAvailableCol;
                nextAvailableCol += part.colCount + partSpacing;
                return col;
            });
            return partStartCol;
        };
        Allocator.prototype.placeParts = function (parts) {
            var totalRowsCount = pxsim.visuals.BREADBOARD_MID_ROWS + 2; // 10 letters + 2 for the middle gap
            var startColumnIndices = this.allocColumns(parts.map(function (p) { return p.bbFit; }));
            var startRowIndicies = parts.map(function (p) {
                var extraRows = totalRowsCount - p.bbFit.rowCount;
                var topPad = Math.floor(extraRows / 2);
                var startIdx = topPad;
                if (startIdx > 4)
                    startIdx = 4;
                if (startIdx < 1)
                    startIdx = 1;
                return startIdx;
            });
            var placements = parts.map(function (p, idx) {
                var row = startRowIndicies[idx];
                var col = startColumnIndices[idx];
                return merge2({ startColumnIdx: col, startRowIdx: row }, p);
            });
            return placements;
        };
        Allocator.prototype.nextColor = function () {
            if (!this.availableWireColors || this.availableWireColors.length <= 0) {
                this.availableWireColors = pxsim.visuals.GPIO_WIRE_COLORS.map(function (c) { return c; });
            }
            return this.availableWireColors.pop();
        };
        Allocator.prototype.allocWireIRs = function (part) {
            var _this = this;
            var groupToColor = [];
            var wires = part.pins.map(function (pin, pinIdx) {
                var end = pin.target;
                var start;
                var colIdx = part.startColumnIdx + pin.bbFit.partRelativeColIdx;
                var colName = pxsim.visuals.getColumnName(colIdx);
                var pinRowIdx = part.startRowIdx + pin.bbFit.partRelativeRowIdx;
                if (pinRowIdx >= 7)
                    pinRowIdx -= 2;
                if (isConnectedToBB(pin.def)) {
                    //make a wire from bb top or bottom to target
                    var connectedToTop = pinRowIdx < 5;
                    var rowName = connectedToTop ? "j" : "a";
                    start = {
                        type: "breadboard",
                        row: rowName,
                        col: colName,
                        style: pin.def.style
                    };
                }
                else {
                    //make a wire directly from pin to target
                    var rowName = pxsim.visuals.getRowName(pinRowIdx);
                    start = {
                        type: "breadboard",
                        row: rowName,
                        col: colName,
                        xOffset: pin.bbFit.xOffset / part.def.visual.pinDistance,
                        yOffset: pin.bbFit.yOffset / part.def.visual.pinDistance,
                        style: pin.def.style
                    };
                }
                var color;
                if (end === "ground") {
                    color = GROUND_COLOR;
                }
                else if (end === "threeVolt") {
                    color = POWER_COLOR;
                }
                else if (end === "fiveVolt") {
                    color = POWER5V_COLOR;
                }
                else if (typeof pin.def.colorGroup === "number") {
                    if (groupToColor[pin.def.colorGroup]) {
                        color = groupToColor[pin.def.colorGroup];
                    }
                    else {
                        color = groupToColor[pin.def.colorGroup] = _this.nextColor();
                    }
                }
                else {
                    color = _this.nextColor();
                }
                return {
                    start: start,
                    end: end,
                    color: color,
                    pinIdx: pinIdx,
                };
            });
            return merge2(part, { wires: wires });
        };
        Allocator.prototype.allocLocation = function (location, opts) {
            var _this = this;
            if (location === "ground" || location === "threeVolt" || location == "fiveVolt") {
                //special case if there is only a single ground or three volt pin in the whole build
                if (location === "ground" && this.powerUsage.singleGround) {
                    var boardGroundPin = this.getBoardGroundPin();
                    return { type: "dalboard", pin: boardGroundPin };
                }
                else if (location === "threeVolt" && this.powerUsage.singleThreeVolt) {
                    var boardThreeVoltPin = this.getBoardThreeVoltPin();
                    return { type: "dalboard", pin: boardThreeVoltPin };
                }
                else if (location === "fiveVolt" && this.powerUsage.singleFiveVolt) {
                    var boardFiveVoltPin = this.getBoardFiveVoltPin();
                    return { type: "dalboard", pin: boardFiveVoltPin };
                }
                pxsim.U.assert(!!opts.referenceBBPin);
                var nearestCoord = this.opts.getBBCoord(opts.referenceBBPin);
                var firstTopAndBot = [
                    this.availablePowerPins.top.ground[0] || this.availablePowerPins.top.threeVolt[0],
                    this.availablePowerPins.bottom.ground[0] || this.availablePowerPins.bottom.threeVolt[0]
                ].map(function (loc) {
                    return _this.opts.getBBCoord(loc);
                });
                if (!firstTopAndBot[0] || !firstTopAndBot[1]) {
                    console.debug("No more available \"" + location + "\" locations!");
                    //TODO
                }
                var nearTop = pxsim.visuals.findClosestCoordIdx(nearestCoord, firstTopAndBot) == 0;
                var barPins = void 0;
                if (nearTop) {
                    if (location === "ground") {
                        barPins = this.availablePowerPins.top.ground;
                    }
                    else if (location === "threeVolt") {
                        barPins = this.availablePowerPins.top.threeVolt;
                    }
                    else if (location === "fiveVolt") {
                        barPins = this.availablePowerPins.top.fiveVolt;
                    }
                }
                else {
                    if (location === "ground") {
                        barPins = this.availablePowerPins.bottom.ground;
                    }
                    else if (location === "threeVolt") {
                        barPins = this.availablePowerPins.bottom.threeVolt;
                    }
                    else if (location === "fiveVolt") {
                        barPins = this.availablePowerPins.bottom.fiveVolt;
                    }
                }
                var pinCoords = barPins.map(function (rowCol) {
                    return _this.opts.getBBCoord(rowCol);
                });
                var closestPinIdx = pxsim.visuals.findClosestCoordIdx(nearestCoord, pinCoords);
                var pin = barPins[closestPinIdx];
                if (nearTop) {
                    this.availablePowerPins.top.ground.splice(closestPinIdx, 1);
                    this.availablePowerPins.top.threeVolt.splice(closestPinIdx, 1);
                }
                else {
                    this.availablePowerPins.bottom.ground.splice(closestPinIdx, 1);
                    this.availablePowerPins.bottom.threeVolt.splice(closestPinIdx, 1);
                }
                return pin;
            }
            else if (location.type === "breadboard") {
                return location;
            }
            else if (location === "MOSI" || location === "MISO" || location === "SCK") {
                if (!this.opts.boardDef.spiPins)
                    console.debug("No SPI pin mappings found!");
                var pin = this.opts.boardDef.spiPins[location];
                return { type: "dalboard", pin: pin };
            }
            else if (location === "SDA" || location === "SCL") {
                if (!this.opts.boardDef.i2cPins)
                    console.debug("No I2C pin mappings found!");
                var pin = this.opts.boardDef.i2cPins[location];
                return { type: "dalboard", pin: pin };
            }
            else {
                //it must be a MicrobitPin
                pxsim.U.assert(typeof location === "string", "Unknown location type: " + location);
                var mbPin = location;
                var boardPin = this.opts.boardDef.gpioPinMap[mbPin] || mbPin;
                if (!boardPin) {
                    console.debug("unknown pin location for " + mbPin);
                    return undefined;
                }
                return { type: "dalboard", pin: boardPin };
            }
        };
        Allocator.prototype.getBoardGroundPin = function () {
            var pin = this.opts.boardDef.groundPins && this.opts.boardDef.groundPins[0] || null;
            if (!pin) {
                console.debug("No available ground pin on board!");
                //TODO
            }
            return pin;
        };
        Allocator.prototype.getBoardThreeVoltPin = function () {
            var pin = this.opts.boardDef.threeVoltPins && this.opts.boardDef.threeVoltPins[0] || null;
            if (!pin) {
                console.debug("No available 3.3V pin on board!");
                //TODO
            }
            return pin;
        };
        Allocator.prototype.getBoardFiveVoltPin = function () {
            var pin = this.opts.boardDef.fiveVoltPins && this.opts.boardDef.fiveVoltPins[0] || null;
            if (!pin) {
                console.debug("No available 5V pin on board!");
                //TODO
            }
            return pin;
        };
        Allocator.prototype.allocPowerWires = function (powerUsage) {
            var boardGroundPin = this.getBoardGroundPin();
            var threeVoltPin = this.getBoardThreeVoltPin();
            var fiveVoltPin = this.getBoardFiveVoltPin();
            var topLeft = { type: "breadboard", row: "-", col: "26" };
            var botLeft = { type: "breadboard", row: "-", col: "1" };
            var topRight = { type: "breadboard", row: "-", col: "50" };
            var botRight = { type: "breadboard", row: "-", col: "25" };
            var top, bot;
            if (this.opts.boardDef.attachPowerOnRight) {
                top = topRight;
                bot = botRight;
            }
            else {
                top = topLeft;
                bot = botLeft;
            }
            var groundWires = [];
            var threeVoltWires = [];
            var fiveVoltWires = [];
            if (powerUsage.bottomGround && powerUsage.topGround) {
                //bb top - <==> bb bot -
                groundWires.push({
                    start: this.allocLocation("ground", { referenceBBPin: top }),
                    end: this.allocLocation("ground", { referenceBBPin: bot }),
                    color: GROUND_COLOR,
                });
            }
            if (powerUsage.topGround) {
                //board - <==> bb top -
                groundWires.push({
                    start: this.allocLocation("ground", { referenceBBPin: top }),
                    end: { type: "dalboard", pin: boardGroundPin },
                    color: GROUND_COLOR,
                });
            }
            else if (powerUsage.bottomGround) {
                //board - <==> bb bot -
                groundWires.push({
                    start: this.allocLocation("ground", { referenceBBPin: bot }),
                    end: { type: "dalboard", pin: boardGroundPin },
                    color: GROUND_COLOR,
                });
            }
            if (powerUsage.bottomThreeVolt && powerUsage.bottomGround) {
                //bb top + <==> bb bot +
                threeVoltWires.push({
                    start: this.allocLocation("threeVolt", { referenceBBPin: top }),
                    end: this.allocLocation("threeVolt", { referenceBBPin: bot }),
                    color: POWER_COLOR,
                });
            }
            else if (powerUsage.bottomFiveVolt && powerUsage.bottomGround) {
                //bb top + <==> bb bot +
                fiveVoltWires.push({
                    start: this.allocLocation("fiveVolt", { referenceBBPin: top }),
                    end: this.allocLocation("fiveVolt", { referenceBBPin: bot }),
                    color: POWER5V_COLOR,
                });
            }
            if (powerUsage.topThreeVolt) {
                //board + <==> bb top +
                threeVoltWires.push({
                    start: this.allocLocation("threeVolt", { referenceBBPin: top }),
                    end: { type: "dalboard", pin: threeVoltPin },
                    color: POWER_COLOR,
                });
            }
            else if (powerUsage.bottomThreeVolt) {
                //board + <==> bb bot +
                threeVoltWires.push({
                    start: this.allocLocation("threeVolt", { referenceBBPin: bot }),
                    end: { type: "dalboard", pin: threeVoltPin },
                    color: POWER5V_COLOR,
                });
            }
            if (powerUsage.topFiveVolt && !powerUsage.topThreeVolt) {
                //board + <==> bb top +
                fiveVoltWires.push({
                    start: this.allocLocation("fiveVolt", { referenceBBPin: top }),
                    end: { type: "dalboard", pin: fiveVoltPin },
                    color: POWER_COLOR,
                });
            }
            else if (powerUsage.bottomFiveVolt && !powerUsage.bottomThreeVolt) {
                //board + <==> bb bot +
                fiveVoltWires.push({
                    start: this.allocLocation("fiveVolt", { referenceBBPin: bot }),
                    end: { type: "dalboard", pin: fiveVoltPin },
                    color: POWER5V_COLOR,
                });
            }
            var assembly = [];
            if (groundWires.length > 0)
                assembly.push({ wireIndices: groundWires.map(function (w, i) { return i; }) });
            var numGroundWires = groundWires.length;
            if (threeVoltWires.length > 0)
                assembly.push({
                    wireIndices: threeVoltWires.map(function (w, i) { return i + numGroundWires; })
                });
            if (fiveVoltWires.length > 0)
                assembly.push({
                    wireIndices: threeVoltWires.map(function (w, i) { return i + numGroundWires + threeVoltWires.length; })
                });
            return {
                wires: groundWires.concat(threeVoltWires).concat(fiveVoltWires),
                assembly: assembly
            };
        };
        Allocator.prototype.allocWire = function (wireIR) {
            var _this = this;
            var ends = [wireIR.start, wireIR.end];
            var endIsPower = ends.map(function (e) { return e === "ground" || e === "threeVolt" || e === "fiveVolt"; });
            //allocate non-power first so we know the nearest pin for the power end
            var endInsts = ends.map(function (e, idx) { return !endIsPower[idx] ? _this.allocLocation(e, {}) : undefined; });
            //allocate power pins closest to the other end of the wire
            endInsts = endInsts.map(function (e, idx) {
                if (e)
                    return e;
                var locInst = endInsts[1 - idx]; // non-power end
                var l = _this.allocLocation(ends[idx], {
                    referenceBBPin: locInst,
                });
                return l;
            });
            // one of the pins is not accessible
            if (!endInsts[0] || !endInsts[1])
                return undefined;
            return { start: endInsts[0], end: endInsts[1], color: wireIR.color };
        };
        Allocator.prototype.allocPart = function (ir) {
            var bbConnections = ir.pins
                .filter(function (p) { return isConnectedToBB(p.def); })
                .map(function (p) {
                var rowIdx = ir.startRowIdx + p.bbFit.partRelativeRowIdx;
                if (rowIdx >= 7)
                    rowIdx -= 2;
                var rowName = pxsim.visuals.getRowName(rowIdx);
                var colIdx = ir.startColumnIdx + p.bbFit.partRelativeColIdx;
                var colName = pxsim.visuals.getColumnName(colIdx);
                return {
                    type: "breadboard",
                    row: rowName,
                    col: colName,
                };
            });
            var part = {
                name: ir.name,
                visual: ir.def.visual,
                bbFit: ir.bbFit,
                startColumnIdx: ir.startColumnIdx,
                startRowIdx: ir.startRowIdx,
                breadboardConnections: bbConnections,
                params: ir.partParams,
                simulationBehavior: ir.def.simulationBehavior
            };
            return part;
        };
        Allocator.prototype.allocAll = function () {
            var _this = this;
            var partNmAndDefs = this.opts.partsList
                .map(function (partName) { return { name: partName, def: _this.opts.partDefs[partName] }; })
                .filter(function (d) { return !!d.def; });
            if (partNmAndDefs.length > 0) {
                var dimensions_1 = partNmAndDefs.map(function (nmAndPart) { return _this.computePartDimensions(nmAndPart.def, nmAndPart.name); });
                var partIRs_1 = [];
                partNmAndDefs.forEach(function (nmAndDef, idx) {
                    var dims = dimensions_1[idx];
                    var irs = _this.allocPartIRs(nmAndDef.def, nmAndDef.name, dims);
                    partIRs_1 = partIRs_1.concat(irs);
                });
                var partPlacements = this.placeParts(partIRs_1);
                var partsAndWireIRs = partPlacements.map(function (p) { return _this.allocWireIRs(p); });
                var allWireIRs = partsAndWireIRs.map(function (p) { return p.wires; }).reduce(function (p, n) { return p.concat(n); }, []);
                var allPowerUsage = allWireIRs.map(function (w) { return computePowerUsage(w); });
                this.powerUsage = mergePowerUsage(allPowerUsage);
                var basicWires = this.allocPowerWires(this.powerUsage);
                var partsAndWires = partsAndWireIRs.map(function (irs, idx) {
                    var part = _this.allocPart(irs);
                    var wires = irs.wires.map(function (w) { return _this.allocWire(w); });
                    if (wires.some(function (w) { return !w; }))
                        return undefined;
                    var pinIdxToWireIdx = [];
                    irs.wires.forEach(function (wIR, idx) {
                        pinIdxToWireIdx[wIR.pinIdx] = idx;
                    });
                    var assembly = irs.def.assembly.map(function (stepDef) {
                        return {
                            part: stepDef.part,
                            wireIndices: (stepDef.pinIndices || []).map(function (i) { return pinIdxToWireIdx[i]; })
                        };
                    });
                    return {
                        part: part,
                        wires: wires,
                        assembly: assembly
                    };
                }).filter(function (p) { return !!p; });
                var all = [basicWires].concat(partsAndWires)
                    .filter(function (pw) { return pw.assembly && pw.assembly.length; }); // only keep steps with something to do
                // hide breadboard if not used
                var hideBreadboard = !all.some(function (r) {
                    return (r.part && r.part.breadboardConnections && r.part.breadboardConnections.length > 0)
                        || r.wires && r.wires.some(function (w) { return (w.end.type == "breadboard" && w.end.style != "croc") || (w.start.type == "breadboard" && w.start.style != "croc"); });
                });
                return {
                    partsAndWires: all,
                    wires: [],
                    parts: [],
                    hideBreadboard: hideBreadboard
                };
            }
            else {
                return {
                    partsAndWires: [],
                    wires: [],
                    parts: []
                };
            }
        };
        return Allocator;
    }());
    function allocateDefinitions(opts) {
        return new Allocator(opts).allocAll();
    }
    pxsim.allocateDefinitions = allocateDefinitions;
})(pxsim || (pxsim = {}));
/// <reference path="../localtypings/vscode-debug-protocol.d.ts" />
/**
 * Heavily adapted from https://github.com/Microsoft/vscode-debugadapter-node
 * and altered to run in a browser and communcate via JSON over a websocket
 * rather than through stdin and stdout
 */
var pxsim;
(function (pxsim) {
    var protocol;
    (function (protocol) {
        var Message = /** @class */ (function () {
            function Message(type) {
                this.seq = 0;
                this.type = type;
            }
            return Message;
        }());
        protocol.Message = Message;
        var Response = /** @class */ (function (_super) {
            __extends(Response, _super);
            function Response(request, message) {
                var _this = _super.call(this, 'response') || this;
                _this.request_seq = request.seq;
                _this.command = request.command;
                if (message) {
                    _this.success = false;
                    _this.message = message;
                }
                else {
                    _this.success = true;
                }
                return _this;
            }
            return Response;
        }(Message));
        protocol.Response = Response;
        var Event = /** @class */ (function (_super) {
            __extends(Event, _super);
            function Event(event, body) {
                var _this = _super.call(this, 'event') || this;
                _this.event = event;
                if (body) {
                    _this.body = body;
                }
                return _this;
            }
            return Event;
        }(Message));
        protocol.Event = Event;
        var Source = /** @class */ (function () {
            function Source(name, path, id, origin, data) {
                if (id === void 0) { id = 0; }
                this.name = name;
                this.path = path;
                this.sourceReference = id;
                if (origin) {
                    this.origin = origin;
                }
                if (data) {
                    this.adapterData = data;
                }
            }
            return Source;
        }());
        protocol.Source = Source;
        var Scope = /** @class */ (function () {
            function Scope(name, reference, expensive) {
                if (expensive === void 0) { expensive = false; }
                this.name = name;
                this.variablesReference = reference;
                this.expensive = expensive;
            }
            return Scope;
        }());
        protocol.Scope = Scope;
        var StackFrame = /** @class */ (function () {
            function StackFrame(i, nm, src, ln, col) {
                if (ln === void 0) { ln = 0; }
                if (col === void 0) { col = 0; }
                this.id = i;
                this.source = src;
                this.line = ln;
                this.column = col;
                this.name = nm;
            }
            return StackFrame;
        }());
        protocol.StackFrame = StackFrame;
        var Thread = /** @class */ (function () {
            function Thread(id, name) {
                this.id = id;
                if (name) {
                    this.name = name;
                }
                else {
                    this.name = 'Thread #' + id;
                }
            }
            return Thread;
        }());
        protocol.Thread = Thread;
        var Variable = /** @class */ (function () {
            function Variable(name, value, ref, indexedVariables, namedVariables) {
                if (ref === void 0) { ref = 0; }
                this.name = name;
                this.value = value;
                this.variablesReference = ref;
                if (typeof namedVariables === 'number') {
                    this.namedVariables = namedVariables;
                }
                if (typeof indexedVariables === 'number') {
                    this.indexedVariables = indexedVariables;
                }
            }
            return Variable;
        }());
        protocol.Variable = Variable;
        var Breakpoint = /** @class */ (function () {
            function Breakpoint(verified, line, column, source) {
                this.verified = verified;
                var e = this;
                if (typeof line === 'number') {
                    e.line = line;
                }
                if (typeof column === 'number') {
                    e.column = column;
                }
                if (source) {
                    e.source = source;
                }
            }
            return Breakpoint;
        }());
        protocol.Breakpoint = Breakpoint;
        var Module = /** @class */ (function () {
            function Module(id, name) {
                this.id = id;
                this.name = name;
            }
            return Module;
        }());
        protocol.Module = Module;
        var CompletionItem = /** @class */ (function () {
            function CompletionItem(label, start, length) {
                if (length === void 0) { length = 0; }
                this.label = label;
                this.start = start;
                this.length = length;
            }
            return CompletionItem;
        }());
        protocol.CompletionItem = CompletionItem;
        var StoppedEvent = /** @class */ (function (_super) {
            __extends(StoppedEvent, _super);
            function StoppedEvent(reason, threadId, exception_text) {
                if (exception_text === void 0) { exception_text = null; }
                var _this = _super.call(this, 'stopped') || this;
                _this.body = {
                    reason: reason,
                    threadId: threadId
                };
                if (exception_text) {
                    var e = _this;
                    e.body.text = exception_text;
                }
                return _this;
            }
            return StoppedEvent;
        }(Event));
        protocol.StoppedEvent = StoppedEvent;
        var ContinuedEvent = /** @class */ (function (_super) {
            __extends(ContinuedEvent, _super);
            function ContinuedEvent(threadId, allThreadsContinued) {
                var _this = _super.call(this, 'continued') || this;
                _this.body = {
                    threadId: threadId
                };
                if (typeof allThreadsContinued === 'boolean') {
                    _this.body.allThreadsContinued = allThreadsContinued;
                }
                return _this;
            }
            return ContinuedEvent;
        }(Event));
        protocol.ContinuedEvent = ContinuedEvent;
        var InitializedEvent = /** @class */ (function (_super) {
            __extends(InitializedEvent, _super);
            function InitializedEvent() {
                return _super.call(this, 'initialized') || this;
            }
            return InitializedEvent;
        }(Event));
        protocol.InitializedEvent = InitializedEvent;
        var TerminatedEvent = /** @class */ (function (_super) {
            __extends(TerminatedEvent, _super);
            function TerminatedEvent(restart) {
                var _this = _super.call(this, 'terminated') || this;
                if (typeof restart === 'boolean') {
                    var e = _this;
                    e.body = {
                        restart: restart
                    };
                }
                return _this;
            }
            return TerminatedEvent;
        }(Event));
        protocol.TerminatedEvent = TerminatedEvent;
        var OutputEvent = /** @class */ (function (_super) {
            __extends(OutputEvent, _super);
            function OutputEvent(output, category, data) {
                if (category === void 0) { category = 'console'; }
                var _this = _super.call(this, 'output') || this;
                _this.body = {
                    category: category,
                    output: output
                };
                if (data !== undefined) {
                    _this.body.data = data;
                }
                return _this;
            }
            return OutputEvent;
        }(Event));
        protocol.OutputEvent = OutputEvent;
        var ThreadEvent = /** @class */ (function (_super) {
            __extends(ThreadEvent, _super);
            function ThreadEvent(reason, threadId) {
                var _this = _super.call(this, 'thread') || this;
                _this.body = {
                    reason: reason,
                    threadId: threadId
                };
                return _this;
            }
            return ThreadEvent;
        }(Event));
        protocol.ThreadEvent = ThreadEvent;
        var BreakpointEvent = /** @class */ (function (_super) {
            __extends(BreakpointEvent, _super);
            function BreakpointEvent(reason, breakpoint) {
                var _this = _super.call(this, 'breakpoint') || this;
                _this.body = {
                    reason: reason,
                    breakpoint: breakpoint
                };
                return _this;
            }
            return BreakpointEvent;
        }(Event));
        protocol.BreakpointEvent = BreakpointEvent;
        var ModuleEvent = /** @class */ (function (_super) {
            __extends(ModuleEvent, _super);
            function ModuleEvent(reason, module) {
                var _this = _super.call(this, 'module') || this;
                _this.body = {
                    reason: reason,
                    module: module
                };
                return _this;
            }
            return ModuleEvent;
        }(Event));
        protocol.ModuleEvent = ModuleEvent;
        var ProtocolServer = /** @class */ (function () {
            function ProtocolServer() {
                this._pendingRequests = {};
            }
            ProtocolServer.prototype.start = function (host) {
                var _this = this;
                this._sequence = 1;
                this.host = host;
                this.host.onData(function (msg) {
                    if (msg.type === 'request') {
                        _this.dispatchRequest(msg);
                    }
                    else if (msg.type === 'response') {
                        var response = msg;
                        var clb = _this._pendingRequests[response.seq];
                        if (clb) {
                            delete _this._pendingRequests[response.seq];
                            clb(response);
                        }
                    }
                });
            };
            ProtocolServer.prototype.stop = function () {
                if (this.host) {
                    this.host.close();
                }
            };
            ProtocolServer.prototype.sendEvent = function (event) {
                this.send('event', event);
            };
            ProtocolServer.prototype.sendResponse = function (response) {
                if (response.seq > 0) {
                    console.error("attempt to send more than one response for command " + response.command);
                }
                else {
                    this.send('response', response);
                }
            };
            ProtocolServer.prototype.sendRequest = function (command, args, timeout, cb) {
                var _this = this;
                var request = {
                    command: command
                };
                if (args && Object.keys(args).length > 0) {
                    request.arguments = args;
                }
                this.send('request', request);
                if (cb) {
                    this._pendingRequests[request.seq] = cb;
                    var timer_1 = setTimeout(function () {
                        clearTimeout(timer_1);
                        var clb = _this._pendingRequests[request.seq];
                        if (clb) {
                            delete _this._pendingRequests[request.seq];
                            clb(new protocol.Response(request, 'timeout'));
                        }
                    }, timeout);
                }
            };
            ProtocolServer.prototype.send = function (typ, message) {
                message.type = typ;
                message.seq = this._sequence++;
                if (this.host) {
                    var json = JSON.stringify(message);
                    this.host.send(json);
                }
            };
            // ---- protected ----------------------------------------------------------
            ProtocolServer.prototype.dispatchRequest = function (request) {
            };
            return ProtocolServer;
        }());
        protocol.ProtocolServer = ProtocolServer;
        var DebugSession = /** @class */ (function (_super) {
            __extends(DebugSession, _super);
            function DebugSession() {
                var _this = _super !== null && _super.apply(this, arguments) || this;
                _this._debuggerLinesStartAt1 = false;
                _this._debuggerColumnsStartAt1 = false;
                _this._clientLinesStartAt1 = true;
                _this._clientColumnsStartAt1 = true;
                return _this;
            }
            DebugSession.prototype.shutdown = function () {
            };
            DebugSession.prototype.dispatchRequest = function (request) {
                var response = new protocol.Response(request);
                try {
                    if (request.command === 'initialize') {
                        var args = request.arguments;
                        if (typeof args.linesStartAt1 === 'boolean') {
                            this._clientLinesStartAt1 = args.linesStartAt1;
                        }
                        if (typeof args.columnsStartAt1 === 'boolean') {
                            this._clientColumnsStartAt1 = args.columnsStartAt1;
                        }
                        if (args.pathFormat !== 'path') {
                            this.sendErrorResponse(response, 2018, 'debug adapter only supports native paths', null);
                        }
                        else {
                            var initializeResponse = response;
                            initializeResponse.body = {};
                            this.initializeRequest(initializeResponse, args);
                        }
                    }
                    else if (request.command === 'launch') {
                        this.launchRequest(response, request.arguments);
                    }
                    else if (request.command === 'attach') {
                        this.attachRequest(response, request.arguments);
                    }
                    else if (request.command === 'disconnect') {
                        this.disconnectRequest(response, request.arguments);
                    }
                    else if (request.command === 'setBreakpoints') {
                        this.setBreakPointsRequest(response, request.arguments);
                    }
                    else if (request.command === 'setFunctionBreakpoints') {
                        this.setFunctionBreakPointsRequest(response, request.arguments);
                    }
                    else if (request.command === 'setExceptionBreakpoints') {
                        this.setExceptionBreakPointsRequest(response, request.arguments);
                    }
                    else if (request.command === 'configurationDone') {
                        this.configurationDoneRequest(response, request.arguments);
                    }
                    else if (request.command === 'continue') {
                        this.continueRequest(response, request.arguments);
                    }
                    else if (request.command === 'next') {
                        this.nextRequest(response, request.arguments);
                    }
                    else if (request.command === 'stepIn') {
                        this.stepInRequest(response, request.arguments);
                    }
                    else if (request.command === 'stepOut') {
                        this.stepOutRequest(response, request.arguments);
                    }
                    else if (request.command === 'stepBack') {
                        this.stepBackRequest(response, request.arguments);
                    }
                    else if (request.command === 'restartFrame') {
                        this.restartFrameRequest(response, request.arguments);
                    }
                    else if (request.command === 'goto') {
                        this.gotoRequest(response, request.arguments);
                    }
                    else if (request.command === 'pause') {
                        this.pauseRequest(response, request.arguments);
                    }
                    else if (request.command === 'stackTrace') {
                        this.stackTraceRequest(response, request.arguments);
                    }
                    else if (request.command === 'scopes') {
                        this.scopesRequest(response, request.arguments);
                    }
                    else if (request.command === 'variables') {
                        this.variablesRequest(response, request.arguments);
                    }
                    else if (request.command === 'setVariable') {
                        this.setVariableRequest(response, request.arguments);
                    }
                    else if (request.command === 'source') {
                        this.sourceRequest(response, request.arguments);
                    }
                    else if (request.command === 'threads') {
                        this.threadsRequest(response);
                    }
                    else if (request.command === 'evaluate') {
                        this.evaluateRequest(response, request.arguments);
                    }
                    else if (request.command === 'stepInTargets') {
                        this.stepInTargetsRequest(response, request.arguments);
                    }
                    else if (request.command === 'gotoTargets') {
                        this.gotoTargetsRequest(response, request.arguments);
                    }
                    else if (request.command === 'completions') {
                        this.completionsRequest(response, request.arguments);
                    }
                    else {
                        this.customRequest(request.command, response, request.arguments);
                    }
                }
                catch (e) {
                    this.sendErrorResponse(response, 1104, '{_stack}', { _exception: e.message, _stack: e.stack });
                }
            };
            DebugSession.prototype.initializeRequest = function (response, args) {
                // This default debug adapter does not support conditional breakpoints.
                response.body.supportsConditionalBreakpoints = false;
                // This default debug adapter does not support hit conditional breakpoints.
                response.body.supportsHitConditionalBreakpoints = false;
                // This default debug adapter does not support function breakpoints.
                response.body.supportsFunctionBreakpoints = false;
                // This default debug adapter implements the 'configurationDone' request.
                response.body.supportsConfigurationDoneRequest = true;
                // This default debug adapter does not support hovers based on the 'evaluate' request.
                response.body.supportsEvaluateForHovers = false;
                // This default debug adapter does not support the 'stepBack' request.
                response.body.supportsStepBack = false;
                // This default debug adapter does not support the 'setVariable' request.
                response.body.supportsSetVariable = false;
                // This default debug adapter does not support the 'restartFrame' request.
                response.body.supportsRestartFrame = false;
                // This default debug adapter does not support the 'stepInTargetsRequest' request.
                response.body.supportsStepInTargetsRequest = false;
                // This default debug adapter does not support the 'gotoTargetsRequest' request.
                response.body.supportsGotoTargetsRequest = false;
                // This default debug adapter does not support the 'completionsRequest' request.
                response.body.supportsCompletionsRequest = false;
                this.sendResponse(response);
            };
            DebugSession.prototype.disconnectRequest = function (response, args) {
                this.sendResponse(response);
                this.shutdown();
            };
            DebugSession.prototype.launchRequest = function (response, args) {
                this.sendResponse(response);
            };
            DebugSession.prototype.attachRequest = function (response, args) {
                this.sendResponse(response);
            };
            DebugSession.prototype.setBreakPointsRequest = function (response, args) {
                this.sendResponse(response);
            };
            DebugSession.prototype.setFunctionBreakPointsRequest = function (response, args) {
                this.sendResponse(response);
            };
            DebugSession.prototype.setExceptionBreakPointsRequest = function (response, args) {
                this.sendResponse(response);
            };
            DebugSession.prototype.configurationDoneRequest = function (response, args) {
                this.sendResponse(response);
            };
            DebugSession.prototype.continueRequest = function (response, args) {
                this.sendResponse(response);
            };
            DebugSession.prototype.nextRequest = function (response, args) {
                this.sendResponse(response);
            };
            DebugSession.prototype.stepInRequest = function (response, args) {
                this.sendResponse(response);
            };
            DebugSession.prototype.stepOutRequest = function (response, args) {
                this.sendResponse(response);
            };
            DebugSession.prototype.stepBackRequest = function (response, args) {
                this.sendResponse(response);
            };
            DebugSession.prototype.restartFrameRequest = function (response, args) {
                this.sendResponse(response);
            };
            DebugSession.prototype.gotoRequest = function (response, args) {
                this.sendResponse(response);
            };
            DebugSession.prototype.pauseRequest = function (response, args) {
                this.sendResponse(response);
            };
            DebugSession.prototype.sourceRequest = function (response, args) {
                this.sendResponse(response);
            };
            DebugSession.prototype.threadsRequest = function (response) {
                this.sendResponse(response);
            };
            DebugSession.prototype.stackTraceRequest = function (response, args) {
                this.sendResponse(response);
            };
            DebugSession.prototype.scopesRequest = function (response, args) {
                this.sendResponse(response);
            };
            DebugSession.prototype.variablesRequest = function (response, args) {
                this.sendResponse(response);
            };
            DebugSession.prototype.setVariableRequest = function (response, args) {
                this.sendResponse(response);
            };
            DebugSession.prototype.evaluateRequest = function (response, args) {
                this.sendResponse(response);
            };
            DebugSession.prototype.stepInTargetsRequest = function (response, args) {
                this.sendResponse(response);
            };
            DebugSession.prototype.gotoTargetsRequest = function (response, args) {
                this.sendResponse(response);
            };
            DebugSession.prototype.completionsRequest = function (response, args) {
                this.sendResponse(response);
            };
            /**
             * Override this hook to implement custom requests.
             */
            DebugSession.prototype.customRequest = function (command, response, args) {
                this.sendErrorResponse(response, 1014, 'unrecognized request', null);
            };
            DebugSession.prototype.sendErrorResponse = function (response, codeOrMessage, format, variables) {
                var msg;
                if (typeof codeOrMessage === 'number') {
                    msg = {
                        id: codeOrMessage,
                        format: format
                    };
                    if (variables) {
                        msg.variables = variables;
                    }
                    msg.showUser = true;
                }
                else {
                    msg = codeOrMessage;
                }
                response.success = false;
                DebugSession.formatPII(msg.format, true, msg.variables);
                if (!response.body) {
                    response.body = {};
                }
                response.body.error = msg;
                this.sendResponse(response);
            };
            DebugSession.prototype.convertClientLineToDebugger = function (line) {
                if (this._debuggerLinesStartAt1) {
                    return this._clientLinesStartAt1 ? line : line + 1;
                }
                return this._clientLinesStartAt1 ? line - 1 : line;
            };
            DebugSession.prototype.convertDebuggerLineToClient = function (line) {
                if (this._debuggerLinesStartAt1) {
                    return this._clientLinesStartAt1 ? line : line - 1;
                }
                return this._clientLinesStartAt1 ? line + 1 : line;
            };
            DebugSession.prototype.convertClientColumnToDebugger = function (column) {
                if (this._debuggerColumnsStartAt1) {
                    return this._clientColumnsStartAt1 ? column : column + 1;
                }
                return this._clientColumnsStartAt1 ? column - 1 : column;
            };
            DebugSession.prototype.convertDebuggerColumnToClient = function (column) {
                if (this._debuggerColumnsStartAt1) {
                    return this._clientColumnsStartAt1 ? column : column - 1;
                }
                return this._clientColumnsStartAt1 ? column + 1 : column;
            };
            DebugSession.prototype.convertClientPathToDebugger = function (clientPath) {
                if (this._clientPathsAreURIs != this._debuggerPathsAreURIs) {
                    if (this._clientPathsAreURIs) {
                        return DebugSession.uri2path(clientPath);
                    }
                    else {
                        return DebugSession.path2uri(clientPath);
                    }
                }
                return clientPath;
            };
            DebugSession.prototype.convertDebuggerPathToClient = function (debuggerPath) {
                if (this._debuggerPathsAreURIs != this._clientPathsAreURIs) {
                    if (this._debuggerPathsAreURIs) {
                        return DebugSession.uri2path(debuggerPath);
                    }
                    else {
                        return DebugSession.path2uri(debuggerPath);
                    }
                }
                return debuggerPath;
            };
            DebugSession.path2uri = function (str) {
                var pathName = str.replace(/\\/g, '/');
                if (pathName[0] !== '/') {
                    pathName = '/' + pathName;
                }
                return encodeURI('file://' + pathName);
            };
            DebugSession.uri2path = function (url) {
                return url;
                //return Url.parse(url).pathname;
            };
            /*
            * If argument starts with '_' it is OK to send its value to telemetry.
            */
            DebugSession.formatPII = function (format, excludePII, args) {
                return format.replace(DebugSession._formatPIIRegexp, function (match, paramName) {
                    if (excludePII && paramName.length > 0 && paramName[0] !== '_') {
                        return match;
                    }
                    return args[paramName] && args.hasOwnProperty(paramName) ?
                        args[paramName] :
                        match;
                });
            };
            DebugSession._formatPIIRegexp = /{([^}]+)}/g;
            return DebugSession;
        }(ProtocolServer));
        protocol.DebugSession = DebugSession;
    })(protocol = pxsim.protocol || (pxsim.protocol = {}));
})(pxsim || (pxsim = {}));
var pxsim;
(function (pxsim) {
    var util;
    (function (util) {
        function injectPolyphils() {
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
            if (!String.prototype.startsWith) {
                Object.defineProperty(String.prototype, 'startsWith', {
                    value: function (search, pos) {
                        if (search === undefined || search == null)
                            return false;
                        pos = !pos || pos < 0 ? 0 : +pos;
                        return this.substring(pos, pos + search.length) === search;
                    }
                });
            }
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill
            if (!Array.prototype.fill) {
                Object.defineProperty(Array.prototype, 'fill', {
                    writable: true,
                    enumerable: true,
                    value: function (value) {
                        // Steps 1-2.
                        if (this == null) {
                            throw new TypeError('this is null or not defined');
                        }
                        var O = Object(this);
                        // Steps 3-5.
                        var len = O.length >>> 0;
                        // Steps 6-7.
                        var start = arguments[1];
                        var relativeStart = start >> 0;
                        // Step 8.
                        var k = relativeStart < 0 ?
                            Math.max(len + relativeStart, 0) :
                            Math.min(relativeStart, len);
                        // Steps 9-10.
                        var end = arguments[2];
                        var relativeEnd = end === undefined ?
                            len : end >> 0;
                        // Step 11.
                        var final = relativeEnd < 0 ?
                            Math.max(len + relativeEnd, 0) :
                            Math.min(relativeEnd, len);
                        // Step 12.
                        while (k < final) {
                            O[k] = value;
                            k++;
                        }
                        // Step 13.
                        return O;
                    }
                });
            }
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find
            if (!Array.prototype.find) {
                Object.defineProperty(Array.prototype, 'find', {
                    writable: true,
                    enumerable: true,
                    value: function (predicate) {
                        // 1. Let O be ? ToObject(this value).
                        if (this == null) {
                            throw new TypeError('"this" is null or not defined');
                        }
                        var o = Object(this);
                        // 2. Let len be ? ToLength(? Get(O, "length")).
                        var len = o.length >>> 0;
                        // 3. If IsCallable(predicate) is false, throw a TypeError exception.
                        if (typeof predicate !== 'function') {
                            throw new TypeError('predicate must be a function');
                        }
                        // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
                        var thisArg = arguments[1];
                        // 5. Let k be 0.
                        var k = 0;
                        // 6. Repeat, while k < len
                        while (k < len) {
                            // a. Let Pk be ! ToString(k).
                            // b. Let kValue be ? Get(O, Pk).
                            // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
                            // d. If testResult is true, return kValue.
                            var kValue = o[k];
                            if (predicate.call(thisArg, kValue, k, o)) {
                                return kValue;
                            }
                            // e. Increase k by 1.
                            k++;
                        }
                        // 7. Return undefined.
                        return undefined;
                    },
                });
            }
            // Polyfill for Uint8Array.slice for IE and Safari
            // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.slice
            // TODO: Move this polyfill to a more appropriate file. It is left here for now because moving it causes a crash in IE; see PXT issue #1301.
            if (!Uint8Array.prototype.slice) {
                Object.defineProperty(Uint8Array.prototype, 'slice', {
                    value: Array.prototype.slice,
                    writable: true,
                    enumerable: true
                });
            }
            if (!Uint16Array.prototype.slice) {
                Object.defineProperty(Uint16Array.prototype, 'slice', {
                    value: Array.prototype.slice,
                    writable: true,
                    enumerable: true
                });
            }
            if (!Uint32Array.prototype.slice) {
                Object.defineProperty(Uint32Array.prototype, 'slice', {
                    value: Array.prototype.slice,
                    writable: true,
                    enumerable: true
                });
            }
            // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.fill
            if (!Uint8Array.prototype.fill) {
                Object.defineProperty(Uint8Array.prototype, 'fill', {
                    value: Array.prototype.fill,
                    writable: true,
                    enumerable: true
                });
            }
            if (!Uint16Array.prototype.fill) {
                Object.defineProperty(Uint16Array.prototype, 'fill', {
                    value: Array.prototype.fill,
                    writable: true,
                    enumerable: true
                });
            }
            if (!Uint32Array.prototype.fill) {
                Object.defineProperty(Uint32Array.prototype, 'fill', {
                    value: Array.prototype.fill,
                    writable: true,
                    enumerable: true
                });
            }
            // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.some
            if (!Uint8Array.prototype.some) {
                Object.defineProperty(Uint8Array.prototype, 'some', {
                    value: Array.prototype.some,
                    writable: true,
                    enumerable: true
                });
            }
            if (!Uint16Array.prototype.some) {
                Object.defineProperty(Uint16Array.prototype, 'some', {
                    value: Array.prototype.some,
                    writable: true,
                    enumerable: true
                });
            }
            if (!Uint32Array.prototype.some) {
                Object.defineProperty(Uint32Array.prototype, 'some', {
                    value: Array.prototype.some,
                    writable: true,
                    enumerable: true
                });
            }
            // https://tc39.github.io/ecma262/#sec-%typedarray%.prototype.reverse
            if (!Uint8Array.prototype.reverse) {
                Object.defineProperty(Uint8Array.prototype, 'reverse', {
                    value: Array.prototype.reverse,
                    writable: true,
                    enumerable: true
                });
            }
            if (!Uint16Array.prototype.reverse) {
                Object.defineProperty(Uint16Array.prototype, 'reverse', {
                    value: Array.prototype.reverse,
                    writable: true,
                    enumerable: true
                });
            }
            if (!Uint32Array.prototype.reverse) {
                Object.defineProperty(Uint32Array.prototype, 'reverse', {
                    value: Array.prototype.reverse,
                    writable: true,
                    enumerable: true
                });
            }
            // Inject Math imul polyfill
            if (!Math.imul) {
                // for explanations see:
                // http://stackoverflow.com/questions/3428136/javascript-integer-math-incorrect-results (second answer)
                // (but the code below doesn't come from there; I wrote it myself)
                // TODO use Math.imul if available
                Math.imul = function (a, b) {
                    var ah = (a >>> 16) & 0xffff;
                    var al = a & 0xffff;
                    var bh = (b >>> 16) & 0xffff;
                    var bl = b & 0xffff;
                    // the shift by 0 fixes the sign on the high part
                    // the final |0 converts the unsigned value into a signed value
                    return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0) | 0);
                };
            }
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign#Polyfill
            if (typeof Object.assign != 'function') {
                // Must be writable: true, enumerable: false, configurable: true
                Object.defineProperty(Object, "assign", {
                    value: function assign(target, varArgs) {
                        'use strict';
                        if (target == null) {
                            throw new TypeError('Cannot convert undefined or null to object');
                        }
                        var to = Object(target);
                        for (var index = 1; index < arguments.length; index++) {
                            var nextSource = arguments[index];
                            if (nextSource != null) {
                                for (var nextKey in nextSource) {
                                    // Avoid bugs when hasOwnProperty is shadowed
                                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                                        to[nextKey] = nextSource[nextKey];
                                    }
                                }
                            }
                        }
                        return to;
                    },
                    writable: true,
                    configurable: true
                });
            }
        }
        util.injectPolyphils = injectPolyphils;
        var Lazy = /** @class */ (function () {
            function Lazy(_func) {
                this._func = _func;
                this._evaluated = false;
            }
            Object.defineProperty(Lazy.prototype, "value", {
                get: function () {
                    if (!this._evaluated) {
                        this._value = this._func();
                        this._evaluated = true;
                    }
                    return this._value;
                },
                enumerable: true,
                configurable: true
            });
            return Lazy;
        }());
        util.Lazy = Lazy;
        function getNormalizedParts(path) {
            path = path.replace(/\\/g, "/");
            var parts = [];
            path.split("/").forEach(function (part) {
                if (part === ".." && parts.length) {
                    parts.pop();
                }
                else if (part && part !== ".") {
                    parts.push(part);
                }
            });
            return parts;
        }
        util.getNormalizedParts = getNormalizedParts;
        function normalizePath(path) {
            return getNormalizedParts(path).join("/");
        }
        util.normalizePath = normalizePath;
        function relativePath(fromDir, toFile) {
            var fParts = getNormalizedParts(fromDir);
            var tParts = getNormalizedParts(toFile);
            var i = 0;
            while (fParts[i] === tParts[i]) {
                i++;
                if (i === fParts.length || i === tParts.length) {
                    break;
                }
            }
            var fRemainder = fParts.slice(i);
            var tRemainder = tParts.slice(i);
            for (var i_1 = 0; i_1 < fRemainder.length; i_1++) {
                tRemainder.unshift("..");
            }
            return tRemainder.join("/");
        }
        util.relativePath = relativePath;
        function pathJoin() {
            var paths = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                paths[_i] = arguments[_i];
            }
            var result = "";
            paths.forEach(function (path) {
                path.replace(/\\/g, "/");
                if (path.lastIndexOf("/") === path.length - 1) {
                    path = path.slice(0, path.length - 1);
                }
                result += "/" + path;
            });
            return result;
        }
        util.pathJoin = pathJoin;
        function toArray(a) {
            if (Array.isArray(a)) {
                return a;
            }
            var r = [];
            for (var i = 0; i < a.length; ++i)
                r.push(a[i]);
            return r;
        }
        util.toArray = toArray;
    })(util = pxsim.util || (pxsim.util = {}));
})(pxsim || (pxsim = {}));
/// <reference path="./debugProtocol.ts" />
/// <reference path="./utils.ts" />
var pxsim;
(function (pxsim) {
    function getWarningMessage(msg) {
        var r = {
            type: "debugger",
            subtype: "warning",
            breakpointIds: [],
            message: msg
        };
        var s = pxsim.runtime.currFrame;
        while (s != null) {
            r.breakpointIds.push(s.lastBrkId);
            s = s.parent;
        }
        return r;
    }
    pxsim.getWarningMessage = getWarningMessage;
    var BreakpointMap = /** @class */ (function () {
        function BreakpointMap(breakpoints) {
            var _this = this;
            this.fileMap = {};
            this.idMap = {};
            breakpoints.forEach(function (tuple) {
                var id = tuple[0], bp = tuple[1];
                if (!_this.fileMap[bp.source.path]) {
                    _this.fileMap[bp.source.path] = [];
                }
                _this.fileMap[bp.source.path].push(tuple);
                _this.idMap[id] = bp;
            });
            for (var file in this.fileMap) {
                var bps = this.fileMap[file];
                // Sort the breakpoints to make finding the closest breakpoint to a
                // given line easier later. Order first by start line and then from
                // worst to best choice for each line.
                this.fileMap[file] = bps.sort(function (_a, _b) {
                    var a = _a[1];
                    var b = _b[1];
                    if (a.line === b.line) {
                        if (b.endLine === a.endLine) {
                            return a.column - b.column;
                        }
                        // We want the closest breakpoint, so give preference to breakpoints
                        // that span fewer lines (i.e. breakpoints that are "tighter" around
                        // the line being searched for)
                        return b.endLine - a.endLine;
                    }
                    return a.line - b.line;
                });
            }
        }
        BreakpointMap.prototype.getById = function (id) {
            return this.idMap[id];
        };
        BreakpointMap.prototype.verifyBreakpoint = function (path, breakpoint) {
            var breakpoints = this.fileMap[path];
            var best;
            if (breakpoints) {
                // Breakpoints are pre-sorted for each file. The last matching breakpoint
                // in the list should be the best match
                for (var _i = 0, breakpoints_1 = breakpoints; _i < breakpoints_1.length; _i++) {
                    var _a = breakpoints_1[_i], id = _a[0], bp = _a[1];
                    if (bp.line <= breakpoint.line && bp.endLine >= breakpoint.line) {
                        best = [id, bp];
                    }
                }
            }
            if (best) {
                best[1].verified = true;
                return best;
            }
            return [-1, { verified: false }];
        };
        return BreakpointMap;
    }());
    pxsim.BreakpointMap = BreakpointMap;
    function valToJSON(v, heap) {
        switch (typeof v) {
            case "string":
            case "number":
            case "boolean":
                return v;
            case "function":
                return {
                    text: "(function)",
                    type: "function",
                };
            case "undefined":
                return null;
            case "object":
                if (!v)
                    return null;
                if (v instanceof pxsim.RefObject) {
                    if (heap)
                        heap[v.id] = v;
                    var preview = pxsim.RefObject.toDebugString(v);
                    var type = preview.startsWith('[') ? "array" : preview;
                    return {
                        id: v.id,
                        preview: preview,
                        hasFields: v.fields !== null || preview.startsWith('['),
                        type: type,
                    };
                }
                if (v._width && v._height) {
                    return {
                        text: v._width + 'x' + v._height,
                        type: "image",
                    };
                }
                return {
                    text: "(object)",
                    type: "object",
                };
            default:
                throw new Error();
        }
    }
    function dumpHeap(v, heap, fields, filters) {
        function frameVars(frame, fields) {
            var r = {};
            for (var _i = 0, _a = Object.keys(frame); _i < _a.length; _i++) {
                var k = _a[_i];
                // skip members starting with __
                if (!/^__/.test(k) && /___\d+$/.test(k) && (!filters || filters.indexOf(k) !== -1)) {
                    r[k.replace(/___\d+$/, '')] = valToJSON(frame[k], heap);
                }
            }
            if (frame.fields && fields) {
                // Fields of an object.
                for (var _b = 0, fields_1 = fields; _b < fields_1.length; _b++) {
                    var k = fields_1[_b];
                    k = k.substring(k.lastIndexOf(".") + 1);
                    r[k] = valToJSON(evalGetter(frame.vtable.iface[k], frame), heap);
                }
            }
            if (frame.fields) {
                for (var _c = 0, _d = Object.keys(frame.fields).filter(function (field) { return !field.startsWith('_'); }); _c < _d.length; _c++) {
                    var k = _d[_c];
                    r[k.replace(/___\d+$/, '')] = valToJSON(frame.fields[k], heap);
                }
            }
            else if (Array.isArray(frame.data)) {
                // This is an Array.
                frame.data.forEach(function (element, index) {
                    r[index] = valToJSON(element, heap);
                });
            }
            return r;
        }
        return frameVars(v, fields);
    }
    pxsim.dumpHeap = dumpHeap;
    function evalGetter(fn, target) {
        // This function evaluates a getter, and we assume it doesn't have any side effects.
        var parentFrame = {};
        // We create a dummy stack frame
        var stackFrame = {
            pc: 0,
            arg0: target,
            fn: fn,
            parent: parentFrame
        };
        // And we evaluate the getter
        while (stackFrame.fn) {
            stackFrame = stackFrame.fn(stackFrame);
        }
        return stackFrame.retval;
    }
    function getBreakpointMsg(s, brkId, userGlobals) {
        var heap = {};
        var msg = {
            type: "debugger",
            subtype: "breakpoint",
            breakpointId: brkId,
            globals: dumpHeap(pxsim.runtime.globals, heap, undefined, userGlobals),
            stackframes: [],
        };
        while (s != null) {
            var info = getInfoForFrame(s, heap);
            if (info)
                msg.stackframes.push(info);
            s = s.parent;
        }
        return { msg: msg, heap: heap };
    }
    pxsim.getBreakpointMsg = getBreakpointMsg;
    function getInfoForFrame(s, heap) {
        var info = s.fn ? s.fn.info : null;
        if (info) {
            var argInfo = {
                thisParam: valToJSON(s.argL, heap),
                params: []
            };
            if (info.argumentNames) {
                var args = info.argumentNames;
                argInfo.params = args.map(function (paramName, index) { return ({
                    name: paramName,
                    value: valToJSON(s["arg" + index], heap)
                }); });
            }
            return {
                locals: dumpHeap(s, heap),
                funcInfo: info,
                breakpointId: s.lastBrkId,
                arguments: argInfo
            };
        }
        return undefined;
    }
    var SimDebugSession = /** @class */ (function (_super) {
        __extends(SimDebugSession, _super);
        function SimDebugSession(container) {
            var _this = _super.call(this) || this;
            var options = {
                onDebuggerBreakpoint: function (b) { return _this.onDebuggerBreakpoint(b); },
                onDebuggerWarning: function (w) { return _this.onDebuggerWarning(w); },
                onDebuggerResume: function () { return _this.onDebuggerResume(); },
                onStateChanged: function (s) { return _this.onStateChanged(s); }
            };
            _this.driver = new pxsim.SimulatorDriver(container, options);
            return _this;
        }
        SimDebugSession.prototype.runCode = function (js, parts, fnArgs, breakpoints, board) {
            this.breakpoints = breakpoints;
            if (this.projectDir) {
                this.fixBreakpoints();
            }
            this.sendEvent(new pxsim.protocol.InitializedEvent());
            this.driver.run(js, {
                parts: parts,
                fnArgs: fnArgs,
                boardDefinition: board
            });
        };
        SimDebugSession.prototype.stopSimulator = function (unload) {
            if (unload === void 0) { unload = false; }
            this.driver.stop(unload);
        };
        SimDebugSession.prototype.initializeRequest = function (response, args) {
            response.body.supportsConditionalBreakpoints = false;
            response.body.supportsHitConditionalBreakpoints = false;
            response.body.supportsFunctionBreakpoints = false;
            response.body.supportsEvaluateForHovers = false;
            response.body.supportsStepBack = false;
            response.body.supportsSetVariable = false;
            response.body.supportsRestartFrame = false;
            response.body.supportsStepInTargetsRequest = false;
            response.body.supportsGotoTargetsRequest = false;
            response.body.supportsCompletionsRequest = false;
            // This default debug adapter implements the 'configurationDone' request.
            response.body.supportsConfigurationDoneRequest = true;
            this.sendResponse(response);
        };
        SimDebugSession.prototype.disconnectRequest = function (response, args) {
            this.sendResponse(response);
            this.shutdown();
        };
        SimDebugSession.prototype.launchRequest = function (response, args) {
            if (!this.projectDir) {
                this.projectDir = pxsim.util.normalizePath(args.projectDir);
                if (this.breakpoints) {
                    this.fixBreakpoints();
                }
            }
            this.sendResponse(response);
        };
        SimDebugSession.prototype.setBreakPointsRequest = function (response, args) {
            var _this = this;
            response.body = { breakpoints: [] };
            var ids = [];
            args.breakpoints.forEach(function (requestedBp) {
                if (_this.breakpoints) {
                    var _a = _this.breakpoints.verifyBreakpoint(pxsim.util.relativePath(_this.projectDir, args.source.path), requestedBp), id = _a[0], bp = _a[1];
                    response.body.breakpoints.push(bp);
                    if (bp.verified) {
                        ids.push(id);
                    }
                }
                else {
                    response.body.breakpoints.push({ verified: false });
                }
            });
            this.driver.setBreakpoints(ids);
            this.sendResponse(response);
        };
        SimDebugSession.prototype.continueRequest = function (response, args) {
            this.driver.resume(pxsim.SimulatorDebuggerCommand.Resume);
            this.sendResponse(response);
        };
        SimDebugSession.prototype.nextRequest = function (response, args) {
            this.driver.resume(pxsim.SimulatorDebuggerCommand.StepOver);
            this.sendResponse(response);
        };
        SimDebugSession.prototype.stepInRequest = function (response, args) {
            this.driver.resume(pxsim.SimulatorDebuggerCommand.StepInto);
            this.sendResponse(response);
        };
        SimDebugSession.prototype.stepOutRequest = function (response, args) {
            this.driver.resume(pxsim.SimulatorDebuggerCommand.StepOut);
            this.sendResponse(response);
        };
        SimDebugSession.prototype.pauseRequest = function (response, args) {
            this.driver.resume(pxsim.SimulatorDebuggerCommand.Pause);
            this.sendResponse(response);
        };
        SimDebugSession.prototype.threadsRequest = function (response) {
            response.body = { threads: [{ id: SimDebugSession.THREAD_ID, name: "main" }] };
            this.sendResponse(response);
        };
        SimDebugSession.prototype.stackTraceRequest = function (response, args) {
            if (this.lastBreak) {
                var frames_1 = this.state.getFrames();
                response.body = { stackFrames: frames_1 };
            }
            this.sendResponse(response);
        };
        SimDebugSession.prototype.scopesRequest = function (response, args) {
            if (this.state) {
                response.body = { scopes: this.state.getScopes(args.frameId) };
            }
            this.sendResponse(response);
        };
        SimDebugSession.prototype.variablesRequest = function (response, args) {
            if (this.state) {
                response.body = { variables: this.state.getVariables(args.variablesReference) };
            }
            this.sendResponse(response);
        };
        SimDebugSession.prototype.onDebuggerBreakpoint = function (breakMsg) {
            this.lastBreak = breakMsg;
            this.state = new StoppedState(this.lastBreak, this.breakpoints, this.projectDir);
            if (breakMsg.exceptionMessage) {
                var message = breakMsg.exceptionMessage.replace(/___\d+/g, '');
                this.sendEvent(new pxsim.protocol.StoppedEvent("exception", SimDebugSession.THREAD_ID, message));
            }
            else {
                this.sendEvent(new pxsim.protocol.StoppedEvent("breakpoint", SimDebugSession.THREAD_ID));
            }
        };
        SimDebugSession.prototype.onDebuggerWarning = function (warnMsg) {
        };
        SimDebugSession.prototype.onDebuggerResume = function () {
            this.sendEvent(new pxsim.protocol.ContinuedEvent(SimDebugSession.THREAD_ID, true));
        };
        SimDebugSession.prototype.onStateChanged = function (state) {
            switch (state) {
                case pxsim.SimulatorState.Paused:
                    // Sending a stopped event here would be redundant
                    break;
                case pxsim.SimulatorState.Running:
                    this.sendEvent(new pxsim.protocol.ContinuedEvent(SimDebugSession.THREAD_ID, true));
                    break;
                case pxsim.SimulatorState.Stopped:
                    this.sendEvent(new pxsim.protocol.TerminatedEvent());
                    break;
                //case SimulatorState.Unloaded:
                //case SimulatorState.Pending:
                default:
            }
        };
        SimDebugSession.prototype.fixBreakpoints = function () {
            // Fix breakpoint locations from the debugger's format to the client's
            for (var bpId in this.breakpoints.idMap) {
                var bp = this.breakpoints.idMap[bpId];
                bp.source.path = pxsim.util.pathJoin(this.projectDir, bp.source.path);
                bp.line = this.convertDebuggerLineToClient(bp.line);
                bp.endLine = this.convertDebuggerLineToClient(bp.endLine);
                bp.column = this.convertDebuggerColumnToClient(bp.column);
                bp.endColumn = this.convertDebuggerColumnToClient(bp.endColumn);
            }
        };
        // We only have one thread
        // TODO: We could theoretically visualize the individual fibers
        SimDebugSession.THREAD_ID = 1;
        return SimDebugSession;
    }(pxsim.protocol.DebugSession));
    pxsim.SimDebugSession = SimDebugSession;
    /**
     * Maintains the state at the current breakpoint and handles lazy
     * queries for stack frames, scopes, variables, etc. The protocol
     * expects requests to be made in the order:
     *      Frames -> Scopes -> Variables
     */
    var StoppedState = /** @class */ (function () {
        function StoppedState(_message, _map, _dir) {
            this._message = _message;
            this._map = _map;
            this._dir = _dir;
            this._currentId = 1;
            this._frames = {};
            this._vars = {};
            var globalId = this.nextId();
            this._vars[globalId] = this.getVariableValues(this._message.globals);
            this._globalScope = {
                name: "Globals",
                variablesReference: globalId,
                expensive: false
            };
        }
        /**
         * Get stack frames for current breakpoint.
         */
        StoppedState.prototype.getFrames = function () {
            var _this = this;
            return this._message.stackframes.map(function (s, i) {
                var bp = _this._map.getById(s.breakpointId);
                if (bp) {
                    _this._frames[s.breakpointId] = s;
                    return {
                        id: s.breakpointId,
                        name: s.funcInfo ? s.funcInfo.functionName : (i === 0 ? "main" : "anonymous"),
                        line: bp.line,
                        column: bp.column,
                        endLine: bp.endLine,
                        endColumn: bp.endLine,
                        source: bp.source
                    };
                }
                return undefined;
            }).filter(function (b) { return !!b; });
        };
        /**
         * Returns scopes visible to the given stack frame.
         *
         * TODO: Currently, we only support locals and globals (no closures)
         */
        StoppedState.prototype.getScopes = function (frameId) {
            var frame = this._frames[frameId];
            if (frame) {
                var localId = this.nextId();
                this._vars[localId] = this.getVariableValues(frame.locals);
                return [{
                        name: "Locals",
                        variablesReference: localId,
                        expensive: false
                    }, this._globalScope];
            }
            return [this._globalScope];
        };
        /**
         * Returns variable information (and object properties)
         */
        StoppedState.prototype.getVariables = function (variablesReference) {
            var lz = this._vars[variablesReference];
            return (lz && lz.value) || [];
        };
        StoppedState.prototype.getVariableValues = function (v) {
            var _this = this;
            return new pxsim.util.Lazy(function () {
                var result = [];
                for (var name_1 in v) {
                    var value = v[name_1];
                    var vString = void 0;
                    var variablesReference = 0;
                    if (value === null) {
                        vString = "null";
                    }
                    else if (value === undefined) {
                        vString = "undefined";
                    }
                    else if (typeof value === "object") {
                        vString = "(object)";
                        variablesReference = _this.nextId();
                        // Variables should be requested lazily, so reference loops aren't an issue
                        _this._vars[variablesReference] = _this.getVariableValues(value);
                    }
                    else {
                        vString = value.toString();
                    }
                    // Remove the metadata from the name
                    var displayName = name_1.substr(0, name_1.lastIndexOf("___"));
                    result.push({
                        name: displayName,
                        value: vString,
                        variablesReference: variablesReference
                    });
                }
                return result;
            });
        };
        StoppedState.prototype.nextId = function () {
            return this._currentId++;
        };
        return StoppedState;
    }());
})(pxsim || (pxsim = {}));
/// <reference path="../localtypings/pxtparts.d.ts"/>
var pxsim;
(function (pxsim) {
    function print(delay) {
        if (delay === void 0) { delay = 0; }
        function p() {
            try {
                window.print();
            }
            catch (e) {
                // oops
            }
        }
        if (delay)
            setTimeout(p, delay);
        else
            p();
    }
    pxsim.print = print;
    var Embed;
    (function (Embed) {
        function start() {
            window.addEventListener("message", receiveMessage, false);
            Embed.frameid = window.location.hash.slice(1);
            initAppcache();
            pxsim.Runtime.postMessage({ type: 'ready', frameid: Embed.frameid });
        }
        Embed.start = start;
        function receiveMessage(event) {
            var origin = event.origin; // || (<any>event).originalEvent.origin;
            // TODO: test origins
            var data = event.data || {};
            var type = data.type;
            if (!type)
                return;
            switch (type) {
                case "run":
                    run(data);
                    break;
                case "instructions":
                    pxsim.instructions.renderInstructions(data);
                    break;
                case "stop":
                    stop();
                    break;
                case "mute":
                    mute(data.mute);
                    break;
                case "stopsound":
                    stopSound();
                    break;
                case "print":
                    print();
                    break;
                case 'recorder':
                    recorder(data);
                    break;
                case "screenshot":
                    pxsim.Runtime.postScreenshotAsync(data).done();
                    break;
                case "custom":
                    if (pxsim.handleCustomMessage)
                        pxsim.handleCustomMessage(data);
                    break;
                case 'pxteditor':
                    break; //handled elsewhere
                case 'debugger':
                    if (runtime)
                        runtime.handleDebuggerMsg(data);
                    break;
                case 'simulator':
                    var simData = data;
                    switch (simData.command) {
                        case "focus":
                            tickEvent("simulator.focus", { timestamp: simData.timestamp });
                            break;
                        case "blur":
                            tickEvent("simulator.blur", { timestamp: simData.timestamp });
                            break;
                    }
                default:
                    queue(data);
                    break;
            }
        }
        // TODO remove this; this should be using Runtime.runtime which gets
        // set correctly depending on which runtime is currently running
        var runtime;
        function stop() {
            if (runtime) {
                runtime.kill();
                if (runtime.board)
                    runtime.board.kill();
            }
        }
        Embed.stop = stop;
        function run(msg) {
            stop();
            if (msg.mute)
                mute(msg.mute);
            if (msg.localizedStrings)
                pxsim.localization.setLocalizedStrings(msg.localizedStrings);
            runtime = new pxsim.Runtime(msg);
            runtime.board.initAsync(msg)
                .done(function () {
                runtime.run(function (v) {
                    pxsim.dumpLivePointers();
                    pxsim.Runtime.postMessage({ type: "toplevelcodefinished" });
                });
            });
        }
        Embed.run = run;
        function mute(mute) {
            pxsim.AudioContextManager.mute(mute);
        }
        function stopSound() {
            pxsim.AudioContextManager.stopAll();
        }
        function queue(msg) {
            if (!runtime || runtime.dead) {
                return;
            }
            runtime.board.receiveMessage(msg);
        }
        function recorder(rec) {
            if (!runtime)
                return;
            switch (rec.action) {
                case "start":
                    runtime.startRecording(rec.width);
                    break;
                case "stop":
                    runtime.stopRecording();
                    break;
            }
        }
    })(Embed = pxsim.Embed || (pxsim.Embed = {}));
    /**
     * Log an event to the parent editor (allowSimTelemetry must be enabled in target)
     * @param id The id of the event
     * @param data Any custom values associated with this event
     */
    function tickEvent(id, data) {
        postMessageToEditor({
            type: "pxtsim",
            action: "event",
            tick: id,
            data: data
        });
    }
    pxsim.tickEvent = tickEvent;
    /**
     * Log an error to the parent editor (allowSimTelemetry must be enabled in target)
     * @param cat The category of the error
     * @param msg The error message
     * @param data Any custom values associated with this event
     */
    function reportError(cat, msg, data) {
        postMessageToEditor({
            type: "pxtsim",
            action: "event",
            tick: "error",
            category: cat,
            message: msg,
            data: data
        });
    }
    pxsim.reportError = reportError;
    function postMessageToEditor(message) {
        if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
            window.parent.postMessage(message, "*");
        }
    }
    function initAppcache() {
        if (typeof window !== 'undefined' && window.applicationCache) {
            if (window.applicationCache.status === window.applicationCache.UPDATEREADY)
                reload();
            window.applicationCache.addEventListener("updateready", function () {
                if (window.applicationCache.status === window.applicationCache.UPDATEREADY)
                    reload();
            });
        }
    }
    function reload() {
        // Continuously send message just in case the editor isn't ready to handle it yet
        setInterval(function () {
            pxsim.Runtime.postMessage({ type: "simulator", command: "reload" });
        }, 3000);
    }
    pxsim.reload = reload;
})(pxsim || (pxsim = {}));
pxsim.util.injectPolyphils();
if (typeof window !== 'undefined') {
    window.addEventListener('load', function (ev) {
        pxsim.Embed.start();
    });
}
var pxsim;
(function (pxsim) {
    var instructions;
    (function (instructions) {
        var LOC_LBL_SIZE = 10;
        var QUANT_LBL_SIZE = 30;
        var QUANT_LBL = function (q) { return q + "x"; };
        var WIRE_QUANT_LBL_SIZE = 20;
        var LBL_VERT_PAD = 3;
        var LBL_RIGHT_PAD = 5;
        var LBL_LEFT_PAD = 5;
        var REQ_WIRE_HEIGHT = 40;
        var REQ_CMP_HEIGHT = 50;
        var REQ_CMP_SCALE = 0.5 * 3;
        var ORIENTATION = "portrait";
        var PPI = 96.0;
        var PAGE_SCALAR = 0.95;
        var _a = (ORIENTATION == "portrait" ? [PPI * 8.5 * PAGE_SCALAR, PPI * 11.0 * PAGE_SCALAR] : [PPI * 11.0 * PAGE_SCALAR, PPI * 8.5 * PAGE_SCALAR]), FULL_PAGE_WIDTH = _a[0], FULL_PAGE_HEIGHT = _a[1];
        var PAGE_MARGIN = PPI * 0.45;
        var PAGE_WIDTH = FULL_PAGE_WIDTH - PAGE_MARGIN * 2;
        var PAGE_HEIGHT = FULL_PAGE_HEIGHT - PAGE_MARGIN * 2;
        var BORDER_COLOR = "gray";
        var BORDER_RADIUS = 5 * 4;
        var BORDER_WIDTH = 2 * 2;
        var _b = [1, 1], PANEL_ROWS = _b[0], PANEL_COLS = _b[1];
        var PANEL_MARGIN = 20;
        var PANEL_PADDING = 8 * 3;
        var PANEL_WIDTH = PAGE_WIDTH / PANEL_COLS - (PANEL_MARGIN + PANEL_PADDING + BORDER_WIDTH) * PANEL_COLS;
        var PANEL_HEIGHT = PAGE_HEIGHT / PANEL_ROWS - (PANEL_MARGIN + PANEL_PADDING + BORDER_WIDTH) * PANEL_ROWS;
        var BOARD_WIDTH = 465;
        var BOARD_LEFT = (PANEL_WIDTH - BOARD_WIDTH) / 2.0 + PANEL_PADDING;
        var BOARD_BOT = PANEL_PADDING;
        var NUM_BOX_SIZE = 120;
        var NUM_FONT = 80;
        var NUM_MARGIN = 10;
        var FRONT_PAGE_BOARD_WIDTH = 400;
        var PART_SCALAR = 1.7;
        var PARTS_BOARD_SCALE = 0.17;
        var PARTS_BB_SCALE = 0.25;
        var PARTS_CMP_SCALE = 0.3;
        var PARTS_WIRE_SCALE = 0.23;
        var BACK_PAGE_BOARD_WIDTH = PANEL_WIDTH - PANEL_PADDING * 1.5;
        var STYLE = "\n            .instr-panel {\n                margin: " + PANEL_MARGIN + "px;\n                padding: " + PANEL_PADDING + "px;\n                border-width: " + BORDER_WIDTH + "px;\n                border-color: " + BORDER_COLOR + ";\n                border-style: solid;\n                border-radius: " + BORDER_RADIUS + "px;\n                display: inline-block;\n                width: " + PANEL_WIDTH + "px;\n                height: " + PANEL_HEIGHT + "px;\n                position: relative;\n                overflow: hidden;\n                page-break-inside: avoid;\n            }\n            .board-svg {\n                margin: 0 auto;\n                display: block;\n                position: absolute;\n                bottom: " + BOARD_BOT + "px;\n                left: " + BOARD_LEFT + "px;\n            }\n            .panel-num-outer {\n                position: absolute;\n                left: " + -BORDER_WIDTH + "px;\n                top: " + -BORDER_WIDTH + "px;\n                width: " + NUM_BOX_SIZE + "px;\n                height: " + NUM_BOX_SIZE + "px;\n                border-width: " + BORDER_WIDTH + "px;\n                border-style: solid;\n                border-color: " + BORDER_COLOR + ";\n                border-radius: " + BORDER_RADIUS + "px 0 " + BORDER_RADIUS + "px 0;\n            }\n            .panel-num {\n                margin: " + NUM_MARGIN + "px 0;\n                text-align: center;\n                font-size: " + NUM_FONT + "px;\n            }\n            .cmp-div {\n                display: inline-block;\n            }\n            .reqs-div {\n                margin-left: " + (PANEL_PADDING + NUM_BOX_SIZE) + "px;\n                margin-top: 5px;\n            }\n            .partslist-wire,\n            .partslist-cmp {\n                margin: 10px;\n            }\n            .partslist-wire {\n                display: inline-block;\n            }\n            ";
        function mkTxt(p, txt, size) {
            var el = pxsim.svg.elt("text");
            var x = p[0], y = p[1];
            pxsim.svg.hydrate(el, { x: x, y: y, style: "font-size:" + size + "px;" });
            el.textContent = txt;
            return el;
        }
        function mkBoardImgSvg(def) {
            var boardView = pxsim.visuals.mkBoardView({
                visual: def.visual,
                boardDef: def
            });
            return boardView.getView();
        }
        function mkBBSvg() {
            var bb = new pxsim.visuals.Breadboard({});
            return bb.getSVGAndSize();
        }
        function wrapSvg(el, opts) {
            //TODO: Refactor this function; it is too complicated. There is a lot of error-prone math being done
            // to scale and place all elements which could be simplified with more forethought.
            var svgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            var dims = { l: 0, t: 0, w: 0, h: 0 };
            var cmpSvgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svgEl.appendChild(cmpSvgEl);
            cmpSvgEl.appendChild(el.el);
            var cmpSvgAtts = {
                "viewBox": el.x + " " + el.y + " " + el.w + " " + el.h,
                "preserveAspectRatio": "xMidYMid",
            };
            dims.w = el.w;
            dims.h = el.h;
            var scale = function (scaler) {
                dims.h *= scaler;
                dims.w *= scaler;
                cmpSvgAtts.width = dims.w;
                cmpSvgAtts.height = dims.h;
            };
            if (opts.cmpScale) {
                scale(opts.cmpScale);
            }
            if (opts.cmpWidth && opts.cmpWidth < dims.w) {
                scale(opts.cmpWidth / dims.w);
            }
            else if (opts.cmpHeight && opts.cmpHeight < dims.h) {
                scale(opts.cmpHeight / dims.h);
            }
            pxsim.svg.hydrate(cmpSvgEl, cmpSvgAtts);
            var elDims = { l: dims.l, t: dims.t, w: dims.w, h: dims.h };
            var updateL = function (newL) {
                if (newL < dims.l) {
                    var extraW = dims.l - newL;
                    dims.l = newL;
                    dims.w += extraW;
                }
            };
            var updateR = function (newR) {
                var oldR = dims.l + dims.w;
                if (oldR < newR) {
                    var extraW = newR - oldR;
                    dims.w += extraW;
                }
            };
            var updateT = function (newT) {
                if (newT < dims.t) {
                    var extraH = dims.t - newT;
                    dims.t = newT;
                    dims.h += extraH;
                }
            };
            var updateB = function (newB) {
                var oldB = dims.t + dims.h;
                if (oldB < newB) {
                    var extraH = newB - oldB;
                    dims.h += extraH;
                }
            };
            //labels
            var _a = [-0.3, 0.3], xOff = _a[0], yOff = _a[1]; //HACK: these constants tweak the way "mkTxt" knows how to center the text
            var txtAspectRatio = [1.4, 1.0];
            if (opts && opts.top) {
                var size = opts.topSize;
                var txtW = size / txtAspectRatio[0];
                var txtH = size / txtAspectRatio[1];
                var _b = [elDims.l + elDims.w / 2, elDims.t - LBL_VERT_PAD - txtH / 2], cx = _b[0], y = _b[1];
                var lbl = pxsim.visuals.mkTxt(cx, y, size, 0, opts.top, xOff, yOff);
                pxsim.U.addClass(lbl, "cmp-lbl");
                svgEl.appendChild(lbl);
                var len = txtW * opts.top.length;
                updateT(y - txtH / 2);
                updateL(cx - len / 2);
                updateR(cx + len / 2);
            }
            if (opts && opts.bot) {
                var size = opts.botSize;
                var txtW = size / txtAspectRatio[0];
                var txtH = size / txtAspectRatio[1];
                var _c = [elDims.l + elDims.w / 2, elDims.t + elDims.h + LBL_VERT_PAD + txtH / 2], cx = _c[0], y = _c[1];
                var lbl = pxsim.visuals.mkTxt(cx, y, size, 0, opts.bot, xOff, yOff);
                pxsim.U.addClass(lbl, "cmp-lbl");
                svgEl.appendChild(lbl);
                var len = txtW * opts.bot.length;
                updateB(y + txtH / 2);
                updateL(cx - len / 2);
                updateR(cx + len / 2);
            }
            if (opts && opts.right) {
                var size = opts.rightSize;
                var txtW = size / txtAspectRatio[0];
                var txtH = size / txtAspectRatio[1];
                var len = txtW * opts.right.length;
                var _d = [elDims.l + elDims.w + LBL_RIGHT_PAD + len / 2, elDims.t + elDims.h / 2], cx = _d[0], cy = _d[1];
                var lbl = pxsim.visuals.mkTxt(cx, cy, size, 0, opts.right, xOff, yOff);
                pxsim.U.addClass(lbl, "cmp-lbl");
                svgEl.appendChild(lbl);
                updateT(cy - txtH / 2);
                updateR(cx + len / 2);
                updateB(cy + txtH / 2);
            }
            if (opts && opts.left) {
                var size = opts.leftSize;
                var txtW = size / txtAspectRatio[0];
                var txtH = size / txtAspectRatio[1];
                var len = txtW * opts.left.length;
                var _e = [elDims.l - LBL_LEFT_PAD - len / 2, elDims.t + elDims.h / 2], cx = _e[0], cy = _e[1];
                var lbl = pxsim.visuals.mkTxt(cx, cy, size, 0, opts.left, xOff, yOff);
                pxsim.U.addClass(lbl, "cmp-lbl");
                svgEl.appendChild(lbl);
                updateT(cy - txtH / 2);
                updateL(cx - len / 2);
                updateB(cy + txtH / 2);
            }
            var svgAtts = {
                "viewBox": dims.l + " " + dims.t + " " + dims.w + " " + dims.h,
                "width": dims.w * PART_SCALAR,
                "height": dims.h * PART_SCALAR,
                "preserveAspectRatio": "xMidYMid",
            };
            pxsim.svg.hydrate(svgEl, svgAtts);
            var div = document.createElement("div");
            div.appendChild(svgEl);
            return div;
        }
        function mkCmpDiv(cmp, opts) {
            var state = pxsim.runtime.board;
            var el;
            if (cmp == "wire") {
                el = pxsim.visuals.mkWirePart([0, 0], opts.wireClr || "red", opts.crocClips);
            }
            else {
                var partVis = cmp;
                if (typeof partVis.builtIn == "string") {
                    var cnstr = state.builtinPartVisuals[partVis.builtIn];
                    el = cnstr([0, 0]);
                }
                else {
                    el = pxsim.visuals.mkGenericPartSVG(partVis);
                }
            }
            return wrapSvg(el, opts);
        }
        function mkBoardProps(allocOpts) {
            var allocRes = pxsim.allocateDefinitions(allocOpts);
            var stepToWires = [];
            var stepToCmps = [];
            var stepOffset = 1;
            allocRes.partsAndWires.forEach(function (cAndWs) {
                var part = cAndWs.part;
                var wires = cAndWs.wires;
                cAndWs.assembly.forEach(function (step, idx) {
                    if (step.part && part)
                        stepToCmps[stepOffset + idx] = [part];
                    if (step.wireIndices && step.wireIndices.length > 0 && wires)
                        stepToWires[stepOffset + idx] = step.wireIndices.map(function (i) { return wires[i]; });
                });
                stepOffset += cAndWs.assembly.length;
            });
            var numSteps = stepOffset;
            var lastStep = numSteps - 1;
            var allCmps = allocRes.partsAndWires.map(function (r) { return r.part; }).filter(function (p) { return !!p; });
            var allWires = allocRes.partsAndWires.map(function (r) { return r.wires || []; }).reduce(function (p, n) { return p.concat(n); }, []);
            var colorToWires = {};
            var allWireColors = [];
            allWires.forEach(function (w) {
                if (!colorToWires[w.color]) {
                    colorToWires[w.color] = [];
                    allWireColors.push(w.color);
                }
                colorToWires[w.color].push(w);
            });
            return {
                boardDef: allocOpts.boardDef,
                cmpDefs: allocOpts.partDefs,
                fnArgs: allocOpts.fnArgs,
                allAlloc: allocRes,
                stepToWires: stepToWires,
                stepToCmps: stepToCmps,
                allWires: allWires,
                allCmps: allCmps,
                lastStep: lastStep,
                colorToWires: colorToWires,
                allWireColors: allWireColors,
            };
        }
        function mkBlankBoardAndBreadboard(props, width, buildMode) {
            if (buildMode === void 0) { buildMode = false; }
            var state = pxsim.runtime.board;
            var opts = {
                state: state,
                boardDef: props.boardDef,
                forceBreadboardLayout: true,
                forceBreadboardRender: props.allAlloc.requiresBreadboard,
                partDefs: props.cmpDefs,
                maxWidth: width + "px",
                fnArgs: props.fnArgs,
                wireframe: buildMode,
                partsList: []
            };
            var boardHost = new pxsim.visuals.BoardHost(pxsim.visuals.mkBoardView({
                visual: opts.boardDef.visual,
                boardDef: opts.boardDef,
                wireframe: opts.wireframe
            }), opts);
            var view = boardHost.getView();
            pxsim.U.addClass(view, "board-svg");
            //set smiley
            //HACK
            // let img = board.board.displayCmp.image;
            // img.set(1, 0, 255);
            // img.set(3, 0, 255);
            // img.set(0, 2, 255);
            // img.set(1, 3, 255);
            // img.set(2, 3, 255);
            // img.set(3, 3, 255);
            // img.set(4, 2, 255);
            // board.updateState();
            return boardHost;
        }
        function drawSteps(board, step, props) {
            var view = board.getView();
            if (step > 0) {
                pxsim.U.addClass(view, "grayed");
            }
            var _loop_1 = function (i) {
                var cmps = props.stepToCmps[i];
                if (cmps) {
                    cmps.forEach(function (partInst) {
                        var cmp = board.addPart(partInst);
                        //last step
                        if (i === step) {
                            //highlight locations pins
                            partInst.breadboardConnections.forEach(function (bbLoc) { return board.highlightBreadboardPin(bbLoc); });
                            pxsim.U.addClass(cmp.element, "notgrayed");
                        }
                    });
                }
                var wires = props.stepToWires[i];
                if (wires) {
                    wires.forEach(function (w) {
                        var wire = board.addWire(w);
                        if (!wire)
                            return;
                        //last step
                        if (i === step) {
                            //location highlights
                            if (w.start.type == "breadboard") {
                                var lbls = board.highlightBreadboardPin(w.start);
                            }
                            else {
                                board.highlightBoardPin(w.start.pin);
                            }
                            if (w.end.type == "breadboard") {
                                board.highlightBreadboardPin(w.end);
                            }
                            else {
                                board.highlightBoardPin(w.end.pin);
                            }
                            //highlight wire
                            board.highlightWire(wire);
                        }
                    });
                }
            };
            for (var i = 0; i <= step; i++) {
                _loop_1(i);
            }
        }
        function mkPanel() {
            //panel
            var panel = document.createElement("div");
            pxsim.U.addClass(panel, "instr-panel");
            return panel;
        }
        function mkPartsPanel(props) {
            var panel = mkPanel();
            // board and breadboard
            var boardImg = mkBoardImgSvg(props.boardDef);
            var board = wrapSvg(boardImg, { left: QUANT_LBL(1), leftSize: QUANT_LBL_SIZE, cmpScale: PARTS_BOARD_SCALE });
            panel.appendChild(board);
            var bbRaw = mkBBSvg();
            var bb = wrapSvg(bbRaw, { left: QUANT_LBL(1), leftSize: QUANT_LBL_SIZE, cmpScale: PARTS_BB_SCALE });
            panel.appendChild(bb);
            // components
            var cmps = props.allCmps;
            cmps.forEach(function (c) {
                var quant = 1;
                // TODO: don't special case this
                if (c.visual.builtIn === "buttonpair") {
                    quant = 2;
                }
                var cmp = mkCmpDiv(c.visual, {
                    left: QUANT_LBL(quant),
                    leftSize: QUANT_LBL_SIZE,
                    cmpScale: PARTS_CMP_SCALE,
                });
                pxsim.U.addClass(cmp, "partslist-cmp");
                panel.appendChild(cmp);
            });
            // wires
            props.allWireColors.forEach(function (clr) {
                var quant = props.colorToWires[clr].length;
                var style = props.boardDef.pinStyles[clr] || "female";
                var cmp = mkCmpDiv("wire", {
                    left: QUANT_LBL(quant),
                    leftSize: WIRE_QUANT_LBL_SIZE,
                    wireClr: clr,
                    cmpScale: PARTS_WIRE_SCALE,
                    crocClips: style == "croc"
                });
                pxsim.U.addClass(cmp, "partslist-wire");
                panel.appendChild(cmp);
            });
            return panel;
        }
        function mkStepPanel(step, props) {
            var panel = mkPanel();
            //board
            var board = mkBlankBoardAndBreadboard(props, BOARD_WIDTH, true);
            drawSteps(board, step, props);
            panel.appendChild(board.getView());
            //number
            var numDiv = document.createElement("div");
            pxsim.U.addClass(numDiv, "panel-num-outer");
            pxsim.U.addClass(numDiv, "noselect");
            panel.appendChild(numDiv);
            var num = document.createElement("div");
            pxsim.U.addClass(num, "panel-num");
            num.textContent = (step + 1) + "";
            numDiv.appendChild(num);
            // add requirements
            var reqsDiv = document.createElement("div");
            pxsim.U.addClass(reqsDiv, "reqs-div");
            panel.appendChild(reqsDiv);
            var wires = (props.stepToWires[step] || []);
            var mkLabel = function (loc) {
                if (loc.type === "breadboard") {
                    var _a = loc, row = _a.row, col = _a.col;
                    return "(" + row + "," + col + ")";
                }
                else
                    return loc.pin;
            };
            wires.forEach(function (w) {
                var croc = false;
                if (w.end.type == "dalboard") {
                    croc = props.boardDef.pinStyles[w.end.pin] == "croc";
                }
                var cmp = mkCmpDiv("wire", {
                    top: mkLabel(w.end),
                    topSize: LOC_LBL_SIZE,
                    bot: mkLabel(w.start),
                    botSize: LOC_LBL_SIZE,
                    wireClr: w.color,
                    cmpHeight: REQ_WIRE_HEIGHT,
                    crocClips: croc
                });
                pxsim.U.addClass(cmp, "cmp-div");
                reqsDiv.appendChild(cmp);
            });
            var cmps = (props.stepToCmps[step] || []);
            cmps.forEach(function (c) {
                var locs;
                if (c.visual.builtIn === "buttonpair") {
                    //TODO: don't special case this
                    locs = [c.breadboardConnections[0], c.breadboardConnections[2]];
                }
                else {
                    locs = [c.breadboardConnections[0]];
                }
                locs.forEach(function (l, i) {
                    var topLbl;
                    if (l) {
                        var row = l.row, col = l.col;
                        topLbl = "(" + row + "," + col + ")";
                    }
                    else {
                        topLbl = "";
                    }
                    var scale = REQ_CMP_SCALE;
                    if (c.visual.builtIn === "buttonpair")
                        scale *= 0.5; //TODO: don't special case
                    var cmp = mkCmpDiv(c.visual, {
                        top: topLbl,
                        topSize: LOC_LBL_SIZE,
                        cmpHeight: REQ_CMP_HEIGHT,
                        cmpScale: scale
                    });
                    pxsim.U.addClass(cmp, "cmp-div");
                    reqsDiv.appendChild(cmp);
                });
            });
            return panel;
        }
        function updateFrontPanel(props) {
            var panel = document.getElementById("front-panel");
            var board = mkBlankBoardAndBreadboard(props, FRONT_PAGE_BOARD_WIDTH, false);
            board.addAll(props.allAlloc);
            panel.appendChild(board.getView());
            return [panel, props];
        }
        function mkFinalPanel(props) {
            var panel = mkPanel();
            pxsim.U.addClass(panel, "back-panel");
            var board = mkBlankBoardAndBreadboard(props, BACK_PAGE_BOARD_WIDTH, false);
            board.addAll(props.allAlloc);
            panel.appendChild(board.getView());
            return panel;
        }
        function renderParts(container, options) {
            if (!options.boardDef.pinStyles)
                options.boardDef.pinStyles = {};
            if (options.configData)
                pxsim.setConfigData(options.configData.cfg, options.configData.cfgKey);
            var msg = {
                type: "run",
                code: "",
                boardDefinition: options.boardDef,
                partDefinitions: options.partDefinitions
            };
            pxsim.runtime = new pxsim.Runtime(msg);
            pxsim.runtime.board = null;
            pxsim.initCurrentRuntime(msg); // TODO it seems Runtime() ctor already calls this?
            var style = document.createElement("style");
            style.textContent += STYLE;
            document.head.appendChild(style);
            var cmpDefs = options.partDefinitions;
            //props
            var dummyBreadboard = new pxsim.visuals.Breadboard({});
            var props = mkBoardProps({
                boardDef: options.boardDef,
                partDefs: cmpDefs,
                partsList: options.parts,
                fnArgs: options.fnArgs,
                getBBCoord: dummyBreadboard.getCoord.bind(dummyBreadboard)
            });
            //front page
            var frontPanel = updateFrontPanel(props);
            //all required parts
            var partsPanel = mkPartsPanel(props);
            container.appendChild(partsPanel);
            //steps
            for (var s = 0; s <= props.lastStep; s++) {
                var p = mkStepPanel(s, props);
                container.appendChild(p);
            }
            //final
            //let finalPanel = mkFinalPanel(props);
            //container.appendChild(finalPanel);
            if (options.print)
                pxsim.print(2000);
        }
        instructions.renderParts = renderParts;
        function renderInstructions(msg) {
            document.getElementById("proj-title").innerText = msg.options.name || "";
            renderParts(document.body, msg.options);
        }
        instructions.renderInstructions = renderInstructions;
    })(instructions = pxsim.instructions || (pxsim.instructions = {}));
})(pxsim || (pxsim = {}));
// APIs for language/runtime support (records, locals, function values)
var pxsim;
(function (pxsim) {
    pxsim.quiet = false;
    function check(cond, msg) {
        if (msg === void 0) { msg = "sim: check failed"; }
        if (!cond) {
            debugger;
            throw new Error(msg);
        }
    }
    pxsim.check = check;
    pxsim.title = "";
    var cfgKey = {};
    var cfg = {};
    function getConfig(id) {
        if (cfg.hasOwnProperty(id + ""))
            return cfg[id + ""];
        return null;
    }
    pxsim.getConfig = getConfig;
    function getConfigKey(id) {
        if (cfgKey.hasOwnProperty(id))
            return cfgKey[id];
        return null;
    }
    pxsim.getConfigKey = getConfigKey;
    function getAllConfigKeys() {
        return Object.keys(cfgKey);
    }
    pxsim.getAllConfigKeys = getAllConfigKeys;
    function setConfigKey(key, id) {
        cfgKey[key] = id;
    }
    pxsim.setConfigKey = setConfigKey;
    function setConfig(id, val) {
        cfg[id] = val;
    }
    pxsim.setConfig = setConfig;
    function setConfigData(cfg_, cfgKey_) {
        cfg = cfg_;
        cfgKey = cfgKey_;
    }
    pxsim.setConfigData = setConfigData;
    function getConfigData() {
        return { cfg: cfg, cfgKey: cfgKey };
    }
    pxsim.getConfigData = getConfigData;
    function setTitle(t) {
        pxsim.title = t;
    }
    pxsim.setTitle = setTitle;
    var RefObject = /** @class */ (function () {
        function RefObject() {
            if (pxsim.runtime)
                this.id = pxsim.runtime.registerLiveObject(this);
            else
                this.id = 0;
        }
        RefObject.prototype.destroy = function () { };
        RefObject.prototype.print = function () {
            if (pxsim.runtime && pxsim.runtime.refCountingDebug)
                console.log("RefObject id:" + this.id);
        };
        // render a debug preview string
        RefObject.prototype.toDebugString = function () {
            return "(object)";
        };
        RefObject.toAny = function (o) {
            if (o && o.toAny)
                return o.toAny();
            return o;
        };
        RefObject.toDebugString = function (o) {
            if (o === null)
                return "null";
            if (o === undefined)
                return "undefined;";
            if (o.vtable && o.vtable.name)
                return o.vtable.name;
            if (o.toDebugString)
                return o.toDebugString();
            if (typeof o == "string")
                return JSON.stringify(o);
            return o.toString();
        };
        return RefObject;
    }());
    pxsim.RefObject = RefObject;
    var FnWrapper = /** @class */ (function () {
        function FnWrapper(func, caps, args) {
            this.func = func;
            this.caps = caps;
            this.args = args;
        }
        return FnWrapper;
    }());
    pxsim.FnWrapper = FnWrapper;
    var RefRecord = /** @class */ (function (_super) {
        __extends(RefRecord, _super);
        function RefRecord() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.fields = {};
            return _this;
        }
        RefRecord.prototype.destroy = function () {
            this.fields = null;
            this.vtable = null;
        };
        RefRecord.prototype.print = function () {
            if (pxsim.runtime && pxsim.runtime.refCountingDebug)
                console.log("RefRecord id:" + this.id + " (" + this.vtable.name + ")");
        };
        return RefRecord;
    }(RefObject));
    pxsim.RefRecord = RefRecord;
    var RefAction = /** @class */ (function (_super) {
        __extends(RefAction, _super);
        function RefAction() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.fields = [];
            return _this;
        }
        RefAction.prototype.isRef = function (idx) {
            check(0 <= idx && idx < this.fields.length);
            return idx < this.len;
        };
        RefAction.prototype.ldclo = function (n) {
            n >>= 2;
            check(0 <= n && n < this.fields.length);
            return this.fields[n];
        };
        RefAction.prototype.destroy = function () {
            this.fields = null;
            this.func = null;
        };
        RefAction.prototype.print = function () {
            if (pxsim.runtime && pxsim.runtime.refCountingDebug)
                console.log("RefAction id:" + this.id + " len:" + this.fields.length);
        };
        return RefAction;
    }(RefObject));
    pxsim.RefAction = RefAction;
    var pxtcore;
    (function (pxtcore) {
        function seedAddRandom(num) {
            // nothing yet
        }
        pxtcore.seedAddRandom = seedAddRandom;
        function mkAction(len, fn) {
            var r = new RefAction();
            r.len = len;
            r.func = fn;
            for (var i = 0; i < len; ++i)
                r.fields.push(null);
            return r;
        }
        pxtcore.mkAction = mkAction;
        function runAction(a, args) {
            var cb = pxsim.getResume();
            if (a instanceof RefAction) {
                cb(new FnWrapper(a.func, a.fields, args));
            }
            else {
                // no-closure case
                cb(new FnWrapper(a, null, args));
            }
        }
        pxtcore.runAction = runAction;
        var counters = {};
        // TODO move this somewhere else, so it can be invoked also on data coming from hardware
        function processPerfCounters(msg) {
            var r = "";
            var addfmtr = function (s, len) {
                r += s.length >= len ? s : ("              " + s).slice(-len);
            };
            var addfmtl = function (s, len) {
                r += s.length >= len ? s : (s + "                         ").slice(0, len);
            };
            var addnum = function (n) { return addfmtr("" + Math.round(n), 6); };
            var addstats = function (numstops, us) {
                addfmtr(Math.round(us) + "", 8);
                r += " /";
                addnum(numstops);
                r += " =";
                addnum(us / numstops);
            };
            for (var _i = 0, _a = msg.split(/\n/); _i < _a.length; _i++) {
                var line = _a[_i];
                if (!line)
                    continue;
                if (!/^\d/.test(line))
                    continue;
                var fields = line.split(/,/);
                var pi = counters[fields[2]];
                if (!pi)
                    counters[fields[2]] = pi = { stops: 0, us: 0, meds: [] };
                addfmtl(fields[2], 25);
                var numstops = parseInt(fields[0]);
                var us = parseInt(fields[1]);
                addstats(numstops, us);
                r += " |";
                addstats(numstops - pi.stops, us - pi.us);
                r += " ~";
                var med = parseInt(fields[3]);
                addnum(med);
                if (pi.meds.length > 10)
                    pi.meds.shift();
                pi.meds.push(med);
                var mm = pi.meds.slice();
                mm.sort(function (a, b) { return a - b; });
                var ubermed = mm[mm.length >> 1];
                r += " ~~";
                addnum(ubermed);
                pi.stops = numstops;
                pi.us = us;
                r += "\n";
            }
            console.log(r);
        }
        function dumpPerfCounters() {
            if (!pxsim.runtime || !pxsim.runtime.perfCounters)
                return;
            var csv = "calls,us,name\n";
            for (var _i = 0, _a = pxsim.runtime.perfCounters; _i < _a.length; _i++) {
                var p = _a[_i];
                p.lastFew.sort();
                var median = p.lastFew[p.lastFew.length >> 1];
                csv += p.numstops + "," + p.value + "," + p.name + "," + median + "\n";
            }
            processPerfCounters(csv);
            // console.log(csv)
        }
        pxtcore.dumpPerfCounters = dumpPerfCounters;
    })(pxtcore = pxsim.pxtcore || (pxsim.pxtcore = {}));
    var RefRefLocal = /** @class */ (function (_super) {
        __extends(RefRefLocal, _super);
        function RefRefLocal() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.v = null;
            return _this;
        }
        RefRefLocal.prototype.destroy = function () {
        };
        RefRefLocal.prototype.print = function () {
            if (pxsim.runtime && pxsim.runtime.refCountingDebug)
                console.log("RefRefLocal id:" + this.id + " v:" + this.v);
        };
        return RefRefLocal;
    }(RefObject));
    pxsim.RefRefLocal = RefRefLocal;
    var RefMap = /** @class */ (function (_super) {
        __extends(RefMap, _super);
        function RefMap() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            _this.vtable = pxsim.mkMapVTable();
            _this.data = [];
            return _this;
        }
        RefMap.prototype.findIdx = function (key) {
            for (var i = 0; i < this.data.length; ++i) {
                if (this.data[i].key == key)
                    return i;
            }
            return -1;
        };
        RefMap.prototype.destroy = function () {
            _super.prototype.destroy.call(this);
            for (var i = 0; i < this.data.length; ++i) {
                this.data[i].val = 0;
            }
            this.data = [];
        };
        RefMap.prototype.print = function () {
            if (pxsim.runtime && pxsim.runtime.refCountingDebug)
                console.log("RefMap id:" + this.id + " size:" + this.data.length);
        };
        RefMap.prototype.toAny = function () {
            var r = {};
            this.data.forEach(function (d) {
                r[d.key] = RefObject.toAny(d.val);
            });
            return r;
        };
        return RefMap;
    }(RefObject));
    pxsim.RefMap = RefMap;
    function num(v) {
        return v;
    }
    function ref(v) {
        if (v === undefined)
            return null;
        return v;
    }
    function dumpLivePointers() {
        if (pxsim.runtime)
            pxsim.runtime.dumpLivePointers();
    }
    pxsim.dumpLivePointers = dumpLivePointers;
    var numops;
    (function (numops) {
        function toString(v) {
            if (v === null)
                return "null";
            else if (v === undefined)
                return "undefined";
            return v.toString();
        }
        numops.toString = toString;
        function toBoolDecr(v) {
            return !!v;
        }
        numops.toBoolDecr = toBoolDecr;
        function toBool(v) {
            return !!v;
        }
        numops.toBool = toBool;
    })(numops = pxsim.numops || (pxsim.numops = {}));
    var langsupp;
    (function (langsupp) {
        function toInt(v) { return (v | 0); } // TODO
        langsupp.toInt = toInt;
        function toFloat(v) { return v; }
        langsupp.toFloat = toFloat;
        function ignore(v) { return v; }
        langsupp.ignore = ignore;
    })(langsupp = pxsim.langsupp || (pxsim.langsupp = {}));
    (function (pxtcore) {
        function ptrOfLiteral(v) {
            return v;
        }
        pxtcore.ptrOfLiteral = ptrOfLiteral;
        function debugMemLeaks() {
            dumpLivePointers();
        }
        pxtcore.debugMemLeaks = debugMemLeaks;
        function templateHash() {
            return 0;
        }
        pxtcore.templateHash = templateHash;
        function programHash() {
            return 0;
        }
        pxtcore.programHash = programHash;
        function programName() {
            return pxsim.title;
        }
        pxtcore.programName = programName;
        function programSize() {
            return 0;
        }
        pxtcore.programSize = programSize;
        function afterProgramPage() {
            return 0;
        }
        pxtcore.afterProgramPage = afterProgramPage;
        function getConfig(key, defl) {
            var r = pxsim.getConfig(key);
            if (r == null)
                return defl;
            return r;
        }
        pxtcore.getConfig = getConfig;
        // these shouldn't generally be called when compiled for simulator
        // provide implementation to silence warnings and as future-proofing
        function toInt(n) { return n >> 0; }
        pxtcore.toInt = toInt;
        function toUInt(n) { return n >>> 0; }
        pxtcore.toUInt = toUInt;
        function toDouble(n) { return n; }
        pxtcore.toDouble = toDouble;
        function toFloat(n) { return n; }
        pxtcore.toFloat = toFloat;
        function fromInt(n) { return n; }
        pxtcore.fromInt = fromInt;
        function fromUInt(n) { return n; }
        pxtcore.fromUInt = fromUInt;
        function fromDouble(n) { return n; }
        pxtcore.fromDouble = fromDouble;
        function fromFloat(n) { return n; }
        pxtcore.fromFloat = fromFloat;
        function fromBool(n) { return !!n; }
        pxtcore.fromBool = fromBool;
    })(pxtcore = pxsim.pxtcore || (pxsim.pxtcore = {}));
    var pxtrt;
    (function (pxtrt) {
        function toInt8(v) {
            return ((v & 0xff) << 24) >> 24;
        }
        pxtrt.toInt8 = toInt8;
        function toInt16(v) {
            return ((v & 0xffff) << 16) >> 16;
        }
        pxtrt.toInt16 = toInt16;
        function toInt32(v) {
            return v | 0;
        }
        pxtrt.toInt32 = toInt32;
        function toUInt32(v) {
            return v >>> 0;
        }
        pxtrt.toUInt32 = toUInt32;
        function toUInt8(v) {
            return v & 0xff;
        }
        pxtrt.toUInt8 = toUInt8;
        function toUInt16(v) {
            return v & 0xffff;
        }
        pxtrt.toUInt16 = toUInt16;
        function nullFix(v) {
            if (v === null || v === undefined || v === false)
                return 0;
            if (v === true)
                return 1;
            return v;
        }
        pxtrt.nullFix = nullFix;
        function nullCheck(v) {
            if (v === null || v === undefined)
                pxsim.U.userError("Dereferencing null/undefined value.");
        }
        pxtrt.nullCheck = nullCheck;
        function panic(code) {
            pxsim.U.userError("PANIC! Code " + code);
        }
        pxtrt.panic = panic;
        function stringToBool(s) {
            return s ? 1 : 0;
        }
        pxtrt.stringToBool = stringToBool;
        function ptrToBool(v) {
            return v ? 1 : 0;
        }
        pxtrt.ptrToBool = ptrToBool;
        function emptyToNull(s) {
            if (s == "")
                return 0;
            return s;
        }
        pxtrt.emptyToNull = emptyToNull;
        function ldlocRef(r) {
            return (r.v);
        }
        pxtrt.ldlocRef = ldlocRef;
        function stlocRef(r, v) {
            r.v = v;
        }
        pxtrt.stlocRef = stlocRef;
        function mklocRef() {
            return new RefRefLocal();
        }
        pxtrt.mklocRef = mklocRef;
        // Store a captured local in a closure. It returns the action, so it can be chained.
        function stclo(a, idx, v) {
            check(0 <= idx && idx < a.fields.length);
            check(a.fields[idx] === null);
            //console.log(`STCLO [${idx}] = ${v}`)
            a.fields[idx] = v;
            return a;
        }
        pxtrt.stclo = stclo;
        function runtimeWarning(msg) {
            pxsim.Runtime.postMessage(pxsim.getWarningMessage(msg));
        }
        pxtrt.runtimeWarning = runtimeWarning;
        function mkMap() {
            return new RefMap();
        }
        pxtrt.mkMap = mkMap;
        function mapGet(map, key) {
            return mapGetByString(map, pxtrt.mapKeyNames[key]);
        }
        pxtrt.mapGet = mapGet;
        function mapSet(map, key, val) {
            return mapSetByString(map, pxtrt.mapKeyNames[key], val);
        }
        pxtrt.mapSet = mapSet;
        function mapGetByString(map, key) {
            key += "";
            if (map instanceof RefRecord) {
                var r = map;
                return r.fields[key];
            }
            var i = map.findIdx(key);
            if (i < 0) {
                return undefined;
            }
            return (map.data[i].val);
        }
        pxtrt.mapGetByString = mapGetByString;
        function mapDeleteByString(map, key) {
            if (!(map instanceof RefMap))
                pxtrt.panic(923);
            var i = map.findIdx(key);
            if (i >= 0)
                map.data.splice(i, 1);
            return true;
        }
        pxtrt.mapDeleteByString = mapDeleteByString;
        pxtrt.mapSetGeneric = mapSetByString;
        pxtrt.mapGetGeneric = mapGetByString;
        function mapSetByString(map, key, val) {
            key += "";
            if (map instanceof RefRecord) {
                var r = map;
                r.fields[key] = val;
                return;
            }
            var i = map.findIdx(key);
            if (i < 0) {
                map.data.push({
                    key: key,
                    val: val,
                });
            }
            else {
                map.data[i].val = val;
            }
        }
        pxtrt.mapSetByString = mapSetByString;
        function keysOf(v) {
            var r = new pxsim.RefCollection();
            if (v instanceof RefMap)
                for (var _i = 0, _a = v.data; _i < _a.length; _i++) {
                    var k = _a[_i];
                    r.push(k.key);
                }
            return r;
        }
        pxtrt.keysOf = keysOf;
    })(pxtrt = pxsim.pxtrt || (pxsim.pxtrt = {}));
    (function (pxtcore) {
        function mkClassInstance(vtable) {
            check(!!vtable.methods);
            var r = new RefRecord();
            r.vtable = vtable;
            return r;
        }
        pxtcore.mkClassInstance = mkClassInstance;
        function switch_eq(a, b) {
            if (a == b) {
                return true;
            }
            return false;
        }
        pxtcore.switch_eq = switch_eq;
        function typeOf(obj) {
            return typeof obj;
        }
        pxtcore.typeOf = typeOf;
    })(pxtcore = pxsim.pxtcore || (pxsim.pxtcore = {}));
    var thread;
    (function (thread) {
        thread.panic = pxtrt.panic;
        function pause(ms) {
            var cb = pxsim.getResume();
            pxsim.runtime.schedule(function () { cb(); }, ms);
        }
        thread.pause = pause;
        function runInBackground(a) {
            pxsim.runtime.runFiberAsync(a).done();
        }
        thread.runInBackground = runInBackground;
        function forever(a) {
            function loop() {
                pxsim.runtime.runFiberAsync(a)
                    .then(function () { return Promise.delay(20); })
                    .then(loop)
                    .done();
            }
            pxtrt.nullCheck(a);
            loop();
        }
        thread.forever = forever;
    })(thread = pxsim.thread || (pxsim.thread = {}));
})(pxsim || (pxsim = {}));
var pxsim;
(function (pxsim) {
    // A ref-counted collection of either primitive or ref-counted objects (String, Image,
    // user-defined record, another collection)
    var RefCollection = /** @class */ (function (_super) {
        __extends(RefCollection, _super);
        function RefCollection() {
            var _this = _super.call(this) || this;
            _this.data = [];
            return _this;
        }
        RefCollection.prototype.toArray = function () {
            return this.data.slice(0);
        };
        RefCollection.prototype.toAny = function () {
            return this.data.map(function (v) { return pxsim.RefObject.toAny(v); });
        };
        RefCollection.prototype.toDebugString = function () {
            var s = "[";
            for (var i = 0; i < this.data.length; ++i) {
                if (i > 0)
                    s += ",";
                var newElem = pxsim.RefObject.toDebugString(this.data[i]);
                if (s.length + newElem.length > 100) {
                    if (i == 0) {
                        s += newElem.substr(0, 100);
                    }
                    s += "...";
                    break;
                }
                else {
                    s += newElem;
                }
            }
            s += "]";
            return s;
        };
        RefCollection.prototype.destroy = function () {
            var data = this.data;
            for (var i = 0; i < data.length; ++i) {
                data[i] = 0;
            }
            this.data = [];
        };
        RefCollection.prototype.isValidIndex = function (x) {
            return (x >= 0 && x < this.data.length);
        };
        RefCollection.prototype.push = function (x) {
            this.data.push(x);
        };
        RefCollection.prototype.pop = function () {
            return this.data.pop();
            ;
        };
        RefCollection.prototype.getLength = function () {
            return this.data.length;
        };
        RefCollection.prototype.setLength = function (x) {
            this.data.length = x;
        };
        RefCollection.prototype.getAt = function (x) {
            return this.data[x];
        };
        RefCollection.prototype.setAt = function (x, y) {
            this.data[x] = y;
        };
        RefCollection.prototype.insertAt = function (x, y) {
            this.data.splice(x, 0, y);
        };
        RefCollection.prototype.removeAt = function (x) {
            var ret = this.data.splice(x, 1);
            return ret[0]; // return the deleted element.
        };
        RefCollection.prototype.indexOf = function (x, start) {
            return this.data.indexOf(x, start);
        };
        RefCollection.prototype.print = function () {
            //console.log(`RefCollection id:${this.id} refs:${this.refcnt} len:${this.data.length} d0:${this.data[0]}`)
        };
        return RefCollection;
    }(pxsim.RefObject));
    pxsim.RefCollection = RefCollection;
    var Array_;
    (function (Array_) {
        function mk() {
            return new RefCollection();
        }
        Array_.mk = mk;
        function isArray(c) {
            return c instanceof RefCollection;
        }
        Array_.isArray = isArray;
        function length(c) {
            pxsim.pxtrt.nullCheck(c);
            return c.getLength();
        }
        Array_.length = length;
        function setLength(c, x) {
            pxsim.pxtrt.nullCheck(c);
            c.setLength(x);
        }
        Array_.setLength = setLength;
        function push(c, x) {
            pxsim.pxtrt.nullCheck(c);
            c.push(x);
        }
        Array_.push = push;
        function pop(c, x) {
            pxsim.pxtrt.nullCheck(c);
            var ret = c.pop();
            // no decr() since we're returning it
            return ret;
        }
        Array_.pop = pop;
        function getAt(c, x) {
            pxsim.pxtrt.nullCheck(c);
            var tmp = c.getAt(x);
            return tmp;
        }
        Array_.getAt = getAt;
        function removeAt(c, x) {
            pxsim.pxtrt.nullCheck(c);
            if (!c.isValidIndex(x))
                return;
            // no decr() since we're returning it
            return c.removeAt(x);
        }
        Array_.removeAt = removeAt;
        function insertAt(c, x, y) {
            pxsim.pxtrt.nullCheck(c);
            c.insertAt(x, y);
        }
        Array_.insertAt = insertAt;
        function setAt(c, x, y) {
            pxsim.pxtrt.nullCheck(c);
            c.setAt(x, y);
        }
        Array_.setAt = setAt;
        function indexOf(c, x, start) {
            pxsim.pxtrt.nullCheck(c);
            return c.indexOf(x, start);
        }
        Array_.indexOf = indexOf;
        function removeElement(c, x) {
            pxsim.pxtrt.nullCheck(c);
            var idx = indexOf(c, x, 0);
            if (idx >= 0) {
                removeAt(c, idx);
                return 1;
            }
            return 0;
        }
        Array_.removeElement = removeElement;
    })(Array_ = pxsim.Array_ || (pxsim.Array_ = {}));
    var Math_;
    (function (Math_) {
        // for explanations see:
        // http://stackoverflow.com/questions/3428136/javascript-integer-math-incorrect-results (second answer)
        // (but the code below doesn't come from there; I wrote it myself)
        Math_.imul = Math.imul || function (a, b) {
            var ah = (a >>> 16) & 0xffff;
            var al = a & 0xffff;
            var bh = (b >>> 16) & 0xffff;
            var bl = b & 0xffff;
            // the shift by 0 fixes the sign on the high part
            // the final |0 converts the unsigned value into a signed value
            return ((al * bl) + (((ah * bl + al * bh) << 16) >>> 0) | 0);
        };
        function idiv(x, y) {
            return ((x | 0) / (y | 0)) | 0;
        }
        Math_.idiv = idiv;
        function round(n) { return Math.round(n); }
        Math_.round = round;
        function roundWithPrecision(x, digits) {
            digits = digits | 0;
            // invalid digits input
            if (digits <= 0)
                return Math.round(x);
            if (x == 0)
                return 0;
            var r = 0;
            while (r == 0 && digits < 21) {
                var d = Math.pow(10, digits++);
                r = Math.round(x * d + Number.EPSILON) / d;
            }
            return r;
        }
        Math_.roundWithPrecision = roundWithPrecision;
        function ceil(n) { return Math.ceil(n); }
        Math_.ceil = ceil;
        function floor(n) { return Math.floor(n); }
        Math_.floor = floor;
        function sqrt(n) { return Math.sqrt(n); }
        Math_.sqrt = sqrt;
        function pow(x, y) {
            return Math.pow(x, y);
        }
        Math_.pow = pow;
        function clz32(n) { return Math.clz32(n); }
        Math_.clz32 = clz32;
        function log(n) { return Math.log(n); }
        Math_.log = log;
        function log10(n) { return Math.log10(n); }
        Math_.log10 = log10;
        function log2(n) { return Math.log2(n); }
        Math_.log2 = log2;
        function exp(n) { return Math.exp(n); }
        Math_.exp = exp;
        function sin(n) { return Math.sin(n); }
        Math_.sin = sin;
        function sinh(n) { return Math.sinh(n); }
        Math_.sinh = sinh;
        function cos(n) { return Math.cos(n); }
        Math_.cos = cos;
        function cosh(n) { return Math.cosh(n); }
        Math_.cosh = cosh;
        function tan(n) { return Math.tan(n); }
        Math_.tan = tan;
        function tanh(n) { return Math.tanh(n); }
        Math_.tanh = tanh;
        function asin(n) { return Math.asin(n); }
        Math_.asin = asin;
        function asinh(n) { return Math.asinh(n); }
        Math_.asinh = asinh;
        function acos(n) { return Math.acos(n); }
        Math_.acos = acos;
        function acosh(n) { return Math.acosh(n); }
        Math_.acosh = acosh;
        function atan(n) { return Math.atan(n); }
        Math_.atan = atan;
        function atanh(x) { return Math.atanh(x); }
        Math_.atanh = atanh;
        function atan2(y, x) { return Math.atan2(y, x); }
        Math_.atan2 = atan2;
        function trunc(x) { return x > 0 ? Math.floor(x) : Math.ceil(x); }
        Math_.trunc = trunc;
        function random() { return Math.random(); }
        Math_.random = random;
        function randomRange(min, max) {
            if (min == max)
                return min;
            if (min > max) {
                var t = min;
                min = max;
                max = t;
            }
            if (Math.floor(min) == min && Math.floor(max) == max)
                return min + Math.floor(Math.random() * (max - min + 1));
            else
                return min + Math.random() * (max - min);
        }
        Math_.randomRange = randomRange;
    })(Math_ = pxsim.Math_ || (pxsim.Math_ = {}));
    var Number_;
    (function (Number_) {
        function lt(x, y) { return x < y; }
        Number_.lt = lt;
        function le(x, y) { return x <= y; }
        Number_.le = le;
        function neq(x, y) { return !eq(x, y); }
        Number_.neq = neq;
        function eq(x, y) { return pxsim.pxtrt.nullFix(x) == pxsim.pxtrt.nullFix(y); }
        Number_.eq = eq;
        function eqDecr(x, y) {
            if (pxsim.pxtrt.nullFix(x) == pxsim.pxtrt.nullFix(y)) {
                return true;
            }
            else {
                return false;
            }
        }
        Number_.eqDecr = eqDecr;
        function gt(x, y) { return x > y; }
        Number_.gt = gt;
        function ge(x, y) { return x >= y; }
        Number_.ge = ge;
        function div(x, y) { return Math.floor(x / y) | 0; }
        Number_.div = div;
        function mod(x, y) { return x % y; }
        Number_.mod = mod;
        function bnot(x) { return ~x; }
        Number_.bnot = bnot;
        function toString(x) { return (x + ""); }
        Number_.toString = toString;
    })(Number_ = pxsim.Number_ || (pxsim.Number_ = {}));
    var thumb;
    (function (thumb) {
        function adds(x, y) { return (x + y) | 0; }
        thumb.adds = adds;
        function subs(x, y) { return (x - y) | 0; }
        thumb.subs = subs;
        function divs(x, y) { return Math.floor(x / y) | 0; }
        thumb.divs = divs;
        function muls(x, y) { return Math_.imul(x, y); }
        thumb.muls = muls;
        function ands(x, y) { return x & y; }
        thumb.ands = ands;
        function orrs(x, y) { return x | y; }
        thumb.orrs = orrs;
        function eors(x, y) { return x ^ y; }
        thumb.eors = eors;
        function lsls(x, y) { return x << y; }
        thumb.lsls = lsls;
        function lsrs(x, y) { return x >>> y; }
        thumb.lsrs = lsrs;
        function asrs(x, y) { return x >> y; }
        thumb.asrs = asrs;
        function bnot(x) { return ~x; }
        thumb.bnot = bnot;
        function ignore(v) { return v; }
        thumb.ignore = ignore;
    })(thumb = pxsim.thumb || (pxsim.thumb = {}));
    var avr;
    (function (avr) {
        function toInt(v) {
            return (v << 16) >> 16;
        }
        function adds(x, y) { return toInt(x + y); }
        avr.adds = adds;
        function subs(x, y) { return toInt(x - y); }
        avr.subs = subs;
        function divs(x, y) { return toInt(Math.floor(x / y)); }
        avr.divs = divs;
        function muls(x, y) { return toInt(Math_.imul(x, y)); }
        avr.muls = muls;
        function ands(x, y) { return toInt(x & y); }
        avr.ands = ands;
        function orrs(x, y) { return toInt(x | y); }
        avr.orrs = orrs;
        function eors(x, y) { return toInt(x ^ y); }
        avr.eors = eors;
        function lsls(x, y) { return toInt(x << y); }
        avr.lsls = lsls;
        function lsrs(x, y) { return (x & 0xffff) >>> y; }
        avr.lsrs = lsrs;
        function asrs(x, y) { return toInt(x >> y); }
        avr.asrs = asrs;
        function bnot(x) { return ~x; }
        avr.bnot = bnot;
        function ignore(v) { return v; }
        avr.ignore = ignore;
    })(avr = pxsim.avr || (pxsim.avr = {}));
    var String_;
    (function (String_) {
        function stringConv(v) {
            var cb = pxsim.getResume();
            if (v instanceof pxsim.RefRecord) {
                if (v.vtable.toStringMethod) {
                    pxsim.runtime.runFiberAsync(v.vtable.toStringMethod, v)
                        .done(function () {
                        cb(pxsim.runtime.currFrame.retval + "");
                    });
                    return;
                }
            }
            cb(v + "");
        }
        String_.stringConv = stringConv;
        function mkEmpty() {
            return "";
        }
        String_.mkEmpty = mkEmpty;
        function fromCharCode(code) {
            return (String.fromCharCode(code));
        }
        String_.fromCharCode = fromCharCode;
        function toNumber(s) {
            return parseFloat(s);
        }
        String_.toNumber = toNumber;
        // TODO check edge-conditions
        function concat(a, b) {
            return (a + b);
        }
        String_.concat = concat;
        function substring(s, i, j) {
            pxsim.pxtrt.nullCheck(s);
            return (s.slice(i, i + j));
        }
        String_.substring = substring;
        function equals(s1, s2) {
            return s1 == s2;
        }
        String_.equals = equals;
        function compare(s1, s2) {
            if (s1 == s2)
                return 0;
            if (s1 < s2)
                return -1;
            return 1;
        }
        String_.compare = compare;
        function compareDecr(s1, s2) {
            if (s1 == s2) {
                return 0;
            }
            if (s1 < s2)
                return -1;
            return 1;
        }
        String_.compareDecr = compareDecr;
        function length(s) {
            return s.length;
        }
        String_.length = length;
        function substr(s, start, length) {
            return (s.substr(start, length));
        }
        String_.substr = substr;
        function inRange(s, i) {
            pxsim.pxtrt.nullCheck(s);
            return 0 <= i && i < s.length;
        }
        function charAt(s, i) {
            return (s.charAt(i));
        }
        String_.charAt = charAt;
        function charCodeAt(s, i) {
            pxsim.pxtrt.nullCheck(s);
            return inRange(s, i) ? s.charCodeAt(i) : 0;
        }
        String_.charCodeAt = charCodeAt;
        function indexOf(s, searchValue, start) {
            pxsim.pxtrt.nullCheck(s);
            if (searchValue == null)
                return -1;
            return s.indexOf(searchValue, start);
        }
        String_.indexOf = indexOf;
        function lastIndexOf(s, searchValue, start) {
            pxsim.pxtrt.nullCheck(s);
            if (searchValue == null)
                return -1;
            return s.lastIndexOf(searchValue, start);
        }
        String_.lastIndexOf = lastIndexOf;
        function includes(s, searchValue, start) {
            pxsim.pxtrt.nullCheck(s);
            if (searchValue == null)
                return false;
            return s.includes(searchValue, start);
        }
        String_.includes = includes;
    })(String_ = pxsim.String_ || (pxsim.String_ = {}));
    var Boolean_;
    (function (Boolean_) {
        function toString(v) {
            return v ? "true" : "false";
        }
        Boolean_.toString = toString;
        function bang(v) {
            return !v;
        }
        Boolean_.bang = bang;
    })(Boolean_ = pxsim.Boolean_ || (pxsim.Boolean_ = {}));
    var RefBuffer = /** @class */ (function (_super) {
        __extends(RefBuffer, _super);
        function RefBuffer(data) {
            var _this = _super.call(this) || this;
            _this.data = data;
            return _this;
        }
        RefBuffer.prototype.print = function () {
            // console.log(`RefBuffer id:${this.id} refs:${this.refcnt} len:${this.data.length} d0:${this.data[0]}`)
        };
        return RefBuffer;
    }(pxsim.RefObject));
    pxsim.RefBuffer = RefBuffer;
    var BufferMethods;
    (function (BufferMethods) {
        // keep in sync with C++!
        var NumberFormat;
        (function (NumberFormat) {
            NumberFormat[NumberFormat["Int8LE"] = 1] = "Int8LE";
            NumberFormat[NumberFormat["UInt8LE"] = 2] = "UInt8LE";
            NumberFormat[NumberFormat["Int16LE"] = 3] = "Int16LE";
            NumberFormat[NumberFormat["UInt16LE"] = 4] = "UInt16LE";
            NumberFormat[NumberFormat["Int32LE"] = 5] = "Int32LE";
            NumberFormat[NumberFormat["Int8BE"] = 6] = "Int8BE";
            NumberFormat[NumberFormat["UInt8BE"] = 7] = "UInt8BE";
            NumberFormat[NumberFormat["Int16BE"] = 8] = "Int16BE";
            NumberFormat[NumberFormat["UInt16BE"] = 9] = "UInt16BE";
            NumberFormat[NumberFormat["Int32BE"] = 10] = "Int32BE";
            NumberFormat[NumberFormat["UInt32LE"] = 11] = "UInt32LE";
            NumberFormat[NumberFormat["UInt32BE"] = 12] = "UInt32BE";
            NumberFormat[NumberFormat["Float32LE"] = 13] = "Float32LE";
            NumberFormat[NumberFormat["Float64LE"] = 14] = "Float64LE";
            NumberFormat[NumberFormat["Float32BE"] = 15] = "Float32BE";
            NumberFormat[NumberFormat["Float64BE"] = 16] = "Float64BE";
        })(NumberFormat = BufferMethods.NumberFormat || (BufferMethods.NumberFormat = {}));
        ;
        function fmtInfoCore(fmt) {
            switch (fmt) {
                case NumberFormat.Int8LE: return -1;
                case NumberFormat.UInt8LE: return 1;
                case NumberFormat.Int16LE: return -2;
                case NumberFormat.UInt16LE: return 2;
                case NumberFormat.Int32LE: return -4;
                case NumberFormat.UInt32LE: return 4;
                case NumberFormat.Int8BE: return -10;
                case NumberFormat.UInt8BE: return 10;
                case NumberFormat.Int16BE: return -20;
                case NumberFormat.UInt16BE: return 20;
                case NumberFormat.Int32BE: return -40;
                case NumberFormat.UInt32BE: return 40;
                case NumberFormat.Float32LE: return 4;
                case NumberFormat.Float32BE: return 40;
                case NumberFormat.Float64LE: return 8;
                case NumberFormat.Float64BE: return 80;
                default: throw pxsim.U.userError("bad format");
            }
        }
        function fmtInfo(fmt) {
            var size = fmtInfoCore(fmt);
            var signed = false;
            if (size < 0) {
                signed = true;
                size = -size;
            }
            var swap = false;
            if (size >= 10) {
                swap = true;
                size /= 10;
            }
            var isFloat = fmt >= NumberFormat.Float32LE;
            return { size: size, signed: signed, swap: swap, isFloat: isFloat };
        }
        function getNumber(buf, fmt, offset) {
            var inf = fmtInfo(fmt);
            if (inf.isFloat) {
                var subarray = buf.data.buffer.slice(offset, offset + inf.size);
                if (inf.swap) {
                    var u8 = new Uint8Array(subarray);
                    u8.reverse();
                }
                if (inf.size == 4)
                    return new Float32Array(subarray)[0];
                else
                    return new Float64Array(subarray)[0];
            }
            var r = 0;
            for (var i = 0; i < inf.size; ++i) {
                r <<= 8;
                var off = inf.swap ? offset + i : offset + inf.size - i - 1;
                r |= buf.data[off];
            }
            if (inf.signed) {
                var missingBits = 32 - (inf.size * 8);
                r = (r << missingBits) >> missingBits;
            }
            else {
                r = r >>> 0;
            }
            return r;
        }
        BufferMethods.getNumber = getNumber;
        function setNumber(buf, fmt, offset, r) {
            var inf = fmtInfo(fmt);
            if (inf.isFloat) {
                var arr = new Uint8Array(inf.size);
                if (inf.size == 4)
                    new Float32Array(arr.buffer)[0] = r;
                else
                    new Float64Array(arr.buffer)[0] = r;
                if (inf.swap)
                    arr.reverse();
                for (var i = 0; i < inf.size; ++i) {
                    buf.data[offset + i] = arr[i];
                }
                return;
            }
            for (var i = 0; i < inf.size; ++i) {
                var off = !inf.swap ? offset + i : offset + inf.size - i - 1;
                buf.data[off] = (r & 0xff);
                r >>= 8;
            }
        }
        BufferMethods.setNumber = setNumber;
        function createBuffer(size) {
            return new RefBuffer(new Uint8Array(size));
        }
        BufferMethods.createBuffer = createBuffer;
        function createBufferFromHex(hex) {
            var r = createBuffer(hex.length >> 1);
            for (var i = 0; i < hex.length; i += 2)
                r.data[i >> 1] = parseInt(hex.slice(i, i + 2), 16);
            return r;
        }
        BufferMethods.createBufferFromHex = createBufferFromHex;
        function getBytes(buf) {
            // not sure if this is any useful...
            return buf.data;
        }
        BufferMethods.getBytes = getBytes;
        function inRange(buf, off) {
            pxsim.pxtrt.nullCheck(buf);
            return 0 <= off && off < buf.data.length;
        }
        function getUint8(buf, off) {
            return getByte(buf, off);
        }
        BufferMethods.getUint8 = getUint8;
        function getByte(buf, off) {
            if (inRange(buf, off))
                return buf.data[off];
            else
                return 0;
        }
        BufferMethods.getByte = getByte;
        function setUint8(buf, off, v) {
            setByte(buf, off, v);
        }
        BufferMethods.setUint8 = setUint8;
        function setByte(buf, off, v) {
            if (inRange(buf, off))
                buf.data[off] = v;
        }
        BufferMethods.setByte = setByte;
        function length(buf) {
            return buf.data.length;
        }
        BufferMethods.length = length;
        function fill(buf, value, offset, length) {
            if (offset === void 0) { offset = 0; }
            if (length === void 0) { length = -1; }
            if (offset < 0 || offset > buf.data.length)
                return;
            if (length < 0)
                length = buf.data.length;
            length = Math.min(length, buf.data.length - offset);
            buf.data.fill(value, offset, offset + length);
        }
        BufferMethods.fill = fill;
        function slice(buf, offset, length) {
            offset = Math.min(buf.data.length, offset);
            if (length < 0)
                length = buf.data.length;
            length = Math.min(length, buf.data.length - offset);
            return new RefBuffer(buf.data.slice(offset, offset + length));
        }
        BufferMethods.slice = slice;
        function toHex(buf) {
            var hex = "0123456789abcdef";
            var res = "";
            for (var i = 0; i < buf.data.length; ++i) {
                res += hex[buf.data[i] >> 4];
                res += hex[buf.data[i] & 0xf];
            }
            return res;
        }
        BufferMethods.toHex = toHex;
        function toString(buf) {
            return pxsim.U.fromUTF8(pxsim.U.uint8ArrayToString(buf.data));
        }
        BufferMethods.toString = toString;
        function memmove(dst, dstOff, src, srcOff, len) {
            if (src.buffer === dst.buffer) {
                memmove(dst, dstOff, src.slice(srcOff, srcOff + len), 0, len);
            }
            else {
                for (var i = 0; i < len; ++i)
                    dst[dstOff + i] = src[srcOff + i];
            }
        }
        var INT_MIN = -0x80000000;
        function shift(buf, offset, start, len) {
            if (len < 0)
                len = buf.data.length - start;
            if (start < 0 || start + len > buf.data.length || start + len < start
                || len == 0 || offset == 0 || offset == INT_MIN)
                return;
            if (len == 0 || offset == 0 || offset == INT_MIN)
                return;
            if (offset <= -len || offset >= len) {
                fill(buf, 0);
                return;
            }
            if (offset < 0) {
                offset = -offset;
                memmove(buf.data, start + offset, buf.data, start, len - offset);
                buf.data.fill(0, start, start + offset);
            }
            else {
                len = len - offset;
                memmove(buf.data, start, buf.data, start + offset, len);
                buf.data.fill(0, start + len, start + len + offset);
            }
        }
        BufferMethods.shift = shift;
        function rotate(buf, offset, start, len) {
            if (len < 0)
                len = buf.data.length - start;
            if (start < 0 || start + len > buf.data.length || start + len < start
                || len == 0 || offset == 0 || offset == INT_MIN)
                return;
            if (offset < 0)
                offset += len << 8; // try to make it positive
            offset %= len;
            if (offset < 0)
                offset += len;
            var data = buf.data;
            var n_first = offset;
            var first = 0;
            var next = n_first;
            var last = len;
            while (first != next) {
                var tmp = data[first + start];
                data[first++ + start] = data[next + start];
                data[next++ + start] = tmp;
                if (next == last) {
                    next = n_first;
                }
                else if (first == n_first) {
                    n_first = next;
                }
            }
        }
        BufferMethods.rotate = rotate;
        function write(buf, dstOffset, src, srcOffset, length) {
            if (srcOffset === void 0) { srcOffset = 0; }
            if (length === void 0) { length = -1; }
            if (length < 0)
                length = src.data.length;
            if (srcOffset < 0 || dstOffset < 0 || dstOffset > buf.data.length)
                return;
            length = Math.min(src.data.length - srcOffset, buf.data.length - dstOffset);
            if (length < 0)
                return;
            memmove(buf.data, dstOffset, src.data, srcOffset, length);
        }
        BufferMethods.write = write;
    })(BufferMethods = pxsim.BufferMethods || (pxsim.BufferMethods = {}));
})(pxsim || (pxsim = {}));
(function (pxsim) {
    var control;
    (function (control) {
        function createBufferFromUTF8(str) {
            return new pxsim.RefBuffer(pxsim.U.stringToUint8Array(pxsim.U.toUTF8(str)));
        }
        control.createBufferFromUTF8 = createBufferFromUTF8;
    })(control = pxsim.control || (pxsim.control = {}));
})(pxsim || (pxsim = {}));
// Localization functions. Please port any modifications over to pxtlib/util.ts
var pxsim;
(function (pxsim) {
    var localization;
    (function (localization) {
        var _localizeStrings = {};
        function setLocalizedStrings(strs) {
            _localizeStrings = strs || {};
        }
        localization.setLocalizedStrings = setLocalizedStrings;
        function lf(s) {
            return _localizeStrings[s] || s;
        }
        localization.lf = lf;
    })(localization = pxsim.localization || (pxsim.localization = {}));
})(pxsim || (pxsim = {}));
/// <reference path="../localtypings/pxtparts.d.ts"/>
var pxsim;
(function (pxsim) {
    var MIN_MESSAGE_WAIT_MS = 200;
    var tracePauseMs = 0;
    var U;
    (function (U) {
        // Keep these helpers unified with pxtlib/browserutils.ts
        function containsClass(el, classes) {
            return classes
                .split(/\s+/)
                .every(function (cls) { return containsSingleClass(el, cls); });
            function containsSingleClass(el, cls) {
                if (el.classList) {
                    return el.classList.contains(cls);
                }
                else {
                    var classes_1 = (el.className + "").split(/\s+/);
                    return !(classes_1.indexOf(cls) < 0);
                }
            }
        }
        U.containsClass = containsClass;
        function addClass(el, classes) {
            classes
                .split(/\s+/)
                .forEach(function (cls) { return addSingleClass(el, cls); });
            function addSingleClass(el, cls) {
                if (el.classList) {
                    el.classList.add(cls);
                }
                else {
                    var classes_2 = (el.className + "").split(/\s+/);
                    if (classes_2.indexOf(cls) < 0) {
                        el.className.baseVal += " " + cls;
                    }
                }
            }
        }
        U.addClass = addClass;
        function removeClass(el, classes) {
            classes
                .split(/\s+/)
                .forEach(function (cls) { return removeSingleClass(el, cls); });
            function removeSingleClass(el, cls) {
                if (el.classList) {
                    el.classList.remove(cls);
                }
                else {
                    el.className.baseVal = (el.className + "")
                        .split(/\s+/)
                        .filter(function (c) { return c != cls; })
                        .join(" ");
                }
            }
        }
        U.removeClass = removeClass;
        function remove(element) {
            element.parentElement.removeChild(element);
        }
        U.remove = remove;
        function removeChildren(element) {
            while (element.firstChild)
                element.removeChild(element.firstChild);
        }
        U.removeChildren = removeChildren;
        function clear(element) {
            removeChildren(element);
        }
        U.clear = clear;
        function assert(cond, msg) {
            if (msg === void 0) { msg = "Assertion failed"; }
            if (!cond) {
                debugger;
                throw new Error(msg);
            }
        }
        U.assert = assert;
        function repeatMap(n, fn) {
            n = n || 0;
            var r = [];
            for (var i = 0; i < n; ++i)
                r.push(fn(i));
            return r;
        }
        U.repeatMap = repeatMap;
        function userError(msg) {
            var e = new Error(msg);
            e.isUserError = true;
            throw e;
        }
        U.userError = userError;
        function now() {
            return Date.now();
        }
        U.now = now;
        var perf;
        // current time in microseconds
        function perfNowUs() {
            if (!perf)
                perf = typeof performance != "undefined" ?
                    performance.now.bind(performance) ||
                        performance.moznow.bind(performance) ||
                        performance.msNow.bind(performance) ||
                        performance.webkitNow.bind(performance) ||
                        performance.oNow.bind(performance) :
                    Date.now;
            return perf() * 1000;
        }
        U.perfNowUs = perfNowUs;
        function nextTick(f) {
            Promise._async._schedule(f);
        }
        U.nextTick = nextTick;
        // this will take lower 8 bits from each character
        function stringToUint8Array(input) {
            var len = input.length;
            var res = new Uint8Array(len);
            for (var i = 0; i < len; ++i)
                res[i] = input.charCodeAt(i) & 0xff;
            return res;
        }
        U.stringToUint8Array = stringToUint8Array;
        function uint8ArrayToString(input) {
            var len = input.length;
            var res = "";
            for (var i = 0; i < len; ++i)
                res += String.fromCharCode(input[i]);
            return res;
        }
        U.uint8ArrayToString = uint8ArrayToString;
        function fromUTF8(binstr) {
            if (!binstr)
                return "";
            // escape function is deprecated
            var escaped = "";
            for (var i = 0; i < binstr.length; ++i) {
                var k = binstr.charCodeAt(i) & 0xff;
                if (k == 37 || k > 0x7f) {
                    escaped += "%" + k.toString(16);
                }
                else {
                    escaped += binstr.charAt(i);
                }
            }
            // decodeURIComponent does the actual UTF8 decoding
            return decodeURIComponent(escaped);
        }
        U.fromUTF8 = fromUTF8;
        function toUTF8(str, cesu8) {
            var res = "";
            if (!str)
                return res;
            for (var i = 0; i < str.length; ++i) {
                var code = str.charCodeAt(i);
                if (code <= 0x7f)
                    res += str.charAt(i);
                else if (code <= 0x7ff) {
                    res += String.fromCharCode(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
                }
                else {
                    if (!cesu8 && 0xd800 <= code && code <= 0xdbff) {
                        var next = str.charCodeAt(++i);
                        if (!isNaN(next))
                            code = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
                    }
                    if (code <= 0xffff)
                        res += String.fromCharCode(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
                    else
                        res += String.fromCharCode(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
                }
            }
            return res;
        }
        U.toUTF8 = toUTF8;
    })(U = pxsim.U || (pxsim.U = {}));
    var BreakLoopException = /** @class */ (function () {
        function BreakLoopException() {
        }
        return BreakLoopException;
    }());
    pxsim.BreakLoopException = BreakLoopException;
    var pxtcore;
    (function (pxtcore) {
        function beginTry(lbl) {
            pxsim.runtime.currFrame.tryFrame = {
                parent: pxsim.runtime.currTryFrame(),
                handlerPC: lbl,
                handlerFrame: pxsim.runtime.currFrame
            };
        }
        pxtcore.beginTry = beginTry;
        function endTry() {
            var s = pxsim.runtime.currFrame;
            s.tryFrame = s.tryFrame.parent;
        }
        pxtcore.endTry = endTry;
        function throwValue(v) {
            var tf = pxsim.runtime.currTryFrame();
            if (!tf)
                U.userError("unhandled exception: " + v);
            var s = tf.handlerFrame;
            pxsim.runtime.currFrame = s;
            s.pc = tf.handlerPC;
            s.tryFrame = tf.parent;
            s.thrownValue = v;
            s.hasThrownValue = true;
            throw new BreakLoopException();
        }
        pxtcore.throwValue = throwValue;
        function getThrownValue() {
            var s = pxsim.runtime.currFrame;
            U.assert(s.hasThrownValue);
            s.hasThrownValue = false;
            return s.thrownValue;
        }
        pxtcore.getThrownValue = getThrownValue;
        function endFinally() {
            var s = pxsim.runtime.currFrame;
            if (s.hasThrownValue) {
                s.hasThrownValue = false;
                throwValue(s.thrownValue);
            }
        }
        pxtcore.endFinally = endFinally;
    })(pxtcore = pxsim.pxtcore || (pxsim.pxtcore = {}));
    function getResume() { return pxsim.runtime.getResume(); }
    pxsim.getResume = getResume;
    var SERIAL_BUFFER_LENGTH = 16;
    var BaseBoard = /** @class */ (function () {
        function BaseBoard() {
            var _this = this;
            this.messageListeners = [];
            this.serialOutBuffer = '';
            this.messages = [];
            this.lastSerialTime = 0;
            this.debouncedPostAll = function () {
                var nowtime = Date.now();
                if (nowtime - _this.lastSerialTime > MIN_MESSAGE_WAIT_MS) {
                    clearTimeout(_this.serialTimeout);
                    if (_this.messages.length) {
                        Runtime.postMessage({
                            type: 'bulkserial',
                            data: _this.messages,
                            id: pxsim.runtime.id,
                            sim: true
                        });
                        _this.messages = [];
                        _this.lastSerialTime = nowtime;
                    }
                }
                else {
                    _this.serialTimeout = setTimeout(_this.debouncedPostAll, 50);
                }
            };
            this.id = "b" + Math.round(Math.random() * 2147483647);
            this.bus = new pxsim.EventBus(pxsim.runtime);
        }
        BaseBoard.prototype.updateView = function () { };
        BaseBoard.prototype.receiveMessage = function (msg) {
            this.dispatchMessage(msg);
        };
        BaseBoard.prototype.dispatchMessage = function (msg) {
            for (var _i = 0, _a = this.messageListeners; _i < _a.length; _i++) {
                var listener = _a[_i];
                listener(msg);
            }
        };
        BaseBoard.prototype.addMessageListener = function (listener) {
            this.messageListeners.push(listener);
        };
        Object.defineProperty(BaseBoard.prototype, "storedState", {
            get: function () {
                if (!this.runOptions)
                    return {};
                if (!this.runOptions.storedState)
                    this.runOptions.storedState = {};
                return this.runOptions.storedState;
            },
            enumerable: true,
            configurable: true
        });
        BaseBoard.prototype.initAsync = function (msg) {
            this.runOptions = msg;
            return Promise.resolve();
        };
        BaseBoard.prototype.setStoredState = function (k, value) {
            if (value == null)
                delete this.storedState[k];
            else
                this.storedState[k] = value;
            Runtime.postMessage({
                type: "simulator",
                command: "setstate",
                stateKey: k,
                stateValue: value
            });
        };
        BaseBoard.prototype.onDebuggerResume = function () { };
        BaseBoard.prototype.screenshotAsync = function (width) {
            return Promise.resolve(undefined);
        };
        BaseBoard.prototype.kill = function () { };
        BaseBoard.prototype.writeSerial = function (s) {
            this.serialOutBuffer += s;
            if (/\n/.test(this.serialOutBuffer) || this.serialOutBuffer.length > SERIAL_BUFFER_LENGTH) {
                this.messages.push({
                    time: Date.now(),
                    data: this.serialOutBuffer
                });
                this.debouncedPostAll();
                this.serialOutBuffer = '';
            }
        };
        return BaseBoard;
    }());
    pxsim.BaseBoard = BaseBoard;
    var CoreBoard = /** @class */ (function (_super) {
        __extends(CoreBoard, _super);
        function CoreBoard() {
            var _this = _super.call(this) || this;
            // updates
            _this.updateSubscribers = [];
            _this.updateView = function () {
                _this.updateSubscribers.forEach(function (sub) { return sub(); });
            };
            _this.builtinParts = {};
            _this.builtinVisuals = {};
            _this.builtinPartVisuals = {};
            return _this;
        }
        CoreBoard.prototype.kill = function () {
            _super.prototype.kill.call(this);
            pxsim.AudioContextManager.stopAll();
        };
        return CoreBoard;
    }(BaseBoard));
    pxsim.CoreBoard = CoreBoard;
    var BareBoard = /** @class */ (function (_super) {
        __extends(BareBoard, _super);
        function BareBoard() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        return BareBoard;
    }(BaseBoard));
    function initBareRuntime() {
        pxsim.runtime.board = new BareBoard();
        var myRT = pxsim;
        myRT.basic = {
            pause: pxsim.thread.pause,
            showNumber: function (n) {
                var cb = getResume();
                console.log("SHOW NUMBER:", n);
                U.nextTick(cb);
            }
        };
        myRT.serial = {
            writeString: function (s) { return pxsim.runtime.board.writeSerial(s); },
        };
        myRT.pins = {
            createBuffer: pxsim.BufferMethods.createBuffer,
        };
        myRT.control = {
            inBackground: pxsim.thread.runInBackground
        };
    }
    pxsim.initBareRuntime = initBareRuntime;
    var LogType;
    (function (LogType) {
        LogType[LogType["UserSet"] = 0] = "UserSet";
        LogType[LogType["BackAdd"] = 1] = "BackAdd";
        LogType[LogType["BackRemove"] = 2] = "BackRemove";
    })(LogType || (LogType = {}));
    var EventQueue = /** @class */ (function () {
        function EventQueue(runtime, valueToArgs) {
            this.runtime = runtime;
            this.valueToArgs = valueToArgs;
            this.max = 5;
            this.events = [];
            this.awaiters = [];
            this._handlers = [];
            this._addRemoveLog = [];
        }
        EventQueue.prototype.push = function (e, notifyOne) {
            if (this.awaiters.length > 0) {
                if (notifyOne) {
                    var aw = this.awaiters.shift();
                    if (aw)
                        aw();
                }
                else {
                    var aws = this.awaiters.slice();
                    this.awaiters = [];
                    aws.forEach(function (aw) { return aw(); });
                }
            }
            if (this.handlers.length == 0 || this.events.length > this.max)
                return Promise.resolve();
            this.events.push(e);
            // start processing, if not already processing
            if (!this.lock)
                return this.poke();
            else
                return Promise.resolve();
        };
        EventQueue.prototype.poke = function () {
            var _this = this;
            this.lock = true;
            var events = this.events;
            // all events will be processed by concurrent promisified code below, so start afresh
            this.events = [];
            // in order semantics for events and handlers
            return Promise.each(events, function (value) {
                return Promise.each(_this.handlers, function (handler) {
                    return (_a = _this.runtime).runFiberAsync.apply(_a, [handler].concat((_this.valueToArgs ? _this.valueToArgs(value) : [value])));
                    var _a;
                });
            }).then(function () {
                // if some events arrived while processing above then keep processing
                if (_this.events.length > 0) {
                    return _this.poke();
                }
                else {
                    _this.lock = false;
                    // process the log (synchronous)
                    _this._addRemoveLog.forEach(function (l) {
                        if (l.log === LogType.BackAdd) {
                            _this.addHandler(l.act);
                        }
                        else if (l.log === LogType.BackRemove) {
                            _this.removeHandler(l.act);
                        }
                        else
                            _this.setHandler(l.act);
                    });
                    _this._addRemoveLog = [];
                    return Promise.resolve();
                }
            });
        };
        Object.defineProperty(EventQueue.prototype, "handlers", {
            get: function () {
                return this._handlers;
            },
            enumerable: true,
            configurable: true
        });
        EventQueue.prototype.setHandler = function (a) {
            if (!this.lock) {
                this._handlers = [a];
            }
            else {
                this._addRemoveLog.push({ act: a, log: LogType.UserSet });
            }
        };
        EventQueue.prototype.addHandler = function (a) {
            if (!this.lock) {
                var index = this._handlers.indexOf(a);
                // only add if new, just like CODAL
                if (index == -1) {
                    this._handlers.push(a);
                }
            }
            else {
                this._addRemoveLog.push({ act: a, log: LogType.BackAdd });
            }
        };
        EventQueue.prototype.removeHandler = function (a) {
            if (!this.lock) {
                var index = this._handlers.indexOf(a);
                if (index != -1) {
                    this._handlers.splice(index, 1);
                }
            }
            else {
                this._addRemoveLog.push({ act: a, log: LogType.BackRemove });
            }
        };
        EventQueue.prototype.addAwaiter = function (awaiter) {
            this.awaiters.push(awaiter);
        };
        return EventQueue;
    }());
    pxsim.EventQueue = EventQueue;
    // overriden at loadtime by specific implementation
    pxsim.initCurrentRuntime = undefined;
    pxsim.handleCustomMessage = undefined;
    function _leave(s, v) {
        s.parent.retval = v;
        return s.parent;
    }
    // wraps simulator code as STS code - useful for default event handlers
    function syntheticRefAction(f) {
        return pxtcore.mkAction(0, function (s) { return _leave(s, f(s)); });
    }
    pxsim.syntheticRefAction = syntheticRefAction;
    var TimeoutScheduled = /** @class */ (function () {
        function TimeoutScheduled(id, fn, totalRuntime, timestampCall) {
            this.id = id;
            this.fn = fn;
            this.totalRuntime = totalRuntime;
            this.timestampCall = timestampCall;
        }
        return TimeoutScheduled;
    }());
    pxsim.TimeoutScheduled = TimeoutScheduled;
    var PausedTimeout = /** @class */ (function () {
        function PausedTimeout(fn, timeRemaining) {
            this.fn = fn;
            this.timeRemaining = timeRemaining;
        }
        return PausedTimeout;
    }());
    pxsim.PausedTimeout = PausedTimeout;
    function mkVTable(src) {
        return {
            name: src.name,
            numFields: src.numFields,
            classNo: src.classNo,
            methods: src.methods,
            iface: src.iface,
            lastSubtypeNo: src.lastSubtypeNo,
            toStringMethod: src.toStringMethod
        };
    }
    pxsim.mkVTable = mkVTable;
    var mapVTable = null;
    function mkMapVTable() {
        if (!mapVTable)
            mapVTable = mkVTable({ name: "_Map", numFields: 0, classNo: 0, lastSubtypeNo: 0, methods: null });
        return mapVTable;
    }
    pxsim.mkMapVTable = mkMapVTable;
    var Runtime = /** @class */ (function () {
        function Runtime(msg) {
            var _this = this;
            this.numGlobals = 1000;
            this.dead = false;
            this.running = false;
            this.idleTimer = undefined;
            this.recording = false;
            this.recordingTimer = 0;
            this.recordingLastImageData = undefined;
            this.recordingWidth = undefined;
            this.startTime = 0;
            this.startTimeUs = 0;
            this.pausedTime = 0;
            this.lastPauseTimestamp = 0;
            this.globals = {};
            this.loopLock = null;
            this.loopLockWaitList = [];
            this.timeoutsScheduled = [];
            this.timeoutsPausedOnBreakpoint = [];
            this.pausedOnBreakpoint = false;
            this.perfOffset = 0;
            this.perfElapsed = 0;
            this.perfStack = 0;
            this.refCountingDebug = false;
            this.refObjId = 1;
            this.numDisplayUpdates = 0;
            U.assert(!!pxsim.initCurrentRuntime);
            this.id = msg.id;
            this.refCountingDebug = !!msg.refCountingDebug;
            var breakpoints = null;
            var currResume;
            var dbgHeap;
            var dbgResume;
            var breakFrame = null; // for step-over
            var lastYield = Date.now();
            var userGlobals;
            var __this = this; // ex
            // this is passed to generated code
            var evalIface = {
                runtime: this,
                oops: oops,
                doNothing: doNothing,
                pxsim: pxsim,
                globals: this.globals,
                setupYield: setupYield,
                maybeYield: maybeYield,
                setupDebugger: setupDebugger,
                isBreakFrame: isBreakFrame,
                breakpoint: breakpoint,
                trace: trace,
                checkStack: checkStack,
                leave: _leave,
                checkResumeConsumed: checkResumeConsumed,
                setupResume: setupResume,
                setupLambda: setupLambda,
                checkSubtype: checkSubtype,
                failedCast: failedCast,
                buildResume: buildResume,
                mkVTable: mkVTable,
            };
            function oops(msg) {
                throw new Error("sim error: " + msg);
            }
            function doNothing(s) {
                s.pc = -1;
                return _leave(s, s.parent.retval);
            }
            function flushLoopLock() {
                while (__this.loopLockWaitList.length > 0 && !__this.loopLock) {
                    var f = __this.loopLockWaitList.shift();
                    f();
                }
            }
            // Date.now() - 100ns on Chrome mac, 60ns on Safari iPhone XS
            // yield-- - 7ns on Chrome
            var yieldReset = function () { };
            function setupYield(reset) {
                yieldReset = reset;
            }
            function loopForSchedule(s) {
                var lock = new Object();
                var pc = s.pc;
                __this.loopLock = lock;
                return function () {
                    if (__this.dead)
                        return;
                    U.assert(s.pc == pc);
                    U.assert(__this.loopLock === lock);
                    __this.loopLock = null;
                    loop(s);
                    flushLoopLock();
                };
            }
            function maybeYield(s, pc, r0) {
                // If code is running on a breakpoint, it's because we are evaluating getters;
                // no need to yield in that case.
                if (__this.pausedOnBreakpoint)
                    return false;
                __this.cleanScheduledExpired();
                yieldReset();
                var now = Date.now();
                if (now - lastYield >= 20) {
                    lastYield = now;
                    s.pc = pc;
                    s.r0 = r0;
                    /* tslint:disable:no-string-based-set-timeout */
                    setTimeout(loopForSchedule(s), 5);
                    return true;
                }
                return false;
            }
            function setupDebugger(numBreakpoints, userCodeGlobals) {
                breakpoints = new Uint8Array(numBreakpoints);
                // start running and let user put a breakpoint on start
                breakpoints[0] = msg.breakOnStart ? 1 : 0;
                userGlobals = userCodeGlobals;
                return breakpoints;
            }
            function isBreakFrame(s) {
                if (!breakFrame)
                    return true; // nothing specified
                for (var p = breakFrame; p; p = p.parent) {
                    if (p == s)
                        return true;
                }
                return false;
            }
            function breakpoint(s, retPC, brkId, r0) {
                var lock = {};
                __this.loopLock = lock;
                U.assert(!dbgResume);
                U.assert(!dbgHeap);
                s.pc = retPC;
                s.r0 = r0;
                var _a = pxsim.getBreakpointMsg(s, brkId, userGlobals), msg = _a.msg, heap = _a.heap;
                dbgHeap = heap;
                Runtime.postMessage(msg);
                breakpoints[0] = 0;
                breakFrame = null;
                __this.pauseScheduled();
                dbgResume = function (m) {
                    dbgResume = null;
                    dbgHeap = null;
                    if (__this.dead)
                        return null;
                    __this.resumeAllPausedScheduled();
                    __this.board.onDebuggerResume();
                    pxsim.runtime = __this;
                    U.assert(s.pc == retPC);
                    breakpoints[0] = 0;
                    breakFrame = null;
                    switch (m.subtype) {
                        case "resume":
                            break;
                        case "stepover":
                            breakpoints[0] = 1;
                            breakFrame = s;
                            break;
                        case "stepinto":
                            breakpoints[0] = 1;
                            break;
                        case "stepout":
                            breakpoints[0] = 1;
                            breakFrame = s.parent || s;
                            break;
                    }
                    U.assert(__this.loopLock == lock);
                    __this.loopLock = null;
                    loop(s);
                    flushLoopLock();
                };
                return null;
            }
            function trace(brkId, s, retPc, info) {
                setupResume(s, retPc);
                if (info.functionName === "<main>" || info.fileName === "main.ts") {
                    Runtime.postMessage({
                        type: "debugger",
                        subtype: "trace",
                        breakpointId: brkId,
                    });
                    pxsim.thread.pause(tracePauseMs || 1);
                }
                else {
                    pxsim.thread.pause(0);
                }
                checkResumeConsumed();
            }
            function handleDebuggerMsg(msg) {
                switch (msg.subtype) {
                    case "config":
                        var cfg = msg;
                        if (cfg.setBreakpoints) {
                            breakpoints.fill(0);
                            for (var _i = 0, _a = cfg.setBreakpoints; _i < _a.length; _i++) {
                                var n = _a[_i];
                                breakpoints[n] = 1;
                            }
                        }
                        break;
                    case "traceConfig":
                        var trc = msg;
                        tracePauseMs = trc.interval;
                        break;
                    case "pause":
                        breakpoints[0] = 1;
                        breakFrame = null;
                        break;
                    case "resume":
                    case "stepover":
                    case "stepinto":
                    case "stepout":
                        if (dbgResume)
                            dbgResume(msg);
                        break;
                    case "variables":
                        var vmsg = msg;
                        var vars = undefined;
                        if (dbgHeap) {
                            var v = dbgHeap[vmsg.variablesReference];
                            if (v !== undefined)
                                vars = pxsim.dumpHeap(v, dbgHeap, vmsg.fields);
                        }
                        Runtime.postMessage({
                            type: "debugger",
                            subtype: "variables",
                            req_seq: msg.seq,
                            variables: vars
                        });
                        break;
                }
            }
            function loop(p) {
                if (__this.dead) {
                    console.log("Runtime terminated");
                    return;
                }
                U.assert(!__this.loopLock);
                __this.perfStartRuntime();
                try {
                    pxsim.runtime = __this;
                    while (!!p) {
                        __this.currFrame = p;
                        __this.currFrame.overwrittenPC = false;
                        p = p.fn(p);
                        //if (yieldSteps-- < 0 && maybeYield(p, p.pc, 0)) break;
                        __this.maybeUpdateDisplay();
                        if (__this.currFrame.overwrittenPC)
                            p = __this.currFrame;
                    }
                    __this.perfStopRuntime();
                }
                catch (e) {
                    if (e instanceof BreakLoopException) {
                        U.nextTick(loopForSchedule(__this.currFrame));
                        return;
                    }
                    __this.perfStopRuntime();
                    if (__this.errorHandler)
                        __this.errorHandler(e);
                    else {
                        console.error("Simulator crashed, no error handler", e.stack);
                        var msg_1 = pxsim.getBreakpointMsg(p, p.lastBrkId, userGlobals).msg;
                        msg_1.exceptionMessage = e.message;
                        msg_1.exceptionStack = e.stack;
                        Runtime.postMessage(msg_1);
                        if (__this.postError)
                            __this.postError(e);
                    }
                }
            }
            function checkStack(d) {
                if (d > 100)
                    U.userError("Stack overflow");
            }
            function actionCall(s) {
                s.depth = s.parent.depth + 1;
                checkStack(s.depth);
                s.pc = 0;
                return s;
            }
            function setupTop(cb) {
                var s = setupTopCore(cb);
                setupResume(s, 0);
                return s;
            }
            function setupTopCore(cb) {
                var frame = {
                    parent: null,
                    pc: 0,
                    depth: 0,
                    fn: function () {
                        if (cb)
                            cb(frame.retval);
                        return null;
                    }
                };
                return frame;
            }
            function topCall(fn, cb) {
                U.assert(!!__this.board);
                U.assert(!__this.running);
                __this.setRunning(true);
                var topFrame = setupTopCore(cb);
                var frame = {
                    parent: topFrame,
                    fn: fn,
                    depth: 0,
                    pc: 0
                };
                loop(actionCall(frame));
            }
            function checkResumeConsumed() {
                if (currResume)
                    oops("getResume() not called");
            }
            function setupResume(s, retPC) {
                currResume = buildResume(s, retPC);
            }
            function setupLambda(s, a) {
                if (a instanceof pxsim.RefAction) {
                    s.fn = a.func;
                    s.caps = a.fields;
                }
                else {
                    s.fn = a;
                }
            }
            function checkSubtype(v, vt) {
                if (!v)
                    return false;
                var vt2 = v.vtable;
                if (vt === vt2)
                    return true;
                return vt2 && vt.classNo <= vt2.classNo && vt2.classNo <= vt.lastSubtypeNo;
            }
            function failedCast(v) {
                // TODO generate the right panic codes
                if (pxsim.control && pxsim.control.dmesgValue)
                    pxsim.control.dmesgValue(v);
                oops("failed cast on " + v);
            }
            function buildResume(s, retPC) {
                if (currResume)
                    oops("already has resume");
                s.pc = retPC;
                var start = Date.now();
                var fn = function (v) {
                    if (__this.dead)
                        return;
                    if (__this.loopLock) {
                        __this.loopLockWaitList.push(function () { return fn(v); });
                        return;
                    }
                    pxsim.runtime = __this;
                    var now = Date.now();
                    if (now - start > 3)
                        lastYield = now;
                    U.assert(s.pc == retPC);
                    if (v instanceof pxsim.FnWrapper) {
                        var w = v;
                        var frame_1 = {
                            parent: s,
                            fn: w.func,
                            lambdaArgs: w.args,
                            pc: 0,
                            caps: w.caps,
                            depth: s.depth + 1,
                        };
                        // If the function we call never pauses, this would cause the stack
                        // to grow unbounded.
                        var lock_1 = {};
                        __this.loopLock = lock_1;
                        return U.nextTick(function () {
                            U.assert(__this.loopLock === lock_1);
                            __this.loopLock = null;
                            loop(actionCall(frame_1));
                            flushLoopLock();
                        });
                    }
                    s.retval = v;
                    return loop(s);
                };
                return fn;
            }
            // tslint:disable-next-line
            var entryPoint = eval(msg.code)(evalIface);
            this.run = function (cb) { return topCall(entryPoint, cb); };
            this.getResume = function () {
                if (!currResume)
                    oops("noresume");
                var r = currResume;
                currResume = null;
                return r;
            };
            this.setupTop = setupTop;
            this.handleDebuggerMsg = handleDebuggerMsg;
            this.entry = entryPoint;
            this.overwriteResume = function (retPC) {
                currResume = null;
                if (retPC >= 0)
                    _this.currFrame.pc = retPC;
                _this.currFrame.overwrittenPC = true;
            };
            pxsim.runtime = this;
            pxsim.initCurrentRuntime(msg);
        }
        Runtime.prototype.registerLiveObject = function (object) {
            var id = this.refObjId++;
            return id;
        };
        Runtime.prototype.runningTime = function () {
            return U.now() - this.startTime - this.pausedTime;
        };
        Runtime.prototype.runningTimeUs = function () {
            return 0xffffffff & ((U.perfNowUs() - this.startTimeUs) >> 0);
        };
        Runtime.prototype.runFiberAsync = function (a, arg0, arg1, arg2) {
            var _this = this;
            return new Promise(function (resolve, reject) {
                return U.nextTick(function () {
                    pxsim.runtime = _this;
                    _this.setupTop(resolve);
                    pxtcore.runAction(a, [arg0, arg1, arg2]);
                });
            });
        };
        Runtime.prototype.currTryFrame = function () {
            for (var p = this.currFrame; p; p = p.parent)
                if (p.tryFrame)
                    return p.tryFrame;
            return null;
        };
        Runtime.postMessage = function (data) {
            if (!data)
                return;
            // TODO: origins
            if (typeof window !== 'undefined' && window.parent && window.parent.postMessage) {
                window.parent.postMessage(data, "*");
            }
            if (Runtime.messagePosted)
                Runtime.messagePosted(data);
        };
        Runtime.postScreenshotAsync = function (opts) {
            var b = pxsim.runtime && pxsim.runtime.board;
            var p = b
                ? b.screenshotAsync().catch(function (e) {
                    console.debug("screenshot failed");
                    return undefined;
                })
                : Promise.resolve(undefined);
            return p.then(function (img) { return Runtime.postMessage({
                type: "screenshot",
                data: img,
                delay: opts && opts.delay
            }); });
        };
        Runtime.requestToggleRecording = function () {
            var r = pxsim.runtime;
            if (!r)
                return;
            Runtime.postMessage({
                type: "recorder",
                action: r.recording ? "stop" : "start"
            });
        };
        Runtime.prototype.restart = function () {
            this.kill();
            setTimeout(function () {
                return pxsim.Runtime.postMessage({
                    type: "simulator",
                    command: "restart"
                });
            }, 500);
        };
        Runtime.prototype.kill = function () {
            this.dead = true;
            // TODO fix this
            this.stopRecording();
            this.stopIdle();
            this.setRunning(false);
        };
        Runtime.prototype.updateDisplay = function () {
            this.board.updateView();
            this.postFrame();
        };
        Runtime.prototype.startRecording = function (width) {
            var _this = this;
            if (this.recording || !this.running)
                return;
            this.recording = true;
            this.recordingTimer = setInterval(function () { return _this.postFrame(); }, 66);
            this.recordingLastImageData = undefined;
            this.recordingWidth = width;
        };
        Runtime.prototype.stopRecording = function () {
            if (!this.recording)
                return;
            if (this.recordingTimer)
                clearInterval(this.recordingTimer);
            this.recording = false;
            this.recordingTimer = 0;
            this.recordingLastImageData = undefined;
            this.recordingWidth = undefined;
        };
        Runtime.prototype.postFrame = function () {
            var _this = this;
            if (!this.recording || !this.running)
                return;
            var time = pxsim.U.now();
            this.board.screenshotAsync(this.recordingWidth)
                .then(function (imageData) {
                // check for duplicate images
                if (_this.recordingLastImageData && imageData
                    && _this.recordingLastImageData.data.byteLength == imageData.data.byteLength) {
                    var d0 = _this.recordingLastImageData.data;
                    var d1 = imageData.data;
                    var n = d0.byteLength;
                    var i = 0;
                    for (i = 0; i < n; ++i)
                        if (d0[i] != d1[i])
                            break;
                    if (i == n)
                        return;
                }
                _this.recordingLastImageData = imageData;
                Runtime.postMessage({
                    type: "screenshot",
                    data: imageData,
                    time: time
                });
            });
        };
        Runtime.prototype.queueDisplayUpdate = function () {
            this.numDisplayUpdates++;
        };
        Runtime.prototype.maybeUpdateDisplay = function () {
            if (this.numDisplayUpdates) {
                this.numDisplayUpdates = 0;
                this.updateDisplay();
            }
        };
        Runtime.prototype.setRunning = function (r) {
            if (this.running != r) {
                this.running = r;
                if (this.running) {
                    this.startTime = U.now();
                    this.startTimeUs = U.perfNowUs();
                    Runtime.postMessage({
                        type: 'status',
                        frameid: pxsim.Embed.frameid,
                        runtimeid: this.id,
                        state: 'running'
                    });
                }
                else {
                    this.stopRecording();
                    this.stopIdle();
                    Runtime.postMessage({
                        type: 'status',
                        frameid: pxsim.Embed.frameid,
                        runtimeid: this.id,
                        state: 'killed'
                    });
                }
                if (this.stateChanged)
                    this.stateChanged();
            }
        };
        Runtime.prototype.dumpLivePointers = function () {
            return;
        };
        Runtime.prototype.setupPerfCounters = function (names) {
            if (!names || !names.length)
                return;
            this.perfCounters = names.map(function (s) { return new PerfCounter(s); });
        };
        Runtime.prototype.perfStartRuntime = function () {
            if (this.perfOffset !== 0) {
                this.perfStack++;
            }
            else {
                this.perfOffset = U.perfNowUs() - this.perfElapsed;
            }
        };
        Runtime.prototype.perfStopRuntime = function () {
            if (this.perfStack) {
                this.perfStack--;
            }
            else {
                this.perfElapsed = this.perfNow();
                this.perfOffset = 0;
            }
        };
        Runtime.prototype.perfNow = function () {
            if (this.perfOffset === 0)
                U.userError("bad time now");
            return (U.perfNowUs() - this.perfOffset) | 0;
        };
        Runtime.prototype.startPerfCounter = function (n) {
            if (!this.perfCounters)
                return;
            var c = this.perfCounters[n];
            if (c.start)
                U.userError("startPerf");
            c.start = this.perfNow();
        };
        Runtime.prototype.stopPerfCounter = function (n) {
            if (!this.perfCounters)
                return;
            var c = this.perfCounters[n];
            if (!c.start)
                U.userError("stopPerf");
            var curr = this.perfNow() - c.start;
            c.start = 0;
            // skip outliers
            // if (c.numstops > 30 && curr > 1.2 * c.value / c.numstops)
            //    return
            c.value += curr;
            c.numstops++;
            var p = c.lastFewPtr++;
            if (p >= c.lastFew.length) {
                p = 0;
                c.lastFewPtr = 1;
            }
            c.lastFew[p] = curr;
        };
        Runtime.prototype.startIdle = function () {
            var _this = this;
            // schedules handlers to run every 20ms
            if (this.idleTimer === undefined) {
                this.idleTimer = setInterval(function () {
                    if (!_this.running || _this.pausedOnBreakpoint)
                        return;
                    var bus = _this.board.bus;
                    if (bus)
                        bus.queueIdle();
                }, 20);
            }
        };
        Runtime.prototype.stopIdle = function () {
            if (this.idleTimer !== undefined) {
                clearInterval(this.idleTimer);
                this.idleTimer = undefined;
            }
        };
        // Wrapper for the setTimeout
        Runtime.prototype.schedule = function (fn, timeout) {
            var _this = this;
            if (timeout <= 0)
                timeout = 0;
            if (this.pausedOnBreakpoint) {
                this.timeoutsPausedOnBreakpoint.push(new PausedTimeout(fn, timeout));
                return -1;
            }
            var timestamp = U.now();
            var to = new TimeoutScheduled(-1, fn, timeout, timestamp);
            // We call the timeout function and add its id to the timeouts scheduled.
            var removeAndExecute = function () {
                var idx = _this.timeoutsScheduled.indexOf(to);
                if (idx >= 0)
                    _this.timeoutsScheduled.splice(idx, 1);
                fn();
            };
            to.id = setTimeout(removeAndExecute, timeout);
            this.timeoutsScheduled.push(to);
            return to.id;
        };
        // On breakpoint, pause all timeouts
        Runtime.prototype.pauseScheduled = function () {
            var _this = this;
            this.pausedOnBreakpoint = true;
            this.timeoutsScheduled.forEach(function (ts) {
                clearTimeout(ts.id);
                var elapsed = U.now() - ts.timestampCall;
                var timeRemaining = ts.totalRuntime - elapsed;
                // Time reamining needs to be at least 1. Setting to 0 causes fibers
                // to never resume after breaking
                if (timeRemaining <= 0)
                    timeRemaining = 1;
                _this.timeoutsPausedOnBreakpoint.push(new PausedTimeout(ts.fn, timeRemaining));
            });
            this.lastPauseTimestamp = U.now();
            this.timeoutsScheduled = [];
        };
        // When resuming after a breakpoint, restart all paused timeouts with their remaining time.
        Runtime.prototype.resumeAllPausedScheduled = function () {
            var _this = this;
            // Takes the list of all fibers paused on a breakpoint and resumes them.
            this.pausedOnBreakpoint = false;
            this.timeoutsPausedOnBreakpoint.forEach(function (pt) {
                _this.schedule(pt.fn, pt.timeRemaining);
            });
            if (this.lastPauseTimestamp) {
                this.pausedTime += U.now() - this.lastPauseTimestamp;
                this.lastPauseTimestamp = 0;
            }
            this.timeoutsPausedOnBreakpoint = [];
        };
        // Removes from the timeouts scheduled list all the ones that had been fulfilled.
        Runtime.prototype.cleanScheduledExpired = function () {
            var now = U.now();
            this.timeoutsScheduled = this.timeoutsScheduled.filter(function (ts) {
                var elapsed = now - ts.timestampCall;
                return ts.totalRuntime > elapsed;
            });
        };
        return Runtime;
    }());
    pxsim.Runtime = Runtime;
    var PerfCounter = /** @class */ (function () {
        function PerfCounter(name) {
            this.name = name;
            this.start = 0;
            this.numstops = 0;
            this.value = 0;
            this.lastFew = new Uint32Array(32);
            this.lastFewPtr = 0;
        }
        return PerfCounter;
    }());
    pxsim.PerfCounter = PerfCounter;
})(pxsim || (pxsim = {}));
var pxsim;
(function (pxsim) {
    var SimulatorState;
    (function (SimulatorState) {
        SimulatorState[SimulatorState["Unloaded"] = 0] = "Unloaded";
        SimulatorState[SimulatorState["Stopped"] = 1] = "Stopped";
        SimulatorState[SimulatorState["Pending"] = 2] = "Pending";
        SimulatorState[SimulatorState["Starting"] = 3] = "Starting";
        SimulatorState[SimulatorState["Running"] = 4] = "Running";
        SimulatorState[SimulatorState["Paused"] = 5] = "Paused";
        SimulatorState[SimulatorState["Suspended"] = 6] = "Suspended";
    })(SimulatorState = pxsim.SimulatorState || (pxsim.SimulatorState = {}));
    var SimulatorDebuggerCommand;
    (function (SimulatorDebuggerCommand) {
        SimulatorDebuggerCommand[SimulatorDebuggerCommand["StepInto"] = 0] = "StepInto";
        SimulatorDebuggerCommand[SimulatorDebuggerCommand["StepOver"] = 1] = "StepOver";
        SimulatorDebuggerCommand[SimulatorDebuggerCommand["StepOut"] = 2] = "StepOut";
        SimulatorDebuggerCommand[SimulatorDebuggerCommand["Resume"] = 3] = "Resume";
        SimulatorDebuggerCommand[SimulatorDebuggerCommand["Pause"] = 4] = "Pause";
    })(SimulatorDebuggerCommand = pxsim.SimulatorDebuggerCommand || (pxsim.SimulatorDebuggerCommand = {}));
    var SimulatorDriver = /** @class */ (function () {
        function SimulatorDriver(container, options) {
            if (options === void 0) { options = {}; }
            this.container = container;
            this.options = options;
            this.themes = ["blue", "red", "green", "yellow"];
            this.runId = '';
            this.nextFrameId = 0;
            this.frameCounter = 0;
            this.traceInterval = 0;
            this.breakpointsSet = false;
            this._runOptions = {};
            this.state = SimulatorState.Unloaded;
            this.frameCleanupTimeout = 0;
            this.debuggerSeq = 1;
            this.debuggerResolvers = {};
        }
        SimulatorDriver.prototype.isDebug = function () {
            return this._runOptions && !!this._runOptions.debug;
        };
        SimulatorDriver.prototype.hasParts = function () {
            return this._runOptions && this._runOptions.parts && !!this._runOptions.parts.length;
        };
        SimulatorDriver.prototype.setDirty = function () {
            // We suspend the simulator here to stop it from running without
            // interfering with the user's stopped state. We're not doing this check
            // in the driver because the driver should be able to switch from any state
            // to the suspend state, but in this codepath we only want to switch to the
            // suspended state if we're running
            if (this.state == pxsim.SimulatorState.Running)
                this.suspend();
        };
        SimulatorDriver.prototype.setPending = function () {
            this.setState(SimulatorState.Pending);
        };
        SimulatorDriver.prototype.focus = function () {
            var frame = this.simFrames()[0];
            if (frame)
                frame.focus();
        };
        SimulatorDriver.prototype.setStarting = function () {
            this.setState(SimulatorState.Starting);
        };
        SimulatorDriver.prototype.setHwDebugger = function (hw) {
            if (hw) {
                // TODO set some visual on the simulator frame
                // in future the simulator frame could reflect changes in the hardware
                this.hwdbg = hw;
                this.setState(SimulatorState.Running);
                this.container.style.opacity = "0.3";
            }
            else {
                delete this.container.style.opacity;
                this.hwdbg = null;
                this.setState(SimulatorState.Running);
                this.stop();
            }
        };
        SimulatorDriver.prototype.handleHwDebuggerMsg = function (msg) {
            if (!this.hwdbg)
                return;
            this.handleMessage(msg);
        };
        SimulatorDriver.prototype.setThemes = function (themes) {
            pxsim.U.assert(themes && themes.length > 0);
            this.themes = themes;
        };
        SimulatorDriver.prototype.startRecording = function (width) {
            var frame = this.simFrames()[0];
            if (!frame)
                return undefined;
            this.postMessage({
                type: 'recorder',
                action: 'start',
                width: width
            });
        };
        SimulatorDriver.prototype.stopRecording = function () {
            this.postMessage({ type: 'recorder', action: 'stop' });
        };
        SimulatorDriver.prototype.setFrameState = function (frame) {
            var icon = frame.nextElementSibling;
            var loader = icon.nextElementSibling;
            // apply state
            switch (this.state) {
                case SimulatorState.Pending:
                case SimulatorState.Starting:
                    icon.style.display = '';
                    icon.className = '';
                    loader.style.display = '';
                    break;
                case SimulatorState.Stopped:
                case SimulatorState.Suspended:
                    pxsim.U.addClass(frame, (this.state == SimulatorState.Stopped || (this._runOptions && this._runOptions.autoRun))
                        ? this.stoppedClass : this.invalidatedClass);
                    if (!this._runOptions || !this._runOptions.autoRun) {
                        icon.style.display = '';
                        icon.className = 'videoplay xicon icon';
                    }
                    else
                        icon.style.display = 'none';
                    loader.style.display = 'none';
                    this.scheduleFrameCleanup();
                    break;
                default:
                    pxsim.U.removeClass(frame, this.stoppedClass);
                    pxsim.U.removeClass(frame, this.invalidatedClass);
                    icon.style.display = 'none';
                    loader.style.display = 'none';
                    break;
            }
        };
        SimulatorDriver.prototype.setState = function (state) {
            var _this = this;
            if (this.state != state) {
                this.state = state;
                this.freeze(this.state == SimulatorState.Paused); // don't allow interaction when pause
                this.simFrames().forEach(function (frame) { return _this.setFrameState(frame); });
                if (this.options.onStateChanged)
                    this.options.onStateChanged(this.state);
            }
        };
        SimulatorDriver.prototype.freeze = function (value) {
            var cls = "pause-overlay";
            if (!value) {
                pxsim.util.toArray(this.container.querySelectorAll("div.simframe div." + cls))
                    .forEach(function (overlay) { return overlay.parentElement.removeChild(overlay); });
            }
            else {
                pxsim.util.toArray(this.container.querySelectorAll("div.simframe"))
                    .forEach(function (frame) {
                    if (frame.querySelector("div." + cls))
                        return;
                    var div = document.createElement("div");
                    div.className = cls;
                    div.onclick = function (ev) {
                        ev.preventDefault();
                        return false;
                    };
                    frame.appendChild(div);
                });
            }
        };
        SimulatorDriver.prototype.simFrames = function (skipLoaned) {
            if (skipLoaned === void 0) { skipLoaned = false; }
            var frames = pxsim.util.toArray(this.container.getElementsByTagName("iframe"));
            var loanedFrame = this.loanedIFrame();
            if (loanedFrame && !skipLoaned)
                frames.unshift(loanedFrame);
            return frames;
        };
        SimulatorDriver.prototype.postMessage = function (msg, source) {
            if (this.hwdbg) {
                this.hwdbg.postMessage(msg);
                return;
            }
            // dispatch to all iframe besides self
            var frames = this.simFrames();
            var broadcastmsg = msg;
            if (source && broadcastmsg && !!broadcastmsg.broadcast) {
                if (frames.length < 2) {
                    this.container.appendChild(this.createFrame());
                    frames = this.simFrames();
                }
                else if (frames[1].dataset['runid'] != this.runId) {
                    this.startFrame(frames[1]);
                }
            }
            for (var i = 0; i < frames.length; ++i) {
                var frame = frames[i];
                // same frame as source
                if (source && frame.contentWindow == source)
                    continue;
                // frame not in DOM
                if (!frame.contentWindow)
                    continue;
                frame.contentWindow.postMessage(msg, "*");
                // don't start more than 1 recorder
                if (msg.type == 'recorder'
                    && msg.action == "start")
                    break;
            }
        };
        SimulatorDriver.prototype.createFrame = function (light) {
            var _this = this;
            var wrapper = document.createElement("div");
            wrapper.className = "simframe ui embed";
            var frame = document.createElement('iframe');
            frame.id = 'sim-frame-' + this.nextId();
            frame.title = pxsim.localization.lf("Simulator");
            frame.allowFullscreen = true;
            frame.setAttribute('allow', 'autoplay');
            frame.setAttribute('sandbox', 'allow-same-origin allow-scripts');
            var simUrl = this.options.simUrl || (window.pxtConfig || {}).simUrl || "/sim/simulator.html";
            frame.className = 'no-select';
            frame.src = simUrl + '#' + frame.id;
            frame.frameBorder = "0";
            frame.dataset['runid'] = this.runId;
            wrapper.appendChild(frame);
            var i = document.createElement("i");
            i.className = "videoplay xicon icon";
            i.style.display = "none";
            i.onclick = function (ev) {
                ev.preventDefault();
                if (_this.state != SimulatorState.Running
                    && _this.state != SimulatorState.Starting) {
                    // we need to request to restart the simulator
                    if (_this.options.restart)
                        _this.options.restart();
                    else
                        _this.start();
                }
                frame.focus();
                return false;
            };
            wrapper.appendChild(i);
            var l = document.createElement("div");
            l.className = "ui active loader";
            i.style.display = "none";
            wrapper.appendChild(l);
            if (this._runOptions)
                this.applyAspectRatioToFrame(frame);
            return wrapper;
        };
        SimulatorDriver.prototype.preload = function (aspectRatio) {
            if (!this.simFrames().length) {
                this.container.appendChild(this.createFrame());
                this.applyAspectRatio(aspectRatio);
                this.setStarting();
            }
        };
        SimulatorDriver.prototype.stop = function (unload, starting) {
            if (unload === void 0) { unload = false; }
            if (starting === void 0) { starting = false; }
            this.clearDebugger();
            this.postMessage({ type: 'stop' });
            this.setState(starting ? SimulatorState.Starting : SimulatorState.Stopped);
            if (unload)
                this.unload();
        };
        SimulatorDriver.prototype.suspend = function () {
            this.postMessage({ type: 'stop' });
            this.setState(SimulatorState.Suspended);
        };
        SimulatorDriver.prototype.unload = function () {
            this.cancelFrameCleanup();
            pxsim.U.removeChildren(this.container);
            this.setState(SimulatorState.Unloaded);
            this._runOptions = undefined; // forget about program
            this._currentRuntime = undefined;
            this.runId = undefined;
        };
        SimulatorDriver.prototype.mute = function (mute) {
            if (this._currentRuntime)
                this._currentRuntime.mute = mute;
            this.postMessage({ type: 'mute', mute: mute });
        };
        SimulatorDriver.prototype.stopSound = function () {
            this.postMessage({ type: 'stopsound' });
        };
        SimulatorDriver.prototype.isLoanedSimulator = function (el) {
            return !!this.loanedSimulator && this.loanedIFrame() == el;
        };
        // returns a simulator iframe that can be hosted anywhere in the page
        // while a loaned simulator is active, all other iframes are suspended
        SimulatorDriver.prototype.loanSimulator = function () {
            if (this.loanedSimulator)
                return this.loanedSimulator;
            // reuse first simulator or create new one
            this.loanedSimulator = this.container.firstElementChild || this.createFrame();
            if (this.loanedSimulator.parentNode)
                this.container.removeChild(this.loanedSimulator);
            return this.loanedSimulator;
        };
        SimulatorDriver.prototype.unloanSimulator = function () {
            if (this.loanedSimulator) {
                if (this.loanedSimulator.parentNode)
                    this.loanedSimulator.parentNode.removeChild(this.loanedSimulator);
                this.container.insertBefore(this.loanedSimulator, this.container.firstElementChild);
                delete this.loanedSimulator;
            }
        };
        SimulatorDriver.prototype.loanedIFrame = function () {
            return this.loanedSimulator
                && this.loanedSimulator.parentNode
                && this.loanedSimulator.querySelector("iframe");
        };
        SimulatorDriver.prototype.cancelFrameCleanup = function () {
            if (this.frameCleanupTimeout) {
                clearTimeout(this.frameCleanupTimeout);
                this.frameCleanupTimeout = 0;
            }
        };
        SimulatorDriver.prototype.scheduleFrameCleanup = function () {
            var _this = this;
            this.cancelFrameCleanup();
            this.frameCleanupTimeout = setTimeout(function () {
                _this.frameCleanupTimeout = 0;
                _this.cleanupFrames();
            }, 5000);
        };
        SimulatorDriver.prototype.applyAspectRatio = function (ratio) {
            var _this = this;
            if (!ratio && !this._runOptions)
                return;
            var frames = this.simFrames();
            frames.forEach(function (frame) { return _this.applyAspectRatioToFrame(frame, ratio); });
        };
        SimulatorDriver.prototype.applyAspectRatioToFrame = function (frame, ratio) {
            var r = ratio || this._runOptions.aspectRatio;
            frame.parentElement.style.paddingBottom =
                (100 / r) + "%";
        };
        SimulatorDriver.prototype.cleanupFrames = function () {
            var _this = this;
            // drop unused extras frames after 5 seconds
            var frames = this.simFrames(true);
            frames.shift(); // drop first frame
            frames.forEach(function (frame) {
                if (_this.state == SimulatorState.Stopped
                    || frame.dataset['runid'] != _this.runId) {
                    if (_this.options.removeElement)
                        _this.options.removeElement(frame.parentElement);
                    else
                        frame.parentElement.remove();
                }
            });
        };
        SimulatorDriver.prototype.hide = function (completeHandler) {
            var _this = this;
            this.suspend();
            if (!this.options.removeElement)
                return;
            var frames = this.simFrames();
            frames.forEach(function (frame) {
                _this.options.removeElement(frame.parentElement, completeHandler);
            });
            // Execute the complete handler if there are no frames in sim view
            if (frames.length == 0 && completeHandler) {
                completeHandler();
            }
        };
        SimulatorDriver.prototype.unhide = function () {
            var _this = this;
            if (!this.options.unhideElement)
                return;
            var frames = this.simFrames();
            frames.forEach(function (frame) {
                _this.options.unhideElement(frame.parentElement);
            });
        };
        SimulatorDriver.prototype.run = function (js, opts) {
            if (opts === void 0) { opts = {}; }
            this._runOptions = opts;
            this.runId = this.nextId();
            // store information
            this._currentRuntime = {
                type: "run",
                boardDefinition: opts.boardDefinition,
                parts: opts.parts,
                fnArgs: opts.fnArgs,
                code: js,
                partDefinitions: opts.partDefinitions,
                mute: opts.mute,
                highContrast: opts.highContrast,
                light: opts.light,
                cdnUrl: opts.cdnUrl,
                localizedStrings: opts.localizedStrings,
                refCountingDebug: opts.refCountingDebug,
                version: opts.version,
                clickTrigger: opts.clickTrigger,
                breakOnStart: opts.breakOnStart,
                storedState: opts.storedState
            };
            this.start();
        };
        SimulatorDriver.prototype.restart = function () {
            this.stop();
            this.start();
        };
        SimulatorDriver.prototype.areBreakpointsSet = function () {
            return this.breakpointsSet;
        };
        SimulatorDriver.prototype.start = function () {
            this.clearDebugger();
            this.addEventListeners();
            this.applyAspectRatio();
            this.scheduleFrameCleanup();
            if (!this._currentRuntime)
                return; // nothing to do
            this.breakpointsSet = false;
            // first frame
            var frame = this.simFrames()[0];
            if (!frame) {
                var wrapper = this.createFrame(this._runOptions && this._runOptions.light);
                this.container.appendChild(wrapper);
                frame = wrapper.firstElementChild;
            }
            else
                this.startFrame(frame);
            this.setState(SimulatorState.Running);
            this.setTraceInterval(this.traceInterval);
        };
        // ensure _currentRuntime is ready
        SimulatorDriver.prototype.startFrame = function (frame) {
            if (!this._currentRuntime || !frame.contentWindow)
                return false;
            var msg = JSON.parse(JSON.stringify(this._currentRuntime));
            var mc = '';
            var m = /player=([A-Za-z0-9]+)/i.exec(window.location.href);
            if (m)
                mc = m[1];
            msg.frameCounter = ++this.frameCounter;
            msg.options = {
                theme: this.themes[this.nextFrameId++ % this.themes.length],
                player: mc
            };
            msg.id = msg.options.theme + "-" + this.nextId();
            frame.dataset['runid'] = this.runId;
            frame.dataset['runtimeid'] = msg.id;
            frame.contentWindow.postMessage(msg, "*");
            this.setFrameState(frame);
            return true;
        };
        SimulatorDriver.prototype.handleMessage = function (msg, source) {
            switch (msg.type || '') {
                case 'ready': {
                    var frameid = msg.frameid;
                    var frame = document.getElementById(frameid);
                    if (frame) {
                        this.startFrame(frame);
                        if (this.options.revealElement)
                            this.options.revealElement(frame);
                    }
                    break;
                }
                case 'status': {
                    var frameid = msg.frameid;
                    var frame = document.getElementById(frameid);
                    if (frame) {
                        var stmsg = msg;
                        switch (stmsg.state) {
                            case "killed":
                                if (stmsg.runtimeid == frame.dataset['runtimeid'])
                                    this.setState(SimulatorState.Stopped);
                                break;
                        }
                    }
                    break;
                }
                case 'simulator':
                    this.handleSimulatorCommand(msg);
                    break; //handled elsewhere
                case 'serial':
                case 'pxteditor':
                case 'screenshot':
                case 'custom':
                case 'recorder':
                    break; //handled elsewhere
                case 'debugger':
                    this.handleDebuggerMessage(msg);
                    break;
                case 'toplevelcodefinished':
                    if (this.options.onTopLevelCodeEnd)
                        this.options.onTopLevelCodeEnd();
                    break;
                default:
                    this.postMessage(msg, source);
                    break;
            }
        };
        SimulatorDriver.prototype.addEventListeners = function () {
            var _this = this;
            if (!this.listener) {
                this.listener = function (ev) {
                    if (_this.hwdbg)
                        return;
                    _this.handleMessage(ev.data, ev.source);
                };
                window.addEventListener('message', this.listener, false);
            }
        };
        SimulatorDriver.prototype.removeEventListeners = function () {
            if (this.listener) {
                window.removeEventListener('message', this.listener, false);
                this.listener = undefined;
            }
        };
        SimulatorDriver.prototype.resume = function (c) {
            var msg;
            switch (c) {
                case SimulatorDebuggerCommand.Resume:
                    msg = 'resume';
                    this.setState(SimulatorState.Running);
                    break;
                case SimulatorDebuggerCommand.StepInto:
                    msg = 'stepinto';
                    this.setState(SimulatorState.Running);
                    break;
                case SimulatorDebuggerCommand.StepOut:
                    msg = 'stepout';
                    this.setState(SimulatorState.Running);
                    break;
                case SimulatorDebuggerCommand.StepOver:
                    msg = 'stepover';
                    this.setState(SimulatorState.Running);
                    break;
                case SimulatorDebuggerCommand.Pause:
                    msg = 'pause';
                    break;
                default:
                    console.debug('unknown command');
                    return;
            }
            this.postMessage({ type: 'debugger', subtype: msg });
        };
        SimulatorDriver.prototype.setBreakpoints = function (breakPoints) {
            this.breakpointsSet = true;
            this.postDebuggerMessage("config", { setBreakpoints: breakPoints });
        };
        SimulatorDriver.prototype.setTraceInterval = function (intervalMs) {
            this.traceInterval = intervalMs;
            this.postDebuggerMessage("traceConfig", { interval: intervalMs });
        };
        SimulatorDriver.prototype.variablesAsync = function (id, fields) {
            return this.postDebuggerMessageAsync("variables", { variablesReference: id, fields: fields })
                .then(function (msg) { return msg; }, function (e) { return undefined; });
        };
        SimulatorDriver.prototype.handleSimulatorCommand = function (msg) {
            if (this.options.onSimulatorCommand)
                this.options.onSimulatorCommand(msg);
        };
        SimulatorDriver.prototype.clearDebugger = function () {
            var _this = this;
            var e = new Error("Debugging cancelled");
            Object.keys(this.debuggerResolvers)
                .forEach(function (k) {
                var reject = _this.debuggerResolvers[k].reject;
                reject(e);
            });
            this.debuggerResolvers = {};
            this.debuggerSeq++;
        };
        SimulatorDriver.prototype.handleDebuggerMessage = function (msg) {
            if (msg.subtype !== "trace") {
                console.log("DBG-MSG", msg.subtype, msg);
            }
            // resolve any request
            if (msg.seq) {
                var resolve = this.debuggerResolvers[msg.seq].resolve;
                if (resolve)
                    resolve(msg);
            }
            switch (msg.subtype) {
                case "warning":
                    if (this.options.onDebuggerWarning)
                        this.options.onDebuggerWarning(msg);
                    break;
                case "breakpoint":
                    var brk = msg;
                    if (this.state == SimulatorState.Running) {
                        if (brk.exceptionMessage)
                            this.suspend();
                        else
                            this.setState(SimulatorState.Paused);
                        if (this.options.onDebuggerBreakpoint)
                            this.options.onDebuggerBreakpoint(brk);
                        var stackTrace = brk.exceptionMessage + "\n";
                        for (var _i = 0, _a = brk.stackframes; _i < _a.length; _i++) {
                            var s = _a[_i];
                            var fi = s.funcInfo;
                            stackTrace += "   at " + fi.functionName + " (" + fi.fileName + ":" + (fi.line + 1) + ":" + (fi.column + 1) + ")\n";
                        }
                        if (brk.exceptionMessage)
                            console.error(stackTrace);
                    }
                    else {
                        console.error("debugger: trying to pause from " + this.state);
                    }
                    break;
                case "trace":
                    if (this.options.onTraceMessage) {
                        this.options.onTraceMessage(msg);
                    }
                    break;
                default:
                    var seq = msg.req_seq;
                    if (seq) {
                        var resolve = this.debuggerResolvers[seq].resolve;
                        if (resolve) {
                            delete this.debuggerResolvers[seq];
                            resolve(msg);
                        }
                    }
                    break;
            }
        };
        SimulatorDriver.prototype.postDebuggerMessageAsync = function (subtype, data) {
            var _this = this;
            if (data === void 0) { data = {}; }
            return new Promise(function (resolve, reject) {
                var seq = _this.debuggerSeq++;
                _this.debuggerResolvers[seq.toString()] = { resolve: resolve, reject: reject };
                _this.postDebuggerMessage(subtype, data, seq);
            });
        };
        SimulatorDriver.prototype.postDebuggerMessage = function (subtype, data, seq) {
            if (data === void 0) { data = {}; }
            var msg = JSON.parse(JSON.stringify(data));
            msg.type = "debugger";
            msg.subtype = subtype;
            if (seq)
                msg.seq = seq;
            this.postMessage(msg);
        };
        SimulatorDriver.prototype.nextId = function () {
            return this.nextFrameId++ + (Math.random() + '' + Math.random()).replace(/[^\d]/, '');
        };
        Object.defineProperty(SimulatorDriver.prototype, "stoppedClass", {
            get: function () {
                return (this.options && this.options.stoppedClass) || "grayscale";
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SimulatorDriver.prototype, "invalidatedClass", {
            get: function () {
                return (this.options && this.options.invalidatedClass) || "sepia";
            },
            enumerable: true,
            configurable: true
        });
        return SimulatorDriver;
    }());
    pxsim.SimulatorDriver = SimulatorDriver;
})(pxsim || (pxsim = {}));
var pxsim;
(function (pxsim) {
    ;
    ;
    function mkRange(a, b) {
        var res = [];
        for (; a < b; a++)
            res.push(a);
        return res;
    }
    pxsim.mkRange = mkRange;
    var EventBus = /** @class */ (function () {
        function EventBus(runtime, valueToArgs) {
            this.runtime = runtime;
            this.valueToArgs = valueToArgs;
            this.queues = {};
            this.backgroundHandlerFlag = false;
            this.nextNotifyEvent = 1024;
            this.schedulerID = 15; // DEVICE_ID_SCHEDULER
            this.idleEventID = 2; // DEVICE_SCHEDULER_EVT_IDLE
        }
        EventBus.prototype.setBackgroundHandlerFlag = function () {
            this.backgroundHandlerFlag = true;
        };
        EventBus.prototype.setNotify = function (notifyID, notifyOneID) {
            this.notifyID = notifyID;
            this.notifyOneID = notifyOneID;
        };
        EventBus.prototype.setIdle = function (schedulerID, idleEventID) {
            this.schedulerID = schedulerID;
            this.idleEventID = idleEventID;
        };
        EventBus.prototype.start = function (id, evid, background, create) {
            if (create === void 0) { create = false; }
            var key = (background ? "back" : "fore") + ":" + id + ":" + evid;
            if (!this.queues[key] && create)
                this.queues[key] = new pxsim.EventQueue(this.runtime, this.valueToArgs);
            return this.queues[key];
        };
        EventBus.prototype.listen = function (id, evid, handler) {
            // special handle for idle, start the idle timeout
            if (id == this.schedulerID && evid == this.idleEventID)
                this.runtime.startIdle();
            var q = this.start(id, evid, this.backgroundHandlerFlag, true);
            if (this.backgroundHandlerFlag)
                q.addHandler(handler);
            else
                q.setHandler(handler);
            this.backgroundHandlerFlag = false;
        };
        EventBus.prototype.removeBackgroundHandler = function (handler) {
            var _this = this;
            Object.keys(this.queues).forEach(function (k) {
                if (k.startsWith("back:"))
                    _this.queues[k].removeHandler(handler);
            });
        };
        // this handles ANY (0) semantics for id and evid
        EventBus.prototype.getQueues = function (id, evid, bg) {
            var ret = [this.start(0, 0, bg)];
            if (id == 0 && evid == 0)
                return ret;
            if (evid)
                ret.push(this.start(0, evid, bg));
            if (id)
                ret.push(this.start(id, 0, bg));
            if (id && evid)
                ret.push(this.start(id, evid, bg));
            return ret;
        };
        EventBus.prototype.queue = function (id, evid, value) {
            if (value === void 0) { value = null; }
            if (pxsim.runtime.pausedOnBreakpoint)
                return;
            // special handling for notify one
            var notifyOne = this.notifyID && this.notifyOneID && id == this.notifyOneID;
            if (notifyOne)
                id = this.notifyID;
            var queues = this.getQueues(id, evid, true).concat(this.getQueues(id, evid, false));
            this.lastEventValue = evid;
            this.lastEventTimestampUs = pxsim.U.perfNowUs();
            Promise.each(queues, function (q) {
                if (q)
                    return q.push(value, notifyOne);
                else
                    return Promise.resolve();
            });
        };
        EventBus.prototype.queueIdle = function () {
            if (this.schedulerID && this.idleEventID)
                this.queue(this.schedulerID, this.idleEventID);
        };
        // only for foreground handlers
        EventBus.prototype.wait = function (id, evid, cb) {
            var q = this.start(id, evid, false, true);
            q.addAwaiter(cb);
        };
        EventBus.prototype.getLastEventValue = function () {
            return this.lastEventValue;
        };
        EventBus.prototype.getLastEventTime = function () {
            return 0xffffffff & (this.lastEventTimestampUs - pxsim.runtime.startTimeUs);
        };
        return EventBus;
    }());
    pxsim.EventBus = EventBus;
    var AnimationQueue = /** @class */ (function () {
        function AnimationQueue(runtime) {
            var _this = this;
            this.runtime = runtime;
            this.queue = [];
            this.process = function () {
                var top = _this.queue[0];
                if (!top)
                    return;
                if (_this.runtime.dead)
                    return;
                runtime = _this.runtime;
                var res = top.frame();
                runtime.queueDisplayUpdate();
                runtime.maybeUpdateDisplay();
                if (res === false) {
                    _this.queue.shift();
                    // if there is already something in the queue, start processing
                    if (_this.queue[0]) {
                        _this.queue[0].setTimeoutHandle = setTimeout(_this.process, _this.queue[0].interval);
                    }
                    // this may push additional stuff
                    top.whenDone(false);
                }
                else {
                    top.setTimeoutHandle = setTimeout(_this.process, top.interval);
                }
            };
        }
        AnimationQueue.prototype.cancelAll = function () {
            var q = this.queue;
            this.queue = [];
            for (var _i = 0, q_1 = q; _i < q_1.length; _i++) {
                var a = q_1[_i];
                a.whenDone(true);
                if (a.setTimeoutHandle) {
                    clearTimeout(a.setTimeoutHandle);
                }
            }
        };
        AnimationQueue.prototype.cancelCurrent = function () {
            var top = this.queue[0];
            if (top) {
                this.queue.shift();
                top.whenDone(true);
                if (top.setTimeoutHandle) {
                    clearTimeout(top.setTimeoutHandle);
                }
            }
        };
        AnimationQueue.prototype.enqueue = function (anim) {
            if (!anim.whenDone)
                anim.whenDone = function () { };
            this.queue.push(anim);
            // we start processing when the queue goes from 0 to 1
            if (this.queue.length == 1)
                this.process();
        };
        AnimationQueue.prototype.executeAsync = function (anim) {
            var _this = this;
            pxsim.U.assert(!anim.whenDone);
            return new Promise(function (resolve, reject) {
                anim.whenDone = resolve;
                _this.enqueue(anim);
            });
        };
        return AnimationQueue;
    }());
    pxsim.AnimationQueue = AnimationQueue;
    var AudioContextManager;
    (function (AudioContextManager) {
        var _frequency = 0;
        var _context;
        var _vco;
        var _vca;
        var _mute = false; //mute audio
        // for playing WAV
        var audio;
        function context() {
            if (!_context)
                _context = freshContext();
            return _context;
        }
        function freshContext() {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            if (window.AudioContext) {
                try {
                    // this call my crash.
                    // SyntaxError: audio resources unavailable for AudioContext construction
                    return new window.AudioContext();
                }
                catch (e) { }
            }
            return undefined;
        }
        function mute(mute) {
            _mute = mute;
            stopAll();
            var ctx = context();
            if (!mute && ctx && ctx.state === "suspended")
                ctx.resume();
        }
        AudioContextManager.mute = mute;
        function stopTone() {
            if (_vca)
                _vca.gain.value = 0;
            _frequency = 0;
            if (audio) {
                audio.pause();
            }
        }
        function stopAll() {
            stopTone();
            muteAllChannels();
        }
        AudioContextManager.stopAll = stopAll;
        function stop() {
            stopTone();
        }
        AudioContextManager.stop = stop;
        function frequency() {
            return _frequency;
        }
        AudioContextManager.frequency = frequency;
        var waveForms = [null, "triangle", "sawtooth", "sine"];
        var noiseBuffer;
        var squareBuffer = [];
        function getNoiseBuffer() {
            if (!noiseBuffer) {
                var bufferSize = 100000;
                noiseBuffer = context().createBuffer(1, bufferSize, context().sampleRate);
                var output = noiseBuffer.getChannelData(0);
                var x = 0xf01ba80;
                for (var i = 0; i < bufferSize; i++) {
                    x ^= x << 13;
                    x ^= x >> 17;
                    x ^= x << 5;
                    output[i] = ((x & 1023) / 512.0) - 1.0;
                }
            }
            return noiseBuffer;
        }
        function getSquareBuffer(param) {
            if (!squareBuffer[param]) {
                var bufferSize = 1024;
                var buf = context().createBuffer(1, bufferSize, context().sampleRate);
                var output = buf.getChannelData(0);
                for (var i = 0; i < bufferSize; i++) {
                    output[i] = i < (param / 100 * bufferSize) ? 1 : -1;
                }
                squareBuffer[param] = buf;
            }
            return squareBuffer[param];
        }
        /*
        #define SW_TRIANGLE 1
        #define SW_SAWTOOTH 2
        #define SW_SINE 3 // TODO remove it? it takes space
        #define SW_NOISE 5
        #define SW_SQUARE_10 11
        #define SW_SQUARE_50 15
        */
        /*
         struct SoundInstruction {
             uint8_t soundWave;
             uint8_t flags;
             uint16_t frequency;
             uint16_t duration;
             uint16_t startVolume;
             uint16_t endVolume;
         };
         */
        function getGenerator(waveFormIdx, hz) {
            var form = waveForms[waveFormIdx];
            if (form) {
                var src = context().createOscillator();
                src.type = form;
                src.frequency.value = hz;
                return src;
            }
            var buffer;
            if (waveFormIdx == 5)
                buffer = getNoiseBuffer();
            else if (11 <= waveFormIdx && waveFormIdx <= 15)
                buffer = getSquareBuffer((waveFormIdx - 10) * 10);
            else
                return null;
            var node = context().createBufferSource();
            node.buffer = buffer;
            node.loop = true;
            if (waveFormIdx != 5)
                node.playbackRate.value = hz / (context().sampleRate / 1024);
            return node;
        }
        var channels = [];
        var Channel = /** @class */ (function () {
            function Channel() {
            }
            Channel.prototype.mute = function () {
                if (this.generator) {
                    this.generator.stop();
                    this.generator.disconnect();
                }
                if (this.gain)
                    this.gain.disconnect();
                this.gain = null;
                this.generator = null;
            };
            Channel.prototype.remove = function () {
                var idx = channels.indexOf(this);
                if (idx >= 0)
                    channels.splice(idx, 1);
                this.mute();
            };
            return Channel;
        }());
        var instrStopId = 1;
        function muteAllChannels() {
            instrStopId++;
            while (channels.length)
                channels[0].remove();
        }
        AudioContextManager.muteAllChannels = muteAllChannels;
        function queuePlayInstructions(when, b) {
            var prevStop = instrStopId;
            Promise.delay(when)
                .then(function () {
                if (prevStop != instrStopId)
                    return Promise.resolve();
                return playInstructionsAsync(b);
            })
                .done();
        }
        AudioContextManager.queuePlayInstructions = queuePlayInstructions;
        function playInstructionsAsync(b) {
            var prevStop = instrStopId;
            var ctx = context();
            var idx = 0;
            var ch = new Channel();
            var currWave = -1;
            var currFreq = -1;
            var timeOff = 0;
            if (channels.length > 5)
                channels[0].remove();
            channels.push(ch);
            var scaleVol = function (n) { return (n / 1024) * 2; };
            var finish = function () {
                ch.mute();
                timeOff = 0;
                currWave = -1;
                currFreq = -1;
            };
            var loopAsync = function () {
                if (idx >= b.data.length || !b.data[idx])
                    return Promise.delay(timeOff).then(finish);
                var soundWaveIdx = b.data[idx];
                var flags = b.data[idx + 1];
                var freq = pxsim.BufferMethods.getNumber(b, pxsim.BufferMethods.NumberFormat.UInt16LE, idx + 2);
                var duration = pxsim.BufferMethods.getNumber(b, pxsim.BufferMethods.NumberFormat.UInt16LE, idx + 4);
                var startVol = pxsim.BufferMethods.getNumber(b, pxsim.BufferMethods.NumberFormat.UInt16LE, idx + 6);
                var endVol = pxsim.BufferMethods.getNumber(b, pxsim.BufferMethods.NumberFormat.UInt16LE, idx + 8);
                var endFreq = pxsim.BufferMethods.getNumber(b, pxsim.BufferMethods.NumberFormat.UInt16LE, idx + 10);
                if (!ctx || prevStop != instrStopId)
                    return Promise.delay(duration);
                if (currWave != soundWaveIdx || currFreq != freq) {
                    if (ch.generator) {
                        return Promise.delay(timeOff)
                            .then(function () {
                            finish();
                            return loopAsync();
                        });
                    }
                    ch.generator = _mute ? null : getGenerator(soundWaveIdx, freq);
                    if (!ch.generator)
                        return Promise.delay(duration);
                    currWave = soundWaveIdx;
                    currFreq = freq;
                    ch.gain = ctx.createGain();
                    ch.gain.gain.value = scaleVol(startVol);
                    if (endFreq != freq) {
                        if (ch.generator.frequency != undefined) {
                            // If generator is an OscillatorNode
                            var param = ch.generator.frequency;
                            param.linearRampToValueAtTime(endFreq, ctx.currentTime + ((timeOff + duration) / 1000));
                        }
                        else if (ch.generator.playbackRate != undefined) {
                            // If generator is an AudioBufferSourceNode
                            var param = ch.generator.playbackRate;
                            param.linearRampToValueAtTime(endFreq / (context().sampleRate / 1024), ctx.currentTime + ((timeOff + duration) / 1000));
                        }
                    }
                    ch.generator.connect(ch.gain);
                    ch.gain.connect(ctx.destination);
                    ch.generator.start();
                }
                idx += 12;
                ch.gain.gain.setValueAtTime(scaleVol(startVol), ctx.currentTime + (timeOff / 1000));
                timeOff += duration;
                ch.gain.gain.linearRampToValueAtTime(scaleVol(endVol), ctx.currentTime + (timeOff / 1000));
                return loopAsync();
            };
            return loopAsync()
                .then(function () { return ch.remove(); });
        }
        AudioContextManager.playInstructionsAsync = playInstructionsAsync;
        function tone(frequency, gain) {
            if (_mute)
                return;
            if (frequency <= 0)
                return;
            _frequency = frequency;
            var ctx = context();
            if (!ctx)
                return;
            if (_vco) {
                _vco.stop();
                _vco.disconnect();
                _vco = undefined;
            }
            gain = Math.max(0, Math.min(1, gain));
            try {
                _vco = ctx.createOscillator();
                _vca = ctx.createGain();
                _vco.type = 'triangle';
                _vco.connect(_vca);
                _vca.connect(ctx.destination);
                _vca.gain.value = gain;
                _vco.start(0);
            }
            catch (e) {
                _vco = undefined;
                _vca = undefined;
                return;
            }
            _vco.frequency.value = frequency;
            _vca.gain.value = gain;
        }
        AudioContextManager.tone = tone;
        function uint8ArrayToString(input) {
            var len = input.length;
            var res = "";
            for (var i = 0; i < len; ++i)
                res += String.fromCharCode(input[i]);
            return res;
        }
        function playBufferAsync(buf) {
            if (!buf)
                return Promise.resolve();
            return new Promise(function (resolve) {
                function res() {
                    if (resolve)
                        resolve();
                    resolve = undefined;
                }
                var url = "data:audio/wav;base64," + window.btoa(uint8ArrayToString(buf.data));
                audio = new Audio(url);
                if (_mute)
                    audio.volume = 0;
                audio.onended = function () { return res(); };
                audio.onpause = function () { return res(); };
                audio.onerror = function () { return res(); };
                audio.play();
            });
        }
        AudioContextManager.playBufferAsync = playBufferAsync;
        function frequencyFromMidiNoteNumber(note) {
            return 440 * Math.pow(2, (note - 69) / 12);
        }
        function sendMidiMessage(buf) {
            var data = buf.data;
            if (!data.length)
                return;
            // no midi access or no midi element,
            // limited interpretation of midi commands
            var cmd = data[0] >> 4;
            var channel = data[0] & 0xf;
            var noteNumber = data[1] || 0;
            var noteFrequency = frequencyFromMidiNoteNumber(noteNumber);
            var velocity = data[2] || 0;
            //console.log(`midi: cmd ${cmd} channel (-1) ${channel} note ${noteNumber} f ${noteFrequency} v ${velocity}`)
            // play drums regardless
            if (cmd == 8 || ((cmd == 9) && (velocity == 0))) {
                // note off
                stopTone();
            }
            else if (cmd == 9) {
                // note on -- todo handle velocity
                tone(noteFrequency, 1);
                if (channel == 9)
                    setTimeout(function () { return stopTone(); }, 500);
            }
        }
        AudioContextManager.sendMidiMessage = sendMidiMessage;
    })(AudioContextManager = pxsim.AudioContextManager || (pxsim.AudioContextManager = {}));
    function isTouchEnabled() {
        return typeof window !== "undefined" &&
            ('ontouchstart' in window // works on most browsers
                || (navigator && navigator.maxTouchPoints > 0)); // works on IE10/11 and Surface);
    }
    pxsim.isTouchEnabled = isTouchEnabled;
    function hasPointerEvents() {
        return typeof window != "undefined" && !!window.PointerEvent;
    }
    pxsim.hasPointerEvents = hasPointerEvents;
    pxsim.pointerEvents = hasPointerEvents() ? {
        up: "pointerup",
        down: ["pointerdown"],
        move: "pointermove",
        enter: "pointerenter",
        leave: "pointerleave"
    } : isTouchEnabled() ?
        {
            up: "mouseup",
            down: ["mousedown", "touchstart"],
            move: "touchmove",
            enter: "touchenter",
            leave: "touchend"
        } :
        {
            up: "mouseup",
            down: ["mousedown"],
            move: "mousemove",
            enter: "mouseenter",
            leave: "mouseleave"
        };
})(pxsim || (pxsim = {}));
(function (pxsim) {
    var visuals;
    (function (visuals) {
        function translateEl(el, xy) {
            //TODO append translation instead of replacing the full transform
            pxsim.svg.hydrate(el, { transform: "translate(" + xy[0] + " " + xy[1] + ")" });
        }
        visuals.translateEl = translateEl;
        function composeSVG(opts) {
            var _a = [opts.el1, opts.el2], a = _a[0], b = _a[1];
            pxsim.U.assert(a.x == 0 && a.y == 0 && b.x == 0 && b.y == 0, "el1 and el2 x,y offsets not supported");
            var setXY = function (e, x, y) { return pxsim.svg.hydrate(e, { x: x, y: y }); };
            var setWH = function (e, w, h) {
                if (w)
                    pxsim.svg.hydrate(e, { width: w });
                if (h)
                    pxsim.svg.hydrate(e, { height: h });
            };
            var setWHpx = function (e, w, h) { return pxsim.svg.hydrate(e, { width: w + "px", height: h + "px" }); };
            var scaleUnit = opts.scaleUnit2;
            var aScalar = opts.scaleUnit2 / opts.scaleUnit1;
            var bScalar = 1.0;
            var aw = a.w * aScalar;
            var ah = a.h * aScalar;
            setWHpx(a.el, aw, ah);
            var bw = b.w * bScalar;
            var bh = b.h * bScalar;
            setWHpx(b.el, bw, bh);
            var _b = opts.margin, mt = _b[0], mr = _b[1], mb = _b[2], ml = _b[3];
            var mm = opts.middleMargin;
            var innerW = Math.max(aw, bw);
            var ax = mr + (innerW - aw) / 2.0;
            var ay = mt;
            setXY(a.el, ax, ay);
            var bx = mr + (innerW - bw) / 2.0;
            var by = ay + ah + mm;
            setXY(b.el, bx, by);
            var edges = [ay, ay + ah, by, by + bh];
            var w = mr + innerW + ml;
            var h = mt + ah + mm + bh + mb;
            var host = pxsim.svg.elt("svg", {
                "version": "1.0",
                "viewBox": "0 0 " + w + " " + h,
                "class": "sim-bb",
            });
            setWH(host, opts.maxWidth, opts.maxHeight);
            setXY(host, 0, 0);
            var under = pxsim.svg.child(host, "g");
            host.appendChild(a.el);
            host.appendChild(b.el);
            var over = pxsim.svg.child(host, "g");
            var toHostCoord1 = function (xy) {
                var x = xy[0], y = xy[1];
                return [x * aScalar + ax, y * aScalar + ay];
            };
            var toHostCoord2 = function (xy) {
                var x = xy[0], y = xy[1];
                return [x * bScalar + bx, y * bScalar + by];
            };
            return {
                under: under,
                over: over,
                host: host,
                edges: edges,
                scaleUnit: scaleUnit,
                toHostCoord1: toHostCoord1,
                toHostCoord2: toHostCoord2,
            };
        }
        visuals.composeSVG = composeSVG;
        function mkScaleFn(originUnit, targetUnit) {
            return function (n) { return n * (targetUnit / originUnit); };
        }
        visuals.mkScaleFn = mkScaleFn;
        function mkImageSVG(opts) {
            var scaleFn = mkScaleFn(opts.imageUnitDist, opts.targetUnitDist);
            var w = scaleFn(opts.width);
            var h = scaleFn(opts.height);
            var img = pxsim.svg.elt("image", {
                width: w,
                height: h
            });
            var href = img.setAttributeNS('http://www.w3.org/1999/xlink', 'href', "" + opts.image);
            return { el: img, w: w, h: h, x: 0, y: 0 };
        }
        visuals.mkImageSVG = mkImageSVG;
        function findDistSqrd(a, b) {
            var x = a[0] - b[0];
            var y = a[1] - b[1];
            return x * x + y * y;
        }
        visuals.findDistSqrd = findDistSqrd;
        function findClosestCoordIdx(a, bs) {
            var dists = bs.map(function (b) { return findDistSqrd(a, b); });
            var minIdx = dists.reduce(function (prevIdx, currDist, currIdx, arr) {
                return currDist < arr[prevIdx] ? currIdx : prevIdx;
            }, 0);
            return minIdx;
        }
        visuals.findClosestCoordIdx = findClosestCoordIdx;
        function mkTxt(cx, cy, size, rot, txt, txtXOffFactor, txtYOffFactor) {
            var el = pxsim.svg.elt("text");
            //HACK: these constants (txtXOffFactor, txtYOffFactor) tweak the way this algorithm knows how to center the text
            txtXOffFactor = txtXOffFactor || -0.33333;
            txtYOffFactor = txtYOffFactor || 0.3;
            var xOff = txtXOffFactor * size * txt.length;
            var yOff = txtYOffFactor * size;
            pxsim.svg.hydrate(el, {
                style: "font-size:" + size + "px;",
                transform: "translate(" + cx + " " + cy + ") rotate(" + rot + ") translate(" + xOff + " " + yOff + ")"
            });
            pxsim.U.addClass(el, "noselect");
            el.textContent = txt;
            return el;
        }
        visuals.mkTxt = mkTxt;
        visuals.GPIO_WIRE_COLORS = ["pink", "orange", "yellow", "green", "purple"];
        visuals.WIRE_COLOR_MAP = {
            black: "#514f4d",
            white: "#fcfdfc",
            gray: "#acabab",
            purple: "#a772a1",
            blue: "#01a6e8",
            green: "#3cce73",
            yellow: "#ece600",
            orange: "#fdb262",
            red: "#f44f43",
            brown: "#c89764",
            pink: "#ff80fa"
        };
        function mapWireColor(clr) {
            return visuals.WIRE_COLOR_MAP[clr] || clr;
        }
        visuals.mapWireColor = mapWireColor;
        ;
        visuals.PIN_DIST = 15;
        //expects rgb from 0,255, gives h in [0,360], s in [0, 100], l in [0, 100]
        function rgbToHsl(rgb) {
            var r = rgb[0], g = rgb[1], b = rgb[2];
            var _a = [r / 255, g / 255, b / 255], r$ = _a[0], g$ = _a[1], b$ = _a[2];
            var cMin = Math.min(r$, g$, b$);
            var cMax = Math.max(r$, g$, b$);
            var cDelta = cMax - cMin;
            var h, s, l;
            var maxAndMin = cMax + cMin;
            //lum
            l = (maxAndMin / 2) * 100;
            if (cDelta === 0)
                s = h = 0;
            else {
                //hue
                if (cMax === r$)
                    h = 60 * (((g$ - b$) / cDelta) % 6);
                else if (cMax === g$)
                    h = 60 * (((b$ - r$) / cDelta) + 2);
                else if (cMax === b$)
                    h = 60 * (((r$ - g$) / cDelta) + 4);
                //sat
                if (l > 50)
                    s = 100 * (cDelta / (2 - maxAndMin));
                else
                    s = 100 * (cDelta / maxAndMin);
            }
            return [Math.floor(h), Math.floor(s), Math.floor(l)];
        }
        visuals.rgbToHsl = rgbToHsl;
    })(visuals = pxsim.visuals || (pxsim.visuals = {}));
})(pxsim || (pxsim = {}));
var pxsim;
(function (pxsim) {
    var svg;
    (function (svg_1) {
        function parseString(xml) {
            return new DOMParser().parseFromString(xml, "image/svg+xml").getElementsByTagName("svg").item(0);
        }
        svg_1.parseString = parseString;
        function toDataUri(xml) {
            return 'data:image/svg+xml,' + encodeURI(xml);
        }
        svg_1.toDataUri = toDataUri;
        var pt;
        function cursorPoint(pt, svg, evt) {
            // clientX and clientY are not defined in iOS safari
            pt.x = evt.clientX != null ? evt.clientX : evt.pageX;
            pt.y = evt.clientY != null ? evt.clientY : evt.pageY;
            return pt.matrixTransform(svg.getScreenCTM().inverse());
        }
        svg_1.cursorPoint = cursorPoint;
        function rotateElement(el, originX, originY, degrees) {
            el.setAttribute('transform', "translate(" + originX + "," + originY + ") rotate(" + (degrees + 90) + ") translate(" + -originX + "," + -originY + ")");
        }
        svg_1.rotateElement = rotateElement;
        function hydrate(el, props) {
            for (var k in props) {
                if (k == "title") {
                    svg.title(el, props[k]);
                }
                else
                    el.setAttributeNS(null, k, props[k]);
            }
        }
        svg_1.hydrate = hydrate;
        function elt(name, props) {
            var el = document.createElementNS("http://www.w3.org/2000/svg", name);
            if (props)
                svg.hydrate(el, props);
            return el;
        }
        svg_1.elt = elt;
        function child(parent, name, props) {
            var el = svg.elt(name, props);
            parent.appendChild(el);
            return el;
        }
        svg_1.child = child;
        function mkPath(cls, data, title) {
            var p = { class: cls, d: data };
            if (title)
                p["title"] = title;
            var el = svg.elt("path");
            svg.hydrate(el, p);
            return el;
        }
        svg_1.mkPath = mkPath;
        function path(parent, cls, data, title) {
            var el = mkPath(cls, data, title);
            parent.appendChild(el);
            return el;
        }
        svg_1.path = path;
        function fill(el, c) {
            el.style.fill = c;
        }
        svg_1.fill = fill;
        function filter(el, c) {
            el.style.filter = c;
        }
        svg_1.filter = filter;
        function fills(els, c) {
            els.forEach(function (el) { return el.style.fill = c; });
        }
        svg_1.fills = fills;
        function isTouchEnabled() {
            return typeof window !== "undefined" &&
                ('ontouchstart' in window // works on most browsers
                    || navigator.maxTouchPoints > 0); // works on IE10/11 and Surface);
        }
        svg_1.isTouchEnabled = isTouchEnabled;
        function onClick(el, click) {
            var captured = false;
            pxsim.pointerEvents.down.forEach(function (evid) { return el.addEventListener(evid, function (ev) {
                captured = true;
                return true;
            }, false); });
            el.addEventListener(pxsim.pointerEvents.up, function (ev) {
                if (captured) {
                    captured = false;
                    click(ev);
                    ev.preventDefault();
                    return false;
                }
                return true;
            }, false);
        }
        svg_1.onClick = onClick;
        function buttonEvents(el, move, start, stop, keydown) {
            var captured = false;
            pxsim.pointerEvents.down.forEach(function (evid) { return el.addEventListener(evid, function (ev) {
                captured = true;
                if (start)
                    start(ev);
                return true;
            }, false); });
            el.addEventListener(pxsim.pointerEvents.move, function (ev) {
                if (captured) {
                    if (move)
                        move(ev);
                    ev.preventDefault();
                    return false;
                }
                return true;
            }, false);
            el.addEventListener(pxsim.pointerEvents.up, function (ev) {
                captured = false;
                if (stop)
                    stop(ev);
            }, false);
            el.addEventListener(pxsim.pointerEvents.leave, function (ev) {
                captured = false;
                if (stop)
                    stop(ev);
            }, false);
            el.addEventListener('keydown', function (ev) {
                captured = false;
                if (keydown)
                    keydown(ev);
            });
        }
        svg_1.buttonEvents = buttonEvents;
        function mkLinearGradient(id, horizontal) {
            if (horizontal === void 0) { horizontal = false; }
            var gradient = svg.elt("linearGradient");
            svg.hydrate(gradient, { id: id, x1: "0%", y1: "0%", x2: horizontal ? "100%" : "0%", y2: horizontal ? "0%" : "100%" });
            var stop1 = svg.child(gradient, "stop", { offset: "0%" });
            var stop2 = svg.child(gradient, "stop", { offset: "100%" });
            var stop3 = svg.child(gradient, "stop", { offset: "100%" });
            var stop4 = svg.child(gradient, "stop", { offset: "100%" });
            return gradient;
        }
        svg_1.mkLinearGradient = mkLinearGradient;
        function linearGradient(defs, id, horizontal) {
            if (horizontal === void 0) { horizontal = false; }
            var lg = mkLinearGradient(id, horizontal);
            defs.appendChild(lg);
            return lg;
        }
        svg_1.linearGradient = linearGradient;
        function setGradientColors(lg, start, end) {
            if (!lg)
                return;
            lg.childNodes[0].style.stopColor = start;
            lg.childNodes[1].style.stopColor = start;
            lg.childNodes[2].style.stopColor = end;
            lg.childNodes[3].style.stopColor = end;
        }
        svg_1.setGradientColors = setGradientColors;
        function setGradientValue(lg, percent) {
            if (lg.childNodes[1].getAttribute("offset") != percent) {
                lg.childNodes[1].setAttribute("offset", percent);
                lg.childNodes[2].setAttribute("offset", percent);
            }
        }
        svg_1.setGradientValue = setGradientValue;
        function animate(el, cls) {
            pxsim.U.addClass(el, cls);
            var p = el.parentElement;
            if (p) {
                p.removeChild(el);
                p.appendChild(el);
            }
        }
        svg_1.animate = animate;
        function mkTitle(txt) {
            var t = svg.elt("title");
            t.textContent = txt;
            return t;
        }
        svg_1.mkTitle = mkTitle;
        function title(el, txt) {
            var t = mkTitle(txt);
            el.appendChild(t);
            return t;
        }
        svg_1.title = title;
        function toHtmlColor(c) {
            var b = c & 0xFF;
            var g = (c >> 8) & 0xFF;
            var r = (c >> 16) & 0xFF;
            var a = (c >> 24) & 0xFF / 255;
            return "rgba(" + r + ", " + g + ", " + b + ", " + a + ")";
        }
        svg_1.toHtmlColor = toHtmlColor;
    })(svg = pxsim.svg || (pxsim.svg = {}));
})(pxsim || (pxsim = {}));
var pxsim;
(function (pxsim) {
    var Button = /** @class */ (function () {
        function Button(id) {
            this.id = id;
        }
        return Button;
    }());
    pxsim.Button = Button;
    var ButtonPairState = /** @class */ (function () {
        function ButtonPairState(props) {
            this.props = props;
            this.usesButtonAB = false;
            this.aBtn = new Button(this.props.ID_BUTTON_A);
            this.bBtn = new Button(this.props.ID_BUTTON_B);
            this.abBtn = new Button(this.props.ID_BUTTON_AB);
            this.abBtn.virtual = true;
        }
        return ButtonPairState;
    }());
    pxsim.ButtonPairState = ButtonPairState;
})(pxsim || (pxsim = {}));
var pxsim;
(function (pxsim) {
    var CompassState = /** @class */ (function () {
        function CompassState() {
            this.usesHeading = false;
            this.heading = 90;
        }
        return CompassState;
    }());
    pxsim.CompassState = CompassState;
})(pxsim || (pxsim = {}));
var pxsim;
(function (pxsim) {
    var FileSystemState = /** @class */ (function () {
        function FileSystemState() {
            this.files = {};
        }
        FileSystemState.prototype.append = function (file, content) {
            this.files[file] = (this.files[file] || "") + content;
        };
        FileSystemState.prototype.remove = function (file) {
            delete this.files[file];
        };
        return FileSystemState;
    }());
    pxsim.FileSystemState = FileSystemState;
})(pxsim || (pxsim = {}));
var pxsim;
(function (pxsim) {
    var LightSensorState = /** @class */ (function () {
        function LightSensorState() {
            this.usesLightLevel = false;
            this.lightLevel = 128;
        }
        return LightSensorState;
    }());
    pxsim.LightSensorState = LightSensorState;
})(pxsim || (pxsim = {}));
var pxsim;
(function (pxsim) {
    var NeoPixelMode;
    (function (NeoPixelMode) {
        NeoPixelMode[NeoPixelMode["RGB"] = 0] = "RGB";
        NeoPixelMode[NeoPixelMode["RGBW"] = 1] = "RGBW";
    })(NeoPixelMode = pxsim.NeoPixelMode || (pxsim.NeoPixelMode = {}));
    ;
    var NeoPixelState = /** @class */ (function () {
        function NeoPixelState() {
            this.buffers = {};
            this.colors = {};
            this.dirty = {};
        }
        NeoPixelState.prototype.updateBuffer = function (buffer, pin) {
            this.buffers[pin] = buffer;
            this.dirty[pin] = true;
        };
        NeoPixelState.prototype.getColors = function (pin, mode) {
            var outColors = this.colors[pin] || (this.colors[pin] = []);
            if (this.dirty[pin]) {
                var buf = this.buffers[pin] || (this.buffers[pin] = new Uint8Array([]));
                this.readNeoPixelBuffer(buf, outColors, mode);
                this.dirty[pin] = false;
            }
            return outColors;
        };
        NeoPixelState.prototype.readNeoPixelBuffer = function (inBuffer, outColors, mode) {
            var buf = inBuffer;
            var stride = mode === NeoPixelMode.RGBW ? 4 : 3;
            var pixelCount = Math.floor(buf.length / stride);
            for (var i = 0; i < pixelCount; i++) {
                // NOTE: for whatever reason, NeoPixels pack GRB not RGB
                var r = buf[i * stride + 1];
                var g = buf[i * stride + 0];
                var b = buf[i * stride + 2];
                var w = 0;
                if (stride === 4)
                    w = buf[i * stride + 3];
                outColors[i] = [r, g, b, w];
            }
        };
        return NeoPixelState;
    }());
    pxsim.NeoPixelState = NeoPixelState;
})(pxsim || (pxsim = {}));
var pxsim;
(function (pxsim) {
    var visuals;
    (function (visuals) {
        visuals.mkBoardView = function (opts) {
            var boardVis = opts.visual;
            return new visuals.GenericBoardSvg({
                visualDef: boardVis,
                boardDef: opts.boardDef,
                wireframe: opts.wireframe,
            });
        };
        var BoardHost = /** @class */ (function () {
            function BoardHost(view, opts) {
                var _this = this;
                this.parts = [];
                this.boardView = view;
                this.opts = opts;
                if (!opts.boardDef.pinStyles)
                    opts.boardDef.pinStyles = {};
                this.state = opts.state;
                var activeComponents = opts.partsList;
                var useBreadboardView = 0 < activeComponents.length || opts.forceBreadboardLayout;
                if (useBreadboardView) {
                    this.breadboard = new visuals.Breadboard({
                        wireframe: opts.wireframe,
                    });
                    var bMarg = opts.boardDef.marginWhenBreadboarding || [0, 0, 40, 0];
                    var composition = visuals.composeSVG({
                        el1: this.boardView.getView(),
                        scaleUnit1: this.boardView.getPinDist(),
                        el2: this.breadboard.getSVGAndSize(),
                        scaleUnit2: this.breadboard.getPinDist(),
                        margin: [bMarg[0], bMarg[1], 20, bMarg[3]],
                        middleMargin: bMarg[2],
                        maxWidth: opts.maxWidth,
                        maxHeight: opts.maxHeight,
                    });
                    var under = composition.under;
                    var over = composition.over;
                    this.view = composition.host;
                    var edges = composition.edges;
                    this.fromMBCoord = composition.toHostCoord1;
                    this.fromBBCoord = composition.toHostCoord2;
                    this.partGroup = over;
                    this.partOverGroup = pxsim.svg.child(this.view, "g");
                    this.style = pxsim.svg.child(this.view, "style", {});
                    this.defs = pxsim.svg.child(this.view, "defs", {});
                    this.wireFactory = new visuals.WireFactory(under, over, edges, this.style, this.getLocCoord.bind(this), this.getPinStyle.bind(this));
                    var allocRes = pxsim.allocateDefinitions({
                        boardDef: opts.boardDef,
                        partDefs: opts.partDefs,
                        fnArgs: opts.fnArgs,
                        getBBCoord: this.breadboard.getCoord.bind(this.breadboard),
                        partsList: activeComponents,
                    });
                    if (!allocRes.partsAndWires.length && !opts.forceBreadboardLayout) {
                        // nothing got allocated, so we rollback the changes.
                        useBreadboardView = false;
                    }
                    else {
                        this.addAll(allocRes);
                        if (!allocRes.requiresBreadboard && !opts.forceBreadboardRender)
                            useBreadboardView = false;
                        else if (allocRes.hideBreadboard && this.breadboard)
                            this.breadboard.hide();
                    }
                }
                if (!useBreadboardView) {
                    // delete any kind of left over
                    delete this.breadboard;
                    delete this.wireFactory;
                    delete this.partOverGroup;
                    delete this.partGroup;
                    delete this.style;
                    delete this.defs;
                    delete this.fromBBCoord;
                    delete this.fromMBCoord;
                    // allocate view
                    var el = this.boardView.getView().el;
                    this.view = el;
                    this.partGroup = pxsim.svg.child(this.view, "g");
                    this.partOverGroup = pxsim.svg.child(this.view, "g");
                    if (opts.maxWidth)
                        pxsim.svg.hydrate(this.view, { width: opts.maxWidth });
                    if (opts.maxHeight)
                        pxsim.svg.hydrate(this.view, { height: opts.maxHeight });
                }
                this.state.updateSubscribers.push(function () { return _this.updateState(); });
            }
            BoardHost.prototype.highlightBoardPin = function (pinNm) {
                this.boardView.highlightPin(pinNm);
            };
            BoardHost.prototype.highlightBreadboardPin = function (rowCol) {
                this.breadboard.highlightLoc(rowCol);
            };
            BoardHost.prototype.highlightWire = function (wire) {
                //TODO: move to wiring.ts
                //underboard wires
                wire.wires.forEach(function (e) {
                    pxsim.U.addClass(e, "highlight");
                    e.style["visibility"] = "visible";
                });
                //un greyed out
                pxsim.U.addClass(wire.endG, "highlight");
            };
            BoardHost.prototype.getView = function () {
                return this.view;
            };
            BoardHost.prototype.screenshotAsync = function (width) {
                var svg = this.view.cloneNode(true);
                svg.setAttribute('width', this.view.width.baseVal.value + "");
                svg.setAttribute('height', this.view.height.baseVal.value + "");
                var xml = new XMLSerializer().serializeToString(svg);
                var data = "data:image/svg+xml,"
                    + encodeURIComponent(xml.replace(/\s+/g, ' ').replace(/"/g, "'"));
                return new Promise(function (resolve, reject) {
                    var img = document.createElement("img");
                    img.onload = function () {
                        var cvs = document.createElement("canvas");
                        cvs.width = img.width;
                        cvs.height = img.height;
                        // check if a width or a height was specified
                        if (width > 0) {
                            cvs.width = width;
                            cvs.height = (img.height * width / img.width) | 0;
                        }
                        else if (cvs.width < 200) {
                            cvs.width *= 2;
                            cvs.height *= 2;
                        }
                        else if (cvs.width > 480) {
                            cvs.width /= 2;
                            cvs.height /= 2;
                        }
                        var ctx = cvs.getContext("2d");
                        ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
                        resolve(ctx.getImageData(0, 0, cvs.width, cvs.height));
                    };
                    img.onerror = function (e) {
                        console.log(e);
                        resolve(undefined);
                    };
                    img.src = data;
                });
            };
            BoardHost.prototype.updateState = function () {
                this.parts.forEach(function (c) { return c.updateState(); });
            };
            BoardHost.prototype.getBBCoord = function (rowCol) {
                var bbCoord = this.breadboard.getCoord(rowCol);
                return this.fromBBCoord(bbCoord);
            };
            BoardHost.prototype.getPinCoord = function (pin) {
                var boardCoord = this.boardView.getCoord(pin);
                if (!boardCoord) {
                    console.error("Unable to find coord for pin: " + pin);
                    return undefined;
                }
                return this.fromMBCoord(boardCoord);
            };
            BoardHost.prototype.getLocCoord = function (loc) {
                var coord;
                if (loc.type === "breadboard") {
                    var rowCol = loc;
                    coord = this.getBBCoord(rowCol);
                }
                else {
                    var pinNm = loc.pin;
                    coord = this.getPinCoord(pinNm);
                }
                if (!coord)
                    console.debug("Unknown location: " + name);
                return coord;
            };
            BoardHost.prototype.getPinStyle = function (loc) {
                if (loc.type == "breadboard")
                    return "female";
                else
                    return this.opts.boardDef.pinStyles[loc.pin] || "female";
            };
            BoardHost.prototype.addPart = function (partInst) {
                var _this = this;
                var part = null;
                if (partInst.simulationBehavior) {
                    //TODO: seperate simulation behavior from builtin visual
                    var builtinBehavior = partInst.simulationBehavior;
                    var cnstr = this.state.builtinVisuals[builtinBehavior];
                    var stateFn = this.state.builtinParts[builtinBehavior];
                    part = cnstr();
                    part.init(this.state.bus, stateFn, this.view, partInst.params);
                }
                else {
                    var vis = partInst.visual;
                    part = new visuals.GenericPart(vis);
                }
                this.parts.push(part);
                this.partGroup.appendChild(part.element);
                if (part.overElement)
                    this.partOverGroup.appendChild(part.overElement);
                if (part.defs)
                    part.defs.forEach(function (d) { return _this.defs.appendChild(d); });
                this.style.textContent += part.style || "";
                var colIdx = partInst.startColumnIdx;
                var rowIdx = partInst.startRowIdx;
                var row = visuals.getRowName(rowIdx);
                var col = visuals.getColumnName(colIdx);
                var xOffset = partInst.bbFit.xOffset / partInst.visual.pinDistance;
                var yOffset = partInst.bbFit.yOffset / partInst.visual.pinDistance;
                var rowCol = {
                    type: "breadboard",
                    row: row,
                    col: col,
                    xOffset: xOffset,
                    yOffset: yOffset
                };
                var coord = this.getBBCoord(rowCol);
                part.moveToCoord(coord);
                var getCmpClass = function (type) { return "sim-" + type + "-cmp"; };
                var cls = getCmpClass(partInst.name);
                pxsim.U.addClass(part.element, cls);
                pxsim.U.addClass(part.element, "sim-cmp");
                part.updateTheme();
                part.updateState();
                return part;
            };
            BoardHost.prototype.addWire = function (inst) {
                return this.wireFactory.addWire(inst.start, inst.end, inst.color);
            };
            BoardHost.prototype.addAll = function (allocRes) {
                var _this = this;
                allocRes.partsAndWires.forEach(function (pAndWs) {
                    var wires = pAndWs.wires;
                    var wiresOk = wires && wires.every(function (w) { return _this.wireFactory.checkWire(w.start, w.end); });
                    if (wiresOk)
                        wires.forEach(function (w) { return allocRes.wires.push(_this.addWire(w)); });
                    var part = pAndWs.part;
                    if (part && (!wires || wiresOk))
                        allocRes.parts.push(_this.addPart(part));
                });
                // at least one wire
                allocRes.requiresBreadboard = !!allocRes.wires.length
                    || !!allocRes.parts.length;
            };
            return BoardHost;
        }());
        visuals.BoardHost = BoardHost;
    })(visuals = pxsim.visuals || (pxsim.visuals = {}));
})(pxsim || (pxsim = {}));
var pxsim;
(function (pxsim) {
    var visuals;
    (function (visuals) {
        // The distance between the center of two pins. This is the constant on which everything else is based.
        var PIN_DIST = 15;
        // CSS styling for the breadboard
        var BLUE = "#1AA5D7";
        var RED = "#DD4BA0";
        var BREADBOARD_CSS = "\n        /* bread board */\n        .sim-bb-background {\n            fill:#E0E0E0;\n        }\n        .sim-bb-pin {\n            fill:#999;\n        }\n        .sim-bb-pin-hover {\n            visibility: hidden;\n            pointer-events: all;\n            stroke-width: " + PIN_DIST / 2 + "px;\n            stroke: transparent;\n            fill: #777;\n        }\n        .sim-bb-pin-hover:hover {\n            visibility: visible;\n            fill:#444;\n        }\n        .sim-bb-group-wire {\n            stroke: #999;\n            stroke-width: " + PIN_DIST / 4 + "px;\n            visibility: hidden;\n        }\n        .sim-bb-pin-group {\n            pointer-events: all;\n        }\n        .sim-bb-label,\n        .sim-bb-label-hover {\n            font-family:\"Lucida Console\", Monaco, monospace;\n            fill:#555;\n            pointer-events: all;\n            stroke-width: 0;\n            cursor: default;\n        }\n        .sim-bb-label-hover {\n            visibility: hidden;\n            fill:#000;\n            font-weight: bold;\n        }\n        .sim-bb-bar {\n            stroke-width: 0;\n        }\n        .sim-bb-blue {\n            fill:" + BLUE + ";\n            stroke:" + BLUE + "\n        }\n        .sim-bb-red {\n            fill:" + RED + ";\n            stroke:" + RED + ";\n        }\n        .sim-bb-pin-group:hover .sim-bb-pin-hover,\n        .sim-bb-pin-group:hover .sim-bb-group-wire,\n        .sim-bb-pin-group:hover .sim-bb-label-hover {\n            visibility: visible;\n        }\n        .sim-bb-pin-group:hover .sim-bb-label {\n            visibility: hidden;\n        }\n        /* outline mode */\n        .sim-bb-outline .sim-bb-background {\n            stroke-width: " + PIN_DIST / 7 + "px;\n            fill: #FFF;\n            stroke: #000;\n        }\n        .sim-bb-outline .sim-bb-mid-channel {\n            fill: #FFF;\n            stroke: #888;\n            stroke-width: 2px;\n        }\n        /* grayed out */\n        .grayed .sim-bb-background {\n            stroke-width: " + PIN_DIST / 5 + "px;\n        }\n        .grayed .sim-bb-red,\n        .grayed .sim-bb-blue {\n            fill: #BBB;\n        }\n        .grayed .sim-bb-bar {\n            fill: #FFF;\n        }\n        .grayed .sim-bb-pin {\n            fill: #000;\n            stroke: #FFF;\n            stroke-width: 3px;\n        }\n        .grayed .sim-bb-label {\n            fill: none;\n        }\n        .grayed .sim-bb-background {\n            stroke-width: " + PIN_DIST / 2 + "px;\n            stroke: #555;\n        }\n        .grayed .sim-bb-group-wire {\n            stroke: #DDD;\n        }\n        .grayed .sim-bb-channel {\n            visibility: hidden;\n        }\n        /* highlighted */\n        .sim-bb-label.highlight {\n            visibility: hidden;\n        }\n        .sim-bb-label-hover.highlight {\n            visibility: visible;\n        }\n        .sim-bb-blue.highlight {\n            fill:" + BLUE + ";\n        }\n        .sim-bb-red.highlight {\n            fill:" + RED + ";\n        }\n        .sim-bb-bar.highlight {\n            stroke-width: 0px;\n        }\n        ";
        // Pin rows and coluns
        visuals.BREADBOARD_MID_ROWS = 10;
        visuals.BREADBOARD_MID_COLS = 30;
        var MID_ROW_GAPS = [4, 4];
        var MID_ROW_AND_GAPS = visuals.BREADBOARD_MID_ROWS + MID_ROW_GAPS.length;
        var BAR_ROWS = 2;
        var BAR_COLS = 25;
        var POWER_ROWS = BAR_ROWS * 2;
        var POWER_COLS = BAR_COLS * 2;
        var BAR_COL_GAPS = [4, 9, 14, 19];
        var BAR_COL_AND_GAPS = BAR_COLS + BAR_COL_GAPS.length;
        // Essential dimensions
        var WIDTH = PIN_DIST * (visuals.BREADBOARD_MID_COLS + 3);
        var HEIGHT = PIN_DIST * (MID_ROW_AND_GAPS + POWER_ROWS + 5.5);
        var MID_RATIO = 2.0 / 3.0;
        var BAR_RATIO = (1.0 - MID_RATIO) * 0.5;
        var MID_HEIGHT = HEIGHT * MID_RATIO;
        var BAR_HEIGHT = HEIGHT * BAR_RATIO;
        // Pin grids
        var MID_GRID_WIDTH = (visuals.BREADBOARD_MID_COLS - 1) * PIN_DIST;
        var MID_GRID_HEIGHT = (MID_ROW_AND_GAPS - 1) * PIN_DIST;
        var MID_GRID_X = (WIDTH - MID_GRID_WIDTH) / 2.0;
        var MID_GRID_Y = BAR_HEIGHT + (MID_HEIGHT - MID_GRID_HEIGHT) / 2.0;
        var BAR_GRID_HEIGHT = (BAR_ROWS - 1) * PIN_DIST;
        var BAR_GRID_WIDTH = (BAR_COL_AND_GAPS - 1) * PIN_DIST;
        var BAR_TOP_GRID_X = (WIDTH - BAR_GRID_WIDTH) / 2.0;
        var BAR_TOP_GRID_Y = (BAR_HEIGHT - BAR_GRID_HEIGHT) / 2.0;
        var BAR_BOT_GRID_X = BAR_TOP_GRID_X;
        var BAR_BOT_GRID_Y = BAR_TOP_GRID_Y + BAR_HEIGHT + MID_HEIGHT;
        // Individual pins
        var PIN_HOVER_SCALAR = 1.3;
        var PIN_WIDTH = PIN_DIST / 2.5;
        var PIN_ROUNDING = PIN_DIST / 7.5;
        // Labels
        var PIN_LBL_SIZE = PIN_DIST * 0.7;
        var PIN_LBL_HOVER_SCALAR = 1.3;
        var PLUS_LBL_SIZE = PIN_DIST * 1.7;
        var MINUS_LBL_SIZE = PIN_DIST * 2;
        var POWER_LBL_OFFSET = PIN_DIST * 0.8;
        var MINUS_LBL_EXTRA_OFFSET = PIN_DIST * 0.07;
        var LBL_ROTATION = -90;
        // Channels
        var CHANNEL_HEIGHT = PIN_DIST * 1.0;
        var SMALL_CHANNEL_HEIGHT = PIN_DIST * 0.05;
        // Background
        var BACKGROUND_ROUNDING = PIN_DIST * 0.3;
        // Row and column helpers
        var alphabet = "abcdefghij".split("").reverse();
        function getColumnName(colIdx) { return "" + (colIdx + 1); }
        visuals.getColumnName = getColumnName;
        ;
        function getRowName(rowIdx) { return alphabet[rowIdx]; }
        visuals.getRowName = getRowName;
        ;
        ;
        ;
        function mkGrid(opts) {
            var xOff = opts.xOffset || 0;
            var yOff = opts.yOffset || 0;
            var allPins = [];
            var grid = pxsim.svg.elt("g");
            var colIdxOffset = opts.colStartIdx || 0;
            var rowIdxOffset = opts.rowStartIdx || 0;
            var copyArr = function (arr) { return arr ? arr.slice(0, arr.length) : []; };
            var removeAll = function (arr, e) {
                var res = 0;
                var idx;
                /* tslint:disable:no-conditional-assignment */
                while (0 <= (idx = arr.indexOf(e))) {
                    /* tslint:enable:no-conditional-assignment */
                    arr.splice(idx, 1);
                    res += 1;
                }
                return res;
            };
            var rowGaps = 0;
            var rowIdxsWithGap = copyArr(opts.rowIdxsWithGap);
            var _loop_2 = function (i) {
                var colGaps = 0;
                var colIdxsWithGap = copyArr(opts.colIdxsWithGap);
                var cy = yOff + i * opts.pinDist + rowGaps * opts.pinDist;
                var rowIdx = i + rowIdxOffset;
                var _loop_3 = function (j) {
                    var cx = xOff + j * opts.pinDist + colGaps * opts.pinDist;
                    var colIdx = j + colIdxOffset;
                    var addEl = function (pin) {
                        pxsim.svg.hydrate(pin.el, pin.el.tagName == "circle"
                            ? { cx: cx, cy: cy }
                            : { x: cx - pin.w * 0.5, y: cy - pin.h * 0.5 });
                        grid.appendChild(pin.el);
                        return pin.el;
                    };
                    var el = addEl(opts.mkPin());
                    var hoverEl = addEl(opts.mkHoverPin());
                    var row = opts.getRowName(rowIdx);
                    var col = opts.getColName(colIdx);
                    var group = opts.getGroupName ? opts.getGroupName(rowIdx, colIdx) : null;
                    var gridPin = { el: el, hoverEl: hoverEl, cx: cx, cy: cy, row: row, col: col, group: group };
                    allPins.push(gridPin);
                    //column gaps
                    colGaps += removeAll(colIdxsWithGap, colIdx);
                };
                for (var j = 0; j < opts.colCount; j++) {
                    _loop_3(j);
                }
                //row gaps
                rowGaps += removeAll(rowIdxsWithGap, rowIdx);
            };
            for (var i = 0; i < opts.rowCount; i++) {
                _loop_2(i);
            }
            return { g: grid, allPins: allPins };
        }
        visuals.mkGrid = mkGrid;
        function mkBBPin() {
            var el = pxsim.svg.elt("rect");
            var width = PIN_WIDTH;
            pxsim.svg.hydrate(el, {
                class: "sim-bb-pin",
                rx: PIN_ROUNDING,
                ry: PIN_ROUNDING,
                width: width,
                height: width
            });
            return { el: el, w: width, h: width, x: 0, y: 0 };
        }
        function mkBBHoverPin() {
            var el = pxsim.svg.elt("rect");
            var width = PIN_WIDTH * PIN_HOVER_SCALAR;
            pxsim.svg.hydrate(el, {
                class: "sim-bb-pin-hover",
                rx: PIN_ROUNDING,
                ry: PIN_ROUNDING,
                width: width,
                height: width,
            });
            return { el: el, w: width, h: width, x: 0, y: 0 };
        }
        ;
        function mkBBLabel(cx, cy, size, rotation, txt, group, extraClasses) {
            //lbl
            var el = visuals.mkTxt(cx, cy, size, rotation, txt);
            pxsim.U.addClass(el, "sim-bb-label");
            if (extraClasses)
                extraClasses.forEach(function (c) { return pxsim.U.addClass(el, c); });
            //hover lbl
            var hoverEl = visuals.mkTxt(cx, cy, size * PIN_LBL_HOVER_SCALAR, rotation, txt);
            pxsim.U.addClass(hoverEl, "sim-bb-label-hover");
            if (extraClasses)
                extraClasses.forEach(function (c) { return pxsim.U.addClass(hoverEl, c); });
            var lbl = { el: el, hoverEl: hoverEl, txt: txt, group: group };
            return lbl;
        }
        ;
        var Breadboard = /** @class */ (function () {
            function Breadboard(opts) {
                //truth
                this.allPins = [];
                this.allLabels = [];
                this.allPowerBars = [];
                //quick lookup caches
                this.rowColToPin = {};
                this.rowColToLbls = {};
                this.buildDom();
                if (opts.wireframe)
                    pxsim.U.addClass(this.bb, "sim-bb-outline");
            }
            Breadboard.prototype.hide = function () {
                this.bb.style.display = 'none';
            };
            Breadboard.prototype.updateLocation = function (x, y) {
                pxsim.svg.hydrate(this.bb, {
                    x: x + "px",
                    y: y + "px",
                });
            };
            Breadboard.prototype.getPin = function (row, col) {
                var colToPin = this.rowColToPin[row];
                if (!colToPin)
                    return null;
                var pin = colToPin[col];
                if (!pin)
                    return null;
                return pin;
            };
            Breadboard.prototype.getCoord = function (rowCol) {
                var row = rowCol.row, col = rowCol.col, xOffset = rowCol.xOffset, yOffset = rowCol.yOffset;
                var pin = this.getPin(row, col);
                if (!pin)
                    return null;
                var xOff = (xOffset || 0) * PIN_DIST;
                var yOff = (yOffset || 0) * PIN_DIST;
                return [pin.cx + xOff, pin.cy + yOff];
            };
            Breadboard.prototype.getPinDist = function () {
                return PIN_DIST;
            };
            Breadboard.prototype.buildDom = function () {
                var _this = this;
                this.bb = pxsim.svg.elt("svg", {
                    "version": "1.0",
                    "viewBox": "0 0 " + WIDTH + " " + HEIGHT,
                    "class": "sim-bb",
                    "width": WIDTH + "px",
                    "height": HEIGHT + "px",
                });
                this.styleEl = pxsim.svg.child(this.bb, "style", {});
                this.styleEl.textContent += BREADBOARD_CSS;
                this.defs = pxsim.svg.child(this.bb, "defs", {});
                //background
                pxsim.svg.child(this.bb, "rect", { class: "sim-bb-background", width: WIDTH, height: HEIGHT, rx: BACKGROUND_ROUNDING, ry: BACKGROUND_ROUNDING });
                //mid channel
                var channelGid = "sim-bb-channel-grad";
                var channelGrad = pxsim.svg.elt("linearGradient");
                pxsim.svg.hydrate(channelGrad, { id: channelGid, x1: "0%", y1: "0%", x2: "0%", y2: "100%" });
                this.defs.appendChild(channelGrad);
                var channelDark = "#AAA";
                var channelLight = "#CCC";
                var stop1 = pxsim.svg.child(channelGrad, "stop", { offset: "0%", style: "stop-color: " + channelDark + ";" });
                var stop2 = pxsim.svg.child(channelGrad, "stop", { offset: "20%", style: "stop-color: " + channelLight + ";" });
                var stop3 = pxsim.svg.child(channelGrad, "stop", { offset: "80%", style: "stop-color: " + channelLight + ";" });
                var stop4 = pxsim.svg.child(channelGrad, "stop", { offset: "100%", style: "stop-color: " + channelDark + ";" });
                var mkChannel = function (cy, h, cls) {
                    var channel = pxsim.svg.child(_this.bb, "rect", { class: "sim-bb-channel " + (cls || ""), y: cy - h / 2, width: WIDTH, height: h });
                    channel.setAttribute("fill", "url(#" + channelGid + ")");
                    return channel;
                };
                mkChannel(BAR_HEIGHT + MID_HEIGHT / 2, CHANNEL_HEIGHT, "sim-bb-mid-channel");
                mkChannel(BAR_HEIGHT, SMALL_CHANNEL_HEIGHT, "sim-bb-sml-channel");
                mkChannel(BAR_HEIGHT + MID_HEIGHT, SMALL_CHANNEL_HEIGHT, "sim-bb-sml-channel");
                //-----pins
                var getMidTopOrBot = function (rowIdx) { return rowIdx < visuals.BREADBOARD_MID_ROWS / 2.0 ? "b" : "t"; };
                var getBarTopOrBot = function (colIdx) { return colIdx < POWER_COLS / 2.0 ? "b" : "t"; };
                var getMidGroupName = function (rowIdx, colIdx) {
                    var botOrTop = getMidTopOrBot(rowIdx);
                    var colNm = getColumnName(colIdx);
                    return "" + botOrTop + colNm;
                };
                var getBarRowName = function (rowIdx) { return rowIdx === 0 ? "-" : "+"; };
                var getBarGroupName = function (rowIdx, colIdx) {
                    var botOrTop = getBarTopOrBot(colIdx);
                    var rowName = getBarRowName(rowIdx);
                    return "" + rowName + botOrTop;
                };
                //mid grid
                var midGridRes = mkGrid({
                    xOffset: MID_GRID_X,
                    yOffset: MID_GRID_Y,
                    rowCount: visuals.BREADBOARD_MID_ROWS,
                    colCount: visuals.BREADBOARD_MID_COLS,
                    pinDist: PIN_DIST,
                    mkPin: mkBBPin,
                    mkHoverPin: mkBBHoverPin,
                    getRowName: getRowName,
                    getColName: getColumnName,
                    getGroupName: getMidGroupName,
                    rowIdxsWithGap: MID_ROW_GAPS,
                });
                var midGridG = midGridRes.g;
                this.allPins = this.allPins.concat(midGridRes.allPins);
                //bot bar
                var botBarGridRes = mkGrid({
                    xOffset: BAR_BOT_GRID_X,
                    yOffset: BAR_BOT_GRID_Y,
                    rowCount: BAR_ROWS,
                    colCount: BAR_COLS,
                    pinDist: PIN_DIST,
                    mkPin: mkBBPin,
                    mkHoverPin: mkBBHoverPin,
                    getRowName: getBarRowName,
                    getColName: getColumnName,
                    getGroupName: getBarGroupName,
                    colIdxsWithGap: BAR_COL_GAPS,
                });
                var botBarGridG = botBarGridRes.g;
                this.allPins = this.allPins.concat(botBarGridRes.allPins);
                //top bar
                var topBarGridRes = mkGrid({
                    xOffset: BAR_TOP_GRID_X,
                    yOffset: BAR_TOP_GRID_Y,
                    rowCount: BAR_ROWS,
                    colCount: BAR_COLS,
                    colStartIdx: BAR_COLS,
                    pinDist: PIN_DIST,
                    mkPin: mkBBPin,
                    mkHoverPin: mkBBHoverPin,
                    getRowName: getBarRowName,
                    getColName: getColumnName,
                    getGroupName: getBarGroupName,
                    colIdxsWithGap: BAR_COL_GAPS.map(function (g) { return g + BAR_COLS; }),
                });
                var topBarGridG = topBarGridRes.g;
                this.allPins = this.allPins.concat(topBarGridRes.allPins);
                //tooltip
                this.allPins.forEach(function (pin) {
                    var el = pin.el, row = pin.row, col = pin.col, hoverEl = pin.hoverEl;
                    var title = "(" + row + "," + col + ")";
                    pxsim.svg.hydrate(el, { title: title });
                    pxsim.svg.hydrate(hoverEl, { title: title });
                });
                //catalog pins
                this.allPins.forEach(function (pin) {
                    var colToPin = _this.rowColToPin[pin.row];
                    if (!colToPin)
                        colToPin = _this.rowColToPin[pin.row] = {};
                    colToPin[pin.col] = pin;
                });
                //-----labels
                var mkBBLabelAtPin = function (row, col, xOffset, yOffset, txt, group) {
                    var size = PIN_LBL_SIZE;
                    var rotation = LBL_ROTATION;
                    var loc = _this.getCoord({ type: "breadboard", row: row, col: col });
                    var cx = loc[0], cy = loc[1];
                    var t = mkBBLabel(cx + xOffset, cy + yOffset, size, rotation, txt, group);
                    return t;
                };
                //columns
                for (var colIdx = 0; colIdx < visuals.BREADBOARD_MID_COLS; colIdx++) {
                    var colNm = getColumnName(colIdx);
                    //top
                    var rowTIdx = 0;
                    var rowTNm = getRowName(rowTIdx);
                    var groupT = getMidGroupName(rowTIdx, colIdx);
                    var lblT = mkBBLabelAtPin(rowTNm, colNm, 0, -PIN_DIST, colNm, groupT);
                    this.allLabels.push(lblT);
                    //bottom
                    var rowBIdx = visuals.BREADBOARD_MID_ROWS - 1;
                    var rowBNm = getRowName(rowBIdx);
                    var groupB = getMidGroupName(rowBIdx, colIdx);
                    var lblB = mkBBLabelAtPin(rowBNm, colNm, 0, +PIN_DIST, colNm, groupB);
                    this.allLabels.push(lblB);
                }
                //rows
                for (var rowIdx = 0; rowIdx < visuals.BREADBOARD_MID_ROWS; rowIdx++) {
                    var rowNm = getRowName(rowIdx);
                    //top
                    var colTIdx = 0;
                    var colTNm = getColumnName(colTIdx);
                    var lblT = mkBBLabelAtPin(rowNm, colTNm, -PIN_DIST, 0, rowNm);
                    this.allLabels.push(lblT);
                    //top
                    var colBIdx = visuals.BREADBOARD_MID_COLS - 1;
                    var colBNm = getColumnName(colBIdx);
                    var lblB = mkBBLabelAtPin(rowNm, colBNm, +PIN_DIST, 0, rowNm);
                    this.allLabels.push(lblB);
                }
                //+- labels
                var botPowerLabels = [
                    //BL
                    mkBBLabel(0 + POWER_LBL_OFFSET + MINUS_LBL_EXTRA_OFFSET, BAR_HEIGHT + MID_HEIGHT + POWER_LBL_OFFSET, MINUS_LBL_SIZE, LBL_ROTATION, "-", getBarGroupName(0, 0), ["sim-bb-blue"]),
                    mkBBLabel(0 + POWER_LBL_OFFSET, BAR_HEIGHT + MID_HEIGHT + BAR_HEIGHT - POWER_LBL_OFFSET, PLUS_LBL_SIZE, LBL_ROTATION, "+", getBarGroupName(1, 0), ["sim-bb-red"]),
                    //BR
                    mkBBLabel(WIDTH - POWER_LBL_OFFSET + MINUS_LBL_EXTRA_OFFSET, BAR_HEIGHT + MID_HEIGHT + POWER_LBL_OFFSET, MINUS_LBL_SIZE, LBL_ROTATION, "-", getBarGroupName(0, BAR_COLS - 1), ["sim-bb-blue"]),
                    mkBBLabel(WIDTH - POWER_LBL_OFFSET, BAR_HEIGHT + MID_HEIGHT + BAR_HEIGHT - POWER_LBL_OFFSET, PLUS_LBL_SIZE, LBL_ROTATION, "+", getBarGroupName(1, BAR_COLS - 1), ["sim-bb-red"]),
                ];
                this.allLabels = this.allLabels.concat(botPowerLabels);
                var topPowerLabels = [
                    //TL
                    mkBBLabel(0 + POWER_LBL_OFFSET + MINUS_LBL_EXTRA_OFFSET, 0 + POWER_LBL_OFFSET, MINUS_LBL_SIZE, LBL_ROTATION, "-", getBarGroupName(0, BAR_COLS), ["sim-bb-blue"]),
                    mkBBLabel(0 + POWER_LBL_OFFSET, BAR_HEIGHT - POWER_LBL_OFFSET, PLUS_LBL_SIZE, LBL_ROTATION, "+", getBarGroupName(1, BAR_COLS), ["sim-bb-red"]),
                    //TR
                    mkBBLabel(WIDTH - POWER_LBL_OFFSET + MINUS_LBL_EXTRA_OFFSET, 0 + POWER_LBL_OFFSET, MINUS_LBL_SIZE, LBL_ROTATION, "-", getBarGroupName(0, POWER_COLS - 1), ["sim-bb-blue"]),
                    mkBBLabel(WIDTH - POWER_LBL_OFFSET, BAR_HEIGHT - POWER_LBL_OFFSET, PLUS_LBL_SIZE, LBL_ROTATION, "+", getBarGroupName(1, POWER_COLS - 1), ["sim-bb-red"]),
                ];
                this.allLabels = this.allLabels.concat(topPowerLabels);
                //catalog lbls
                var lblNmToLbls = {};
                this.allLabels.forEach(function (lbl) {
                    var el = lbl.el, txt = lbl.txt;
                    var lbls = lblNmToLbls[txt] = lblNmToLbls[txt] || [];
                    lbls.push(lbl);
                });
                var isPowerPin = function (pin) { return pin.row === "-" || pin.row === "+"; };
                this.allPins.forEach(function (pin) {
                    var row = pin.row, col = pin.col, group = pin.group;
                    var colToLbls = _this.rowColToLbls[row] || (_this.rowColToLbls[row] = {});
                    var lbls = colToLbls[col] || (colToLbls[col] = []);
                    if (isPowerPin(pin)) {
                        //power pins
                        var isBot = Number(col) <= BAR_COLS;
                        if (isBot)
                            botPowerLabels.filter(function (l) { return l.group == pin.group; }).forEach(function (l) { return lbls.push(l); });
                        else
                            topPowerLabels.filter(function (l) { return l.group == pin.group; }).forEach(function (l) { return lbls.push(l); });
                    }
                    else {
                        //mid pins
                        var rowLbls = lblNmToLbls[row];
                        rowLbls.forEach(function (l) { return lbls.push(l); });
                        var colLbls = lblNmToLbls[col];
                        colLbls.forEach(function (l) { return lbls.push(l); });
                    }
                });
                //-----blue & red lines
                var lnLen = BAR_GRID_WIDTH + PIN_DIST * 1.5;
                var lnThickness = PIN_DIST / 5.0;
                var lnYOff = PIN_DIST * 0.6;
                var lnXOff = (lnLen - BAR_GRID_WIDTH) / 2.0;
                var mkPowerLine = function (x, y, group, cls) {
                    var ln = pxsim.svg.elt("rect");
                    pxsim.svg.hydrate(ln, {
                        class: "sim-bb-bar " + cls,
                        x: x,
                        y: y - lnThickness / 2.0,
                        width: lnLen,
                        height: lnThickness
                    });
                    var bar = { el: ln, group: group };
                    return bar;
                };
                var barLines = [
                    //top
                    mkPowerLine(BAR_BOT_GRID_X - lnXOff, BAR_BOT_GRID_Y - lnYOff, getBarGroupName(0, POWER_COLS - 1), "sim-bb-blue"),
                    mkPowerLine(BAR_BOT_GRID_X - lnXOff, BAR_BOT_GRID_Y + PIN_DIST + lnYOff, getBarGroupName(1, POWER_COLS - 1), "sim-bb-red"),
                    //bot
                    mkPowerLine(BAR_TOP_GRID_X - lnXOff, BAR_TOP_GRID_Y - lnYOff, getBarGroupName(0, 0), "sim-bb-blue"),
                    mkPowerLine(BAR_TOP_GRID_X - lnXOff, BAR_TOP_GRID_Y + PIN_DIST + lnYOff, getBarGroupName(1, 0), "sim-bb-red"),
                ];
                this.allPowerBars = this.allPowerBars.concat(barLines);
                //attach power bars
                this.allPowerBars.forEach(function (b) { return _this.bb.appendChild(b.el); });
                //-----electrically connected groups
                //make groups
                var allGrpNms = this.allPins.map(function (p) { return p.group; }).filter(function (g, i, a) { return a.indexOf(g) == i; });
                var groups = allGrpNms.map(function (grpNm) {
                    var g = pxsim.svg.elt("g");
                    return g;
                });
                groups.forEach(function (g) { return pxsim.U.addClass(g, "sim-bb-pin-group"); });
                groups.forEach(function (g, i) { return pxsim.U.addClass(g, "group-" + allGrpNms[i]); });
                var grpNmToGroup = {};
                allGrpNms.forEach(function (g, i) { return grpNmToGroup[g] = groups[i]; });
                //group pins and add connecting wire
                var grpNmToPins = {};
                this.allPins.forEach(function (p, i) {
                    var g = p.group;
                    var pins = grpNmToPins[g] || (grpNmToPins[g] = []);
                    pins.push(p);
                });
                //connecting wire
                allGrpNms.forEach(function (grpNm) {
                    var pins = grpNmToPins[grpNm];
                    var _a = [pins.map(function (p) { return p.cx; }), pins.map(function (p) { return p.cy; })], xs = _a[0], ys = _a[1];
                    var minFn = function (arr) { return arr.reduce(function (a, b) { return a < b ? a : b; }); };
                    var maxFn = function (arr) { return arr.reduce(function (a, b) { return a > b ? a : b; }); };
                    var _b = [minFn(xs), maxFn(xs), minFn(ys), maxFn(ys)], minX = _b[0], maxX = _b[1], minY = _b[2], maxY = _b[3];
                    var wire = pxsim.svg.elt("rect");
                    var width = Math.max(maxX - minX, 0.0001 /*rects with no width aren't displayed*/);
                    var height = Math.max(maxY - minY, 0.0001);
                    pxsim.svg.hydrate(wire, { x: minX, y: minY, width: width, height: height });
                    pxsim.U.addClass(wire, "sim-bb-group-wire");
                    var g = grpNmToGroup[grpNm];
                    g.appendChild(wire);
                });
                //group pins
                this.allPins.forEach(function (p) {
                    var g = grpNmToGroup[p.group];
                    g.appendChild(p.el);
                    g.appendChild(p.hoverEl);
                });
                //group lbls
                var miscLblGroup = pxsim.svg.elt("g");
                pxsim.svg.hydrate(miscLblGroup, { class: "sim-bb-group-misc" });
                groups.push(miscLblGroup);
                this.allLabels.forEach(function (l) {
                    if (l.group) {
                        var g = grpNmToGroup[l.group];
                        g.appendChild(l.el);
                        g.appendChild(l.hoverEl);
                    }
                    else {
                        miscLblGroup.appendChild(l.el);
                        miscLblGroup.appendChild(l.hoverEl);
                    }
                });
                //attach to bb
                groups.forEach(function (g) { return _this.bb.appendChild(g); }); //attach to breadboard
            };
            Breadboard.prototype.getSVGAndSize = function () {
                return { el: this.bb, y: 0, x: 0, w: WIDTH, h: HEIGHT };
            };
            Breadboard.prototype.highlightLoc = function (rowCol) {
                var row = rowCol.row, col = rowCol.col;
                var pin = this.rowColToPin[row][col];
                var cx = pin.cx, cy = pin.cy;
                var lbls = this.rowColToLbls[row][col];
                var highlightLbl = function (lbl) {
                    pxsim.U.addClass(lbl.el, "highlight");
                    pxsim.U.addClass(lbl.hoverEl, "highlight");
                };
                lbls.forEach(highlightLbl);
            };
            return Breadboard;
        }());
        visuals.Breadboard = Breadboard;
    })(visuals = pxsim.visuals || (pxsim.visuals = {}));
})(pxsim || (pxsim = {}));
var pxsim;
(function (pxsim) {
    var visuals;
    (function (visuals) {
        visuals.BOARD_SYTLE = "\n        .noselect {\n            -webkit-touch-callout: none; /* iOS Safari */\n            -webkit-user-select: none;   /* Chrome/Safari/Opera */\n            -khtml-user-select: none;    /* Konqueror */\n            -moz-user-select: none;      /* Firefox */\n            -ms-user-select: none;       /* Internet Explorer/Microsoft Edge */\n            user-select: none;           /* Non-prefixed version, currently\n                                            not supported by any browser */\n        }\n\n        .sim-board-pin {\n            fill:#999;\n            stroke:#000;\n            stroke-width:" + visuals.PIN_DIST / 3.0 + "px;\n        }\n        .sim-board-pin-lbl {\n            fill: #333;\n        }\n        .gray-cover {\n            fill:#FFF;\n            opacity: 0.3;\n            stroke-width:0;\n            visibility: hidden;\n        }\n        .sim-board-pin-hover {\n            visibility: hidden;\n            pointer-events: all;\n            stroke-width:" + visuals.PIN_DIST / 6.0 + "px;\n        }\n        .sim-board-pin-hover:hover {\n            visibility: visible;\n        }\n        .sim-board-pin-lbl {\n            visibility: hidden;\n        }\n        .sim-board-outline .sim-board-pin-lbl {\n            visibility: visible;\n        }\n        .sim-board-pin-lbl {\n            fill: #555;\n        }\n        .sim-board-pin-lbl-hover {\n            fill: red;\n        }\n        .sim-board-outline .sim-board-pin-lbl-hover {\n            fill: black;\n        }\n        .sim-board-pin-lbl,\n        .sim-board-pin-lbl-hover {\n            font-family:\"Lucida Console\", Monaco, monospace;\n            pointer-events: all;\n            stroke-width: 0;\n        }\n        .sim-board-pin-lbl-hover {\n            visibility: hidden;\n        }\n        .sim-board-outline .sim-board-pin-hover:hover + .sim-board-pin-lbl,\n        .sim-board-pin-lbl.highlight {\n            visibility: hidden;\n        }\n        .sim-board-outline .sim-board-pin-hover:hover + * + .sim-board-pin-lbl-hover,\n        .sim-board-pin-lbl-hover.highlight {\n            visibility: visible;\n        }\n        /* Graying out */\n        .grayed .sim-board-pin-lbl:not(.highlight) {\n            fill: #AAA;\n        }\n        .grayed .sim-board-pin:not(.highlight) {\n            fill:#BBB;\n            stroke:#777;\n        }\n        .grayed .gray-cover {\n            visibility: inherit;\n        }\n        .grayed .sim-cmp:not(.notgrayed) {\n            opacity: 0.3;\n        }\n        /* Highlighting */\n        .sim-board-pin-lbl.highlight {\n            fill: #000;\n            font-weight: bold;\n        }\n        .sim-board-pin.highlight {\n            fill:#999;\n            stroke:#000;\n        }\n        ";
        var PIN_LBL_SIZE = visuals.PIN_DIST * 0.7;
        var PIN_LBL_HOVER_SIZE = PIN_LBL_SIZE * 1.5;
        var SQUARE_PIN_WIDTH = visuals.PIN_DIST * 0.66666;
        var SQUARE_PIN_HOVER_WIDTH = visuals.PIN_DIST * 0.66666 + visuals.PIN_DIST / 3.0;
        var nextBoardId = 0;
        var GenericBoardSvg = /** @class */ (function () {
            function GenericBoardSvg(props) {
                var _this = this;
                this.props = props;
                // pins & labels
                //(truth)
                this.allPins = [];
                this.allLabels = [];
                //(cache)
                this.pinNmToLbl = {};
                this.pinNmToPin = {};
                //TODO: handle wireframe mode
                this.id = nextBoardId++;
                var visDef = props.visualDef;
                var imgHref = props.wireframe && visDef.outlineImage ? visDef.outlineImage : visDef.image;
                var boardImgAndSize = visuals.mkImageSVG({
                    image: imgHref,
                    width: visDef.width,
                    height: visDef.height,
                    imageUnitDist: visDef.pinDist,
                    targetUnitDist: visuals.PIN_DIST
                });
                var scaleFn = visuals.mkScaleFn(visDef.pinDist, visuals.PIN_DIST);
                this.width = boardImgAndSize.w;
                this.height = boardImgAndSize.h;
                var img = boardImgAndSize.el;
                this.element = pxsim.svg.elt("svg");
                pxsim.svg.hydrate(this.element, {
                    "version": "1.0",
                    "viewBox": "0 0 " + this.width + " " + this.height,
                    "class": "sim sim-board-id-" + this.id,
                    "x": "0px",
                    "y": "0px"
                });
                if (props.wireframe)
                    pxsim.U.addClass(this.element, "sim-board-outline");
                this.style = pxsim.svg.child(this.element, "style", {});
                this.style.textContent += visuals.BOARD_SYTLE;
                this.defs = pxsim.svg.child(this.element, "defs", {});
                this.g = pxsim.svg.elt("g");
                this.element.appendChild(this.g);
                // main board
                this.g.appendChild(img);
                this.background = img;
                pxsim.svg.hydrate(img, { class: "sim-board" });
                // does not look great
                //let backgroundCover = this.mkGrayCover(0, 0, this.width, this.height);
                //this.g.appendChild(backgroundCover);
                // ----- pins
                var mkRoundPin = function () {
                    var el = pxsim.svg.elt("circle");
                    var width = SQUARE_PIN_WIDTH;
                    pxsim.svg.hydrate(el, {
                        class: "sim-board-pin",
                        r: width / 2,
                    });
                    return { el: el, w: width, h: width, x: 0, y: 0 };
                };
                var mkRoundHoverPin = function () {
                    var el = pxsim.svg.elt("circle");
                    var width = SQUARE_PIN_HOVER_WIDTH;
                    pxsim.svg.hydrate(el, {
                        class: "sim-board-pin-hover",
                        r: width / 2
                    });
                    return { el: el, w: width, h: width, x: 0, y: 0 };
                };
                var mkSquarePin = function () {
                    var el = pxsim.svg.elt("rect");
                    var width = SQUARE_PIN_WIDTH;
                    pxsim.svg.hydrate(el, {
                        class: "sim-board-pin",
                        width: width,
                        height: width,
                    });
                    return { el: el, w: width, h: width, x: 0, y: 0 };
                };
                var mkSquareHoverPin = function () {
                    var el = pxsim.svg.elt("rect");
                    var width = SQUARE_PIN_HOVER_WIDTH;
                    pxsim.svg.hydrate(el, {
                        class: "sim-board-pin-hover",
                        width: width,
                        height: width
                    });
                    return { el: el, w: width, h: width, x: 0, y: 0 };
                };
                var mkPinBlockGrid = function (pinBlock, blockIdx) {
                    var xOffset = scaleFn(pinBlock.x) + visuals.PIN_DIST / 2.0;
                    var yOffset = scaleFn(pinBlock.y) + visuals.PIN_DIST / 2.0;
                    var rowCount = 1;
                    var colCount = pinBlock.labels.length;
                    var getColName = function (colIdx) { return pinBlock.labels[colIdx]; };
                    var getRowName = function () { return "" + (blockIdx + 1); };
                    var getGroupName = function () { return pinBlock.labels.join(" "); };
                    var gridRes = visuals.mkGrid({
                        xOffset: xOffset,
                        yOffset: yOffset,
                        rowCount: rowCount,
                        colCount: colCount,
                        pinDist: visuals.PIN_DIST,
                        mkPin: visDef.useCrocClips ? mkRoundPin : mkSquarePin,
                        mkHoverPin: visDef.useCrocClips ? mkRoundHoverPin : mkSquareHoverPin,
                        getRowName: getRowName,
                        getColName: getColName,
                        getGroupName: getGroupName,
                    });
                    var pins = gridRes.allPins;
                    var pinsG = gridRes.g;
                    pxsim.U.addClass(gridRes.g, "sim-board-pin-group");
                    return gridRes;
                };
                var pinBlocks = visDef.pinBlocks.map(mkPinBlockGrid);
                var pinToBlockDef = [];
                pinBlocks.forEach(function (blk, blkIdx) { return blk.allPins.forEach(function (p, pIdx) {
                    _this.allPins.push(p);
                    pinToBlockDef.push(visDef.pinBlocks[blkIdx]);
                }); });
                //tooltip
                this.allPins.forEach(function (p) {
                    var tooltip = p.col;
                    pxsim.svg.hydrate(p.el, { title: tooltip });
                    pxsim.svg.hydrate(p.hoverEl, { title: tooltip });
                });
                //catalog pins
                this.allPins.forEach(function (p) {
                    _this.pinNmToPin[p.col] = p;
                });
                // ----- labels
                var mkLabelTxtEl = function (pinX, pinY, size, txt, pos) {
                    //TODO: extract constants
                    var lblY;
                    var lblX;
                    if (pos === "below") {
                        var lblLen = size * 0.25 * txt.length;
                        lblX = pinX;
                        lblY = pinY + 12 + lblLen;
                    }
                    else {
                        var lblLen = size * 0.32 * txt.length;
                        lblX = pinX;
                        lblY = pinY - 11 - lblLen;
                    }
                    var el = visuals.mkTxt(lblX, lblY, size, -90, txt);
                    return el;
                };
                var mkLabel = function (pinX, pinY, txt, pos) {
                    var el = mkLabelTxtEl(pinX, pinY, PIN_LBL_SIZE, txt, pos);
                    pxsim.U.addClass(el, "sim-board-pin-lbl");
                    var hoverEl = mkLabelTxtEl(pinX, pinY, PIN_LBL_HOVER_SIZE, txt, pos);
                    pxsim.U.addClass(hoverEl, "sim-board-pin-lbl-hover");
                    var label = { el: el, hoverEl: hoverEl, txt: txt };
                    return label;
                };
                this.allLabels = this.allPins.map(function (p, pIdx) {
                    var blk = pinToBlockDef[pIdx];
                    return mkLabel(p.cx, p.cy, p.col, blk.labelPosition || "above");
                });
                //catalog labels
                this.allPins.forEach(function (pin, pinIdx) {
                    var lbl = _this.allLabels[pinIdx];
                    _this.pinNmToLbl[pin.col] = lbl;
                });
                //attach pins & labels
                this.allPins.forEach(function (p, idx) {
                    var lbl = _this.allLabels[idx];
                    //pins and labels must be adjacent for hover CSS
                    _this.g.appendChild(p.el);
                    _this.g.appendChild(p.hoverEl);
                    _this.g.appendChild(lbl.el);
                    _this.g.appendChild(lbl.hoverEl);
                });
            }
            GenericBoardSvg.prototype.findPin = function (pinNm) {
                var pin = this.pinNmToPin[pinNm];
                if (!pin && this.props.boardDef.gpioPinMap) {
                    pinNm = this.props.boardDef.gpioPinMap[pinNm];
                    if (pinNm)
                        pin = this.pinNmToPin[pinNm];
                }
                return pin;
            };
            GenericBoardSvg.prototype.findPinLabel = function (pinNm) {
                var pin = this.pinNmToLbl[pinNm];
                if (!pin && this.props.boardDef.gpioPinMap) {
                    pinNm = this.props.boardDef.gpioPinMap[pinNm];
                    if (pinNm)
                        pin = this.pinNmToLbl[pinNm];
                }
                return pin;
            };
            GenericBoardSvg.prototype.getCoord = function (pinNm) {
                var pin = this.findPin(pinNm);
                if (!pin)
                    return null;
                return [pin.cx, pin.cy];
            };
            GenericBoardSvg.prototype.mkGrayCover = function (x, y, w, h) {
                var rect = pxsim.svg.elt("rect");
                pxsim.svg.hydrate(rect, { x: x, y: y, width: w, height: h, class: "gray-cover" });
                return rect;
            };
            GenericBoardSvg.prototype.getView = function () {
                return { el: this.element, w: this.width, h: this.height, x: 0, y: 0 };
            };
            GenericBoardSvg.prototype.getPinDist = function () {
                return visuals.PIN_DIST;
            };
            GenericBoardSvg.prototype.highlightPin = function (pinNm) {
                var lbl = this.findPinLabel(pinNm);
                var pin = this.findPin(pinNm);
                if (lbl && pin) {
                    pxsim.U.addClass(lbl.el, "highlight");
                    pxsim.U.addClass(lbl.hoverEl, "highlight");
                    pxsim.U.addClass(pin.el, "highlight");
                    pxsim.U.addClass(pin.hoverEl, "highlight");
                }
            };
            return GenericBoardSvg;
        }());
        visuals.GenericBoardSvg = GenericBoardSvg;
    })(visuals = pxsim.visuals || (pxsim.visuals = {}));
})(pxsim || (pxsim = {}));
var pxsim;
(function (pxsim) {
    var visuals;
    (function (visuals) {
        function mkGenericPartSVG(partVisual) {
            var imgAndSize = visuals.mkImageSVG({
                image: partVisual.image,
                width: partVisual.width,
                height: partVisual.height,
                imageUnitDist: partVisual.pinDistance,
                targetUnitDist: visuals.PIN_DIST
            });
            return imgAndSize;
        }
        visuals.mkGenericPartSVG = mkGenericPartSVG;
        var GenericPart = /** @class */ (function () {
            function GenericPart(partVisual) {
                this.style = "";
                this.defs = [];
                var imgAndSize = mkGenericPartSVG(partVisual);
                var img = imgAndSize.el;
                this.element = pxsim.svg.elt("g");
                this.element.appendChild(img);
            }
            GenericPart.prototype.moveToCoord = function (xy) {
                visuals.translateEl(this.element, xy);
            };
            //unused
            GenericPart.prototype.init = function (bus, state, svgEl) { };
            GenericPart.prototype.updateState = function () { };
            GenericPart.prototype.updateTheme = function () { };
            return GenericPart;
        }());
        visuals.GenericPart = GenericPart;
    })(visuals = pxsim.visuals || (pxsim.visuals = {}));
})(pxsim || (pxsim = {}));
var pxsim;
(function (pxsim) {
    var visuals;
    (function (visuals) {
        var WIRE_WIDTH = visuals.PIN_DIST / 2.5;
        var BB_WIRE_SMOOTH = 0.7;
        var INSTR_WIRE_SMOOTH = 0.8;
        var WIRE_PART_CURVE_OFF = 15;
        var WIRE_PART_LENGTH = 100;
        visuals.WIRES_CSS = "\n        .sim-bb-wire {\n            fill:none;\n            stroke-linecap: round;\n            stroke-width:" + WIRE_WIDTH + "px;\n            pointer-events: none;\n        }\n        .sim-bb-wire-end {\n            stroke:#333;\n            fill:#333;\n        }\n        .sim-bb-wire-bare-end {\n            fill: #ccc;\n        }\n        .sim-bb-wire-hover {\n            stroke-width: " + WIRE_WIDTH + "px;\n            visibility: hidden;\n            stroke-dasharray: " + visuals.PIN_DIST / 10.0 + "," + visuals.PIN_DIST / 1.5 + ";\n            /*stroke-opacity: 0.4;*/\n        }\n        .grayed .sim-bb-wire-ends-g:not(.highlight) .sim-bb-wire-end {\n            stroke: #777;\n            fill: #777;\n        }\n        .grayed .sim-bb-wire:not(.highlight) {\n            stroke: #CCC;\n        }\n        .sim-bb-wire-ends-g:hover .sim-bb-wire-end {\n            stroke: red;\n            fill: red;\n        }\n        .sim-bb-wire-ends-g:hover .sim-bb-wire-bare-end {\n            stroke: #FFF;\n            fill: #FFF;\n        }\n        ";
        function cssEncodeColor(color) {
            //HACK/TODO: do real CSS encoding.
            return color
                .replace(/\#/g, "-")
                .replace(/\(/g, "-")
                .replace(/\)/g, "-")
                .replace(/\,/g, "-")
                .replace(/\./g, "-")
                .replace(/\s/g, "");
        }
        var WireEndStyle;
        (function (WireEndStyle) {
            WireEndStyle[WireEndStyle["BBJumper"] = 0] = "BBJumper";
            WireEndStyle[WireEndStyle["OpenJumper"] = 1] = "OpenJumper";
            WireEndStyle[WireEndStyle["Croc"] = 2] = "Croc";
        })(WireEndStyle = visuals.WireEndStyle || (visuals.WireEndStyle = {}));
        function mkWirePart(cp, clr, croc) {
            if (croc === void 0) { croc = false; }
            var g = pxsim.svg.elt("g");
            var cx = cp[0], cy = cp[1];
            var offset = WIRE_PART_CURVE_OFF;
            var p1 = [cx - offset, cy - WIRE_PART_LENGTH / 2];
            var p2 = [cx + offset, cy + WIRE_PART_LENGTH / 2];
            clr = visuals.mapWireColor(clr);
            var e1;
            if (croc)
                e1 = mkCrocEnd(p1, true, clr);
            else
                e1 = mkOpenJumperEnd(p1, true, clr);
            var s = mkWirePartSeg(p1, p2, clr);
            var e2 = mkOpenJumperEnd(p2, false, clr);
            g.appendChild(s.el);
            g.appendChild(e1.el);
            g.appendChild(e2.el);
            var l = Math.min(e1.x, e2.x);
            var r = Math.max(e1.x + e1.w, e2.x + e2.w);
            var t = Math.min(e1.y, e2.y);
            var b = Math.max(e1.y + e1.h, e2.y + e2.h);
            return { el: g, x: l, y: t, w: r - l, h: b - t };
        }
        visuals.mkWirePart = mkWirePart;
        function mkCurvedWireSeg(p1, p2, smooth, clrClass) {
            var coordStr = function (xy) { return xy[0] + ", " + xy[1]; };
            var x1 = p1[0], y1 = p1[1];
            var x2 = p2[0], y2 = p2[1];
            var yLen = (y2 - y1);
            var c1 = [x1, y1 + yLen * smooth];
            var c2 = [x2, y2 - yLen * smooth];
            var w = pxsim.svg.mkPath("sim-bb-wire", "M" + coordStr(p1) + " C" + coordStr(c1) + " " + coordStr(c2) + " " + coordStr(p2));
            pxsim.U.addClass(w, "wire-stroke-" + clrClass);
            return w;
        }
        function mkWirePartSeg(p1, p2, clr) {
            //TODO: merge with mkCurvedWireSeg
            var coordStr = function (xy) { return xy[0] + ", " + xy[1]; };
            var x1 = p1[0], y1 = p1[1];
            var x2 = p2[0], y2 = p2[1];
            var yLen = (y2 - y1);
            var c1 = [x1, y1 + yLen * .8];
            var c2 = [x2, y2 - yLen * .8];
            var e = pxsim.svg.mkPath("sim-bb-wire", "M" + coordStr(p1) + " C" + coordStr(c1) + " " + coordStr(c2) + " " + coordStr(p2));
            e.style["stroke"] = clr;
            return { el: e, x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x1 - x2), h: Math.abs(y1 - y2) };
        }
        function mkWireSeg(p1, p2, clrClass) {
            var coordStr = function (xy) { return xy[0] + ", " + xy[1]; };
            var w = pxsim.svg.mkPath("sim-bb-wire", "M" + coordStr(p1) + " L" + coordStr(p2));
            pxsim.U.addClass(w, "wire-stroke-" + clrClass);
            return w;
        }
        function mkBBJumperEnd(p, clrClass) {
            var endW = visuals.PIN_DIST / 4;
            var w = pxsim.svg.elt("circle");
            var x = p[0];
            var y = p[1];
            var r = WIRE_WIDTH / 2 + endW / 2;
            pxsim.svg.hydrate(w, { cx: x, cy: y, r: r, class: "sim-bb-wire-end" });
            pxsim.U.addClass(w, "wire-fill-" + clrClass);
            w.style["stroke-width"] = endW + "px";
            return w;
        }
        function mkOpenJumperEnd(p, top, clr) {
            var k = visuals.PIN_DIST * 0.24;
            var plasticLength = k * 10;
            var plasticWidth = k * 2;
            var metalLength = k * 6;
            var metalWidth = k;
            var strokeWidth = visuals.PIN_DIST / 4.0;
            var cx = p[0], cy = p[1];
            var o = top ? -1 : 1;
            var g = pxsim.svg.elt("g");
            var el = pxsim.svg.elt("rect");
            var h1 = plasticLength;
            var w1 = plasticWidth;
            var x1 = cx - w1 / 2;
            var y1 = cy - (h1 / 2);
            pxsim.svg.hydrate(el, { x: x1, y: y1, width: w1, height: h1, rx: 0.5, ry: 0.5, class: "sim-bb-wire-end" });
            el.style["stroke-width"] = strokeWidth + "px";
            var el2 = pxsim.svg.elt("rect");
            var h2 = metalLength;
            var w2 = metalWidth;
            var cy2 = cy + o * (h1 / 2 + h2 / 2);
            var x2 = cx - w2 / 2;
            var y2 = cy2 - (h2 / 2);
            pxsim.svg.hydrate(el2, { x: x2, y: y2, width: w2, height: h2, class: "sim-bb-wire-bare-end" });
            el2.style["fill"] = "#bbb";
            g.appendChild(el2);
            g.appendChild(el);
            return { el: g, x: x1 - strokeWidth, y: Math.min(y1, y2), w: w1 + strokeWidth * 2, h: h1 + h2 };
        }
        function mkSmallMBPinEnd(p, top, clr) {
            //HACK
            //TODO: merge with mkOpenJumperEnd()
            var k = visuals.PIN_DIST * 0.24;
            var plasticLength = k * 4;
            var plasticWidth = k * 1.2;
            var metalLength = k * 10;
            var metalWidth = k;
            var strokeWidth = visuals.PIN_DIST / 4.0;
            var cx = p[0], cy = p[1];
            var yOffset = 10;
            var o = top ? -1 : 1;
            var g = pxsim.svg.elt("g");
            var el = pxsim.svg.elt("rect");
            var h1 = plasticLength;
            var w1 = plasticWidth;
            var x1 = cx - w1 / 2;
            var y1 = cy + yOffset - (h1 / 2);
            pxsim.svg.hydrate(el, { x: x1, y: y1, width: w1, height: h1, rx: 0.5, ry: 0.5, class: "sim-bb-wire-end" });
            el.style["stroke-width"] = strokeWidth + "px";
            var el2 = pxsim.svg.elt("rect");
            var h2 = metalLength;
            var w2 = metalWidth;
            var cy2 = cy + yOffset + o * (h1 / 2 + h2 / 2);
            var x2 = cx - w2 / 2;
            var y2 = cy2 - (h2 / 2);
            pxsim.svg.hydrate(el2, { x: x2, y: y2, width: w2, height: h2, class: "sim-bb-wire-bare-end" });
            el2.style["fill"] = "#bbb";
            g.appendChild(el2);
            g.appendChild(el);
            return { el: g, x: x1 - strokeWidth, y: Math.min(y1, y2), w: w1 + strokeWidth * 2, h: h1 + h2 };
        }
        function mkCrocEnd(p, top, clr) {
            //TODO: merge with mkOpenJumperEnd()
            var k = visuals.PIN_DIST * 0.24;
            var plasticWidth = k * 4;
            var plasticLength = k * 10.0;
            var metalWidth = k * 3.5;
            var metalHeight = k * 3.5;
            var pointScalar = .15;
            var baseScalar = .3;
            var taperScalar = .7;
            var strokeWidth = visuals.PIN_DIST / 4.0;
            var cx = p[0], cy = p[1];
            var o = top ? -1 : 1;
            var g = pxsim.svg.elt("g");
            var el = pxsim.svg.elt("polygon");
            var h1 = plasticLength;
            var w1 = plasticWidth;
            var x1 = cx - w1 / 2;
            var y1 = cy - (h1 / 2);
            var mkPnt = function (xy) { return xy[0] + "," + xy[1]; };
            var mkPnts = function () {
                var xys = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    xys[_i] = arguments[_i];
                }
                return xys.map(function (xy) { return mkPnt(xy); }).join(" ");
            };
            var topScalar = top ? pointScalar : baseScalar;
            var midScalar = top ? taperScalar : (1 - taperScalar);
            var botScalar = top ? baseScalar : pointScalar;
            pxsim.svg.hydrate(el, {
                points: mkPnts([x1 + w1 * topScalar, y1], //TL
                [x1 + w1 * (1 - topScalar), y1], //TR
                [x1 + w1, y1 + h1 * midScalar], //MR
                [x1 + w1 * (1 - botScalar), y1 + h1], //BR
                [x1 + w1 * botScalar, y1 + h1], //BL
                [x1, y1 + h1 * midScalar]) //ML
            });
            pxsim.svg.hydrate(el, { rx: 0.5, ry: 0.5, class: "sim-bb-wire-end" });
            el.style["stroke-width"] = strokeWidth + "px";
            var el2 = pxsim.svg.elt("rect");
            var h2 = metalWidth;
            var w2 = metalHeight;
            var cy2 = cy + o * (h1 / 2 + h2 / 2);
            var x2 = cx - w2 / 2;
            var y2 = cy2 - (h2 / 2);
            pxsim.svg.hydrate(el2, { x: x2, y: y2, width: w2, height: h2, class: "sim-bb-wire-bare-end" });
            g.appendChild(el2);
            g.appendChild(el);
            return { el: g, x: x1 - strokeWidth, y: Math.min(y1, y2), w: w1 + strokeWidth * 2, h: h1 + h2 };
        }
        //TODO: make this stupid class obsolete
        var WireFactory = /** @class */ (function () {
            function WireFactory(underboard, overboard, boardEdges, styleEl, getLocCoord, getPinStyle) {
                this.nextWireId = 0;
                this.styleEl = styleEl;
                this.styleEl.textContent += visuals.WIRES_CSS;
                this.underboard = underboard;
                this.overboard = overboard;
                this.boardEdges = boardEdges;
                this.getLocCoord = getLocCoord;
                this.getPinStyle = getPinStyle;
            }
            WireFactory.prototype.indexOfMin = function (vs) {
                var minIdx = 0;
                var min = vs[0];
                for (var i = 1; i < vs.length; i++) {
                    if (vs[i] < min) {
                        min = vs[i];
                        minIdx = i;
                    }
                }
                return minIdx;
            };
            WireFactory.prototype.closestEdgeIdx = function (p) {
                var dists = this.boardEdges.map(function (e) { return Math.abs(p[1] - e); });
                var edgeIdx = this.indexOfMin(dists);
                return edgeIdx;
            };
            WireFactory.prototype.closestEdge = function (p) {
                return this.boardEdges[this.closestEdgeIdx(p)];
            };
            WireFactory.prototype.drawWire = function (pin1, pin2, color) {
                var _this = this;
                var wires = [];
                var g = pxsim.svg.child(this.overboard, "g", { class: "sim-bb-wire-group" });
                var closestPointOffBoard = function (p) {
                    var offset = visuals.PIN_DIST / 2;
                    var e = _this.closestEdge(p);
                    var y;
                    if (e - p[1] < 0)
                        y = e - offset;
                    else
                        y = e + offset;
                    return [p[0], y];
                };
                var wireId = this.nextWireId++;
                var clrClass = cssEncodeColor(color);
                var end1 = mkBBJumperEnd(pin1, clrClass);
                var end2 = mkBBJumperEnd(pin2, clrClass);
                var endG = pxsim.svg.child(g, "g", { class: "sim-bb-wire-ends-g" });
                endG.appendChild(end1);
                endG.appendChild(end2);
                var edgeIdx1 = this.closestEdgeIdx(pin1);
                var edgeIdx2 = this.closestEdgeIdx(pin2);
                if (edgeIdx1 == edgeIdx2) {
                    var seg = mkWireSeg(pin1, pin2, clrClass);
                    g.appendChild(seg);
                    wires.push(seg);
                }
                else {
                    var offP1 = closestPointOffBoard(pin1);
                    var offP2 = closestPointOffBoard(pin2);
                    var offSeg1 = mkWireSeg(pin1, offP1, clrClass);
                    var offSeg2 = mkWireSeg(pin2, offP2, clrClass);
                    var midSeg = void 0;
                    var midSegHover = void 0;
                    var isBetweenMiddleTwoEdges = (edgeIdx1 == 1 || edgeIdx1 == 2) && (edgeIdx2 == 1 || edgeIdx2 == 2);
                    if (isBetweenMiddleTwoEdges) {
                        midSeg = mkCurvedWireSeg(offP1, offP2, BB_WIRE_SMOOTH, clrClass);
                        midSegHover = mkCurvedWireSeg(offP1, offP2, BB_WIRE_SMOOTH, clrClass);
                    }
                    else {
                        midSeg = mkWireSeg(offP1, offP2, clrClass);
                        midSegHover = mkWireSeg(offP1, offP2, clrClass);
                    }
                    pxsim.U.addClass(midSegHover, "sim-bb-wire-hover");
                    g.appendChild(offSeg1);
                    wires.push(offSeg1);
                    g.appendChild(offSeg2);
                    wires.push(offSeg2);
                    this.underboard.appendChild(midSeg);
                    wires.push(midSeg);
                    g.appendChild(midSegHover);
                    wires.push(midSegHover);
                    //set hover mechanism
                    var wireIdClass_1 = "sim-bb-wire-id-" + wireId;
                    var setId = function (e) { return pxsim.U.addClass(e, wireIdClass_1); };
                    setId(endG);
                    setId(midSegHover);
                    this.styleEl.textContent += "\n                    ." + wireIdClass_1 + ":hover ~ ." + wireIdClass_1 + ".sim-bb-wire-hover {\n                        visibility: visible;\n                    }";
                }
                // wire colors
                var colorCSS = "\n                .wire-stroke-" + clrClass + " {\n                    stroke: " + visuals.mapWireColor(color) + ";\n                }\n                .wire-fill-" + clrClass + " {\n                    fill: " + visuals.mapWireColor(color) + ";\n                }\n                ";
                this.styleEl.textContent += colorCSS;
                return { endG: endG, end1: end1, end2: end2, wires: wires };
            };
            WireFactory.prototype.drawWireWithCrocs = function (pin1, pin2, color, smallPin) {
                var _this = this;
                if (smallPin === void 0) { smallPin = false; }
                //TODO: merge with drawWire()
                var PIN_Y_OFF = 40;
                var CROC_Y_OFF = -17;
                var wires = [];
                var g = pxsim.svg.child(this.overboard, "g", { class: "sim-bb-wire-group" });
                var closestPointOffBoard = function (p) {
                    var offset = visuals.PIN_DIST / 2;
                    var e = _this.closestEdge(p);
                    var y;
                    if (e - p[1] < 0)
                        y = e - offset;
                    else
                        y = e + offset;
                    return [p[0], y];
                };
                var wireId = this.nextWireId++;
                var clrClass = cssEncodeColor(color);
                var end1 = mkBBJumperEnd(pin1, clrClass);
                var pin2orig = pin2;
                var x2 = pin2[0], y2 = pin2[1];
                pin2 = [x2, y2 + PIN_Y_OFF]; //HACK
                x2 = pin2[0], y2 = pin2[1];
                var endCoord2 = [x2, y2 + CROC_Y_OFF];
                var end2AndSize;
                if (smallPin)
                    end2AndSize = mkSmallMBPinEnd(endCoord2, true, color);
                else
                    end2AndSize = mkCrocEnd(endCoord2, true, color);
                var end2 = end2AndSize.el;
                var endG = pxsim.svg.child(g, "g", { class: "sim-bb-wire-ends-g" });
                endG.appendChild(end1);
                //endG.appendChild(end2);
                var edgeIdx1 = this.closestEdgeIdx(pin1);
                var edgeIdx2 = this.closestEdgeIdx(pin2orig);
                if (edgeIdx1 == edgeIdx2) {
                    var seg = mkWireSeg(pin1, pin2, clrClass);
                    g.appendChild(seg);
                    wires.push(seg);
                }
                else {
                    var offP1 = closestPointOffBoard(pin1);
                    //let offP2 = closestPointOffBoard(pin2orig);
                    var offSeg1 = mkWireSeg(pin1, offP1, clrClass);
                    //let offSeg2 = mkWireSeg(pin2, offP2, clrClass);
                    var midSeg = void 0;
                    var midSegHover = void 0;
                    var isBetweenMiddleTwoEdges = (edgeIdx1 == 1 || edgeIdx1 == 2) && (edgeIdx2 == 1 || edgeIdx2 == 2);
                    if (isBetweenMiddleTwoEdges) {
                        midSeg = mkCurvedWireSeg(offP1, pin2, BB_WIRE_SMOOTH, clrClass);
                        midSegHover = mkCurvedWireSeg(offP1, pin2, BB_WIRE_SMOOTH, clrClass);
                    }
                    else {
                        midSeg = mkWireSeg(offP1, pin2, clrClass);
                        midSegHover = mkWireSeg(offP1, pin2, clrClass);
                    }
                    pxsim.U.addClass(midSegHover, "sim-bb-wire-hover");
                    g.appendChild(offSeg1);
                    wires.push(offSeg1);
                    // g.appendChild(offSeg2);
                    // wires.push(offSeg2);
                    this.underboard.appendChild(midSeg);
                    wires.push(midSeg);
                    //g.appendChild(midSegHover);
                    //wires.push(midSegHover);
                    //set hover mechanism
                    var wireIdClass_2 = "sim-bb-wire-id-" + wireId;
                    var setId = function (e) { return pxsim.U.addClass(e, wireIdClass_2); };
                    setId(endG);
                    setId(midSegHover);
                    this.styleEl.textContent += "\n                    ." + wireIdClass_2 + ":hover ~ ." + wireIdClass_2 + ".sim-bb-wire-hover {\n                        visibility: visible;\n                    }";
                }
                endG.appendChild(end2); //HACK
                // wire colors
                var colorCSS = "\n                .wire-stroke-" + clrClass + " {\n                    stroke: " + visuals.mapWireColor(color) + ";\n                }\n                .wire-fill-" + clrClass + " {\n                    fill: " + visuals.mapWireColor(color) + ";\n                }\n                ";
                this.styleEl.textContent += colorCSS;
                return { endG: endG, end1: end1, end2: end2, wires: wires };
            };
            WireFactory.prototype.checkWire = function (start, end) {
                var startLoc = this.getLocCoord(start);
                var endLoc = this.getLocCoord(end);
                return !!startLoc && !!endLoc;
            };
            WireFactory.prototype.addWire = function (start, end, color) {
                var startLoc = this.getLocCoord(start);
                var endLoc = this.getLocCoord(end);
                if (!startLoc || !endLoc) {
                    console.debug("unable to allocate wire for " + start + " or " + end);
                    return undefined;
                }
                //let startStyle = this.getPinStyle(start);
                var endStyle = this.getPinStyle(end);
                var wireEls;
                if (end.type == "dalboard" && endStyle == "croc") {
                    wireEls = this.drawWireWithCrocs(startLoc, endLoc, color);
                }
                else {
                    wireEls = this.drawWire(startLoc, endLoc, color);
                }
                return wireEls;
            };
            return WireFactory;
        }());
        visuals.WireFactory = WireFactory;
    })(visuals = pxsim.visuals || (pxsim.visuals = {}));
})(pxsim || (pxsim = {}));
