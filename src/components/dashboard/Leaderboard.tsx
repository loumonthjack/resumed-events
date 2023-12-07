import React from "react";

import { faker } from "@faker-js/faker";
import { createId as cuid } from "@paralleldrive/cuid2";
import { Avatar } from "flowbite-react";

const data = [
    { id: cuid(), name: "Saran Glise", views: 52, scans: 64, profilePicture: genProfilePicUrl(), },
    { id: cuid(), name: "Flyn Wyant", views: 43, scans: 52, profilePicture: genProfilePicUrl(), },
    { id: cuid(), name: "Desmond Park", views: 23, scans: 23, profilePicture: genProfilePicUrl(), },
    { id: cuid(), name: "Kim Park", views: 23, scans: 14, profilePicture: genProfilePicUrl(), },
    { id: cuid(), name: "Reshad Waxis", views: 12, scans: 9, profilePicture: genProfilePicUrl(), },
    { id: cuid(), name: "Kevin Ball", views: 9, scans: 4, profilePicture: genProfilePicUrl(), },
]

export default function Leaderboard() {
    return (
        <table className="table-auto border-collapse text-sm w-full">
            <thead>
                <tr className="text-left text-neutral-400 capitalize h-16">
                    <th className="font-normal px-4">user</th>
                    <th className="font-normal px-4">views</th>
                    <th className="font-normal px-4">scans</th>
                </tr>
            </thead>
            <tbody>
                {
                    data.map((person) => {
                        return (
                            <tr key={person.id} className="border-t border-t-neutral-300">
                                {/* <div className="w-2" /> */}
                                <td className="p-4">
                                    <div className="flex gap-4 items-center">
                                        {/* <Avatar img={person.profilePicture} className="w-10 h-10 overflow-clip" /> */}
                                        <div className="w-8 h-8 rounded-full bg-neutral-400" />
                                        {person.name}
                                    </div>
                                </td>
                                {/* <div className="grow" /> */}
                                <td className="p-4">
                                    <span className="text-green-400 font-semibold">{person.views}</span>
                                </td>
                                <td className="p-4">
                                    <span className="text-green-400 font-semibold">{person.scans}</span>
                                </td>
                            </tr>
                        )
                    })
                }
            </tbody>
        </table>
    )
}

function genProfilePicUrl() {
    return `${faker.image.urlLoremFlickr({ category: 'people' })}`
}