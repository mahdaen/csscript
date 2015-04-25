!function($) {
    "use strict";
    window.performance || (window.performance = {
        now: function() {
            return new Date().getMilliseconds();
        }
    }), document.addEventListener("readystatechange", function() {
        "interactive" === document.readyState && setTimeout(initParser, 0);
    });
    var decompress = function(css) {
        var tab = 4, space = "";
        if (css = css.split("	").join("    ").replace(/\s*{\s*/g, " {\n    ").replace(/;\s*/g, ";\n    ").replace(/,\s*/g, ", ").replace(/[ ]*}\s*/g, "}\n").replace(/\}\s*(.+)/g, "}\n$1").replace(/\n    ([^:]+):\s*/g, "\n    $1: ").replace(/([A-z0-9\)])}/g, "$1;\n}"), 
        4 != tab) {
            for (;0 != tab; tab--) space += " ";
            css = cssString.replace(/\n    /g, "\n" + space);
        }
        return css;
    }, initParser = function() {
        $('<style type="text/css" id="csscript-holder">').appendTo("head"), $('link[rel="stylesheet"]').each(function() {
            var url = $(this).attr("href");
            if (isString(url)) $.get(url).success(function(cssString) {
                cssString = decompress(cssString), !CSScriptExtractAll && cssString.search(/\%\(/) < 0 || (CollectedCSS.push({
                    css: cssString,
                    url: url
                }), $.renderCSScript());
            }); else {
                var cssString = $(this).html();
                if (cssString = decompress(cssString), cssString.search(/\%\(/) < 0) return;
                cssString.length > 10 && (CollectedCSS.push({
                    css: cssString,
                    url: "local"
                }), $.renderCSScript());
            }
        });
    }, CollectedCSS = [];
    $.renderCSScript = function() {
        if ($("#csscript-holder").html(" "), window.CSScriptLists.clean(), CollectedCSScripts = [], 
        CSScriptCSS = "", CSScriptTime = performance.now(), foreach(CollectedCSS, function(CSSes) {
            var stylesheet = new CSSStylesheet(CSSes.url, CSSes.css);
            stylesheet.parseRules();
        }), CSScriptAutoRender && "ready" !== CSScriptAutoRender) {
            CSScriptAutoRender = "ready", $('<style id="dommutationlistener" type="text/css">').html(muframe).appendTo("head");
            var xtm = setTimeout(function() {}, 0), mutationHandler = function() {
                clearTimeout(xtm), xtm = setTimeout(function() {
                    $.renderCSScript();
                }, 20);
            };
            setTimeout(function() {
                document.addEventListener("animationstart", mutationHandler, !1), document.addEventListener("MSAnimationStart", mutationHandler, !1), 
                document.addEventListener("webkitAnimationStart", mutationHandler, !1);
            }, 750);
        }
    };
    var CollectedCSScripts = [], CSScriptLists = function() {
        return this.length = 0, this;
    };
    CSScriptLists.prototype = {
        push: function(obj) {
            return this[this.length] = obj, this.length = this.length + 1, this;
        },
        clean: function() {
            var $this = this;
            return foreach($this, function(a, i) {
                delete $this[i], $this.length--;
            }), this;
        }
    }, window.CSScriptLists = new CSScriptLists();
    var CSSStylesheet = function(url, cssText) {
        return this.href = url, this.cssText = cssText, this.rules = new CSSRuleList(), 
        window.CSScriptLists.push(this), this;
    };
    CSSStylesheet.prototype = {
        parseRules: function() {
            if (this.cssText && this.href) {
                var CSStext = this.cssText, $stylesheet = (this.href, this);
                CSStext = CSStext.replace(/\(\s?\{/g, "(!$").replace(/\}\s?\)/g, "$!)");
                var cssBlocks = CSStext.match(RgxBlock);
                cssBlocks && foreach(cssBlocks, function(cssblock) {
                    if (CSScriptExtractAll || !(cssblock.search(/\%\(/) < 0)) {
                        cssblock = cssblock.replace(/\n+/, "");
                        var fst = cssblock.slice(0, 1);
                        if ("@" === fst) {
                            if (cssblock.search(/^\@/) > -1 && (cssblock += "}"), cssblock.search("@media") > -1) {
                                var media = cssblock.match(/\@[a-zA-Z\d\.\s+\,\-\:\(\)\#\*\[\]\=\"\']+\{/);
                                if (media) {
                                    var mediarule = new CSSMediaRule(cssblock, media[0]);
                                    mediarule.parseMedia();
                                }
                                return;
                            }
                            if (cssblock.search("@keyframes") > -1 || cssblock.search("@-webkit-keyframes") > -1) return;
                            if (cssblock.search("@font-face") > -1) return;
                        } else {
                            var cssrule = new CSSStyleRule(cssblock);
                            cssrule.parent = $stylesheet.rules, cssrule.parseStyles(!0), $stylesheet.rules.push(cssrule);
                        }
                    }
                });
            }
        }
    };
    var CSSRuleList = function() {
        return this.length = 0, this;
    };
    CSSRuleList.prototype = {
        push: function(obj) {
            return this[this.length] = obj, this.length = this.length + 1, this;
        }
    };
    var CSSStyleRule = function(csstring, selector) {
        return this.cssText = csstring, this.selector = selector, this.styles = new CSSStyleList(), 
        this.cstyle = new CSScriptStyle(), CollectedCSScripts.push(this), this;
    };
    CSSStyleRule.prototype = {
        parseStyles: function(render) {
            var selector, $rule = this, cssText = this.cssText;
            if (selector = cssText.match(/[a-zA-Z\d\.\s+\,\-\:\(\)\#\*\[\]\=\"\']+\{/)) {
                $rule.type = "CSSStyleRule";
                var cssdec = cssText.replace(selector[0], "").replace("}", "").replace(/\n+/g, "");
                if (selector = selector[0].replace(/\s?\{/, "").replace(/\n/g, " "), $rule.selector = selector, 
                cssdec = cssdec.replace(/\;\s+/, ";").split(";")) {
                    {
                        $rule.styles;
                    }
                    if (foreach(cssdec, function(style) {
                        if ("" !== style) {
                            var style = style.replace(/\s+/g, " ").replace(/\s+/, ""), prop = style.match(/[\*a-zA-Z\-]+\:/);
                            if (prop && prop.length > 0) {
                                var value = style.replace(prop[0], "").replace(/\s+/, "");
                                prop = prop[0].replace(/\s+/g, "").replace(":", ""), value.search(/\%\(/) > -1 && value.search(/\)\%/) ? $rule.cstyle.push(prop, value) : $rule.styles.push(prop, value);
                            }
                        }
                    }), render && $rule.render(), CSScriptExtractAll) {
                        var now = performance.now();
                        CSScriptTime = Math.round(now - CSScriptTime);
                    }
                }
            }
        },
        render: function() {
            var $rule = this, $selector = this.selector, actions = (this.cstyle, [ "focus", "blur", "click", "mouseenter", "mouseleave", "change", "hover" ]);
            if ($selector.search(":") > -1) foreach(actions, function(pseudo) {
                if (!($selector.search(pseudo) < 0) && ($selector = $selector.replace(new RegExp("\\:" + pseudo, "g"), ""), 
                $selector && "" !== $selector && " " !== $selector)) {
                    var valid;
                    try {
                        valid = document.querySelectorAll($selector);
                    } catch (err) {}
                    valid && $($selector).each(function(i) {
                        this["_" + pseudo + "Style"] = $rule, this._evcol && $(this).unlisten("css" + pseudo), 
                        $(this).listen("css" + pseudo, pseudo, function() {
                            applyStyles.call(this, i, "_" + pseudo + "Style");
                        });
                    });
                }
            }); else {
                if ("" === $selector) return;
                $($selector).each(function(i) {
                    this._regularStyle = $rule, applyStyles.call(this, i, "_regularStyle");
                });
            }
            return this;
        }
    };
    var applyStyles = function(i, groupd, inline) {
        var $this = this, $props = {}, hasprop, cstyles = this[groupd].cstyle, selector = this[groupd].selector;
        if (foreach(cstyles, function(style) {
            var key = style.property, value = style.value, inlineScript = "script" === key || "scripts" === key ? !0 : !1;
            value = value.replace(/\$i/g, i).replace(/this/g, "$this").replace(/\@/g, "CSScriptVariables."), 
            value = value.replace(/\"\%\(/, "%(").replace(/\)\%\"/, ")%").replace(/\'\%\(/, "%(").replace(/\)\%\'/, ")%"), 
            value = value.replace(/\(\!\$/g, "({").replace(/\$\!\)/g, "})");
            var csscValues = value.match(/\%\([a-zA-Z\.\,\!\@\%\(\)\'\"\:\?\d\<\>\*\/\=\$\#\s\+\-\_\[\]\{\}\|\&\\]+\)\%/g);
            if (csscValues && foreach(csscValues, function(csscValue) {
                var newValue, script = csscValue.replace(/\%\(/, "").replace(/\)\%/, "");
                if (inlineScript) {
                    try {
                        eval(script);
                    } catch (err) {}
                    delete $props[key];
                } else {
                    try {
                        eval("newValue = " + script);
                    } catch (err) {}
                    value = void 0 !== newValue ? value.replace(csscValue, newValue) : value.replace(csscValue, null);
                }
            }), !inlineScript) {
                hasprop = !0;
                try {
                    eval("value = " + value);
                } catch (err) {}
                $props[key] = void 0 !== value ? value : null;
            }
        }), hasprop) if (inline) $(this).css($props); else {
            $(this).attr("cssid", this.getAttribute("cssid") || CSSID++);
            var cssString = createCSS(selector + '[cssid="' + (this.getAttribute("cssid") || CSSID++) + '"]', $props);
            this._oldcss && CSScriptCSS.search(this._oldcss) > -1 ? CSScriptCSS = CSScriptCSS.replace(this._oldcss, cssString) : CSScriptCSS += cssString, 
            $("#csscript-holder").html(CSScriptCSS), this._oldcss = cssString;
            var now = performance.now();
            CSScriptTime = Math.round(now - CSScriptTime);
        }
        return $props;
    }, PrivateVariables = function() {
        return this;
    };
    PrivateVariables.prototype = {
        push: function(key, value) {
            this[key] = value;
        }
    };
    var createCSS = function(selector, props) {
        if (isString(selector) && isObject(props)) {
            var str = "\n" + selector + " { \n";
            foreach(props, function(key, value) {
                str += "	" + key + ": " + (isNumber(value) ? value + "px" : value) + ";\n";
            }), str = str.replace(/\n$/, ""), str += "\n}";
        }
        return str;
    }, CSSStyleList = function() {
        return this;
    };
    CSSStyleList.prototype = {
        push: function(key, value) {
            return this[key] = value, this;
        }
    };
    var CSScriptStyle = function() {
        return this.render = !1, this.length = 0, this;
    };
    CSScriptStyle.prototype = {
        push: function(key, value) {
            return this[this.length] = {
                property: key,
                value: value
            }, this.length++, this;
        }
    };
    var CSSMediaRule = function(csstring, query) {
        return this.cssText = csstring, this.queries = query, this.rules = new CSSRuleList(), 
        this;
    };
    CSSMediaRule.prototype = {
        parseMedia: function() {
            var qrwrap = $('<style id="mqr-parser" type="text/css">').appendTo("head"), qrhold = $("<div mqr-holder>").appendTo("body"), qrhDefStyle = "[mqr-holder] {\n	position: fixed; top: 0; left: 0; height: 0; z-index: -1; width: 0;\n}", qrhMedStyle = "[mqr-holder] { width: 123px; }", qrhQuery = qrhDefStyle + "\n\n" + this.queries + "\n	" + qrhMedStyle + "\n}";
            if (qrwrap.html(qrhQuery), 123 === qrhold.width()) {
                var csstyle = new CSSStylesheet("local-media", this.cssText.replace(this.queries, ""));
                csstyle.parseRules();
            }
            return qrwrap.remove(), qrhold.remove(), this;
        }
    };
    var CSSKeyframeRule = function(csstring, selector) {
        return this.cssText = csstring, this.selector = selector, this.styles = new CSSStyleList(), 
        this;
    }, CSSFontRule = function(csstring, selector) {
        return this.cssText = csstring, this.selector = selector, this.styles = new CSSStyleList(), 
        this;
    }, muframe = "@-webkit-keyframes dommutationlistener { 0% { opacity: 1; } 100% { opacity: 1; } }\n";
    muframe += "@keyframes dommutationlistener { 0% { opacity: 1; } 100% { opacity: 1; } }\n", 
    muframe += "body *:not([mqr-holder]) { -webkit-animation: dommutationlistener 0s linear; animation: dommutationlistener 0s linear; }", 
    window.CSScriptVariables = {};
    var CSScriptCSS = "", CSSID = 0, CSScriptTime = new Date().getTime();
    window.CSScriptExtractAll || (window.CSScriptExtractAll = !1), window.CSScriptAutoRender || (window.CSScriptAutoRender = !1);
    var RgxBlock = /[a-zA-Z\d\@\%\#\*\[\]\=\"\'\d\s+\.\,\:\-\_\(\)]+\{\s+[a-zA-Z\!\/\d\:\s?;\-\%\#\'\"\.\,\(\)\*\+\{\<\>\=\@\?\$\_\[\]\|\&\\]+\}/g, RgmBlock = /[a-zA-Z\d\%\#\*\[\]\=\"\'\d\s+\.\,\:\-\_\(\)]+\{\s+[a-zA-Z\!\/\d\:\s?;\-\%\#\'\"\.\,\(\)\*\+\{\<\>\=\@\?\$\_\[\]\|\&\\]+\}/g, windowresize = setTimeout(function() {}, 200);
    window.addEventListener("resize", function() {
        clearTimeout(windowresize), windowresize = setTimeout(function() {
            foreach(CollectedCSScripts, function(rule) {
                rule.render();
            });
        }, 200);
    });
}(DOMList);