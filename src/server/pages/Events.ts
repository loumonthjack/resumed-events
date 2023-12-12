
const Table = (type: "events_upcoming" | "events_archived") => {
    return type === "events_upcoming" ? `<table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
  <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
      <tr>
          
          <th scope="col" class="px-6 py-3">
              Name
          </th>
          <th scope="col" class="px-6 py-3">
              Status
          </th>
          <th scope="col" class="px-6 py-3">
              Date/Time
          </th>
          <th scope="col" class="px-6 py-3">
              Attendees
          </th>
          <th scope="col" class="px-6 py-3">
              Action
          </th>
      </tr>
  </thead>
  <tbody>
      <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
          
          <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
              Winter Summit 2023"
          </th>
          <td class="px-6 py-4">
              Pending
          </td>
          <td class="px-6 py-4">
          Dec, 14 2023 / 6:00 PM
          </td>
          <td class="px-6 py-4">
              367
          </td>
          <td class="px-6 py-4">
              <a href="#" class="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit</a>
          </td>
      </tr>
      <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
          
          <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
              California Sponsorship Conference
          </th>
          <td class="px-6 py-4">
              Pending
          </td>
          <td class="px-6 py-4">
              Dec, 7 2023 / 6:00 PM
          </td>
          <td class="px-6 py-4">
              681
          </td>
          <td class="px-6 py-4">
              <a href="#" class="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit</a>
          </td>
      </tr>
      <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
          
          <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
              Sales Summer Summit
          </th>
          <td class="px-6 py-4">
              Active
          </td>
          <td class="px-6 py-4">
              Nov, 27 2023 / 6:00 PM
          </td>
          <td class="px-6 py-4">
              43
          </td>
          <td class="px-6 py-4">
              <a href="#" class="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit</a>
          </td>
      </tr>
  </tbody>
  </table>
  <div class="flex flex-col items-center bg-gray-50 mb-4 mt-4">
    <!-- Help text -->
    <span class="text-sm text-gray-700 dark:text-gray-400">
        Showing <span class="font-semibold text-gray-900 dark:text-white">1</span> to <span class="font-semibold text-gray-900 dark:text-white">3</span> of <span class="font-semibold text-gray-900 dark:text-white">3</span> Entries
    </span>
    <div class="inline-flex mt-2 xs:mt-0">
      <!-- Buttons -->
      <button class="flex items-center justify-center px-3 h-8 text-sm font-medium text-white bg-gray-800 rounded-s hover:bg-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
          <svg class="w-3.5 h-3.5 me-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5H1m0 0 4 4M1 5l4-4"></path>
          </svg>
          Prev
      </button>
      <button class="flex items-center justify-center px-3 h-8 text-sm font-medium text-white bg-gray-800 border-0 border-s border-gray-700 rounded-e hover:bg-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
          Next
          <svg class="w-3.5 h-3.5 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9"></path>
        </svg>
      </button>
    </div>
  </div>` : `<table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
  <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
      <tr>
          
          <th scope="col" class="px-6 py-3">
              Name
          </th>
          <th scope="col" class="px-6 py-3">
              Status
          </th>
          <th scope="col" class="px-6 py-3">
              Date/Time
          </th>
          <th scope="col" class="px-6 py-3">
              Attendees
          </th>
          <th scope="col" class="px-6 py-3">
              Action
          </th>
      </tr>
  </thead>
  <tbody>
      <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
          
          <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
              5th Annual Cancer Awareness Fundraiser
          </th>
          <td class="px-6 py-4">
              Completed
          </td>
          <td class="px-6 py-4">
              July, 26 2023 / 6:00 PM
          </td>
          <td class="px-6 py-4">
              264
          </td>
          <td class="px-6 py-4">
              <a href="#" class="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit</a>
          </td>
      </tr>
      <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
          
          <th scope="row" class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
              Internal Planning Conference
          </th>
          <td class="px-6 py-4">
              Completed
          </td>
          <td class="px-6 py-4">
              Feb, 3 2023 / 6:00 PM
          </td>
          <td class="px-6 py-4">
              32
          </td>
          <td class="px-6 py-4">
              <a href="#" class="font-medium text-blue-600 dark:text-blue-500 hover:underline">Edit</a>
          </td>
      </tr>
  </tbody>
  </table>
  <div class="flex flex-col items-center mt-4 mb-4">
    <!-- Help text -->
    <span class="text-sm text-gray-700 dark:text-gray-400">
        Showing <span class="font-semibold text-gray-900 dark:text-white">1</span> to <span class="font-semibold text-gray-900 dark:text-white">2</span> of <span class="font-semibold text-gray-900 dark:text-white">2</span> Entries
    </span>
    <div class="inline-flex mt-2 xs:mt-0">
      <!-- Buttons -->
      <button class="flex items-center justify-center px-3 h-8 text-sm font-medium text-white bg-gray-800 rounded-s hover:bg-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
          <svg class="w-3.5 h-3.5 me-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5H1m0 0 4 4M1 5l4-4"></path>
          </svg>
          Prev
      </button>
      <button class="flex items-center justify-center px-3 h-8 text-sm font-medium text-white bg-gray-800 border-0 border-s border-gray-700 rounded-e hover:bg-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
          Next
          <svg class="w-3.5 h-3.5 ms-2 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 5h12m0 0L9 1m4 4L9 9"></path>
        </svg>
      </button>
    </div>
  </div>` };
  
const Events = (type: string) => `
<ul class="flex flex-wrap text-sm font-medium text-center text-white border-b border-gray-200 dark:border-gray-700 dark:text-gray-400">
    <li class="me-2">
        <a href="/events?type=upcoming" aria-current="page" class="inline-block p-4 ${type == "upcoming" && "text-blue-600 bg-gray-100 rounded-t-lg active"}  dark:bg-gray-800 dark:text-blue-500">Upcoming</a>
    </li>
    <li class="me-2">
        <a href="/events?type=archived" class="inline-block p-4 ${type == "archived" && "text-blue-600 bg-gray-100 rounded-t-lg active"} hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 dark:hover:text-gray-300">Archived</a>
    </li>
    
    
</ul>


<div class="relative overflow-x-auto shadow-md bg-gray-50">

    ${type == "archived" ? Table("events_archived") : Table("events_upcoming")}    
</div>`

export default Events;