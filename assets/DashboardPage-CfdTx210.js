import{j as e,u as I,b as R,r as b,L as f,N as A}from"./index-CySSB4jp.js";import{u as B,a as D,b as O}from"./useDashboard-BrYk66OV.js";import{B as H}from"./book-open-D_dubzg1.js";import{C as E}from"./clock-CD8Rc-fd.js";import{C as $}from"./circle-alert-CdHpRbkH.js";import{E as G}from"./eye-jM_iyXND.js";import{C as j}from"./chevron-right-SV59oQle.js";import{c as M}from"./createLucideIcon-Dsn5LIpn.js";import{H as P}from"./ReviewHistoryModal-BFlX4Pju.js";import{G as _}from"./graduation-cap-MqasMYzd.js";import{C as L}from"./circle-check-CdwQowdL.js";import{L as T}from"./loader-circle-W0wzUQr1.js";import{M as K,R as Q}from"./ReviewFeedbackModal-D-DVgAi4.js";import{b as U,c as W,d as X}from"./useBrowse-omiUIvrU.js";import{C as Y}from"./chevron-left-DFZGNmwa.js";import{X as J}from"./x-vmbVTj_u.js";import{f as Z}from"./useModeration-DP9_UL2C.js";import{R as ee}from"./rotate-ccw-BNAqjPsd.js";import{C as te}from"./circle-x-Cq00iYDW.js";import"./useQuery-C3dsyUfC.js";import"./useMutation-82KD8zMU.js";import"./academics.api-DaSTejqQ.js";import"./StatusBadge-TJp_EEmF.js";import"./message-square-CyfjuzKh.js";/**
 * @license lucide-react v0.395.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const V=M("FilePlus2",[["path",{d:"M4 22h14a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v4",key:"1pf5j1"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"M3 15h6",key:"4e2qda"}],["path",{d:"M6 12v6",key:"1u72j0"}]]);/**
 * @license lucide-react v0.395.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const se=M("Library",[["path",{d:"m16 6 4 14",key:"ji33uf"}],["path",{d:"M12 6v14",key:"1n7gus"}],["path",{d:"M8 8v12",key:"1gg7y9"}],["path",{d:"M4 4v16",key:"6qkkli"}]]);/**
 * @license lucide-react v0.395.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const ae=M("ListChecks",[["path",{d:"m3 17 2 2 4-4",key:"1jhpwq"}],["path",{d:"m3 7 2 2 4-4",key:"1obspn"}],["path",{d:"M13 6h8",key:"15sg57"}],["path",{d:"M13 12h8",key:"h98zly"}],["path",{d:"M13 18h8",key:"oe0vm4"}]]);function N({label:t,value:a,icon:r,colorClasses:i,isLoading:n}){return n?e.jsxs("div",{className:"bg-card rounded-card shadow-card p-5 flex items-center gap-4 animate-pulse",children:[e.jsx("div",{className:"w-11 h-11 rounded-xl bg-gray-200 shrink-0"}),e.jsxs("div",{className:"flex-1 space-y-2",children:[e.jsx("div",{className:"h-7 w-16 bg-gray-200 rounded"}),e.jsx("div",{className:"h-4 w-24 bg-gray-100 rounded"})]})]}):e.jsxs("div",{className:`
        bg-card rounded-card shadow-card p-5
        flex items-center gap-4
        transition-all duration-200
        hover:-translate-y-0.5 hover:shadow-card-hover
        cursor-default
      `,children:[e.jsx("div",{className:`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${i}`,children:r}),e.jsxs("div",{children:[e.jsx("p",{className:"text-2xl font-bold text-ink tabular-nums leading-tight",children:a}),e.jsx("p",{className:"text-sm text-ink-muted mt-0.5",children:t})]})]})}function ne({stats:t,isLoading:a}){return e.jsxs("div",{className:"grid grid-cols-2 lg:grid-cols-4 gap-4",children:[e.jsx(N,{label:"Published",value:(t==null?void 0:t.publishedChapters)??0,icon:e.jsx(H,{size:20,className:"text-success"}),colorClasses:"bg-green-50",isLoading:a}),e.jsx(N,{label:"Pending Review",value:(t==null?void 0:t.pendingChapters)??0,icon:e.jsx(E,{size:20,className:"text-warning"}),colorClasses:"bg-yellow-50",isLoading:a}),e.jsx(N,{label:"Rejected",value:(t==null?void 0:t.rejectedChapters)??0,icon:e.jsx($,{size:20,className:"text-danger"}),colorClasses:"bg-red-50",isLoading:a}),e.jsx(N,{label:"Total Views",value:a?0:((t==null?void 0:t.totalViews)??0)>=1e3?`${(((t==null?void 0:t.totalViews)??0)/1e3).toFixed(1)}k`:(t==null?void 0:t.totalViews)??0,icon:e.jsx(G,{size:20,className:"text-accent"}),colorClasses:"bg-blue-50",isLoading:a})]})}function re({pendingCount:t,onViewPending:a}){return t<=0?null:e.jsxs("div",{className:`
        flex items-start gap-3
        bg-yellow-50 border border-yellow-200
        rounded-card px-4 py-3
        animate-fadeSlideIn
      `,role:"alert",children:[e.jsx(E,{size:18,className:"text-warning shrink-0 mt-0.5","aria-hidden":"true"}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"text-sm font-semibold text-yellow-800",children:t===1?"1 chapter awaiting review":`${t} chapters awaiting review`}),e.jsx("p",{className:"text-xs text-yellow-700 mt-0.5",children:"Chapters typically take 24–48 hours to review."})]}),e.jsxs("button",{onClick:a,className:`
          flex items-center gap-1 text-xs font-medium
          text-yellow-800 hover:text-yellow-900
          underline underline-offset-2
          shrink-0 mt-0.5
          transition-colors
        `,"aria-label":"View pending chapters",children:["View",e.jsx(j,{size:14})]})]})}function k({icon:t,label:a,onClick:r}){return e.jsxs("button",{onClick:r,className:`
        flex items-center gap-2
        px-4 py-2.5
        rounded-xl border border-border bg-card
        text-sm font-medium text-ink
        hover:border-accent hover:text-accent hover:bg-blue-50
        transition-all duration-150
        whitespace-nowrap
        shadow-card hover:shadow-card-hover
      `,children:[e.jsx("span",{className:"shrink-0",children:t}),a]})}function ie(){const t=I(),{canAuthor:a,hasRole:r}=R();return e.jsxs("div",{className:"flex flex-wrap gap-3",children:[a()&&e.jsx(k,{icon:e.jsx(V,{size:16}),label:"New Chapter",onClick:()=>t("/academics/editor/new")}),e.jsx(k,{icon:e.jsx(se,{size:16}),label:"Browse Content",onClick:()=>t("/academics")}),r("moderator","admin")&&e.jsx(k,{icon:e.jsx(ae,{size:16}),label:"View Queue",onClick:()=>t("/academics/moderator/queue")}),r("moderator","admin")&&e.jsx(k,{icon:e.jsx(P,{size:16}),label:"History",onClick:()=>t("/academics/moderator/history")})]})}const le=["Write and publish chapters on paediatric & neonatal topics","Receive structured peer-review feedback from moderators","Earn CME/CPD credits for accepted contributions","Be listed as a verified author on PediAid Academics","Track views and reading time for your published work"];function ce(){const{mutate:t,isPending:a,isSuccess:r,error:i}=B();return e.jsxs("div",{className:"bg-card rounded-card shadow-card p-6 max-w-xl mx-auto animate-fadeSlideIn",children:[e.jsxs("div",{className:"flex items-center gap-3 mb-3",children:[e.jsx("div",{className:"w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0",children:e.jsx(_,{size:24,className:"text-accent","aria-hidden":"true"})}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-lg font-bold text-ink",children:"Become an Author"}),e.jsx("p",{className:"text-sm text-ink-muted leading-snug",children:"Share your expertise with the PediAid community"})]})]}),e.jsx("p",{className:"text-sm text-ink-muted mb-4 leading-relaxed",children:"Contribute chapters to PediAid Academics and help build the most comprehensive paediatric & neonatal clinical reference platform."}),e.jsx("ul",{className:"space-y-2 mb-6",children:le.map(n=>e.jsxs("li",{className:"flex items-start gap-2 text-sm text-ink",children:[e.jsx(L,{size:16,className:"text-success shrink-0 mt-0.5","aria-hidden":"true"}),n]},n))}),i&&e.jsx("p",{className:"text-sm text-danger mb-3",role:"alert",children:i.message}),r?e.jsxs("div",{className:`
            flex items-center gap-2
            bg-green-50 border border-green-200
            rounded-xl px-4 py-3
            text-sm font-medium text-success
            animate-fadeSlideIn
          `,role:"status",children:[e.jsx(L,{size:16,"aria-hidden":"true"}),"Request submitted! Our team will review your profile shortly."]}):e.jsx("button",{onClick:()=>t(),disabled:a,className:`
            flex items-center justify-center gap-2
            w-full px-4 py-2.5
            rounded-xl bg-primary text-white text-sm font-semibold
            hover:bg-primary-light
            disabled:opacity-60 disabled:cursor-not-allowed
            transition-colors
          `,children:a?e.jsxs(e.Fragment,{children:[e.jsx(T,{size:16,className:"animate-spin","aria-hidden":"true"}),"Submitting…"]}):"Request Author Access"})]})}function oe({onClose:t}){const a=I(),[r,i]=b.useState("subject"),[n,c]=b.useState(null),[l,m]=b.useState(null),{data:x,isLoading:o}=U(),{data:h,isLoading:d}=W(n==null?void 0:n.id),{data:u,isLoading:w}=X(l==null?void 0:l.id);function g(s){c(s),m(null),i("system")}function C(s){m(s),i("topic")}function y(s){t(),a(`/academics/editor/new?topicId=${s.id}`)}function S(){r==="topic"?i("system"):r==="system"&&(i("subject"),c(null))}function v(s){s.target===s.currentTarget&&t()}function p(s){s.key==="Escape"&&t()}const F={subject:"Select a Subject",system:"Select a System",topic:"Select a Topic"},q={subject:1,system:2,topic:3};return e.jsx("div",{className:`
        fixed inset-0 z-50
        bg-black/50 backdrop-blur-sm
        flex items-center justify-center
        px-4 animate-fadeIn
      `,role:"dialog","aria-modal":"true","aria-labelledby":"topic-selector-title",onClick:v,onKeyDown:p,tabIndex:-1,children:e.jsxs("div",{className:`
          bg-card rounded-card shadow-card-hover
          w-full max-w-lg
          flex flex-col
          max-h-[85vh]
          animate-fadeSlideIn
        `,children:[e.jsxs("div",{className:"flex items-center gap-3 px-5 py-4 border-b border-border",children:[r!=="subject"&&e.jsx("button",{onClick:S,className:`
                p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-gray-100
                transition-colors shrink-0
              `,"aria-label":"Go back",children:e.jsx(Y,{size:18})}),e.jsxs("div",{className:"flex-1",children:[e.jsx("h2",{id:"topic-selector-title",className:"text-base font-semibold text-ink",children:"New Chapter"}),e.jsxs("p",{className:"text-xs text-ink-muted mt-0.5",children:["Step ",q[r]," of 3 — ",F[r]]})]}),e.jsx("button",{onClick:t,className:`
              p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-gray-100
              transition-colors
            `,"aria-label":"Close",children:e.jsx(J,{size:18})})]}),(n||l)&&e.jsx("div",{className:"flex items-center gap-1.5 px-5 pt-3 text-xs text-ink-muted flex-wrap",children:n&&e.jsxs(e.Fragment,{children:[e.jsx("span",{className:"font-medium text-ink",children:n.name}),l&&e.jsxs(e.Fragment,{children:[e.jsx(j,{size:12}),e.jsx("span",{className:"font-medium text-ink",children:l.name})]})]})}),e.jsxs("div",{className:"flex-1 overflow-y-auto px-5 py-4",children:[r==="subject"&&e.jsx(e.Fragment,{children:o?e.jsx(z,{}):e.jsx("div",{className:"flex flex-wrap gap-2",children:(x??[]).map(s=>e.jsxs("button",{onClick:()=>g(s),className:`
                        flex items-center gap-1.5
                        px-3 py-2 rounded-xl
                        border border-border bg-bg
                        text-sm font-medium text-ink
                        hover:border-accent hover:text-accent hover:bg-blue-50
                        transition-all duration-150
                      `,children:[s.name,s.systemCount!==void 0&&e.jsxs("span",{className:"text-xs text-ink-muted",children:["(",s.systemCount,")"]}),e.jsx(j,{size:13,className:"text-ink-muted"})]},s.id))})}),r==="system"&&e.jsx(e.Fragment,{children:d?e.jsx(z,{}):e.jsx("ul",{className:"space-y-1.5",children:(h??[]).map(s=>e.jsx("li",{children:e.jsxs("button",{onClick:()=>C(s),className:`
                          w-full flex items-center justify-between
                          px-4 py-3 rounded-xl
                          border border-border bg-bg
                          text-sm font-medium text-ink text-left
                          hover:border-accent hover:text-accent hover:bg-blue-50
                          transition-all duration-150
                        `,children:[e.jsx("span",{children:s.name}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0",children:[s.topicCount!==void 0&&e.jsxs("span",{className:"text-xs text-ink-muted",children:[s.topicCount," topics"]}),e.jsx(j,{size:15,className:"text-ink-muted"})]})]})},s.id))})}),r==="topic"&&e.jsx(e.Fragment,{children:w?e.jsx(z,{}):e.jsx("ul",{className:"space-y-1.5",children:(u??[]).map(s=>e.jsx("li",{children:e.jsxs("button",{onClick:()=>y(s),className:`
                          w-full flex items-center justify-between
                          px-4 py-3 rounded-xl
                          border border-border bg-bg
                          text-sm font-medium text-ink text-left
                          hover:border-accent hover:text-accent hover:bg-blue-50
                          transition-all duration-150
                        `,children:[e.jsx("span",{children:s.name}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0",children:[s.chapterCount!==void 0&&e.jsxs("span",{className:"text-xs text-ink-muted",children:[s.chapterCount," chapters"]}),e.jsx(j,{size:15,className:"text-ink-muted"})]})]})},s.id))})})]})]})})}function z(){return e.jsx("div",{className:"flex items-center justify-center py-10",children:e.jsx(T,{size:24,className:"animate-spin text-accent","aria-label":"Loading"})})}const de={approved:{label:"Approved",Icon:L,color:"text-success"},rejected:{label:"Rejected",Icon:te,color:"text-danger"},request_changes:{label:"Changes requested",Icon:ee,color:"text-orange-600"}};function me(t){return new Date(t).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}function xe(){const{data:t,isLoading:a}=Z({period:"all",page:1}),i=((t==null?void 0:t.data)??[]).slice(0,8);return e.jsxs("section",{"aria-labelledby":"moderation-history-heading",className:"bg-card rounded-card shadow-card p-6",children:[e.jsxs("div",{className:"flex items-center justify-between mb-4",children:[e.jsxs("h2",{id:"moderation-history-heading",className:"text-base font-semibold text-ink flex items-center gap-2",children:[e.jsx(P,{size:16,className:"text-ink-muted","aria-hidden":"true"}),"Moderation History"]}),e.jsx(f,{to:"/academics/moderator/history",className:"text-sm font-medium text-accent hover:underline underline-offset-2",children:"View all"})]}),a&&e.jsx("div",{className:"space-y-2",children:[1,2,3].map(n=>e.jsx("div",{className:"h-12 rounded-lg bg-gray-100 animate-pulse","aria-hidden":"true"},n))}),!a&&i.length===0&&e.jsxs("p",{className:"text-sm text-ink-muted py-4 text-center",children:["You haven't reviewed any chapters yet. Open the"," ",e.jsx(f,{to:"/academics/moderator/queue",className:"font-medium text-accent hover:underline",children:"moderation queue"})," ","to get started."]}),!a&&i.length>0&&e.jsx("ul",{className:"list-none p-0 m-0 divide-y divide-border",children:i.map(n=>{const c=de[n.action],{Icon:l}=c;return e.jsx("li",{className:"py-3 first:pt-0 last:pb-0",children:e.jsxs(f,{to:`/academics/moderator/review/${n.chapterId}`,className:"group flex items-center gap-3 hover:bg-gray-50 rounded-lg -mx-2 px-2 py-1 transition-colors",children:[e.jsx("div",{className:`shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-50 ${c.color}`,children:e.jsx(l,{size:14,"aria-hidden":"true"})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"text-sm font-medium text-ink truncate",children:n.chapterTitle}),e.jsxs("p",{className:"text-xs text-ink-muted truncate",children:[e.jsx("span",{className:`font-semibold ${c.color}`,children:c.label})," · ",e.jsxs("span",{children:["by ",n.authorName]})," · ",e.jsx("span",{children:me(n.performedAt)})]})]}),e.jsx(j,{size:14,className:"text-ink-muted shrink-0 group-hover:translate-x-0.5 transition-transform","aria-hidden":"true"})]})},n.id)})})]})}const he={reader:"bg-gray-100 text-gray-600",author:"bg-blue-50 text-accent",moderator:"bg-purple-50 text-purple-700",admin:"bg-red-50 text-danger"};function ue({role:t}){return e.jsx("span",{className:["acad-badge capitalize",he[t]??"bg-gray-100 text-gray-600"].join(" "),children:t})}function De(){var u;const{user:t,isAuthenticated:a,canAuthor:r,canModerate:i}=R(),[n,c]=b.useState(null),[l,m]=b.useState(!1),[x,o]=b.useState(!1);if(!a())return e.jsx(A,{to:"/academics/login",replace:!0});if(!r())return e.jsx(A,{to:"/academics",replace:!0,state:{toast:"Access restricted. Only approved authors and moderators can access the dashboard."}});const h=(t==null?void 0:t.role)==="reader",d=((u=t==null?void 0:t.profile)==null?void 0:u.fullName)??(t==null?void 0:t.email)??"there";return e.jsx(pe,{user:t,isReader:h,displayName:d,canAuthorFn:r,canModerateFn:i,feedbackChapter:n,setFeedbackChapter:c,showTopicSelector:l,setShowTopicSelector:m,pendingFilterActive:x,setPendingFilterActive:o})}function pe({user:t,isReader:a,displayName:r,canAuthorFn:i,canModerateFn:n,feedbackChapter:c,setFeedbackChapter:l,showTopicSelector:m,setShowTopicSelector:x,pendingFilterActive:o,setPendingFilterActive:h}){var v;const{data:d,isLoading:u}=D(),w=o?"pending":void 0,{data:g=[],isLoading:C}=O(w),y=(d==null?void 0:d.pendingChapters)??0,S=o?g:g.slice(0,5);return e.jsxs("div",{className:"min-h-screen bg-bg",children:[e.jsxs("div",{className:"max-w-browse mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6",children:[e.jsxs("div",{className:"flex items-start justify-between gap-4 flex-wrap",children:[e.jsxs("div",{children:[e.jsxs("h1",{className:"text-2xl font-bold text-ink",children:["Welcome back,"," ",e.jsx("span",{className:"text-primary",children:r})]}),e.jsxs("div",{className:"flex items-center gap-2 mt-1.5",children:[e.jsx(ue,{role:(t==null?void 0:t.role)??"reader"}),((v=t==null?void 0:t.profile)==null?void 0:v.institution)&&e.jsx("span",{className:"text-xs text-ink-muted",children:t.profile.institution})]})]}),e.jsx(f,{to:"/academics/dashboard/profile",className:`
              text-sm font-medium text-accent
              hover:underline underline-offset-2
              transition-colors
            `,children:"Edit Profile"})]}),e.jsx(ie,{}),a&&e.jsx(ce,{}),i()&&e.jsxs(e.Fragment,{children:[y>0&&e.jsx(re,{pendingCount:y,onViewPending:()=>{var p;h(!0),(p=document.getElementById("my-chapters-section"))==null||p.scrollIntoView({behavior:"smooth"})}}),e.jsx(ne,{stats:d,isLoading:u}),e.jsxs("section",{id:"my-chapters-section",children:[e.jsxs("div",{className:"flex items-center justify-between mb-3",children:[e.jsx("h2",{className:"text-base font-semibold text-ink",children:o?"Pending Chapters":"My Chapters"}),e.jsxs("div",{className:"flex items-center gap-3",children:[o&&e.jsx("button",{onClick:()=>h(!1),className:"text-xs text-ink-muted hover:text-ink underline underline-offset-2",children:"Show all"}),e.jsx(f,{to:"/academics/dashboard/chapters",className:"text-sm font-medium text-accent hover:underline underline-offset-2",children:"View all"})]})]}),e.jsx(K,{chapters:S,isLoading:C,onViewFeedback:p=>l(p)})]}),n()&&e.jsx(xe,{})]})]}),i()&&e.jsxs("button",{onClick:()=>x(!0),className:`
            md:hidden
            fixed bottom-6 right-6 z-40
            flex items-center gap-2
            px-4 py-3 rounded-2xl
            bg-primary text-white text-sm font-semibold
            shadow-card-hover
            hover:bg-primary-light
            active:scale-95
            transition-all duration-150
          `,"aria-label":"Create new chapter",children:[e.jsx(V,{size:18,"aria-hidden":"true"}),"New Chapter"]}),c&&e.jsx(Q,{chapter:c,onClose:()=>l(null),onEdit:()=>l(null)}),m&&e.jsx(oe,{onClose:()=>x(!1)})]})}export{De as DashboardPage};
