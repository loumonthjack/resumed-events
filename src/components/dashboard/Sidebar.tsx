import React from "react";

import { Sidebar } from 'flowbite-react';
import { BiBuoy } from 'react-icons/bi';
import { HiArrowSmRight, HiChartPie, HiInbox, HiShoppingBag, HiTable, HiUser, HiViewBoards } from 'react-icons/hi';

import { Link } from "wouter";

function DashboardSidebar() {
    return (
        <Sidebar aria-label="Dashboard Sidebar Menu">
            <Sidebar.Items>
                <Sidebar.ItemGroup>
                    <Link href="/">
                        <Sidebar.Item icon={HiChartPie}>
                            Dashboard
                        </Sidebar.Item>
                    </Link>
                    <Link href="/events">
                        <Sidebar.Item icon={HiViewBoards}>
                            Events
                        </Sidebar.Item>
                    </Link>
                    <Link href="/">
                        <Sidebar.Item icon={HiInbox}>
                            Organization
                        </Sidebar.Item>
                    </Link>
                </Sidebar.ItemGroup>
                <Sidebar.ItemGroup>
                    <Link href="/">
                        <Sidebar.Item icon={HiChartPie}>
                            Upgrade to Pro
                        </Sidebar.Item>
                    </Link>
                    <Link href="/">
                        <Sidebar.Item icon={HiViewBoards}>
                            API & Documentation
                        </Sidebar.Item>
                    </Link>
                    <Link href="/">
                        <Sidebar.Item icon={BiBuoy}>
                            Settings
                        </Sidebar.Item>
                    </Link>
                </Sidebar.ItemGroup>
            </Sidebar.Items>
        </Sidebar>
    );
}


export default DashboardSidebar;