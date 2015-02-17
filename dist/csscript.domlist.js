!function($) {
    "use strict";
    document.addEventListener("readystatechange", function() {
        "interactive" === document.readyState && setTimeout(initParser, 0);
    });
    var initParser = function() {
        $('<style type="text/css" id="csscript-holder">').appendTo("head"), $('link[rel="stylesheet"]').each(function() {
            var url = $(this).attr("href");
            if (isString(url)) $.get(url).success(function(cssString) {
                cssString.search(/\%\(/) < 0 && !CSScriptExtractAll || (ColectedCSS.push({
                    css: cssString,
                    url: url
                }), $.renderCSScript());
            }); else {
                var html = $(this).html();
                if (html.search(/\%\(/) < 0) return;
                html.length > 10 && (ColectedCSS.push({
                    css: html,
                    url: "local"
                }), $.renderCSScript());
            }
        });
    }, ColectedCSS = [];
    $.renderCSScript = function() {
        foreach(ColectedCSS, function(CSSes) {
            var stylesheet = new CSSStylesheet(CSSes.url, CSSes.css);
            stylesheet.parseRules();
        });
    };
    var ColectedCSScript = [], CSScriptLists = function() {
        return this.length = 0, this;
    };
    CSScriptLists.prototype = {
        push: function(obj) {
            return this[this.length] = obj, this.length = this.length + 1, this;
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
                    if (!(cssblock.search(/\%\(/) < 0) || CSScriptExtractAll) {
                        cssblock = cssblock.replace(/\n+/, "");
                        var fst = cssblock.slice(0, 1);
                        if ("@" === fst) {
                            if (cssblock.search(/^\@/) > -1 && (cssblock += "}"), cssblock.search("@media") > -1) return;
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
        this.cstyle = new CSScriptStyle(), ColectedCSScript.push(this), this;
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
                    foreach(cssdec, function(style) {
                        if ("" !== style) {
                            var style = style.replace(/\s+/g, " ").replace(/\s+/, ""), prop = style.match(/[\*a-zA-Z\-]+\:/);
                            if (prop && prop.length > 0) {
                                var value = style.replace(prop[0], "").replace(/\s+/, "");
                                prop = prop[0].replace(/\s+/g, "").replace(":", ""), value.search(/\%\(/) > -1 && value.search(/\)\%/) ? $rule.cstyle.push(prop, value) : $rule.styles.push(prop, value);
                            }
                        }
                    }), render && $rule.render();
                }
            }
        },
        render: function() {
            var $rule = this, $selector = this.selector, actions = (this.cstyle, [ "focus", "blur", "click", "mouseenter", "mouseleave", "change" ]);
            return $selector.search(":") > -1 ? foreach(actions, function(pseudo) {
                $selector.search(pseudo) < 0 || ($selector = $selector.replace(new RegExp("\\:" + pseudo, "g"), ""), 
                $($selector).each(function(i) {
                    this["_" + pseudo + "Style"] = $rule, this._evcol && $(this).unlisten("css" + pseudo), 
                    $(this).listen("css" + pseudo, pseudo, function() {
                        applyStyles.call(this, i, "_" + pseudo + "Style");
                    });
                }));
            }) : $($selector).each(function(i) {
                this._regularStyle = $rule, applyStyles.call(this, i, "_regularStyle");
            }), this;
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
    }, CSSKeyframeRule = function(csstring, selector) {
        return this.cssText = csstring, this.selector = selector, this.styles = new CSSStyleList(), 
        this;
    }, CSSFontRule = function(csstring, selector) {
        return this.cssText = csstring, this.selector = selector, this.styles = new CSSStyleList(), 
        this;
    };
    window.CSScriptVariables = {};
    var CSScriptCSS = "", CSSID = 0;
    window.CSScriptExtractAll = !1;
    var RgxBlock = /[a-zA-Z\d\@\%\#\*\[\]\=\"\'\d\s+\.\,\:\-\_\(\)]+\{\s+[a-zA-Z\!\/\d\:\s?;\-\%\#\'\"\.\,\(\)\*\+\{\<\>\=\@\?\$\_\[\]\|\&\\]+\}/g, windowresize = setTimeout(function() {}, 200);
    window.addEventListener("resize", function() {
        clearTimeout(windowresize), windowresize = setTimeout(function() {
            foreach(ColectedCSScript, function(rule) {
                rule.render();
            });
        }, 200);
    });
}(DOMList);