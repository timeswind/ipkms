webpackJsonp([3],{8:function(t,n){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n["default"]={data:function(){return{query:{name:"",schoolId:null},results:{query:{name:"",schoolId:null},data:{}}}},methods:{queryStudents:function(){if(this.query.name||this.query.schoolId){var t="/api/manage-account/students?name="+this.query.name+"&schoolId="+this.query.schoolId;this.$http.get(t).then(function(t){this.results.data=t.data,this.query.name?this.results.query.name=this.query.name:this.results.query.name=null,this.query.schoolId?this.results.query.schoolId=this.query.schoolId:this.results.query.schoolId=null},function(t){console.log(t)})}},deleteStudent:function(t,n,e){if(console.log("prepare to delete"),window.confirm("確定刪除 "+e+" 這個學生賬號?")){var s={student_id:n};this.$http["delete"]("/api/manage-account/students",s).then(function(n){this.results.data.splice(t,1),this.showToast("删除成功")},function(t){this.showToast("！＃删除失败＃!"+t.data)})}},showToast:function(t){this.$dispatch("show-toast",t)}}}},17:function(t,n,e){n=t.exports=e(1)(),n.push([t.id,"#student-account{margin-top:16px}.pure-table{width:100%}","",{version:3,sources:["/./src/components/Student-account.vue"],names:[],mappings:"AAiGA,iBACE,eAAgB,CACjB,AAED,YACE,UAAW,CACZ",file:"Student-account.vue",sourcesContent:["\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n#student-account {\n  margin-top: 16px\n}\n\n.pure-table {\n  width: 100%\n}\n\n"],sourceRoot:"webpack://"}])},25:function(t,n,e){var s=e(17);"string"==typeof s&&(s=[[t.id,s,""]]);e(2)(s,{});s.locals&&(t.exports=s.locals)},36:function(t,n){t.exports=' <div id=student-account> <div class=pure-form> <fieldset> <input class=pure-input-rounded type=text placeholder=姓名 v-model=query.name> <input class=pure-input-rounded type=number placeholder=學號 v-model=query.schoolId> <button class="pure-button pure-button-primary" @click=queryStudents()>查詢</button> </fieldset> </div> <p v-show=results.data[0] style=color:#aaa>以下是有關 <i v-show=results.query.name style="color: #FF9800">姓名: {{results.query.name}} </i><i v-show=results.query.schoolId style="color: #FF9800">學號: {{results.query.schoolId}} </i> 的搜索結果</p> <table class="pure-table pure-table-bordered" style="background-color: #fff"> <thead> <tr> <th>#</th> <th>姓名</th> <th>學號</th> <th>操作</th> </tr> </thead> <tbody> <tr v-for="student in results.data" track-by=_id> <td style="width: 1%;white-space:nowrap">{{$index + 1}}</td> <td style="width: 1%;white-space:nowrap">{{student.name}}</td> <td>{{student.schoolId}}</td> <td style="width: 1%;white-space:nowrap"> <button class=pure-button v-link="{name:\'student-detail\', params: {student_id: student._id}}">查看</button> <button class="button-secondary pure-button" v-link="{name:\'reset-password\', params: { role: \'student\', id: student._id}}">重置密碼</button> <button class="button-warning pure-button" @click="deleteStudent($index, student._id, student.name)">刪除</button> </td> </tr> </tbody> </table> </div> '},45:function(t,n,e){var s,o;e(25),s=e(8),o=e(36),t.exports=s||{},t.exports.__esModule&&(t.exports=t.exports["default"]),o&&(("function"==typeof t.exports?t.exports.options||(t.exports.options={}):t.exports).template=o)}});
//# sourceMappingURL=3.0e368a160dfe33f6ad5c.js.map