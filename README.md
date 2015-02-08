CSS Script
====

Inline `css` script runner. Use `javascript` to define `css` value or eval script directly via css.
**CSS Script** is [DOMList](https://github.com/mahdaen/domlist) extension.
To makes **CSS Script** working, you should load it after loading DOMList.

### **Syntax**
>`cssproperty: '%(SCRIPT)%';`

Scripts should be inside `%()%` pattern. Currently we have param `$i` as index number of selected element.

### **CONFIGS**
By default, CSScript convert the CSSRule string to CSSRule object if contains CSScript pattern.
If you want to convert all rules no matter they have CSScript pattern or not, please write config before loading the CSScript.

###### Config sample
```html
	<script type="text/javascript">
		window.CSScriptExtractAll = true;
	</script>
	<script type="text/javascript" src="csscript/dist/csscript.min.j"></script>
```

If you want to access the converted rules, you can read `window.CSScriptLists` object in browser console.

#### **Download**
You can get `**CSScript**` by choosing download above or using:
```
npm install csscript
```
or
```
bower install csscript
```

#### **TODO**:
* Add Media Query Support
* Add Font Face Support
* Add Keyframes Support
* Add events support. Currently only support with `:click`, `:hover` and `:focus` event and automatically re-render when window resized.
* Add ajax loaded support.

### **Examples**

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
```

### **NOTES**
This project is under development. Use it if you want to give a try.
If you want to contribute to this project, I say thanks. :)
https://github.com/mahdaen/csscript