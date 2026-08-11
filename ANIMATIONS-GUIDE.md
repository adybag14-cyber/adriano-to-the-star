# Wix-Style Animations Implementation Guide

## Overview

This site now includes a comprehensive JavaScript animation system that replicates Wix's interactive features, including scroll animations, parallax effects, entrance animations, and hover interactions.

## Live Demo

**Site URL:** https://newstarpage2-2cbd41.gitlab.io

---

## Implemented Animation Features

### 1. **Scroll-Driven Animations**

Elements animate when they enter the viewport as you scroll.

**How it works:**

- Uses Intersection Observer API for performance
- Automatically detects when elements come into view
- Triggers animations only once per element

**Usage:**

```html
<div data-scroll-animate>Content will fade in and slide up</div>
```

---

### 2. **Entrance Animations**

Elements appear with different entrance effects when visible.

**Available Types:**

- `fadeIn` - Fade in gradually
- `slideUp` - Slide up from below
- `slideDown` - Slide down from above
- `slideLeft` - Slide in from right
- `slideRight` - Slide in from left
- `zoomIn` - Zoom in from small to normal size

**Usage:**

```html
<div data-entrance="slideUp" data-entrance-delay="200">Slides up with 200ms delay</div>
```

---

### 3. **Parallax Scrolling**

Background elements move at different speeds to create depth.

**Features:**

- Smooth parallax effect on scroll
- Customizable speed multiplier
- Hardware-accelerated with translate3d

**Usage:**

```html
<!-- Basic parallax -->
<img data-parallax data-parallax-speed="0.5" src="image.jpg" />

<!-- Slower parallax (more dramatic) -->
<img data-parallax data-parallax-speed="0.3" src="bg.jpg" />
```

**Speed Guide:**

- `0.3` = Slow movement (best for backgrounds)
- `0.5` = Medium movement
- `0.7` = Fast movement (subtle effect)

---

### 4. **Hover Effects**

Interactive effects when hovering over elements.

**Available Types:**

**Zoom Effect:**

```html
<img data-hover="zoom" src="image.jpg" />
```

- Scales up by 5%
- Increases brightness
- Smooth transition

**Lift Effect:**

```html
<button data-hover="lift">Click Me</button>
```

- Lifts element up 5px
- Adds shadow underneath
- Perfect for buttons

**Glow Effect:**

```html
<div data-hover="glow">Hover Me</div>
```

- Creates glowing border
- Brightens border color
- Great for cards/panels

---

### 5. **Stagger Animations**

Animate multiple elements sequentially.

**Usage:**

```html
<div data-stagger data-stagger-delay="100">
    <div>Item 1</div>
    <div>Item 2</div>
    <div>Item 3</div>
</div>
```

**Result:** Each child animates 100ms after the previous one.

---

### 6. **Loop Animations**

Continuous animations that repeat infinitely.

**Available Types:**

**Float Animation:**

```html
<div data-loop="float">Floats up and down</div>
```

**Pulse Animation:**

```html
<div data-loop="pulse">Pulses scale and opacity</div>
```

**Rotate Animation:**

```html
<div data-loop="rotate" data-loop-speed="10s">Rotates continuously</div>
```

---

### 7. **Parallax Depth Layers**

Create layered parallax effects with multiple elements.

**Usage:**

```html
<!-- Background layer (moves slowest) -->
<div data-parallax-depth="0.3">Background</div>

<!-- Middle layer -->
<div data-parallax-depth="0.5">Midground</div>

<!-- Foreground layer (moves fastest) -->
<div data-parallax-depth="0.8">Foreground</div>
```

---

### 8. **Smooth Scroll**

Smooth scrolling to anchor links.

**Usage:**

```html
<a href="#section">Jump to section</a>

<section id="section">Target section</section>
```

Automatically applied to all internal anchor links!

---

## Performance Optimizations

### Hardware Acceleration

All animations use CSS transforms which are GPU-accelerated:

- `transform: translate3d()` instead of `top/left`
- `transform: scale()` instead of `width/height`
- `opacity` for fading

### Will-Change Property

Elements with animations have `will-change` set to optimize rendering:

```css
[data-entrance],
[data-scroll-animate],
[data-parallax] {
    will-change: transform, opacity;
}
```

### Request Animation Frame

Scroll effects use `requestAnimationFrame()` for smooth 60fps animations.

### Intersection Observer

Entrance animations use Intersection Observer instead of scroll events for better performance.

---

## Browser Compatibility

✅ **Fully Supported:**

- Chrome 51+
- Firefox 55+
- Safari 12.1+
- Edge 79+

⚠️ **Partial Support:**

- Internet Explorer: Basic functionality (no animations)
- Older mobile browsers: Degrades gracefully

---

## Customization Examples

### Custom Entrance Animation

```html
<div data-entrance="zoomIn" data-entrance-delay="500" style="transition-duration: 1.5s;">
    Zooms in slowly with 500ms delay
</div>
```

