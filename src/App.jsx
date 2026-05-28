import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = (e) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

function usePageTitle(title) {
  useEffect(() => {
    document.title = `${title} | Conservart Montreal`;
  }, [title]);
}

function SlantedDivider({ direction = 'up', from = 'transparent', to = '#0a0a0a', absolute = false }) {
  const style = absolute ? {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    zIndex: 10,
    height: '80px',
    overflow: 'hidden',
    marginBottom: '-1px'
  } : {
    width: '100%',
    height: '80px',
    overflow: 'hidden',
    background: from,
    marginBottom: '-1px'
  };

  return (
    <div style={style}>
      <svg
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        {direction === 'up' ? (
          <polygon points="0,120 1200,0 1200,120" fill={to} />
        ) : (
          <polygon points="0,0 1200,120 0,120" fill={to} />
        )}
      </svg>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Force cleanup of the GSAP pin-spacer from the Home page before resetting scroll
    const portfolioTrigger = ScrollTrigger.getById('portfolio-trigger');
    if (portfolioTrigger) {
      portfolioTrigger.kill(true); // true = revert inline styles
    }
    ScrollTrigger.refresh();

    try {
      if (window.lenis && typeof window.lenis.scrollTo === 'function') {
        if (typeof window.lenis.resize === 'function') window.lenis.resize();
        window.lenis.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo(0, 0);
      }
    } catch (e) {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}

function PageCurtain() {
  const location = useLocation();
  const [curtainState, setCurtainState] = useState('idle');
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if (location.pathname !== prevPath.current) {
      prevPath.current = location.pathname;
      setCurtainState('enter');
      const timer1 = setTimeout(() => {
        try {
          if (window.lenis && typeof window.lenis.scrollTo === 'function') {
            window.lenis.scrollTo(0, { immediate: true });
          } else {
            window.scrollTo(0, 0);
          }
        } catch (e) {
          window.scrollTo(0, 0);
        }
        setCurtainState('exit');
      }, 500);
      const timer2 = setTimeout(() => {
        setCurtainState('idle');
      }, 1000);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [location.pathname]);

  if (curtainState === 'idle') return null;

  return (
    <motion.div
      initial={{ x: '-100%' }}
      animate={{ x: curtainState === 'enter' ? '0%' : '100%' }}
      transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0a0a0a',
        borderLeft: '2px solid var(--accent)',
        borderRight: '2px solid var(--accent)',
        boxSizing: 'border-box',
        zIndex: 999999,
        pointerEvents: 'all'
      }}
    />
  );
}

