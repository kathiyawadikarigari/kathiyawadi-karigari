const SUPABASE_URL = "https://ilzoosmktbjdyinaoubb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable__BsYkisgx2O0jr_Ms1LRGw_wD7EeZoc";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
const PRODUCTS = [
  {
    id: "KKPRILNNNET",
    name: "Couple Hoop Without Tassels",
    image: "assets/couple-hoop-without-tassels.jpeg",
    description: "A personalized hand-embroidered couple hoop without tassel, featuring a couple illustration, names, special date, floral details, and decorative embroidery. Its clean and elegant finish makes it perfect for weddings, anniversaries, engagements, and modern home décor.",
    sizes: [
      [6,579],[8,779],[10,1149],[12,1599],[14,2229],[16,3129],[18,4469],[20,6529],[22,9269]
    ]
  },
  {
    id: "KKPRILTNNET",
    name: "Couple Hoop With Tassels",
    image: "assets/couple-hoop-with-tassels.jpeg",
    description: "A personalized hand-embroidered couple hoop with tassel, featuring a couple illustration, names, special date, floral details, and decorative embroidery. The elegant tassel finish adds a beautiful traditional touch, making it perfect for weddings, anniversaries, engagements, and gifting.",
    sizes: [
      [6,889],[8,1149],[10,1579],[12,2099],[14,2859],[16,3829],[18,5239],[20,7369],[22,10239]
    ]
  }
];

let cart = JSON.parse(localStorage.getItem("kk_cart") || "[]");
let activeProduct = null;

const money = n => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);
const $ = s => document.querySelector(s);

function saveCart(){ localStorage.setItem("kk_cart", JSON.stringify(cart)); renderCart(); }

function renderProducts(){
  $("#productGrid").innerHTML = PRODUCTS.map(p => `
    <article class="product-card">
      <img src="${p.image}" alt="${p.name}">
      <div class="product-info">
        <p class="eyebrow">PERSONALIZED • HAND EMBROIDERY</p>
        <h3>${p.name}</h3>
        <p>${p.description}</p>
        <div class="product-meta">
          <span class="starting">Starting ${money(p.sizes[0][1])}</span>
          <button class="primary-btn" onclick="openProduct('${p.id}')">View sizes</button>
        </div>
      </div>
    </article>
  `).join("");
}

function openProduct(id){
  activeProduct = PRODUCTS.find(p => p.id === id);
  $("#modalImage").src = activeProduct.image;
  $("#modalImage").alt = activeProduct.name;
  $("#modalTitle").textContent = activeProduct.name;
  $("#modalDescription").textContent = activeProduct.description;
  $("#sizeSelect").innerHTML = activeProduct.sizes.map(([s,price]) =>
    `<option value="${s}">${s}" — ${money(price)}</option>`).join("");
  renderCustomization();
  updateModalPrice();
  $("#productModal").classList.remove("hidden");
}

function updateModalPrice(){
  const size = Number($("#sizeSelect").value);
  const entry = activeProduct.sizes.find(x => x[0] === size);
  $("#modalPrice").textContent = money(entry[1]);
  $("#modalCode").textContent = `${activeProduct.id}${String(size).padStart(2,"0")}`;
}

function renderCustomization(){
  $("#customFields").innerHTML = `
    <label>Name / names<input id="cNames" placeholder="Example: Kishan & Radha"></label>
    <label>Special date<input id="cDate" placeholder="Example: 12 March 2023"></label>
    <label>Message / other design details<textarea id="cMessage" rows="3" placeholder="Any design-specific instruction"></textarea></label>
    <p class="small">Customization is included in the listed price.</p>`;
}

function addToCart(){
  const size = Number($("#sizeSelect").value);
  const entry = activeProduct.sizes.find(x => x[0] === size);
  const item = {
    key: `${activeProduct.id}${String(size).padStart(2,"0")}`,
    code: `${activeProduct.id}${String(size).padStart(2,"0")}`,
    name: activeProduct.name,
    size,
    price: entry[1],
    image: activeProduct.image,
    customization: {
      names: $("#cNames")?.value || "",
      date: $("#cDate")?.value || "",
      message: $("#cMessage")?.value || ""
    }
  };
  const existing = cart.find(x => x.key === item.key && JSON.stringify(x.customization) === JSON.stringify(item.customization));
  if(existing) existing.qty += 1; else cart.push({...item,qty:1});
  saveCart();
  $("#productModal").classList.add("hidden");
  $("#cartDrawer").classList.remove("hidden");
}

function renderCart(){
  $("#cartCount").textContent = cart.reduce((sum,x)=>sum+x.qty,0);
  if(!cart.length){
    $("#cartItems").innerHTML = `<p>Your cart is empty.</p>`;
  } else {
    $("#cartItems").innerHTML = cart.map((x,i)=>`
      <div class="cart-row">
        <img src="${x.image}" alt="">
        <div>
          <h4>${x.name}</h4>
          <small>${x.size}" • ${x.code} • Qty ${x.qty}</small>
          <small>${money(x.price*x.qty)}</small>
        </div>
        <button class="remove" onclick="removeCart(${i})">Remove</button>
      </div>`).join("");
  }
  $("#cartTotal").textContent = money(cart.reduce((sum,x)=>sum+x.price*x.qty,0));
}
function removeCart(i){ cart.splice(i,1); saveCart(); }

