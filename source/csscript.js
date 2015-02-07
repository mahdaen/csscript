(function($) {
    'use strict';

    /* Config does all css parsed or only that contains CSScript */
    window.CSScriptExtractAll = false;

    /* Reg Expression to Get CSS Block */
    var RgxBlock = /[a-zA-Z\d\@\%\#\*\[\]\=\"\'\d\s+\.\,\:\-\_\(\)]+\{\s+[a-zA-Z\!\/\d\:\s?;\-\%\#\'\"\.\,\(\)\*\+\{\<\>\?\$\_\[\]]+\}?\}/g;

    /* Parse all Stylesheets when document ready */
    $.ready(function() {
        initParser();
    });

    /* Creating Colected CSS Holder */
    var ColectedCSS = [];
    var ColectedCSScript = [];

    /* Parser Initializer */
    var initParser = function() {
        /* Get CSS Link elements and iterate them */
        $('link[rel="stylesheet"]').each(function() {
            var url = $(this).attr('href');

            if (isString(url)) {
                $.get(url).success(function(cssString) {
                    if (cssString.search(/\%\(/) < 0 && !CSScriptExtractAll) return;

                    ColectedCSS.push({ css: cssString, url: url });

                    $.renderCSScript();
                });
            }

            else {
                var html = $(this).html();

                if (html.search(/\%\(/) < 0) return;

                if (html.length > 10) {
                    ColectedCSS.push({ css: html, url: 'local'})

                    $.renderCSScript();
                }
            }
        });
    }

    /* Creating Parser */
    $.renderCSScript = function(cssString, url) {
        foreach(ColectedCSS, function (CSSes) {
            extractBlocks(CSSes.css, CSSes.url);
        });
    }

    /* Re-render styles when window resized */
    var windowresize = setTimeout(function() {}, 200);
    window.addEventListener('resize', function() {
        clearTimeout(windowresize);

        windowresize = setTimeout(function() {
            foreach(ColectedCSScript, function (rule) {
                $(rule.selector).each(function(i) {
                    applyDeclaration.call(this, i, rule.declaredCSScript);
                });
            });
        }, 200);
    });

    /* CSS Parser */
    var extractBlocks = function(cssString, url) {
        if (!isString(cssString)) return;

        /* Getting CSS Blocks */
        var cssBlocks = cssString.match(RgxBlock);

        if (cssBlocks) {
            var cssStylesheet = new CSSStylesheet(url);

            foreach(cssBlocks, function (csstr) {
                /* Don't proceed if */
                if (csstr.search(/\%\(/) < 0 && !CSScriptExtractAll) return;

                if (csstr.search('@') > -1) csstr += '}';
                csstr = csstr.replace(/\n+/, '');

                var fst = csstr.slice(0, 1);

                if (fst === '@') {
                    if (csstr.search('@media') > -1) {
                        /* Don't proceed until to do complete */
                        return;

                        /* Media Query Declaration */
                        var qselect = csstr.match(/^.[a-zA-Z\d\.\s+\,\-\:\(\)\#\*\[\]\=\"\']+\{/);
                        var cselect = csstr.match(/[a-zA-Z\d\#\*\[\]\=\"\'\d\s+\.\,\:\-\_\(\)]+\{\s+[a-zA-Z\!\/\d\:\s?;\-\%\#\'\"\.\,\(\)\*]+\}/g);

                        if (qselect && cselect) {
                            qselect = qselect[0].replace(/\s?\{/, '');

                            var media = new CSSMediaRule(csstr, qselect);

                            foreach(cselect, function (ruleStr) {
                                ruleStr = ruleStr.replace(/\n+/, '').replace(/\s+/g, ' ').replace(/\s+/, '');

                                var crule = new CSSStyleRule(ruleStr);

                                parseRule(crule, ruleStr, false);

                                media.rules.push(crule);
                            });

                            cssStylesheet.rules.push(media);
                        }
                    }
                    else if (csstr.search('@keyframes') > -1 || csstr.search('@-webkit-keyframes') > -1) {
                        /* Keyframes Declaration */
                        /* Don't proceed until to do complete */
                        return;
                    }
                    else if (csstr.search('@font-face') > -1) {
                        /* Font Face Declaration */
                        /* Don't proceed until to do complete */
                        return;
                    }
                }

                else {
                    /* Create nwe CSS Rule Object */
                    var cssrule = new CSSStyleRule(csstr);

                    /* Parsing Rule */
                    parseRule(cssrule, csstr, true);

                    /* Push CSS Rule Object to CSS Stylesheet Object */
                    cssStylesheet.rules.push(cssrule);
                }

                // Todo: Add Media Query support.
                // Todo: Add Font Face support.
                // Todo: Add Keyframe support.
            });
        }
    }

    /* CSS Rule Parser */
    var parseRule = function(rule, csstr, proceed) {
        /* CSS Style Desclaration */
        var cssrule = rule, selector;

        var fst = csstr.slice(0, 1);

        if (fst === '.') {
            selector = csstr.match(/^.[a-zA-Z\d\.\s+\,\-\:\(\)\#\*\[\]\=\"\']+\{/);

            cssrule.type = 'CSSStyle';
        }

        else if (fst === '#') {
            selector = csstr.match(/^#[a-zA-Z\d\.\s+\,\-\:\(\)\#\*\[\]\=\"\']+\{/);

            cssrule.type = 'CSSStyle';
        }

        else if (fst.search(/[a-zA-Z]:1/)) {
            selector = csstr.match(/^[a-zA-Z\d\.\s+\,\-\:\(\)\#\*\[\]\=\"\']+\{/);

            cssrule.type = 'CSSStyle';
        }

        if (selector) {
            /* Replacing Selector to get declaration list */
            var cssdec = csstr.replace(selector[0], '').replace('}', '').replace(/\n+/g, '');

            /* Beautify Selector */
            selector = selector[0].replace(/\s?\{/, '').replace(/\n/g, ' ');

            /* Setting selector to cssrule selector */
            cssrule.selector = selector;

            /* Getting Declarations with splitting ';' */
            cssdec = cssdec.replace(/\;\s+/, ';').split(';');

            if (cssdec) {
                var csscDeclarations = { proceed: false };

                foreach(cssdec, function (style) {
                    if (style !== '') {
                        var style = style.replace(/\s+/g, ' ').replace(/\s+/, '');

                        var prop = style.match(/[\*a-zA-Z\-]+\:/);

                        if (prop && prop.length > 0) {
                            var value = style.replace(prop[0], '').replace(/\s+/, '');

                            prop = prop[0].replace(/\s+/g, '').replace(':', '');

                            if (proceed) {
                                if (value.search(/\%\(/) > -1 && value.search(/\)\%/)) {
                                    csscDeclarations[prop] = value;
                                    csscDeclarations.proceed = true;
                                }
                            }

                            cssrule.styles.push(prop, value);
                        }
                    }
                });

                /* CSSJs Parser */
                if (proceed && csscDeclarations.proceed) {
                    delete csscDeclarations.proceed;

                    rule.declaredCSScript = csscDeclarations;

                    ColectedCSScript.push(rule);

                    if (selector.search(':hover') > -1) {
                        var idselect = selector.replace(/\:hover/g, '').replace(/\:focuse/g, '').replace(/\:checked/g, '');

                        $(idselect).each(function(i) {
                            if (this._evcol) {
                                $(this).unlisten('csschover');
                            }

                            $(this).listen('csschover', {
                                'mouseenter': function() {
                                    applyDeclaration.call(this, i, csscDeclarations);
                                },
                                'mouseleave': function() {
                                    $(this).css(this.defcssc || {});
                                }
                            });
                        });
                    }

                    else if (selector.search(':focus') > -1) {
                        var idselect = selector.replace(/\:hover/g, '').replace(/\:focuse/g, '').replace(/\:checked/g, '').replace(/\:click/g, '');

                        $(idselect).each(function(i) {
                            if (this._evcol) {
                                $(this).unlisten('csscfocus');
                            }

                            $(this).listen('csscfocus', {
                                'focus': function() {
                                    applyDeclaration.call(this, i, csscDeclarations);
                                },
                                'blur': function() {
                                    $(this).css(this.defcssc || {});
                                }
                            });
                        });
                    }

                    else if (selector.search(':click') > -1) {
                        var idselect = selector.replace(/\:hover/g, '').replace(/\:focuse/g, '').replace(/\:checked/g, '').replace(/\:click/g, '');

                        $(idselect).each(function(i) {
                            if (this._evcol) {
                                $(this).unlisten('csscclick');
                            }

                            $(this).listen('csscclick', {
                                'click': function() {
                                    applyDeclaration.call(this, i, csscDeclarations);
                                }
                            });
                        });
                    }

                    else {
                        $(selector).each(function(i) {
                            applyDeclaration.call(this, i, csscDeclarations);
                        });
                    }

                    // Todo: Add oncheck support.
                }
            }
        }

        return cssrule;
    }

    /* Function to apply Style Declarations */
    var applyDeclaration = function(i, cssDecl) {
        var $this = this, $props = {};

        foreach(cssDecl, function (key, value) {
            /* Converting key if key == scripts || script */
            key = key === 'script' || key === 'scripts' ? 'content' : key;

            /* Processing Value */
            value = value.replace(/\$i/g, i).replace('this', '$this');

            value = value.replace(/\"\%\(/, '%(').replace(/\)\%\"/, ')%');
            value = value.replace(/\'\%\(/, '%(').replace(/\)\%\'/, ')%');

            var csscValues = value.match(/\%\([a-zA-Z\.\,\!\(\)\'\"\:\?\d\<\>\*\/\=\$\s\+\-\_\[\]]+\)\%/g);

            if (csscValues) {
                foreach(csscValues, function (csscValue) {
                    var newValue;

                    var script = csscValue.replace(/\%\(/, '').replace(/\)\%/, '');

                    try {
                        eval('newValue = ' + script);
                    } catch (err) {}

                    if (newValue !== undefined) {
                        value = value.replace(csscValue, newValue);
                    } else {
                        value = value.replace(csscValue, null);
                    }
                });
            }

            try {
                eval('value = ' + value);
            } catch (err) {}

            if (value !== undefined) {
                $props[key] = value;
            } else {
                $props[key] = null;
            }
        });

        $(this).css($props);

        if (!this.defcssc) {
            this.defcssc = $props;
        }

        return $props;
    };

    /* Creating CSSList Objects */
    var CSScriptLists = function() {
        this.length = 0;

        return this;
    }
    CSScriptLists.prototype = {
        push: function(obj) {
            this[this.length] = obj;
            this.length = (this.length + 1);

            return this;
        }
    }
    window.CSScriptLists = new CSScriptLists();

    /* Creating CSSList Objects */
    var CSSRuleList = function() {
        this.length = 0;

        return this;
    }
    CSSRuleList.prototype = {
        push: function(obj) {
            this[this.length] = obj;
            this.length = (this.length + 1);

            return this;
        }
    }

    /* Creating CSSStylesheet Objects */
    var CSSStylesheet = function(url) {
        this.href = url;
        this.rules = new CSSRuleList();

        window.CSScriptLists.push(this);

        return this;
    }

    /* Creating CSSStyle Object */
    var CSSStyleRule = function(csstring, selector) {
        this.cssText = csstring;
        this.selector = selector;
        this.styles = new CSSStyleList();

        return this;
    }
    /* Creating CSSMediaQueryRule Object */
    var CSSMediaRule = function(csstring, query, selector) {
        this.cssText = csstring;
        this.queries = query;
        this.rules = new CSSRuleList();

        return this;
    }
    /* Creating CSSKeyframeRule Object */
    var CSSKeyframeRule = function(csstring, selector) {
        this.cssText = csstring;
        this.selector = selector;
        this.styles = new CSSStyleList();

        return this;
    }
    /* Creating CSSFontRule Object */
    var CSSFontRule = function(csstring, selector) {
        this.cssText = csstring;
        this.selector = selector;
        this.styles = new CSSStyleList();

        return this;
    }

    /* Creating CSSRule Object */
    var CSSStyleList = function() {
        return this;
    }
    CSSStyleList.prototype = {
        push: function(key, value) {
            this[key] = value;

            return this;
        }
    }
})(DOMList);
