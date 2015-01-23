/*!
 * Notepad5 v1.01
 * By Uddhab Haldar (https://twitter.com/uddhabh)
 * See the LICENSE file (MIT).
 */

(function() {
  "use strict";

  // core variables
  var customStyle = $("custom-style"),
    textarea = $("textarea"),
    statusBar = $("status-bar"),
    fileInput = $("file-input"),
    appname = "Notepad5",
    isModified,
    filename;

  function $(id) { // shortcut for document.getElementById
    return document.getElementById(id);
  }

  function skipSave() { // check whether to save or not
    if (!isModified || !textarea.value || confirm("You have unsaved changes that will be lost.")) {
      isModified = false;
      return true;
    }
  }

  function changeFilename(newFilename) {
    filename = newFilename || "untitled.txt";
    document.title = filename + " - " + appname;
  }

  function updateStatusBar() { // format: words characters(no spaces/with spaces)
    var text = textarea.value;
    statusBar.value = "Words: " + (text.replace(/['";:,.?¿\-!¡]+/g, "").split(/\w+/).length - 1) +
      "  Characters: " + text.replace(/\s/g, "").length + " / " + text.length;
  }

  function newDoc(text, newFilename) {
    if (skipSave()) {
      textarea.value = text || "";
      changeFilename(newFilename); // default "untitled.txt"
      updateStatusBar();
    }
  }

  function openDoc(event) {
    var files = event.target.files || event.dataTransfer.files,
      file = files[0],
      reader = new FileReader();
    if (file) {
      event.preventDefault();
      reader.addEventListener("load", function(event) {
        newDoc(event.target.result, file.name);
      });
      reader.readAsText(file);
    }
  }

  function saveDoc() {
    var newFilename = prompt("Name this document:", filename);
    if (newFilename !== null) {
      if (newFilename === "") {
        changeFilename(); // "untitled.txt"
      } else {
        changeFilename(/\.txt$/i.test(newFilename) ? newFilename : newFilename + ".txt");
      }
      var blob = new Blob([textarea.value.replace(/\n/g, "\r\n")], {
        type: "text/plain;charset=utf-8"
      }); // line ending CRLF
      saveAs(blob, filename);
      isModified = false;
    }
  }

  function showHideStatusBar(on) {
    statusBar.hidden = !on; // making use of hidden attribute
    textarea.className = on ? "statusBarOn" : "";
  }

  function toggleFullScreen() { // https://developer.mozilla.org/en-US/docs/Web/Guide/API/DOM/Using_full_screen_mode
    if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
      var elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  }

  function addCSS(rules) {
    rules = rules || prompt("Add custom CSS here:", customStyle.innerHTML);
    if (rules !== null) {
      customStyle.innerHTML = rules;
    }
  }

  function storeData() {
    var appdata = {
      filename: filename,
      text: textarea.value,
      isModified: isModified,
      statusBarOn: !statusBar.hidden,
      customCSS: customStyle.innerHTML
    };
    localStorage.setItem("appdata", JSON.stringify(appdata));
  }

  function init() {
    document.body.style.display = "block";
    if (!window.File) { // likely unsupported browser
      document.body.innerHTML = "<p>Sorry your browser isn't supported :(<br>Please upgrade to a <a href='http://browsehappy.com/'>modern browser</a>.</p>";
      return; // dont proceed
    }
    if (navigator.userAgent.match(/Mobi/)) { // likely mobile
      document.body.innerHTML = "Sorry this app dont work on mobile phones :(";
      return;
    }
    var appdata = JSON.parse(localStorage.getItem("appdata"));
    if (appdata) {
      if (appdata.isModified) {
        newDoc(appdata.text, appdata.filename);
        isModified = true;
      } else {
        newDoc(); // blank note
      }
      if (appdata.customCSS) {
        addCSS(appdata.customCSS);
      }
    } else { // first run
      var welcomeText =
        ["Welcome to " + appname + ", the online-offline notepad. All of your text is stored offline on your computer. Nothing is stored on servers.\n",
          "Here are some useful keyboard shortcuts for using " + appname + ":",
          "Ctrl + R : Create New Document",
          "Ctrl + O : Open Document",
          "Ctrl + S : Save Document",
          "Ctrl + B : Toggle Status Bar",
          "Ctrl + E : Add Custom CSS",
          "Tab      : Insert Tab",
          "Ctrl + Enter : Toggle Full Screen",
          "\nHappy Writing!",
          "- Uddhab Haldar (twitter.com/uddhabh)"
        ].join("\n");
      newDoc(welcomeText, "Welcome!");
    }
    showHideStatusBar(!appdata || appdata.statusBarOn); // show by default
  }

  fileInput.addEventListener("change", openDoc);

  textarea.addEventListener("blur", function() { // keep textarea focused
    setTimeout(function() {
      textarea.focus();
    }, 0);
  });
  textarea.addEventListener("input", function() {
    isModified = true;
    updateStatusBar();
  });
  textarea.addEventListener("keydown", function(event) {
    if (event.keyCode == 9) { // Tab: insert tab
      event.preventDefault();
      var text = textarea.value,
        sStart = textarea.selectionStart;
      textarea.value = text.substring(0, sStart) + "\t" + text.substring(textarea.selectionEnd);
      textarea.selectionEnd = sStart + 1;
    }
  });

  document.addEventListener("keydown", function(event) {
    var keys = {
      13: toggleFullScreen, // Enter: toggle fullscreen
      66: function() { // B: toggle statusBar
        showHideStatusBar(statusBar.hidden);
      },
      69: addCSS, // E: add custom CSS
      79: function() { // O: open
        if (skipSave()) fileInput.click();
      },
      82: newDoc, // R: new
      83: saveDoc // S: save
    };
    if (event.ctrlKey && keys[event.keyCode]) { // Ctrl + keys{}
      event.preventDefault();
      keys[event.keyCode]();
    }
  });
  document.addEventListener("drop", openDoc);

  window.addEventListener("unload", storeData); // store data locally
  window.addEventListener("load", init); // initialize

}());
