document.addEventListener("DOMContentLoaded", () => {
  // Scroll Reveal Animation
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements manually marked with fade-in-section
  document.querySelectorAll(".fade-in-section").forEach((el) => {
    observer.observe(el);
  });

  // Automatically add fade effect to main sections if not already handled
  document.querySelectorAll(".section").forEach((section) => {
    // If the section itself doesn't have the class, we add it primarily for older sections
    // However, if we have granular animations inside, adding it to parent might double fade or hide children if parent isn't observed correctly.
    // Strategy: Add it only if no children have it, or just add it and rely on cascading visibility.
    // Safer approach: Add it to section ONLY if it's not present.
    if (!section.classList.contains("fade-in-section")) {
      section.classList.add("fade-in-section");
      observer.observe(section);
    }
  });

  // Accordion Logic (Strict: One always open)
  const accordionHeaders = document.querySelectorAll(".accordion-header");

  if (accordionHeaders.length > 0) {
    // Helper to open an item
    const openItem = (header) => {
      const content = header.nextElementSibling;
      header.classList.add("active");
      content.style.maxHeight = content.scrollHeight + "px";
    };

    // Helper to close an item
    const closeItem = (header) => {
      const content = header.nextElementSibling;
      header.classList.remove("active");
      content.style.maxHeight = null;
    };

    // Open first item by default
    openItem(accordionHeaders[0]);

    accordionHeaders.forEach((header) => {
      header.addEventListener("click", () => {
        // If already active, do nothing (keep at least one open)
        if (header.classList.contains("active")) return;

        // Close currently active item
        const activeHeader = document.querySelector(".accordion-header.active");
        if (activeHeader) {
          closeItem(activeHeader);
        }

        // Open clicked item
        openItem(header);
      });
    });
  }

  // Mobile Menu Toggle (Updated IDs)
  const hamburger = document.getElementById("nav-hamburger");
  const navMenu = document.getElementById("nav-menu");
  // Previously .nav-links, now #nav-menu is the ul.
  // Wait, in new HTML #nav-menu is hidden md:flex.
  // If we want mobile menu, we need to toggle a class that shows it.
  // The CSS for .mobile-open likely targets .nav-links.
  // My new HTML uses #nav-menu. I should check if I need to add mobile styles.
  // Ideally, I should keep the specific mobile menu logic simple.

  if (hamburger && navMenu) {
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("mobile-open"); // Ensure CSS supports this or add utility
      hamburger.classList.toggle("toggle");

      // If mobile menu is open, ensure background is solid white even at top
      if (navMenu.classList.contains("mobile-open")) {
        nav.classList.remove("bg-transparent");
        nav.classList.add("bg-white");
        nav.classList.add("text-primary");
      }
    });
  }

  // Smooth Scrolling for Anchors
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
        // Close menu
        if (navMenu && navMenu.classList.contains("mobile-open")) {
          navMenu.classList.remove("mobile-open");
          if (hamburger) hamburger.classList.remove("toggle");
        }
      }
    });
  });

  // Navbar Scroll Logic (Split Pill Design)
  const nav = document.getElementById("main-nav");
  const navBg = document.getElementById("nav-bg");

  const updateNavbar = () => {
    if (!nav || !navBg) return;

    if (window.scrollY > 20) {
      // SCROLLED STATE
      nav.classList.remove("py-6");
      nav.classList.add("py-4");

      // Show the Stacked Gradient Blur Background
      navBg.classList.remove("opacity-0");
      navBg.classList.add("opacity-100");
    } else {
      // TOP STATE
      nav.classList.add("py-6");
      nav.classList.remove("py-4");

      // Hide the Background
      navBg.classList.remove("opacity-100");
      navBg.classList.add("opacity-0");
    }
  };

  window.addEventListener("scroll", updateNavbar);
  updateNavbar(); // Init
});
