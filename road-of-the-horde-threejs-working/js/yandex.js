/* Yandex Games SDK bridge: auto-init + LoadingAPI + GameplayAPI + fullscreen ads + pause/focus audio policy. */
window.YandexBridge = (()=>{
  let ysdk=null, initialized=false, gameplay=false, adOpen=false;
  const listeners={open:[],close:[],error:[]};
  const emit=(type,payload)=>listeners[type].forEach(fn=>fn(payload));
  const on=(type,fn)=>{if(listeners[type]) listeners[type].push(fn)};
  async function init(){
    try{
      if(window.YaGames?.init){ ysdk=await YaGames.init(); initialized=true; }
    }catch(e){ console.warn('Yandex SDK init failed',e); }
    try{ ysdk?.features?.LoadingAPI?.ready?.(); }catch(e){}
    window.dispatchEvent(new Event('yandex-ready'));
    return ysdk;
  }
  function start(){ gameplay=true; try{ysdk?.features?.GameplayAPI?.start?.()}catch(e){} }
  function stop(){ gameplay=false; try{ysdk?.features?.GameplayAPI?.stop?.()}catch(e){} }
  function fullscreen(){
    if(!ysdk?.adv?.showFullscreenAdv) return Promise.resolve(false);
    adOpen=true; stop(); emit('open');
    return new Promise(resolve=>{
      let done=false;
      const finish=(ok)=>{if(done)return;done=true;adOpen=false;emit('close');resolve(ok)};
      try{ ysdk.adv.showFullscreenAdv({callbacks:{onOpen:()=>{adOpen=true;stop();emit('open')},onClose:()=>finish(true),onError:(e)=>{emit('error',e);finish(false)}}}); }
      catch(e){emit('error',e);finish(false)}
    });
  }
  window.addEventListener('blur',()=>{if(!adOpen){window.dispatchEvent(new Event('external-pause'))}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&!adOpen)window.dispatchEvent(new Event('external-pause')); else if(!document.hidden&&!adOpen)window.dispatchEvent(new Event('external-resume'))});
  window.addEventListener('game_api_pause',()=>{if(!adOpen)window.dispatchEvent(new Event('external-pause'))});
  window.addEventListener('game_api_resume',()=>{if(!adOpen)window.dispatchEvent(new Event('external-resume'))});
  init();
  return {init,on,start,stop,fullscreen,get sdk(){return ysdk},get initialized(){return initialized},get adOpen(){return adOpen}};
})();
