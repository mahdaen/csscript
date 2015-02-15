!function($) {
    "use strict";
    $.ready(function() {
        setTimeout(initParser, 0);
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
            new CSSStyleSheet(CSSes.url, CSSes.css);
            extractBlocks(CSSes.css, CSSes.url);
        });
    };
    var extractBlocks = function(cssString, url) {
        if (isString(cssString)) {
            cssString = cssString.replace(/\(\s?\{/g, "(!$").replace(/\}\s?\)/g, "$!)");
            var cssBlocks = cssString.match(RgxBlock);
            if (cssBlocks) {
                var cssStylesheet = new CSSStylesheet(url);
                foreach(cssBlocks, function(csstr) {
                    if (!(csstr.search(/\%\(/) < 0) || CSScriptExtractAll) {
                        csstr = csstr.replace(/\n+/, "");
                        var fst = csstr.slice(0, 1);
                        if ("@" === fst) {
                            if (csstr.search(/^\@/) > -1 && (csstr += "}"), csstr.search("@media") > -1) return;
                            if (csstr.search("@keyframes") > -1 || csstr.search("@-webkit-keyframes") > -1) return;
                            if (csstr.search("@font-face") > -1) return;
                        } else {
                            var cssrule = new CSSStyleRule(csstr);
                            cssrule.parent = cssStylesheet.rules, cssrule.extract(), parseRule(cssrule, csstr, !0), 
                            cssStylesheet.rules.push(cssrule);
                        }
                    }
                });
            }
        }
    }, parseRule = function(rule, csstr, proceed) {
        var selector, cssrule = rule;
        if (selector = csstr.match(/[a-zA-Z\d\.\s+\,\-\:\(\)\#\*\[\]\=\"\']+\{/), cssrule.type = "CSSStyleRule", 
        selector) {
            var cssdec = csstr.replace(selector[0], "").replace("}", "").replace(/\n+/g, "");
            if (selector = selector[0].replace(/\s?\{/, "").replace(/\n/g, " "), cssrule.selector = selector, 
            cssdec = cssdec.replace(/\;\s+/, ";").split(";")) {
                var csscDeclarations = {
                    proceed: !1,
                    styles: []
                };
                if (foreach(cssdec, function(style) {
                    if ("" !== style) {
                        var style = style.replace(/\s+/g, " ").replace(/\s+/, ""), prop = style.match(/[\*a-zA-Z\-]+\:/);
                        if (prop && prop.length > 0) {
                            var value = style.replace(prop[0], "").replace(/\s+/, "");
                            prop = prop[0].replace(/\s+/g, "").replace(":", ""), value.search(/\%\(/) > -1 && value.search(/\)\%/) && (csscDeclarations.styles.push({
                                key: prop,
                                value: value
                            }), csscDeclarations.proceed = !0), cssrule.styles.push(prop, value);
                        }
                    }
                }), proceed && csscDeclarations.proceed) {
                    rule.declaredCSScript = csscDeclarations, ColectedCSScript.push(rule), cssrule.render();
                    var pseudos = [ "hover", "focus", "blur", "click", "mouseenter", "mouseleave", "change" ], haspsdo = !1;
                    foreach(pseudos, function(pseudo) {
                        selector.search(":" + pseudo) > -1 && (haspsdo = !0);
                    }), haspsdo ? foreach(pseudos, function(pseudo) {
                        if (!(selector.search(pseudo) < 0) && (selector = selector.replace(new RegExp("\\:" + pseudo, "g"), ""), 
                        pseudo in SpecialPseudos)) {
                            var aState = SpecialPseudos[pseudo].a, bState = SpecialPseudos[pseudo].b;
                            $(selector).each(function(i) {
                                var $me = this;
                                $me._orgcss = {}, foreach(csscDeclarations.styles, function(styles) {
                                    var key = styles.key;
                                    if ("script" !== key && "scripts" !== key) {
                                        var cval = $(this).css(key);
                                        $me._orgcss[key] = cval ? cval : null;
                                    }
                                }), this._evcol && $(this).unlisten("css" + aState).unlisten("css" + bState), $(this).listen("css" + aState, aState, function() {
                                    applyDeclaration.call(this, i, csscDeclarations);
                                }).listen("css" + bState, bState, function() {
                                    this._orgcss && foreach(this._orgcss, function(key, value) {});
                                });
                            });
                        }
                    }) : $(selector).each(function(i) {
                        this.csselector = selector, applyDeclaration.call(this, i, csscDeclarations);
                    });
                }
            }
        }
        return cssrule;
    }, ColectedCSScript = [], SpecialPseudos = {
        hover: {
            a: "mouseenter",
            b: "mouseleave"
        }
    }, applyDeclaration = function(i, cssDecl, selector) {
        var $this = this, $props = {}, hasprop;
        if (foreach(cssDecl.styles, function(style) {
            var key = style.key, value = style.value, inlineScript = "script" === key || "scripts" === key ? !0 : !1;
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
        }), this.defcssc || (this.defcssc = $props), hasprop) {
            var cssString = createCSS(this.csselector + ":nth-child(" + i + ")", $props);
            this._oldcss && CSScriptCSS.search(this._oldcss) > -1 ? CSScriptCSS = CSScriptCSS.replace(this._oldcss, cssString) : CSScriptCSS += createCSS(this.csselector + ":nth-child(" + (i + 1) + ")", $props), 
            $("#csscript-holder").html(CSScriptCSS), this._oldcss = cssString;
        }
        return $props;
    }, createCSS = function(selector, props) {
        if (isString(selector) && isObject(props)) {
            var str = "\n" + selector + " { \n";
            foreach(props, function(key, value) {
                str += "	" + key + ": " + value + ";";
            }), str += "\n}";
        }
        return str;
    }, CSScriptLists = function() {
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
    CSSStyleSheet.prototype = {
        extract: function() {}
    };
    var CSSRuleList = function() {
        return this.length = 0, this;
    };
    CSSRuleList.prototype = {
        push: function(obj) {
            return this[this.length] = obj, this.length = this.length + 1, this;
        },
        indexOf: function(selector) {
            var found;
            return foreach(this, function(rule) {
                rule.selector === selector && (found = rule);
            }), found;
        }
    };
    var CSSStyleRule = function(csstring, selector) {
        return this.cssText = csstring, this.selector = selector, this.styles = new CSSStyleList(), 
        this;
    };
    CSSStyleRule.prototype = {
        render: function() {
            console.log(this);
        },
        extract: function() {}
    };
    var CSSStyleList = function() {
        return this;
    };
    CSSStyleList.prototype = {
        push: function(key, value) {
            return this[key] = value, this;
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
    var CSScriptCSS = "";
    window.CSScriptExtractAll = !1;
    var RgxBlock = /[a-zA-Z\d\@\%\#\*\[\]\=\"\'\d\s+\.\,\:\-\_\(\)]+\{\s+[a-zA-Z\!\/\d\:\s?;\-\%\#\'\"\.\,\(\)\*\+\{\<\>\=\@\?\$\_\[\]\|\&\\]+\}/g, windowresize = setTimeout(function() {}, 200);
    window.addEventListener("resize", function() {
        clearTimeout(windowresize), windowresize = setTimeout(function() {
            foreach(ColectedCSScript, function(rule) {
                $(rule.selector).each(function(i) {
                    applyDeclaration.call(this, i, rule.declaredCSScript);
                });
            });
        }, 200);
    });
}(DOMList);