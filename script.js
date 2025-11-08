      (function () {
        /* -------------------------- Data & Assets -------------------------- */
        const MAX_MB = 10;
        const TYPES = ["image/png", "image/jpeg", "image/webp"];

        // Direct hairstyle image assets
        const HAIRS = [
          {
            id: "style1",
            name: "Feather",
            cat: ["Short"],
            img: "./assests/style1.png",
          },
          {
            id: "style2",
            name: "Wolf Cut",
            cat: ["Medium"],
            img: "./assests/style2.png",
          },
          {
            id: "style3",
            name: "Bob Cut",
            cat: ["curly"],
            img: "./assests/style3.png",
          },

          {
            id: "style4",
            name: "Pixie Cut",
            cat: ["Long"],
            img: "./assests/style4.png",
          },

          {
            id: "style5",
            name: "Blunt Bob",
            cat: ["medium"],
            img: "./assests/style5.png",
          },

          {
            id: "style6",
            name: "Layered Bob",
            cat: ["short"],
            img: "./assests/m1.png",
          },
          {
            id: "style7",
            name: "Buzz Cut",
            cat: ["curly"],
            img: "./assests/m2.png",
          },
          {
            id: "style6",
            name: "Crop Cut",
            cat: ["Long"],
            img: "./assests/m3.png",
          },
          {
            id: "style7",
            name: "Bob Cut",
            cat: ["medium"],
            img: "./assests/m4.png",
          },
          {
            id: "style8",
            name: "Asymmetrical Bob",
            cat: ["short"],
            img: "./assests/m5.png",
          },
        ];
        const CATS = [
          "All",
          "Short",
          "Medium",
          "Long",
          "Curly",
        ];

        function getHairDataURL(h) {
          return h.img; // just return image path
        }

        /* ------------------------- State & Elements ------------------------ */
        const views = {
          home: document.getElementById("home"),
          try: document.getElementById("try"),
          gallery: document.getElementById("gallery"),
          profile: document.getElementById("profile"),
          saved: document.getElementById("saved"),
        };
        const navLinks = [...document.querySelectorAll(".nav a.link")];
        function setRoute(hash) {
          const r = (hash || "#home").replace("#", "");
          Object.values(views).forEach((v) => (v.hidden = true));
          (views[r] || views.home).hidden = false;
          navLinks.forEach((a) =>
            a.classList.toggle("active", a.dataset.route === r)
          );
        }
        window.addEventListener("hashchange", () => setRoute(location.hash));
        setRoute(location.hash);

        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");
        const canvasHome = document.getElementById("canvasHome");
        const ctxHome = canvasHome.getContext("2d");

        let userImg = null; // HTMLImageElement
        let hairImg = null; // HTMLImageElement

        const state = {
          x: 0,
          y: 0,
          scale: 1,
          rot: 0,
        };

        const sliders = {
          x: document.getElementById("x"),
          y: document.getElementById("y"),
          scale: document.getElementById("scale"),
          rotation: document.getElementById("rotation"),
        };

        function toast(msg) {
          const el = document.getElementById("toast");
          el.textContent = msg;
          el.hidden = false;
          clearTimeout(el._t);
          el._t = setTimeout(() => {
            el.hidden = true;
          }, 2200);
        }

        /* ------------------------- Upload Handling ------------------------- */
        function validateFile(file) {
          if (!TYPES.includes(file.type))
            throw new Error("Only PNG, JPG, or WEBP allowed.");
          const mb = file.size / 1024 / 1024;
          if (mb > MAX_MB)
            throw new Error(`Max ${MAX_MB}MB. Yours: ${mb.toFixed(1)}MB`);
        }
        async function readAsDataURL(file) {
          validateFile(file);
          return await new Promise((res, rej) => {
            const r = new FileReader();
            r.onload = () => res(r.result);
            r.onerror = rej;
            r.readAsDataURL(file);
          });
        }
        async function loadImage(src) {
          return await new Promise((res, rej) => {
            const i = new Image();
            i.onload = () => res(i);
            i.onerror = rej;
            i.src = src;
          });
        }

        function setupUpload(boxId, inputId, msgId, browseId) {
          const box = document.getElementById(boxId);
          const input = document.getElementById(inputId);
          const msg = document.getElementById(msgId);
          const browse = document.getElementById(browseId);

          browse.addEventListener("click", () => input.click());
          box.addEventListener("click", (e) => {
            if (e.target === box) input.click();
          });

          box.addEventListener("dragover", (e) => {
            e.preventDefault();
            box.classList.add("drag");
          });
          box.addEventListener("dragleave", () => box.classList.remove("drag"));
          box.addEventListener("drop", async (e) => {
            e.preventDefault();
            box.classList.remove("drag");
            const f = e.dataTransfer.files?.[0];
            if (!f) return;
            try {
              const url = await readAsDataURL(f);
              await setUserImage(url);
              msg.textContent = f.name;
              toast("Photo loaded");
            } catch (err) {
              msg.textContent = err.message;
              toast(err.message);
            }
          });

          input.addEventListener("change", async () => {
            const f = input.files?.[0];
            if (!f) return;
            try {
              const url = await readAsDataURL(f);
              await setUserImage(url);
              msg.textContent = f.name;
              toast("Photo loaded");
            } catch (err) {
              msg.textContent = err.message;
              toast(err.message);
            }
          });
        }

        setupUpload("uploadBox", "fileInput", "uploadMsg", "browseBtn");
        setupUpload("uploadBox2", "fileInput2", "uploadMsg2", "browseBtn2");

        async function setUserImage(dataURL) {
          userImg = await loadImage(dataURL);
          fitStage();
          draw();
          drawHome();
        }

        async function setHairById(id) {
          const item = HAIRS.find((h) => h.id === id);
          if (!item) return;
          const url = getHairDataURL(item);
          hairImg = await loadImage(url);
          state.scale = 1;
          state.rot = 0;
          state.x = 0;
          state.y = -120;
          sliders.scale.value = state.scale;
          sliders.rotation.value = state.rot;
          sliders.x.value = state.x;
          sliders.y.value = state.y;
          draw();
          drawHome();
          toast(`${item.name} added to stage`);
          location.hash = "#try";
        }

        /* ---------------------------- Gallery UI --------------------------- */
        function renderCats(barId) {
          const bar = document.getElementById(barId);
          bar.innerHTML = "";
          CATS.forEach((c) => {
            const b = document.createElement("button");
            b.className = "btn";
            b.textContent = c;
            b.dataset.cat = c;
            b.addEventListener("click", () => {
              document
                .querySelectorAll(`[data-catbar='${barId}'] .btn`)
                .forEach((x) => x.classList.remove("active"));
              b.classList.add("active");
              renderGallery(
                barId === "catBar" ? "miniGallery" : "fullGallery",
                c
              );
            });
            bar.appendChild(b);
          });
          bar.setAttribute("data-catbar", barId);
        }

        function renderGallery(gridId, filter = "All") {
          const grid = document.getElementById(gridId);
          grid.innerHTML = "";
          const list = HAIRS.filter(
            (h) => filter === "All" || h.cat.includes(filter)
          );
          list.forEach((h) => {
            const card = document.createElement("div");
            card.className = "gallery-item glass card";
            const thumb = document.createElement("div");
            thumb.className = "gallery-thumb";
            const img = document.createElement("img");
            img.alt = h.name;
            img.loading = "lazy";
            img.src = getHairDataURL(h);
            thumb.appendChild(img);
            const meta = document.createElement("div");
            meta.className = "gallery-meta";
            meta.innerHTML = `<span>${h.name}</span><span class='pill'>${h.cat[0]}</span>`;
            card.appendChild(thumb);
            card.appendChild(meta);
            card.addEventListener("click", () => setHairById(h.id));
            grid.appendChild(card);
          });
        }

        renderCats("catBar");
        renderGallery("miniGallery");
        renderCats("catBar2");
        renderGallery("fullGallery");

        /* ---------------------------- Drawing ------------------------------ */
        function fitStage() {}
        function clear(ctx) {
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
        function drawBase(ctx) {
          const { width: w, height: h } = ctx.canvas;
          const size = 40;
          ctx.save();
          for (let y = 0; y < h; y += size) {
            for (let x = 0; x < w; x += size) {
              ctx.fillStyle =
                (x / size + y / size) % 2 === 0
                  ? "rgba(255,255,255,0.04)"
                  : "rgba(0,0,0,0.08)";
              ctx.fillRect(x, y, size, size);
            }
          }
          ctx.restore();
        }
        function drawTo(ctx) {
          clear(ctx);
          drawBase(ctx);
          const W = ctx.canvas.width,
            H = ctx.canvas.height;
          if (userImg) {
            const r = Math.min(W / userImg.width, H / userImg.height);
            const iw = userImg.width * r,
              ih = userImg.height * r;
            const ix = (W - iw) / 2,
              iy = (H - ih) / 2;
            ctx.drawImage(userImg, ix, iy, iw, ih);
            ctx.strokeStyle = "rgba(255,255,255,0.25)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(20, iy + ih * 0.28);
            ctx.lineTo(W - 20, iy + ih * 0.28);
            ctx.stroke();
          }
          if (hairImg) {
            ctx.save();
            const centerX = W / 2 + state.x;
            const centerY = H / 2 + state.y - 200;
            ctx.translate(centerX, centerY);
            ctx.rotate((state.rot * Math.PI) / 180);
            const baseW = 700;
            const baseH = 700;
            const s = state.scale;
            ctx.drawImage(
              hairImg,
              (-baseW * s) / 2,
              (-baseH * s) / 2,
              baseW * s,
              baseH * s
            );
            ctx.restore();
          }
        }
        function draw() {
          drawTo(ctx);
        }
        function drawHome() {
          drawTo(ctxHome);
        }

        /* ----------------------- Pointer Interactions ---------------------- */
        let dragging = false,
          rotating = false;
        let startX = 0,
          startY = 0,
          startState = { x: 0, y: 0, rot: 0 };
        function pointerDown(e) {
          e.preventDefault();
          startX = e.touches ? e.touches[0].clientX : e.clientX;
          startY = e.touches ? e.touches[0].clientY : e.clientY;
          dragging = true;
          rotating = e.shiftKey;
          startState = { x: state.x, y: state.y, rot: state.rot };
        }
        function pointerMove(e) {
          if (!dragging) return;
          const cx = e.touches ? e.touches[0].clientX : e.clientX;
          const cy = e.touches ? e.touches[0].clientY : e.clientY;
          const dx = cx - startX;
          const dy = cy - startY;
          if (rotating) {
            state.rot = startState.rot + dx * 0.2;
            sliders.rotation.value = state.rot;
          } else {
            state.x = startState.x + dx;
            state.y = startState.y + dy;
            sliders.x.value = state.x;
            sliders.y.value = state.y;
          }
          draw();
          drawHome();
        }
        function pointerUp() {
          dragging = false;
          rotating = false;
        }

        document
          .getElementById("stage")
          .addEventListener("mousedown", pointerDown);
        document
          .getElementById("stage")
          .addEventListener("touchstart", pointerDown, { passive: false });
        window.addEventListener("mousemove", pointerMove, { passive: false });
        window.addEventListener("touchmove", pointerMove, { passive: false });
        window.addEventListener("mouseup", pointerUp);
        window.addEventListener("touchend", pointerUp);

        document.getElementById("stage").addEventListener(
          "wheel",
          (e) => {
            e.preventDefault();
            const d = Math.sign(e.deltaY);
            state.scale = Math.min(
              3,
              Math.max(0.2, state.scale * (d > 0 ? 0.97 : 1.03))
            );
            sliders.scale.value = state.scale;
            draw();
            drawHome();
          },
          { passive: false }
        );

        window.addEventListener("keydown", (e) => {
          if (e.key === "ArrowLeft") {
            state.x -= 2;
          }
          if (e.key === "ArrowRight") {
            state.x += 2;
          }
          if (e.key === "ArrowUp") {
            state.y -= 2;
          }
          if (e.key === "ArrowDown") {
            state.y += 2;
          }
          if (e.key === "r" || e.key === "R") {
            resetTransform();
          }
          if (
            [
              "ArrowLeft",
              "ArrowRight",
              "ArrowUp",
              "ArrowDown",
              "r",
              "R",
            ].includes(e.key)
          ) {
            sliders.x.value = state.x;
            sliders.y.value = state.y;
            draw();
            drawHome();
          }
        });

        sliders.scale.addEventListener("input", () => {
          state.scale = +sliders.scale.value;
          draw();
          drawHome();
        });
        sliders.rotation.addEventListener("input", () => {
          state.rot = +sliders.rotation.value;
          draw();
          drawHome();
        });
        sliders.x.addEventListener("input", () => {
          state.x = +sliders.x.value;
          draw();
          drawHome();
        });
        sliders.y.addEventListener("input", () => {
          state.y = +sliders.y.value;
          draw();
          drawHome();
        });

        function resetTransform() {
          state.x = 0;
          state.y = -120;
          state.scale = 1;
          state.rot = 0;
          sliders.x.value = state.x;
          sliders.y.value = state.y;
          sliders.scale.value = state.scale;
          sliders.rotation.value = state.rot;
          draw();
          drawHome();
        }
        document
          .getElementById("resetBtn")
          .addEventListener("click", resetTransform);

        document.getElementById("exportBtn").addEventListener("click", () => {
          if (!userImg || !hairImg) {
            return toast("Add photo and hairstyle first");
          }
          const url = canvas.toDataURL("image/png");
          const a = document.createElement("a");
          a.href = url;
          a.download = "stylemorph-hair.png";
          a.click();
        });

        const LS_SAVED = "stylemorph_hair_saves";
        function getSaves() {
          try {
            return JSON.parse(localStorage.getItem(LS_SAVED) || "[]");
          } catch {
            return [];
          }
        }
        function setSaves(v) {
          try {
            localStorage.setItem(LS_SAVED, JSON.stringify(v));
          } catch {}
        }

        document.getElementById("saveBtn").addEventListener("click", () => {
          if (!userImg || !hairImg) {
            return toast("Add photo and hairstyle first");
          }
          const thumb = canvas.toDataURL("image/png");
          const entry = {
            id: Date.now(),
            thumb,
            state: { ...state },
            hairId:
              HAIRS.find((h) => getHairDataURL(h) === hairImg.src)?.id || null,
            user: true,
          };
          const all = getSaves();
          all.unshift(entry);
          setSaves(all);
          renderSaved();
          toast("Look saved");
        });

        function renderSaved() {
          const grid = document.getElementById("savedGrid");
          grid.innerHTML = "";
          const all = getSaves();
          all.forEach((s) => {
            const card = document.createElement("div");
            card.className = "gallery-item glass card";
            const thumb = document.createElement("div");
            thumb.className = "gallery-thumb";
            const img = document.createElement("img");
            img.src = s.thumb;
            img.alt = "Saved look";
            thumb.appendChild(img);
            const meta = document.createElement("div");
            meta.className = "gallery-meta";
            meta.innerHTML = `<span>#${s.id}</span><button class='btn'>Load</button>`;
            card.appendChild(thumb);
            card.appendChild(meta);
            meta.querySelector("button").addEventListener("click", async () => {
              if (s.hairId) {
                await setHairById(s.hairId);
              }
              Object.assign(state, s.state);
              sliders.x.value = state.x;
              sliders.y.value = state.y;
              sliders.scale.value = state.scale;
              sliders.rotation.value = state.rot;
              draw();
              drawHome();
              location.hash = "#try";
              toast("Loaded look");
            });
            grid.appendChild(card);
          });
        }
        renderSaved();

        /* ----------------------------- Profile ----------------------------- */
        const nameEl = document.getElementById("name");
        const headWEl = document.getElementById("headW");
        const faceHEl = document.getElementById("faceH");
        const prefEl = document.getElementById("pref");
        const sizeHint = document.getElementById("sizeHint");
        const LS_PROFILE = "stylemorph_hair_profile";
        function getProfile() {
          try {
            return JSON.parse(localStorage.getItem(LS_PROFILE) || "{}");
          } catch {
            return {};
          }
        }
        function setProfile(v) {
          try {
            localStorage.setItem(LS_PROFILE, JSON.stringify(v));
          } catch {}
        }

        function loadProfile() {
          const p = getProfile();
          nameEl.value = p.name || "";
          headWEl.value = p.headW || "";
          faceHEl.value = p.faceH || "";
          prefEl.value = p.pref || "Natural";
          updateHint();
        }
        function updateHint() {
          const headW = parseFloat(headWEl.value);
          if (!isFinite(headW) || headW <= 0) {
            sizeHint.textContent = "";
            return;
          }
          const suggested = clamp(headW / 20, 0.6, 1.8);
          sizeHint.textContent = `Suggested scale: ${suggested.toFixed(
            2
          )}× (based on head width)`;
        }
        function clamp(n, min, max) {
          return Math.max(min, Math.min(max, n));
        }

        document.getElementById("saveProfile").addEventListener("click", () => {
          const p = {
            name: nameEl.value,
            headW: headWEl.value,
            faceH: faceHEl.value,
            pref: prefEl.value,
          };

          setProfile(p);
          toast("Profile saved");
          updateHint();
        });
        [headWEl, faceHEl].forEach((el) =>
          el.addEventListener("input", updateHint)
        );
        loadProfile();

        /* -------------------------- Init Preview --------------------------- */
        draw();
        drawHome();
      })();
      // Navbar toggle for mobile
      document.getElementById("navToggle").addEventListener("click", () => {
        document.getElementById("navLinks").classList.toggle("show");
      });
      async function loadModels() {
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        await faceapi.nets.faceLandmark68Net.loadFromUri("/models");
      }
      loadModels();
      async function detectFaceAndFit(imageEl) {
        const detection = await faceapi
          .detectSingleFace(imageEl, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks();
        if (!detection) return toast("No face detected!");

        const landmarks = detection.landmarks;
        const forehead = landmarks.getNose()[0]; // top of nose as reference
        const chin = landmarks.getJawOutline()[8]; // chin bottom point
        const left = landmarks.getJawOutline()[0]; // left edge
        const right = landmarks.getJawOutline()[16]; // right edge

        // Calculate face size
        const faceWidth = right.x - left.x;
        const faceHeight = chin.y - forehead.y;

        // Auto position hair
        state.scale = faceWidth / (hairImg.width * 0.7); // fit hair to face width
        state.x = left.x - hairImg.width * state.scale * 0.15;
        state.y = forehead.y - hairImg.height * state.scale * 0.4;

        draw();
      }
      // Navbar toggle for mobile
      const navToggle = document.getElementById("navToggle");
      const navLinksEl = document.getElementById("navLinks");

      navToggle.addEventListener("click", () => {
        navLinksEl.classList.toggle("open");
      });
      // FAQ Accordion Functionality
      document.querySelectorAll(".faq-question").forEach((btn) => {
        btn.addEventListener("click", () => {
          const item = btn.parentElement;

          // Close other open FAQs
          document.querySelectorAll(".faq-item").forEach((faq) => {
            if (faq !== item) faq.classList.remove("active");
          });

          // Toggle current FAQ
          item.classList.toggle("active");
        });
      });
      // Dynamic Stars Example (optional)
document.querySelectorAll(".stars").forEach(starBox => {
  let rating = starBox.textContent.trim().length;
  starBox.innerHTML = "★".repeat(rating) + "☆".repeat(5 - rating);
});





// Modal functionality for Deals
/* ================== Welcome Modal ================== */
const welcomeModal = document.getElementById("welcomeModal");
const welcomeBtn = document.getElementById("welcomeBtn");
const welcomeClose = welcomeModal.querySelector(".close");

// Page load par show karo
window.addEventListener("load", () => {
  welcomeModal.style.display = "grid";
});

// Close cross ya button se
welcomeBtn.addEventListener("click", () => {
  welcomeModal.style.display = "none";
});
welcomeClose.addEventListener("click", () => {
  welcomeModal.style.display = "none";
});
/* ================== Deals Modal ================== */
const dealModal = document.getElementById("dealModal");
const dealTitle = document.getElementById("modalTitle");
const dealDetail = document.getElementById("modalDetail");
const dealClose = dealModal.querySelector(".close");
const claimOfferBtn = document.getElementById("claimOfferBtn");

// Sab deal buttons par event
document.querySelectorAll(".deal-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    dealTitle.textContent = btn.dataset.title;
    dealDetail.textContent = btn.dataset.detail;
    dealModal.style.display = "grid";
  });
});

