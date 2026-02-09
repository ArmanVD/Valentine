// Valentine Script - Clip-path wipe animation
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

document.addEventListener('DOMContentLoaded', () => {
  const svg = document.querySelector('svg');
  const svgRect = document.querySelector('svg rect');
  const svgPaths = document.querySelectorAll('svg path');

  if (!svg || !svgRect || svgPaths.length === 0) return;

  const svgHeight = svg.getAttribute('height');

  // Background rect: animate height as the page scrolls
  svgRect.setAttribute('height', '0');
  gsap.to(svgRect, {
    attr: { height: svgHeight },
    ease: 'none',
    scrollTrigger: {
      trigger: document.documentElement,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true
    }
  });

  // Fade in images when they enter the viewport
  const images = document.querySelectorAll('main img');
  images.forEach((img, i) => {
    gsap.set(img, { opacity: 0 });
    gsap.to(img, {
      opacity: 1,
      duration: 1,
      ease: 'power1.in',
      scrollTrigger: {
        trigger: i === 0 ? document.documentElement : img,
        start: i === 0 ? 'top top-=1' : 'top 85%',
        toggleActions: 'play none none none'
      }
    });
  });

  // Refresh ScrollTrigger positions after lazy images load
  images.forEach((img) => {
    if (!img.complete) {
      img.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
    }
  });

  // Path 1: always visible, no animation
  const allPaths = Array.from(svgPaths);
  const pathsToAnimate = allPaths.slice(1);

  // Create <defs> in SVG for clip paths
  let defs = svg.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.prepend(defs);
  }

  const lastIndex = pathsToAnimate.length - 1;

  pathsToAnimate.forEach((path, index) => {
    const bbox = path.getBBox();
    const padding = 10;
    // Index 0: force top-to-bottom; index 1: left-to-right; indices 2+: all top-to-bottom
    const isVertical = index !== 1;

    // Create a clipPath with a rect
    const clipPathEl = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath');
    clipPathEl.id = `text-clip-${index}`;

    const clipRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    clipRect.setAttribute('x', bbox.x - padding);
    clipRect.setAttribute('y', bbox.y - padding);

    if (isVertical) {
      clipRect.setAttribute('width', bbox.width + padding * 2);
      clipRect.setAttribute('height', '0');
    } else {
      clipRect.setAttribute('width', '0');
      clipRect.setAttribute('height', bbox.height + padding * 2);
    }

    clipPathEl.appendChild(clipRect);
    defs.appendChild(clipPathEl);

    path.setAttribute('clip-path', `url(#text-clip-${index})`);

    const targetAttr = isVertical
      ? { height: bbox.height + padding * 2 }
      : { width: bbox.width + padding * 2 };

    // Path 2 (index 0): visible on load, animate top-to-bottom in 1.5s
    if (index === 0) {
      gsap.to(clipRect, {
        attr: targetAttr,
        duration: 1.5,
        ease: 'power2.out',
        delay: 0.3
      });
      return;
    }

    // Create invisible trigger div at the path's Y position
    const trigger = document.createElement('div');
    trigger.style.cssText = `position:absolute;top:${bbox.y}px;left:0;width:1px;height:${Math.max(bbox.height, 100)}px;pointer-events:none;`;
    document.body.appendChild(trigger);

    // Index 1 (path 3): keep moderate speed; indices 2+: slower for letter-by-letter feel
    let end;
    if (index === 1) {
      end = 'top 20%';
    } else if (index === lastIndex) {
      end = 'bottom 40%';
    } else {
      end = 'bottom 50%';
    }

    gsap.to(clipRect, {
      attr: targetAttr,
      ease: 'none',
      scrollTrigger: {
        trigger: trigger,
        start: 'top 85%',
        end: end,
        scrub: 1
      }
    });
  });

  // No button: show popover with countdown, then remove button
  const noBtn = document.getElementById('no-btn');
  const popover = document.getElementById('no-popover');
  const timer = document.getElementById('no-timer');

  if (noBtn && popover && timer) {
    popover.addEventListener('toggle', (e) => {
      if (e.newState === 'open') {
        noBtn.disabled = true;
        let remaining = 5;
        timer.textContent = remaining;

        const interval = setInterval(() => {
          remaining--;
          timer.textContent = remaining;

          if (remaining <= 0) {
            clearInterval(interval);
            popover.hidePopover();
            noBtn.remove();
          }
        }, 1000);
      }
    });
  }
});
