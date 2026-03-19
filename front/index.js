const contactForm = document.querySelector('.contact-form');
const submitBtn = document.querySelector('.submit-btn');

if (contactForm && submitBtn) {
  const inputs = contactForm.querySelectorAll('input, textarea');

  const validateForm = () => {
    let isValid = true;
    inputs.forEach(input => {
      if (!input.value.trim()) {
        isValid = false;
      }
    });
    submitBtn.disabled = !isValid;
  };

  inputs.forEach(input => {
    input.addEventListener('input', validateForm);
  });

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    submitBtn.textContent = 'Message Envoyé !';
    submitBtn.style.backgroundColor = '#4CAF50';
    submitBtn.style.color = '#fff';
    submitBtn.disabled = true;

    // Réinitialiser après 3 secondes
    setTimeout(() => {
      contactForm.reset();
      submitBtn.textContent = 'Envoyer';
      submitBtn.style.backgroundColor = '#fff';
      submitBtn.style.color = '#000';
      validateForm();
    }, 3000);
  });
}

const toggle = document.getElementById('toggle');
const navbar = document.getElementById('navbar');

if (toggle && navbar) {
  toggle.addEventListener('click', () => {
    navbar.classList.toggle('sidebar');
    toggle.classList.toggle('toggle-active');
  });

  // Close menu when a link is clicked
  const navLinks = navbar.querySelectorAll('.link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navbar.classList.remove('sidebar');
      toggle.classList.remove('toggle-active');
    });
  });
}

// Scroll Reveal Animation Logic
const revealElements = document.querySelectorAll('.reveal');

const revealCallback = (entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      observer.unobserve(entry.target); // Anim only once
    }
  });
};

const revealObserver = new IntersectionObserver(revealCallback, {
  threshold: 0.1, // Lower threshold for mobile
  rootMargin: "0px 0px -50px 0px"
});

revealElements.forEach(el => {
  revealObserver.observe(el);
});