function CustomCursor() {
  const canvasRef = useRef(null);
  const mouse = useRef({ x: 0, y: 0 });
  const orb = useRef({ x: 0, y: 0 });
  const trail = useRef([]);
  const ripples = useRef([]);
  const isHovered = useRef(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Enable only if device has hover and pointer: fine, and is desktop width
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    const checkEnabled = () => mediaQuery.matches && window.innerWidth > 768;
    const handleMediaChange = () => setEnabled(checkEnabled());

    setEnabled(checkEnabled());
    mediaQuery.addEventListener('change', handleMediaChange);
    window.addEventListener('resize', handleMediaChange);

    if (!checkEnabled()) {
      return () => {
        mediaQuery.removeEventListener('change', handleMediaChange);
        window.removeEventListener('resize', handleMediaChange);
      };
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    const handleMouseMove = (e) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    };

    const handleMouseDown = () => {
      ripples.current.push({
        x: mouse.current.x,
        y: mouse.current.y,
        r: 5,
        maxR: 40,
        opacity: 1
      });
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      if (
        target &&
        (target.tagName === 'A' ||
          target.tagName === 'BUTTON' ||
          target.closest('a') ||
          target.closest('button') ||
          target.classList.contains('clickable') ||
          target.getAttribute('role') === 'button')
      ) {
        isHovered.current = true;
      }
    };

    const handleMouseOut = (e) => {
      isHovered.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mouseout', handleMouseOut);

    // Initial orb pos
    orb.current.x = window.innerWidth / 2;
    orb.current.y = window.innerHeight / 2;

    let animationFrameId;
    let currentRadius = 8;
    let targetRadius = 8;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spring physics for orb position
      const dx = mouse.current.x - orb.current.x;
      const dy = mouse.current.y - orb.current.y;
      orb.current.x += dx * 0.15;
      orb.current.y += dy * 0.15;

      // Update trail array
      trail.current.unshift({ x: orb.current.x, y: orb.current.y });
      if (trail.current.length > 12) {
        trail.current.pop();
      }

      // Smooth radius transition
      targetRadius = isHovered.current ? 24 : 8;
      currentRadius += (targetRadius - currentRadius) * 0.15;

      // 1. Draw trail (comet effect)
      ctx.shadowBlur = 0;
      for (let i = trail.current.length - 1; i > 0; i--) {
        const point = trail.current[i];
        const ratio = (trail.current.length - i) / trail.current.length;
        const opacity = ratio * 0.4;
        const size = (1 - ratio) * 6 + 2;

        ctx.beginPath();
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${opacity})`;
        ctx.fill();
      }

      // 2. Draw active click ripples
      for (let i = ripples.current.length - 1; i >= 0; i--) {
        const r = ripples.current[i];
        r.r += (r.maxR - r.r) * 0.12;
        r.opacity -= 0.05;

        if (r.opacity <= 0) {
          ripples.current.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(212, 175, 55, ${r.opacity})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // 3. Draw main cursor orb
      ctx.beginPath();
      ctx.arc(orb.current.x, orb.current.y, currentRadius, 0, Math.PI * 2);

      if (isHovered.current) {
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.8)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.shadowColor = 'rgba(212, 175, 55, 0.5)';
        ctx.shadowBlur = 8;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mouseout', handleMouseOut);
      mediaQuery.removeEventListener('change', handleMediaChange);
      window.removeEventListener('resize', handleMediaChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 999999
      }}
    />
  );
}

function AsymmetricHeader({ title, subtitle, align = 'center' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const header = containerRef.current.querySelector('h2');
    if (!header) return;

    // Use SplitType to separate letters
    const text = new SplitType(header, { types: 'chars' });

    // Apply styling to specific characters
    text.chars.forEach((char, idx) => {
      if (idx % 3 === 0) {
        char.style.color = 'var(--accent)';
      }
      if (idx % 5 === 2) {
        char.style.transform = 'translateY(-4px)';
        char.style.display = 'inline-block';
      }
      if (idx % 7 === 4) {
        char.style.transform = 'translateY(4px)';
        char.style.display = 'inline-block';
      }
    });

    // Animate on scroll using GSAP
    gsap.fromTo(text.chars,
      { opacity: 0, y: 30, filter: 'blur(5px)' },
      {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 0.8,
        stagger: 0.03,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: header,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      }
    );

    return () => {
      text.revert();
    };
  }, [title]);

  return (
    <div ref={containerRef} style={{ textAlign: align, marginBottom: 'var(--space-xl)' }} className="asymmetric-header-container">
      {subtitle && (
        <span style={{ color: 'var(--accent)', letterSpacing: '0.25rem', fontSize: '0.85rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem', fontWeight: 600 }}>
          {subtitle}
        </span>
      )}
      <h2 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', color: '#fff', margin: 0, fontFamily: 'var(--font-heading)', letterSpacing: '0.05em', lineHeight: 1.1 }}>
        {title}
      </h2>
      <div style={{ width: '60px', height: '2px', backgroundColor: 'var(--accent)', margin: align === 'center' ? '1rem auto 0' : '1rem 0 0' }}></div>
    </div>
  );
}

function ProductScroll() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <section style={{ backgroundColor: '#0a0a0a', color: '#fff', padding: isMobile ? 'var(--space-lg) 0' : 'var(--space-xl) 0', position: 'relative', overflow: 'hidden', zIndex: 10 }}>
      <div className={isMobile ? "container" : ""} style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'center',
        gap: isMobile ? '2rem' : '2vw',
        width: '100%',
        maxWidth: isMobile ? '1200px' : '100vw',
        margin: '0',
        padding: isMobile ? '0 1rem' : '0',
        boxSizing: 'border-box'
      }}>
        {/* Card 1: Corporate Framing */}
        <div style={{ width: isMobile ? '100%' : '46vw', display: 'flex', flexDirection: 'column', gap: '0', boxSizing: 'border-box' }}>
          <div style={{ position: 'relative', borderRadius: isMobile ? '16px' : '0 20px 20px 0', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', zIndex: 1 }}>
            <img
              src="/conservart/images/frame_corner_ornate.png"
              style={{
                width: '100%',
                aspectRatio: isMobile ? '1/1' : '1.25/1',
                objectFit: 'cover',
                display: 'block',
                transform: isMobile ? 'none' : 'rotate(-90deg)',
                transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = isMobile ? 'scale(1.05)' : 'rotate(-90deg) scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = isMobile ? 'none' : 'rotate(-90deg)';
              }}
              alt="Ornate Gold Frame Corners"
            />
          </div>
          <div style={{
            position: 'relative',
            zIndex: 2,
            marginTop: isMobile ? '-100px' : '-220px',
            marginLeft: isMobile ? '1rem' : '4vw',
            marginRight: isMobile ? '1rem' : '0',
            width: isMobile ? 'auto' : 'calc(100% - 4vw)',
            maxWidth: isMobile ? 'none' : '440px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            padding: isMobile ? '1.5rem 1.25rem 1.25rem' : '2.5rem 2rem 2rem',
            background: 'rgba(10, 10, 10, 0.65)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}>
            <span style={{ color: '#888', letterSpacing: '0.2em', fontSize: '0.8rem', textTransform: 'uppercase' }}>01 &mdash; Professional Services</span>
            <h2 style={{ fontSize: isMobile ? '2.2rem' : '2.8rem', color: '#fff', lineHeight: '1.2', margin: '0.2rem 0', display: 'flex', flexDirection: 'column' }}>
              <span>Corporate</span>
              <span style={{ color: 'var(--accent)' }}>Framing</span>
            </h2>
            <div style={{ width: '40px', height: '2px', backgroundColor: 'var(--accent)', margin: '0.2rem 0' }}></div>
            <p style={{ fontSize: '1rem', color: '#E0E0E0', lineHeight: '1.7', margin: '0.5rem 0' }}>
              Full corporate picture framing and restoration services. Trusted by business head offices, schools, clinics, and hospitals:
            </p>
            <ul style={{ color: '#ccc', paddingLeft: '1.25rem', margin: '0.5rem 0', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li>Full Framing Services</li>
              <li>Restauration (Art &amp; Frame Restoration)</li>
              <li>Best Quality Craftsmanship</li>
              <li>100% Acid-Free Protective Materials</li>
              <li>Professional Delivery &amp; Hanging Services</li>
            </ul>
            <Link to="/corporate" style={{ marginTop: '1rem', color: '#fff', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '4px', width: 'fit-content' }}>Discover Corporate &#8594;</Link>
          </div>
        </div>

        {/* Card 2: Private Collections */}
        <div style={{ width: isMobile ? '100%' : '46vw', display: 'flex', flexDirection: 'column', gap: '0', boxSizing: 'border-box' }}>
          <div style={{ position: 'relative', borderRadius: isMobile ? '16px' : '20px 0 0 20px', overflow: 'hidden', boxShadow: 'var(--shadow-lg)', zIndex: 1 }}>
            <img
              src="/conservart/images/frame_corner_modern.png"
              style={{
                width: '100%',
                aspectRatio: isMobile ? '1/1' : '1.25/1',
                objectFit: 'cover',
                display: 'block',
                transform: isMobile ? 'none' : 'rotate(90deg)',
                transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = isMobile ? 'scale(1.05)' : 'rotate(90deg) scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = isMobile ? 'none' : 'rotate(90deg)';
              }}
              alt="Matte Black Frame Corners"
            />
          </div>
          <div style={{
            position: 'relative',
            zIndex: 2,
            marginTop: isMobile ? '-100px' : '-220px',
            marginLeft: isMobile ? '1rem' : 'auto',
            marginRight: isMobile ? '1rem' : '4vw',
            width: isMobile ? 'auto' : 'calc(100% - 4vw)',
            maxWidth: isMobile ? 'none' : '440px',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            padding: isMobile ? '1.5rem 1.25rem 1.25rem' : '2.5rem 2rem 2rem',
            background: 'rgba(10, 10, 10, 0.65)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '20px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}>
            <span style={{ color: '#888', letterSpacing: '0.2em', fontSize: '0.8rem', textTransform: 'uppercase' }}>02 &mdash; Personal Collections</span>
            <h2 style={{ fontSize: isMobile ? '2.2rem' : '2.8rem', color: '#fff', lineHeight: '1.2', margin: '0.2rem 0', display: 'flex', flexDirection: 'column' }}>
              <span>Private</span>
              <span style={{ color: 'var(--accent)' }}>Collections</span>
            </h2>
            <div style={{ width: '40px', height: '2px', backgroundColor: 'var(--accent)', margin: '0.2rem 0' }}></div>
            <p style={{ fontSize: '1rem', color: '#E0E0E0', lineHeight: '1.7', margin: '0.5rem 0' }}>
              Protect and elevate your personal collections. Our museum-grade framing is built completely in-house to secure your artwork forever:
            </p>
            <ul style={{ color: '#ccc', paddingLeft: '1.25rem', margin: '0.5rem 0', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li>Museum &amp; Conservation Framing</li>
              <li>Fine Art Consultation</li>
              <li>Handcrafted Completely In-House</li>
              <li>Wide Range of Custom Samples</li>
              <li>Tailored for All Budgets</li>
            </ul>
            <Link to="/private" style={{ marginTop: '1rem', color: '#fff', fontSize: '0.9rem', letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '4px', width: 'fit-content' }}>Discover Private &#8594;</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const REVIEWS = [
  {
    name: "Michel Tremblay",
    role: "Google Reviewer",
    text: "Very professional work. Every time I went there the result was exactly what I expected. I went for framing photos to posters to paintings, it was a success each time.",
    rating: 5
  },
  {
    name: "Sarah Jenkins",
    role: "Local Artist",
    text: "The selection of custom frames is outstanding and the guidance is always top notch. They really take their time to help you choose the perfect match. Exceptional quality and very fair prices!",
    rating: 5
  },
  {
    name: "Robert L.",
    role: "Westmount Resident",
    text: "A true master framer. They did a phenomenal job restoring a damaged gilded frame of an old family painting and reframed it with conservation museum glass. The results are spectacular.",
    rating: 5
  },
  {
    name: "Catherine Dubé",
    role: "Corporate Client",
    text: "Always outstanding service. We trust them with both our corporate office collections and our personal heirloom pieces. Honest people, superb craftsmanship, and highly professional work.",
    rating: 5
  }
];

function Testimonials() {
  return (
    <section className="section" style={{ backgroundColor: '#0A0A0A', borderTop: '1px solid var(--border)', position: 'relative', zIndex: 10 }}>
      <div className="container" style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
        <span style={{ color: 'var(--accent)', letterSpacing: '0.2em', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Decades of Trust</span>
        <h2 style={{ fontSize: '2.5rem', marginTop: '0.5rem', marginBottom: 'var(--space-xs)' }}>What Our Clients Say</h2>
        <p style={{ color: '#888' }}>Trusted by Montreal's finest galleries, corporate boardrooms, and private collectors.</p>
      </div>

      <div className="container" style={{ maxWidth: '1200px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '1.5rem',
          padding: '0.5rem'
        }}>
          {REVIEWS.map((review, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="review-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '100%',
                textAlign: 'left',
                padding: '1.75rem'
              }}
            >
              <div>
                <div style={{ color: '#FFD700', fontSize: '1.1rem', letterSpacing: '1px', marginBottom: '0.75rem' }}>★★★★★</div>
                <p style={{ fontStyle: 'italic', fontSize: '0.95rem', color: '#E0E0E0', lineHeight: '1.6', marginBottom: '1.25rem' }}>
                  "{review.text}"
                </p>
              </div>
              <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1rem' }}>
                <h4 style={{ color: '#fff', fontSize: '1rem', margin: 0, fontFamily: 'var(--font-heading)', letterSpacing: '0.03em' }}>{review.name}</h4>
                <span style={{ color: 'var(--accent)', fontSize: '0.8rem', letterSpacing: '0.05em' }}>{review.role}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const ART_PRESETS = [
  {
    id: 'landscape',
    title: 'Ethereal Landscape',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    artist: 'Fine Art Print'
  },
  {
    id: 'abstract',
    title: 'Minimalist Charcoal',
    url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop&q=80',
    artist: 'Modern Canvas'
  },
  {
    id: 'portrait',
    title: 'Renaissance Portrait',
    url: 'https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=800&auto=format&fit=crop&q=80',
    artist: 'Antique Oil'
  },
  {
    id: 'diploma',
    title: 'Academic Credentials',
    url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&auto=format&fit=crop&q=80',
    artist: 'Official Certificate'
  }
];

const FRAMES = [
  {
    id: 'ornate-gold',
    name: 'Classic Ornate Gold',
    desc: 'Museum gilded profile',
    img: '/conservart/images/real_frame_gold.png',
    innerTop: '26.8%',
    innerLeft: '26.8%',
    innerWidth: '46.4%',
    innerHeight: '46.4%'
  },
  {
    id: 'modern-black',
    name: 'Sleek Matte Black',
    desc: 'Minimal executive outline',
    img: '/conservart/images/real_frame_black.png',
    innerTop: '23.5%',
    innerLeft: '23.5%',
    innerWidth: '53.0%',
    innerHeight: '53.0%'
  },
  {
    id: 'natural-oak',
    name: 'Premium Natural Oak',
    desc: 'Solid wood gallery feel',
    img: '/conservart/images/real_frame_wood.png',
    innerTop: '27.0%',
    innerLeft: '27.0%',
    innerWidth: '46.0%',
    innerHeight: '46.0%'
  },
  {
    id: 'dark-walnut',
    name: 'Rich Dark Walnut',
    desc: 'Deep warm wood tones',
    img: '/conservart/images/real_frame_wood.png',
    filter: 'brightness(0.65) saturate(1.2) sepia(0.3) hue-rotate(-10deg)',
    innerTop: '27.0%',
    innerLeft: '27.0%',
    innerWidth: '46.0%',
    innerHeight: '46.0%'
  },
  {
    id: 'white-float',
    name: 'Contemporary Floating White',
    desc: 'Pro canvas float gap',
    img: '/conservart/images/real_frame_white.png',
    innerTop: '33.0%',
    innerLeft: '33.0%',
    innerWidth: '34.0%',
    innerHeight: '34.0%'
  }
];

const MAT_COLORS = [
  { hex: '#F4F3EF', name: 'Off-White', varName: '--mat-white' },
  { hex: '#2B2B2B', name: 'Charcoal', varName: '--mat-charcoal' },
  { hex: '#C5A059', name: 'Museum Gold', varName: '--mat-gold' },
  { hex: '#7D8C77', name: 'Sage Green', varName: '--mat-sage' },
  { hex: '#233440', name: 'Gallery Deep Blue', varName: '--mat-blue' }
];

function FrameVisualizer({
  activeFrame,
  setActiveFrame,
  selectedArt,
  setSelectedArt,
  matColor,
  setMatColor,
  matWidth,
  setMatWidth
}) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [frameStyle, setFrameStyle] = useState('ornate-gold');
  const [showMobileControls, setShowMobileControls] = useState(false);


  // Drag-to-slide states
  const [dragStartX, setDragStartX] = useState(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const hasDraggedRef = useRef(false);

  // Wheel scroll navigation hooks
  const previewBoxRef = useRef(null);
  const wheelAccumulatorRef = useRef(0);
  const lastWheelTimeRef = useRef(0);
  const handleNextFrameRef = useRef(null);
  const handlePrevFrameRef = useRef(null);

  useEffect(() => {
    handleNextFrameRef.current = handleNextFrame;
    handlePrevFrameRef.current = handlePrevFrame;
  });

  useEffect(() => {
    const box = previewBoxRef.current;
    if (!box) return;

    const onWheel = (e) => {
      const now = Date.now();
      if (now - lastWheelTimeRef.current < 650) {
        e.preventDefault();
        return;
      }

      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (Math.abs(delta) < 4) return;

      wheelAccumulatorRef.current += delta;
      const threshold = 40;
      if (Math.abs(wheelAccumulatorRef.current) > threshold) {
        e.preventDefault();
        if (wheelAccumulatorRef.current > 0) {
          if (handleNextFrameRef.current) handleNextFrameRef.current();
        } else {
          if (handlePrevFrameRef.current) handlePrevFrameRef.current();
        }
        wheelAccumulatorRef.current = 0;
        lastWheelTimeRef.current = now;
      }
    };

    box.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      box.removeEventListener('wheel', onWheel);
    };
  }, []);

  useEffect(() => {
    if (activeFrame) {
      setFrameStyle(activeFrame);
      setActiveFrame(null);
    }
  }, [activeFrame, setActiveFrame]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setSelectedArt(uploadEvent.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const currentFrameIndex = FRAMES.findIndex(f => f.id === frameStyle);

  const handlePrevFrame = () => {
    const newIndex = (currentFrameIndex - 1 + FRAMES.length) % FRAMES.length;
    setFrameStyle(FRAMES[newIndex].id);
  };

  const handleNextFrame = () => {
    const newIndex = (currentFrameIndex + 1) % FRAMES.length;
    setFrameStyle(FRAMES[newIndex].id);
  };

  const handleDragStart = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setDragStartX(clientX);
    setIsDragging(true);
    setDragOffset(0);
    hasDraggedRef.current = false;
  };

  const handleDragMove = (e) => {
    if (!isDragging || dragStartX === null) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const offset = clientX - dragStartX;
    if (Math.abs(offset) > 8) {
      hasDraggedRef.current = true;
    }
    setDragOffset(offset);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    setDragStartX(null);

    const threshold = isMobile ? 50 : 100;
    if (dragOffset > threshold) {
      handlePrevFrame();
    } else if (dragOffset < -threshold) {
      handleNextFrame();
    }
    setDragOffset(0);
  };

  const handleFrameClick = (e, action) => {
    if (hasDraggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    action();
  };

  const prevIndex = (currentFrameIndex - 1 + FRAMES.length) % FRAMES.length;
  const nextIndex = (currentFrameIndex + 1) % FRAMES.length;

  // Dynamic Sizing calculations based on drag progress
  const centerBase = isMobile ? 380 : 500;
  const sideBase = isMobile ? 80 : 250;
  const diff = centerBase - sideBase;
  const dragLimit = isMobile ? 120 : 250;
  const progress = dragStartX !== null ? Math.min(Math.max(dragOffset / dragLimit, -1), 1) : 0;

  let leftWidth = sideBase;
  let centerWidth = centerBase - diff * Math.abs(progress);
  let rightWidth = sideBase;

  if (progress > 0) {
    leftWidth = sideBase + diff * progress;
  } else if (progress < 0) {
    rightWidth = sideBase + diff * Math.abs(progress);
  }

  const getDynamicPadding = (widthVal) => {
    const sideMultiplier = isMobile ? 4 : 7;
    const centerMultiplier = isMobile ? 8 : 14;
    const wRatio = (widthVal - sideBase) / (centerBase - sideBase);
    const multiplier = sideMultiplier + (centerMultiplier - sideMultiplier) * Math.min(Math.max(wRatio, 0), 1);
    return `${matWidth * multiplier}px`;
  };

  const renderFrameItem = (frameId, position) => {
    const isLeft = frameId === FRAMES[prevIndex].id;
    const isRight = frameId === FRAMES[nextIndex].id;
    const frameObj = FRAMES.find(f => f.id === frameId);

    // Determine dynamic width
    let currentWidth = sideBase;
    if (position === 'left') {
      currentWidth = leftWidth;
    } else if (position === 'center') {
      currentWidth = centerWidth;
    } else if (position === 'right') {
      currentWidth = rightWidth;
    }

    // Determine dynamic opacity
    let currentOpacity = 0.70;
    if (position === 'center') {
      currentOpacity = 1.0 - 0.3 * Math.abs(progress);
    } else if (position === 'left' && progress > 0) {
      currentOpacity = 0.70 + 0.20 * progress;
    } else if (position === 'right' && progress < 0) {
      currentOpacity = 0.70 + 0.20 * Math.abs(progress);
    }

    const isCenter = position === 'center';

    return (
      <div
        onClick={isLeft ? (e) => handleFrameClick(e, handlePrevFrame) : (isRight ? (e) => handleFrameClick(e, handleNextFrame) : undefined)}
        className={`frame-outer ${frameId} visualizer-frame-item ${isCenter ? 'center' : 'side'}`}
        style={{
          width: `${currentWidth}px`,
          minWidth: `${currentWidth}px`,
          aspectRatio: '1/1',
          pointerEvents: 'auto',
          zIndex: (position === 'center' && Math.abs(progress) < 0.5) || (position === 'left' && progress >= 0.5) || (position === 'right' && progress <= -0.5) ? 5 : 1,
          transition: isDragging ? 'none' : 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          opacity: currentOpacity
        }}
      >
        {/* Real photographic frame overlay */}
        <img
          src={frameObj.img}
          alt={frameObj.name}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            zIndex: 2,
            pointerEvents: 'none',
            filter: `drop-shadow(0 15px 30px rgba(0, 0, 0, 0.75)) ${frameObj.filter || ''}`
          }}
        />

        {/* Dynamic matboard & artwork inside the frame opening */}
        <div
          className="matboard-container"
          style={{
            position: 'absolute',
            top: frameObj.innerTop,
            left: frameObj.innerLeft,
            width: frameObj.innerWidth,
            height: frameObj.innerHeight,
            backgroundColor: matColor,
            padding: getDynamicPadding(currentWidth),
            transition: isDragging ? 'none' : 'all 0.3s ease',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ width: '100%', height: '100%', overflow: 'hidden', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.15)' }}>
            <img src={selectedArt} alt="Artwork Preview" className="art-preview-img" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <section id="frame-visualizer-section" className="section" style={{ backgroundColor: '#050505', borderTop: '1px solid var(--border)', position: 'relative', zIndex: 10, paddingBottom: isMobile ? '1rem' : undefined }}>
      <div className="container" style={{ position: 'relative', textAlign: 'center', marginBottom: isMobile ? '0.5rem' : 'var(--space-md)' }}>
        {!isMobile && <span style={{ color: 'var(--accent)', letterSpacing: '0.2em', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Archival Preview</span>}
        <h2 style={{ fontSize: isMobile ? '1.4rem' : '2.5rem', marginTop: '0.5rem', marginBottom: isMobile ? '0' : 'var(--space-xs)', letterSpacing: '0.02em', paddingRight: isMobile ? '30px' : '0' }}>Interactive Frame Visualizer</h2>
        {!isMobile && <p style={{ color: '#888', maxWidth: '600px', margin: '0 auto', fontSize: '1rem' }}>Select or upload a custom art piece, toggle matboard colors, and customize the moulding profile to see your design in real-time.</p>}
        {isMobile && !showMobileControls && (
          <button
            onClick={() => setShowMobileControls(true)}
            aria-label="Customize Frame"
            style={{ position: 'absolute', top: '5px', right: '5px', background: 'none', color: 'var(--accent)', border: 'none', cursor: 'pointer', padding: '5px' }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          </button>
        )}
      </div>

      <div className="container">
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          background: 'none',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          border: 'none',
          boxShadow: 'none',
          borderRadius: '0',
          padding: isMobile ? '0' : '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '2.5rem'
        }}>
          {/* Centered Preview Box with Left/Right Swipe Arrows */}
          <div ref={previewBoxRef} className="visualizer-preview-box" style={{
            position: 'relative',
            width: '100%',
            aspectRatio: isMobile ? '1/1.1' : '1.8/1',
            background: 'none',
            borderRadius: '0',
            border: 'none',
            boxShadow: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '0.5rem' : '2.5rem',
            overflow: 'hidden'
          }}>
            {/* Left Swipe Button */}
            <button
              onClick={handlePrevFrame}
              aria-label="Previous Frame Style"
              style={{
                position: 'absolute',
                left: isMobile ? '10px' : '20px',
                zIndex: 10,
                background: 'rgba(20, 20, 20, 0.65)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                width: isMobile ? '36px' : '44px',
                height: isMobile ? '36px' : '44px',
                borderRadius: '50%',
                display: isMobile ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}
              className="visualizer-arrow-btn"
            >
              <svg width={isMobile ? "18" : "24"} height={isMobile ? "18" : "24"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
            </button>

            {/* Frame & Artwork Row */}
            <div
              onMouseDown={handleDragStart}
              onMouseMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onMouseLeave={handleDragEnd}
              onTouchStart={handleDragStart}
              onTouchMove={handleDragMove}
              onTouchEnd={handleDragEnd}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: isMobile ? '1.25rem' : '2.5rem',
                width: '100%',
                position: 'relative',
                zIndex: 2,
                padding: isMobile ? '0 30px' : '0 60px',
                transform: `translateX(${dragOffset}px)`,
                transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none'
              }}
            >
              {renderFrameItem(FRAMES[prevIndex].id, 'left')}
              {renderFrameItem(FRAMES[currentFrameIndex].id, 'center')}
              {renderFrameItem(FRAMES[nextIndex].id, 'right')}
            </div>

            {/* Right Swipe Button */}
            <button
              onClick={handleNextFrame}
              aria-label="Next Frame Style"
              style={{
                position: 'absolute',
                right: isMobile ? '10px' : '20px',
                zIndex: 10,
                background: 'rgba(20, 20, 20, 0.65)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
                width: isMobile ? '36px' : '44px',
                height: isMobile ? '36px' : '44px',
                borderRadius: '50%',
                display: isMobile ? 'none' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
              }}
              className="visualizer-arrow-btn"
            >
              <svg width={isMobile ? "18" : "24"} height={isMobile ? "18" : "24"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </button>

            {/* Frame Name Glass Card */}
            <div style={{
              position: 'absolute',
              top: isMobile ? 'auto' : '15px',
              bottom: isMobile ? '5px' : 'auto',
              left: '50%',
              transform: 'translateX(-50%)',
              background: isMobile ? 'rgba(10, 10, 10, 0.75)' : 'rgba(212, 175, 55, 0.15)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: isMobile ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid var(--accent)',
              padding: isMobile ? '0.6rem 1.2rem' : '0.4rem 1rem',
              borderRadius: isMobile ? '12px' : '20px',
              color: '#fff',
              fontSize: isMobile ? '0.7rem' : '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center',
              gap: isMobile ? '0.2rem' : '0.5rem',
              whiteSpace: 'nowrap',
              zIndex: 15,
              boxShadow: isMobile ? '0 10px 30px rgba(0,0,0,0.6)' : 'none'
            }}>
              <span style={{ color: isMobile ? '#aaa' : '#fff', fontSize: isMobile ? '0.6rem' : 'inherit' }}>Frame:</span>
              <span style={{ color: 'var(--accent)' }}>{FRAMES.find(f => f.id === frameStyle)?.name}</span>
            </div>

            {!isMobile && (
              <div className="visualizer-preview-label" style={{
                position: 'absolute',
                bottom: '12px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: '#888',
                fontSize: '0.75rem',
                letterSpacing: '0.05em',
                fontWeight: 500
              }}>
                SIMULATED GALLERY PREVIEW &bull; 99% UV MUSEUM GLASS STANDARD
              </div>
            )}
          </div>

          {/* Swipe Dots Indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '-1rem' }}>
            {FRAMES.map((f, idx) => (
              <button
                key={f.id}
                onClick={() => setFrameStyle(f.id)}
                style={{
                  width: frameStyle === f.id ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: frameStyle === f.id ? 'var(--accent)' : '#444',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                title={f.name}
              />
            ))}
          </div>

          {/* Adjustment Section Below */}

          <div style={{
            display: isMobile && !showMobileControls ? 'none' : 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr',
            gap: isMobile ? '1.5rem' : '2.5rem',
            borderTop: isMobile && showMobileControls ? 'none' : '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: isMobile && showMobileControls ? '0' : (isMobile ? '1.5rem' : '2rem'),
            textAlign: 'left',
            ...(isMobile && showMobileControls ? {
              position: 'fixed',
              bottom: 0,
              left: 0,
              width: '100%',
              background: 'rgba(10, 10, 10, 0.95)',
              backdropFilter: 'blur(16px)',
              borderTopLeftRadius: '24px',
              borderTopRightRadius: '24px',
              padding: '2rem 1.5rem 2.5rem',
              zIndex: 100,
              boxSizing: 'border-box',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.8)',
              borderTop: '1px solid rgba(255,255,255,0.1)'
            } : {})
          }}>
            {isMobile && showMobileControls && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                  Customization Options
                </h3>
                <button
                  onClick={() => setShowMobileControls(false)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', cursor: 'pointer' }}
                >
                  &times;
                </button>
              </div>
            )}
            {/* Column 1: Artwork Customization */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ background: 'var(--accent)', color: '#000', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>1</span>
                <h4 style={{ color: '#fff', fontSize: '1.1rem', margin: 0, fontWeight: 600 }}>Select Artwork</h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                {ART_PRESETS.map((art) => (
                  <button
                    key={art.id}
                    onClick={() => setSelectedArt(art.url)}
                    style={{
                      background: 'none',
                      border: selectedArt === art.url ? '2px solid var(--accent)' : '2px solid transparent',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      aspectRatio: '1/1',
                      padding: 0,
                      cursor: 'pointer',
                      boxShadow: selectedArt === art.url ? '0 0 12px rgba(212, 175, 55, 0.3)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                    title={art.title}
                  >
                    <img src={art.url} alt={art.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                <label className="upload-dropzone" style={{
                  border: '1px dashed rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '1rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.01)',
                  transition: 'all 0.2s ease'
                }}>
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                  <span style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>🖼️</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 500, fontSize: '0.85rem' }}>Upload custom art piece</span>
                  <span style={{ color: '#666', fontSize: '0.75rem', marginTop: '0.1rem' }}>PNG, JPG, or WEBP supported</span>
                </label>
              </div>
            </div>

            {/* Column 2: Matboard Customization */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ background: 'var(--accent)', color: '#000', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>2</span>
                  <h4 style={{ color: '#fff', fontSize: '1.1rem', margin: 0, fontWeight: 600 }}>Archival Matboard</h4>
                </div>

                <div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                    {MAT_COLORS.map((color) => (
                      <button
                        key={color.hex}
                        onClick={() => setMatColor(color.hex)}
                        style={{
                          background: color.hex,
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          border: matColor === color.hex ? '2.5px solid var(--accent)' : '2px solid rgba(255,255,255,0.15)',
                          cursor: 'pointer',
                          boxShadow: matColor === color.hex ? '0 0 10px rgba(212,175,55,0.4)' : '0 4px 10px rgba(0,0,0,0.3)',
                          transform: matColor === color.hex ? 'scale(1.1)' : 'none',
                          transition: 'all 0.2s ease'
                        }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  <div style={{ color: '#aaa', fontSize: '0.85rem' }}>
                    Color: <strong style={{ color: '#fff' }}>{MAT_COLORS.find(c => c.hex === matColor)?.name}</strong> (100% Cotton Rag)
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#aaa', fontSize: '0.9rem' }}>Margin Width:</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.95rem' }}>{matWidth.toFixed(1)}"</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="4.0"
                  step="0.5"
                  value={matWidth}
                  onChange={(e) => setMatWidth(parseFloat(e.target.value))}
                  style={{
                    width: '100%',
                    height: '6px',
                    borderRadius: '3px',
                    background: '#333',
                    outline: 'none',
                    cursor: 'pointer',
                    accentColor: 'var(--accent)'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.75rem' }}>
                  <span>No Matboard (0")</span>
                  <span>Wide Matboard (4")</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}const SHOP_ITEMS = [
  {
    id: 'masterpiece-01',
    title: '19th Century French Landscape',
    category: 'Original Artwork',
    price: '$4,500 CAD',
    desc: 'An original oil on canvas featuring a serene French countryside, beautifully preserved and housed in a period-correct, museum-grade ornate gold frame.',
    img: '/conservart/images/corporate_art_1779456943815.png',
    badge: 'Masterpiece',
    specs: {
      frame: '22k Gold Leaf Gilded Ornate Wood Frame',
      glass: '99% UV-Protective Museum Glass',
      matboard: 'Acid-Free 8-Ply Cotton Rag Matboard (2.5")',
      mounting: 'Archival Reversible T-Hinge Mount',
      dimensions: '28" x 34" (External Dimensions)'
    }
  },
  {
    id: 'jersey-01',
    title: 'Signed Vintage Hockey Jersey',
    category: 'Sports Memorabilia',
    price: '$1,800 CAD',
    desc: 'A pristine, autographed vintage hockey jersey mounted in a deep shadowbox with UV-protective museum glass and archival matting.',
    img: '/conservart/images/shop_signed_jersey.jpg',
    badge: 'Featured Curation',
    specs: {
      frame: 'Deep Modern Black Hardwood Shadowbox (2.5" depth)',
      glass: 'Tru Vue Museum Glass® (99% UV protection, anti-reflective)',
      matboard: 'Charcoal Conservation Suede Matboard (1.5")',
      mounting: 'Hand-Sewn Reversible Archival Stitching',
      dimensions: '36" x 42" x 2.75" (External Dimensions)'
    }
  },
  {
    id: 'collage-01',
    title: 'Vintage Archival Family Collage',
    category: 'Archival Collage',
    price: '$1,650 CAD',
    desc: 'A custom, multi-opening archival display featuring historic family photographs, hand-drawn schematics, and letters, mounted in an elegant custom frame.',
    img: '/conservart/images/shop_historical_collage.jpg',
    badge: 'One-of-a-Kind',
    specs: {
      frame: 'Handcrafted Antique Silver Gilded Frame with Custom Filigree',
      glass: 'Water White Premium Museum Glass',
      matboard: 'Multi-Opening Conservation-Grade Slate Matboard',
      mounting: 'Archival Photo Corners & Acid-Free Mounting Tape',
      dimensions: '24" x 28" (External Dimensions)'
    }
  },
  {
    id: 'documents-01',
    title: 'Royal Document & Medal Exhibition',
    category: 'Archival Collage',
    price: '$3,400 CAD',
    desc: 'An exquisite museum-grade gallery display comprising historical letters, certificates, passports, and military honors, float-mounted on archival backing.',
    img: '/conservart/images/shop_gallery_documents.png',
    badge: 'Museum Collection',
    specs: {
      frame: 'Premium Walnut Hardwood with Gold Fillet Accent',
      glass: 'Tru Vue Optium Museum Acrylic® (anti-reflective, shatterproof)',
      matboard: 'Double Matboard with Gold Bevel Cut Accents',
      mounting: 'Float Mounted using Japanese Mulberry Paper Hinges & Wheat Starch',
      dimensions: '32" x 32" x 1.75" (External Dimensions)'
    }
  },
  {
    id: 'masterpiece-02',
    title: 'Modern Abstract Composition',
    category: 'Original Artwork',
    price: '$2,800 CAD',
    desc: 'A striking contemporary abstract painting, floating in a sleek, modern black hardwood frame that emphasizes the vibrant colors.',
    img: '/conservart/images/private_art_1779456959009.png',
    badge: 'Exclusive',
    specs: {
      frame: 'Sleek Modern Charcoal Float Frame',
      glass: 'None (Framed float mount, varnished UV archival canvas protection)',
      matboard: 'Floating Mount with 0.5" Shadow Gap',
      mounting: 'Heavy-Duty Canvas Stretch Bars & Tension Brackets',
      dimensions: '40" x 40" (External Dimensions)'
    }
  }
];

function ShopItemModal({ item, onClose }) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (item) {
      setFormData({
        name: '',
        email: '',
        message: `I am interested in acquiring the "${item.title}" (${item.price}). Please provide more details on authentication, framing conservation, and secure delivery logistics.`
      });
      setSubmitted(false);
    }
  }, [item]);

  if (!item) return null;

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <motion.div
      className="shop-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="shop-modal-card"
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="shop-modal-close" onClick={onClose} aria-label="Close modal">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="16" y1="2" x2="2" y2="16"></line>
            <line x1="2" y1="2" x2="16" y2="16"></line>
          </svg>
        </button>

        <div className="shop-modal-grid">
          {/* Image Display Panel */}
          <div className="shop-modal-image-col">
            <div className="shop-gallery-spotlight"></div>
            <div
              className="shop-modal-img-wrap"
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              style={{ cursor: 'zoom-in' }}
            >
              <img
                src={item.img}
                alt={item.title}
                style={{
                  transform: isZoomed ? 'scale(2.2)' : 'scale(1)',
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  transition: isZoomed ? 'none' : 'transform 0.4s ease'
                }}
              />
            </div>
            <div style={{ position: 'absolute', bottom: '1rem', left: '0', right: '0', textAlign: 'center', color: '#666', fontSize: '0.75rem', pointerEvents: 'none' }}>
              Hover to examine archival details
            </div>
          </div>

          {/* Details & Inquiry Panel */}
          <div className="shop-modal-info-col">
            <span className="shop-modal-category">{item.category}</span>
            <h2 className="shop-modal-title">{item.title}</h2>
            <div className="shop-modal-price">{item.price}</div>
            
            <p className="shop-modal-desc">{item.desc}</p>

            <h3 className="shop-specs-title">Archival Spec Sheet</h3>
            <ul className="shop-specs-list">
              <li className="shop-spec-item">
                <span className="shop-spec-label">Frame Profile:</span>
                <span className="shop-spec-value">{item.specs.frame}</span>
              </li>
              <li className="shop-spec-item">
                <span className="shop-spec-label">Glass Shield:</span>
                <span className="shop-spec-value">{item.specs.glass}</span>
              </li>
              <li className="shop-spec-item">
                <span className="shop-spec-label">Matboard:</span>
                <span className="shop-spec-value">{item.specs.matboard}</span>
              </li>
              <li className="shop-spec-item">
                <span className="shop-spec-label">Mount Style:</span>
                <span className="shop-spec-value">{item.specs.mounting}</span>
              </li>
              <li className="shop-spec-item">
                <span className="shop-spec-label">Outer Size:</span>
                <span className="shop-spec-value">{item.specs.dimensions}</span>
              </li>
            </ul>

            <h3 className="shop-inquiry-title">Gallery Acquisition Request</h3>
            
            {submitted ? (
              <div className="shop-success-message">
                <h4>Acquisition Inquiry Logged</h4>
                <p>Thank you, {formData.name}. Our gallery concierge has received your request regarding the <strong>{item.title}</strong> and will follow up at <strong>{formData.email}</strong> within 24 hours to coordinate invoice, insurance, and transit logistics.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="shop-inquiry-form">
                <div className="shop-form-group">
                  <label htmlFor="modal-name">Name</label>
                  <input
                    id="modal-name"
                    type="text"
                    required
                    className="shop-form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="shop-form-group">
                  <label htmlFor="modal-email">Email Address</label>
                  <input
                    id="modal-email"
                    type="email"
                    required
                    className="shop-form-input"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                  />
                </div>
                <div className="shop-form-group">
                  <label htmlFor="modal-message">Inquiry Notes</label>
                  <textarea
                    id="modal-message"
                    required
                    rows="3"
                    className="shop-form-input shop-form-textarea"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>
                <button type="submit" disabled={isSubmitting} className="shop-submit-btn">
                  {isSubmitting ? 'Submitting Request...' : 'Send Acquisition Inquiry'}
                </button>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ShopHighlights() {
  const [selectedItem, setSelectedItem] = useState(null);

  return (
    <section style={{ padding: '100px 0', backgroundColor: '#050505', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          <span style={{ color: 'var(--accent)', letterSpacing: '0.2em', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Exclusive Sales</span>
          <h2 style={{ fontSize: '2.5rem', marginTop: '0.5rem', marginBottom: 'var(--space-xs)' }}>Featured Curations</h2>
          <p style={{ color: '#888', maxWidth: '600px', margin: '0 auto', fontSize: '1rem' }}>
            Acquire fully-framed, museum-grade masterpieces and authentic sports memorabilia from our private collection.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
          {SHOP_ITEMS.slice(0, 3).map((item) => (
            <div key={item.id} className="shop-card" onClick={() => setSelectedItem(item)}>
              <div className="shop-image-container">
                <div className="shop-gallery-spotlight"></div>
                {item.badge && <div className="shop-badge">{item.badge}</div>}
                <img src={item.img} alt={item.title} />
              </div>
              <div className="shop-content">
                <span className="shop-category">{item.category}</span>
                <h3 className="shop-title">{item.title}</h3>
                <p className="shop-desc">{item.desc}</p>
                <div className="shop-footer">
                  <span className="shop-price">{item.price}</span>
                  <button className="shop-btn" onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}>Inquire</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center' }}>
          <Link to="/shop" className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1rem' }}>
            View Full Shop Collection
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {selectedItem && (
          <ShopItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
      </AnimatePresence>
    </section>
  );
}

function Shop() {
  usePageTitle('Shop Exclusive Curations');
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedItem, setSelectedItem] = useState(null);

  const categories = ['All', 'Original Artwork', 'Sports Memorabilia', 'Archival Collage'];

  const filteredItems = activeCategory === 'All'
    ? SHOP_ITEMS
    : SHOP_ITEMS.filter(item => item.category === activeCategory);

  return (
    <div style={{ backgroundColor: '#050505', color: '#fff', minHeight: '80vh', paddingBottom: 'var(--space-xl)' }}>
      <section className="subpage-hero shop-hero">
        <div className="container">
          <span style={{ color: 'var(--accent)', letterSpacing: '0.2em', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Acquire Masterpieces</span>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', color: '#fff', margin: '0.5rem 0 1rem', fontFamily: 'var(--font-heading)' }}>Curated Shop</h1>
          <div style={{ width: '60px', height: '2px', backgroundColor: 'var(--accent)', margin: '0 auto' }}></div>
        </div>
      </section>

      <div className="container" style={{ marginTop: 'var(--space-lg)' }}>
        <p style={{ textAlign: 'center', color: '#ccc', maxWidth: '800px', margin: '0 auto var(--space-xl)', fontSize: '1.15rem', lineHeight: '1.8' }}>
          Browse our exclusive selection of framed original artwork, authenticated sports memorabilia, and rare finds. Each piece is meticulously framed in-house using conservation-grade materials and is ready to hang.
        </p>

        {/* Filter categories tabs */}
        <div className="shop-filters-container">
          {categories.map(cat => (
            <button
              key={cat}
              className={`shop-filter-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat === 'All' ? 'All Curations' : cat}
            </button>
          ))}
        </div>

        {/* Animated Products Grid */}
        <motion.div layout className="shop-grid">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35 }}
                key={item.id}
                className="shop-card"
                onClick={() => setSelectedItem(item)}
              >
                <div className="shop-image-container">
                  <div className="shop-gallery-spotlight"></div>
                  {item.badge && <div className="shop-badge">{item.badge}</div>}
                  <img src={item.img} alt={item.title} />
                </div>
                <div className="shop-content">
                  <span className="shop-category">{item.category}</span>
                  <h3 className="shop-title">{item.title}</h3>
                  <p className="shop-desc">{item.desc}</p>
                  <div className="shop-footer">
                    <span className="shop-price">{item.price}</span>
                    <button className="shop-btn" onClick={(e) => { e.stopPropagation(); setSelectedItem(item); }}>Inquire</button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        
        <div style={{ marginTop: 'var(--space-xl)', padding: 'var(--space-lg)', backgroundColor: '#0a0a0a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Interested in a specific piece?</h3>
          <p style={{ color: '#aaa', marginBottom: '1.5rem', maxWidth: '600px', margin: '0 auto 1.5rem' }}>
            We handle all shop inquiries personally to ensure secure payment, shipping logistics, and guarantee authenticity. Please contact us to reserve an item.
          </p>
          <Link to="/contact" className="btn btn-outline" style={{ color: 'var(--accent)', borderColor: 'var(--accent)' }}>
            Contact Sales Team
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {selectedItem && (
          <ShopItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
function OurCollectionsSection({ onTryFrame }) {
  const [selectedMoulding, setSelectedMoulding] = useState(null);

  return (
    <section className="section" style={{ backgroundColor: '#050505', position: 'relative', zIndex: 10, padding: '5rem 0' }}>
      <div className="container" style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
        <span style={{ color: 'var(--accent)', letterSpacing: '0.2em', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Archival Selection</span>
        <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', marginTop: '0.5rem', marginBottom: 'var(--space-sm)' }}>Our Collections</h2>
        <p style={{ color: '#ccc', maxWidth: '600px', margin: '0 auto', fontSize: '1.1rem' }}>
          Explore our extensive library of bespoke mouldings, from classic ornate museum frames to sleek modern profiles.
        </p>
      </div>

      <div className="container">
        <div className="moulding-grid">
          {/* Classic */}
          <div
            onClick={() => setSelectedMoulding('classic')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem', transition: 'all 0.3s ease' }}
            className="moulding-card-hover"
          >
            <h3 style={{ fontSize: '1.2rem', letterSpacing: '0.1em', marginBottom: 'var(--space-sm)', color: '#fff', fontFamily: 'var(--font-heading)' }}>CLASSIC</h3>
            <img src="/conservart/images/chevron_stack_classic.png" alt="Classic Frames" style={{ width: '100%', objectFit: 'contain', mixBlendMode: 'screen', maxHeight: '180px' }} />
            <span style={{ color: 'var(--accent)', fontSize: '0.8rem', marginTop: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>View Specs &bull; Click</span>
          </div>

          {/* Modern */}
          <div
            onClick={() => setSelectedMoulding('modern')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem', transition: 'all 0.3s ease' }}
            className="moulding-card-hover"
          >
            <h3 style={{ fontSize: '1.2rem', letterSpacing: '0.1em', marginBottom: 'var(--space-sm)', color: '#fff', fontFamily: 'var(--font-heading)' }}>MODERN</h3>
            <img src="/conservart/images/chevron_stack_modern.png" alt="Modern Frames" style={{ width: '100%', objectFit: 'contain', mixBlendMode: 'screen', maxHeight: '180px' }} />
            <span style={{ color: 'var(--accent)', fontSize: '0.8rem', marginTop: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>View Specs &bull; Click</span>
          </div>

          {/* Wood */}
          <div
            onClick={() => setSelectedMoulding('wood')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem', transition: 'all 0.3s ease' }}
            className="moulding-card-hover"
          >
            <h3 style={{ fontSize: '1.2rem', letterSpacing: '0.1em', marginBottom: 'var(--space-sm)', color: '#fff', fontFamily: 'var(--font-heading)' }}>WOOD</h3>
            <img src="/conservart/images/chevron_stack_wood.png" alt="Wood Frames" style={{ width: '100%', objectFit: 'contain', mixBlendMode: 'screen', maxHeight: '180px' }} />
            <span style={{ color: 'var(--accent)', fontSize: '0.8rem', marginTop: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>View Specs &bull; Click</span>
          </div>

          {/* Floating Pro */}
          <div
            onClick={() => setSelectedMoulding('floating')}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1.5rem', transition: 'all 0.3s ease' }}
            className="moulding-card-hover"
          >
            <h3 style={{ fontSize: '1.2rem', letterSpacing: '0.1em', marginBottom: 'var(--space-sm)', color: '#fff', fontFamily: 'var(--font-heading)' }}>FLOATING PRO</h3>
            <img src="/conservart/images/chevron_stack_floating.png" alt="Floating Frames" style={{ width: '100%', objectFit: 'contain', mixBlendMode: 'screen', maxHeight: '180px' }} />
            <span style={{ color: 'var(--accent)', fontSize: '0.8rem', marginTop: '1rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>View Specs &bull; Click</span>
          </div>
        </div>
      </div>

      {/* Specifications Drawer */}
      <AnimatePresence>
        {selectedMoulding && (
          <>
            <motion.div
              className="spec-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMoulding(null)}
            />
            <motion.div
              className="spec-drawer"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            >
              <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', alignItems: 'center', position: 'relative' }}>
                <button
                  onClick={() => setSelectedMoulding(null)}
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    fontSize: '2rem',
                    cursor: 'pointer'
                  }}
                  aria-label="Close details"
                >
                  &times;
                </button>

                <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={MOULDING_SPECS[selectedMoulding].img}
                    alt={MOULDING_SPECS[selectedMoulding].title}
                    style={{ width: '80%', maxHeight: '250px', objectFit: 'contain', mixBlendMode: 'screen' }}
                  />
                </div>

                <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <span style={{ color: 'var(--accent)', letterSpacing: '0.15em', fontSize: '0.8rem', fontWeight: 600 }}>TECHNICAL SPECIFICATIONS</span>
                  <h3 style={{ fontSize: '1.8rem', color: '#fff', margin: 0, fontFamily: 'var(--font-heading)' }}>
                    {MOULDING_SPECS[selectedMoulding].title}
                  </h3>

                  <p style={{ color: '#ccc', fontSize: '1rem', lineHeight: '1.7', margin: 0 }}>
                    {MOULDING_SPECS[selectedMoulding].desc}
                  </p>

                  <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ccc', marginTop: '0.5rem' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '0.5rem 0', fontWeight: 'bold', width: '150px' }}>Profile Width:</td>
                        <td style={{ padding: '0.5rem 0' }}>{MOULDING_SPECS[selectedMoulding].width}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '0.5rem 0', fontWeight: 'bold' }}>Rabbet Depth:</td>
                        <td style={{ padding: '0.5rem 0' }}>{MOULDING_SPECS[selectedMoulding].rabbet}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '0.5rem 0', fontWeight: 'bold' }}>Core Material:</td>
                        <td style={{ padding: '0.5rem 0' }}>{MOULDING_SPECS[selectedMoulding].core}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => {
                        onTryFrame(MOULDING_SPECS[selectedMoulding].visualizerStyle);
                        setSelectedMoulding(null);
                      }}
                      className="btn"
                      style={{ fontSize: '0.85rem', background: 'var(--accent)', color: '#000', fontWeight: 'bold', border: 'none' }}
                    >
                      Try in Live Visualizer
                    </button>
                    <button
                      onClick={() => setSelectedMoulding(null)}
                      className="btn"
                      style={{ fontSize: '0.85rem' }}
                    >
                      Back to Gallery
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}

function Home() {
  const [activeFrame, setActiveFrame] = useState(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const handleTryFrame = (style) => {
    setActiveFrame(style);
    setTimeout(() => {
      document.getElementById('frame-visualizer-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="home-page-container">
      {/* Visual Moulding Portfolio containing the integrated Frame Visualizer */}
      <MouldingPortfolio
        onTryFrame={handleTryFrame}
        activeFrame={activeFrame}
        setActiveFrame={setActiveFrame}
      />

      {/* Our Collections Section (Visible on both desktop & mobile) */}
      <OurCollectionsSection onTryFrame={handleTryFrame} />

      <SlantedDivider direction="up" from="#050505" to="#0a0a0a" />

      <div style={{ backgroundColor: '#0a0a0a', paddingBottom: 'var(--space-md)' }}>
        {/* 3D Frame Anatomy Section */}
        <FrameAnatomy />
      </div>

      <SlantedDivider direction="down" from="#0a0a0a" to="#050505" />

      {/* Featured Shop Collection */}
      <ShopHighlights />

      {/* Customer Testimonials reviews grid */}
      <Testimonials />
    </div>
  );
}

const MOULDING_SPECS = {
  classic: {
    title: "CLASSIC ORNATE COLLECTION",
    img: "/conservart/images/chevron_stack_classic.png",
    width: "3.5 inches (89mm)",
    rabbet: "1.25 inches (32mm)",
    core: "Gesso-primed solid pine with gold leaf gilding",
    desc: "A timeless, heavy-profile collection designed for historic works, traditional oil on canvas, and grand museum settings. Our gilders hand-rub each corner to give it a rich antiqued patina.",
    visualizerStyle: "ornate-gold"
  },
  modern: {
    title: "MODERN MINIMALIST COLLECTION",
    img: "/conservart/images/chevron_stack_modern.png",
    width: "1.5 inches (38mm)",
    rabbet: "0.85 inches (22mm)",
    core: "Structured anodized hardwood with matte lacquer",
    desc: "A sleek, clean-edged outline ideal for contemporary prints, black-and-white photography, and sleek executive offices. The low profile keeps visual focus purely on the artwork.",
    visualizerStyle: "modern-black"
  },
  wood: {
    title: "NATURAL ARCHIVAL WOOD COLLECTION",
    img: "/conservart/images/chevron_stack_wood.png",
    width: "2.0 inches (51mm)",
    rabbet: "1.0 inch (25mm)",
    core: "Solid American Walnut or White Oak with protective oils",
    desc: "Crafted from raw, sustainably sourced hardwoods, this organic series is perfect for pastels, sketches, textile mounts, and warm domestic spaces. Sealed with natural beeswax.",
    visualizerStyle: "natural-oak"
  },
  floating: {
    title: "FLOATING CANVAS GALLERY PRO",
    img: "/conservart/images/chevron_stack_floating.png",
    width: "0.75 inch face, 2.5 inches depth",
    rabbet: "Deep shadowbox cavity",
    core: "Solid maple with clean internal mounting spacers",
    desc: "Designed exclusively for heavy-duty gallery-wrap canvases. The canvas sits suspended inside the frame with a 0.25 inch perimeter gap, creating an incredible three-dimensional shadow hover effect.",
    visualizerStyle: "white-float"
  }
};

function SingleFramePreview({
  frameId,
  selectedArt,
  matColor,
  matWidth,
  size = 440
}) {
  const frameObj = FRAMES.find(f => f.id === frameId);
  if (!frameObj) return null;

  const multiplier = 12.5;
  const paddingVal = `${matWidth * multiplier}px`;

  return (
    <div
      className={`frame-outer ${frameId}`}
      style={{
        width: `${size}px`,
        maxWidth: '100%',
        aspectRatio: '1/1',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}
    >
      <img
        src={frameObj.img}
        alt={frameObj.name}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          zIndex: 2,
          pointerEvents: 'none',
          filter: `drop-shadow(0 15px 30px rgba(0, 0, 0, 0.75)) ${frameObj.filter || ''}`
        }}
      />

      <div
        className="matboard-container"
        style={{
          position: 'absolute',
          top: frameObj.innerTop,
          left: frameObj.innerLeft,
          width: frameObj.innerWidth,
          height: frameObj.innerHeight,
          backgroundColor: matColor,
          padding: paddingVal,
          transition: 'all 0.3s ease',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ width: '100%', height: '100%', overflow: 'hidden', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.15)' }}>
          <img
            src={selectedArt}
            alt="Artwork Preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>
    </div>
  );
}

function FrameCustomizerControls({
  selectedArt,
  setSelectedArt,
  matColor,
  setMatColor,
  matWidth,
  setMatWidth,
  isMobile
}) {
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setSelectedArt(uploadEvent.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  if (isMobile) {
    return (
      <div className="customizer-controls-container" style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '1rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        paddingTop: '1.5rem',
        textAlign: 'center',
        width: '100%',
        maxWidth: '480px',
        margin: '0 auto',
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span style={{ background: 'var(--accent)', color: '#000', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>1</span>
            <h4 style={{ color: '#fff', fontSize: '0.95rem', margin: 0, fontWeight: 600 }}>Select Artwork</h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', width: '100%', maxWidth: '240px', margin: '0 auto' }}>
            {ART_PRESETS.map((art) => (
              <button
                key={art.id}
                onClick={() => setSelectedArt(art.url)}
                style={{
                  background: 'none',
                  border: selectedArt === art.url ? '2px solid var(--accent)' : '2px solid transparent',
                  borderRadius: '6px',
                  overflow: 'hidden',
                  aspectRatio: '1/1',
                  padding: 0,
                  cursor: 'pointer',
                  boxShadow: selectedArt === art.url ? '0 0 10px rgba(212, 175, 55, 0.3)' : 'none',
                  transition: 'all 0.2s ease'
                }}
                title={art.title}
              >
                <img src={art.url} alt={art.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>

          <label className="upload-dropzone" style={{
            border: '1px dashed rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            padding: '0.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.01)',
            transition: 'all 0.2s ease',
            width: '100%',
            maxWidth: '240px',
            margin: '0 auto',
            boxSizing: 'border-box'
          }}>
            <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
            <span style={{ fontSize: '1rem', marginBottom: '0.1rem' }}>🖼️</span>
            <span style={{ color: 'var(--accent)', fontWeight: 500, fontSize: '0.8rem' }}>Upload custom art</span>
          </label>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <span style={{ background: 'var(--accent)', color: '#000', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 'bold' }}>2</span>
            <h4 style={{ color: '#fff', fontSize: '0.95rem', margin: 0, fontWeight: 600 }}>Archival Matboard</h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
              {MAT_COLORS.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => setMatColor(color.hex)}
                  style={{
                    background: color.hex,
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: matColor === color.hex ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.15)',
                    cursor: 'pointer',
                    boxShadow: matColor === color.hex ? '0 0 8px rgba(212,175,55,0.4)' : 'none',
                    transform: matColor === color.hex ? 'scale(1.1)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                  title={color.name}
                />
              ))}
            </div>
            <div style={{ color: '#aaa', fontSize: '0.75rem' }}>
              Color: <strong style={{ color: '#fff' }}>{MAT_COLORS.find(c => c.hex === matColor)?.name}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', width: '100%', maxWidth: '240px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: '#aaa', fontSize: '0.8rem' }}>Width:</span>
              <span style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '0.85rem' }}>{matWidth.toFixed(1)}"</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="4.0"
              step="0.5"
              value={matWidth}
              onChange={(e) => setMatWidth(parseFloat(e.target.value))}
              style={{
                width: '100%',
                height: '4px',
                borderRadius: '2px',
                background: '#333',
                outline: 'none',
                cursor: 'pointer',
                accentColor: 'var(--accent)'
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Floating vertical sidebar design for desktop (single item per row layout)
  return (
    <div className="customizer-controls-container" style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1.5rem',
      padding: '1.75rem 0.75rem',
      background: 'rgba(15, 15, 15, 0.65)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '24px',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      width: '80px',
      boxSizing: 'border-box'
    }}>
      {/* 1. Select Artwork */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
          <span style={{ background: 'var(--accent)', color: '#000', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 'bold' }}>1</span>
          <h4 style={{ color: '#fff', fontSize: '0.7rem', margin: 0, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Art</h4>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', alignItems: 'center' }}>
          {ART_PRESETS.map((art) => (
            <button
              key={art.id}
              onClick={() => setSelectedArt(art.url)}
              style={{
                background: 'none',
                border: selectedArt === art.url ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.15)',
                borderRadius: '4px',
                overflow: 'hidden',
                width: '32px',
                height: '32px',
                padding: 0,
                cursor: 'pointer',
                boxShadow: selectedArt === art.url ? '0 0 6px rgba(212, 175, 55, 0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}
              title={art.title}
            >
              <img src={art.url} alt={art.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </button>
          ))}
        </div>

        <label className="upload-dropzone-compact" style={{
          border: '1px dashed rgba(255, 255, 255, 0.2)',
          borderRadius: '4px',
          padding: '0.25rem 0.1rem',
          textAlign: 'center',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.02)',
          transition: 'all 0.2s ease',
          width: '100%',
          maxWidth: '48px',
          boxSizing: 'border-box'
        }}>
          <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          <span style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>+ Up</span>
        </label>
      </div>

      {/* Divider */}
      <div style={{ width: '28px', height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.12)' }} />

      {/* 2. Archival Matboard */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
          <span style={{ background: 'var(--accent)', color: '#000', width: '16px', height: '16px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 'bold' }}>2</span>
          <h4 style={{ color: '#fff', fontSize: '0.7rem', margin: 0, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mat</h4>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
          {MAT_COLORS.map((color) => (
            <button
              key={color.hex}
              onClick={() => setMatColor(color.hex)}
              style={{
                background: color.hex,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: matColor === color.hex ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.15)',
                cursor: 'pointer',
                boxShadow: matColor === color.hex ? '0 0 6px rgba(212,175,55,0.4)' : 'none',
                transform: matColor === color.hex ? 'scale(1.1)' : 'none',
                transition: 'all 0.2s ease'
              }}
              title={color.name}
            />
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', width: '100%', padding: '0 0.25rem' }}>
          <span style={{ color: '#aaa', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>W: {matWidth.toFixed(1)}"</span>
          <input
            type="range"
            min="0.0"
            max="4.0"
            step="0.5"
            value={matWidth}
            onChange={(e) => setMatWidth(parseFloat(e.target.value))}
            style={{
              width: '100%',
              height: '3px',
              borderRadius: '1.5px',
              background: '#333',
              outline: 'none',
              cursor: 'pointer',
              accentColor: 'var(--accent)'
            }}
          />
        </div>
      </div>
    </div>
  );
}

function GlazingSimulator({ selectedArt, matColor, matWidth }) {
  const containerRef = useRef(null);
  const [glarePosition, setGlarePosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setGlarePosition(percentage);
  };

  const handleMouseDown = () => setIsDragging(true);

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging]);

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handleMove(e.touches[0].clientX);
    }
  };

  const frameObj = FRAMES.find(f => f.id === 'modern-black');
  const multiplier = 12.5;
  const paddingVal = `${matWidth * multiplier}px`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', width: '100%' }}>
      <div
        ref={containerRef}
        className="glazing-sim-container"
        onTouchMove={handleTouchMove}
        style={{
          width: '440px',
          maxWidth: '100%',
          aspectRatio: '1/1',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          cursor: isDragging ? 'ew-resize' : 'default',
          userSelect: 'none',
          boxSizing: 'border-box'
        }}
      >
        <img
          src={frameObj.img}
          alt={frameObj.name}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            zIndex: 4,
            pointerEvents: 'none',
            filter: `drop-shadow(0 15px 30px rgba(0, 0, 0, 0.75)) ${frameObj.filter || ''}`
          }}
        />

        <div
          style={{
            position: 'absolute',
            top: frameObj.innerTop,
            left: frameObj.innerLeft,
            width: frameObj.innerWidth,
            height: frameObj.innerHeight,
            backgroundColor: matColor,
            padding: paddingVal,
            transition: 'all 0.3s ease',
            zIndex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
        >
          <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.15)' }}>
            <img
              src={selectedArt}
              alt="Artwork Preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
            />

            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${glarePosition}%`,
              height: '100%',
              overflow: 'hidden',
              pointerEvents: 'none',
              zIndex: 2
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                aspectRatio: '1/1',
                filter: 'brightness(1.1) contrast(0.85) saturate(0.9)',
                pointerEvents: 'none'
              }}>
                <img
                  src={selectedArt}
                  alt="Artwork Preview Glare"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0) 70%)',
                mixBlendMode: 'screen',
                pointerEvents: 'none'
              }} />

              <div style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.2) 45%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.2) 55%, transparent 60%)',
                transform: 'rotate(-15deg)',
                pointerEvents: 'none',
                opacity: 0.8
              }} />
            </div>

            <div
              onMouseDown={handleMouseDown}
              onTouchStart={handleMouseDown}
              style={{
                position: 'absolute',
                top: 0,
                left: `${glarePosition}%`,
                width: '2px',
                height: '100%',
                backgroundColor: 'var(--accent)',
                cursor: 'ew-resize',
                zIndex: 3,
                boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#111',
                border: '2px solid var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
                cursor: 'ew-resize',
                fontSize: '0.8rem',
                color: 'var(--accent)',
                fontWeight: 'bold',
                userSelect: 'none'
              }}>
                ↔
              </div>
            </div>
          </div>
        </div>

        <div style={{
          position: 'absolute',
          bottom: '22px',
          left: '26px',
          color: '#fff',
          fontSize: '0.7rem',
          fontWeight: 'bold',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          background: 'rgba(0,0,0,0.7)',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          zIndex: 5,
          pointerEvents: 'none'
        }}>
          Standard Glass
        </div>

        <div style={{
          position: 'absolute',
          bottom: '22px',
          right: '26px',
          color: 'var(--accent)',
          fontSize: '0.7rem',
          fontWeight: 'bold',
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          background: 'rgba(0,0,0,0.7)',
          padding: '0.2rem 0.5rem',
          borderRadius: '4px',
          zIndex: 5,
          pointerEvents: 'none'
        }}>
          Museum Glass
        </div>
      </div>

      <div style={{ color: '#888', fontSize: '0.8rem', letterSpacing: '0.05em', marginTop: '0.25rem', textAlign: 'center' }}>
        DRAG THE HANDLE TO COMPARE REFLECTION ELIMINATION
      </div>
    </div>
  );
}

const PORTFOLIO_SLIDES = [
  {
    index: 0,
    category: "01 — ARCHIVAL ARTISTRY",
    title: <>Elevating <span style={{ color: "var(--accent)" }}>Frame</span> design to Museum Standard.</>,
    desc: "Conservart has worked with Montreal's finest galleries, collectors, and corporate spaces. Our non-linear horizontal tour showcases the materials and technical details behind our award-winning framing process.",
    frameId: "dark-walnut",
    isGlazing: false
  },
  {
    index: 1,
    category: "02 — CLASSIC COLLECTION",
    title: "Gilded Ornate Splendor",
    desc: "A timeless collection featuring hand-gilded, gesso-primed solid pine frame mouldings. Tailored for historical oils, heritage portraits, and prestigious museum displays.",
    frameId: "ornate-gold",
    mouldingKey: "classic",
    isGlazing: false
  },
  {
    index: 2,
    category: "03 — MODERN COLLECTION",
    title: "Sleek Archival Black",
    desc: "A sophisticated minimalist collection with matte-black aluminum or hard-wood profiles. Ideal for contemporary photographs, graphic illustrations, and clean gallery environments.",
    frameId: "modern-black",
    mouldingKey: "modern",
    isGlazing: false
  },
  {
    index: 3,
    category: "04 — ORGANIC WOODS",
    title: "North American Hardwoods",
    desc: "Showcasing raw walnut, maple, and white oak. Sustainable hardwood mouldings highlight organic grain patterns and natural warmth, ideal for fine-art watercolor works and sketches.",
    frameId: "natural-oak",
    mouldingKey: "wood",
    isGlazing: false
  },
  {
    index: 4,
    category: "05 — CONSERVATION GLAZING",
    title: "99% UV-Filtering Museum Glass",
    desc: "We utilize optically coated glazing that eliminates reflection and glare while acting as a shield against harmful UV radiation, preventing degradation, fading, and discoloration over time.",
    frameId: "modern-black",
    isGlazing: true
  },
  {
    index: 5,
    category: "06 — FLOATING MOUNT",
    title: "Suspended Dimension",
    desc: "Create the illusion of weightlessness. Deep shadowbox floating mouldings suspend canvases or deckled-edge papers away from the matboard backing, producing elegant natural drop shadows.",
    frameId: "white-float",
    mouldingKey: "floating",
    isGlazing: false
  }
];

function MouldingPortfolio({ onTryFrame, activeFrame, setActiveFrame }) {
  const [selectedMoulding, setSelectedMoulding] = useState(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const containerRef = useRef(null);
  const frameTrackRef = useRef(null);

  // Lifted customizer states
  const [selectedArt, setSelectedArt] = useState(ART_PRESETS[0].url);
  const [matColor, setMatColor] = useState(MAT_COLORS[0].hex);
  const [matWidth, setMatWidth] = useState(2.0); // inches
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Auto-scroll interactive refs
  const isHoveredRef = useRef(false);
  const lastScrollTimeRef = useRef(0);

  // Glaring Simulator states inside the portfolio
  const [glarePosition, setGlarePosition] = useState(50);
  const [isDraggingGlare, setIsDraggingGlare] = useState(false);
  const glareContainerRef = useRef(null);

  const handleGlareMove = (clientX) => {
    if (!glareContainerRef.current) return;
    const rect = glareContainerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setGlarePosition(percentage);
  };

  const handleGlareMouseDown = () => setIsDraggingGlare(true);

  useEffect(() => {
    const handleMouseUp = () => setIsDraggingGlare(false);
    const handleMouseMove = (e) => {
      if (!isDraggingGlare) return;
      handleGlareMove(e.clientX);
    };

    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDraggingGlare]);

  const handleGlareTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handleGlareMove(e.touches[0].clientX);
    }
  };

  // Sync scroll triggers when user tries a frame style from specs drawer or other component
  useEffect(() => {
    if (!activeFrame || isMobile) return;
    const FRAME_TO_INDEX = {
      'ornate-gold': 1,
      'modern-black': 2,
      'natural-oak': 3,
      'white-float': 5
    };
    const targetIdx = FRAME_TO_INDEX[activeFrame];
    if (targetIdx !== undefined) {
      const trigger = ScrollTrigger.getById('portfolio-trigger');
      if (trigger) {
        const start = trigger.start;
        const end = trigger.end;
        const targetScroll = start + (end - start) * (targetIdx / 5);
        window.scrollTo({ top: targetScroll, behavior: 'smooth' });
      }
      setActiveFrame(null);
    }
  }, [activeFrame, isMobile, setActiveFrame]);

  // Auto-scroll slideshow logic (advances every 3 seconds when active and idle)
  useEffect(() => {
    if (isMobile) return;

    const handleScroll = () => {
      lastScrollTimeRef.current = Date.now();
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    const interval = setInterval(() => {
      // Don't auto-scroll if user is hovering over the container
      if (isHoveredRef.current) return;

      // Don't auto-scroll if user scrolled manually in the last 4 seconds
      if (Date.now() - lastScrollTimeRef.current < 4000) return;

      const trigger = ScrollTrigger.getById('portfolio-trigger');
      if (trigger && trigger.isActive) {
        // Find next slide index (0 to 5)
        const nextIndex = (currentSlideIndex + 1) % 6;
        const start = trigger.start;
        const end = trigger.end;
        const targetScroll = start + (end - start) * (nextIndex / 5);

        window.scrollTo({
          top: targetScroll,
          behavior: 'smooth'
        });
      }
    }, 3000); // 3 seconds interval

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, [isMobile, currentSlideIndex]);

  useEffect(() => {
    if (isMobile) return;

    const ctx = gsap.context(() => {
      let lastIndex = -1;

      gsap.to(frameTrackRef.current, {
        x: '-500vw',
        ease: 'none',
        scrollTrigger: {
          id: 'portfolio-trigger',
          trigger: containerRef.current,
          pin: true,
          scrub: 0.4,
          start: 'top top',
          end: () => '+=3000',
          snap: {
            snapTo: 1 / 5,
            duration: { min: 0.2, max: 0.5 },
            delay: 0.15,
            ease: 'power3.out'
          },
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const progress = self.progress;

            // Performantly animate empty frames track horizontally based on exact scroll progress
            if (frameTrackRef.current) {
              gsap.set(frameTrackRef.current, { x: `${-progress * 5 * 100}vw` });
            }

            // Sync index state for React texts and morphing matboard openings
            const slideCount = 6;
            const activeIndex = Math.min(
              Math.max(Math.round(progress * (slideCount - 1)), 0),
              slideCount - 1
            );
            if (activeIndex !== lastIndex) {
              lastIndex = activeIndex;
              setCurrentSlideIndex(activeIndex);
            }
          }
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, [isMobile]);

  const handleDotClick = (index) => {
    if (isMobile) return;
    const trigger = ScrollTrigger.getById('portfolio-trigger');
    if (trigger) {
      const start = trigger.start;
      const end = trigger.end;
      const targetScroll = start + (end - start) * (index / 5);
      window.scrollTo({ top: targetScroll, behavior: 'smooth' });
    }
  };

  if (isMobile) {
    return (
      <section className="section" style={{ backgroundColor: '#050505', position: 'relative', zIndex: 10, paddingTop: '120px' }}>
        <div className="container" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ color: 'var(--accent)', letterSpacing: '0.25em', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
            01 — ARCHIVAL ARTISTRY
          </span>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', color: '#fff', fontFamily: 'var(--font-heading)', lineHeight: 1.3 }}>
            Elevating <span style={{ color: 'var(--accent)' }}>Frame</span> design to Museum Standard.
          </h2>
          <p style={{ color: '#ccc', maxWidth: '600px', margin: '0 auto', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Conservart has worked with Montreal's finest galleries, collectors, and corporate spaces. Our interactive visualizer showcases the materials and technical details behind our award-winning framing process.
          </p>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <FrameVisualizer
            activeFrame={activeFrame}
            setActiveFrame={setActiveFrame}
            selectedArt={selectedArt}
            setSelectedArt={setSelectedArt}
            matColor={matColor}
            setMatColor={setMatColor}
            matWidth={matWidth}
            setMatWidth={setMatWidth}
          />
        </div>
      </section>
    );
  }

  // Get inner dimension variables for active frame to morph smoothly
  const activeFrameId = PORTFOLIO_SLIDES[currentSlideIndex].frameId;
  const activeFrameObj = FRAMES.find(f => f.id === activeFrameId) || FRAMES[0];
  const visualizerSize = 'clamp(580px, 74vh, 800px)';

  return (
    <section ref={containerRef} onMouseEnter={() => { isHoveredRef.current = true; }} onMouseLeave={() => { isHoveredRef.current = false; }} style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#050505' }}>
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxSizing: 'border-box',
        padding: '2vh 0'
      }}>

        {!isMobile && (
          <div style={{
            position: 'absolute',
            left: '40px',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 100
          }}>
            <FrameCustomizerControls
              selectedArt={selectedArt}
              setSelectedArt={setSelectedArt}
              matColor={matColor}
              setMatColor={setMatColor}
              matWidth={matWidth}
              setMatWidth={setMatWidth}
              isMobile={false}
            />
          </div>
        )}

        {/* Centerpiece Area: Centered on screen */}
        <div style={{
          position: 'relative',
          width: visualizerSize,
          height: visualizerSize,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: 'translateY(-4vh) translateX(7vw)',
          zIndex: 2,
          boxSizing: 'border-box'
        }}>

          {/* Stationary Matboard & Artwork Container (morphs dimensions smoothly) */}
          <div
            ref={currentSlideIndex === 4 ? glareContainerRef : undefined}
            style={{
              position: 'absolute',
              top: activeFrameObj.innerTop,
              left: activeFrameObj.innerLeft,
              width: activeFrameObj.innerWidth,
              height: activeFrameObj.innerHeight,
              backgroundColor: activeFrameId === 'white-float' ? '#111' : matColor,
              padding: activeFrameId === 'white-float' ? '8px' : `${matWidth * 17}px`,
              transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              zIndex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              overflow: 'hidden'
            }}
          >
            <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.15)' }}>
              <img
                src={selectedArt}
                alt="Artwork Preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
              />

              {/* Glare Simulation Overlay & Slider (Slide 5 Only) */}
              {currentSlideIndex === 4 && (
                <>
                  {/* Reflective Glare layer */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: `${glarePosition}%`,
                    height: '100%',
                    overflow: 'hidden',
                    pointerEvents: 'none',
                    zIndex: 2
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      aspectRatio: '1/1',
                      filter: 'brightness(1.1) contrast(0.85) saturate(0.9)',
                      pointerEvents: 'none'
                    }}>
                      <img
                        src={selectedArt}
                        alt="Artwork Preview Glare"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0) 70%)',
                      mixBlendMode: 'screen',
                      pointerEvents: 'none'
                    }} />

                    <div style={{
                      position: 'absolute',
                      top: '-50%',
                      left: '-50%',
                      width: '200%',
                      height: '200%',
                      background: 'linear-gradient(45deg, transparent 40%, rgba(255,255,255,0.2) 45%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.2) 55%, transparent 60%)',
                      transform: 'rotate(-15deg)',
                      pointerEvents: 'none',
                      opacity: 0.8
                    }} />
                  </div>

                  {/* Interactive Drag Handle line */}
                  <div
                    onMouseDown={handleGlareMouseDown}
                    onTouchStart={handleGlareMouseDown}
                    onTouchMove={handleGlareTouchMove}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: `${glarePosition}%`,
                      width: '2px',
                      height: '100%',
                      backgroundColor: 'var(--accent)',
                      cursor: 'ew-resize',
                      zIndex: 3,
                      boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#111',
                      border: '2px solid var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
                      cursor: 'ew-resize',
                      fontSize: '0.75rem',
                      color: 'var(--accent)',
                      fontWeight: 'bold',
                      userSelect: 'none'
                    }}>
                      ↔
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Sliding Frames Track (Empty frames overlays) */}
          <div
            ref={frameTrackRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              display: 'flex',
              flexDirection: 'row',
              width: 'fit-content',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 2
            }}
          >
            {PORTFOLIO_SLIDES.map((slide, idx) => {
              const frameObj = FRAMES.find(f => f.id === slide.frameId) || FRAMES[0];
              return (
                <div
                  key={idx}
                  style={{
                    width: '100vw',
                    height: visualizerSize,
                    flexShrink: 0,
                    position: 'absolute',
                    left: `${idx * 100}vw`,
                    top: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    pointerEvents: 'none'
                  }}
                >
                  <img
                    src={frameObj.img}
                    alt={frameObj.name}
                    style={{
                      width: visualizerSize,
                      height: visualizerSize,
                      objectFit: 'contain',
                      filter: `drop-shadow(0 15px 30px rgba(0, 0, 0, 0.75)) ${frameObj.filter || ''}`,
                      pointerEvents: 'none'
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Overlapping Glass Card (Bottom-Left Corner) */}
          <div style={{
            position: 'absolute',
            bottom: '-40px',
            left: '-160px',
            width: '420px',
            height: '290px',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: 'rgba(10, 10, 10, 0.55)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '20px',
            padding: '1.75rem',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
            boxSizing: 'border-box',
            pointerEvents: 'auto'
          }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlideIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: 'easeInOut' }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                  width: '100%'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <span style={{ color: 'var(--accent)', letterSpacing: '0.25em', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>
                    {PORTFOLIO_SLIDES[currentSlideIndex].category}
                  </span>
                  <h2 style={{ fontSize: '1.65rem', fontFamily: 'var(--font-heading)', color: '#fff', margin: 0, lineHeight: 1.2 }}>
                    {PORTFOLIO_SLIDES[currentSlideIndex].title}
                  </h2>
                  <p style={{ color: '#ccc', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                    {PORTFOLIO_SLIDES[currentSlideIndex].desc}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
                  {PORTFOLIO_SLIDES[currentSlideIndex].mouldingKey && (
                    <button
                      onClick={() => setSelectedMoulding(PORTFOLIO_SLIDES[currentSlideIndex].mouldingKey)}
                      className="btn"
                      style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', width: 'fit-content' }}
                    >
                      View Technical Details
                    </button>
                  )}

                  {PORTFOLIO_SLIDES[currentSlideIndex].isGlazing && (
                    <Link to="/about" className="btn" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', width: 'fit-content', textAlign: 'center' }}>
                      Discover Our Archival Process
                    </Link>
                  )}

                  {currentSlideIndex === 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', letterSpacing: '0.08em', marginTop: '0.25rem' }}>
                      <span>SCROLL VERTICALLY TO EXPLORE</span>
                      <div style={{ width: '20px', height: '1px', backgroundColor: 'rgba(255,255,255,0.3)' }} />
                      <span>&rarr;</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

        </div>

        {/* Bottom Section: Dots Navigator */}
        <div style={{
          position: 'absolute',
          bottom: '2vh',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.2vh',
          width: '100%',
          maxWidth: '1200px',
          zIndex: 10,
          boxSizing: 'border-box'
        }}>
          {/* Slide Navigator Dots Overlay */}
          <div style={{
            display: 'flex',
            gap: '0.85rem',
            background: 'rgba(20, 20, 20, 0.65)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            padding: '0.5rem 1.1rem',
            borderRadius: '30px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxSizing: 'border-box',
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)'
          }}>
            {[...Array(6)].map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleDotClick(idx)}
                style={{
                  width: currentSlideIndex === idx ? '26px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  background: currentSlideIndex === idx ? 'var(--accent)' : 'rgba(255, 255, 255, 0.25)',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
                title={`Scroll to Slide ${idx + 1}`}
                aria-label={`Scroll to Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

      </div>

      {/* Specifications Drawer */}
      <AnimatePresence>
        {selectedMoulding && (
          <>
            <motion.div
              className="spec-drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMoulding(null)}
            />
            <motion.div
              className="spec-drawer"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            >
              <div className="container" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', alignItems: 'center', position: 'relative' }}>
                <button
                  onClick={() => setSelectedMoulding(null)}
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    right: '10px',
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    fontSize: '2rem',
                    cursor: 'pointer'
                  }}
                  aria-label="Close details"
                >
                  &times;
                </button>

                <div style={{ flex: '1 1 300px', display: 'flex', justifyContent: 'center' }}>
                  <img
                    src={MOULDING_SPECS[selectedMoulding].img}
                    alt={MOULDING_SPECS[selectedMoulding].title}
                    style={{ width: '80%', maxHeight: '250px', objectFit: 'contain', mixBlendMode: 'screen' }}
                  />
                </div>

                <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <span style={{ color: 'var(--accent)', letterSpacing: '0.15em', fontSize: '0.8rem', fontWeight: 600 }}>TECHNICAL SPECIFICATIONS</span>
                  <h3 style={{ fontSize: '1.8rem', color: '#fff', margin: 0, fontFamily: 'var(--font-heading)' }}>
                    {MOULDING_SPECS[selectedMoulding].title}
                  </h3>

                  <p style={{ color: '#ccc', fontSize: '1rem', lineHeight: '1.7', margin: 0 }}>
                    {MOULDING_SPECS[selectedMoulding].desc}
                  </p>

                  <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ccc', marginTop: '0.5rem' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '0.5rem 0', fontWeight: 'bold', width: '150px' }}>Profile Width:</td>
                        <td style={{ padding: '0.5rem 0' }}>{MOULDING_SPECS[selectedMoulding].width}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '0.5rem 0', fontWeight: 'bold' }}>Rabbet Depth:</td>
                        <td style={{ padding: '0.5rem 0' }}>{MOULDING_SPECS[selectedMoulding].rabbet}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                        <td style={{ padding: '0.5rem 0', fontWeight: 'bold' }}>Core Material:</td>
                        <td style={{ padding: '0.5rem 0' }}>{MOULDING_SPECS[selectedMoulding].core}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => {
                        onTryFrame(MOULDING_SPECS[selectedMoulding].visualizerStyle);
                        setSelectedMoulding(null);
                      }}
                      className="btn"
                      style={{ fontSize: '0.85rem', background: 'var(--accent)', color: '#000', fontWeight: 'bold', border: 'none' }}
                    >
                      Try in Live Visualizer
                    </button>
                    <button
                      onClick={() => setSelectedMoulding(null)}
                      className="btn"
                      style={{ fontSize: '0.85rem' }}
                    >
                      Back to Gallery
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}

function Layout({ children }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // Auto-close menu drawer when viewport expands to desktop size
  useEffect(() => {
    if (!isMobile && isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [isMobile, isMenuOpen]);

  return (
    <>
      <CustomCursor />
      <PageCurtain />
      <header
        className="liquid-glass-header"
        style={{
          height: isMobile ? '80px' : '100px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%'
          }}
        >
          <Link to="/" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none' }}>
            <span style={{
              fontFamily: "var(--font-heading)",
              fontSize: isMobile ? '1.4rem' : '1.8rem',
              fontWeight: 600,
              color: '#fff',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              lineHeight: 1
            }}>
              Conservart
            </span>
            <span style={{
              fontFamily: "var(--font-body)",
              fontSize: isMobile ? '0.55rem' : '0.62rem',
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              marginTop: '4px',
              fontWeight: 500,
              lineHeight: 1
            }}>
              Master Framer
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="desktop-nav" style={{ gap: 'var(--space-md)', fontWeight: 500, fontSize: '1rem', color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
            <Link to="/" className={isActive('/') ? 'nav-link-active' : ''} style={{ color: '#fff' }}>Home</Link>
            <Link to="/corporate" className={isActive('/corporate') ? 'nav-link-active' : ''} style={{ color: '#fff' }}>Corporate</Link>
            <Link to="/private" className={isActive('/private') ? 'nav-link-active' : ''} style={{ color: '#fff' }}>Private</Link>
            <Link to="/shop" className={isActive('/shop') ? 'nav-link-active' : ''} style={{ color: '#fff' }}>Shop</Link>
            <Link to="/about" className={isActive('/about') ? 'nav-link-active' : ''} style={{ color: '#fff' }}>About Us</Link>
            <Link to="/contact" className={isActive('/contact') ? 'nav-link-active' : ''} style={{ color: '#fff' }}>Contact</Link>
          </nav>

          {/* Mobile Menu Toggle */}
          <div className="mobile-nav-container">
            <button
              className={`mobile-nav-toggle ${isMenuOpen ? 'open' : ''}`}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-out Mobile Navigation Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop blur */}
            <motion.div
              className="mobile-overlay-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Sliding Drawer */}
            <motion.div
              className="mobile-overlay"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <nav className="mobile-nav-links" style={{ marginTop: '20px' }}>
                <Link to="/" className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>Home</Link>
                <Link to="/corporate" className={`mobile-nav-link ${isActive('/corporate') ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>Corporate</Link>
                <Link to="/private" className={`mobile-nav-link ${isActive('/private') ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>Private</Link>
                <Link to="/shop" className={`mobile-nav-link ${isActive('/shop') ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>Shop</Link>
                <Link to="/about" className={`mobile-nav-link ${isActive('/about') ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>About Us</Link>
                <Link to="/contact" className={`mobile-nav-link ${isActive('/contact') ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)}>Contact</Link>
              </nav>

              <div className="mobile-menu-footer">
                <a href="tel:+15144853543" className="btn" style={{ fontSize: '0.85rem', borderColor: 'var(--accent)', color: 'var(--accent)', fontWeight: '600' }}>
                  Call Us: 514-485-3543
                </a>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', marginTop: '0.5rem' }}>
                  <span style={{ color: '#FFD700', fontSize: '1rem' }}>★★★★★</span>
                  <span style={{ color: '#888', fontSize: '0.8rem', fontWeight: 500 }}>5.0 Google Reviews</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main>
        {children}
      </main>

      <footer style={{ backgroundColor: '#0c0c0c', color: '#fff', padding: 'var(--space-xl) 0', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="container" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 'var(--space-sm)' }}>
              <span style={{
                fontFamily: "var(--font-heading)",
                fontSize: '1.6rem',
                fontWeight: 600,
                color: '#fff',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                lineHeight: 1
              }}>
                Conservart
              </span>
              <span style={{
                fontFamily: "var(--font-body)",
                fontSize: '0.6rem',
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                marginTop: '4px',
                fontWeight: 500,
                lineHeight: 1
              }}>
                Master Framer
              </span>
            </div>
            <p style={{ color: '#888', maxWidth: '300px', fontSize: '0.95rem' }}>Master framer for corporate and private clients. All quality materials; protecting art for a lifetime.</p>
          </div>
          <div>
            <h4 style={{ color: '#fff', marginBottom: 'var(--space-sm)', fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>Contact</h4>
            <p style={{ color: '#888', fontSize: '0.95rem', lineHeight: '1.7' }}>6160 av. de Monkland<br />Montreal, Qc, H4B 1G4<br /><span style={{ color: 'var(--accent)' }}><strong>T</strong> 514-485-3543</span></p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h4 style={{ color: '#fff', marginBottom: 'var(--space-sm)', fontFamily: 'var(--font-heading)', fontSize: '1.2rem' }}>Our Gallery</h4>
            <Link
              to="/contact"
              style={{
                display: 'block',
                position: 'relative',
                width: '300px',
                height: '240px',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              className="footer-storefront-link"
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {/* Storefront Image (Inside the frame, extended under frame to prevent white gaps) */}
              <img
                src="/conservart/images/storefront.jpg"
                alt="Conservart Monkland Storefront"
                style={{ 
                  position: 'absolute',
                  top: '12%', 
                  left: '10%', 
                  width: '80%', 
                  height: '76%', 
                  objectFit: 'cover',
                  display: 'block',
                  zIndex: 1
                }}
              />
              {/* Actual Frame Overlay */}
              <img
                src="/conservart/images/custom_gold_frame.png"
                alt="Ornate Gold Frame"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  zIndex: 2,
                  pointerEvents: 'none',
                  filter: 'drop-shadow(0 10px 25px rgba(0,0,0,0.7))'
                }}
              />
            </Link>
          </div>
        </div>
        <div className="container" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 'var(--space-lg)', paddingTop: 'var(--space-md)', textAlign: 'center', color: '#555', fontSize: '0.85rem' }}>
          &copy; {new Date().getFullYear()} Conservart. All rights reserved.
        </div>
      </footer>
    </>
  );
}

function Corporate() {
  usePageTitle('Corporate Framing Services & Restoration');

  return (
    <div style={{ backgroundColor: '#050505', color: '#fff', minHeight: '80vh', paddingBottom: 'var(--space-xl)' }}>
      <section className="subpage-hero">
        <div className="container">
          <span style={{ color: 'var(--accent)', letterSpacing: '0.2em', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Expert Museum & Corporate Care</span>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', color: '#fff', margin: '0.5rem 0 1rem', fontFamily: 'var(--font-heading)' }}>Corporate Clients</h1>
          <div style={{ width: '60px', height: '2px', backgroundColor: 'var(--accent)', margin: '0 auto' }}></div>
        </div>
      </section>

      <div className="container" style={{ marginTop: 'var(--space-lg)' }}>
        <p style={{ textAlign: 'center', color: '#ccc', maxWidth: '800px', margin: '0 auto var(--space-lg)', fontSize: '1.15rem', lineHeight: '1.8' }}>
          We provide comprehensive art and framing services designed for commercial environments, including corporate offices, educational institutions, private clinics, and hospitality spaces across Canada.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
          {/* Card 1 */}
          <div className="luxury-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ color: 'var(--accent)', fontSize: '1.5rem', fontWeight: 'bold' }}>01</span>
              <h3 style={{ fontSize: '1.3rem', color: '#fff', margin: 0 }}>Corporate Custom Framing</h3>
            </div>
            <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
              Full corporate framing services are provided from selection of images, to frame design and finally, delivery and installation. We have framed for offices accross Canada, these include corporate head offices, schools, clinics and hospitals.
            </p>
          </div>

          {/* Card 2 */}
          <div className="luxury-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ color: 'var(--accent)', fontSize: '1.5rem', fontWeight: 'bold' }}>02</span>
              <h3 style={{ fontSize: '1.3rem', color: '#fff', margin: 0 }}>Restauration & Cleaning</h3>
            </div>
            <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
              We offer museum quality cleaning and restoration of paintings and works of art on paper: reguilding and restoration of antique frames.
            </p>
          </div>

          {/* Card 3 */}
          <div className="luxury-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ color: 'var(--accent)', fontSize: '1.5rem', fontWeight: 'bold' }}>03</span>
              <h3 style={{ fontSize: '1.3rem', color: '#fff', margin: 0 }}>Hanging & Delivery</h3>
            </div>
            <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
              Hanging services are available as well as pick up and delivery.
            </p>
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-lg)', textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: 'var(--space-md)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>
          <h4 style={{ fontSize: '1.25rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>Planning a Large Scale Installation?</h4>
          <p style={{ color: '#ccc', fontSize: '1rem', maxWidth: '600px', margin: '0 auto 1.5rem' }}>Get in touch to arrange an on-site design consultation or coordinate shipping logistics for your commercial projects.</p>
          <Link to="/contact" className="btn" style={{ fontSize: '0.85rem' }}>Request Commercial Quote</Link>
        </div>
      </div>
    </div>
  );
}

function Private() {
  usePageTitle('Custom & Conservation Picture Framing');

  return (
    <div style={{ backgroundColor: '#050505', color: '#fff', minHeight: '80vh', paddingBottom: 'var(--space-xl)' }}>
      <section className="subpage-hero">
        <div className="container">
          <span style={{ color: 'var(--accent)', letterSpacing: '0.2em', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Bespoke Styling & Fine Art Care</span>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', color: '#fff', margin: '0.5rem 0 1rem', fontFamily: 'var(--font-heading)' }}>Private Clients</h1>
          <div style={{ width: '60px', height: '2px', backgroundColor: 'var(--accent)', margin: '0 auto' }}></div>
        </div>
      </section>

      <div className="container" style={{ marginTop: 'var(--space-lg)' }}>
        <p style={{ textAlign: 'center', color: '#ccc', maxWidth: '800px', margin: '0 auto var(--space-lg)', fontSize: '1.15rem', lineHeight: '1.8' }}>
          Protect your most cherished family photos, canvas oils, diplomas, and textile artifacts. Our frames are custom built in our workshop with precision.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
          {/* Card 1 */}
          <div className="luxury-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.3rem', color: '#fff', margin: 0, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Conservation Framing</h3>
            <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
              ConservArt specializes in conservation museum quality framing, to protect artwork and minimize the effect of deterioration due to time and exposure to the elements. We use only 100% acid free materials, provide protective hinging and finishing techniques in order to ensure that your artwork is preserved for a lifetime.
            </p>
          </div>

          {/* Card 2 */}
          <div className="luxury-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.3rem', color: '#fff', margin: 0, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Personal Consultation</h3>
            <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
              Is provided by professionals with 20 years framing experience and a background in fine art to help you select the best possible option for the framing of your artwork.
            </p>
          </div>

          {/* Card 3 */}
          <div className="luxury-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.3rem', color: '#fff', margin: 0, borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>In-House Made Custom Framing</h3>
            <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
              In House Custom Framing for canvas art, photographs, giclee prints and canvas, watercolour art, pastel art, posters and prints, original artwork on any surface, jerseys, clothing and textiles, mirrors, diplomas and certificates, children's artwork, objects and memorabilia, needle and fabric art.
            </p>
          </div>
        </div>

        <div style={{ marginTop: 'var(--space-lg)', textAlign: 'center', background: 'rgba(255,255,255,0.02)', padding: 'var(--space-md)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <h4 style={{ fontSize: '1.25rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>Expert Framing Consultation</h4>
          <p style={{ color: '#ccc', fontSize: '1rem', maxWidth: '600px', margin: '0 auto 1.5rem' }}>Stop by our Monkland workshop or call to book a dedicated timing for custom matting and frame corner selection.</p>
          <a href="tel:+15144853543" className="btn" style={{ fontSize: '0.85rem', borderColor: 'var(--accent)', color: 'var(--accent)' }}>Call to Book &bull; 514-485-3543</a>
        </div>
      </div>
    </div>
  );
}

const ANATOMY_LAYERS = [
  {
    id: 'moulding',
    tag: 'Layer 1 • Outer Shield',
    title: 'Hardwood Moulding',
    color: 'rgba(212, 175, 55, 0.12)',
    border: '2px solid #D4AF37',
    tech: 'Bespoke Solid Wood Profile',
    desc: 'Crafted from premium kiln-dried walnut, oak, maple, or pine. Hand-joined with precision v-nails, sanded, and finished with luxury gold leaf gilding or custom matte lacquer to establish the protective skeletal shell.'
  },
  {
    id: 'glass',
    tag: 'Layer 2 • Glazing Protection',
    title: 'Museum Glass (99% UV)',
    color: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    tech: '99% UV Filter & Anti-Reflective',
    desc: 'Virtually invisible museum glazing that filters out 99% of harmful UV wavelengths to prevent fading or discoloration. Features less than 1% light reflection for optical clarity.'
  },
  {
    id: 'matboard',
    tag: 'Layer 3 • Archival Spacer',
    title: 'Acid-Free Cotton Matboard',
    color: 'rgba(244, 243, 239, 0.1)',
    border: '1px dashed rgba(255, 255, 255, 0.25)',
    tech: '100% Alpha-Cellulose Core',
    desc: 'Creates spatial breathing room and ensures glass never directly touches your art. Acid-free and lignin-free cotton fibers capture airborne pollutants and maintain a stable pH environment.'
  },
  {
    id: 'art',
    tag: 'Layer 4 • The Masterpiece',
    title: 'The Artwork',
    color: 'rgba(212, 175, 55, 0.05)',
    border: '1px solid rgba(212, 175, 55, 0.2)',
    tech: 'Fine Art Print / Original Medium',
    desc: 'The center of preservation. Our framing standard respects the medium, utilizing only 100% reversible mounting techniques (such as Japanese paper hinges and wheat starch) so the art remains unaltered.'
  },
  {
    id: 'backing',
    tag: 'Layer 5 • Rigid Base',
    title: 'Archival Backing Board',
    color: 'rgba(30, 30, 30, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    tech: 'Water-Resistant Acid-Free Barrier',
    desc: 'A rugged acid-free backing provides structural support, shielding the rear from impacts. Sealed to block out wood acids, ambient humidity, soot, and insect intrusion.'
  }
];

function FrameAnatomy() {
  const [activeIndex, setActiveIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  const displayIndex = hoveredIndex !== null ? hoveredIndex : activeIndex;
  const activeLayer = displayIndex !== null ? ANATOMY_LAYERS[displayIndex] : null;

  return (
    <div style={{ borderTop: '1px solid var(--border)', marginTop: 'var(--space-lg)', paddingTop: 'var(--space-md)' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
        <span style={{ color: 'var(--accent)', letterSpacing: '0.2em', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Preservation Engineering</span>
        <h2 style={{ fontSize: '2.2rem', marginTop: '0.5rem', marginBottom: 'var(--space-xs)' }}>Frame Anatomy Visualizer</h2>
        <p style={{ color: '#888', maxWidth: '600px', margin: '0 auto', fontSize: '1rem' }}>
          Explore the five structural layers of our museum-grade archival framing system. Hover or tap each layer to review its role.
        </p>
      </div>

      <div className="anatomy-container">
        {/* Left Column: Interactive 3D Stack */}
        <div className="anatomy-stack" style={{ perspective: isMobile ? '800px' : '1200px' }}>
          {ANATOMY_LAYERS.map((layer, idx) => {
            const isActive = displayIndex === idx;
            const depthFactor = 4 - idx;
            const baseTranslateZ = depthFactor * (isMobile ? 35 : 55);

            // Symmetrical split-stack math:
            // When a layer is active/hovered, it sits exactly in the center of a spacious, equal gap.
            // Layers physically above it shift up by 40px, the active layer shifts by 20px, and
            // layers below remain at their base (0px shift), keeping all spacing perfectly uniform and balanced.
            // If nothing is selected or hovered (default state), no split shifting is applied.
            let splitShift = 0;
            if (displayIndex === null) {
              splitShift = 0;
            } else if (idx < displayIndex) {
              splitShift = isMobile ? 25 : 40;
            } else if (idx === displayIndex) {
              splitShift = isMobile ? 12 : 20;
            } else {
              splitShift = 0;
            }
            const zVal = baseTranslateZ + splitShift;

            // Render custom content depending on the layer ID for photorealism
            let layerContent = null;
            let customStyle = {
              backgroundColor: 'transparent',
              border: 'none',
            };

            if (layer.id === 'moulding') {
              layerContent = (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  {/* Outer walnut wood border */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    border: '18px solid #482f1b',
                    borderRadius: '8px',
                    boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.95), 0 4px 10px rgba(0, 0, 0, 0.6)',
                    background: 'transparent'
                  }} />
                  {/* Inner gold leaf inlay profile border */}
                  <div style={{
                    position: 'absolute',
                    inset: '18px',
                    border: '2px solid #D4AF37',
                    background: 'transparent'
                  }} />
                </div>
              );
              if (isActive) {
                customStyle.boxShadow = '0 25px 50px rgba(0,0,0,0.8), 0 0 25px rgba(212, 175, 55, 0.5)';
              } else {
                customStyle.boxShadow = '0 12px 30px rgba(0,0,0,0.6)';
              }
            } else if (layer.id === 'glass') {
              layerContent = (
                <>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(135deg, rgba(160, 220, 240, 0.14) 0%, rgba(160, 220, 240, 0.04) 100%)',
                    border: '1.5px solid rgba(255, 255, 255, 0.25)',
                    borderRadius: '8px',
                    pointerEvents: 'none'
                  }} />
                  <div className="glass-shine-overlay" />
                </>
              );
              if (isActive) {
                customStyle.boxShadow = '0 25px 50px rgba(0,0,0,0.7), 0 0 20px rgba(160, 220, 240, 0.4)';
              } else {
                customStyle.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
              }
            } else if (layer.id === 'matboard') {
              layerContent = (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  {/* Warm white museum-quality cotton matboard with centered cutout */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    borderWidth: '36px 48px',
                    borderStyle: 'solid',
                    borderColor: '#f5f2eb',
                    borderRadius: '8px',
                    background: 'transparent',
                    boxShadow: 'inset 0 0 6px rgba(0,0,0,0.12)'
                  }} />
                  {/* Clean 45-degree beveled white core edge indicator */}
                  <div style={{
                    position: 'absolute',
                    top: '35px',
                    bottom: '35px',
                    left: '47px',
                    right: '47px',
                    border: '1.5px solid #ffffff',
                    background: 'transparent',
                    boxShadow: 'inset 0 0 2px rgba(0,0,0,0.15)'
                  }} />
                </div>
              );
              if (isActive) {
                customStyle.boxShadow = '0 25px 50px rgba(0,0,0,0.75), 0 0 20px rgba(255, 255, 255, 0.2)';
              } else {
                customStyle.boxShadow = '0 10px 25px rgba(0,0,0,0.5)';
              }
            } else if (layer.id === 'art') {
              layerContent = (
                <>
                  <img
                    src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=500&q=80"
                    alt="Fine Art Original Landscape"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      pointerEvents: 'none'
                    }}
                  />
                  <div className="canvas-texture-overlay" />
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    pointerEvents: 'none'
                  }} />
                </>
              );
              if (isActive) {
                customStyle.boxShadow = '0 25px 50px rgba(0,0,0,0.8), 0 0 20px rgba(212, 175, 55, 0.3)';
              } else {
                customStyle.boxShadow = '0 10px 25px rgba(0,0,0,0.6)';
              }
            } else if (layer.id === 'backing') {
              layerContent = (
                <>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: '#32281e',
                    border: '2px solid #231d16',
                    borderRadius: '8px',
                    pointerEvents: 'none'
                  }} />
                  <div className="corrugated-backing-overlay" />
                </>
              );
              if (isActive) {
                customStyle.boxShadow = '0 25px 50px rgba(0,0,0,0.8)';
              } else {
                customStyle.boxShadow = '0 10px 25px rgba(0,0,0,0.6)';
              }
            }

            return (
              <div
                key={layer.id}
                className={`anatomy-layer ${isActive ? 'active' : ''}`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setActiveIndex(idx)}
                style={{
                  transform: `translateY(45px) rotateX(60deg) rotateZ(-35deg) translateZ(${zVal}px)`,
                  zIndex: 10 - idx,
                  opacity: displayIndex === null ? 1 : (isActive ? 1 : 0.35),
                  ...customStyle
                }}
              >
                {layerContent}

                {/* 3D-rotated glowing horizontal indicator line extending right */}
                <div style={{
                  position: 'absolute',
                  right: '-130px',
                  top: '50%',
                  width: '130px',
                  height: '2px',
                  background: isActive
                    ? 'linear-gradient(to right, var(--accent) 70%, rgba(212, 175, 55, 0))'
                    : 'linear-gradient(to right, rgba(255, 255, 255, 0.12) 50%, rgba(255, 255, 255, 0))',
                  transformOrigin: 'left center',
                  pointerEvents: 'none',
                  boxShadow: isActive ? '0 0 10px rgba(212, 175, 55, 0.6)' : 'none',
                  transition: 'all 0.3s ease',
                  opacity: isActive ? 1 : 0,
                  zIndex: 2,
                }} />
              </div>
            );
          })}
        </div>

        {/* Right Column: Expandable Accordion Menu with flat left-pointing lines */}
        <div className="anatomy-labels-list">
          {ANATOMY_LAYERS.map((layer, idx) => {
            const isActive = displayIndex === idx;

            return (
              <div
                key={layer.id}
                className={`anatomy-label-item ${isActive ? 'active' : ''}`}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setActiveIndex(idx)}
              >
                {/* Flat 2D connector line pointing left */}
                <div className="label-connector-line" />

                <div className="label-item-num">
                  0{idx + 1}
                </div>

                <div className="label-item-content">
                  <h3 className="label-item-title">
                    {layer.title}
                  </h3>
                  <span className="label-item-tech">
                    {layer.tech}
                  </span>
                  <p className="label-item-desc">
                    {layer.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function About() {
  usePageTitle('About Us');
  const isMobile = useMediaQuery('(max-width: 768px)');

  return (
    <div style={{ backgroundColor: '#050505', color: '#fff', minHeight: '80vh', paddingBottom: 'var(--space-xl)', overflowX: 'hidden' }}>
      <section className="subpage-hero">
        <div className="container">
          <span style={{ color: 'var(--accent)', letterSpacing: '0.2em', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>A Fixture On Monkland</span>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', color: '#fff', margin: '0.5rem 0 1rem', fontFamily: 'var(--font-heading)' }}>About Us</h1>
          <div style={{ width: '60px', height: '2px', backgroundColor: 'var(--accent)', margin: '0 auto' }}></div>
        </div>
      </section>

      <div className="container" style={{ marginTop: 'var(--space-lg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.15fr 0.85fr', gap: 'var(--space-lg)', alignItems: 'center', position: 'relative', margin: '2rem 0 5rem' }}>
          {/* Left Column: Image bleeding off-screen left */}
          <div style={{
            position: 'relative',
            marginLeft: isMobile ? '0' : '-12vw',
            width: isMobile ? '100%' : 'calc(100% + 12vw)',
            height: isMobile ? '300px' : '480px',
            borderRadius: isMobile ? '8px' : '0 12px 12px 0',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-lg)',
            border: '1px solid rgba(255,255,255,0.08)'
          }}>
            <img
              src="/conservart/images/storefront.jpg"
              alt="Conservart Monkland Storefront"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Right Column: Text offset with large decorative quote mark */}
          <div style={{ position: 'relative', paddingLeft: isMobile ? '0' : '2.5rem' }}>
            {/* Giant Gold Decorative Quote Mark */}
            <div style={{
              position: 'absolute',
              top: '-70px',
              left: isMobile ? '0' : '0px',
              fontSize: '14rem',
              fontFamily: 'var(--font-heading)',
              color: 'rgba(212, 175, 55, 0.06)',
              lineHeight: 1,
              pointerEvents: 'none',
              userSelect: 'none'
            }}>
              “
            </div>

            <h2 style={{ fontSize: '2.5rem', color: 'var(--accent)', marginBottom: '1.5rem', fontFamily: 'var(--font-heading)', position: 'relative', zIndex: 1 }}>Our Heritage</h2>
            <p style={{ color: '#E0E0E0', fontSize: '1.2rem', lineHeight: '1.8', marginBottom: 'var(--space-sm)', position: 'relative', zIndex: 1 }}>
              ConservArt is newly located in the pleasant and parking friendly area between Grand and Beaconsfield at 6160 Monkland Ave.
            </p>
            <p style={{ color: '#ccc', fontSize: '1rem', lineHeight: '1.8', position: 'relative', zIndex: 1 }}>
              We provide a bright, welcoming gallery space where corporate coordinators, museum curators, and private collectors choose their custom and conservation framing solutions, designed and handcrafted with over 20 years of professional fine art experience.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--space-lg)', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
          <div className="luxury-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent)', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600 }}>Workshop Standard</span>
            <h3 style={{ fontSize: '1.4rem', color: '#fff', margin: 0 }}>Protected For a Lifetime</h3>
            <div style={{ width: '30px', height: '2px', backgroundColor: 'var(--accent)' }}></div>
            <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: '1.7', margin: 0 }}>
              Archival preservation is an exact science. Exposure to light, moisture, and acid can degrade precious pieces within years. We utilize 99% UV filters, 100% cotton rag matboards, and high-precision joinery to keep your memories pristine forever.
            </p>
          </div>
        </div>

        {/* 3D Exploded Anatomy Frame stack visualizer */}
        <FrameAnatomy />
      </div>
    </div>
  );
}

function QuoteForm() {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    projectType: 'personal',
    width: '',
    height: '',
    medium: 'painting',
    frameStyle: 'modern-black',
    protection: 'museum-uv',
    matWidth: '2.0',
    fileName: '',
    fileData: null,
    name: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, fileName: file.name }));
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        setFormData(prev => ({ ...prev, fileData: uploadEvent.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = () => {
    let newErrors = {};
    if (step === 2) {
      if (!formData.width || parseFloat(formData.width) <= 0) {
        newErrors.width = 'Width must be a positive number';
      }
      if (!formData.height || parseFloat(formData.height) <= 0) {
        newErrors.height = 'Height must be a positive number';
      }
    } else if (step === 4) {
      if (!formData.name.trim()) {
        newErrors.name = 'Full Name is required';
      }
      if (!formData.email.trim()) {
        newErrors.email = 'Email address is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep()) {
      console.log('Premium Custom Quote Request Submitted:', formData);
      setSubmitted(true);
    }
  };

  const progressPercent = ((step - 1) / 3) * 100;

  return (
    <div className="quote-form-container" style={{ marginTop: 'var(--space-md)' }}>
      {submitted ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', padding: '2.5rem 1rem' }}
        >
          <div style={{ fontSize: '4.5rem', marginBottom: '1rem' }}>✨</div>
          <h3 style={{ fontSize: '2rem', color: 'var(--accent)', marginBottom: '1.25rem', fontFamily: 'var(--font-heading)' }}>
            Quote Request Received
          </h3>
          <p style={{ color: '#ccc', fontSize: '1.1rem', lineHeight: '1.8', maxWidth: '520px', margin: '0 auto 2rem' }}>
            Thank you, <strong>{formData.name}</strong>. Our master framer will review your <strong>{formData.projectType}</strong> project specs and contact you within 24 hours with a tailored estimation.
          </p>
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setSubmitted(false);
              setFormData({
                projectType: 'personal',
                width: '',
                height: '',
                medium: 'painting',
                frameStyle: 'modern-black',
                protection: 'museum-uv',
                matWidth: '2.0',
                fileName: '',
                fileData: null,
                name: '',
                email: '',
                phone: '',
                notes: ''
              });
            }}
            className="btn"
            style={{ fontSize: '0.85rem', borderColor: 'var(--accent)', color: 'var(--accent)' }}
          >
            Submit Another Quote
          </button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Progress Header */}
          <div className="form-progress-bar">
            <div className="form-progress-line" style={{ width: `${progressPercent}%` }}></div>
            {[1, 2, 3, 4].map(s => (
              <div
                key={s}
                className={`progress-step ${step === s ? 'active' : ''} ${step > s ? 'completed' : ''}`}
              >
                {step > s ? '✓' : s}
              </div>
            ))}
          </div>

          <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
            <span style={{ color: 'var(--accent)', fontSize: '0.8rem', letterSpacing: '0.12em', fontWeight: 600, textTransform: 'uppercase' }}>
              Step {step} of 4
            </span>
            <h3 style={{ fontSize: '1.5rem', color: '#fff', marginTop: '0.2rem', fontFamily: 'var(--font-heading)' }}>
              {step === 1 && 'Select Project Type'}
              {step === 2 && 'Dimensions & Art Medium'}
              {step === 3 && 'Conservation Preferences'}
              {step === 4 && 'Contact Information'}
            </h3>
          </div>

          <div style={{ minHeight: '260px' }}>
            {/* Step 1: Project Type */}
            {step === 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
                {[
                  { id: 'personal', label: 'Private Collection', icon: '🏡', desc: 'Family photos, fine art prints, canvas oil paintings' },
                  { id: 'corporate', label: 'Corporate Office', icon: '🏢', desc: 'Boardroom art, lobby galleries, commercial scale branding' },
                  { id: 'memorabilia', label: 'Memorabilia & Jerseys', icon: '⚽', desc: 'Sports jerseys, historical items, collectibles' },
                  { id: 'restoration', label: 'Restoration & Gilding', icon: '⏳', desc: 'Archival restoration, regilding antique frame profiles' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleInputChange('projectType', item.id)}
                    style={{
                      background: formData.projectType === item.id ? 'rgba(212, 175, 55, 0.08)' : 'rgba(255,255,255,0.01)',
                      border: formData.projectType === item.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '1.25rem 1rem',
                      cursor: 'pointer',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <span style={{ fontSize: '2rem' }}>{item.icon}</span>
                    <h4 style={{ color: '#fff', fontSize: '0.95rem', margin: 0, fontWeight: 600 }}>{item.label}</h4>
                    <p style={{ color: '#888', fontSize: '0.75rem', margin: 0, lineHeight: '1.4' }}>{item.desc}</p>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2: Dimensions & Medium */}
            {step === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-grid">
                  <div>
                    <label className="form-input-label">Width (Inches)</label>
                    <input
                      type="number"
                      className="form-control-input"
                      placeholder="e.g., 24"
                      value={formData.width}
                      onChange={(e) => handleInputChange('width', e.target.value)}
                    />
                    {errors.width && <span style={{ color: '#ff4d4d', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.width}</span>}
                  </div>
                  <div>
                    <label className="form-input-label">Height (Inches)</label>
                    <input
                      type="number"
                      className="form-control-input"
                      placeholder="e.g., 36"
                      value={formData.height}
                      onChange={(e) => handleInputChange('height', e.target.value)}
                    />
                    {errors.height && <span style={{ color: '#ff4d4d', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.height}</span>}
                  </div>
                </div>

                <div className="form-grid">
                  <div>
                    <label className="form-input-label">Art Medium</label>
                    <select
                      className="form-control-input"
                      value={formData.medium}
                      onChange={(e) => handleInputChange('medium', e.target.value)}
                    >
                      <option value="painting">Oil / Acrylic Canvas</option>
                      <option value="watercolor">Watercolor / Pastel</option>
                      <option value="photo">Fine Art Print / Photography</option>
                      <option value="diploma">Certificate / Diploma</option>
                      <option value="memorabilia">3D Object / Memorabilia</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-input-label">Preferred Frame Profile</label>
                    <select
                      className="form-control-input"
                      value={formData.frameStyle}
                      onChange={(e) => handleInputChange('frameStyle', e.target.value)}
                    >
                      <option value="ornate-gold">Classic Ornate Gold</option>
                      <option value="modern-black">Sleek Matte Black</option>
                      <option value="natural-oak">Premium Natural Oak</option>
                      <option value="white-float">Contemporary Floating White</option>
                      <option value="undecided">Not Sure (Consult in workshop)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Conservation Preferences */}
            {step === 3 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label className="form-input-label">Glazing Protection Level</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      { id: 'museum-uv', label: '99% UV Museum Glass (Recommended)', desc: 'Advanced anti-reflective silica coating. Blocks 99% UV and features <1% reflection for complete clarity.' },
                      { id: 'standard-uv', label: 'Conservation Clear Glass', desc: 'Premium conservation coating blocks 99% UV rays to prevent fading. Standard reflectivity.' },
                      { id: 'basic', label: 'Standard Clear Glass', desc: 'Basic non-UV protection. Suitable for environments without any direct or ambient sunlight.' }
                    ].map(gl => (
                      <label
                        key={gl.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          background: formData.protection === gl.id ? 'rgba(255,255,255,0.02)' : 'transparent',
                          border: formData.protection === gl.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                          borderRadius: '6px',
                          padding: '0.75rem 1rem',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="radio"
                          name="protection"
                          checked={formData.protection === gl.id}
                          onChange={() => handleInputChange('protection', gl.id)}
                          style={{ accentColor: 'var(--accent)', marginTop: '4px' }}
                        />
                        <div>
                          <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 600, display: 'block' }}>{gl.label}</span>
                          <span style={{ color: '#888', fontSize: '0.75rem' }}>{gl.desc}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <label className="form-input-label" style={{ margin: 0 }}>Matboard Width Preference</label>
                    <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>{formData.matWidth}"</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="4.0"
                    step="0.5"
                    value={formData.matWidth}
                    onChange={(e) => handleInputChange('matWidth', e.target.value)}
                    style={{
                      width: '100%',
                      accentColor: 'var(--accent)',
                      background: 'var(--border)',
                      height: '6px',
                      borderRadius: '3px',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                    <span>Flush (No Mat)</span>
                    <span>Standard (2.0")</span>
                    <span>Wide Margin (4.0")</span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Contact & Upload */}
            {step === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-grid">
                  <div>
                    <label className="form-input-label">Full Name</label>
                    <input
                      type="text"
                      className="form-control-input"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                    {errors.name && <span style={{ color: '#ff4d4d', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.name}</span>}
                  </div>
                  <div>
                    <label className="form-input-label">Email Address</label>
                    <input
                      type="email"
                      className="form-control-input"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                    {errors.email && <span style={{ color: '#ff4d4d', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.email}</span>}
                  </div>
                </div>

                <div className="form-grid">
                  <div>
                    <label className="form-input-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control-input"
                      placeholder="514-555-0199"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                    {errors.phone && <span style={{ color: '#ff4d4d', fontSize: '0.8rem', marginTop: '0.25rem', display: 'block' }}>{errors.phone}</span>}
                  </div>
                  <div>
                    <label className="form-input-label">Reference Image (Optional)</label>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '42px',
                        border: '1px dashed var(--border)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        background: 'rgba(255,255,255,0.01)',
                        transition: 'border-color 0.2s ease',
                        fontSize: '0.85rem',
                        overflow: 'hidden'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} />
                      <span style={{ color: formData.fileName ? 'var(--accent)' : '#888', fontWeight: formData.fileName ? 600 : 400, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', padding: '0 0.5rem' }}>
                        {formData.fileName ? `📁 ${formData.fileName}` : '📷 Select Image File'}
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="form-input-label">Additional Comments / Requirements</label>
                  <textarea
                    className="form-control-input"
                    rows="3"
                    placeholder="Describe any restoration needs, shadowbox constraints, or mounting details..."
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    style={{ resize: 'none' }}
                  ></textarea>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="btn"
                style={{ fontSize: '0.85rem' }}
              >
                Back
              </button>
            ) : (
              <div></div>
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="btn"
                style={{ fontSize: '0.85rem', background: '#fff', color: '#000', border: 'none', fontWeight: 'bold' }}
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                className="btn"
                style={{ fontSize: '0.85rem', background: 'var(--accent)', color: '#000', border: 'none', fontWeight: 'bold' }}
              >
                Submit Request
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function Contact() {
  usePageTitle('Contact & Hours');

  return (
    <div style={{ backgroundColor: '#050505', color: '#fff', minHeight: '80vh', paddingBottom: 'var(--space-xl)' }}>
      <section className="subpage-hero">
        <div className="container">
          <span style={{ color: 'var(--accent)', letterSpacing: '0.2em', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Visit the Gallery & Workshop</span>
          <h1 style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', color: '#fff', margin: '0.5rem 0 1rem', fontFamily: 'var(--font-heading)' }}>Contact Us</h1>
          <div style={{ width: '60px', height: '2px', backgroundColor: 'var(--accent)', margin: '0 auto' }}></div>
        </div>
      </section>

      <div className="container" style={{ marginTop: 'var(--space-lg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
          {/* Card 1: Details */}
          <div className="luxury-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <h3 style={{ fontSize: '1.4rem', color: '#fff', margin: 0, fontFamily: 'var(--font-heading)', letterSpacing: '0.05em' }}>Gallery Address</h3>
            <div style={{ width: '30px', height: '2px', backgroundColor: 'var(--accent)', marginBottom: '0.5rem' }}></div>
            <p style={{ color: '#ccc', fontSize: '1rem', lineHeight: '1.7', margin: 0 }}>
              6160 av. de Monkland<br />
              Montreal, QC, H4B 1G4
            </p>
            <p style={{ color: '#ccc', fontSize: '1.1rem', marginTop: '0.5rem', margin: 0 }}>
              Telephone:<br />
              <a href="tel:+15144853543" style={{ color: 'var(--accent)', fontWeight: 'bold', fontSize: '1.3rem' }}>514-485-3543</a>
            </p>
          </div>
          {/* Card 2: Hours */}
          <div className="luxury-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <h3 style={{ fontSize: '1.4rem', color: '#fff', margin: 0, fontFamily: 'var(--font-heading)', letterSpacing: '0.05em' }}>Opening Hours</h3>
            <div style={{ width: '30px', height: '2px', backgroundColor: 'var(--accent)', marginBottom: '0.5rem' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.95rem', color: '#ccc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                <span>Monday — Friday</span>
                <span style={{ color: '#fff', fontWeight: 500 }}>10:00 — 18:00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '4px' }}>
                <span>Saturday</span>
                <span style={{ color: '#fff', fontWeight: 500 }}>10:00 — 17:00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                <span>Sunday</span>
                <span style={{ color: '#888', fontWeight: 500 }}>Closed</span>
              </div>
            </div>
            <p style={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic', marginTop: '0.5rem', margin: 0 }}>
              * After hours by appointment. Phone: 514-485-3543.
            </p>
          </div>

          {/* Card 3: The Gallery Storefront */}
          <div className="luxury-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', padding: 0, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '220px' }}>
              <img
                src="/conservart/images/storefront.jpg"
                alt="Conservart Storefront and Gallery Entrance"
                style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '220px', display: 'block' }}
              />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '1rem', background: 'linear-gradient(to top, rgba(0,0,0,0.9) 30%, rgba(0,0,0,0))' }}>
                <span style={{ color: 'var(--accent)', fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>6160 Monkland Gallery Entrance</span>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Step Custom Quote Form */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
          <span style={{ color: 'var(--accent)', letterSpacing: '0.2em', fontSize: '0.85rem', textTransform: 'uppercase', fontWeight: 600 }}>Bespoke Consultation</span>
          <h2 style={{ fontSize: '2.5rem', marginTop: '0.5rem', marginBottom: 'var(--space-xs)' }}>Custom Quote Wizard</h2>
          <p style={{ color: '#888', maxWidth: '600px', margin: '0 auto', fontSize: '1rem' }}>
            Provide your canvas and conservation specifications to receive a meticulous, tailormade archival framing draft.
          </p>
        </div>
        <QuoteForm />
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2
    });

    window.lenis = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Sync GSAP with Lenis
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    return () => {
      window.lenis = null;
      lenis.destroy();
      // Remove ticker listener based on function reference if we had stored it, but since we didn't, this relies on React cleanup.
    };
  }, []);

  return (
    <Router basename="/conservart/">
      <ScrollToTop />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/corporate" element={<Corporate />} />
          <Route path="/private" element={<Private />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
