(window.webpackJsonp=window.webpackJsonp||[]).push([[1],{J87Z:function(t,e,n){"use strict";n.d(e,"a",function(){return o});var o=function(){function t(){}return t.RELATIVE="admin",t.APP="app",t.LOGIN="login",t}()},PEbV:function(t,e,n){"use strict";n.d(e,"a",function(){return a});var o=n("t/Na"),r=n("6blF"),i=(n("bvuZ"),n("J87Z")),a=function(){function t(t,e,n){this.router=t,this.httpClient=e,this.endPointsService=n}return t.grabToken=function(){return localStorage.getItem("token")},t.prototype.login=function(t,e){var n=this;return r.a.create(function(r){var i=n.endPointsService.getApiUrl()+"/auth";n.httpClient.get(i,{headers:(new o.g).set("Authorization","Basic "+btoa(t+":"+e))}).subscribe(function(t){console.debug("IAuthResponse",t),localStorage.setItem("token",t.token),r.next({authenticated:!0,token:t.token})},function(t){r.error({authenticated:!1,errorCode:t.status,errorMessage:t.message})},function(){r.complete()})})},t.prototype.logout=function(){console.log("logout"),localStorage.removeItem("token"),this.router.navigate([i.a.RELATIVE,i.a.LOGIN])},t}()},bvuZ:function(t,e,n){"use strict";n.d(e,"a",function(){return r});var o=n("AytR"),r=function(){function t(){}return t.prototype.getApiUrl=function(){return this.resolve(o.a.api.url)},t.prototype.resolve=function(t){var e=new Date,n=this.endPointID(o.a.api.totalEndpoints,e);return t.replace(o.a.api.replacePattern,("0"+n).slice(-2))},t.prototype.endPointID=function(t,e){var n=parseInt(e.toISOString().split("T")[1].split(":")[0],10);return Math.floor(n/(24/t))+1},t}()}}]);