// Close cross
dealClose.addEventListener("click", () => {
  dealModal.style.display = "none";
});

// Claim Offer button → Booking Section par scroll
claimOfferBtn.addEventListener("click", () => {
  dealModal.style.display = "none"; 
  document.getElementById("booking").scrollIntoView({
    behavior: "smooth"
  });
});

/* ===== Booking Form with Table ===== */
const bookingForm = document.getElementById("bookingForm");
const successMessage = document.getElementById("successMessage");
const timeInput = document.getElementById("time");
const slots = document.querySelectorAll(".slot");
const dateInput = document.getElementById("date");
const bookingTableBody = document.querySelector("#bookingTable tbody");

// ✅ Min date (today onwards)
let today = new Date().toISOString().split("T")[0];
dateInput.setAttribute("min", today);

// ✅ Select Time Slot
slots.forEach(slot => {
  slot.addEventListener("click", () => {
    slots.forEach(s => s.classList.remove("active"));
    slot.classList.add("active");
    timeInput.value = slot.textContent;
  });
});

// ✅ Load saved bookings from localStorage
let bookings = JSON.parse(localStorage.getItem("bookings")) || [];
renderBookings();

// ✅ Form Submit
bookingForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const service = document.getElementById("service").value;
  const date = document.getElementById("date").value;
  const time = timeInput.value;

  if (!time) {
    alert("⚠️ Please select a time slot!");
    return;
  }

  // Save booking
  const booking = { name, email, phone, service, date, time };
  bookings.push(booking);
  localStorage.setItem("bookings", JSON.stringify(bookings));

  // Update table
  renderBookings();

  successMessage.textContent = `🎉 Thank you, ${name}! Your ${service} is booked for ${date} at ${time}.`;
  successMessage.style.display = "block";

  bookingForm.reset();
  slots.forEach(s => s.classList.remove("active"));
  timeInput.value = "";
});

