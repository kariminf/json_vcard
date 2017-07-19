/*
This file is part of jsonVCard project;
a Javascript script which allows you to create simple VCard

Copyright (C) 2017 Abdelkrime Aries <kariminfo0@gmail.com>

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
(function(){

  //Mutual exclusion marker:
  //Can't write the content till all the files are processed
  var mutex = 0;
  var shared_result = "";

  var files = [];

  document.addEventListener('DOMContentLoaded', function () {
    init();
  });

  /**
  * Initialization of process; this method searches for vcard.json
  * then when retrieved, it sends its content as a string to process(json)
  */
  function init(){
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", "./vcard.json", true);

    rawFile.onreadystatechange = function() {
      if (rawFile.readyState === 4 && rawFile.status == "200") {
        process(rawFile.responseText);
      }
    }
    rawFile.send(null);
  }

  /**
  * This method parses the json content
  * @param  {string} json The content of JSON file which describs
  *
  */
  function process(json){
    var data = JSON.parse(json);

    document.title = data.name + " " + data.family;

    var template = processTheme(data.theme);

    var rawFile = new XMLHttpRequest();
    rawFile.responseType = 'text';
    rawFile.open("GET", template, true);
    rawFile.onreadystatechange = function() {
      if (rawFile.readyState === 4 && rawFile.status == "200") {
        process2(data, rawFile.responseText);
      }
    }
    rawFile.send(null);

  }

  /**
   * Process a theme element (json) which has a name and a style
   * @param  {object} theme object of two strings: name of the theme and style
   * @return {string}       path to the template
   */
  function processTheme(theme){

    //set defaults
    var themePath = "./themes/default/";
    var style = "default.css";

    //Verify if the values are defined by user
    if (typeof theme.name !== 'undefined'){
      themePath = "./themes/" + theme.name + "/";
      if (typeof theme.style !== 'undefined') style = theme.style + ".css";
    }

    //call a function to add the stylesheet
    addStyleSheet(themePath + style);
    //return the path to the template featuring this theme
    return themePath + "template.htm";
  }

  function process2(data, template){
    shared_result = processObject("", data, template);
    document.body.innerHTML = shared_result;
    processFiles();

  }

  function processObject(key, data, template){
    var result = template;
    var k = (key !== null && key.length>0)? key + ".": "";
    for (var e in data){
      result = processData(k + e, data[e], result);
    }

    return result;

  }

  function processData(key, value, template){

    var key2 = key.replace(/&\d+/gi, "");

    if (Object.prototype.toString.call(value) === '[object Array]'){
      return processArray(key2, value, template);
    }

    if (typeof value === "object"){
      return processObject(key2, value, template);
    }

    var exp = eval("/\@\{" + key + "\}/g");
    var result = template.replace(exp, value);
    //console.log(exp);

    var marker = "@{" + key + "%r}";
    if (result.indexOf(marker) >= 0)
    files.push({"marker": marker, "url": value});

    return result;
  }

  function processArray(key, data, template){

    var begin = "@{" + key + "%sb}";
    var idx_begin = template.indexOf(begin) + begin.length;
    var end = "@{" + key + "%se}";
    var idx_end = template.indexOf(end);

    console.log(end + " => " +  idx_end);

    if (idx_begin < 0 || idx_end < 0) return template;

    //console.log(key);

    var part = template.substring(idx_begin, idx_end);

    //console.log(part);
    var repl = "";

    for (var i = 0; i < data.length; i++){
      var parti = part.replace("@{" + key + "}", "@{" + key + "&" + i + "}");
      parti = processData(key + "&" + i, data[i], parti);
      repl += parti + "\n";
    }

    part = begin + part + end;

    return template.replace(part, repl);

  }

  function processFiles(){
    while((file=files.pop()) != null){
      readFile(file.marker, file.url);
    }
  }

  function readFile(marker, url){
    var rawFile = new XMLHttpRequest();
    rawFile.responseType = 'text';
    rawFile.open("GET", url, true);

    mutex++;

    rawFile.onreadystatechange = function() {
      if (rawFile.readyState === 4) {
        var resp = "";
        if (rawFile.status == "200") resp = rawFile.responseText;
        shared_result = shared_result.replace(marker, resp);
        mutex--;
        if (mutex === 0){
          document.body.innerHTML = shared_result;
        }

      }
    }
    rawFile.send(null);
  }


  function embed(html){
    document.body.innerHTML += html;
  }

  function addStyleSheet(url){
    var cssId = 'myCss';  // you could encode the css path itself to generate id..
    if (!document.getElementById(cssId))
    {
      var head  = document.getElementsByTagName('head')[0];
      var link  = document.createElement('link');
      link.id   = cssId;
      link.rel  = 'stylesheet';
      link.type = 'text/css';
      link.href = url;
      link.media = 'all';
      head.appendChild(link);
    }
  }


}());
