(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[988],{3008:function(e,r,l){"use strict";l.d(r,{Z:function(){return d}});var n=l(2898);let d=(0,n.Z)("CheckCircle",[["path",{d:"M22 11.08V12a10 10 0 1 1-5.93-9.14",key:"g774vq"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]])},6245:function(e,r,l){"use strict";l.d(r,{Z:function(){return d}});var n=l(2898);let d=(0,n.Z)("Save",[["path",{d:"M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z",key:"1owoqh"}],["polyline",{points:"17 21 17 13 7 13 7 21",key:"1md35c"}],["polyline",{points:"7 3 7 8 15 8",key:"8nz8an"}]])},5717:function(e,r,l){Promise.resolve().then(l.bind(l,4353))},4353:function(e,r,l){"use strict";l.r(r),l.d(r,{default:function(){return IntegrationsPage}});var n=l(7437),d=l(2265),c=l(9906),x=l(609),h=l(3089),f=l(1735),g=l(6582),y=l(6429),v=l(5243),b=l(2898);let N=(0,b.Z)("Bot",[["path",{d:"M12 8V4H8",key:"hb8ula"}],["rect",{width:"16",height:"12",x:"4",y:"8",rx:"2",key:"enze0r"}],["path",{d:"M2 14h2",key:"vft8re"}],["path",{d:"M20 14h2",key:"4cs60a"}],["path",{d:"M15 13v2",key:"1xurst"}],["path",{d:"M9 13v2",key:"rq6x2g"}]]),w=(0,b.Z)("MessageSquare",[["path",{d:"M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",key:"1lielz"}]]),k=(0,b.Z)("GitCommitHorizontal",[["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}],["line",{x1:"3",x2:"9",y1:"12",y2:"12",key:"1dyftd"}],["line",{x1:"15",x2:"21",y1:"12",y2:"12",key:"oup4p8"}]]);var C=l(2369);let z=(0,b.Z)("Languages",[["path",{d:"m5 8 6 6",key:"1wu5hv"}],["path",{d:"m4 14 6-6 2-3",key:"1k1g8d"}],["path",{d:"M2 5h12",key:"or177f"}],["path",{d:"M7 2h1",key:"1t2jsx"}],["path",{d:"m22 22-5-10-5 10",key:"don7ne"}],["path",{d:"M14 18h6",key:"1m8k6r"}]]);var F=l(7444),M=l(6245),I=l(9409),A=l(3008),B=l(5925);let T=[{value:"grok",label:"Grok",description:"Modelo avan\xe7ado para racioc\xednio complexo"},{value:"claude",label:"Claude",description:"Modelo confi\xe1vel para an\xe1lise e escrita"}];function IntegrationsPage(){let e=(0,v.Q)(),[r,l]=(0,d.useState)(""),[b,V]=(0,d.useState)(""),[O,L]=(0,d.useState)(""),[R,D]=(0,d.useState)(""),[q,G]=(0,d.useState)(""),[W,J]=(0,d.useState)("/bin/bash"),[K,U]=(0,d.useState)("/home/user"),[X,ee]=(0,d.useState)("dark"),[es,et]=(0,d.useState)("14"),[ea,er]=(0,d.useState)("monospace"),[el,en]=(0,d.useState)(!1),handleSave=async()=>{en(!0);try{await new Promise(e=>setTimeout(e,1e3));let e={ai:{prompts:r,commits:b,promptImprovement:O,translation:R,commands:q},terminal:{defaultShell:W,workingDirectory:K,terminalTheme:X,fontSize:parseInt(es),fontFamily:ea}};console.log("Configura\xe7\xf5es de IA salvas:",e),B.Am.success("Configura\xe7\xf5es de IA salvas com sucesso!")}catch(e){B.Am.error("Erro ao salvar configura\xe7\xf5es")}finally{en(!1)}};return e?(0,n.jsx)(c.Z,{breadcrumbs:[{label:"Integra\xe7\xf5es",current:!0}],children:(0,n.jsxs)("div",{className:"space-y-6",children:[(0,n.jsx)("div",{className:"flex items-center justify-between",children:(0,n.jsxs)("div",{children:[(0,n.jsx)("h1",{className:"text-3xl font-bold text-foreground",children:"Integra\xe7\xf5es"}),(0,n.jsx)("p",{className:"text-muted-foreground",children:"Configure integra\xe7\xf5es com servi\xe7os externos e modelos de IA"})]})}),(0,n.jsxs)(x.Zb,{children:[(0,n.jsxs)(x.Ol,{children:[(0,n.jsxs)(x.ll,{className:"flex items-center gap-2",children:[(0,n.jsx)(N,{className:"h-5 w-5 text-blue-500"}),"Configura\xe7\xe3o de Modelos de IA"]}),(0,n.jsx)("p",{className:"text-sm text-muted-foreground",children:"Selecione os modelos de IA para diferentes casos de uso no sistema"})]}),(0,n.jsxs)(x.aY,{className:"space-y-6",children:[(0,n.jsxs)("div",{className:"grid gap-6 md:grid-cols-2 lg:grid-cols-3",children:[(0,n.jsxs)("div",{className:"space-y-3",children:[(0,n.jsxs)("div",{className:"flex items-center gap-2",children:[(0,n.jsx)(w,{className:"h-4 w-4 text-green-500"}),(0,n.jsx)(y._,{htmlFor:"prompts-model",className:"text-sm font-medium",children:"Prompts Gerais"})]}),(0,n.jsx)("p",{className:"text-xs text-muted-foreground",children:"Modelo usado para processamento geral de prompts e an\xe1lises"}),(0,n.jsxs)(f.Ph,{value:r,onValueChange:l,children:[(0,n.jsx)(f.i4,{children:(0,n.jsx)(f.ki,{placeholder:"Selecione um modelo"})}),(0,n.jsx)(f.Bw,{children:T.map(e=>(0,n.jsx)(f.Ql,{value:e.value,children:(0,n.jsxs)("div",{className:"flex flex-col",children:[(0,n.jsx)("span",{className:"font-medium",children:e.label}),(0,n.jsx)("span",{className:"text-xs text-muted-foreground",children:e.description})]})},e.value))})]})]}),(0,n.jsxs)("div",{className:"space-y-3",children:[(0,n.jsxs)("div",{className:"flex items-center gap-2",children:[(0,n.jsx)(k,{className:"h-4 w-4 text-purple-500"}),(0,n.jsx)(y._,{htmlFor:"commits-model",className:"text-sm font-medium",children:"Gera\xe7\xe3o de Commits"})]}),(0,n.jsx)("p",{className:"text-xs text-muted-foreground",children:"Modelo usado para gerar mensagens de commit autom\xe1ticas"}),(0,n.jsxs)(f.Ph,{value:b,onValueChange:V,children:[(0,n.jsx)(f.i4,{children:(0,n.jsx)(f.ki,{placeholder:"Selecione um modelo"})}),(0,n.jsx)(f.Bw,{children:T.map(e=>(0,n.jsx)(f.Ql,{value:e.value,children:(0,n.jsxs)("div",{className:"flex flex-col",children:[(0,n.jsx)("span",{className:"font-medium",children:e.label}),(0,n.jsx)("span",{className:"text-xs text-muted-foreground",children:e.description})]})},e.value))})]})]}),(0,n.jsxs)("div",{className:"space-y-3",children:[(0,n.jsxs)("div",{className:"flex items-center gap-2",children:[(0,n.jsx)(C.Z,{className:"h-4 w-4 text-yellow-500"}),(0,n.jsx)(y._,{htmlFor:"improvement-model",className:"text-sm font-medium",children:"Melhoria de Prompts"})]}),(0,n.jsx)("p",{className:"text-xs text-muted-foreground",children:"Modelo usado para otimizar e melhorar prompts existentes"}),(0,n.jsxs)(f.Ph,{value:O,onValueChange:L,children:[(0,n.jsx)(f.i4,{children:(0,n.jsx)(f.ki,{placeholder:"Selecione um modelo"})}),(0,n.jsx)(f.Bw,{children:T.map(e=>(0,n.jsx)(f.Ql,{value:e.value,children:(0,n.jsxs)("div",{className:"flex flex-col",children:[(0,n.jsx)("span",{className:"font-medium",children:e.label}),(0,n.jsx)("span",{className:"text-xs text-muted-foreground",children:e.description})]})},e.value))})]})]}),(0,n.jsxs)("div",{className:"space-y-3",children:[(0,n.jsxs)("div",{className:"flex items-center gap-2",children:[(0,n.jsx)(z,{className:"h-4 w-4 text-orange-500"}),(0,n.jsx)(y._,{htmlFor:"translation-model",className:"text-sm font-medium",children:"Tradu\xe7\xe3o de Prompts"})]}),(0,n.jsx)("p",{className:"text-xs text-muted-foreground",children:"Modelo usado para traduzir prompts entre idiomas"}),(0,n.jsxs)(f.Ph,{value:R,onValueChange:D,children:[(0,n.jsx)(f.i4,{children:(0,n.jsx)(f.ki,{placeholder:"Selecione um modelo"})}),(0,n.jsx)(f.Bw,{children:T.map(e=>(0,n.jsx)(f.Ql,{value:e.value,children:(0,n.jsxs)("div",{className:"flex flex-col",children:[(0,n.jsx)("span",{className:"font-medium",children:e.label}),(0,n.jsx)("span",{className:"text-xs text-muted-foreground",children:e.description})]})},e.value))})]})]}),(0,n.jsxs)("div",{className:"space-y-3",children:[(0,n.jsxs)("div",{className:"flex items-center gap-2",children:[(0,n.jsx)(F.Z,{className:"h-4 w-4 text-blue-500"}),(0,n.jsx)(y._,{htmlFor:"commands-model",className:"text-sm font-medium",children:"Gera\xe7\xe3o de Comandos"})]}),(0,n.jsx)("p",{className:"text-xs text-muted-foreground",children:"Modelo usado para gerar e interpretar comandos automatizados"}),(0,n.jsxs)(f.Ph,{value:q,onValueChange:G,children:[(0,n.jsx)(f.i4,{children:(0,n.jsx)(f.ki,{placeholder:"Selecione um modelo"})}),(0,n.jsx)(f.Bw,{children:T.map(e=>(0,n.jsx)(f.Ql,{value:e.value,children:(0,n.jsxs)("div",{className:"flex flex-col",children:[(0,n.jsx)("span",{className:"font-medium",children:e.label}),(0,n.jsx)("span",{className:"text-xs text-muted-foreground",children:e.description})]})},e.value))})]})]})]}),(0,n.jsx)("div",{className:"flex justify-end pt-4 border-t border-border",children:(0,n.jsx)(h.z,{onClick:handleSave,disabled:el,className:"flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90",children:el?(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)("div",{className:"animate-spin rounded-full h-4 w-4 border-b-2 border-white"}),"Salvando..."]}):(0,n.jsxs)(n.Fragment,{children:[(0,n.jsx)(M.Z,{className:"h-4 w-4"}),"Salvar Configura\xe7\xf5es"]})})})]})]}),(0,n.jsxs)(x.Zb,{children:[(0,n.jsxs)(x.Ol,{children:[(0,n.jsxs)(x.ll,{className:"flex items-center gap-2",children:[(0,n.jsx)(I.Z,{className:"h-5 w-5 text-purple-500"}),"Configura\xe7\xf5es do Terminal"]}),(0,n.jsx)("p",{className:"text-sm text-muted-foreground",children:"Configure o shell padr\xe3o e personaliza\xe7\xe3o do terminal SSH"})]}),(0,n.jsx)(x.aY,{className:"space-y-6",children:(0,n.jsxs)("div",{className:"grid gap-6 md:grid-cols-2",children:[(0,n.jsxs)("div",{className:"space-y-3",children:[(0,n.jsx)(y._,{htmlFor:"default-shell",className:"text-sm font-medium",children:"Shell Padr\xe3o"}),(0,n.jsxs)(f.Ph,{value:W,onValueChange:J,children:[(0,n.jsx)(f.i4,{children:(0,n.jsx)(f.ki,{placeholder:"Selecione o shell"})}),(0,n.jsxs)(f.Bw,{children:[(0,n.jsx)(f.Ql,{value:"/bin/bash",children:(0,n.jsxs)("div",{className:"flex flex-col",children:[(0,n.jsx)("span",{className:"font-medium",children:"Bash"}),(0,n.jsx)("span",{className:"text-xs text-muted-foreground",children:"/bin/bash"})]})}),(0,n.jsx)(f.Ql,{value:"/bin/zsh",children:(0,n.jsxs)("div",{className:"flex flex-col",children:[(0,n.jsx)("span",{className:"font-medium",children:"Zsh"}),(0,n.jsx)("span",{className:"text-xs text-muted-foreground",children:"/bin/zsh"})]})}),(0,n.jsx)(f.Ql,{value:"/bin/sh",children:(0,n.jsxs)("div",{className:"flex flex-col",children:[(0,n.jsx)("span",{className:"font-medium",children:"Shell"}),(0,n.jsx)("span",{className:"text-xs text-muted-foreground",children:"/bin/sh"})]})}),(0,n.jsx)(f.Ql,{value:"/bin/fish",children:(0,n.jsxs)("div",{className:"flex flex-col",children:[(0,n.jsx)("span",{className:"font-medium",children:"Fish"}),(0,n.jsx)("span",{className:"text-xs text-muted-foreground",children:"/bin/fish"})]})})]})]})]}),(0,n.jsxs)("div",{className:"space-y-3",children:[(0,n.jsx)(y._,{htmlFor:"working-directory",className:"text-sm font-medium",children:"Diret\xf3rio de Trabalho"}),(0,n.jsx)(g.I,{id:"working-directory",value:K,onChange:e=>U(e.target.value),placeholder:"/home/user",className:"font-mono text-sm"})]}),(0,n.jsxs)("div",{className:"space-y-3",children:[(0,n.jsx)(y._,{htmlFor:"terminal-theme",className:"text-sm font-medium",children:"Tema do Terminal"}),(0,n.jsxs)(f.Ph,{value:X,onValueChange:ee,children:[(0,n.jsx)(f.i4,{children:(0,n.jsx)(f.ki,{placeholder:"Selecione o tema"})}),(0,n.jsxs)(f.Bw,{children:[(0,n.jsx)(f.Ql,{value:"dark",children:(0,n.jsxs)("div",{className:"flex flex-col",children:[(0,n.jsx)("span",{className:"font-medium",children:"Escuro"}),(0,n.jsx)("span",{className:"text-xs text-muted-foreground",children:"Tema escuro padr\xe3o"})]})}),(0,n.jsx)(f.Ql,{value:"light",children:(0,n.jsxs)("div",{className:"flex flex-col",children:[(0,n.jsx)("span",{className:"font-medium",children:"Claro"}),(0,n.jsx)("span",{className:"text-xs text-muted-foreground",children:"Tema claro"})]})}),(0,n.jsx)(f.Ql,{value:"monokai",children:(0,n.jsxs)("div",{className:"flex flex-col",children:[(0,n.jsx)("span",{className:"font-medium",children:"Monokai"}),(0,n.jsx)("span",{className:"text-xs text-muted-foreground",children:"Tema Monokai colorido"})]})})]})]})]}),(0,n.jsxs)("div",{className:"space-y-3",children:[(0,n.jsx)(y._,{htmlFor:"font-size",className:"text-sm font-medium",children:"Tamanho da Fonte"}),(0,n.jsxs)(f.Ph,{value:es,onValueChange:et,children:[(0,n.jsx)(f.i4,{children:(0,n.jsx)(f.ki,{placeholder:"Tamanho"})}),(0,n.jsxs)(f.Bw,{children:[(0,n.jsx)(f.Ql,{value:"12",children:"12px"}),(0,n.jsx)(f.Ql,{value:"14",children:"14px"}),(0,n.jsx)(f.Ql,{value:"16",children:"16px"}),(0,n.jsx)(f.Ql,{value:"18",children:"18px"}),(0,n.jsx)(f.Ql,{value:"20",children:"20px"})]})]})]}),(0,n.jsxs)("div",{className:"space-y-3 md:col-span-2",children:[(0,n.jsx)(y._,{htmlFor:"font-family",className:"text-sm font-medium",children:"Fam\xedlia da Fonte"}),(0,n.jsxs)(f.Ph,{value:ea,onValueChange:er,children:[(0,n.jsx)(f.i4,{children:(0,n.jsx)(f.ki,{placeholder:"Selecione a fonte"})}),(0,n.jsxs)(f.Bw,{children:[(0,n.jsx)(f.Ql,{value:"monospace",children:(0,n.jsxs)("div",{className:"flex flex-col",children:[(0,n.jsx)("span",{className:"font-medium",children:"Monospace"}),(0,n.jsx)("span",{className:"text-xs text-muted-foreground",children:"Fonte monoespa\xe7ada padr\xe3o"})]})}),(0,n.jsx)(f.Ql,{value:"'Fira Code', monospace",children:(0,n.jsxs)("div",{className:"flex flex-col",children:[(0,n.jsx)("span",{className:"font-medium",children:"Fira Code"}),(0,n.jsx)("span",{className:"text-xs text-muted-foreground",children:"Fonte com ligatures"})]})}),(0,n.jsx)(f.Ql,{value:"'JetBrains Mono', monospace",children:(0,n.jsxs)("div",{className:"flex flex-col",children:[(0,n.jsx)("span",{className:"font-medium",children:"JetBrains Mono"}),(0,n.jsx)("span",{className:"text-xs text-muted-foreground",children:"Fonte otimizada para c\xf3digo"})]})}),(0,n.jsx)(f.Ql,{value:"'Source Code Pro', monospace",children:(0,n.jsxs)("div",{className:"flex flex-col",children:[(0,n.jsx)("span",{className:"font-medium",children:"Source Code Pro"}),(0,n.jsx)("span",{className:"text-xs text-muted-foreground",children:"Fonte Adobe"})]})})]})]})]})]})})]}),(0,n.jsxs)(x.Zb,{children:[(0,n.jsx)(x.Ol,{children:(0,n.jsxs)(x.ll,{className:"flex items-center gap-2",children:[(0,n.jsx)(A.Z,{className:"h-5 w-5 text-green-500"}),"Status das Integra\xe7\xf5es"]})}),(0,n.jsx)(x.aY,{children:(0,n.jsxs)("div",{className:"grid gap-4 md:grid-cols-2",children:[(0,n.jsxs)("div",{className:"flex items-center justify-between p-3 bg-muted/50 rounded-lg",children:[(0,n.jsxs)("div",{className:"flex items-center gap-3",children:[(0,n.jsx)("div",{className:"w-2 h-2 bg-green-500 rounded-full"}),(0,n.jsx)("span",{className:"text-sm font-medium",children:"API de IA"})]}),(0,n.jsx)("span",{className:"text-xs text-green-600 font-medium",children:"Conectado"})]}),(0,n.jsxs)("div",{className:"flex items-center justify-between p-3 bg-muted/50 rounded-lg",children:[(0,n.jsxs)("div",{className:"flex items-center gap-3",children:[(0,n.jsx)("div",{className:"w-2 h-2 bg-yellow-500 rounded-full"}),(0,n.jsx)("span",{className:"text-sm font-medium",children:"Webhook Integration"})]}),(0,n.jsx)("span",{className:"text-xs text-yellow-600 font-medium",children:"Configurando"})]})]})})]})]})}):null}},3089:function(e,r,l){"use strict";l.d(r,{z:function(){return x}});var n=l(7437),d=l(2265),c=l(345);let x=(0,d.forwardRef)((e,r)=>{let{className:l,variant:d="default",size:x="default",...h}=e;return(0,n.jsx)("button",{className:(0,c.cn)("inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",{default:"bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400",destructive:"bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400",outline:"border border-gray-300 bg-transparent text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800",secondary:"bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700",ghost:"bg-transparent text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"}[d],{default:"px-4 py-2 text-sm",sm:"px-3 py-1.5 text-xs",lg:"px-6 py-3 text-base"}[x],l),ref:r,...h})});x.displayName="Button"},609:function(e,r,l){"use strict";l.d(r,{Ol:function(){return h},SZ:function(){return g},Zb:function(){return x},aY:function(){return y},ll:function(){return f}});var n=l(7437),d=l(2265),c=l(345);let x=(0,d.forwardRef)((e,r)=>{let{className:l,...d}=e;return(0,n.jsx)("div",{ref:r,className:(0,c.cn)("rounded-lg border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950",l),...d})});x.displayName="Card";let h=(0,d.forwardRef)((e,r)=>{let{className:l,...d}=e;return(0,n.jsx)("div",{ref:r,className:(0,c.cn)("flex flex-col space-y-1.5 p-6",l),...d})});h.displayName="CardHeader";let f=(0,d.forwardRef)((e,r)=>{let{className:l,...d}=e;return(0,n.jsx)("h3",{ref:r,className:(0,c.cn)("text-lg font-semibold leading-none tracking-tight",l),...d})});f.displayName="CardTitle";let g=(0,d.forwardRef)((e,r)=>{let{className:l,...d}=e;return(0,n.jsx)("p",{ref:r,className:(0,c.cn)("text-sm text-gray-500 dark:text-gray-400",l),...d})});g.displayName="CardDescription";let y=(0,d.forwardRef)((e,r)=>{let{className:l,...d}=e;return(0,n.jsx)("div",{ref:r,className:(0,c.cn)("p-6 pt-0",l),...d})});y.displayName="CardContent";let v=(0,d.forwardRef)((e,r)=>{let{className:l,...d}=e;return(0,n.jsx)("div",{ref:r,className:(0,c.cn)(" flex items-center p-6 pt-0",l),...d})});v.displayName="CardFooter"},6582:function(e,r,l){"use strict";l.d(r,{I:function(){return x}});var n=l(7437),d=l(2265),c=l(345);let x=(0,d.forwardRef)((e,r)=>{let{className:l,type:d,...x}=e;return(0,n.jsx)("input",{type:d,className:(0,c.cn)("flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:ring-blue-400",l),ref:r,...x})});x.displayName="Input"},6429:function(e,r,l){"use strict";l.d(r,{_:function(){return x}});var n=l(7437),d=l(2265),c=l(345);let x=(0,d.forwardRef)((e,r)=>{let{className:l,variant:d="default",...x}=e;return(0,n.jsx)("label",{className:(0,c.cn)("block leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",{default:"text-sm font-medium text-gray-700 dark:text-gray-300",error:"text-sm font-medium text-red-600 dark:text-red-400"}[d],l),ref:r,...x})});x.displayName="Label"},1735:function(e,r,l){"use strict";l.d(r,{Bw:function(){return SelectContent},Ph:function(){return Select},Ql:function(){return SelectItem},i4:function(){return h},ki:function(){return SelectValue}});var n=l(7437),d=l(2265),c=l(345);let x=(0,d.createContext)(void 0),useSelect=()=>{let e=(0,d.useContext)(x);if(!e)throw Error("useSelect must be used within a Select");return e},Select=e=>{let{value:r,onValueChange:l,children:c}=e,[h,f]=(0,d.useState)(!1);return(0,n.jsx)(x.Provider,{value:{value:r,onValueChange:l,open:h,setOpen:f},children:(0,n.jsx)("div",{className:"relative",children:c})})},h=(0,d.forwardRef)((e,r)=>{let{className:l,children:d,...x}=e,{open:h,setOpen:f}=useSelect();return(0,n.jsxs)("button",{type:"button",role:"combobox","aria-expanded":h,className:(0,c.cn)("flex h-10 w-full items-center justify-between rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",l),onClick:()=>f(!h),ref:r,...x,children:[d,(0,n.jsx)("svg",{className:"h-4 w-4 opacity-50",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:(0,n.jsx)("path",{d:"m6 9 6 6 6-6",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2"})})]})});h.displayName="SelectTrigger";let SelectValue=e=>{let{placeholder:r}=e,{value:l}=useSelect();return(0,n.jsx)("span",{children:l||r})},SelectContent=e=>{let{children:r}=e,{open:l}=useSelect();return l?(0,n.jsx)("div",{className:"absolute z-50 mt-1 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg",children:(0,n.jsx)("div",{className:"max-h-60 overflow-auto p-1",children:r})}):null},SelectItem=e=>{let{value:r,children:l}=e,{value:d,onValueChange:x,setOpen:h}=useSelect(),f=d===r;return(0,n.jsxs)("div",{className:(0,c.cn)("relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700",f&&"bg-gray-100 dark:bg-gray-700"),onClick:()=>{x(r),h(!1)},children:[l,f&&(0,n.jsx)("span",{className:"absolute right-2 flex h-3.5 w-3.5 items-center justify-center",children:(0,n.jsx)("svg",{className:"h-4 w-4",fill:"none",stroke:"currentColor",viewBox:"0 0 24 24",children:(0,n.jsx)("path",{d:"m5 12 5 5L20 7",strokeLinecap:"round",strokeLinejoin:"round",strokeWidth:"2"})})})]})}},5925:function(e,r,l){"use strict";let n,d;l.d(r,{ZP:function(){return X},Am:function(){return dist_n}});var c=l(2265);let x={data:""},t=e=>"object"==typeof window?((e?e.querySelector("#_goober"):window._goober)||Object.assign((e||document.head).appendChild(document.createElement("style")),{innerHTML:" ",id:"_goober"})).firstChild:e||x,h=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,f=/\/\*[^]*?\*\/|  +/g,g=/\n+/g,o=(e,r)=>{let l="",n="",d="";for(let c in e){let x=e[c];"@"==c[0]?"i"==c[1]?l=c+" "+x+";":n+="f"==c[1]?o(x,c):c+"{"+o(x,"k"==c[1]?"":r)+"}":"object"==typeof x?n+=o(x,r?r.replace(/([^,])+/g,e=>c.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,r=>/&/.test(r)?r.replace(/&/g,e):e?e+" "+r:r)):c):null!=x&&(c=/^--/.test(c)?c:c.replace(/[A-Z]/g,"-$&").toLowerCase(),d+=o.p?o.p(c,x):c+":"+x+";")}return l+(r&&d?r+"{"+d+"}":d)+n},y={},s=e=>{if("object"==typeof e){let r="";for(let l in e)r+=l+s(e[l]);return r}return e},i=(e,r,l,n,d)=>{var c;let x=s(e),v=y[x]||(y[x]=(e=>{let r=0,l=11;for(;r<e.length;)l=101*l+e.charCodeAt(r++)>>>0;return"go"+l})(x));if(!y[v]){let r=x!==e?e:(e=>{let r,l,n=[{}];for(;r=h.exec(e.replace(f,""));)r[4]?n.shift():r[3]?(l=r[3].replace(g," ").trim(),n.unshift(n[0][l]=n[0][l]||{})):n[0][r[1]]=r[2].replace(g," ").trim();return n[0]})(e);y[v]=o(d?{["@keyframes "+v]:r}:r,l?"":"."+v)}let b=l&&y.g?y.g:null;return l&&(y.g=y[v]),c=y[v],b?r.data=r.data.replace(b,c):-1===r.data.indexOf(c)&&(r.data=n?c+r.data:r.data+c),v},p=(e,r,l)=>e.reduce((e,n,d)=>{let c=r[d];if(c&&c.call){let e=c(l),r=e&&e.props&&e.props.className||/^go/.test(e)&&e;c=r?"."+r:e&&"object"==typeof e?e.props?"":o(e,""):!1===e?"":e}return e+n+(null==c?"":c)},"");function u(e){let r=this||{},l=e.call?e(r.p):e;return i(l.unshift?l.raw?p(l,[].slice.call(arguments,1),r.p):l.reduce((e,l)=>Object.assign(e,l&&l.call?l(r.p):l),{}):l,t(r.target),r.g,r.o,r.k)}u.bind({g:1});let v,b,N,w=u.bind({k:1});function m(e,r,l,n){o.p=r,v=e,b=l,N=n}function j(e,r){let l=this||{};return function(){let n=arguments;function a(d,c){let x=Object.assign({},d),h=x.className||a.className;l.p=Object.assign({theme:b&&b()},x),l.o=/ *go\d+/.test(h),x.className=u.apply(l,n)+(h?" "+h:""),r&&(x.ref=c);let f=e;return e[0]&&(f=x.as||e,delete x.as),N&&f[0]&&N(x),v(f,x)}return r?r(a):a}}var Z=e=>"function"==typeof e,dist_h=(e,r)=>Z(e)?e(r):e,k=(n=0,()=>(++n).toString()),E=()=>{if(void 0===d&&"u">typeof window){let e=matchMedia("(prefers-reduced-motion: reduce)");d=!e||e.matches}return d},C="default",H=(e,r)=>{let{toastLimit:l}=e.settings;switch(r.type){case 0:return{...e,toasts:[r.toast,...e.toasts].slice(0,l)};case 1:return{...e,toasts:e.toasts.map(e=>e.id===r.toast.id?{...e,...r.toast}:e)};case 2:let{toast:n}=r;return H(e,{type:e.toasts.find(e=>e.id===n.id)?1:0,toast:n});case 3:let{toastId:d}=r;return{...e,toasts:e.toasts.map(e=>e.id===d||void 0===d?{...e,dismissed:!0,visible:!1}:e)};case 4:return void 0===r.toastId?{...e,toasts:[]}:{...e,toasts:e.toasts.filter(e=>e.id!==r.toastId)};case 5:return{...e,pausedAt:r.time};case 6:let c=r.time-(e.pausedAt||0);return{...e,pausedAt:void 0,toasts:e.toasts.map(e=>({...e,pauseDuration:e.pauseDuration+c}))}}},z=[],F={toasts:[],pausedAt:void 0,settings:{toastLimit:20}},M={},Y=(e,r=C)=>{M[r]=H(M[r]||F,e),z.forEach(([e,l])=>{e===r&&l(M[r])})},_=e=>Object.keys(M).forEach(r=>Y(e,r)),Q=e=>Object.keys(M).find(r=>M[r].toasts.some(r=>r.id===e)),S=(e=C)=>r=>{Y(r,e)},ie=(e,r="blank",l)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:r,ariaProps:{role:"status","aria-live":"polite"},message:e,pauseDuration:0,...l,id:(null==l?void 0:l.id)||k()}),P=e=>(r,l)=>{let n=ie(r,e,l);return S(n.toasterId||Q(n.id))({type:2,toast:n}),n.id},dist_n=(e,r)=>P("blank")(e,r);dist_n.error=P("error"),dist_n.success=P("success"),dist_n.loading=P("loading"),dist_n.custom=P("custom"),dist_n.dismiss=(e,r)=>{let l={type:3,toastId:e};r?S(r)(l):_(l)},dist_n.dismissAll=e=>dist_n.dismiss(void 0,e),dist_n.remove=(e,r)=>{let l={type:4,toastId:e};r?S(r)(l):_(l)},dist_n.removeAll=e=>dist_n.remove(void 0,e),dist_n.promise=(e,r,l)=>{let n=dist_n.loading(r.loading,{...l,...null==l?void 0:l.loading});return"function"==typeof e&&(e=e()),e.then(e=>{let d=r.success?dist_h(r.success,e):void 0;return d?dist_n.success(d,{id:n,...l,...null==l?void 0:l.success}):dist_n.dismiss(n),e}).catch(e=>{let d=r.error?dist_h(r.error,e):void 0;d?dist_n.error(d,{id:n,...l,...null==l?void 0:l.error}):dist_n.dismiss(n)}),e};var I=w`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,A=w`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,B=w`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,T=j("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${I} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${A} 0.15s ease-out forwards;
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
    animation: ${B} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,V=w`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,O=j("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${e=>e.secondary||"#e0e0e0"};
  border-right-color: ${e=>e.primary||"#616161"};
  animation: ${V} 1s linear infinite;
`,L=w`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,R=w`
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
}`,D=j("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${e=>e.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${L} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${R} 0.2s ease-out forwards;
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
`,q=j("div")`
  position: absolute;
`,G=j("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,W=w`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,J=j("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${W} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,$=({toast:e})=>{let{icon:r,type:l,iconTheme:n}=e;return void 0!==r?"string"==typeof r?c.createElement(J,null,r):r:"blank"===l?null:c.createElement(G,null,c.createElement(O,{...n}),"loading"!==l&&c.createElement(q,null,"error"===l?c.createElement(T,{...n}):c.createElement(D,{...n})))},Re=e=>`
0% {transform: translate3d(0,${-200*e}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`,Ee=e=>`
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${-150*e}%,-1px) scale(.6); opacity:0;}
`,K=j("div")`
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
`,U=j("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`,ke=(e,r)=>{let l=e.includes("top")?1:-1,[n,d]=E()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[Re(l),Ee(l)];return{animation:r?`${w(n)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${w(d)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}};c.memo(({toast:e,position:r,style:l,children:n})=>{let d=e.height?ke(e.position||r||"top-center",e.visible):{opacity:0},x=c.createElement($,{toast:e}),h=c.createElement(U,{...e.ariaProps},dist_h(e.message,e));return c.createElement(K,{className:e.className,style:{...d,...l,...e.style}},"function"==typeof n?n({icon:x,message:h}):c.createElement(c.Fragment,null,x,h))}),m(c.createElement),u`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;var X=dist_n}},function(e){e.O(0,[5827,6003,85,6317,2971,2472,1744],function(){return e(e.s=5717)}),_N_E=e.O()}]);