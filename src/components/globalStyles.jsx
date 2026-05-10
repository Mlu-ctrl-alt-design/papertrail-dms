// Global CSS injected once at the app root. Includes the keyframes and
// utility classes (.fade-up, .slide-left, .scale-in, .shimmer) used across
// all primitives.

const GS = `
@import url('https://fonts.googleapis.com/css2?family=Segoe+UI:wght@300;400;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html,body,#root{height:100%;font-family:'Segoe UI',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
::-webkit-scrollbar{width:5px;height:5px;}::-webkit-scrollbar-track{background:transparent;}::-webkit-scrollbar-thumb{background:rgba(0,0,0,0.15);border-radius:3px;}
input,textarea,select{font-family:inherit;}input:focus,textarea:focus,select:focus{outline:none;}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:none;}}
@keyframes slideRight{from{opacity:0;transform:translateX(-12px);}to{opacity:1;transform:none;}}
@keyframes slideLeft{from{opacity:0;transform:translateX(12px);}to{opacity:1;transform:none;}}
@keyframes scaleIn{from{opacity:0;transform:scale(0.95);}to{opacity:1;transform:scale(1);}}
@keyframes shimmer{0%{background-position:-400px 0;}100%{background-position:400px 0;}}
@keyframes spin{to{transform:rotate(360deg);}}
@keyframes loadbar{0%{transform:translateX(-100%);}50%{transform:translateX(160%);}100%{transform:translateX(420%);}}
@keyframes pulse2{0%,100%{opacity:1;}50%{opacity:0.4;}}
@keyframes toastIn{from{opacity:0;transform:translateY(12px) scale(0.95);}to{opacity:1;transform:none;}}
@keyframes toastOut{to{opacity:0;transform:translateY(8px) scale(0.95);}}
.fade-up{animation:fadeUp 0.28s ease both;}
.slide-right{animation:slideRight 0.22s ease both;}
.slide-left{animation:slideLeft 0.22s ease both;}
.scale-in{animation:scaleIn 0.2s ease both;}
.shimmer{background:linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%);background-size:400px 100%;animation:shimmer 1.4s infinite;}
`;

export function GlobalStyles() {
  return <style>{GS}</style>;
}

export { GS };
