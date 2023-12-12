import React from "react";

import { Avatar, Dropdown, Navbar } from 'flowbite-react';

import Query from "../../queries";
import { FULL_SERVER_URL } from "../../env/client";

function Navigation() {
  const userQuery = Query.getUser()

  return (
    <Navbar fluid rounded>
      <Navbar.Brand>
        <img src="/favicon.svg" className="mr-3 h-6 sm:h-9" alt="Resumed Logo" />
        {/* <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">Flowbite React</span> */}
      </Navbar.Brand>
      <div className="flex md:order-2">
        <Dropdown
          arrowIcon={true}
          inline
          label={
            <Avatar alt="User settings" img={userQuery.data?.profilePicture || ""} rounded />
          }
        >
          <Dropdown.Header>
            <span className="block text-sm">Bonnie Green</span>
            <span className="block truncate text-sm font-medium">name@flowbite.com</span>
          </Dropdown.Header>
          <Dropdown.Item>Settings</Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item>Sign out</Dropdown.Item>
        </Dropdown>
        <Navbar.Toggle />
      </div>
    </Navbar>
  );
}

export default Navigation;
