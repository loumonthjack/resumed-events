import React from "react";

import Navigation from "./Nav";
import Sidebar from "./Sidebar";

export default function Layout(props: { children: React.ReactNode }) {
    return (
        <div className="h-screen flex">
            <Sidebar />
            <div className="grow">
                <Navigation />
                <div className="p-4 bg-neutral-100">
                    {props.children}
                </div>
            </div>
        </div>
    )
}