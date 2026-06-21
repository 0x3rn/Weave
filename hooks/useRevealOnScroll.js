"use client";

export function useRevealOnScroll() {
    useEffect(() => {
      const elements = document.querySelectorAll('.reveal-up, .reveal-right');
      if (elements.length === 0) return;
  
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('active');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
      );
  
      elements.forEach((el) => observer.observe(el));
  
      return () => observer.disconnect();
    }, []);
  }