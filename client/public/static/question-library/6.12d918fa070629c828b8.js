webpackJsonp([6],{6:function(e,t){var n=e.exports={version:"2.3.0"};"number"==typeof __e&&(__e=n)},18:function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t["default"]={props:{flex:!1}}},20:function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t["default"]={props:{title:String,sheetshow:Boolean,center:Boolean}}},22:function(e,t,n){t=e.exports=n(2)(),t.push([e.id,".card{background:#fff;border:1px solid rgba(0,0,0,.1);box-shadow:0 1px 4px rgba(0,0,0,.05)}","",{version:3,sources:["/./src/components/reuseable/Card.vue"],names:[],mappings:"AACA,MACE,gBAAiB,AACjB,gCAAkC,AAClC,oCAAuC,CACxC",file:"Card.vue",sourcesContent:["\n.card {\n  background: #fff;\n  border: 1px solid rgba(0,0,0,0.1);\n  box-shadow: 0 1px 4px rgba(0,0,0,0.05);\n}\n"],sourceRoot:"webpack://"}])},24:function(e,t,n){t=e.exports=n(2)(),t.push([e.id,"#sheet-pannel{background-color:#fff;padding:16px 32px;box-shadow:0 1px 6px rgba(0,0,0,.35)}#sheet-pannel .justify-center{-webkit-box-pack:center;-webkit-justify-content:center;-ms-flex-pack:center;justify-content:center}","",{version:3,sources:["/./src/components/reuseable/Sheet-pannel.vue"],names:[],mappings:"AACA,cACE,sBAAuB,AACvB,kBAAmB,AACnB,oCAAsC,CACvC,AAED,8BACE,wBAAyB,AACzB,+BAAgC,AAC5B,qBAAsB,AAClB,sBAAwB,CACjC",file:"Sheet-pannel.vue",sourcesContent:["\n#sheet-pannel {\n  background-color: #fff;\n  padding: 16px 32px;\n  box-shadow: 0 1px 6px rgba(0,0,0,0.35)\n}\n\n#sheet-pannel .justify-center {\n  -webkit-box-pack: center;\n  -webkit-justify-content: center;\n      -ms-flex-pack: center;\n          justify-content: center;\n}\n\n"],sourceRoot:"webpack://"}])},26:function(e,t,n){var i=n(22);"string"==typeof i&&(i=[[e.id,i,""]]);n(3)(i,{});i.locals&&(e.exports=i.locals)},28:function(e,t,n){var i=n(24);"string"==typeof i&&(i=[[e.id,i,""]]);n(3)(i,{});i.locals&&(e.exports=i.locals)},37:function(e,t){e.exports="<div> <div class=card> <slot name=content></slot> </div> </div>"},39:function(e,t){e.exports='<div id=sheet-pannel> <div class="flex-row flex-center" :class="{\'justify-center\': center}"> <slot name=sheet-title></slot> <div class="flex-column flex-center"> <slot name=sheet-button></slot> <slot name=button-subtitle></slot> </div> </div> <div id=sheet-zone v-show=sheetshow transition=expand> <slot name=sheet-zone></slot> </div> </div>'},41:function(e,t,n){var i,s;n(26),i=n(18),s=n(37),e.exports=i||{},e.exports.__esModule&&(e.exports=e.exports["default"]),s&&(("function"==typeof e.exports?e.exports.options||(e.exports.options={}):e.exports).template=s)},43:function(e,t,n){var i,s;n(28),i=n(20),s=n(39),e.exports=i||{},e.exports.__esModule&&(e.exports=e.exports["default"]),s&&(("function"==typeof e.exports?e.exports.options||(e.exports.options={}):e.exports).template=s)},54:function(e,t,n){e.exports={"default":n(55),__esModule:!0}},55:function(e,t,n){var i=n(6),s=i.JSON||(i.JSON={stringify:JSON.stringify});e.exports=function(e){return s.stringify.apply(s,arguments)}},270:function(e,t,n){"use strict";function i(e){return e&&e.__esModule?e:{"default":e}}Object.defineProperty(t,"__esModule",{value:!0});var s=n(54),o=i(s),a=n(43),l=i(a),c=n(41),r=i(c),d=n(17),p=i(d);t["default"]={ready:function(){this.$route.params.question_id?(this.validateURL=!0,this.getQuestionDetail(this.$route.params.question_id)):this.answer.buttonDisable=!0},components:{sheetPannel:l["default"],Card:r["default"]},methods:{getQuestionDetail:function(e){var t="/api/manage-question/question/"+e;this.$http.get(t).then(function(e){this.details=e.data,this.tempDetails=JSON.parse((0,o["default"])(e.data)),this.details.createdBy&&"self"===this.details.createdBy&&(this.edit.button=!0),this.renderQuestions()},function(e){console.log(e)})},getQuestionAnswer:function(e){if(this.answer.buttonDisable=!0,!this.answer.get&&this.validateURL){var t={question_id:this.$route.params.question_id},n="/api/manage-question/answer";this.$http.get(n,t).then(function(t){"mc"===this.details.type&&(this.answer.results=t.data.mc),this.answer.get=!0,null!==e&&(this.choice=e)},function(e){console.log(e)})}else null!==e&&(this.choice=e)},checkMc:function(e){this.getQuestionAnswer(e)},renderQuestions:function(){setTimeout(function(){window.renderMathInElement(document.getElementById("question-body"),{delimiters:[{left:"$$",right:"$$",display:!1}]})},0)},tags:function(e,t,n){"add"===e&&t?""!==t.trim()&&(this.details.tags.push(t),this.edit.tag=""):"remove"===e&&n>=0&&this.details.tags.splice(n,1)},updateInfo:function(){if(this.details.subject!==this.tempDetails.subject||this.details.difficulty!==this.tempDetails.difficulty||(0,o["default"])(this.details.tags)!==(0,o["default"])(this.tempDetails.tags)){var e={subject:this.details.subject,difficulty:this.details.difficulty,tags:this.details.tags,updated_at:new Date},t="/api/manage-question/question/"+this.$route.params.question_id;this.$http.put(t,e).then(function(e){this.sheetshow=!1,this.details.updated_at=new Date,this.tempDetails.updated_at=new Date},function(e){console.log(e)})}},cancelUpdate:function(){this.sheetshow=!1,this.details=JSON.parse((0,o["default"])(this.tempDetails))},getNumberArray:function(e){return new Array(e)}},data:function(){return{validateURL:!1,sheetshow:!1,choice:Number,details:{},tempDetails:{},answer:{buttonDisable:!1,get:!1,results:void 0},subjects:p["default"].subjects,edit:{button:!1,tag:""}}}}},287:function(e,t,n){t=e.exports=n(2)(),t.push([e.id,".q-d-subject{float:left;padding:4px 8px;color:#fff;background:#03a9f4;margin-right:5px}.q-d-context{margin:0;font-size:20px;font-weight:700;padding-left:12px;border-left:4px solid #3f51b5;margin-top:20px}.q-d-public{color:#e91e63;float:right;padding:8px}.q-d-difficulty{float:none}.q-d-difficulty i{width:24px;color:#ffc107}.q-d-tag{color:#e91e63;margin:0 5px;padding:2px 4px;border:1px solid #e91e63;cursor:pointer}#question-detail #question-body{max-width:800px;margin:0 auto;margin-top:8px}#question-detail #question-body p{margin:0}.q-d-info-wrapper{margin-bottom:10px}.q-d-mc-wrapper .card{padding:16px}.q-d-mc-wrapper .hightlight-answer .card{background-color:#009688;color:#fff}.q-d-mc-wrapper .wrong .card{background-color:#f44336;color:#fff}.q-d-mc-wrapper .mc-choice-label{font-size:20px;color:#607d8b;float:left;line-height:25px;padding-right:10px}.q-d-mc-wrapper .hightlight-answer .mc-choice-label,.q-d-mc-wrapper .wrong .mc-choice-label{color:#fff}.difficulty-box{padding:10px 0}.difficulty-box i{width:24px;color:#aaa;cursor:pointer}.difficulty-heighlight{color:#ffc107!important}","",{version:3,sources:["/./src/components/Question-detail.vue"],names:[],mappings:"AACA,aACE,WAAY,AACZ,gBAAiB,AACjB,WAAY,AACZ,mBAAoB,AACpB,gBAAiB,CAClB,AACD,aACE,SAAU,AACV,eAAgB,AAChB,gBAAkB,AAClB,kBAAmB,AACnB,8BAA+B,AAC/B,eAAgB,CACjB,AACD,YACE,cAAe,AACf,YAAa,AACb,WAAa,CACd,AACD,gBACE,UAAY,CACb,AACD,kBACE,WAAY,AACZ,aAAc,CACf,AACD,SACE,cAAe,AACf,aAAc,AACd,gBAAiB,AACjB,yBAA0B,AAC1B,cAAgB,CACjB,AAED,gCACE,gBAAiB,AACjB,cAAe,AACf,cAAe,CAChB,AAED,kCACE,QAAS,CACV,AAED,kBACE,kBAAmB,CACpB,AACD,sBACE,YAAa,CACd,AAED,yCACE,yBAA0B,AAC1B,UAAW,CACZ,AAED,6BACE,yBAA0B,AAC1B,UAAW,CACZ,AAED,iCACE,eAAgB,AAChB,cAAe,AACf,WAAY,AACZ,iBAAkB,AAClB,kBAAoB,CACrB,AAMD,4FACE,UAAW,CACZ,AAED,gBACE,cAAe,CAChB,AACD,kBACE,WAAY,AACZ,WAAY,AACZ,cAAgB,CACjB,AAED,uBACE,uBAAyB,CAC1B",file:"Question-detail.vue",sourcesContent:["\n.q-d-subject {\n  float: left;\n  padding: 4px 8px;\n  color: #fff;\n  background: #03A9F4;\n  margin-right: 5px\n}\n.q-d-context {\n  margin: 0;\n  font-size: 20px;\n  font-weight: bold;\n  padding-left: 12px;\n  border-left: 4px solid #3F51B5;\n  margin-top: 20px\n}\n.q-d-public {\n  color: #E91E63;\n  float: right;\n  padding: 8px;\n}\n.q-d-difficulty {\n  float: none;\n}\n.q-d-difficulty i {\n  width: 24px;\n  color: #FFC107\n}\n.q-d-tag {\n  color: #E91E63;\n  margin: 0 5px;\n  padding: 2px 4px;\n  border: 1px solid #e91e63;\n  cursor: pointer;\n}\n\n#question-detail #question-body {\n  max-width: 800px;\n  margin: 0 auto;\n  margin-top: 8px\n}\n\n#question-detail #question-body p {\n  margin: 0\n}\n\n.q-d-info-wrapper {\n  margin-bottom: 10px\n}\n.q-d-mc-wrapper .card {\n  padding: 16px\n}\n\n.q-d-mc-wrapper .hightlight-answer .card {\n  background-color: #009688;\n  color: #fff\n}\n\n.q-d-mc-wrapper .wrong .card {\n  background-color: #F44336;\n  color: #fff\n}\n\n.q-d-mc-wrapper .mc-choice-label {\n  font-size: 20px;\n  color: #607D8B;\n  float: left;\n  line-height: 25px;\n  padding-right: 10px;\n}\n\n.q-d-mc-wrapper .hightlight-answer .mc-choice-label {\n  color: #fff\n}\n\n.q-d-mc-wrapper .wrong .mc-choice-label {\n  color: #fff\n}\n\n.difficulty-box {\n  padding: 10px 0\n}\n.difficulty-box i {\n  width: 24px;\n  color: #aaa;\n  cursor: pointer;\n}\n\n.difficulty-heighlight{\n  color: #FFC107 !important\n}\n\n"],sourceRoot:"webpack://"}])},299:function(e,t,n){var i=n(287);"string"==typeof i&&(i=[[e.id,i,""]]);n(3)(i,{});i.locals&&(e.exports=i.locals)},418:function(e,t){e.exports='<div id=question-detail> <sheet-pannel :sheetshow.sync=sheetshow :center=true> <div slot=sheet-button> <mdl-button primary raised slot=sheet-button class=sheet-button @click="sheetshow = true" v-show="!sheetshow && edit.button" :disabled=!edit.button> 修改題目信息 </mdl-button> </div> <div slot=button-subtitle> <p style="margin: 8px 0 0 0;color: #9E9E9E">最後更新于 {{ details.updated_at | date \'YYYY[年]M[月]DD[日] h:mm a\'}}</p> </div> <div slot=sheet-zone> <div class="flex-row flex-center"> <span>科目：</span> <select v-model=details.subject> <option v-for="subject in subjects" v-bind:value=subject.id> {{ subject.name }} </option> </select> </div> <div class="difficulty-box flex-row flex-center"> <span style=line-height:26px>難度：</span> <span class="flex-row flex-baseline"> <i class=material-icons v-for="1 in 5" @click="details.difficulty = $index + 1" :class="{\'difficulty-heighlight\': details.difficulty > $index}">star_rate</i> </span> </div> <div class=flex-column style=position:relative;top:-20px> <div v-show="details.tags && details.tags.length !== 0" style="padding-top: 25px;margin-right: 10px"> <span>標籤：</span> <span class=q-d-tag @click="tags(\'remove\', null, $index)" v-for="tag in details.tags" track-by=$index>{{tag}}</span> </div> <mdl-textfield label=輸入標籤.回車 @keyup.enter="tags(\'add\', edit.tag)" :value.sync=edit.tag style=width:200px></mdl-textfield> </div> <div style=position:relative;top:-15px;left:-10px> <mdl-button primary accent raised class=sheet-button @click=updateInfo()> 提交修改 </mdl-button> <mdl-button class=sheet-button @click=cancelUpdate()> 取消 </mdl-button> </div> </div> </sheet-pannel> <div id=question-body> <div v-if="details.type === \'mc\'"> <mdl-button accent raised style="margin:0 0 8px 0" @click=getQuestionAnswer() v-show=!answer.get :disabled=answer.buttonDisable>顯示答案</mdl-button> <card> <div slot=content style=padding:16px> <div class=q-d-info-wrapper> <span class=q-d-subject>{{details.subject | subject}}</span> <div class=q-d-difficulty> <i class=material-icons v-for="i in getNumberArray(details.difficulty)" track-by=$index>star_rate</i> </div> </div> {{{details.context}}} </div> </card> <div v-if="details.type === \'mc\'" class="q-d-mc-wrapper flex-column"> <div class=flex-row> <card class=flex-50 :class="{\'hightlight-answer\': answer.results === 0, \'wrong\': answer.results !== 0 && choice === 0}" @click=checkMc(0)><div slot=content><span class=mc-choice-label>A</span>{{{details.choices[0]}}}</div></card> <card class=flex-50 :class="{\'hightlight-answer\': answer.results === 1, \'wrong\': answer.results !== 1 && choice === 1}" @click=checkMc(1)><div slot=content><span class=mc-choice-label>B</span>{{{details.choices[1]}}}</div></card> </div> <div class=flex-row> <card class=flex-50 :class="{\'hightlight-answer\': answer.results === 2, \'wrong\': answer.results !== 2 && choice === 2}" @click=checkMc(2)><div slot=content><span class=mc-choice-label>C</span>{{{details.choices[2]}}}</div></card> <card class=flex-50 :class="{\'hightlight-answer\': answer.results === 3, \'wrong\': answer.results !== 3 && choice === 3}" @click=checkMc(3)><div slot=content><span class=mc-choice-label>D</span>{{{details.choices[3]}}}</div></card> </div> </div> </div> </div> </div>'},440:function(e,t,n){var i,s;n(299),i=n(270),s=n(418),e.exports=i||{},e.exports.__esModule&&(e.exports=e.exports["default"]),s&&(("function"==typeof e.exports?e.exports.options||(e.exports.options={}):e.exports).template=s)}});
//# sourceMappingURL=6.12d918fa070629c828b8.js.map