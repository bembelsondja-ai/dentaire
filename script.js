document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn && navLinks) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 768) {
                    navLinks.classList.remove('active');
                }
            });
        });
    }

    // 2. Intersection Observer for Scroll Animations (Fade-in / TranslateY)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Trigger when 15% of the element is visible
    };

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Stop observing once revealed to only animate once
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach(el => revealObserver.observe(el));

    // 3. Subtle Parallax for Hero Image
    const heroImage = document.querySelector('.hero-img');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Only apply parallax on desktop AND if user hasn't requested reduced motion
    if (heroImage && window.innerWidth >= 768 && !prefersReducedMotion) {
        window.addEventListener('scroll', () => {
            const scrollPosition = window.pageYOffset;
            // Move image slightly downward as user scrolls down
            heroImage.style.transform = `translateY(${scrollPosition * 0.25}px)`; 
        }, { passive: true }); // passive flag optimizes scrolling performance
    }

    // 4. FAQ Accordion Logic
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        if (questionBtn && answer) {
            questionBtn.addEventListener('click', () => {
                // Toggle active class for chevron rotation
                const isActive = item.classList.contains('active');
                
                // Close all other accordions (optional, but requested for clean UI)
                faqItems.forEach(otherItem => {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-answer').style.maxHeight = null;
                });

                // Open the clicked one if it wasn't active
                if (!isActive) {
                    item.classList.add('active');
                    answer.style.maxHeight = answer.scrollHeight + "px";
                }
            });
        }
    });

    // 5. Animated Stats Observer
    const statsObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const stat = entry.target;
                if(!stat.classList.contains('animated')) {
                    stat.classList.add('animated');
                    const target = parseFloat(stat.getAttribute('data-target'));
                    const formatStr = stat.getAttribute('data-format') || '';
                    const isFloat = stat.hasAttribute('data-float');
                    
                    let startTimestamp = null;
                    const duration = 2000;
                    const step = (timestamp) => {
                        if (!startTimestamp) startTimestamp = timestamp;
                        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                        // Ease out quad
                        const easeOut = progress * (2 - progress);
                        const val = easeOut * target;
                        stat.innerText = (isFloat ? val.toFixed(1) : Math.floor(val)) + formatStr;
                        if (progress < 1) {
                            window.requestAnimationFrame(step);
                        } else {
                            stat.innerText = (isFloat ? target.toFixed(1) : target) + formatStr;
                        }
                    };
                    window.requestAnimationFrame(step);
                }
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.anim-stat').forEach(stat => statsObserver.observe(stat));

    // 6. Before/After Slider Logic
    document.querySelectorAll('.ba-slider').forEach(slider => {
        const handle = slider.querySelector('.ba-handle');
        const afterWrapper = slider.querySelector('.ba-after-wrapper');
        let isDragging = false;

        const startDrag = (e) => {
            isDragging = true;
        };
        const stopDrag = () => {
            isDragging = false;
        };
        const doDrag = (e) => {
            if (!isDragging) return;
            const rect = slider.getBoundingClientRect();
            let x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
            let percent = Math.max(0, Math.min(x / rect.width * 100, 100));
            afterWrapper.style.width = percent + '%';
            handle.style.left = percent + '%';
        };

        slider.addEventListener('mousedown', startDrag);
        slider.addEventListener('touchstart', startDrag, {passive: true});
        window.addEventListener('mouseup', stopDrag);
        window.addEventListener('touchend', stopDrag);
        window.addEventListener('mousemove', doDrag);
        window.addEventListener('touchmove', doDrag, {passive: true});
    });

});

// Global Booking Widget Logic
let currentService = '';
let currentDate = '';
let currentTime = '';

window.selectService = function(el, serviceName) {
    document.querySelectorAll('.service-option').forEach(opt => opt.classList.remove('selected'));
    el.classList.add('selected');
    currentService = serviceName;
    setTimeout(() => nextStep(2), 300); // Small delay for UX
};

window.nextStep = function(step) {
    document.querySelectorAll('.booking-step').forEach(s => s.style.display = 'none');
    document.getElementById('step' + step).style.display = 'block';
    
    document.querySelectorAll('.progress-step').forEach(p => {
        const pStep = parseInt(p.getAttribute('data-step'));
        if (pStep < step) {
            p.classList.add('completed');
            p.classList.remove('active');
        } else if (pStep === step) {
            p.classList.add('active');
            p.classList.remove('completed');
        } else {
            p.classList.remove('active', 'completed');
        }
    });

    document.querySelectorAll('.progress-line').forEach((line, index) => {
        if (index < step - 1) {
            line.classList.add('completed');
        } else {
            line.classList.remove('completed');
        }
    });

    if (step === 2 && !document.getElementById('calendar-grid').innerHTML.trim()) {
        renderCalendar();
    }
};

let calMonthOffset = 0;
window.changeMonth = function(dir) {
    calMonthOffset += dir;
    renderCalendar();
};

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;
    
    const d = new Date();
    d.setMonth(d.getMonth() + calMonthOffset);
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('current-month').innerText = monthNames[d.getMonth()] + ' ' + d.getFullYear();
    
    let html = '';
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    days.forEach(day => html += `<div class="cal-day-header">${day}</div>`);
    
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
    const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    
    for (let i = 0; i < firstDay; i++) {
        html += `<div></div>`;
    }
    
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
        let isPast = calMonthOffset < 0 || (calMonthOffset === 0 && i < today.getDate());
        html += `<div class="cal-day ${isPast ? 'disabled' : ''}" onclick="selectDate(this, ${i})">${i}</div>`;
    }
    
    grid.innerHTML = html;
}

window.selectDate = function(el, day) {
    if(el.classList.contains('disabled')) return;
    document.querySelectorAll('.cal-day').forEach(d => d.classList.remove('selected'));
    el.classList.add('selected');
    const m = document.getElementById('current-month').innerText;
    currentDate = `${m.split(' ')[0]} ${day}, ${m.split(' ')[1]}`;
    document.getElementById('time-slots').style.display = 'grid';
    checkStep2();
};

window.selectTime = function(el) {
    document.querySelectorAll('.time-slot').forEach(t => t.classList.remove('selected'));
    el.classList.add('selected');
    currentTime = el.innerText;
    checkStep2();
};

function checkStep2() {
    const btn = document.getElementById('btn-step2');
    if (currentDate && currentTime) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
    }
}

window.submitBooking = function() {
    const name = document.getElementById('b-name').value;
    const email = document.getElementById('b-email').value;
    if(!name || !email) {
        alert("Please provide at least your name and email.");
        return;
    }
    
    document.getElementById('sum-service').innerText = currentService;
    document.getElementById('sum-datetime').innerText = currentDate + ' at ' + currentTime;
    
    nextStep(4);
};
