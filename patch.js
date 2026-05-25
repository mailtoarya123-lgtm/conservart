const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

// Add artworkRef
code = code.replace(
  "const frameTrackRef = useRef(null);",
  "const frameTrackRef = useRef(null);\n  const artworkRef = useRef(null);"
);

// Apply activeIndex calculation early
code = code.replace(
  "let lastIndex = -1;",
  "let lastIndex = -1;\n      const slideCount = 6;"
);

// Add artwork scale to the loop
code = code.replace(
  "gsap.set(img, {\n                    scale: currentScale,\n                    opacity: currentOpacity,\n                    transformOrigin: 'center center'\n                  });",
  `gsap.set(img, {
                    scale: currentScale,
                    opacity: currentOpacity,
                    transformOrigin: 'center center'
                  });
                  const activeIndex = Math.min(Math.max(Math.round(progress * (slideCount - 1)), 0), slideCount - 1);
                  if (i === activeIndex && artworkRef.current) {
                    gsap.set(artworkRef.current, { scale: currentScale, transformOrigin: 'center center' });
                  }`
);

// remove the redeclaration of slideCount
code = code.replace(
  "const slideCount = 6;\n            const activeIndex = Math.min(\n              Math.max(Math.round(progress * (slideCount - 1)), 0),\n              slideCount - 1\n            );",
  `const activeIndex = Math.min(
              Math.max(Math.round(progress * (slideCount - 1)), 0),
              slideCount - 1
            );`
);

// Apply artworkRef to the artwork container
code = code.replace(
  "ref={currentSlideIndex === 4 ? glareContainerRef : undefined}",
  "ref={(el) => {\n              artworkRef.current = el;\n              if (currentSlideIndex === 4) glareContainerRef.current = el;\n            }}"
);

fs.writeFileSync('src/App.jsx', code);
