webpackJsonp([13],{25:function(t,e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e["default"]={}},27:function(t,e,o){e=t.exports=o(2)(),e.push([t.id,"@media screen and (max-width:1024px){#topbar{background-color:#fff;box-shadow:0 1px 6px rgba(0,0,0,.35);position:fixed;top:56px;left:0;right:0;z-index:99}}@media screen and (min-width:1025px){#topbar{background-color:#fff;box-shadow:0 1px 6px rgba(0,0,0,.35);position:fixed;top:64px;left:240px;right:0;z-index:99}}","",{version:3,sources:["/./src/components/reuseable/Topbar.vue"],names:[],mappings:"AACA,qCACE,QACE,sBAAuB,AACvB,qCAAuC,AACvC,eAAgB,AAChB,SAAU,AACV,OAAQ,AACR,QAAS,AACT,UAAW,CACZ,CACF,AACD,qCACE,QACE,sBAAuB,AACvB,qCAAuC,AACvC,eAAgB,AAChB,SAAU,AACV,WAAY,AACZ,QAAS,AACT,UAAW,CACZ,CACF",file:"Topbar.vue",sourcesContent:["\n@media screen and (max-width: 1024px) {\n  #topbar {\n    background-color: #fff;\n    box-shadow: 0 1px 6px rgba(0,0,0,0.35);\n    position: fixed;\n    top: 56px;\n    left: 0;\n    right: 0;\n    z-index: 99\n  }\n}\n@media screen and (min-width: 1025px) {\n  #topbar {\n    background-color: #fff;\n    box-shadow: 0 1px 6px rgba(0,0,0,0.35);\n    position: fixed;\n    top: 64px;\n    left: 240px;\n    right: 0;\n    z-index: 99\n  }\n}\n"],sourceRoot:"webpack://"}])},29:function(t,e,o){var n=o(27);"string"==typeof n&&(n=[[t.id,n,""]]);o(3)(n,{});n.locals&&(t.exports=n.locals)},43:function(t,e){t.exports="<div id=topbar> <slot></slot> </div>"},45:function(t,e,o){var n,a;o(29),n=o(25),a=o(43),t.exports=n||{},t.exports.__esModule&&(t.exports=t.exports["default"]),a&&(("function"==typeof t.exports?t.exports.options||(t.exports.options={}):t.exports).template=a)},347:function(t,e,o){"use strict";function n(t){return t&&t.__esModule?t:{"default":t}}Object.defineProperty(e,"__esModule",{value:!0});var a=o(45),i=n(a);e["default"]={attached:function(){"/manage-qcollection"===this.$route.path&&this.$router.go({name:"my-qcollection"})},components:{topbar:i["default"]}}},475:function(t,e){t.exports="<div id=manage-qcollection> <topbar> <div class=tabbar> <span class=tabbar-item style=width:33.333333% v-link=\"{ name: 'my-qcollection', activeClass: 'tabbar-item-active'}\">我的題集</span> <span class=tabbar-item style=width:33.333333% v-link=\"{ name: 'all-qcollection', activeClass: 'tabbar-item-active' }\">所有題集</span> <span class=tabbar-item style=width:33.333333%>題集搜索</span> </div> </topbar> <router-view :is=view transition=fade transition-mode=out-in style=margin-top:52px></router-view> </div>"},499:function(t,e,o){var n,a;n=o(347),a=o(475),t.exports=n||{},t.exports.__esModule&&(t.exports=t.exports["default"]),a&&(("function"==typeof t.exports?t.exports.options||(t.exports.options={}):t.exports).template=a)}});
//# sourceMappingURL=13.0d9b7d0e93e53a549be1.js.map