// ✅ Render Bookings in Table
function renderBookings() {
  bookingTableBody.innerHTML = "";
  bookings.forEach(b => {
    let row = `<tr>
      <td>${b.name}</td>
      <td>${b.service}</td>
      <td>${b.date}</td>
      <td>${b.time}</td>
      <td>${b.phone}</td>
    </tr>`;
    bookingTableBody.innerHTML += row;
  });
}


/* ===== Reviews Section ===== */
const reviewForm = document.getElementById("reviewForm");
const reviewsList = document.getElementById("reviewsList");
const ratingStars = document.querySelectorAll("#ratingStars span");
let currentRating = 0;

// Load reviews from localStorage
let reviews = JSON.parse(localStorage.getItem("reviews")) || [];
renderReviews();

// Star Rating Click
ratingStars.forEach(star => {
  star.addEventListener("click", () => {
    currentRating = star.dataset.star;
    updateStars(currentRating);
  });
});

function updateStars(rating) {
  ratingStars.forEach(s => {
    s.classList.toggle("active", s.dataset.star <= rating);
  });
}

// Handle form submission
reviewForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("reviewName").value.trim();
  const text = document.getElementById("reviewText").value.trim();

  if (currentRating === 0) {
    alert("⚠️ Please select a star rating!");
    return;
  }

  const newReview = { name, rating: currentRating, text };
  reviews.push(newReview);
  localStorage.setItem("reviews", JSON.stringify(reviews));

  renderReviews();

  reviewForm.reset();
  updateStars(0);
  currentRating = 0;
});

