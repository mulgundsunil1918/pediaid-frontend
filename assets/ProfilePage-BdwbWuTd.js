import{r as c,j as e,L as g,g as j}from"./index-Qev8LexI.js";import{c as N,d as k}from"./useDashboard-CmYIdv4b.js";import{L as d}from"./loader-circle-CDh7wAE-.js";import{C as v}from"./chevron-left-DLEj3IXt.js";import{S as y}from"./shield-check-CebcWE1b.js";const C={reader:"bg-gray-100 text-gray-600",author:"bg-blue-50 text-accent",moderator:"bg-purple-50 text-purple-700",admin:"bg-red-50 text-danger"};function S({role:n}){return e.jsx("span",{className:["acad-badge capitalize",C[n]??"bg-gray-100 text-gray-600"].join(" "),children:n})}function z(){const{data:n,isLoading:m}=N(),{mutate:x,isPending:a,isSuccess:r,error:l,reset:u}=k(),[t,o]=c.useState({fullName:"",qualification:"",institution:"",bio:"",orcid:""});c.useEffect(()=>{n&&o({fullName:n.fullName??"",qualification:n.qualification??"",institution:n.institution??"",bio:n.bio??"",orcid:n.orcid??""})},[n]);function i(s){const{name:f,value:h}=s.target;o(p=>({...p,[f]:h})),r&&u()}function b(s){s.preventDefault(),x(t)}return m?e.jsx("div",{className:"min-h-screen bg-bg flex items-center justify-center",children:e.jsx(d,{size:28,className:"animate-spin text-accent","aria-label":"Loading"})}):e.jsx("div",{className:"min-h-screen bg-bg",children:e.jsxs("div",{className:"max-w-reading mx-auto px-4 sm:px-6 py-8",children:[e.jsxs("div",{className:"flex items-center gap-3 mb-6",children:[e.jsxs(g,{to:"/academics/dashboard",className:`
              flex items-center gap-1 text-sm text-ink-muted
              hover:text-accent transition-colors
            `,children:[e.jsx(v,{size:16}),"Dashboard"]}),e.jsx("span",{className:"text-ink-muted",children:"/"}),e.jsx("h1",{className:"text-xl font-bold text-ink",children:"Edit Profile"})]}),e.jsxs("div",{className:"bg-card rounded-card shadow-card p-6",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-3 mb-6 pb-6 border-b border-border",children:[e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsx("p",{className:"text-sm font-medium text-ink-muted",children:"Email"}),e.jsx("p",{className:"text-base text-ink truncate",children:n==null?void 0:n.email})]}),e.jsxs("div",{className:"flex items-center gap-2 shrink-0",children:[e.jsx(S,{role:(n==null?void 0:n.role)??"reader"}),(n==null?void 0:n.credentialsVerified)&&e.jsxs("span",{className:`
                    flex items-center gap-1
                    acad-badge bg-green-50 text-success
                  `,title:"Credentials verified",children:[e.jsx(y,{size:13,"aria-hidden":"true"}),"Verified"]})]})]}),e.jsxs("form",{onSubmit:b,className:"space-y-5",children:[e.jsxs("div",{children:[e.jsx("label",{htmlFor:"fullName",className:"block text-sm font-medium text-ink mb-1.5",children:"Full Name"}),e.jsx("input",{id:"fullName",name:"fullName",type:"text",value:t.fullName,onChange:i,placeholder:"Dr. Jane Smith",className:`
                  w-full px-3.5 py-2.5 rounded-xl
                  border border-border bg-bg
                  text-sm text-ink placeholder:text-ink-muted
                  focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
                  transition
                `})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"qualification",className:"block text-sm font-medium text-ink mb-1.5",children:"Qualification"}),e.jsx("input",{id:"qualification",name:"qualification",type:"text",value:t.qualification??"",onChange:i,placeholder:"MBBS, MD (Paediatrics)",className:`
                  w-full px-3.5 py-2.5 rounded-xl
                  border border-border bg-bg
                  text-sm text-ink placeholder:text-ink-muted
                  focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
                  transition
                `})]}),e.jsxs("div",{children:[e.jsx("label",{htmlFor:"institution",className:"block text-sm font-medium text-ink mb-1.5",children:"Institution"}),e.jsx("input",{id:"institution",name:"institution",type:"text",value:t.institution??"",onChange:i,placeholder:"All India Institute of Medical Sciences",className:`
                  w-full px-3.5 py-2.5 rounded-xl
                  border border-border bg-bg
                  text-sm text-ink placeholder:text-ink-muted
                  focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
                  transition
                `})]}),e.jsxs("div",{children:[e.jsxs("label",{htmlFor:"bio",className:"block text-sm font-medium text-ink mb-1.5",children:["Bio"," ",e.jsx("span",{className:"text-ink-muted font-normal",children:"(optional)"})]}),e.jsx("textarea",{id:"bio",name:"bio",rows:4,value:t.bio??"",onChange:i,placeholder:"Brief professional bio shown on your published chapters…",className:`
                  w-full px-3.5 py-2.5 rounded-xl
                  border border-border bg-bg
                  text-sm text-ink placeholder:text-ink-muted
                  resize-y min-h-[96px]
                  focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
                  transition
                `})]}),e.jsxs("div",{children:[e.jsxs("label",{htmlFor:"orcid",className:"block text-sm font-medium text-ink mb-1.5",children:["ORCID iD"," ",e.jsx("span",{className:"text-ink-muted font-normal",children:"(optional)"})]}),e.jsx("input",{id:"orcid",name:"orcid",type:"text",value:t.orcid??"",onChange:i,placeholder:"0000-0000-0000-0000",className:`
                  w-full px-3.5 py-2.5 rounded-xl
                  border border-border bg-bg
                  text-sm text-ink placeholder:text-ink-muted
                  focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent
                  transition
                `})]}),l&&e.jsx("p",{className:"text-sm text-danger",role:"alert",children:l.message}),r&&e.jsxs("div",{className:`
                  flex items-center gap-2
                  bg-green-50 border border-green-200
                  rounded-xl px-4 py-3
                  text-sm font-medium text-success
                  animate-fadeSlideIn
                `,role:"status",children:[e.jsx(j,{size:16,"aria-hidden":"true"}),"Profile updated successfully."]}),e.jsx("div",{className:"flex justify-end pt-2",children:e.jsx("button",{type:"submit",disabled:a,className:`
                  flex items-center gap-2
                  px-5 py-2.5 rounded-xl
                  bg-primary text-white text-sm font-semibold
                  hover:bg-primary-light
                  disabled:opacity-60 disabled:cursor-not-allowed
                  transition-colors
                `,children:a?e.jsxs(e.Fragment,{children:[e.jsx(d,{size:15,className:"animate-spin","aria-hidden":"true"}),"Saving…"]}):"Save Changes"})})]})]})]})})}export{z as ProfilePage};
