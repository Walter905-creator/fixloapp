// Production diagnostic probe script
// Copy and paste this into browser console to diagnose hiding issues
// Exactly as specified in the problem statement

(function(){
  const root = document.getElementById('root');
  console.log('Root exists?', !!root);
  console.log('Root children:', root?.children?.length);
  console.log('Root computed:', getComputedStyle(root));
  const hidden = [...document.querySelectorAll('body, #root, #root *')].filter(el=>{
    const s=getComputedStyle(el);
    return s.display==='none' || s.visibility==='hidden' || parseFloat(s.opacity)===0;
  }).slice(0,20);
  console.log('First hidden elements:', hidden.map(el=>({tag:el.tagName, id:el.id, cls:el.className})));
})();