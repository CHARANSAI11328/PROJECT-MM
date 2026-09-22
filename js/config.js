/**
 * MAMEKA MAHODAYAM - Global Environment & API Configuration
 * 
 * If hosting static frontend on Netlify or GitHub Pages:
 * Set your live Node backend API URL below (e.g. 'https://mameka-backend.onrender.com')
 * or leave empty if running full-stack / local node server.
 */
(function () {
  'use strict';
  // Set your live backend API URL below if hosting static frontend on Netlify / GitHub Pages:
  const LIVE_BACKEND_URL = ''; // e.g., 'https://mameka-backend.onrender.com'

  window.API_BASE_URL = window.API_BASE_URL || LIVE_BACKEND_URL || localStorage.getItem('mm_api_base_url') || '';
})();
