// Simple client-side implementation (no backend). Use localStorage/sessionStorage for demo purposes.
// Copy this as app.js

(function(){
  // initial products (one per category) with multiple images
  const initial = [
    {id:'sofa-1',cat:'sofas',name:'Luxe 3-Seater Sofa',price:24500,imgs:[
      'https://images.unsplash.com/photo-1549187774-b4e9a4a3b6ad?w=800&q=60',
      'https://images.unsplash.com/photo-1582582494702-2e6d5d7b0bce?w=800&q=60',
      'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800&q=60'
    ],by:'Made by Wifike'},
    {id:'bed-1',cat:'beds',name:'Urban King Bed',price:18900,imgs:[
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=60',
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=60'
    ],by:'Workshop - Ishiara Carpentry'},
    {id:'dine-1',cat:'dining',name:'Solid Wood Dining Set (6 seater)',price:32900,imgs:[
      'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800&q=60'
    ],by:'Workshop - Meru Makers'},
    {id:'chair-1',cat:'chairs',name:'Classic Dining Chair',price:4500,imgs:[
      'https://images.unsplash.com/photo-1540574163026-643ea20ade25?w=800&q=60'
    ],by:'Carpenter - Amani'},
    {id:'office-1',cat:'office',name:'Ergo Office Desk',price:12900,imgs:[
      'https://images.unsplash.com/photo-1555529771-1a20c6b5b5d6?w=800&q=60'
    ],by:'Made by Wifike'},
    {id:'outdoor-1',cat:'outdoor',name:'Garden Bench',price:5200,imgs:[
      'https://images.unsplash.com/photo-1505691723518-36a6f3f0b341?w=800&q=60'
    ],by:'Workshop - Outdoor Art'},
    {id:'storage-1',cat:'storage',name:'4-Door Wardrobe',price:18900,imgs:[
      'https://images.unsplash.com/photo-1567017029352-3b0d1b4f3b66?w=800&q=60'
    ],by:'Made by Wifike'}
  ];

  if(!localStorage.getItem('wf_products')) localStorage.setItem('wf_products', JSON.stringify(initial));
  if(!localStorage.getItem('wf_users')) localStorage.setItem('wf_users', JSON.stringify([
    {id:'admin',role:'admin',mobile:'000',password:'admin',fullname:'Admin',admitted:true}
  ]));
  if(!localStorage.getItem('wf_courses')) localStorage.setItem('wf_courses', JSON.stringify([
    {id:'c1',title:'Beginner Carpentry',desc:'Tools, safety, measuring, simple joinery',locked:true},
    {id:'c2',title:'Joinery & Finishing',desc:'Intermediate joinery and finishing techniques',locked:true},
    {id:'c3',title:'Design & Pricing',desc:'Design basics and pricing custom work',locked:false}
  ]));

  // helpers
  const $ = id => document.getElementById(id);
  const q = sel => document.querySelector(sel);
  const qa = sel => Array.from(document.querySelectorAll(sel));

  // render functions
  function renderAll(){
    renderProducts();
    renderCourses();
    updateUIOnLogin();
    renderCart();
  }

  function renderProducts(){
    const products = JSON.parse(localStorage.getItem('wf_products')||'[]');
    // mapping of category id elements
    const map = {
      sofas:'cat-sofas', beds:'cat-beds', dining:'cat-dining', chairs:'cat-chairs',
      office:'cat-office', outdoor:'cat-outdoor', storage:'cat-storage'
    };
    // clear containers
    Object.values(map).forEach(id => {
      const el = $(id);
      if(el) el.innerHTML = '';
    });

    products.forEach(p=>{
      const elId = map[p.cat] || map['sofas'];
      const container = $(elId);
      if(!container) return;
      const card = document.createElement('div');
      card.className = 'product';
      card.innerHTML = `
        <div class="badge">${p.by||'Carpenter'}</div>
        <img src="${p.imgs[0]||''}" alt="${p.name}">
        <div class="pname">${p.name}</div>
        <div class="price">KSH ${Number(p.price).toLocaleString()}</div>
        <div class="actions">
          <button class="btn small view" data-id="${p.id}">View</button>
          <button class="btn small addcart" data-id="${p.id}">Add to Cart</button>
          <button class="btn small editprod" data-id="${p.id}">Edit</button>
        </div>
      `;
      container.appendChild(card);
    });

    // placeholders for adding more
    Object.values(map).forEach(id=>{
      const el = $(id);
      if(el){
        const placeholder = document.createElement('div');
        placeholder.className = 'product';
        placeholder.style.display='flex';
        placeholder.style.alignItems='center';
        placeholder.style.justifyContent='center';
        placeholder.style.minHeight='120px';
        placeholder.innerHTML = '<div style="color:#6b6b6b">Add more items here</div>';
        el.appendChild(placeholder);
      }
    });

    // bind buttons
    qa('.product .view').forEach(b=>b.onclick = ()=>viewProduct(b.dataset.id));
    qa('.product .addcart').forEach(b=>{
      b.onclick = ()=> addToCart(b.dataset.id);
      b.style.display = isCustomer() ? 'inline-block' : 'none';
    });
    qa('.product .editprod').forEach(b=>{
      b.onclick = ()=> openEdit(b.dataset.id);
      b.style.display = (isCarpenter()||isAdmin()) ? 'inline-block' : 'none';
    });
  }

  // Auth modal
  window.openAuth = function(role, mode){
    $('authModal').classList.remove('hidden');
    $('authTitle').textContent = (mode==='signup'?'Sign Up':'Login') + ' - ' + capitalize(role);
    const fields = $('authFields'); fields.innerHTML = '';
    if(mode==='signup'){
      if(role==='customer'){
        fields.innerHTML = `
          <input id="su_mobile" placeholder="Mobile (254...)" required />
          <input id="su_password" type="password" placeholder="Password" required />
          <div style="display:flex;gap:8px">
            <input id="su_code" placeholder="Verification code" required />
            <button class="btn small" type="button" onclick="sendCode('customer')">Send Code</button>
          </div>
        `;
      } else if(role==='carpenter'){
        fields.innerHTML = `
          <input id="su_workshop" placeholder="Workshop name" required />
          <input id="su_mobile" placeholder="Mobile (254...)" required />
          <input id="su_password" type="password" placeholder="Password" required />
          <div style="display:flex;gap:8px">
            <input id="su_code" placeholder="Verification code" required />
            <button class="btn small" type="button" onclick="sendCode('carpenter')">Send Code</button>
          </div>
        `;
      } else { // learner
        fields.innerHTML = `
          <input id="su_fullname" placeholder="Full name" required />
          <input id="su_mobile" placeholder="Mobile (254...)" required />
          <input id="su_password" type="password" placeholder="Password" required />
          <div style="display:flex;gap:8px">
            <input id="su_code" placeholder="Verification code" required />
            <button class="btn small" type="button" onclick="sendCode('learner')">Send Code</button>
          </div>
        `;
      }
      $('authForm').onsubmit = (e)=>{ e.preventDefault(); handleSignup(role); };
    } else {
      fields.innerHTML = `
        <input id="li_mobile" placeholder="Mobile (254...)" required />
        <input id="li_password" type="password" placeholder="Password" required />
      `;
      $('authForm').onsubmit = (e)=>{ e.preventDefault(); handleLogin(role); };
    }
  };
  window.closeAuth = function(){ $('authModal').classList.add('hidden'); $('authMsg').textContent=''; };

  window.sendCode = function(role){
    const code = Math.floor(100000 + Math.random()*900000).toString();
    sessionStorage.setItem('wf_code_'+role, code);
    $('authMsg').textContent = 'Verification code sent (simulated): ' + code;
    setTimeout(()=> $('authMsg').textContent = '', 6000);
  };

  function handleSignup(role){
    let users = JSON.parse(localStorage.getItem('wf_users')||'[]');
    if(role==='customer'){
      const mobile = $('su_mobile').value.trim();
      const pass = $('su_password').value;
      const code = $('su_code').value.trim();
      if(code !== sessionStorage.getItem('wf_code_customer')){ $('authMsg').textContent='Wrong verification code'; return; }
      if(users.find(u=>u.mobile===mobile && u.role==='customer')){ $('authMsg').textContent='Account exists'; return; }
      users.push({id:'u'+Date.now(),role:'customer',mobile,password:pass});
      localStorage.setItem('wf_users', JSON.stringify(users));
      $('authMsg').textContent='Customer account created'; setTimeout(closeAuth,900);
    } else if(role==='carpenter'){
      const workshop = $('su_workshop').value.trim();
      const mobile = $('su_mobile').value.trim();
      const pass = $('su_password').value;
      const code = $('su_code').value.trim();
      if(code !== sessionStorage.getItem('wf_code_carpenter')){ $('authMsg').textContent='Wrong verification code'; return; }
      users.push({id:'u'+Date.now(),role:'carpenter',mobile,password:pass,workshop,approved:false});
      localStorage.setItem('wf_users', JSON.stringify(users));
      $('authMsg').textContent='Carpenter account created (awaiting admin approval)'; setTimeout(closeAuth,900);
    } else {
      const fullname = $('su_fullname').value.trim();
      const mobile = $('su_mobile').value.trim();
      const pass = $('su_password').value;
      const code = $('su_code').value.trim();
      if(code !== sessionStorage.getItem('wf_code_learner')){ $('authMsg').textContent='Wrong verification code'; return; }
      users.push({id:'u'+Date.now(),role:'learner',mobile,password:pass,fullname,admitted:false});
      localStorage.setItem('wf_users', JSON.stringify(users));
      $('authMsg').textContent='Learner account created (awaiting admin admission)'; setTimeout(closeAuth,900);
    }
  }

  function handleLogin(role){
    const mobile = $('li_mobile').value.trim();
    const pass = $('li_password').value;
    const users = JSON.parse(localStorage.getItem('wf_users')||'[]');
    const user = users.find(u=>u.mobile===mobile && u.password===pass && u.role===role);
    if(!user){ $('authMsg').textContent='Invalid credentials or role mismatch'; return; }
    if(user.role==='carpenter' && user.approved===false){ $('authMsg').textContent='Carpenter not yet approved by admin'; return; }
    if(user.role==='learner' && user.admitted===false){ $('authMsg').textContent='Learner not yet admitted by admin'; return; }
    sessionStorage.setItem('wf_session', JSON.stringify({id:user.id,role:user.role,mobile:user.mobile,workshop:user.workshop||null}));
    $('authMsg').textContent='Login successful';
    setTimeout(()=>{ closeAuth(); updateUIOnLogin(); },700);
  }

  function isCustomer(){ const s = JSON.parse(sessionStorage.getItem('wf_session')||'null'); return s && s.role==='customer'; }
  function isCarpenter(){ const s = JSON.parse(sessionStorage.getItem('wf_session')||'null'); return s && s.role==='carpenter'; }
  function isLearner(){ const s = JSON.parse(sessionStorage.getItem('wf_session')||'null'); return s && s.role==='learner'; }
  function isAdmin(){ const s = JSON.parse(sessionStorage.getItem('wf_session')||'null'); return s && s.role==='admin'; }

  function updateUIOnLogin(){
    // cart visible only to customers
    document.getElementById('checkout') && (document.getElementById('checkout').style.display = isCustomer()? 'inline-block':'none');
    // show/hide add-to-cart and edit buttons
    qa('.product .addcart').forEach(b=> b.style.display = isCustomer() ? 'inline-block' : 'none');
    qa('.product .editprod').forEach(b=> b.style.display = (isCarpenter()||isAdmin()) ? 'inline-block' : 'none');
    renderCart();
  }

  // view product (simple modal alert to show images and details)
  window.viewProduct = function(id){
    const products = JSON.parse(localStorage.getItem('wf_products')||'[]');
    const p = products.find(x=>x.id===id);
    if(!p) return alert('Product not found');
    // show images (open new tab with first image) or a simple alert summary
    let msg = `${p.name}\nBy: ${p.by||'Carpenter'}\nPrice: KSH ${p.price.toLocaleString()}\nImages:\n${p.imgs.join('\n')}`;
    alert(msg);
  };

  // edit product modal
  window.openEdit = function(id){
    const products = JSON.parse(localStorage.getItem('wf_products')||'[]');
    const p = products.find(x=>x.id===id);
    if(!p) return alert('Not found');
    $('editName').value = p.name;
    $('editPrice').value = p.price;
    $('editImages').value = (p.imgs||[]).join(',');
    $('editModal').dataset.pid = id;
    $('editModal').classList.remove('hidden');
  };
  window.closeEdit = function(){ $('editModal').classList.add('hidden'); $('editMsg').textContent=''; };

  $('editForm').onsubmit = function(e){
    e.preventDefault();
    const id = $('editModal').dataset.pid;
    const products = JSON.parse(localStorage.getItem('wf_products')||'[]');
    const p = products.find(x=>x.id===id);
    if(!p) return;
    p.name = $('editName').value.trim();
    p.price = Number($('editPrice').value);
    p.imgs = $('editImages').value.split(',').map(s=>s.trim()).filter(Boolean);
    localStorage.setItem('wf_products', JSON.stringify(products));
    $('editMsg').textContent = 'Saved';
    setTimeout(()=>{ closeEdit(); renderProducts(); },700);
  };

  // CART
  function getCart(){ return JSON.parse(localStorage.getItem('wf_cart')||'[]'); }
  function saveCart(c){ localStorage.setItem('wf_cart', JSON.stringify(c)); }
  function addToCart(pid){
    if(!isCustomer()){ alert('Only customers can add to cart. Please login or create a customer account.'); return; }
    const products = JSON.parse(localStorage.getItem('wf_products')||'[]');
    const p = products.find(x=>x.id===pid);
    if(!p) return;
    const cart = getCart();
    cart.push({id:pid,name:p.name,price:p.price});
    saveCart(cart);
    renderCart();
    alert('Added to cart');
  }
  window.removeCart = function(i){ const c = getCart(); c.splice(i,1); saveCart(c); renderCart(); }
  function renderCart(){
    const wrap = $('cartItems'); if(!wrap) return;
    const items = getCart();
    wrap.innerHTML = '';
    let total = 0;
    items.forEach((it, idx)=>{
      total += it.price;
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.style.display='flex'; div.style.justifyContent='space-between'; div.style.marginBottom='8px';
      div.innerHTML = `<div><strong>${it.name}</strong><div>KSH ${it.price.toLocaleString()}</div></div><div><button class="btn small" onclick="removeCart(${idx})">Remove</button></div>`;
      wrap.appendChild(div);
    });
    $('cartTotal').textContent = total;
    if(items.length>0) $('cart').classList.remove('hidden'); else $('cart').classList.add('hidden');
  }
  $('checkout').onclick = function(){
    if(!isCustomer()){ alert('Only customers can checkout'); return; }
    const cart = getCart();
    if(cart.length===0) return alert('Cart empty');
    alert('Simulated STK Push — enter your mobile to complete payment (demo).');
    localStorage.removeItem('wf_cart');
    renderCart();
  };

  // HELP FORM
  $('helpForm').onsubmit = function(e){
    e.preventDefault();
    const name = $('helpName').value.trim();
    const mobile = $('helpMobile').value.trim();
    const msg = $('helpMessage').value.trim();
    // simple store into localStorage messages
    const messages = JSON.parse(localStorage.getItem('wf_messages')||'[]');
    messages.push({id:'m'+Date.now(),name,mobile,msg,created:Date.now()});
    localStorage.setItem('wf_messages', JSON.stringify(messages));
    $('helpResp').textContent = 'Message received. We will contact you shortly.';
    $('helpForm').reset();
    setTimeout(()=> $('helpResp').textContent = '',5000);
  };

  // COURSES
  function renderCourses(){
    const courses = JSON.parse(localStorage.getItem('wf_courses')||'[]');
    const wrap = $('courses'); if(!wrap) return;
    wrap.innerHTML = '';
    courses.forEach(c=>{
      const d = document.createElement('div');
      d.className = 'course';
      d.innerHTML = `<h4>${c.title}</h4><p>${c.desc}</p><p>${c.locked?'<em>Available to admitted learners only</em>':''}</p><div style="margin-top:8px"><button class="btn small" onclick="openCourse('${c.id}')">Open</button></div>`;
      wrap.appendChild(d);
    });
  }
  window.openCourse = function(id){
    const courses = JSON.parse(localStorage.getItem('wf_courses')||'[]');
    const c = courses.find(x=>x.id===id);
    if(!c) return;
    if(c.locked && !isLearner()){ return alert('This course is available to admitted learners only. Please sign up and wait for admin admission.'); }
    alert('Opening course (demo): ' + c.title);
  };

  // utility & init
  function renderProducts(){ renderAllProducts(); } // small wrapper
  function renderAllProducts(){ renderProductsInner(); }
  function renderProductsInner(){ renderProducts(); } // avoid name conflict
  function renderProducts(){ /* intentionally left blank for chain */ }

  // fix circular naming by implementing final renderAllProducts:
  function renderAllProducts(){
    // implemented earlier as renderProducts() real; but to ensure call works, just call initial render function block above
    // We'll simply call the top-level function that populates categories (re-run the logic in the top region)
    const products = JSON.parse(localStorage.getItem('wf_products')||'[]');
    const map = {sofas:'cat-sofas', beds:'cat-beds', dining:'cat-dining', chairs:'cat-chairs', office:'cat-office', outdoor:'cat-outdoor', storage:'cat-storage'};
    Object.values(map).forEach(id => { const el = document.getElementById(id); if(el) el.innerHTML=''; });
    products.forEach(p=>{
      const elId = map[p.cat] || map['sofas'];
      const container = document.getElementById(elId);
      if(!container) return;
      const card = document.createElement('div');
      card.className='product';
      card.innerHTML = `<div class="badge">${p.by||'Carpenter'}</div><img src="${p.imgs[0]||''}" alt="${p.name}"><div class="pname">${p.name}</div><div class="price">KSH ${Number(p.price).toLocaleString()}</div><div class="actions"><button class="btn small view" data-id="${p.id}">View</button><button class="btn small addcart" data-id="${p.id}">Add to Cart</button><button class="btn small editprod" data-id="${p.id}">Edit</button></div>`;
      container.appendChild(card);
    });
    // placeholders
    Object.values(map).forEach(id=>{
      const el = document.getElementById(id);
      if(el){
        const placeholder = document.createElement('div');
        placeholder.className='product';
        placeholder.style.display='flex';
        placeholder.style.alignItems='center';
        placeholder.style.justifyContent='center';
        placeholder.style.minHeight='120px';
        placeholder.innerHTML = '<div style="color:#6b6b6b">Add more items here</div>';
        el.appendChild(placeholder);
      }
    });
    // bind
    qa('.product .view').forEach(b=>b.onclick = ()=>viewProduct(b.dataset.id));
    qa('.product .addcart').forEach(b=>{
      b.onclick = ()=> addToCart(b.dataset.id);
      b.style.display = isCustomer()? 'inline-block' : 'none';
    });
    qa('.product .editprod').forEach(b=>{
      b.onclick = ()=> openEdit(b.dataset.id);
      b.style.display = (isCarpenter()||isAdmin())? 'inline-block' : 'none';
    });
  }

  // small helpers used above
  function capitalize(s){ return s.charAt(0).toUpperCase()+s.slice(1); }
  window.scrollTo = function(id){ document.getElementById(id).scrollIntoView({behavior:'smooth'}); };
  window.scrollToSection = window.scrollTo;

  // attach to window for sendCode & others
  window.sendCode = window.sendCode;
  window.openAuth = window.openAuth;
  window.closeAuth = window.closeAuth;

  // expose viewProduct/addToCart/removeCart functions for inline onclicks
  window.viewProduct = window.viewProduct;
  window.addToCart = addToCart;
  window.removeCart = window.removeCart;
  window.openEdit = window.openEdit;
  window.closeEdit = window.closeEdit;
  window.openCourse = window.openCourse;

  // final initial render
  renderAllProducts();
  renderCourses();
  renderCart();
  updateUIOnLogin();

})