async function openCheckout(){
  if(!cart.length){
    alert("Your cart is empty.");
    return;
  }

  const { data: { session } } = await supabaseClient.auth.getSession();

  if(!session){
    $("#cartDrawer").classList.add("hidden");
    $("#checkoutModal").classList.remove("hidden");
    $("#authNotice").textContent =
      "Please create an account or login before placing your order.";
    return;
  }

  $("#cartDrawer").classList.add("hidden");
  $("#checkoutModal").classList.remove("hidden");
  $("#authNotice").textContent =
    `Logged in as ${session.user.email}`;
}

async function submitOrder(e){
  e.preventDefault();
  const form = new FormData(e.target);
  const name=form.get("name"), mobile=form.get("mobile"), email=form.get("email"),
        pincode=form.get("pincode"), address=form.get("address"), customization=form.get("customization");
  const total = cart.reduce((sum,x)=>sum+x.price*x.qty,0);
  const orderId = "KK" + Date.now().toString().slice(-8);
  const lines = [
    "Hello Kathiyawadi Karigari,",
    "",
    "I want to place an order.",
    `Order ID: ${orderId}`,
    "",
    ...cart.flatMap(x=>[
      `Product: ${x.name}`,
      `Product Code: ${x.code}`,
      `Size: ${x.size}"`,
      `Price: ${money(x.price)}`,
      `Customization: ${[x.customization.names,x.customization.date,x.customization.message].filter(Boolean).join(" | ") || "See checkout details"}`,
      ""
    ]),
    `Total: ${money(total)}`,
    "",
    `Customer: ${name}`,
    `Mobile: ${mobile}`,
    `Email: ${email}`,
    `Pincode: ${pincode}`,
    `Address: ${address}`,
    `Order customization: ${customization || "—"}`,
    "",
    "Payment screenshot will be shared with the seller."
  ];
  const wa = "https://wa.me/919426931089?text=" + encodeURIComponent(lines.join("\n"));
  window.open(wa, "_blank", "noopener");
  localStorage.setItem("kk_last_order", JSON.stringify({orderId,cart,total,name,mobile,email,pincode,address,customization}));
  cart=[]; saveCart(); $("#checkoutModal").classList.add("hidden");
  alert(`Order ${orderId} prepared for WhatsApp.`);
}

document.addEventListener("click", e=>{
  const target=e.target.closest("[data-close]");
  if(target) $("#"+target.dataset.close).classList.add("hidden");
});
$("#sizeSelect").addEventListener("change", updateModalPrice);
$("#addToCartBtn").addEventListener("click", addToCart);
$("#cartBtn").addEventListener("click",()=>$("#cartDrawer").classList.remove("hidden"));
$("#checkoutBtn").addEventListener("click",openCheckout);
$("#checkoutForm").addEventListener("submit",submitOrder);

renderProducts();
renderCart();
async function checkAuth() {
  const { data: { session } } = await supabaseClient.auth.getSession();

  updateAuthUI(session);
}

function updateAuthUI(session) {
  const status = $("#authStatus");
  const name = $("#authName");
  const email = $("#authEmail");
  const password = $("#authPassword");
  const signupBtn = $("#signupBtn");
  const loginBtn = $("#loginBtn");
  const logoutBtn = $("#logoutBtn");

  if (session) {
    status.textContent = `Logged in as ${session.user.email}`;

    email.value = session.user.email;
    email.disabled = true;
    password.value = "";
    password.disabled = true;
    name.disabled = true;

    signupBtn.style.display = "none";
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
  } else {
    status.textContent = "Please login or create an account before placing your order.";

    email.disabled = false;
    password.disabled = false;
    name.disabled = false;

    signupBtn.style.display = "inline-block";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
  }
}

async function signupCustomer() {
  const name = $("#authName").value.trim();
  const email = $("#authEmail").value.trim();
  const password = $("#authPassword").value;

  if (!name || !email || password.length < 6) {
    alert("Please enter your name, email, and a password of at least 6 characters.");
    return;
  }

  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name
      }
    }
  });

  if (error) {
    alert(error.message);
    return;
  }

  if (data.session) {
    alert("Account created successfully.");
    updateAuthUI(data.session);
  } else {
    alert("Account created. Please check your email to confirm your account, then login.");
  }
}

async function loginCustomer() {
  const email = $("#authEmail").value.trim();
  const password = $("#authPassword").value;

  if (!email || !password) {
    alert("Please enter your email and password.");
    return;
  }

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    alert(error.message);
    return;
  }

  alert("Login successful.");
  updateAuthUI(data.session);
}

async function logoutCustomer() {
  const { error } = await supabaseClient.auth.signOut();

  if (error) {
    alert(error.message);
    return;
  }

  updateAuthUI(null);
}
$("#signupBtn").addEventListener("click", signupCustomer);
$("#loginBtn").addEventListener("click", loginCustomer);
$("#logoutBtn").addEventListener("click", logoutCustomer);

supabaseClient.auth.onAuthStateChange((_event, session) => {
  updateAuthUI(session);
});

checkAuth();
