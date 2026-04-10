import{j as e,b as j,r as b,L as u,u as v}from"./index-CySSB4jp.js";import{S as y}from"./StatusBadge-TJp_EEmF.js";import{H as h,R as g}from"./ReviewHistoryModal-BFlX4Pju.js";import{B as f}from"./book-open-D_dubzg1.js";import{C as k}from"./clock-CD8Rc-fd.js";import{E as N}from"./eye-jM_iyXND.js";import{M as w}from"./message-square-CyfjuzKh.js";import{X as C}from"./x-vmbVTj_u.js";import{c as E}from"./createLucideIcon-Dsn5LIpn.js";import{C as H}from"./circle-x-Cq00iYDW.js";import{C as R}from"./circle-alert-CdHpRbkH.js";/**
 * @license lucide-react v0.395.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=E("Pencil",[["path",{d:"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z",key:"1a8usu"}],["path",{d:"m15 5 4 4",key:"1mk7zo"}]]);function B(t){const r=Date.now()-new Date(t).getTime(),a=Math.floor(r/(1e3*60*60*24));return a===0?"today":a===1?"1 day ago":`${a} days ago`}function z(){return e.jsxs("div",{className:"bg-card rounded-card shadow-card p-4 animate-pulse space-y-2",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"h-4 w-2/3 bg-gray-200 rounded"}),e.jsx("div",{className:"h-5 w-16 bg-gray-100 rounded-full ml-auto"})]}),e.jsx("div",{className:"h-3 w-1/2 bg-gray-100 rounded"}),e.jsx("div",{className:"h-3 w-1/4 bg-gray-100 rounded"})]})}function M({chapter:t,onViewFeedback:r}){const a=j(i=>i.canModerate()),n=t.status==="approved",d=t.status==="draft"||t.status==="rejected"||t.status==="changes_requested",o=t.status==="rejected"||t.status==="changes_requested",s=t.status!=="draft",[x,l]=b.useState(!1),c=a?`/academics/moderator/review/${t.id}`:`/academics/editor/${t.id}`,m=n?`/academics/c/${t.slug}`:c;return e.jsxs("div",{className:`
        bg-card rounded-card shadow-card
        px-4 py-4
        hover:-translate-y-0.5 hover:shadow-card-hover
        transition-all duration-200
      `,children:[e.jsxs("div",{className:"flex items-start justify-between gap-3 mb-1.5",children:[e.jsx(u,{to:m,className:`
            text-base font-semibold text-ink
            hover:text-accent transition-colors
            leading-snug
          `,children:t.title}),e.jsx(y,{status:t.status,className:"shrink-0 mt-0.5"})]}),e.jsxs("p",{className:"text-xs text-ink-muted mb-2",children:[e.jsx("span",{className:"font-medium",children:t.subjectCode})," · ",t.systemName," · ",t.topicName]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-3 text-xs text-ink-muted",children:[e.jsxs("span",{className:"inline-flex items-center gap-1",children:[e.jsx(f,{size:12,"aria-hidden":"true"}),"v",t.version]}),e.jsxs("span",{className:"inline-flex items-center gap-1",children:[e.jsx(k,{size:12,"aria-hidden":"true"}),"Updated ",B(t.updatedAt)]}),n&&t.viewCount>0&&e.jsxs("span",{className:"inline-flex items-center gap-1",children:[e.jsx(N,{size:12,"aria-hidden":"true"}),t.viewCount.toLocaleString()," views"]})]}),(d||o||s)&&e.jsxs("div",{className:"flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border",children:[d&&e.jsxs(u,{to:c,className:`
                flex items-center gap-1.5
                px-3 py-1.5 rounded-xl
                border border-border text-xs font-medium text-ink
                hover:border-accent hover:text-accent hover:bg-blue-50
                transition-all duration-150
              `,children:[e.jsx(p,{size:13,"aria-hidden":"true"}),a?"Review":"Edit"]}),o&&e.jsxs("button",{onClick:()=>r(t),className:["flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium","transition-all duration-150",t.status==="rejected"?"border border-red-200 text-danger hover:bg-red-50":"border border-orange-200 text-orange-600 hover:bg-orange-50"].join(" "),children:[e.jsx(w,{size:13,"aria-hidden":"true"}),"View Feedback"]}),s&&e.jsxs("button",{onClick:()=>l(!0),className:`
                flex items-center gap-1.5
                px-3 py-1.5 rounded-xl
                border border-border text-xs font-medium text-ink-muted
                hover:text-ink hover:border-accent/40 hover:bg-gray-50
                transition-all duration-150
              `,children:[e.jsx(h,{size:13,"aria-hidden":"true"}),"Review History"]})]}),x&&e.jsx(g,{chapterId:t.id,chapterTitle:t.title,onClose:()=>l(!1)})]})}function G({chapters:t,isLoading:r,onViewFeedback:a}){return r?e.jsx("div",{className:"space-y-3",children:[1,2,3].map(n=>e.jsx(z,{},n))}):t.length===0?e.jsxs("div",{className:`
          bg-card rounded-card shadow-card
          flex flex-col items-center justify-center
          py-14 px-6 text-center
        `,children:[e.jsx(f,{size:36,className:"text-ink-muted mb-3","aria-hidden":"true"}),e.jsx("p",{className:"text-base font-semibold text-ink mb-1",children:"No chapters yet"}),e.jsx("p",{className:"text-sm text-ink-muted",children:"Create your first chapter to get started."})]}):e.jsx("div",{className:"space-y-3",children:t.map(n=>e.jsx(M,{chapter:n,onViewFeedback:a},n.id))})}const S={headerBg:"bg-red-50",headerBorder:"border-red-100",titleColor:"text-danger",closeHover:"hover:bg-red-100 hover:text-danger",closeColor:"text-red-400",blockBorder:"border-danger/40",blockBg:"bg-red-50",title:"Chapter Rejected",bodyIntro:"The reviewer has rejected this chapter. Review the feedback below and start a new revision if you wish to continue.",Icon:H},$={headerBg:"bg-orange-50",headerBorder:"border-orange-100",titleColor:"text-orange-600",closeHover:"hover:bg-orange-100 hover:text-orange-600",closeColor:"text-orange-400",blockBorder:"border-orange-400/40",blockBg:"bg-orange-50",title:"Changes Requested",bodyIntro:"The reviewer has asked for revisions on this chapter. Read the feedback below, edit the chapter, and resubmit for review.",Icon:R};function I(t){return t==="rejected"?S:$}function T({chapter:t,onClose:r,onEdit:a}){const n=v(),[d,o]=b.useState(!1),s=I(t.status),{Icon:x}=s;function l(){a(),n(`/academics/editor/${t.id}`)}function c(i){i.target===i.currentTarget&&r()}function m(i){i.key==="Escape"&&r()}return e.jsxs(e.Fragment,{children:[e.jsx("div",{className:`
          fixed inset-0 z-50
          bg-black/50 backdrop-blur-sm
          flex items-center justify-center
          px-4 animate-fadeIn
        `,role:"dialog","aria-modal":"true","aria-labelledby":"review-feedback-title",onClick:c,onKeyDown:m,tabIndex:-1,children:e.jsxs("div",{className:`
            bg-card rounded-card shadow-card-hover
            w-full max-w-lg
            overflow-hidden
            animate-fadeSlideIn
          `,children:[e.jsxs("div",{className:`flex items-center gap-3 ${s.headerBg} border-b ${s.headerBorder} px-5 py-4`,children:[e.jsx(x,{size:22,className:`${s.titleColor} shrink-0`,"aria-hidden":"true"}),e.jsx("h2",{id:"review-feedback-title",className:`flex-1 text-base font-semibold ${s.titleColor}`,children:s.title}),e.jsx("button",{onClick:r,className:`p-1 rounded-lg ${s.closeColor} ${s.closeHover} transition-colors`,"aria-label":"Close",children:e.jsx(C,{size:18})})]}),e.jsxs("div",{className:"px-5 py-5 space-y-4",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-medium text-ink-muted uppercase tracking-wide mb-1",children:"Chapter"}),e.jsx("p",{className:"text-base font-semibold text-ink leading-snug",children:t.title}),e.jsxs("p",{className:"text-xs text-ink-muted mt-0.5",children:[t.subjectCode," · ",t.systemName," · ",t.topicName]})]}),e.jsx("p",{className:"text-sm text-ink-muted leading-relaxed",children:s.bodyIntro}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs font-medium text-ink-muted uppercase tracking-wide mb-2",children:"Reviewer Feedback"}),t.moderatorNotes?e.jsx("blockquote",{className:`
                    border-l-4 ${s.blockBorder}
                    ${s.blockBg} rounded-r-lg
                    px-4 py-3
                    text-sm text-ink leading-relaxed
                    italic
                  `,children:t.moderatorNotes}):e.jsx("p",{className:"text-sm text-ink-muted italic",children:"No specific notes were provided by the reviewer."})]})]}),e.jsxs("div",{className:"flex items-center justify-between gap-3 px-5 py-4 border-t border-border bg-bg",children:[e.jsxs("button",{type:"button",onClick:()=>o(!0),className:`
                flex items-center gap-1.5
                px-3 py-2 text-xs font-medium rounded-xl
                text-ink-muted hover:text-ink hover:bg-gray-100
                transition-colors
              `,children:[e.jsx(h,{size:13}),"View full history"]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("button",{onClick:r,className:`
                  px-4 py-2 text-sm font-medium rounded-xl
                  text-ink hover:bg-gray-100
                  border border-border
                  transition-colors
                `,children:"Dismiss"}),e.jsxs("button",{onClick:l,className:`
                  flex items-center gap-2
                  px-4 py-2 text-sm font-medium rounded-xl
                  bg-primary text-white
                  hover:bg-primary-light
                  transition-colors
                `,children:[e.jsx(p,{size:15}),"Edit Chapter"]})]})]})]})}),d&&e.jsx(g,{chapterId:t.id,chapterTitle:t.title,onClose:()=>o(!1)})]})}const J=T;export{G as M,J as R,T as a};
