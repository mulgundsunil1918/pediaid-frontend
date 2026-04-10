import{f as m,b as y,j as t}from"./index-CySSB4jp.js";import{u as h}from"./useQuery-C3dsyUfC.js";import{u as l}from"./useMutation-82KD8zMU.js";import{A as u}from"./academics.api-DaSTejqQ.js";import{c as p}from"./createLucideIcon-Dsn5LIpn.js";import{X as b}from"./x-vmbVTj_u.js";import{L as v}from"./loader-circle-W0wzUQr1.js";import{R as j}from"./rotate-ccw-BNAqjPsd.js";import{C as w}from"./circle-x-Cq00iYDW.js";import{C as N}from"./circle-check-CdwQowdL.js";/**
 * @license lucide-react v0.395.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=p("Archive",[["rect",{width:"20",height:"5",x:"2",y:"3",rx:"1",key:"1wp1u1"}],["path",{d:"M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8",key:"1s80jp"}],["path",{d:"M10 12h4",key:"a56b0p"}]]);/**
 * @license lucide-react v0.395.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const C=p("History",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]]),q="https://pediaid-backend.onrender.com";async function d(e,a={}){const{accessToken:r,clearAuth:n}=y.getState(),i={...a.headers};a.body instanceof FormData||(i["Content-Type"]="application/json"),r&&(i.Authorization=`Bearer ${r}`);const s=await fetch(`${q}${e}`,{...a,headers:i});if(s.status===401){n(),window.dispatchEvent(new CustomEvent("acad:unauthorized"));const c=await s.json().catch(()=>({}));throw new u(c.message??"Unauthorized",401)}if(!s.ok){const c=await s.json().catch(()=>({}));throw new u(c.message??`Request failed: ${s.status}`,s.status)}if(s.status!==204)return s.json()}function O(e){return h({queryKey:["editor","chapter",e],queryFn:()=>d(`/api/academics/chapters/id/${e}`),enabled:!!e,staleTime:1/0,retry:!1})}function R(e){return h({queryKey:["editor","chapter-reviews",e],queryFn:async()=>(await d(`/api/academics/chapters/${e}/reviews`)).data,enabled:!!e,staleTime:30*1e3,retry:!1})}function Q(){const e=m();return l({mutationFn:a=>d("/api/academics/chapters",{method:"POST",body:JSON.stringify(a)}),onSuccess:()=>{e.invalidateQueries({queryKey:["academics","chapters"]})}})}function H(){const e=m();return l({mutationFn:({id:a,payload:r})=>d(`/api/academics/chapters/${a}`,{method:"PUT",body:JSON.stringify(r)}),onSuccess:(a,{id:r})=>{e.invalidateQueries({queryKey:["editor","chapter",r]}),e.invalidateQueries({queryKey:["academics","chapters"]})}})}function P(){const e=m();return l({mutationFn:a=>d(`/api/academics/chapters/${a}/submit`,{method:"POST"}),onSuccess:(a,r)=>{e.invalidateQueries({queryKey:["editor","chapter",r]}),e.invalidateQueries({queryKey:["academics","chapters"]})}})}function _(){return l({mutationFn:async e=>{const a=new FormData;return a.append("image",e),d("/api/academics/upload/image",{method:"POST",body:a})}})}const S={approved:{label:"Approved",Icon:N,accent:"text-success",dotBg:"bg-green-50",dotRing:"ring-green-200"},rejected:{label:"Rejected",Icon:w,accent:"text-danger",dotBg:"bg-red-50",dotRing:"ring-red-200"},request_changes:{label:"Changes requested",Icon:j,accent:"text-orange-600",dotBg:"bg-orange-50",dotRing:"ring-orange-200"},archived:{label:"Archived",Icon:k,accent:"text-gray-500",dotBg:"bg-gray-100",dotRing:"ring-gray-200"}};function A(e){return new Date(e).toLocaleString("en-IN",{day:"numeric",month:"short",year:"numeric",hour:"numeric",minute:"2-digit"})}function $({entry:e,isLast:a}){const r=S[e.action],{Icon:n}=r;return t.jsxs("li",{className:"relative pl-10 pb-6 last:pb-0",children:[!a&&t.jsx("span",{className:"absolute left-[15px] top-8 bottom-0 w-px bg-border","aria-hidden":"true"}),t.jsx("span",{className:`
          absolute left-0 top-0
          flex items-center justify-center
          w-8 h-8 rounded-full
          ${r.dotBg} ring-2 ${r.dotRing}
        `,children:t.jsx(n,{size:15,className:r.accent,"aria-hidden":"true"})}),t.jsxs("div",{children:[t.jsxs("div",{className:"flex flex-wrap items-baseline gap-x-2",children:[t.jsx("p",{className:`text-sm font-semibold ${r.accent}`,children:r.label}),t.jsxs("p",{className:"text-xs text-ink-muted",children:["by"," ",t.jsx("span",{className:"font-medium text-ink",children:e.moderatorName}),e.moderatorRole?` · ${e.moderatorRole}`:""]})]}),t.jsx("p",{className:"text-xs text-ink-muted mt-0.5",children:A(e.performedAt)}),e.notes&&e.notes.trim()!==""&&t.jsx("blockquote",{className:`
              mt-2 border-l-2 border-border
              bg-gray-50 rounded-r-md
              px-3 py-2
              text-sm text-ink leading-relaxed whitespace-pre-wrap
            `,children:e.notes})]})]})}function U({chapterId:e,chapterTitle:a,onClose:r}){const{data:n=[],isLoading:i,isError:s,error:c}=R(e);function x(o){o.target===o.currentTarget&&r()}function f(o){o.key==="Escape"&&r()}return t.jsx("div",{className:`
        fixed inset-0 z-[60]
        bg-black/50 backdrop-blur-sm
        flex items-center justify-center
        px-4 animate-fadeIn
      `,role:"dialog","aria-modal":"true","aria-labelledby":"review-history-title",onClick:x,onKeyDown:f,tabIndex:-1,children:t.jsxs("div",{className:`
          bg-card rounded-card shadow-card-hover
          w-full max-w-lg
          overflow-hidden
          animate-fadeSlideIn
          flex flex-col
          max-h-[85vh]
        `,children:[t.jsxs("div",{className:"flex items-center gap-3 bg-gray-50 border-b border-border px-5 py-4 shrink-0",children:[t.jsx(C,{size:20,className:"text-primary shrink-0","aria-hidden":"true"}),t.jsxs("div",{className:"flex-1 min-w-0",children:[t.jsx("h2",{id:"review-history-title",className:"text-base font-semibold text-primary leading-snug",children:"Review History"}),a&&t.jsx("p",{className:"text-xs text-ink-muted truncate",children:a})]}),t.jsx("button",{onClick:r,className:`
              p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-gray-100
              transition-colors
            `,"aria-label":"Close",children:t.jsx(b,{size:18})})]}),t.jsxs("div",{className:"px-5 py-5 overflow-y-auto",children:[i&&t.jsxs("div",{className:"flex items-center justify-center py-8 text-ink-muted text-sm",children:[t.jsx(v,{size:16,className:"animate-spin mr-2"}),"Loading review history…"]}),s&&t.jsx("div",{className:"rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger",children:c instanceof Error?c.message:"Failed to load review history."}),!i&&!s&&n.length===0&&t.jsx("p",{className:"text-sm text-ink-muted text-center py-8",children:"No review actions have been recorded for this chapter yet."}),!i&&!s&&n.length>0&&t.jsx("ol",{className:"list-none p-0 m-0",children:n.map((o,g)=>t.jsx($,{entry:o,isLast:g===n.length-1},o.id))})]}),t.jsx("div",{className:"flex items-center justify-end gap-3 px-5 py-3 border-t border-border bg-bg shrink-0",children:t.jsx("button",{onClick:r,className:`
              px-4 py-2 text-sm font-medium rounded-xl
              text-ink hover:bg-gray-100
              border border-border
              transition-colors
            `,children:"Close"})})]})})}export{C as H,U as R,_ as a,Q as b,H as c,O as d,P as u};
