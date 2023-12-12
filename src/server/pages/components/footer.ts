const Footer = `<footer class="border-t border-gray-300 left-0 right-0 bottom-0 z-50 bg-gray-900 p-4 md:p-6 xl:p-8 dark:bg-gray-800 md:flex md:items-center md:justify-between antialiased">
<div class="mb-4 xl:flex xl:items-center xl:space-x-3 md:mb-0">
    <p class="mb-4 text-sm text-center text-white dark:text-gray-400 xl:mb-0">
        © 2022 <a href="https://flowbite.com/" class="hover:underline" target="_blank">Resumed Events</a>. All rights reserved.
    </p>
    <ul class="flex justify-center items-center">
        <li>
          <a href="/privacy" class="mr-6 text-gray-900 underline hover:no-underline dark:text-white">Privacy Policy</a>
        </li>
        <li>
          <a href="/api" class="mr-6 text-gray-900 underline hover:no-underline dark:text-white">API</a>
        </li>
        <li>
          <a href="/#contact" class="text-gray-900 underline hover:no-underline dark:text-white">Contact</a>
        </li>
    </ul>
</div>
<div class="flex justify-center items-center space-x-3">
    
    <a href="/settings" data-tooltip-target="tooltip-settings" class="inline-flex justify-center p-2 text-gray-500 rounded-lg cursor-pointer dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600">
        <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12.25V1m0 11.25a2.25 2.25 0 0 0 0 4.5m0-4.5a2.25 2.25 0 0 1 0 4.5M4 19v-2.25m6-13.5V1m0 2.25a2.25 2.25 0 0 0 0 4.5m0-4.5a2.25 2.25 0 0 1 0 4.5M10 19V7.75m6 4.5V1m0 11.25a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5ZM16 19v-2"></path></svg>
        <span class="sr-only">Settings</span>  
    </a>
    <div id="tooltip-settings" role="tooltip" class="inline-block absolute invisible z-10 py-2 px-3 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 transition-opacity duration-300 tooltip dark:bg-gray-700" data-popper-placement="top" style="position: absolute; inset: auto auto 0px 0px; margin: 0px; transform: translate3d(251px, -124px, 0px);">
        Settings
        <div class="tooltip-arrow" data-popper-arrow="" style="position: absolute; left: 0px; transform: translate3d(35.5px, 0px, 0px);"></div>
    </div>
    <a href="#" data-tooltip-target="tooltip-options" class="inline-flex justify-center p-2 text-gray-500 rounded-lg cursor-pointer dark:text-gray-400 dark:hover:text-white hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-gray-600">
        <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
          <g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
            <path d="M19 11V9a1 1 0 0 0-1-1h-.757l-.707-1.707.535-.536a1 1 0 0 0 0-1.414l-1.414-1.414a1 1 0 0 0-1.414 0l-.536.535L12 2.757V2a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v.757l-1.707.707-.536-.535a1 1 0 0 0-1.414 0L2.929 4.343a1 1 0 0 0 0 1.414l.536.536L2.757 8H2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h.757l.707 1.707-.535.536a1 1 0 0 0 0 1.414l1.414 1.414a1 1 0 0 0 1.414 0l.536-.535L8 17.243V18a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-.757l1.707-.708.536.536a1 1 0 0 0 1.414 0l1.414-1.414a1 1 0 0 0 0-1.414l-.535-.536.707-1.707H18a1 1 0 0 0 1-1Z"></path>
            <path d="M10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path>
          </g>
        </svg>
        <span class="sr-only">Options</span>
    </a>
    <div id="tooltip-options" role="tooltip" class="inline-block absolute invisible z-10 py-2 px-3 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm opacity-0 transition-opacity duration-300 tooltip dark:bg-gray-700" data-popper-placement="top" style="position: absolute; inset: auto auto 0px 0px; margin: 0px; transform: translate3d(296.5px, -124px, 0px);">
      Options
      <div class="tooltip-arrow" data-popper-arrow="" style="position: absolute; left: 0px; transform: translate3d(34px, 0px, 0px);"></div>
  </div>
</div>
</footer>`;

export default Footer;