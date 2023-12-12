import axios from 'axios';

const serverUrl = "http://localhost:4000"

const getRoles = async () => {
  const options = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    withCredentials: true,
  };
  const response = await axios.get(`${serverUrl}/operation/getRoles`, options);
  console.log(response.data);
  return response.data;
};

const currentRole = async () => {
  const options = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    withCredentials: true,
  };
  const response = await axios.post(`${serverUrl}/operation/currentRole`, options);
  console.log(response.data);
  return response.data;
}
const changeRole = async (userRoleId: string) => {
  const options = {
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    withCredentials: true,
  };
  const response = await axios.post(`${serverUrl}/operation/switchRole`, { userRoleId }, options);
  console.log(response.data);
  return response.data;
}

export const roleSwitcher = async () => {
  const roles = await getRoles();
  const current = await currentRole();
  if (current) {
    const roleButton = document.getElementById("currentRoleButton");
    if (roleButton)
      roleButton.innerHTML = `<button type="button" id="roleDropdownButton" data-dropdown-toggle="roleDropdown" class="hidden items-center font-medium p-2 pr-3 pl-4 text-gray-500 rounded-lg md:inline-flex hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600">${current.name}    
        <svg class="ml-1.5 w-2.5 h-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/></svg>
      </button>`;
  }
  if (roles) {
    const roleSwitcher = document.getElementById("roleDropdown");
    if (roleSwitcher) {
      roleSwitcher.innerHTML = "";
      const select = document.createElement("select");
      select.classList.add("form-select", "block", "w-full", "py-2", "px-3", "border", "border-gray-300", "bg-white", "rounded-md", "shadow-sm", "focus:outline-none", "focus:ring-primary-500", "focus:border-primary-500", "sm:text-sm");
      select.setAttribute("aria-label", "Role");
      select.setAttribute("id", "roleSelect");
      select.setAttribute("name", "role");
      select.setAttribute("onchange", "changeRole(this.value)");
      roles.forEach((role: { id: string, name: string }) => {
        const option = document.createElement("option");
        option.setAttribute("value", role.id);
        option.innerText = role.name;
        if (role.id === current.id) {
          option.setAttribute("selected", "selected");
        }
        select.appendChild(option);
      });
      roleSwitcher.appendChild(select);
    }
  }
};

