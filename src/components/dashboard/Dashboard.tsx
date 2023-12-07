import React from "react";

import Layout from "./Layout";
import { QueryClientProvider } from "@tanstack/react-query";
import { Route, Router } from "wouter";

import Query from "../../queries";
import Leaderboard from "./leaderboard";

export default function Dashboard() {
    return (

        <QueryClientProvider client={Query.client}>
            <Router base="/dashboard">
                <Layout>
                    <Route path="/">
                        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))] [grid-auto-rows:minmax(8rem,auto)]">
                            <Card title="rsvp" />
                            <Card title="guests" />
                            <Card title="social score" />
                            <div className="[grid-column:span_2] [grid-row:span_2]">
                                <Card title="connection graph" />
                            </div>
                            <div className="[grid-column:1/-1]">
                                <Card title="leaderboards">
                                    <Leaderboard />
                                </Card>
                            </div>
                            <div className="[grid-column:1/-1]">
                                <Card title="activity" />
                            </div>
                        </div>
                    </Route>
                    {/* <Route>
                        <span className="text-3xl">Not Found</span>
                    </Route> */}
                </Layout>
            </Router>
        </QueryClientProvider>
    )
}

function Card(props: { title: string, children?: React.ReactNode }) {
    return (
        <div className="min-h-[128px] h-full w-full grow bg-neutral-200 rounded p-4">
            <p className="text-xl capitalize font-semibold tracking-tight text-neutral-900">{props.title}</p>
            <div className="h-4"/>
            <div className="">
                {props.children}
            </div>
        </div>
    )
}
