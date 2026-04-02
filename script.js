const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const hero = document.getElementById("hero");
const spotlight = document.querySelector(".spotlight");
const petalLayer = document.getElementById("petalLayer");
const revealNodes = document.querySelectorAll(".reveal");
const galleryCards = document.querySelectorAll(".gallery-card");
const messageText = document.getElementById("messageText");
const surpriseButton = document.getElementById("surpriseBtn");
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lbImage");
const lightboxCaption = document.getElementById("lbCaption");
const lightboxClose = document.getElementById("lbClose");
const endingPanel = document.getElementById("ending");

const ambientCanvas = document.getElementById("bg-canvas");
const ambientContext = ambientCanvas ? ambientCanvas.getContext("2d") : null;
const fxCanvas = document.getElementById("fx-canvas");
const fxContext = fxCanvas ? fxCanvas.getContext("2d") : null;

const ambientParticles = [];
const ambientParticleCount = prefersReducedMotion ? 24 : 52;
const celebrationParticles = [];

let typedMessageStarted = false;
let lastFocusedTrigger = null;
let endingCelebrated = false;
let celebrationAnimating = false;

function resizeCanvas(canvas, context) {
  if (!canvas || !context) {
    return;
  }

  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function buildAmbientParticles() {
  ambientParticles.length = 0;

  for (let index = 0; index < ambientParticleCount; index += 1) {
    ambientParticles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: Math.random() * 2.4 + 0.8,
      speedX: (Math.random() - 0.5) * 0.22,
      speedY: Math.random() * 0.45 + 0.1,
      opacity: Math.random() * 0.6 + 0.18,
      tone: Math.random() > 0.7 ? "gold" : Math.random() > 0.35 ? "rose" : "champagne",
    });
  }
}

function animateAmbient() {
  if (!ambientContext) {
    return;
  }

  ambientContext.clearRect(0, 0, window.innerWidth, window.innerHeight);

  ambientParticles.forEach((particle) => {
    particle.x += particle.speedX;
    particle.y += particle.speedY;

    if (particle.y > window.innerHeight + 20) {
      particle.y = -20;
      particle.x = Math.random() * window.innerWidth;
    }

    if (particle.x < -20) {
      particle.x = window.innerWidth + 20;
    }

    if (particle.x > window.innerWidth + 20) {
      particle.x = -20;
    }

    const fill =
      particle.tone === "gold"
        ? `rgba(217, 180, 118, ${particle.opacity})`
        : particle.tone === "rose"
          ? `rgba(217, 159, 170, ${particle.opacity})`
          : `rgba(242, 221, 208, ${particle.opacity})`;

    const glow =
      particle.tone === "gold"
        ? "rgba(217, 180, 118, 0.75)"
        : particle.tone === "rose"
          ? "rgba(217, 159, 170, 0.68)"
          : "rgba(242, 221, 208, 0.68)";

    ambientContext.beginPath();
    ambientContext.fillStyle = fill;
    ambientContext.shadowColor = glow;
    ambientContext.shadowBlur = particle.radius * 14;
    ambientContext.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ambientContext.fill();
  });

  requestAnimationFrame(animateAmbient);
}

function createPetals() {
  if (!petalLayer || prefersReducedMotion) {
    return;
  }

  for (let index = 0; index < 12; index += 1) {
    const petal = document.createElement("span");
    petal.className = "petal";
    petal.style.setProperty("--left", `${randomBetween(2, 98)}%`);
    petal.style.setProperty("--size", `${randomBetween(10, 18)}px`);
    petal.style.setProperty("--duration", `${randomBetween(12, 22)}s`);
    petal.style.setProperty("--delay", `${randomBetween(-18, 0)}s`);
    petal.style.setProperty("--drift", `${randomBetween(-14, 14)}vw`);
    petalLayer.appendChild(petal);
  }
}

