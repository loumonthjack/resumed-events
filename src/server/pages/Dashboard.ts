const Dashboard = () => `

<div class="w-full bg-white border-2 rounded-lg border-gray-300 h-84 shadow dark:bg-gray-800 p-4 md:p-6 mt-4">
  <div class="flex justify-between">
    <div>
      <h5 class="leading-none text-3xl font-bold text-gray-900 dark:text-white pb-2">1.1k</h5>
      <p class="text-base font-normal text-gray-500 dark:text-gray-400">Attendees this week</p>
    </div>
    <div
      class="flex items-center px-2.5 py-0.5 text-base font-semibold text-green-500 dark:text-green-500 text-center">
      12%
      <svg class="w-3 h-3 ms-1" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 14">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13V1m0 0L1 5m4-4 4 4"/>
      </svg>
    </div>
  </div>
  <div id="area-chart"></div>
  <div class="grid grid-cols-1 items-center border-gray-200 border-t dark:border-gray-700 justify-between">
    <div class="flex justify-between items-center pt-5">
      <!-- Button -->
      <button
        id="dropdownDefaultButton"
        data-dropdown-toggle="lastDaysdropdown"
        data-dropdown-placement="bottom"
        class="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 text-center inline-flex items-center dark:hover:text-white"
        type="button">
        Last 7 days
        <svg class="w-2.5 m-2.5 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/>
        </svg>
      </button>
      <!-- Dropdown menu -->
      <div id="lastDaysdropdown" class="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700">
          <ul class="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownDefaultButton">
            <li>
              <a href="#" class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Yesterday</a>
            </li>
            <li>
              <a href="#" class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Today</a>
            </li>
            <li>
              <a href="#" class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Last 7 days</a>
            </li>
            <li>
              <a href="#" class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Last 30 days</a>
            </li>
            <li>
              <a href="#" class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">Last 90 days</a>
            </li>
          </ul>
      </div>
      <a
        href="/users"
        class="uppercase text-sm font-semibold inline-flex items-center rounded-lg text-blue-600 hover:text-blue-700 dark:hover:text-blue-500  hover:bg-gray-100 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700 px-3 py-2">
        Attendees Report
        <svg class="w-2.5 h-2.5 ms-1.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 9 4-4-4-4"/>
        </svg>
      </a>
    </div>
  </div>
</div>

<script>
  // ApexCharts options and config
  window.addEventListener("load", function() {
    let options = {
      chart: {
        height: "100%",
        maxWidth: "100%",
        type: "area",
        fontFamily: "Inter, sans-serif",
        dropShadow: {
          enabled: false,
        },
        toolbar: {
          show: false,
        },
      },
      tooltip: {
        enabled: true,
        x: {
          show: false,
        },
      },
      fill: {
        type: "gradient",
        gradient: {
          opacityFrom: 0.55,
          opacityTo: 0,
          shade: "#1C64F2",
          gradientToColors: ["#1C64F2"],
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        width: 6,
      },
      grid: {
        show: false,
        strokeDashArray: 4,
        padding: {
          left: 2,
          right: 2,
          top: 0
        },
      },
      series: [
        {
          name: "New users",
          data: [6500, 6418, 6456, 6526, 6356, 6456],
          color: "#1A56DB",
        },
      ],
      xaxis: {
        categories: ['01 February', '02 February', '03 February', '04 February', '05 February', '06 February', '07 February'],
        labels: {
          show: false,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        show: false,
      },
    }

    if (document.getElementById("area-chart") && typeof ApexCharts !== 'undefined') {
      const chart = new ApexCharts(document.getElementById("area-chart"), options);
      chart.render();
    }
  });
</script>

<div class="border-2 rounded-lg border-gray-300 bg-white dark:border-gray-600 h-84 mb-4 mt-4">

  <div class="w-full p-4 ">
    <div class="flex items-center justify-between mb-4">
        <h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white">Latest Events</h5>
        <a href="/events" class="text-sm font-medium text-blue-600 hover:underline dark:text-blue-500">
            View all
        </a>
    </div>
    <div class="flow-root">
      <ul role="list" class="divide-y divide-gray-200 dark:divide-gray-700">
          <li class="py-3 sm:py-4">
              <div class="flex items-center">
                  
                  <div class="flex-1 min-w-0 ms-4">
                      <p class="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">Name</p>
                      
                  </div>
                  <div class="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">Attendees</div>
              </div>
          </li>
          
          
          
          <li class="pt-3 pb-0 sm:pt-4">
              <div class="flex items-center ">
                  
                  <div class="flex-1 min-w-0 ms-4">
                      <p class="text-sm font-medium text-gray-900 truncate dark:text-white">
                          Winter Summit 2023
                      </p>
                      
                  </div>
                  <div class="inline-flex items-center text-base font-medium text-gray-900 dark:text-white">
                      367
                  </div>
              </div>
          </li>
      <li class="pt-3 pb-0 sm:pt-4">
              <div class="flex items-center ">
                  
                  <div class="flex-1 min-w-0 ms-4">
                      <p class="text-sm font-medium text-gray-900 truncate dark:text-white">
                          California Sponsorship Conference 2023
                      </p>
                      
                  </div>
                  <div class="inline-flex items-center text-base font-medium text-gray-900 dark:text-white">
                      681
                  </div>
              </div>
          </li><li class="pt-3 pb-0 sm:pt-4">
              <div class="flex items-center ">
                  
                  <div class="flex-1 min-w-0 ms-4">
                      <p class="text-sm font-medium text-gray-900 truncate dark:text-white">
                          Sales Summer Summit 2023
                      </p>
                      
                  </div>
                  <div class="inline-flex items-center text-base font-medium text-gray-900 dark:text-white">
                      43
                  </div>
              </div>
          </li><li class="pt-3 pb-0 sm:pt-4">
              <div class="flex items-center ">
                  
                  <div class="flex-1 min-w-0 ms-4">
                      <p class="text-sm font-medium text-gray-900 truncate dark:text-white">
                        5th Annual Cancer Awareness Fundraiser 2023
                      </p>
                      
                  </div>
                  <div class="inline-flex items-center text-base font-medium text-gray-900 dark:text-white">
                      264
                  </div>
              </div>
          </li><li class="pt-3 pb-0 sm:pt-4">
              <div class="flex items-center ">
                  
                  <div class="flex-1 min-w-0 ms-4">
                      <p class="text-sm font-medium text-gray-900 truncate dark:text-white">
                          Internal Planning Conference 2023
                      </p>
                      
                  </div>
                  <div class="inline-flex items-center text-base font-medium text-gray-900 dark:text-white">
                      32
                  </div>
              </div>
          </li><li class="pt-3 pb-0 sm:pt-4">
              <div class="flex items-center ">
                  
                  <div class="flex-1 min-w-0 ms-4">
                      <p class="text-sm font-medium text-gray-900 truncate dark:text-white">
                          Appreciation Ball 2023
                      </p>
                      
                  </div>
                  <div class="inline-flex items-center text-base font-medium text-gray-900 dark:text-white">
                      473
                  </div>
              </div>
          </li></ul>
    </div>
  </div>
</div>
  <div class="grid grid-cols-2 gap-4 mb-4">
  <div class="border-2 rounded-lg bg-white border-gray-300 dark:border-gray-600 h-48 md:h-72">
  <div class="mt-6 text-center">
  <a href="/users">
      <h5 class="mb-2 mx-auto text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Active Users</h5>
  </a>
  <p class="mb-3 text-5xl font-bold text-gray-900 dark:text-gray-400">6</p>
  <a href="/users" class="inline-flex items-center text-blue-600 hover:underline">View More<svg class="w-3 h-3 ms-2.5 rtl:rotate-[270deg]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11v4.833A1.166 1.166 0 0 1 13.833 17H2.167A1.167 1.167 0 0 1 1 15.833V4.167A1.166 1.166 0 0 1 2.167 3h4.618m4.447-2H17v5.768M9.111 8.889l7.778-7.778"></path>
      </svg>
  </a></div>
  
</div>
<div class="border-2 rounded-lg border-gray-300 bg-white dark:border-gray-600 h-48 md:h-72">


  <div class="mt-6 text-center">
  <a href="/events">
      <h5 class="mb-2 mx-auto text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Active Events</h5>
  </a>
  <p class="mb-3 text-5xl font-bold text-gray-900 dark:text-gray-400">1</p>
  <a href="/events" class="inline-flex items-center text-blue-600 hover:underline">View More<svg class="w-3 h-3 ms-2.5 rtl:rotate-[270deg]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11v4.833A1.166 1.166 0 0 1 13.833 17H2.167A1.167 1.167 0 0 1 1 15.833V4.167A1.166 1.166 0 0 1 2.167 3h4.618m4.447-2H17v5.768M9.111 8.889l7.778-7.778"></path>
      </svg>
  </a></div>
  
</div>
<div class="border-2 rounded-lg border-gray-300 bg-white dark:border-gray-600 h-48 md:h-72">
  <div class="mt-6 text-center">
  <a href="/users">
      <h5 class="mb-2 mx-auto text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Pending Invites</h5>
  </a>
  <p class="mb-3 text-5xl font-bold text-gray-900 dark:text-gray-400">4</p>
  <a href="/users" class="inline-flex items-center text-blue-600 hover:underline">View More<svg class="w-3 h-3 ms-2.5 rtl:rotate-[270deg]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11v4.833A1.166 1.166 0 0 1 13.833 17H2.167A1.167 1.167 0 0 1 1 15.833V4.167A1.166 1.166 0 0 1 2.167 3h4.618m4.447-2H17v5.768M9.111 8.889l7.778-7.778"></path>
      </svg>
  </a></div>
  
</div><div class="border-2 rounded-lg border-gray-300 bg-white dark:border-gray-600 h-48 md:h-72">


  <div class="mt-6 text-center">
  <a href="/events">
      <h5 class="mb-2 mx-auto text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Upcoming Events</h5>
  </a>
  <p class="mb-3 text-5xl font-bold text-gray-900 dark:text-gray-400">2</p>
  <a href="/events" class="inline-flex items-center text-blue-600 hover:underline">View More<svg class="w-3 h-3 ms-2.5 rtl:rotate-[270deg]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11v4.833A1.166 1.166 0 0 1 13.833 17H2.167A1.167 1.167 0 0 1 1 15.833V4.167A1.166 1.166 0 0 1 2.167 3h4.618m4.447-2H17v5.768M9.111 8.889l7.778-7.778"></path>
      </svg>
  </a></div>
  
</div></div>
  

<div class="border-2 rounded-lg bg-white border-gray-300 dark:border-gray-600 h-84 mb-4">

<div class="w-full p-4 ">
  <div class="flex items-center justify-between mb-4">
      <h5 class="text-xl font-bold leading-none text-gray-900 dark:text-white">Top Attendees</h5>
      <a href="/users" class="text-sm font-medium text-blue-600 hover:underline dark:text-blue-500">
          View all
      </a>
 </div>
 <div class="flow-root">
      <ul role="list" class="divide-y divide-gray-200 dark:divide-gray-700">
          <li class="py-3 sm:py-4">
              <div class="flex items-center">
                  
                  <div class="flex-1 min-w-0 ms-4">
                      <p class="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
Name                        </p>
                      
                  </div>
                  <div class="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">Engagement</div>
              </div>
          </li>
          
          
          
          <li class="pt-3 pb-0 sm:pt-4">
              <div class="flex items-center ">
                  
                  <div class="flex-1 min-w-0 ms-4">
                      <p class="text-sm font-medium text-gray-900 truncate dark:text-white">
                          Ashley Wright
                      </p>
                      
                  </div>
                  <div class="inline-flex items-center text-base font-medium text-gray-900 dark:text-white">
                      2.3
                  </div>
              </div>
          </li>
      <li class="pt-3 pb-0 sm:pt-4">
              <div class="flex items-center ">
                  
                  <div class="flex-1 min-w-0 ms-4">
                      <p class="text-sm font-medium text-gray-900 truncate dark:text-white">John Trahan</p>
                      
                  </div>
                  <div class="inline-flex items-center text-base font-medium text-gray-900 dark:text-white">
                      2.1
                  </div>
              </div>
          </li><li class="pt-3 pb-0 sm:pt-4">
              <div class="flex items-center ">
                  
                  <div class="flex-1 min-w-0 ms-4">
                      <p class="text-sm font-medium text-gray-900 truncate dark:text-white">Van Nguyen</p>
                      
                  </div>
                  <div class="inline-flex items-center text-base font-medium text-gray-900 dark:text-white">
                      1.8
                  </div>
              </div>
          </li><li class="pt-3 pb-0 sm:pt-4">
              <div class="flex items-center ">
                  
                  <div class="flex-1 min-w-0 ms-4">
                      <p class="text-sm font-medium text-gray-900 truncate dark:text-white">Sarah Becnel</p>
                      
                  </div>
                  <div class="inline-flex items-center text-base font-medium text-gray-900 dark:text-white">
                      1.8
                  </div>
              </div>
          </li><li class="pt-3 pb-0 sm:pt-4">
              <div class="flex items-center ">
                  
                  <div class="flex-1 min-w-0 ms-4">
                      <p class="text-sm font-medium text-gray-900 truncate dark:text-white">Jesus Rodriguez</p>
                      
                  </div>
                  <div class="inline-flex items-center text-base font-medium text-gray-900 dark:text-white">1.5</div>
              </div>
          </li></ul>
 </div>
</div>
</div>
<div class="grid grid-cols-2 gap-4">


<div class="border-2 bg-white rounded-lg border-gray-300 dark:border-gray-600 h-48 md:h-72">


  <div class="mt-6 text-center">
  <a href="/events">
      <h5 class="mb-2 mx-auto text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Total Event Scans</h5>
  </a>
  <p class="mb-3 text-5xl font-bold text-gray-900 dark:text-gray-400">8.4k</p>
  <a href="/events" class="inline-flex items-center text-blue-600 hover:underline">View More<svg class="w-3 h-3 ms-2.5 rtl:rotate-[270deg]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11v4.833A1.166 1.166 0 0 1 13.833 17H2.167A1.167 1.167 0 0 1 1 15.833V4.167A1.166 1.166 0 0 1 2.167 3h4.618m4.447-2H17v5.768M9.111 8.889l7.778-7.778"></path>
      </svg>
  </a></div>
  
</div>
<div class="border-2 bg-white rounded-lg border-gray-300 dark:border-gray-600 h-48 md:h-72">


  <div class="mt-6 text-center">
  <a href="/users">
      <h5 class="mb-2 mx-auto text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Total Attendee Scans</h5>
  </a>
  <p class="mb-3 text-5xl font-bold text-gray-900 dark:text-gray-400">24k</p>
  <a href="/users" class="inline-flex items-center text-blue-600 hover:underline">View More<svg class="w-3 h-3 ms-2.5 rtl:rotate-[270deg]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 18 18">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11v4.833A1.166 1.166 0 0 1 13.833 17H2.167A1.167 1.167 0 0 1 1 15.833V4.167A1.166 1.166 0 0 1 2.167 3h4.618m4.447-2H17v5.768M9.111 8.889l7.778-7.778"></path>
      </svg>
  </a></div>
  
</div></div><br/>`

export default Dashboard;