const Navbar = (user: {
  name: string,
  email: string,
  profilePicture: string,
}, general: {
  companyLogo: string,
  url: string,
}, name: string) => {
  return `
  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
<script>
    const capitalizeName = (name) => {
        const parts = name.split(' ');
        return parts.map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
    };
    const changeRole = async (userRoleId) => {
        const options = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            withCredentials: true,
        };
        try {
            const response = await axios.post("http://localhost:4000/operation/switchRole", { userRoleId }, options);
            // refresh page
            window.location.reload();
            return response.data;
        } catch (error) {
            console.error(error);
            // Handle error appropriately
        }
    }
    let currentRoleId = null;
    const currentRole = async () => {
        const options = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            withCredentials: true,
        };
        try {
            const response = await axios.get("http://localhost:4000/operation/currentRole", options);
            currentRoleId = response.data.userRole.id;
            if (response.data.userRole.Role.name !== "Administrator") {
              // hide billing 
              document.getElementById("billing-select").style.display = "none";
            }

            return response.data;
        } catch (error) {
            console.error(error);
            // Handle error appropriately
        }
    }

    const getRoles = async () => {
        const options = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            withCredentials: true,
        };
        try {
            const response = await axios.get("http://localhost:4000/operation/getRoles", options);
            const responseWithoutCurrent = response.data.roles.filter((role) => role.id !== currentRoleId);
            return {
                roles: responseWithoutCurrent,
            }
        } catch (error) {
            console.error(error);
            // Handle error appropriately
        }
    }
    let currentRoleName = null;
    currentRole().then((current) => {
        currentRoleName = current.userRole.Role.name;
        const roleButton = document.getElementById("currentRoleButton");
        roleButton.innerHTML = \`<button type="button" id="roleDropdownButton" data-dropdown-toggle="roleDropdown" class="hidden items-center font-medium p-2 pr-3 pl-4 text-gray-500 rounded-lg md:inline-flex hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600">\${current.userRole.Role.name}
            <svg class="ml-1.5 w-2.5 h-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4" /></svg>
        </button>\`;
    });
    getRoles().then((role) => {
      if (role.roles.length === 0) {
        document.getElementById("currentRoleButton").innerHTML = \`<h3 class="text-gray-500 font-semibold p-2"> \${currentRoleName} </h3>\`;
        return document.getElementById("roleDropdown").innerHTML = "";
      }
      const listItem = role.roles.map((userRole, index) => {
          const radioId = \`helper-radio-\${index}\`;
          return \`<li>
              <div class="flex p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-600">
                  <div class="flex items-center h-5">
                      <input id="\${radioId}" name="helper-radio" type="radio" value="\${userRole.id}" class="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500" onclick="changeRole('\${userRole.id}')"/>
                  </div>
                  <div class="ml-2 text-sm">
                      <label for="\${radioId}" class="font-medium text-gray-900 dark:text-gray-300">
                          <div>\${capitalizeName(userRole.Role.name.toLowerCase())}</div>
                          <p class="text-xs font-normal text-gray-500 dark:text-gray-300">\${capitalizeName(userRole.Account.companyName.toLowerCase())}</p>
                      </label>
                  </div>
              </div>
          </li>\`;
      }).join('');
      document.getElementById("roleListList").innerHTML = listItem;
    });
</script>        
  <nav class="bg-gray-900 border-b border-gray-200 px-4 py-2.5 dark:bg-gray-800 dark:border-gray-700 fixed left-0 right-0 top-0 z-50">
    <div class="flex flex-wrap justify-between items-center">
      <div class="flex justify-start items-center">
        
        <a href=${general.url} class="flex items-center justify-between mr-4">
          <img
            src="${general.companyLogo}"
            class="mr-3 h-10"
            alt="Resumed Events Logo"
          />
        </a>
        <form action="/operation/searchEvents" method="POST" class="hidden md:block md:pl-2">
          <label for="topbar-search" class="sr-only">Search</label>
          <div class="relative md:w-64 md:w-96">
            <div
              class="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none"
            >
              <svg
                class="w-5 h-5 text-gray-500 dark:text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                ></path>
              </svg>
            </div>
            <input
              type="text"
              name="search"
              id="topbar-search"
              class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              placeholder="Search"
            />
          </div>
        </form>
      </div>
      <div class="flex items-center lg:order-2">
        <button
          type="button"
          data-drawer-toggle="drawer-navigation"
          aria-controls="drawer-navigation"
          class="p-2 mr-1 text-gray-500 rounded-lg md:hidden hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
        >
          <span class="sr-only">Toggle search</span>
          <svg aria-hidden="true" class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path clip-rule="evenodd" fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"></path>
          </svg>
          
        </button>
        
        <!-- Apps -->
        <button type="button" data-dropdown-toggle="apps-dropdown" class="p-2 text-gray-500 rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600">
            <span class="sr-only">View notifications</span>
            <!-- Icon -->
            <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 18">
              <path d="M6.143 0H1.857A1.857 1.857 0 0 0 0 1.857v4.286C0 7.169.831 8 1.857 8h4.286A1.857 1.857 0 0 0 8 6.143V1.857A1.857 1.857 0 0 0 6.143 0Zm10 0h-4.286A1.857 1.857 0 0 0 10 1.857v4.286C10 7.169 10.831 8 11.857 8h4.286A1.857 1.857 0 0 0 18 6.143V1.857A1.857 1.857 0 0 0 16.143 0Zm-10 10H1.857A1.857 1.857 0 0 0 0 11.857v4.286C0 17.169.831 18 1.857 18h4.286A1.857 1.857 0 0 0 8 16.143v-4.286A1.857 1.857 0 0 0 6.143 10Zm10 0h-4.286A1.857 1.857 0 0 0 10 11.857v4.286c0 1.026.831 1.857 1.857 1.857h4.286A1.857 1.857 0 0 0 18 16.143v-4.286A1.857 1.857 0 0 0 16.143 10Z"/>
            </svg>              
          </button>
        <!-- Dropdown menu -->
        <div class="hidden overflow-hidden z-50 my-4 max-w-sm text-base list-none bg-gray-100 rounded divide-y divide-gray-100 shadow-lg dark:bg-gray-700 dark:divide-gray-600 block" id="apps-dropdown" style="position: absolute; inset: 0px auto auto 0px; margin: 0px; transform: translate3d(752px, 57px, 0px);" data-popper-placement="bottom">
            <div class="block py-2 px-4 text-base font-medium text-center text-white bg-gray-700 dark:bg-gray-700 dark:text-gray-400">
                Pages
            </div>
            <div class="grid grid-cols-3 gap-4 p-4">
            
            <a href="/another-dashboard" class="block p-4 text-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 group">
              <svg class="mx-auto mb-2 w-5 h-5 text-gray-900 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 16"><path d="M19 0H1a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V1a1 1 0 0 0-1-1ZM2 6v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6H2Zm11 3a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V8a1 1 0 0 1 2 0h2a1 1 0 0 1 2 0v1Z"></path></svg>
              <div class="text-sm font-medium text-gray-900 dark:text-white">Home</div>
            </a>
            <a href="/events" class="block p-4 text-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 group">
                <svg class="mx-auto mb-2 w-5 h-5 text-gray-900 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 18 20"><path d="M17 5.923A1 1 0 0 0 16 5h-3V4a4 4 0 1 0-8 0v1H2a1 1 0 0 0-1 .923L.086 17.846A2 2 0 0 0 2.08 20h13.84a2 2 0 0 0 1.994-2.153L17 5.923ZM7 9a1 1 0 0 1-2 0V7h2v2Zm0-5a2 2 0 1 1 4 0v1H7V4Zm6 5a1 1 0 1 1-2 0V7h2v2Z"></path></svg>
                <div class="text-sm font-medium text-gray-900 dark:text-white">Events</div>
            </a>
            <a href="/users" class="block p-4 text-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 group">
                <svg class="mx-auto mb-2 w-5 h-5 text-gray-900 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 19"><path d="M14.5 0A3.987 3.987 0 0 0 11 2.1a4.977 4.977 0 0 1 3.9 5.858A3.989 3.989 0 0 0 14.5 0ZM9 13h2a4 4 0 0 1 4 4v2H5v-2a4 4 0 0 1 4-4Z"></path><path d="M5 19h10v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2ZM5 7a5.008 5.008 0 0 1 4-4.9 3.988 3.988 0 1 0-3.9 5.859A4.974 4.974 0 0 1 5 7Zm5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm5-1h-.424a5.016 5.016 0 0 1-1.942 2.232A6.007 6.007 0 0 1 17 17h2a1 1 0 0 0 1-1v-2a5.006 5.006 0 0 0-5-5ZM5.424 9H5a5.006 5.006 0 0 0-5 5v2a1 1 0 0 0 1 1h2a6.007 6.007 0 0 1 4.366-5.768A5.016 5.016 0 0 1 5.424 9Z"></path></svg>
                <div class="text-sm font-medium text-gray-900 dark:text-white">Users</div>
            </a>
    
            <a href="/settings" class="block p-4 text-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 group">
                <svg class="mx-auto mb-2 w-5 h-5 text-gray-900 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M18 7.5h-.423l-.452-1.09.3-.3a1.5 1.5 0 0 0 0-2.121L16.01 2.575a1.5 1.5 0 0 0-2.121 0l-.3.3-1.089-.452V2A1.5 1.5 0 0 0 11 .5H9A1.5 1.5 0 0 0 7.5 2v.423l-1.09.452-.3-.3a1.5 1.5 0 0 0-2.121 0L2.576 3.99a1.5 1.5 0 0 0 0 2.121l.3.3L2.423 7.5H2A1.5 1.5 0 0 0 .5 9v2A1.5 1.5 0 0 0 2 12.5h.423l.452 1.09-.3.3a1.5 1.5 0 0 0 0 2.121l1.415 1.413a1.5 1.5 0 0 0 2.121 0l.3-.3 1.09.452V18A1.5 1.5 0 0 0 9 19.5h2a1.5 1.5 0 0 0 1.5-1.5v-.423l1.09-.452.3.3a1.5 1.5 0 0 0 2.121 0l1.415-1.414a1.5 1.5 0 0 0 0-2.121l-.3-.3.452-1.09H18a1.5 1.5 0 0 0 1.5-1.5V9A1.5 1.5 0 0 0 18 7.5Zm-8 6a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z"></path></svg>
                <div class="text-sm font-medium text-gray-900 dark:text-white">Settings</div>
            </a>
           
            <a href="/billing" id="billing-select" class="block p-4 text-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 group">
                <svg class="mx-auto mb-2 w-5 h-5 text-gray-900 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 20"><path d="M7 11H5v1h2v-1Zm4 3H9v1h2v-1Zm-4 0H5v1h2v-1ZM5 5V.13a2.98 2.98 0 0 0-1.293.749L.88 3.707A2.98 2.98 0 0 0 .13 5H5Z"></path><path d="M14.066 0H7v5a2 2 0 0 1-2 2H0v11a1.97 1.97 0 0 0 1.934 2h12.132A1.97 1.97 0 0 0 16 18V2a1.97 1.97 0 0 0-1.934-2ZM13 16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v6Zm-1-8H9a1 1 0 0 1 0-2h3a1 1 0 1 1 0 2Zm0-3H9a1 1 0 0 1 0-2h3a1 1 0 1 1 0 2Z"></path><path d="M11 11H9v1h2v-1Z"></path></svg>    
                <div class="text-sm font-medium text-gray-900 dark:text-white">Billing</div>
            </a>
            <a href="/logout" class="block p-4 text-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 group">
                <svg class="mx-auto mb-2 w-5 h-5 text-gray-900 group-hover:text-gray-500 dark:text-gray-400 dark:group-hover:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 16 16"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h11m0 0-4-4m4 4-4 4m-5 3H3a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h3"></path></svg>
                <div class="text-sm font-medium text-gray-900 dark:text-white">Logout</div>
            </a>
            </div>
        </div>
        <div id="currentRoleButton"></div>
        <div id="roleDropdown" class="hidden z-30 w-60 bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-700 dark:divide-gray-600">
            <ul id="roleListList" class="p-3 space-y-1 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="regionDropdownButton">
                <!-- Role list will be populated here -->
            </ul>
        </div>
        
        <button
          type="button"
          class="flex mx-3 text-sm bg-gray-800 rounded-full md:mr-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
          id="user-menu-button"
          aria-expanded="false"
          data-dropdown-toggle="dropdown"
        >
          <span class="sr-only">Open user menu</span>
          <img
            class="w-8 h-8 rounded-full"
            src="${user.profilePicture}"
            alt="${user.name} photo"
          />
        </button>
        <!-- Dropdown menu -->
        <div
          class="hidden z-50 my-4 w-56 text-base list-none bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-700 dark:divide-gray-600 rounded-xl"
          id="dropdown"
        >
          <div class="py-3 px-4">
            <span
              class="block text-sm font-semibold text-gray-900 dark:text-white"
              >${user.name}</span
            >
            <span
              class="block text-sm text-gray-900 truncate dark:text-white"
              >${user.email}</span
            >
          </div>
          <ul
            class="py-1 text-gray-700 dark:text-gray-300"
            aria-labelledby="dropdown"
          >
          ${name === "Dashboard" ? '' : `<li>
          <a
            href="/another-dashboard"
            class="block py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-white"
            >Dashboard</a
          >
        </li>` }
            <li>
              <a
                href="/settings"
                class="block py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-400 dark:hover:text-white"
                >Account settings</a
              >
            </li>
          </ul>
          
          <ul
            class="py-1 text-gray-700 dark:text-gray-300"
            aria-labelledby="dropdown"
          >
            <li>
              <a
                href="/logout"
                class="block py-2 px-4 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                >Sign out</a
              >
            </li>
          </ul>
        </div>
      </div>
    </div>
  </nav>
  <div class="h-16 bg-gray-900"></div>
  `
}

const NavbarComponent = (name: string) => Navbar({
  name: "Loumonth Jack Jr",
  email: "loumonth.jack.jr@gmail.com",
  profilePicture: "https://s3.us-west-2.amazonaws.com/resumed.events.local/profile_pictures/default.png"
}, {
  companyLogo: 'https://s3.us-west-2.amazonaws.com/resumed.events.local/logos/company.png',
  url: 'https://resumed.events',
}, name);

export default NavbarComponent;