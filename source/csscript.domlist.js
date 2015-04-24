(function($) {
    'use strict';

    /* Parse all Stylesheets when document ready */
    document.addEventListener('readystatechange', function() {
        if (document.readyState === 'interactive') {
            setTimeout(initParser, 0);
        }
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
                    cssString = cssString.replace(/\{/g, '{\r\n');
                    cssString = cssString.replace(/\}/g, '\r\n}\r\n');
                    cssString = cssString.replace(/[\r\n]+/g, '\r\n');

                    if (!CSScriptExtractAll && cssString.search(/\%\(/) < 0) return;

                    CollectedCSS.push({ css: cssString, url: url });

                    $.renderCSScript();
                });
            }

            else {
                var html = $(this).html();

                html = html.replace(/\{/g, '{\r\n');
                html = html.replace(/\}/g, '\r\n}\r\n');
                html = html.replace(/[\r\n]+/g, '\r\n');

                if (html.search(/\%\(/) < 0) return;

                if (html.length > 10) {
                    CollectedCSS.push({ css: html, url: 'local'})

                    $.renderCSScript();
                }
            }
        });
    }

    /* Creating Colected CSS Holder */
    var CollectedCSS = [];

    /* Creating Parser */
    $.renderCSScript = function() {
        /* Cleanup Rendered Styles */
        $('#csscript-holder').html(' ');

        /* Clean CSScript Lists */
        window.CSScriptLists.clean();

        /* Clean Collected CSScript */
        CollectedCSScripts = [];

        /* Clean CSS String */
        CSScriptCSS = '';

        /* Performance Holder */
        CSScriptTime = performance.now();

        /* Parsing Collected CSS */
        foreach(CollectedCSS, function (CSSes) {
            /* Creating New Stylesheet */
            var stylesheet = new CSSStylesheet(CSSes.url, CSSes.css);

            /* Extracting CSS Rules */
            stylesheet.parseRules();
        });

        if (CSScriptAutoRender) {
            if (CSScriptAutoRender !== 'ready') {
                CSScriptAutoRender = 'ready';

                $('<style id="dommutationlistener" type="text/css">').html(muframe).appendTo('head');

                var xtm = setTimeout(function() {}, 0);

                var mutationHandler = function(e) {
                    clearTimeout(xtm);

                    xtm = setTimeout(function() {
                        $.renderCSScript();
                    }, 20);
                }

                /* DOM Insertsion Event */
                setTimeout(function() {
                    document.addEventListener('animationstart', mutationHandler, false);
                    document.addEventListener('MSAnimationStart', mutationHandler, false);
                    document.addEventListener('webkitAnimationStart', mutationHandler, false);
                }, 750);
            }
        }

        //console.log('CSScript loaded in ' + CSScriptTime + 'ms');
    }

    /* Collected CSScript Holder*/
    var CollectedCSScripts = [];

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
        },
        clean: function() {
            var $this = this;

            foreach($this, function (a, i) {
                delete $this[i];
                $this.length--;
            });

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

    CSSStylesheet.prototype = {
        /* Extract CSSRules from this CSS Text */
        parseRules: function() {
            if (!this.cssText || !this.href) return;

            var CSStext = this.cssText, URL = this.href, $stylesheet = this;

            /* Replacing javascript braches to prevent wrong selection */
            CSStext = CSStext.replace(/\(\s?\{/g, '(!$').replace(/\}\s?\)/g, '$!)');

            /* Getting CSS Blocks */
            var cssBlocks = CSStext.match(RgxBlock);

            if (cssBlocks) {
                foreach(cssBlocks, function (cssblock) {
                    /* Don't proceed if extract all is disabled and css not contains js pattern */
                    if (!CSScriptExtractAll && cssblock.search(/\%\(/) < 0) return;

                    /* Replacing new line at begining */
                    cssblock = cssblock.replace(/\n+/, '');

                    /* Get first character to determine does ti regular selector or special selector like @media */
                    var fst = cssblock.slice(0, 1);

                    /* If special selector, check the selector type */
                    if (fst === '@') {
                        /* Fixing Block issue when block started with @ */
                        if (cssblock.search(/^\@/) > -1) cssblock += '}';

                        if (cssblock.search('@media') > -1) {
                            /* Don't proceed until to do complete */
                            var media = cssblock.match(/\@[a-zA-Z\d\.\s+\,\-\:\(\)\#\*\[\]\=\"\']+\{/);

                            if (media) {
                                var mediarule = new CSSMediaRule(cssblock, media[0]);
                                mediarule.parseMedia();
                            }

                            return;
                        }
                        else if (cssblock.search('@keyframes') > -1 || cssblock.search('@-webkit-keyframes') > -1) {
                            /* Keyframes Declaration */
                            /* Don't proceed until to do complete */
                            return;
                        }
                        else if (cssblock.search('@font-face') > -1) {
                            /* Font Face Declaration */
                            /* Don't proceed until to do complete */
                            return;
                        }
                    }

                    /* If regular selector, proceed it directly */
                    else {
                        /* Create nwe CSS Rule Object */
                        var cssrule = new CSSStyleRule(cssblock);

                        /* Adding Rules Holder to each cssrule */
                        cssrule.parent = $stylesheet.rules;

                        /* Parsing Rule */
                        cssrule.parseStyles(true);

                        /* Push CSS Rule Object to CSS Stylesheet Object */
                        $stylesheet.rules.push(cssrule);
                    }

                    // Todo: Add Font Face support.
                    // Todo: Add Keyframe support.
                });
            }
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
        }
    }

    /* Creating CSSStyle Object */
    var CSSStyleRule = function(csstring, selector) {
        this.cssText = csstring;
        this.selector = selector;

        this.styles = new CSSStyleList();
        this.cstyle = new CSScriptStyle();

        CollectedCSScripts.push(this);

        return this;
    }

    CSSStyleRule.prototype = {
        /* Style Parser */
        parseStyles: function(render) {
            /* CSS Style Desclaration */
            var $rule = this, cssText = this.cssText, selector;

            /* Getting Selector */
            selector = cssText.match(/[a-zA-Z\d\.\s+\,\-\:\(\)\#\*\[\]\=\"\']+\{/);

            /* Escape if no selector */
            if (!selector) return;

            /* Changing Selector Type */
            $rule.type = 'CSSStyleRule';

            /* Replacing Selector to get declaration list */
            var cssdec = cssText.replace(selector[0], '').replace('}', '').replace(/\n+/g, '');

            /* Beautify Selector */
            selector = selector[0].replace(/\s?\{/, '').replace(/\n/g, ' ');

            /* Setting selector to cssrule selector */
            $rule.selector = selector;

            /* Getting Declarations with splitting ';' */
            cssdec = cssdec.replace(/\;\s+/, ';').split(';');

            if (cssdec) {
                var declarations = $rule.styles;

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
                                $rule.cstyle.push(prop, value);
                            } else {
                                $rule.styles.push(prop, value);
                            }
                        }
                    }
                });

                /* CSSJs Parser */
                if (render) {
                    $rule.render();

                    // Todo: Add oncheck support.
                }

                if (CSScriptExtractAll) {
                    /* Increasing Performance */
                    var now = performance.now();

                    CSScriptTime = Math.round(now - CSScriptTime);
                }
            }
        },

        /* Style Renderer */
        render: function() {
            var $rule = this, $selector = this.selector, $scripts = this.cstyle;

            var actions = ['focus', 'blur', 'click', 'mouseenter', 'mouseleave', 'change', 'hover'];

            /* If has pseudo, check the event type and listen the event */
            if ($selector.search(':') > -1) {
                foreach(actions, function (pseudo) {
                    /* Escape if no match pseudo */
                    if ($selector.search(pseudo) < 0) return;

                    /* Removing pseudo from selector */
                    $selector = $selector.replace(new RegExp('\\:' + pseudo, 'g'), '');

                    // Escape if selector is empty.
                    if (!$selector || $selector === '' || $selector === ' ') return;

                    // Validate selector.
                    var valid;

                    try {
                        valid = document.querySelectorAll($selector);
                    } catch (err) {
                        //console.error('Invalid selector: ' + $selector);
                    }

                    /* Return if selector is invalid */
                    if (!valid) return;

                    $($selector).each(function(i) {
                        /* Adding Selector to this element */
                        this['_' + pseudo + 'Style'] = $rule;

                        /* Remove event listener if already defined */
                        if (this._evcol) {
                            $(this).unlisten('css' + pseudo);
                        }

                        /* Create new Listener */
                        $(this).listen('css' + pseudo, pseudo, function() {
                            applyStyles.call(this, i, '_' + pseudo + 'Style');
                        });
                    });
                });
            }

            /* Apply directly if no pseudo in selector */
            else {
                if ($selector === '') return;

                $($selector).each(function(i) {
                    /* Adding Selector to this element */
                    this._regularStyle = $rule;

                    /* Rendering declarations */
                    applyStyles.call(this, i, '_regularStyle');
                });
            }

            return this;
        }
    };

    /* Function to apply styles */
    var applyStyles = function(i, groupd, inline) {
        var $this = this, $props = {}, hasprop, cstyles = this[groupd].cstyle, selector = this[groupd].selector;

        foreach(cstyles, function(style) {
            var key = style.property, value = style.value;

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
                        try { eval(script); } catch (err) {}

                        delete $props[key];
                    }

                    else {
                        try { eval('newValue = ' + script); } catch (err) {}

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

        if (hasprop) {
            if (inline) {
                $(this).css($props);
            }

            else {
                /* Setting up CSS ID */
                $(this).attr('cssid', this.getAttribute('cssid') || (CSSID + 1, CSSID++));

                /* Generating CSS Script */
                var cssString = createCSS(selector + '[cssid="' + (this.getAttribute('cssid') || (CSSID + 1, CSSID++)) + '"]', $props);

                /* If css ever generated, replace the old one */
                if (this._oldcss && CSScriptCSS.search(this._oldcss) > -1) {
                    CSScriptCSS = CSScriptCSS.replace(this._oldcss, cssString);
                }

                /* Else, append new css */
                else {
                    CSScriptCSS += cssString;
                }

                /* Write CSS String to holder */
                $('#csscript-holder').html(CSScriptCSS);

                /* Replace current CSS String */
                this._oldcss = cssString;

                /* Increasing Performance */
                var now = performance.now();

                CSScriptTime = Math.round(now - CSScriptTime);
            }
        }

        return $props;
    };

    /* Private Variables */
    var PrivateVariables = function() { return this };

    PrivateVariables.prototype = {
        push: function(key, value) {
            this[key] = value;
        }
    }

    /* CSS String Maker */
    var createCSS = function(selector, props) {
        if (isString(selector) && isObject(props)) {
            var str = '\n' + selector + ' { \n';

            foreach(props, function (key, value) {
                str += '\t' + key + ': ' + (isNumber(value) ? value + 'px' : value) + ';\n';
            });

            str = str.replace(/\n$/, '');
            str += '\n}';
        }

        return str;
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

    /* Creating CSSRule Object */
    var CSScriptStyle = function() {
        this.render = false;
        this.length = 0;

        return this;
    }
    CSScriptStyle.prototype = {
        push: function(key, value) {
            this[this.length] = { property: key, value: value };
            this.length++;

            return this;
        }
    }

    /* Creating CSSMediaQueryRule Object */
    var CSSMediaRule = function(csstring, query) {
        this.cssText = csstring;
        this.queries = query;
        this.rules = new CSSRuleList();

        return this;
    }

    CSSMediaRule.prototype = {
        parseMedia: function() {
            var qrwrap = $('<style id="mqr-parser" type="text/css">').appendTo('head');
            var qrhold = $('<div mqr-holder>').appendTo('body');

            var qrhDefStyle = '[mqr-holder] {\n\tposition: fixed; top: 0; left: 0; height: 0; z-index: -1; width: 0;\n}';
            var qrhMedStyle = '[mqr-holder] { width: 123px; }';
            var qrhQuery = qrhDefStyle + '\n\n' + this.queries + '\n\t' + qrhMedStyle + '\n}';

            qrwrap.html(qrhQuery);

            if (qrhold.width() === 123) {
                var csstyle = new CSSStylesheet('local-media', this.cssText.replace(this.queries, ''));
                csstyle.parseRules();
            }

            qrwrap.remove();
            qrhold.remove();

            return this;
        }
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

    /* Animation to replace DOM Mutaion event */
    var muframe  = '@-webkit-keyframes dommutationlistener { 0% { opacity: 1; } 100% { opacity: 1; } }\n';
    muframe     += '@keyframes dommutationlistener { 0% { opacity: 1; } 100% { opacity: 1; } }\n';
    muframe     += 'body *:not([mqr-holder]) { -webkit-animation: dommutationlistener 0s linear; animation: dommutationlistener 0s linear; }';

    /* CSScript Variable Holders */
    window.CSScriptVariables = {};

    /* Function to apply Style Declarations */
    var CSScriptCSS = '';

    /* CSS ID */
    var CSSID = 0;

    /* Performance Holder */
    var CSScriptTime = new Date().getTime();

    /* Config does all css parsed or only that contains CSScript */
    if (!window.CSScriptExtractAll) {
        window.CSScriptExtractAll = false;
    }

    if (!window.CSScriptAutoRender) {
        window.CSScriptAutoRender = false;
    }

    /* Reg Expression to Get CSS Block */
    var RgxBlock = /[a-zA-Z\d\@\%\#\*\[\]\=\"\'\d\s+\.\,\:\-\_\(\)]+\{\s+[a-zA-Z\!\/\d\:\s?;\-\%\#\'\"\.\,\(\)\*\+\{\<\>\=\@\?\$\_\[\]\|\&\\]+\}/g;
    var RgmBlock = /[a-zA-Z\d\%\#\*\[\]\=\"\'\d\s+\.\,\:\-\_\(\)]+\{\s+[a-zA-Z\!\/\d\:\s?;\-\%\#\'\"\.\,\(\)\*\+\{\<\>\=\@\?\$\_\[\]\|\&\\]+\}/g;

    /* Re-render styles when window resized */
    var windowresize = setTimeout(function() {}, 200);
    window.addEventListener('resize', function() {
        clearTimeout(windowresize);

        windowresize = setTimeout(function() {
            foreach(CollectedCSScripts, function (rule) {
                rule.render();
            });
        }, 200);
    });
})(DOMList);
