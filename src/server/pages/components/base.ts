import Footer from "./footer";
import NavbarComponent, { roleSwitcher } from "./nav";

const Base = (data: { name: string; page: any }) => {
  return `
    <!DOCTYPE html>
  <html lang="en" class="scoll-smooth">

          <head>
              <meta charset="utf-8">
              <title> Resumed Events | Dashboard Page</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <meta content="Software that provide event organizers seamless qr code generation for attendees to connect!" name="description">
              <meta content="Resumed" name="author">
              <meta property="og:url" content="https://resumed.events/dashboard/">
              <meta property="og:type" content="website">
              <meta property="og:title" content="Resumed Events | Dashboard Page">
              <meta property="og:description" content="Resumed Events | Dashboard Page - Software that provide event organizers seamless qr code generation for attendees to connect!">
              <meta property="og:image" content="https://s3.us-west-2.amazonaws.com/resumed.events.local/template/website/dist/assets/images/logo.png">
              <!-- favicon -->
              <link rel="shortcut icon" href="https://s3.us-west-2.amazonaws.com/resumed.events.local/template/website/dist/assets/images/favicon_io/favicon.ico">
              <!-- Style css -->
              <link href="https://cdnjs.cloudflare.com/ajax/libs/flowbite/1.8.1/flowbite.min.css" rel="stylesheet">
                

          </head>
          
    <body>
          <div class="antialiased bg-gray-50 dark:bg-gray-900">
              ${NavbarComponent(data.name)}
              <main class="p-4 md:ml-64 h-auto bg-gray-900">
              
              <nav class="mb-2 flex px-3 py-2 text-gray-700 border border-gray-200 rounded-lg bg-gray-50 dark:bg-green-600 dark:border-gray-600" aria-label="Breadcrumb">
              ${data.name === "Dashboard"
      ? `<ol class="inline-flex items-center space-x-1 md:space-x-3">
              <li aria-current="page" class="inline-flex items-center">
                  <a href="#" class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-white">Dashboard</a>
              </li>
          </ol>`: `<ol class="inline-flex items-center space-x-1 md:space-x-3">
                            <li class="inline-flex items-center">
                                <a href="/another-dashboard" class="inline-flex items-center text-sm font-medium text-gray-700 hover:text-primary-600 dark:text-gray-300 dark:hover:text-white">Dashboard</a>
                            </li>
                            
                            <li aria-current="page">
                                <div class="flex items-center">
                                    <svg aria-hidden="true" class="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path>
                                    </svg>
                                    <span class="ml-1 text-sm font-medium text-gray-500 md:ml-2 dark:text-gray-400">${data.name}</span>
                                </div>
                            </li>
                        </ol>`}
                    </nav>
                ${data.page}
              </main>
            </div>
            <div class="h-8 bg-gray-900"></div>
        ${Footer}
        <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>

        <script src="https://cdnjs.cloudflare.com/ajax/libs/flowbite/2.2.0/flowbite.min.js"></script>
      </body>
  </html>`;
};

export default Base;