### Multiple Effects Combined

```html
<img
    data-entrance="fadeIn"
    data-hover="zoom"
    data-parallax
    data-parallax-speed="0.4"
    src="image.jpg"
/>
```

### Staggered Gallery

```html
<div class="gallery" data-stagger data-stagger-delay="150">
    <img src="1.jpg" data-hover="zoom" />
    <img src="2.jpg" data-hover="zoom" />
    <img src="3.jpg" data-hover="zoom" />
    <img src="4.jpg" data-hover="zoom" />
</div>
```

---

## Implementation on This Site

### Header Portrait

```html
<img data-entrance="fadeIn" data-hover="zoom" />
```

- Fades in on page load
- Zooms on hover

### I.T.A Sections

```html
<section data-stagger data-stagger-delay="150">
    <h1 data-scroll-animate>I.T.A</h1>
    <h1 data-scroll-animate>I.T.A</h1>
    <h1 data-scroll-animate>I.T.A</h1>
</section>
```

- Each I.T.A appears sequentially
- 150ms delay between each

### Welcome Banner

```html
<img data-parallax data-parallax-speed="0.3" />
<div data-entrance="fadeIn" data-entrance-delay="200">
    <h1 data-scroll-animate>WELCOME</h1>
</div>
```

- Background moves with parallax
- Content fades in with delay
- Title animates on scroll

### Gallery Grid

```html
<section data-stagger data-stagger-delay="100">
    <img data-hover="zoom" data-entrance="slideUp" />
    <img data-hover="zoom" data-entrance="slideUp" />
</section>
```

- Images slide up sequentially
- Zoom effect on hover

### Buttons

```html
<button data-hover="lift">Start Exploring</button>
```

- Lifts up on hover
- Adds shadow effect

---

## Adding Animations to New Elements

### Step 1: Choose Animation Type

Decide which animation fits your element:

- **Static content** → `data-entrance`
- **Images** → `data-hover="zoom"`
- **Buttons** → `data-hover="lift"`
- **Backgrounds** → `data-parallax`
- **Multiple items** → `data-stagger` on parent

### Step 2: Add Data Attribute

```html
<div data-entrance="slideUp">Your content</div>
```

### Step 3: Customize (Optional)

```html
<div data-entrance="slideUp" data-entrance-delay="300">Your content</div>
```

### Step 4: Test

Reload the page and scroll to see your animations!

---

## Debugging

### Check Console

Open browser console (F12) and look for:

```
🎨 Wix-style animations initialized!
```

### Test Individual Elements

Add this to console:

```javascript
// Test entrance animation
document.querySelector('[data-entrance]').classList.add('animate-in');

// Test hover effect
document.querySelector('[data-hover]').dispatchEvent(new Event('mouseenter'));
```

---

## Technical Architecture

### Class Structure

- `ScrollAnimations` - Handles scroll-based effects
- `EntranceAnimations` - Manages element entrance effects
- `HoverEffects` - Interactive hover behaviors
- `StaggerAnimations` - Sequential animation timing
- `LoopAnimations` - Continuous repeating animations
- `ParallaxEffect` - Parallax scrolling logic
- `SmoothScroll` - Smooth anchor navigation

### Initialization

All classes initialize automatically on `DOMContentLoaded`:

```javascript
document.addEventListener('DOMContentLoaded', () => {
    new ScrollAnimations();
    new EntranceAnimations();
    new HoverEffects();
    new StaggerAnimations();
    new LoopAnimations();
    new ParallaxEffect();
    new SmoothScroll();
});
```

---

## Comparison with Wix

### ✅ Successfully Replicated

- Scroll-triggered animations
- Entrance effects
- Hover interactions
- Parallax scrolling
- Stagger animations
- Smooth scrolling

### 🔄 Adapted/Improved

- Used Intersection Observer (better performance than Wix)
- Pure JavaScript (no jQuery dependency)
- Lighter weight (~400 lines vs Wix's heavy framework)
- More customizable via data attributes

### ❌ Not Replicated

- Wix's drag-and-drop editor animations
- Wix's animation timeline editor
- Some proprietary Wix effects
- Wix-specific video animations

---

## Resources Used

Based on research from:

- CSS-Tricks parallax tutorials
- Wix Velo Animation API documentation
- W3Schools parallax guides
- MDN Web Docs (Intersection Observer)
- Web animation best practices

---

## Future Enhancements

Potential additions:

- [ ] Mouse-follow effects
- [ ] Scroll-triggered video playback
- [ ] Custom easing functions
- [ ] Timeline-based complex animations
- [ ] Touch gesture animations for mobile

---

## Support

For issues or questions:

1. Check browser console for errors
2. Verify data attributes are correct
3. Ensure animations.js is loaded
4. Test in different browsers

---

**Last Updated:** November 14, 2025  
**Version:** 1.0  
**Author:** Droid AI + Your Input
