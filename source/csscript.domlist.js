(function($) {
    'use strict';

    /* Parse all Stylesheets when document ready */
    $.ready(function() {
        setTimeout(initParser, 0);
    });

    /* Parser Initializer */
    var initParser = function() {
        /* Creating Generated CSS Holder */
        $('<style type="text/css" id="csscript-holder">').appendTo('head');

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

    /* Creating Colected CSS Holder */
    var ColectedCSS = [];

    /* Creating Parser */
    $.renderCSScript = function() {
        foreach(ColectedCSS, function (CSSes) {
            var css = new CSSStyleSheet(CSSes.url, CSSes.css);
            extractBlocks(CSSes.css, CSSes.url);
        });
    }

    /* CSS Parser */
    var extractBlocks = function(cssString, url) {
        if (!isString(cssString)) return;

        /* Replacing javascript braches to prevent wrong selection */
        cssString = cssString.replace(/\(\s?\{/g, '(!$').replace(/\}\s?\)/g, '$!)');

        /* Getting CSS Blocks */
        var cssBlocks = cssString.match(RgxBlock);

        if (cssBlocks) {
            var cssStylesheet = new CSSStylesheet(url);

            foreach(cssBlocks, function (csstr) {
                /* Don't proceed if extract all is disabled and css not contains js pattern */
                if (csstr.search(/\%\(/) < 0 && !CSScriptExtractAll) return;

                /* Replacing new line at begining */
                csstr = csstr.replace(/\n+/, '');

                /* Get first character to determine does ti regular selector or special selector like @media */
                var fst = csstr.slice(0, 1);

                /* If special selector, check the selector type */
                if (fst === '@') {
                    /* Fixing Block issue when block started with @ */
                    if (csstr.search(/^\@/) > -1) csstr += '}';

                    if (csstr.search('@media') > -1) {
                        /* Don't proceed until to do complete */
                        return;
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

                /* If regular selector, proceed it directly */
                else {
                    /* Create nwe CSS Rule Object */
                    var cssrule = new CSSStyleRule(csstr);

                    /* Adding Rules Holder to each cssrule */
                    cssrule.parent = cssStylesheet.rules;

                    /* Parsing Rule */
                    cssrule.extract();
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

        /* Getting Selector */
        selector = csstr.match(/[a-zA-Z\d\.\s+\,\-\:\(\)\#\*\[\]\=\"\']+\{/);

        /* Changing Selector Type */
        cssrule.type = 'CSSStyleRule';

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
                var csscDeclarations = { proceed: false, styles: [] };

                /* Parsing Declarations */
                foreach(cssdec, function (style) {
                    if (style !== '') {
                        /* Normalize White Space */
                        var style = style.replace(/\s+/g, ' ').replace(/\s+/, '');

                        /* Getting CSS Property */
                        var prop = style.match(/[\*a-zA-Z\-]+\:/);

                        if (prop && prop.length > 0) {
                            /* Removing Property from style to get value */
                            var value = style.replace(prop[0], '').replace(/\s+/, '');

                            /* Removing Space and : from property */
                            prop = prop[0].replace(/\s+/g, '').replace(':', '');

                            /* Add property to declaration list if contains patter and tell to proceed */
                            if (value.search(/\%\(/) > -1 && value.search(/\)\%/)) {
                                csscDeclarations.styles.push({ key: prop, value: value });
                                csscDeclarations.proceed = true;
                            }

                            /* Adding rule to style lists */
                            cssrule.styles.push(prop, value);
                        }
                    }
                });

                /* CSSJs Parser */
                if (proceed && csscDeclarations.proceed) {
                    rule.declaredCSScript = csscDeclarations;

                    ColectedCSScript.push(rule);

                    cssrule.render();

                    var pseudos = ['hover', 'focus', 'blur', 'click', 'mouseenter', 'mouseleave', 'change'];
                    var haspsdo = false;

                    /* Check pseudo to define event listener */
                    foreach(pseudos, function(pseudo) {
                        if (selector.search(':' + pseudo) > -1) {
                            haspsdo = true;
                        }
                    });

                    /* If has pseudo, check the event type and listen the event */
                    if (haspsdo) {
                        foreach(pseudos, function (pseudo) {
                            /* Escape if no match pseudo */
                            if (selector.search(pseudo) < 0) return;

                            /* Removing pseudo from selector */
                            selector = selector.replace(new RegExp('\\:' + pseudo, 'g'), '');

                            /* Use special pseudo handler if contains special pseudo */
                            if (pseudo in SpecialPseudos) {
                                var aState = SpecialPseudos[pseudo].a, bState = SpecialPseudos[pseudo].b

                                $(selector).each(function(i) {
                                    var $me = this;

                                    // Getting original values.
                                    $me._orgcss = {};

                                    foreach(csscDeclarations.styles, function (styles) {
                                        var key = styles.key;

                                        if (key !== 'script' && key !== 'scripts') {
                                            var cval = $(this).css(key);

                                            if (cval) {
                                                $me._orgcss[key] = cval;
                                            }

                                            else {
                                                $me._orgcss[key] = null;
                                            }
                                        }
                                    });

                                    if (this._evcol) {
                                        $(this).unlisten('css' + aState).unlisten('css' + bState);
                                    }

                                    $(this)
                                        .listen('css' + aState, aState, function() {
                                            applyDeclaration.call(this, i, csscDeclarations);
                                        })
                                        .listen('css' + bState, bState, function() {
                                            if (this._orgcss) {
                                                foreach(this._orgcss, function (key, value) {
                                                    if (value !== null) {

                                                    }
                                                });
                                            }
                                        });
                                });
                            }

                            else {
                                return;
                                $(selector).each(function(i) {
                                    /* Remove event listener if already defined */
                                    if (this._evcol) {
                                        $(this).unlisten('css' + pseudo);
                                    }

                                    /* Create new Listener */
                                    $(this).listen('css' + pseudo, pseudo, function() {
                                        applyDeclaration.call(this, i, csscDeclarations);
                                    });
                                });
                            }
                        });
                    }

                    /* Apply directly if no pseudo in selector */
                    else {
                        $(selector).each(function(i) {
                            this.csselector = selector;

                            applyDeclaration.call(this, i, csscDeclarations);
                        });
                    }

                    //if (selector.search(':hover') > -1) {
                    //    var idselect = selector.replace(/\:hover/g, '').replace(/\:focuse/g, '').replace(/\:checked/g, '');
                    //
                    //    $(idselect).each(function(i) {
                    //        if (this._evcol) {
                    //            $(this).unlisten('csschover');
                    //        }
                    //
                    //        $(this).listen('csschover', {
                    //            'mouseenter': function() {
                    //                applyDeclaration.call(this, i, csscDeclarations);
                    //            },
                    //            'mouseleave': function() {
                    //                $(this).css(this.defcssc || {});
                    //            }
                    //        });
                    //    });
                    //}
                    //
                    //else if (selector.search(':focus') > -1) {
                    //    var idselect = selector.replace(/\:hover/g, '').replace(/\:focuse/g, '').replace(/\:checked/g, '').replace(/\:click/g, '');
                    //
                    //    $(idselect).each(function(i) {
                    //        if (this._evcol) {
                    //            $(this).unlisten('csscfocus');
                    //        }
                    //
                    //        $(this).listen('csscfocus', {
                    //            'focus': function() {
                    //                applyDeclaration.call(this, i, csscDeclarations);
                    //            },
                    //            'blur': function() {
                    //                $(this).css(this.defcssc || {});
                    //            }
                    //        });
                    //    });
                    //}
                    //
                    //else if (selector.search(':click') > -1) {
                    //    var idselect = selector.replace(/\:hover/g, '').replace(/\:focuse/g, '').replace(/\:checked/g, '').replace(/\:click/g, '');
                    //
                    //    $(idselect).each(function(i) {
                    //        if (this._evcol) {
                    //            $(this).unlisten('csscclick');
                    //        }
                    //
                    //        $(this).listen('csscclick', {
                    //            'click': function() {
                    //                applyDeclaration.call(this, i, csscDeclarations);
                    //            }
                    //        });
                    //    });
                    //}
                    //
                    //else {
                    //    $(selector).each(function(i) {
                    //        this.csselector = selector;
                    //
                    //        applyDeclaration.call(this, i, csscDeclarations, selector);
                    //    });
                    //}

                    // Todo: Add oncheck support.
                }
            }
        }

        return cssrule;
    }

    /* Collected CSScript Holder*/
    var ColectedCSScript = [];

    /* Special Pseduos */
    var SpecialPseudos = {
        'hover': {
            'a': 'mouseenter',
            'b': 'mouseleave'
        }
    };

    /* Function to apply Declarations */
    var applyDeclaration = function(i, cssDecl, selector) {
        var $this = this, $props = {}, hasprop;

        foreach(cssDecl.styles, function(style) {
            var key = style.key, value = style.value;

            var inlineScript = key === 'script' || key === 'scripts' ? true : false;

            /* Processing Value */
            value = value.replace(/\$i/g, i).replace(/this/g, '$this').replace(/\@/g, 'CSScriptVariables.');

            value = value.replace(/\"\%\(/, '%(').replace(/\)\%\"/, ')%').replace(/\'\%\(/, '%(').replace(/\)\%\'/, ')%');

            value = value.replace(/\(\!\$/g, '({').replace(/\$\!\)/g, '})');

            var csscValues = value.match(/\%\([a-zA-Z\.\,\!\@\%\(\)\'\"\:\?\d\<\>\*\/\=\$\#\s\+\-\_\[\]\{\}\|\&\\]+\)\%/g);

            if (csscValues) {
                foreach(csscValues, function (csscValue) {
                    var newValue;

                    var script = csscValue.replace(/\%\(/, '').replace(/\)\%/, '');

                    if (inlineScript) {
                        try {
                            eval(script);
                        } catch (err) {}

                        delete $props[key];
                    }

                    else {
                        try {
                            eval('newValue = ' + script);
                        } catch (err) {}

                        if (newValue !== undefined) {
                            value = value.replace(csscValue, newValue);
                        } else {
                            value = value.replace(csscValue, null);
                        }
                    }
                });
            }

            /* Removing Scripts Parts */
            if (!inlineScript) {
                hasprop = true;

                try {
                    eval('value = ' + value);
                } catch (err) {}

                if (value !== undefined) {
                    $props[key] = value;
                } else {
                    $props[key] = null;
                }
            }
        });

        //$(this).css($props);

        if (!this.defcssc) {
            this.defcssc = $props;
        }

        if (hasprop) {
            /* Generating CSS Script */
            var cssString = createCSS(this.csselector + ':nth-child(' + i + ')', $props);

            /* If css ever generated, replace the old one */
            if (this._oldcss && CSScriptCSS.search(this._oldcss) > -1) {
                CSScriptCSS = CSScriptCSS.replace(this._oldcss, cssString);
            }

            /* Else, append new css */
            else {
                CSScriptCSS += createCSS(this.csselector + ':nth-child(' + (i + 1) + ')', $props);
            }

            /* Write CSS String to holder */
            $('#csscript-holder').html(CSScriptCSS);

            /* Replace current CSS String */
            this._oldcss = cssString;
        }

        return $props;
    };

    /* CSS String Maker */
    var createCSS = function(selector, props) {
        if (isString(selector) && isObject(props)) {
            var str = '\n' + selector + ' { \n';

            foreach(props, function (key, value) {
                str += '\t' + key + ': ' + value + ';';
            });

            str += '\n}';
        }

        return str;
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

    /* Creating CSSStylesheet Objects */
    var CSSStylesheet = function(url, cssText) {
        this.href = url;
        this.cssText = cssText;
        this.rules = new CSSRuleList();

        window.CSScriptLists.push(this);

        return this;
    }
    CSSStyleSheet.prototype = {
        extract: function() {

        }
    }

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
        },

        indexOf: function(selector) {
            var found;

            foreach(this, function (rule) {
                if (rule.selector === selector) {
                    found = rule;
                }
            });

            return found;
        }
    }
    /* Creating CSSStyle Object */
    var CSSStyleRule = function(csstring, selector) {
        this.cssText = csstring;
        this.selector = selector;
        this.styles = new CSSStyleList();

        return this;
    }
    CSSStyleRule.prototype = {
        render: function() {
            console.log(this);
        },
        extract: function() {

        }
    };

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

    /* CSScript Variable Holders */
    window.CSScriptVariables = {};

    /* Function to apply Style Declarations */
    var CSScriptCSS = '';

    /* Config does all css parsed or only that contains CSScript */
    window.CSScriptExtractAll = false;

    /* Reg Expression to Get CSS Block */
    var RgxBlock = /[a-zA-Z\d\@\%\#\*\[\]\=\"\'\d\s+\.\,\:\-\_\(\)]+\{\s+[a-zA-Z\!\/\d\:\s?;\-\%\#\'\"\.\,\(\)\*\+\{\<\>\=\@\?\$\_\[\]\|\&\\]+\}/g;

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
})(DOMList);