function setupSpotlight() {
  if (prefersReducedMotion || !hero || !spotlight) {
    return;
  }

  const infoCards = document.querySelectorAll(".info-card");

  hero.addEventListener("pointermove", (event) => {
    const rect = hero.getBoundingClientRect();
    const relativeX = ((event.clientX - rect.left) / rect.width) * 100;
    const relativeY = ((event.clientY - rect.top) / rect.height) * 100;

    spotlight.style.setProperty("--x", `${relativeX}%`);
    spotlight.style.setProperty("--y", `${relativeY}%`);

    const offsetX = (event.clientX - rect.width / 2) / rect.width;
    const offsetY = (event.clientY - rect.height / 2) / rect.height;

    infoCards.forEach((card, index) => {
      const depth = index === 0 ? 10 : -10;
      card.style.transform = `translate3d(${offsetX * depth}px, ${offsetY * depth}px, 0)`;
    });
  });

  hero.addEventListener("pointerleave", () => {
    infoCards.forEach((card) => {
      card.style.transform = "";
    });
  });
}

function typeMessage(target) {
  const fullText = target.dataset.message || "";

  if (prefersReducedMotion) {
    target.textContent = fullText;
    return;
  }

  target.textContent = "";
  let index = 0;
  target.classList.add("is-typing");

  const words = fullText.split(" ");

  const step = () => {
    target.textContent += `${index === 0 ? "" : " "}${words[index]}`;
    index += 1;

    if (index < words.length) {
      const nextWord = words[index] || "";
      window.setTimeout(step, nextWord.length > 7 ? 120 : 84);
      return;
    }

    target.classList.remove("is-typing");
  };

  step();
}

function setupRevealObserver() {
  if (!("IntersectionObserver" in window)) {
    revealNodes.forEach((node) => node.classList.add("is-visible"));

    if (messageText && !typedMessageStarted) {
      typedMessageStarted = true;
      typeMessage(messageText);
    }

    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      entry.target.classList.add("is-visible");

      if (entry.target === messageText && !typedMessageStarted) {
        typedMessageStarted = true;
        typeMessage(messageText);
      }

      if (entry.target === endingPanel && !endingCelebrated) {
        endingCelebrated = true;
        releaseCelebration("soft");
      }

      observer.unobserve(entry.target);
    });
  }, {
    threshold: 0.18,
    rootMargin: "0px 0px -8% 0px"
  });

  revealNodes.forEach((node) => observer.observe(node));

  if (messageText) {
    observer.observe(messageText);
  }

  if (endingPanel) {
    observer.observe(endingPanel);
  }
}

function setupGalleryLightbox() {
  if (!lightbox || !lightboxImage || !lightboxCaption || !lightboxClose) {
    return;
  }

  galleryCards.forEach((card) => {
    card.addEventListener("click", () => {
      lastFocusedTrigger = card;
      lightboxImage.src = card.dataset.full;
      lightboxCaption.textContent = card.dataset.caption || "";
      lightbox.classList.add("active");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.classList.add("lightbox-open");
      lightboxClose.focus({ preventScroll: true });
    });

    if (!prefersReducedMotion) {
      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
        const rotateX = (0.5 - (event.clientY - rect.top) / rect.height) * 8;
        card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });

      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    }
  });
}

function closeLightbox() {
  if (!lightbox || !lightboxImage) {
    return;
  }

  if (!lightbox.classList.contains("active")) {
    return;
  }

  lightbox.classList.remove("active");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("lightbox-open");
  lightboxImage.removeAttribute("src");

  if (lastFocusedTrigger) {
    lastFocusedTrigger.focus({ preventScroll: true });
  }
}

function createBurst(x, y, amount) {
  const palette = [
    "217, 180, 118",
    "217, 159, 170",
    "242, 221, 208",
    "255, 246, 240"
  ];

  for (let index = 0; index < amount; index += 1) {
    const angle = (Math.PI * 2 * index) / amount;
    const velocity = Math.random() * 4 + 1.1;

    celebrationParticles.push({
      type: "spark",
      x,
      y,
      velocityX: Math.cos(angle) * velocity,
      velocityY: Math.sin(angle) * velocity,
      gravity: 0.02 + Math.random() * 0.03,
      alpha: 1,
      size: Math.random() * 2.6 + 1.2,
      color: palette[index % palette.length],
      decay: Math.random() * 0.018 + 0.012,
    });
  }
}

