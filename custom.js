/* ---------------- Jalali picker overlay (smart position + block native) ---------------- */
(function () {
  /* digits + helpers */
  const faDigits = "۰۱۲۳۴۵۶۷۸۹";
  const en2fa = s => (s + "").replace(/\d/g, d => faDigits[d|0]);
  const pad2 = n => (n < 10 ? "0" + n : "" + n);
  const div = (a,b)=>~~(a/b);

  /* Jalaali <-> Gregorian */
  function g2d(y,m,d){const a=div(14-m,12),y2=y+4800-a,m2=m+12*a-3;return d+div(153*m2+2,5)+365*y2+div(y2,4)-div(y2,100)+div(y2,400)-32045;}
  function d2g(j){let a=j+32044,b=div(4*a+3,146097),c=a-div(146097*b,4),d=div(4*c+3,1461),e=c-div(1461*d,4),m=div(5*e+2,153);
    return [100*b+d-4800+div(m,10), m+3-12*div(m,10), e-div(153*m+2,5)+1];}
  function jalCal(jy){const br=[-61,9,38,199,426,686,756,818,1111,1181,1210,1635,2060,2097,2192,2262,2324,2394,2456,3178];
    let bl=br.length,gy=jy+621,leapJ=-14,jp=br[0],jm,jump,n,i;
    for(i=1;i<bl;i++){jm=br[i];jump=jm-jp;if(jy<jm)break;leapJ+=div(jump,33)*8+div(jump%33,4);jp=jm}
    n=jy-jp;leapJ+=div(n,33)*8+div((n%33)+3,4);let leapG=div(gy,4)-div((div(gy,100)+1)*3,4)-150;let march=20+leapJ-leapG;
    if(jump-n===4 && jump%33===4)march++;return [(((n+1)%33)-1)%4,gy,march];}
  const isLeapJ = jy => jalCal(jy)[0]===0;
  function j2d(jy,jm,jd){let r=jalCal(jy),gy=r[1],march=r[2],gDayNo=g2d(gy,3,march)-1,jDayNo=(jm<=7?(jm-1)*31:(jm-7)*30+186)+(jd-1);return gDayNo+jDayNo+1;}
  function d2j(g){let gy=g[0],gm=g[1],gd=g[2],jdn=g2d(gy,gm,gd),jy=gy-621,r=jalCal(jy),march=r[2],jdn1f=g2d(r[1],3,march),k=jdn-jdn1f;
    if(k>=0){if(k<=185)return [jy,1+div(k,31),(k%31)+1];k-=186;return [jy,8+div(k,30),(k%30)+1];}
    jy-=1;r=jalCal(jy);march=r[2];jdn1f=g2d(r[1],3,march);k=jdn-jdn1f;
    if(k<=185)return [jy,1+div(k,31),(k%31)+1];k-=186;return [jy,8+div(k,30),(k%30)+1];}

  const monthsFa=["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];

  /* styles */
  const style = document.createElement("style");
  style.textContent = `
  .zal-jdp{position:absolute;z-index:99999;background:#fff;border:1px solid rgba(0,0,0,.12);
    border-radius:10px;box-shadow:0 12px 30px rgba(0,0,0,.12);padding:10px;direction:rtl;width:320px}
  .zal-jdp-inner{display:flex;gap:8px;align-items:center}
  .zal-jdp select{padding:6px 10px;border:1px solid #ddd;border-radius:8px}
  .zal-jdp button{padding:6px 12px;border:0;border-radius:8px;background:#111;color:#fff;cursor:pointer}
  /* hide OHRM's own calendar only while our picker is open on that field */
  .oxd-date-input.jalali-open .oxd-calendar-dropdown,
  .oxd-date-input.jalali-open .oxd-date-input-calendar,
  .oxd-date-input.jalali-open .flatpickr-calendar,
  .oxd-date-input.jalali-open [role="dialog"] { display:none !important; }
  `;
  document.head.appendChild(style);

  let picker, boundInput, boundWrap;
  function ensurePicker(){
    if(picker) return picker;
    picker = document.createElement("div");
    picker.className = "zal-jdp";
    picker.innerHTML = `
      <div class="zal-jdp-inner">
        <select class="zal-jy"></select>
        <select class="zal-jm"></select>
        <select class="zal-jd"></select>
        <button class="zal-jok">انتخاب</button>
      </div>`;
    document.body.appendChild(picker);
    return picker;
  }

  function fillDays(ySel,mSel,dSel){
    const jy = +ySel.value, jm = +mSel.value;
    const days = jm<=6 ? 31 : (jm<=11 ? 30 : (isLeapJ(jy) ? 30 : 29));
    dSel.innerHTML = "";
    for(let d=1; d<=days; d++){
      const o=document.createElement("option"); o.value=d; o.textContent=pad2(d); dSel.appendChild(o);
    }
  }

  function positionPicker(input){
    const r = input.getBoundingClientRect();
    const pw = 320, ph = 220, margin = 8;
    let left = r.right - pw;                  // try to align to input's right edge
    if (left < margin) left = r.left;         // if clipped, align to left edge
    let top = r.bottom + margin;              // prefer below the input
    const spaceBelow = window.innerHeight - r.bottom;
    if (spaceBelow < ph + margin) top = r.top - ph - margin;   // otherwise place above
    if (top < margin) top = margin;           // nudge into viewport
    picker.style.left = (window.scrollX + left) + "px";
    picker.style.top  = (window.scrollY + top)  + "px";
  }

  function openPickerFor(input){
    ensurePicker();
    boundInput = input;
    boundWrap  = input.closest('.oxd-date-input');
    boundWrap && boundWrap.classList.add('jalali-open');

    positionPicker(input);

    // defaults: today in Jalali
    const now = new Date();
    const [jyNow,jmNow,jdNow] = d2j([now.getFullYear(), now.getMonth()+1, now.getDate()]);
    const ySel = picker.querySelector(".zal-jy");
    const mSel = picker.querySelector(".zal-jm");
    const dSel = picker.querySelector(".zal-jd");
    ySel.innerHTML=""; for(let y=jyNow-70; y<=jyNow+1; y++){const o=document.createElement("option");o.value=y;o.textContent=y;ySel.appendChild(o)}
    mSel.innerHTML=""; monthsFa.forEach((n,i)=>{const o=document.createElement("option");o.value=i+1;o.textContent=n;mSel.appendChild(o);});
    ySel.value = jyNow; mSel.value = jmNow; fillDays(ySel,mSel,dSel); dSel.value = pad2(jdNow);

    ySel.onchange = ()=>fillDays(ySel,mSel,dSel);
    mSel.onchange = ()=>fillDays(ySel,mSel,dSel);

    picker.querySelector(".zal-jok").onclick = function(){
      const jy = +ySel.value, jm = +mSel.value, jd = +dSel.value;
      const [gy,gm,gd] = d2g(j2d(jy,jm,jd));
      const jstr = `${jy}/${pad2(jm)}/${pad2(jd)}`;
      input.value = en2fa(jstr);
      input.dataset.gregorianIso = `${gy}-${pad2(gm)}-${pad2(gd)}`;
      input.dispatchEvent(new Event("input",{bubbles:true}));
      input.dispatchEvent(new Event("change",{bubbles:true}));
      closePicker();
    };

    picker.style.display = "block";
  }

  function closePicker(){
    picker && (picker.style.display="none");
    boundWrap && boundWrap.classList.remove('jalali-open');
    boundInput = boundWrap = null;
  }

  /* Intercept BEFORE OHRM opens its own calendar */
  function intercept(ev){
    const wrap = ev.target.closest('.oxd-date-input');
    if(!wrap) return;
    const input = wrap.querySelector('input');
    if(!input) return;
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation();
    openPickerFor(input);
  }
  // use pointerdown in capture phase so we win the race
  document.addEventListener('pointerdown', intercept, true);

  // Close when clicking elsewhere
  document.addEventListener('pointerdown', (ev)=>{
    if(!picker || picker.style.display==="none") return;
    if(picker.contains(ev.target)) return;
    if(ev.target.closest('.oxd-date-input') === boundWrap) return;
    closePicker();
  }, true);

  // Swap back to Gregorian right before submit / save
  function swapBeforeSubmit(root){
    root.querySelectorAll?.('.oxd-date-input input[data-gregorian-iso]')
      .forEach(el=>{ el.value = el.dataset.gregorianIso; });
  }
  document.addEventListener('submit', (ev)=>swapBeforeSubmit(ev.target), true);
  document.addEventListener('click', (ev)=>{
    const btn = ev.target.closest('button,[type="submit"]');
    if(!btn) return;
    swapBeforeSubmit(btn.closest('form')||document);
  }, true);
})();
