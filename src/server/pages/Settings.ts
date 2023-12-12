const Settings = () => `<div class="border-2 border-gray-300 dark:border-gray-600 p-8 mb-4 w-full block bg-gray-50 rounded-lg dark:bg-gray-800">
        <form id="profileUpdateForm">
            <h3 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">My Profile</h3>
            <p class="font-normal text-gray-700 dark:text-gray-400">You can edit your profile
                information here.</p>
            <br />
            <div class="grid gap-4 mb-4 md:gap-6 md:grid-cols-2 sm:mb-8">
                <div class="sm:col-span-2">
                    <label class="block mb-2 text-md font-semibold text-gray-900 dark:text-white"
                        for="profilePicture">Upload Profile Picture</label>
                    <div class="items-center w-full sm:flex">
                        <img class="w-20 h-20 mb-4 rounded-full sm:mr-4 sm:mb-0"
                            src="https://s3.us-west-2.amazonaws.com/resumed.events.local/profile_pictures/default.png" alt="Loumonth Jack Profile Picture">
                        <div class="w-full">
                            <input
                                class="w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
                                aria-describedby="profilePicture_help" id="profilePicture" type="file">
                            <p class="mt-1 text-xs font-normal text-gray-500 dark:text-gray-300"
                                id="profilePicture_help">SVG, PNG, JPG or JPEG (MAX. 800x400px).</p>
                        </div>
                    </div>
                </div>
                <div>
                    <label for="firstName"
                        class="block mb-2 text-md font-semibold text-gray-900 dark:text-white">First
                        Name</label>
                    <input type="text" name="firstName" id="firstName"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                        placeholder="Loumonth">
                </div>
                <div>
                    <label for="lastName"
                        class="block mb-2 text-md font-semibold text-gray-900 dark:text-white">Last
                        Name</label>
                    <input type="text" name="lastName" id="lastName"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                        placeholder="Jack">
                </div>
                <div>
                    <label for="email"
                        class="block mb-2 text-md font-semibold text-gray-900 dark:text-white">Email</label>
                    <p>
                        loumonth.jack.jr@gmail.com
                    </p>
                </div>

                <div>
                    <label for="account"
                        class="inline-flex items-center mb-2 text-md font-semibold text-gray-900 dark:text-white">
                        Subscription
                        <button type="button" data-tooltip-target="tooltip-account"
                            data-tooltip-style="dark" class="ml-1">
                            <svg aria-hidden="true"
                                class="w-4 h-4 text-gray-400 hover:text-gray-900 dark:hover:text-white dark:text-gray-500"
                                fill="currentColor" viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd"
                                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                                    clip-rule="evenodd"></path>
                            </svg>
                            <span class="sr-only">Show information</span>
                        </button>
                        <div id="tooltip-account" role="tooltip"
                            class="absolute z-10 invisible inline-block max-w-sm px-3 py-2 text-xs font-normal text-white bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                            Your current subscription type.
                            <div class="tooltip-arrow" data-popper-arrow></div>
                        </div>
                    </label>
                    <!-- read only text -->
                    <h2 class="text-sm font-medium text-gray-900 dark:text-white">
                        Yearly - Unlimited
                        Plan</h2>
                </div>


            </div>

            <div class="flex items-center space-x-4">
                <button type="submit"
                    class="text-white bg-blue-700 hover:bg-dark-900 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">
                    Update
                </button>

            </div>
        </form>
    </div>
    <div class="border-2 border-gray-300 dark:border-gray-600 p-8 mb-4 w-full block bg-gray-50 rounded-lg dark:bg-gray-800">
        <h3 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Alerts</h3>
        <p class="font-normal text-gray-700 dark:text-gray-400">You can pick which notifications you
            want</p>
        <form id="alertForm">
            <label class="flex items-center py-4 gap-4 cursor-pointer border-b border-gray-400">
                <div class="flex-1">
                    <h3 class="text-xl font-semibold text-gray-90 dark:text-white">Event Start</h3>
                    <p class="text-gray-500 font-medium">Send an e-mail to all users when the event
                        starts</p>
                </div>
                <div class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="eventStart" id="eventStart" value="eventStart"
                        class="sr-only peer">
                    <div
                        class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600">
                    </div>
                </div>
            </label>

            <label class="flex items-center py-4 gap-4 cursor-pointer border-b border-gray-400">
                <div class="flex-1">
                    <h3 class="text-xl font-semibold text-gray-90 dark:text-white">Event Post Report
                    </h3>
                    <p class="text-gray-500 font-medium">Recieve an e-mail with a report after the event
                    </p>
                </div>
                <div class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="eventReport" id="eventReport" value="eventReport"
                        class="sr-only peer">
                    <div
                        class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600">
                    </div>
                </div>
            </label>

            <label class="flex items-center py-4 gap-4 cursor-pointer">
                <div class="flex-1">
                    <h3 class="text-xl font-semibold text-gray-90 dark:text-white">Product Updates</h3>
                    <p class="text-gray-500 font-medium">Get notified when there are updates to resumed
                    </p>
                </div>
                <div class="relative inline-flex items-center cursor-pointer">
                    
                    <input type="checkbox" name="productUpdate" id="productUpdate" value="productUpdate"
                        class="sr-only peer">
                    <div
                        class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600">
                    </div>
                </div>
            </label>
            <div class="flex items-center space-x-4">
                <button type="submit"
                    class="text-white bg-blue-700 hover:bg-dark-900 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800">
                    Update
                </button>

            </div>
        </form>
    </div>
    `

export default Settings;