webpackJsonp([10],{4:function(e,n){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n["default"]={data:function(){return{spinnerActive:!0,myQcollections:[]}},props:["show","qid"],methods:{closeModal:function(){this.show=!1},saveOneToCollection:function(e){if(e&&this.qid){var n={qcollection_id:e,question_id:this.qid};this.$http.post("/api/manage-qcollection/add-question",n).then(function(e){this.show=!1,this.showToast("添加成功")},function(e){this.showToast("失敗"),console.log(e)})}else this.showToast("發生錯誤")},getMyQcollectionLists:function(){0===this.myQcollections.length&&this.$http.get("/api/manage-qcollection/mine").then(function(e){this.myQcollections=e.data,this.spinnerActive=!1},function(e){console.log(e)})},showToast:function(e){this.$dispatch("show-toast",e)}},events:{getMyQcollectionLists:function(){this.getMyQcollectionLists()}}}},6:function(e,n,o){n=e.exports=o(1)(),n.push([e.id,"@media screen and (max-width:1024px){#select-qcollection{box-sizing:border-box}}@media screen and (min-width:1025px){#select-qcollection{box-sizing:border-box;padding-left:240px}}.modal-mask{position:fixed;z-index:9998;top:0;left:0;width:100%;height:100%;background-color:rgba(0,0,0,.5);-webkit-transition:opacity .3s ease;transition:opacity .3s ease}#select-qcollection .modal-container{width:300px;margin:130px auto 0;padding:0;background-color:#fff;border-radius:2px;box-shadow:0 2px 8px rgba(0,0,0,.33);-webkit-transition:all .3s ease;transition:all .3s ease}.modal-header{padding:20px 0 0 20px;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;-ms-grid-row-align:center;align-items:center}.modal-header h4{margin:0;color:#2196f3}.modal-body{margin:20px 0;margin-bottom:0;max-height:360px;overflow:scroll}.modal-body::-webkit-scrollbar{-webkit-appearance:none;width:6px}.modal-body::-webkit-scrollbar-thumb{border-radius:0;background-color:#ccc;-webkit-box-shadow:0 0 1px hsla(0,0%,100%,.5)}.modal-footer{padding-right:20px;padding-bottom:10px}.modal-enter,.modal-leave{opacity:0}.modal-enter .modal-container,.modal-leave .modal-container{-webkit-transform:scale(1.1);transform:scale(1.1)}.list{padding:0;list-style:none;margin:0}.list li{-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;-ms-grid-row-align:center;align-items:center;padding:15px 20px;font-size:16px;cursor:pointer;background-image:-webkit-linear-gradient(top,#9e9e9e,#9e9e9e 51%,transparent 0);background-image:linear-gradient(180deg,#9e9e9e 0,#9e9e9e 51%,transparent 0);background-size:100% 1px;background-repeat:no-repeat}.list li:active{background-color:#eee}.list .subject-label{color:#e91e63;border:1px solid #e91e63;padding:2px 4px;font-size:13px;margin-right:8px}","",{version:3,sources:["/./src/components/reuseable/Select-qcollection.vue"],names:[],mappings:"AAEA,qCACE,oBACE,qBAAuB,CACxB,CACF,AAED,qCACE,oBACE,sBAAuB,AACvB,kBAAmB,CACpB,CACF,AAED,YACE,eAAgB,AAChB,aAAc,AACd,MAAO,AACP,OAAQ,AACR,WAAY,AACZ,YAAa,AACb,gCAAoC,AACpC,oCAAqC,AACrC,2BAA6B,CAC9B,AAED,qCACE,YAAa,AACb,oBAAqB,AACrB,UAAW,AACX,sBAAuB,AACvB,kBAAmB,AACnB,qCAAyC,AACzC,gCAAiC,AACjC,uBAAyB,CAC1B,AAED,cACE,sBAAyB,AACzB,yBAA0B,AAC1B,2BAA4B,AACxB,sBAAuB,AACf,0BAA2B,AAC/B,kBAAmB,CAC5B,AAED,iBACE,SAAU,AACV,aAAe,CAChB,AAED,YACE,cAAe,AACf,gBAAiB,AACjB,iBAAkB,AAClB,eAAiB,CAClB,AAED,+BACE,wBAAyB,AACzB,SAAW,CACZ,AACD,qCACE,gBAAmB,AACnB,sBAAuB,AACvB,6CAAiD,CAClD,AAED,cACE,mBAAoB,AACpB,mBAAoB,CACrB,AAED,0BACE,SAAW,CACZ,AAED,4DAEE,6BAA8B,AAC9B,oBAAsB,CACvB,AAED,MACE,UAAa,AACb,gBAAiB,AACjB,QAAQ,CACT,AACD,SACE,yBAA0B,AAC1B,2BAA4B,AACxB,sBAAuB,AACf,0BAA2B,AAC/B,mBAAoB,AAC5B,kBAAmB,AACnB,eAAgB,AAChB,eAAgB,AAChB,gFAAyF,AACzF,6EAAuF,AACvF,yBAA0B,AAC1B,2BAA6B,CAC9B,AAED,gBACE,qBAAsB,CACvB,AAED,qBACE,cAAe,AACf,yBAA0B,AAC1B,gBAAiB,AACjB,eAAgB,AAChB,gBAAiB,CAClB",file:"Select-qcollection.vue",sourcesContent:["\n\n@media screen and (max-width: 1024px) {\n  #select-qcollection {\n    box-sizing: border-box;\n  }\n}\n\n@media screen and (min-width: 1025px) {\n  #select-qcollection {\n    box-sizing: border-box;\n    padding-left: 240px\n  }\n}\n\n.modal-mask {\n  position: fixed;\n  z-index: 9998;\n  top: 0;\n  left: 0;\n  width: 100%;\n  height: 100%;\n  background-color: rgba(0, 0, 0, .5);\n  -webkit-transition: opacity .3s ease;\n  transition: opacity .3s ease;\n}\n\n#select-qcollection .modal-container {\n  width: 300px;\n  margin: 130px auto 0;\n  padding: 0;\n  background-color: #fff;\n  border-radius: 2px;\n  box-shadow: 0 2px 8px rgba(0, 0, 0, .33);\n  -webkit-transition: all .3s ease;\n  transition: all .3s ease;\n}\n\n.modal-header {\n  padding: 20px 0px 0 20px;\n  -webkit-box-align: center;\n  -webkit-align-items: center;\n      -ms-flex-align: center;\n              -ms-grid-row-align: center;\n          align-items: center\n}\n\n.modal-header h4 {\n  margin: 0;\n  color: #2196F3;\n}\n\n.modal-body {\n  margin: 20px 0;\n  margin-bottom: 0;\n  max-height: 360px;\n  overflow: scroll;\n}\n\n.modal-body::-webkit-scrollbar {\n  -webkit-appearance: none;\n  width: 6px;\n}\n.modal-body::-webkit-scrollbar-thumb {\n  border-radius: 0px;\n  background-color: #ccc;\n  -webkit-box-shadow: 0 0 1px rgba(255,255,255,.5);\n}\n\n.modal-footer{\n  padding-right: 20px;\n  padding-bottom: 10px\n}\n\n.modal-enter, .modal-leave {\n  opacity: 0;\n}\n\n.modal-enter .modal-container,\n.modal-leave .modal-container {\n  -webkit-transform: scale(1.1);\n  transform: scale(1.1);\n}\n\n.list {\n  padding: 0px;\n  list-style: none;\n  margin:0\n}\n.list li {\n  -webkit-box-align: center;\n  -webkit-align-items: center;\n      -ms-flex-align: center;\n              -ms-grid-row-align: center;\n          align-items: center;\n  padding: 15px 20px;\n  font-size: 16px;\n  cursor: pointer;\n  background-image: -webkit-linear-gradient(top, #9E9E9E 0%, #9E9E9E 51%, transparent 51%);\n  background-image: linear-gradient(to bottom, #9E9E9E 0%, #9E9E9E 51%, transparent 51%);\n  background-size: 100% 1px;\n  background-repeat: no-repeat;\n}\n\n.list li:active {\n  background-color: #eee\n}\n\n.list .subject-label {\n  color: #E91E63;\n  border: 1px solid #E91E63;\n  padding: 2px 4px;\n  font-size: 13px;\n  margin-right: 8px\n}\n\n"],sourceRoot:"webpack://"}])},8:function(e,n,o){var t=o(6);"string"==typeof t&&(t=[[e.id,t,""]]);o(2)(t,{});t.locals&&(e.exports=t.locals)},12:function(e,n){e.exports='<div id=select-qcollection class=modal-mask v-show=show transition=modal> <div class=modal-container> <div class="modal-header flex-row"> <h4>加入題集</h4> <span class=flex style="flex: 1"></span> <mdl-button class=close @click=closeModal()> <i class=material-icons>close</i> </mdl-button> </div> <mdl-spinner :active=spinnerActive v-show=spinnerActive></mdl-spinner> <div class=modal-body> <ul class=list> <li class=flex-row v-for="qc in myQcollections" @click=saveOneToCollection(qc._id)> <span class=subject-label>{{qc.subject | subject}}</span> <span>{{qc.name}}</span> </li> </ul> </div> </div> </div>'},14:function(e,n,o){var t,i;o(8),t=o(4),i=o(12),e.exports=t||{},e.exports.__esModule&&(e.exports=e.exports["default"]),i&&(("function"==typeof e.exports?e.exports.options||(e.exports.options={}):e.exports).template=i)},100:function(e,n,o){"use strict";function t(e){return e&&e.__esModule?e:{"default":e}}Object.defineProperty(n,"__esModule",{value:!0});var i=o(14),s=t(i);n["default"]={ready:function(){this.getMyQuestions()},components:{qcollectionSelectorModal:s["default"]},methods:{getMyQuestions:function(){this.$http.get("/api/manage-question/mine").then(function(e){this.myQuestions=e.data,this.renderQuestions()},function(e){console.log(e)})},renderQuestions:function(){setTimeout(function(){window.renderMathInElement(document.getElementById("questions-preview-container"),{delimiters:[{left:"$$",right:"$$",display:!1}]})},0)},deleteSingleQuestion:function(e,n){var o=window.confirm("你確定要刪除這個題目？");if(o){var t={question_id:e},i="/api/manage-question/delete/single";this.$http["delete"](i,t).then(function(e){this.showToast("操作成功"),this.myQuestions.splice(n,1)},function(e){this.showToast("操作失敗")})}},showCollectionModal:function(e){this.$broadcast("getMyQcollectionLists"),this.CollectionModal.show=!0,this.CollectionModal.qid=e},getNumberArray:function(e){return new Array(e)},showToast:function(e){this.$dispatch("show-toast",e)}},data:function(){return{CollectionModal:{show:!1,qid:"1234"},myQuestions:[]}}}},214:function(e,n){e.exports='<div id=my-question> <qcollection-selector-modal :show.sync=CollectionModal.show :qid=CollectionModal.qid></qcollection-selector-modal> <div class=mdl-grid id=questions-preview-container> <div class="mdl-cell mdl-cell--4-col question-card" v-for="q in myQuestions" v-link="{ name: \'question-detail\', params: { question_id: q._id }}"> <div class=question-wrapper> <span class=q-subject>{{q.subject | subject}}</span> <span class=q-type>{{q.type}}</span> <div class=q-difficulty> <i class=material-icons v-for="i in getNumberArray(q.difficulty)" track-by=$index>star_rate</i> </div> <p class=q-context>{{{q.context}}}</p> <span class=q-tag v-for="tag in q.tags">{{tag}}</span> </div> <div class="question-tools flex-row"> <mdl-button v-on:click=showCollectionModal(q._id)><i class=material-icons>add</i>加入題集</mdl-button> <mdl-button v-on:click="deleteSingleQuestion(q._id, $index)"><i class=material-icons>close</i>刪除</mdl-button> </div> </div> </div> </div>'},230:function(e,n,o){var t,i;t=o(100),i=o(214),e.exports=t||{},e.exports.__esModule&&(e.exports=e.exports["default"]),i&&(("function"==typeof e.exports?e.exports.options||(e.exports.options={}):e.exports).template=i)}});
//# sourceMappingURL=10.49b27a5154e781d8297f.js.map