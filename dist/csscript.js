!function($) {
    "use strict";
    window.CSScriptExtractAll = !1;
    var RgxBlock = /[a-zA-Z\d\@\%\#\*\[\]\=\"\'\d\s+\.\,\:\-\_\(\)]+\{\s+[a-zA-Z\!\/\d\:\s?;\-\%\#\'\"\.\,\(\)\*\+\{\<\>\=\@\?\$\_\[\]]+\}/g;
    $.ready(function() {
        initParser();
    });
    var ColectedCSS = [], ColectedCSScript = [], initParser = function() {
        $('link[rel="stylesheet"]').each(function() {
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
    };
    $.renderCSScript = function() {
        foreach(ColectedCSS, function(CSSes) {
            extractBlocks(CSSes.css, CSSes.url);
        });
    };
    var windowresize = setTimeout(function() {}, 200);
    window.addEventListener("resize", function() {
        clearTimeout(windowresize), windowresize = setTimeout(function() {
            foreach(ColectedCSScript, function(rule) {
                $(rule.selector).each(function(i) {
                    applyDeclaration.call(this, i, rule.declaredCSScript);
                });
            });
        }, 200);
    });
    var extractBlocks = function(cssString, url) {
        if (isString(cssString)) {
            cssString = cssString.replace(/\(\s?\{/g, "(!$").replace(/\}\s?\)/g, "$!)");
            var cssBlocks = cssString.match(RgxBlock);
            if (cssBlocks) {
                var cssStylesheet = new CSSStylesheet(url);
                foreach(cssBlocks, function(csstr) {
                    if (!(csstr.search(/\%\(/) < 0) || CSScriptExtractAll) {
                        csstr.search(/^\@/) > -1 && (csstr += "}"), csstr = csstr.replace(/\n+/, "");
                        var fst = csstr.slice(0, 1);
                        if ("@" === fst) if (csstr.search("@media") > -1) {
                            return;
                        } else {
                            if (csstr.search("@keyframes") > -1 || csstr.search("@-webkit-keyframes") > -1) return;
                            if (csstr.search("@font-face") > -1) return;
                        } else {
                            var cssrule = new CSSStyleRule(csstr);
                            parseRule(cssrule, csstr, !0), cssStylesheet.rules.push(cssrule);
                        }
                    }
                });
            }
        }
    }, parseRule = function(rule, csstr, proceed) {
        var selector, cssrule = rule, fst = csstr.slice(0, 1);
        if ("." === fst ? (selector = csstr.match(/^.[a-zA-Z\d\.\s+\,\-\:\(\)\#\*\[\]\=\"\']+\{/), 
        cssrule.type = "CSSStyle") : "#" === fst ? (selector = csstr.match(/^#[a-zA-Z\d\.\s+\,\-\:\(\)\#\*\[\]\=\"\']+\{/), 
        cssrule.type = "CSSStyle") : fst.search(/[a-zA-Z]:1/) && (selector = csstr.match(/^[a-zA-Z\d\.\s+\,\-\:\(\)\#\*\[\]\=\"\']+\{/), 
        cssrule.type = "CSSStyle"), selector) {
            var cssdec = csstr.replace(selector[0], "").replace("}", "").replace(/\n+/g, "");
            if (selector = selector[0].replace(/\s?\{/, "").replace(/\n/g, " "), cssrule.selector = selector, 
            cssdec = cssdec.replace(/\;\s+/, ";").split(";")) {
                var csscDeclarations = {
                    proceed: !1
                };
                if (foreach(cssdec, function(style) {
                    if ("" !== style) {
                        var style = style.replace(/\s+/g, " ").replace(/\s+/, ""), prop = style.match(/[\*a-zA-Z\-]+\:/);
                        if (prop && prop.length > 0) {
                            var value = style.replace(prop[0], "").replace(/\s+/, "");
                            prop = prop[0].replace(/\s+/g, "").replace(":", ""), proceed && value.search(/\%\(/) > -1 && value.search(/\)\%/) && (csscDeclarations[prop] = value, 
                            csscDeclarations.proceed = !0), cssrule.styles.push(prop, value);
                        }
                    }
                }), proceed && csscDeclarations.proceed) if (delete csscDeclarations.proceed, rule.declaredCSScript = csscDeclarations, 
                ColectedCSScript.push(rule), selector.search(":hover") > -1) {
                    var idselect = selector.replace(/\:hover/g, "").replace(/\:focuse/g, "").replace(/\:checked/g, "");
                    $(idselect).each(function(i) {
                        this._evcol && $(this).unlisten("csschover"), $(this).listen("csschover", {
                            mouseenter: function() {
                                applyDeclaration.call(this, i, csscDeclarations);
                            },
                            mouseleave: function() {
                                $(this).css(this.defcssc || {});
                            }
                        });
                    });
                } else if (selector.search(":focus") > -1) {
                    var idselect = selector.replace(/\:hover/g, "").replace(/\:focuse/g, "").replace(/\:checked/g, "").replace(/\:click/g, "");
                    $(idselect).each(function(i) {
                        this._evcol && $(this).unlisten("csscfocus"), $(this).listen("csscfocus", {
                            focus: function() {
                                applyDeclaration.call(this, i, csscDeclarations);
                            },
                            blur: function() {
                                $(this).css(this.defcssc || {});
                            }
                        });
                    });
                } else if (selector.search(":click") > -1) {
                    var idselect = selector.replace(/\:hover/g, "").replace(/\:focuse/g, "").replace(/\:checked/g, "").replace(/\:click/g, "");
                    $(idselect).each(function(i) {
                        this._evcol && $(this).unlisten("csscclick"), $(this).listen("csscclick", {
                            click: function() {
                                applyDeclaration.call(this, i, csscDeclarations);
                            }
                        });
                    });
                } else $(selector).each(function(i) {
                    applyDeclaration.call(this, i, csscDeclarations);
                });
            }
        }
        return cssrule;
    };
    window.CSScriptVariables = {};
    var applyDeclaration = function(i, cssDecl) {
        var $this = this, $props = {};
        return foreach(cssDecl, function(key, value) {
            var inlineScript = "script" === key || "scripts" === key ? !0 : !1;
            value = value.replace(/\$i/g, i).replace(/this/g, "$this").replace(/\@/g, "CSScriptVariables."), 
            value = value.replace(/\"\%\(/, "%(").replace(/\)\%\"/, ")%"), value = value.replace(/\'\%\(/, "%(").replace(/\)\%\'/, ")%"), 
            value = value.replace(/\(\!\$/g, "({").replace(/\$\!\)/g, "})");
            var csscValues = value.match(/\%\([a-zA-Z\.\,\!\@\(\)\'\"\:\?\d\<\>\*\/\=\$\#\s\+\-\_\[\]\{\}]+\)\%/g);
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
                try {
                    eval("value = " + value);
                } catch (err) {}
                $props[key] = void 0 !== value ? value : null;
            }
        }), $(this).css($props), this.defcssc || (this.defcssc = $props), $props;
    }, CSScriptLists = function() {
        return this.length = 0, this;
    };
    CSScriptLists.prototype = {
        push: function(obj) {
            return this[this.length] = obj, this.length = this.length + 1, this;
        }
    }, window.CSScriptLists = new CSScriptLists();
    var CSSRuleList = function() {
        return this.length = 0, this;
    };
    CSSRuleList.prototype = {
        push: function(obj) {
            return this[this.length] = obj, this.length = this.length + 1, this;
        }
    };
    var CSSStylesheet = function(url) {
        return this.href = url, this.rules = new CSSRuleList(), window.CSScriptLists.push(this), 
        this;
    }, CSSStyleRule = function(csstring, selector) {
        return this.cssText = csstring, this.selector = selector, this.styles = new CSSStyleList(), 
        this;
    }, CSSMediaRule = function(csstring, query) {
        return this.cssText = csstring, this.queries = query, this.rules = new CSSRuleList(), 
        this;
    }, CSSKeyframeRule = function(csstring, selector) {
        return this.cssText = csstring, this.selector = selector, this.styles = new CSSStyleList(), 
        this;
    }, CSSFontRule = function(csstring, selector) {
        return this.cssText = csstring, this.selector = selector, this.styles = new CSSStyleList(), 
        this;
    }, CSSStyleList = function() {
        return this;
    };
    CSSStyleList.prototype = {
        push: function(key, value) {
            return this[key] = value, this;
        }
    };
}(DOMList);