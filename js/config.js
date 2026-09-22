/**
 * MAMEKA MAHODAYAM - Global Environment & API Configuration
 * 
 * When hosting static frontend on Netlify / GitHub Pages:
 * Set your live Node backend API URL below (e.g. 'https://your-backend.onrender.com')
 * or leave empty if running full-stack / local node server.
 */
(function () {
  'use strict';
  window.API_BASE_URL = window.API_BASE_URL || localStorage.getItem('mm_api_base_url') || '';
})();
