(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[639],{1654:function(e){e.exports={style:{fontFamily:"'__Inter_f367f3', '__Inter_Fallback_f367f3'",fontStyle:"normal"},className:"__className_f367f3"}},622:function(e,r,n){"use strict";/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var c=n(2265),h=Symbol.for("react.element"),d=Symbol.for("react.fragment"),f=Object.prototype.hasOwnProperty,y=c.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,g={key:!0,ref:!0,__self:!0,__source:!0};function q(e,r,n){var c,d={},v=null,b=null;for(c in void 0!==n&&(v=""+n),void 0!==r.key&&(v=""+r.key),void 0!==r.ref&&(b=r.ref),r)f.call(r,c)&&!g.hasOwnProperty(c)&&(d[c]=r[c]);if(e&&e.defaultProps)for(c in r=e.defaultProps)void 0===d[c]&&(d[c]=r[c]);return{$$typeof:h,type:e,key:v,ref:b,props:d,_owner:y.current}}r.Fragment=d,r.jsx=q,r.jsxs=q},7437:function(e,r,n){"use strict";e.exports=n(622)},7470:function(e,r,n){"use strict";n.d(r,{R:function(){return getDefaultState},m:function(){return f}});var c=n(7987),h=n(9024),d=n(1640),f=class extends h.F{#t;#e;#s;#i;constructor(e){super(),this.#t=e.client,this.mutationId=e.mutationId,this.#s=e.mutationCache,this.#e=[],this.state=e.state||getDefaultState(),this.setOptions(e.options),this.scheduleGc()}setOptions(e){this.options=e,this.updateGcTime(this.options.gcTime)}get meta(){return this.options.meta}addObserver(e){this.#e.includes(e)||(this.#e.push(e),this.clearGcTimeout(),this.#s.notify({type:"observerAdded",mutation:this,observer:e}))}removeObserver(e){this.#e=this.#e.filter(r=>r!==e),this.scheduleGc(),this.#s.notify({type:"observerRemoved",mutation:this,observer:e})}optionalRemove(){this.#e.length||("pending"===this.state.status?this.scheduleGc():this.#s.remove(this))}continue(){return this.#i?.continue()??this.execute(this.state.variables)}async execute(e){let onContinue=()=>{this.#a({type:"continue"})},r={client:this.#t,meta:this.options.meta,mutationKey:this.options.mutationKey};this.#i=(0,d.Mz)({fn:()=>this.options.mutationFn?this.options.mutationFn(e,r):Promise.reject(Error("No mutationFn found")),onFail:(e,r)=>{this.#a({type:"failed",failureCount:e,error:r})},onPause:()=>{this.#a({type:"pause"})},onContinue,retry:this.options.retry??0,retryDelay:this.options.retryDelay,networkMode:this.options.networkMode,canRun:()=>this.#s.canRun(this)});let n="pending"===this.state.status,c=!this.#i.canStart();try{if(n)onContinue();else{this.#a({type:"pending",variables:e,isPaused:c}),await this.#s.config.onMutate?.(e,this,r);let n=await this.options.onMutate?.(e,r);n!==this.state.context&&this.#a({type:"pending",context:n,variables:e,isPaused:c})}let h=await this.#i.start();return await this.#s.config.onSuccess?.(h,e,this.state.context,this,r),await this.options.onSuccess?.(h,e,this.state.context,r),await this.#s.config.onSettled?.(h,null,this.state.variables,this.state.context,this,r),await this.options.onSettled?.(h,null,e,this.state.context,r),this.#a({type:"success",data:h}),h}catch(n){try{throw await this.#s.config.onError?.(n,e,this.state.context,this,r),await this.options.onError?.(n,e,this.state.context,r),await this.#s.config.onSettled?.(void 0,n,this.state.variables,this.state.context,this,r),await this.options.onSettled?.(void 0,n,e,this.state.context,r),n}finally{this.#a({type:"error",error:n})}}finally{this.#s.runNext(this)}}#a(e){this.state=(r=>{switch(e.type){case"failed":return{...r,failureCount:e.failureCount,failureReason:e.error};case"pause":return{...r,isPaused:!0};case"continue":return{...r,isPaused:!1};case"pending":return{...r,context:e.context,data:void 0,failureCount:0,failureReason:null,error:null,isPaused:e.isPaused,status:"pending",variables:e.variables,submittedAt:Date.now()};case"success":return{...r,data:e.data,failureCount:0,failureReason:null,error:null,status:"success",isPaused:!1};case"error":return{...r,data:void 0,error:e.error,failureCount:r.failureCount+1,failureReason:e.error,isPaused:!1,status:"error"}}})(this.state),c.Vr.batch(()=>{this.#e.forEach(r=>{r.onMutationUpdate(e)}),this.#s.notify({mutation:this,type:"updated",action:e})})}};function getDefaultState(){return{context:void 0,data:void 0,error:null,failureCount:0,failureReason:null,isPaused:!1,status:"idle",variables:void 0,submittedAt:0}}},3002:function(e,r,n){"use strict";n.d(r,{A:function(){return y},z:function(){return fetchState}});var c=n(300),h=n(7987),d=n(1640),f=n(9024),y=class extends f.F{#r;#n;#o;#t;#i;#u;#l;constructor(e){super(),this.#l=!1,this.#u=e.defaultOptions,this.setOptions(e.options),this.observers=[],this.#t=e.client,this.#o=this.#t.getQueryCache(),this.queryKey=e.queryKey,this.queryHash=e.queryHash,this.#r=getDefaultState(this.options),this.state=e.state??this.#r,this.scheduleGc()}get meta(){return this.options.meta}get promise(){return this.#i?.promise}setOptions(e){if(this.options={...this.#u,...e},this.updateGcTime(this.options.gcTime),this.state&&void 0===this.state.data){let e=getDefaultState(this.options);void 0!==e.data&&(this.setData(e.data,{updatedAt:e.dataUpdatedAt,manual:!0}),this.#r=e)}}optionalRemove(){this.observers.length||"idle"!==this.state.fetchStatus||this.#o.remove(this)}setData(e,r){let n=(0,c.oE)(this.state.data,e,this.options);return this.#a({data:n,type:"success",dataUpdatedAt:r?.updatedAt,manual:r?.manual}),n}setState(e,r){this.#a({type:"setState",state:e,setStateOptions:r})}cancel(e){let r=this.#i?.promise;return this.#i?.cancel(e),r?r.then(c.ZT).catch(c.ZT):Promise.resolve()}destroy(){super.destroy(),this.cancel({silent:!0})}reset(){this.destroy(),this.setState(this.#r)}isActive(){return this.observers.some(e=>!1!==(0,c.Nc)(e.options.enabled,this))}isDisabled(){return this.getObserversCount()>0?!this.isActive():this.options.queryFn===c.CN||this.state.dataUpdateCount+this.state.errorUpdateCount===0}isStatic(){return this.getObserversCount()>0&&this.observers.some(e=>"static"===(0,c.KC)(e.options.staleTime,this))}isStale(){return this.getObserversCount()>0?this.observers.some(e=>e.getCurrentResult().isStale):void 0===this.state.data||this.state.isInvalidated}isStaleByTime(e=0){return void 0===this.state.data||"static"!==e&&(!!this.state.isInvalidated||!(0,c.Kp)(this.state.dataUpdatedAt,e))}onFocus(){let e=this.observers.find(e=>e.shouldFetchOnWindowFocus());e?.refetch({cancelRefetch:!1}),this.#i?.continue()}onOnline(){let e=this.observers.find(e=>e.shouldFetchOnReconnect());e?.refetch({cancelRefetch:!1}),this.#i?.continue()}addObserver(e){this.observers.includes(e)||(this.observers.push(e),this.clearGcTimeout(),this.#o.notify({type:"observerAdded",query:this,observer:e}))}removeObserver(e){this.observers.includes(e)&&(this.observers=this.observers.filter(r=>r!==e),this.observers.length||(this.#i&&(this.#l?this.#i.cancel({revert:!0}):this.#i.cancelRetry()),this.scheduleGc()),this.#o.notify({type:"observerRemoved",query:this,observer:e}))}getObserversCount(){return this.observers.length}invalidate(){this.state.isInvalidated||this.#a({type:"invalidate"})}async fetch(e,r){if("idle"!==this.state.fetchStatus&&this.#i?.status()!=="rejected"){if(void 0!==this.state.data&&r?.cancelRefetch)this.cancel({silent:!0});else if(this.#i)return this.#i.continueRetry(),this.#i.promise}if(e&&this.setOptions(e),!this.options.queryFn){let e=this.observers.find(e=>e.options.queryFn);e&&this.setOptions(e.options)}let n=new AbortController,addSignalProperty=e=>{Object.defineProperty(e,"signal",{enumerable:!0,get:()=>(this.#l=!0,n.signal)})},fetchFn=()=>{let e=(0,c.cG)(this.options,r),n=(()=>{let e={client:this.#t,queryKey:this.queryKey,meta:this.meta};return addSignalProperty(e),e})();return(this.#l=!1,this.options.persister)?this.options.persister(e,n,this):e(n)},h=(()=>{let e={fetchOptions:r,options:this.options,queryKey:this.queryKey,client:this.#t,state:this.state,fetchFn};return addSignalProperty(e),e})();this.options.behavior?.onFetch(h,this),this.#n=this.state,("idle"===this.state.fetchStatus||this.state.fetchMeta!==h.fetchOptions?.meta)&&this.#a({type:"fetch",meta:h.fetchOptions?.meta}),this.#i=(0,d.Mz)({initialPromise:r?.initialPromise,fn:h.fetchFn,onCancel:e=>{e instanceof d.p8&&e.revert&&this.setState({...this.#n,fetchStatus:"idle"}),n.abort()},onFail:(e,r)=>{this.#a({type:"failed",failureCount:e,error:r})},onPause:()=>{this.#a({type:"pause"})},onContinue:()=>{this.#a({type:"continue"})},retry:h.options.retry,retryDelay:h.options.retryDelay,networkMode:h.options.networkMode,canRun:()=>!0});try{let e=await this.#i.start();if(void 0===e)throw Error(`${this.queryHash} data is undefined`);return this.setData(e),this.#o.config.onSuccess?.(e,this),this.#o.config.onSettled?.(e,this.state.error,this),e}catch(e){if(e instanceof d.p8){if(e.silent)return this.#i.promise;if(e.revert){if(void 0===this.state.data)throw e;return this.state.data}}throw this.#a({type:"error",error:e}),this.#o.config.onError?.(e,this),this.#o.config.onSettled?.(this.state.data,e,this),e}finally{this.scheduleGc()}}#a(e){this.state=(r=>{switch(e.type){case"failed":return{...r,fetchFailureCount:e.failureCount,fetchFailureReason:e.error};case"pause":return{...r,fetchStatus:"paused"};case"continue":return{...r,fetchStatus:"fetching"};case"fetch":return{...r,...fetchState(r.data,this.options),fetchMeta:e.meta??null};case"success":let n={...r,data:e.data,dataUpdateCount:r.dataUpdateCount+1,dataUpdatedAt:e.dataUpdatedAt??Date.now(),error:null,isInvalidated:!1,status:"success",...!e.manual&&{fetchStatus:"idle",fetchFailureCount:0,fetchFailureReason:null}};return this.#n=e.manual?n:void 0,n;case"error":let c=e.error;return{...r,error:c,errorUpdateCount:r.errorUpdateCount+1,errorUpdatedAt:Date.now(),fetchFailureCount:r.fetchFailureCount+1,fetchFailureReason:c,fetchStatus:"idle",status:"error"};case"invalidate":return{...r,isInvalidated:!0};case"setState":return{...r,...e.state}}})(this.state),h.Vr.batch(()=>{this.observers.forEach(e=>{e.onQueryUpdate()}),this.#o.notify({query:this,type:"updated",action:e})})}};function fetchState(e,r){return{fetchFailureCount:0,fetchFailureReason:null,fetchStatus:(0,d.Kw)(r.networkMode)?"fetching":"paused",...void 0===e&&{error:null,status:"pending"}}}function getDefaultState(e){let r="function"==typeof e.initialData?e.initialData():e.initialData,n=void 0!==r,c=n?"function"==typeof e.initialDataUpdatedAt?e.initialDataUpdatedAt():e.initialDataUpdatedAt:0;return{data:r,dataUpdateCount:0,dataUpdatedAt:n?c??Date.now():0,error:null,errorUpdateCount:0,errorUpdatedAt:0,fetchFailureCount:0,fetchFailureReason:null,fetchMeta:null,isInvalidated:!1,status:n?"success":"pending",fetchStatus:"idle"}}},8908:function(e,r,n){"use strict";n.d(r,{S:function(){return x}});var c=n(300),h=n(3002),d=n(7987),f=n(2996),y=class extends f.l{constructor(e={}){super(),this.config=e,this.#c=new Map}#c;build(e,r,n){let d=r.queryKey,f=r.queryHash??(0,c.Rm)(d,r),y=this.get(f);return y||(y=new h.A({client:e,queryKey:d,queryHash:f,options:e.defaultQueryOptions(r),state:n,defaultOptions:e.getQueryDefaults(d)}),this.add(y)),y}add(e){this.#c.has(e.queryHash)||(this.#c.set(e.queryHash,e),this.notify({type:"added",query:e}))}remove(e){let r=this.#c.get(e.queryHash);r&&(e.destroy(),r===e&&this.#c.delete(e.queryHash),this.notify({type:"removed",query:e}))}clear(){d.Vr.batch(()=>{this.getAll().forEach(e=>{this.remove(e)})})}get(e){return this.#c.get(e)}getAll(){return[...this.#c.values()]}find(e){let r={exact:!0,...e};return this.getAll().find(e=>(0,c._x)(r,e))}findAll(e={}){let r=this.getAll();return Object.keys(e).length>0?r.filter(r=>(0,c._x)(e,r)):r}notify(e){d.Vr.batch(()=>{this.listeners.forEach(r=>{r(e)})})}onFocus(){d.Vr.batch(()=>{this.getAll().forEach(e=>{e.onFocus()})})}onOnline(){d.Vr.batch(()=>{this.getAll().forEach(e=>{e.onOnline()})})}},g=n(7470),v=class extends f.l{constructor(e={}){super(),this.config=e,this.#h=new Set,this.#d=new Map,this.#p=0}#h;#d;#p;build(e,r,n){let c=new g.m({client:e,mutationCache:this,mutationId:++this.#p,options:e.defaultMutationOptions(r),state:n});return this.add(c),c}add(e){this.#h.add(e);let r=scopeFor(e);if("string"==typeof r){let n=this.#d.get(r);n?n.push(e):this.#d.set(r,[e])}this.notify({type:"added",mutation:e})}remove(e){if(this.#h.delete(e)){let r=scopeFor(e);if("string"==typeof r){let n=this.#d.get(r);if(n){if(n.length>1){let r=n.indexOf(e);-1!==r&&n.splice(r,1)}else n[0]===e&&this.#d.delete(r)}}}this.notify({type:"removed",mutation:e})}canRun(e){let r=scopeFor(e);if("string"!=typeof r)return!0;{let n=this.#d.get(r),c=n?.find(e=>"pending"===e.state.status);return!c||c===e}}runNext(e){let r=scopeFor(e);if("string"!=typeof r)return Promise.resolve();{let n=this.#d.get(r)?.find(r=>r!==e&&r.state.isPaused);return n?.continue()??Promise.resolve()}}clear(){d.Vr.batch(()=>{this.#h.forEach(e=>{this.notify({type:"removed",mutation:e})}),this.#h.clear(),this.#d.clear()})}getAll(){return Array.from(this.#h)}find(e){let r={exact:!0,...e};return this.getAll().find(e=>(0,c.X7)(r,e))}findAll(e={}){return this.getAll().filter(r=>(0,c.X7)(e,r))}notify(e){d.Vr.batch(()=>{this.listeners.forEach(r=>{r(e)})})}resumePausedMutations(){let e=this.getAll().filter(e=>e.state.isPaused);return d.Vr.batch(()=>Promise.all(e.map(e=>e.continue().catch(c.ZT))))}};function scopeFor(e){return e.options.scope?.id}var b=n(9198),C=n(436);function infiniteQueryBehavior(e){return{onFetch:(r,n)=>{let h=r.options,d=r.fetchOptions?.meta?.fetchMore?.direction,f=r.state.data?.pages||[],y=r.state.data?.pageParams||[],g={pages:[],pageParams:[]},v=0,fetchFn=async()=>{let n=!1,addSignalProperty=e=>{Object.defineProperty(e,"signal",{enumerable:!0,get:()=>(r.signal.aborted?n=!0:r.signal.addEventListener("abort",()=>{n=!0}),r.signal)})},b=(0,c.cG)(r.options,r.fetchOptions),fetchPage=async(e,h,d)=>{if(n)return Promise.reject();if(null==h&&e.pages.length)return Promise.resolve(e);let f=(()=>{let e={client:r.client,queryKey:r.queryKey,pageParam:h,direction:d?"backward":"forward",meta:r.options.meta};return addSignalProperty(e),e})(),y=await b(f),{maxPages:g}=r.options,v=d?c.Ht:c.VX;return{pages:v(e.pages,y,g),pageParams:v(e.pageParams,h,g)}};if(d&&f.length){let e="backward"===d,r=e?getPreviousPageParam:getNextPageParam,n={pages:f,pageParams:y},c=r(h,n);g=await fetchPage(n,c,e)}else{let r=e??f.length;do{let e=0===v?y[0]??h.initialPageParam:getNextPageParam(h,g);if(v>0&&null==e)break;g=await fetchPage(g,e),v++}while(v<r)}return g};r.options.persister?r.fetchFn=()=>r.options.persister?.(fetchFn,{client:r.client,queryKey:r.queryKey,meta:r.options.meta,signal:r.signal},n):r.fetchFn=fetchFn}}}function getNextPageParam(e,{pages:r,pageParams:n}){let c=r.length-1;return r.length>0?e.getNextPageParam(r[c],r,n[c],n):void 0}function getPreviousPageParam(e,{pages:r,pageParams:n}){return r.length>0?e.getPreviousPageParam?.(r[0],r,n[0],n):void 0}var x=class{#f;#s;#u;#y;#m;#g;#v;#b;constructor(e={}){this.#f=e.queryCache||new y,this.#s=e.mutationCache||new v,this.#u=e.defaultOptions||{},this.#y=new Map,this.#m=new Map,this.#g=0}mount(){this.#g++,1===this.#g&&(this.#v=b.j.subscribe(async e=>{e&&(await this.resumePausedMutations(),this.#f.onFocus())}),this.#b=C.N.subscribe(async e=>{e&&(await this.resumePausedMutations(),this.#f.onOnline())}))}unmount(){this.#g--,0===this.#g&&(this.#v?.(),this.#v=void 0,this.#b?.(),this.#b=void 0)}isFetching(e){return this.#f.findAll({...e,fetchStatus:"fetching"}).length}isMutating(e){return this.#s.findAll({...e,status:"pending"}).length}getQueryData(e){let r=this.defaultQueryOptions({queryKey:e});return this.#f.get(r.queryHash)?.state.data}ensureQueryData(e){let r=this.defaultQueryOptions(e),n=this.#f.build(this,r),h=n.state.data;return void 0===h?this.fetchQuery(e):(e.revalidateIfStale&&n.isStaleByTime((0,c.KC)(r.staleTime,n))&&this.prefetchQuery(r),Promise.resolve(h))}getQueriesData(e){return this.#f.findAll(e).map(({queryKey:e,state:r})=>{let n=r.data;return[e,n]})}setQueryData(e,r,n){let h=this.defaultQueryOptions({queryKey:e}),d=this.#f.get(h.queryHash),f=d?.state.data,y=(0,c.SE)(r,f);if(void 0!==y)return this.#f.build(this,h).setData(y,{...n,manual:!0})}setQueriesData(e,r,n){return d.Vr.batch(()=>this.#f.findAll(e).map(({queryKey:e})=>[e,this.setQueryData(e,r,n)]))}getQueryState(e){let r=this.defaultQueryOptions({queryKey:e});return this.#f.get(r.queryHash)?.state}removeQueries(e){let r=this.#f;d.Vr.batch(()=>{r.findAll(e).forEach(e=>{r.remove(e)})})}resetQueries(e,r){let n=this.#f;return d.Vr.batch(()=>(n.findAll(e).forEach(e=>{e.reset()}),this.refetchQueries({type:"active",...e},r)))}cancelQueries(e,r={}){let n={revert:!0,...r},h=d.Vr.batch(()=>this.#f.findAll(e).map(e=>e.cancel(n)));return Promise.all(h).then(c.ZT).catch(c.ZT)}invalidateQueries(e,r={}){return d.Vr.batch(()=>(this.#f.findAll(e).forEach(e=>{e.invalidate()}),e?.refetchType==="none")?Promise.resolve():this.refetchQueries({...e,type:e?.refetchType??e?.type??"active"},r))}refetchQueries(e,r={}){let n={...r,cancelRefetch:r.cancelRefetch??!0},h=d.Vr.batch(()=>this.#f.findAll(e).filter(e=>!e.isDisabled()&&!e.isStatic()).map(e=>{let r=e.fetch(void 0,n);return n.throwOnError||(r=r.catch(c.ZT)),"paused"===e.state.fetchStatus?Promise.resolve():r}));return Promise.all(h).then(c.ZT)}fetchQuery(e){let r=this.defaultQueryOptions(e);void 0===r.retry&&(r.retry=!1);let n=this.#f.build(this,r);return n.isStaleByTime((0,c.KC)(r.staleTime,n))?n.fetch(r):Promise.resolve(n.state.data)}prefetchQuery(e){return this.fetchQuery(e).then(c.ZT).catch(c.ZT)}fetchInfiniteQuery(e){return e.behavior=infiniteQueryBehavior(e.pages),this.fetchQuery(e)}prefetchInfiniteQuery(e){return this.fetchInfiniteQuery(e).then(c.ZT).catch(c.ZT)}ensureInfiniteQueryData(e){return e.behavior=infiniteQueryBehavior(e.pages),this.ensureQueryData(e)}resumePausedMutations(){return C.N.isOnline()?this.#s.resumePausedMutations():Promise.resolve()}getQueryCache(){return this.#f}getMutationCache(){return this.#s}getDefaultOptions(){return this.#u}setDefaultOptions(e){this.#u=e}setQueryDefaults(e,r){this.#y.set((0,c.Ym)(e),{queryKey:e,defaultOptions:r})}getQueryDefaults(e){let r=[...this.#y.values()],n={};return r.forEach(r=>{(0,c.to)(e,r.queryKey)&&Object.assign(n,r.defaultOptions)}),n}setMutationDefaults(e,r){this.#m.set((0,c.Ym)(e),{mutationKey:e,defaultOptions:r})}getMutationDefaults(e){let r=[...this.#m.values()],n={};return r.forEach(r=>{(0,c.to)(e,r.mutationKey)&&Object.assign(n,r.defaultOptions)}),n}defaultQueryOptions(e){if(e._defaulted)return e;let r={...this.#u.queries,...this.getQueryDefaults(e.queryKey),...e,_defaulted:!0};return r.queryHash||(r.queryHash=(0,c.Rm)(r.queryKey,r)),void 0===r.refetchOnReconnect&&(r.refetchOnReconnect="always"!==r.networkMode),void 0===r.throwOnError&&(r.throwOnError=!!r.suspense),!r.networkMode&&r.persister&&(r.networkMode="offlineFirst"),r.queryFn===c.CN&&(r.enabled=!1),r}defaultMutationOptions(e){return e?._defaulted?e:{...this.#u.mutations,...e?.mutationKey&&this.getMutationDefaults(e.mutationKey),...e,_defaulted:!0}}clear(){this.#f.clear(),this.#s.clear()}}},5925:function(e,r,n){"use strict";let c,h;n.d(r,{x7:function(){return Fe},ZP:function(){return to},Am:function(){return dist_n}});var d=n(2265);let f={data:""},t=e=>"object"==typeof window?((e?e.querySelector("#_goober"):window._goober)||Object.assign((e||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:e||f,y=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,g=/\/\*[^]*?\*\/|  +/g,v=/\n+/g,o=(e,r)=>{let n="",c="",h="";for(let d in e){let f=e[d];"@"==d[0]?"i"==d[1]?n=d+" "+f+";":c+="f"==d[1]?o(f,d):d+"{"+o(f,"k"==d[1]?"":r)+"}":"object"==typeof f?c+=o(f,r?r.replace(/([^,])+/g,e=>d.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,r=>/&/.test(r)?r.replace(/&/g,e):e?e+" "+r:r)):d):null!=f&&(d=/^--/.test(d)?d:d.replace(/[A-Z]/g,"-$&").toLowerCase(),h+=o.p?o.p(d,f):d+":"+f+";")}return n+(r&&h?r+"{"+h+"}":h)+c},b={},s=e=>{if("object"==typeof e){let r="";for(let n in e)r+=n+s(e[n]);return r}return e},i=(e,r,n,c,h)=>{var d;let f=s(e),C=b[f]||(b[f]=(e=>{let r=0,n=11;for(;r<e.length;)n=101*n+e.charCodeAt(r++)>>>0;return"go"+n})(f));if(!b[C]){let r=f!==e?e:(e=>{let r,n,c=[{}];for(;r=y.exec(e.replace(g,""));)r[4]?c.shift():r[3]?(n=r[3].replace(v," ").trim(),c.unshift(c[0][n]=c[0][n]||{})):c[0][r[1]]=r[2].replace(v," ").trim();return c[0]})(e);b[C]=o(h?{["@keyframes "+C]:r}:r,n?"":"."+C)}let x=n&&b.g?b.g:null;return n&&(b.g=b[C]),d=b[C],x?r.data=r.data.replace(x,d):-1===r.data.indexOf(d)&&(r.data=c?d+r.data:r.data+d),C},p=(e,r,n)=>e.reduce((e,c,h)=>{let d=r[h];if(d&&d.call){let e=d(n),r=e&&e.props&&e.props.className||/^go/.test(e)&&e;d=r?"."+r:e&&"object"==typeof e?e.props?"":o(e,""):!1===e?"":e}return e+c+(null==d?"":d)},"");function u(e){let r=this||{},n=e.call?e(r.p):e;return i(n.unshift?n.raw?p(n,[].slice.call(arguments,1),r.p):n.reduce((e,n)=>Object.assign(e,n&&n.call?n(r.p):n),{}):n,t(r.target),r.g,r.o,r.k)}u.bind({g:1});let C,x,O,D=u.bind({k:1});function m(e,r,n,c){o.p=r,C=e,x=n,O=c}function j(e,r){let n=this||{};return function(){let c=arguments;function a(h,d){let f=Object.assign({},h),y=f.className||a.className;n.p=Object.assign({theme:x&&x()},f),n.o=/ *go\d+/.test(y),f.className=u.apply(n,c)+(y?" "+y:""),r&&(f.ref=d);let g=e;return e[0]&&(g=f.as||e,delete f.as),O&&g[0]&&O(f),C(g,f)}return r?r(a):a}}var Z=e=>"function"==typeof e,dist_h=(e,r)=>Z(e)?e(r):e,F=(c=0,()=>(++c).toString()),E=()=>{if(void 0===h&&"u">typeof window){let e=matchMedia("(prefers-reduced-motion: reduce)");h=!e||e.matches}return h},A="default",H=(e,r)=>{let{toastLimit:n}=e.settings;switch(r.type){case 0:return{...e,toasts:[r.toast,...e.toasts].slice(0,n)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===r.toast.id?{...e,...r.toast}:e)};case 2:let{toast:c}=r;return H(e,{type:e.toasts.find(e=>e.id===c.id)?1:0,toast:c});case 3:let{toastId:h}=r;return{...e,toasts:e.toasts.map(e=>e.id===h||void 0===h?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===r.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==r.toastId)};case 5:return{...e,pausedAt:r.time};case 6:let d=r.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+d}))}}},k=[],R={toasts:[],pausedAt:void 0,settings:{toastLimit:20}},M={},Y=(e,r=A)=>{M[r]=H(M[r]||R,e),k.forEach(([e,n])=>{e===r&&n(M[r])})},_=e=>Object.keys(M).forEach(r=>Y(e,r)),Q=e=>Object.keys(M).find(r=>M[r].toasts.some(r=>r.id===e)),S=(e=A)=>r=>{Y(r,e)},T={blank:4e3,error:4e3,success:2e3,loading:1/0,custom:4e3},V=(e={},r=A)=>{let[n,c]=(0,d.useState)(M[r]||R),h=(0,d.useRef)(M[r]);(0,d.useEffect)(()=>(h.current!==M[r]&&c(M[r]),k.push([r,c]),()=>{let e=k.findIndex(([e])=>e===r);e>-1&&k.splice(e,1)}),[r]);let f=n.toasts.map(r=>{var n,c,h;return{...e,...e[r.type],...r,removeDelay:r.removeDelay||(null==(n=e[r.type])?void 0:n.removeDelay)||(null==e?void 0:e.removeDelay),duration:r.duration||(null==(c=e[r.type])?void 0:c.duration)||(null==e?void 0:e.duration)||T[r.type],style:{...e.style,...null==(h=e[r.type])?void 0:h.style,...r.style}}});return{...n,toasts:f}},ie=(e,r="blank",n)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:r,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...n,id:(null==n?void 0:n.id)||F()}),P=e=>(r,n)=>{let c=ie(r,e,n);return S(c.toasterId||Q(c.id))({type:2,toast:c}),c.id},dist_n=(e,r)=>P("blank")(e,r);dist_n.error=P("error"),dist_n.success=P("success"),dist_n.loading=P("loading"),dist_n.custom=P("custom"),dist_n.dismiss=(e,r)=>{let n={type:3,toastId:e};r?S(r)(n):_(n)},dist_n.dismissAll=e=>dist_n.dismiss(void 0,e),dist_n.remove=(e,r)=>{let n={type:4,toastId:e};r?S(r)(n):_(n)},dist_n.removeAll=e=>dist_n.remove(void 0,e),dist_n.promise=(e,r,n)=>{let c=dist_n.loading(r.loading,{...n,...null==n?void 0:n.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let h=r.success?dist_h(r.success,e):void 0;return h?dist_n.success(h,{id:c,...n,...null==n?void 0:n.success}):dist_n.dismiss(c),e}).catch(e=>{let h=r.error?dist_h(r.error,e):void 0;h?dist_n.error(h,{id:c,...n,...null==n?void 0:n.error}):dist_n.dismiss(c)}),e};var I=1e3,w=(e,r="default")=>{let{toasts:n,pausedAt:c}=V(e,r),h=(0,d.useRef)(new Map).current,f=(0,d.useCallback)((e,r=I)=>{if(h.has(e))return;let n=setTimeout(()=>{h.delete(e),y({type:4,toastId:e})},r);h.set(e,n)},[]);(0,d.useEffect)(()=>{if(c)return;let e=Date.now(),h=n.map(n=>{if(n.duration===1/0)return;let c=(n.duration||0)+n.pauseDuration-(e-n.createdAt);if(c<0){n.visible&&dist_n.dismiss(n.id);return}return setTimeout(()=>dist_n.dismiss(n.id,r),c)});return()=>{h.forEach(e=>e&&clearTimeout(e))}},[n,c,r]);let y=(0,d.useCallback)(S(r),[r]),g=(0,d.useCallback)(()=>{y({type:5,time:Date.now()})},[y]),v=(0,d.useCallback)((e,r)=>{y({type:1,toast:{id:e,height:r}})},[y]),b=(0,d.useCallback)(()=>{c&&y({type:6,time:Date.now()})},[c,y]),C=(0,d.useCallback)((e,r)=>{let{reverseOrder:c=!1,gutter:h=8,defaultPosition:d}=r||{},f=n.filter(r=>(r.position||d)===(e.position||d)&&r.height),y=f.findIndex(r=>r.id===e.id),g=f.filter((e,r)=>r<y&&e.visible).length;return f.filter(e=>e.visible).slice(...c?[g+1]:[0,g]).reduce((e,r)=>e+(r.height||0)+h,0)},[n]);return(0,d.useEffect)(()=>{n.forEach(e=>{if(e.dismissed)f(e.id,e.removeDelay);else{let r=h.get(e.id);r&&(clearTimeout(r),h.delete(e.id))}})},[n,f]),{toasts:n,handlers:{updateHeight:v,startPause:g,endPause:b,calculateOffset:C}}},N=D`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,U=D`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,K=D`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,z=j("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${N} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${U} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${e=>e.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${K} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,G=D`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,L=j("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${G} 1s linear infinite;
`,B=D`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,X=D`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,W=j("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${B} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${X} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${e=>e.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,J=j("div")`
  position: absolute;
`,tt=j("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,te=D`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,ts=j("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${te} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,$=({toast:e})=>{let{icon:r,type:n,iconTheme:c}=e;return void 0!==r?"string"==typeof r?d.createElement(ts,null,r):r:"blank"===n?null:d.createElement(tt,null,d.createElement(L,{...c}),"loading"!==n&&d.createElement(J,null,"error"===n?d.createElement(z,{...c}):d.createElement(W,{...c})))},Re=e=>`
0% {transform: translate3d(0,${-200*e}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,Ee=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*e}%,-1px) scale(.6); opacity:0;}
`,ti=j("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,ta=j("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,ke=(e,r)=>{let n=e.includes("top")?1:-1,[c,h]=E()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[Re(n),Ee(n)];return{animation:r?`${D(c)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${D(h)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}},tr=d.memo(({toast:e,position:r,style:n,children:c})=>{let h=e.height?ke(e.position||r||"top-center",e.visible):{opacity:0},f=d.createElement($,{toast:e}),y=d.createElement(ta,{...e.ariaProps},dist_h(e.message,e));return d.createElement(ti,{className:e.className,style:{...h,...n,...e.style}},"function"==typeof c?c({icon:f,message:y}):d.createElement(d.Fragment,null,f,y))});m(d.createElement);var we=({id:e,className:r,style:n,onHeightUpdate:c,children:h})=>{let f=d.useCallback(r=>{if(r){let l=()=>{c(e,r.getBoundingClientRect().height)};l(),new MutationObserver(l).observe(r,{subtree:!0,childList:!0,characterData:!0})}},[e,c]);return d.createElement("div",{ref:f,className:r,style:n},h)},Me=(e,r)=>{let n=e.includes("top"),c=e.includes("center")?{justifyContent:"center"}:e.includes("right")?{justifyContent:"flex-end"}:{};return{left:0,right:0,display:"flex",position:"absolute",transition:E()?void 0:"all 230ms cubic-bezier(.21,1.02,.73,1)",transform:`translateY(${r*(n?1:-1)}px)`,...n?{top:0}:{bottom:0},...c}},tn=u`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`,Fe=({reverseOrder:e,position:r="top-center",toastOptions:n,gutter:c,children:h,toasterId:f,containerStyle:y,containerClassName:g})=>{let{toasts:v,handlers:b}=w(n,f);return d.createElement("div",{"data-rht-toaster":f||"",style:{position:"fixed",zIndex:9999,top:16,left:16,right:16,bottom:16,pointerEvents:"none",...y},className:g,onMouseEnter:b.startPause,onMouseLeave:b.endPause},v.map(n=>{let f=n.position||r,y=Me(f,b.calculateOffset(n,{reverseOrder:e,gutter:c,defaultPosition:r}));return d.createElement(we,{id:n.id,key:n.id,onHeightUpdate:b.updateHeight,className:n.visible?tn:"",style:y},"custom"===n.type?dist_h(n.message,n):h?h(n):d.createElement(tr,{toast:n,position:f}))}))},to=dist_n}}]);