function createConfetti(amount) {
  const palette = ["217, 180, 118", "217, 159, 170", "242, 221, 208", "255, 246, 240"];

  for (let index = 0; index < amount; index += 1) {
    celebrationParticles.push({
      type: "confetti",
      x: Math.random() * window.innerWidth,
      y: -20 - Math.random() * window.innerHeight * 0.25,
      velocityX: (Math.random() - 0.5) * 2.2,
      velocityY: Math.random() * 3.2 + 1.5,
      gravity: 0.025,
      alpha: 1,
      size: Math.random() * 4 + 2.2,
      color: palette[index % palette.length],
      decay: Math.random() * 0.005 + 0.004,
      spin: (Math.random() - 0.5) * 0.25,
      rotation: Math.random() * Math.PI,
    });
  }
}

function runCelebrationFrame() {
  if (!fxContext) {
    celebrationParticles.length = 0;
    celebrationAnimating = false;
    return;
  }

  celebrationAnimating = true;
  fxContext.clearRect(0, 0, window.innerWidth, window.innerHeight);

  for (let index = celebrationParticles.length - 1; index >= 0; index -= 1) {
    const particle = celebrationParticles[index];
    particle.x += particle.velocityX;
    particle.y += particle.velocityY;
    particle.velocityY += particle.gravity;
    particle.alpha -= particle.decay;

    fxContext.save();
    fxContext.globalAlpha = Math.max(particle.alpha, 0);
    fxContext.fillStyle = `rgba(${particle.color}, 1)`;
    fxContext.shadowColor = `rgba(${particle.color}, 0.8)`;
    fxContext.shadowBlur = particle.size * 10;
    fxContext.translate(particle.x, particle.y);

    if (particle.type === "confetti") {
      particle.rotation += particle.spin;
      fxContext.rotate(particle.rotation);
      fxContext.fillRect(-particle.size / 2, -particle.size / 3, particle.size, particle.size * 0.65);
    } else {
      fxContext.beginPath();
      fxContext.arc(0, 0, particle.size, 0, Math.PI * 2);
      fxContext.fill();
    }

    fxContext.restore();

    if (particle.alpha <= 0) {
      celebrationParticles.splice(index, 1);
    }
  }

  if (celebrationParticles.length > 0) {
    requestAnimationFrame(runCelebrationFrame);
    return;
  }

  celebrationAnimating = false;
  fxContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

function releaseCelebration(mode = "full") {
  createBurst(window.innerWidth * randomBetween(0.2, 0.8), window.innerHeight * randomBetween(0.2, 0.45), mode === "soft" ? 32 : 52);
  createBurst(window.innerWidth * randomBetween(0.2, 0.8), window.innerHeight * randomBetween(0.18, 0.4), mode === "soft" ? 20 : 38);
  createConfetti(mode === "soft" ? 46 : 90);

  if (!celebrationAnimating) {
    requestAnimationFrame(runCelebrationFrame);
  }
}

function setupSurpriseButton() {
  if (!surpriseButton) {
    return;
  }

  surpriseButton.addEventListener("click", () => {
    releaseCelebration("full");
  });
}

window.addEventListener("resize", () => {
  resizeCanvas(ambientCanvas, ambientContext);
  resizeCanvas(fxCanvas, fxContext);
  buildAmbientParticles();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeLightbox();
  }
});

if (lightboxClose) {
  lightboxClose.addEventListener("click", closeLightbox);
}

if (lightbox) {
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });
}

resizeCanvas(ambientCanvas, ambientContext);
resizeCanvas(fxCanvas, fxContext);
buildAmbientParticles();
createPetals();
if (ambientContext) {
  animateAmbient();
}
setupSpotlight();
setupRevealObserver();
setupGalleryLightbox();
setupSurpriseButton();