// Render Reviews
function renderReviews() {
  reviewsList.innerHTML = "";
  reviews.forEach((r, index) => {
    const stars = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
    const card = `
      <div class="review-card">
        <h4>${r.name}</h4>
        <div class="stars">${stars}</div>
        <p>${r.text}</p>
      </div>`;
    reviewsList.innerHTML += card;
  });
}
function setRoute(hash) {
  const r = (hash || "#home").replace("#", "");
  Object.values(views).forEach((v) => (v.hidden = true));
  (views[r] || views.home).hidden = false;
  navLinks.forEach((a) =>
    a.classList.toggle("active", a.dataset.route === r)
  );

  // 🧭 Scroll to top whenever page changes
  window.scrollTo({ top: 0, behavior: "smooth" });
}



/* ===== Scroll to Top Button ===== */
const scrollBtn = document.createElement("button");
scrollBtn.id = "scrollTopBtn";
scrollBtn.innerHTML = "↑";
scrollBtn.style.position = "fixed";
scrollBtn.style.bottom = "25px";
scrollBtn.style.right = "25px";
scrollBtn.style.padding = "12px 18px";
scrollBtn.style.fontSize = "22px";
scrollBtn.style.border = "none";
scrollBtn.style.borderRadius = "50%";
scrollBtn.style.background = "gold";
scrollBtn.style.color = "black";
scrollBtn.style.cursor = "pointer";
scrollBtn.style.boxShadow = "0 0 15px rgba(255,215,0,0.5)";
scrollBtn.style.display = "none";
scrollBtn.style.transition = "all 0.3s ease";
document.body.appendChild(scrollBtn);

// Show button after scrolling 300px
window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    scrollBtn.style.display = "block";
    scrollBtn.style.opacity = "1";
  } else {
    scrollBtn.style.display = "none";
    scrollBtn.style.opacity = "0";
  }
});

// Scroll smoothly to top
scrollBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});
