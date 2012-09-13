//>>built
define("dojox/app/main","dojo/_base/kernel,require,dojo/_base/lang,dojo/_base/declare,dojo/Deferred,dojo/when,dojo/has,dojo/_base/config,dojo/on,dojo/ready,dojo/_base/window,dojo/dom-construct,./model,./View,./controllers/Load,./controllers/Transition,./controllers/Layout".split(","),function(n,f,e,i,j,g,l,o,p,q,r,s,t,u,v,w,x){function m(a,d){var b;if(!a.loaderConfig)a.loaderConfig={};if(!a.loaderConfig.paths)a.loaderConfig.paths={};if(!a.loaderConfig.paths.app)b=window.location.pathname,"/"!=b.charAt(b.length)&&
(b=b.split("/"),b.pop(),b=b.join("/")),a.loaderConfig.paths.app=b;f(a.loaderConfig);if(!a.modules)a.modules=[];a.modules.push("dojox/app/module/lifecycle");var c=a.modules.concat(a.dependencies);if(a.template)b=a.template,0==b.indexOf("./")&&(b="app/"+b),c.push("dojo/text!"+b);f(c,function(){for(var b=[y],c=0;c<a.modules.length;c++)b.push(arguments[c]);if(a.template)var f={templateString:arguments[arguments.length-1]};App=i(b,f);q(function(){var b=new App(a,d||r.body());b.log=l("app-log-api")?function(){try{for(var a=
0;a<arguments.length-1;a++);}catch(b){}}:function(){};b.setStatus(b.lifecycle.STARTING);var c=b.id;window[c]&&e.mixin(b,window[c]);window[c]=b;b.start()})})}n.experimental("dojox.app");l.add("app-log-api",(o.app||{}).debugApp);var y=i(null,{constructor:function(a,d){e.mixin(this,a);this.params=a;this.id=a.id;this.defaultView=a.defaultView;this.widgetId=a.id;this.controllers=[];this.children={};this.loadedModels={};this.domNode=s.create("div",{id:this.id+"_Root",style:"width:100%; height:100%; overflow-y:hidden; overflow-x:hidden;"});
d.appendChild(this.domNode)},createDataStore:function(a){if(a.stores)for(var d in a.stores)if("_"!==d.charAt(0)){var b=a.stores[d].type?a.stores[d].type:"dojo/store/Memory",c={};a.stores[d].params&&e.mixin(c,a.stores[d].params);b=f(b);if(c.data&&e.isString(c.data))c.data=e.getObject(c.data);a.stores[d].store=new b(c)}},createControllers:function(a){if(a){for(var d=[],b=0;b<a.length;b++)d.push(a[b]);var c=new j,h;try{h=f.on("error",function(){!c.isResolved()&&!c.isRejected()&&(c.reject("load controllers error."),
h.remove())}),f(d,function(){c.resolve.call(c,arguments);h.remove()})}catch(i){c.reject("load controllers error."),h.remove()}var k=new j;g(c,e.hitch(this,function(a){for(var b=0;b<a.length;b++)this.controllers.push(new a[b](this));k.resolve(this)}),function(){k.reject("load controllers error.")});return k}},trigger:function(a,d){p.emit(this.domNode,a,d)},start:function(){this.createDataStore(this.params);var a=new j,d;try{d=t(this.params.models,this)}catch(b){return a.reject("load model error."),
a.promise}d.then?g(d,e.hitch(this,function(a){this.loadedModels=a;this.setupAppView()}),function(){a.reject("load model error.")}):(this.loadedModels=d,this.setupAppView())},setupAppView:function(){this.template?(this.view=new u({app:this,name:this.name,parent:this,templateString:this.templateString,definition:this.definition}),g(this.view.start(),e.hitch(this,function(){this.domNode=this.view.domNode;this.setupControllers();this.startup()}))):(this.setupControllers(),this.startup())},getParamsFromHash:function(a){var d=
{};if(a&&a.length)for(var a=a.split("&"),b=0;b<a.length;b++){var c=a[b].split("="),e=c[0],c=encodeURIComponent(c[1]||"");e&&c&&(d[e]=c)}return d},setupControllers:function(){this.noAutoLoadControllers||(this.controllers.push(new v(this)),this.controllers.push(new w(this)),this.controllers.push(new x(this)));var a=window.location.hash;this._startView=((a&&"#"==a.charAt(0)?a.substr(1):a)||this.defaultView).split("&")[0];this._startParams=this.getParamsFromHash(a)||this.defaultParams||{}},startup:function(){var a=
this.createControllers(this.params.controllers);g(a,e.hitch(this,function(){this.trigger("load",{viewId:this.defaultView,params:this._startParams,callback:e.hitch(this,function(){var a=this.defaultView.split(","),a=a.shift();this.selectedChild=this.children[this.id+"_"+a];this.trigger("transition",{viewId:this._startView,params:this._startParams});this.setStatus(this.lifecycle.STARTED)})})}))}});return function(a,d){if(!a)throw Error("App Config Missing");a.validate?f(["dojox/json/schema","dojox/json/ref",
"dojo/text!dojox/application/schema/application.json"],function(b,c){b=dojox.json.ref.resolveJson(b);b.validate(a,c)&&m(a,d)}):m(a,d)}});