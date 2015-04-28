CSS Script
====

Inline `css` script runner. Use `javascript` to define `css` value or eval script directly via css.
**CSS Script** is [DOMList](https://github.com/mahdaen/domlist) and **jQuery** extension.
To makes **CSS Script** working, you should load it after loading DOMList.
If you want to use **jQUery**, then you must load [jQPatch](https://github.com/mahdaen/jqpatch) before load this. 

### **Syntax**
***

`cssproperty: '%(SCRIPT)%';`

Scripts should be inside `%()%` pattern. Currently we have param `$i` as index number of selected element.

### **CONFIGS**
***

By default, CSScript convert the CSSRule string to CSSRule object if contains CSScript pattern.
If you want to convert all rules no matter they have CSScript pattern or not, please write config before loading the CSScript.

**WARNING!** Converting all rules will takes load time on a big css.

We also added `AutoRender` support for DOM insertion event. So, when some dom element inserted into document,
CSSCript will re-render. We use animation to define insertion event since dom mutation event already deprecated.
By default we turn this feature `off` for performance support. You can enable it by adding configs before loading CSScript.

- `window.CSScriptExtractAll` - Extract all rules.
- `window.CSScriptAutoRender` - Re-render styles when DOM element inserted into document.

###### Config sample
```html
	<script type="text/javascript">
		// Extract all rules.
		window.CSScriptExtractAll = true;
		
		// Enable auto-render on DOM insertion.
		window.CSScriptAutoRender = true;
	</script>
	<script type="text/javascript" src="csscript/dist/csscript.min.j"></script>
```

If you want to access the converted rules, you can read `window.CSScriptLists` object in browser console.

#### **Download**
***

You can get **CSScript** by choosing download above or using:
```
npm install csscript
```
or
```
bower install csscript
```

#### **TODO**:
***

* Add Font Face Support
* Add Keyframes Support
* Add more events support.

#### **Supported Events**
***

- `click`
- `hover`
- `mouseenter`
- `mouseleave`
- `focus`
- `blur`
- `change`

#### **Inline Params**
***

- `$i` as index number of current element.
- `@` as `var` to define variable. e.g: `@winHeight = window.innerHeight` is equal to `var winHeight = window.innerHeight`

### **Examples**
***

```html
<html>
	<head>
		<link rel="stylesheet" href="main.css" />
		<script type="text/javascript" src="domlist/dist/domlist.min.js"></script>
		<script type="text/javascript" src="csscript/dist/csscript.min.js"></script>
	</head>
	<body>
		<div class="container">
			<div class="container-offset">
				<div class="container-content">
					<div class="only-mobile"></div>
				</div>
			</div>
		</div>
		<div class="fit-list">
			<div class="fill"></div>
			<div class="fill"></div>
			<div class="fill"></div>
		</div>
	</body>
</html>
```

##### **main.css**
```css
.container {
	width: '%(window.innerWidth > 960 ? 960 : window.innerWidth)%';
	margin: 0 auto;
}
.container-offset {
	height: 300px;
}
.container-content {
	height: '%($(".container").height() / 2)%';
}
.mobile-only {
	display: '%(window.innerWidth <= 320 ? "block" : "none")%';
}

// Using index number of li and log the index.
ul .increased-height {
	height: '%(($i * 10) - 5)%';
	scripts: '%(console.log($i))%';
}

// Run javascripts.
.container-content:click {
    scripts: '%($(".container").toggleClass("content-hovered"))%';
}

// Create element that has dynamic height depend on childrens length on parent element.
.fit-list {
	display: block;
	width: 100%;
	height: '%( window.innerHeight )%';
}
.fit-list .fill {
	// Get the parent element childrens length.
	script: '%( @flChilds = $(this).parent().children().length )%';
	
	// Get the height by counting total height with total childrens.
	script: '%( @clHeight = (window.innerHeight / @flChilds) )%';
	
	display: block;
	width: 100%;
	height: '%( @clHeight )%'; // Using @clHeight
}

// Use with media query.
@media only screen and (max-width: 1024) {
    .fit-list {
        script: '%( $(this).appendTo(".container-content") )%';
    }
}
```

### **Manual Render**
***

Use `$.renderCSScript()` to re-render the styles.
Usually, it's usefull when you want to use `CSScript` after loading ajax or drawing new element.

##### `Example`
```js
$.ajax('http://localhost').complete(function(data) {
    $('.content').append(data);
    
    // Re-render styles after ajax complete and inserting content complete.
    $.renderCSScript();
});
```

### **NOTES**
***

This project is under development. Use it if you want to give a try.
If you want to contribute to this project, I say thanks. :)
https://github.com/mahdaen/csscript


## Release History
* 2015-04-25        v0.3.4      "Fixing issues when using pseudos."
* 2015-04-25        v0.3.4      "Fixing underscore '__' selector."
* 2015-04-25        v0.3.3      "Fixing unminify."
* 2015-04-25        v0.3.2      "Fixing performance on chrome."
* 2015-04-25        v0.3.1      "Adding performance to fix error in safari."
* 2015-04-24        v0.3.0      "Adding support to render minified css."
* 2015-02-24        v0.2.0      "Adding auto render on dom insertion event."
* 2015-02-22        v0.1.0      "Adding Media Query support and Manual Render (for ajax or draw purpose)"
* 2015-02-06        v0.0.1      "First release"
