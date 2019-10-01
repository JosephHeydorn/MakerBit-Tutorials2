"use strict";
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
var sui = require("./sui");
var data = require("./data");
var OUT_OF_BOUND_MARGIN = 300;
var DRAG_THRESHOLD = 5;
var DraggingDirection;
(function (DraggingDirection) {
    DraggingDirection[DraggingDirection["None"] = 0] = "None";
    DraggingDirection[DraggingDirection["X"] = 1] = "X";
    DraggingDirection[DraggingDirection["Y"] = 2] = "Y";
})(DraggingDirection || (DraggingDirection = {}));
var Carousel = /** @class */ (function (_super) {
    __extends(Carousel, _super);
    function Carousel(props) {
        var _this = _super.call(this, props) || this;
        _this.arrows = [];
        _this.isDragging = false;
        _this.definitelyDragging = DraggingDirection.None;
        _this.currentOffset = 0;
        _this.index = 0;
        _this.childrenElements = [];
        _this.handleContainerRef = function (c) {
            _this.container = c;
        };
        _this.handleDragSurfaceRef = function (c) {
            _this.dragSurface = c;
        };
        _this.handleArrowRefs = function (c) {
            _this.arrows.push(c);
        };
        _this.handleChildRefs = function (c) {
            if (c)
                _this.childrenElements.push(c);
        };
        _this.state = {};
        _this.childrenElements = [];
        _this.arrows = [];
        _this.onLeftArrowClick = _this.onLeftArrowClick.bind(_this);
        _this.onRightArrowClick = _this.onRightArrowClick.bind(_this);
        return _this;
    }
    Carousel.prototype.componentWillReceiveProps = function (nextProps) {
        if (nextProps.selectedIndex != undefined) {
            this.setIndex(nextProps.selectedIndex);
        }
    };
    Carousel.prototype.renderCore = function () {
        var _this = this;
        var _a = this.state, rightDisabled = _a.rightDisabled, leftDisabled = _a.leftDisabled;
        var isRTL = pxt.Util.isUserLanguageRtl();
        return React.createElement("div", { className: "ui carouselouter" },
            !leftDisabled && React.createElement("span", { role: "button", className: "carouselarrow left aligned", tabIndex: 0, "aria-label": lf("See previous"), onClick: this.onLeftArrowClick, onKeyDown: sui.fireClickOnEnter, ref: this.handleArrowRefs },
                React.createElement(sui.Icon, { icon: "circle angle " + (!isRTL ? "left" : "right") })),
            React.createElement("div", { className: "carouselcontainer", ref: this.handleContainerRef },
                React.createElement("div", { className: "carouselbody", ref: this.handleDragSurfaceRef }, React.Children.map(this.props.children, function (child, index) { return child ?
                    React.createElement("div", { className: "carouselitem " + (_this.props.selectedIndex == index ? 'selected' : ''), ref: _this.handleChildRefs }, React.cloneElement(child, { tabIndex: _this.isVisible(index) ? 0 : -1 })) : undefined; }))),
            !rightDisabled && React.createElement("span", { role: "button", className: "carouselarrow right aligned", tabIndex: 0, "aria-label": lf("See more"), onClick: this.onRightArrowClick, onKeyDown: sui.fireClickOnEnter, ref: this.handleArrowRefs },
                React.createElement(sui.Icon, { icon: "circle angle " + (!pxt.Util.isUserLanguageRtl() ? "right" : "left") })));
    };
    Carousel.prototype.onLeftArrowClick = function () {
        this.onArrowClick(true);
    };
    Carousel.prototype.onRightArrowClick = function () {
        this.onArrowClick(false);
    };
    Carousel.prototype.onArrowClick = function (left) {
        var prevIndex = this.index;
        var prevScroll = this.container.scrollLeft;
        this.setIndex(left ? this.index - this.actualPageLength : this.index + this.actualPageLength);
        if (left) {
            // Focus right most
            var prevElement = this.index + this.actualPageLength < prevIndex ? this.index + this.actualPageLength : prevIndex - 1;
            if (this.childrenElements[prevElement])
                this.childrenElements[prevElement].firstChild.focus();
        }
        else {
            // Focus left most
            var nextElement = this.index > prevIndex + this.actualPageLength ? this.index : prevIndex + this.actualPageLength;
            if (this.childrenElements[nextElement])
                this.childrenElements[nextElement].firstChild.focus();
        }
        // Undo any scrolling caused by focus()
        this.container.scrollLeft = prevScroll;
    };
    Carousel.prototype.componentDidMount = function () {
        var _this = this;
        this.initDragSurface();
        this.updateDimensions();
        window.addEventListener("resize", function (e) {
            _this.updateDimensions();
        });
    };
    Carousel.prototype.componentDidUpdate = function () {
        this.updateDimensions();
    };
    Carousel.prototype.updateDimensions = function () {
        if (this.container) {
            var shouldReposition = false;
            this.containerWidth = this.container.getBoundingClientRect().width;
            this.getArrowWidth();
            if (this.childrenElements.length) {
                var newWidth = this.childrenElements[0].getBoundingClientRect().width;
                if (newWidth !== this.childWidth) {
                    this.childWidth = newWidth;
                    shouldReposition = true;
                }
                this.actualPageLength = Math.floor(this.containerWidth / this.childWidth);
            }
            this.dragSurface.style.width = this.totalLength() + "px";
            this.updateArrows();
            if (this.index >= this.maxIndex()) {
                shouldReposition = true;
                this.index = this.maxIndex();
            }
            if (shouldReposition) {
                this.setPosition(this.indexToOffset(this.index));
            }
        }
    };
    Carousel.prototype.initDragSurface = function () {
        var _this = this;
        var down = function (event) {
            _this.definitelyDragging = DraggingDirection.None;
            _this.dragStart(getX(event), getY(event));
        };
        var up = function (event) {
            if (_this.isDragging) {
                _this.dragEnd();
                if (_this.definitelyDragging) {
                    event.preventDefault();
                    event.stopPropagation();
                }
            }
        };
        var leave = function (event) {
            if (_this.isDragging) {
                _this.dragEnd();
            }
        };
        var move = function (event) {
            if (_this.isDragging) {
                var x_1 = getX(event);
                if (!_this.definitelyDragging) {
                    // lock direction
                    var y = getY(event);
                    if (Math.abs(x_1 - _this.dragStartX) > DRAG_THRESHOLD) {
                        _this.definitelyDragging = DraggingDirection.X;
                    }
                    else if (Math.abs(y - _this.dragStartY) > DRAG_THRESHOLD) {
                        _this.definitelyDragging = DraggingDirection.Y;
                    }
                }
                if (_this.definitelyDragging == DraggingDirection.X) {
                    event.stopPropagation();
                    event.preventDefault();
                    window.requestAnimationFrame(function () {
                        _this.dragMove(x_1);
                    });
                }
            }
        };
        this.dragSurface.addEventListener("click", function (event) {
            if (_this.definitelyDragging) {
                event.stopPropagation();
                event.preventDefault();
            }
        });
        if (window.PointerEvent) {
            this.dragSurface.addEventListener("pointerdown", down);
            this.dragSurface.addEventListener("pointerup", up);
            this.dragSurface.addEventListener("pointerleave", leave);
            this.dragSurface.addEventListener("pointermove", move);
        }
        else {
            this.dragSurface.addEventListener("mousedown", down);
            this.dragSurface.addEventListener("mouseup", up);
            this.dragSurface.addEventListener("mouseleave", leave);
            this.dragSurface.addEventListener("mousemove", move);
            if (pxt.BrowserUtils.isTouchEnabled()) {
                this.dragSurface.addEventListener("touchstart", down);
                this.dragSurface.addEventListener("touchend", up);
                this.dragSurface.addEventListener("touchcancel", leave);
                this.dragSurface.addEventListener("touchmove", move);
            }
        }
    };
    Carousel.prototype.dragStart = function (startX, startY) {
        this.isDragging = true;
        this.dragStartX = startX;
        this.dragStartY = startY;
        this.dragStartOffset = this.currentOffset;
        if (this.animationId) {
            window.cancelAnimationFrame(this.animationId);
            this.animationId = 0;
        }
    };
    Carousel.prototype.dragEnd = function () {
        this.isDragging = false;
        this.calculateIndex();
    };
    Carousel.prototype.dragMove = function (x) {
        this.dragOffset = x - this.dragStartX;
        var newOffset = pxt.Util.isUserLanguageRtl() ? this.dragStartOffset + this.dragOffset : this.dragStartOffset - this.dragOffset;
        this.setPosition(newOffset);
    };
    Carousel.prototype.setPosition = function (offset) {
        if (this.dragSurface) {
            offset = Math.min(Math.max(offset, -OUT_OF_BOUND_MARGIN), this.maxScrollOffset());
            this.currentOffset = offset;
            if (pxt.Util.isUserLanguageRtl()) {
                this.dragSurface.style.marginRight = -offset + "px";
            }
            else {
                this.dragSurface.style.marginLeft = -offset + "px";
            }
        }
    };
    Carousel.prototype.calculateIndex = function () {
        if (this.dragSurface) {
            var bucketIndex = Math.round(Math.max(this.currentOffset, 0) / this.childWidth);
            var index = void 0;
            if (this.currentOffset > this.dragStartOffset) {
                index = bucketIndex;
            }
            else {
                index = bucketIndex - 1;
            }
            this.setIndex(index, 200);
        }
    };
    Carousel.prototype.setIndex = function (index, millis) {
        var newIndex = Math.max(Math.min(index, this.maxIndex()), 0);
        if (!millis) {
            millis = Math.abs(newIndex - this.index) * 100;
        }
        this.index = newIndex;
        this.updateArrows();
        this.animation = new AnimationState(this.currentOffset, this.indexToOffset(this.index), millis);
        if (!this.animationId) {
            this.animationId = window.requestAnimationFrame(this.easeTowardsIndex.bind(this));
        }
    };
    Carousel.prototype.isVisible = function (index) {
        return index >= this.index && index < this.index + (this.actualPageLength || 4);
    };
    Carousel.prototype.easeTowardsIndex = function (time) {
        if (this.dragSurface) {
            this.setPosition(this.animation.getPosition(time));
            if (this.animation.isComplete) {
                this.animation = undefined;
                this.animationId = 0;
            }
            else {
                this.animationId = window.requestAnimationFrame(this.easeTowardsIndex.bind(this));
            }
        }
    };
    Carousel.prototype.indexToOffset = function (index) {
        if (index <= 0) {
            return 0;
        }
        if (index === this.maxIndex()) {
            return this.totalLength() - this.containerWidth - OUT_OF_BOUND_MARGIN + this.arrowWidth * 2;
        }
        return index * this.childWidth - this.childWidth * this.props.bleedPercent / 100;
    };
    Carousel.prototype.totalLength = function () {
        return React.Children.count(this.props.children) * this.childWidth + OUT_OF_BOUND_MARGIN;
    };
    Carousel.prototype.getArrowWidth = function () {
        var _this = this;
        if (this.arrows.length) {
            this.arrowWidth = 0;
            this.arrows.forEach(function (a) {
                if (a) {
                    _this.arrowWidth = Math.max(a.getBoundingClientRect().width, _this.arrowWidth);
                }
            });
        }
    };
    Carousel.prototype.maxScrollOffset = function () {
        return Math.max(this.totalLength() - this.actualPageLength * this.childWidth + OUT_OF_BOUND_MARGIN, 0);
    };
    Carousel.prototype.maxIndex = function () {
        return Math.max(this.childrenElements.length - this.actualPageLength, 0);
    };
    Carousel.prototype.updateArrows = function () {
        var _a = this.state || {}, rightDisabled = _a.rightDisabled, leftDisabled = _a.leftDisabled;
        var newRightDisabled = this.index === this.maxIndex();
        var newLeftDisabled = this.index === 0;
        if (newRightDisabled !== rightDisabled || newLeftDisabled !== leftDisabled) {
            this.setState({
                leftDisabled: newLeftDisabled,
                rightDisabled: newRightDisabled
            });
        }
    };
    return Carousel;
}(data.Component));
exports.Carousel = Carousel;
var AnimationState = /** @class */ (function () {
    function AnimationState(start, end, millis) {
        this.start = start;
        this.end = end;
        this.millis = millis;
        this.isComplete = false;
        this.slope = (end - start) / millis;
    }
    AnimationState.prototype.getPosition = function (time) {
        if (this.isComplete)
            return this.end;
        if (this.startTime === undefined) {
            this.startTime = time;
            return this.start;
        }
        var diff = time - this.startTime;
        if (diff > this.millis) {
            this.isComplete = true;
            return this.end;
        }
        return this.start + Math.floor(this.slope * diff);
    };
    return AnimationState;
}());
function getX(event) {
    if ("screenX" in event) {
        return event.screenX;
    }
    else {
        return event.changedTouches[0].screenX;
    }
}
function getY(event) {
    if ("screenY" in event) {
        return event.screenX;
    }
    else {
        return event.changedTouches[0].screenY;
    }
}
