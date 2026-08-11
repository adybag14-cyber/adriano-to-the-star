/**
 * Lazy Loading for Images and Components
 * Lazy load images and components for performance
 */
(function() {
    'use strict';

    class LazyLoadingImagesComponents {
        constructor() {
            this.observer = null;
            this.init();
        }

        init() {
            this.setupIntersectionObserver();
            this.lazyLoadImages();
            this.lazyLoadComponents();
        }

        setupIntersectionObserver() {
            if ('IntersectionObserver' in window) {
                this.observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            this.loadElement(entry.target);
                            this.observer.unobserve(entry.target);
                        }
                    });
                });
            }
        }

        lazyLoadImages() {
            document.querySelectorAll('img[data-src]').forEach(img => {
                if (this.observer) {
                    this.observer.observe(img);
                } else {
                    this.loadImage(img);
                }
            });
        }

        loadImage(img) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
        }

        lazyLoadComponents() {
            document.querySelectorAll('[data-lazy-component]').forEach(component => {
                if (this.observer) {
                    this.observer.observe(component);
                } else {
                    this.loadComponent(component);
                }
            });
        }

        loadElement(element) {
            if (element.tagName === 'IMG') {
                this.loadImage(element);
            } else {
                this.loadComponent(element);
            }
        }

        loadComponent(component) {
            const componentName = component.dataset.lazyComponent;
            if (window[componentName]) {
                new window[componentName](component);
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.lazyLoading = new LazyLoadingImagesComponents();
        });
    } else {
        window.lazyLoading = new LazyLoadingImagesComponents();
    }
})();

